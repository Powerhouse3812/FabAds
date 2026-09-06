import { useState, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Wand2 } from "lucide-react";
import { useReportsData, isGroupRow } from "@/hooks/use-reports-data";
import { useIsMobile } from "@/hooks/use-mobile";
import { pinCopiesToSources, useWriteStore } from "@/lib/ad-entity-write-store";
import {
  METRIC_COLUMNS,
  GROUPING_OPTIONS,
  getLaunchFilterOptions,
  type EntityStatus,
  type Platform,
  type ReportEntity,
} from "@/lib/reports-dummy-data";
import { PageSkeleton } from "@/components/reports/PageSkeleton";
import { ReportsToolbar } from "@/components/reports/ReportsToolbar";
import { ReportsTable } from "@/components/reports/ReportsTable";
import { ReportDetailDrawer } from "@/components/reports/ReportDetailDrawer";
import { ColumnSettingsModal } from "@/components/reports/ColumnSettingsModal";
import { MobileReportsShell } from "@/components/reports/mobile/MobileReportsShell";
import { useAdEntityActions } from "@/components/reports/actions/useAdEntityActions";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { SendToGenieMenu } from "@/genie6/flows/SendToGenieMenu";

export default function AdsReport() {
  const isMobile = useIsMobile();
  // openSessionChanges is otherwise unreachable on mobile — the only durable undo path beyond the 8s toast, and the sole in-UI escape from the duplicate-numbering edge case documented in ad-entity-write-store.ts.
  const { openSessionChanges } = useAdEntityActions();
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


  // Live duplicate/status writes — needed here to pin copies under their
  // sources in the mobile list (see mobileEntities below).
  const writes = useWriteStore();
  const handleSort = (col: string) => {
    if (sortColumn === col) setSortDirection((d) => d === "asc" ? "desc" : "asc");
    else { setSortColumn(col); setSortDirection("desc"); }
  };

  const selectedEntities = useMemo(() => allFiltered.filter((e) => selectedIds.has(e.id)), [allFiltered, selectedIds]);

  /**
   * Mobile list source. `rows` is page-sliced to 25 and can contain group rows
   * when grouping is on; MobileReportsList does its own windowing over the full
   * flat set, so it gets `allFiltered` (same useReportsData call as the table)
   * with any group row defensively filtered out.
   *
   * `allFiltered` is pre-sort — the hook only sorts on the way to `rows` — so
   * the sort the mobile sort sheet writes back is applied here. Same comparator
   * as the hook, so both branches agree on order.
   *
   * And the same POST-SORT pin: a duplicate carries zero metrics, so a
   * spend-desc sort drops it at the very bottom of the list. The desktop table
   * gets `pinCopiesToSources` inside useReportsData; mobile re-sorts here and so
   * has to re-apply it, or the user taps Duplicate, reads a toast saying copies
   * were created, and sees no new rows anywhere near the source.
   */
  const mobileEntities = useMemo(() => {
    const arr = allFiltered.filter((e) => !isGroupRow(e));
    arr.sort((a, b) => {
      const aVal = (a.metrics as unknown as Record<string, number>)[sortColumn] ?? 0;
      const bVal = (b.metrics as unknown as Record<string, number>)[sortColumn] ?? 0;
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });
    return pinCopiesToSources(arr, writes);
  }, [allFiltered, sortColumn, sortDirection, writes]);

  // Exactly the filters the mobile shell can set. The launch-provenance
  // filters are deliberately untouched — the shell cannot see or set them, so
  // clearing them here would silently widen a scope the user never opened.
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
    const a = document.createElement("a"); a.href = url; a.download = "ads-report.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  }, [selectedEntities, allFiltered]);

  const kebabActions = useCallback((entity: ReportEntity) => {
    const actions: { label: string; onClick?: () => void; render?: () => React.ReactNode }[] = [];
    if (entity.creative) {
      const path = entity.creative.type === "video"
        ? `/reports/creative/video?adId=${entity.id}`
        : `/reports/creative/image?adId=${entity.id}`;
      actions.push({
        label: "View Creatives",
        onClick: () => navigate(path),
      });
    }
    // §7.3 — ad-level rows only; a Genie action on an account/campaign/adset
    // row is meaningless. `ReportsTable`'s kebabActions returns flat
    // {label,onClick} tuples, which can't host SendToGenieMenu's own nested
    // DropdownMenu — so this uses the `render` escape hatch (see
    // ReportsTable.tsx's extended prop type) instead of reimplementing
    // Genie's action list here. Flexible/carousel ads (entity.creative.adType)
    // resolve their "static output only for now" caveat from whatever
    // flowSources.ts seeds for this same ad id — this only hands over the
    // id, not the format, since SendToGenieMenu takes no format prop.
    if (entity.level === "ad") {
      actions.push({
        label: "Send to Genie",
        render: () => (
          <SendToGenieMenu
            module="reports"
            refId={entity.id}
            align="end"
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Wand2 className="h-3.5 w-3.5 mr-2" />
                Send to Genie
              </DropdownMenuItem>
            }
          />
        ),
      });
    }
    return actions;
  }, [navigate]);

  return (
    /* Mobile bleeds past AppLayout's `p-3` mobile gutter so the shell's sticky
       header/scope bar reach the viewport edges. Desktop keeps `space-y-4`
       verbatim, and the desktop subtree below is byte-identical to before. */
    <div className={isMobile ? "-m-3 flex min-h-0 flex-1 flex-col" : "space-y-4"}>
      {isMobile ? (
        <MobileReportsShell
          title="Ads"
          level="ad"
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
            selectionCount={selectedIds.size}
            onClearSelection={() => setSelectedIds(new Set())}
            onBulkExport={exportCsv}
            selectedEntities={selectedEntities}
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
        </>
      )}

      {/* Mounted in BOTH branches — the mobile shell's onOpenEntity opens it. */}
      <ReportDetailDrawer entity={drawerEntity} open={!!drawerEntity} onOpenChange={(v) => !v && setDrawerEntity(null)} />
      <ColumnSettingsModal open={colSettingsOpen} onOpenChange={setColSettingsOpen} columns={METRIC_COLUMNS} visibleKeys={visibleColumns} onVisibleKeysChange={setVisibleColumns} />
    </div>
  );
}
