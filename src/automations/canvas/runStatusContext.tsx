/**
 * runStatusContext.tsx — how live run progress reaches the node components.
 *
 * THE PERFORMANCE DECISION THIS FILE EXISTS TO ENFORCE
 * ---------------------------------------------------
 * The obvious way to show a running node is to rewrite `node.data.status` on
 * every clock tick. That is a trap: react-flow diffs its `nodes` array by
 * object identity, so rewriting node data twice a second recreates every node
 * object and re-renders the entire canvas — at 500ms, forever, while the user
 * is trying to watch one node light up.
 *
 * Instead the `nodes` array stays completely stable during a run, and status
 * travels out-of-band through this context. Each node component is
 * `React.memo`'d and calls `useNodeRunStatus(id)` for its own status only.
 *
 * The provider is mounted by WorkflowCanvas, which subscribes to the runs
 * store ONCE and derives the whole map in a single `useMemo`. Node components
 * must never subscribe to the store themselves — one subscription per canvas,
 * not one per node. (There is also a hard repo rule behind this: a
 * `getSnapshot` that builds a fresh object per call white-screened this app
 * once, so per-node store reads are exactly the pattern to avoid.)
 */
import { createContext, useContext } from "react";
import type { RunStepStatus } from "@/automations/runModel";

export interface RunStatusValue {
  /** nodeId -> status for the run currently being displayed. */
  statusByNodeId: Record<string, RunStepStatus>;
  /** Edge ids on the active path, for the lime pulse. */
  activeEdgeIds: Set<string>;
  /** True while a run is in flight — drives the Run button's disabled state
   *  and the canvas's "don't edit mid-run" affordances. */
  isRunning: boolean;
}

const EMPTY_STATUS: RunStatusValue = {
  statusByNodeId: {},
  activeEdgeIds: new Set(),
  isRunning: false,
};

/** Module-constant default so a node rendered outside a provider (e.g. in
 *  isolation) degrades to "idle" rather than throwing. */
export const RunStatusContext = createContext<RunStatusValue>(EMPTY_STATUS);

/** Whole-canvas run state. Used by the canvas chrome and the Run button. */
export function useRunStatus(): RunStatusValue {
  return useContext(RunStatusContext);
}

/**
 * One node's status. Returns "idle" for any node the current run doesn't
 * mention — including notes and orphans, which never execute.
 */
export function useNodeRunStatus(nodeId: string): RunStepStatus {
  const { statusByNodeId } = useContext(RunStatusContext);
  return statusByNodeId[nodeId] ?? "idle";
}
