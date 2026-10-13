import { describe, expect, it } from "vitest";
import { DEFAULT_SCOPE } from "../types";
import type { AiSummary, ElementType } from "../types";
import {
  FORBIDDEN_SUMMARY_PATTERNS, adsInScope, advertiserDetail, aiSummary, elementDetail, elementKpis, landingPageDetail, offerDetail, scopeLabel,
} from "./index";
import { D, NOW, U } from "./fixtures.test-util";

const ctx = { now: NOW, data: D, lastVisitAt: NOW - 2 * 86_400_000 };
const TYPES: ElementType[] = ["framework", "hook", "angle", "concept"];

function collect(): AiSummary[] {
  const out: AiSummary[] = [];
  const scopes = [
    DEFAULT_SCOPE,
    ...U.industries.map((i) => ({ ...DEFAULT_SCOPE, industry: i.id })),
    { ...DEFAULT_SCOPE, period: "7d" as const },
    { ...DEFAULT_SCOPE, industry: "search-arb", category: "native", period: "14d" as const },
    { ...DEFAULT_SCOPE, industry: "vsl", category: "vision" },
  ];
  for (const scope of scopes) {
    const ads = adsInScope(U.ads, scope, ctx);
    out.push(aiSummary({ kind: "scope", ads, scopeLabel: scopeLabel(scope, D) }, D));
    out.push(aiSummary({ kind: "my-feeds", ads }, D));
    out.push(aiSummary({ kind: "advertiser-list", advertiserKind: "page", ads }, D));
    out.push(aiSummary({ kind: "advertiser-list", advertiserKind: "domain", ads }, D));
    out.push(aiSummary({ kind: "landing-page-list", ads }, D));
    for (const t of TYPES) out.push(aiSummary({ kind: "element-list", elementType: t, ads }, D));
  }
  for (const adv of U.advertisers) {
    const d = advertiserDetail(adv.kind, adv.id, U.ads, DEFAULT_SCOPE, ctx);
    if (d) out.push(d.summary);
  }
  for (const t of TYPES) {
    for (const el of U.elements[t]) {
      const d = elementDetail(t, el.id, U.ads, DEFAULT_SCOPE, ctx);
      if (d) out.push(d.summary);
    }
  }
  for (const lp of U.landingPages) {
    const d = landingPageDetail(lp.id, U.ads, DEFAULT_SCOPE, ctx);
    if (d) out.push(d.summary);
  }
  for (const o of D.offers) {
    const d = offerDetail(o.id, U.ads, DEFAULT_SCOPE, ctx);
    if (d) out.push(d.summary);
  }
  return out;
}

const ALL = collect();

describe("AI summaries", () => {
  it("covers every page, overlay and list kind", () => {
    expect(ALL.length).toBeGreaterThan(500);
  });

  it("never present the most common item as the best (no 'best' / 'top-performing' / 'works best')", () => {
    for (const s of ALL) {
      for (const re of FORBIDDEN_SUMMARY_PATTERNS) expect(re.test(s.text), `${re} in: ${s.text}`).toBe(false);
    }
    // KPI copy is user-facing AI-adjacent text too
    for (const t of TYPES) {
      for (const k of elementKpis(t, U.ads, DEFAULT_SCOPE, ctx)) {
        for (const re of FORBIDDEN_SUMMARY_PATTERNS) expect(re.test(`${k.label} ${k.sub ?? ""} ${k.tooltip}`)).toBe(false);
      }
    }
  });

  it("every summary states its basis and the count matches", () => {
    for (const s of ALL) {
      if (s.ads === 0) {
        expect(s.text).toMatch(/nothing to summarise/);
        continue;
      }
      const m = /^Based on ([\d.,]+K?) ads?\b/.exec(s.text);
      expect(m, s.text).not.toBeNull();
      if (m && !m[1].endsWith("K")) expect(Number(m[1].replace(/,/g, ""))).toBe(s.ads);
    }
  });

  it("empty scope gives an honest empty summary with basedOn 0", () => {
    const s = aiSummary({ kind: "scope", ads: [] }, D);
    expect(s.ads).toBe(0);
    expect(s.text).toMatch(/nothing to summarise/);
  });
});
