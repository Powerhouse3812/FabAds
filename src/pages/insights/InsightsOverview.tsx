import { useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { AlertTriangle, History, Info, Loader2, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import {
  DashboardStateProvider,
  useDashboardState,
} from "@/insights-dashboard/state/DashboardState";
import {
  useDashboardMeta,
  useDashboardStatus,
  useLaunchCadence,
  type DashboardStatusBanner,
} from "@/insights-dashboard/lib/selectors";

import { StatePill } from "@/insights-dashboard/components/StatePill";
import { KpiRow } from "@/insights-dashboard/components/KpiRow";
import { LongRunnersGallery } from "@/insights-dashboard/components/LongRunnersGallery";
import { ChangeFeed } from "@/insights-dashboard/components/ChangeFeed";
import { LaunchCadenceChart } from "@/insights-dashboard/components/LaunchCadenceChart";
import { AngleMixDonut } from "@/insights-dashboard/components/AngleMixDonut";
import { YouVsMarket } from "@/insights-dashboard/components/YouVsMarket";
import { ShareOfVoice } from "@/insights-dashboard/components/ShareOfVoice";
import { DomainsTeaser } from "@/insights-dashboard/components/DomainsTeaser";
import { MarketMovers } from "@/insights-dashboard/components/MarketMovers";
import { WatchlistHealth } from "@/insights-dashboard/components/WatchlistHealth";
import { BoardHygiene } from "@/insights-dashboard/components/BoardHygiene";
import { SetupChecklist } from "@/insights-dashboard/components/SetupChecklist";
import { CoverageRescue } from "@/insights-dashboard/components/CoverageRescue";

/**
 * The module pulls from exactly four sources. The Figma spec said eight —
 * that number was never substantiated, so this page does not repeat it.
 */
const SOURCES = ["Meta Ad Library", "StoreLeads", "AdPlexity", "Google Trends"];

// ═══════════════════════════════════════════════════════════════════════════
// Status banner
// ═══════════════════════════════════════════════════════════════════════════

/**
 * The page's one disclosure line, directly under the header and above the KPI
 * row — the first thing read, before any number it qualifies.
 *
 * Tone is carried by icon + words first and colour second, never by hue alone:
 * `degraded` is the only tone that borrows `destructive`, and it still names
 * the failure in the title and spells out the consequence in the body. The
 * body is rendered verbatim — in `error` it is the sentence that says which
 * source is down, which figures are therefore missing, and which figures are
 * unaffected. Paraphrasing it away would gut the page's credibility play.
 *
 * Roles differ with tone deliberately: a failure is assertive (`alert`),
 * loading and staleness are polite (`status`), so a screen reader is not
 * interrupted for "still loading".
 */
function StatusBanner({ banner }: { banner: DashboardStatusBanner }): JSX.Element {
  const Icon =
    banner.tone === "loading" ? Loader2 : banner.tone === "degraded" ? AlertTriangle : History;

  return (
    <div
      role={banner.tone === "degraded" ? "alert" : "status"}
      aria-live={banner.tone === "degraded" ? "assertive" : "polite"}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3",
        banner.tone === "degraded"
          ? "border-destructive/40 bg-destructive/10"
          : "border-border bg-muted/50",
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          banner.tone === "degraded" ? "text-destructive" : "text-muted-foreground",
          banner.tone === "loading" && "animate-spin",
        )}
        aria-hidden="true"
      />
      <div className="min-w-0 space-y-0.5">
        <p
          className={cn(
            "text-sm font-semibold",
            banner.tone === "degraded" ? "text-destructive" : "text-foreground",
          )}
        >
          {banner.title}
        </p>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{banner.body}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Loading skeletons
// ═══════════════════════════════════════════════════════════════════════════
//
// `loading` and `zero` are byte-identical on the surface — every collection is
// empty, every KPI is null — and mean opposite things. So the page never lets
// an empty state paint while `isLoading`: it mounts placeholders shaped like
// the blocks they stand in for. Each traces the real card's geometry (shell,
// header row, body mass) so the swap to real content does not shift the page.
//
// The two exceptions, both deliberate:
//   · `KpiRow` renders for real — its loading tiles carry `value: null` with a
//     `naReason` that names the source being waited on ("waiting on the Meta
//     Ad Library"). That is honest and specific; a grey band would say less.
//   · `ChangeFeed` renders for real — it owns its own skeleton, including the
//     brief folded into it, and knows to check `isLoading` before `isEmpty`.

function SkeletonBlock({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <section
      aria-hidden="true"
      className={cn("rounded-lg border border-border bg-card p-4", className)}
    >
      {children}
    </section>
  );
}

function SkeletonBlockHeader({ withMeta = true }: { withMeta?: boolean }): JSX.Element {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <Skeleton className="h-4 w-44" />
      {withMeta && <Skeleton className="h-3 w-20" />}
    </div>
  );
}

/** Rows shaped like a rail list: leading mark, two-line label, trailing figure. */
function SkeletonRows({ count }: { count: number }): JSX.Element {
  return (
    <ul className="divide-y divide-border/60">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
          <Skeleton className="h-3.5 w-3.5 shrink-0 rounded" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-4 w-12 shrink-0" />
        </li>
      ))}
    </ul>
  );
}

