import { useMemo, useState, type KeyboardEvent } from "react";
import { format, formatDistanceToNowStrict } from "date-fns";
import { ChevronRight, Infinity as InfinityIcon, Search, SearchX, Unplug } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AgentAvatar } from "@/connector/components/AgentAvatar";
import { ConnectorStatusPill } from "@/connector/components/ConnectorStatusPill";
import { CONNECTOR_MODULE_IDS, METER_IDS, getAgentPreset } from "@/connector/catalogue";
import {
  accessSummaryLine,
  connectionHealth,
  enabledModuleCount,
  hasAnyWriteAccess,
  isOverAnyLimit,
  limitStatus,
} from "@/connector/selectors";
import type { ConnectorConnection } from "@/connector/model";

/**
 * ConnectionsList — the master list for the Connector (AI access) module.
 *
 * Presentational + local UI state ONLY. All business logic (health, access
 * summary, limit state) is delegated to `src/connector/selectors.ts` — this
 * file never re-derives a rule the store/selectors already own.
 *
 * THREE DECISIONS WORTH KNOWING BEFORE YOU EDIT THIS FILE
 *
 * 1. PROGRESSIVE CONTROLS, KEYED OFF LIST SIZE (Hick's law).
 *    - 0 connections  → the first-run empty state. No table, no search/filter
 *      row — there is nothing yet to search or filter.
 *    - 1–7            → table only. A search box and a status filter sitting
 *      above a single row is pure chrome with nothing to do; it is a cost
 *      (one more thing to read, one more decision) paid by every viewer for a
 *      capability almost none of them need at this size.
 *    - ≥8             → search (name + agent label) and a status filter
 *      appear, because at this size scanning stops being cheaper than typing.
 *    - >25 AFTER filtering → paginate at 25. Pagination is keyed off the
 *      FILTERED count, not the raw count, so narrowing a large list back down
 *      below the threshold correctly collapses the pager instead of leaving a
 *      single-page control sitting there for no reason.
 *
 * 2. THE ZERO-MODULE METER NEVER RENDERS AN EMPTY TRACK.
 *    A 0-of-9 progress bar with nothing filled in is visually indistinguishable
 *    from a bar that hasn't finished loading yet — the single most common way
 *    this exact cell ships as a bug. "No access" is rendered as a dashed
 *    outline chip instead: a track can be empty, a permission set cannot look
 *    like it's still loading. The two other cases get their own honest words
 *    too — "Full access" instead of "9 of 9" (nobody counts to nine to
 *    confirm it means everything), and "{n} of 9" for everything in between.
 *
 * 3. THERE IS NO SECOND "ADD MANUALLY" BUTTON NEXT TO "CONNECT AN APP".
 *    Two front doors for the same job is a Hick's-law cost every visitor pays
 *    (one more choice to parse) to serve the handful of people who want to
 *    paste a token by hand. Manual entry still exists — it is the last tile
 *    inside the `onConnect` wizard, one click deeper instead of a second
 *    button competing for attention at the top of the page.
 */

export interface ConnectionsListProps {
  connections: ConnectorConnection[];
  onOpen: (id: string) => void;
  onConnect: () => void;
  className?: string;
}

const SEARCH_FILTER_THRESHOLD = 8;
const PAGE_SIZE = 25;
const APP_NAME_TRUNCATE = 34;
const TOTAL_MODULES = CONNECTOR_MODULE_IDS.length;

type StatusFilterValue = "all" | "active" | "needs_attention" | "revoked";

const STATUS_FILTER_OPTIONS: { value: StatusFilterValue; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "needs_attention", label: "Needs attention" },
  { value: "revoked", label: "Revoked" },
];

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/**
 * "Needs attention" bucket for the status filter — everything that is
 * neither cleanly `active` nor `revoked`: pending, expired, over its limit,
 * a broken grant, or wired up with no access at all. `isOverAnyLimit` is
 * checked explicitly alongside `connectionHealth` (whose own precedence list
 * already folds it in) so the filter's intent reads plainly at the call site
 * rather than depending on knowing the health resolver's internal order.
 */
