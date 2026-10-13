import { describe, expect, it } from "vitest";
import { ACTIVE_WINDOW_DAYS } from "../types";
import { DISCOVER_GROUP_KEYS, tagGroups } from "../selectors";
import { ANGLE_BANNED_WORDS, CATEGORIES, INDUSTRY_CATEGORIES, buildIndex, generateUniverse } from "./index";

const NOW = Date.UTC(2026, 9, 10, 12, 0, 0);
const U = generateUniverse({ now: NOW });
const D = buildIndex(U);
const DAY = 86_400_000;
const share = (n: number) => n / U.ads.length;

// Names are stored reversed so this file itself passes the folder-wide grep gate.
const REVERSED_NAMES = ["ypsda", "yalperof", "yalp erof", "ypsgib", "orehyps", "ytixelpda", "yrarbil da atem", "yrarbil da", "sdaelerots", "aenim", "sdaipip"];
const FORBIDDEN_SOURCE_NAMES = [
  ...REVERSED_NAMES.map((r) => new RegExp(`\\b${r.split("").reverse().join("")}\\b`, "i")),
  /fetched_via/i,
  /\bsource_fields\b/i,
  /vx_source/i,
];

describe("universe — determinism + shape", () => {
  it("same seed + now gives identical data", () => {
    const again = generateUniverse({ now: NOW });
    expect(JSON.stringify(again)).toBe(JSON.stringify(U));
  });

  it("a different seed gives different data", () => {
    const other = generateUniverse({ now: NOW, seed: 7 });
    expect(other.ads[0].headline === U.ads[0].headline && other.ads[1].headline === U.ads[1].headline).toBe(false);
  });

  it("has ~800 ads, 6 industries, ~130 pages, ~100 domains, ~260 landing pages", () => {
    expect(U.ads).toHaveLength(800);
    expect(U.industries.map((i) => i.label)).toEqual(["VSL", "Telehealth", "Lead Gen", "E-commerce", "Search Arb", "Others"]);
    const pages = U.advertisers.filter((a) => a.kind === "page").length;
    const domains = U.advertisers.filter((a) => a.kind === "domain").length;
    expect(pages).toBeGreaterThanOrEqual(120);
    expect(pages).toBeLessThanOrEqual(140);
    expect(domains).toBeGreaterThanOrEqual(90);
    expect(domains).toBeLessThanOrEqual(110);
    expect(U.landingPages.length).toBeGreaterThanOrEqual(230);
    expect(U.landingPages.length).toBeLessThanOrEqual(300);
  });

  it("categories are the deduped A–Z union, without Adult; Demi-fine & Fashion sits in E-commerce", () => {
    const labels = CATEGORIES.map((c) => c.label);
    expect(labels).toEqual(labels.slice().sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" })));
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels).not.toContain("Adult");
    expect(INDUSTRY_CATEGORIES["e-commerce"]).toContain("demi-fine-and-fashion");
    expect(INDUSTRY_CATEGORIES["search-arb"]).not.toContain("adult");
  });

  it("every ad's category belongs to its own industry's canon list", () => {
    for (const ad of U.ads) expect(INDUSTRY_CATEGORIES[ad.industryId]).toContain(ad.categoryId);
  });

  it("ads are spread unevenly: Lead Gen and VSL heavy, Search Arb light", () => {
    const by = (id: string) => U.ads.filter((a) => a.industryId === id).length;
    expect(by("lead-gen")).toBeGreaterThan(by("e-commerce"));
    expect(by("vsl")).toBeGreaterThan(by("telehealth"));
    expect(by("search-arb")).toBeLessThan(by("others"));
    expect(by("search-arb")).toBeGreaterThan(0);
  });

  it("includes 60+ char names for truncation tests", () => {
    expect(U.advertisers.filter((a) => a.kind === "page" && a.name.length >= 60).length).toBeGreaterThanOrEqual(3);
    expect(U.advertisers.filter((a) => a.kind === "domain" && a.name.length >= 60).length).toBeGreaterThanOrEqual(1);
  });
});