/**
 * Header, plot area, scope note — the shape every chart block on this page has.
 *
 * `compact` mirrors the same prop on the real charts. The two charts render in
 * the demoted row, so their skeletons have to be short too — a full-height
 * placeholder that swaps for a compact chart is the layout jump a skeleton
 * exists to prevent.
 */
function SkeletonChartBlock({ compact = false }: { compact?: boolean }): JSX.Element {
  return (
    <SkeletonBlock>
      <SkeletonBlockHeader />
      <Skeleton className={cn("w-full rounded-md", compact ? "h-28" : "h-40")} />
      <Skeleton className="mt-3 h-3 w-3/4" />
    </SkeletonBlock>
  );
}

/**
 * One long-runner tile: media, brand + tier badge, hook, meta line, actions.
 *
 * Written here rather than reusing `IndustryInsightsAdsCardSkeleton` — that
 * one traces the Insights *feed* card, which is a different and much taller
 * component (avatar row, six icon actions, fixed 16:9 media). Dropped into
 * this grid it stood ~70px taller than the tile it stands in for, which is
 * precisely the layout jump a skeleton exists to prevent. The ragged aspect
 * ratios are deliberate: `mediaAspectRatio` really does vary per ad, and a
 * grid of identical boxes would settle into a rhythm the real one never has.
 */
function SkeletonAdCard({ ratio }: { ratio: string }): JSX.Element {
  return (
    <div className="flex flex-col gap-2.5 rounded-md border border-border/70 bg-background p-2.5">
      <Skeleton className="w-full rounded-md" style={{ aspectRatio: ratio }} />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
      </div>
      <div className="space-y-1">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <Skeleton className="h-3 w-1/2" />
      <div className="flex items-center gap-1.5 pt-1">
        <Skeleton className="h-7 flex-1 rounded-md" />
        <Skeleton className="h-7 flex-1 rounded-md" />
      </div>
    </div>
  );
}

