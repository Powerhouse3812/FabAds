import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  EntityLevel,
  EntityStatus,
  Platform,
  ReportEntity,
} from "@/lib/reports-dummy-data";
import { useSessionChanges, useStoreAnnouncement } from "@/lib/ad-entity-write-store";
import { MobileReportsHeader } from "./MobileReportsHeader";
import { MobileLevelSegments } from "./MobileLevelSegments";
import { MobileReportsList, type MobileReportsEmptyState } from "./MobileReportsList";
import { MobileFiltersSheet, getMobileFiltersActiveCount } from "./MobileFiltersSheet";
import { MobileSortSheet, getMobileSortTriggerLabel } from "./MobileSortSheet";
import type { MobileThirdMetric } from "./MobileReportRow";

/**
 * MobileReportsShell — composes the mobile Reports surface.
 *
 * Sticky stack, deliberately only one layer deep:
 *   top-0   MobileReportsHeader  (48px)
 *   (scrolls) level segments · search · Filters/Sort row
 *
 * NOTE — deliberately removed (product decision, not an oversight): this shell
 * used to also pin a persistent account/page "scope bar" (`MobileScopeBar` +
 * `MobileScopeSheet`) directly under the header. It was built on a
 * misunderstanding — it was meant to belong to the duplicate flow, which is
 * now going a different direction — and has been cut. Do not re-add a scope
 * bar here; the vertical space it used to occupy goes back to the list.
 *
 * Everything here is presentational + local UI state. The parent page owns the
 * data query and passes results down, so this shell and the desktop table read
 * from the same useReportsData call.
 */
export interface MobileReportsShellProps {
  title: string;
  level: EntityLevel;

  /** Rows the parent has loaded for the current query. */
  entities: ReportEntity[];
  totalCount: number;
  isLoading?: boolean;

  search: string;
  onSearchChange: (v: string) => void;

  statuses: EntityStatus[];
  onStatusesChange: (v: EntityStatus[]) => void;
  platforms: Platform[];
  onPlatformsChange: (v: Platform[]) => void;

  sortColumn: string;
  onSortColumnChange: (v: string) => void;
  sortDirection: "asc" | "desc";
  onSortDirectionChange: (v: "asc" | "desc") => void;

  onClearAllFilters: () => void;
  onOpenEntity: (entity: ReportEntity) => void;
  onExport?: () => void;
  onOpenSessionChanges?: () => void;
}

export function MobileReportsShell({
  title,
  level,
  entities,
  totalCount,
  isLoading,
  search,
  onSearchChange,
  statuses,
  onStatusesChange,
  platforms,
  onPlatformsChange,
  sortColumn,
  onSortColumnChange,
  sortDirection,
  onSortDirectionChange,
  onClearAllFilters,
  onOpenEntity,
  onExport,
  onOpenSessionChanges,
}: MobileReportsShellProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [thirdMetric, setThirdMetric] = useState<string>("");

  const sessionChanges = useSessionChanges();
  // One sr-only live region for the whole surface. Optimistic writes are
  // instant and silent otherwise, so a screen-reader user would get no
  // confirmation that a pause actually landed.
  const announcement = useStoreAnnouncement();

  const activeFilterCount = getMobileFiltersActiveCount({ statuses, platforms });

  /**
   * Which empty state to show. Two distinct reasons rather than one flat
   * "No data" — each names its cause and offers the matching undo.
   * Precedence: search is the most specific signal the user just gave, then
   * filters.
   */
  const emptyState = useMemo<MobileReportsEmptyState>(() => {
    if (search.trim()) {
      return { reason: "search", query: search, onClearSearch: () => onSearchChange("") };
    }
    return {
      reason: "filters",
      activeFilterCount,
      onClearFilters: onClearAllFilters,
    };
  }, [search, activeFilterCount, onSearchChange, onClearAllFilters]);

  // Collapse the infinite-scroll window to page 1 whenever the QUERY changes.
  // Deliberately excludes entities.length — appending a fetched page also
  // changes that, and it must not throw the user back to the top.
  const resetKey = useMemo(
    () => JSON.stringify([level, search, statuses, platforms, sortColumn, sortDirection]),
    [level, search, statuses, platforms, sortColumn, sortDirection],
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <MobileReportsHeader
        title={title}
        onExport={onExport}
        onOpenSessionChanges={onOpenSessionChanges}
        sessionChangeCount={sessionChanges.length}
        className="sticky top-0 z-40"
      />

      {/* Scrolling controls — not pinned, see the header comment. */}
      <div className="flex flex-col gap-2 border-b border-border px-3 py-2">
        <MobileLevelSegments activeLevel={level} />

        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search…"
            aria-label="Search report rows"
            className="h-11 pl-9 text-[13px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setFiltersOpen(true)}
            className="h-11 flex-1 justify-start gap-2 text-[13px]"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-auto rounded-full bg-primary px-1.5 font-mono text-[10px] text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setSortOpen(true)}
            className="h-11 flex-1 justify-start gap-2 text-[13px]"
          >
            <ArrowUpDown className="h-4 w-4" />
            <span className="truncate">
              {getMobileSortTriggerLabel(sortColumn, sortDirection)}
            </span>
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <MobileReportsList
          entities={entities}
          totalCount={totalCount}
          level={level}
          onOpen={onOpenEntity}
          thirdMetric={(thirdMetric || undefined) as MobileThirdMetric | undefined}
          emptyState={emptyState}
          onOpenFilters={() => setFiltersOpen(true)}
          isLoading={isLoading}
          resetKey={resetKey}
        />
      </div>

      <MobileFiltersSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        level={level}
        statuses={statuses}
        onStatusesChange={onStatusesChange}
        platforms={platforms}
        onPlatformsChange={onPlatformsChange}
        onClearAll={onClearAllFilters}
      />
      <MobileSortSheet
        open={sortOpen}
        onOpenChange={setSortOpen}
        sortColumn={sortColumn}
        onSortColumnChange={onSortColumnChange}
        sortDirection={sortDirection}
        onSortDirectionChange={onSortDirectionChange}
        thirdMetricKey={thirdMetric}
        onThirdMetricKeyChange={setThirdMetric}
      />

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}

export default MobileReportsShell;
