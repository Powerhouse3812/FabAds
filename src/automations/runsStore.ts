/**
 * runsStore.ts — persisted history of simulated workflow runs, plus THE
 * elapsed-time reconciler that drives the one run that is currently live.
 *
 * SNAPSHOT-STABILITY WARNING (the exact bug this file is designed to make
 * impossible — see syncStore.ts:21-38 and boards.ts:11-16 for the original
 * occurrence): a `getSnapshot` that builds a fresh object/array on every call
 * breaks `useSyncExternalStore`'s identity check, so React re-renders forever
 * and the page goes white. This file exposes exactly ONE hook —
 * `useWorkflowRuns()` — whose `snapshot()` returns the module-cached `runs`
 * array reference and constructs NOTHING. There is no `useRunsForWorkflow`,
 * no `useActiveRun`, no matter how convenient: any hook that filters would
 * have to build a new array inside `getSnapshot` and would reintroduce the
 * white-screen. Per-workflow / per-run / per-step views are the CONSUMER's
 * own `useMemo` over the one array this hook returns — the same rule
 * `syncStore.ts` states for `selectors.ts`'s pure functions.
 *
 * Same localStorage-backed discipline as syncStore.ts / activityStore.ts:
 * module-level `runs`, `snapshot()` returns it directly, `persist()` rebuilds
 * the reference then writes localStorage inside a try/catch then emits, a
 * module constant doubles as the server snapshot, `sanitize()` defends every
 * field on load and never throws. Capped at `MAX_RUNS` on BOTH read and write
 * (belt and braces, exactly as activityStore.ts caps its log) — an uncapped
 * append-only array in localStorage eventually throws on setItem and wedges
 * the store.
 *
 * SERIAL BY DESIGN: steps execute strictly in ascending `order`, one at a
 * time, and there is at most ONE run with status `"running"` app-wide (the run
 * engine enforces that; this store assumes it — see `getActiveRun`). Branches
 * in the graph are flattened to a topological order by the engine before the
 * run starts. One node lit at a time is the intended demo behaviour: a canvas
 * with three nodes pulsing at once is unreadable, and parallelism would buy
 * nothing a simulated run needs.
 *
 * NO SIDE EFFECTS LIVE HERE. This store owns status and timestamps only. The
 * actual per-node work (asking Genie for variants, filing into a folder,
 * enqueuing a sync) lives in `executors.ts`, and `runEngine.ts` marries the
 * two by handing this module a `StepRunner` via `registerStepRunner`. That
 * inversion keeps the persistence layer free of imports from every domain
 * module in the app, and keeps this file unit-testable with no runner at all.
 *
 * FULLY DETERMINISTIC: no unseeded randomness anywhere in this file (repo
 * audit rule — `runDataAudit()` must stay ALL PASS), and the token itself is
 * kept out of the source so a grep for it stays clean. Durations arrive
 * pre-stamped on each `RunStep`, derived by the engine from `hashString`.
 */
import { useSyncExternalStore } from "react";
import type { WorkflowNodeKind } from "@/automations/model";
import type {
  RunItem,
  RunStep,
  RunStepStatus,
  WorkflowRun,
  WorkflowRunStatus,
} from "@/automations/runModel";

const KEY = "workflows-runs";

/** ~100 newest runs. Enforced on read AND on write — a cap applied only on
 *  write still lets a hand-edited or older-build payload load unbounded. */
const MAX_RUNS = 100;

/** Doubles as the server snapshot. A module constant, never rebuilt, so the
 *  SSR/hydration path is identity-stable too. */
const EMPTY_RUNS: WorkflowRun[] = [];

const STEP_STATUSES: ReadonlySet<string> = new Set<RunStepStatus>([
  "idle",
  "running",
  "done",
  "skipped",
]);

const RUN_STATUSES: ReadonlySet<string> = new Set<WorkflowRunStatus>([
  "running",
  "done",
  "interrupted",
]);

/* ------------------------------------------------------------------ */
/*  Sanitiser                                                          */
/* ------------------------------------------------------------------ */

