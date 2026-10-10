import { describe, expect, it } from "vitest";
import { DEFAULT_SCOPE } from "../types";
import type { AdSort, AdvertiserSort, ElementSort, LandingPageSort } from "../types";
import {
  adsInBaseScope, adsInScope, advertiserDetail, advertiserKpis, advertiserRows, buildDownload, buildDownloads, detailTargetFor,
  discoverKpis, elementDetail, elementKpis, elementRows, filterByTagUnion, landingPageKpis, landingPageRows, launchFrequency,
  launchSeries, rising, scaling, snapshotFor, sortAdvertiserRows, sortAds, sortElementRows, sortLandingPageRows, trendPct, trendingTags,
} from "./index";
import { D, DAY, NOW, U, iso, makeAd } from "./fixtures.test-util";

const ctx = { now: NOW, data: D, lastVisitAt: NOW - 2 * DAY };
const scope = DEFAULT_SCOPE;
const scoped = adsInScope(U.ads, scope, ctx);
const rowCtx = { ...ctx, scope, baseAds: adsInBaseScope(U.ads, scope, ctx) };

describe("trends (Q7)", () => {
  it("trend % is null when the previous period is 0 (no minimum base)", () => {
    expect(trendPct(5, 0)).toBeNull();
    expect(trendPct(3, 1)).toBe(200);
    expect(trendPct(1, 2)).toBe(-50);
  });

  it("bucket = day ≤30d, week ≤180d, month for 365d / all; unit label always set", () => {
    expect(launchFrequency(U.ads, { ...scope, period: "7d" }, NOW).bucket).toBe("day");
    expect(launchFrequency(U.ads, { ...scope, period: "30d" }, NOW).points).toHaveLength(30);
    expect(launchFrequency(U.ads, { ...scope, period: "90d" }, NOW).bucket).toBe("week");
    expect(launchFrequency(U.ads, { ...scope, period: "180d" }, NOW).bucket).toBe("week");
    expect(launchFrequency(U.ads, { ...scope, period: "365d" }, NOW).bucket).toBe("month");
    const all = launchFrequency(U.ads, scope, NOW);
    expect(all.bucket).toBe("month");
    expect(all.unit).toBe("new ads per month");
    expect(all.points.reduce((s, p) => s + p.count, 0)).toBe(U.ads.length);
  });

  it("launch series counts each launch once in the right bucket", () => {
    const ads = [0, 0.5, 1.5, 9].map((d, i) => makeAd({ id: `l-${i}`, startedAt: iso(NOW - d * DAY) }));
    const s = launchSeries(ads, "7d", NOW);
    expect(s.points.reduce((sum, p) => sum + p.count, 0)).toBe(3);
    expect(s.points[s.points.length - 1].count).toBeGreaterThanOrEqual(1);
  });

  it("rising / scaling / trending tags return ranked, honest lists", () => {
    const r = rising("page", U.ads, "all", NOW, { data: D });
    for (const x of r) expect(x.changePct == null ? x.cur > 0 : x.changePct > 0).toBe(true);
    const s = scaling("domain", U.ads, "all", NOW, { data: D });
    for (const x of s) {
      expect(x.activeNow).toBeGreaterThan(x.activePrev);
      expect(x.winners).toBeGreaterThanOrEqual(1);
    }
    const tags = trendingTags(U.ads, "all", NOW, { data: D });
    expect(tags.length).toBeGreaterThan(0);
    expect(tags.every((t) => !t.label.startsWith("#"))).toBe(true);
  });
});

describe("KPIs", () => {
  it("Discover KPI row has the 7 spec tiles", () => {
    expect(discoverKpis(U.ads, scope, ctx).map((k) => k.key)).toEqual(["total", "active", "winning", "advertisers", "new", "avgDaysLive", "landingPages"]);
  });

  it("avg days live excludes unknown starts and says so", () => {
    const k = discoverKpis(U.ads, scope, ctx).find((x) => x.key === "avgDaysLive")!;
    const known = scoped.filter((a) => a.daysLive != null).length;
    expect(k.sub).toBe(`${known} with known start`);
    expect(k.tooltip).toContain(`${known} ads with a known start`);
    const none = discoverKpis([makeAd({ daysLive: null, startedAt: null })], scope, ctx).find((x) => x.key === "avgDaysLive")!;
    expect(none.disabledReason).toBeTruthy();
  });

  it("advertiser / LP / element KPI rows match the spec", () => {
    expect(advertiserKpis("domain", U.ads, scope, ctx).map((k) => k.key)).toEqual(["total", "active", "new", "scaling", "rising"]);
    expect(landingPageKpis(U.ads, scope, ctx).map((k) => k.key)).toEqual(["landingPages", "activeLandingPages", "risingLandingPages"]);
    const el = elementKpis("framework", U.ads, scope, ctx).map((k) => k.key);
    expect(el.slice(0, 4)).toEqual(["items", "topItem", "fastestRising", "videoVsImage"]);
    expect(el).toContain("winning");
  });
});

