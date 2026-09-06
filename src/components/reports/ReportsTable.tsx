import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown, ChevronRight, MoreHorizontal,
  ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  canDuplicate,
  useEntityOverride,
} from "@/lib/ad-entity-write-store";
import { useAdEntityActions } from "@/components/reports/actions/useAdEntityActions";
import type { ReportEntity, ColumnDef, EntityStatus } from "@/lib/reports-dummy-data";
import {
  resolveCurrency,
  MIXED_CURRENCY_NOTE,
  isCurrencyDependentMetric,
} from "@/lib/reports-dummy-data";
import { type TableRow as TRow, type GroupedRow, isGroupRow } from "@/hooks/use-reports-data";
import { useBatches } from "@/genie6/lib/genieRunStore";
import { resolveGenieLineage } from "@/components/genie-lineage/reportsLineage";
import { MadeInGenieBadge } from "@/components/genie-lineage/MadeInGenieBadge";
// §7.3 — Reports gets SUGGESTIONS (never an editor), shown next to the
// performance data so the decision sits beside the evidence.
import { GenieSuggestionChip } from "@/components/genie-lineage/GenieSuggestionChip";

interface ReportsTableProps {
  rows: TRow[];
  columns: ColumnDef[];
  visibleColumns: string[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onRowClick: (entity: ReportEntity) => void;
  drillDownPath?: string;
  drillDownParam?: string;
  sortColumn: string;
  sortDirection: "asc" | "desc";
  onSortChange: (col: string) => void;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  /**
   * `onClick` items render as plain `DropdownMenuItem`s (the "View Creatives"
   * shape, unchanged). `render` is the escape hatch for an item that needs to
   * host its own nested trigger/menu (Genie's SendToGenieMenu, which owns its
   * own DropdownMenu) — a bare `{label, onClick}` tuple can't express that.
   * Exactly one of `onClick`/`render` should be set per action.
   */
  kebabActions?: (entity: ReportEntity) => { label: string; onClick?: () => void; render?: () => React.ReactNode }[];
  onAddAdset?: (entity: ReportEntity) => void;
  onAddAd?: (entity: ReportEntity) => void;
}

const statusColor: Record<string, string> = {
  Active: "bg-chart-1/20 text-chart-1",
  Paused: "bg-muted text-muted-foreground",
  Archived: "bg-destructive/20 text-destructive",
};

/** Flatten a group's (possibly nested) children down to leaf entities. */
function collectEntities(items: TRow[]): ReportEntity[] {
  const out: ReportEntity[] = [];
  for (const r of items) {
    if (isGroupRow(r)) out.push(...collectEntities(r.children));
    else out.push(r);
  }
  return out;
}

/**
 * Status verbs for the kebab. Pause first: it is the frequent, safe, reversible
 * move, so it gets the shortest travel (Fitts's). Wording matches the bulk bar
 * and the detail panel — Pause / Activate / Archive, never "Unpause"/"Resume".
 * The item matching the row's current status renders disabled rather than
 * hidden, so the menu's shape is stable and the current state stays legible.
 */
const STATUS_ITEMS: { label: string; next: EntityStatus }[] = [
  { label: "Pause", next: "Paused" },
  { label: "Activate", next: "Active" },
  { label: "Archive", next: "Archived" },
];

/**
 * Lime dot marking a row changed in this session, so an edited row is scannable
 * without opening it. Absolutely positioned inside the name cell's EXISTING
 * left padding — it adds no width and cannot reflow the column.
 */
function EditedDot({ id, offset }: { id: string; offset: number }) {
  const override = useEntityOverride(id);
  if (override?.updatedAt === undefined) return null;
  return (
    <span
      className="pointer-events-none absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary"
      style={{ left: offset }}
      title="Edited in this session"
    >
      <span className="sr-only">Edited in this session</span>
    </span>
  );
}

export function ReportsTable({
  rows, columns, visibleColumns, selectedIds, onSelectionChange,
  onRowClick, drillDownPath, drillDownParam,
  sortColumn, sortDirection, onSortChange,
  totalCount, page, pageSize, onPageChange,
  kebabActions, onAddAdset, onAddAd,
}: ReportsTableProps) {
  const navigate = useNavigate();
  // Row verbs come from useAdEntityActions(): it owns the confirm dialogs
  // (Activate and Archive confirm, Pause does not), the duplicate sheet, and
  // the undo toast — mounted once per surface by AdEntityActionsProvider in
  // App.tsx.
  const rowActions = useAdEntityActions();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const visibleCols = columns.filter((c) => visibleColumns.includes(c.key));
  // Read ONCE at the top of the component — never inside the per-row
  // render loop below (that would call a hook a variable number of times as
  // rows page/sort/group, which breaks the rules of hooks). Per-row lookup
  // is a plain function over this same array.
  const genieBatches = useBatches();

  const toggleExpand = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const flatEntities = useCallback((): ReportEntity[] => {
    const result: ReportEntity[] = [];
    const collect = (items: TRow[]) => {
      for (const r of items) {
        if (isGroupRow(r)) collect(r.children);
        else result.push(r);
      }
    };
    collect(rows);
    return result;
  }, [rows]);

  const allIds = flatEntities().map((e) => e.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));

