import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ActivityTable } from "@/connector/components/ActivityTable";
import { auditRollup } from "@/connector/selectors";
import { MAX_AUDIT_ENTRIES } from "@/connector/auditStore";
import { CONNECTOR_MODULES, getAgentPreset } from "@/connector/catalogue";
import type {
  AgentKind,
  AuditOutcome,
  ConnectorAuditEntry,
  ConnectorModuleId,
} from "@/connector/model";

/**
 * ConnectorActivityView — the GLOBAL activity roll-up across every
 * connection, rendered as the content of the RIGHT PANE in the Connector
 * module's master-detail shell (260px connection rail on the left, this view
 * on the right). It is reached via the pinned "All activity" row at the top
 * of that rail, not as a standalone full-width page — the rail owns
 * navigation, so this component owns only local filter state and the CSV
 * export of whatever that state currently resolves to. Composes
 * `ActivityTable`.
 *
 * TWO EMPTY STATES, DELIBERATELY NOT ONE
 * "There is no activity yet" and "your filters matched nothing" are different
 * facts and conflating them is a lie in either direction: showing the
 * zero-history copy while a filter is silently hiding 40 rows tells the user
 * their app is idle when it isn't; showing the filtered copy on a genuinely
 * empty log invites them to go hunting for a filter that was never the
 * problem. So `entries.length === 0` (nothing has ever happened) and
 * `entries.length > 0 && filtered.length === 0` (the filters are why the
 * table is empty) get their own `emptyTitle` / `emptyDescription` passed
 * into `ActivityTable`, and only the second case surfaces "Clear filters" as
 * the way out.
 *
 * WHY `totalCount` IS THE PRE-SLICE LENGTH
 * `ActivityTable`'s own honesty footer ("Showing the 50 most recent of N
 * events") is only honest if N is the count of everything that matched the
 * current filters, before this component truncates to the first 50 rows for
 * render. Passing `pageEntries.length` (always <= 50) would make every
 * truncated result silently claim completeness — the exact failure this
 * whole feature exists to prevent. So `totalCount={filtered.length}` and
 * `entries={pageEntries}` are computed from the same filter pass and passed
 * as two different numbers on purpose.
 */

const PAGE_SIZE = 50;

const ALL = "all";
/** Sentinel for the module filter's "Account events" option — auth/config
 *  rows carry `moduleId: null`, which no real ConnectorModuleId can match. */
const ACCOUNT_EVENTS = "__account_events__";

type ModuleFilterValue = typeof ALL | typeof ACCOUNT_EVENTS | ConnectorModuleId;
type ResultFilterValue = typeof ALL | AuditOutcome;
type DateRangeValue = "24h" | "7d" | "30d" | "all";
/** Filters by WHICH agent kind (Claude, Cursor, ChatGPT, ...), not by WHICH
 *  connection — two Cursor connections on two laptops are two apps but one
 *  agent kind, and "show me everything Claude did" needs to collapse across
 *  connections the App filter deliberately keeps separate.
 *
 *  There is deliberately no separate "AI agents only" filter next to this
 *  one: every `ConnectorAuditEntry` is produced by an agent by construction
 *  (there is no non-agent caller in this model), so such a toggle would
 *  always match everything — a no-op control that silently does nothing and
 *  invites someone to "fix" it later into something that quietly hides rows.
 */
type AgentFilterValue = typeof ALL | AgentKind;

const RESULT_OPTIONS: { value: ResultFilterValue; label: string }[] = [
  { value: ALL, label: "All results" },
  { value: "allowed", label: "Done" },
  { value: "blocked_permission", label: "Blocked — no permission" },
  { value: "blocked_limit", label: "Blocked — limit" },
  { value: "error", label: "Failed" },
];

/** Kept in sync with ActivityTable's OUTCOME_CONFIG labels so the table and
 *  the exported CSV never disagree about what an outcome is called. */
const OUTCOME_CSV_LABEL: Record<AuditOutcome, string> = {
  allowed: "Done",
  blocked_permission: "Blocked — no permission",
  blocked_limit: "Blocked — limit reached",
  error: "Failed",
};

const DATE_RANGE_OPTIONS: { value: DateRangeValue; label: string }[] = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All time" },
];

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function sinceMsForRange(range: DateRangeValue, now: number): number | null {
  if (range === "24h") return now - 24 * 60 * 60 * 1000;
  if (range === "7d") return now - SEVEN_DAYS_MS;
  if (range === "30d") return now - 30 * 24 * 60 * 60 * 1000;
  return null;
}

