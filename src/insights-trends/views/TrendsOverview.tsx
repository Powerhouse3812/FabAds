/**
 * Industry Insights → Trends: Overview tab (doc §6.2).
 *
 * Fixed section order (doc §6.2, "all six, no reordering"):
 *   1. Breaking Stories   — BreakingCarousel over BREAKING_STORIES.
 *   2. News & Intelligence — manual rail of NEWS_ITEMS, "View all" → news tab.
 *   3. Meta Ads            — manual rail of META_ADS (Meta-native evidence
 *                            only — this section never mixes in TIKTOK_HOOKS).
 *   4. TikTok Hooks        — manual rail of TIKTOK_HOOKS (TikTok-native
 *                            metrics only — never mixed with Meta).
 *   5. Search & Demand     — manual rail of SEARCH_DEMAND. TrendCard's
 *                            searchDemand anatomy already renders the 0-100
 *                            relative-interest index + region + timeframe +
 *                            "not search volume" method note (correction B) —
 *                            nothing extra to add here.
 *   6. Other Social Trends — manual rail of OTHER_SOCIAL (Instagram, YouTube,
 *                            LinkedIn, X). Rendered unsliced so every
 *                            platform present in the mock stays represented
 *                            once scrolled — no top-N cut that could drop a
 *                            platform.
 *
 * Section headers: title + a count derived from the *filtered* array's
 * `.length` (never a hardcoded string — the reference prototype hardcodes
 * these and they desync from the data) + a "View all" link that calls
 * setTab() on the shared URL-backed filter state. Breaking Stories is the
 * one deliberate exception: there is no dedicated TrendsTabKey for it (tabs
 * are overview/news/social/search), so it gets a title + count and no
 * "View all" — a real target beats a decorative dead link.
 *
 * Rails are manual-scroll only (plain `overflow-x-auto`, no autoplay, no
 * IntersectionObserver-driven paging) — same contract as BreakingCarousel.
 *
 * Filtering: this view calls useTrendsFilters() itself (rather than trusting
 * only the `filters` prop) to get `applyFilters`/`setTab`/`setFilters`/
 * `clearFilters`. That hook derives everything from the URL on every render
 * (see its own file header) and is safe to call from multiple components at
 * once — there's exactly one owner of the truth (the URL), so this call and
 * whatever a parent tab-shell also calls it for stay in lockstep by
 * construction. `applyFilters` is tab-scoped (§7.3 facets), which is exactly
 * right here since this file only ever renders under the "overview" tab.
 *
 * State coverage (mandatory per project rules, and doc-flagged as the
 * prototype's defect — it only handled states on Overview, which is
 * ironically this exact file):
 *   - loading    — a brief mock-fetch gate (this is a static-mock module;
 *                  there is no real network call to key off of) rendering a
 *                  skeleton that mirrors the section hierarchy below, so
 *                  there's no layout jump when real content swaps in.
 *   - zero-results — split into the two doc-mandated flavours:
 *       (a) "no followed industries": scope is "Your Industries Only" but
 *           the user hasn't followed any yet. Recovery: switch to Global,
 *           or open the industries/interests preference editor
 *           (OnboardingModal, same component InsightsV2Feed uses for this).
 *       (b) "query too narrow": search/facet/scope combination has no
 *           matches anywhere. Recovery: clear filters, and/or switch to
 *           Global if scope is the industries-only cause.
 *     A per-section (rather than whole-page) empty note is used when only
 *     *some* sections are empty — e.g. picking the "Search" content-type
 *     facet legitimately zeroes every section except Search & Demand, which
 *     is correct behaviour, not a broken page.
 *   - populated — the normal path.
 *
 * Token vocabulary is copied 1:1 from src/insights-trends/lib/trendsDisplay.ts,
 * src/insights-trends/components/{TrendCard,BreakingCarousel}.tsx, and
 * src/components/insights-v2/{InsightsV2EmptyState,TrendingTagsStrip}.tsx —
 * bg-card / bg-muted / border-border / text-muted-foreground / text-primary /
 * bg-primary. No new colour tokens, no platform-brand tinting.
 *
 * Stress test note: at 10x-plus scale (thousands of items per section) the
 * rails below would need windowing (à la BreakingCarousel's inert-slot
 * trick) instead of mapping the full filtered array into the DOM. Every
 * mock array here tops out at 12 items, so that isn't wired up yet — flagged
 * rather than silently ignored.
 */
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, SearchX, Users, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { OnboardingModal } from "@/components/insights/OnboardingModal";
import { useInsightPreferences } from "@/hooks/use-insight-preferences";
import { useTrendsFilters, type TrendsFilters } from "@/insights-trends/hooks/useTrendsFilters";
import { BreakingCarousel } from "@/insights-trends/components/BreakingCarousel";
import { TrendCard } from "@/insights-trends/components/TrendCard";
import {
  BREAKING_STORIES,
  META_ADS,
  TIKTOK_HOOKS,
  NEWS_ITEMS,
  SEARCH_DEMAND,
  OTHER_SOCIAL,
} from "@/insights-trends/mocks/trendsData";
import type { TrendItem } from "@/insights-trends/types";

