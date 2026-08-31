/**
 * Industry Insights → Trends: toolbar (doc §7.2).
 *
 * Layout: single horizontal row on wide layouts.
 *   LEFT  — search (scoped to the open tab only, per §7.2) + Global Filter.
 *   RIGHT — Global / Your Industries Only scope toggle, the current tab's
 *           two direct filters (from TAB_FACETS), then a refresh control.
 * Below: applied-filter chips + "Clear all" inside a role="status"
 * aria-live region that also states the resulting scope + result count.
 *
 * Corrections vs the reference prototype (read-only, never imported from):
 *  - Direct filters are real shadcn Selects, not a div faking
 *    aria-haspopup="listbox" while merely cycling a value on click.
 *  - The Global Filter opens in the app's Dialog primitive, which already
 *    blocks onPointerDownOutside/onInteractOutside (house rule — overlays
 *    never close on outside click; Escape or the explicit Close/Done
 *    control are the only ways out). The prototype's panel closes on
 *    backdrop click; that is not reproduced here.
 *  - Facet options inside the Global Filter are native radio inputs with a
 *    stable option list (no key tied to the selected value, no re-mount of
 *    DialogContent on selection) so picking an option never rebuilds the
 *    dialog and steals focus — the prototype's panel does rebuild on every
 *    selection.
 *
 * Token vocabulary copied from src/components/insights-v2/InsightsV2Toolbar.tsx
 * (ActiveFilterChip / chip-toggle / "Add Filter" popover styling) — bg-muted,
 * text-muted-foreground, bg-primary/10, text-primary, border-border. No new
 * colour tokens, no platform brand tinting. Every toggle pairs its state
 * with an icon AND a text label, never colour alone.
 */
import { useState } from "react";
import { Globe, RotateCw, Search, SlidersHorizontal, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TAB_FACETS, type TrendsFilters } from "@/insights-trends/hooks/useTrendsFilters";
import type { TrendsTabKey } from "@/insights-trends/types";

/* ------------------------------------------------------------------ */
/*  Per-tab scope name — names what the search box (and the result     */
/*  summary) actually searches. Matches the app's existing naming for   */
/*  these surfaces (Industry Insights → Trends tabs).                   */
/* ------------------------------------------------------------------ */
const TAB_SCOPE_LABEL: Record<TrendsTabKey, string> = {
  overview: "Overview",
  news: "News & Intelligence",
  social: "Social & Creative",
  search: "Search & Demand",
};

/** Sentinel for "no value selected" in a shadcn Select — Radix disallows an
 *  empty-string SelectItem value, so facetA/facetB's `undefined` is mapped
 *  to/from this string at the edges of each Select only. */
const FACET_ALL = "__all__";

/* ------------------------------------------------------------------ */
/*  Applied-filter chip — same visual contract as InsightsV2Toolbar's    */
/*  ActiveFilterChip: rounded pill, primary-tinted, X to clear.          */
/* ------------------------------------------------------------------ */
function FacetChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-primary/10 border border-primary/30 px-2.5 text-[11px] font-medium text-primary">
      <span className="truncate max-w-[160px]">{label}</span>
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

