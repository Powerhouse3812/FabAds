/**
 * BuilderScreen — the canvas workflow editor at /automation/workflows/:id.
 *
 * Owns the chrome around WorkflowCanvas: the name field, auto-run + schedule
 * controls, the recommendation strips, Save, "Run (simulated)", and the run
 * log. The canvas itself owns node/edge state (local-first — see its header);
 * this screen reads that state through the handle the canvas registers, only
 * when Save is pressed.
 *
 * This is the lazy-loaded route chunk, which is where `@xyflow/react` (~50 kB
 * gz) and its stylesheet are confined — the Automations home and the rest of
 * the app never pay for them.
 *
 * TWO GATES, NOT ONE — AND THEY DISAGREE ON PURPOSE
 * -------------------------------------------------
 * AUTO-RUN is gated on `hasBlockers`. Arming a workflow that will fire
 * unattended every minute and do nothing is noise the user never sees coming,
 * so the switch refuses to turn on while any blocker stands.
 *
 * "Run (simulated)" is NOT gated on `hasBlockers`, and must not be. "Blocker"
 * covers THREE fates, not two, and Run answers each honestly instead of
 * refusing (see `recommendations.ts`'s `hasBlockers` doc, the agreed taxonomy):
 *   1. Refuses to start — no trigger or a cycle. `startRunSimulated` rejects
 *      these by name and surfaces a toast naming the reason.
 *   2. Starts, skips the broken step — a node with a `nodeConfigIssue` becomes
 *      a `skipped` step carrying that reason into the run log.
 *   3. Starts, runs the step, matches nothing — `impossible-condition`
 *      (e.g. a contradictory range). Neither refused nor skipped: it executes
 *      and honestly logs "0 of N matched".
 * Disabling the button on every blocker would remove the one control that
 * EXPLAINS a blocker, which is the run log.
 *
 * Because the two gates disagree, this screen states it rather than leaving the
 * user to reconcile "1 blocker" + a dead switch + a live Run button on their
 * own: the blocker strip carries one line saying which gate a blocker closes.
 * That line is the whole fix — delete it and the three controls silently go
 * back to telling three different stories about the same graph.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Info,
  Lightbulb,
  Play,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  setWorkflowEnabled,
  setWorkflowSchedule,
  updateWorkflowGraph,
  useWorkflowGraphs,
} from "@/automations/graphStore";
import { useWorkflowRuns } from "@/automations/runsStore";
import { runWorkflowWithFeedback } from "@/automations/runEngine";
import { describeAutoRunState } from "@/automations/autoRunner";
import {
  WorkflowCanvas,
  type WorkflowCanvasHandle,
} from "@/automations/canvas/WorkflowCanvas";
import type { RunStep } from "@/automations/runModel";
import { NODE_KIND_META, STATUS_TAG_LABELS, type WorkflowNode } from "@/automations/model";
import {
  analyseWorkflow,
  countRecommendations,
  hasBlockers,
  type RecommendationSeverity,
  type WorkflowRecommendation,
} from "@/automations/recommendations";
import { describeSchedule } from "@/workflows/core";
import { ScheduleEditor } from "@/creative-report/automations/components/ScheduleEditor";

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

/** Icon + text color per severity, used only for the derived-recommendation
 *  list — kept separate from the two hand-rolled `<span>` chip styles this
 *  file already has (accent / neutral), which stay reserved for the header's
 *  short mono tags. Coloring an icon isn't "a third chip", so this doesn't
 *  violate that rule. */
const SEVERITY_ICON: Record<RecommendationSeverity, typeof AlertOctagon> = {
  blocker: AlertOctagon,
  warning: AlertTriangle,
  suggestion: Lightbulb,
};

const SEVERITY_TEXT_CLASS: Record<RecommendationSeverity, string> = {
  blocker: "text-error-text",
  warning: "text-warning-text",
  suggestion: "text-muted-foreground",
};

const SEVERITY_NOUN: Record<RecommendationSeverity, string> = {
  blocker: "blocker",
  warning: "warning",
  suggestion: "suggestion",
};