/** Card shell + one tier heading + the gallery's `sm:2 / xl:3` tile grid. */
function SkeletonGallery(): JSX.Element {
  return (
    <SkeletonBlock>
      <SkeletonBlockHeader />
      <div className="space-y-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-3 w-10" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {["1/1", "2/3", "16/9"].map((ratio) => (
            <SkeletonAdCard key={ratio} ratio={ratio} />
          ))}
        </div>
      </div>
    </SkeletonBlock>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Sticky geometry
// ═══════════════════════════════════════════════════════════════════════════
//
// The scroll container is `<main>` (AppShell sets `md:block md:overflow-auto`
// on it), NOT the window. Everything sticky on this page therefore resolves
// against main's scrollport, and nothing between here and main may carry an
// `overflow` other than `visible` — AppLayout's content div is deliberately
// `md:overflow-visible` for exactly this reason. Do not wrap this page in a
// scroller.
//
// Two offsets, kept here so the header bar and the rail cannot drift apart:
//   · the top bar is ~44px tall (py-2 around an h-7 control) + a 1px rule
//   · the rail sticks below it with 12px of air, and caps its own height so
//     its lower half is never parked off-screen
const RAIL_STICKY = "lg:sticky lg:top-14 lg:max-h-[calc(100vh-4.5rem)] lg:overflow-y-auto";
/** Clears the sticky top bar when something is scrolled to programmatically. */
const SCROLL_CLEARANCE = "scroll-mt-20";

// ═══════════════════════════════════════════════════════════════════════════

function InsightsOverviewContent(): JSX.Element {
  const dashboardState = useDashboardState();
  const meta = useDashboardMeta();
  const status = useDashboardStatus();
  const cadence = useLaunchCadence();
  const changeFeedRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLElement>(null);

  // ORDER MATTERS. `isLoading` is evaluated before anything that tests for
  // emptiness, because in `loading` every collection is empty and that means
  // "not yet", not "none". Everything below reads these flags, never a raw
  // `state` string or a `length === 0`.
  const isLoading = status.isLoading;
  const isThin = !isLoading && dashboardState === "thin";
  const isZero = !isLoading && dashboardState === "zero";

  // `error` is NOT an empty state and NOT a layout of its own: it is the
  // populated page with the StoreLeads-modelled figures removed and a
  // three-day-old timestamp on everything that survives. `isPopulated`,
  // `isThin` and `isZero` are all false there, so it falls through to the
  // populated block set on purpose — the banner and the per-figure `naReason`
  // strings carry the degradation, not a different set of blocks.
  const showFullBoard = !isLoading && !isThin && !isZero;

  const handleRefresh = useCallback(() => {
    // Honest: there is no scheduled re-sync behind this button. It never
    // implies a live pull — it just restates when data was last scanned.
    toast(meta.refreshNote);
  }, [meta.refreshNote]);

  const handleSelectWeek = useCallback(
    (weekIndex: number) => {
      const week = cadence.weeks[weekIndex];
      toast(
        week
          ? `Showing the change feed for the week of ${week.weekStartLabel}`
          : "Showing the change feed",
      );
      changeFeedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [cadence.weeks],
  );

  /**
   * Skip link. `<main>` carries 200+ tab stops, nearly all of them inside the
   * change feed and the gallery, so a keyboard user who wants the rail's
   * reference blocks currently tabs through the entire page to reach them.
   *
   * The anchor's `href` is the no-JS fallback; the handler is what actually
   * runs, because the default anchor jump would land the rail underneath the
   * sticky top bar. `preventScroll` then `scrollIntoView` lets `scroll-mt`
   * do the clearing, and focusing the container (not a control inside it)
   * means the next Tab enters the rail at its first control.
   */
  const handleSkipToSummary = useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    const rail = railRef.current;
    if (!rail) return;
    event.preventDefault();
    rail.focus({ preventScroll: true });
    rail.scrollIntoView({ block: "start" });
  }, []);

  return (
    <div className="v3-page-mesh flex min-h-full flex-col bg-background">
      {/* FIRST focusable element on the page, before the dev switcher and
          before the top bar. Invisible until focused, then a real control. */}
      <a
        href="#insights-summary"
        onClick={handleSkipToSummary}
        className={cn(
          "sr-only focus:not-sr-only",
          "focus:absolute focus:left-6 focus:top-4 focus:z-50",
          "focus:rounded-md focus:border focus:border-border focus:bg-card",
          "focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground",
          "focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring",
        )}
      >
        Skip to summary
      </a>

      <StatePill />

      {/* Top bar — freshness + an honest refresh + a way to the preferences
          this whole page is shaped by. No writes happen from this row.

          STICKY, and deliberately full-bleed rather than inset: seven screens
          down, "when was this scanned" and the way back to preferences are the
          two things that stop being reachable, and a bar that keeps the page's
          side padding reads as a floating card instead of chrome. Solid
          `bg-background` because content scrolls behind it. Height is the
          whole constraint here — py-2 around an h-7 control, one hairline
          rule, nothing else. Do not put the h1 or the state note in here. */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-border bg-background px-6 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{meta.lastScanLabel}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Refresh now
          </Button>
        </div>
        <Link
          to="/insights-v2/feed"
          className="text-xs font-medium text-primary hover:underline"
        >
          Manage preferences
        </Link>
      </div>

      {/* Everything below the sticky bar carries the page padding. The root
          keeps `bg-background` — AppShell hardcodes `bg-white` on <main> and
          `.v3-page-mesh` paints nothing, which is how the other Insights pages
          break in dark mode. */}
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">Industry Insights</h1>
            <Tooltip>
              {/* Badge is a plain function component, so `asChild` cannot forward
                  a ref to it (React warns, and the tooltip loses its anchor). The
                  span is the ref target; tabIndex keeps the tooltip reachable by
                  keyboard as well as hover. Fixing this by editing
                  components/ui/badge.tsx is not an option — shadcn primitives are
                  not modified in this repo. */}
              <TooltipTrigger asChild>
                <span tabIndex={0} className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <Badge
                    variant="secondary"
                    className="cursor-default gap-1 font-mono text-[10px] font-medium uppercase tracking-[0.1em]"
                  >
                    <Info className="h-3 w-3" aria-hidden="true" />
                    US · 4 sources
                  </Badge>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-[220px] text-xs">{SOURCES.join(" · ")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Follow industries and competitor brands to see their live Meta and Instagram
            ads, the domains behind those ads, and the boards you have saved — one
            overview of the whole Industry Insights module.
          </p>
          <p className="text-xs text-muted-foreground">{meta.stateNote}</p>
        </div>

        {/* Disclosure before data. Null in populated / thin / zero — those states
            have nothing to disclose, and a permanent banner would train people to
            stop reading the one that matters. */}
        {status.needsDisclosure && status.banner && <StatusBanner banner={status.banner} />}

        {/* KpiRow spans full width, between the header and the grid, in every
            state — it is the page's honesty strip, including the explanation
            for why the rest of the page is thin below it.

            DEVIATION from Maalik's sketch, which put the KPI band second, under
            the change feed. It stays first for two reasons: it is a five-tile
            band that needs the full width, and a full-width block sandwiched
            below a two-column grid reads as a stray footer rather than a
            section. The point of the sketch — that the differentiating block
            leads — is preserved: the KPI band is now three chunks per tile, a
            thin strip rather than a wall, and the change feed sits directly
            under it at the top of the main column, above the gallery. */}
        <KpiRow />

        {/* The repo's usual 5/3/2 (lg:col-span-5 / -3 / -2 of 12) leaves the main
            column too narrow once two side-by-side chart rows sit inside it —
            each chart ends up under 300px wide. 8/4 is the justified deviation
            here: it gives the chart rows real width without starving the rail. */}
        <div
          className="grid grid-cols-1 gap-6 lg:grid-cols-12"
          aria-busy={isLoading || undefined}
        >
          <div className="flex min-w-0 flex-col gap-6 lg:col-span-8">
            {isLoading && (
              <>
                {/* Real component: it owns its skeleton (feed rows + the brief
                    folded into it) and checks isLoading before isEmpty. */}
                <ChangeFeed />
                <SkeletonGallery />
                {/* Same order and the same widths as the real board below —
                    the two comparison blocks full-width, then the demoted
                    compact chart pair. */}
                <SkeletonBlock>
                  <SkeletonBlockHeader />
                  <SkeletonRows count={3} />
                </SkeletonBlock>
                <SkeletonBlock>
                  <SkeletonBlockHeader />
                  <Skeleton className="h-6 w-full rounded-full" />
                  <div className="mt-3">
                    <SkeletonRows count={3} />
                  </div>
                </SkeletonBlock>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <SkeletonChartBlock compact />
                  <SkeletonChartBlock compact />
                </div>
                <SkeletonBlock>
                  <SkeletonBlockHeader />
                  <SkeletonRows count={5} />
                </SkeletonBlock>
              </>
            )}

            {/* populated AND error. The change feed leads: it is the one block
                nothing else in this category ships, and it used to sit fourth,
                under a gallery every competitor has. The brief is inside it now
                — the two answered the same question twice. */}
            {showFullBoard && (
              <>
                <div ref={changeFeedRef} className={SCROLL_CLEARANCE}>
                  <ChangeFeed />
                </div>
                <LongRunnersGallery />

                {/* ── The two blocks nobody else can build ──────────────────
                    "You vs the market" and share of live creative are the only
                    blocks on this page that need BOTH sides — the market's
                    behaviour and the user's own account. A competitor with the
                    same Ad Library feed can ship the cadence chart and the angle
                    donut; neither can ship these. They used to sit in a 2-up row
                    identical in shell, weight and width to the generic charts
                    directly above them, so nothing told the eye which mattered.
                    Full-width, one per row, and ahead of the charts now. Wider
                    also fixes them on their own terms: the comparison table gets
                    a real your/market column split instead of wrapping, and the
                    stacked share bars get enough pixels to label segments. */}
                <YouVsMarket />
                <ShareOfVoice />

                {/* ── Demoted: the two generic charts ───────────────────────
                    Kept, because they are the context the blocks above are read
                    against — but half-width and `compact`, which is the whole
                    hierarchy signal. Cadence stays interactive: clicking a week
                    scrolls back up to the change feed. */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <LaunchCadenceChart compact onSelectWeek={handleSelectWeek} />
                  <AngleMixDonut compact />
                </div>

                {/* Deliberately last / below the fold — it carries the only
                    modelled money numbers on the page, and leading with an
                    estimate is the most-criticised habit in this category. */}
                <DomainsTeaser />
              </>
            )}

            {isThin && (
              <>
                {/* Day 1 leads with the fix, not with the gap. The change feed
                    leads everywhere it has something to report; here it has
                    nothing, and "nothing to compare against yet" is a poor first
                    impression above the one block that can actually change that.
                    So the rescue block takes the slot and the merged
                    brief+feed — which still carries the honest reason there is
                    no summary — follows it. */}
                <CoverageRescue />
                <div ref={changeFeedRef} className={SCROLL_CLEARANCE}>
                  <ChangeFeed />
                </div>
                {/* myBrand IS present in "thin" — this is the one genuinely
                    non-empty block, and the your-side/market-side asymmetry
                    is exactly this state's story. */}
                <YouVsMarket />
              </>
            )}

            {/* zero: starter industries only, nothing fabricated above it. No
                change feed here — with nothing followed, "we need two scans of
                the same advertiser" is an answer to a question the user has not
                asked yet, and CoverageRescue already says the true thing. */}
            {isZero && <CoverageRescue />}
          </div>

          {/* ── The rail ─────────────────────────────────────────────────────
              Everything in here is reference material — who moved, what the
              watchlist is doing, which boards have rotted, what is still unset —
              and it stays useful for the whole scroll. It used to run out after
              ~1,800px against a ~6,300px main column, so four fifths of the
              right side of the page was empty. It travels now.

              THE CHOICE, since sticky-to-top alone cannot fix this: the rail's
              own content is taller than the viewport, so pinning its top would
              simply park its lower half permanently off-screen. Options were
              (a) one sticky wrapper that scrolls internally, or (b) sticking
              only the top two cards and letting board hygiene + setup scroll
              away. This is (a). (b) costs half the rail to save one affordance,
              and the two cards it sacrifices are the two with unfinished work in
              them — precisely what you want reachable at any depth. The cost of
              (a) is a second scroll axis, which is real but small here: 1,800px
              of content in an ~830px window is roughly one flick, the content is
              independent cards rather than prose, and wheel scroll chains back
              to the page once the rail bottoms out (no `overscroll-contain`).

              No `tabIndex` on the scroller: WCAG only requires a scrollable
              region be keyboard-operable, and every card in here already has
              focusable controls that the browser scrolls into view. Adding one
              would mean adding a tab stop to a page that has 200 too many.

              `-mr-2 pr-2` parks the scrollbar in the grid gap so the cards keep
              their alignment with the blocks above. Sticky is `lg:`-gated —
              below that the grid is one column and the rail is just the tail of
              the page. */}
          <aside
            id="insights-summary"
            ref={railRef}
            tabIndex={-1}
            aria-label="Summary, watchlist and setup"
            className={cn("min-w-0 lg:col-span-4", SCROLL_CLEARANCE, "focus:outline-none")}
          >
            <div className={cn("flex min-w-0 flex-col gap-6", RAIL_STICKY, "lg:-mr-2 lg:pr-2")}>
              {isLoading && (
                <>
                  <SkeletonBlock>
                    <SkeletonBlockHeader />
                    <SkeletonRows count={5} />
                  </SkeletonBlock>
                  <SkeletonBlock>
                    <SkeletonBlockHeader />
                    <SkeletonRows count={4} />
                  </SkeletonBlock>
                  <SkeletonBlock>
                    <SkeletonBlockHeader />
                    <SkeletonRows count={3} />
                  </SkeletonBlock>
                  {/* The checklist always carries its three items, but every one
                      reads `done: false` until something resolves — rendering it
                      live here would claim "0 of 3 done" about a workspace we
                      have not finished reading. */}
                  <SkeletonBlock>
                    <SkeletonBlockHeader withMeta={false} />
                    <Skeleton className="mb-3 h-1.5 w-full rounded-full" />
                    <SkeletonRows count={3} />
                  </SkeletonBlock>
                </>
              )}

              {showFullBoard && (
                <>
                  <MarketMovers />
                  <WatchlistHealth />
                  <BoardHygiene />
                  <SetupChecklist />
                </>
              )}

              {isThin && (
                <>
                  <WatchlistHealth />
                  <SetupChecklist />
                </>
              )}

              {isZero && (
                <>
                  <SetupChecklist />
                  <WatchlistHealth />
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function InsightsOverview(): JSX.Element {
  return (
    <DashboardStateProvider>
      <InsightsOverviewContent />
    </DashboardStateProvider>
  );
}
