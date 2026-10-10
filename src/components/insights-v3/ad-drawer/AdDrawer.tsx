/**
 * AdDrawer: the ad detail drawer for Industry Insights V2. Ported from the old
 * InsightAdDetailDrawer (creative, meta row, actions, stats grid, keywords,
 * demographics, location, domains + language, similar ads) with the analysis
 * merged in. The analysed / not analysed badge and the Analyse buttons are gone:
 * analysis shows by default and partial data becomes disabled sections.
 *
 * Contract: AdDrawer({ adId, onClose }). Mounted LAST by InsightsOverlayHost so
 * its portal stacks above any open detail overlay; closing returns to the
 * overlay underneath. Never closes on outside click: X or Esc only.
 *
 * Drill-down: clicking an element, page or landing page inside the drawer pushes
 * a detail overlay. The drawer steps aside (unmounts its dialog) while that
 * overlay is on top and comes back, scroll position kept, when it closes,
 * because a modal drawer would otherwise hide the overlay it just opened.
 */
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Copy, X } from "lucide-react";
import { MODULE_NOW, getAd, getAds, getAdvertiser, getLandingPage } from "@/lib/insights-v3/data";
import { adsInScope, isEngagementStandout, isNew, isWinner } from "@/lib/insights-v3/selectors";
import { useLastVisitAt, useUserPrefs } from "@/lib/insights-v3/stores";
import type { Ad } from "@/lib/insights-v3/types";
import { AdCard } from "@/components/insights-v3/ad-card/AdCard";
import {
  DisabledSection,
  EmptyState,
  Hint,
  readScopeFromParams,
  useAdDrawer,
  useDetailStack,
} from "@/components/insights-v3/shared";
import { AdCreativePanel } from "./AdCreativePanel";
import { AdMetaPanel } from "./AdMetaPanel";
import { AdChipsRow, AdMetricsSection, AdStatsGrid } from "./AdMetricsPanel";
import { AiScorePanel } from "./AiScorePanel";
import { CreativeBreakdown } from "./CreativeBreakdown";
import { LandingPanel } from "./LandingPanel";
import { DemographicsSection, DomainsLanguage, KeywordsPlatforms, LocationSection } from "./TargetingPanels";
import { copyText } from "./drawerUtils";

/* ── similar ads ──────────────────────────────────────────────────────── */

function SimilarAds({ ad }: { ad: Ad }) {
  const drawer = useAdDrawer();
  const similar = ad.similarAdIds.map((id) => getAd(id)).filter((a): a is Ad => !!a && a.id !== ad.id);

  if (similar.length === 0) {
    return (
      <DisabledSection
        title="Similar ads"
        reason="No similar ads were found for this creative, so it is the only copy we've seen."
        minHeight={120}
      />
    );
  }
  return (
    <section aria-label="Similar ads" className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        Similar ads{" "}
        <span className="rounded-full bg-primary/15 px-1.5 font-mono text-[11px] font-normal leading-5 tabular-nums text-primary-text">
          {similar.length}
        </span>
      </h3>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] items-start gap-3">
        {similar.map((s) => (
          <AdCard key={s.id} ad={s} onOpen={drawer.open} />
        ))}
      </div>
    </section>
  );
}

/* ── body ─────────────────────────────────────────────────────────────── */

function DrawerBody({ ad }: { ad: Ad }) {
  const lastVisitAt = useLastVisitAt();
  const prefs = useUserPrefs();
  const [searchParams] = useSearchParams();
  const scope = readScopeFromParams(searchParams);

  // The Winner engagement mark compares against the ads in the user's current scope.
  const scoped = useMemo(
    () => adsInScope(getAds(), scope, { now: MODULE_NOW, prefs }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scope.industry, scope.category, scope.period, scope.myPrefsOnly, prefs],
  );
  const winner = isWinner(ad);
  const standout = winner && isEngagementStandout(ad, scoped);
  const domain = (ad.domainAdvertiserId ? getAdvertiser(ad.domainAdvertiserId)?.name : null) ?? (ad.landingPageId ? getLandingPage(ad.landingPageId)?.domain : null) ?? null;

  return (
    <div className="px-4 py-4 sm:px-6">
      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-[minmax(280px,36%)_minmax(0,1fr)]">
        <div className="md:sticky md:top-0 md:self-start">
          <AdCreativePanel ad={ad} domain={domain} />
        </div>

        <div className="min-w-0 space-y-3">
          <AdMetaPanel ad={ad} />
          <AdChipsRow ad={ad} isNewAd={isNew(ad, lastVisitAt)} winner={winner} engagementStandout={standout} />
          <AdMetricsSection ad={ad} />
          <AdStatsGrid ad={ad} />
          <AiScorePanel score={ad.aiScore} />
          <CreativeBreakdown ad={ad} />
          <LandingPanel ad={ad} />
          <KeywordsPlatforms ad={ad} />
          <DemographicsSection ad={ad} />
          <LocationSection ad={ad} />
          <DomainsLanguage ad={ad} />
        </div>
      </div>

      <div className="mt-6">
        <SimilarAds ad={ad} />
      </div>
    </div>
  );
}