function isValidItem(v: unknown): v is RunItem {
  if (!v || typeof v !== "object") return false;
  const item = v as RunItem;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.generated === "boolean"
  );
}

function isFiniteNumber(v: unknown): boolean {
  return typeof v === "number" && Number.isFinite(v);
}

function isValidStep(v: unknown): boolean {
  if (!v || typeof v !== "object") return false;
  const step = v as RunStep;
  return (
    typeof step.nodeId === "string" &&
    // Deliberately `typeof string`, NOT membership in WORKFLOW_NODE_KINDS: a
    // run record is history, and `label` is denormalised precisely so it can
    // explain itself after the node vocabulary moves on. Dropping a step
    // because its kind is no longer in the current union would silently erase
    // that history instead of showing it. Consumers switch on `kind` with a
    // default branch; the cast below is contained to this boundary.
    typeof step.kind === "string" &&
    typeof step.label === "string" &&
    typeof step.status === "string" &&
    STEP_STATUSES.has(step.status) &&
    isFiniteNumber(step.order) &&
    isFiniteNumber(step.durationMs) &&
    isFiniteNumber(step.inputCount) &&
    isFiniteNumber(step.outputCount) &&
    typeof step.detail === "string" &&
    typeof step.effectApplied === "boolean" &&
    Array.isArray(step.output) &&
    (step.startedAt === undefined || typeof step.startedAt === "string") &&
    (step.finishedAt === undefined || typeof step.finishedAt === "string")
  );
}

/** Normalise one already-validated step: filter malformed `output` items
 *  individually (one bad item must not cost the whole step its record) and
 *  keep `outputCount` derived from what actually survived, so the number a
 *  surface prints can never disagree with the list it prints beside it. */
function normaliseStep(raw: RunStep): RunStep {
  const output = raw.output.filter(isValidItem);
  return {
    ...raw,
    kind: raw.kind as WorkflowNodeKind,
    output,
    outputCount: output.length,
  };
}

/**
 * RELOAD RECOVERY AS A DESIGN PROPERTY, not a special case — the same framing
 * `syncStore.sanitize()` uses, with the OPPOSITE conclusion, and the contrast
 * is the whole point:
 *
 *   syncStore REWINDS a persisted `running` record to `queued` and lets the
 *   next tick re-drive it, because its unit of work is one creative::account
 *   upload — idempotent per pair, guarded by `pairKey`, so re-running it is
 *   harmless and finishing the job is the honest outcome.
 *
 *   A workflow run is NOT that. Its unit of work is a whole chain, and each
 *   step's `effectApplied` latch is the only thing standing between it and a
 *   duplicated side effect (a second batch of Genie variants, a second folder
 *   filing, a second sync enqueue). Across a reload boundary we cannot trust
 *   that latch: the write that set it and the write that recorded its result
 *   are one atomic state write in memory, but nothing guarantees the
 *   localStorage flush landed before the tab went away. So runs are NEVER
 *   resumed. A run caught mid-flight becomes `interrupted`, its unfinished
 *   steps become `skipped` with an honest reason, and the user re-runs it if
 *   they want it done. Half a chain reported truthfully beats a whole chain
 *   that may have fired twice.
 *
 * `finishedAt` is left UNSET on an interrupted run (and on its skipped steps):
 * we genuinely do not know when it stopped — the tick that would have stamped
 * it never ran — and inventing the load time as a finish time would fabricate
 * a duration the run never had.
 */
function recoverInterrupted(run: WorkflowRun): WorkflowRun {
  if (run.status !== "running") return run;
  return {
    ...run,
    status: "interrupted",
    steps: run.steps.map((step) =>
      step.status === "running" || step.status === "idle"
        ? { ...step, status: "skipped", detail: "interrupted by reload" }
        : step,
    ),
  };
}

/** Validate localStorage payloads defensively — corrupt or hand-edited JSON
 *  must degrade to an empty history, never crash the Automations screen. Bad
 *  steps are dropped individually; a run is dropped only if it has zero
 *  surviving steps, because a run with no steps can't explain anything. */
