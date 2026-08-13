import { Fragment, useState } from "react";
import { formatDistanceToNowStrict, format } from "date-fns";
import { AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ConnectorAuditEntry, AuditOutcome } from "@/connector/model";

/**
 * ActivityTable — the agent audit log, shared by a connection's detail page
 * (per-connection) and the global roll-up across all connections
 * (`showApp` adds the App column).
 *
 * TWO DELIBERATE HONESTY DECISIONS BAKED INTO THIS COMPONENT:
 *
 * 1. Only `blocked_permission` / `blocked_limit` / `error` rows expand.
 *    An `allowed` row expanding into detail is noise dressed as depth — the
 *    read already succeeded, there is nothing to investigate. Reserving
 *    expansion for rows that need explaining keeps the affordance meaningful:
 *    if a row is clickable, something is worth looking at. It also puts the
 *    fix (`Raise the limit`) exactly where the problem was discovered, for
 *    `blocked_limit` rows.
 *
 *    THE TWO FIELDS ARE NOT THE SAME FACT. The `What it did` column always
 *    renders `entry.detail` — the ATTEMPT, naming the campaign or ad — so
 *    three refused launches read as three different launches instead of three
 *    copies of one error. The expansion is where `entry.blockMessage` lives:
 *    the verbatim sentence the agent itself was handed, labelled as such
 *    ("What Ops bot was told:"), because the recovery question is never "what
 *    happened" but "why did my assistant say it couldn't". Quoted, never
 *    paraphrased here — the moment this component re-words it, the log and the
 *    agent start telling different stories.
 *
 * 2. The footer line never implies completeness it cannot verify. The caller
 *    passes `totalCount` (the true total before their slice) alongside
 *    `entries` (what actually rendered); this component states plainly
 *    whether it is showing all events or only the most recent slice. No
 *    "1-20 of many", no silent truncation — the honest count or nothing.
 */

export interface ActivityTableProps {
  /** Already filtered + sorted newest-first by the caller. */
  entries: ConnectorAuditEntry[];
  /** Total BEFORE the caller's slice. */
  totalCount: number;
  /** Global roll-up adds an "App" column. */
  showApp?: boolean;
  emptyTitle: string;
  emptyDescription: string;
  onRaiseLimit?: (entry: ConnectorAuditEntry) => void;
  className?: string;
}

const APP_TRUNCATE_LENGTH = 28;

const OUTCOME_CONFIG: Record<AuditOutcome, { label: string; className: string }> = {
  allowed: { label: "Done", className: "text-muted-foreground" },
  blocked_permission: { label: "Blocked — no permission", className: "text-warning-text" },
  blocked_limit: { label: "Blocked — limit reached", className: "text-error-text" },
  error: { label: "Failed", className: "text-error-text" },
};

/** Only these outcomes ever expand — see decision (1) above. */
const EXPANDABLE_OUTCOMES: AuditOutcome[] = ["blocked_permission", "blocked_limit", "error"];

function isExpandable(entry: ConnectorAuditEntry): boolean {
  return EXPANDABLE_OUTCOMES.includes(entry.outcome);
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export function ActivityTable({
  entries,
  totalCount,
  showApp = false,
  emptyTitle,
  emptyDescription,
  onRaiseLimit,
  className,
}: ActivityTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (entries.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-16 px-6 text-center",
          className,
        )}
      >
        <h3 className="text-sm font-medium text-foreground">{emptyTitle}</h3>
        <p className="max-w-md text-xs text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  const columnCount = 4 + (showApp ? 1 : 0);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              {showApp && <TableHead>App</TableHead>}
              <TableHead>What it did</TableHead>
              <TableHead>Where</TableHead>
              <TableHead>Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => {
              const expandable = isExpandable(entry);
              const expanded = expandedIds.has(entry.id);
              const outcome = OUTCOME_CONFIG[entry.outcome];
              const at = new Date(entry.at);

              const handleKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>) => {
                if (!expandable) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  toggleExpanded(entry.id);
                }
              };

              return (
                <Fragment key={entry.id}>
                  <TableRow
                    className={cn(expandable && "cursor-pointer")}
                    tabIndex={expandable ? 0 : undefined}
                    role={expandable ? "button" : undefined}
                    aria-expanded={expandable ? expanded : undefined}
                    onClick={expandable ? () => toggleExpanded(entry.id) : undefined}
                    onKeyDown={handleKeyDown}
                  >
                    <TableCell className="whitespace-nowrap">
                      <time dateTime={entry.at} title={format(at, "PPpp")}>
                        {formatDistanceToNowStrict(at, { addSuffix: true })}
                      </time>
                    </TableCell>
                    {showApp && (
                      <TableCell title={entry.connectionName}>
                        {truncate(entry.connectionName, APP_TRUNCATE_LENGTH)}
                      </TableCell>
                    )}
                    <TableCell>{entry.detail}</TableCell>
                    <TableCell>
                      {entry.moduleId ? (
                        <Badge variant="secondary">{entry.moduleLabel}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className={outcome.className}>{outcome.label}</TableCell>
                  </TableRow>
                  {expandable && expanded && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={columnCount} className="bg-muted/40">
                        <div className="flex flex-wrap items-start justify-between gap-3 py-1">
                          <div className="flex min-w-0 items-start gap-2 text-sm text-foreground">
                            <AlertTriangle className={cn("mt-0.5 h-4 w-4 shrink-0", outcome.className)} />
                            <div className="flex min-w-0 flex-col gap-1">
                              <p>{entry.detail}</p>
                              {entry.blockMessage && (
                                <>
                                  <p className="text-xs font-medium text-muted-foreground">
                                    What {entry.connectionName} was told:
                                  </p>
                                  {/* Quoted verbatim — see decision (1) in the header. */}
                                  <p className="border-l-2 border-border pl-3 text-sm text-muted-foreground">
                                    {entry.blockMessage}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                          {entry.outcome === "blocked_limit" && onRaiseLimit && (
                            <Button size="sm" variant="outline" onClick={() => onRaiseLimit(entry)}>
                              Raise the limit
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        {entries.length < totalCount
          ? `Showing the ${entries.length} most recent of ${totalCount} events.`
          : `Showing all ${totalCount} events.`}
      </p>
    </div>
  );
}