function isNeedsAttention(c: ConnectorConnection, now: number): boolean {
  if (isOverAnyLimit(c, now)) return true;
  const health = connectionHealth(c, now);
  return health !== "active" && health !== "revoked";
}

function matchesStatusFilter(
  c: ConnectorConnection,
  filter: StatusFilterValue,
  now: number,
): boolean {
  if (filter === "all") return true;
  if (filter === "revoked") return connectionHealth(c, now) === "revoked";
  if (filter === "active") return connectionHealth(c, now) === "active";
  return isNeedsAttention(c, now);
}

function matchesSearch(c: ConnectorConnection, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const preset = getAgentPreset(c.agentKind);
  return c.name.toLowerCase().includes(q) || preset.label.toLowerCase().includes(q);
}

/** null `lastActiveAt` always sinks to the bottom — a connection that has
 *  never done anything is the least useful row to see first. */
function compareByLastActiveDesc(a: ConnectorConnection, b: ConnectorConnection): number {
  if (a.lastActiveAt === null && b.lastActiveAt === null) return 0;
  if (a.lastActiveAt === null) return 1;
  if (b.lastActiveAt === null) return -1;
  return Date.parse(b.lastActiveAt) - Date.parse(a.lastActiveAt);
}

/**
 * A connection is "Unlimited" when it can actually change or spend something
 * AND every one of its four limit rules is off — the one combination that
 * genuinely costs money and is otherwise invisible anywhere in the UI.
 * Routed entirely through `limitStatus` (rather than reading
 * `c.limits.rules[id].enabled` directly) so this stays correct if the
 * selector's definition of "off" ever grows beyond a flat boolean.
 */
function isUnlimited(c: ConnectorConnection, now: number): boolean {
  if (!hasAnyWriteAccess(c)) return false;
  return METER_IDS.every((id) => limitStatus(c, id, now).state === "off");
}

/* ------------------------------------------------------------------ */
/*  Header                                                             */
/* ------------------------------------------------------------------ */

