import { describe, expect, it } from "vitest";
import type { ScoreInput } from "./score";
import { RECOVERED_SHARE, curve, redistributionFactor, scoreAd, scoreTier } from "./score";
import { generateUniverse } from "./generate";

const strongCopy: ScoreInput = {
  daysLive: 400,
  likes: null,
  comments: null,
  shares: null,
  clones: null,
  mediaKind: "video",
  hasVideo: true,
  headline: "Warning: the shocking truth about stubborn belly fat",
  primaryText:
    "Why are so many women over 40 switching? Over 12,000 customers rated it. Get 50% off today only, limited stock, free shipping. " +
    "Doctors found the hidden cause. Click the link below before it ends. ".repeat(4),
  transcript:
    "Why are so many women over 40 switching to this? I was tired of the pain for years until my doctor showed me this. " +
    "I struggled because nothing worked. Then I finally discovered the real cause. ".repeat(5) +
    "Click the link below to order now.",
  ctaLabel: "Learn More",
  frameworkElements: ["hook", "pain", "agitation", "story", "mechanism", "social_proof", "offer", "urgency", "cta"],
  hookText: "Warning: the shocking truth about stubborn belly fat",
  landing: {
    url: "https://healthnews24.info/article/belly-fat?affid=12",
    domain: "healthnews24.info",
    finalUrl: "https://healthnews24.info/article/belly-fat",
    offerDomain: "officialvitaorder.com",
    offerUrl: "https://officialvitaorder.com/order",
    redirectHops: 3,
    pageText: "This is an advertisement. We may earn a commission. ".repeat(10),
  },
};

describe("AI score — curve + tiers", () => {
  it("curve is a log curve capped at max, 0 for v ≤ 0", () => {
    expect(curve(0, 120, 18)).toBe(0);
    expect(curve(-5, 120, 18)).toBe(0);
    expect(curve(120, 120, 18)).toBe(18);
    expect(curve(10_000, 120, 18)).toBe(18);
    expect(curve(10, 120, 18)).toBeCloseTo(9, 0);
  });

  it("tiers: Elite ≥80, Strong ≥60, Average ≥40, Weak <40", () => {
    expect(scoreTier(100)).toBe("elite");
    expect(scoreTier(80)).toBe("elite");
    expect(scoreTier(79)).toBe("strong");
    expect(scoreTier(60)).toBe("strong");
    expect(scoreTier(59)).toBe("average");
    expect(scoreTier(40)).toBe("average");
    expect(scoreTier(39)).toBe("weak");
    expect(scoreTier(1)).toBe("weak");
  });
});

describe("AI score — missing-data redistribution (RECOVERED_SHARE 0.6)", () => {
  it("full reference weights (engagement included) → ×1.0", () => {
    expect(RECOVERED_SHARE).toBe(0.6);
    expect(redistributionFactor(100)).toBe(1);
  });

  it("only longevity + craft (no clone data) → ×1.4 (longevity max 25.2, craft max 58.8), capped at 84", () => {
    expect(redistributionFactor(60)).toBeCloseTo(1.4, 6);
    const s = scoreAd(strongCopy);
    const part = (k: string) => s.parts.find((p) => p.key === k);
    expect(part("longevity")?.max).toBe(25.2);
    expect(part("craft")?.max).toBe(58.8);
    expect(part("clones")?.available).toBe(false);
    expect(s.total).toBe(84);
    expect(s.tier).toBe("elite");
  });

  it("clones present → 76 → 90.4 → ×1.189 (the most any ad can reach is 90)", () => {
    expect(redistributionFactor(76)).toBeCloseTo(90.4 / 76, 6);
    const s = scoreAd({ ...strongCopy, clones: 10 });
    expect(s.parts.find((p) => p.key === "longevity")?.max).toBe(21.4);
    expect(s.parts.find((p) => p.key === "clones")?.max).toBe(19);
    expect(s.total).toBeLessThanOrEqual(91);
  });

  it("every scoring part maxed → 90 (longevity 21.4 + clones 19 + craft 50)", () => {
    const s = scoreAd({ ...strongCopy, clones: 50 });
    expect(s.total).toBe(90);
    const max = (k: string) => s.parts.find((p) => p.key === k)?.max;
    expect([max("longevity"), max("clones"), max("craft")]).toEqual([21.4, 19, 50]);
  });
});

