import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useReportsData } from "@/hooks/use-reports-data";
import { METRIC_COLUMNS, GROUPING_OPTIONS, type ReportEntity } from "@/lib/reports-dummy-data";
import { PageSkeleton } from "@/components/reports/PageSkeleton";
import { ReportsToolbar } from "@/components/reports/ReportsToolbar";
import { ReportsTable } from "@/components/reports/ReportsTable";
import { ReportDetailDrawer } from "@/components/reports/ReportDetailDrawer";
import { ColumnSettingsModal } from "@/components/reports/ColumnSettingsModal";
import { CreateAdsetDrawer } from "@/components/reports/CreateAdsetDrawer";
import { LaunchScopeChip } from "@/components/reports/LaunchScopeChip";

export default function CampaignsReport() {
  const [searchParams] = useSearchParams();
  const parentId = searchParams.get("accountId") || undefined;
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
  const [adsetDrawerCampaign, setAdsetDrawerCampaign] = useState<ReportEntity | null>(null);

  const groupingOptions = GROUPING_OPTIONS.campaigns;
  const pg = groupingOptions.find((o) => o.value === primaryGroupBy) ?? null;
  const sg = groupingOptions.find((o) => o.value === secondaryGroupBy) ?? null;

  const { rows, totalCount, isRefreshing, allFiltered } = useReportsData({
    level: "campaign", parentId, search, platforms, statuses,
    primaryGroupBy: pg, secondaryGroupBy: sg,
    sortColumn, sortDirection, page, pageSize: 25, dateSeed,
    launchScopeId: launchScope, launchBatchId: launchScope,
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
    const a = document.createElement("a"); a.href = url; a.download = "campaigns-report.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  }, [selectedEntities, allFiltered]);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-foreground">Campaigns</h1>

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
      />

      <LaunchScopeChip />

      {isRefreshing ? <PageSkeleton /> : (
        <ReportsTable
          rows={rows} columns={METRIC_COLUMNS} visibleColumns={visibleColumns}
          selectedIds={selectedIds} onSelectionChange={setSelectedIds}
          onRowClick={setDrawerEntity}
          drillDownPath="/reports/performance/ad-sets" drillDownParam="campaignId"
          sortColumn={sortColumn} sortDirection={sortDirection} onSortChange={handleSort}
          totalCount={totalCount} page={page} pageSize={25} onPageChange={setPage}
          onAddAdset={setAdsetDrawerCampaign}
        />
      )}

      <ReportDetailDrawer entity={drawerEntity} open={!!drawerEntity} onOpenChange={(v) => !v && setDrawerEntity(null)} onAddAdset={setAdsetDrawerCampaign} />
      <ColumnSettingsModal open={colSettingsOpen} onOpenChange={setColSettingsOpen} columns={METRIC_COLUMNS} visibleKeys={visibleColumns} onVisibleKeysChange={setVisibleColumns} />
      <CreateAdsetDrawer campaign={adsetDrawerCampaign} open={!!adsetDrawerCampaign} onOpenChange={(v) => !v && setAdsetDrawerCampaign(null)} />
    </div>
  );
}
