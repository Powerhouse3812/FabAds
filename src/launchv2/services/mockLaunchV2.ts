/**
 * mockLaunchV2 — design-phase launch engine for Launch v2. Same reliability
 * spine as launch2 (idempotent N=N, throttled batches, ~6% realistic partial
 * failures, retry-failed-only) adapted to the PlanV2 spread + page-distribution
 * model. Swap for the real Graph API behind this interface later.
 */
import {
  MAX_ADS_PER_PAGE,
  type AdUnitV2,
  type FailureReason,
  type LaunchRunV2,
  type PlanV2,
  type TargetPair,
} from "../types";
import { adsPerDestination, budgetPerDay } from "../deriveV2";
import { pageActiveAds } from "../data";

const FAIL_PCT = 6;
const RETRY_PERSIST_PCT = 25;
const BATCH = 5;
const TICK_MS = 750;

function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
const RETRYABLE: FailureReason[] = [
  { code: "RATE_LIMITED", message: "Throttled by Meta — rate limited", retryable: true },
  { code: "TRANSIENT", message: "Temporary API error", retryable: true },
];
const NON_RETRYABLE: FailureReason[] = [
  { code: "POLICY_REVIEW", message: "Creative held for policy review", retryable: false },
  { code: "PAGE_CAP", message: "Destination Page at the 250-ad cap", retryable: false },
];
function pickFailure(seed: string): FailureReason {
  const h = hash(seed + ":r");
  return h % 100 < 65 ? RETRYABLE[h % RETRYABLE.length] : NON_RETRYABLE[h % NON_RETRYABLE.length];
}

/** Resolve a naming pattern for a unit. */
function resolveName(plan: PlanV2, ctx: { brand: string; adset: string; n: number }): string {
  const map: Record<string, string> = {
    "{brand}": ctx.brand,
    "{intent}": plan.intent,
    "{objective}": (plan.objective ?? "").replace("OUTCOME_", "").toLowerCase(),
    "{date}": (plan.createdAt || new Date().toISOString()).slice(0, 10),
    "{adset}": ctx.adset,
    "{n}": String(ctx.n),
  };
  let out = plan.namingPattern || "{brand}_{intent}_{date}";
  for (const [k, v] of Object.entries(map)) out = out.split(k).join(v);
  return out.replace(/_{2,}/g, "_").replace(/^_+|_+$/g, "") || "Launch";
}

function buildUnitsV2(plan: PlanV2): AdUnitV2[] {
  if (plan.targets.length === 0) return [];
  const creatives = plan.creatives.length ? plan.creatives : [{ id: "default", name: "Creative", format: plan.format ?? "single_image", source: "library" as const }];
  const perDest = adsPerDestination(plan);
  const objLabel = (plan.objective ?? "").replace("OUTCOME_", "");

  // per-target counts (page distribution)
  const n = plan.targets.length;
  const caps = plan.targets.map((t) => Math.max(0, MAX_ADS_PER_PAGE - pageActiveAds(t.fbPageId)));
  const counts: number[] = (() => {
    if (plan.pageDistribution === "duplicate") return plan.targets.map(() => perDest);
    if (plan.pageDistribution === "equal") {
      const q = Math.floor(perDest / n), r = perDest % n;
      return plan.targets.map((_, i) => q + (i < r ? 1 : 0));
    }
    let left = perDest;
    const out = plan.targets.map(() => 0);
    for (let i = 0; i < n && left > 0; i++) { const take = Math.min(caps[i], left); out[i] = take; left -= take; }
    if (left > 0) out[n - 1] += left;
    return out;
  })();

  const units: AdUnitV2[] = [];
  plan.targets.forEach((target: TargetPair, ti) => {
    const brand = target.accountName.split("—")[0].trim();
    for (let i = 0; i < counts[ti]; i++) {
      const idx = units.length;
      const adSetIdx = (i % Math.max(plan.structure.adSetsPerCampaign, 1)) + 1;
      const creative = creatives[idx % creatives.length];
      const adSetName = `Ad set ${String(adSetIdx).padStart(2, "0")}`;
      units.push({
        id: `${plan.id}:${idx}`,
        name: resolveName(plan, { brand, adset: String(adSetIdx).padStart(2, "0"), n: idx + 1 }),
        campaignName: `${objLabel} · C1`,
        adSetName,
        creativeName: creative.name,
        target,
        status: "pending",
      });
    }
  });
  return units;
}

