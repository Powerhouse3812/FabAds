/**
 * My Feeds toolbar (sticky, under the title): ONE row = search pill · filter toggle (Quick filters) ·
 * Domain · Page · Status · Running days · Similar ads · Sort · gear (sources).
 * Industry · Category · Period and the sources gear live in the page header (top-right), not here.
 */
import { ListFilter } from "lucide-react";
import type { FeedFilterOptions, FeedFilters } from "@/lib/insights-v3/selectors";
import { FEED_AD_SORT_LABEL, type FeedAdSort } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";
import { InsightsSearch } from "@/components/insights-v3/search/InsightsSearch";
import { Hint, SortControl } from "@/components/insights-v3/shared";
import { FeedFilterPills } from "./FeedFilters";

export interface FeedToolbarProps {
  /** Tags applied in Quick filters (shown as a badge on the filter toggle). */
  appliedCount: number;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  /** Omitted while the panel isn't mounted (loading) so aria-controls never points at nothing. */
  filtersId?: string;
  filterOptions: FeedFilterOptions;
  filters: FeedFilters;
  onFilterChange: (field: keyof FeedFilters, ids: string[]) => void;
  onClearFilters: () => void;
  sort: FeedAdSort;
  onSort: (next: FeedAdSort) => void;
  /** Nothing feeds My Feeds yet: the filters, sort and tag toggle have nothing to act on. */
  disabled?: boolean;
}

export function FeedToolbar({
  appliedCount,
  filtersOpen,
  onToggleFilters,
  filtersId,
  filterOptions,
  filters,
  onFilterChange,
  onClearFilters,
  sort,
  onSort,
  disabled,
}: FeedToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <InsightsSearch variant="pill" />
      {!disabled && (
        <>
          <Hint content={filtersOpen ? "Hide quick filters" : "Show quick filters"}>
            <button
              type="button"
              aria-label={appliedCount > 0 ? `Filters, ${appliedCount} applied` : "Filters"}
              aria-expanded={filtersOpen}
              aria-controls={filtersId}
              onClick={onToggleFilters}
              className={cn(
                "relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors max-sm:h-9 max-sm:w-9",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                filtersOpen || appliedCount > 0
                  ? "bg-primary/15 text-primary-text hover:bg-primary/25"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <ListFilter className="h-4 w-4" aria-hidden="true" />
              {appliedCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-mono text-[10px] font-bold leading-none tabular-nums text-primary-foreground"
                >
                  {appliedCount}
                </span>
              )}
            </button>
          </Hint>
          <FeedFilterPills options={filterOptions} filters={filters} onChange={onFilterChange} onClearAll={onClearFilters} />
          <span className="flex-1" />
          {/* narrower select: this row also carries five filters, and has to stay ONE row once "Clear filters" appears */}
          <SortControl value={sort} options={FEED_AD_SORT_LABEL} onChange={onSort} className="[&_button]:min-w-[132px]" />
        </>
      )}
    </div>
  );
}
