import { useNavigate } from "react-router-dom";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useInsightsSetupState,
  markExtensionInstalled,
  enableWeeklyDigest,
} from "@/lib/insights-setup";
import { useHomeBrief, useThinCoverage } from "@/insights-home/lib/homeSelectors";
import { TopAdsGallery } from "@/insights-home/components/TopAdsGallery";
import { ActNowCard } from "@/insights-home/components/ActNowCard";
import { LaunchCadenceChart } from "@/insights-home/components/LaunchCadenceChart";
import { AngleMixDonut } from "@/insights-home/components/AngleMixDonut";
import { DomainsTeaserCard } from "@/insights-home/components/DomainsTeaserCard";
import { ModuleRouterCard } from "@/insights-home/components/ModuleRouterCard";
import { TopMoversCard } from "@/insights-home/components/TopMoversCard";
import { WatchingCard } from "@/insights-home/components/WatchingCard";
import { ThinCoverageRescue } from "@/insights-home/components/ThinCoverageRescue";

/**
 * InsightsOverview — the Industry Insights module's own landing page.
 * Routed at /insights/overview (App.tsx) and the FIRST sub-item of the
 * Industry Insights sub-nav (src/components/sidebar/modules.ts).
 *
 * Recomposed around Maalik's 13-block Figma pick (that Figma was flagged as
 * too dense — composition is the point here, not cramming). Two-column
 * layout matching the app's main+rail convention (see Dashboard.tsx:
 * `grid lg:grid-cols-5`, main `lg:col-span-3`, rail `lg:col-span-2`).
 *
 * MAIN column, reading order: today's brief (useHomeBrief) → TopAdsGallery →
 * ActNowCard → LaunchCadenceChart + AngleMixDonut side by side (stack on
 * narrow) → DomainsTeaserCard (carries its own source/estimate footer).
 *
 * RIGHT rail: ModuleRouterCard → setup checklist (4 items, unchanged from
 * before) → TopMoversCard → WatchingCard.
 *
 * FOLDING DECISION (Maalik's brief: don't ship both digest and brief since
 * they overlap): the old standalone "This week" digest card
 * (useInsightsDigest — src/lib/insights-digest.ts) is REMOVED. Its four row
 * kinds are each now covered by a richer, real block instead of an
 * invented-count sentence:
 *   - "competitor launched N ads"  → TopMoversCard (real 30-day swing + a
 *                                    one-click "track" action)
 *   - "N new ads match your feed"  → ModuleRouterCard's Discover row (real
 *                                    DUMMY_ADS.length) + TopAdsGallery
 *   - "<tag> trending in <industry>" → ActNowCard (the real, doc-compliant
 *                                    Trends signal, not a random tag pick)
 *   - "<brand>'s ad is standing out" → TopAdsGallery
 * In its place, useHomeBrief() renders ONE generated paragraph, synthesized
 * from the SAME derived selectors the new blocks below it already use
 * (launch-cadence spike, top mover, leading angle, live-domain count) — so
 * the brief and the blocks underneath it can never tell two different
 * stories about today. It is never labelled "AI" (Maalik: generated from
 * the day's updates, not an AI feature).
 *
 * The old stats strip (industries/competitors/boards/brands as four bare
 * tiles) is also REMOVED — ModuleRouterCard already surfaces live
 * Competitor/Board/Saved-Ads counts inline per row (with a route attached,
 * which the old tiles didn't have), and the setup checklist already tracks
 * industries/brands progress. Shipping a third count of the same numbers
 * added noise without adding a capability.
 *
 * ZERO/THIN state: useThinCoverage() (src/insights-home/lib/homeSelectors.ts)
 * is the single source of truth for "no followed industries, or followed
 * industries with no indexed inventory" — ThinCoverageRescue reads the exact
 * same hook, so the two can't disagree. When thin, ThinCoverageRescue
 * replaces the gallery/ActNow/charts row entirely (not three separate
 * swaps). The router card, checklist, and header one-liner stay mounted —
 * orientation is exactly what a new user needs. DomainsTeaserCard and the
 * right rail keep rendering too; each already has its own honest zero state.
 *
 * Mock-first: no new Supabase reads/writes. Every hook above is either
 * already-existing (useInsightsSetupState) or reads the Trends/dummy-ad mock
 * corpora read-only (src/insights-home/lib/homeSelectors.ts).
 */

const SOURCES_LABEL = "US · 4 sources";
const SOURCES_TITLE = "Meta Ad Library, StoreLeads, AdPlexity, Google Trends";

type ChecklistRow =
  | { key: string; done: boolean; label: string; ctaLabel: string; kind: "navigate"; to: string }
  | { key: string; done: boolean; label: string; ctaLabel: string; kind: "extension" }
  | { key: string; done: boolean; label: string; ctaLabel: string; kind: "digest" };

// TODO: keep in sync with InsightsExtensionCard.tsx / InsightsJourneyCard.tsx —
// same placeholder Chrome Web Store path until the extension is published.
const EXTENSION_URL = "https://chromewebstore.google.com/detail/fabads-insights";

