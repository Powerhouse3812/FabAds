import { describe, expect, it } from "vitest";
import {
  DISCOVER_GROUP_KEYS, LANDING_PAGE_GROUP_KEYS, adsForPrefs, discoverKpis, engagementTotal, isEngagementStandout, isNew, isWinner,
  launchSeries, tagGroups,
} from "../selectors";
import { seedBoards, seedCompetitors, seedFollows, seedSavedAds } from "../stores/seed";
import { myFeedsAds } from "../stores/prefs";
import type { Ad, PeriodKey, Scope, TagGroupKey } from "../types";
import { DEAD_THUMBNAIL_URLS, applyDemoCoverage, rescoreAd } from "./demoCoverage";
import type { DemoCoverageReport } from "./demoCoverage";
import { INDEX, buildIndex, generateUniverse } from "./index";

const NOW = Date.UTC(2026, 9, 10, 12, 0, 0);
const DAY = 86_400_000;
const GROUP_KEYS = Array.from(new Set<TagGroupKey>([...DISCOVER_GROUP_KEYS, ...LANDING_PAGE_GROUP_KEYS]));

const RAW = generateUniverse({ now: NOW });
const report: DemoCoverageReport = { applied: [], skipped: [], touchedAdIds: [] };
const COVERED = applyDemoCoverage(generateUniverse({ now: NOW }), report);

function feedOf(u: typeof RAW): Ad[] {
  const d = buildIndex(u);
  const f = seedFollows(d);
  const c = seedCompetitors(d, f);
  return adsForPrefs(u.ads, { followedPageIds: f.pages, followedIndustryIds: f.industries, competitorPageIds: c.pages, competitorDomainIds: c.domains });
}

describe("demo coverage — applies cleanly", () => {
  it("every override found its ad (a skip means the generator or the seeded prefs moved)", () => {
    expect(report.skipped).toEqual([]);
    expect(report.applied.length).toBeGreaterThanOrEqual(13);
  });

  it("is deterministic and leaves non-default seeds alone", () => {
    expect(JSON.stringify(applyDemoCoverage(generateUniverse({ now: NOW })))).toBe(JSON.stringify(COVERED));
    const other = generateUniverse({ now: NOW, seed: 7 });
    expect(JSON.stringify(applyDemoCoverage(generateUniverse({ now: NOW, seed: 7 })))).toBe(JSON.stringify(other));
  });

  it("only the allowed ad fields change, and untouched ads are identical", () => {
    const allowed = new Set([
      "engagement", "aiScore", "pageName", "headline", "primaryText", "analysis", "thumbnailUrl", "ctaLabel", "startedAt", "daysLive",
      "clones", "delivery", "demographics", "locations", "transparencyRegions", "lastSyncedAt",
    ]);
    const touched = new Set(report.touchedAdIds);
    COVERED.ads.forEach((cov, i) => {
      const raw = RAW.ads[i];
      expect(cov.id).toBe(raw.id);
      if (!touched.has(cov.id)) {
        expect(cov).toEqual(raw);
        return;
      }
      for (const key of Object.keys(raw) as (keyof Ad)[]) {
        if (JSON.stringify(cov[key]) !== JSON.stringify(raw[key])) expect(allowed.has(key), `${cov.id}.${key}`).toBe(true);
      }
      // taxonomy + identity + dates that drive "New" and the active window never move
      for (const key of ["industryId", "categoryId", "status", "firstSeenAt", "lastSeenAt", "mediaKind", "domainAdvertiserId", "landingPageId", "countries", "similarAdIds", "pageAdvertiserId"] as const) {
        expect(cov[key], `${cov.id}.${key}`).toEqual(raw[key]);
      }
    });
  });

  it("rescoring an untouched ad reproduces the generator's AI score", () => {
    const lps = new Map(RAW.landingPages.map((l) => [l.id, l]));
    const touched = new Set(report.touchedAdIds);
    for (const ad of RAW.ads) {
      if (touched.has(ad.id)) continue;
      const copy = { ...ad };
      rescoreAd(copy, lps);
      expect(copy.aiScore, ad.id).toEqual(ad.aiScore);
    }
  });
});

