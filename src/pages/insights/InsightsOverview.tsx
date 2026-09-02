import { useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { shouldDiscloseSampleData } from "@/insights-dashboard/lib/access";
import { AlertTriangle, FlaskConical, History, Info, Loader2, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import {
  DashboardStateProvider,
  useDashboardState,
} from "@/insights-dashboard/state/DashboardState";
import {
  useDashboardMeta,
  useDashboardStatus,
  useSetupChecklist,
  type DashboardStatusBanner,
} from "@/insights-dashboard/lib/selectors";

import { StatePill } from "@/insights-dashboard/components/StatePill";
import { KpiRow } from "@/insights-dashboard/components/KpiRow";
import { LongRunnersGallery } from "@/insights-dashboard/components/LongRunnersGallery";
import { ChangeFeed } from "@/insights-dashboard/components/ChangeFeed";
import { TopCompetitors } from "@/insights-dashboard/components/TopCompetitors";
import { AngleMixDonut } from "@/insights-dashboard/components/AngleMixDonut";
import { YouVsMarket } from "@/insights-dashboard/components/YouVsMarket";
import { ShareOfVoice } from "@/insights-dashboard/components/ShareOfVoice";
import { DomainsTeaser } from "@/insights-dashboard/components/DomainsTeaser";
import { BoardHygiene } from "@/insights-dashboard/components/BoardHygiene";
import { WhereToGo } from "@/insights-dashboard/components/WhereToGo";
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
            banner.tone === "degraded" ? "text-error-text" : "text-foreground",
          )}
        >
          {banner.title}
        </p>
        <p className="max-w-3xl text-sm leading-relaxed text-foreground/70">{banner.body}</p>
      </div>
    </div>
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
// There is no tall rail in this layout (that died with the two-column grid),
// so there is nothing here to keep pinned — just the clearance offset so a
// programmatic scroll lands below the sticky top bar instead of under it.
/** Clears the sticky top bar when something is scrolled to programmatically. */
const SCROLL_CLEARANCE = "scroll-mt-20";

// ═══════════════════════════════════════════════════════════════════════════

