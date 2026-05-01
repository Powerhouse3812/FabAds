/** Core domain types for Genie 6.0 entities — used by mocks and across screens. */

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
}

export interface Avatar {
  id: AvatarId;
  name: string;
  thumbnail?: string;
  demographic: string; // e.g. "F · 28-34 · South Asian"
  language: string[];
}

export interface Voice {
  id: VoiceId;
  name: string;
  language: string;
  sample?: string; // audio URL
  description: string;
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
