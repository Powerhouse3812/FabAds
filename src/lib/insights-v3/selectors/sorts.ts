/**
 * Sorts for every list (spec tables). Stable: ties break by id ascending.
 * Likes / comments / shares sorts exist ONLY for My Feeds (FeedAdSort); ads without the metric go last.
 */
import type { Ad, AdvertiserSort, ElementSort, FeedAdSort, LandingPageSort } from "../types";
import { byKeys, toMs } from "./context";
import type { AdvertiserRow, ElementRow, LandingPageRow } from "./rows";
import { risingRank } from "./trends";

const NULL_LAST = -1e15;

export function sortAds(ads: Ad[], sort: FeedAdSort): Ad[] {
  const first = (a: Ad) => toMs(a.firstSeenAt) ?? 0;
  const cmp: Record<FeedAdSort, (a: Ad, b: Ad) => number> = {
    newest: byKeys<Ad>(first),
    oldest: byKeys<Ad>((a) => -first(a)),
    "longest-running": byKeys<Ad>((a) => a.daysLive ?? NULL_LAST),
    "most-cloned": byKeys<Ad>((a) => a.clones),
    "ai-score": byKeys<Ad>((a) => a.aiScore.total),
    // Not every ad reports engagement: a null metric sorts after every reported one (0 is a real, reported value).
    "most-liked": byKeys<Ad>((a) => a.engagement.likes ?? NULL_LAST),
    "most-commented": byKeys<Ad>((a) => a.engagement.comments ?? NULL_LAST),
    "most-shared": byKeys<Ad>((a) => a.engagement.shares ?? NULL_LAST),
  };
  return ads.slice().sort(cmp[sort]);
}

export function sortAdvertiserRows(rows: AdvertiserRow[], sort: AdvertiserSort): AdvertiserRow[] {
  const cmp: Record<AdvertiserSort, (a: AdvertiserRow, b: AdvertiserRow) => number> = {
    "most-ads": byKeys<AdvertiserRow>((r) => r.totalAds),
    "most-active": byKeys<AdvertiserRow>((r) => r.activeAds, (r) => (r.isScaling ? 1 : 0)),
    "most-winners": byKeys<AdvertiserRow>((r) => r.winningAds),
    "longest-run": byKeys<AdvertiserRow>((r) => r.longestRunDays ?? NULL_LAST),
  };
  return rows.slice().sort(cmp[sort]);
}

export function sortLandingPageRows(rows: LandingPageRow[], sort: LandingPageSort): LandingPageRow[] {
  const cmp: Record<LandingPageSort, (a: LandingPageRow, b: LandingPageRow) => number> = {
    "most-ads": byKeys<LandingPageRow>((r) => r.adsTotal),
    "most-active": byKeys<LandingPageRow>((r) => r.adsActive),
    "most-advertisers": byKeys<LandingPageRow>((r) => r.advertiserCount),
    "longest-running": byKeys<LandingPageRow>((r) => r.longestRunDays ?? NULL_LAST),
    "fastest-rising": byKeys<LandingPageRow>(
      (r) => risingRank({ changePct: r.changePct, cur: r.launchesThisPeriod }),
      (r) => r.adsTotal,
    ),
  };
  return rows.slice().sort(cmp[sort]);
}

export function sortElementRows(rows: ElementRow[], sort: ElementSort): ElementRow[] {
  const cmp: Record<ElementSort, (a: ElementRow, b: ElementRow) => number> = {
    "most-used": byKeys<ElementRow>((r) => r.adsUsing),
    "most-winners": byKeys<ElementRow>((r) => r.winningAds),
    "fastest-rising": byKeys<ElementRow>((r) => risingRank({ changePct: r.changePct, cur: r.launchesThisPeriod }), (r) => r.adsUsing),
    "longest-running": byKeys<ElementRow>((r) => r.longestRunDays ?? NULL_LAST),
  };
  return rows.slice().sort(cmp[sort]);
}
