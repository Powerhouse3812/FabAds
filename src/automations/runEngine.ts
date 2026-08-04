/**
 * runEngine.ts — starts simulated workflow runs and drives them off the shared
 * workflow clock.
 *
 * DIVISION OF LABOUR (three files, one job each):
 *   - `runsStore.ts`  owns persistence and the elapsed-time reconciler
 *                     (`advanceRun`) — status and timestamps only.
 *   - `executors.ts`  owns what each node KIND actually does.
 *   - this file       owns the graph walk: which steps exist, in what order,
 *                     and which upstream outputs feed each one. It hands
 *                     `runsStore` a `StepRunner` closure that resolves a step
 *                     to its executor with the right input.
 *
 * MANUAL RUN ONLY, deliberately. `WorkflowGraph.enabled`/`schedule` exist in
 * the model but nothing here auto-fires: shipping edge-triggered per-creative
 * auto-run (v3's semantics) AND whole-graph runs at once would mean two
 * different execution models in one prototype. The future auto path is a copy
 * of `@/creative-report/automations/runner.ts`'s eligible-rules pass plus its
 * own fire ledger, and nothing in this design blocks it.
 */
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import {
  registerWorkflowRunner,
  setClockArmed,
  tickNow,
  topologicalOrder,
  reachableFrom,
  incomingOf,
  type GraphEdge,
} from "@/workflows/core";
import { advanceQueue } from "@/creative-report/automations/sync/syncStore";
import { hashString } from "@/data/rng";
import {
  describeNode,
  findSourceNode,
  nodeConfigIssue,
  NODE_KIND_META,
  type WorkflowGraph,
  type WorkflowNode,
} from "@/automations/model";
import { getWorkflowGraphs, recordWorkflowLastRun } from "@/automations/graphStore";
import {
  advanceRun,
  appendRun,
  getActiveRun,
  registerStepRunner,
} from "@/automations/runsStore";
import { NODE_EXECUTORS, buildRollupIndex } from "@/automations/executors";
import type { RunItem, RunStep, WorkflowRun } from "@/automations/runModel";

/** Distinct from the creative-report runner's id. `registerWorkflowRunner` is a
 *  keyed map, so both coexist on the single shared interval. */
const RUNNER_ID = "workflows-canvas";

/**
 * Per-step simulated duration, 0.9s–2.5s. Derived from `hashString` — NEVER
 * `Math.random` — so a given run id + node id always takes the same time and a
 * demo is reproducible across reloads (the repo's `runDataAudit()` depends on
 * this discipline holding everywhere).
 */
function stepDurationMs(runId: string, nodeId: string): number {
  return 900 + (hashString(`${runId}:${nodeId}`) % 5) * 400;
}

/* ------------------------------------------------------------------ */
/*  Run construction                                                   */
/* ------------------------------------------------------------------ */

let runCounter = 0;

/**
 * Per-run scratch state that must not be persisted: the rollup index is a
 * ~60-entry Map of live CreativeRollups (huge, and stale the moment thresholds
 * change), and the source items are derived from it. Keyed by run id so a
 * reload — which cannot rebuild this — simply finds nothing and the run is
 * reported `interrupted` by `runsStore`'s sanitiser rather than half-resumed.
 */
const runScratch = new Map<
  string,
  { items: RunItem[]; rollupsById: Map<string, ReturnType<typeof buildRollupIndex>["rollupsById"] extends Map<string, infer V> ? V : never> }
>();

/**
 * A STRING discriminant, not a boolean `ok`. This repo compiles with
 * `strict: false` (see tsconfig.app.json), and with `strictNullChecks` off
 * TypeScript does not reliably narrow a union on `true`/`false` literal
 * members — `if (!result.ok)` left `reason` unreachable. String literals narrow
 * correctly regardless, and read better at the call site.
 */
export type StartRunResult =
  | { status: "started"; runId: string }
  | { status: "refused"; reason: string };

/**
 * Build and persist a run, then tick immediately so the first node lights up in
 * the same breath as the click rather than up to 500ms later.
 *
 * Refuses (rather than half-running) when the graph can't produce an honest
 * run: another run in flight, no trigger, or a cycle.
 */