/** Wraps a field in quotes and doubles internal quotes whenever it contains a
 *  comma, quote or newline — the three characters that would otherwise break
 *  a naive CSV row. */
function csvField(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/**
 * `detail` and `blockMessage` are two different facts and both have to reach
 * the file. `detail` is what the agent TRIED ("Tried to publish 'Winter Sale
 * — Prospecting'"); `blockMessage` is verbatim what FabAds TOLD it back. An
 * export that carried only the attempt would strip the refusal — the single
 * most useful column in an audit log, and the reason anyone exports one.
 */
function buildCsv(entries: ConnectorAuditEntry[]): string {
  const header = ["Time", "App", "Module", "Action", "Detail", "Result", "What the app was told"];
  const rows = entries.map((e) => [
    e.at,
    e.connectionName,
    e.moduleLabel ?? "Account events",
    e.actionLabel,
    e.detail,
    OUTCOME_CSV_LABEL[e.outcome],
    e.blockMessage ?? "",
  ]);
  return [header, ...rows].map((row) => row.map(csvField).join(",")).join("\n");
}

function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    URL.revokeObjectURL(url);
  }
}

interface StatTileProps {
  label: string;
  value: number;
  valueClassName: string;
  /** Sizing only — lets the caller wrap tiles with flexbox instead of a
   *  viewport-width grid, so they reflow against the pane's real width. */
  className?: string;
}

