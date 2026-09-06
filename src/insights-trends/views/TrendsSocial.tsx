/**
 * Industry Insights → Trends: Social & Creative tab (doc §7.6).
 *
 * Layout: Meta Ads section (META_ADS) → TikTok Hooks section (TIKTOK_HOOKS)
 * → Other Social (OTHER_SOCIAL), grouped by platform (Instagram / YouTube /
 * LinkedIn / X). Each section is a responsive media grid, never a single
 * mixed-platform feed and never a cross-platform ranking (correction E) —
 * every card keeps its own source's native metric (trendsDisplay's
 * `nativeMetric`), no combined score anywhere.
 *
 * SOURCE-SPECIFIC ASPECT RATIOS (doc §7.6): Meta ads and TikTok stay
 * portrait, Instagram square, YouTube/X 16:9. Meta/TikTok already get this
 * for free from TrendCard's AdCreativeMedia (3/4 for the "standard" variant)
 * — reused as-is below, no changes to that shared file. TrendCard's
 * SocialMedia, however, hard-codes aspect-square for every non-ad-creative
 * social type (instagram/youtube/linkedin/x alike), which would crop
 * YouTube/X into a square and contradicts this doc's 16:9 requirement — and
 * TrendCard exposes no prop to override it. Rather than editing that shared
 * component (owned outside this view's file scope, and consumed by
 * BreakingCarousel and every other tab), `OtherSocialCard` below is a small
 * view-local card that reuses every *shared* piece it can — SOURCE_META /
 * STAGE_META / nativeMetric / relativeTime from trendsDisplay.ts, and
 * TrendActionBar itself — and only re-implements the JSX chrome TrendCard
 * doesn't export (IdentityRow/Headline/MetricRow/MetaFooter are module-
 * private there), swapping in a per-platform aspect class instead of one
 * fixed aspect-square. The mock thumbnails already ship at the matching
 * pixel ratios (ig/li 280×280, yt/x 280×157), confirming this is the
 * intended shape, not a guess.
 *
 * Genie actions boundary: this used to read that GENIE_ACTIONS_BY_SOURCE
 * "only defines actions for meta and tiktok", so Instagram/YouTube/LinkedIn/X
 * got zero Genie affordances. Genie 2.0 §7.4 makes no such distinction — a
 * trend is a trend — so that map now covers all ten TrendSourceTypes via a
 * generic three-action set, and every card here picks them up through the same
 * shared TrendActionBar. This file still invents and special-cases nothing;
 * the difference is that the shared map is no longer sparse.
 *
 * State coverage:
 *  - loading — a short, bounded synthetic delay (mirrors the pattern
 *    TrendsToolbar's own refresh control already uses for mock-first
 *    "something happened" feedback) renders a skeleton matching the exact
 *    section/subsection hierarchy below. Not gated on useInsightPreferences'
 *    real isLoading — that query can sit unresolved indefinitely without a
 *    workspace/session in this environment, which would strand the skeleton
 *    forever; a bounded timer is honest about being mock-first and always
 *    resolves.
 *  - populated — the normal grid.
 *  - zero-results — distinguishes two causes per the brief:
 *      1. "No followed industries" — scope is "Your Industries Only" but
 *         the user hasn't followed any yet. useTrendsFilters' applyFilters
 *         deliberately falls through to unfiltered in this case (see its
 *         own comment), so this never actually produces zero items — it's
 *         a standing notice banner (independent of item count) rather than
 *         a blocking empty state, with "Switch to Global" / "Manage
 *         industries" recovery.
 *      2. "Query too narrow" — the filtered set is genuinely empty (search,
 *         a facet, or — when the user *does* follow industries — the scope
 *         itself narrowed everything away). Recovery is "Clear all filters"
 *         (clearFilters resets scope back to global too, so it's the
 *         universal fix); copy calls out the industries-scope contribution
 *         specifically when that's the actual cause.
 *
 * Token vocabulary — bg-card / bg-muted / border-border / text-foreground /
 * text-muted-foreground / bg-primary(/10)/text-primary, copied from
 * src/insights-trends/components/TrendCard.tsx and
 * src/components/insights-v2/IndustryInsightsAdsCard.tsx. No new colour
 * tokens, no platform-brand tinting — platform identity is SOURCE_META's
 * icon + label only. No state is colour-only: trend stage always pairs its
 * colour with STAGE_META's icon + label.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Filter, Globe, type LucideIcon, Share2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useInsightPreferences } from "@/hooks/use-insight-preferences";
import type { TrendItem, TrendSourceType } from "@/insights-trends/types";
import type { TrendsFilters } from "@/insights-trends/hooks/useTrendsFilters";
import { useTrendsFilters } from "@/insights-trends/hooks/useTrendsFilters";
import { META_ADS, TIKTOK_HOOKS, OTHER_SOCIAL } from "@/insights-trends/mocks/trendsData";
import { TrendCard } from "@/insights-trends/components/TrendCard";
import { TrendActionBar } from "@/insights-trends/components/TrendActions";
import { InsightsV2EmptyState } from "@/components/insights-v2/InsightsV2EmptyState";
import { SOURCE_META, STAGE_META, nativeMetric, relativeTime } from "@/insights-trends/lib/trendsDisplay";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** Fixed subsection order — matches the mock data's own grouping. */
const OTHER_SOCIAL_ORDER: TrendSourceType[] = ["instagram", "youtube", "linkedin", "x"];

