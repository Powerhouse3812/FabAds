/**
 * AutomationsHome — the top-level /automation landing screen.
 *
 * Two tabs, per Neeraj's proposal (Slack 2026-08-03): "automations apni
 * navigation me h ... automtions k under 2 tabs -> reporting automations and
 * integrated(full) workflows". The split reflects the vocabulary we settled:
 *
 *   Workflows   — multiple conditions, multiple modules, multiple actions
 *                 chained on a canvas. Built here.
 *   Reporting   — one condition set -> one action, a dead end. Those are the
 *   automations   Creative Report's existing rules, surfaced from the same
 *                 store (see ReportingAutomationsTab).
 *
 * Tab state is local `useState`, not a URL param — same call the Creative
 * Report's Automations screen made: it's presentational, not a shareable
 * location. The segmented pill control is copied from that screen so the two
 * surfaces read as one family.
 */
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Play, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  cloneWorkflowFromTemplate,
  createWorkflow,
  deleteWorkflow,
  useWorkflowGraphs,
} from "@/automations/graphStore";
import {
  SIMULATED_STATUS_NOTE,
  useWorkflowStatusTags,
} from "@/automations/statusStore";
import { getDataset } from "@/data/generator";
import { WORKFLOW_TEMPLATES } from "@/automations/templates";
import { runWorkflowWithFeedback } from "@/automations/runEngine";
import { useWorkflowRuns } from "@/automations/runsStore";
import { ReportingAutomationsTab } from "@/automations/ReportingAutomationsTab";
import { NODE_KIND_META, STATUS_TAG_LABELS, type WorkflowGraph } from "@/automations/model";

const TABS = [
  { key: "workflows", label: "Workflows" },
  { key: "reporting", label: "Reporting automations" },
] as const;
type Tab = (typeof TABS)[number]["key"];

/** "Trigger → Condition → Add to folder" — the chain as prose, so a list row
 *  conveys shape without rendering a mini canvas. */
function chainSummary(graph: WorkflowGraph): string {
  const executable = graph.nodes.filter((n) => n.kind !== "note");
  if (executable.length === 0) return "Empty workflow";
  return executable.map((n) => NODE_KIND_META[n.kind].label).join(" → ");
}

