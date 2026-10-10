/**
 * Industry Insights V2 · My Feeds (agent A).
 * The Discover layout as-is over a narrower source: competitors the user marked,
 * pages they follow and industries they follow. No "My preferences only" switch.
 */
import { Link } from "react-router-dom";
import { hasAnyPrefs } from "@/lib/insights-v3/selectors";
import { useMyFeedsAds, useUserPrefs } from "@/lib/insights-v3/stores";
import { INSIGHTS_ROUTES } from "@/lib/insights-v3/types";
import { InsightsOverlayHost } from "@/components/insights-v3/InsightsOverlayHost";
import { AdsMarketView } from "@/components/insights-v3/discover/AdsMarketView";
import { MyFeedsIdentity } from "@/components/insights-v3/discover/MyFeedsIdentity";
import { EmptyState } from "@/components/insights-v3/shared";

function NothingFollowed() {
  return (
    <EmptyState
      title="Nothing feeds My Feeds yet"
      body={
        <>
          My Feeds shows ads from three sources: competitors you mark (domains and pages), pages you follow and industries you follow. Pick
          any of them on the Advertiser page and their ads land here.
        </>
      }
      action={
        <Link
          to={INSIGHTS_ROUTES.advertiser}
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Mark competitors or follow pages
        </Link>
      }
    />
  );
}

export default function MyFeedsPage() {
  const prefs = useUserPrefs();
  const feedAds = useMyFeedsAds();
  return (
    <>
      <AdsMarketView
        title="My Feeds"
        pageKey="my-feeds"
        sourceAds={feedAds}
        summaryKind="my-feeds"
        sourceEmpty={!hasAnyPrefs(prefs)}
        emptyState={<NothingFollowed />}
        headerSlot={<MyFeedsIdentity prefs={prefs} />}
      />
      <InsightsOverlayHost />
    </>
  );
}
