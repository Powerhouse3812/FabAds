/**
 * User preferences (follows + competitor marks) as one `UserPrefs`, plus the
 * My Feeds source: ads from competitor-marked pages/domains, followed pages
 * and followed industries.
 */
import { useSyncExternalStore } from "react";
import type { Ad } from "../types";
import { INDEX } from "../data";
import { adsForPrefs } from "../selectors";
import type { UserPrefs } from "../selectors";
import { competitorsStore } from "./competitors";
import { followsStore } from "./follows";
import type { CompetitorsState, FollowsState } from "./seed";
import { memoOn } from "./storage";

const toPrefs = memoOn(
  (f: FollowsState, c: CompetitorsState): UserPrefs => ({
    followedPageIds: f.pages,
    followedIndustryIds: f.industries,
    competitorPageIds: c.pages,
    competitorDomainIds: c.domains,
  }),
);

export function getUserPrefs(): UserPrefs {
  return toPrefs(followsStore.get(), competitorsStore.get());
}

function subscribeBoth(listener: () => void) {
  const a = followsStore.subscribe(listener);
  const b = competitorsStore.subscribe(listener);
  return () => {
    a();
    b();
  };
}

export function useUserPrefs(): UserPrefs {
  return useSyncExternalStore(subscribeBoth, getUserPrefs, getUserPrefs);
}

const feedsOf = memoOn((prefs: UserPrefs, ads: Ad[]) => adsForPrefs(ads, prefs));

/** My Feeds source ads (before scope). Empty when nothing is followed or marked. */
export function myFeedsAds(prefs: UserPrefs = getUserPrefs(), ads: Ad[] = INDEX.ads): Ad[] {
  return feedsOf(prefs, ads);
}

export function useMyFeedsAds(): Ad[] {
  const get = () => myFeedsAds();
  return useSyncExternalStore(subscribeBoth, get, get);
}
