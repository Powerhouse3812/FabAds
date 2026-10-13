import { describe, expect, it } from "vitest";
import { ALL, DEFAULT_SCOPE } from "../types";
import type { Scope, TagGroupKey } from "../types";
import {
  ADVERTISER_GROUP_KEYS, DISCOVER_GROUP_KEYS, LANDING_PAGE_GROUP_KEYS, adTagIds, adsInScope, categoryOptions,
  elementGroupKeys, filterByTagUnion, filterListByTagUnion, groupKeysForScope, industryOptions, tagGroups, unionTotal,
} from "./index";
import { D, NOW, U } from "./fixtures.test-util";

const scoped = (scope: Scope) => adsInScope(U.ads, scope, { now: NOW });
const ALL_ADS = scoped(DEFAULT_SCOPE);
const ALL_KEYS: TagGroupKey[] = [...new Set([...DISCOVER_GROUP_KEYS, ...LANDING_PAGE_GROUP_KEYS])];

function idsWith(key: TagGroupKey, id: string) {
  return new Set(ALL_ADS.filter((a) => adTagIds(a, key, D).includes(id)).map((a) => a.id));
}

describe("union filter — totals", () => {
  const groups = tagGroups(ALL_ADS, DISCOVER_GROUP_KEYS, D);
  const opt = (key: TagGroupKey, i: number) => groups.find((g) => g.key === key)!.options[i];

  it("no selection (or only empty arrays) = all ads, same array back", () => {
    expect(filterByTagUnion(ALL_ADS, {}, D)).toBe(ALL_ADS);
    expect(filterByTagUnion(ALL_ADS, { hookStyle: [], angle: [] }, D)).toBe(ALL_ADS);
    expect(unionTotal(ALL_ADS, undefined, D)).toBe(ALL_ADS.length);
  });

  it("within a group: total = ads matching any selected tag", () => {
    const a = opt("hookStyle", 0);
    const b = opt("hookStyle", 1);
    // hook style is single-valued, so the union is the plain sum
    expect(unionTotal(ALL_ADS, { hookStyle: [a.id, b.id] }, D)).toBe(a.count + b.count);
  });

  it("within a multi-valued group each ad is counted once", () => {
    const a = opt("frameworkElement", 0);
    const b = opt("frameworkElement", 1);
    const expected = new Set([...idsWith("frameworkElement", a.id), ...idsWith("frameworkElement", b.id)]).size;
    expect(unionTotal(ALL_ADS, { frameworkElement: [a.id, b.id] }, D)).toBe(expected);
    expect(expected).toBeLessThan(a.count + b.count);
  });

  it("across groups: union (OR), each ad once", () => {
    const fw = opt("framework", 0);
    const hook = opt("hookStyle", 0);
    const country = opt("country", 0);
    const expected = new Set([...idsWith("framework", fw.id), ...idsWith("hookStyle", hook.id), ...idsWith("country", country.id)]);
    const result = filterByTagUnion(ALL_ADS, { framework: [fw.id], hookStyle: [hook.id], country: [country.id] }, D);
    expect(result.length).toBe(expected.size);
    expect(new Set(result.map((a) => a.id)).size).toBe(result.length);
    expect(result.length).toBeGreaterThanOrEqual(Math.max(fw.count, hook.count, country.count));
  });

  it("selecting tags never changes any tag's count", () => {
    const before = JSON.stringify(tagGroups(ALL_ADS, ALL_KEYS, D));
    const selected = { hookStyle: [opt("hookStyle", 0).id], framework: [opt("framework", 2).id], category: [opt("category", 0).id] };
    const filtered = filterByTagUnion(ALL_ADS, selected, D);
    expect(filtered.length).toBeLessThan(ALL_ADS.length);
    // counts are computed on the scoped ads, never on the filtered list
    expect(JSON.stringify(tagGroups(ALL_ADS, ALL_KEYS, D))).toBe(before);
  });

  it("lists keep an item when ≥1 of its ads matches", () => {
    const fw = opt("framework", 0);
    const pages = Array.from(new Set(ALL_ADS.map((a) => a.pageAdvertiserId)));
    const adsOf = (pid: string) => ALL_ADS.filter((a) => a.pageAdvertiserId === pid);
    const kept = filterListByTagUnion(pages, adsOf, { framework: [fw.id] }, D);
    for (const pid of pages) expect(kept.includes(pid)).toBe(adsOf(pid).some((a) => a.analysis.framework === fw.id));
    expect(filterListByTagUnion(pages, adsOf, {}, D)).toBe(pages);
  });
});