/** Doc §7.6 — instagram/linkedin stay square, youtube/x are 16:9. Meta and
 *  tiktok never reach this map; they render through TrendCard instead. */
const OTHER_SOCIAL_ASPECT: Partial<Record<TrendSourceType, string>> = {
  instagram: "aspect-square",
  linkedin: "aspect-square",
  youtube: "aspect-video",
  x: "aspect-video",
};

const CARD_GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
const WIDE_CARD_GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";

/* ------------------------------------------------------------------ */
/*  Other-social card — see file header for why this exists instead    */
/*  of reusing TrendCard's SocialMedia. Structurally mirrors TrendCard's */
/*  "standard" anatomy (stretched-link overlay at z-10, headline button  */
/*  and action bar promoted to z-20) so keyboard/click behaviour stays   */
/*  identical to every other card in this module.                       */
/* ------------------------------------------------------------------ */
function OtherSocialMedia({ item }: { item: TrendItem }): JSX.Element {
  const aspectClass = OTHER_SOCIAL_ASPECT[item.type] ?? "aspect-square";
  return (
    <div className={cn("-mx-4 -mt-4 mb-3 overflow-hidden bg-muted", aspectClass)}>
      <img src={item.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
    </div>
  );
}

function otherSocialIdentity(item: TrendItem): string | undefined {
  return item.handle ?? item.channel ?? item.author;
}

function OtherSocialCard({ item, onOpen }: { item: TrendItem; onOpen: (id: string) => void }): JSX.Element {
  const meta = SOURCE_META[item.type];
  const Icon: LucideIcon = meta.icon;
  const identity = otherSocialIdentity(item);
  const metric = nativeMetric(item);
  const stage = STAGE_META[item.intelligence.trendStage];
  const StageIcon = stage.icon;
  const showMetricContext = Boolean(metric?.context) && metric?.context !== identity;

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)]">
      <span aria-hidden="true" onClick={() => onOpen(item.id)} className="absolute inset-0 z-10 cursor-pointer" />
      <div className="space-y-3 p-4">
        <OtherSocialMedia item={item} />

        <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
          <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="shrink-0 font-medium text-foreground/80">{meta.label}</span>
          {identity && (
            <>
              <span aria-hidden="true" className="shrink-0">
                ·
              </span>
              <span className="min-w-0 truncate">{identity}</span>
            </>
          )}
        </div>

        <h3 className="relative z-20 leading-snug">
          <button
            type="button"
            onClick={() => onOpen(item.id)}
            className="line-clamp-2 rounded-sm text-left text-sm font-semibold text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background"
          >
            {item.title}
          </button>
        </h3>

        <p className="line-clamp-2 text-xs text-muted-foreground">{item.excerpt}</p>

        {metric && (
          <div className="min-w-0">
            <p className="truncate text-[11px] text-foreground">
              <span className="text-muted-foreground">{metric.label}</span>
              <span aria-hidden="true"> · </span>
              <span className="font-semibold">{metric.value}</span>
            </p>
            {showMetricContext && <p className="truncate text-[11px] text-muted-foreground">{metric.context}</p>}
          </div>
        )}

        <div className="flex min-w-0 items-center justify-between gap-2">
          <span className="shrink-0 text-[11px] text-muted-foreground">{relativeTime(item.publishedAt)}</span>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
              stage.className,
            )}
          >
            <StageIcon className="h-3 w-3" aria-hidden="true" />
            {stage.label}
          </span>
        </div>

        <div className="relative z-20 border-t border-border pt-2">
          <TrendActionBar item={item} variant="card" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section headers                                                   */
