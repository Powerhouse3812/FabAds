/**
 * ReviewFiltersPopover — inline search + filter bar for Step 4 Review (D23).
 *
 * Renders as a horizontal bar:
 *   [🔍 search input ............] [All] [Overridden] [Campaigns] [Ad sets] [Ads]
 *
 * Intentionally simple — no popover, no status rows, just a search field and
 * kind-filter chips that wire directly into the tree rail via highlightQuery /
 * filterKind props on NodeTreeRail.
 */
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type FilterKind = "all" | "campaign" | "adset" | "ad" | "overridden";

export interface ReviewFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterKind: FilterKind;
  onFilterKindChange: (k: FilterKind) => void;
}

const CHIPS: { label: string; value: FilterKind }[] = [
  { label: "All", value: "all" },
  { label: "Overridden", value: "overridden" },
  { label: "Campaigns", value: "campaign" },
  { label: "Ad sets", value: "adset" },
  { label: "Ads", value: "ad" },
];

export function ReviewFiltersPopover({
  searchQuery,
  onSearchChange,
  filterKind,
  onFilterKindChange,
}: ReviewFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2">
      {/* Search input */}
      <div className="relative flex min-w-0 flex-1 items-center">
        <Search className="pointer-events-none absolute left-2.5 h-3 w-3 text-muted-foreground/60" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search nodes…"
          className={cn(
            "w-full rounded-full border border-border bg-background py-1 pl-7 pr-7",
            "font-mono text-[12px] text-foreground placeholder:text-muted-foreground/50",
            "outline-none transition-colors focus:border-primary/40 focus:ring-1 focus:ring-primary/20",
          )}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
            className="absolute right-2 flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Filter kind chips */}
      <div className="flex flex-wrap items-center gap-1">
        {CHIPS.map((chip) => {
          const active = filterKind === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => onFilterKindChange(chip.value)}
              className={cn(
                "cursor-pointer rounded-full border px-2 py-0.5 font-mono text-[11px] transition-colors",
                active
                  ? "border-primary/30 bg-primary/10 font-medium text-foreground"
                  : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground",
              )}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