function reconcile(run: LaunchRunV2) {
  run.created = run.units.filter((u) => u.status === "created").length;
  run.failed = run.units.filter((u) => u.status === "failed").length;
  run.pending = run.units.filter((u) => u.status === "pending" || u.status === "creating").length;
}

export type LaunchV2Event = { type: "run-updated"; run: LaunchRunV2 } | { type: "runs-updated" };
type Listener = (e: LaunchV2Event) => void;

class MockLaunchV2 {
  private runs = new Map<string, LaunchRunV2>();
  private byPlan = new Map<string, string>();
  private attempt = new Map<string, number>();
  private listeners = new Set<Listener>();
  private timer: ReturnType<typeof setInterval> | null = null;

  subscribe(l: Listener) { this.listeners.add(l); return () => this.listeners.delete(l); }
  private emit(e: LaunchV2Event) { this.listeners.forEach((l) => l(e)); }

  listRuns(): LaunchRunV2[] {
    return [...this.runs.values()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  getRun(id?: string) { return id ? this.runs.get(id) : undefined; }

  launch(plan: PlanV2): LaunchRunV2 {
    const existing = this.byPlan.get(plan.id);
    if (existing) return this.runs.get(existing)!;
    const units = buildUnitsV2(plan);
    const scheduled = !!plan.scheduledFor && new Date(plan.scheduledFor).getTime() > Date.now();
    const run: LaunchRunV2 = {
      id: `runv2_${plan.id}`,
      planId: plan.id,
      name: plan.name,
      status: scheduled ? "scheduled" : "launching",
      requested: units.length,
      created: 0,
      failed: 0,
      pending: units.length,
      units,
      budgetPerDay: budgetPerDay(plan),
      currency: plan.targets[0]?.currency ?? "USD",
      retryCount: 0,
      createdAt: new Date().toISOString(),
      scheduledFor: plan.scheduledFor ?? undefined,
    };
    reconcile(run);
    this.runs.set(run.id, run);
    this.byPlan.set(plan.id, run.id);
    this.emit({ type: "runs-updated" });
    this.emit({ type: "run-updated", run });
    if (!scheduled) this.ensureTimer();
    return run;
  }

  retryFailed(runId: string): LaunchRunV2 | undefined {
    const run = this.runs.get(runId);
    if (!run) return undefined;
    const failed = run.units.filter((u) => u.status === "failed");
    if (!failed.length) return run;
    run.retryCount += 1;
    failed.forEach((u) => { u.status = "pending"; this.attempt.set(u.id, (this.attempt.get(u.id) ?? 0) + 1); });
    run.status = "launching";
    reconcile(run);
    this.emit({ type: "run-updated", run });
    this.ensureTimer();
    return run;
  }

  private resolve(u: AdUnitV2) {
    const a = this.attempt.get(u.id) ?? 0;
    if (a === 0) {
      if (hash(u.id) % 100 < FAIL_PCT) { u.status = "failed"; u.failure = pickFailure(u.id); }
      else { u.status = "created"; u.failure = undefined; }
    } else {
      if (u.failure && !u.failure.retryable) u.status = "failed";
      else if (hash(`${u.id}:r${a}`) % 100 < RETRY_PERSIST_PCT) u.status = "failed";
      else { u.status = "created"; u.failure = undefined; }
    }
  }

  private tick = () => {
    let any = false;
    this.runs.forEach((run) => {
      if (run.status !== "launching") return;
      const pending = run.units.filter((u) => u.status === "pending" || u.status === "creating");
      if (!pending.length) {
        run.status = run.units.some((u) => u.status === "failed")
          ? (run.units.every((u) => u.status === "failed") ? "failed" : "partial")
          : "completed";
        reconcile(run);
        this.emit({ type: "run-updated", run });
        this.emit({ type: "runs-updated" });
        return;
      }
      any = true;
      pending.slice(0, BATCH).forEach((u) => this.resolve(u));
      reconcile(run);
      this.emit({ type: "run-updated", run });
    });
    if (!any) this.stop();
  };
  private ensureTimer() { if (this.timer == null) this.timer = setInterval(this.tick, TICK_MS); }
  private stop() { if (this.timer != null) { clearInterval(this.timer); this.timer = null; } }
  resumeLive() { if ([...this.runs.values()].some((r) => r.status === "launching")) this.ensureTimer(); }
  pauseLive() { this.stop(); }
}

export const launchV2Service = new MockLaunchV2();
