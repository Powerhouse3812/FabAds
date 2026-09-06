/**
 * LongRunnersGallery — "Top performing ads": competitor ads that have run
 * longest, as one horizontal row of Discover-style cards.
 *
 * Days-running is the only proxy this whole category has for "this creative
 * is working" — practitioners read testing (<21d) / working (21–45d) /
 * proven (45d+) off it constantly. But every competing product ranks by
 * longevity and quietly presents it as truth. Past `saturationThresholdDays`
 * (90d) the same signal can mean the opposite: an audience burnt out, not a
 * winner. `useLongRunners()` flags those ads with `saturationCaveat` and
 * hands us a ready `caveatNote` per ad plus a block-level rollup (`caveatCount`).
 *
 * MAALIK, 2026-08-31: "Top performing Ads — use same layout as discover."
 * Confirmed meaning: the same ad-card anatomy Discover uses, as ONE
 * horizontal row of 5–6 cards — not Discover's full paginated grid (2,000px+).
 *
 * WHICH DISCOVER CARD: `/insights/discover` (the route this block links out
 * to) renders `InsightsDiscover.tsx`, which renders `InsightAdCard`
 * (`src/components/insights/InsightAdCard.tsx`) — NOT
 * `IndustryInsightsAdsCard` (that one belongs to `/insights-v2/feed`, a
 * different route). `InsightAdCard` is the card this block matches.
 *
 * REUSE VERDICT: `InsightAdCard` could NOT be reused as-is, for two hard
 * reasons, not convenience:
 *  1. It's typed on `InsightAd` from `@/lib/insights-dummy-data`. The
 *     selector contract for this page bans importing that module (or its
 *     types) from any dashboard component — `LongRunnerAd` (from
 *     `@/insights-dashboard/lib/selectors`) is a distinct, smaller
 *     view-model with no `impressions`, `spend`, `platforms`, `status`,
 *     `pageAvatar`, `activeDuration`, `createdAt`, or `primaryText` fields
 *     to adapt into its props — those facts don't exist on this shape.
 *  2. Its action set (Save to Board / Add Domain to Competitors / Add Page
 *     to Competitors / Follow Brand / Save Ad / kebab → Copy Link + Generate
 *     Variations) is Discover's full feed toolkit. This block's actions are
 *     deliberately a smaller, local-only set (Brief it / Save / disabled
 *     Variation — see below); wiring the bigger set here would either be
 *     dead UI or scope creep past what this block owns.
 *  Given that, this rebuilds `InsightAdCard`'s ANATOMY faithfully — status
 *  meta row, avatar + brand + type row, `aspect-video` media with play
 *  affordance, headline + secondary copy, bottom action bar dimmed until
 *  hover/focus — sized for a one-row dashboard summary instead of a grid
 *  tile. Same grammar, this block's data and actions.
 *
 * SCANNABLE PASS (2026-08-31), superseded by the above: this block
 * previously rendered as three tier rows with headings, a caveat banner, and
 * a per-card caveat paragraph — ~1,191px. That was collapsed to one card
 * grammar, matching the reference Insights page. This pass keeps that
 * collapse (one row, `overflow-x-auto`, tier survives as a chip not a
 * heading) and additionally reshapes the card itself to match
 * `InsightAdCard`'s anatomy per Maalik's instruction above.
 *  - The hook quote, format label, similar-count, and the per-card caveat
 *    paragraph stay OFF the card as prose. The saturation caveat survives as
 *    a small icon + tooltip per affected card, plus ONE rolled-up count in
 *    the section header ("`caveatCount` of `totalCount` shown run 90+
 *    days") — a banner and a repeated sentence would still be prose; a mark
 *    is not.
 *  - Cards still cap at `CARDS_SHOWN_CAP` (6), spread evenly across the
 *    maturity spectrum (`CARDS_PER_TIER_CAP` per tier) rather than just the
 *    single longest runners — the point of this block is the spectrum
 *    (proven/working/testing), not a leaderboard of one tier. Header/footer
 *    counts stay true totals; only the rendered set is capped.
 *
 * TAB STOPS: each card is still ONE primary stop — a single stretched
 * `<Link>` (`adHref`) layered under the visible content, first in DOM order.
 * The tier chip, brand link, and the action row sit above that overlay
 * (`relative`, later in DOM = higher in the paint/stacking order) so they
 * stay independently reachable/clickable without adding a second card-wide
 * link. The action row is dimmed (`opacity-60`) rather than hidden at rest —
 * matching `InsightAdCard`'s footer, not a hover-reveal overlay — and goes
 * fully opaque on hover or `focus-within`, so it never depends on hover to
 * be *discoverable*, only to be *emphasised*.
 *
 * Card actions are intentionally uneven:
 *  - Brief it / Save — local optimistic only (`useState` + `toast`). No
 *    store writes; nothing here is a real Genie or boards integration yet.
 *  - Variation — rendered disabled with a reason. Genie doesn't read URL
 *    params yet, so wiring this live would silently drop the ad's context
 *    (thumb, hook, angle) the moment the user clicked it. A button that
 *    quietly loses your work is worse than one that admits it can't help.
 *
 * DOORWAYS — every card is still a route into Discover, not a dead end:
 *  - The whole card (media + copy, one stretched link) → `?ad=<adId>` (the
 *    ad detail drawer).
 *  - Tier chip (Proven/Working/Testing) → `?longevity=<tier>`.
 *  - Avatar + brand name → `?domain=<domain>` — every ad indexed for that
 *    advertiser.
 *  - Footer "See all N in Discover" → the unfiltered Discover surface.
 *
 * CHIP CONSOLIDATION — every ad in this fixture is `provenance: "observed"`
 * (see `toLongRunner` in fixtures.ts), so a chip on every one of up to 6
 * cards would say the identical thing 6 times. One block-level chip in the
 * header carries the claim; a per-card chip only reappears if that card's
 * tier genuinely diverges from the header's (computed, not assumed, so this
 * stays correct if the fixture ever mixes provenance tiers).
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowRight,
  Bookmark,
  ImageOff,
  NotebookPen,
  PlayCircle,
  ShieldAlert,
  Sparkles,
  Wand2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { InsightsV2EmptyState } from "@/components/insights-v2/InsightsV2EmptyState";
import { InfoTip } from "@/insights-dashboard/components/InfoTip";
import { Provenance } from "@/insights-dashboard/components/Provenance";
import { SendToGenieMenu } from "@/genie6/flows/SendToGenieMenu";
import {
  useDashboardMeta,
  useLongRunners,
  type LongRunnerAd,
  type LongRunnerTier,
  type ProvenanceTier,
} from "@/insights-dashboard/lib/selectors";

/** Local-only optimistic action state, keyed by ad id. Resets on reload. */
interface CardActionState {
  briefed: boolean;
  saved: boolean;
}