  const toggleAll = () => {
    onSelectionChange(allSelected ? new Set() : new Set(allIds));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    onSelectionChange(next);
  };

  const handleDrillDown = (entity: ReportEntity, e: React.MouseEvent) => {
    e.stopPropagation();
    if (drillDownPath && drillDownParam) {
      navigate(`${drillDownPath}?${drillDownParam}=${entity.id}`);
    }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortColumn !== col) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDirection === "asc"
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const renderGroupRow = (group: GroupedRow, parentKey = "") => {
    const key = `${parentKey}_${group.groupKey}`;
    const isOpen = expanded.has(key);
    // A group can span accounts in different currencies (e.g. grouped by
    // Platform). Summed money is then meaningless, so it is suppressed rather
    // than printed under one arbitrary symbol.
    const currency = resolveCurrency(collectEntities(group.children));
    return (
      <tbody key={key}>
        <TableRow
          className="bg-muted/30 cursor-pointer hover:bg-muted/50 h-11"
          onClick={() => toggleExpand(key)}
        >
          <TableCell colSpan={1}>
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </TableCell>
          <TableCell colSpan={1}>
            <span className="font-medium text-foreground" style={{ paddingLeft: group.depth * 16 }}>
              {group.groupLabel} ({group.count})
            </span>
          </TableCell>
          <TableCell />
          {visibleCols.map((col) => {
            const raw = (group.metrics as unknown as Record<string, number>)[col.key] ?? 0;
            // One common rule: suppress anything currency-dependent (money
            // amounts AND the ratios derived from them, e.g. ROAS) when the
            // group's rows span currencies. Volume metrics still sum.
            if (currency.mixed && isCurrencyDependentMetric(col.key)) {
              return (
                <TableCell
                  key={col.key}
                  className="text-right text-muted-foreground"
                  title={MIXED_CURRENCY_NOTE}
                >
                  <span className="sr-only">{MIXED_CURRENCY_NOTE}</span>
                  <span aria-hidden="true">—</span>
                </TableCell>
              );
            }
            return (
              <TableCell key={col.key} className="text-right text-muted-foreground">
                {col.format ? col.format(raw, currency.symbol) : raw}
              </TableCell>
            );
          })}
          <TableCell />
        </TableRow>
        {isOpen && group.children.map((child) =>
          isGroupRow(child)
            ? renderGroupRow(child, key)
            : renderEntityRow(child, group.depth + 1)
        )}
      </tbody>
    );
  };

