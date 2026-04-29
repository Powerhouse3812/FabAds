import { useState, useMemo } from "react";
import { toast } from "sonner";
import { LayoutGrid, TableIcon } from "lucide-react";
import { useReportsData } from "@/hooks/use-reports-data";
import { GROUPING_OPTIONS, METRIC_COLUMNS, aggregateMetrics, type ReportEntity, type ColumnDef } from "@/lib/reports-dummy-data";
import { PageSkeleton } from "@/components/reports/PageSkeleton";
import { ReportsToolbar } from "@/components/reports/ReportsToolbar";
import { ReportsTable } from "@/components/reports/ReportsTable";
import { ReportsBulkBar } from "@/components/reports/ReportsBulkBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreativeDetailDrawer } from "@/components/reports/CreativeDetailDrawer";
import { ColumnSettingsModal } from "@/components/reports/ColumnSettingsModal";

const statusColor: Record<string, string> = {
  Active: "bg-chart-1/20 text-chart-1",
  Paused: "bg-muted text-muted-foreground",
  Archived: "bg-destructive/20 text-destructive",
};

const AD_GROUP_COLUMNS: ColumnDef[] = [
  { key: "count", label: "Ads", numeric: true, format: (v) => String(v) },
  ...METRIC_COLUMNS,
];

interface AdGroupRow {
  name: string;
  count: number;
  metrics: ReturnType<typeof aggregateMetrics>;
  platforms: string[];
  statuses: string[];
  sample: ReportEntity;
}

export default function AdGroupsReport() {
  const [search, setSearch] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [primaryGroupBy, setPrimaryGroupBy] = useState("none");
  const [secondaryGroupBy, setSecondaryGroupBy] = useState("none");
  const [dateSeed, setDateSeed] = useState(0);
  const [drawerEntity, setDrawerEntity] = useState<ReportEntity | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [colSettingsOpen, setColSettingsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(AD_GROUP_COLUMNS.map((c) => c.key));
  const [sortColumn, setSortColumn] = useState("spend");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const groupingOptions = GROUPING_OPTIONS.adGroups;

  const { allFiltered, isRefreshing } = useReportsData({
    level: "ad", search, platforms, statuses,
    primaryGroupBy: null, secondaryGroupBy: null,
    sortColumn: "spend", sortDirection: "desc",
    page: 1, pageSize: 500, dateSeed,
  });

  const adGroups: AdGroupRow[] = useMemo(() => {
    const groups = new Map<string, ReportEntity[]>();
    for (const e of allFiltered) {
      if (!e.creative) continue;
      const key = e.creative.adGroupName;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(e);
    }
    return Array.from(groups.entries()).map(([name, items]) => ({
      name,
      count: items.length,
      metrics: aggregateMetrics(items),
      platforms: [...new Set(items.map((i) => i.platform))],
      statuses: [...new Set(items.map((i) => i.status))],
      sample: items[0],
    }));
  }, [allFiltered]);

  // Convert ad groups to ReportEntity-like rows for table view
  const tableRows: ReportEntity[] = useMemo(() => {
    return adGroups.map((g) => ({
      id: g.name,
      name: g.name,
      parentId: null,
      level: "ad" as const,
      status: g.statuses[0] as ReportEntity["status"],
      platform: g.platforms[0] as ReportEntity["platform"],
      country: "US",
      metrics: { ...g.metrics, count: g.count } as any,
      parentName: undefined,
    }));
  }, [adGroups]);

  const handleSort = (col: string) => {
    if (sortColumn === col) setSortDirection((d) => d === "asc" ? "desc" : "asc");
    else { setSortColumn(col); setSortDirection("desc"); }
  };

  const selectedEntities = useMemo(() => allFiltered.filter((e) => selectedIds.has(e.id)), [allFiltered, selectedIds]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Ad Groups</h1>
        <div className="flex items-center gap-1 border rounded-md p-0.5">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode("table")}
          >
            <TableIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <ReportsToolbar
        search={search} onSearchChange={setSearch}
        platforms={platforms} onPlatformsChange={setPlatforms}
        statuses={statuses} onStatusesChange={setStatuses}
        groupingOptions={groupingOptions}
        primaryGroupBy={primaryGroupBy} onPrimaryGroupByChange={setPrimaryGroupBy}
        secondaryGroupBy={secondaryGroupBy} onSecondaryGroupByChange={setSecondaryGroupBy}
        onRefresh={() => setDateSeed((s) => s + 1)}
        onExport={() => toast.success("CSV exported")}
        onColumnSettings={() => setColSettingsOpen(true)}
      />

      {isRefreshing ? (
        <PageSkeleton variant={viewMode === "grid" ? "cards" : "table"} />
      ) : viewMode === "table" ? (
        <ReportsTable
          rows={tableRows}
          columns={AD_GROUP_COLUMNS}
          visibleColumns={visibleColumns}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onRowClick={(e) => {
            const group = adGroups.find((g) => g.name === e.name);
            if (group) setDrawerEntity(group.sample);
          }}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSortChange={handleSort}
          totalCount={tableRows.length}
          page={1}
          pageSize={100}
          onPageChange={() => {}}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {adGroups.map((group) => (
            <div
              key={group.name}
              className="rounded-lg border bg-card p-4 space-y-3 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setDrawerEntity(group.sample)}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground truncate">{group.name}</h3>
                <Badge variant="secondary" className="text-xs">{group.count} ads</Badge>
              </div>
              <div className="flex gap-1 flex-wrap">
                {group.platforms.map((p) => (
                  <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                ))}
                {group.statuses.map((s) => (
                  <Badge key={s} variant="outline" className={`text-xs ${statusColor[s]}`}>{s}</Badge>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Spend</span>
                  <p className="font-semibold text-foreground">${group.metrics.spend.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Revenue</span>
                  <p className="font-semibold text-foreground">${group.metrics.revenue.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">ROAS</span>
                  <p className="font-semibold text-foreground">{group.metrics.roas.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">CTR</span>
                  <p className="font-semibold text-foreground">{group.metrics.ctr}%</p>
                </div>
              </div>
            </div>
          ))}
          {adGroups.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">No ad groups found</div>
          )}
        </div>
      )}

      <ReportsBulkBar selected={selectedEntities} onClearSelection={() => setSelectedIds(new Set())} onExport={() => toast.success("CSV exported")} />
      <CreativeDetailDrawer entity={drawerEntity} open={!!drawerEntity} onOpenChange={(v) => !v && setDrawerEntity(null)} />
      <ColumnSettingsModal open={colSettingsOpen} onOpenChange={setColSettingsOpen} columns={AD_GROUP_COLUMNS} visibleKeys={visibleColumns} onVisibleKeysChange={setVisibleColumns} />
    </div>
  );
}
