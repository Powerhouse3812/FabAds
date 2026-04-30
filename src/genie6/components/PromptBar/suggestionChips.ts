import type { ModeId } from "../../types/output";

/**
 * Per-mode "Try:" suggestion chips for the prompt bar (Q-2). Click a chip
 * to populate the prompt textarea — saves typing for the most common
 * starting prompts in each mode. Mock data; real backend can replace
 * with brand-aware suggestions later.
 */

export const TRY_CHIPS: Record<ModeId, string[]> = {
  "brand-ad": [
    "Diwali festival campaign — premium tone, lifestyle imagery",
    "Build awareness for a hair-care launch — soft + warm",
    "Reposition as the design-led pick in the category",
    "Brand-mood film for the new flagship product",
  ],
  "product-ad": [
    "Hero SKU launch — show before/after, urgency angle",
    "BFCM sale — 6 statics, FOMO + price-led",
    "Bundle pitch — show savings, premium feel",
    "Comparison with competitor — let the math sell it",
  ],
  "affiliate-ad": [
    "DR funnel for weight-loss program, urgency angle",
    "Lead-gen ad for SaaS demo signup",
    "Cold-traffic push for the landing page above",
    "Retargeting set — warm audience, social proof",
  ],
  "ugc-video": [
    "Avatar-led testimonial for shampoo, English + Hindi",
    "Reaction unboxing — 30s, female 25-35",
    "Product demo — B-roll heavy, narrator hooks",
    "Talking-head explainer for the new launch",
  ],
  forge: [
    "Subtle variants — keep hook, vary visual + palette",
    "Wild text variants — same image, 10 new headlines",
    "Hooks-only — 8 alternative opening lines",
    "Media-only — refresh the visual, keep the copy",
  ],
  "image-to-ad": [
    "Add subtle parallax + slow camera dolly",
    "Element animation — text fades, product tilts",
    "Brief-to-Ad — premium product shot for IG feed",
    "Image + adcopy — turn this photo into a finished ad",
  ],
};

export function tryChipsFor(mode: ModeId | null): string[] {
  if (!mode) return [];
  return TRY_CHIPS[mode] ?? [];
}

/** "Refine:" chips — shown post-generation. Mock for v1. */
export const REFINE_CHIPS: string[] = [
  "Make it punchier",
  "More urgency",
  "Premium tone",
  "Shorter copy",
  "Different hook",
  "Brighter palette",
];