describe("AI score — engagement never counts", () => {
  const withEngagement = { ...strongCopy, clones: 7, likes: 1_240_000, comments: 48_300, shares: 9_100 };

  it("likes, comments and shares change nothing: same total, tier, parts and explanation", () => {
    expect(scoreAd(withEngagement)).toEqual(scoreAd({ ...strongCopy, clones: 7 }));
    expect(scoreAd({ ...withEngagement, likes: 0, comments: 0, shares: 0 })).toEqual(scoreAd({ ...strongCopy, clones: 7 }));
  });

  it("emits no likes / comments & shares part, and the text never mentions them", () => {
    const s = scoreAd(withEngagement);
    expect(s.parts.map((p) => p.key)).toEqual(["longevity", "clones", "craft", "branded-penalty"]);
    const text = [s.explanation, ...s.parts.flatMap((p) => [p.label, p.reason, ...p.examples])].join(" ");
    expect(text).not.toMatch(/likes?|comments?|shares?/i);
  });

  it("the explanation only mentions redistribution for parts that really are unreported (clones)", () => {
    expect(scoreAd({ ...strongCopy, clones: 7 }).explanation).not.toMatch(/not reported/);
    expect(scoreAd(strongCopy).explanation).toMatch(/Clones is not reported/);
  });
});

describe("AI score — craft + branded penalty", () => {
  it("a bare branded ad gets the −12 penalty", () => {
    const s = scoreAd({
      daysLive: 30,
      likes: null,
      comments: null,
      shares: null,
      clones: 0,
      mediaKind: "image",
      hasVideo: false,
      headline: "Linen shirts by Olive Studio",
      primaryText: "Made in Portugal from organic linen.",
      transcript: null,
      ctaLabel: null,
      frameworkElements: [],
      hookText: null,
      landing: null,
    });
    const penalty = s.parts.find((p) => p.key === "branded-penalty");
    expect(penalty?.value).toBe(-12);
    expect(penalty?.reason).toMatch(/branded/);
    expect(s.tier).toBe("weak");
  });

  it("every part has a human reason, ≤3 examples, and the explanation is 1–2 sentences", () => {
    const u = generateUniverse({ now: Date.UTC(2026, 9, 10) });
    for (const ad of u.ads) {
      expect(ad.aiScore.total).toBeGreaterThanOrEqual(1);
      expect(ad.aiScore.total).toBeLessThanOrEqual(100);
      expect(ad.aiScore.tier).toBe(scoreTier(ad.aiScore.total));
      for (const p of ad.aiScore.parts) {
        expect(p.reason.length).toBeGreaterThan(3);
        expect(p.examples.length).toBeLessThanOrEqual(3);
      }
      const sentences = ad.aiScore.explanation.split(/(?<=\.)\s+(?=[A-Z])/).filter(Boolean);
      expect(sentences.length).toBeGreaterThanOrEqual(1);
      expect(sentences.length).toBeLessThanOrEqual(2);
    }
    const tiers = new Set(u.ads.map((a) => a.aiScore.tier));
    expect(tiers).toEqual(new Set(["elite", "strong", "average", "weak"]));
  });

  it("examples quote the ad (hook line, offer, CTA, days live)", () => {
    const s = scoreAd({ ...strongCopy, clones: 7 });
    const craft = s.parts.find((p) => p.key === "craft");
    expect(craft?.examples.some((e) => e.includes("Warning"))).toBe(true);
    expect(craft?.examples.some((e) => e.startsWith("offer:"))).toBe(true);
    expect(s.parts.find((p) => p.key === "longevity")?.examples).toEqual(["400 days live"]);
    expect(s.parts.find((p) => p.key === "clones")?.reason).toBe("7 competitor clones");
  });
});