describe("tag groups — counts per scope + 0-count options", () => {
  it("closed vocabularies list every option, including 0-count ones", () => {
    const tiny = scoped({ ...DEFAULT_SCOPE, industry: "search-arb", period: "30d" });
    const groups = tagGroups(tiny, [...DISCOVER_GROUP_KEYS, "funnelType"], D);
    const size = (k: TagGroupKey) => groups.find((g) => g.key === k)!.options.length;
    expect(size("framework")).toBe(13);
    expect(size("hookStyle")).toBe(12);
    expect(size("concept")).toBe(37);
    expect(size("frameworkElement")).toBe(25);
    expect(size("funnelType")).toBe(5);
    expect(size("category")).toBe(U.categories.length);
    const cat = groups.find((g) => g.key === "category")!;
    expect(cat.options.some((o) => o.count === 0)).toBe(true);
    // options are count desc
    for (const g of groups) for (let i = 1; i < g.options.length; i++) expect(g.options[i - 1].count).toBeGreaterThanOrEqual(g.options[i].count);
  });

  it("counts follow industry, category and period", () => {
    const leadGen = scoped({ ...DEFAULT_SCOPE, industry: "lead-gen" });
    const cats = tagGroups(leadGen, ["category"], D)[0].options;
    expect(cats.reduce((s, o) => s + o.count, 0)).toBe(leadGen.length);
    expect(leadGen.every((a) => a.industryId === "lead-gen")).toBe(true);

    const medicare = scoped({ ...DEFAULT_SCOPE, industry: "lead-gen", category: "medicare" });
    expect(medicare.every((a) => a.categoryId === "medicare")).toBe(true);
    expect(cats.find((o) => o.id === "medicare")!.count).toBe(medicare.length);

    const week = scoped({ ...DEFAULT_SCOPE, period: "7d" });
    expect(week.length).toBeLessThan(ALL_ADS.length);
    expect(week.length).toBeGreaterThan(0);
  });

  it("industry + category dropdown options carry counts; categories are global A–Z", () => {
    const inds = industryOptions(U.ads, DEFAULT_SCOPE, { now: NOW }, D);
    expect(inds[0]).toMatchObject({ id: ALL, count: U.ads.length });
    expect(inds.slice(1).reduce((s, o) => s + o.count, 0)).toBe(U.ads.length);
    const cats = categoryOptions(U.ads, { ...DEFAULT_SCOPE, industry: "search-arb" }, { now: NOW }, D);
    expect(cats).toHaveLength(U.categories.length + 1);
    expect(cats.filter((o) => o.id !== ALL && o.count > 0).length).toBeLessThanOrEqual(5);
  });

  it("country counts don't sum to the total (missing countries are a known gap)", () => {
    const countries = tagGroups(ALL_ADS, ["country"], D)[0].options;
    const withCountry = ALL_ADS.filter((a) => a.countries.length > 0).length;
    expect(withCountry).toBeLessThan(ALL_ADS.length);
    expect(countries.find((o) => o.id === "US")!.count).toBeLessThanOrEqual(withCountry);
  });

  it("group key helpers follow the spec", () => {
    expect(DISCOVER_GROUP_KEYS).toHaveLength(11);
    expect(ADVERTISER_GROUP_KEYS).toEqual(["hookStyle", "angle", "framework", "concept", "cta", "country", "category"]);
    expect(LANDING_PAGE_GROUP_KEYS).toEqual(["funnelType", "offerDomain", "hookStyle", "framework", "concept", "country", "cta"]);
    expect(elementGroupKeys("hook")).not.toContain("hookStyle");
    expect(elementGroupKeys("framework")).not.toContain("framework");
    expect(elementGroupKeys("framework")).toHaveLength(10);
    expect(groupKeysForScope(DISCOVER_GROUP_KEYS, { ...DEFAULT_SCOPE, category: "medicare" })).not.toContain("category");
    expect(groupKeysForScope(DISCOVER_GROUP_KEYS, DEFAULT_SCOPE)).toContain("category");
  });
});
