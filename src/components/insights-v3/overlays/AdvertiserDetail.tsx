/**
 * Competitor detail overlay (Domain or Page). Tabbed, because the full listing is long:
 *   Overview (summary, KPIs, industries + categories, launch line, suggested actions) ·
 *   Creative elements (what they run most) · Offers · Landing pages (merged with the
 *   pages / domains behind them) · Ads (sortable, longest running first).
 * Each tab is its own file under advertiser/detailTabs. Follows the scope bar; every block says how many ads it is built on.
 */
import { useEffect, useMemo, useState } from "react";
import { ALL, type AdvertiserKind } from "@/lib/insights-v3/types";
import { adsInScope, advertiserDetail, buildDownloads } from "@/lib/insights-v3/selectors";
import { MODULE_NOW } from "@/lib/insights-v3/data";
import { useBoardCountForItem } from "@/lib/insights-v3/stores";
import { DetailOverlay, ElementActions, NewBadge, PageTabs, TruncatedText } from "../shared";
import { FollowButton, MarkCompetitorButton } from "../advertiser/ActionButtons";
import { joinTop } from "../advertiser/helpers";
import { AdvertiserAvatar, OverlayEmpty } from "../advertiser/parts";
import type { DetailTabProps } from "../advertiser/detailTabs/types";
import { OverviewTab } from "../advertiser/detailTabs/OverviewTab";
import { CreativeTab } from "../advertiser/detailTabs/CreativeTab";
import { OffersTab } from "../advertiser/detailTabs/OffersTab";
import { LandingPagesTab } from "../advertiser/detailTabs/LandingPagesTab";
import { AdsTab } from "../advertiser/detailTabs/AdsTab";
import { useAdvertiserCtx } from "../advertiser/useAdvertiserCtx";
import type { OverlayNav } from "./overlayNav";

type DetailTab = "overview" | "creative" | "offers" | "landing" | "ads";
const TAB_LABEL: Record<DetailTab, string> = {
  overview: "Overview",
  creative: "Creative elements",
  offers: "Offers",
  landing: "Landing pages",
  ads: "Ads",
};

export function AdvertiserDetail({ kind, id, nav }: { kind: AdvertiserKind; id: string; nav: OverlayNav }) {
  const { scope, setScope, ctx, baseAds } = useAdvertiserCtx();
  const [tab, setTab] = useState<DetailTab>("overview");
  // A different competitor opened in the same overlay starts on Overview.
  useEffect(() => setTab("overview"), [kind, id]);
  const typeLabel = kind === "page" ? "Page" : "Domain";
  const detail = useMemo(() => advertiserDetail(kind, id, baseAds, scope, ctx), [kind, id, baseAds, scope, ctx]);
  const ownAds = useMemo(
    () => adsInScope(baseAds, scope, ctx).filter((a) => (kind === "page" ? a.pageAdvertiserId === id : a.domainAdvertiserId === id)),
    [baseAds, scope, ctx, kind, id],
  );
  const savedCount = useBoardCountForItem({ type: kind, id });
  const frame = { open: nav.open, backLabel: nav.backLabel, onBack: nav.onBack, onClose: nav.onClose, typeLabel };

  if (!detail) {
    return (
      <DetailOverlay {...frame} title={id} subtitle="Not in the current scope">
        <OverlayEmpty
          title="This competitor isn't in the current scope"
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
          title="No ads from this competitor in the current scope"
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

  const ads = ownAds;
  const offerCount = new Set(detail.landingPages.rows.map((r) => r.offerDomain).filter(Boolean)).size;
  const creativeCount = detail.hooks.items.length + detail.angles.items.length + detail.frameworks.items.length + detail.concepts.items.length;
  const tabProps: DetailTabProps = { kind, id, detail, ads, baseAds, scope, ctx };

  return (
    <DetailOverlay {...header}>
      <PageTabs<DetailTab>
        aria-label={`${typeLabel} sections`}
        value={tab}
        onChange={setTab}
        tabs={[
          { key: "overview", label: "Overview" },
          { key: "creative", label: "Creative elements", count: creativeCount },
          { key: "offers", label: "Offers", count: offerCount },
          { key: "landing", label: "Landing pages", count: detail.landingPages.rows.length },
          { key: "ads", label: "Ads", count: ads.length },
        ]}
      />
      <div role="tabpanel" aria-label={TAB_LABEL[tab]} className="space-y-3 pt-3">
        {tab === "overview" && <OverviewTab {...tabProps} />}
        {tab === "creative" && <CreativeTab {...tabProps} />}
        {tab === "offers" && <OffersTab {...tabProps} />}
        {tab === "landing" && <LandingPagesTab {...tabProps} />}
        {tab === "ads" && <AdsTab {...tabProps} />}
      </div>
    </DetailOverlay>
  );
}