export function startRunSimulated(workflowId: string): StartRunResult {
  const graph = getWorkflowGraphs().find((g) => g.id === workflowId);
  if (!graph) return { status: "refused", reason: "That workflow no longer exists." };

  // One run at a time, app-wide — the store's `getActiveRun` invariant.
  const active = getActiveRun();
  if (active) {
    return {
      status: "refused",
      reason:
        active.workflowId === workflowId
          ? "This workflow is already running."
          : `"${active.workflowName}" is still running.`,
    };
  }

  const source = findSourceNode(graph.nodes);
  if (!source) {
    return { status: "refused", reason: "Add a trigger step — a workflow starts from one." };
  }

  const steps = buildSteps(graph, source);
  if (!steps) {
    return { status: "refused", reason: "This workflow loops back on itself — remove the loop to run it." };
  }
  if (steps.every((s) => s.status === "skipped")) {
    return { status: "refused", reason: "Nothing is connected to the trigger yet." };
  }

  runCounter += 1;
  const runId = `run-${Date.now()}-${runCounter}`;
  const startedAt = new Date().toISOString();

  // Built once per run so downstream condition steps can resolve metrics for
  // real creatives even after a generateVariation step has introduced items
  // that have none.
  const { items, rollupsById } = buildRollupIndex();
  runScratch.set(runId, { items, rollupsById });

  const stamped = steps.map((s) => ({ ...s, durationMs: stepDurationMs(runId, s.nodeId) }));

  // Start the first executable step immediately — an `idle` first step would
  // show a run that is "running" with nothing happening for one tick.
  const firstIdx = firstExecutableIndex(stamped);
  if (firstIdx >= 0) {
    stamped[firstIdx] = { ...stamped[firstIdx], status: "running", startedAt };
  }

  const run: WorkflowRun = {
    id: runId,
    workflowId: graph.id,
    workflowName: graph.name,
    status: "running",
    startedAt,
    steps: stamped,
    simulated: true,
  };

  appendRun(run);
  recordWorkflowLastRun(graph.id);
  tickNow();

  return { status: "started", runId };
}

function firstExecutableIndex(steps: RunStep[]): number {
  let best = -1;
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].status !== "idle") continue;
    if (best === -1 || steps[i].order < steps[best].order) best = i;
  }
  return best;
}

/**
 * Turn a graph into an ordered step list, or null on a cycle.
 *
 * Two honest exclusions, both surfaced as `skipped` steps rather than silently
 * dropped — a node that sits on the canvas and does nothing must say why:
 *   - notes never execute (they are annotations);
 *   - nodes not reachable from the trigger are orphans.
 */
function buildSteps(graph: WorkflowGraph, source: WorkflowNode): RunStep[] | null {
  const edges = graph.edges as GraphEdge[];
  const order = topologicalOrder(
    graph.nodes.map((n) => n.id),
    edges,
  );
  if (!order) return null;

  const reachable = reachableFrom(source.id, edges);
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));

  const steps: RunStep[] = [];
  let executableOrder = 0;

  for (const nodeId of order) {
    const node = byId.get(nodeId);
    if (!node) continue;

    const isNote = node.kind === "note";
    const isOrphan = !reachable.has(node.id);
    const configIssue = nodeConfigIssue(node.data);

    let skipReason: string | null = null;
    if (isNote) skipReason = "notes are annotations — they don't run";
    else if (isOrphan) skipReason = "not connected to the trigger";
    else if (configIssue) skipReason = configIssue.toLowerCase();

    steps.push({
      nodeId: node.id,
      kind: node.kind,
      // Denormalised: a run record must still explain itself after the node is
      // edited or the workflow deleted.
      label: `${NODE_KIND_META[node.kind].label} — ${describeNode(node.data)}`,
      status: skipReason ? "skipped" : "idle",
      order: skipReason ? -1 : executableOrder++,
      durationMs: 0, // stamped by the caller, which knows the run id
      inputCount: 0,
      outputCount: 0,
      detail: skipReason ?? "",
      effectApplied: !!skipReason, // a skipped step has no effect to apply
      output: [],
    });
  }

  return steps;
}

