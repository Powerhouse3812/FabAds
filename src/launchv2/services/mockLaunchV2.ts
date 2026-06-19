/**
 * mockLaunchV2 — design-phase launch engine for Launch v2. Same reliability
 * spine as launch2 (idempotent N=N, throttled batches, ~6% realistic partial
 * failures, retry-failed-only) adapted to the PlanV2 spread + page-distribution
 * model. Swap for the real Graph API behind this interface later.
 */
import {
  type AdUnitV2,
  type FailureReason,
  type LaunchRunV2,
  type PlanV2,
} from "../types";
import { budgetPerDay } from "../deriveV2";
import { buildPlanUnits } from "../planUnits";
import { saveRun as saveToHistory } from "./runsService";

/* ------------------------------------------------------------------ */
/*  Run persistence (sessionStorage)                                   */
/* ------------------------------------------------------------------ */

const RUN_STORAGE_KEY = "fabads_launchv2_run";

/** Compute a stable string hash of the plan's targets + structure for stale-detection. */
export function computePlanHash(plan: PlanV2): string {
  try {
    const targets = JSON.stringify(plan.targets);
    const campaigns = String(plan.structure.campaigns);
    return String(hashStr(targets + campaigns));
  } catch {
    return "";
  }
}

function hashStr(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function persistRun(run: LaunchRunV2): void {
  try {
    sessionStorage.setItem(RUN_STORAGE_KEY, JSON.stringify(run));
  } catch { /* quota exceeded or private-mode blocked — ignore */ }
}

export function hydratePersistentRun(): LaunchRunV2 | null {
  try {
    const raw = sessionStorage.getItem(RUN_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LaunchRunV2;
  } catch { return null; }
}

export function clearPersistentRun(): void {
  try {
    sessionStorage.removeItem(RUN_STORAGE_KEY);
  } catch { /* ignore */ }
}

const FAIL_PCT = 6;
const RETRY_PERSIST_PCT = 25;
const BATCH = 5;
const TICK_MS = 750;

function hash(s: string): number {
  return hashStr(s);
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

/**
 * Build the launch units from the SHARED canonical expansion (`buildPlanUnits`).
 * Each unit's id == its review-tree node id, so what the user reviewed (incl.
 * per-node overrides) is exactly what launches, and a failed unit maps back to
 * its tree node. Honors `structure.campaigns` (all campaigns real).
 */
function buildUnitsV2(plan: PlanV2): AdUnitV2[] {
  return buildPlanUnits(plan).map((u) => ({
    id: u.adNodeId,
    name: u.resolved.adName,
    campaignName: u.resolved.campaignName,
    adSetName: u.resolved.adSetName,
    creativeName: u.creativeName,
    target: u.target,
    status: "pending",
  }));
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
      planHash: computePlanHash(plan),
    };
    reconcile(run);
    this.runs.set(run.id, run);
    this.byPlan.set(plan.id, run.id);
    persistRun(run);
    saveToHistory(run);
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
    persistRun(run);
    saveToHistory(run);
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
        persistRun(run);
        saveToHistory(run);
        this.emit({ type: "run-updated", run });
        this.emit({ type: "runs-updated" });
        return;
      }
      any = true;
      pending.slice(0, BATCH).forEach((u) => this.resolve(u));
      reconcile(run);
      persistRun(run);
      saveToHistory(run);
      this.emit({ type: "run-updated", run });
    });
    if (!any) this.stop();
  };
  private ensureTimer() { if (this.timer == null) this.timer = setInterval(this.tick, TICK_MS); }
  private stop() { if (this.timer != null) { clearInterval(this.timer); this.timer = null; } }
  resumeLive() { if ([...this.runs.values()].some((r) => r.status === "launching")) this.ensureTimer(); }
  pauseLive() { this.stop(); }

  /** Mark a run as stale (plan changed since the run was created). */
  markRunStale(runId: string): void {
    const run = this.runs.get(runId);
    if (!run || run.status === "stale") return;
    run.status = "stale";
    persistRun(run);
    this.emit({ type: "run-updated", run });
    this.emit({ type: "runs-updated" });
  }

  /**
   * Re-hydrate a persisted run from sessionStorage on app boot.
   * If the run's planHash differs from the current plan (detected externally),
   * mark it "stale" before restoring. Returns the re-hydrated run or null.
   */
  rehydrateFromStorage(currentPlan?: PlanV2): LaunchRunV2 | null {
    const run = hydratePersistentRun();
    if (!run) return null;
    // Stale-detection: if we have a current plan and its hash differs → stale.
    if (currentPlan && run.planHash !== undefined) {
      const currentHash = computePlanHash(currentPlan);
      if (currentHash !== run.planHash) {
        run.status = "stale";
      }
    }
    // Restore into in-memory maps (skip if already registered from this session).
    if (!this.runs.has(run.id)) {
      this.runs.set(run.id, run);
      this.byPlan.set(run.planId, run.id);
      this.emit({ type: "runs-updated" });
      this.emit({ type: "run-updated", run });
      if (run.status === "launching") this.ensureTimer();
    }
    return run;
  }
}

export const launchV2Service = new MockLaunchV2();
