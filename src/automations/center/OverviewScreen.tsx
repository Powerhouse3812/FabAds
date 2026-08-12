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
 *   - Canvas workflows render NO switch. `WorkflowGraph.enabled` is reserved
 *     for unattended auto-run that this prototype does not ship (model.ts:128),
 *     so a working-looking switch would be a lie; the row states "Manual only"
 *     instead. Deliberately not describeSchedule() either — with no schedule it
 *     returns "Any time", which reads as armed (same call AutomationsHome:222).
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
import { useWorkflowGraphs } from "@/automations/graphStore";
import { NODE_KIND_META, type WorkflowGraph } from "@/automations/model";
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
  store: "rules" | "preview";
  rawId: string;
}

const RULE_ID_PREFIX = "creative-report-";
const WORKFLOW_ID_PREFIX = "workflows-";

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
  const workflowRows = useMemo<CenterRow[]>(
    () =>
      graphs.map((g) => ({
        id: `${WORKFLOW_ID_PREFIX}${g.id}`,
        module: "workflows" as const,
        kind: "workflow" as const,
        name: g.name,
        summary: chainSummary(g),
        // Nothing auto-fires in this module. See the header note on why this
        // is not describeSchedule().
        statusLine: "Manual only",
        enabled: g.enabled,
        // The graph `enabled` flag drives no runner, so no switch is offered.
        canToggle: false,
        preview: false,
        href: CENTER_MODULE_META.workflows.href,
        lastRunAt: g.lastRunAt,
      })),
    [graphs],
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

  const allRows = useMemo<CenterRow[]>(
    () => [...workflowRows, ...ruleRows, ...previewRows],
    [workflowRows, ruleRows, previewRows],
  );

  const toggleIndex = useMemo<Map<string, ToggleTarget>>(() => {
    const map = new Map<string, ToggleTarget>();
    for (const r of rules) map.set(`${RULE_ID_PREFIX}${r.id}`, { store: "rules", rawId: r.id });
    for (const a of preview.automations) map.set(a.id, { store: "preview", rawId: a.id });
    return map;
  }, [rules, preview]);

  const handleToggle = (rowId: string, next: boolean) => {
    const target = toggleIndex.get(rowId);
    if (!target) return;
    if (target.store === "rules") setRuleEnabled(target.rawId, next);
    else setPreviewEnabled(target.rawId, next);
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
          // Only rows with a REAL toggle count as "on". Workflow rows carry an
          // inert `enabled` the runner ignores — counting it would make the
          // strip claim armed automations the rows below explicitly disclaim
          // (monitor finding 2026-08-12).
          on: rows.filter((r) => r.canToggle && r.enabled).length,
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
  rows: CenterRow[];
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
  row: CenterRow;
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
          switch this line is the ONLY thing stating whether it runs. */}
      <div className="max-w-[7rem] shrink-0 text-right sm:max-w-[13rem]">
        <p className="truncate font-mono text-[11px] text-muted-foreground" title={row.statusLine}>
          {row.statusLine}
        </p>
        {lastRun && (
          <p className="truncate font-mono text-[10px] text-muted-foreground">{lastRun}</p>
        )}
      </div>

      {row.canToggle ? (
        <Switch
          checked={row.enabled}
          onCheckedChange={(v) => onToggle(row.id, v)}
          aria-label={row.enabled ? `Disable ${row.name}` : `Enable ${row.name}`}
        />
      ) : (
        // Keeps the switch column aligned without rendering a control that
        // would do nothing. The status line carries this row's state.
        <span className="block h-5 w-9 shrink-0" aria-hidden="true" />
      )}
    </li>
  );
}
