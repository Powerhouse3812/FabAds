/**
 * LongRunnersGallery — the page's hero: competitor ads that have run longest.
 *
 * Days-running is the only proxy this whole category has for "this creative
 * is working" — practitioners read testing (<21d) / working (21–45d) /
 * proven (45d+) off it constantly. But every competing product ranks by
 * longevity and quietly presents it as truth. Past `saturationThresholdDays`
 * (90d) the same signal can mean the opposite: an audience burnt out, not a
 * winner. `useLongRunners()` flags those ads with `saturationCaveat` and
 * hands us a ready `caveatNote` per ad plus a block-level rollup — both are
 * surfaced ON the card/header, never demoted to a tooltip or footnote. Rank
 * by longevity, say plainly what it can't tell you.
 *
 * SIZE CAP (design critique: this block rendered at 3,043px — 3.4 viewport
 * heights, 45% of the page — because it showed the full 12-card set on a
 * page whose job is orientation, not "Discover with a different header").
 * Each tier shows at most `CARDS_PER_TIER_CAP` (2) cards — the spectrum
 * across Proven/Working/Testing is the point, so the cap is spread evenly
 * rather than just keeping the longest overall runners. Tier headings still
 * show the tier's TRUE count (`group.count`, never sliced) so the cap never
 * misrepresents how much exists. A footer "See all N in Discover" link
 * (`DISCOVER_HREF`, unfiltered — the whole point is the cross-tier spectrum,
 * so a single-tier deep link would misrepresent what "all N" means) carries
 * the true `totalCount`, so the cap is an honest crop, not a hidden one.
 * Media is forced to a uniform `aspect-[1.91/1]` here too (see `AdCardMedia`)
 * — three tier rows need to read as one aligned grid, which ragged per-ad
 * ratios fight, and a plain 1:1 square still left the block over the
 * ~1,200px budget at 6 cards (portrait/square media alone was ~46% of the
 * block's height). 1.91:1 is Meta's own link-ad image ratio — a landscape
 * crop that reads as native to this surface, not an arbitrary number.
 * `mediaAspectRatio` itself is untouched and still governs Discover's feed,
 * where ragged ratios are the point, not a cost.
 *
 * TAB STOPS (same critique: ~6 focusable stops × 12 cards inside this block
 * alone). Each card is now ONE primary stop — a single stretched `<Link>`
 * (`adHref`) layered under the visible content, first in DOM order — instead
 * of three separate links (media, hook, brand) that mostly duplicated the
 * same destination anyway. Brand/domain is rendered as plain text now, not
 * its own link; browsing everything a domain runs is still reachable from
 * Discover generally, just no longer a per-card shortcut. The action row
 * (Brief it / Save / Variation) stays fully keyboard-reachable — it's the
 * next stop(s) after the card link in DOM/tab order — but is visually
 * recessed (`opacity-0`) until the card is hovered or contains focus
 * (`group-focus-within`), so it's out of the *resting* path without ever
 * leaving the *tab* path. Hiding actions from the tab order entirely would
 * have been the worse failure; this keeps them one Tab away, always.
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
 *  - The whole card (media + brand + hook, one stretched link) → `?ad=<adId>`
 *    (the ad detail drawer) — the single destination that mattered most of
 *    the three the card used to expose separately.
 *  - Tier heading (Proven/Working/Testing) → `?longevity=<tier>`.
 *  - Footer "See all N in Discover" → the unfiltered Discover surface.
 *
 * CHIP CONSOLIDATION — every ad in this fixture is `provenance: "observed"`
 * (see `toLongRunner` in fixtures.ts), so a chip on every one of up to 12
 * cards said the identical thing 12 times — the exact "~40 chips, ~50 tab
 * stops" problem this page was critiqued for. One block-level chip in the
 * header now carries the claim; a per-card chip only reappears if that card's
 * tier genuinely diverges from the header's (computed, not assumed, so this
 * stays correct if the fixture ever mixes tiers).
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowRight,
  Bookmark,
  ImageOff,
  Layers,
  NotebookPen,
  PlayCircle,
  ShieldAlert,
  Sparkles,
  Wand2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InsightsV2EmptyState } from "@/components/insights-v2/InsightsV2EmptyState";
import { IndustryInsightsAdsCardGridSkeleton } from "@/components/insights-v2/IndustryInsightsAdsCardSkeleton";
import { Provenance } from "@/insights-dashboard/components/Provenance";
import {
  useLongRunners,
  type LongRunnerAd,
  type LongRunnerTier,
  type LongRunnerTierGroup,
  type ProvenanceTier,
} from "@/insights-dashboard/lib/selectors";

/** Local-only optimistic action state, keyed by ad id. Resets on reload. */
interface CardActionState {
  briefed: boolean;
  saved: boolean;
}