/** At most this many cards per tier, spread across the maturity spectrum —
 * see the file header. */
const CARDS_PER_TIER_CAP = 2;
/** Hard cap on the single row — 3 tiers × `CARDS_PER_TIER_CAP`. */
const CARDS_SHOWN_CAP = 6;

/** Card width in the row — sized to fit `InsightAdCard`'s anatomy at
 * dashboard scale rather than grid-tile scale.
 *
 * AUDIT FIX (2026-09-02): at 216px, 6 cards + 5 `gap-3` (12px) + the row's
 * `px-1` padding measured `scrollWidth 1364` against `clientWidth 1264` at
 * 1440×900 — the 6th card was clipped with no scroll affordance. Narrowed to
 * `w-48` (192px): 6×192 + 5×12 + 8 = 1280... still tight against 1256px of
 * Narrowed to `w-48` (192px): 6×192 + 5×12(gap) + 8(px-1) = 1220px against
 * the ~1256px of content width available inside `clientWidth 1264` — all 6
 * cards now fit with room to spare. `overflow-x-auto` stays as a safety net
 * for narrower viewports; it's just no longer load-bearing at 1440×900. */
const CARD_WIDTH = "w-48";

/** Unfiltered — "See all N" spans every tier, so the link must too. */
const DISCOVER_HREF = "/insights/discover";

/** `/insights/discover?ad=<adId>` — opens the ad detail drawer. */
function adHref(adId: string): string {
  return `/insights/discover?ad=${encodeURIComponent(adId)}`;
}
/** `/insights/discover?longevity=<tier>` — every ad in this maturity band. */
function longevityHref(tier: LongRunnerTier): string {
  return `/insights/discover?longevity=${tier}`;
}
/** `/insights/discover?domain=<domain>` — everything that advertiser runs. */
function domainHref(domain: string): string {
  return `/insights/discover?domain=${encodeURIComponent(domain)}`;
}

