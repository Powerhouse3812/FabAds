import { useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import {
  ArrowUpDown,
  Filter,
  RefreshCw,
  Search,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INSIGHT_INDUSTRIES } from "@/lib/insights-dummy-data";
import { cn } from "@/lib/utils";
import {
  InsightsSearchPopover,
  type InsightsSearchScope,
} from "./InsightsSearchPopover";

export type InsightsV2Sort = "newest" | "oldest" | "most-active" | "popular";

export interface InsightsV2Filters {
  search: string;
  industry: string;
  status: string;
  adType: string;
  runningDays: string;
  metaOnly: boolean;
  dateRange?: DateRange;
  sort: InsightsV2Sort;
}

interface InsightsV2ToolbarProps {
  filters: InsightsV2Filters;
  onFiltersChange: (next: InsightsV2Filters) => void;
  onRefresh?: () => void;
  className?: string;
  /** Search scope this toolbar belongs to. Defaults to "feed" (My feeds). */
  searchScope?: InsightsSearchScope;
}

export const DEFAULT_INSIGHTS_V2_FILTERS: InsightsV2Filters = {
  search: "",
  industry: "",
  status: "all",
  adType: "",
  runningDays: "",
  metaOnly: true,
  sort: "newest",
};

const SORT_OPTIONS: { value: InsightsV2Sort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "most-active", label: "Most active" },
  { value: "popular", label: "Most popular" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "paused", label: "Paused" },
];

const TYPE_CHIPS = [
  { value: "all", label: "All" },
  { value: "Image", label: "Image" },
  { value: "Video", label: "Video" },
  { value: "Carousel", label: "Carousel" },
];

const RUNNING_DAYS_CHIPS = [
  { value: "all", label: "All" },
  { value: "1-7", label: "1-7 days" },
  { value: "8-30", label: "8-30 days" },
  { value: "31-90", label: "31-90 days" },
  { value: "90+", label: "90+ days" },
];

export function InsightsV2Toolbar({
  filters,
  onFiltersChange,
  onRefresh,
  className,
  searchScope = "feed",
}: InsightsV2ToolbarProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchPopoverOpen, setSearchPopoverOpen] = useState(false);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const setField = <K extends keyof InsightsV2Filters>(
    key: K,
    value: InsightsV2Filters[K],
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleRefresh = () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    onRefresh();
    window.setTimeout(() => setIsRefreshing(false), 400);
  };

  const handleSearchChange = (next: string) => {
    setField("search", next);
    if (next.trim().length > 0) {
      setSearchPopoverOpen(true);
    } else {
      setSearchPopoverOpen(false);
    }
  };

  const handleSearchFocus = () => {
    if (filters.search.trim().length > 0) {
      setSearchPopoverOpen(true);
    }
  };

  const resetMoreFilters = () => {
    onFiltersChange({ ...filters, adType: "", runningDays: "" });
  };

  const industrySelectValue = filters.industry || "all";
  const statusSelectValue = filters.status || "all";
  const adTypeChipValue = filters.adType || "all";
  const runningDaysChipValue = filters.runningDays || "all";

  const moreFiltersActiveCount =
    (filters.adType ? 1 : 0) + (filters.runningDays ? 1 : 0);

  return (
    <div
      className={cn(
        "sticky top-0 z-20 bg-background/95 backdrop-blur px-4 py-1.5",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {/* Left: search + filter + sort icons */}
        <div className="flex items-center gap-1 flex-1 min-w-0 max-w-[420px]">
          <div className="relative flex-1 min-w-0">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Tag className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              ref={searchInputRef}
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={handleSearchFocus}
              placeholder="Search by keyword, brand…"
              className="h-8 pl-8 pr-8 text-[12px]"
            />
            <InsightsSearchPopover
              query={filters.search}
              open={searchPopoverOpen}
              onOpenChange={setSearchPopoverOpen}
              onApplyHere={(q) => setField("search", q)}
              anchorRef={searchInputRef}
              currentScope={searchScope}
            />
          </div>
          <Popover open={moreFiltersOpen} onOpenChange={setMoreFiltersOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-9 shrink-0 relative"
                aria-label="More filters"
              >
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                {moreFiltersActiveCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary"
                  />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-0">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  More filters
                </span>
              </div>
              <div className="px-3 py-3 space-y-3">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                    Ad type
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {TYPE_CHIPS.map((opt) => {
                      const active = adTypeChipValue === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            setField(
                              "adType",
                              opt.value === "all" ? "" : opt.value,
                            )
                          }
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[11px] transition-colors border",
                            active
                              ? "bg-primary text-primary-foreground border-primary font-semibold"
                              : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80",
                          )}
                          aria-pressed={active}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                    Running days
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {RUNNING_DAYS_CHIPS.map((opt) => {
                      const active = runningDaysChipValue === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            setField(
                              "runningDays",
                              opt.value === "all" ? "" : opt.value,
                            )
                          }
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[11px] transition-colors border",
                            active
                              ? "bg-primary text-primary-foreground border-primary font-semibold"
                              : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80",
                          )}
                          aria-pressed={active}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end px-3 py-2 border-t border-border/60">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={resetMoreFilters}
                  disabled={moreFiltersActiveCount === 0}
                >
                  Reset
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right: 2 dropdowns + big Sort + refresh */}
        <div className="flex items-center gap-2 shrink-0">
          <Select
            value={industrySelectValue}
            onValueChange={(v) => setField("industry", v === "all" ? "" : v)}
          >
            <SelectTrigger className="h-8 w-[140px] text-[12px]">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All industries</SelectItem>
              {INSIGHT_INDUSTRIES.map((ind) => (
                <SelectItem key={ind} value={ind}>
                  {ind}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusSelectValue}
            onValueChange={(v) => setField("status", v)}
          >
            <SelectTrigger className="h-8 w-[110px] text-[12px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort by — promoted to a full-sized dropdown on the right (was a
              tiny icon button on the left). Size matches Industry/Status. */}
          <Select
            value={filters.sort}
            onValueChange={(v) => setField("sort", v as InsightsV2Sort)}
          >
            <SelectTrigger className="h-8 w-[140px] text-[12px]" aria-label="Sort by">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-9"
            onClick={handleRefresh}
            disabled={!onRefresh}
            aria-label="Refresh"
          >
            <RefreshCw
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform duration-300",
                isRefreshing && "rotate-180",
              )}
            />
          </Button>
        </div>
      </div>
    </div>
  );
}