function sanitize(raw: unknown): WorkflowRun[] {
  if (!Array.isArray(raw)) return EMPTY_RUNS;

  const valid: WorkflowRun[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const run = entry as WorkflowRun;
    if (
      typeof run.id !== "string" ||
      typeof run.workflowId !== "string" ||
      typeof run.workflowName !== "string" ||
      typeof run.startedAt !== "string" ||
      typeof run.status !== "string" ||
      !RUN_STATUSES.has(run.status) ||
      run.simulated !== true ||
      !Array.isArray(run.steps)
    ) {
      continue;
    }
    if (run.finishedAt !== undefined && typeof run.finishedAt !== "string") continue;

    const steps = run.steps.filter(isValidStep).map((s) => normaliseStep(s as RunStep));
    if (steps.length === 0) continue;

    valid.push(recoverInterrupted({ ...run, steps, simulated: true }));
  }

  return valid.slice(0, MAX_RUNS);
}

function readInitial(): WorkflowRun[] {
  if (typeof window === "undefined") return EMPTY_RUNS;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? sanitize(JSON.parse(raw)) : EMPTY_RUNS;
  } catch {
    return EMPTY_RUNS;
  }
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

/** Newest first. The ONE cached reference every reader shares. */
let runs: WorkflowRun[] = readInitial();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(runs));
    } catch {
      // Quota exceeded or storage unavailable — keep the in-memory runs and
      // don't let a write failure wedge the store.
    }
  }
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function snapshot(): WorkflowRun[] {
  return runs;
}

/** THE ONLY HOOK — if you ever add a second, you've reintroduced the
 *  getSnapshot-constructs-a-new-array bug that already white-screened this
 *  repo once (see the file header). Consumers call this once and derive
 *  (filter by workflowId, find the active run, group by day) with `useMemo`,
 *  never a second store hook. */
export function useWorkflowRuns(): WorkflowRun[] {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY_RUNS);
}

/** Non-hook accessor for the clock-driven run engine, which ticks outside
 *  React's render cycle and must never subscribe. */
export function getRuns(): WorkflowRun[] {
  return runs;
}

/**
 * The single live run, or null.
 *
 * ASSERTION: there is at most ONE run with status `"running"` app-wide.
 * `runEngine.ts` enforces it — it refuses to start a run while
 * `getActiveRun()` is non-null — and `advanceRun` below relies on it (it
 * reconciles exactly one run per tick). Hence `find`, not `filter`: a second
 * running run would be a bug in the engine, and this function deliberately
 * does not paper over it by picking a "best" one.
 *
 * `workflowId` narrows rather than searches: pass it to ask "is THIS
 * workflow the one that's running", which is what a canvas needs before it
 * lights up its nodes. A different workflow running returns null, not that
 * other workflow's run.
 */
export function getActiveRun(workflowId?: string): WorkflowRun | null {
  const active = runs.find((r) => r.status === "running");
  if (!active) return null;
  if (workflowId !== undefined && active.workflowId !== workflowId) return null;
  return active;
}

/** Prepend (newest first) and cap. The engine builds the whole run — steps,
 *  orders, durations — before calling this, so a run enters history already
 *  well-formed. */
export function appendRun(run: WorkflowRun): void {
  runs = [run, ...runs].slice(0, MAX_RUNS);
  persist();
}

/** Local demo reset — labelled as such everywhere it's surfaced in the UI.
 *  Never a stand-in for a real audit-log deletion: there is no real audit log
 *  because nothing in a simulated run ever reached a real system. Side effects
 *  a run DID apply to other demo stores (folder membership, status tags, sync
 *  records) are untouched by this — clearing the narrative doesn't unwind the
 *  story. */
export function clearRuns(): void {
  if (runs.length === 0) return;
  runs = EMPTY_RUNS;
  persist();
}

