/**
 * mockMetaLaunchService — the design-phase implementation of MetaLaunchService.
 *
 * It simulates the REAL reliability concerns so the UI can prove them out:
 *   - Idempotent launch: launching the same plan id twice returns the existing
 *     run; per-unit ids are stable (`<planId>:<index>`) so N requested = N created.
 *   - Throttled / batched execution: units resolve a few at a time on a timer,
 *     so progress is genuinely live.
 *   - Realistic partial failures: ~6% of units fail on first attempt with mixed
 *     reasons (some retryable, some not).
 *   - Retry-failed-only: retrying touches ONLY failed units; retryable ones
 *     mostly recover, non-retryable (policy / cap) stay failed.
 *
 * Swap this for a real Graph-API implementation behind MetaLaunchService — the
 * screens never change.
 */
import type {
  AccountHealth,
  ActivityEvent,
  AdAccount,
  AdUnit,
  Catalogue,
  FailureReason,
  LaunchPlan,
  LaunchRun,
  WinnerStrategy,
} from "../types";
import { adsPerDestination, getStrategy } from "../data/strategies";
import {
  MOCK_ACCOUNTS,
  MOCK_ACTIVITY,
  MOCK_CATALOGUES,
  MOCK_DRAFTS,
  MOCK_HEALTH,
  MOCK_SEED_RUNS,
  MOCK_WINNERS,
  SEED_RUN_ID,
  type SeedRunSpec,
} from "../data/mockData";
import type { Launch2Event, Launch2Listener, MetaLaunchService } from "./MetaLaunchService";

const FAIL_PCT = 6; // % of units that fail on first attempt
const RETRY_PERSIST_PCT = 25; // % of retryable failures that still fail on retry
const BATCH_SIZE = 5; // units resolved per tick
const TICK_MS = 750; // throttle interval

/* ---- deterministic hash (FNV-1a) ---- */
function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
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
  { code: "PAGE_CAP", message: "Destination Page at the 250 active-ad cap", retryable: false },
];

function pickFailure(seed: string): FailureReason {
  // ~65% of failures are retryable (throttle/transient), rest are hard.
  const h = hashSeed(seed + ":reason");
  if (h % 100 < 65) return RETRYABLE[h % RETRYABLE.length];
  return NON_RETRYABLE[h % NON_RETRYABLE.length];
}

/* ------------------------------------------------------------------ */
/*  Unit generation                                                    */
/* ------------------------------------------------------------------ */

/** Build the full requested unit list for a plan (all pending). */
function buildUnits(plan: LaunchPlan): AdUnit[] {
  const strategy = getStrategy(plan.strategyId);
  if (!strategy || plan.targets.length === 0) return [];
  const { campaigns, adSetsPerCampaign, adsPerAdSet } = plan.structure;
  const base = campaigns * adSetsPerCampaign * adsPerAdSet;

  // Per-destination shape (campaign / ad set / ad names) shared across targets.
  const shape: { campaignName: string; adSetName: string; creativeName: string }[] = [];
  for (let c = 1; c <= campaigns; c++) {
    for (let a = 1; a <= adSetsPerCampaign; a++) {
      for (let d = 1; d <= adsPerAdSet; d++) {
        const creative = plan.creatives[(shape.length) % Math.max(plan.creatives.length, 1)];
        shape.push({
          campaignName: `${strategy.name} · C${c}`,
          adSetName: `Ad set ${String(a).padStart(2, "0")}`,
          creativeName: creative?.name ?? `${strategy.name} creative`,
        });
      }
    }
  }

  const units: AdUnit[] = [];
  const caps = plan.targets.map((t) => {
    const acc = MOCK_ACCOUNTS.find((a) => a.id === t.accountId);
    const pg = acc?.pages.find((p) => p.id === t.pageId);
    return Math.max(0, 250 - (pg?.activeAds ?? 0));
  });

  const push = (shapeItem: typeof shape[number], targetIdx: number) => {
    const target = plan.targets[targetIdx];
    units.push({
      id: `${plan.id}:${units.length}`,
      campaignName: shapeItem.campaignName,
      adSetName: shapeItem.adSetName,
      creativeName: shapeItem.creativeName,
      target,
      status: "pending",
    });
  };

  if (plan.distribution === "duplicate") {
    // Replicate the whole shape to every target.
    plan.targets.forEach((_t, ti) => shape.forEach((s) => push(s, ti)));
  } else if (plan.distribution === "equal") {
    // Round-robin across targets.
    shape.forEach((s, i) => push(s, i % plan.targets.length));
  } else {
    // fill-first: fill each target up to its remaining capacity, then overflow.
    let ti = 0;
    let placed = 0;
    shape.forEach((s) => {
      while (ti < plan.targets.length - 1 && placed >= caps[ti]) {
        ti++;
        placed = 0;
      }
      push(s, ti);
      placed++;
    });
  }

  void base;
  return units;
}

