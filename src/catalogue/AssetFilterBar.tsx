import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * §21.2 "One filter row: search + type-specific facets + date range.
 * Multi-select and bulk behave identically everywhere." Built once, driven
 * by whatever tag facet + label the caller passes in — the type-specific
 * part is just "which tags exist for this type's current rows", computed
 * by the caller from `AssetCardData.tags` rather than hardcoded per type.
 */
export interface DateRange {
  from?: string; // yyyy-mm-dd
  to?: string;
}

interface AssetFilterBarProps {
  query: string;
  onQueryChange: (v: string) => void;
  searchPlaceholder: string;
  facetOptions: string[];
  facetValue: string | "all";
  onFacetChange: (v: string) => void;
  facetLabel?: string;
  dateRange: DateRange;
  onDateRangeChange: (r: DateRange) => void;
  includeArchived: boolean;
  onIncludeArchivedChange: (v: boolean) => void;
  className?: string;
}

export function AssetFilterBar({
  query,
  onQueryChange,
  searchPlaceholder,
  facetOptions,
  facetValue,
  onFacetChange,
  facetLabel = "Tag",
  dateRange,
  onDateRangeChange,
  includeArchived,
  onIncludeArchivedChange,
  className,
}: AssetFilterBarProps) {
  const hasDateFilter = !!(dateRange.from || dateRange.to);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-56 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
      </div>

      {facetOptions.length > 0 && (
        <Select value={facetValue} onValueChange={onFacetChange}>
          <SelectTrigger className="h-8 w-[160px] text-xs">
            <SelectValue placeholder={facetLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All {facetLabel.toLowerCase()}s</SelectItem>
            {facetOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Last used</span>
        <input
          type="date"
          value={dateRange.from ?? ""}
          onChange={(e) => onDateRangeChange({ ...dateRange, from: e.target.value || undefined })}
          className="bg-transparent text-xs text-foreground outline-none"
          aria-label="From date"
        />
        <span className="text-muted-foreground">–</span>
        <input
          type="date"
          value={dateRange.to ?? ""}
          onChange={(e) => onDateRangeChange({ ...dateRange, to: e.target.value || undefined })}
          className="bg-transparent text-xs text-foreground outline-none"
          aria-label="To date"
        />
        {hasDateFilter && (
          <button
            type="button"
            onClick={() => onDateRangeChange({})}
            aria-label="Clear date range"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <label className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={includeArchived}
          onChange={(e) => onIncludeArchivedChange(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-border"
        />
        Show archived
      </label>
    </div>
  );
}

/** Shared filter predicate — one implementation for every type's grid. */
export function matchesFilters(
  card: { name: string; subtitle?: string; tags: string[]; lastUsedAt: string },
  query: string,
  facetValue: string,
  dateRange: DateRange,
): boolean {
  const q = query.trim().toLowerCase();
  if (q) {
    const hit =
      card.name.toLowerCase().includes(q) ||
      (card.subtitle?.toLowerCase().includes(q) ?? false) ||
      card.tags.some((t) => t.toLowerCase().includes(q));
    if (!hit) return false;
  }
  if (facetValue !== "all" && !card.tags.includes(facetValue)) return false;
  if (dateRange.from && card.lastUsedAt < dateRange.from) return false;
  if (dateRange.to && card.lastUsedAt > dateRange.to) return false;
  return true;
}
