import { useState, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useReportsData } from "@/hooks/use-reports-data";
import { METRIC_COLUMNS, GROUPING_OPTIONS, getLaunchFilterOptions, type ReportEntity } from "@/lib/reports-dummy-data";
import { PageSkeleton } from "@/components/reports/PageSkeleton";
import { ReportsToolbar } from "@/components/reports/ReportsToolbar";
import { ReportsTable } from "@/components/reports/ReportsTable";
import { ReportsBulkBar } from "@/components/reports/ReportsBulkBar";
import { ReportDetailDrawer } from "@/components/reports/ReportDetailDrawer";
import { ColumnSettingsModal } from "@/components/reports/ColumnSettingsModal";

export default function AdsReport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const parentId = searchParams.get("adsetId") || undefined;
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

  // ── Bulk Launch Distribution provenance filters ──────────────────
  const ALL = "__all__";
  const [launchStrategies, setLaunchStrategies] = useState<string[]>([]);
  const [launchBatchId, setLaunchBatchId] = useState(ALL);
  const [destinationFbPageId, setDestinationFbPageId] = useState(ALL);
  const [destinationAdAccountName, setDestinationAdAccountName] = useState(ALL);
  const [sourceAdName, setSourceAdName] = useState(ALL);
  const launchFilters = useMemo(() => getLaunchFilterOptions(dateSeed), [dateSeed]);

  const groupingOptions = GROUPING_OPTIONS.ads;
  const pg = groupingOptions.find((o) => o.value === primaryGroupBy) ?? null;
  const sg = groupingOptions.find((o) => o.value === secondaryGroupBy) ?? null;

  const { rows, totalCount, isRefreshing, allFiltered } = useReportsData({
    level: "ad", parentId, search, platforms, statuses,
    primaryGroupBy: pg, secondaryGroupBy: sg,
    sortColumn, sortDirection, page, pageSize: 25, dateSeed,
    launchStrategies,
    launchBatchId: launchBatchId === ALL ? null : launchBatchId,
    destinationFbPageId: destinationFbPageId === ALL ? null : destinationFbPageId,
    destinationAdAccountName: destinationAdAccountName === ALL ? null : destinationAdAccountName,
    sourceAdName: sourceAdName === ALL ? null : sourceAdName,
  });

  const handleSort = (col: string) => {
    if (sortColumn === col) setSortDirection((d) => d === "asc" ? "desc" : "asc");
    else { setSortColumn(col); setSortDirection("desc"); }
  };

  const selectedEntities = useMemo(() => allFiltered.filter((e) => selectedIds.has(e.id)), [allFiltered, selectedIds]);

  const exportCsv = useCallback(() => {
    const data = selectedEntities.length > 0 ? selectedEntities : allFiltered;
    const headers = ["Name", "Platform", "Status", ...METRIC_COLUMNS.map((c) => c.label)];
    const csvRows = data.map((e) =>
      [e.name, e.platform, e.status, ...METRIC_COLUMNS.map((c) => (e.metrics as unknown as Record<string, number>)[c.key])].join(",")
    );
    const blob = new Blob([headers.join(",") + "\n" + csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "ads-report.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  }, [selectedEntities, allFiltered]);

  const kebabActions = useCallback((entity: ReportEntity) => {
    const actions = [];
    if (entity.creative) {
      const path = entity.creative.type === "video"
        ? `/reports/creative/video?adId=${entity.id}`
        : `/reports/creative/image?adId=${entity.id}`;
      actions.push({
        label: "View Creatives",
        onClick: () => navigate(path),
      });
    }
    return actions;
  }, [navigate]);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-foreground">Ads</h1>

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
        launchFilters={launchFilters}
        launchStrategies={launchStrategies} onLaunchStrategiesChange={setLaunchStrategies}
        launchBatchId={launchBatchId} onLaunchBatchIdChange={setLaunchBatchId}
        destinationFbPageId={destinationFbPageId} onDestinationFbPageIdChange={setDestinationFbPageId}
        destinationAdAccountName={destinationAdAccountName} onDestinationAdAccountNameChange={setDestinationAdAccountName}
        sourceAdName={sourceAdName} onSourceAdNameChange={setSourceAdName}
      />

      {isRefreshing ? <PageSkeleton /> : (
        <ReportsTable
          rows={rows} columns={METRIC_COLUMNS} visibleColumns={visibleColumns}
          selectedIds={selectedIds} onSelectionChange={setSelectedIds}
          onRowClick={setDrawerEntity}
          sortColumn={sortColumn} sortDirection={sortDirection} onSortChange={handleSort}
          totalCount={totalCount} page={page} pageSize={25} onPageChange={setPage}
          kebabActions={kebabActions}
        />
      )}

      <ReportsBulkBar selected={selectedEntities} onClearSelection={() => setSelectedIds(new Set())} onExport={exportCsv} />
      <ReportDetailDrawer entity={drawerEntity} open={!!drawerEntity} onOpenChange={(v) => !v && setDrawerEntity(null)} />
      <ColumnSettingsModal open={colSettingsOpen} onOpenChange={setColSettingsOpen} columns={METRIC_COLUMNS} visibleKeys={visibleColumns} onVisibleKeysChange={setVisibleColumns} />
    </div>
  );
}
