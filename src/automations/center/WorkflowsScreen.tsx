/**
 * WorkflowsScreen — /automation/workflows, the canvas-workflows home.
 *
 * Extracted out of the old two-tab `AutomationsHome` (see
 * `src/automations/AutomationsHome.tsx`, retired by the wiring wave) as its
 * own routed page under the Automation Center's sub-nav. The "Reporting
 * automations" tab that used to live alongside this moves to its own
 * sub-route; this screen keeps only what was under `tab === "workflows"`:
 * the benchmark template gallery, the workflow list, and the status-tags
 * panel fed by "Set status" steps.
 *
 * Kept verbatim from the source: `chainSummary` / `fmtWhen` helpers, class
 * names, copy ("Never run", delete confirm), the benchmark chips, and the
 * status-tags cap-at-8 behaviour. Changed deliberately: no tab strip (the
 * parent sub-nav now carries navigation between Workflows / Reporting /
 * etc.), the header copy is scoped to this page instead of describing the
 * whole former two-tab module, "Manual only" is gone (see `WorkflowRow`
 * below — it was only ever true before auto-run existed), and each row now
 * also surfaces `recommendations.ts`'s per-graph verdict as a compact badge.
 *
 * AUTO-RUN (Slack 2026-08-03 follow-up): `graphStore`'s `setWorkflowEnabled`
 * is the ONLY thing this screen writes for the switch — `describeAutoRunState`
 * (`@/automations/autoRunner`) is the single source of truth for whether a
 * graph is actually armed, and this file never re-derives that verdict. The
 * switch reflects the user's stored intent (`graph.enabled`); the reason line
 * next to it reflects whether that intent is currently honoured (blockers,
 * schedule window, or genuinely armed) — those two can legitimately disagree
 * (switch ON, reason says "N blockers to fix first"), and that disagreement
 * IS the honest state, not a bug to hide.
 *
 * BENCHMARK PROOF (same thread: "templates can surface as FabFunnel
 * benchmarks... shows value to the user"; Maalik's scope call: badge + proof
 * stats, no admin surface). `benchmarkProof()` below is illustrative demo
 * data ONLY — seeded from each template's own stable id via `hashString`
 * (never `Math.random`, so it's byte-identical on every reload and
 * `runDataAudit()` stays clean) — labelled inline as seeded so it can never
 * be mistaken for a live measurement, including in a cropped screenshot.
 */
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Play, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  cloneWorkflowFromTemplate,
  createWorkflow,
  deleteWorkflow,
  setWorkflowEnabled,
  useWorkflowGraphs,
} from "@/automations/graphStore";
import { describeAutoRunState } from "@/automations/autoRunner";
import {
  analyseWorkflow,
  countRecommendations,
} from "@/automations/recommendations";
import {
  SIMULATED_STATUS_NOTE,
  useWorkflowStatusTags,
} from "@/automations/statusStore";
import { getDataset } from "@/data/generator";
import { WORKFLOW_TEMPLATES } from "@/automations/templates";
import { runWorkflowWithFeedback } from "@/automations/runEngine";
import { useWorkflowRuns } from "@/automations/runsStore";
import { NODE_KIND_META, STATUS_TAG_LABELS, type WorkflowGraph } from "@/automations/model";
import { describeSchedule } from "@/workflows/core";
import { hashString } from "@/data/rng";

/** "Trigger → Condition → Add to folder" — the chain as prose, so a list row
 *  conveys shape without rendering a mini canvas. */
function chainSummary(graph: WorkflowGraph): string {
  const executable = graph.nodes.filter((n) => n.kind !== "note");
  if (executable.length === 0) return "Empty workflow";
  return executable.map((n) => NODE_KIND_META[n.kind].label).join(" → ");
}

/**
 * `lastRunAt` comes back off localStorage, so it can be any string at all — a
 * hand-edited profile produced the literal row text "Last run Invalid Date at
 * Invalid Date" in an adversarial pass. Guard the parse and fall back to the
 * never-run wording: claiming an unreadable timestamp is a run we can date is
 * worse than admitting we have none. Same guard `isoToMs` applies in
 * `autoRunner.ts` and `dayLabel` in `SyncHistoryScreen.tsx`.
 */
