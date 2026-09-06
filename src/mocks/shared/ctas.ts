import type { Provenance } from "@/genie6/lib/genieRunTypes";

/**
 * CTAs — reusable call-to-action lines, a Creative-asset type new in
 * Genie 2.0 (§9 / §21.1 Catalogue merge). Short, standalone copy —
 * distinct from Hooks (opening lines) and hook cards in Genie's own
 * config step (button-style CTA like "Shop Now"). These are the fuller
 * line version used in-ad ("Grab it before the Diwali sale ends").
 */

export type CtaStyle = "urgency" | "discount" | "benefit" | "social-proof" | "curiosity";

export interface CtaAsset {
  id: string;
  text: string;
  brandId?: string;
  style: CtaStyle;
  tags: string[];
  usageCount: number;
  /** ISO date. */
  lastUsedAt: string;
  provenance: Provenance;
}

const c = (
  id: string,
  text: string,
  brandId: string | undefined,
  style: CtaStyle,
  tags: string[],
  usageCount: number,
  lastUsedAt: string,
  provenance: Provenance = "fabfunnel-seeded",
): CtaAsset => ({ id, text, brandId, style, tags, usageCount, lastUsedAt, provenance });

export const ctas: CtaAsset[] = [
  c("cta-shop-now", "Shop Now", undefined, "benefit", ["generic", "button"], 84, "2026-09-04"),
  c("cta-onion-6weeks", "See results in 6 weeks — shop Onion Shampoo", "mamaearth", "benefit", ["haircare", "timeframe"], 27, "2026-08-22"),
  c("cta-airdopes-999", "Grab Airdopes 161 at ₹999 — today only", "boat", "urgency", ["audio", "price"], 33, "2026-09-01"),
  c("cta-diwali-limited", "Diwali bundle — limited stock, ends Sunday", "mamaearth", "urgency", ["festive", "scarcity"], 21, "2026-08-30"),
  c("cta-colorfit-battery", "7-day battery. Try ColorFit Pro 5 risk-free", "noise", "benefit", ["tech", "trial"], 19, "2026-08-18"),
  c("cta-serum-glow", "Start your 2-week glow — shop Vit C Serum", "plum", "benefit", ["skincare", "timeframe"], 14, "2026-08-11"),
  c("cta-sleepyhead-trial", "100-night trial. Sleep on it, literally", "sleepyhead", "benefit", ["sleep", "trial"], 11, "2026-07-29"),
  c("cta-reviews-4200", "Loved by 4,200+ verified buyers — see why", undefined, "social-proof", ["reviews", "generic"], 38, "2026-08-25"),
  c("cta-last-batch", "Only 40 left in this batch", "sleepyhead", "urgency", ["scarcity"], 8, "2026-06-30"),
  c("cta-mcaffeine-2min", "The 2-minute upgrade your shower's missing", "mcaffeine", "curiosity", ["lifestyle"], 9, "2026-08-05"),
  c("cta-first-order-50", "₹50 off your first Mamaearth order", "mamaearth", "discount", ["discount", "first-order"], 24, "2026-08-15"),
  c("cta-emi-noise", "No-cost EMI available — starts at ₹583/mo", "noise", "benefit", ["emi", "price"], 12, "2026-07-20"),
  c("cta-wakefit-trial", "Try it for 100 nights. Return if it's not right", "wakefit", "benefit", ["sleep", "trial"], 6, "2026-06-30"),
  c("cta-derma-clinical", "Dermatologist-formulated. See the study", "the-derma-co", "social-proof", ["clinical", "skincare"], 15, "2026-08-08"),
  c(
    "cta-client-monsoon-draft",
    "Built for monsoon. Waterproof, tested, ready",
    "boat",
    "benefit",
    ["monsoon", "draft"],
    2,
    "2026-09-05",
    "client-created",
  ),
  c(
    "cta-client-referral-draft",
    "Refer a friend, both get ₹200 off",
    "mamaearth",
    "discount",
    ["referral", "draft"],
    1,
    "2026-09-04",
    "client-created",
  ),
];

export function getCtasForBrand(brandId: string): CtaAsset[] {
  return ctas.filter((c) => c.brandId === brandId);
}