/* ------------------------------------------------------------------ */
/*  The StepRunner — graph-aware, handed to runsStore                  */
/* ------------------------------------------------------------------ */

/**
 * Resolve one step to its executor and feed it the union of its upstream
 * steps' outputs.
 *
 * Registered once at module init (not per component) because the store calls it
 * from a clock tick with no React context available.
 */
registerStepRunner((run, step) => {
  const graph = getWorkflowGraphs().find((g) => g.id === run.workflowId);
  const node = graph?.nodes.find((n) => n.id === step.nodeId);

  // The workflow (or this node) was edited or deleted mid-run. Complete the
  // step honestly instead of guessing at what it would have done.
  if (!graph || !node) {
    return { output: [], detail: "step's configuration changed mid-run", inputCount: 0 };
  }

  const scratch = runScratch.get(run.id);
  if (!scratch) {
    // Only reachable if a run somehow advances after a reload cleared scratch;
    // runsStore's sanitiser normally marks such runs `interrupted` first.
    return { output: [], detail: "run context was lost", inputCount: 0 };
  }

  const upstream = incomingOf(step.nodeId, graph.edges as GraphEdge[]);
  const items: RunItem[] =
    node.kind === "source"
      ? scratch.items
      : dedupeById(
          upstream.flatMap(
            (e) => run.steps.find((s) => s.nodeId === e.source)?.output ?? [],
          ),
        );

  const result = NODE_EXECUTORS[node.kind]({
    items,
    data: node.data,
    ctx: {
      workflowId: graph.id,
      workflowName: graph.name,
      runId: run.id,
      // One timestamp per step. The store has already decided this step is due;
      // using "now" here is the closest honest stamp for when the effect ran.
      at: new Date().toISOString(),
    },
    rollupsById: scratch.rollupsById,
  });

  return { output: result.output, detail: result.detail, inputCount: items.length };
});

/** A node with two upstream branches must not act on the same creative twice. */
function dedupeById(items: RunItem[]): RunItem[] {
  const seen = new Set<string>();
  const out: RunItem[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  Clock wiring                                                       */
/* ------------------------------------------------------------------ */

function onTick(now: Date) {
  const ms = now.getTime();

  // Also advance the sync queue. The creative-report runner does this too, but
  // only while ITS layout is mounted — a workflow run started from /automation
  // would otherwise queue uploads that never progress. Safe to call from both:
  // `advanceQueue` is an idempotent elapsed-time reconciler with an early-out,
  // so two calls in one tick is two cheap no-ops, never a double-advance.
  // Do not "tidy" this away.
  advanceQueue(ms);

  advanceRun(ms);
}

let refCount = 0;
let unregister: (() => void) | null = null;

function start() {
  if (unregister) return;
  unregister = registerWorkflowRunner(RUNNER_ID, onTick);
  setClockArmed(true);
}

function stop() {
  unregister?.();
  unregister = null;
  // Deliberately NOT setClockArmed(false): `armed` is a shared global latch and
  // disarming it here would silence the creative-report runner too.
}

/**
 * Mount once from the Automations layout. Refcounted so StrictMode's
 * double-mount can't create two registrations (and `registerWorkflowRunner`'s
 * keyed idempotency is the second belt).
 */
export function useCanvasWorkflowRunner(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    refCount += 1;
    if (refCount === 1) start();
    return () => {
      refCount -= 1;
      if (refCount === 0) stop();
    };
  }, [enabled]);
}

/** Start a run and surface the refusal reason as a toast when it can't. */
export function runWorkflowWithFeedback(workflowId: string): boolean {
  const result = startRunSimulated(workflowId);
  if (result.status === "refused") {
    toast({ title: "Can't run this workflow yet", description: result.reason });
    return false;
  }
  toast({
    title: "Workflow running (simulated)",
    description: "Steps light up as they complete. Nothing is sent to a real ad account.",
  });
  return true;
}