describe("demo coverage — documented aggregates do not move", () => {
  const rawFeed = feedOf(RAW);
  const covFeed = feedOf(COVERED);
  const D0 = buildIndex(RAW);
  const D1 = buildIndex(COVERED);

  it("same ads, same feed, same industry / category / status / winner counts", () => {
    expect(COVERED.ads).toHaveLength(800);
    expect(covFeed.map((a) => a.id)).toEqual(rawFeed.map((a) => a.id));
    const counts = (ads: Ad[]) => {
      const out: Record<string, number> = { active: 0, winners: 0 };
      for (const a of ads) {
        out[`ind:${a.industryId}`] = (out[`ind:${a.industryId}`] ?? 0) + 1;
        out[`cat:${a.categoryId}`] = (out[`cat:${a.categoryId}`] ?? 0) + 1;
        if (a.status === "active") out.active++;
        if (isWinner(a)) out.winners++;
        if (a.status === "active") out[`indActive:${a.industryId}`] = (out[`indActive:${a.industryId}`] ?? 0) + 1;
        if (isWinner(a)) out[`indWinners:${a.industryId}`] = (out[`indWinners:${a.industryId}`] ?? 0) + 1;
      }
      return out;
    };
    expect(counts(COVERED.ads)).toEqual(counts(RAW.ads));
    expect(counts(covFeed)).toEqual(counts(rawFeed));
    expect(counts(COVERED.ads).winners).toBe(148);
  });

  it("every tag count, in every group, over all ads and over My Feeds", () => {
    const shape = (u: typeof RAW, d: ReturnType<typeof buildIndex>, ads: Ad[]) =>
      tagGroups(ads, GROUP_KEYS, d).map((g) => ({ key: g.key, missing: g.missing, options: g.options.map((o) => [o.id, o.label, o.count]) }));
    expect(shape(COVERED, D1, COVERED.ads)).toEqual(shape(RAW, D0, RAW.ads));
    expect(shape(COVERED, D1, covFeed)).toEqual(shape(RAW, D0, rawFeed));
  });

  it("the all-time KPI row (Total / Active / Winning / Competitors / New / Avg days live / LPs) is identical", () => {
    const scope: Scope = { industry: "all", category: "all", period: "all", myPrefsOnly: false };
    const kpis = (ads: Ad[], d: ReturnType<typeof buildIndex>) =>
      discoverKpis(ads, scope, { now: NOW, lastVisitAt: NOW - 2 * DAY, data: d }).map((k) => [k.key, k.value, k.display, k.sub]);
    expect(kpis(COVERED.ads, D1)).toEqual(kpis(RAW.ads, D0));
    expect(kpis(covFeed, D1)).toEqual(kpis(rawFeed, D0));
  });

  it("the launch series only moves for the one New + Winner ad", () => {
    // Start dates are swapped between ads (the 400+ day ad) or handed to an ad first seen in the same month (the bare ad),
    // so no launch bucket changes. The exception is the New + Winner ad: a Winner needs 14+ days live, so its launch
    // moves ~12 days earlier. Put that one ad back and every period's series must equal the raw generator's.
    const restored = COVERED.ads.map((a, i) => (a.id === "ad-0414" ? RAW.ads[i] : a));
    for (const period of ["7d", "14d", "30d", "90d", "180d", "365d", "all"] as PeriodKey[]) {
      expect(launchSeries(restored, period, NOW), period).toEqual(launchSeries(RAW.ads, period, NOW));
    }
    // …and the moved ad really does change the short series (guards against this test going vacuous).
    expect(launchSeries(COVERED.ads, "30d", NOW)).not.toEqual(launchSeries(RAW.ads, "30d", NOW));
  });

  it("sum and count of days live are conserved apart from the intended runs", () => {
    const sum = (ads: Ad[]) => ads.reduce((s, a) => s + (a.daysLive ?? 0), 0);
    const known = (ads: Ad[]) => ads.filter((a) => a.daysLive != null).length;
    expect(known(COVERED.ads)).toBe(known(RAW.ads));
    // New + Winner 2 → 14 (+12), the zero-day ad 1 → 0 (−1) and a −1 rounding in the 400+ day swap; the rest is swapped, not added.
    expect(sum(COVERED.ads) - sum(RAW.ads)).toBe(10);
  });

  it("seeded boards and saved ads pick the same ads", () => {
    expect(seedBoards(D1).map((b) => b.items.map((i) => `${i.ref.type}:${i.ref.id}`))).toEqual(seedBoards(D0).map((b) => b.items.map((i) => `${i.ref.type}:${i.ref.id}`)));
    expect(seedSavedAds(D1).map((s) => s.adId)).toEqual(seedSavedAds(D0).map((s) => s.adId));
  });

  it("engagement stays a fifth of the universe, and nothing source-named leaks in", () => {
    const share = COVERED.ads.filter((a) => engagementTotal(a) != null).length / COVERED.ads.length;
    expect(share).toBeGreaterThan(0.14);
    expect(share).toBeLessThan(0.26);
    const rev = (s: string) => s.split("").reverse().join("");
    const blob = JSON.stringify(COVERED);
    for (const name of ["ypsda", "yalperof", "yalp erof", "ypsgib", "orehyps", "ytixelpda", "yrarbil da atem", "yrarbil da", "sdaelerots", "aenim", "sdaipip"]) {
      expect(new RegExp(`\\b${rev(name)}\\b`, "i").test(blob), rev(name)).toBe(false);
    }
  });

  it("advertiser entity names equal the ads' pageName everywhere", () => {
    for (const a of COVERED.ads) expect(D1.advertiserById.get(a.pageAdvertiserId)?.name, a.id).toBe(a.pageName);
  });
});

