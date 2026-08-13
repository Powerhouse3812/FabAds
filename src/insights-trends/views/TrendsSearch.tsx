/**
 * Industry Insights → Trends: Search & Demand tab (doc §7.6).
 *
 * CORRECTION B is the load-bearing constraint on this whole view: Google
 * Trends is a 0-100 RELATIVE INTEREST INDEX, never volume. The reference
 * prototype (js/views/searchDemand.js, read-only, never imported from)
 * hardcodes an 8-row "Top Rising Queries" table with a "Volume Change"
 * column showing values like "+340%" — exactly the banned pattern. Every
 * number on this page is the 0-100 index itself (or a stage/opportunity
 * label), never a volume figure and never a "+340%"-style change. A method
 * note is always on screen, and region + timeframe are always visible next
 * to the metric because the index's meaning depends on them (doc §B).
 *
 * Structure: one stated method/time/region context (persistent banner) →
 * a chart spotlight for one selected term, plotted on a FIXED 0-100 axis
 * (not locally re-scaled — a term that only ranges 60-95 must still read as
 * sitting in the upper band of the real scale, not fill the whole chart) →
 * an <ol> "ranked topics" list driven by SEARCH_DEMAND (the prototype's
 * table was 8 hardcoded literal rows — that is the defect this fixes),
 * each row surfacing its own native metric + related queries as supporting
 * content (doc: relatedQueries exists in the data but the prototype never
 * renders it).
 *
 * Row sparklines reuse TrendCard's normalise-but-preserve-order approach:
 * min/max is per-series (decorative accent only, aria-hidden — the real
 * numbers are in text), which cannot flip a decline into a rise because y
 * position is a monotonic function of value regardless of the local range.
 * The spotlight chart deliberately does NOT do this local rescaling — it
 * uses the fixed 0-100 domain instead, precisely to avoid ever making a
 * declining series look like it rises relative to the scale that's printed
 * on the axis.
 *
 * Token vocabulary is copied 1:1 from src/insights-trends/lib/trendsDisplay.ts
 * and src/components/insights-v2/* — bg-card / bg-muted / text-muted-foreground /
 * text-foreground / border-border / bg-primary/text-primary. No new colour
 * tokens, no platform-brand tinting. No state is colour-only: stage and
 * opportunity always pair colour with STAGE_META/OPPORTUNITY_META's icon
 * + label.
 *
 * State coverage: populated / zero-results (two distinguished causes, each
 * with its own recovery) / loading skeleton matching this hierarchy. The
 * zero-results split mirrors the doc note precisely:
 *  - "Your Industries Only" is selected but the user hasn't followed any
 *    industries yet → recovery is "Open preferences" (follow some) or
 *    "Switch to Global" (works immediately, since an empty followed-list
 *    means the scope isn't filtering anything for them anyway).
 *  - Anything else (search text / region / timeframe too narrow) →
 *    recovery is "Clear filters".
 */
import { useEffect, useId, useMemo, useState } from "react";
import {
  Calendar,
  Globe,
  Info,
  LineChart as LineChartIcon,
  ListOrdered,
  SearchX,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useInsightPreferences } from "@/hooks/use-insight-preferences";
import { OnboardingModal } from "@/components/insights/OnboardingModal";
import { SEARCH_DEMAND } from "@/insights-trends/mocks/trendsData";
import type { TrendItem } from "@/insights-trends/types";
import { useTrendsFilters, type TrendsFilters } from "@/insights-trends/hooks/useTrendsFilters";
import { STAGE_META, OPPORTUNITY_META, nativeMetric, relativeTime } from "@/insights-trends/lib/trendsDisplay";

const METHOD_NOTE =
  "Relative interest, 0-100, scaled within the selected time and region — not absolute search volume.";

/** "United States (California, New York, Oregon)" -> "United States".
 *  Same root-extraction useTrendsFilters uses for the region facet, so the
 *  context bar and the filter agree on what a region is. */
function regionRoot(region: string): string {
  return region.split(" (")[0].trim();
}

/** The context bar must state the region/timeframe the on-screen numbers were
 *  actually computed over — never a default like "Worldwide" that no record
 *  claims. When every visible record shares one value, name it; when they
 *  differ, say how many rather than picking one. An explicit facet selection
 *  always wins, since that IS the stated scope. */
function statedContext(values: string[], selected: string | undefined, plural: string, missing: string): string {
  if (selected) return selected;
  const unique = Array.from(new Set(values.filter(Boolean)));
  if (unique.length === 0) return missing;
  if (unique.length === 1) return unique[0];
  return `${unique.length} ${plural}`;
}

