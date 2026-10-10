/**
 * Advertiser detail overlay (Domain or Page). One scrolling view instead of
 * the live app's Analysis / Ads tabs, plus frameworks and concepts:
 *   1 AI summary + KPIs · 2 Launch activity · 3 How they hook ·
 *   4 Winning + longest running ads · 5 Landing pages (+ connected pages/domains).
 * Follows the scope bar; every block says how many ads it is built on.
 */
import { useMemo } from "react";
import { ALL, type AdvertiserKind } from "@/lib/insights-v3/types";
import { advertiserDetail, buildDownloads } from "@/lib/insights-v3/selectors";
import { MODULE_NOW } from "@/lib/insights-v3/data";
import { useBoardCountForItem } from "@/lib/insights-v3/stores";
import {
  DetailOverlay,
  DisabledSection,
  ElementActions,
  NewBadge,
  OverlaySection,
  TrendBars,
  TruncatedText,
  useAdDrawer,
} from "../shared";
import { FollowButton, MarkCompetitorButton } from "../advertiser/ActionButtons";
import { joinTop } from "../advertiser/helpers";
import { AdvertiserAvatar, MixBars, MixChip, MixGroup, OverlayEmpty } from "../advertiser/parts";
import { AdStripSection, LandingPageList, SubGrid, SummaryAndKpis } from "../advertiser/overlayParts";
import { useAdvertiserCtx } from "../advertiser/useAdvertiserCtx";
import type { OverlayNav } from "./overlayNav";