function InsightsOverviewContent(): JSX.Element {
  const dashboardState = useDashboardState();
  const meta = useDashboardMeta();
  const status = useDashboardStatus();
  const railRef = useRef<HTMLDivElement>(null);

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
  //
  // `isLoading` falls through to the SAME block set. Every block below owns
  // its own `isLoading` check (ahead of its own `isEmpty` check) and its own
  // skeleton sized to its own resolved geometry, so the page does not need a
  // parallel page-level skeleton to keep in sync by hand — mounting the real
  // components IS the loading state, and there is zero chance of it drifting
  // out of measurement with what it resolves into.
  const showFullBoard = isLoading || (!isThin && !isZero);

  // `SetupChecklist` returns null once all three steps are done (it will not
  // render a celebration banner), so the page cannot hand it a fixed
  // `col-span-4` and assume something fills it — in `populated` and `error`
  // setup IS complete, which left a third of that row visibly empty beside
  // "Where to go". The page owns layout, so the page asks the same selector
  // the block does and gives the row's whole width to `WhereToGo` when the
  // checklist has nothing to ask for.
  //
  // Mirrors the block's own render contract exactly, in the same order:
  // skeleton while loading (so the slot is held and the row does not reflow
  // on resolve), then null when `complete || !nextStep`.
  const setup = useSetupChecklist();
  const showChecklist = isLoading || !(setup.complete || !setup.nextStep);
  const summaryMainSpan = showChecklist ? "lg:col-span-8" : "lg:col-span-12";

  const handleRefresh = useCallback(() => {
    // Honest: there is no scheduled re-sync behind this button. It never
    // implies a live pull — it just restates when data was last scanned.
    toast(meta.refreshNote);
  }, [meta.refreshNote]);

  /**
   * Skip link. `<main>` carries 200+ tab stops, nearly all of them inside the
   * change feed and the top-ads strip, so a keyboard user who wants the
   * "where to go" + "finish setup" pair currently tabs through the entire
   * page to reach it. There is no tall rail in this layout — the target is
   * whichever row is last on the page in the active state, which is this
   * pair in all five states.
   *
   * The anchor's `href` is the no-JS fallback; the handler is what actually
   * runs, because the default anchor jump would land the target underneath
   * the sticky top bar. `preventScroll` then `scrollIntoView` lets
   * `scroll-mt` do the clearing, and focusing the container (not a control
   * inside it) means the next Tab enters it at its first control.
   */
  const handleSkipToSummary = useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    const target = railRef.current;
    if (!target) return;
    event.preventDefault();
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "start" });
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
          <span className="text-xs text-foreground/70">{meta.lastScanLabel}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs text-foreground/70"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Refresh now
          </Button>
        </div>
        <Link
          to="/insights-v2/feed"
          className="text-xs font-medium text-primary-text hover:underline"
        >
          Manage preferences
        </Link>
      </div>

      {/* Everything below the sticky bar carries the page padding. The root
          keeps `bg-background` — AppShell hardcodes `bg-white` on <main> and
          `.v3-page-mesh` paints nothing, which is how the other Insights pages
          break in dark mode. */}
      <div className="flex flex-col gap-6 p-6">
        {/* Header. No visible title or description — the sticky top bar
            already says where you are (freshness + preferences) and the
            sidebar names the module, so a repeated "Industry Insights" heading
            was pure vertical space. An `sr-only` h1 keeps the page's
            accessible name for screen readers and the browser tab structure;
            only the visible copy was cut. */}
        <div className="flex flex-col gap-2">
          <h1 className="sr-only">Industry Insights</h1>
          <div className="flex flex-wrap items-center gap-3">
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
          <p className="text-xs text-foreground/70">{meta.stateNote}</p>

          {/* Sample-data disclosure — outside dev only.
              Every figure on this page is fabricated. In dev the ?state= pill
              already frames the page as a lab, but someone arriving from a
              shared link has no such cue and would reasonably read "20,515 live
              ads" as their own market. Deliberately not dismissible: a
              prototype that looks like a live dashboard is the exact failure
              this module's whole provenance layer exists to prevent. Remove
              this when the page is wired to real sources, not before. */}
          {shouldDiscloseSampleData() && (
            <p className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/60 px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-foreground">
              <FlaskConical className="h-3 w-3 shrink-0" aria-hidden="true" />
              Prototype · every figure on this page is sample data
            </p>
          )}
        </div>

        {/* Disclosure before data. Null in populated / thin / zero — those states
            have nothing to disclose, and a permanent banner would train people to
            stop reading the one that matters. */}
        {status.needsDisclosure && status.banner && <StatusBanner banner={status.banner} />}

        {/* KpiRow spans full width — the page's honesty strip, including the
            explanation for why the rest of the page is thin below it. Flat,
            first, no chrome around it beyond its own. */}
        <KpiRow />

        {/* Everything below is one repeating 12-column rhythm — full-width
            rows and paired rows, same gap (gap-6) and same card shell
            (rounded-lg border bg-card) throughout. That single repeated
            grammar is what makes a dashboard with this much in it still read
            as scannable rather than as nine different card anatomies stitched
            together. Blocks never receive a wrapper div for sizing — every
            block takes `className` and merges it onto its own root, so the
            grid column span is passed straight through. */}
        <div className="flex flex-col gap-6" aria-busy={isLoading || undefined}>
          {/* populated, error, AND loading share this block set. `error` is
              the populated board minus the StoreLeads-modelled figures
              (per-figure `naReason`, not a different layout). `loading` is
              the same board with every block's own `isLoading` branch
              painting its own skeleton — see the note on `showFullBoard`
              above for why that beats a parallel page-level skeleton. */}
          {showFullBoard && (
            <>
              {/* Row: what changed, beside your angle mix and your account
                  against the market. The change feed leads — it's the one
                  block nothing else on this page ships — and its 8-col
                  height (~440px, a fixed recent-activity list, not fluid) set
                  the row. A lone compact `AngleMixDonut` in the 4-col column
                  used to be stretched to match it, ~73% empty — the exact
                  "failed to load" read a monitor already flagged once on
                  Board hygiene. `AngleMixDonut`'s compact mode was built for
                  a narrower column shared with the now-deleted
                  `LaunchCadenceChart`; that partner is gone, so this column
                  gets a new one. `YouVsMarket` stacked underneath is a real
                  content pairing (both are "you vs the market" reads, just
                  two different axes) and, combined, its content plus the
                  compact donut's lands within a few px of ChangeFeed's own
                  height — no stretch-void on either side, and the row does
                  not grow past its original height. This is the one place on
                  the page two blocks share a grid cell, hence the wrapper
                  div (every other block takes its span via `className`
                  directly). */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <ChangeFeed className="lg:col-span-8" />
                <div className="flex flex-col gap-6 lg:col-span-4">
                  <AngleMixDonut compact />
                  <YouVsMarket />
                </div>
              </div>

              {/* Top-performing ads — one horizontal strip, full width. */}
              <LongRunnersGallery />

              {/* Row: who's shipping (ranked list + launch cadence, merged
                  into one card) beside where the money-adjacent traffic goes. */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <TopCompetitors className="lg:col-span-6" />
                <DomainsTeaser className="lg:col-span-6" />
              </div>

              {/* Row: which industry is biggest and who holds it, beside
                  board maintenance. `YouVsMarket` moved into the hero row
                  above (see there), so this is a 2-up row now, not 3 —
                  `BoardHygiene` keeps its own `self-start` (sized to its two
                  numbers, not stretched) exactly as before; only the spans
                  changed to fill the freed column. */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <ShareOfVoice className="lg:col-span-8" />
                <BoardHygiene className="lg:col-span-4" />
              </div>

              {/* Row: where the rest of the module lives, beside whatever
                  setup is still worth finishing. Last row on the page, so
                  this is the skip-link target in every state. */}
              <div
                ref={railRef}
                id="insights-summary"
                tabIndex={-1}
                aria-label="Where to go and setup"
                className={cn("grid grid-cols-1 gap-6 lg:grid-cols-12", SCROLL_CLEARANCE, "focus:outline-none")}
              >
                <WhereToGo className={summaryMainSpan} />
                {showChecklist && <SetupChecklist className="lg:col-span-4" />}
              </div>
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
                  no summary — follows it. myBrand IS present in "thin" —
                  YouVsMarket is the one genuinely non-empty block here. */}
              <CoverageRescue />
              <ChangeFeed />
              <YouVsMarket />

              <div
                ref={railRef}
                id="insights-summary"
                tabIndex={-1}
                aria-label="Where to go and setup"
                className={cn("grid grid-cols-1 gap-6 lg:grid-cols-12", SCROLL_CLEARANCE, "focus:outline-none")}
              >
                <WhereToGo className={summaryMainSpan} />
                {showChecklist && <SetupChecklist className="lg:col-span-4" />}
              </div>
            </>
          )}

          {/* zero: starter industries only, nothing fabricated above it. No
              change feed here — with nothing followed, "we need two scans of
              the same advertiser" is an answer to a question the user has not
              asked yet, and CoverageRescue already says the true thing. */}
          {isZero && (
            <>
              <CoverageRescue />

              <div
                ref={railRef}
                id="insights-summary"
                tabIndex={-1}
                aria-label="Where to go and setup"
                className={cn("grid grid-cols-1 gap-6 lg:grid-cols-12", SCROLL_CLEARANCE, "focus:outline-none")}
              >
                <WhereToGo className={summaryMainSpan} />
                {showChecklist && <SetupChecklist className="lg:col-span-4" />}
              </div>
            </>
          )}
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
