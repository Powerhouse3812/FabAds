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
  it("all parts present → ×1.0", () => {
    expect(RECOVERED_SHARE).toBe(0.6);
    expect(redistributionFactor(100)).toBe(1);
  });

  it("only longevity + craft → ×1.4 (longevity max 25.2, craft max 58.8), capped at 84", () => {
    expect(redistributionFactor(60)).toBeCloseTo(1.4, 6);
    const s = scoreAd(strongCopy);
    const part = (k: string) => s.parts.find((p) => p.key === k);
    expect(part("longevity")?.max).toBe(25.2);
    expect(part("craft")?.max).toBe(58.8);
    expect(part("likes")?.available).toBe(false);
    expect(part("likes")?.max).toBe(0);
    expect(part("social")?.available).toBe(false);
    expect(part("clones")?.available).toBe(false);
    expect(s.total).toBe(84);
    expect(s.tier).toBe("elite");
  });

  it("clones present, no likes/social → 76 → 90.4 → ×1.189", () => {
    expect(redistributionFactor(76)).toBeCloseTo(90.4 / 76, 6);
    const s = scoreAd({ ...strongCopy, clones: 10 });
    expect(s.parts.find((p) => p.key === "longevity")?.max).toBe(21.4);
    expect(s.parts.find((p) => p.key === "clones")?.max).toBe(19);
    expect(s.total).toBeLessThanOrEqual(91);
  });

  it("everything reported and maxed → 100", () => {
    const s = scoreAd({ ...strongCopy, likes: 50_000, comments: 4_000, shares: 4_000, clones: 50 });
    expect(s.total).toBe(100);
    for (const p of s.parts.filter((x) => x.key !== "branded-penalty")) expect(p.max).toBe({ longevity: 18, likes: 16, social: 8, clones: 16, craft: 42 }[p.key]);
  });

  it("social is available when comments OR shares is reported", () => {
    const s = scoreAd({ ...strongCopy, comments: 10, shares: null });
    expect(s.parts.find((p) => p.key === "social")?.available).toBe(true);
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