/* ------------------------------------------------------------------ */
/*  Mock-first loading gate — no real fetch backs this module, so there   */
/*  is nothing async to key a spinner off. A short, fixed delay on mount  */
/*  is enough to exercise the loading-state requirement honestly without  */
/*  inventing a fake API call underneath it.                              */
/* ------------------------------------------------------------------ */
const MOCK_LOAD_MS = 450;

function useMockOverviewLoading(): boolean {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), MOCK_LOAD_MS);
    return () => window.clearTimeout(t);
  }, []);
  return loading;
}

/* ------------------------------------------------------------------ */
/*  Section header — title, a live count, optional "View all".           */
/* ------------------------------------------------------------------ */
function SectionHeader({
  headingId,
  title,
  count,
  onViewAll,
}: {
  headingId: string;
  title: string;
  count: number;
  onViewAll?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 id={headingId} className="text-sm font-semibold text-foreground">
        {title} <span className="font-normal text-muted-foreground">({count})</span>
      </h2>
      {onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex shrink-0 items-center gap-1 rounded text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background"
        >
          View all
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Rail — manual horizontal scroll only. Uniform per-card width per      */
/*  section so mixed anatomies (portrait ad creative vs. landscape        */
/*  editorial vs. square social) don't produce a jittery row.             */
/* ------------------------------------------------------------------ */
function Rail({
  items,
  cardWidthClassName,
  onOpen,
  emptyLabel,
}: {
  items: TrendItem[];
  cardWidthClassName: string;
  onOpen: (id: string) => void;
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-xs text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }
  return (
    <div
      className={cn(
        "flex gap-3 overflow-x-auto pb-1",
        "[&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border",
      )}
    >
      {items.map((item) => (
        <div key={item.id} className={cn("shrink-0", cardWidthClassName)}>
          <TrendCard item={item} variant="standard" onOpen={onOpen} />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton — mirrors the six-section hierarchy so there's no    */
/*  layout jump once real content swaps in. Decorative (aria-hidden);     */
/*  a sr-only status line carries the loading state to assistive tech.    */
/* ------------------------------------------------------------------ */
function RailSkeleton({ count, cardWidthClassName, mediaClassName }: { count: number; cardWidthClassName: string; mediaClassName: string }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {Array.from({ length: Math.min(count, 6) }).map((_, i) => (
        <div key={i} className={cn("shrink-0 space-y-3 rounded-lg border border-border bg-card p-4", cardWidthClassName)}>
          <Skeleton className={cn("w-full", mediaClassName)} />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

function OverviewLoadingSkeleton(): JSX.Element {
  return (
    <div className="space-y-8">
      <div role="status" aria-live="polite" className="sr-only">
        Loading Overview trends…
      </div>
      <div className="space-y-3" aria-hidden="true">
        <Skeleton className="h-4 w-36" />
        <div className="grid overflow-hidden rounded-lg border border-border bg-card sm:grid-cols-2">
          <Skeleton className="h-56 w-full rounded-none sm:h-full sm:min-h-[22rem]" />
          <div className="space-y-3 p-5 sm:p-6">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
      </div>

      {[
        { count: NEWS_ITEMS.length, cardWidthClassName: "w-72", mediaClassName: "aspect-[16/10] rounded-md" },
        { count: META_ADS.length, cardWidthClassName: "w-64", mediaClassName: "aspect-[3/4] rounded-md" },
        { count: TIKTOK_HOOKS.length, cardWidthClassName: "w-56", mediaClassName: "aspect-[3/4] rounded-md" },
        { count: SEARCH_DEMAND.length, cardWidthClassName: "w-72", mediaClassName: "h-16 rounded-md" },
        { count: OTHER_SOCIAL.length, cardWidthClassName: "w-64", mediaClassName: "aspect-square rounded-md" },
      ].map((section, i) => (
        <div key={i} className="space-y-3" aria-hidden="true">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-14" />
          </div>
          <RailSkeleton {...section} />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Zero-results state — two doc-mandated flavours, distinguished by      */
/*  cause, each with the recovery action that actually fixes it.          */
/* ------------------------------------------------------------------ */
function OverviewEmptyState({
  icon: Icon,
  title,
  description,
  actions,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actions: Array<{ label: string; onClick: () => void; variant?: "default" | "outline" }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
      <Icon className="h-9 w-9 text-muted-foreground/40" aria-hidden="true" />
      <div className="max-w-sm space-y-1">
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {actions.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {actions.map((action) => (
            <Button key={action.label} size="sm" variant={action.variant ?? "outline"} onClick={action.onClick}>
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  View                                                                  */
/* ------------------------------------------------------------------ */
export default function TrendsOverview(props: { filters: TrendsFilters; onOpen: (id: string) => void }): JSX.Element {
  const { filters, onOpen } = props;
  const loading = useMockOverviewLoading();
  const { setTab, setFilters, clearFilters, activeCount, applyFilters } = useTrendsFilters();
  const { preferences, isLoading: prefsLoading } = useInsightPreferences();
  const [prefsOpen, setPrefsOpen] = useState(false);

  const followedIndustries = (preferences?.industries ?? []) as string[];

  const breaking = useMemo(() => applyFilters(BREAKING_STORIES), [applyFilters]);
  const news = useMemo(() => applyFilters(NEWS_ITEMS), [applyFilters]);
  const meta = useMemo(() => applyFilters(META_ADS), [applyFilters]);
  const tiktok = useMemo(() => applyFilters(TIKTOK_HOOKS), [applyFilters]);
  const search = useMemo(() => applyFilters(SEARCH_DEMAND), [applyFilters]);
  const social = useMemo(() => applyFilters(OTHER_SOCIAL), [applyFilters]);

  const totalVisible = breaking.length + news.length + meta.length + tiktok.length + search.length + social.length;

  // Distinguish the two zero-results causes per doc: scoped to industries
  // the user hasn't actually followed any of, vs. a search/facet
  // combination that's simply too narrow. Only meaningful once preferences
  // have actually loaded — while they're still loading, treat this as the
  // "too narrow" branch rather than flashing the wrong recovery copy.
  const noFollowedIndustries = filters.scope === "industries" && !prefsLoading && followedIndustries.length === 0;

  if (loading) {
    return <OverviewLoadingSkeleton />;
  }

  if (totalVisible === 0) {
    if (noFollowedIndustries) {
      return (
        <>
          <OverviewEmptyState
            icon={Users}
            title="You haven't followed any industries yet"
            description={'Overview is scoped to "Your Industries Only," but you haven\'t followed any yet. Switch to Global to see everything, or choose the industries you want to track.'}
            actions={[
              { label: "Switch to Global", onClick: () => setFilters({ scope: "global" }), variant: "default" },
              { label: "Choose industries", onClick: () => setPrefsOpen(true), variant: "outline" },
            ]}
          />
          <OnboardingModal
            open={prefsOpen}
            onClose={() => setPrefsOpen(false)}
            // `?? undefined` (not `?? []`) — matches InsightsV2Feed's usage of
            // this same modal. An empty array is still truthy, so falling back
            // to `[]` here would force "Edit Preferences" mode even for a user
            // who has never onboarded (no preferences row yet at all), instead
            // of the correct "Set Up Your Feed" first-run copy.
            initialIndustries={preferences?.industries ?? undefined}
            initialInterests={preferences?.interests ?? undefined}
            initialBrands={preferences?.followed_brands ?? undefined}
          />
        </>
      );
    }
    return (
      <OverviewEmptyState
        icon={SearchX}
        title="No trends match these filters"
        description="Nothing in Overview matches this search and filter combination. Clear them to start over, or broaden the scope."
        actions={[
          ...(activeCount > 0 ? [{ label: "Clear filters", onClick: clearFilters, variant: "default" as const }] : []),
          ...(filters.scope === "industries"
            ? [{ label: "Switch to Global", onClick: () => setFilters({ scope: "global" }), variant: "outline" as const }]
            : []),
        ]}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Breaking Stories — no "View all": no TrendsTabKey exists for it. */}
      <section className="space-y-3" aria-labelledby="trends-overview-breaking">
        <h2 id="trends-overview-breaking" className="text-sm font-semibold text-foreground">
          Breaking Stories <span className="font-normal text-muted-foreground">({breaking.length})</span>
        </h2>
        <BreakingCarousel items={breaking} onOpen={onOpen} />
      </section>

      {/* 2. News & Intelligence */}
      <section className="space-y-3" aria-labelledby="trends-overview-news">
        <SectionHeader headingId="trends-overview-news" title="News & Intelligence" count={news.length} onViewAll={() => setTab("news")} />
        <Rail items={news} cardWidthClassName="w-72" onOpen={onOpen} emptyLabel="No news or intelligence items match these filters." />
      </section>

      {/* 3. Meta Ads — Meta-native evidence only, never mixed with TikTok. */}
      <section className="space-y-3" aria-labelledby="trends-overview-meta">
        <SectionHeader headingId="trends-overview-meta" title="Meta Ads" count={meta.length} onViewAll={() => setTab("social")} />
        <Rail items={meta} cardWidthClassName="w-64" onOpen={onOpen} emptyLabel="No Meta ads match these filters." />
      </section>

      {/* 4. TikTok Hooks — TikTok-native metrics only. */}
      <section className="space-y-3" aria-labelledby="trends-overview-tiktok">
        <SectionHeader headingId="trends-overview-tiktok" title="TikTok Hooks" count={tiktok.length} onViewAll={() => setTab("social")} />
        <Rail items={tiktok} cardWidthClassName="w-56" onOpen={onOpen} emptyLabel="No TikTok hooks match these filters." />
      </section>

      {/* 5. Search & Demand — TrendCard's searchDemand anatomy already
          carries the 0-100 relative-interest index + region + timeframe +
          "not search volume" method note (correction B). */}
      <section className="space-y-3" aria-labelledby="trends-overview-search">
        <SectionHeader headingId="trends-overview-search" title="Search & Demand" count={search.length} onViewAll={() => setTab("search")} />
        <Rail items={search} cardWidthClassName="w-72" onOpen={onOpen} emptyLabel="No search-demand snapshots match these filters." />
      </section>

      {/* 6. Other Social Trends — Instagram / YouTube / LinkedIn / X, shown
          unsliced so every platform in the mock stays represented. */}
      <section className="space-y-3" aria-labelledby="trends-overview-social">
        <SectionHeader headingId="trends-overview-social" title="Other Social Trends" count={social.length} onViewAll={() => setTab("social")} />
        <Rail items={social} cardWidthClassName="w-64" onOpen={onOpen} emptyLabel="No other social trends match these filters." />
      </section>
    </div>
  );
}
