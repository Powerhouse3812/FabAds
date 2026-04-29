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
import { toast } from "sonner";
import type { ReportEntity, ColumnDef } from "@/lib/reports-dummy-data";
import { type TableRow as TRow, type GroupedRow, isGroupRow } from "@/hooks/use-reports-data";

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
  kebabActions?: (entity: ReportEntity) => { label: string; onClick: () => void }[];
  onAddAdset?: (entity: ReportEntity) => void;
  onAddAd?: (entity: ReportEntity) => void;
}

const statusColor: Record<string, string> = {
  Active: "bg-chart-1/20 text-chart-1",
  Paused: "bg-muted text-muted-foreground",
  Archived: "bg-destructive/20 text-destructive",
};

export function ReportsTable({
  rows, columns, visibleColumns, selectedIds, onSelectionChange,
  onRowClick, drillDownPath, drillDownParam,
  sortColumn, sortDirection, onSortChange,
  totalCount, page, pageSize, onPageChange,
  kebabActions, onAddAdset, onAddAd,
}: ReportsTableProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const visibleCols = columns.filter((c) => visibleColumns.includes(c.key));

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
          {visibleCols.map((col) => (
            <TableCell key={col.key} className="text-right text-muted-foreground">
              {col.format
              ? col.format((group.metrics as unknown as Record<string, number>)[col.key] ?? 0)
              : (group.metrics as unknown as Record<string, number>)[col.key] ?? 0}
            </TableCell>
          ))}
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

  const renderEntityRow = (entity: ReportEntity, indent = 0) => (
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
      <TableCell style={{ paddingLeft: indent * 16 + 16 }}>
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
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={`text-xs ${statusColor[entity.status]}`}>
          {entity.status}
        </Badge>
      </TableCell>
      {visibleCols.map((col) => (
        <TableCell key={col.key} className="text-right text-sm">
          {col.format
            ? col.format((entity.metrics as unknown as Record<string, number>)[col.key] ?? 0)
            : (entity.metrics as unknown as Record<string, number>)[col.key] ?? 0}
        </TableCell>
      ))}
      <TableCell onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onRowClick(entity)}>View Details</DropdownMenuItem>
            {onAddAdset && <DropdownMenuItem onClick={() => onAddAdset(entity)}>Add Ad Set</DropdownMenuItem>}
            {onAddAd && <DropdownMenuItem onClick={() => onAddAd(entity)}>Add Ad</DropdownMenuItem>}
            {kebabActions?.(entity).map((a) => (
              <DropdownMenuItem key={a.label} onClick={a.onClick}>{a.label}</DropdownMenuItem>
            ))}
            <DropdownMenuItem onClick={() => toast.success("Apply Rule")}>Apply Rule</DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open(window.location.href, "_blank")}>Open in New Tab</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

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
