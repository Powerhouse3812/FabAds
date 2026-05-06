/**
 * Studio v4 — shared types and sub-mode profiles.
 *
 * Single source of truth for the v4 form shape. Both Wizard
 * (linear stepper) and Flow (single-page) shells consume this.
 *
 * The `SUB_MODE_PROFILES` map declares which form fields each
 * sub-mode actually uses, plus any locked output/path constraints
 * (e.g. UGC always video, Variations always iterate).
 */

export type SubMode =
  | "custom"
  | "product-shoot"
  | "product-focused"
  | "brand-focused"
  | "product-ad"
  | "performance-ad"
  | "brand-ad"
  | "ugc-video"
  | "variations"
  | "image-to-ad"
  | "bg-remover"
  | "bg-swap"
  | "refresh-winner";

export type Path = "scratch" | "iterate";

export type Output = "image" | "video";

export type ActiveColumnInput =
  | "audience"
  | "angle"
  | "concept"
  | "pinterest"
  | "library"
  | null;

export interface StudioV4Form {
  subMode: SubMode;
  path: Path;
  productId: string | null;
  brandId: string | null;
  output: Output;
  aspectRatios: string[];
  audienceIds: string[];
  angleIds: string[];
  conceptIds: string[];
  brandIntensity: "minimal" | "moderate" | "strong";
  voiceTone: string | null;
  modelId: string | null;
  scriptMode: "ai" | "manual" | "upload" | "saved";
  scriptText: string;
  // Iterate-only
  preserveLayout: boolean;
  preserveColors: boolean;
  preserveCopy: boolean;
  variationIntensity: "subtle" | "medium" | "bold";
  // Prompt
  prompt: string;
  count: number;
  promptBarModelId: string;
}

export interface SubModeProfile {
  fields: "all" | string[];
  lockOutput?: Output | null;
  lockPath?: Path | null;
  label: string;
  description: string;
}

export const SUB_MODE_PROFILES: Record<SubMode, SubModeProfile> = {
  custom: {
    fields: "all",
    label: "Custom",
    description: "Manual full form — pick everything",
  },
  "product-shoot": {
    fields: ["product", "brandIntensity", "output", "aspect", "references"],
    label: "Product Shoot",
    description: "Studio-quality product photography",
  },
  "product-focused": {
    fields: [
      "product",
      "output",
      "aspect",
      "audience",
      "angle",
      "concept",
      "references",
    ],
    label: "Product-focused",
    description: "Product-led ad anchored to your brand",
  },
  "brand-focused": {
    fields: [
      "product",
      "output",
      "aspect",
      "audience",
      "angle",
      "concept",
      "references",
      "brandIntensity",
    ],
    label: "Brand-focused",
    description: "Brand identity-led ad",
  },
  "product-ad": {
    fields: [
      "product",
      "output",
      "aspect",
      "audience",
      "angle",
      "concept",
      "references",
    ],
    label: "Product Ad",
    description: "Sell a product with brand context",
  },
  "performance-ad": {
    fields: ["product", "output", "aspect", "audience", "angle", "references"],
    label: "Performance Ad",
    description: "Performance ad for category + landing page",
  },
  "brand-ad": {
    fields: [
      "output",
      "aspect",
      "audience",
      "angle",
      "references",
      "brandIntensity",
    ],
    label: "Brand Ad",
    description: "Hero ad anchored to a brand profile",
  },
  "ugc-video": {
    fields: ["product", "model", "voiceTone", "script"],
    lockOutput: "video",
    label: "UGC Video",
    description: "Avatar-led talking-head video",
  },
  variations: {
    fields: ["referenceUpload", "preserveToggles", "variationIntensity"],
    lockPath: "iterate",
    label: "Variations",
    description: "Generate variants of an existing winner",
  },
  "image-to-ad": {
    fields: ["product", "output", "aspect", "references"],
    lockOutput: "image",
    label: "Image-to-Ad",
    description: "Convert image into a finished ad",
  },
  "bg-remover": {
    fields: ["referenceUpload"],
    label: "BG Remover",
    description: "Remove background from an image",
  },
  "bg-swap": {
    fields: ["referenceUpload", "references"],
    label: "BG Swap",
    description: "Replace background with a chosen scene",
  },
  "refresh-winner": {
    fields: ["referenceUpload", "preserveToggles"],
    label: "Refresh Winner",
    description: "Tweak a winning ad with light variations",
  },
};