/* ------------------------------------------------------------------ */
/*  Global Filter modal facet — real <fieldset>+<legend>, real radio     */
/*  inputs (sr-only, pill-styled labels). Option list is stable and      */
/*  never keyed off the selected value, so choosing an option re-renders */
/*  in place rather than rebuilding the dialog and dropping focus.       */
/* ------------------------------------------------------------------ */
function FacetFieldset({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: string[];
  value?: string;
  onChange: (next?: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={legend}>
        {["All", ...options].map((opt) => {
          const optValue = opt === "All" ? undefined : opt;
          const checked = optValue === undefined ? value === undefined : value === optValue;
          const inputId = `${name}-${opt.replace(/\s+/g, "-")}`;
          return (
            <div key={opt}>
              <input
                type="radio"
                id={inputId}
                name={name}
                checked={checked}
                onChange={() => onChange(optValue)}
                className="sr-only peer"
              />
              <label
                htmlFor={inputId}
                className={cn(
                  "inline-flex cursor-pointer items-center rounded-full border px-2.5 py-1 text-[11px] transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-background",
                  checked
                    ? "bg-primary text-primary-foreground border-primary font-semibold"
                    : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80",
                )}
              >
                {opt}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

/* ------------------------------------------------------------------ */
/*  Toolbar                                                            */
/* ------------------------------------------------------------------ */
export function TrendsToolbar(props: {
  tab: TrendsTabKey;
  filters: TrendsFilters;
  setFilters: (f: TrendsFilters) => void;
  clearFilters: () => void;
  activeCount: number;
  resultCount: number;
}): JSX.Element {
  const { tab, filters, setFilters, clearFilters, activeCount, resultCount } = props;
  const [globalFilterOpen, setGlobalFilterOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const facets = TAB_FACETS[tab];
  const tabScopeName = TAB_SCOPE_LABEL[tab];
  const scopeLabel = filters.scope === "industries" ? "Your Industries Only" : "Global";
  const facetActiveCount = (filters.facetA ? 1 : 0) + (filters.facetB ? 1 : 0);

  // A facet whose derived option list holds fewer than two values cannot
  // change what's on screen — every record shares the same value (e.g. every
  // Search & Demand record is "United States" over "Past 30 days"). Rendering
  // it anyway would be a control that looks like a filter and does nothing;
  // the value still reaches the user as stated context inside the tab itself
  // (TrendsSearch's ContextBar), which is where a single shared value belongs.
  const showFacetA = facets.a.options.length > 1;
  const showFacetB = facets.b.options.length > 1;
  const showGlobalFilter = showFacetA || showFacetB;

  const patch = (next: Partial<TrendsFilters>) => setFilters({ ...filters, ...next });

  // Mock-first: nothing here refetches from a server — applyFilters already
  // recomputes on every render off the current filters. This just gives the
  // control an honest, momentary "something happened" state instead of
  // wiring a fake async call.
  const handleRefresh = () => {
    setRefreshing(true);
    toast.success("Trends refreshed", { description: `${tabScopeName} is up to date.` });
    window.setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* LEFT: search (scoped to this tab only) + Global Filter */}
        <div className="flex items-center gap-2 min-w-0 flex-1 max-w-[560px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={filters.search}
              onChange={(e) => patch({ search: e.target.value })}
              placeholder={`Search ${tabScopeName}`}
              aria-label={`Search ${tabScopeName}`}
              className="h-9 pl-9 text-[13px]"
            />
          </div>

          <Dialog open={showGlobalFilter && globalFilterOpen} onOpenChange={setGlobalFilterOpen}>
            {showGlobalFilter && (
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 shrink-0 gap-1.5 text-[12px] font-normal relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                aria-label="Global Filter"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Global Filter</span>
                {facetActiveCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="ml-0.5 h-4 min-w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold inline-flex items-center justify-center px-1"
                  >
                    {facetActiveCount}
                  </span>
                )}
              </Button>
            </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Global Filter</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {showFacetA && (
                  <FacetFieldset
                    legend={facets.a.label}
                    name="trends-global-filter-a"
                    options={facets.a.options}
                    value={filters.facetA}
                    onChange={(next) => patch({ facetA: next })}
                  />
                )}
                {showFacetB && (
                  <FacetFieldset
                    legend={facets.b.label}
                    name="trends-global-filter-b"
                    options={facets.b.options}
                    value={filters.facetB}
                    onChange={(next) => patch({ facetB: next })}
                  />
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => patch({ facetA: undefined, facetB: undefined })}
                  disabled={facetActiveCount === 0}
                >
                  Reset
                </Button>
                <DialogClose asChild>
                  <Button size="sm">Done</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex-1" />

        {/* RIGHT: scope toggle, this tab's two direct filters, refresh */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            role="group"
            aria-label="Content scope"
            className="inline-flex items-center rounded-md border border-border bg-muted p-0.5"
          >
            <button
              type="button"
              onClick={() => patch({ scope: "global" })}
              aria-pressed={filters.scope !== "industries"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                filters.scope !== "industries"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Globe className="h-3.5 w-3.5" />
              Global
            </button>
            <button
              type="button"
              onClick={() => patch({ scope: "industries" })}
              aria-pressed={filters.scope === "industries"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                filters.scope === "industries"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Users className="h-3.5 w-3.5" />
              Your Industries Only
            </button>
          </div>

          {showFacetA && (
            <Select
              value={filters.facetA ?? FACET_ALL}
              onValueChange={(v) => patch({ facetA: v === FACET_ALL ? undefined : v })}
            >
              <SelectTrigger className="h-8 w-[150px] text-[12px]" aria-label={facets.a.label}>
                <SelectValue placeholder={facets.a.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FACET_ALL}>All {facets.a.label}</SelectItem>
                {facets.a.options.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {showFacetB && (
            <Select
              value={filters.facetB ?? FACET_ALL}
              onValueChange={(v) => patch({ facetB: v === FACET_ALL ? undefined : v })}
            >
              <SelectTrigger className="h-8 w-[150px] text-[12px]" aria-label={facets.b.label}>
                <SelectValue placeholder={facets.b.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FACET_ALL}>All {facets.b.label}</SelectItem>
                {facets.b.options.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-9"
            aria-label="Refresh"
            onClick={handleRefresh}
          >
            <RotateCw className={cn("h-3.5 w-3.5 text-muted-foreground", refreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Applied-filter chips + "Clear all" + live scope/result summary */}
      <div
        role="status"
        aria-live="polite"
        className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground"
      >
        {filters.search.trim() && (
          <FacetChip label={`"${filters.search.trim()}"`} onClear={() => patch({ search: "" })} />
        )}
        {filters.scope === "industries" && (
          <FacetChip label="Your Industries Only" onClear={() => patch({ scope: "global" })} />
        )}
        {filters.facetA && (
          <FacetChip label={filters.facetA} onClear={() => patch({ facetA: undefined })} />
        )}
        {filters.facetB && (
          <FacetChip label={filters.facetB} onClear={() => patch({ facetB: undefined })} />
        )}
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-[11px] font-medium text-muted-foreground underline-offset-2 hover:underline hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background rounded"
          >
            Clear all
          </button>
        )}
        <span className="ml-auto whitespace-nowrap">
          {resultCount} result{resultCount === 1 ? "" : "s"} in {tabScopeName} · {scopeLabel}
        </span>
      </div>
    </div>
  );
}