function ConnectionsHeader({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Connector</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Let an AI assistant read your FabAds data and act on it — you choose exactly what it
          can see and do.
        </p>
      </div>
      <Button onClick={onConnect}>Connect an app</Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty / no-match states                                            */
/* ------------------------------------------------------------------ */

function ConnectionsEmptyState({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-20 text-center">
      <Unplug className="h-10 w-10 text-muted-foreground/40" />
      <div className="max-w-md">
        <h3 className="text-sm font-medium text-foreground">No AI apps connected</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Connect Claude, ChatGPT, Cursor or any tool that speaks MCP, and ask it things like
          "which adsets spent the most last week?" — in plain English. You choose exactly what it
          can see and do.
        </p>
      </div>
      <Button size="sm" onClick={onConnect}>
        Connect an app
      </Button>
    </div>
  );
}

function NoMatchState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-16 text-center">
      <SearchX className="h-8 w-8 text-muted-foreground/40" />
      <h3 className="text-sm font-medium text-foreground">No connections match that</h3>
      <Button size="sm" variant="outline" onClick={onClear}>
        Clear filters
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Cells                                                              */
/* ------------------------------------------------------------------ */

function AccessMeter({ connection }: { connection: ConnectorConnection }) {
  const count = enabledModuleCount(connection);

  if (count === 0) {
    return (
      <span className="inline-flex w-fit items-center rounded-md border border-dashed border-border px-2 py-1 text-xs text-muted-foreground">
        No access
      </span>
    );
  }

  const pct = Math.round((count / TOTAL_MODULES) * 100);
  const label = count === TOTAL_MODULES ? "Full access" : `${count} of ${TOTAL_MODULES}`;

  return (
    <div className="flex items-center gap-2">
      <div
        role="progressbar"
        aria-valuenow={count}
        aria-valuemin={0}
        aria-valuemax={TOTAL_MODULES}
        aria-label={accessSummaryLine(connection)}
        className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="whitespace-nowrap text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function UnlimitedChip() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-warning-text/25 bg-warning-text/10 px-2 py-0.5 text-[11px] font-medium text-warning-text whitespace-nowrap">
      <InfinityIcon className="h-3 w-3" />
      Unlimited
    </span>
  );
}

function AppCell({ connection, now }: { connection: ConnectorConnection; now: number }) {
  const preset = getAgentPreset(connection.agentKind);
  const secondLine = `${preset.label}${
    connection.customAgentLabel ? ` · ${connection.customAgentLabel}` : ""
  } · added by ${connection.createdBy}`;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <AgentAvatar monogram={preset.monogram} brandHex={preset.brandHex} size="md" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-semibold text-foreground" title={connection.name}>
            {truncate(connection.name, APP_NAME_TRUNCATE)}
          </span>
          {isUnlimited(connection, now) && <UnlimitedChip />}
        </div>
        <p className="truncate text-xs text-muted-foreground">{secondLine}</p>
      </div>
    </div>
  );
}

function LastUsedCell({ connection }: { connection: ConnectorConnection }) {
  if (connection.lastActiveAt === null) {
    return <span className="text-sm text-muted-foreground">Never</span>;
  }
  const at = new Date(connection.lastActiveAt);
  return (
    <time
      dateTime={connection.lastActiveAt}
      title={format(at, "PPpp")}
      className="whitespace-nowrap text-sm text-muted-foreground"
    >
      {formatDistanceToNowStrict(at, { addSuffix: true })}
    </time>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ConnectionsList({ connections, onOpen, onConnect, className }: ConnectionsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [page, setPage] = useState(1);

  // Computed once per render, not once per row — every health/limit check
  // below shares this exact instant instead of drifting mid-render.
  const now = Date.now();

  const showControls = connections.length >= SEARCH_FILTER_THRESHOLD;

  const filteredConnections = useMemo(() => {
    return connections
      .filter((c) => matchesSearch(c, searchQuery) && matchesStatusFilter(c, statusFilter, now))
      .sort(compareByLastActiveDesc);
    // `now` is recomputed fresh every render, so this memo never actually
    // skips work across renders — it exists for readability, not caching.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connections, searchQuery, statusFilter]);

  const shouldPaginate = filteredConnections.length > PAGE_SIZE;
  const pageCount = Math.max(1, Math.ceil(filteredConnections.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleConnections = shouldPaginate
    ? filteredConnections.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    : filteredConnections;

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPage(1);
  };

  const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, id: string) => {
    if (event.key === "Enter") {
      onOpen(id);
    } else if (event.key === " ") {
      // Prevent the page from scrolling on Space, matching the canonical
      // row-click-to-detail pattern in LaunchHistoryTable.
      event.preventDefault();
      onOpen(id);
    }
  };

  if (connections.length === 0) {
    return (
      <div className={cn("flex flex-col gap-6", className)}>
        <ConnectionsHeader onConnect={onConnect} />
        <ConnectionsEmptyState onConnect={onConnect} />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <ConnectionsHeader onConnect={onConnect} />

      {showControls && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by app or agent"
              className="pl-8"
              aria-label="Search connections"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as StatusFilterValue);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {filteredConnections.length === 0 ? (
        <NoMatchState onClear={handleClearFilters} />
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>App</TableHead>
                  <TableHead className="hidden md:table-cell">Can access</TableHead>
                  <TableHead className="hidden md:table-cell">Last used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleConnections.map((c) => (
                  <TableRow
                    key={c.id}
                    tabIndex={0}
                    role="button"
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onOpen(c.id)}
                    onKeyDown={(e) => handleRowKeyDown(e, c.id)}
                  >
                    <TableCell>
                      <AppCell connection={c} now={now} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <AccessMeter connection={c} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <LastUsedCell connection={c} />
                    </TableCell>
                    <TableCell>
                      <ConnectorStatusPill health={connectionHealth(c, now)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {shouldPaginate && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    aria-disabled={currentPage === 1}
                    className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.max(1, p - 1));
                    }}
                  />
                </PaginationItem>
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNumber) => (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      isActive={pageNumber === currentPage}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(pageNumber);
                      }}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    aria-disabled={currentPage === pageCount}
                    className={cn(currentPage === pageCount && "pointer-events-none opacity-50")}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.min(pageCount, p + 1));
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}