describe("rows + sorts", () => {
  it("advertiser rows aggregate only the given (filtered) ads", () => {
    const filtered = filterByTagUnion(scoped, { framework: ["pas"] }, D);
    const rows = advertiserRows("page", filtered, rowCtx);
    const ids = new Set(filtered.map((a) => a.pageAdvertiserId));
    expect(rows.map((r) => r.id).sort()).toEqual([...ids].sort());
    for (const r of rows) expect(r.totalAds).toBe(filtered.filter((a) => a.pageAdvertiserId === r.id).length);
    expect(rows[0].launchTrend.unit).toMatch(/new ads per/);
  });

  it("every sort option works, ties break by id, no likes sort exists", () => {
    const adSorts: AdSort[] = ["newest", "oldest", "longest-running", "most-cloned", "ai-score"];
    for (const s of adSorts) expect(sortAds(scoped, s)).toHaveLength(scoped.length);
    const byClones = sortAds(scoped, "most-cloned");
    for (let i = 1; i < byClones.length; i++) {
      const [a, b] = [byClones[i - 1], byClones[i]];
      expect(a.clones > b.clones || (a.clones === b.clones && a.id < b.id)).toBe(true);
    }
    const longest = sortAds(scoped, "longest-running");
    expect(longest[longest.length - 1].daysLive).toBeNull();

    const adv = advertiserRows("page", scoped, rowCtx);
    for (const s of ["most-ads", "most-active", "most-winners", "longest-run"] as AdvertiserSort[]) expect(sortAdvertiserRows(adv, s)).toHaveLength(adv.length);
    const lps = landingPageRows(scoped, rowCtx);
    for (const s of ["most-ads", "most-active", "most-advertisers", "longest-running", "fastest-rising"] as LandingPageSort[]) {
      expect(sortLandingPageRows(lps, s)).toHaveLength(lps.length);
    }
    const els = elementRows("hook", scoped, rowCtx);
    for (const s of ["most-used", "most-winners", "fastest-rising", "longest-running"] as ElementSort[]) expect(sortElementRows(els, s)).toHaveLength(els.length);
    expect(sortElementRows(els, "most-used")[0].adsUsing).toBeGreaterThanOrEqual(sortElementRows(els, "most-used")[1].adsUsing);
  });

  it("LP rows show 'Not traced' offers as null, and element rows carry share %", () => {
    const lps = landingPageRows(scoped, rowCtx);
    expect(lps.some((r) => r.offerDomain == null)).toBe(true);
    const els = elementRows("framework", scoped, { ...rowCtx, shareBase: scoped.length });
    const totalShare = els.reduce((s, r) => s + r.adsUsing, 0);
    expect(totalShare).toBeLessThanOrEqual(scoped.length);
    expect(els.every((r) => r.exampleAdId)).toBe(true);
  });
});

describe("details", () => {
  it("advertiser detail: every block carries basedOn; unknown id → null", () => {
    const pageId = U.advertisers.find((a) => a.kind === "page")!.id;
    const d = advertiserDetail("page", pageId, U.ads, scope, ctx)!;
    expect(d.basedOn).toBe(scoped.filter((a) => a.pageAdvertiserId === pageId).length);
    for (const b of [d.hooks, d.angles, d.frameworks, d.concepts, d.ctas, d.keywords, d.winners, d.longestRunning, d.launchActivity, d.landingPages]) {
      expect(typeof b.basedOn).toBe("number");
    }
    expect(advertiserDetail("domain", pageId, U.ads, scope, ctx)).toBeNull();
  });

  it("element detail: where it works + works well with (with lift)", () => {
    const d = elementDetail("framework", "pas", U.ads, scope, ctx)!;
    expect(d.whereItWorks.categories.items.length).toBeGreaterThan(0);
    expect(d.worksWellWith.groups.map((g) => g.type)).toEqual(["hook", "angle", "concept"]);
    for (const g of d.worksWellWith.groups) for (const i of g.items) expect(i.lift).toBeGreaterThan(0);
  });
});

describe("downloads + board helpers", () => {
  const ad = scoped.find((a) => a.thumbnailUrl || a.videoUrl)!;
  const lp = U.landingPages.find((l) => l.screenshotUrl)!;

  it("ad → media url + .txt; LP → screenshot + page text; elements/advertisers/offers → markdown", () => {
    const adFiles = buildDownloads({ type: "ad", id: ad.id });
    expect(adFiles.map((f) => f.kind)).toEqual(["url", "text"]);
    expect(buildDownload({ type: "ad", id: ad.id })).toMatchObject({ kind: "text", mime: "text/plain" });
    expect(buildDownloads({ type: "landing-page", id: lp.id }).map((f) => f.kind)).toEqual(["url", "text"]);
    for (const ref of [
      { type: "framework" as const, id: "pas" },
      { type: "hook" as const, id: "callout" },
      { type: "angle" as const, id: U.elements.angle[0].id },
      { type: "concept" as const, id: "ugc-selfie" },
      { type: "page" as const, id: ad.pageAdvertiserId },
      { type: "domain" as const, id: U.advertisers.find((a) => a.kind === "domain")!.id },
      { type: "offer" as const, id: D.offers[0].id },
    ]) {
      const f = buildDownload(ref);
      expect(f, ref.type).toMatchObject({ kind: "text", mime: "text/markdown" });
      if (f && f.kind === "text") expect(f.content).toMatch(/Based on \d+ ads/);
    }
    expect(buildDownload({ type: "framework", id: "nope" })).toBeNull();
  });

  it("snapshots + detail targets resolve for every savable type", () => {
    expect(snapshotFor({ type: "ad", id: ad.id })?.title).toBe(ad.headline);
    expect(snapshotFor({ type: "landing-page", id: lp.id })?.thumbnailUrl).toBe(lp.screenshotUrl);
    expect(snapshotFor({ type: "hook", id: "nope" })).toBeNull();
    expect(detailTargetFor({ type: "ad", id: "x" })).toEqual({ kind: "ad", id: "x" });
    expect(detailTargetFor({ type: "page", id: "p" })).toEqual({ kind: "advertiser", advertiserKind: "page", id: "p" });
    expect(detailTargetFor({ type: "angle", id: "a" })).toEqual({ kind: "element", elementType: "angle", id: "a" });
    expect(detailTargetFor({ type: "offer", id: "o.com" })).toEqual({ kind: "offer", id: "o.com" });
  });
});