  const renderEntityRow = (entity: ReportEntity, indent = 0) => {
    // Money on a leaf row is always single-currency: the row's own account
    // currency, inherited from its country.
    const currencySymbol = resolveCurrency([entity]).symbol;
    // "Open in New Tab" used to open `window.location.href` — the page you were
    // already on, for any row you clicked it from. The only per-row URL this
    // table can honestly derive is the row's drill-down (its children), since
    // entity detail is a drawer and has no route of its own. Where there is no
    // drill-down (the deepest level), the item is omitted rather than pointed at
    // the current page.
    const rowUrl =
      drillDownPath && drillDownParam
        ? `${drillDownPath}?${drillDownParam}=${entity.id}`
        : null;
    // §7.3 creative lineage — "Made in Genie" badge. Ad-level rows only; an
    // account/campaign/adset row has no single creative to trace.
    const genieLineage =
      entity.level === "ad" ? resolveGenieLineage(genieBatches, entity.id) : null;
    return (
    <TableRow
      key={entity.id}
      className="cursor-pointer h-10"
      data-state={selectedIds.has(entity.id) ? "selected" : undefined}
      onClick={() => onRowClick(entity)}
    >
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={selectedIds.has(entity.id)}
          onCheckedChange={() => toggleOne(entity.id)}
        />
      </TableCell>
      <TableCell className="relative" style={{ paddingLeft: indent * 16 + 16 }}>
        <EditedDot id={entity.id} offset={indent * 16 + 6} />
        <span className="inline-flex items-center gap-2">
          {drillDownPath && drillDownParam ? (
            <button
              className="text-sm font-medium text-foreground hover:underline text-left"
              onClick={(e) => handleDrillDown(entity, e)}
            >
              {entity.name}
            </button>
          ) : (
            <span className="text-sm font-medium text-foreground">{entity.name}</span>
          )}
          {genieLineage && <MadeInGenieBadge outputId={genieLineage.outputId} />}
          <GenieSuggestionChip entity={entity} />
        </span>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={`text-xs ${statusColor[entity.status]}`}>
          {entity.status}
        </Badge>
      </TableCell>
      {visibleCols.map((col) => {
        const raw = (entity.metrics as unknown as Record<string, number>)[col.key] ?? 0;
        return (
          <TableCell key={col.key} className="text-right text-sm">
            {col.format ? col.format(raw, currencySymbol) : raw}
          </TableCell>
        );
      })}
      <TableCell onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onRowClick(entity)}>View Details</DropdownMenuItem>
            {STATUS_ITEMS.map((s) => (
              <DropdownMenuItem
                key={s.next}
                disabled={entity.status === s.next}
                onClick={() => rowActions.setStatus([entity], s.next)}
              >
                {s.label}
              </DropdownMenuItem>
            ))}
            {/* Hidden, not disabled, at account level — an ad account is not a
                thing you can copy, so offering it greyed out only invites the
                question "why?". */}
            {canDuplicate(entity.level) && (
              <DropdownMenuItem onClick={() => rowActions.duplicate(entity)}>
                Duplicate
              </DropdownMenuItem>
            )}
            {onAddAdset && <DropdownMenuItem onClick={() => onAddAdset(entity)}>Add Ad Set</DropdownMenuItem>}
            {onAddAd && <DropdownMenuItem onClick={() => onAddAd(entity)}>Add Ad</DropdownMenuItem>}
            {kebabActions?.(entity).map((a) =>
              a.render ? (
                <span key={a.label}>{a.render()}</span>
              ) : (
                <DropdownMenuItem key={a.label} onClick={a.onClick}>{a.label}</DropdownMenuItem>
              ),
            )}
            {/* "Apply Rule" used to sit here firing a bare success toast with no
                destination. Automation owns rules — a link to nowhere is worse
                than no link. */}
            {rowUrl && (
              <DropdownMenuItem onClick={() => window.open(rowUrl, "_blank", "noopener,noreferrer")}>
                Open in New Tab
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
    );
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-2">
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-10">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead className="min-w-[200px]">Name</TableHead>
                <TableHead className="w-24">Status</TableHead>
                {visibleCols.map((col) => (
                  <TableHead
                    key={col.key}
                    className="text-right cursor-pointer select-none whitespace-nowrap"
                    onClick={() => onSortChange(col.key)}
                  >
                    <span className="inline-flex items-center">
                      {col.label}
                      <SortIcon col={col.key} />
                    </span>
                  </TableHead>
                ))}
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            {rows.length === 0 ? (
              <TableBody>
                <TableRow>
                  <TableCell colSpan={visibleCols.length + 4} className="text-center py-12 text-muted-foreground">
                    No data found
                  </TableCell>
                </TableRow>
              </TableBody>
            ) : (
              rows.map((row) =>
                isGroupRow(row)
                  ? renderGroupRow(row)
                  : <TableBody key={(row as ReportEntity).id}>{renderEntityRow(row as ReportEntity)}</TableBody>
              )
            )}
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>Showing {Math.min((page - 1) * pageSize + 1, totalCount)}–{Math.min(page * pageSize, totalCount)} of {totalCount}</span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline" size="sm" className="h-7 text-xs"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Prev
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <Button
                  key={p}
                  variant={page === p ? "default" : "outline"}
                  size="sm"
                  className="h-7 w-7 text-xs p-0"
                  onClick={() => onPageChange(p)}
                >
                  {p}
                </Button>
              );
            })}
            {totalPages > 5 && <span className="px-1">…</span>}
            <Button
              variant="outline" size="sm" className="h-7 text-xs"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
