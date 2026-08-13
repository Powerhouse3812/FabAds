import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useReportsData, isGroupRow } from "@/hooks/use-reports-data";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  METRIC_COLUMNS,
  GROUPING_OPTIONS,
  type EntityStatus,
  type Platform,
  type ReportEntity,
} from "@/lib/reports-dummy-data";
import { PageSkeleton } from "@/components/reports/PageSkeleton";
import { ReportsToolbar } from "@/components/reports/ReportsToolbar";
import { ReportsTable } from "@/components/reports/ReportsTable";
import { ReportDetailDrawer } from "@/components/reports/ReportDetailDrawer";
import { ColumnSettingsModal } from "@/components/reports/ColumnSettingsModal";
import { LaunchScopeChip } from "@/components/reports/LaunchScopeChip";
import { MobileReportsShell } from "@/components/reports/mobile/MobileReportsShell";
import { useAdEntityActions } from "@/components/reports/actions/useAdEntityActions";

export default function AdAccountsReport() {
  const isMobile = useIsMobile();
  // openSessionChanges is otherwise unreachable on mobile — the only durable undo path beyond the 8s toast, and the sole in-UI escape from the duplicate-numbering edge case documented in ad-entity-write-store.ts.
  const { openSessionChanges } = useAdEntityActions();
  const [searchParams] = useSearchParams();
  const launchScope = searchParams.get("launch");
  const [search, setSearch] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [primaryGroupBy, setPrimaryGroupBy] = useState("none");
  const [secondaryGroupBy, setSecondaryGroupBy] = useState("none");
  const [sortColumn, setSortColumn] = useState("spend");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerEntity, setDrawerEntity] = useState<ReportEntity | null>(null);
  const [colSettingsOpen, setColSettingsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(METRIC_COLUMNS.map((c) => c.key));
  const [dateSeed, setDateSeed] = useState(0);

  const groupingOptions = GROUPING_OPTIONS.accounts;
  const pg = groupingOptions.find((o) => o.value === primaryGroupBy) ?? null;
  const sg = groupingOptions.find((o) => o.value === secondaryGroupBy) ?? null;

  const { rows, totalCount, isRefreshing, allFiltered } = useReportsData({
    level: "account", search, platforms, statuses,
    primaryGroupBy: pg, secondaryGroupBy: sg,
    sortColumn, sortDirection, page, pageSize: 25, dateSeed,
    launchScopeId: launchScope, launchBatchId: launchScope,
  });

  const handleSort = (col: string) => {
    if (sortColumn === col) setSortDirection((d) => d === "asc" ? "desc" : "asc");
    else { setSortColumn(col); setSortDirection("desc"); }
  };

  const selectedEntities = useMemo(
    () => allFiltered.filter((e) => selectedIds.has(e.id)),
    [allFiltered, selectedIds]
  );

  /**
   * Mobile list source. `rows` is page-sliced to 25 and can contain group rows
   * when grouping is on; MobileReportsList does its own windowing over the full
   * flat set, so it gets `allFiltered` (same useReportsData call as the table)
   * with any group row defensively filtered out.
   *
   * `allFiltered` is pre-sort — the hook only sorts on the way to `rows` — so
   * the sort the mobile sort sheet writes back is applied here. Same comparator
   * as the hook, so both branches agree on order.
   */
  const mobileEntities = useMemo(() => {
    const arr = allFiltered.filter((e) => !isGroupRow(e));
    arr.sort((a, b) => {
      const aVal = (a.metrics as unknown as Record<string, number>)[sortColumn] ?? 0;
      const bVal = (b.metrics as unknown as Record<string, number>)[sortColumn] ?? 0;
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });
    return arr;
  }, [allFiltered, sortColumn, sortDirection]);

  // Exactly the filters the mobile shell can set — nothing else is reset, so
  // "Clear all filters" never silently drops grouping or the launch scope.
  const clearMobileFilters = useCallback(() => {
    setStatuses([]);
    setPlatforms([]);
    setSearch("");
  }, []);

  const exportCsv = useCallback(() => {
    const data = selectedEntities.length > 0 ? selectedEntities : allFiltered;
    const headers = ["Name", "Platform", "Status", ...METRIC_COLUMNS.map((c) => c.label)];
    const csvRows = data.map((e) =>
      [e.name, e.platform, e.status, ...METRIC_COLUMNS.map((c) => (e.metrics as unknown as Record<string, number>)[c.key])].join(",")
    );
    const blob = new Blob([headers.join(",") + "\n" + csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "ad-accounts-report.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  }, [selectedEntities, allFiltered]);

  return (
    /* Mobile bleeds past AppLayout's `p-3` mobile gutter so the shell's sticky
       header/scope bar reach the viewport edges. Desktop keeps `space-y-4`
       verbatim, and the desktop subtree below is byte-identical to before. */
    <div className={isMobile ? "-m-3 flex min-h-0 flex-1 flex-col" : "space-y-4"}>
      {isMobile ? (
        <MobileReportsShell
          title="Ad accounts"
          level="account"
          entities={mobileEntities}
          totalCount={totalCount}
          isLoading={isRefreshing}
          search={search}
          onSearchChange={setSearch}
          statuses={statuses as EntityStatus[]}
          onStatusesChange={setStatuses}
          platforms={platforms as Platform[]}
          onPlatformsChange={setPlatforms}
          sortColumn={sortColumn}
          onSortColumnChange={setSortColumn}
          sortDirection={sortDirection}
          onSortDirectionChange={setSortDirection}
          onClearAllFilters={clearMobileFilters}
          onOpenEntity={setDrawerEntity}
          onExport={exportCsv}
          onOpenSessionChanges={openSessionChanges}
        />
      ) : (
        <>
          <h1 className="text-lg font-semibold text-foreground">Ad Accounts</h1>

          <ReportsToolbar
            search={search} onSearchChange={setSearch}
            platforms={platforms} onPlatformsChange={setPlatforms}
            statuses={statuses} onStatusesChange={setStatuses}
            groupingOptions={groupingOptions}
            primaryGroupBy={primaryGroupBy} onPrimaryGroupByChange={setPrimaryGroupBy}
            secondaryGroupBy={secondaryGroupBy} onSecondaryGroupByChange={setSecondaryGroupBy}
            onRefresh={() => setDateSeed((s) => s + 1)}
            onExport={exportCsv}
            onColumnSettings={() => setColSettingsOpen(true)}
            selectionCount={selectedIds.size}
            onClearSelection={() => setSelectedIds(new Set())}
            onBulkExport={exportCsv}
            selectedEntities={selectedEntities}
          />

          <LaunchScopeChip />

          {isRefreshing ? (
            <PageSkeleton />
          ) : (
            <ReportsTable
              rows={rows}
              columns={METRIC_COLUMNS}
              visibleColumns={visibleColumns}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onRowClick={setDrawerEntity}
              drillDownPath="/reports/performance/campaigns"
              drillDownParam="accountId"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSortChange={handleSort}
              totalCount={totalCount}
              page={page}
              pageSize={25}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {/* Mounted in BOTH branches — the mobile shell's onOpenEntity opens it. */}
      <ReportDetailDrawer
        entity={drawerEntity}
        open={!!drawerEntity}
        onOpenChange={(v) => !v && setDrawerEntity(null)}
      />

      <ColumnSettingsModal
        open={colSettingsOpen}
        onOpenChange={setColSettingsOpen}
        columns={METRIC_COLUMNS}
        visibleKeys={visibleColumns}
        onVisibleKeysChange={setVisibleColumns}
      />
    </div>
  );
}
