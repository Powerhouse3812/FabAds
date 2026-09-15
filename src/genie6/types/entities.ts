/** Core domain types for Genie 6.0 entities — used by mocks and across screens. */

import type { Provenance } from "@/genie6/lib/genieRunTypes";

export type CategoryId = string;
export type BrandId = string;
export type ProductId = string;
export type AudienceId = string;
export type ConceptId = string;
export type HookId = string;
export type AngleId = string;
export type AvatarId = string;
export type VoiceId = string;

export interface Brand {
  id: BrandId;
  name: string;
  domain: string;
  logo?: string;
  category: string;
  /** Categories this brand sells in (many-to-many). New iter-6 A-9. Source of truth
   *  for the catalogue ↔ Genie sync. The legacy `category: string` is the brand's
   *  primary category label; `categoryIds` is the structured relation. */
  categoryIds?: CategoryId[];
  tone: string;
  fonts: { display: string; body: string };
  colors: string[]; // hex strings
  voice: string;
  usps: string[];
  competitors: BrandId[];
  productIds: ProductId[];
}

/** Product variants — SKU-level distinctions like size / color / fragrance.
 *  Optional; most seed products are still single-SKU. NEW for Brand Detail
 *  redesign. */
export interface Variant {
  id: string;
  name: string;          // e.g. "200ml" / "Lavender" / "Original"
  sku?: string;
  price?: string;        // e.g. "₹399"
  thumbnail?: string;    // optional, distinct from product thumbnail
  /** Optional descriptors. */
  color?: string;
  size?: string;
}

export interface Product {
  id: ProductId;
  brandId: BrandId;
  /** Category this product belongs to (many-to-one). Used by Affiliate Ad mode
   *  + KB. NEW iter-6 A-9. */
  categoryId?: CategoryId;
  name: string;
  price: string; // formatted, e.g. "₹699"
  thumbnail?: string;
  benefits: string[];
  promo?: string;
  /** Landing-page URLs for this product (for Product Ad / Affiliate Ad targeting).
   *  NEW iter-6 A-9. */
  landingPages?: string[];
  /** Campaign URLs (UTM-decorated, e.g. /utm-source=fb&utm-campaign=…). Distinct
   *  from landingPages — these are the pre-built campaign-URL variants used by
   *  the Launch flow. NEW iter-6 A-9. */
  campaignUrls?: string[];
  generatedCount: number;
  /** SKU-level variants — sizes / colors / fragrances. Optional; most seed
   *  products are single-SKU. NEW for Brand Detail redesign. */
  variants?: Variant[];
}

export interface Category {
  id: CategoryId;
  name: string;
  similarCategoryIds: CategoryId[];
  referenceUrls: string[];
  instruction: string;
  winnerCount: number;
  feedbackCount: number;
}

export interface Audience {
  id: AudienceId;
  label: string;
  segment: string; // e.g. "Affluent women 30-45"
  brandId?: BrandId;
}

export interface Angle {
  id: AngleId;
  label: string;
  description?: string;
}

export interface Hook {
  id: HookId;
  text: string;
  brandId?: BrandId;
  angleId?: AngleId;
  performance?: { ctr: number; impressions: number };
}

export interface Concept {
  id: ConceptId;
  name: string;
  brandId: BrandId;
  angle: string;
  hook: string;
  tone: string;
  format: string;
  visualDirection: string;
  generationCount: number;
  /**
   * Owner spec 2026-09-14 — a Concept in the Asset Library reads as
   * "Name · content · Angle · Avatar + voice". The persona was the one listed
   * field with nothing behind it. Optional so the 47 seeds and every existing
   * consumer keep working; `voiceId` tracks whatever `avatarId` is paired
   * with rather than being chosen twice.
   */
  avatarId?: AvatarId;
  voiceId?: VoiceId;
}

export interface Avatar {
  id: AvatarId;
  name: string;
  thumbnail?: string;
  demographic: string; // e.g. "F · 28-34 · South Asian"
  /**
   * Owner spec 2026-09-14 — the Asset Library's Avatar + voice roster shows
   * "name, gender, age, personality, race, tone" as SEPARATE columns. These
   * three used to be readable only as prose inside `demographic`, which a
   * card cannot lay out and a filter cannot facet.
   *
   * They are PARSED from `demographic` by the seed builder, not typed in
   * alongside it — one source of truth, so a demographic string and its own
   * gender can never disagree. See `parseDemographic` in
   * `src/mocks/shared/avatars.ts`.
   */
  gender: string; // "Female" | "Male"
  ageRange: string; // "28-34"
  race: string; // "South Asian"
  /** Extra qualifiers the demographic string carried past race ("metro",
   *  "mom", "tier-1"). Display-only; absent on most rows. */
  segment?: string;
  /**
   * The voice this avatar is paired with. Owner ruling 2026-09-14: Avatar and
   * Voice are ONE library item, one row, one "Generate Ad" — so the pairing
   * has to exist in the data. `tone` on that row is this voice's tone; there
   * is no tone on an avatar by itself. Swappable in the UI, never null in the
   * seed, so the roster never renders a half-built persona.
   */
  voiceId?: VoiceId;
  language: string[];
  /**
   * Genie 2.0 §11/§13 — additive, all optional so no existing consumer breaks.
   * `environmentId` / `personalityId` reference `AVATAR_ENVIRONMENTS` /
   * `AVATAR_PERSONALITIES` in `src/genie6/brain/avatarTaxonomy.ts` — the SAME
   * categorisation Genie Brain browses and Genie's own avatar-selection step
   * filters by. §11: "the two must not diverge."
   */
  environmentId?: string;
  personalityId?: string;
  /** §13 upgrade 1 — looping preview clip so the user sees the avatar move
   *  and speak before choosing, instead of a static image. Absent on a
   *  deliberate few entries (edge case: avatar with no preview video yet). */
  previewVideo?: string;
  /** §21.2 — FabFunnel-seeded vs client-created. Structural, not a corner badge. */
  provenance?: Provenance;
}

export interface Voice {
  id: VoiceId;
  name: string;
  language: string;
  sample?: string; // audio URL
  description: string;
  /** §13 upgrade 3 — tone tags (ids into `VOICE_TONES`,
   *  src/genie6/brain/avatarTaxonomy.ts) this voice reads as. Additive. */
  tones?: string[];
  /** §13 upgrade 2 — sample length, shown on the audio preview control even
   *  when no `sample` URL resolves yet. */
  durationSec?: number;
  /** §21.2 — FabFunnel-seeded vs client-created. */
  provenance?: Provenance;
}

/** Analytics tile data — drives Home asymmetric row. */
export interface AnalyticsSnapshot {
  generationsThisMonth: { count: number; deltaPct: number };
  creditsUsed: { used: number; limit: number };
  topPerformer: {
    outputId: string;
    brand: string;
    product?: string;
    ctr: number;
    roas: number;
    thumbnail: string;
    mode: string;
  };
  trendingFinding: { headline: string; deltaPct: number; angleLabel: string };
  activeBrands: number;
  recentActivityCount: number;
}