function fmtWhen(iso?: string): string {
  if (!iso) return "Never run";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Never run";
  return `Last run ${d.toLocaleDateString(undefined, { day: "numeric", month: "short" })} at ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
}

/** What each benchmark's proof stat is measuring, in words — keeps the
 *  number honest about WHAT improved, not just "it improved". Keyed by the
 *  template's own id (`templates.ts`, not owned by this file) so a template
 *  this map hasn't caught up to still gets a generic-but-true label instead
 *  of a build error. */
const TEMPLATE_OUTCOME_LABEL: Record<string, string> = {
  "wf-tpl-scale-winners": "ROAS on the scaled variations",
  "wf-tpl-retire-losers": "wasted spend caught before it compounded",
  "wf-tpl-fatigue-refresh": "creatives refreshed before the fatigue drop-off hit",
};

/**
 * Benchmark "proof" stats for a template card (Slack 2026-08-03: templates as
 * FabFunnel benchmarks should "show value to the user"). Maalik's scope call
 * was badge + proof stats, no admin surface — there is no Sahil-sir account
 * this actually reads from yet, so this is the whole implementation of that
 * ask for now.
 *
 * SEEDED, NOT MEASURED. `hashString` (never `Math.random` — repo rule, keeps
 * `runDataAudit()` deterministic) keyed on the template's own stable id, so
 * the numbers are byte-identical across reloads, screenshots, and the two
 * people looking at this in the same meeting. Ranges are deliberately modest
 * (tens/low-hundreds of workspaces, teens-to-30s percent) on purpose — a
 * suspiciously perfect number reads as fake before anyone even notices it's
 * seeded, which undermines the "worth adopting" pitch this exists for.
 *
 * The caller is responsible for labelling this as seeded RIGHT NEXT TO the
 * number — see the "seeded example" chip in the template card below. A
 * disclosure that only lives elsewhere on the page doesn't survive a cropped
 * screenshot, and this is exactly the kind of stat a leadership screenshot
 * would crop to.
 */
function benchmarkProof(templateId: string): { adoption: string; outcome: string } {
  const workspaces = 40 + (hashString(`${templateId}:adoption`) % 260); // 40-299
  const pct = 14 + (hashString(`${templateId}:outcome`) % 24); // 14-37
  const outcomeLabel = TEMPLATE_OUTCOME_LABEL[templateId] ?? "avg. improvement reported";
  return {
    adoption: `Used by ${workspaces} workspaces`,
    outcome: `+${pct}% ${outcomeLabel}`,
  };
}

export function WorkflowsScreen() {
  const graphs = useWorkflowGraphs();
  const runs = useWorkflowRuns();
  const statusTags = useWorkflowStatusTags();
  const navigate = useNavigate();

  // One instant for the whole render pass, handed to every row's
  // `describeAutoRunState` call — same discipline that function's own doc
  // comment asks for ("one pass, one timestamp"), so two rows in the same
  // render never get judged against a different "now". Cheap to recompute
  // per render; this screen already re-renders on every graphs/runs tick.
  const now = new Date();

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
          <h1 className="text-lg font-semibold text-foreground">Workflows</h1>
          <p className="text-sm text-muted-foreground">
            Multi-step chains built on the canvas — conditions, Genie, folders, ad accounts. Runs
            are simulated.
          </p>
        </div>
        <Button size="sm" className="shrink-0 gap-1.5" onClick={handleCreate}>
          <Plus className="h-3.5 w-3.5" />
          New workflow
        </Button>
      </header>

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
            {WORKFLOW_TEMPLATES.map((tpl) => {
              const proof = benchmarkProof(tpl.id);
              return (
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
                  <p className="mt-0.5 text-xs text-muted-foreground">{chainSummary(tpl)}</p>

                  {/* Proof stat: what makes a benchmark feel worth adopting.
                      The "seeded example" chip sits on the SAME line as the
                      number on purpose — a screenshot cropped to just this
                      stat still carries its own disclosure. */}
                  <div className="mt-2 flex flex-1 flex-wrap items-center gap-1.5">
                    <span className="shrink-0 rounded border border-border px-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      seeded example
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {proof.adoption} · {proof.outcome}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2.5 h-7 text-xs"
                    onClick={() => handleUseTemplate(tpl.id)}
                  >
                    Use template
                  </Button>
                </div>
              );
            })}
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
            // max-h + scroll, not a hard cap: unlike the status-tags feed
            // below, every row here is a workflow the user owns and can
            // run/delete — silently hiding rows past N the way the status
            // table does would take away access to their own data. A 20+-row
            // list scrolls inside a fixed-height panel instead of pushing the
            // whole page (and the templates above it) further down every time
            // one more workflow is added.
            <ul className="mt-2 max-h-[32rem] divide-y divide-border overflow-y-auto rounded-lg border border-border bg-card">
              {graphs.map((g) => (
                <WorkflowRow
                  key={g.id}
                  graph={g}
                  isRunning={runningWorkflowId === g.id}
                  now={now}
                  onRun={() => runWorkflowWithFeedback(g.id)}
                  onDelete={() => handleDelete(g)}
                />
              ))}
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
    </div>
  );
}

/**
 * One row of "Your workflows" — split out from the map above (rather than an
 * inline arrow) because it needs its own `useMemo` for `analyseWorkflow`,
 * whose doc comment requires memoisation ("wrap in useMemo keyed on the
 * graph... wasteful on every keystroke"). Calling a hook per-iteration inside
 * `graphs.map()` in the parent would violate the rules of hooks the moment
 * the list's length changes (add/delete a workflow); a per-row component
 * keeps each `useMemo` call's position stable within ITS OWN instance.
 *
 * `graphStore.ts` documents `useWorkflowGraphs()` as the only hook this store
 * exports — this component doesn't add a second one; it consumes the single
 * `graph` object its parent already read from that hook.
 */
function WorkflowRow({
  graph: g,
  isRunning,
  now,
  onRun,
  onDelete,
}: {
  graph: WorkflowGraph;
  isRunning: boolean;
  now: Date;
  onRun: () => void;
  onDelete: () => void;
}) {
  // Recommendations: this is a LIST — the full prose lives in the builder
  // (`recommendations.ts`'s doc comment: builder strip, list-row badge, and
  // later the Overview all read the same verdict). This row only needs the
  // counts, loudest severity first.
  const recs = useMemo(() => analyseWorkflow(g), [g]);
  const counts = useMemo(() => countRecommendations(recs), [recs]);

  // THE single source of truth for "is this actually armed right now" — see
  // the file header. Never re-derive enabled/schedule/blocker logic here.
  const autoState = useMemo(() => describeAutoRunState(g, now), [g, now]);

  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
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
          {/* Blockers loudest, then warnings, then suggestions — a clean
              workflow (0 total) renders no badge at all rather than a
              reassuring "0 issues", which would just be noise on every row.
              Links into the builder, same route as the name, because the
              detail (which node, why) lives on the canvas, not here. */}
          {counts.total > 0 && (
            <Link
              to={`/automation/workflows/${g.id}`}
              className={cn(
                "shrink-0 rounded border px-1 font-mono text-[10px] uppercase tracking-wider",
                counts.blocker > 0
                  ? "border-destructive text-destructive"
                  : "border-border text-muted-foreground",
              )}
              title={
                counts.blocker > 0
                  ? `${counts.blocker} blocker${counts.blocker === 1 ? "" : "s"} — open the builder to fix`
                  : `${counts.total} recommendation${counts.total === 1 ? "" : "s"} — open the builder to review`
              }
            >
              {counts.blocker > 0
                ? `${counts.blocker} blocker${counts.blocker === 1 ? "" : "s"}`
                : `${counts.total} tip${counts.total === 1 ? "" : "s"}`}
            </Link>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{chainSummary(g)}</p>
      </div>

      {/* F11 fix: status + switch + Run + delete used to sit as four flat,
          non-wrapping `shrink-0` siblings in a single row. That has a hard
          minimum width (~15rem status block + switch + Run + delete ≈ 415px)
          wider than a 375px viewport, so the `ul`'s horizontal scrollbar
          carried the switch and Run button off-screen — a control the user
          can't reach, which trades one defect (F11's own predecessor: a
          clipped disclosure) for a worse one (an unreachable control).
          This wrapper keeps status+controls together as ONE unit that stacks
          under the name row below `sm` (the `<li>`'s own `flex-col
          sm:flex-row`), and `flex-wrap` here lets the controls cluster drop
          to its own line under the status text specifically at widths where
          the two don't fit side by side (375px), while staying side by side
          wherever they do (500px+, where the combined width clears the
          viewport). `sm:contents` removes both nested divs from the box tree
          at `sm` and up so desktop renders the exact same flat 4-sibling flex
          row as before this fix — the reflow is completely inert whenever
          there's room for it; nothing here is a breakpoint-gated hide, only a
          reflow. Status text is STILL never truncated (see the paragraph's
          own comment below) — reflowing, not clipping, is what buys back the
          controls' reachability. */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:contents">
        {/* Always visible — NOT `hidden sm:block`. The switch below is always
            rendered, so hiding this block on narrow viewports left an armed
            switch with zero disclosure of what "armed" actually means. */}
        <div className="shrink-0 text-left sm:text-right">
          <p className="font-mono text-[11px] text-muted-foreground">{fmtWhen(g.lastRunAt)}</p>
          {/* Not armed: the exact `reason` from `describeAutoRunState`, verbatim.
              Armed: a compact form that MUST keep the in-page-clock clause.
              `describeSchedule` alone renders "Any time", which reads as a
              server-side 24/7 cron — the prototype has no server, and
              `autoRunner.ts` states the contract that an "Armed" badge implying
              otherwise "is the same lie as a switch that does nothing". The full
              sentence stays in `title`, but a hover-only disclosure is no
              disclosure: it is absent from every screenshot, and this screen gets
              screenshotted into decks.
              Deliberately NOT truncated — the disclosure is the tail of the
              string, so `truncate` would cut off exactly the part that has to
              survive. Wrapping costs a row a few pixels; that is the cheaper
              price (F11 above handles the OTHER cost this created — the
              controls getting pushed off-screen — by reflowing instead of
              re-truncating).
              F8 (audit finding): `OverviewScreen` renders the FULL sentence
              from `describeAutoRunState` verbatim; this row renders that same
              compact form when armed, `autoState.reason` verbatim otherwise.
              That is a deliberate density choice, not a bug — but it means the
              rendered STRING differs by design between the two screens even
              though the VERDICT (armed or not, on or off) cannot, because both
              screens call the exact same `describeAutoRunState(g, now)` and
              neither re-derives it. If a future pass notices the two screens
              "say different things" for the same graph, check whether the
              verdict actually disagrees (a real bug) before touching the
              wording here to match — matching the STRINGS is not the fix and
              was never the invariant either screen promises. */}
          <p
            className="mt-0.5 max-w-[15rem] font-mono text-[10px] leading-tight text-muted-foreground"
            title={autoState.reason}
          >
            {autoState.armed
              ? `Armed · ${describeSchedule(g.schedule)} · only while FabAds is open`
              : autoState.reason}
          </p>
        </div>

        {/* Controls grouped so they reflow onto their own line as a unit
            (switch, Run, delete never separate from each other) rather than
            each wrapping independently. */}
        <div className="flex shrink-0 items-center gap-2 sm:contents">
          {/* Reflects the user's stored intent (`g.enabled`), not
              `autoState.armed` — those two can legitimately disagree (switch ON,
              but today is outside the workflow's date range) and that disagreement
              belongs in the reason text, not hidden by tying the control to the
              derived verdict.
              Turning ON is refused while the graph has blockers, matching
              `BuilderScreen`'s identical guard. Both read the same
              `countRecommendations` figure, so the two surfaces cannot offer
              different answers about the same workflow — which is the whole point
              of `hasBlockers` being shared. Turning OFF is always allowed: a user
              must never be trapped with a workflow armed. */}
          <Switch
            checked={g.enabled}
            disabled={!g.enabled && counts.blocker > 0}
            onCheckedChange={(checked) => {
              // F10 fix: belt-and-suspenders alongside `disabled`, matching
              // the identical stray-event guard in `OverviewScreen.tsx:296`
              // and `BuilderScreen.tsx:294` — never let a stray event arm a
              // blocked workflow, even if `onCheckedChange` somehow fires
              // while the control is disabled.
              if (checked && counts.blocker > 0) return;
              setWorkflowEnabled(g.id, checked);
            }}
            aria-label={g.enabled ? `Turn off auto-run for ${g.name}` : `Turn on auto-run for ${g.name}`}
            title={autoState.reason}
            className="shrink-0"
          />

          <Button
            variant="outline"
            size="sm"
            className="h-7 shrink-0 gap-1 text-xs"
            disabled={isRunning}
            onClick={onRun}
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
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </li>
  );
}
