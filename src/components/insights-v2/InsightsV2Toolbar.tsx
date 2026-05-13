import { useState } from "react";
import type { DateRange } from "react-day-picker";
import {
  ArrowUpDown,
  Columns3,
  Columns4,
  Filter,
  Grid3X3,
  RefreshCw,
  Search,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export function InsightsV2Toolbar({
  filters,
  onFiltersChange,
  gridSize,
  onGridSizeChange,
  onRefresh,
  className,
}: InsightsV2ToolbarProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const industrySelectValue = filters.industry || "all";
  const statusSelectValue = filters.status || "all";
  const typeSelectValue = filters.adType || "all";
  const runningSelectValue = filters.runningDays || "all";

  return (
    <div
      className={cn(
        "sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border/60 px-4 py-2.5",
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
              value={filters.search}
              onChange={(e) => setField("search", e.target.value)}
              placeholder="Search by keyword, brand…"
              className="h-9 pl-8 pr-8 text-[12px]"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            aria-label="Filter"
          >
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            aria-label="Sort"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right: 4 dropdowns + grid toggle + refresh */}
        <div className="flex items-center gap-2 shrink-0">
          <Select
            value={industrySelectValue}
            onValueChange={(v) => setField("industry", v === "all" ? "" : v)}
          >
            <SelectTrigger className="h-9 w-[140px] text-[12px]">
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
            <SelectTrigger className="h-9 w-[110px] text-[12px]">
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
            value={typeSelectValue}
            onValueChange={(v) => setField("adType", v === "all" ? "" : v)}
          >
            <SelectTrigger className="h-9 w-[110px] text-[12px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={runningSelectValue}
            onValueChange={(v) => setField("runningDays", v === "all" ? "" : v)}
          >
            <SelectTrigger className="h-9 w-[130px] text-[12px]">
              <SelectValue placeholder="Running days" />
            </SelectTrigger>
            <SelectContent>
              {RUNNING_DAYS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ToggleGroup
            type="single"
            value={String(gridSize)}
            onValueChange={(val) => {
              if (!val) return;
              const parsed = Number(val);
              if (parsed === 3 || parsed === 4 || parsed === 5) {
                onGridSizeChange(parsed);
              }
            }}
            className="border border-border rounded-md h-9"
          >
            <ToggleGroupItem value="3" aria-label="3 columns" className="h-9 w-9 px-0">
              <Columns3 className="h-3.5 w-3.5" />
            </ToggleGroupItem>
            <ToggleGroupItem value="4" aria-label="4 columns" className="h-9 w-9 px-0">
              <Columns4 className="h-3.5 w-3.5" />
            </ToggleGroupItem>
            <ToggleGroupItem value="5" aria-label="5 columns" className="h-9 w-9 px-0">
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
