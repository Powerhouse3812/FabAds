/**
 * Element detail overlay (Framework · Hook · Angle · Concept) — agent C.
 * Contract: ElementDetail({ elementType, id, nav: OverlayNav }).
 *
 * This is the end of the "Element first" flow: open an element tab → click a
 * row → here → Use in Genie, or Save to a board.
 *
 * Sections, in spec order, each with its "Based on X ads" note:
 *  1. AI summary + KPIs
 *  2. Where it works (categories, industries, advertisers) — all four types (decision 9)
 *  3. Works well with (other element types that co-occur, with lift)
 *  4. Top ads + examples (+ verbatim hook lines for hooks, beats for frameworks)
 * Follows the scope bar from the URL. A section with no data is disabled with a
 * reason, never removed.
 */
import { useMemo } from "react";
import type { Ad, ElementType, Scope } from "@/lib/insights-v3/types";
import { ELEMENT_TYPE_LABEL, MODULE_NOW, getAd, getAds } from "@/lib/insights-v3/data";
import { adsInBaseScope, buildDownloads, elementDetail } from "@/lib/insights-v3/selectors";
import { useBoardCountForItem, useLastVisitAt, useUserPrefs } from "@/lib/insights-v3/stores";
import {
  AiSummaryBlock,
  DetailOverlay,
  DownloadButton,
  ElementChip,
  EmptyState,
  KpiRow,
  OverlaySection,
  SaveButton,
  TrendBars,
  useInsightsScope,
} from "@/components/insights-v3/shared";
import { UseInGenie } from "@/components/insights-v3/genie/UseInGenie";
import { ELEMENT_NOUN_SINGULAR } from "@/components/insights-v3/elements/constants";
import { MixList } from "@/components/insights-v3/elements/detail/MixList";
import { WorksWellWith } from "@/components/insights-v3/elements/detail/WorksWellWith";
import { FrameworkBeats, HookLines, TopAdsGrid } from "@/components/insights-v3/elements/detail/TopAdsAndExamples";
import type { OverlayNav } from "./overlayNav";