function AdCardMedia({ ad }: { ad: LongRunnerAd }) {
  // Thumbnails are remote (picsum). If one fails — offline demo, blocked
  // host, dead seed — the card otherwise renders an empty box that reads as
  // a broken layout in dark mode. Fall back to a labelled placeholder.
  const [imageFailed, setImageFailed] = useState(false);

  // `aspect-video` matches `InsightAdCard`'s own media ratio (Row 6 there) —
  // part of matching Discover's card grammar per Maalik's instruction. This
  // intentionally ignores `ad.mediaAspectRatio` (the ad's true ratio) for
  // the same reason Discover's own card does: a uniform ratio reads as one
  // grammar, ragged per-card ratios read as a browsing feed. Local to this
  // gallery only.
  return (
    <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-md bg-muted">
      {imageFailed ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center">
          <ImageOff className="h-4 w-4 text-muted-foreground/60" aria-hidden="true" />
          <span className="font-mono text-[8px] font-medium uppercase tracking-[0.12em] text-foreground/70">
            no preview
          </span>
        </div>
      ) : (
        <img
          src={ad.thumbUrl}
          alt=""
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="h-full w-full object-cover"
        />
      )}
      {!imageFailed && ad.mediaType === "video" && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/10"
          aria-hidden="true"
        >
          <PlayCircle className="h-6 w-6 text-white drop-shadow" strokeWidth={1.5} />
        </div>
      )}
      <span
        className={cn(
          "absolute left-1 top-1 inline-flex items-center rounded-full bg-black/70 px-1.5 py-0.5",
          "font-mono text-[8px] font-medium uppercase tracking-[0.1em] text-white",
        )}
      >
        {ad.daysRunning}d
      </span>
    </div>
  );
}

