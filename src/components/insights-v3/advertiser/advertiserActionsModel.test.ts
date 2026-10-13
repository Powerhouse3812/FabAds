import { describe, expect, it } from "vitest";
import { ALL } from "@/lib/insights-v3/types";
import type { Ad, Scope } from "@/lib/insights-v3/types";
import { adsInScope, advertiserDetail } from "@/lib/insights-v3/selectors";
import type { AdvertiserDetail } from "@/lib/insights-v3/selectors";
import { D, NOW, U, makeAd } from "@/lib/insights-v3/selectors/fixtures.test-util";
import { MAX_ADVERTISER_ACTIONS, NOTHING_TO_SUGGEST, deriveAdvertiserActions } from "./advertiserActionsModel";

const ctx = { now: NOW, data: D };
const SCOPE: Scope = { industry: ALL, category: ALL, period: "all", myPrefsOnly: false };

// The domain with the most ads: plenty of winners, angles, hooks and frameworks.
const DOMAIN = D.advertisers.filter((a) => a.kind === "domain").sort((a, b) => U.ads.filter((x) => x.domainAdvertiserId === b.id).length - U.ads.filter((x) => x.domainAdvertiserId === a.id).length)[0];
const OWN: Ad[] = adsInScope(U.ads, SCOPE, ctx).filter((a) => a.domainAdvertiserId === DOMAIN.id);
const DETAIL = advertiserDetail("domain", DOMAIN.id, U.ads, SCOPE, ctx) as AdvertiserDetail;
const run = (detail: AdvertiserDetail, ads: Ad[]) => deriveAdvertiserActions(detail, ads, { data: D });
const calm = (over: Partial<AdvertiserDetail> = {}): AdvertiserDetail => ({ ...DETAIL, isRising: false, isScaling: false, ...over });

describe("competitor suggested actions", () => {
  it("returns 1 to 3 rows, each with a real sentence and a Genie target", () => {
    const rows = run(DETAIL, OWN);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThanOrEqual(MAX_ADVERTISER_ACTIONS);
    for (const r of rows) {
      expect(r.seen.length).toBeGreaterThan(10);
      expect(r.suggestion.length).toBeGreaterThan(10);
      expect(r.cta).not.toBeNull();
    }
  });

  it("without rising or scaling: element, winner, longest in that order", () => {
    const rows = run(calm(), OWN);
    expect(rows.map((r) => r.key).filter((k) => k !== "winner" && k !== "longest")).toEqual(["element"]);
    expect(rows[0].key).toBe("element");
  });

  it("the element row cites the top item's count and basedOn, and hands that element to Genie", () => {
    const rows = run(calm(), OWN);
    const el = rows.find((r) => r.key === "element");
    expect(el).toBeDefined();
    const cta = el!.cta!;
    expect(["angle", "hook", "framework"]).toContain(cta.target.type);
    const block = { angle: DETAIL.angles, hook: DETAIL.hooks, framework: DETAIL.frameworks }[cta.target.type as "angle" | "hook" | "framework"];
    const item = block.items.find((i) => i.id === cta.target.id)!;
    expect(el!.seen).toContain(`“${item.label}”`);
    expect(el!.seen).toContain(`${item.count} of ${block.basedOn} ad`);
    expect(cta.label).toBe(`Try “${item.label}” in Genie`);
    // the top element has the highest count of the three tops
    const tops = [DETAIL.angles, DETAIL.hooks, DETAIL.frameworks].map((b) => b.items.find((i) => i.id !== "other")?.count ?? 0);
    expect(item.count).toBe(Math.max(...tops));
  });

  it("winner row points at the first winner; merges with the longest run into one row with a variation button", () => {
    const winnerId = DETAIL.winners.adIds[0];
    const base = run(calm(), OWN);
    const w = base.find((r) => r.key === "winner");
    expect(w?.cta?.target).toEqual({ type: "ad", id: winnerId });
    expect(w?.cta?.label).toBe("Use their winner as a reference");
    if (DETAIL.longestRunning.adIds[0] === winnerId) {
      expect(base.some((r) => r.key === "longest")).toBe(false);
      expect(w?.secondary).toMatchObject({ target: { type: "ad", id: winnerId }, action: "generate-variation" });
    }
  });

  it("longest-running ad gets a generate-variation CTA when it is not the winner", () => {
    const winnerId = DETAIL.winners.adIds[0];
    const other = OWN.filter((a) => a.id !== winnerId && a.daysLive != null).sort((a, b) => (b.daysLive as number) - (a.daysLive as number))[0];
    const longest = makeAd({ id: "x-longest", daysLive: (other.daysLive as number) + 500 }, other);
    const detail = calm({ longestRunning: { basedOn: 1, adIds: [longest.id] } });
    const rows = run(detail, [...OWN, longest]);
    const row = rows.find((r) => r.key === "longest");
    expect(row?.cta).toMatchObject({ target: { type: "ad", id: longest.id }, action: "generate-variation", label: "Create a variation" });
    expect(row?.seen).toContain(`${longest.daysLive} days`);
  });

  it("rising or scaling adds a first row aimed at the newest ad, and the list stays at 3", () => {
    const newest = OWN.slice().sort((a, b) => (Date.parse(b.startedAt ?? b.firstSeenAt) - Date.parse(a.startedAt ?? a.firstSeenAt)) || (a.id < b.id ? -1 : 1))[0];
    const rows = run(calm({ isRising: true, changePct: 40 }), OWN);
    expect(rows).toHaveLength(MAX_ADVERTISER_ACTIONS);
    expect(rows[0].key).toBe("rising");
    expect(rows[0].seen).toContain("+40%");
    expect(rows[0].cta?.target).toEqual({ type: "ad", id: newest.id });
    expect(run(calm({ isScaling: true }), OWN)[0].key).toBe("rising");
  });

  it("a rising competitor that is new (no previous period) says so instead of a percentage", () => {
    const rows = run(calm({ isRising: true, changePct: null }), OWN);
    expect(rows[0].seen).toMatch(/no new ads in the previous period/);
  });

  it("nothing qualifies → one muted row with no CTA", () => {
    const empty: AdvertiserDetail = {
      ...DETAIL,
      isRising: false,
      isScaling: false,
      angles: { basedOn: 0, items: [] },
      hooks: { basedOn: 0, items: [] },
      frameworks: { basedOn: 0, items: [] },
      winners: { basedOn: 0, adIds: [] },
      longestRunning: { basedOn: 0, adIds: [] },
    };
    expect(run(empty, [])).toEqual([NOTHING_TO_SUGGEST]);
    expect(NOTHING_TO_SUGGEST.cta).toBeNull();
  });

  it("never offers the catch-all 'other' bucket or a hook style no ad quotes", () => {
    const quoteless = OWN.map((a) => makeAd({ analysis: { ...a.analysis, hookText: null } }, a));
    const detail = calm({
      angles: { basedOn: 0, items: [] },
      frameworks: { basedOn: 0, items: [] },
      hooks: { basedOn: 5, items: [{ id: "other", label: "Other", count: 3, sharePct: 60 }, { id: "x", label: "X", count: 2, sharePct: 40 }] },
      winners: { basedOn: 0, adIds: [] },
      longestRunning: { basedOn: 0, adIds: [] },
    });
    expect(run(detail, quoteless)).toEqual([NOTHING_TO_SUGGEST]);
  });
});