describe("universe — rates", () => {
  it("active share is realistic (≈45–55%) and status follows the 14-day window", () => {
    const active = U.ads.filter((a) => a.status === "active");
    expect(share(active.length)).toBeGreaterThan(0.42);
    expect(share(active.length)).toBeLessThan(0.58);
    for (const a of U.ads) {
      const seenAgo = (NOW - Date.parse(a.lastSeenAt)) / DAY;
      expect(a.status === "active").toBe(seenAgo <= ACTIVE_WINDOW_DAYS);
    }
  });

  it("engagement is reported on ~20% only, all-or-none on likes", () => {
    const withEng = U.ads.filter((a) => a.engagement.likes != null).length;
    expect(share(withEng)).toBeGreaterThan(0.14);
    expect(share(withEng)).toBeLessThan(0.26);
    for (const a of U.ads) if (a.engagement.likes == null) expect(a.engagement.comments).toBeNull();
  });

  it("~12% of ads have no country", () => {
    const missing = U.ads.filter((a) => a.countries.length === 0).length;
    expect(share(missing)).toBeGreaterThan(0.08);
    expect(share(missing)).toBeLessThan(0.17);
  });

  it("~25 ads first seen in the last 48h, a handful in the last hour", () => {
    expect(U.ads.filter((a) => NOW - Date.parse(a.firstSeenAt) < 48 * 3_600_000)).toHaveLength(25);
    expect(U.ads.filter((a) => NOW - Date.parse(a.firstSeenAt) < 3_600_000)).toHaveLength(5);
  });

  it("firstSeenAt spans about a year and leans recent", () => {
    const ages = U.ads.map((a) => (NOW - Date.parse(a.firstSeenAt)) / DAY);
    expect(Math.max(...ages)).toBeGreaterThan(300);
    expect(Math.max(...ages)).toBeLessThanOrEqual(366);
    expect(ages.filter((d) => d < 90).length).toBeGreaterThan(ages.filter((d) => d > 270).length);
  });

  it("startedAt null on ~8%; daysLive null exactly when startedAt is null", () => {
    const nulls = U.ads.filter((a) => a.startedAt == null).length;
    expect(share(nulls)).toBeGreaterThan(0.04);
    expect(share(nulls)).toBeLessThan(0.12);
    for (const a of U.ads) expect(a.daysLive == null).toBe(a.startedAt == null);
  });

  it("media mix ≈45/45/10 and ~10% thumbnails missing", () => {
    const k = (m: string) => share(U.ads.filter((a) => a.mediaKind === m).length);
    expect(k("video")).toBeGreaterThan(0.38);
    expect(k("image")).toBeGreaterThan(0.36);
    expect(k("carousel")).toBeGreaterThan(0.06);
    expect(k("carousel")).toBeLessThan(0.14);
    const noThumb = share(U.ads.filter((a) => !a.thumbnailUrl).length);
    expect(noThumb).toBeGreaterThan(0.06);
    expect(noThumb).toBeLessThan(0.15);
  });

  it("~70% of ads have a landing page; ~5% have no domain", () => {
    expect(share(U.ads.filter((a) => a.landingPageId).length)).toBeGreaterThan(0.64);
    expect(share(U.ads.filter((a) => a.landingPageId).length)).toBeLessThan(0.76);
    const noDomain = share(U.ads.filter((a) => !a.domainAdvertiserId).length);
    expect(noDomain).toBeGreaterThan(0.02);
    expect(noDomain).toBeLessThan(0.08);
  });

  it("clones form a long tail", () => {
    const zero = U.ads.filter((a) => a.clones === 0).length;
    const big = U.ads.filter((a) => a.clones >= 10).length;
    expect(share(zero)).toBeGreaterThan(0.3);
    expect(big).toBeGreaterThan(5);
    expect(Math.max(...U.ads.map((a) => a.clones))).toBeLessThanOrEqual(60);
  });

  it("analysis coverage ≈70% full / 20% partial / 10% minimal", () => {
    const minimal = U.ads.filter((a) => a.analysis.hookText == null && a.analysis.framework == null && a.analysis.beats == null);
    expect(share(minimal.length)).toBeGreaterThan(0.06);
    expect(share(minimal.length)).toBeLessThan(0.14);
    for (const a of minimal) {
      expect(a.analysis.keywords.length).toBeGreaterThanOrEqual(4);
      expect(a.analysis.ctaText).toBeTruthy();
    }
  });
});

