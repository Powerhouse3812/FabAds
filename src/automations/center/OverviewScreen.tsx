/**
 * OverviewScreen — the Automation Center's landing page (/automation index).
 *
 * ONE CONSOLIDATED LIST (Neeraj, Slack 2026-08-03: "but one consolidated
 * list"). This replaces the old two-tab AutomationsHome landing, which split
 * workflows from reporting rules and had no way to see anything from Launch,
 * RRM or Genie at all. Here every module's automations sit in a single table,
 * grouped in CENTER_MODULES order, each group deep-linking to the sub-screen
 * that owns it.
 *
 * ADAPTERS, NOT ENRICHMENT: this screen builds `CenterRow[]` from three
 * sources — the canvas graph store, the Creative Report v3 rule store, and the
 * seeded preview store — and then renders rows. Per center/model.ts it never
 * reaches back into a module's store while rendering, so adding a fourth
 * module later means adding a fourth adapter, not touching the list.
 *
 * HONESTY, three separate claims kept distinct:
 *   - Preview rows (Launch / RRM / Genie) carry a visible "preview" chip on
 *     every row and a status line that says nothing fires. Their toggle
 *     persists in previewStore and arms nothing — the store's header is
 *     explicit that no runner exists behind them.
 *   - Canvas workflows are LIVE as of 2026-08-13 (`model.ts:172`,
 *     `autoRunner.ts`). `describeAutoRunState(graph, now)` — the auto-runner's
 *     own eligibility function — is the single source of truth for both the
 *     status line and the toggle here; this file never re-derives
 *     enabled/schedule/blocker logic, so it can never disagree with
 *     `WorkflowsScreen` or `BuilderScreen` about the same graph. The switch
 *     mirrors `BuilderScreen`'s `canEnable` gate: turning auto-run OFF is
 *     always allowed, turning it ON is refused while
 *     `hasBlockers(analyseWorkflow(graph))` — but as of the two-surfaces
 *     finding below, refused no longer means HIDDEN.
 *
 *   TWO REASONS A ROW CAN'T BE TOGGLED, kept distinct (audit finding,
 *   2026-08-13): this screen used to collapse them into one `canToggle`
 *   boolean, which made a blocked canvas workflow render exactly like a
 *   preview row with nothing behind it at all — same bare spacer, no
 *   disclosure. `WorkflowsScreen` (`disabled={!g.enabled && counts.blocker >
 *   0}`) and `BuilderScreen` both render a visible-but-disabled switch plus a
 *   reason for a blocked workflow; only this screen made the control vanish.
 *   A control that silently disappears teaches the user nothing, while a
 *   disabled control with a reason explains itself — so canvas-workflow rows
 *   now always render a switch (`canToggle: true`, unconditionally) and carry
 *   a separate `toggleDisabledReason` (below, a local extension of
 *   `CenterRow` — `center/model.ts` is not owned by this file, so the
 *   distinction lives here rather than as a new field on the shared type):
 *     1. nothing to toggle here (preview rows — no live store exists behind
 *        them at all) → `canToggle: true` still, same as today, a real
 *        working toggle into `previewStore` per that store's own contract
 *        ("preview rows may also toggle... but stay labeled preview",
 *        `model.ts:108-109`) — untouched by this pass.
 *     2. toggleable in principle, refused right now (`!g.enabled &&
 *        hasBlockers(...)`) → switch renders, `disabled`, `toggleDisabledReason`
 *        set to the auto-runner's own reason string. Never true for a preview
 *        row: a disabled switch reads as "this would work if you fixed
 *        something", which is false for a row with no runner behind it at all.
 *   - Creative Report rules are the one genuinely live toggle here: the switch
 *     writes to the same rulesStore the report itself reads, so a flip here
 *     shows up there. Their status line mirrors ReportingAutomationsTab's
 *     ruleStatusLine — an enabled rule that cannot fire says why.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { describeSchedule, scheduleState } from "@/workflows/core";
import { setWorkflowEnabled, useWorkflowGraphs } from "@/automations/graphStore";
import { NODE_KIND_META, type WorkflowGraph } from "@/automations/model";
import { describeAutoRunState } from "@/automations/autoRunner";
import { analyseWorkflow, hasBlockers } from "@/automations/recommendations";
import {
  setRuleEnabled,
  useAutomationRules,
} from "@/creative-report/automations/rulesStore";
import type { AutomationRule } from "@/creative-report/automations/model";
import {
  setPreviewEnabled,
  usePreviewAutomations,
} from "@/automations/center/previewStore";
import {
  CENTER_MODULES,
  CENTER_MODULE_META,
  KIND_LABELS,
  type AutomationKind,
  type CenterModuleKey,
  type CenterRow,
} from "@/automations/center/model";

/* ------------------------------------------------------------------ */
/*  Row-building helpers (pure — no store access, no clock reads)      */
/* ------------------------------------------------------------------ */

