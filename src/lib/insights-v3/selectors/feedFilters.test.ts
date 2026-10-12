import { describe, expect, it } from "vitest";
import {
  EMPTY_FEED_FILTERS,
  NO_DOMAIN,
  applyFeedFilters,
  countFeedFilters,
  daysBucket,
  feedFilterOptions,
  readFeedFilters,
  similarBucket,
  sortAds,
} from "./index";
import { U, makeAd } from "./fixtures.test-util";

describe("My Feeds toolbar filters", () => {
  it("reads from the URL, drops unknown bucket ids and de-duplicates", () => {
    const f = readFeedFilters(new URLSearchParams("fstatus=active,bogus,active&fdays=lt7,nope&fsimilar=10plus&fpage=p1,p2&fdomain=none"));
    expect(f).toEqual({ domains: ["none"], pages: ["p1", "p2"], status: ["active"], days: ["lt7"], similar: ["10plus"] });
    expect(countFeedFilters(f)).toBe(5);
    expect(countFeedFilters(readFeedFilters(new URLSearchParams("fstatus=bogus")))).toBe(0);
  });

  it("buckets running days and similar ads on their boundaries", () => {
    const days = (d: number | null) => daysBucket(makeAd({ daysLive: d }));
    expect([days(null), days(0), days(6), days(7), days(29), days(30), days(89), days(90), days(900)]).toEqual([
      "unknown", "lt7", "lt7", "7-29", "7-29", "30-89", "30-89", "90plus", "90plus",
    ]);
    const sim = (c: number) => similarBucket(makeAd({ clones: c }));
    expect([sim(0), sim(1), sim(2), sim(3), sim(5), sim(6), sim(9), sim(10), sim(40)]).toEqual([
      "0", "1-2", "1-2", "3-5", "3-5", "6-9", "6-9", "10plus", "10plus",
    ]);
  });

  it("returns the SAME array when nothing is active (keeps memos stable)", () => {
    expect(applyFeedFilters(U.ads, EMPTY_FEED_FILTERS)).toBe(U.ads);
  });

  it("any-of within one filter, all-of across filters", () => {
    const live = U.ads.filter((a) => a.status === "active");
    const either = applyFeedFilters(U.ads, { ...EMPTY_FEED_FILTERS, days: ["lt7", "90plus"] });
    expect(either.length).toBeGreaterThan(0);
    expect(either.every((a) => ["lt7", "90plus"].includes(daysBucket(a)))).toBe(true);
    const both = applyFeedFilters(U.ads, { ...EMPTY_FEED_FILTERS, days: ["lt7", "90plus"], status: ["active"] });
    expect(both.length).toBeLessThan(either.length);
    expect(both.every((a) => a.status === "active" && ["lt7", "90plus"].includes(daysBucket(a)))).toBe(true);
    expect(applyFeedFilters(U.ads, { ...EMPTY_FEED_FILTERS, status: ["active"] })).toHaveLength(live.length);
  });

  it("domain filter understands 'no landing domain'", () => {
    const none = applyFeedFilters(U.ads, { ...EMPTY_FEED_FILTERS, domains: [NO_DOMAIN] });
    expect(none.length).toBe(U.ads.filter((a) => !a.domainAdvertiserId).length);
    expect(none.every((a) => !a.domainAdvertiserId)).toBe(true);
  });

  it("option counts add up to the ads, with the empty buckets kept (disabled in the UI, never removed)", () => {
    const o = feedFilterOptions(U.ads);
    const sum = (xs: { count: number }[]) => xs.reduce((n, x) => n + x.count, 0);
    for (const key of ["domains", "pages", "status", "days", "similar"] as const) expect(sum(o[key])).toBe(U.ads.length);
    expect(o.days.map((d) => d.id)).toEqual(["lt7", "7-29", "30-89", "90plus", "unknown"]);
    const counts = o.pages.map((p) => p.count);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
    expect(o.domains.some((d) => d.id === NO_DOMAIN && d.label === "No landing domain")).toBe(U.ads.some((a) => !a.domainAdvertiserId));
  });
});

describe("engagement sorts (My Feeds only)", () => {
  const eng = (id: string, likes: number | null, comments: number | null = null, shares: number | null = null) =>
    makeAd({ id, engagement: { likes, comments, shares } });

  it("ranks reported ads first and lists ads without the metric last, never hiding them", () => {
    const ads = [eng("a", null), eng("b", 5), eng("c", 900), eng("d", 0), eng("e", null, 3)];
    expect(sortAds(ads, "most-liked").map((a) => a.id)).toEqual(["c", "b", "d", "a", "e"]);
    expect(sortAds(ads, "most-liked")).toHaveLength(ads.length);
  });

  it("a reported zero beats 'not reported'; ties fall back to id", () => {
    const ads = [eng("z", null, null, null), eng("y", null, 0), eng("x", null, 7), eng("w", null, 7)];
    expect(sortAds(ads, "most-commented").map((a) => a.id)).toEqual(["w", "x", "y", "z"]);
  });

  it("most-shared ranks on shares only", () => {
    const ads = [eng("a", 1000, 1000, 1), eng("b", 1, 1, 50), eng("c", null, null, null)];
    expect(sortAds(ads, "most-shared").map((a) => a.id)).toEqual(["b", "a", "c"]);
  });
});