function fmtWhen(iso?: string): string {
  if (!iso) return "Never run";
  const d = new Date(iso);
  return `Last run ${d.toLocaleDateString(undefined, { day: "numeric", month: "short" })} at ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
}

export function AutomationsHome() {
  const [tab, setTab] = useState<Tab>("workflows");
  const graphs = useWorkflowGraphs();
  const runs = useWorkflowRuns();
  const statusTags = useWorkflowStatusTags();
  const navigate = useNavigate();

  // F1 fix: `markStatus` used to write tags that no surface anywhere read, so
  // two of three templates had an invisible payoff — the run log said "tagged
  // 3 as Loser" and nothing in the app ever showed it again. This is that
  // surface. Newest first; names resolved from the dataset so a tag never
  // renders as a bare id.
  const taggedRows = useMemo(() => {
    const byId = getDataset().creativeById;
    return Object.values(statusTags.byCreative)
      .slice()
      .sort((a, b) => (a.at < b.at ? 1 : -1))
      .map((rec) => ({ ...rec, creativeName: byId[rec.creativeId]?.name ?? null }));
  }, [statusTags]);

  const runningWorkflowId = useMemo(
    () => runs.find((r) => r.status === "running")?.workflowId ?? null,
    [runs],
  );

  const handleUseTemplate = (templateId: string) => {
    const id = cloneWorkflowFromTemplate(templateId);
    if (id) navigate(`/automation/workflows/${id}`);
  };

  const handleDelete = (g: WorkflowGraph) => {
    // Confirm because this is the only destructive control in the module and
    // there is no undo. Without it the list was append-only — "Use template"
    // three times left three rows a user could never remove.
    if (window.confirm(`Delete "${g.name}"? This can't be undone.`)) deleteWorkflow(g.id);
  };

  const handleCreate = () => {
    const id = createWorkflow({ name: "Untitled workflow" });
    navigate(`/automation/workflows/${id}`);
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Automations</h1>
          <p className="text-sm text-muted-foreground">
            Chain conditions and actions across modules, or manage the report's own rules.
            Everything here runs simulated — nothing is sent to a real ad account.
          </p>
        </div>
        {tab === "workflows" && (
          <Button size="sm" className="shrink-0 gap-1.5" onClick={handleCreate}>
            <Plus className="h-3.5 w-3.5" />
            New workflow
          </Button>
        )}
      </header>

      <div className="inline-flex items-center rounded-md border border-border bg-muted p-0.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-[5px] px-3 py-1.5 text-[13px] font-medium transition-colors",
              tab === t.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "reporting" ? (
        <ReportingAutomationsTab />
      ) : (
        <div className="space-y-5">
          {/* Templates. Neeraj: "templates bhi deskte h — as FabFunnel
              benchmarks, jo Sahil sir k account se set hoskte h". Badged as a
              benchmark, and honest that it's a starting point, not analysis of
              this account. */}
          <section>
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-medium text-foreground">Start from a benchmark</h2>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                set by FabFunnel
              </span>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {WORKFLOW_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  className="flex flex-col rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary-text" />
                    <span className="rounded border border-primary-text px-1 font-mono text-[10px] uppercase tracking-wider text-primary-text">
                      benchmark
                    </span>
                  </div>
                  <h3 className="mt-1.5 text-sm font-medium text-foreground">{tpl.name}</h3>
                  <p className="mt-0.5 flex-1 text-xs text-muted-foreground">
                    {chainSummary(tpl)}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2.5 h-7 text-xs"
                    onClick={() => handleUseTemplate(tpl.id)}
                  >
                    Use template
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-medium text-foreground">Your workflows</h2>
            {graphs.length === 0 ? (
              <div className="mt-2 rounded-lg border border-border bg-card px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">No workflows yet.</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Start from a benchmark above, or build one from scratch.
                </p>
              </div>
            ) : (
              <ul className="mt-2 divide-y divide-border rounded-lg border border-border bg-card">
                {graphs.map((g) => {
                  const isRunning = runningWorkflowId === g.id;
                  return (
                    <li key={g.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/automation/workflows/${g.id}`}
                            className="truncate text-sm font-medium text-foreground hover:underline"
                            title={g.name}
                          >
                            {g.name}
                          </Link>
                          {g.benchmark && (
                            <span className="shrink-0 rounded border border-primary-text px-1 font-mono text-[10px] uppercase text-primary-text">
                              benchmark
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {chainSummary(g)}
                        </p>
                      </div>

                      <div className="hidden shrink-0 text-right sm:block">
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {fmtWhen(g.lastRunAt)}
                        </p>
                        {/* NOT describeSchedule(): with no schedule set it
                            returns "Any time", which in a manual-run-only
                            module reads as "armed and waiting". Say what is
                            actually true instead. */}
                        <p className="font-mono text-[10px] text-muted-foreground">
                          Manual only
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 shrink-0 gap-1 text-xs"
                        disabled={isRunning}
                        onClick={() => runWorkflowWithFeedback(g.id)}
                      >
                        <Play className="h-3 w-3" />
                        {isRunning ? "Running…" : "Run"}
                      </Button>

                      <button
                        type="button"
                        className="shrink-0 rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive disabled:opacity-40"
                        disabled={isRunning}
                        title={isRunning ? "Can't delete a workflow while it's running" : "Delete workflow"}
                        aria-label={`Delete ${g.name}`}
                        onClick={() => handleDelete(g)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {taggedRows.length > 0 && (
            <section>
              <div className="flex items-baseline gap-2">
                <h2 className="text-sm font-medium text-foreground">Status tags from workflows</h2>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  simulated
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                What "Set status" steps have tagged — {SIMULATED_STATUS_NOTE}.
              </p>
              <ul className="mt-2 divide-y divide-border rounded-lg border border-border bg-card">
                {taggedRows.slice(0, 8).map((row) => (
                  <li key={row.creativeId} className="flex items-center gap-3 px-4 py-2">
                    <span
                      className="min-w-0 flex-1 truncate text-xs text-foreground"
                      title={row.creativeName ?? row.creativeId}
                    >
                      {/* A creative dropped from the dataset says so rather than
                          rendering a raw id as if it were a name. */}
                      {row.creativeName ?? "Creative no longer in the report"}
                    </span>
                    <span className="shrink-0 rounded border border-border px-1 font-mono text-[10px] text-muted-foreground">
                      {STATUS_TAG_LABELS[row.status]}
                    </span>
                    <span
                      className="hidden shrink-0 truncate font-mono text-[10px] text-muted-foreground sm:block sm:max-w-[14rem]"
                      title={row.workflowName}
                    >
                      {row.workflowName}
                    </span>
                  </li>
                ))}
              </ul>
              {taggedRows.length > 8 && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Showing the 8 most recent of {taggedRows.length}.
                </p>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