describe("demo coverage — what My Feeds shows (the real singleton)", () => {
  const feed = myFeedsAds();
  const ids = new Set(feed.map((a) => a.id));
  const lastVisit = Date.now() - 2 * DAY;
  const shape = (a: Ad) => (["likes", "comments", "shares"] as const).filter((k) => a.engagement[k] != null).join("+") || "none";
  const withShape = (s: string) => feed.filter((a) => shape(a) === s);

  it("every touched ad is inside the seeded feed", () => {
    for (const id of report.touchedAdIds) expect(ids.has(id), id).toBe(true);
    expect(feed.length).toBe(299);
  });

  it("1 · page names of 60–85 characters on at least two feed pages, entity name = pageName", () => {
    const longPages = new Set(feed.filter((a) => a.pageName.length >= 60 && a.pageName.length <= 85).map((a) => a.pageAdvertiserId));
    expect(longPages.size).toBeGreaterThanOrEqual(2);
    for (const id of longPages) expect(INDEX.advertiserById.get(id)?.name).toBe(feed.find((a) => a.pageAdvertiserId === id)?.pageName);
  });

  it("2 · every engagement shape, one all-zero, one huge, one tiny, 70–90 reporting ads", () => {
    for (const s of ["likes", "comments", "shares", "likes+shares", "likes+comments", "likes+comments+shares"]) expect(withShape(s).length, s).toBeGreaterThanOrEqual(3);
    expect(feed.filter((a) => a.engagement.likes === 0 && a.engagement.comments === 0 && a.engagement.shares === 0)).toHaveLength(1);
    expect(feed.filter((a) => (a.engagement.likes ?? 0) >= 1_000_000 && (a.engagement.comments ?? 0) >= 40_000 && (a.engagement.shares ?? 0) >= 9_000)).toHaveLength(1);
    expect(feed.filter((a) => a.engagement.likes === 3 && a.engagement.comments === 0 && a.engagement.shares === 1)).toHaveLength(1);
    const reporting = feed.filter((a) => engagementTotal(a) != null).length;
    expect(reporting).toBeGreaterThanOrEqual(70);
    expect(reporting).toBeLessThanOrEqual(90);
  });

  it("3 · a 400+ day run, an exact 0-day run and an exact 1-day run", () => {
    expect(feed.some((a) => (a.daysLive ?? 0) >= 400)).toBe(true);
    expect(feed.some((a) => a.daysLive === 0)).toBe(true);
    expect(feed.some((a) => a.daysLive === 1)).toBe(true);
  });

  it("4 · 30+ clones, and exactly 1 clone", () => {
    expect(feed.some((a) => a.clones >= 30)).toBe(true);
    expect(feed.some((a) => a.clones === 1)).toBe(true);
  });

  it("5 · two dead thumbnail URLs, a video and a carousel with no thumbnail", () => {
    for (const url of DEAD_THUMBNAIL_URLS) expect(feed.filter((a) => a.thumbnailUrl === url)).toHaveLength(1);
    expect(feed.some((a) => a.mediaKind === "video" && a.thumbnailUrl == null)).toBe(true);
    expect(feed.some((a) => a.mediaKind === "carousel" && a.thumbnailUrl == null)).toBe(true);
  });

  it("6 · one ad with every optional field missing", () => {
    const bare = feed.filter(
      (a) =>
        a.thumbnailUrl == null && a.domainAdvertiserId == null && a.landingPageId == null && a.ctaLabel == null && !a.analysis.hookStyle &&
        !a.analysis.angle && !a.analysis.framework && !a.analysis.concept && a.countries.length === 0 && a.startedAt == null &&
        a.daysLive == null && a.status === "inactive",
    );
    expect(bare.map((a) => a.id)).toEqual(["ad-0418"]);
  });

  it("7 · a 280–400 char primary text and a 70+ char headline", () => {
    expect(feed.some((a) => a.primaryText.length >= 280 && a.primaryText.length <= 400)).toBe(true);
    expect(feed.some((a) => a.headline.length >= 70)).toBe(true);
  });

  it("9 · New + Winner, New only, Winner only, and a Winner whose engagement mark shows", () => {
    expect(feed.filter((a) => isNew(a, lastVisit) && isWinner(a)).map((a) => a.id)).toEqual(["ad-0414"]);
    expect(feed.some((a) => isNew(a, lastVisit) && !isWinner(a))).toBe(true);
    expect(feed.some((a) => !isNew(a, lastVisit) && isWinner(a))).toBe(true);
    expect(feed.some((a) => isWinner(a) && engagementTotal(a) != null)).toBe(true);
    expect(feed.some((a) => isEngagementStandout(a, feed))).toBe(true);
  });

  it("the AI score never contradicts the engagement an ad reports", () => {
    for (const a of feed) {
      const likes = a.aiScore.parts.find((p) => p.key === "likes");
      const social = a.aiScore.parts.find((p) => p.key === "social");
      expect(likes?.available, a.id).toBe(a.engagement.likes != null);
      expect(social?.available, a.id).toBe(a.engagement.comments != null || a.engagement.shares != null);
    }
  });
});