/** "Creative Report → Condition → Add to folder" — the chain as prose, so a
 *  list row conveys shape without rendering a mini canvas. Same treatment
 *  AutomationsHome:49 gives it; notes are annotations and never run, so they
 *  are excluded from the chain. */
function chainSummary(graph: WorkflowGraph): string {
  const executable = graph.nodes.filter((n) => n.kind !== "note");
  if (executable.length === 0) return "Empty workflow";
  return executable.map((n) => NODE_KIND_META[n.kind].label).join(" → ");
}

/** Mirrors ReportingAutomationsTab's actionSummary — kept inline rather than
 *  imported because that file exports a component, not these helpers, and the
 *  center must not depend on a sibling screen's internals. */
function actionSummary(rule: AutomationRule): string {
  if (rule.actions.length === 0) return "No action set";
  return rule.actions
    .map((a) =>
      a.type === "addToFolder"
        ? `File into "${a.folderName}"`
        : `Sync to ${a.accountIds.length} ad account${a.accountIds.length === 1 ? "" : "s"}`,
    )
    .join(" · ");
}

/** Mirrors ReportingAutomationsTab's ruleStatusLine. `now` is passed in so no
 *  clock is read below the component's own single read. */
function ruleStatusLine(rule: AutomationRule, now: Date): string {
  if (!rule.enabled) return "Off";
  if (!rule.autoRun) return "Manual runs only";
  const sched = scheduleState(rule.schedule, now);
  if (!sched.active) return sched.reason ?? "Out of schedule";
  return `Watching · ${describeSchedule(rule.schedule)}`;
}

function ruleSummary(rule: AutomationRule): string {
  const n = rule.conditions.length;
  return `${n} condition${n === 1 ? "" : "s"} · ${actionSummary(rule)}`;
}

/** Formats a stored ISO timestamp. `new Date(iso)` parses a persisted value —
 *  it is not a clock read. */