export function ElementDetail({ elementType, id, nav }: { elementType: ElementType; id: string; nav: OverlayNav }) {
  const [scope] = useInsightsScope();
  const prefs = useUserPrefs();
  const lastVisitAt = useLastVisitAt();
  const ref = { type: elementType, id };
  const savedCount = useBoardCountForItem(ref);

  const { industry, category, period, myPrefsOnly } = scope;
  const detail = useMemo(() => {
    const sc: Scope = { industry, category, period, myPrefsOnly };
    const ctx = { now: MODULE_NOW, lastVisitAt, prefs };
    return elementDetail(elementType, id, adsInBaseScope(getAds(), sc, ctx), sc, ctx);
  }, [elementType, id, industry, category, period, myPrefsOnly, lastVisitAt, prefs]);

  const typeLabel = ELEMENT_TYPE_LABEL[elementType];
  const what = ELEMENT_NOUN_SINGULAR[elementType];

  if (!detail) {
    return (
      <DetailOverlay open={nav.open} backLabel={nav.backLabel} onBack={nav.onBack} onClose={nav.onClose} title={`Unknown ${what}`} typeLabel={typeLabel}>
        <EmptyState
          title={`We couldn't find this ${what}`}
          body="The link may be out of date, or this item is no longer in the data. Close this and pick one from the list."
          action={
            <button
              type="button"
              onClick={nav.onClose}
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Close
            </button>
          }
        />
      </DetailOverlay>
    );
  }

  const d = detail;
  const none = d.basedOn === 0;
  const noAds = `No ad in this scope uses this ${what}. Widen the scope bar to see where it runs.`;
  const topAds = d.topAds.adIds.map((aid) => getAd(aid)).filter((a): a is Ad => !!a);

  return (
    <DetailOverlay
      open={nav.open}
      backLabel={nav.backLabel}
      onBack={nav.onBack}
      onClose={nav.onClose}
      title={d.element.label}
      typeLabel={typeLabel}
      subtitle={d.element.description}
      actions={
        <>
          <UseInGenie
            target={ref}
            variant="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-primary bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
          />
          <SaveButton target={ref} variant="button" savedCount={savedCount} className="border-border bg-card text-foreground hover:bg-primary/5" />
          <DownloadButton
            variant="button"
            label="Download"
            build={() => buildDownloads(ref, { scope: { industry, category, period, myPrefsOnly }, now: MODULE_NOW })}
          />
        </>
      }
    >
      {/* 1 · AI summary + KPIs */}
      <OverlaySection title="Summary" basedOn={d.basedOn}>
        <div className="space-y-3">
          {none ? (
            <AiSummaryBlock summary={d.summary} disabledReason={noAds} />
          ) : (
            <AiSummaryBlock summary={d.summary} title="AI summary" />
          )}
          {(d.isRising || d.isScaling) && (
            <div className="flex flex-wrap items-center gap-2">
              {d.isRising && (
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary-text">Rising</span>
              )}
              {d.isScaling && (
                <span className="rounded-full border border-success-text/30 bg-success-text/10 px-2 py-0.5 text-[11px] font-medium text-success-text">
                  Scaling
                </span>
              )}
            </div>
          )}
          <KpiRow kpis={d.kpis} aria-label={`${d.element.label} key metrics`} />
          <TrendBars
            series={d.trend}
            title="Launch activity"
            basedOn={d.trend.basedOn}
            height={120}
            emptyReason={`No ads using this ${what} launched in this scope, so there is nothing to chart.`}
          />
        </div>
      </OverlaySection>

      {/* 2 · Where it works */}
      <OverlaySection title="Where it works" basedOn={d.whereItWorks.categories.basedOn} disabledReason={none ? noAds : undefined} minHeight={140}>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <MixList
            title="Categories"
            unit={`share of ads using this ${what}`}
            items={d.whereItWorks.categories.items}
            basedOn={d.whereItWorks.categories.basedOn}
            emptyText="No category data for these ads."
          />
          <MixList
            title="Industries"
            unit={`share of ads using this ${what}`}
            items={d.whereItWorks.industries.items}
            basedOn={d.whereItWorks.industries.basedOn}
            emptyText="No industry data for these ads."
          />
          <MixList
            title="Competitors"
            unit={`share of ads using this ${what}`}
            items={d.whereItWorks.advertisers.items}
            basedOn={d.whereItWorks.advertisers.basedOn}
            emptyText="No competitor data for these ads."
            renderLabel={(it) => <ElementChip type="page" id={it.id} label={it.label} />}
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Counts show where it runs most often, not where it performs. Check winners before copying a pattern.
        </p>
      </OverlaySection>

      {/* 3 · Works well with */}
      <OverlaySection
        title="Works well with"
        basedOn={d.worksWellWith.basedOn}
        disabledReason={none ? noAds : undefined}
        minHeight={140}
      >
        <WorksWellWith groups={d.worksWellWith.groups} thisType={elementType} />
        <p className="mt-3 text-xs text-muted-foreground">
          Other elements found in the same ads. Lift above 1× means the pair shows up together more than chance would explain; it says nothing about results.
        </p>
      </OverlaySection>

      {/* 4 · Top ads + examples */}
      <OverlaySection
        title="Top ads and examples"
        basedOn={d.topAds.basedOn}
        disabledReason={none || topAds.length === 0 ? noAds : undefined}
        minHeight={180}
      >
        <TopAdsGrid ads={topAds} type={elementType} />
        {elementType === "hook" && <HookLines block={d.exampleHooks} />}
        {elementType === "framework" && <FrameworkBeats block={d.frameworkElements} />}
      </OverlaySection>
    </DetailOverlay>
  );
}