/* ------------------------------------------------------------------ */
/*  Decorative per-row sparkline — local min/max is a display-only      */
/*  rescale for visual dynamic range; it cannot invert direction since   */
/*  y is a monotonic function of value regardless of the local range.   */
/*  aria-hidden: the real numbers live in text (StartEndValues) below.  */
/* ------------------------------------------------------------------ */
function RowSparkline({ data }: { data: number[] }) {
  const w = 96;
  const h = 26;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = Math.max(max - min, 1);
  const points = data
    .map((v, i) => {
      const x = data.length > 1 ? (i / (data.length - 1)) * w : 0;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-6 w-24 text-primary/70" aria-hidden="true" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Spotlight chart — FIXED 0-100 domain, gridlines + labels always on  */
/*  screen. This is the one chart on the page that carries the axis, so */
/*  it is the one place the "never make a decline look like a rise"     */
/*  guardrail is load-bearing: values are plotted against the printed   */
/*  0-100 scale, never locally rescaled to fill the box.                */
/* ------------------------------------------------------------------ */
function SpotlightChart({ item }: { item: TrendItem }) {
  const data = item.sparkData ?? [];
  const gridId = useId();
  const w = 600;
  const h = 200;
  const pad = { top: 12, right: 12, bottom: 8, left: 8 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  const toXY = (v: number, i: number) => {
    const x = pad.left + (data.length > 1 ? (i / (data.length - 1)) * plotW : 0);
    // Fixed 0-100 domain — clamp defensively in case a future data source
    // ever supplies an out-of-range reading, without ever remapping the
    // domain itself (that remapping is exactly what would risk inverting
    // the visual read of a decline).
    const clamped = Math.max(0, Math.min(100, v));
    const y = pad.top + plotH - (clamped / 100) * plotH;
    return { x, y };
  };

  const linePoints = data.map((v, i) => toXY(v, i)).map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPoints =
    data.length > 1
      ? `${pad.left},${pad.top + plotH} ${linePoints} ${(pad.left + plotW).toFixed(1)},${(pad.top + plotH).toFixed(1)}`
      : "";

  const gridLevels = [0, 25, 50, 75, 100];

  return (
    <div className="space-y-1.5">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-44 w-full text-primary"
        role="img"
        aria-label={`Relative interest for "${item.term ?? item.title}" over ${item.timeframe ?? "the selected window"}, on a fixed 0-100 scale. Current reading: ${item.interestIndex ?? "unknown"} out of 100.`}
        preserveAspectRatio="none"
      >
        {gridLevels.map((level) => {
          const y = pad.top + plotH - (level / 100) * plotH;
          return (
            <g key={level}>
              <line
                x1={pad.left}
                x2={pad.left + plotW}
                y1={y}
                y2={y}
                className="stroke-border"
                strokeWidth={1}
                strokeDasharray={level === 0 ? undefined : "3 3"}
              />
              <text x={pad.left} y={y - 3} className="fill-muted-foreground" fontSize="10">
                {level}
              </text>
            </g>
          );
        })}
        {areaPoints && (
          <polygon points={areaPoints} fill="currentColor" opacity={0.08} stroke="none" />
        )}
        {data.length > 1 && (
          <polyline
            points={linePoints}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {data.length > 0 && (
          <circle
            cx={toXY(data[data.length - 1], data.length - 1).x}
            cy={toXY(data[data.length - 1], data.length - 1).y}
            r={3.5}
            fill="currentColor"
          />
        )}
      </svg>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Start of window</span>
        <span aria-hidden="true">Scale: 0–100 relative interest</span>
        <span>Most recent reading</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Context bar — region + timeframe are ALWAYS visible (doc §B), plus  */
/*  the method note. Reads straight off the tab's own facets so it       */
/*  never drifts from what the Global Filter / direct-filter Selects     */
/*  (owned by TrendsToolbar) actually have selected.                    */
/* ------------------------------------------------------------------ */
function ContextBar({ region, timeframe }: { region: string; timeframe: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1 text-xs font-medium text-foreground border border-border/60">
          <Globe className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          {region}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1 text-xs font-medium text-foreground border border-border/60">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          {timeframe}
        </span>
      </div>
      <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {METHOD_NOTE}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Related queries — supporting content, rendered as plain static      */
/*  chips (not filters/links — nothing here claims to be interactive     */
/*  beyond what it is).                                                 */
/* ------------------------------------------------------------------ */
function RelatedQueries({ queries }: { queries?: string[] }) {
  if (!queries || queries.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] text-muted-foreground">Related:</span>
      {queries.map((q) => (
        <span key={q} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground/80">
          {q}
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Ranked topic row.                                                  */
/* ------------------------------------------------------------------ */
function RankedRow({
  rank,
  item,
  isSelected,
  onSelect,
  onOpen,
}: {
  rank: number;
  item: TrendItem;
  isSelected: boolean;
  onSelect: () => void;
  onOpen: (id: string) => void;
}) {
  const metric = nativeMetric(item);
  const stage = STAGE_META[item.intelligence.trendStage];
  const StageIcon = stage.icon;
  const opportunity = OPPORTUNITY_META[item.intelligence.opportunityRead];
  const OpportunityIcon = opportunity.icon;

  return (
    <li
      className={cn(
        "rounded-lg border p-3 transition-colors",
        isSelected ? "border-primary/50 bg-primary/[0.04]" : "border-border bg-card",
      )}
    >
      <div className="flex flex-wrap items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold tabular-nums text-muted-foreground"
        >
          {rank}
        </span>

        <div className="min-w-0 flex-1 space-y-1.5">
          <button
            type="button"
            onClick={() => onOpen(item.id)}
            className="rounded-sm text-left text-sm font-semibold text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background"
          >
            &ldquo;{item.term ?? item.title}&rdquo;
          </button>

          {metric && (
            <p className="text-[11px] leading-snug text-muted-foreground">{metric.context}</p>
          )}

          <RelatedQueries queries={item.relatedQueries} />

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", stage.className)}>
              <StageIcon className="h-3 w-3" aria-hidden="true" />
              {stage.label}
            </span>
            <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium", opportunity.className)}>
              <OpportunityIcon className="h-3 w-3" aria-hidden="true" />
              {opportunity.label}
            </span>
            <span className="text-[11px] text-muted-foreground">{relativeTime(item.publishedAt)}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {item.interestIndex != null && (
            <span className="text-lg font-semibold tabular-nums text-foreground">
              {item.interestIndex}
              <span className="text-[11px] font-normal text-muted-foreground">/100</span>
            </span>
          )}
          {item.sparkData && item.sparkData.length > 1 && <RowSparkline data={item.sparkData} />}
          <Button
            type="button"
            variant={isSelected ? "secondary" : "outline"}
            size="sm"
            className="h-6 gap-1 px-2 text-[11px]"
            aria-pressed={isSelected}
            onClick={onSelect}
          >
            <LineChartIcon className="h-3 w-3" aria-hidden="true" />
            {isSelected ? "In chart" : "View chart"}
          </Button>
        </div>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton — same hierarchy: context bar, spotlight chart,    */
/*  ranked-topic rows.                                                  */
/* ------------------------------------------------------------------ */
function SearchLoadingSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <Skeleton className="h-[86px] w-full rounded-lg" />
      <div className="space-y-2 rounded-lg border border-border bg-card p-4">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-44 w-full rounded-md" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Zero-results — two distinguished causes, each with its own          */
/*  recovery, per doc.                                                  */
/* ------------------------------------------------------------------ */
function NoFollowedIndustriesState({
  onSwitchToGlobal,
  onOpenPreferences,
}: {
  onSwitchToGlobal: () => void;
  onOpenPreferences: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card py-16 text-center">
      <Users className="h-9 w-9 text-muted-foreground/40" aria-hidden="true" />
      <div className="max-w-sm space-y-1">
        <h3 className="text-sm font-medium text-foreground">No industries followed yet</h3>
        <p className="text-xs text-muted-foreground">
          &ldquo;Your Industries Only&rdquo; is selected, but you haven&rsquo;t followed any industries — so there&rsquo;s
          nothing to scope Search &amp; Demand to.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button type="button" size="sm" onClick={onOpenPreferences} className="gap-1.5">
          <Users className="h-3.5 w-3.5" />
          Open preferences
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onSwitchToGlobal} className="gap-1.5">
          <Globe className="h-3.5 w-3.5" />
          Switch to Global
        </Button>
      </div>
    </div>
  );
}

function QueryTooNarrowState({
  onClearFilters,
  onSwitchToGlobal,
  showSwitchToGlobal,
}: {
  onClearFilters: () => void;
  onSwitchToGlobal: () => void;
  showSwitchToGlobal: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card py-16 text-center">
      <SearchX className="h-9 w-9 text-muted-foreground/40" aria-hidden="true" />
      <div className="max-w-sm space-y-1">
        <h3 className="text-sm font-medium text-foreground">No search terms match these filters</h3>
        <p className="text-xs text-muted-foreground">
          Search &amp; Demand is a short, curated list of terms — a narrow search or an industry scope with no
          matching terms can hide all of it.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button type="button" size="sm" onClick={onClearFilters} className="gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Clear filters
        </Button>
        {showSwitchToGlobal && (
          <Button type="button" size="sm" variant="outline" onClick={onSwitchToGlobal} className="gap-1.5">
            <Globe className="h-3.5 w-3.5" />
            Switch to Global
          </Button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  View                                                                */
/* ------------------------------------------------------------------ */
export default function TrendsSearch(props: {
  filters: TrendsFilters;
  onOpen: (id: string) => void;
}): JSX.Element {
  const { filters, onOpen } = props;

  // Independent access to this tab's setters/applyFilters. This hook derives
  // everything from the URL on every call (see its own file header) so a
  // second call here stays in lockstep with the `filters` prop the parent
  // already passed down — there is no shadow state to fall out of sync.
  const { setFilters, clearFilters, applyFilters } = useTrendsFilters();
  const { preferences } = useInsightPreferences();
  const followedIndustries = (preferences?.industries ?? []) as string[];

  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setIsLoading(false), 650);
    return () => window.clearTimeout(t);
  }, []);

  const [preferencesOpen, setPreferencesOpen] = useState(false);

  const results = useMemo(() => applyFilters(SEARCH_DEMAND), [applyFilters]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    // Keep the spotlight pointed at something visible: land on the top
    // result whenever the current selection scrolls out of the filtered
    // set (or on first paint), but don't fight the user's own pick while
    // it's still valid.
    if (results.length === 0) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }
    if (!selectedId || !results.some((r) => r.id === selectedId)) {
      setSelectedId(results[0].id);
    }
  }, [results, selectedId]);

  const region = statedContext(
    results.map((r) => regionRoot(r.region ?? "")),
    filters.facetA,
    "regions",
    "Region not stated",
  );
  const timeframe = statedContext(
    results.map((r) => r.timeframe ?? ""),
    filters.facetB,
    "timeframes",
    "Timeframe not stated",
  );

  const noFollowedIndustries = filters.scope === "industries" && followedIndustries.length === 0;

  if (isLoading) {
    return <SearchLoadingSkeleton />;
  }

  if (results.length === 0) {
    if (noFollowedIndustries) {
      return (
        <>
          <NoFollowedIndustriesState
            onSwitchToGlobal={() => setFilters({ scope: "global" })}
            onOpenPreferences={() => setPreferencesOpen(true)}
          />
          <OnboardingModal
            open={preferencesOpen}
            onClose={() => setPreferencesOpen(false)}
            initialIndustries={preferences?.industries ?? []}
            initialInterests={preferences?.interests ?? []}
            initialBrands={preferences?.followed_brands ?? []}
          />
        </>
      );
    }
    return (
      <QueryTooNarrowState
        onClearFilters={clearFilters}
        onSwitchToGlobal={() => setFilters({ scope: "global" })}
        showSwitchToGlobal={filters.scope === "industries"}
      />
    );
  }

  const selected = results.find((r) => r.id === selectedId) ?? results[0];

  return (
    <div className="space-y-4">
      <ContextBar region={region} timeframe={timeframe} />

      <section aria-labelledby="search-spotlight-heading" className="space-y-3 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 id="search-spotlight-heading" className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <LineChartIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            &ldquo;{selected.term ?? selected.title}&rdquo;
          </h3>
          {selected.interestIndex != null && (
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {selected.interestIndex}
              <span className="text-xs font-normal text-muted-foreground">/100 relative interest</span>
            </span>
          )}
        </div>
        {(() => {
          const metric = nativeMetric(selected);
          return metric ? <p className="text-xs text-muted-foreground">{metric.context}</p> : null;
        })()}
        <SpotlightChart item={selected} />
      </section>

      <section aria-labelledby="search-ranked-heading" className="space-y-2">
        <h3 id="search-ranked-heading" className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <ListOrdered className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          Ranked topics
          <span className="text-xs font-normal text-muted-foreground">
            ({results.length} term{results.length === 1 ? "" : "s"})
          </span>
        </h3>
        <ol className="space-y-2">
          {results.map((item, i) => (
            <RankedRow
              key={item.id}
              rank={i + 1}
              item={item}
              isSelected={item.id === selected.id}
              onSelect={() => setSelectedId(item.id)}
              onOpen={onOpen}
            />
          ))}
        </ol>
      </section>
    </div>
  );
}
