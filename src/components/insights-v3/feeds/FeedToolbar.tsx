/**
 * My Feeds toolbar (sticky, under the title): search pill · filter toggle · Industry · Category · gear.
 * The filter toggle opens Quick filters; the gear opens the sources list (what feeds My Feeds).
 * When the title row collapses on scroll, the Period pill joins this row so the scope never disappears.
 */
import { ListFilter, Settings2 } from "lucide-react";
import type { UserPrefs } from "@/lib/insights-v3/selectors";
import { cn } from "@/lib/utils";
import { InsightsSearch } from "@/components/insights-v3/search/InsightsSearch";
import { Hint, ScopePills, type ScopePillsProps } from "@/components/insights-v3/shared";
import { SourcesPopover } from "./SourcesPopover";

export interface FeedToolbarProps {
  scopeProps: Omit<ScopePillsProps, "kind">;
  prefs: UserPrefs;
  /** Tags applied in Quick filters (shown as a badge on the filter toggle). */
  appliedCount: number;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  /** Omitted while the panel isn't mounted (loading) so aria-controls never points at nothing. */
  filtersId?: string;
  /** The title row is collapsed (page scrolled). */
  compact: boolean;
  /** Nothing feeds My Feeds yet: the scope pickers and filters have nothing to act on. */
  disabled?: boolean;
}

export function FeedToolbar({ scopeProps, prefs, appliedCount, filtersOpen, onToggleFilters, filtersId, compact, disabled }: FeedToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <InsightsSearch variant="pill" />
      {!disabled && (
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
      )}
      <span className="flex-1" />
      {!disabled && (
        <>
          <ScopePills kind="filters" {...scopeProps} />
          {compact && <ScopePills kind="period" {...scopeProps} />}
        </>
      )}
      <SourcesPopover prefs={prefs} align="end">
        <button
          type="button"
          aria-label="Manage sources: what feeds My Feeds"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-sm:h-9 max-sm:w-9"
        >
          <Settings2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </SourcesPopover>
    </div>
  );
}