/* ------------------------------------------------------------------ */
/*  Step runner registration                                           */
/* ------------------------------------------------------------------ */

/**
 * What `runEngine.ts` supplies so this store can complete a step without
 * importing a single domain module.
 *
 * The `run` handed in is the run as it stands BEFORE `step` flips to `done` —
 * every upstream step is already `done` with its `output` populated, which is
 * exactly the input the runner needs to gather.
 *
 * `inputCount` is part of the RETURN, not something this store computes.
 * Gathering a step's input requires the graph's edges (which upstream nodes
 * feed it), and this store holds no graph — deliberately, so run history stays
 * readable after the workflow is edited or deleted. The engine precomputes
 * each step's upstream nodeIds when it builds the run and closes over them in
 * the runner; `advanceRun` only owns status and timestamps, starts a step with
 * `inputCount: 0`, and writes the real figure back from the runner's return
 * in the same atomic state write that marks the step done. So `inputCount` is
 * 0 for exactly as long as a step is `running`, and truthful from the moment
 * it is `done`.
 */
type StepRunner = (
  run: WorkflowRun,
  step: RunStep,
) => { output: RunItem[]; detail: string; inputCount: number };

let stepRunner: StepRunner | null = null;

/** Called once by `runEngine.ts` at module init. Pass `null` to unregister
 *  (tests, teardown) — with no runner registered, steps still complete, just
 *  inertly, which is what a store-level unit test wants. */
export function registerStepRunner(fn: StepRunner | null): void {
  stepRunner = fn;
}

/* ------------------------------------------------------------------ */
/*  The reconciler                                                     */
/* ------------------------------------------------------------------ */

/** Lowest-`order` step in a given status, or -1. Index-based (not sorted) so
 *  the persisted `steps` array order never has to match `order`. */
function lowestOrderIndexWithStatus(steps: RunStep[], status: RunStepStatus): number {
  let best = -1;
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].status !== status) continue;
    if (best === -1 || steps[i].order < steps[best].order) best = i;
  }
  return best;
}

function replaceAt(steps: RunStep[], index: number, next: RunStep): RunStep[] {
  const copy = steps.slice();
  copy[index] = next;
  return copy;
}

function writeRun(index: number, next: WorkflowRun): void {
  runs = [...runs.slice(0, index), next, ...runs.slice(index + 1)];
  persist();
}

/**
 * Complete one due step, invoking the registered runner exactly once.
 *
 * ORDERING — why the latch is NOT set before the call:
 * `advanceRun` is only ever entered from a clock tick, and JavaScript gives us
 * a run-to-completion guarantee, so nothing can observe an intermediate state
 * between "runner invoked" and "result written". Setting `effectApplied = true`
 * as a separate earlier write would therefore buy no protection, and would
 * cost something real: a published state in which the latch says "the effect
 * ran" while `detail`/`output` say nothing happened. Every surface reading
 * that pair would disagree with itself, and a reload landing in that window
 * would persist the disagreement.
 *
 * So the latch and the outcome are ONE write: build the completed step from
 * whatever the call produced, latch included, and hand it back for a single
 * atomic state update. The try/catch is what makes that safe — a throwing
 * runner still yields a `done` step (latched, so it is never retried, with an
 * honest `detail`) rather than leaving the step `running` forever and wedging
 * the whole chain behind it. A visibly failed step the user can re-run beats a
 * run that silently stops advancing.
 */
function completeStep(run: WorkflowRun, step: RunStep, nowMs: number): RunStep {
  const finishedAt = new Date(nowMs).toISOString();
  const base = { ...step, status: "done" as const, finishedAt, effectApplied: true };

  // Latch already set — a hand-edited record, or a step whose effect somehow
  // ran on an earlier tick. Never fire twice; keep whatever it recorded.
  if (step.effectApplied) return { ...base, outputCount: step.output.length };

  // No runner registered (store-level tests, or before the engine's init):
  // complete inertly. Harmless and honest — an empty detail prints as no
  // detail, not as a fabricated one.
  if (!stepRunner) return { ...base, detail: "", output: [], outputCount: 0 };

  try {
    const result = stepRunner(run, step);
    return {
      ...base,
      detail: result.detail,
      output: result.output,
      // Derived, never taken on trust, so the count can't contradict the list.
      outputCount: result.output.length,
      inputCount: result.inputCount,
    };
  } catch (err) {
    console.error("[runsStore] step runner threw for node", step.nodeId, err);
    return { ...base, detail: "step failed — see console", output: [], outputCount: 0 };
  }
}

