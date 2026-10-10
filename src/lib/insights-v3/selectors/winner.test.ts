import { describe, expect, it } from "vitest";
import { DEFAULT_SCOPE } from "../types";
import { adsInScope, discoverKpis, inPeriod, isEngagementStandout, isNew, isWinner, matchesPrefs } from "./index";
import { D, DAY, NOW, U, iso, makeAd } from "./fixtures.test-util";

describe("Winner rule (active + ≥14 days live + ≥2 clones, never likes)", () => {
  const base = makeAd({ status: "active", daysLive: 30, clones: 5, engagement: { likes: null, comments: null, shares: null } });

  it("passes when every gate holds", () => expect(isWinner(base)).toBe(true));
  it("13 days live fails, 14 passes", () => {
    expect(isWinner({ ...base, daysLive: 13 })).toBe(false);
    expect(isWinner({ ...base, daysLive: 14 })).toBe(true);
  });
  it("1 clone fails, 2 passes", () => {
    expect(isWinner({ ...base, clones: 1 })).toBe(false);
    expect(isWinner({ ...base, clones: 2 })).toBe(true);
  });
  it("inactive fails", () => expect(isWinner({ ...base, status: "inactive" })).toBe(false));
  it("unknown start (null daysLive) fails", () => expect(isWinner({ ...base, daysLive: null })).toBe(false));
  it("likes never make a winner", () => {
    expect(isWinner({ ...base, clones: 0, engagement: { likes: 1_000_000, comments: 50_000, shares: 9_000 } })).toBe(false);
  });

  it("engagement mark = winner + reported + top 10% of reported engagement in scope", () => {
    const scoped = Array.from({ length: 20 }, (_, i) =>
      makeAd({ id: `e-${i}`, status: "active", daysLive: 40, clones: 3, engagement: { likes: (i + 1) * 100, comments: 0, shares: 0 } }),
    );
    scoped.push(makeAd({ id: "no-eng", status: "active", daysLive: 40, clones: 3, engagement: { likes: null, comments: null, shares: null } }));
    const marked = scoped.filter((a) => isEngagementStandout(a, scoped)).map((a) => a.id);
    expect(marked).toEqual(["e-18", "e-19"]);
    // a non-winner with huge engagement is not marked
    const loud = makeAd({ id: "loud", status: "inactive", daysLive: 40, clones: 3, engagement: { likes: 99_999, comments: 0, shares: 0 } });
    expect(isEngagementStandout(loud, [...scoped, loud])).toBe(false);
  });
});

describe("New since last visit", () => {
  it("5 ads added since a visit 1 minute ago → exactly those 5 are New", () => {
    const lastVisit = NOW - 60_000;
    const fresh = Array.from({ length: 5 }, (_, i) => makeAd({ id: `fresh-${i}`, firstSeenAt: iso(NOW - (i + 1) * 5_000) }));
    const old = Array.from({ length: 10 }, (_, i) => makeAd({ id: `old-${i}`, firstSeenAt: iso(NOW - (i + 1) * DAY) }));
    const ads = [...fresh, ...old];
    expect(ads.filter((a) => isNew(a, lastVisit)).map((a) => a.id)).toEqual(fresh.map((a) => a.id));
    expect(ads.filter((a) => isNew(a, iso(lastVisit)))).toHaveLength(5);
  });

  it("nothing added in 2 days → no New tag anywhere", () => {
    const lastVisit = NOW - 2 * DAY;
    const ads = U.ads.map((a) => makeAd({ firstSeenAt: iso(Math.min(Date.parse(a.firstSeenAt), NOW - 3 * DAY)) }, a));
    expect(ads.some((a) => isNew(a, lastVisit))).toBe(false);
  });

  it("unknown last visit → nothing is New, and the New KPI is disabled", () => {
    expect(isNew(U.ads[0], null)).toBe(false);
    const kpi = discoverKpis(U.ads, DEFAULT_SCOPE, { now: NOW, lastVisitAt: null, data: D }).find((k) => k.key === "new");
    expect(kpi?.disabledReason).toBeTruthy();
  });

  it("the demo universe shows 25 New ads for a first visit (seeded 2 days back)", () => {
    const kpi = discoverKpis(U.ads, DEFAULT_SCOPE, { now: NOW, lastVisitAt: NOW - 2 * DAY, data: D }).find((k) => k.key === "new");
    expect(kpi?.value).toBe(25);
  });

  it("works for advertisers and landing pages too", () => {
    const newPages = U.advertisers.filter((a) => isNew(a, NOW - 2 * DAY));
    expect(newPages.length).toBeGreaterThanOrEqual(3);
    expect(U.landingPages.some((l) => isNew(l, NOW - 2 * DAY))).toBe(true);
  });
});

describe("scope: period + preferences", () => {
  const ad = makeAd({ startedAt: iso(NOW - 200 * DAY), firstSeenAt: iso(NOW - 150 * DAY), lastSeenAt: iso(NOW - 2 * DAY) });

  it("inPeriod: first seen in the window OR live during it", () => {
    expect(inPeriod(ad, "7d", NOW)).toBe(true); // live in window
    expect(inPeriod({ ...ad, lastSeenAt: iso(NOW - 20 * DAY) }, "7d", NOW)).toBe(false);
    expect(inPeriod({ ...ad, firstSeenAt: iso(NOW - 3 * DAY), lastSeenAt: iso(NOW - 3 * DAY) }, "7d", NOW)).toBe(true);
    expect(inPeriod({ ...ad, startedAt: null, lastSeenAt: iso(NOW - 20 * DAY) }, "7d", NOW)).toBe(false);
    expect(inPeriod({ ...ad, lastSeenAt: iso(NOW - 300 * DAY) }, "all", NOW)).toBe(true);
  });

  it("unknown start date: an ad seen live recently stays in short periods (start falls back to firstSeenAt)", () => {
    const unknown = makeAd({ startedAt: null, daysLive: null, firstSeenAt: iso(NOW - 150 * DAY), lastSeenAt: iso(NOW - 1 * DAY) });
    expect(inPeriod(unknown, "7d", NOW)).toBe(true);
    expect(inPeriod(unknown, "14d", NOW)).toBe(true);
    expect(adsInScope([unknown], { ...DEFAULT_SCOPE, period: "7d" }, { now: NOW })).toHaveLength(1);
    expect(unknown.daysLive).toBeNull();
  });

  it("My preferences only limits to followed pages/industries + competitor pages/domains", () => {
    const prefs = { followedPageIds: [U.ads[0].pageAdvertiserId], followedIndustryIds: ["search-arb"], competitorPageIds: [], competitorDomainIds: [] };
    const mine = adsInScope(U.ads, { ...DEFAULT_SCOPE, myPrefsOnly: true }, { now: NOW, prefs });
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every((a) => matchesPrefs(a, prefs))).toBe(true);
    expect(mine.length).toBe(U.ads.filter((a) => matchesPrefs(a, prefs)).length);
    expect(adsInScope(U.ads, { ...DEFAULT_SCOPE, myPrefsOnly: true }, { now: NOW })).toHaveLength(0);
    expect(adsInScope(U.ads, DEFAULT_SCOPE, { now: NOW, prefs })).toHaveLength(U.ads.length);
  });
});