function fmtLastRun(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `Last run ${d.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
}

/* ------------------------------------------------------------------ */
/*  Filters                                                            */
/* ------------------------------------------------------------------ */

const FILTERS = [
  { key: "all", label: "All" },
  { key: "automation", label: "Automations" },
  { key: "workflow", label: "Workflows" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

/** Which store a row's switch writes to. Rows are id-prefixed per module
 *  (model.ts requires ids unique across modules), so the raw store id is kept
 *  here rather than recovered by string surgery at click time. */
interface ToggleTarget {
  store: "rules" | "preview" | "workflows";
  rawId: string;
}

const RULE_ID_PREFIX = "creative-report-";
const WORKFLOW_ID_PREFIX = "workflows-";

/** Local extension of `CenterRow` — carries WHY a row's switch is present but
 *  disabled. Lives here rather than on `center/model.ts`'s shared type
 *  (owned by another file) because no other reader of `CenterRow` needs it:
 *  `WorkflowsScreen`/`BuilderScreen` compute their own reason straight off
 *  the graph they already have in hand. Only this consolidated list renders
 *  a canvas workflow next to rows from other adapters and needs a field to
 *  carry that reason alongside the row itself.
 *  Undefined everywhere except a blocked-and-off canvas workflow — in
 *  particular always undefined on preview rows, which must never render a
 *  DISABLED switch (that implies "fix one thing and it works", false for a
 *  row with no runner behind it) or on rule rows (creative-report toggles
 *  are never refused). */
interface CenterRowView extends CenterRow {
  toggleDisabledReason?: string;
  /** Genuinely-running verdict, workflow rows only — `describeAutoRunState(g,
   *  now).armed`, carried through rather than re-derived (see file header:
   *  this screen never re-implements the auto-runner's eligibility rule).
   *  Undefined for rule/preview rows, which have no separate armed concept —
   *  their "on" is just `enabled`. Exists so the stats strip (below) can tell
   *  "switched on" from "actually running": a workflow can be `enabled: true`
   *  from before a later edit introduced a blocker, and the switch stays ON
   *  while the auto-runner has already stopped counting it. */
  armed?: boolean;
  /** Short single-line form of `statusLine` for the one case that is long by
   *  design and also the COMMON case — an armed, clean workflow's sentence
   *  (166 chars) exists to be read in full on hover/the builder, not to set
   *  every row's height in this dense cross-module list. Mirrors
   *  `WorkflowsScreen`'s "Armed · <schedule> · only while FabAds is open" —
   *  same clause, same reasoning: the in-page-clock disclosure is the one
   *  part of the long sentence that must survive, and this is it. Undefined
   *  for every other status (off, blocked, outside-window, rule rows,
   *  preview rows) — those render `statusLine` verbatim, wrapped instead of
   *  truncated, because none of them has one dominant common case to compact
   *  and all of them are the honest tail the audit finding was about. */
  compactStatusLine?: string;
}

/* ------------------------------------------------------------------ */

export function OverviewScreen() {
  const graphs = useWorkflowGraphs();
  const rules = useAutomationRules();
  const preview = usePreviewAutomations();
  const [filter, setFilter] = useState<FilterKey>("all");

  // Read once per render, not per row — and never inside a child's render
  // path. Precedent: ReportingAutomationsTab:55.
  const now = new Date();

  /* --- Adapter 1: canvas workflows -------------------------------- */
  // `describeAutoRunState`/`hasBlockers` are the auto-runner's and builder's
  // own verdict functions, called here verbatim and never re-implemented —
  // this list must not disagree with WorkflowsScreen or BuilderScreen about
  // the same graph (that exact disagreement was the shipped bug).
  const workflowRows = useMemo<CenterRowView[]>(
    () =>
      graphs.map((g) => {
        const autoState = describeAutoRunState(g, now);
        // Mirrors BuilderScreen's `canEnable`: turning auto-run OFF is always
        // reachable, turning it ON is refused while blocked — a blocked graph
        // was never armed, so there is no "already on" case to grandfather.
        const blocked = !g.enabled && hasBlockers(analyseWorkflow(g));
        return {
          id: `${WORKFLOW_ID_PREFIX}${g.id}`,
          module: "workflows" as const,
          kind: "workflow" as const,
          name: g.name,
          summary: chainSummary(g),
          // Verbatim from the single source of truth — armed, blocked, off,
          // or outside its date range, this is that function's own sentence.
          // Full text, kept even for the armed case (compactStatusLine below
          // covers the display) so `title` always carries the honest reason.
          statusLine: autoState.reason,
          enabled: g.enabled,
          // The stats strip's "on" count needs the auto-runner's own verdict,
          // not the raw switch — see the field's doc comment above.
          armed: autoState.armed,
          // Armed-and-clean is the one status with a single dominant shape
          // (166 chars, same sentence on every armed graph bar the schedule
          // clause) and the common case in a healthy demo account, so it gets
          // a compact one-liner instead of setting this row's height off a
          // sentence built to be read in full elsewhere. Every other status
          // (off, blocked, outside-window) keeps `compactStatusLine`
          // undefined and falls through to rendering `statusLine` wrapped.
          compactStatusLine: autoState.armed
            ? `Armed · ${describeSchedule(g.schedule)} · only while FabAds is open`
            : undefined,
          // Always rendered now — see the file header's "two reasons" note.
          // A canvas workflow always has something behind it in principle
          // (unlike a preview row), so refusal is expressed as `disabled`,
          // never as hiding the control outright.
          canToggle: true,
          toggleDisabledReason: blocked ? autoState.reason : undefined,
          preview: false,
          href: CENTER_MODULE_META.workflows.href,
          lastRunAt: g.lastRunAt,
        };
      }),
    [graphs, now],
  );

  /* --- Adapter 2: Creative Report v3 rules ------------------------- */
  // `now` is a fresh Date each render, so this memo recomputes every render by
  // design — status lines are clock-dependent and a stale "Watching" would be
  // exactly the kind of confident-but-wrong state line the module forbids.
  const ruleRows = useMemo<CenterRow[]>(
    () =>
      rules.map((r) => ({
        id: `${RULE_ID_PREFIX}${r.id}`,
        module: "creative-report" as const,
        kind: "automation" as const,
        name: r.name,
        summary: ruleSummary(r),
        statusLine: ruleStatusLine(r, now),
        enabled: r.enabled,
        canToggle: true,
        preview: false,
        href: CENTER_MODULE_META["creative-report"].href,
        lastRunAt: r.lastRunAt,
      })),
    [rules, now],
  );

  /* --- Adapter 3: seeded preview rows ------------------------------ */
  const previewRows = useMemo<CenterRow[]>(
    () =>
      preview.automations.map((a) => ({
        id: a.id,
        module: a.module,
        kind: a.kind,
        name: a.name,
        summary: a.summary,
        // The switch below persists, but there is no runner behind these rows
        // and the line says so rather than borrowing "Watching" from a real one.
        statusLine: "Preview · nothing fires",
        enabled: a.enabled,
        canToggle: true,
        preview: true,
        href: CENTER_MODULE_META[a.module].href,
      })),
    [preview],
  );

  const allRows = useMemo<CenterRowView[]>(
    () => [...workflowRows, ...ruleRows, ...previewRows],
    [workflowRows, ruleRows, previewRows],
  );

  const toggleIndex = useMemo<Map<string, ToggleTarget>>(() => {
    const map = new Map<string, ToggleTarget>();
    for (const r of rules) map.set(`${RULE_ID_PREFIX}${r.id}`, { store: "rules", rawId: r.id });
    for (const a of preview.automations) map.set(a.id, { store: "preview", rawId: a.id });
    for (const g of graphs) map.set(`${WORKFLOW_ID_PREFIX}${g.id}`, { store: "workflows", rawId: g.id });
    return map;
  }, [rules, preview, graphs]);

  const handleToggle = (rowId: string, next: boolean) => {
    const target = toggleIndex.get(rowId);
    if (!target) return;
    if (target.store === "rules") {
      setRuleEnabled(target.rawId, next);
    } else if (target.store === "preview") {
      setPreviewEnabled(target.rawId, next);
    } else {
      // Belt-and-suspenders, same guard BuilderScreen keeps alongside its own
      // `disabled` switch: the row already renders this control disabled for
      // a blocked+off graph (so onCheckedChange shouldn't fire at all), but
      // never let a stray event arm one anyway.
      const graph = graphs.find((g) => g.id === target.rawId);
      if (next && graph && hasBlockers(analyseWorkflow(graph))) return;
      setWorkflowEnabled(target.rawId, next);
    }
  };

  /** Per-module counts for the stats strip — computed off the UNFILTERED rows
   *  so the strip always describes what exists, not what the pill is showing.
   *  Modules with nothing to show are omitted entirely. */
  const moduleStats = useMemo(
    () =>
      CENTER_MODULES.map((key) => {
        const rows = allRows.filter((r) => r.module === key);
        return {
          key,
          total: rows.length,
          // "On" means genuinely running, not merely switched on — a
          // corrected reading of the same "only rows with a REAL toggle
          // count" intent this comment used to state. For workflow rows,
          // `r.armed` (carried straight from `describeAutoRunState`, never
          // re-derived here) is that verdict, and it can disagree with
          // `r.enabled`: a graph switched on before a later edit introduced a
          // blocker keeps `enabled: true` while the auto-runner has already
          // stopped counting it — the case the old comment missed, since it
          // reasoned only about the blocked-AND-off half (where `enabled` is
          // indeed already false) and not the blocked-AND-on half. Rule and
          // preview rows have no separate armed concept, so `r.armed` is
          // undefined for them and this falls back to `r.enabled`, unchanged.
          on: rows.filter((r) => r.canToggle && (r.armed ?? r.enabled)).length,
          preview: CENTER_MODULE_META[key].preview,
        };
      }).filter((s) => s.total > 0),
    [allRows],
  );

  /** Grouped + filtered. CENTER_MODULES order is display order everywhere, so
   *  the groups are built by walking that tuple rather than sorting. */
  const groups = useMemo(
    () =>
      CENTER_MODULES.map((key) => ({
        key,
        rows: allRows.filter((r) => r.module === key && (filter === "all" || r.kind === filter)),
      })).filter((g) => g.rows.length > 0),
    [allRows, filter],
  );

  const visibleCount = groups.reduce((sum, g) => sum + g.rows.length, 0);
  const activeFilterLabel = FILTERS.find((f) => f.key === filter)?.label ?? "All";

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 p-6">
      <header>
        <h1 className="text-lg font-semibold text-foreground">Automation Center</h1>
        <p className="text-sm text-muted-foreground">
          Every chain and rule across your modules, in one list. Everything here runs
          simulated — nothing is sent to a real ad account.
        </p>
      </header>

      {/* Per-module counts, each a deep link into the sub-screen that owns
          those rows. Only modules that actually contribute rows appear. */}
      {moduleStats.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {moduleStats.map((stat) => {
            const meta = CENTER_MODULE_META[stat.key];
            const Icon = meta.icon;
            return (
              <Link
                key={stat.key}
                to={meta.href}
                title={stat.preview ? `${meta.blurb} — preview, nothing fires` : meta.blurb}
                className="group flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2 transition-colors hover:border-primary-text"
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary-text" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-foreground">{meta.label}</p>
                  {/* The strip is the first thing on the page and screenshots
                      crop — the preview disclosure must survive on the chip
                      itself, not only on the rows below. */}
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {stat.total} · {stat.on} on
                    {stat.preview && " · preview"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* The written-recommendation surface Neeraj asked for. Static advice —
          honest as guidance, and it claims no analysis of this account. */}
      <div className="flex gap-2 rounded-lg border border-primary-text/30 bg-card p-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary-text" />
        <div className="text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Recommended when you run multiple niches</p>
          <p className="mt-0.5">
            Add a brand or naming condition to each rule — otherwise creatives from different
            products can be filed into the same folder.
          </p>
        </div>
      </div>

      {allRows.length === 0 ? (
        <div className="rounded-lg border border-border bg-card px-4 py-12 text-center">
          <p className="text-sm text-muted-foreground">No automations yet.</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Build a chain on the canvas, or add a rule in the Creative Report.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center rounded-md border border-border bg-muted p-0.5">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  aria-pressed={filter === f.key}
                  className={cn(
                    "rounded-[5px] px-3 py-1.5 text-[13px] font-medium transition-colors",
                    filter === f.key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {visibleCount} of {allRows.length} shown
            </p>
          </div>

          {visibleCount === 0 ? (
            <div className="rounded-lg border border-border bg-card px-4 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Nothing matches “{activeFilterLabel}”.
              </p>
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="mt-1 text-xs text-primary-text hover:underline"
              >
                Show all
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {groups.map((group) => {
                const meta = CENTER_MODULE_META[group.key];
                const Icon = meta.icon;
                return (
                  <ModuleGroup
                    key={group.key}
                    moduleKey={group.key}
                    label={meta.label}
                    href={meta.href}
                    Icon={Icon}
                    rows={group.rows}
                    onToggle={handleToggle}
                  />
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Rendering pieces                                                   */
/* ------------------------------------------------------------------ */

/** A module's header row plus its rows. Returns a fragment so every <li> stays
 *  a direct child of the one <ul> — the consolidated list is a single
 *  divide-y table, not a stack of cards. */
function ModuleGroup({
  moduleKey,
  label,
  href,
  Icon,
  rows,
  onToggle,
}: {
  moduleKey: CenterModuleKey;
  label: string;
  href: string;
  Icon: (typeof CENTER_MODULE_META)[CenterModuleKey]["icon"];
  rows: CenterRowView[];
  onToggle: (rowId: string, next: boolean) => void;
}) {
  return (
    <>
      <li className="flex items-center gap-2 bg-muted/50 px-4 py-1.5">
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="font-mono text-[10px] uppercase tracking-wider text-foreground">
          {label}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">{rows.length}</span>
        <Link
          to={href}
          className="ml-auto inline-flex shrink-0 items-center gap-0.5 text-[11px] text-primary-text hover:underline"
        >
          Open
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </li>
      {rows.map((row) => (
        <CenterRowItem key={`${moduleKey}-${row.id}`} row={row} onToggle={onToggle} />
      ))}
    </>
  );
}

function CenterRowItem({
  row,
  onToggle,
}: {
  row: CenterRowView;
  onToggle: (rowId: string, next: boolean) => void;
}) {
  const lastRun = fmtLastRun(row.lastRunAt);

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Link
            to={row.href}
            className="truncate text-sm font-medium text-foreground hover:underline"
            title={row.name}
          >
            {row.name}
          </Link>
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {KIND_LABELS[row.kind]}
          </span>
          {/* Non-negotiable: a seeded row must never read as a live one. */}
          {row.preview && (
            <span
              className="shrink-0 rounded border border-border px-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
              title="Seeded example — this module has no live automation store yet"
            >
              preview
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground" title={row.summary}>
          {row.summary}
        </p>
      </div>

      {/* Always rendered, never hidden at narrow widths: on a row with no
          switch this line is the ONLY thing stating whether it runs.
          F3: `truncate` at the old 13rem clipped every canvas-workflow
          reason to ~31 characters — off (61 chars), blocked (~115, loses the
          "Press Run" clause), armed (166, loses the in-page-clock
          disclosure entirely) all rendered honest text nowhere but `title`.
          Same doctrine `WorkflowsScreen` states: "a hover-only disclosure is
          no disclosure — it is absent from every screenshot", and
          "`truncate` would cut off exactly the part that has to survive."
          Fix, without making every row in this cross-module list tall for
          one module's long strings: the armed case (the single dominant
          shape, and the longest string) gets a short compact line from the
          adapter (`compactStatusLine`, matching WorkflowsScreen's own
          "Armed · <schedule> · only while FabAds is open"). NEITHER case
          gets `truncate`, though — measured in-browser, even the compact
          46-char armed line clips at this column's width (`scrollWidth` 290
          vs `clientWidth` 240px), losing the tail of "only while FabAds is
          open", the exact clause this fix exists to keep on screen. So both
          the compact and full forms wrap instead: `whitespace-normal`, no
          `truncate` at all, same as `WorkflowsScreen`'s own reason column
          (which never truncates this text either — it wraps). Every status
          renders `statusLine` (or the compact form) verbatim, so the tail
          survives without hover. Widened to 15rem (matching
          `WorkflowsScreen`'s own reason column) so the honest text needs
          fewer wrapped lines; only a row whose reason is genuinely long
          grows past one line, not the whole list. */}
      <div className="max-w-[7rem] shrink-0 text-right sm:max-w-[15rem]">
        <p
          className="whitespace-normal font-mono text-[11px] leading-tight text-muted-foreground"
          title={row.statusLine}
        >
          {row.compactStatusLine ?? row.statusLine}
        </p>
        {lastRun && (
          <p className="truncate font-mono text-[10px] text-muted-foreground">{lastRun}</p>
        )}
      </div>

      {row.canToggle ? (
        <Switch
          checked={row.enabled}
          // The one place this row differs from every other toggle here: a
          // blocked-and-off canvas workflow renders disabled rather than
          // vanishing (see file header). `title` carries the same reason
          // string `describeAutoRunState` already put in the status line —
          // never a second, possibly-drifting explanation.
          disabled={!!row.toggleDisabledReason}
          onCheckedChange={(v) => onToggle(row.id, v)}
          aria-label={
            row.toggleDisabledReason
              ? `${row.name} — ${row.toggleDisabledReason}`
              : row.enabled
                ? `Disable ${row.name}`
                : `Enable ${row.name}`
          }
          title={row.toggleDisabledReason}
        />
      ) : (
        // Keeps the switch column aligned without rendering a control that
        // would do nothing. The status line carries this row's state. As of
        // this pass no adapter here actually produces canToggle: false — a
        // blocked canvas workflow now renders disabled instead (above) and
        // preview rows have always had a real toggle into previewStore — but
        // the fallback stays for whatever a future adapter with genuinely
        // nothing to toggle needs.
        <span className="block h-5 w-9 shrink-0" aria-hidden="true" />
      )}
    </li>
  );
}
