import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useReportsData } from "@/hooks/use-reports-data";
import { GROUPING_OPTIONS, type ReportEntity } from "@/lib/reports-dummy-data";
import { PageSkeleton } from "@/components/reports/PageSkeleton";
import { ReportsToolbar } from "@/components/reports/ReportsToolbar";
import { CreativeReportCard } from "@/components/reports/CreativeReportCard";
import { CreativeDetailDrawer } from "@/components/reports/CreativeDetailDrawer";
import { LaunchScopeChip } from "@/components/reports/LaunchScopeChip";

export default function ImageReport() {
  const [searchParams] = useSearchParams();
  const adIdFilter = searchParams.get("adId") || undefined;
  const launchScope = searchParams.get("launch");
  const [search, setSearch] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [primaryGroupBy, setPrimaryGroupBy] = useState("none");
  const [secondaryGroupBy, setSecondaryGroupBy] = useState("none");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerEntity, setDrawerEntity] = useState<ReportEntity | null>(null);
  const [dateSeed, setDateSeed] = useState(0);

  const groupingOptions = GROUPING_OPTIONS.creativeImage;

  const { rows, totalCount, isRefreshing, allFiltered } = useReportsData({
    level: "ad", parentId: adIdFilter ? undefined : undefined,
    search, platforms, statuses,
    primaryGroupBy: null, secondaryGroupBy: null,
    sortColumn: "spend", sortDirection: "desc",
    page: 1, pageSize: 200, dateSeed, creativeType: "image",
    launchScopeId: launchScope, launchBatchId: launchScope,
  });

  const filteredByAd = useMemo(() => {
    const entities = allFiltered;
    if (adIdFilter) return entities.filter((e) => e.id === adIdFilter);
    return entities;
  }, [allFiltered, adIdFilter]);

  const selectedEntities = useMemo(() => filteredByAd.filter((e) => selectedIds.has(e.id)), [filteredByAd, selectedIds]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const exportCsv = useCallback(() => {
    toast.success("CSV exported");
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-foreground">Image Report</h1>

      <ReportsToolbar
        search={search} onSearchChange={setSearch}
        platforms={platforms} onPlatformsChange={setPlatforms}
        statuses={statuses} onStatusesChange={setStatuses}
        groupingOptions={groupingOptions}
        primaryGroupBy={primaryGroupBy} onPrimaryGroupByChange={setPrimaryGroupBy}
        secondaryGroupBy={secondaryGroupBy} onSecondaryGroupByChange={setSecondaryGroupBy}
        onRefresh={() => setDateSeed((s) => s + 1)}
        onExport={exportCsv}
        onColumnSettings={() => {}}
        selectionCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onBulkExport={exportCsv}
        selectedEntities={selectedEntities}
      />

      <LaunchScopeChip />

      {isRefreshing ? (
        <PageSkeleton variant="cards" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredByAd.map((entity) => (
            <CreativeReportCard
              key={entity.id}
              entity={entity}
              selected={selectedIds.has(entity.id)}
              onSelect={toggleSelect}
              onClick={setDrawerEntity}
            />
          ))}
          {filteredByAd.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">No image creatives found</div>
          )}
        </div>
      )}

      <CreativeDetailDrawer entity={drawerEntity} open={!!drawerEntity} onOpenChange={(v) => !v && setDrawerEntity(null)} />
    </div>
  );
}