function LongRunnerCard({
  ad,
  dominantTier,
}: {
  ad: LongRunnerAd;
  /** The gallery's block-level provenance tier — see the file header. Only
   * render this card's own chip when it genuinely diverges from it. */
  dominantTier: ProvenanceTier | null;
}) {
  const [state, setState] = useState<CardActionState>({ briefed: false, saved: false });

  const handleBrief = () => {
    setState((prev) => ({ ...prev, briefed: true }));
    toast.success("Added to brief", {
      description: `${ad.brand} · ${ad.headline}`,
    });
  };

  const handleSave = () => {
    setState((prev) => {
      const nextSaved = !prev.saved;
      toast.success(nextSaved ? "Saved to board" : "Removed from board", {
        description: `${ad.brand} · ${ad.headline}`,
      });
      return { ...prev, saved: nextSaved };
    });
  };

  const brandInitial = ad.brand[0]?.toUpperCase() ?? "?";

  return (
    <div
      className={cn(
        "group relative flex shrink-0 flex-col gap-2 rounded-xl border border-border bg-background p-2.5",
        "shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md",
        CARD_WIDTH,
      )}
    >
      {/* The card's one primary tab stop — a stretched link laid under the
          visible content, first in DOM order. Everything else that needs to
          be independently reachable (tier chip, brand, actions) sits above
          it via `relative` — see TAB STOPS in the file header. */}
      <Link
        to={adHref(ad.adId)}
        aria-label={`${ad.brand} — ${ad.daysRunning} days running. Open in Discover.`}
        className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      />

      {/* Row 1 (matches InsightAdCard's status/duration row): tier + caveat +
          divergent provenance. */}
      <div className="relative flex items-center justify-between gap-1">
        <InfoTip tip="metric.long-runner-tier" asChild>
          <Link
            to={longevityHref(ad.tier)}
            className="inline-flex items-center rounded-full border border-border/70 px-1.5 py-0.5 font-mono text-[8px] font-medium uppercase tracking-[0.08em] text-foreground/70 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {ad.tier}
          </Link>
        </InfoTip>
        <div className="flex shrink-0 items-center gap-1">
          {ad.saturationCaveat && ad.caveatNote && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* span wrapper, not the bare svg: a raw `<svg>` has no
                      tabIndex, so Radix's tooltip never opens for keyboard
                      users — see `Provenance.tsx` for the same pattern. */}
                  <span
                    tabIndex={0}
                    aria-label="Possibly saturated"
                    className="inline-flex cursor-help rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <ShieldAlert className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                  </span>
                </TooltipTrigger>
                {/* Portalled — an unportalled TooltipContent clips inside any
                    ancestor scroller. Same pattern as `InfoTip`. */}
                <TooltipPrimitive.Portal>
                  <TooltipContent side="top" className="max-w-[200px]">
                    <p className="text-xs leading-snug">{ad.caveatNote}</p>
                  </TooltipContent>
                </TooltipPrimitive.Portal>
              </Tooltip>
            </TooltipProvider>
          )}
          {ad.provenance !== dominantTier && <Provenance tier={ad.provenance} compact />}
        </div>
      </div>

      {/* Row 2 (matches InsightAdCard's avatar + brand + type row). */}
      <div className="relative flex items-center gap-1.5">
        <Link
          to={domainHref(ad.domain)}
          title={`View ${ad.brand} in Discover`}
          className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px] font-semibold">{brandInitial}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to={domainHref(ad.domain)}
            title={ad.brand}
            className="block truncate text-xs font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {ad.brand}
          </Link>
          <p className="truncate text-[10px] text-foreground/70">
            {ad.format} · Similar {ad.similarCount}
          </p>
        </div>
      </div>

      {/* Row 3 (matches InsightAdCard's media row). */}
      <div className="relative">
        <AdCardMedia ad={ad} />
      </div>

      {/* Row 4 (matches InsightAdCard's headline + description row). */}
      <div className="relative space-y-0.5">
        <p className="line-clamp-1 text-xs font-medium leading-snug text-foreground">{ad.headline}</p>
        <p className="line-clamp-1 text-[10px] text-foreground/70">{ad.hook}</p>
      </div>

      {/* Row 5 (matches InsightAdCard's footer action bar): dimmed at rest,
          full opacity on hover/focus — discoverable without hover, not
          hidden by it. */}
      <div className="relative flex items-center gap-1 border-t border-border/60 pt-1.5 opacity-60 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
        <InfoTip tip="action.brief-it" asChild>
          <Button
            size="icon"
            variant={state.briefed ? "secondary" : "outline"}
            className="h-6 w-6"
            onClick={handleBrief}
            aria-label={state.briefed ? "Briefed" : "Brief it"}
          >
            <NotebookPen className="h-3 w-3" aria-hidden="true" />
          </Button>
        </InfoTip>
        <InfoTip tip="action.save-ad" asChild>
          <Button
            size="icon"
            variant={state.saved ? "secondary" : "outline"}
            className="h-6 w-6"
            onClick={handleSave}
            aria-label={state.saved ? "Saved" : "Save"}
          >
            <Bookmark className="h-3 w-3" aria-hidden="true" fill={state.saved ? "currentColor" : "none"} />
          </Button>
        </InfoTip>
        {/* Was a disabled button with an InfoTip explaining "Genie doesn't
            read URL params yet" (see file header, REUSE VERDICT). That's no
            longer true (see project_genie_url_params memory) and Other Flows
            now exists, so this mounts the real thing instead of a reason to
            wait. `ad.adId` is the underlying InsightAd.id (see toLongRunner()
            in fixtures.ts — `adId: ad.id`), the same id Industry Insights'
            own cards pass, so the picker resolves this card exactly like any
            other Insights ad. Plain Tooltip (not InfoTip) since there's no
            longer a "why disabled" reason to explain via tooltipCopy.ts. */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <SendToGenieMenu
                  module="industry-insights"
                  refId={ad.adId}
                  trigger={
                    <Button size="icon" variant="outline" className="h-6 w-6" aria-label="Variation">
                      <Wand2 className="h-3 w-3" aria-hidden="true" />
                    </Button>
                  }
                />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">Send to Genie</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

function GallerySkeleton(): JSX.Element {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {Array.from({ length: CARDS_SHOWN_CAP }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex shrink-0 flex-col gap-2 rounded-xl border border-border p-2.5",
            CARD_WIDTH,
          )}
        >
          <div className="flex items-center justify-between gap-1">
            <Skeleton className="h-3 w-10 rounded-full" />
            <Skeleton className="h-3 w-3 rounded-full" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-2.5 w-20" />
            </div>
          </div>
          <Skeleton className="aspect-video w-full rounded-md" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-2.5 w-3/4" />
          </div>
          <div className="flex items-center gap-1 border-t border-border/60 pt-1.5">
            <Skeleton className="h-6 w-6 rounded-md" />
            <Skeleton className="h-6 w-6 rounded-md" />
            <Skeleton className="h-6 w-6 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LongRunnersGallery({ className }: { className?: string }): JSX.Element {
  const { nonEmptyGroups, all, totalCount, isEmpty, isLoading } = useLongRunners();
  // `firstTime`/`empty` only — this block's data is market-wide and full in
  // both (see CONTRACT.md), so the provocation isn't "come back once you
  // have data", it's "your own swipe file is empty while this is already
  // sitting here". Grounded in `totalCount`, a real figure this hook
  // already computes — never a fabricated "your competitor" claim.
  const { isFirstTime, isEmptyState } = useDashboardMeta();
  const showSaveProvocation = (isFirstTime || isEmptyState) && !isEmpty;

  // See file header: every ad here is currently `observed`, so one
  // block-level chip replaces what would otherwise be a chip on every card.
  // Computed rather than hardcoded so a future mixed-tier fixture still
  // renders honestly (a divergent card keeps its own chip — see `LongRunnerCard`).
  const dominantTier = useMemo<ProvenanceTier | null>(() => {
    if (all.length === 0) return null;
    const counts = new Map<ProvenanceTier, number>();
    for (const ad of all) counts.set(ad.provenance, (counts.get(ad.provenance) ?? 0) + 1);
    let best: ProvenanceTier | null = null;
    let bestCount = -1;
    for (const [tier, count] of counts) {
      if (count > bestCount) {
        best = tier;
        bestCount = count;
      }
    }
    return best;
  }, [all]);

  // SIZE CAP (see file header): at most CARDS_PER_TIER_CAP per tier, spread
  // across the maturity spectrum, then re-sorted longest-first for the one
  // row. `nonEmptyGroups`' own `count`/`totalCount` stay untouched — only
  // this locally-rendered set is capped.
  const shownAds = useMemo<LongRunnerAd[]>(() => {
    const picked = nonEmptyGroups.flatMap((group) => group.ads.slice(0, CARDS_PER_TIER_CAP));
    return picked.sort((a, b) => b.daysRunning - a.daysRunning).slice(0, CARDS_SHOWN_CAP);
  }, [nonEmptyGroups]);

  // Rolled up to what's actually on screen — see CHIP CONSOLIDATION / caveat
  // note in the file header. Not the block-wide `caveatCount`, which would
  // overcount past the crop.
  const shownCaveatCount = useMemo(
    () => shownAds.filter((ad) => ad.saturationCaveat).length,
    [shownAds],
  );

  // CHECK isLoading BEFORE `isEmpty`. `all` is `[]` in both `loading` and a
  // genuinely empty gallery — a skeleton is the only render that doesn't
  // tell a first-time visitor "nothing is running" while we simply haven't
  // finished the first scan.
  if (isLoading) {
    return (
      <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <header className="mb-3 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70">
                Top performing ads
              </h2>
              <InfoTip tip="block.long-runners" />
            </div>
            <p className="mt-0.5 text-[10px] text-foreground/70">
              Ranked by days running — the longest-lived ads, not measured performance.
            </p>
          </div>
        </header>
        <GallerySkeleton />
      </section>
    );
  }

  return (
    <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70">
              Top performing ads
            </h2>
            <InfoTip tip="block.long-runners" />
            {!isEmpty && dominantTier && <Provenance tier={dominantTier} compact />}
            {!isEmpty && shownCaveatCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground/70">
                <ShieldAlert className="h-3 w-3" aria-hidden="true" />
                {shownCaveatCount} of {shownAds.length} shown run 90+ days
              </span>
            )}
          </div>
          {/* AUDIT FIX (2026-09-02): the old three-tier layout said this
              three times over in prose; the redesign collapsed all three
              away. This restores the honesty hedge once, cheaply — the
              per-card 90+ tooltip and the header count above stay as-is. */}
          <p className="mt-0.5 text-[10px] text-foreground/70">
            Ranked by days running — the longest-lived ads, not measured performance.
          </p>
        </div>
        {!isEmpty && (
          <div className="flex flex-wrap items-center gap-3">
            {/* PROVOCATION (firstTime/empty only): your swipe file is empty,
                but the market's proven creative already is not — one action,
                grounded in `totalCount`, the real figure this hook computes.
                Never "in your industries": this collection is market-wide in
                these states (see CONTRACT.md), so the claim stays honest. */}
            {showSaveProvocation && (
              <span className="text-[10px] font-medium text-foreground/70">
                Nothing saved yet — {totalCount} ads are already running this long. Save your first below.
              </span>
            )}
            <Link
              to={DISCOVER_HREF}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary-text hover:underline"
            >
              See all {totalCount} in Discover
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
        )}
      </header>

      {isEmpty ? (
        <InsightsV2EmptyState
          icon={Sparkles}
          title="No long-running creative indexed yet"
          description="Once the market has ads with a few scans behind them, the ones still running longest will show up here, ranked and flagged for saturation risk."
        />
      ) : (
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
          {shownAds.map((ad) => (
            <LongRunnerCard key={ad.adId} ad={ad} dominantTier={dominantTier} />
          ))}
        </div>
      )}
    </section>
  );
}
