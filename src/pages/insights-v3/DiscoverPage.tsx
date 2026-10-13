/**
 * Industry Insights V2 · Discover (agent A).
 * The market view: everything in the scope bar, narrowed through tags, with an
 * optional "My preferences only" switch (off by default).
 */
import { getAds } from "@/lib/insights-v3/data";
import { InsightsSearch } from "@/components/insights-v3/search/InsightsSearch";
import { InsightsOverlayHost } from "@/components/insights-v3/InsightsOverlayHost";
import { AdsMarketView } from "@/components/insights-v3/discover/AdsMarketView";

const ALL_ADS = getAds();

export default function DiscoverPage() {
  return (
    <>
      <AdsMarketView
        title="Discover"
        pageKey="discover"
        sourceAds={ALL_ADS}
        summaryKind="scope"
        showPrefsToggle
        headerActions={<InsightsSearch />}
      />
      <InsightsOverlayHost />
    </>
  );
}