function reconcile(run: LaunchRun): void {
  run.created = run.units.filter((u) => u.status === "created").length;
  run.failed = run.units.filter((u) => u.status === "failed").length;
  run.pending = run.units.filter((u) => u.status === "pending" || u.status === "creating").length;
}

/* ------------------------------------------------------------------ */
/*  Service implementation                                             */
/* ------------------------------------------------------------------ */

class MockMetaLaunchService implements MetaLaunchService {
  private runs = new Map<string, LaunchRun>();
  private runByPlan = new Map<string, string>();
  private drafts = new Map<string, LaunchPlan>();
  private attempt = new Map<string, number>(); // unitId -> attempt count
  private listeners = new Set<Launch2Listener>();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    MOCK_DRAFTS.forEach((d) => this.drafts.set(d.id, { ...d }));
    MOCK_SEED_RUNS.forEach((spec) => this.materializeSeed(spec));
  }

  /* ---- seeding ---- */
  private materializeSeed(spec: SeedRunSpec) {
    const { plan } = spec;
    const strategy = getStrategy(plan.strategyId)!;
    const units = buildUnits(plan);
    // Pre-resolve created + failed; rest stay pending.
    for (let i = 0; i < spec.created && i < units.length; i++) units[i].status = "created";
    for (let i = 0; i < spec.failed; i++) {
      const u = units[spec.created + i];
      if (!u) break;
      u.status = "failed";
      // Make the first failure retryable, the rest a mix — so Retry recovers some.
      u.failure = i === 0 ? RETRYABLE[0] : NON_RETRYABLE[0];
      this.attempt.set(u.id, 0);
    }
    const runId = SEED_RUN_ID[plan.id] ?? `rn_${plan.id}`;
    const run: LaunchRun = {
      id: runId,
      planId: plan.id,
      name: plan.name,
      strategyId: plan.strategyId!,
      strategyName: strategy.name,
      objective: plan.objective ?? strategy.objective,
      distribution: plan.distribution,
      status: spec.status,
      requested: units.length,
      created: 0,
      failed: 0,
      pending: 0,
      units,
      budgetPerDay: plan.structure.adSetsPerCampaign * plan.structure.campaigns * plan.budgetPerAdSet,
      currency: MOCK_ACCOUNTS.find((a) => a.id === plan.targets[0]?.accountId)?.currency ?? "USD",
      targets: plan.targets,
      retryCount: 0,
      createdAt: plan.createdAt,
      startedAt: spec.startedMsAgo != null ? new Date(Date.now() - spec.startedMsAgo).toISOString() : undefined,
      completedAt: spec.completedMsAgo != null ? new Date(Date.now() - spec.completedMsAgo).toISOString() : undefined,
      scheduledFor: plan.scheduledFor ?? undefined,
    };
    reconcile(run);
    this.runs.set(run.id, run);
    this.runByPlan.set(plan.id, run.id);
  }

  /* ---- pub/sub ---- */
  subscribe(listener: Launch2Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  private emit(event: Launch2Event) {
    this.listeners.forEach((l) => l(event));
  }

  /* ---- launches ---- */
  listLaunches(): LaunchRun[] {
    return [...this.runs.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
  getLaunch(id: string): LaunchRun | undefined {
    return this.runs.get(id);
  }

  launch(plan: LaunchPlan): LaunchRun {
    // Idempotent: same plan id → existing run.
    const existingId = this.runByPlan.get(plan.id);
    if (existingId) return this.runs.get(existingId)!;

    const strategy = getStrategy(plan.strategyId)!;
    const units = buildUnits(plan);
    const scheduled = !!plan.scheduledFor && new Date(plan.scheduledFor).getTime() > Date.now();
    const runId = `rn_${plan.id}`;
    const run: LaunchRun = {
      id: runId,
      planId: plan.id,
      name: plan.name,
      strategyId: plan.strategyId!,
      strategyName: strategy.name,
      objective: plan.objective ?? strategy.objective,
      distribution: plan.distribution,
      status: scheduled ? "scheduled" : "launching",
      requested: units.length,
      created: 0,
      failed: 0,
      pending: units.length,
      units,
      budgetPerDay: plan.structure.adSetsPerCampaign * plan.structure.campaigns * plan.budgetPerAdSet,
      currency: MOCK_ACCOUNTS.find((a) => a.id === plan.targets[0]?.accountId)?.currency ?? "USD",
      targets: plan.targets,
      retryCount: 0,
      createdAt: new Date().toISOString(),
      startedAt: scheduled ? undefined : new Date().toISOString(),
      scheduledFor: plan.scheduledFor ?? undefined,
    };
    reconcile(run);
    this.runs.set(run.id, run);
    this.runByPlan.set(plan.id, run.id);
    // Launching this plan consumes its draft.
    if (this.drafts.has(plan.id)) {
      this.drafts.delete(plan.id);
      this.emit({ type: "drafts-updated" });
    }
    this.emit({ type: "runs-updated" });
    this.emit({ type: "run-updated", run });
    if (!scheduled) this.ensureTimer();
    return run;
  }

  retryFailed(runId: string): LaunchRun | undefined {
    const run = this.runs.get(runId);
    if (!run) return undefined;
    const failedUnits = run.units.filter((u) => u.status === "failed");
    if (failedUnits.length === 0) return run;
    run.retryCount += 1;
    failedUnits.forEach((u) => {
      u.status = "pending";
      this.attempt.set(u.id, (this.attempt.get(u.id) ?? 0) + 1);
    });
    run.status = "launching";
    run.completedAt = undefined;
    reconcile(run);
    this.emit({ type: "run-updated", run });
    this.emit({ type: "runs-updated" });
    this.ensureTimer();
    return run;
  }

  /* ---- the throttled simulation loop ---- */
  private resolveUnit(unit: AdUnit): void {
    const attempt = this.attempt.get(unit.id) ?? 0;
    if (attempt === 0) {
      // First attempt.
      const fail = hashSeed(unit.id) % 100 < FAIL_PCT;
      if (fail) {
        unit.status = "failed";
        unit.failure = pickFailure(unit.id);
      } else {
        unit.status = "created";
        unit.failure = undefined;
      }
    } else {
      // Retry attempt — non-retryable stay failed; retryable mostly recover.
      const prev = unit.failure;
      if (prev && !prev.retryable) {
        unit.status = "failed";
      } else if (hashSeed(`${unit.id}:r${attempt}`) % 100 < RETRY_PERSIST_PCT) {
        unit.status = "failed";
        unit.failure = prev ?? pickFailure(unit.id);
      } else {
        unit.status = "created";
        unit.failure = undefined;
      }
    }
  }

  private tick = () => {
    let anyLaunching = false;
    this.runs.forEach((run) => {
      if (run.status !== "launching") return;
      const pending = run.units.filter((u) => u.status === "pending" || u.status === "creating");
      if (pending.length === 0) {
        // Settle.
        run.status = run.units.some((u) => u.status === "failed")
          ? (run.units.every((u) => u.status === "failed") ? "failed" : "partial")
          : "completed";
        run.completedAt = new Date().toISOString();
        reconcile(run);
        this.emit({ type: "run-updated", run });
        this.emit({ type: "runs-updated" });
        return;
      }
      anyLaunching = true;
      pending.slice(0, BATCH_SIZE).forEach((u) => this.resolveUnit(u));
      reconcile(run);
      this.emit({ type: "run-updated", run });
    });
    if (!anyLaunching) this.stopTimer();
  };

  private ensureTimer() {
    if (this.timer == null) this.timer = setInterval(this.tick, TICK_MS);
  }
  private stopTimer() {
    if (this.timer != null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  resumeLiveRuns(): void {
    if ([...this.runs.values()].some((r) => r.status === "launching")) this.ensureTimer();
  }
  pauseLiveRuns(): void {
    this.stopTimer();
  }

  /* ---- drafts ---- */
  listDrafts(): LaunchPlan[] {
    return [...this.drafts.values()].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }
  getDraft(id: string): LaunchPlan | undefined {
    return this.drafts.get(id);
  }
  saveDraft(plan: LaunchPlan): void {
    this.drafts.set(plan.id, { ...plan, updatedAt: new Date().toISOString() });
    this.emit({ type: "drafts-updated" });
  }
  deleteDraft(id: string): void {
    if (this.drafts.delete(id)) this.emit({ type: "drafts-updated" });
  }

  /* ---- reference data ---- */
  listAccounts(): AdAccount[] {
    return MOCK_ACCOUNTS;
  }
  getAccount(id: string): AdAccount | undefined {
    return MOCK_ACCOUNTS.find((a) => a.id === id);
  }
  listCatalogues(accountId?: string): Catalogue[] {
    return accountId ? MOCK_CATALOGUES.filter((c) => c.accountId === accountId) : MOCK_CATALOGUES;
  }
  listWinners(): WinnerStrategy[] {
    return MOCK_WINNERS;
  }
  listActivity(): ActivityEvent[] {
    return [...MOCK_ACTIVITY].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }
  listAccountHealth(): AccountHealth[] {
    return MOCK_HEALTH;
  }
}

/** Singleton — shared across the whole module so live runs persist on nav. */
export const metaLaunchService: MetaLaunchService = new MockMetaLaunchService();
