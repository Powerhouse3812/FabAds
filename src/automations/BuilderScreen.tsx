/**
 * BuilderScreen — the canvas workflow editor at /automation/workflows/:id.
 *
 * Owns the chrome around WorkflowCanvas: the name field, the recommendation
 * strips, Save, "Run (simulated)", and the run log. The canvas itself owns
 * node/edge state (local-first — see its header); this screen reads that state
 * through the handle the canvas registers, only when Save is pressed.
 *
 * This is the lazy-loaded route chunk, which is where `@xyflow/react` (~50 kB
 * gz) and its stylesheet are confined — the Automations home and the rest of
 * the app never pay for them.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Info, Play, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { updateWorkflowGraph, useWorkflowGraphs } from "@/automations/graphStore";
import { useWorkflowRuns } from "@/automations/runsStore";
import { runWorkflowWithFeedback } from "@/automations/runEngine";
import {
  WorkflowCanvas,
  type WorkflowCanvasHandle,
} from "@/automations/canvas/WorkflowCanvas";
import type { RunStep } from "@/automations/runModel";

const STEP_STATUS_CLASS: Record<RunStep["status"], string> = {
  idle: "text-muted-foreground",
  running: "text-foreground",
  done: "text-primary-text",
  skipped: "text-muted-foreground",
};

const STEP_STATUS_LABEL: Record<RunStep["status"], string> = {
  idle: "Waiting",
  running: "Running",
  done: "Done",
  skipped: "Skipped",
};

export function BuilderScreen() {
  const { id } = useParams<{ id: string }>();
  const graphs = useWorkflowGraphs();
  const runs = useWorkflowRuns();

  // Derived with useMemo rather than a second store hook — graphStore exposes
  // exactly one hook by design (see its header).
  const graph = useMemo(() => graphs.find((g) => g.id === id) ?? null, [graphs, id]);
  const run = useMemo(() => runs.find((r) => r.workflowId === id) ?? null, [runs, id]);

  const handleRef = useRef<WorkflowCanvasHandle | null>(null);
  const [dirty, setDirty] = useState(false);
  const [name, setName] = useState(graph?.name ?? "");
  const [nameEdited, setNameEdited] = useState(false);

  const onReady = useCallback((h: WorkflowCanvasHandle) => {
    handleRef.current = h;
  }, []);

  const handleSave = useCallback(() => {
    if (!graph || !handleRef.current) return;
    updateWorkflowGraph(graph.id, {
      name: (nameEdited ? name : graph.name).trim() || "Untitled workflow",
      nodes: handleRef.current.getNodes(),
      edges: handleRef.current.getEdges(),
    });
    setDirty(false);
    toast({ title: "Workflow saved" });
  }, [graph, name, nameEdited]);

  if (!graph) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">This workflow no longer exists.</p>
          <Link to="/automation" className="mt-1 inline-block text-xs text-primary-text hover:underline">
            Back to Automations
          </Link>
        </div>
      </div>
    );
  }

  const isRunning = run?.status === "running";
  // Displayed name follows the store until the user actually types, so
  // reopening a renamed workflow shows the saved name rather than a stale one.
  const displayName = nameEdited ? name : graph.name;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-2.5">
        <Link
          to="/automation"
          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Back to Automations"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <Input
          value={displayName}
          onChange={(e) => {
            setNameEdited(true);
            setName(e.target.value);
            setDirty(true);
          }}
          className="h-8 max-w-xs border-transparent bg-transparent px-2 text-sm font-medium shadow-none hover:border-border focus-visible:border-border"
          aria-label="Workflow name"
        />

        {graph.benchmark && (
          <span className="shrink-0 rounded border border-primary-text px-1 font-mono text-[10px] uppercase tracking-wider text-primary-text">
            benchmark
          </span>
        )}
        {dirty && (
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-warning-text">
            unsaved
          </span>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={handleSave}>
            <Save className="h-3.5 w-3.5" />
            Save
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs"
            disabled={isRunning}
            onClick={() => {
              // Run reads the SAVED graph, so unsaved edits would run stale.
              // Saving first is less surprising than running the old version.
              if (dirty) handleSave();
              runWorkflowWithFeedback(graph.id);
            }}
          >
            <Play className="h-3.5 w-3.5" />
            {isRunning ? "Running…" : "Run (simulated)"}
          </Button>
        </div>
      </header>

      {/* Recommendation strips — graph-level prose, not canvas nodes. */}
      {graph.recommendations.length > 0 && (
        <div className="shrink-0 space-y-1.5 border-b border-border px-4 py-2">
          {graph.recommendations.map((rec, i) => (
            <div key={i} className="flex gap-2">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-text" />
              <p className="text-xs text-muted-foreground">{rec}</p>
            </div>
          ))}
        </div>
      )}

      {/* Canvas. `key` forces a clean remount when switching workflows, which is
          what makes the canvas's seed-state-once approach safe. */}
      <div className="min-h-0 flex-1">
        <WorkflowCanvas
          key={graph.id}
          graph={graph}
          onDirtyChange={setDirty}
          onReady={onReady}
        />
      </div>

      {/* Run log */}
      {run && (
        <div className="max-h-52 shrink-0 overflow-y-auto border-t border-border bg-muted/30 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-medium text-foreground">
              {run.status === "running"
                ? "Running"
                : run.status === "interrupted"
                  ? "Interrupted"
                  : "Last run"}
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              simulated
            </span>
            {run.status === "interrupted" && (
              <span className="text-[11px] text-muted-foreground">
                — the page reloaded mid-run, so remaining steps never ran
              </span>
            )}
          </div>

          <ul className="mt-1.5 space-y-1">
            {[...run.steps]
              // Skipped steps carry order -1 (they never got an execution
              // slot), so a naive numeric sort floats them ABOVE the trigger
              // and the log stops matching the canvas's reading order. Push
              // them to the end instead.
              .sort((a, b) => (a.order < 0 ? Infinity : a.order) - (b.order < 0 ? Infinity : b.order))
              .map((step) => (
                <li key={step.nodeId} className="flex items-baseline gap-2 text-xs">
                  <span
                    className={cn(
                      "w-16 shrink-0 font-mono text-[10px] uppercase tracking-wider",
                      STEP_STATUS_CLASS[step.status],
                    )}
                  >
                    {STEP_STATUS_LABEL[step.status]}
                  </span>
                  <span className="shrink-0 text-foreground">{step.label}</span>
                  {step.detail && (
                    <span className="min-w-0 truncate text-muted-foreground" title={step.detail}>
                      — {step.detail}
                      {step.status === "done" && step.effectApplied ? " (simulated)" : ""}
                    </span>
                  )}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