/** At most this many cards per tier — see SIZE CAP in the file header. */
const CARDS_PER_TIER_CAP = 2;

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

function AdCardMedia({ ad }: { ad: LongRunnerAd }) {
  // Thumbnails are remote (picsum). If one fails — offline demo, blocked
  // host, dead seed — the card otherwise renders a tall empty box that reads
  // as a broken layout in dark mode. Fall back to a labelled placeholder so
  // the tile still says what it is.
  const [imageFailed, setImageFailed] = useState(false);

  // Not a link — the whole card is now the one stretched link (see
  // LongRunnerCard). This is purely visual content sitting above it.
  //
  // OVERVIEW AR OVERRIDE: `ad.mediaAspectRatio` (the ad's true ratio — 4:5,
  // 9:16, 1:1, whatever it actually ran as) is intentionally ignored here.
  // Ragged per-card aspect ratios are a Pinterest-masonry move that earns
  // its keep in a browsing feed (Discover honours `mediaAspectRatio` there);
  // on a summary block it just costs height and keeps three tier rows from
  // reading as one aligned grid. A plain square (1:1) is the "safe" middle
  // choice but still left this block over its ~1,200px height budget at 6
  // cards, so this goes flatter: 1.91:1, Meta's own link-ad image ratio —
  // landscape, uniform across every card, and still a native-looking crop
  // rather than an arbitrary number picked to hit a target. This is a
  // presentation choice local to this gallery only — the data itself is
  // untouched, so Discover/the drawer still show the real ratio.
  // `object-cover` on the <img> below crops to it rather than distorting.
  return (
    <div className="relative w-full overflow-hidden rounded-md bg-muted aspect-[1.91/1]">
      {imageFailed ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center">
          <ImageOff className="h-5 w-5 text-muted-foreground/60" aria-hidden="true" />
          <span className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {ad.format} · preview unavailable
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
          <PlayCircle className="h-9 w-9 text-white drop-shadow" strokeWidth={1.5} />
        </div>
      )}
      <span
        className={cn(
          "absolute left-1.5 top-1.5 inline-flex items-center rounded-full bg-black/70 px-1.5 py-0.5",
          "font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-white",
        )}
      >
        {ad.daysRunning}d running
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

  return (
    <div className="group relative flex flex-col gap-2 rounded-md border border-border/70 bg-background p-2 transition-shadow hover:shadow-sm">
      {/* The card's one primary tab stop — a stretched link laid under the
          visible content, first in DOM order. Everything below (media,
          brand, hook) is now plain, non-interactive content; this is the
          single doorway into the ad detail drawer. See TAB STOPS in the
          file header. */}
      <Link
        to={adHref(ad.adId)}
        aria-label={`${ad.brand} — "${ad.hook}" — ${ad.daysRunning} days running. Open in Discover.`}
        className="absolute inset-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      />

      <AdCardMedia ad={ad} />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p title={ad.brand} className="truncate text-sm font-semibold text-foreground">
            {ad.brand}
          </p>
          <p title={ad.domain} className="truncate text-xs text-muted-foreground">
            {ad.domain}
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 text-[10px] font-medium capitalize">
          {ad.tier}
        </Badge>
      </div>

      <p className="line-clamp-2 text-xs leading-snug text-foreground/90">&ldquo;{ad.hook}&rdquo;</p>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span>{ad.format}</span>
        <span aria-hidden="true">·</span>
        <span>{ad.similarCount.toLocaleString()} similar</span>
        {/* Only shown when this card's tier genuinely diverges from the
            gallery's block-level chip in the header — see file header. */}
        {ad.provenance !== dominantTier && <Provenance tier={ad.provenance} compact />}
      </div>

      {ad.saturationCaveat && ad.caveatNote && (
        <div className="flex items-start gap-1.5 rounded-md bg-muted/60 px-2 py-1.5">
          <ShieldAlert className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p className="text-[11px] leading-snug text-muted-foreground">{ad.caveatNote}</p>
        </div>
      )}

      {/* Action row: still fully keyboard-reachable (next Tab stops after the
          card link above), just visually recessed until hovered or until it
          contains focus — out of the resting path, never out of the tab
          path. `relative` gives it a higher default stacking order than the
          absolutely-positioned overlay link above (later DOM + positioned
          beats positioned-with-no-z-index), so its buttons stay clickable. */}
      <div className="relative mt-auto flex items-center gap-1.5 pt-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100">
        <Button
          size="sm"
          variant={state.briefed ? "secondary" : "outline"}
          className="h-7 flex-1 gap-1 px-2 text-xs"
          onClick={handleBrief}
        >
          <NotebookPen className="h-3 w-3" aria-hidden="true" />
          {state.briefed ? "Briefed" : "Brief it"}
        </Button>
        <Button
          size="sm"
          variant={state.saved ? "secondary" : "outline"}
          className="h-7 flex-1 gap-1 px-2 text-xs"
          onClick={handleSave}
        >
          <Bookmark
            className="h-3 w-3"
            aria-hidden="true"
            fill={state.saved ? "currentColor" : "none"}
          />
          {state.saved ? "Saved" : "Save"}
        </Button>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              {/* span wrapper: disabled buttons don't fire hover/focus for Radix triggers */}
              <span className="flex-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled
                  className="h-7 w-full gap-1 px-2 text-xs"
                >
                  <Wand2 className="h-3 w-3" aria-hidden="true" />
                  Variation
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px]">
              <p className="text-xs leading-snug">
                Genie doesn&apos;t read link context yet — this would drop the ad&apos;s hook and
                thumbnail on the way in, so it&apos;s off until that&apos;s wired up.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

function TierSection({
  group,
  dominantTier,
}: {
  /** `group.ads` here may already be capped for display — `group.count`
   * always stays the tier's true total (see SIZE CAP in the file header). */
  group: LongRunnerTierGroup;
  dominantTier: ProvenanceTier | null;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <Link
          to={longevityHref(group.tier)}
          title={`View ${group.label.toLowerCase()} creative (${group.rangeLabel.toLowerCase()}) in Discover`}
          className="group flex items-baseline gap-1.5 rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <h3 className="text-xs font-semibold text-foreground group-hover:underline">
            {group.label}
          </h3>
          <span className="text-[11px] text-muted-foreground">{group.rangeLabel}</span>
        </Link>
        <span className="font-mono text-[10px] font-medium tabular-nums text-muted-foreground">
          {group.count}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {group.ads.map((ad) => (
          <LongRunnerCard key={ad.adId} ad={ad} dominantTier={dominantTier} />
        ))}
      </div>
    </div>
  );
}

export function LongRunnersGallery({ className }: { className?: string }): JSX.Element {
  const { all, nonEmptyGroups, caveatNote, caveatCount, totalCount, isEmpty, isLoading } =
    useLongRunners();

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
  // across the maturity spectrum rather than just the longest runners
  // overall. `count` is left untouched — only the rendered `ads` are sliced —
  // so tier headings and the footer link both keep reporting true totals.
  const displayGroups = useMemo<LongRunnerTierGroup[]>(
    () => nonEmptyGroups.map((group) => ({ ...group, ads: group.ads.slice(0, CARDS_PER_TIER_CAP) })),
    [nonEmptyGroups],
  );
  const shownCount = useMemo(
    () => displayGroups.reduce((sum, group) => sum + group.ads.length, 0),
    [displayGroups],
  );

  // CHECK isLoading BEFORE `isEmpty`. `all` is `[]` in both `loading` and a
  // genuinely empty gallery — a card-grid skeleton is the only render that
  // doesn't tell a first-time visitor "nothing is running" while we simply
  // haven't finished the first scan.
  if (isLoading) {
    return (
      <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Longest-running creative</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              The strongest proxy this category has for “this is working.”
            </p>
          </div>
        </header>
        <IndustryInsightsAdsCardGridSkeleton count={6} />
      </section>
    );
  }

  return (
    <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Longest-running creative</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isEmpty
              ? "The strongest proxy this category has for “this is working.”"
              : `${totalCount} ads still live, longest first — the strongest proxy this category has for “this is working.”`}
          </p>
        </div>
        {!isEmpty && (
          <div className="flex shrink-0 items-center gap-2">
            {dominantTier && <Provenance tier={dominantTier} compact />}
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              <Layers className="h-3 w-3" aria-hidden="true" />
              {caveatCount} flagged as possibly saturated
            </span>
          </div>
        )}
      </header>

      {isEmpty ? (
        <InsightsV2EmptyState
          icon={Sparkles}
          title="No long-running creative indexed yet"
          description="Once your followed competitors' ads have a few scans behind them, the ones still running longest will show up here, ranked and flagged for saturation risk."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {caveatNote && (
            <div className="flex items-start gap-2 rounded-md border border-border/70 bg-muted/40 px-3 py-2">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <p className="text-xs leading-snug text-muted-foreground">{caveatNote}</p>
            </div>
          )}
          {displayGroups.map((group) => (
            <TierSection key={group.tier} group={group} dominantTier={dominantTier} />
          ))}
          {/* Honest crop, not a hidden one — see SIZE CAP in the file header. */}
          {shownCount < totalCount && (
            <div className="flex justify-end border-t border-border/60 pt-3">
              <Link
                to={DISCOVER_HREF}
                className="inline-flex items-center gap-1 rounded-sm text-xs font-medium text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                See all {totalCount} in Discover
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
