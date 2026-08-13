/**
 * Invariant: no dead facet options.
 *
 * Every option offered in a Trends toolbar listbox must return at least one
 * record from the dataset that tab actually renders. A hardcoded option no
 * record can satisfy is a broken control — it looks live, the user picks it,
 * and the tab drops to its zero state with no way to tell "nothing matches"
 * from "this filter is wired to a field the data doesn't have".
 *
 * Precedent for an invariant test over mock data:
 * src/connector/seed.invariants.test.ts.
 */
import { describe, expect, it } from "vitest";
import { TAB_FACETS, matchesFacetForTest } from "@/insights-trends/hooks/useTrendsFilters";
import {
  BREAKING_STORIES,
  META_ADS,
  NEWS_ITEMS,
  OTHER_SOCIAL,
  SEARCH_DEMAND,
  TIKTOK_HOOKS,
} from "@/insights-trends/mocks/trendsData";
import type { TrendItem, TrendsTabKey } from "@/insights-trends/types";

const DATASET: Record<TrendsTabKey, TrendItem[]> = {
  overview: [
    ...BREAKING_STORIES,
    ...NEWS_ITEMS,
    ...META_ADS,
    ...TIKTOK_HOOKS,
    ...SEARCH_DEMAND,
    ...OTHER_SOCIAL,
  ],
  news: NEWS_ITEMS,
  social: [...META_ADS, ...TIKTOK_HOOKS, ...OTHER_SOCIAL],
  search: SEARCH_DEMAND,
};

const TABS: TrendsTabKey[] = ["overview", "news", "social", "search"];

describe("Trends facets", () => {
  it.each(TABS)("every %s option matches at least one record", (tab) => {
    const items = DATASET[tab];
    (["a", "b"] as const).forEach((slot) => {
      const facet = TAB_FACETS[tab][slot];
      expect(facet.options.length, `${tab}.${slot} has no options`).toBeGreaterThan(0);
      facet.options.forEach((option) => {
        const hits = items.filter((item) => matchesFacetForTest(tab, slot, item, option));
        expect(hits.length, `${tab}.${slot} option "${option}" matches nothing`).toBeGreaterThan(0);
      });
    });
  });

  it.each(TABS)("every rendered %s facet genuinely narrows the set", (tab) => {
    const items = DATASET[tab];
    (["a", "b"] as const).forEach((slot) => {
      const facet = TAB_FACETS[tab][slot];
      // TrendsToolbar only renders a facet control when it has more than one
      // option. Any facet that IS rendered must be able to exclude something —
      // a control whose every option returns the whole set is decorative, not
      // a filter. (Single-option facets are suppressed in the toolbar and
      // surface as stated context inside the tab instead.)
      if (facet.options.length < 2) return;
      const narrows = facet.options.some(
        (option) => items.filter((item) => matchesFacetForTest(tab, slot, item, option)).length < items.length,
      );
      expect(narrows, `${tab}.${slot} is rendered but never narrows`).toBe(true);
    });
  });
});