function StatTile({ label, value, valueClassName, className }: StatTileProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-card px-4 py-3", className)}>
      <div className={cn("text-2xl font-semibold tabular-nums", valueClassName)}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export interface ConnectorActivityViewProps {
  /** ALL entries, unfiltered, newest-first. */
  entries: ConnectorAuditEntry[];
  /** For the App filter options. */
  connections: { id: string; name: string }[];
  onRaiseLimit?: (entry: ConnectorAuditEntry) => void;
  /**
   * Optional and unused by this component itself — the master-detail rail
   * now owns navigation (this view renders inside the rail's detail pane,
   * reached from a pinned "All activity" row, and the rail's own connection
   * list is always visible alongside it, so there is nothing to go "back"
   * to). Retained only so callers that still mount `ConnectorActivityView`
   * standalone — outside the rail shell — don't have their prop shape broken.
   */
  onBack?: () => void;
  className?: string;
}

export function ConnectorActivityView({
  entries,
  connections,
  onRaiseLimit,
  className,
}: ConnectorActivityViewProps) {
  const [search, setSearch] = useState("");
  const [appId, setAppId] = useState<string>(ALL);
  const [agentFilter, setAgentFilter] = useState<AgentFilterValue>(ALL);
  const [moduleFilter, setModuleFilter] = useState<ModuleFilterValue>(ALL);
  const [resultFilter, setResultFilter] = useState<ResultFilterValue>(ALL);
  const [dateRange, setDateRange] = useState<DateRangeValue>(ALL);

  // Distinct agent kinds actually present in `entries`, labelled via the same
  // preset catalogue the connection wizard uses — so "Claude" here always
  // matches "Claude" everywhere else — and sorted for a stable, scannable
  // list instead of first-seen order (which would jitter as new events land).
  const agentOptions = useMemo(() => {
    const seen = new Set<AgentKind>();
    for (const e of entries) seen.add(e.agentKind);
    return Array.from(seen)
      .map((kind) => ({ value: kind, label: getAgentPreset(kind).label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [entries]);

  const isFiltered =
    search.trim() !== "" ||
    appId !== ALL ||
    agentFilter !== ALL ||
    moduleFilter !== ALL ||
    resultFilter !== ALL ||
    dateRange !== ALL;

  const clearFilters = () => {
    setSearch("");
    setAppId(ALL);
    setAgentFilter(ALL);
    setModuleFilter(ALL);
    setResultFilter(ALL);
    setDateRange(ALL);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sinceMs = sinceMsForRange(dateRange, Date.now());

    return entries.filter((e) => {
      if (appId !== ALL && e.connectionId !== appId) return false;

      if (agentFilter !== ALL && e.agentKind !== agentFilter) return false;

      if (moduleFilter === ACCOUNT_EVENTS) {
        if (e.moduleId !== null) return false;
      } else if (moduleFilter !== ALL) {
        if (e.moduleId !== moduleFilter) return false;
      }

      if (resultFilter !== ALL && e.outcome !== resultFilter) return false;

      if (sinceMs !== null) {
        const at = Date.parse(e.at);
        if (!Number.isFinite(at) || at < sinceMs) return false;
      }

      if (q) {
        // `blockMessage` is in the haystack on purpose: "limit reached" and
        // "isn't allowed to" only ever appear in the refusal, so leaving it
        // out would make the most obvious search anyone types on this screen
        // return nothing.
        const haystack =
          `${e.detail} ${e.connectionName} ${e.actionLabel} ${e.blockMessage ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [entries, appId, agentFilter, moduleFilter, resultFilter, dateRange, search]);

  const pageEntries = useMemo(() => filtered.slice(0, PAGE_SIZE), [filtered]);

  // Fixed 7-day window for the summary strip, independent of the filter bar —
  // it answers "how is this workspace doing lately", not "how do my current
  // filters look".
  const rollup = useMemo(() => auditRollup(entries, Date.now() - SEVEN_DAYS_MS), [entries]);

  const handleExport = () => {
    if (filtered.length === 0) return;
    const csv = buildCsv(filtered);
    downloadCsv(csv, `connector-activity-${Date.now()}.csv`);
  };

  const hasNoHistory = entries.length === 0;
  const emptyTitle = hasNoHistory ? "Nothing yet" : "No activity matches those filters";
  const emptyDescription = hasNoHistory
    ? "Activity shows up here the first time an app asks FabAds for something."
    : "Try widening the date range or clearing a filter.";

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Activity</h1>
            <p className="text-sm text-muted-foreground">
              Everything your connected apps have asked FabAds for.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={handleExport} disabled={filtered.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export these {filtered.length} events (CSV)
          </Button>
        </div>
      </div>

      {/* flex-wrap (not a viewport-width grid) so these reflow against the
          detail pane's actual width, not the browser's — a `sm:` breakpoint
          would still fire 4-up on a wide monitor even when this pane itself
          is narrow. */}
      <div className="flex flex-wrap gap-3">
        <StatTile
          className="min-w-[140px] flex-1"
          label="Done"
          value={rollup.allowed}
          valueClassName="text-muted-foreground"
        />
        <StatTile
          className="min-w-[140px] flex-1"
          label="Blocked (no permission)"
          value={rollup.blockedPermission}
          valueClassName={rollup.blockedPermission > 0 ? "text-warning-text" : "text-muted-foreground"}
        />
        <StatTile
          className="min-w-[140px] flex-1"
          label="Blocked (limit)"
          value={rollup.blockedLimit}
          valueClassName={rollup.blockedLimit > 0 ? "text-error-text" : "text-muted-foreground"}
        />
        <StatTile
          className="min-w-[140px] flex-1"
          label="Failed"
          value={rollup.error}
          valueClassName={rollup.error > 0 ? "text-error-text" : "text-muted-foreground"}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[160px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activity"
            className="pl-9"
          />
        </div>

        <Select value={appId} onValueChange={setAppId}>
          <SelectTrigger className="w-auto min-w-[120px]">
            <SelectValue placeholder="All apps" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All apps</SelectItem>
            {connections.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={agentFilter} onValueChange={(v) => setAgentFilter(v as AgentFilterValue)}>
          <SelectTrigger className="w-auto min-w-[130px]">
            <SelectValue placeholder="All agents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All agents</SelectItem>
            {agentOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={moduleFilter} onValueChange={(v) => setModuleFilter(v as ModuleFilterValue)}>
          <SelectTrigger className="w-auto min-w-[140px]">
            <SelectValue placeholder="All modules" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All modules</SelectItem>
            {CONNECTOR_MODULES.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.label}
              </SelectItem>
            ))}
            <SelectItem value={ACCOUNT_EVENTS}>Account events</SelectItem>
          </SelectContent>
        </Select>

        <Select value={resultFilter} onValueChange={(v) => setResultFilter(v as ResultFilterValue)}>
          <SelectTrigger className="w-auto min-w-[140px]">
            <SelectValue placeholder="All results" />
          </SelectTrigger>
          <SelectContent>
            {RESULT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRangeValue)}>
          <SelectTrigger className="w-auto min-w-[130px]">
            <SelectValue placeholder="All time" />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isFiltered && (
          <Button size="sm" variant="ghost" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      <ActivityTable
        showApp
        entries={pageEntries}
        totalCount={filtered.length}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        onRaiseLimit={onRaiseLimit}
      />

      <p className="text-xs text-muted-foreground">
        FabAds keeps the {MAX_AUDIT_ENTRIES} most recent events for this workspace.
      </p>
    </div>
  );
}
