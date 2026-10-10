/**
 * Sorts for every list (spec tables). Stable: ties break by id ascending.
 * No likes / comments / shares sort anywhere.
 */
import type { Ad, AdSort, AdvertiserSort, ElementSort, LandingPageSort } from "../types";
import { byKeys, toMs } from "./context";
import type { AdvertiserRow, ElementRow, LandingPageRow } from "./rows";
import { risingRank } from "./trends";

const NULL_LAST = -1e15;

export function sortAds(ads: Ad[], sort: AdSort): Ad[] {
  const first = (a: Ad) => toMs(a.firstSeenAt) ?? 0;
  const cmp: Record<AdSort, (a: Ad, b: Ad) => number> = {
    newest: byKeys<Ad>(first),
    oldest: byKeys<Ad>((a) => -first(a)),
    "longest-running": byKeys<Ad>((a) => a.daysLive ?? NULL_LAST),
    "most-cloned": byKeys<Ad>((a) => a.clones),
    "ai-score": byKeys<Ad>((a) => a.aiScore.total),
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
