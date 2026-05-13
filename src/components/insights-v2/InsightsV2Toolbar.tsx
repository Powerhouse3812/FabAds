import { useState } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  CalendarDays,
  ChevronDown,
  Columns2,
  Columns3,
  Columns4,
  Facebook,
  Grid3X3,
  RefreshCw,
  Search,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { INSIGHT_INDUSTRIES } from "@/lib/insights-dummy-data";
import { cn } from "@/lib/utils";

export interface InsightsV2Filters {
  search: string;
  industry: string;
  status: string;
  adType: string;
  runningDays: string;
  metaOnly: boolean;
  dateRange?: DateRange;
}

interface InsightsV2ToolbarProps {
  filters: InsightsV2Filters;
  onFiltersChange: (next: InsightsV2Filters) => void;
  gridSize: 2 | 3 | 4 | 5;
  onGridSizeChange: (size: 2 | 3 | 4 | 5) => void;
  onRefresh?: () => void;
  className?: string;
}

export const DEFAULT_INSIGHTS_V2_FILTERS: InsightsV2Filters = {
  search: "",
  industry: "",
  status: "all",
  adType: "",
  runningDays: "",
  metaOnly: true,
};

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "paused", label: "Paused" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "Image", label: "Image" },
  { value: "Video", label: "Video" },
  { value: "Carousel", label: "Carousel" },
];

const RUNNING_DAYS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "1-7", label: "1-7 days" },
  { value: "8-30", label: "8-30 days" },
  { value: "31-90", label: "31-90 days" },
  { value: "90+", label: "90+ days" },
];

function formatRangeLabel(range?: DateRange): string {
  if (!range?.from) return "Date range";
  const fromLabel = format(range.from, "MMM dd");
  if (!range.to) return fromLabel;
  return `${fromLabel} - ${format(range.to, "MMM dd")}`;
}

export function InsightsV2Toolbar({
  filters,
  onFiltersChange,
  gridSize,
  onGridSizeChange,
  onRefresh,
  className,
}: InsightsV2ToolbarProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const setField = <K extends keyof InsightsV2Filters>(key: K, value: InsightsV2Filters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleRefresh = () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    onRefresh();
    window.setTimeout(() => setIsRefreshing(false), 400);
  };

  const hasDateRange = Boolean(filters.dateRange?.from);

  return (
    <div
      className={cn(
        "sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border/60 px-4 py-2.5 flex flex-col gap-2.5",
        className,
      )}
    >
      {/* Row 1: Meta only (left) and date / grid / refresh controls (right) */}
      <div className="flex items-center gap-2 flex-wrap">
        <Toggle
          pressed={filters.metaOnly}
          onPressedChange={(pressed) => setField("metaOnly", pressed)}
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-1.5 rounded-full px-3 text-xs font-medium",
            filters.metaOnly
              ? "bg-primary/15 text-primary border-primary/40 hover:bg-primary/20 hover:text-primary"
              : "text-muted-foreground",
          )}
          aria-label="Show Meta ads only"
        >
          <Facebook className="h-3.5 w-3.5" />
          Meta only
        </Toggle>

        <div className="ml-auto flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 gap-2 text-xs font-medium",
                  hasDateRange ? "border-primary/40 text-foreground" : "text-muted-foreground",
                )}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                {formatRangeLabel(filters.dateRange)}
                {hasDateRange && (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="Clear date range"
                    className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-sm hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      setField("dateRange", undefined);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        setField("dateRange", undefined);
                      }
                    }}
                  >
                    <X className="h-3 w-3" />
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={filters.dateRange}
                onSelect={(range) => setField("dateRange", range)}
                numberOfMonths={2}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <ToggleGroup
            type="single"
            value={String(gridSize)}
            onValueChange={(val) => {
              if (!val) return;
              const parsed = Number(val);
              if (parsed === 2 || parsed === 3 || parsed === 4 || parsed === 5) {
                onGridSizeChange(parsed);
              }
            }}
            variant="outline"
            size="sm"
            className="gap-0.5 rounded-md border border-border bg-card p-0.5"
          >
            <ToggleGroupItem value="2" aria-label="2 columns" className="h-7 w-7 border-0 p-0">
              <Columns2 className="h-3.5 w-3.5" />
            </ToggleGroupItem>
            <ToggleGroupItem value="3" aria-label="3 columns" className="h-7 w-7 border-0 p-0">
              <Columns3 className="h-3.5 w-3.5" />
            </ToggleGroupItem>
            <ToggleGroupItem value="4" aria-label="4 columns" className="h-7 w-7 border-0 p-0">
              <Columns4 className="h-3.5 w-3.5" />
            </ToggleGroupItem>
            <ToggleGroupItem value="5" aria-label="5 columns" className="h-7 w-7 border-0 p-0">
              <Grid3X3 className="h-3.5 w-3.5" />
            </ToggleGroupItem>
          </ToggleGroup>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={handleRefresh}
            disabled={!onRefresh}
            aria-label="Refresh"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4 transition-transform duration-[400ms]",
                isRefreshing && "rotate-180",
              )}
            />
          </Button>
        </div>
      </div>

      {/* Row 2: search + 4 selects */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative max-w-[280px] flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => setField("search", e.target.value)}
            placeholder="Search by keyword, brand…"
            className="h-9 pl-8 pr-8 text-sm"
          />
          <Tag className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
        </div>

        <Select
          value={filters.industry || "all"}
          onValueChange={(v) => setField("industry", v === "all" ? "" : v)}
        >
          <SelectTrigger className="h-9 w-[140px] text-sm font-medium">
            <SelectValue placeholder="Industry" />
            <ChevronDown className="hidden h-4 w-4 opacity-50" aria-hidden />
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

        <Select value={filters.status} onValueChange={(v) => setField("status", v)}>
          <SelectTrigger className="h-9 w-[120px] text-sm font-medium">
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

        <Select
          value={filters.adType || "all"}
          onValueChange={(v) => setField("adType", v === "all" ? "" : v)}
        >
          <SelectTrigger className="h-9 w-[120px] text-sm font-medium">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value || "all"} value={opt.value || "all"}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.runningDays || "all"}
          onValueChange={(v) => setField("runningDays", v === "all" ? "" : v)}
        >
          <SelectTrigger className="h-9 w-[140px] text-sm font-medium">
            <SelectValue placeholder="Running days" />
          </SelectTrigger>
          <SelectContent>
            {RUNNING_DAYS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value || "all"} value={opt.value || "all"}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