export default function InsightsOverview() {
  const navigate = useNavigate();
  const setup = useInsightsSetupState();
  const { text: briefText, loading: briefLoading } = useHomeBrief();
  const { isThin, loading: coverageLoading } = useThinCoverage();

  const showChecklist = !setup.loading && !setup.complete;

  return (
    <div className="v3-page-mesh space-y-4 p-3">
      <PageHeader />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5 lg:items-start">
        {/* Main column */}
        <div className="space-y-3 lg:col-span-3">
          <BriefCard text={briefText} loading={briefLoading} />

          {coverageLoading ? (
            <TopSectionSkeleton />
          ) : isThin ? (
            <ThinCoverageRescue />
          ) : (
            <>
              <TopAdsGallery />
              <ActNowCard />
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-start">
                <Card>
                  <CardContent className="space-y-3 p-4">
                    <h2 className="text-sm font-semibold text-foreground">Launch cadence</h2>
                    <LaunchCadenceChart />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="space-y-3 p-4">
                    <h2 className="text-sm font-semibold text-foreground">Angle mix</h2>
                    <AngleMixDonut />
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          <DomainsTeaserCard />
        </div>

        {/* Right rail */}
        <div className="space-y-3 lg:col-span-2">
          <ModuleRouterCard />

          {setup.loading ? (
            <SetupChecklistSkeleton />
          ) : showChecklist ? (
            <SetupChecklistCard state={setup} navigate={navigate} />
          ) : null}

          <TopMoversCard />
          <WatchingCard />
        </div>
      </div>
    </div>
  );
}

// ── Page header ──────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold">Home</h1>
        <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">
          Industry Insights watches what your industries and your competitors are advertising —
          live creatives, trends, landing pages and offers — and turns what's working into briefs
          you can launch.
        </p>
      </div>

      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              tabIndex={0}
              title={SOURCES_TITLE}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
            >
              {SOURCES_LABEL}
            </span>
          </TooltipTrigger>
          <TooltipContent>{SOURCES_TITLE}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

// ── Today's brief — replaces the old "This week" digest card ────────

function BriefCard({ text, loading }: { text: string; loading: boolean }) {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <h2 className="text-sm font-semibold text-foreground">Today's brief</h2>
        {loading ? (
          <div className="space-y-1.5" aria-hidden>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-foreground/90">{text}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Loading skeleton for the gallery/ActNow/charts row ──────────────
// Shown only while useThinCoverage() is still resolving preferences — its
// own hierarchy of shapes matches what actually mounts once resolved, so
// the page never flashes the wrong branch (populated vs. thin).

function TopSectionSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {/* Mirrors TopAdsGallery's own breakpoints so the skeleton doesn't
          reflow into a different column count when the real cards mount. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4] w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-56 w-full rounded-lg" />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    </div>
  );
}

// ── Setup checklist ─────────────────────────────────────────────────

function SetupChecklistCard({
  state,
  navigate,
}: {
  state: ReturnType<typeof useInsightsSetupState>;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const progressPct = Math.round((state.doneCount / state.total) * 100);

  const rows: ChecklistRow[] = [
    {
      key: "prefs",
      done: state.prefsSet,
      label: "Follow your industries",
      ctaLabel: "Pick",
      kind: "navigate",
      to: "/insights-v2/feed?modal=prefs",
    },
    {
      key: "extension",
      done: state.extensionInstalled,
      label: "Install the Chrome extension",
      ctaLabel: "Add",
      kind: "extension",
    },
    {
      key: "competitor",
      done: state.competitorAdded,
      label: "Track your first competitor",
      ctaLabel: "Track",
      kind: "navigate",
      to: "/insights/competitors?modal=add",
    },
    {
      key: "digest",
      done: state.digestEnabled,
      label: "Turn on the weekly digest",
      ctaLabel: "Turn on",
      kind: "digest",
    },
  ];

  return (
    <Card className="border-primary/30 bg-primary/[0.02]">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Finish setting up</h2>
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span className="font-semibold text-foreground">{state.doneCount}</span> of{" "}
            {state.total} ready
          </span>
        </div>

        <div
          className="h-[3px] w-full overflow-hidden rounded-full bg-foreground/10"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Industry Insights setup progress"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <ul className="flex flex-col gap-1.5">
          {rows.map((row) => (
            <li
              key={row.key}
              className="flex items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-sm"
            >
              {row.done ? (
                <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <Check className="h-2.5 w-2.5 text-primary" strokeWidth={3} aria-hidden />
                </span>
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-foreground/30" strokeWidth={1.75} aria-hidden />
              )}
              <span
                className={cn(
                  "min-w-0 flex-1 truncate",
                  row.done ? "text-muted-foreground line-through" : "text-foreground",
                )}
              >
                {row.label}
              </span>
              {!row.done && row.kind === "extension" && (
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-7 shrink-0 text-xs"
                >
                  <a
                    href={EXTENSION_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={markExtensionInstalled}
                    aria-label={`${row.ctaLabel} — ${row.label}`}
                  >
                    {row.ctaLabel}
                  </a>
                </Button>
              )}
              {!row.done && row.kind === "digest" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 shrink-0 text-xs"
                  onClick={enableWeeklyDigest}
                  aria-label={`${row.ctaLabel} — ${row.label}`}
                >
                  {row.ctaLabel}
                </Button>
              )}
              {!row.done && row.kind === "navigate" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 shrink-0 text-xs"
                  onClick={() => navigate(row.to)}
                  // Visible label lives in the sibling span — name the task
                  // for screen readers rather than announcing bare "Pick".
                  aria-label={`${row.ctaLabel} — ${row.label}`}
                >
                  {row.ctaLabel}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function SetupChecklistSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-[3px] w-full rounded-full" />
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md border border-border/60 px-3 py-2">
              <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
              <Skeleton className="h-3 flex-1 rounded" />
              <Skeleton className="h-7 w-12 shrink-0 rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
