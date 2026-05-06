/**
 * Studio v3 — Generated Concept mocks.
 *
 * Used by ConceptsStrip (A-11.21+). Per Maalik's lock:
 *   - System shows SAVED concepts by default.
 *   - User can hit "Regenerate fresh" to get a NEW set inferred from the
 *     current setup (brand / product / audience / angle).
 *   - A toggle chip flips between Saved and New views.
 *
 * Real backend (Concepts store, persistence, AI generation) wires later.
 */

export interface ConceptDescriptor {
  id: string;
  /** Short name shown on the card. */
  name: string;
  /** 1-2 line gist used as the card body. */
  gist: string;
  /** Source tag — what angle / format pattern this concept came from. */
  angleTag?: string;
  /** Audience tag — who it targets. */
  audienceTag?: string;
  /** Origin: "saved" = system / brand-saved · "new" = freshly generated. */
  origin: "saved" | "new";
}

export const savedConcepts: ConceptDescriptor[] = [
  {
    id: "saved-fomo-launch",
    name: "FOMO launch",
    gist: "Founder + 3-pack benefits + scarcity hook over price stamp.",
    angleTag: "FOMO",
    audienceTag: "Tier-1 mums",
    origin: "saved",
  },
  {
    id: "saved-founder-story",
    name: "Founder story",
    gist: "Talking-head intro with product reveal at the 12-second mark.",
    angleTag: "Founder",
    audienceTag: "Aspirational",
    origin: "saved",
  },
  {
    id: "saved-bundle-carousel",
    name: "Bundle carousel",
    gist: "5-SKU carousel · price overlay on each · CTA tile at end.",
    angleTag: "Bundle",
    audienceTag: "Value buyers",
    origin: "saved",
  },
  {
    id: "saved-before-after",
    name: "Before / After",
    gist: "Split-screen claim · transition wipe · 1-line proof on bottom.",
    angleTag: "Transformation",
    audienceTag: "Health-led",
    origin: "saved",
  },
  {
    id: "saved-social-proof",
    name: "Social proof",
    gist: "5-star row · 3 customer avatars · review pull-quote · CTA.",
    angleTag: "Social proof",
    audienceTag: "Cautious buyers",
    origin: "saved",
  },
];

export const newConcepts: ConceptDescriptor[] = [
  {
    id: "new-budget-flex",
    name: "Budget flex",
    gist: "Cost-per-use math overlay · founder's voice over the maths.",
    angleTag: "Value",
    audienceTag: "Tier-2 aspirational",
    origin: "new",
  },
  {
    id: "new-family-routine",
    name: "Family routine",
    gist: "Day-in-the-life cuts with product woven into 3 micro-moments.",
    angleTag: "Lifestyle",
    audienceTag: "Young urban mums",
    origin: "new",
  },
  {
    id: "new-bold-claim",
    name: "Bold claim",
    gist: "Oversized type-led claim with the product as small reveal.",
    angleTag: "Bold claim",
    audienceTag: "Tier-1 mums",
    origin: "new",
  },
  {
    id: "new-unboxing-asmr",
    name: "Unboxing · ASMR",
    gist: "Slow texture-led unboxing with sound design front and centre.",
    angleTag: "Unboxing",
    audienceTag: "Premium",
    origin: "new",
  },
];
