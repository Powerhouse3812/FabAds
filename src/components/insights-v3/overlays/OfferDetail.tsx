/**
 * Offer detail overlay. Offer = an offer domain that landing pages send to
 * (Q9: offers are elements too, with their own Save + Download).
 *   Offer domain + URL · Landing pages pointing here · Ads + advertisers ·
 *   Creative mix.
 */
import { useMemo } from "react";
import { buildDownloads, offerDetail } from "@/lib/insights-v3/selectors";
import { MODULE_NOW } from "@/lib/insights-v3/data";
import { useBoardCountForItem } from "@/lib/insights-v3/stores";
import { DetailOverlay, ElementActions, OverlaySection, TrendBars, TruncatedText, fmtInt } from "../shared";
import { CopyValue, MixBars, MixGroup, OverlayEmpty } from "../advertiser/parts";
import { AdStripSection, LandingPageList, SubGrid, SummaryAndKpis } from "../advertiser/overlayParts";
import { useAdvertiserCtx } from "../advertiser/useAdvertiserCtx";
import type { OverlayNav } from "./overlayNav";

/** `id` is the offer domain. */
export function OfferDetail({ id, nav }: { id: string; nav: OverlayNav }) {
  const { scope, ctx, baseAds } = useAdvertiserCtx();
  const detail = useMemo(() => offerDetail(id, baseAds, scope, ctx), [id, baseAds, scope, ctx]);
  const savedCount = useBoardCountForItem({ type: "offer", id });
  const frame = { open: nav.open, backLabel: nav.backLabel, onBack: nav.onBack, onClose: nav.onClose, typeLabel: "Offer" };

  if (!detail) {
    return (
      <DetailOverlay {...frame} title={id} subtitle="Not found">
        <OverlayEmpty
          title="This offer isn't in the current scope"
          body="No landing page we traced sends people to this offer domain."
          onClose={nav.onClose}
        />
      </DetailOverlay>
    );
  }

  const noAds = detail.basedOn === 0;
  const lpCount = detail.offer.landingPageIds.length;

  return (
    <DetailOverlay
      {...frame}
      title={detail.offer.domain}
      subtitle={
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span>
            <span className="font-mono tabular-nums">{fmtInt(lpCount)}</span> landing {lpCount === 1 ? "page points" : "pages point"} here
          </span>
          {detail.offer.url && <TruncatedText text={detail.offer.url} className="max-w-[420px] font-mono text-xs" />}
        </span>
      }
      actions={
        <ElementActions
          target={{ type: "offer", id }}
          savedCount={savedCount}
          buildDownload={() => buildDownloads({ type: "offer", id }, { scope, now: MODULE_NOW })}
        />
      }
    >
      <SummaryAndKpis
        summary={detail.summary}
        kpis={detail.kpis}
        basedOn={detail.basedOn}
        title="AI summary"
        disabledReason={noAds ? "No ad in the current scope sends traffic to this offer, so there is nothing to summarise." : undefined}
      />

      <OverlaySection title="Offer">
        <dl className="rounded-lg border border-border bg-background/60 px-3">
          <div className="grid grid-cols-[104px_minmax(0,1fr)] items-center gap-2 border-b border-border py-2">
            <dt className="text-xs text-muted-foreground">Offer domain</dt>
            <dd className="min-w-0">
              <CopyValue value={detail.offer.domain} label="Offer domain" />
            </dd>
          </div>
          <div className="grid grid-cols-[104px_minmax(0,1fr)] items-center gap-2 py-2">
            <dt className="text-xs text-muted-foreground">Offer URL</dt>
            <dd className="min-w-0">
              {detail.offer.url ? (
                <CopyValue value={detail.offer.url} label="Offer URL" />
              ) : (
                <span className="text-xs italic text-muted-foreground">No offer URL was traced</span>
              )}
            </dd>
          </div>
        </dl>
      </OverlaySection>

      <OverlaySection
        title="Landing pages pointing here"
        basedOn={detail.landingPages.basedOn}
        disabledReason={
          detail.landingPages.rows.length === 0 ? "No landing page that sends to this offer has ads in the current scope." : undefined
        }
        minHeight={120}
      >
        <LandingPageList rows={detail.landingPages.rows} showOffer={false} />
      </OverlaySection>

      <AdStripSection
        title="Ads sending traffic to this offer"
        adIds={detail.ads.adIds.slice(0, 12)}
        basedOn={detail.ads.basedOn}
        emptyReason="No ad in the current scope sends traffic to this offer."
      />

      <OverlaySection
        title="Advertisers and funnels"
        basedOn={detail.advertisers.basedOn}
        disabledReason={noAds ? "No advertiser in the current scope sends traffic to this offer." : undefined}
        minHeight={110}
      >
        <div className="space-y-3">
          <SubGrid>
            <MixGroup title="Pages (brands)" type="page" mix={{ basedOn: detail.advertisers.basedOn, items: detail.advertisers.pages.slice(0, 12) }} emptyReason="No page runs ads to it in this scope." />
            <MixGroup title="Domains" type="domain" mix={{ basedOn: detail.advertisers.basedOn, items: detail.advertisers.domains.slice(0, 12) }} emptyReason="None of these ads belong to a known domain." />
          </SubGrid>
          <MixBars title="Funnel types" unit="share of ads whose landing page has a funnel type" mix={detail.funnels} emptyReason="No funnel type could be identified for the pages that send here." />
        </div>
      </OverlaySection>

      <TrendBars
        className="h-auto"
        series={detail.trend}
        title="Ads launched to this offer"
        basedOn={detail.trend.basedOn}
        emptyReason="No ad launched to this offer in the picked period, so there is nothing to chart."
      />

      <OverlaySection
        title="Creative mix: what sends traffic here"
        basedOn={detail.basedOn}
        disabledReason={noAds ? "No ad in the current scope sends traffic to this offer, so there is no creative mix." : undefined}
        minHeight={140}
      >
        <SubGrid>
          <MixGroup title="Hooks" type="hook" mix={detail.creativeMix.hooks} emptyReason="No hook style was identified in these ads." />
          <MixGroup title="Angles" type="angle" mix={detail.creativeMix.angles} emptyReason="No angle was identified in these ads." />
          <MixGroup title="Frameworks" type="framework" mix={detail.creativeMix.frameworks} emptyReason="No framework was identified in these ads." />
          <MixGroup title="Concepts" type="concept" mix={detail.creativeMix.concepts} emptyReason="No concept was identified in these ads." />
        </SubGrid>
      </OverlaySection>
    </DetailOverlay>
  );
}