export function AdvertiserDetail({ kind, id, nav }: { kind: AdvertiserKind; id: string; nav: OverlayNav }) {
  const { scope, setScope, ctx, baseAds } = useAdvertiserCtx();
  const drawer = useAdDrawer();
  const typeLabel = kind === "page" ? "Page" : "Domain";
  const detail = useMemo(() => advertiserDetail(kind, id, baseAds, scope, ctx), [kind, id, baseAds, scope, ctx]);
  const savedCount = useBoardCountForItem({ type: kind, id });
  const frame = { open: nav.open, backLabel: nav.backLabel, onBack: nav.onBack, onClose: nav.onClose, typeLabel };

  if (!detail) {
    return (
      <DetailOverlay {...frame} title={id} subtitle="Not in the current scope">
        <OverlayEmpty
          title="This advertiser isn't in the current scope"
          body="It may not exist, or none of its ads fall inside the industry, category and period you picked."
          onClose={nav.onClose}
        />
      </DetailOverlay>
    );
  }

  const adv = detail.advertiser;
  const subtitleText = [joinTop(detail.industries.items, 2), joinTop(detail.categories.items, 2)].filter(Boolean).join(" · ");
  const subtitle = (
    <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      {detail.isNew && <NewBadge />}
      {detail.isScaling && (
        <span className="rounded-full border border-success-text/30 bg-success-text/10 px-2 py-0.5 text-[11px] font-medium text-success-text">Scaling</span>
      )}
      {detail.isRising && !detail.isScaling && (
        <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary-text">Rising</span>
      )}
      {subtitleText ? <TruncatedText text={subtitleText} className="max-w-[520px]" /> : <span className="italic">No industry data in this scope</span>}
    </span>
  );

  const header = {
    ...frame,
    title: adv.name,
    subtitle,
    avatar: <AdvertiserAvatar name={adv.name} url={adv.avatarUrl} className="h-12 w-12" />,
    actions: (
      <>
        <MarkCompetitorButton kind={kind} id={id} name={adv.name} />
        {kind === "page" && <FollowButton id={id} name={adv.name} />}
        <ElementActions
          target={{ type: kind, id }}
          savedCount={savedCount}
          buildDownload={() => buildDownloads({ type: kind, id }, { scope, now: MODULE_NOW })}
        />
      </>
    ),
  };

  // Advertiser exists but none of its ads are inside the scope.
  if (detail.basedOn === 0) {
    const narrowed = scope.industry !== ALL || scope.category !== ALL || scope.period !== "all";
    return (
      <DetailOverlay {...header}>
        <OverlayEmpty
          title="No ads from this advertiser in the current scope"
          body="Its ads fall outside the industry, category or period you picked. Widen the scope to see its analysis."
          onClose={nav.onClose}
          extra={
            narrowed ? (
              <button
                type="button"
                onClick={() => setScope({ industry: ALL, category: ALL, period: "all" })}
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Reset scope to all
              </button>
            ) : undefined
          }
        />
      </DetailOverlay>
    );
  }

  const noun = kind === "page" ? "page" : "domain";
  const lp = detail.landingPages;
  const relatedType = kind === "page" ? "domain" : "page";

  return (
    <DetailOverlay {...header}>
      {/* 1 · AI summary + KPIs */}
      <SummaryAndKpis summary={detail.summary} kpis={detail.kpis} basedOn={detail.basedOn} />

      {/* 2 · Launch activity */}
      <TrendBars
        className="h-auto"
        series={detail.launchActivity}
        title="Launch activity"
        basedOn={detail.launchActivity.basedOn}
        emptyReason={`This ${noun} launched no ads in the picked period, so there is nothing to chart.`}
      />

      {/* 3 · How they hook */}
      <OverlaySection title="How they hook" basedOn={detail.basedOn}>
        <div className="space-y-3">
          <SubGrid>
            <MixGroup title="Hooks" type="hook" mix={detail.hooks} emptyReason="No hook style could be identified in this advertiser's ads." note="Hook styles, by how many ads use them." />
            <MixGroup title="Angles" type="angle" mix={detail.angles} emptyReason="No angle could be identified in this advertiser's ads." />
            <MixGroup title="Frameworks" type="framework" mix={detail.frameworks} emptyReason="No framework could be identified in this advertiser's ads." />
            <MixGroup title="Concepts" type="concept" mix={detail.concepts} emptyReason="No concept could be identified in this advertiser's ads." />
          </SubGrid>
          <p className="text-xs text-muted-foreground">
            Counts show how many ads use each item. They show usage, not performance.
          </p>
          <SubGrid>
            <MixBars
              title="CTA mix"
              unit="share of ads with a CTA button"
              mix={detail.ctas}
              emptyReason="None of this advertiser's ads has a CTA button label."
            />
            <MixGroup
              title="Keywords"
              type={null}
              interactive={false}
              mix={detail.keywords}
              emptyReason="No keywords could be extracted from this advertiser's ads."
            />
          </SubGrid>
          {detail.hookLines.items.length > 0 && (
            <div className="rounded-lg border border-border bg-background/60 p-3">
              <h4 className="text-xs font-semibold text-foreground">Opening lines</h4>
              <ul className="mt-2 space-y-1.5">
                {detail.hookLines.items.slice(0, 4).map((q) => (
                  <li key={q.adId}>
                    <button
                      type="button"
                      onClick={() => drawer.open(q.adId)}
                      className="w-full rounded-md border-l-2 border-primary bg-primary/5 px-2.5 py-1.5 text-left text-xs italic text-foreground hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <TruncatedText text={`“${q.text}”`} lines={2} focusable={false} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </OverlaySection>

      {/* 4 · Winning + longest running ads */}
      <AdStripSection
        title="Winning ads"
        adIds={detail.winners.adIds}
        basedOn={detail.winners.basedOn}
        emptyReason="No ad from this advertiser passes the Winner rule yet (seen live, 14+ days running, 2+ clones)."
      />
      <AdStripSection
        title="Longest running ads"
        adIds={detail.longestRunning.adIds}
        basedOn={detail.longestRunning.basedOn}
        emptyReason="No ad here has a known start date, so run length can't be shown."
      />

      {/* 5 · Landing pages */}
      <OverlaySection
        title="Landing pages: where the traffic goes"
        basedOn={lp.basedOn}
        disabledReason={lp.rows.length === 0 ? "None of this advertiser's ads in this scope send to a landing page we captured." : undefined}
        minHeight={120}
      >
        <LandingPageList rows={lp.rows} />
      </OverlaySection>

      {detail.related.items.length > 0 ? (
        <OverlaySection
          title={kind === "page" ? "Domains these ads send to" : "Pages running ads to this domain"}
          basedOn={detail.related.basedOn}
        >
          <ul className="flex flex-wrap gap-1.5">
            {detail.related.items.slice(0, 12).map((it) => (
              <li key={it.id} className="max-w-full">
                <MixChip type={relatedType} item={it} />
              </li>
            ))}
          </ul>
        </OverlaySection>
      ) : (
        <DisabledSection
          title={kind === "page" ? "Domains these ads send to" : "Pages running ads to this domain"}
          reason={kind === "page" ? "None of this page's ads in scope have a landing-page domain." : "No page runs ads to this domain in this scope."}
          minHeight={96}
        />
      )}
    </DetailOverlay>
  );
}
