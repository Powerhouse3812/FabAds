/**
 * runModel.ts — shared types for a simulated workflow run.
 *
 * Extracted into its own file (rather than living in `runsStore.ts`) because
 * three modules need these shapes and must not drift: `runsStore.ts` persists
 * them, `executors.ts` produces them, `runEngine.ts` orchestrates them. Types
 * only — no store, no side effects, no React.
 *
 * Everything a run does is SIMULATED. `WorkflowRun.simulated` is always true
 * and every surface reads it to print "(simulated)"; the same discipline v3's
 * SyncRecord established.
 */
import type { WorkflowNodeKind } from "@/automations/model";

/**
 * One item flowing along an edge. For real creatives `id` is the
 * `CreativeRollup.creative.id`; for Genie output it is a derived
 * `${parentId}-var-${i}` and `generated` is true.
 *
 * `generated` is load-bearing, not decorative: a generated variant does not
 * exist in any ad account, so `syncFolderToAccounts` must exclude it (a
 * SyncRecord for a nonexistent creative would poison the drawer's
 * SyncStatusPanel), and it has no metrics, so conditions can't honestly
 * filter on it.
 */
export interface RunItem {
  id: string;
  name: string;
  generated: boolean;
}

export type RunStepStatus = "idle" | "running" | "done" | "skipped";

export interface RunStep {
  nodeId: string;
  kind: WorkflowNodeKind;
  /** Denormalised label — a run record must still explain itself after the
   *  node (or the whole workflow) has been edited or deleted. */
  label: string;
  status: RunStepStatus;
  /** Topological index, frozen when the run starts. */
  order: number;
  /** Deterministic, stamped at run start via hashString — never Math.random. */
  durationMs: number;
  startedAt?: string;
  finishedAt?: string;
  inputCount: number;
  outputCount: number;
  /** Honest past-tense detail, e.g. `filed 4 into "Winners" (simulated)`.
   *  Empty until the step completes. */
  detail: string;
  /**
   * Side-effect latch. Set true the instant a step's executor runs, so a
   * repeated tick (or a re-render) can never fire the same effect twice.
   */
  effectApplied: boolean;
  /** The items this step emitted — the input for its downstream steps. */
  output: RunItem[];
}

export type WorkflowRunStatus = "running" | "done" | "interrupted";

export interface WorkflowRun {
  id: string;
  workflowId: string;
  /** Denormalised, same reasoning as RunStep.label. */
  workflowName: string;
  status: WorkflowRunStatus;
  startedAt: string;
  finishedAt?: string;
  steps: RunStep[];
  simulated: true;
}

/** Context handed to every node executor for one run. */
export interface ExecutorCtx {
  workflowId: string;
  workflowName: string;
  runId: string;
  /** ISO timestamp for this step's completion — one value per step. */
  at: string;
}

export interface ExecutorResult {
  /** What flows onward. Terminal actions return []. */
  output: RunItem[];
  /** Honest past-tense summary WITHOUT a trailing "(simulated)" — the caller
   *  appends that exactly once, so it can never be doubled or omitted. */
  detail: string;
}
