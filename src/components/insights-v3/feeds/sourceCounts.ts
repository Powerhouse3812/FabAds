import type { UserPrefs } from "@/lib/insights-v3/selectors";

/** Same counting as the old identity row: competitors are marked pages + marked domains. */
export function sourceCounts(prefs: UserPrefs) {
  return {
    competitors: prefs.competitorPageIds.length + prefs.competitorDomainIds.length,
    pages: prefs.followedPageIds.length,
    industries: prefs.followedIndustryIds.length,
  };
}
