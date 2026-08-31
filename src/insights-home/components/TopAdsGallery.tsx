import { Link } from "react-router-dom";
import { Bookmark, Info, Play, Sparkles, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTopAds } from "@/insights-home/lib/homeSelectors";
import { useWatchedSignals, watchSignal, unwatchSignal, isWatched } from "@/insights-home/lib/watchingStore";
import { SOURCE_META } from "@/insights-trends/lib/trendsDisplay";
import type { TrendItem } from "@/insights-trends/types";

/**
 * TopAdsGallery — "Top ads" block for the Industry Insights Home page
 * (src/pages/insights/InsightsOverview.tsx).
 *
 * Three creative cards from useTopAds(3) — the same Meta Ad Library +
 * TikTok-hook corpus the Trends module already renders (META_ADS /
 * TIKTOK_HOOKS in src/insights-trends/mocks/trendsData.ts) — re-sorted here
 * by each item's OWN duration signal (Meta: activeDays; TikTok: days since
 * posted, the closest available proxy since hooks aren't ad placements with
 * a runtime). This is a plain display-order sort on three already-curated
 * items, not a cross-source score: nothing here mixes a Meta "days running"
 * count with a TikTok one into a single combined number shown to the user
 * (doc §E / useTopAds's own doc comment) — each card still prints its own
 * source-native duration label.
 *
 * Card chrome matches DomainsTeaserCard.tsx / ModuleRouterCard.tsx / this
 * page's DigestCard (Card > CardContent space-y-3 p-4, text-sm font-semibold
 * h2, border-border/60 rounded-md rows). Media/chip vocabulary is copied
 * from src/insights-trends/components/TrendCard.tsx's AdCreativeMedia (the
 * -mx-4 bleed, the bg-background/85 backdrop-blur format chip, the
 * bg-black/45 play overlay for video) — same tokens, no new ones.
 *
 * ACTIONS — three decisions worth calling out:
 *  1. "Save" reuses watchingStore's watchSignal/unwatchSignal/isWatched (the
 *     Home module's own "Watching" shortlist, shared with whichever other
 *     Home block renders that list) rather than the Trends module's own
 *     separate in-memory useTrendActions().toggleSave — those are two
 *     different concepts (a personal watchlist with a bounded test window
 *     vs. a Trends-page-local save toggle) and this block is a Home surface.
 *  2. "+ Board" — SaveToBoardModal (src/components/insights/SaveToBoardModal.tsx)
 *     is typed to `InsightAd` (Meta-ads-library shaped: impressions, reach,
 *     spend, demographics, locations...), a wholly different corpus from
 *     the Trends module's TrendItem. Faking those unused fields to satisfy
 *     the type would mean inventing placeholder ad-performance data, which
 *     is exactly the "second corpus" the brief says not to invent. So this
 *     is the documented fallback: "+ Board" navigates to the real ads feed
 *     (/insights-v2/feed) where SaveToBoardModal already works against real
 *     InsightAd rows.
 *  3. "Variation" — DISABLED with a tooltip, not omitted. /iq/genie6/generate
 *     doesn't read URL params yet, so a live button would silently drop the
 *     ad/hook context the user clicked it for. A disabled control with an
 *     explanatory tooltip tells the user the capability exists and is
 *     coming, without pretending it works today.
 *
 * States: loading (3 skeleton cards), zero (useTopAds returns nothing —
 * invitation to set preferences so the corpus has something to rank),
 * populated (3 cards). The longevity caveat line is permanent whenever any
 * card renders — it's a caution about the ranking method itself, not
 * something a user can dismiss away.
 */

const HEADLINE_LINK = "/insights/trends";

function daysRunning(item: TrendItem): number {
  if (item.type === "meta" && item.activeDays != null) return item.activeDays;
  const published = new Date(item.publishedAt).getTime();
  if (Number.isNaN(published)) return 0;
  return Math.max(0, Math.floor((Date.now() - published) / 86_400_000));
}

function durationLabel(item: TrendItem): string {
  const days = daysRunning(item);
  const unit = days === 1 ? "day" : "days";
  return item.type === "meta" ? `${days} ${unit} running` : `${days} ${unit} since posted`;
}

function formatLabel(item: TrendItem): string {
  if (item.type === "meta") return item.format ?? "—";
  return item.duration ? `Short-form video · ${item.duration}` : "Short-form video";
}

function identityFor(item: TrendItem): string | undefined {
  return item.type === "meta" ? item.advertiser : item.creator;
}

function hookLineFor(item: TrendItem): string | undefined {
  if (item.type === "tiktok") return item.hook;
  if (item.type === "meta") return item.ctaText ? `${item.headline} — ${item.ctaText}` : item.headline;
  return undefined;
}