/* ── shell ────────────────────────────────────────────────────────────── */

export function AdDrawer({ adId, onClose }: { adId: string; onClose: () => void }) {
  const ad = getAd(adId);
  const { stack } = useDetailStack();

  // Overlays opened FROM the drawer sit on top of the stack height it mounted with.
  const coveredRef = useRef(false);
  const baseline = useRef(stack.length);
  useEffect(() => {
    if (stack.length < baseline.current) baseline.current = stack.length;
  }, [stack.length]);
  const covered = stack.length > baseline.current;
  coveredRef.current = covered;

  // Keep scroll across the step-aside; reset when a similar ad swaps in.
  const scrollTop = useRef(0);
  const scroller = useRef<HTMLDivElement | null>(null);
  const content = useRef<HTMLDivElement | null>(null);

  // Remember what opened the drawer so closing it hands focus back (keyboard access).
  const opener = useRef<{ el: HTMLElement | null; label: string | null } | null>(null);
  if (opener.current === null) {
    const el = typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null;
    opener.current = { el: el && el !== document.body ? el : null, label: el?.getAttribute?.("aria-label") ?? null };
  }
  const setScroller = useCallback((node: HTMLDivElement | null) => {
    scroller.current = node;
    if (node) node.scrollTop = scrollTop.current;
  }, []);
  useEffect(() => {
    scrollTop.current = 0;
    if (scroller.current) scroller.current.scrollTop = 0;
  }, [adId]);

  return (
    <DialogPrimitive.Root open={!covered} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          ref={content}
          // Focus the panel itself, not the first control: otherwise that control's tooltip
          // opens on arrival and the first Esc only closes the tooltip.
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            content.current?.focus();
          }}
          // Closing for real returns focus to the opener (the card or row). Stepping aside for
          // a drill-down overlay must not: that overlay owns focus now.
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            if (coveredRef.current) return;
            const { el, label } = opener.current ?? { el: null, label: null };
            const target =
              el && el.isConnected
                ? el
                : label
                  ? (Array.from(document.querySelectorAll<HTMLElement>("[aria-label]")).find((n) => n.getAttribute("aria-label") === label) ?? null)
                  : null;
            target?.focus();
          }}
          // Standing rule: drawers never dismiss on outside click. X or Esc only.
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[1280px] flex-col border-l border-border bg-background shadow-2xl outline-none duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:w-[calc(100vw-48px)]"
        >
          <header className="flex shrink-0 items-center gap-2 border-b border-border bg-background px-4 py-3 sm:px-6">
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="truncate text-sm font-semibold text-foreground">
                {ad?.headline ?? "Ad"}
              </DialogPrimitive.Title>
              <p className="truncate font-mono text-[11px] leading-4 text-muted-foreground">
                Ad ID {ad?.externalId ?? adId}
              </p>
            </div>
            {ad && (
              <Hint content="Copy ad ID">
                <button
                  type="button"
                  onClick={() => void copyText(ad.externalId, "Ad ID copied")}
                  aria-label="Copy ad ID"
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Copy className="h-4 w-4" aria-hidden="true" />
                </button>
              </Hint>
            )}
            <DialogPrimitive.Close
              aria-label="Close"
              className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </DialogPrimitive.Close>
          </header>

          <div
            ref={setScroller}
            onScroll={(e) => {
              scrollTop.current = e.currentTarget.scrollTop;
            }}
            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-muted/30"
          >
            {ad ? (
              <DrawerBody key={ad.id} ad={ad} />
            ) : (
              <div className="p-6">
                <EmptyState
                  title="This ad isn't available"
                  body="It may have been removed from the data set, or the link is wrong. Close this drawer to go back."
                  action={
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Close
                    </button>
                  }
                />
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
