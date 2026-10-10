/** Tests for the QA fix round (QA-03, 04, 06, 10, 13, 18, 20). */
import { describe, expect, it } from "vitest";
import { DEFAULT_SCOPE } from "../types";
import type { TagGroupKey } from "../types";
import {
  DISCOVER_GROUP_KEYS, LANDING_PAGE_GROUP_KEYS, adsInScope, advertiserDetail, advertiserKpiBase, advertiserKpis, aiSummary,
  discoverKpis, elementKpis, filterByTagUnion, landingPageKpis, normalizeTagId, sanitizeSelectedTags, selectedChips, tagGroups,
  tagLabel, unionTotal,
} from "./index";
import { D, DAY, NOW, U } from "./fixtures.test-util";

const ctx = { now: NOW, data: D, lastVisitAt: NOW - 2 * DAY };
const scoped = adsInScope(U.ads, DEFAULT_SCOPE, ctx);

describe("QA-03 tag groups disclose ads with no value", () => {
  const keys: TagGroupKey[] = [...new Set([...DISCOVER_GROUP_KEYS, ...LANDING_PAGE_GROUP_KEYS])];
  const groups = tagGroups(scoped, keys, D);
  const g = (k: TagGroupKey) => groups.find((x) => x.key === k)!;

  it("missing = scoped ads with no value in that group", () => {
    expect(g("country").missing).toBe(scoped.filter((a) => a.countries.length === 0).length);
    expect(g("country").missing).toBeGreaterThan(0);
    expect(g("landingPage").missing).toBe(scoped.filter((a) => !a.landingPageId).length);
    expect(g("framework").missing).toBe(scoped.filter((a) => !a.analysis.framework).length);
    expect(g("hookStyle").missing).toBe(scoped.filter((a) => !a.analysis.hookStyle).length);
    expect(g("angle").missing).toBe(scoped.filter((a) => !a.analysis.angle).length);
    expect(g("concept").missing).toBe(scoped.filter((a) => !a.analysis.concept).length);
    expect(g("advertiser").missing).toBe(scoped.filter((a) => !a.domainAdvertiserId).length);
    for (const k of ["offerDomain", "funnelType"] as TagGroupKey[]) expect(g(k).missing).toBeGreaterThan(0);
    expect(g("category").missing).toBe(0);
  });

  it("options count + missing covers every ad for single-valued groups", () => {
    for (const k of ["framework", "hookStyle", "category"] as TagGroupKey[]) {
      expect(g(k).options.reduce((s, o) => s + o.count, 0) + (g(k).missing ?? 0)).toBe(scoped.length);
    }
  });
});

describe("QA-04 KPI values and subs stay short; full text goes in the tooltip", () => {
  const el = elementKpis("hook", U.ads, DEFAULT_SCOPE, ctx);
  const k = (key: string) => el.find((x) => x.key === key)!;

  it("video vs image is compact, full split in sub + tooltip", () => {
    const v = k("videoVsImage");
    expect(v.display).toMatch(/^\d+ \/ \d+%$/);
    expect(v.sub).toMatch(/% video · \d+% image · \d+% carousel$/);
    expect(v.tooltip).toMatch(/% video, \d+% image, \d+% carousel/);
  });

  it("item names stay as the value, with the full name in the tooltip", () => {
    expect(k("fastestRising").tooltip).toContain(k("fastestRising").display);
    expect(k("topItem").tooltip).toContain(k("topItem").display);
  });

  it("comparison subs use the short form", () => {
    const total = discoverKpis(U.ads, DEFAULT_SCOPE, ctx).find((x) => x.key === "total")!;
    expect(total.sub).toMatch(/^(\+|-)?\d+% vs prev\. 30d$|^New this period$|^No change$/);
    expect(total.tooltip).toMatch(/the 30 days before/);
    const all = [
      ...discoverKpis(U.ads, DEFAULT_SCOPE, ctx),
      ...el,
      ...advertiserKpis("page", U.ads, DEFAULT_SCOPE, ctx),
      ...landingPageKpis(U.ads, DEFAULT_SCOPE, ctx),
    ];
    for (const x of all) expect((x.sub ?? "").length, `${x.key}: ${x.sub}`).toBeLessThanOrEqual(40);
  });
});

