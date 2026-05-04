/**
 * Type definitions for the New Studio Generate flow (A-11.3+).
 *
 * Source: Genie_6.0_Form_Specs.md §0.
 *
 * 4 Type CTAs route directly to /generate/{type}.
 * 2 Preset CTAs (Product Shoot / UGC Video) resolve via gate modal to a
 * Type form with pre-set combo. NOT separate routes.
 *
 * UGC Video and Image-to-Video are MERGED — sub-capabilities exposed when
 * Output=Video on Brand / Product / Affiliate forms (per Rule 2).
 */

/** The 4 Type CTAs that have their own routes. */
export type TypeId = "brand-ad" | "product-ad" | "affiliate-ad" | "variation";

/** The 2 Preset CTAs — resolve to a TypeId via gate modal. */
export type PresetId = "product-shoot" | "ugc-video";

/** All outside CTAs (4 Type + 2 Preset). */
export type OutsideCtaId = TypeId | PresetId;

/** Output choice — universal except for Variations (auto-derived from source). */
export type OutputType = "image" | "video" | "whole-adcopy" | "product-shoot";

/** Image format options. Contextual: shown only when Output=Image. */
export type ImageFormat = "static" | "carousel" | "catalogue" | "collection" | "motion" | "lp-derived";

/** Video sub-method (Row 1 in Video Production section — UGC). */
export type UgcSubMethod =
  | "avatar-led"
  | "script-first"
  | "product-demo"
  | "testimonial"
  | "talking-head"
  | "reaction"
  | "b-roll-only";

/** Video sub-method (Row 2 in Video Production section — Image-to-Video). */
export type I2vSubMethod = "subtle-motion" | "camera" | "element" | "full-ai";

/** All video sub-methods. */
export type VideoSubMethod = UgcSubMethod | I2vSubMethod;

/** Variations sub-method — Form Specs §4. */
export type VariationSubMethod = "whole-ad" | "media-only" | "text-only" | "ab-axes" | "refresh";

/** Source-winner input methods for Variations — Form Specs §4. */
export type SourceInputKind =
  | "library"
  | "upload"
  | "link-fetch"
  | "meta-ad-id"
  | "fabads-reports"
  | "industry-insights";

/** Brand-Constitution strictness (Brand / Product / Affiliate forms). */
export type StrictnessLevel = "strict" | "balanced" | "loose";

/** Funnel stage (Advanced drawer, all 3 type forms). */
export type FunnelStage = "awareness" | "consideration" | "conversion";

/** Generic option-list shape used across pickers. */
export interface PickerOption<T extends string = string> {
  id: T;
  label: string;
  description?: string;
  disabled?: boolean;
  comingSoon?: boolean;
}

/** Outside CTA descriptor — what GenerateLanding renders as a tile. */
export interface OutsideCtaDescriptor {
  id: OutsideCtaId;
  /** Whether this CTA is a Type (own route) or Preset (gate-resolved). */
  kind: "type" | "preset";
  label: string;
  /** One-line description shown on the tile + Gate modal. */
  description: string;
  /** lucide-react icon name (looked up in the tile renderer). */
  icon: string;
  /** Per Rule 1: Variations is the only CTA that skips the gate modal. */
  skipGate?: boolean;
}

/**
 * 6 default outside CTAs (per Form Specs §0.1).
 * Order matters — defines the tile order on GenerateLanding.
 */
export const OUTSIDE_CTAS: OutsideCtaDescriptor[] = [
  {
    id: "brand-ad",
    kind: "type",
    label: "Brand Ad",
    description: "Hero ads anchored to a brand profile.",
    icon: "Sparkles",
  },
  {
    id: "product-ad",
    kind: "type",
    label: "Product Ad",
    description: "Sell a specific product with brand context.",
    icon: "ShoppingBag",
  },
  {
    id: "affiliate-ad",
    kind: "type",
    label: "Affiliate Ad",
    description: "Performance ads anchored to a category + landing page.",
    icon: "Target",
  },
  {
    id: "product-shoot",
    kind: "preset",
    label: "Product Shoot",
    description: "Studio-quality product photography in any setting.",
    icon: "Camera",
  },
  {
    id: "ugc-video",
    kind: "preset",
    label: "UGC Video",
    description: "Avatar / script / talking-head video for any Type.",
    icon: "Video",
  },
  {
    id: "variation",
    kind: "type",
    label: "Variations",
    description: "Generate variants of a winning ad.",
    icon: "RefreshCw",
    skipGate: true, // Rule 1 — only mode that bypasses the gate
  },
];
