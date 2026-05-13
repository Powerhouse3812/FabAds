import { useState } from "react";
import type { DateRange } from "react-day-picker";
import {
  ArrowUpDown,
  CalendarDays,
  Filter,
  Settings,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { INSIGHT_INDUSTRIES } from "@/lib/insights-dummy-data";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";

const DATE_PRESETS = [
  { label: "Today", days: 1 },
  { label: "3 days", days: 3 },
  { label: "7 days", days: 7 },
  { label: "15 days", days: 15 },
  { label: "30 days", days: 30 },
] as const;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function defaultDateRangeLast7(): DateRange {
  const to = startOfDay(new Date());
  const from = new Date(to);
  from.setDate(from.getDate() - 6);
  return { from, to };
}

export type InsightsV2Sort = "newest" | "oldest" | "most-active" | "popular";

export interface InsightsV2Filters {
  search: string;
  industry: string;
  status: string;
  adType: string;
  runningDays: string;
  dateRange?: DateRange;
  sort: InsightsV2Sort;
}

export interface InsightsV2DisplayPrefs {
  brandDetails: boolean;
  adCopy: boolean;
  headlineDesc: boolean;
  cta: boolean;
  domain: boolean;
  statusMeta: boolean;
  similarAds: boolean;
  analysed: boolean;
  transparency: boolean;
}

// MINIMAL by default — only the essentials are visible to keep cognitive
// load low and the surface breathy. Power users opt in to the rest via the
// Settings popover.
export const DEFAULT_INSIGHTS_V2_DISPLAY_PREFS: InsightsV2DisplayPrefs = {
  brandDetails: true,   // avatar + brand name + follow + status dot — essential
  adCopy: true,         // body text — essential
  headlineDesc: false,  // headline + description — Meta-specific noise, opt-in
  cta: false,           // CTA pill — opt-in
  domain: false,        // page domain — opt-in
  statusMeta: true,     // tiny status dot + duration on brand row — small, useful
  similarAds: false,    // chip on media — opt-in
  analysed: false,      // (chip removed in A-12.86) — opt-in pending restore
  transparency: false,  // chip on media — opt-in
};

interface InsightsV2ToolbarProps {
  filters: InsightsV2Filters;
  onFiltersChange: (next: InsightsV2Filters) => void;
  onRefresh?: () => void;
  className?: string;
  displayPrefs?: InsightsV2DisplayPrefs;
  onDisplayPrefsChange?: (next: InsightsV2DisplayPrefs) => void;
  /** When true, toolbar collapses to compact mode: Add Filter + applied chips
      + Date stay. Industry/Status/Sort/Settings animate out via max-width +
      opacity transitions. Search is no longer here — it lives in Row 1
      (Identity row) and stays visible always. */
  compact?: boolean;
  /** For active-filter chip removal */
  selectedTag?: string;
  onClearTag?: () => void;
}

export const DEFAULT_INSIGHTS_V2_FILTERS: InsightsV2Filters = {
  search: "",
  industry: "",
  status: "all",
  adType: "",
  runningDays: "",
  dateRange: defaultDateRangeLast7(),
  sort: "newest",
};

const SORT_OPTIONS: { value: InsightsV2Sort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "most-active", label: "Most active" },
  { value: "popular", label: "Most popular" },
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

function ActiveFilterChip({
  label,
  dotClass,
  onClear,
}: {
  label: string;
  dotClass?: string;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-primary/10 border border-primary/30 px-2.5 text-[11px] font-medium text-primary">
      {dotClass && <span className={cn("h-1.5 w-1.5 rounded-full", dotClass)} aria-hidden />}
      <span className="truncate max-w-[140px]">{label}</span>
      <button
        type="button"
        onClick={onClear}
        aria-label={`Clear ${label} filter`}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

const DISPLAY_TOGGLES: { key: keyof InsightsV2DisplayPrefs; label: string }[] = [
  { key: "brandDetails", label: "Brand Details" },
  { key: "adCopy", label: "Ad Copy" },
  { key: "headlineDesc", label: "Headline & Description" },
  { key: "cta", label: "CTA button" },
  { key: "domain", label: "Domain" },
  { key: "statusMeta", label: "Status meta (dot + duration)" },
  { key: "similarAds", label: "Similar Ads tag" },
  { key: "transparency", label: "Transparency mode badge" },
];

export function InsightsV2Toolbar({
  filters,
  onFiltersChange,
  onRefresh,
  className,
  displayPrefs = DEFAULT_INSIGHTS_V2_DISPLAY_PREFS,
  onDisplayPrefsChange,
  compact = false,
  selectedTag,
  onClearTag,
}: InsightsV2ToolbarProps) {
  const [addFilterOpen, setAddFilterOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const setField = <K extends keyof InsightsV2Filters>(
    key: K,
    value: InsightsV2Filters[K],
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const setDisplayField = (
    key: keyof InsightsV2DisplayPrefs,
    value: boolean,
  ) => {
    onDisplayPrefsChange?.({ ...displayPrefs, [key]: value });
  };

  const handleReload = () => {
    onRefresh?.();
    setSettingsOpen(false);
  };

  const resetAddFilter = () => {
    onFiltersChange({
      ...filters,
      industry: "",
      status: "all",
      adType: "",
      runningDays: "",
    });
  };

  const industrySelectValue = filters.industry || "all";
  const adTypeChipValue = filters.adType || "all";
  const runningDaysChipValue = filters.runningDays || "all";

  // Active-filter count for the badge on the "Add Filter" trigger.
  const addFilterActiveCount =
    (filters.industry ? 1 : 0) +
    (filters.status === "active" ? 1 : 0) +
    (filters.adType ? 1 : 0) +
    (filters.runningDays ? 1 : 0);

  // Common collapse classes — animate width + opacity smoothly when compact.
  const collapseCls = (collapsed: boolean) =>
    cn(
      "transition-[max-width,opacity,margin] duration-300 ease-out overflow-hidden whitespace-nowrap",
      collapsed
        ? "max-w-0 opacity-0 ml-0 -mr-2 pointer-events-none"
        : "max-w-[200px] opacity-100",
    );

  // Sort label for active-filter chip
  const sortLabel = SORT_OPTIONS.find((o) => o.value === filters.sort)?.label;

  return (
    <div
      className={cn(
        "sticky top-0 z-20 bg-background/95 backdrop-blur px-4 py-1.5",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2 gap-y-2">
        {/* Left: Add Filter trigger + inline applied chips */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <Popover open={addFilterOpen} onOpenChange={setAddFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-[12px] font-normal relative"
                aria-label="Add filter"
              >
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Add Filter</span>
                {addFilterActiveCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="ml-0.5 h-4 min-w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold inline-flex items-center justify-center px-1"
                  >
                    {addFilterActiveCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80 p-0">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  Filters
                </span>
              </div>
              <div className="px-3 py-3 space-y-4">
                {/* Industry */}
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                    Industry
                  </div>
                  <Select
                    value={industrySelectValue}
                    onValueChange={(v) => setField("industry", v === "all" ? "" : v)}
                  >
                    <SelectTrigger className="h-8 w-full text-[12px]">
                      <SelectValue placeholder="All industries" />
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
                </div>

                {/* Status — Active only toggle */}
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                    Status
                  </div>
                  <label className="flex items-center justify-between py-1 text-sm cursor-pointer">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          filters.status === "active"
                            ? "bg-emerald-500"
                            : "bg-muted-foreground/60",
                        )}
                        aria-hidden
                      />
                      Active only
                    </span>
                    <Switch
                      checked={filters.status === "active"}
                      onCheckedChange={(checked) =>
                        setField("status", checked ? "active" : "all")
                      }
                      aria-label="Toggle Active only"
                    />
                  </label>
                </div>

                {/* Ad type chips */}
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
                            "rounded-full px-2.5 py-1 text-[11px] transition-colors border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background",
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

                {/* Running days chips */}
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
                            "rounded-full px-2.5 py-1 text-[11px] transition-colors border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background",
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
                  onClick={resetAddFilter}
                  disabled={addFilterActiveCount === 0}
                >
                  Reset
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Applied-filter chip strip — always visible inline next to Add
              Filter. Mirrors active filters as removable pills. */}
          <div className="flex flex-wrap items-center gap-1.5">
            {filters.industry && (
              <ActiveFilterChip
                label={filters.industry}
                onClear={() => setField("industry", "")}
              />
            )}
            {filters.status === "active" && (
              <ActiveFilterChip
                label="Active only"
                dotClass="bg-emerald-500"
                onClear={() => setField("status", "all")}
              />
            )}
            {compact && filters.sort !== "newest" && sortLabel && (
              <ActiveFilterChip
                label={`Sort: ${sortLabel}`}
                onClear={() => setField("sort", "newest")}
              />
            )}
            {filters.adType && (
              <ActiveFilterChip
                label={filters.adType}
                onClear={() => setField("adType", "")}
              />
            )}
            {filters.runningDays && (
              <ActiveFilterChip
                label={`${filters.runningDays} days`}
                onClear={() => setField("runningDays", "")}
              />
            )}
            {selectedTag && (
              <ActiveFilterChip
                label={selectedTag}
                onClear={() => onClearTag?.()}
              />
            )}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right: Sort + Date + Settings — Sort/Settings collapse when compact */}
        <div className="flex items-center gap-2 shrink-0">
          <div className={collapseCls(compact)} aria-hidden={compact}>
          {/* Sort by */}
          <Select
            value={filters.sort}
            onValueChange={(v) => setField("sort", v as InsightsV2Sort)}
          >
            <SelectTrigger className="h-8 w-[160px] text-[12px] relative" aria-label="Sort by">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground mr-1 shrink-0" />
              <span className="text-muted-foreground mr-1">Sort:</span>
              <SelectValue />
              {filters.sort !== "newest" && (
                <span
                  aria-hidden
                  className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-primary"
                />
              )}
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>

          {/* Date range picker — stays visible in compact too. */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-[12px] font-normal"
                aria-label="Date range"
              >
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                {(() => {
                  const r = filters.dateRange;
                  if (!r?.from) return <span className="text-muted-foreground">Date range</span>;
                  const today = startOfDay(new Date());
                  const from = startOfDay(r.from);
                  const diffDays = Math.round((today.getTime() - from.getTime()) / 86400000) + 1;
                  const matchedPreset = DATE_PRESETS.find((p) => p.days === diffDays && r.to && startOfDay(r.to).getTime() === today.getTime());
                  if (matchedPreset) {
                    return <span>{matchedPreset.label === "Today" ? "Today" : `Last ${matchedPreset.label}`}</span>;
                  }
                  if (r.to) {
                    return <span>{format(r.from, "MMM d")} – {format(r.to, "MMM d")}</span>;
                  }
                  return <span>{format(r.from, "MMM d, yyyy")}</span>;
                })()}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0">
              <div className="flex flex-wrap items-center gap-1.5 border-b border-border/60 p-3">
                {DATE_PRESETS.map((p) => {
                  const r = filters.dateRange;
                  let active = false;
                  if (r?.from && r?.to) {
                    const today = startOfDay(new Date());
                    const from = startOfDay(r.from);
                    const diff = Math.round((today.getTime() - from.getTime()) / 86400000) + 1;
                    active = diff === p.days && startOfDay(r.to).getTime() === today.getTime();
                  }
                  return (
                    <button
                      key={p.days}
                      type="button"
                      onClick={() => {
                        const to = startOfDay(new Date());
                        const from = new Date(to);
                        from.setDate(from.getDate() - (p.days - 1));
                        setField("dateRange", { from, to });
                      }}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] transition-colors border",
                        active
                          ? "bg-primary text-primary-foreground border-primary font-semibold"
                          : "border-transparent bg-muted text-muted-foreground hover:bg-muted/80",
                      )}
                      aria-pressed={active}
                    >
                      {p.label === "Today" ? "Today" : `Last ${p.label}`}
                    </button>
                  );
                })}
                {filters.dateRange?.from && (
                  <button
                    type="button"
                    onClick={() => setField("dateRange", undefined)}
                    className="ml-auto inline-flex items-center gap-1 rounded-full px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                    Clear
                  </button>
                )}
              </div>
              <Calendar
                mode="range"
                selected={filters.dateRange}
                onSelect={(r) => setField("dateRange", r ?? undefined)}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* Settings popover — Reload feed + per-section display toggles. */}
          <div className={collapseCls(compact)} aria-hidden={compact}>
          <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-9"
                aria-label="Display settings"
              >
                <Settings className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[280px] p-0">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  Settings
                </span>
              </div>
              <div className="px-3 py-3 space-y-3">
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-full text-[12px]"
                    onClick={handleReload}
                    disabled={!onRefresh}
                  >
                    Reload feed
                  </Button>
                </div>
                <div className="border-t border-border/60 -mx-3" />
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                    Data to show
                  </div>
                  <div className="flex flex-col">
                    {DISPLAY_TOGGLES.map((toggle) => (
                      <label
                        key={toggle.key}
                        className="flex items-center justify-between py-1.5 text-sm cursor-pointer"
                      >
                        <span>{toggle.label}</span>
                        <Switch
                          checked={displayPrefs[toggle.key]}
                          onCheckedChange={(checked) =>
                            setDisplayField(toggle.key, checked)
                          }
                          aria-label={`Toggle ${toggle.label}`}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          </div>
        </div>
      </div>
    </div>
  );
}
