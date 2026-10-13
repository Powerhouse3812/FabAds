import { describe, expect, it } from "vitest";
import type { Ad, AiScorePart, AiScorePartKey } from "@/lib/insights-v3/types";
import { D, NOW, U, makeAd } from "@/lib/insights-v3/selectors/fixtures.test-util";
import { MAX_ACTIONS, deriveAiScoreActions } from "./scoreActionsModel";

const LABEL: Record<string, string> = { longevity: "Longevity", clones: "Clones", craft: "Performance craft", "branded-penalty": "Branded penalty" };
const part = (key: AiScorePartKey, value: number, max: number, reason = "reason"): AiScorePart => ({
  key,
  label: LABEL[key],
  value,
  max,
  available: true,
  reason,
  examples: [],
});

// An ad with a hook, angle and framework, in an industry that has winners to recommend.
const BASE = U.ads.find((a) => a.analysis.angle && a.analysis.hookStyle && a.analysis.framework && a.analysis.hookText) as Ad;
const scored = (parts: AiScorePart[], over: Partial<Ad> = {}) =>
  makeAd({ ...over, aiScore: { ...BASE.aiScore, parts } }, BASE);
const run = (ad: Ad) => deriveAiScoreActions(ad, { now: NOW, data: D });
const GOOD = [part("longevity", 20, 21.4), part("clones", 15, 19), part("craft", 40, 50), part("branded-penalty", 0, 0)];

describe("AI score actions", () => {
  it("nothing weak → one positive row with no replacement elements", () => {
    const a = run(scored(GOOD));
    expect(a).toHaveLength(1);
    expect(a[0].key).toBe("strong");
    expect(a[0].problem).toMatch(/^No weak spot/);
    expect(a[0].elements).toEqual([]);
  });

  it("weak longevity cites the part and the run length, and swaps the angle or hook", () => {
    const ad = scored([part("longevity", 4, 21.4), ...GOOD.slice(1)], { daysLive: 6 });
    const [row, ...rest] = run(ad);
    expect(rest).toEqual([]);
    expect(row.key).toBe("longevity");
    expect(row.problem).toBe("Longevity is 4 / 21.4: it ran 6 days");
    expect(row.elements.length).toBeGreaterThan(0);
    expect(row.elements.length).toBeLessThanOrEqual(2);
    for (const e of row.elements) {
      expect(["angle", "hook"]).toContain(e.type);
      expect(row.suggestion).toContain(`“${e.label}”`);
    }
  });

  it("never suggests the element the ad already uses", () => {
    const ad = scored([part("longevity", 1, 21.4), part("clones", 1, 19), part("craft", 1, 50), part("branded-penalty", -12, 0)]);
    const own = new Set([`angle:${ad.analysis.angle}`, `hook:${ad.analysis.hookStyle}`, `framework:${ad.analysis.framework}`]);
    for (const row of run(ad)) for (const e of row.elements) expect(own.has(`${e.type}:${e.id}`)).toBe(false);
  });

  it("weak clones → a framework; weak craft and a negative penalty → hook styles", () => {
    expect(run(scored([GOOD[0], part("clones", 0, 19), GOOD[2], GOOD[3]]))[0].elements.every((e) => e.type === "framework")).toBe(true);
    expect(run(scored([GOOD[0], GOOD[1], part("craft", 5, 50, "thin direct-response signals"), GOOD[3]]))[0].elements.every((e) => e.type === "hook")).toBe(true);
    const pen = run(scored([GOOD[0], GOOD[1], GOOD[2], part("branded-penalty", -12, 0, "branded ad: no offer, urgency, hook or CTA")]))[0];
    expect(pen.key).toBe("branded-penalty");
    expect(pen.problem).toBe("Branded penalty is −12: it has no offer, urgency, hook or CTA");
    expect(pen.elements.every((e) => e.type === "hook")).toBe(true);
  });

  it("a zero penalty is not a weak spot", () => {
    expect(run(scored(GOOD)).map((r) => r.key)).not.toContain("branded-penalty");
  });

  it("worst first, capped at 3, and no element is offered twice", () => {
    const ad = scored([part("longevity", 10, 21.4), part("clones", 1, 19), part("craft", 5, 50), part("branded-penalty", -6, 0)]);
    const rows = run(ad);
    expect(rows.map((r) => r.key)).toEqual(["clones", "craft", "branded-penalty"]);
    expect(rows.length).toBeLessThanOrEqual(MAX_ACTIONS);
    const ids = rows.flatMap((r) => r.elements.map((e) => `${e.type}:${e.id}`));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("is deterministic and skips parts that are not available", () => {
    const parts = [part("longevity", 1, 21.4), { ...part("clones", 0, 0), available: false }, GOOD[2], GOOD[3]];
    const ad = scored(parts);
    expect(run(ad)).toEqual(run(ad));
    expect(run(ad).map((r) => r.key)).toEqual(["longevity"]);
  });

  it("an unknown run length is missing data, not a weak angle: no longevity row", () => {
    const ad = scored([part("longevity", 0, 21.4), ...GOOD.slice(1)], { daysLive: null });
    expect(run(ad).map((r) => r.key)).toEqual(["strong"]);
  });
});