export function BuilderScreen() {
  const { id } = useParams<{ id: string }>();
  const graphs = useWorkflowGraphs();
  const runs = useWorkflowRuns();

  // Derived with useMemo rather than a second store hook — graphStore exposes
  // exactly one hook by design (see its header).
  const graph = useMemo(() => graphs.find((g) => g.id === id) ?? null, [graphs, id]);
  const run = useMemo(() => runs.find((r) => r.workflowId === id) ?? null, [runs, id]);

  // Live findings about the graph the user actually built — recomputed only
  // when the graph reference changes (analyseWorkflow's own doc comment asks
  // for this; it walks the edge list several times per call).
  const recs = useMemo(() => (graph ? analyseWorkflow(graph) : []), [graph]);
  const counts = useMemo(() => countRecommendations(recs), [recs]);

  // Whether auto-run can actually arm right now, and why — read straight from
  // the shared function so this screen and the auto-runner itself can never
  // disagree about the same graph. `now` is captured once per graph change,
  // which is enough for a static builder screen (nothing here re-renders on a
  // ticking clock).
  const autoRunState = useMemo(
    () => (graph ? describeAutoRunState(graph, new Date()) : null),
    [graph],
  );

  const handleRef = useRef<WorkflowCanvasHandle | null>(null);
  const [dirty, setDirty] = useState(false);
  const [name, setName] = useState(graph?.name ?? "");
  const [nameEdited, setNameEdited] = useState(false);
  // Collapsed by default so a workflow with a pile of warnings/suggestions
  // doesn't shove the canvas down the page — but a graph that opens with a
  // blocker (can't run at all) expands automatically, since that's the one
  // case worth interrupting for. Lazy-init only; the user's manual toggle
  // afterwards is respected even as they fix things.
  const [checksExpanded, setChecksExpanded] = useState(() => hasBlockers(recs));

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

  // `autoRunState` is computed from the very same `graph` right above — it is
  // only ever `null` on a render where `graph` itself was null, which already
  // returned above. The fallback here is just to keep TypeScript happy
  // without an unsafe assertion.
  const autoRun = autoRunState ?? { armed: false, reason: "" };
  // Turning auto-run OFF is always allowed; turning it ON is refused while the
  // graph has a blocker, matching `describeAutoRunState` exactly — the switch
  // must never end up "on" over a workflow the auto-runner will skip, which is
  // the "an enabled switch that does nothing is a lie" rule this codebase
  // repeats. The Run button deliberately does NOT share this gate; see the
  // file header for why, and the strip below for where the user is told.
  const canEnable = graph.enabled || !hasBlockers(recs);

  const nodeById = new Map(graph.nodes.map((n) => [n.id, n] as const));
  /** Turns a recommendation's `nodeIds` into readable step names, so "which
   *  node is this about" doesn't require clicking into the canvas. Cheap
   *  lookup over a canvas-sized node list — no memo needed. */
  function describeNodes(nodeIds: string[]): string | null {
    if (nodeIds.length === 0) return null;
    const labels = nodeIds
      .map((nid) => nodeById.get(nid))
      .filter((n): n is WorkflowNode => n !== undefined)
      .map((n) => {
        const base = NODE_KIND_META[n.kind].label;
        if (n.data.kind === "markStatus") return `${base}: ${STATUS_TAG_LABELS[n.data.status]}`;
        if (
          (n.data.kind === "addToFolder" || n.data.kind === "syncFolderToAccounts") &&
          n.data.folderName
        ) {
          return `${base} ("${n.data.folderName}")`;
        }
        return base;
      });
    return labels.length > 0 ? labels.join(", ") : null;
  }

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
            // `isRunning` ONLY — deliberately not `|| hasBlockers(recs)`. The
            // engine refuses the three states that truly can't run and names
            // the reason; every other blocker produces an honest run whose log
            // is the best explanation of that blocker. File header, "TWO GATES".
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

      {/* Auto-run + schedule — a graph-level setting, applied immediately
          (no "unsaved" state, unlike the canvas edits Save commits). */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-1.5">
        <Switch
          checked={graph.enabled}
          disabled={!canEnable}
          onCheckedChange={(next) => {
            // Belt-and-suspenders: the switch is already `disabled` in this
            // case, but never let a stray event arm a blocked workflow.
            if (next && !canEnable) return;
            setWorkflowEnabled(graph.id, next);
          }}
          // `title` + a reason-bearing `aria-label` when disabled, matching
          // `OverviewScreen` and `WorkflowsScreen` exactly — a screen-reader
          // user hitting a dimmed switch must hear WHY, not just "dimmed", and
          // `autoRun.reason` is already the one sentence this screen trusts for
          // that (see `describeAutoRunState`, read at the top of this file).
          aria-label={canEnable ? "Auto-run this workflow" : `Auto-run this workflow — ${autoRun.reason}`}
          title={canEnable ? undefined : autoRun.reason}
        />
        <span className="shrink-0 text-xs font-medium text-foreground">Auto-run</span>
        <span
          className={cn(
            "shrink-0 rounded border px-1 font-mono text-[10px] uppercase tracking-wider",
            autoRun.armed ? "border-primary-text text-primary-text" : "border-border text-muted-foreground",
          )}
        >
          {autoRun.armed ? "armed" : "not armed"}
        </span>
        {autoRun.reason && (
          <span className="min-w-0 truncate text-[11px] text-muted-foreground" title={autoRun.reason}>
            {autoRun.reason}
          </span>
        )}

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-7 shrink-0 gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <CalendarClock className="h-3.5 w-3.5" />
              {describeSchedule(graph.schedule)}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <ScheduleEditor
              value={graph.schedule ?? {}}
              onChange={(schedule) => setWorkflowSchedule(graph.id, schedule)}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Derived recommendations — LIVE findings about the graph as built,
          not the template it started from (see recommendations.ts header).
          Collapsed by default once there's more than a nudge to say, so this
          never grows into a wall of text over the canvas, which is the point
          of this screen. */}
      <div className="shrink-0 border-b border-border px-4 py-2">
        {recs.length === 0 ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success-text" />
            <span>No issues found — this chain is clean.</span>
          </div>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => setChecksExpanded((v) => !v)}
              className="flex w-full items-center gap-3 text-left"
              aria-expanded={checksExpanded}
            >
              {(["blocker", "warning", "suggestion"] as const).map((sev) => {
                if (counts[sev] === 0) return null;
                const Icon = SEVERITY_ICON[sev];
                return (
                  <span
                    key={sev}
                    className={cn(
                      "flex items-center gap-1 text-xs",
                      sev === "blocker" ? "font-semibold" : "font-normal",
                      SEVERITY_TEXT_CLASS[sev],
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {counts[sev]} {SEVERITY_NOUN[sev]}
                    {counts[sev] === 1 ? "" : "s"}
                  </span>
                );
              })}
              <ChevronDown
                className={cn(
                  "ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
                  checksExpanded && "rotate-180",
                )}
              />
            </button>

            {/* The reconciliation line — see the file header's "TWO GATES".
                Outside the collapsed/expanded branch on purpose: the counts row
                is what claims "1 blocker", so the sentence qualifying that
                claim has to be readable without opening anything. Names all
                THREE fates a blocker can mean for Run (refuse to start / skip
                the step / run and match nothing) — a two-fate sentence was
                false for the impossible-condition case, per
                `recommendations.ts`'s `hasBlockers` doc. Named as a fragment
                list rather than one run-on sentence so it stays skimmable. */}
            {counts.blocker > 0 && (
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                Blockers keep auto-run off. Run still works — it refuses to start (no trigger,
                a loop), skips the broken step, or runs and matches nothing, and always says
                which.
              </p>
            )}

            {checksExpanded && (
              <ul className="mt-2 space-y-1.5">
                {recs.map((rec) => {
                  const Icon = SEVERITY_ICON[rec.severity];
                  const targets = describeNodes(rec.nodeIds);
                  return (
                    <li key={rec.id} className="flex gap-2">
                      <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", SEVERITY_TEXT_CLASS[rec.severity])} />
                      <p className="text-xs text-muted-foreground">
                        <span className={cn("font-medium", SEVERITY_TEXT_CLASS[rec.severity])}>
                          {rec.title}
                        </span>
                        {" — "}
                        {rec.detail}
                        {targets && <span className="text-muted-foreground/80"> ({targets})</span>}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Authored template notes — hand-written prose per template, kept
          verbatim (see recommendations.ts's header for why this is a
          separate thing from the derived list above). */}
      {graph.recommendations.length > 0 && (
        <div className="shrink-0 space-y-1.5 border-b border-border px-4 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Template notes
          </p>
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