/**
 * THE reconciler — an ELAPSED-TIME RECONCILER, not a timer chain. Called every
 * 500ms by the shared workflow clock with the current reading, and derives
 * every transition from `nowMs` vs the timestamps already stamped on the run.
 * That means it is correct even if ticks are missed, delayed, coalesced, or
 * the tab was backgrounded for a minute — the run catches up one step per
 * tick instead of pretending nothing elapsed.
 *
 * Returns `false` whenever nothing changed, and does not write or emit in that
 * case. This is the hot path — it runs twice a second, forever, for the whole
 * life of the app — so the "no active run" early-out comes first and costs one
 * array scan. Get the boolean wrong and every mounted node on the canvas
 * re-renders twice a second; as syncStore's header puts it, that is "a
 * correctness-of-feel requirement, not an optimisation". `persist()` has
 * already emitted by the time this returns true, so the caller does not need
 * to — the boolean tells it whether anything actually happened.
 *
 * One tick advances at most one step boundary: complete the due step, start
 * the next. Strictly serial in ascending `order`.
 */
export function advanceRun(nowMs: number): boolean {
  // 1. Cheap early-out. Almost every tick over the app's lifetime ends here.
  const runIndex = runs.findIndex((r) => r.status === "running");
  if (runIndex === -1) return false;

  const run = runs[runIndex];
  let steps = run.steps;
  let changed = false;

  // 2. Is the running step due yet?
  const runningIndex = lowestOrderIndexWithStatus(steps, "running");
  if (runningIndex !== -1) {
    const step = steps[runningIndex];
    const startedAtMs = step.startedAt ? Date.parse(step.startedAt) : NaN;

    if (!Number.isFinite(startedAtMs)) {
      // A `running` step with a missing or unparseable `startedAt` has no
      // elapsed-time base, so it would never come due. Self-heal by stamping
      // one now rather than wedging the run forever — it costs the step its
      // true start time, which was already unknowable.
      writeRun(runIndex, {
        ...run,
        steps: replaceAt(steps, runningIndex, { ...step, startedAt: new Date(nowMs).toISOString() }),
      });
      return true;
    }

    if (startedAtMs + step.durationMs > nowMs) return false; // still in flight

    // 3. Due: complete it. The side effect happens inside `completeStep`, via
    //    the runner the engine registered — never inline here.
    steps = replaceAt(steps, runningIndex, completeStep(run, step, nowMs));
    changed = true;
  }

  // 4. Start the next step: lowest `order` still idle. `inputCount` starts at
  //    0 and the runner writes the real figure when this step completes — see
  //    the StepRunner doc comment for why this store can't compute it.
  const idleIndex = lowestOrderIndexWithStatus(steps, "idle");
  if (idleIndex !== -1) {
    steps = replaceAt(steps, idleIndex, {
      ...steps[idleIndex],
      status: "running",
      startedAt: new Date(nowMs).toISOString(),
      inputCount: 0,
    });
    changed = true;
  }

  let next: WorkflowRun = { ...run, steps };

  // 5. Nothing left to start — the run is over. Reached both on the normal
  //    last-step tick and for a run that somehow holds no idle/running steps
  //    at all, which must still be closed out rather than left "running".
  if (idleIndex === -1) {
    next = { ...next, status: "done", finishedAt: new Date(nowMs).toISOString() };
    changed = true;
  }

  // 6. One write, one emit, only if something moved.
  if (!changed) return false;
  writeRun(runIndex, next);
  return true;
}
