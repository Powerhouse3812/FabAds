import { useState } from "react";
import { X, Filter, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { INSIGHT_INDUSTRIES, TRENDING_TAGS } from "@/lib/insights-dummy-data";

export interface InsightsFilters {
  search: string;
  industry: string;
  platform: string;
  status: string;
  country: string;
}

const DEFAULT_FILTERS: InsightsFilters = { search: "", industry: "", platform: "", status: "", country: "" };

const FILTER_LABELS: Record<string, string> = {
  search: "Search",
  industry: "Industry",
  platform: "Platform",
  status: "Status",
  country: "Country",
};

export interface InsightsViewTab {
  value: string;
  label: string;
}

interface Props {
  filters: InsightsFilters;
  onChange: (f: InsightsFilters) => void;
  showTrending?: boolean;
  /**
   * Discover's view tabs (All / Trending / By Industry / By Platform).
   * On mobile they fold INTO the Filters sheet as a "View" group (Maalik):
   * a surface toggle above plus a full-width tab bar plus a filter row was
   * three stacked nav layers on a 375px screen. Desktop keeps its own tab bar
   * and simply doesn't pass these.
   */
  viewTabs?: InsightsViewTab[];
  viewValue?: string;
  onViewChange?: (v: string) => void;
}

export function InsightsFilterBar({
  filters,
  onChange,
  showTrending,
  viewTabs,
  viewValue,
  onViewChange,
}: Props) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const setField = (key: keyof InsightsFilters, val: string) => onChange({ ...filters, [key]: val });
  const activeCount = Object.values(filters).filter(Boolean).length;
  const activeEntries = Object.entries(filters).filter(([, v]) => Boolean(v)) as [keyof InsightsFilters, string][];
  // View counts toward the mobile badge too: it now lives inside this same
  // sheet, and a badge that ignores it would leave a non-default view
  // invisible once the sheet is closed.
  const isNonDefaultView = !!viewTabs && !!viewValue && viewValue !== viewTabs[0]?.value;
  const mobileBadgeCount = activeCount + (isNonDefaultView ? 1 : 0);

  return (
    <div className="space-y-3 sticky top-0 z-20 bg-background/90 backdrop-blur-sm pb-3 border-b border-border/30 transition-shadow duration-200">
      {/* Filter row */}
      {/* ONE ROW on mobile (Maalik): search renders normally and flexes; the
          four selects collapse behind a single Filters icon, because there is
          no honest icon for "country" or "industry". Desktop keeps the inline
          selects exactly as before. */}
      <div className="flex flex-nowrap items-center gap-2 md:flex-row md:items-center md:gap-2 md:flex-wrap overflow-hidden">
        {/* Search */}
        <div className="relative min-w-0 flex-1 md:max-w-[240px] md:w-auto md:flex-none">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by page, keywor..."
            value={filters.search}
            onChange={(e) => setField("search", e.target.value)}
            className="pl-8 h-9 min-h-11 md:min-h-0 text-sm"
          />
        </div>

        {/* Mobile Filters trigger — the four selects plus (when supplied) the
            View group all live inside this one sheet. There is no honest icon
            for "country" or "industry" individually, so they collapse behind
            a single Filter icon rather than becoming four mystery glyphs. */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-11 w-11 shrink-0 relative md:hidden"
          aria-label={`Filters${mobileBadgeCount > 0 ? ` — ${mobileBadgeCount} active` : ""}`}
          onClick={() => setMobileFiltersOpen(true)}
        >
          <Filter className="h-[18px] w-[18px] text-muted-foreground" />
          {mobileBadgeCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground"
            >
              {mobileBadgeCount}
            </span>
          )}
        </Button>

        {/* Desktop-only inline selects. Mobile gets its own full-width copies
            inside the sheet below — same `filters` state, so either side
            reflects the other instantly, but they're separate elements
            because a 100px inline trigger and a full-width sheet row need
            different markup. */}
        <div className="hidden md:flex md:items-center md:gap-2 md:ml-auto">

        <Select value={filters.status || "active"} onValueChange={(v) => setField("status", v === "all" ? "" : v)}>
          <SelectTrigger className="w-full md:w-[100px] h-9 min-h-11 md:min-h-0 text-sm font-medium"><SelectValue placeholder="Active" /></SelectTrigger>
          <SelectContent className="max-w-[calc(100vw-2rem)]">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.platform} onValueChange={(v) => setField("platform", v === "all" ? "" : v)}>
          <SelectTrigger className="w-full md:w-[110px] h-9 min-h-11 md:min-h-0 text-sm font-medium"><SelectValue placeholder="Platform" /></SelectTrigger>
          <SelectContent className="max-w-[calc(100vw-2rem)]">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Meta">Meta</SelectItem>
            <SelectItem value="Instagram">Instagram</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.country} onValueChange={(v) => setField("country", v === "all" ? "" : v)}>
          <SelectTrigger className="w-full md:w-[110px] h-9 min-h-11 md:min-h-0 text-sm font-medium"><SelectValue placeholder="Country" /></SelectTrigger>
          <SelectContent className="max-w-[calc(100vw-2rem)]">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="us">United States</SelectItem>
            <SelectItem value="uk">United Kingdom</SelectItem>
            <SelectItem value="de">Germany</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.industry} onValueChange={(v) => setField("industry", v === "all" ? "" : v)}>
          <SelectTrigger className="w-full md:w-[110px] h-9 min-h-11 md:min-h-0 text-sm font-medium"><SelectValue placeholder="Industry" /></SelectTrigger>
          <SelectContent className="max-w-[calc(100vw-2rem)]">
            <SelectItem value="all">All</SelectItem>
            {INSIGHT_INDUSTRIES.map((ind) => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}
          </SelectContent>
        </Select>
        </div>
      </div>

      {/* Mobile Filters sheet — View group (if supplied) + the four selects,
          full width, stacked. `sheet.tsx` already blocks outside-click
          dismiss; Done + the sheet's own X are the two exits. */}
      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        {/* Built-in X suppressed — Done below is the single close control. */}
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl [&>button]:hidden">
          <SheetHeader className="text-left">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-5 py-4">
            {viewTabs && viewTabs.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  View
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {viewTabs.map((t) => {
                    const isActive = t.value === viewValue;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => onViewChange?.(t.value)}
                        className={`min-h-11 rounded-md border px-3 text-sm font-medium transition-colors ${
                          isActive
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Filter by
              </span>

              <Select value={filters.status || "active"} onValueChange={(v) => setField("status", v === "all" ? "" : v)}>
                <SelectTrigger className="h-11 w-full text-sm font-medium"><SelectValue placeholder="Active" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.platform} onValueChange={(v) => setField("platform", v === "all" ? "" : v)}>
                <SelectTrigger className="h-11 w-full text-sm font-medium"><SelectValue placeholder="Platform" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All platforms</SelectItem>
                  <SelectItem value="Meta">Meta</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.country} onValueChange={(v) => setField("country", v === "all" ? "" : v)}>
                <SelectTrigger className="h-11 w-full text-sm font-medium"><SelectValue placeholder="Country" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All countries</SelectItem>
                  <SelectItem value="us">United States</SelectItem>
                  <SelectItem value="uk">United Kingdom</SelectItem>
                  <SelectItem value="de">Germany</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.industry} onValueChange={(v) => setField("industry", v === "all" ? "" : v)}>
                <SelectTrigger className="h-11 w-full text-sm font-medium"><SelectValue placeholder="Industry" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All industries</SelectItem>
                  {INSIGHT_INDUSTRIES.map((ind) => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-border pt-3">
            <Button
              type="button"
              variant="ghost"
              className="h-11 flex-1"
              onClick={() => onChange(DEFAULT_FILTERS)}
              disabled={activeCount === 0}
            >
              Clear all
            </Button>
            <SheetClose asChild>
              <Button type="button" className="h-11 flex-1">
                Done
              </Button>
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>

      {/* Applied filters chips — md:-only. Mobile signals active filters via
          the count badge on the Filters icon instead; a full pill row here
          too would reintroduce the extra vertical space the one-row toolbar
          was built to remove. */}
      {activeCount > 0 && (
        <div className="hidden bg-muted/30 rounded-lg px-3 py-1.5 md:flex items-center gap-2 flex-wrap">
          {activeEntries.map(([key, val]) => (
            <Badge key={key} variant="secondary" className="text-xs gap-1 pr-1">
              {FILTER_LABELS[key]}: {val}
              <button className="ml-0.5 hover:text-foreground" onClick={() => setField(key, "")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <button
            className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline ml-auto"
            onClick={() => onChange(DEFAULT_FILTERS)}
          >
            Reset filters
          </button>
        </div>
      )}

      {/* Trending tags row */}
      {showTrending && (
        <div
          className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide"
          style={{ maskImage: "linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)" }}
        >
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1 whitespace-nowrap shrink-0">
            <Filter className="h-3 w-3" /> Trending tags<span className="text-[10px]">(AI)</span>
          </span>
          {TRENDING_TAGS.map((tag) => {
            const label = tag.replace("#", "");
            const isActive = filters.search === tag;
            return (
              <Badge
                key={tag}
                variant={isActive ? "default" : "outline"}
                className={`text-xs cursor-pointer whitespace-nowrap px-3 py-1 rounded-full shrink-0 transition-colors duration-150 ${
                  isActive ? "" : "hover:bg-muted"
                }`}
                onClick={() => setField("search", isActive ? "" : tag)}
              >
                {label}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { DEFAULT_FILTERS };