describe("QA-06 advertiser summary states the winner fact once", () => {
  it("never repeats the Winner rule sentence", () => {
    for (const adv of U.advertisers) {
      const d = advertiserDetail(adv.kind, adv.id, U.ads, DEFAULT_SCOPE, ctx);
      if (!d) continue;
      expect((d.summary.text.match(/Winner rule/g) ?? []).length, d.summary.text).toBeLessThanOrEqual(1);
    }
    for (const s of [aiSummary({ kind: "scope", ads: scoped }, D), aiSummary({ kind: "scope", ads: scoped.slice(0, 3) }, D)]) {
      expect((s.text.match(/Winner rule/g) ?? []).length).toBeLessThanOrEqual(1);
    }
  });
});

describe("QA-10 invalid / miscased tag ids are normalised or ignored", () => {
  it("country ids are case-insensitive", () => {
    expect(normalizeTagId("country", "fr", D)).toBe("FR");
    expect(tagLabel("country", "fr", D)).toBe("France");
    expect(unionTotal(scoped, { country: ["fr"] }, D)).toBe(unionTotal(scoped, { country: ["FR"] }, D));
    expect(unionTotal(scoped, { country: ["fr"] }, D)).toBeGreaterThan(0);
  });

  it("unknown ids are dropped; an all-invalid selection means no filter", () => {
    expect(normalizeTagId("hookStyle", "not-a-hook", D)).toBeNull();
    expect(normalizeTagId("hookStyle", "CALLOUT", D)).toBe("callout");
    expect(filterByTagUnion(scoped, { country: ["zz"], hookStyle: ["nope"] }, D)).toBe(scoped);
    expect(selectedChips({ country: ["fr", "zz"] }, D)).toEqual([{ key: "country", groupLabel: "Country", id: "FR", label: "France" }]);
  });

  it("sanitizeSelectedTags normalises, dedupes, and can restrict to a page's groups", () => {
    expect(sanitizeSelectedTags({ country: ["fr", "FR", "zz"], framework: ["PAS"], bogus: ["x"] } as never, undefined, D)).toEqual({
      country: ["FR"],
      framework: ["pas"],
    });
    expect(sanitizeSelectedTags({ country: ["FR"], funnelType: ["quiz"] }, ["country"], D)).toEqual({ country: ["FR"] });
    const vsl = adsInScope(U.ads, { ...DEFAULT_SCOPE, industry: "search-arb" }, ctx);
    const groups = tagGroups(vsl, ["country"], D);
    const absent = Object.keys({ JP: 1, KR: 1 }).find((c) => !groups[0].options.some((o) => o.id === c));
    if (absent) expect(sanitizeSelectedTags({ country: [absent.toLowerCase()] }, groups, D)).toEqual({});
  });
});

describe("QA-13 Domain tab KPI base matches the overview base", () => {
  it("sub says how many ads have a domain; basedOn helper agrees", () => {
    const base = advertiserKpiBase("domain", U.ads, DEFAULT_SCOPE, ctx);
    const withDomain = scoped.filter((a) => a.domainAdvertiserId).length;
    expect(base).toEqual({ basedOn: withDomain, scoped: scoped.length });
    expect(withDomain).toBeLessThan(scoped.length);
    const total = advertiserKpis("domain", U.ads, DEFAULT_SCOPE, ctx).find((k) => k.key === "total")!;
    expect(total.sub).toBe(`${withDomain} of ${scoped.length} ads have a domain`);
    expect(advertiserKpiBase("page", U.ads, DEFAULT_SCOPE, ctx).basedOn).toBe(scoped.length);
  });
});

describe("QA-18 + QA-20 vocabulary and data consistency", () => {
  it("hook style and concept use the same 'Before / after' spelling", () => {
    expect(D.elementById.hook.get("before-after")?.label).toBe("Before / after");
    expect(D.elementById.concept.get("before-after")?.label).toBe("Before / after");
  });

  it("no country → no transparency regions", () => {
    for (const a of U.ads) if (a.countries.length === 0) expect(a.transparencyRegions).toEqual([]);
    expect(U.ads.some((a) => a.transparencyRegions.length > 0)).toBe(true);
  });

  it("ads first seen in the last 48h started on or before first seen, within 3 days", () => {
    const fresh = U.ads.filter((a) => NOW - Date.parse(a.firstSeenAt) < 48 * 3_600_000);
    expect(fresh).toHaveLength(25);
    for (const a of fresh) {
      if (a.startedAt == null) continue;
      const lag = Date.parse(a.firstSeenAt) - Date.parse(a.startedAt);
      expect(lag).toBeGreaterThanOrEqual(0);
      expect(lag).toBeLessThanOrEqual(3 * DAY);
      expect(a.daysLive ?? 0).toBeLessThanOrEqual(6);
    }
  });
});