export function TopAdsGallery(): JSX.Element {
  const { items, loading } = useTopAds(3);
  // Keeping the hook mounted (rather than calling isWatched() ad hoc) so this
  // block re-renders when another surface saves/unsaves the same signal —
  // same cross-tab/cross-component sync the store already guarantees.
  useWatchedSignals();

  const sorted = [...items].sort((a, b) => daysRunning(b) - daysRunning(a));

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Top ads</h2>
          <Link
            to={HEADLINE_LINK}
            className="inline-flex shrink-0 items-center gap-1 rounded-sm text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            View all in Trends
          </Link>
        </div>

        {loading ? (
          <TopAdsGallerySkeleton />
        ) : sorted.length === 0 ? (
          <TopAdsGalleryEmpty />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {sorted.map((item) => (
                <TopAdCard key={item.id} item={item} />
              ))}
            </div>
            <p className="flex items-start gap-1.5 rounded-md bg-muted/40 px-2.5 py-2 text-[11px] leading-snug text-muted-foreground">
              <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
              <span>
                Ranked by how long each ad has been running — long-running suggests durable, not
                necessarily best-performing creative. Use it as a starting point, not a leaderboard.
              </span>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function TopAdCard({ item }: { item: TrendItem }): JSX.Element {
  const meta = SOURCE_META[item.type];
  const Icon: LucideIcon = meta.icon;
  const identity = identityFor(item);
  const hookLine = hookLineFor(item);
  const industry = item.industries?.[0];
  const saved = isWatched(item.id);

  const toggleSave = () => {
    if (saved) unwatchSignal(item.id);
    else watchSignal(item);
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="relative -mt-0 aspect-[3/4] overflow-hidden bg-muted">
        <img src={item.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
        {item.type === "tiktok" && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm">
              <Play className="h-4 w-4 text-white" fill="currentColor" stroke="currentColor" strokeWidth={1} />
            </span>
          </span>
        )}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center rounded-full border border-border/60 bg-background/85 px-2 py-0.5 text-[10px] text-foreground backdrop-blur-sm"
        >
          {formatLabel(item)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
          <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="shrink-0 font-medium text-foreground/80">{meta.label}</span>
          {identity && (
            <>
              <span aria-hidden="true" className="shrink-0">
                ·
              </span>
              <Link
                to={`${HEADLINE_LINK}?story=${encodeURIComponent(item.id)}`}
                className="min-w-0 truncate rounded-sm hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                title={identity}
              >
                {identity}
              </Link>
            </>
          )}
        </div>

        {hookLine && (
          <p className="line-clamp-2 text-xs italic text-muted-foreground" title={hookLine}>
            &ldquo;{hookLine}&rdquo;
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 text-[11px]">
          <span className="truncate font-medium text-foreground" title={durationLabel(item)}>
            {durationLabel(item)}
          </span>
          {industry && (
            <span className="shrink-0 truncate rounded-full bg-muted px-2 py-0.5 text-muted-foreground" title={industry}>
              {industry}
            </span>
          )}
        </div>

        <TooltipProvider delayDuration={250}>
          {/* flex-wrap, not a fixed row: the main column gets narrow enough
              (~130px per card with the sub-nav expanded at 768) that three
              fixed controls used to overflow and clip. Wrapping keeps every
              control reachable instead of cutting the last one off. */}
          <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-2">
            <Button asChild size="sm" variant="outline" className="h-7 flex-1 text-xs">
              <Link to="/insights-v2/feed">+ Board</Link>
            </Button>
            <Button
              type="button"
              size="sm"
              variant={saved ? "secondary" : "outline"}
              className="h-7 flex-1 gap-1 text-xs"
              aria-pressed={saved}
              onClick={toggleSave}
            >
              <Bookmark className={cn("h-3 w-3", saved && "fill-current")} aria-hidden />
              {saved ? "Saved" : "Save"}
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                {/* span wrapper so the tooltip still fires on a disabled button */}
                <span className="inline-flex">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-7 w-7 shrink-0"
                    disabled
                    aria-label="Open in Genie as a variation — coming soon"
                  >
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Genie pre-fill from an ad is coming soon</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
}

function TopAdsGallerySkeleton(): JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading top ads">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-lg border border-border bg-card">
          <Skeleton className="aspect-[3/4] w-full rounded-none" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-16 rounded" />
            <div className="flex gap-1.5 border-t border-border pt-2">
              <Skeleton className="h-7 flex-1 rounded" />
              <Skeleton className="h-7 flex-1 rounded" />
              <Skeleton className="h-7 w-7 shrink-0 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TopAdsGalleryEmpty(): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      <Sparkles className="h-8 w-8 text-muted-foreground/40" aria-hidden />
      <div className="max-w-sm">
        <h3 className="text-sm font-medium text-foreground">No top ads yet</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Set your industry preferences and we'll surface the longest-running creative here.
        </p>
      </div>
      <Button asChild size="sm" variant="outline">
        <Link to="/insights-v2/feed?modal=prefs">Set preferences</Link>
      </Button>
    </div>
  );
}

export default TopAdsGallery;