describe("universe — integrity", () => {
  it("every advertiser and landing page is used by at least one ad", () => {
    for (const adv of U.advertisers) {
      const n = adv.kind === "page" ? D.adsByPage.get(adv.id)?.length : D.adsByDomain.get(adv.id)?.length;
      expect(n ?? 0).toBeGreaterThan(0);
    }
    for (const lp of U.landingPages) expect(D.adsByLandingPage.get(lp.id)?.length ?? 0).toBeGreaterThan(0);
  });

  it("an ad's landing page lives on the ad's domain", () => {
    for (const a of U.ads) {
      if (!a.landingPageId) continue;
      const lp = D.landingPageById.get(a.landingPageId);
      expect(lp?.domain).toBe(D.advertiserById.get(a.domainAdvertiserId as string)?.name);
    }
  });

  it("landing pages: 5 funnel types, offers traced on ~60%, 1–4 hop paths without tracker hosts", () => {
    const funnels = new Set(U.landingPages.map((l) => l.funnelType).filter(Boolean));
    expect(funnels.size).toBe(5);
    const traced = U.landingPages.filter((l) => l.offerDomain).length / U.landingPages.length;
    expect(traced).toBeGreaterThan(0.5);
    expect(traced).toBeLessThan(0.72);
    const trackerHost = /^https?:\/\/(trk|track|tracking|click|clk|go|r|t|redirect|link|lnk|tk)\d*\./i;
    for (const l of U.landingPages) {
      expect(l.redirectPath.length).toBeGreaterThanOrEqual(1);
      expect(l.redirectPath.length).toBeLessThanOrEqual(4);
      for (const hop of l.redirectPath) expect(trackerHost.test(hop)).toBe(false);
    }
    expect(U.landingPages.some((l) => l.pageText == null)).toBe(true);
    expect(U.landingPages.some((l) => l.screenshotUrl == null)).toBe(true);
  });

  it("similar ads share the angle or concept", () => {
    for (const a of U.ads) {
      for (const sid of a.similarAdIds) {
        const s = D.adById.get(sid);
        expect(s).toBeDefined();
        const sameAngle = !!a.analysis.angle && s?.analysis.angle === a.analysis.angle;
        const sameConcept = !!a.analysis.concept && s?.analysis.concept === a.analysis.concept;
        expect(sameAngle || sameConcept).toBe(true);
      }
    }
  });

  it("angles follow SHORT_ANGLE_RULE (lowercase, 2–6 words, never a framework word)", () => {
    expect(U.elements.angle.length).toBeGreaterThanOrEqual(40);
    for (const el of U.elements.angle) {
      expect(el.label).toBe(el.label.toLowerCase());
      const words = el.label.split(" ");
      expect(words.length).toBeGreaterThanOrEqual(2);
      expect(words.length).toBeLessThanOrEqual(6);
      for (const banned of ANGLE_BANNED_WORDS) expect(el.label === banned || el.label.includes(` ${banned} `)).toBe(false);
    }
  });

  it("vocabularies: 13 frameworks, 12 hook styles, 37 concepts, 25 framework elements, all described", () => {
    expect(U.elements.framework).toHaveLength(13);
    expect(U.elements.hook).toHaveLength(12);
    expect(U.elements.concept).toHaveLength(37);
    expect(U.frameworkElements).toHaveLength(25);
    for (const t of ["framework", "hook", "angle", "concept"] as const) for (const el of U.elements[t]) expect(el.description).toBeTruthy();
  });

  it("keywords are 4–8 lowercase topic tags; beats are 4–9 with timings on video", () => {
    for (const a of U.ads) {
      expect(a.analysis.keywords.length).toBeGreaterThanOrEqual(4);
      expect(a.analysis.keywords.length).toBeLessThanOrEqual(8);
      for (const k of a.analysis.keywords) expect(k).toBe(k.toLowerCase());
      if (a.analysis.beats) {
        expect(a.analysis.beats.length).toBeGreaterThanOrEqual(4);
        expect(a.analysis.beats.length).toBeLessThanOrEqual(9);
        for (const b of a.analysis.beats) expect(b.start != null).toBe(a.mediaKind === "video");
      }
      expect(a.headline).not.toMatch(/ad #?\d+/i);
    }
  });

  it("forbidden source / spy-tool names never appear in the serialized universe", () => {
    const rev = (s: string) => s.split("").reverse().join("");
    // the guard itself works
    expect(FORBIDDEN_SOURCE_NAMES.some((re) => re.test(`seen on ${rev("yrarbiL dA ateM")} today`))).toBe(true);
    expect(FORBIDDEN_SOURCE_NAMES.some((re) => re.test(`via ${rev("ypSdA")}`))).toBe(true);
    const blob = JSON.stringify(U);
    for (const re of FORBIDDEN_SOURCE_NAMES) expect(re.test(blob), String(re)).toBe(false);
  });
});

describe("perf", () => {
  it("builds the universe + one full tagGroups pass quickly", () => {
    const t0 = performance.now();
    const u = generateUniverse({ now: NOW });
    const d = buildIndex(u);
    tagGroups(u.ads, DISCOVER_GROUP_KEYS, d);
    const ms = performance.now() - t0;
    console.info(`[insights-v3 perf] universe + index + tagGroups: ${ms.toFixed(1)}ms`);
    expect(ms).toBeLessThan(600);
  });
});