/* ------------------------------------------------------------------ */
function SectionHeader({ icon: Icon, label, count }: { icon: LucideIcon; label: string; count: number }): JSX.Element {
  return (
    <div className="flex items-baseline gap-2 border-b border-border pb-2">
      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <h2 className="text-sm font-semibold text-foreground">{label}</h2>
      <span className="text-[11px] text-muted-foreground">({count})</span>
    </div>
  );
}

function PlatformSubheader({ type, count }: { type: TrendSourceType; count: number }): JSX.Element {
  const meta = SOURCE_META[type];
  const Icon = meta.icon;
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{meta.label}</h3>
      <span className="text-[11px] text-muted-foreground">({count})</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton — mirrors the exact section/subsection hierarchy  */
/*  the populated view renders, so the layout doesn't jump on resolve. */
/* ------------------------------------------------------------------ */
function CardSkeleton({ aspect }: { aspect: string }): JSX.Element {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <Skeleton className={cn("w-full", aspect)} />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-3 w-full" />
      <div className="flex items-center justify-between border-t border-border pt-2">
        <Skeleton className="h-3 w-14" />
        <div className="flex gap-1">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
      </div>
    </div>
  );
}

function TrendsSocialSkeleton(): JSX.Element {
  return (
    <div className="space-y-8" aria-hidden="true">
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <Skeleton className="h-4 w-4 rounded-sm" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className={CARD_GRID}>
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} aspect="aspect-[3/4]" />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <Skeleton className="h-4 w-4 rounded-sm" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className={CARD_GRID}>
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} aspect="aspect-[3/4]" />
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <Skeleton className="h-4 w-4 rounded-sm" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-3.5 w-24" />
          <div className={CARD_GRID}>
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} aspect="aspect-square" />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-3.5 w-20" />
          <div className={WIDE_CARD_GRID}>
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} aspect="aspect-video" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  "No followed industries" — a standing notice, not a blocking empty */
/*  state. applyFilters treats zero followed industries as "fall       */
/*  through to unfiltered" (see useTrendsFilters.ts), so this can co-  */
/*  exist with a fully populated grid below it.                       */
/* ------------------------------------------------------------------ */
function NoFollowedIndustriesBanner({ onSwitchToGlobal }: { onSwitchToGlobal: () => void }): JSX.Element {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-muted/60 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
        <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          <span className="font-medium text-foreground">Your Industries Only</span> is on, but you haven&apos;t
          followed any industries yet — showing everything, unfiltered.
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onSwitchToGlobal} className="gap-1.5 text-[12px]">
          <Globe className="h-3.5 w-3.5" />
          Switch to Global
        </Button>
        <Button type="button" variant="ghost" size="sm" asChild className="text-[12px]">
          <Link to="/insights-v2/feed">Manage industries</Link>
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  View                                                               */
/* ------------------------------------------------------------------ */
export default function TrendsSocial(props: { filters: TrendsFilters; onOpen: (id: string) => void }): JSX.Element {
  const { filters, onOpen } = props;
  const { applyFilters, clearFilters, setFilters } = useTrendsFilters();
  const { preferences, isLoading: preferencesLoading } = useInsightPreferences();
  const followedIndustries = (preferences?.industries ?? []) as string[];

  // Bounded synthetic loading — see file header. Resets whenever this tab
  // is (re)mounted so switching away and back re-plays the loading state,
  // matching what a real fetch-on-tab-open would look like.
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setIsLoading(false), 500);
    return () => window.clearTimeout(t);
  }, []);

  const allSocialItems = useMemo<TrendItem[]>(
    () => [...META_ADS, ...TIKTOK_HOOKS, ...OTHER_SOCIAL],
    [],
  );

  const filtered = useMemo(() => applyFilters(allSocialItems), [applyFilters, allSocialItems]);

  const metaItems = useMemo(() => filtered.filter((i) => i.type === "meta"), [filtered]);
  const tiktokItems = useMemo(() => filtered.filter((i) => i.type === "tiktok"), [filtered]);
  const otherByPlatform = useMemo(() => {
    const map = new Map<TrendSourceType, TrendItem[]>();
    for (const type of OTHER_SOCIAL_ORDER) {
      const items = filtered.filter((i) => i.type === type);
      if (items.length > 0) map.set(type, items);
    }
    return map;
  }, [filtered]);

  const hasActiveNarrowing = Boolean(filters.search.trim()) || Boolean(filters.facetA) || Boolean(filters.facetB);
  const showIndustriesBanner = filters.scope === "industries" && !preferencesLoading && followedIndustries.length === 0;
  const zeroCauseIsIndustryScope =
    filters.scope === "industries" && followedIndustries.length > 0 && !hasActiveNarrowing;

  const handleSwitchToGlobal = () => setFilters({ scope: "global" });

  if (isLoading) {
    return <TrendsSocialSkeleton />;
  }

  if (filtered.length === 0) {
    return (
      <div className="space-y-4">
        {showIndustriesBanner && <NoFollowedIndustriesBanner onSwitchToGlobal={handleSwitchToGlobal} />}
        {zeroCauseIsIndustryScope ? (
          <InsightsV2EmptyState
            icon={Users}
            title="No social trends in your followed industries"
            description="Nothing in Meta Ads, TikTok Hooks, or Other Social currently matches your followed industries. Switch to Global to see everything, or follow more industries."
            cta={{ label: "Switch to Global", onClick: handleSwitchToGlobal }}
          />
        ) : (
          <InsightsV2EmptyState
            icon={Filter}
            title="No matches for these filters"
            description="Try clearing your search or the platform / creative-format filters to see more social trends."
            cta={{ label: "Clear all filters", onClick: clearFilters }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {showIndustriesBanner && <NoFollowedIndustriesBanner onSwitchToGlobal={handleSwitchToGlobal} />}

      {metaItems.length > 0 && (
        <section className="space-y-3" aria-labelledby="trends-social-meta-heading">
          <div id="trends-social-meta-heading">
            <SectionHeader icon={SOURCE_META.meta.icon} label="Meta Ads" count={metaItems.length} />
          </div>
          <div className={CARD_GRID}>
            {metaItems.map((item) => (
              <TrendCard key={item.id} item={item} variant="standard" onOpen={onOpen} />
            ))}
          </div>
        </section>
      )}

      {tiktokItems.length > 0 && (
        <section className="space-y-3" aria-labelledby="trends-social-tiktok-heading">
          <div id="trends-social-tiktok-heading">
            <SectionHeader icon={SOURCE_META.tiktok.icon} label="TikTok Hooks" count={tiktokItems.length} />
          </div>
          <div className={CARD_GRID}>
            {tiktokItems.map((item) => (
              <TrendCard key={item.id} item={item} variant="standard" onOpen={onOpen} />
            ))}
          </div>
        </section>
      )}

      {otherByPlatform.size > 0 && (
        <section className="space-y-6" aria-labelledby="trends-social-other-heading">
          <div id="trends-social-other-heading">
            <SectionHeader icon={Share2} label="Other Social" count={filtered.length - metaItems.length - tiktokItems.length} />
          </div>
          {OTHER_SOCIAL_ORDER.filter((type) => otherByPlatform.has(type)).map((type) => {
            const items = otherByPlatform.get(type)!;
            const isWide = OTHER_SOCIAL_ASPECT[type] === "aspect-video";
            return (
              <div key={type} className="space-y-3">
                <PlatformSubheader type={type} count={items.length} />
                <div className={isWide ? WIDE_CARD_GRID : CARD_GRID}>
                  {items.map((item) => (
                    <OtherSocialCard key={item.id} item={item} onOpen={onOpen} />
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
