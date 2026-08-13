import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useReportsData } from "@/hooks/use-reports-data";
import { GROUPING_OPTIONS, type ReportEntity } from "@/lib/reports-dummy-data";
import { PageSkeleton } from "@/components/reports/PageSkeleton";
import { ReportsToolbar } from "@/components/reports/ReportsToolbar";
import { CreativeReportCard } from "@/components/reports/CreativeReportCard";
import { CreativeDetailDrawer } from "@/components/reports/CreativeDetailDrawer";

export default function VideoReport() {
  const [searchParams] = useSearchParams();
  const adIdFilter = searchParams.get("adId") || undefined;
  const [search, setSearch] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [primaryGroupBy, setPrimaryGroupBy] = useState("none");
  const [secondaryGroupBy, setSecondaryGroupBy] = useState("none");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerEntity, setDrawerEntity] = useState<ReportEntity | null>(null);
  const [dateSeed, setDateSeed] = useState(0);

  const groupingOptions = GROUPING_OPTIONS.creativeVideo;

  const { rows, totalCount, isRefreshing, allFiltered } = useReportsData({
    level: "ad", search, platforms, statuses,
    primaryGroupBy: null, secondaryGroupBy: null,
    sortColumn: "spend", sortDirection: "desc",
    page: 1, pageSize: 200, dateSeed, creativeType: "video",
  });

  const filteredByAd = useMemo(() => {
    if (adIdFilter) return allFiltered.filter((e) => e.id === adIdFilter);
    return allFiltered;
  }, [allFiltered, adIdFilter]);

  const selectedEntities = useMemo(() => filteredByAd.filter((e) => selectedIds.has(e.id)), [filteredByAd, selectedIds]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-foreground">Video Report</h1>

      <ReportsToolbar
        search={search} onSearchChange={setSearch}
        platforms={platforms} onPlatformsChange={setPlatforms}
        statuses={statuses} onStatusesChange={setStatuses}
        groupingOptions={groupingOptions}
        primaryGroupBy={primaryGroupBy} onPrimaryGroupByChange={setPrimaryGroupBy}
        secondaryGroupBy={secondaryGroupBy} onSecondaryGroupByChange={setSecondaryGroupBy}
        onRefresh={() => setDateSeed((s) => s + 1)}
        onExport={() => toast.success("CSV exported")}
        onColumnSettings={() => {}}
        selectionCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onBulkExport={() => toast.success("CSV exported")}
        selectedEntities={selectedEntities}
      />

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
            <div className="col-span-full text-center py-12 text-muted-foreground">No video creatives found</div>
          )}
        </div>
      )}

      <CreativeDetailDrawer entity={drawerEntity} open={!!drawerEntity} onOpenChange={(v) => !v && setDrawerEntity(null)} />
    </div>
  );
}
