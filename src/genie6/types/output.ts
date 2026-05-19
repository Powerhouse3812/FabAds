export type ModeId =
  | "brand-ad"
  | "product-ad"
  | "affiliate-ad"
  | "ugc-video"
  | "forge"           // ID kept; user-facing label is "Variants"
  | "image-to-ad";    // merged former "image-to-adcopy" + "image-to-video"

export type MediaType = "image" | "video" | "text-only";

/**
 * Output type — the universal vocabulary for what a generation produces.
 * Each mode declares which subset of these it allows (see modeConfigs.ts).
 */
export type OutputType =
  | "image"          // single static (1:1, 4:5, 9:16, 16:9)
  | "video"          // full motion video
  | "carousel"       // multi-frame static (Meta carousel)
  | "motion-static"  // subtle motion on still (parallax, element animation)
  | "adcopy"         // text-led with small visual reference
  | "text-only";     // pure copy, no media

export const OUTPUT_TYPE_LABELS: Record<OutputType, string> = {
  image: "Image",
  video: "Video",
  carousel: "Carousel",
  "motion-static": "Motion-static",
  adcopy: "Adcopy",
  "text-only": "Text-only",
};

export type EllipsisAction =
  | "edit"
  | "forge10more"
  | "addFeedback"
  | "addToFolder"
  | "saveAsConcept"
  | "saveAsTemplate"
  | "saveTextOnly"
  | "saveMediaOnly"
  | "downloadMediaOnly"
  | "saveToKb"
  | "regenerate";

export type KanbanColumn = "winner" | "maybe" | "reject";

export type OutputCardVariant = "grid" | "kanban" | "compact";

/**
 * Snapshot of the configuration that produced a generation.
 *
 * Surfaced in the AdDetailDrawer Variant B (workflow-first) at the top of
 * the drawer so the user can see *why* this output looks the way it does
 * and one-click into the source entities. All fields are optional because
 * not every generation carries the full trail (older outputs, ad-hoc
 * regenerations, image-to-ad flows that skipped concept/hook).
 */
export interface PriorConfig {
  mode: ModeId;
  angleId?: string;
  conceptId?: string;
  brandId?: string;
  productId?: string;
  hookId?: string;
  /** First ~120 chars of the user's prompt that triggered the generation. */
  promptSnippet?: string;
  /** If this was started from a saved template, its label. */
  generatedFromTemplate?: string;
  generatedAt: Date;
}

export interface OutputData {
  id: string;
  mediaType: MediaType;
  mode: ModeId;
  generatedAt: Date;
  thumbnail?: string;
  headline?: string;
  body?: string;
  cta?: string;
  brand?: { name: string; logo?: string };
  product?: { name: string };
  qualityScore?: number;
  /** Lineage — if this variant was forged from a parent winner, its ID is here. */
  parentWinnerId?: string;
  /**
   * Selling angle attribution. Backfilled deterministically on the mock pool;
   * real generations should populate from the wizard state on save. Used by
   * the Library's Group-by-Angle view + Variant A's "related from same angle"
   * + Variant B's prior-config snapshot.
   */
  angleId?: string;
  /** Snapshot of the wizard config that produced this output (see PriorConfig). */
  priorConfig?: PriorConfig;
}

/** Mode → human label (for badges, chips, picker tooltips, breadcrumbs). */
export const MODE_LABELS: Record<ModeId, string> = {
  "brand-ad": "Brand Ad",
  "product-ad": "Product Ad",
  "affiliate-ad": "Affiliate Ad",
  "ugc-video": "UGC Video",
  forge: "Variants",          // renamed (id stays "forge" for now)
  "image-to-ad": "Image to Ad", // merged 6+7
};

/** Quality score → color tier. >=80 success / 60-79 warning / <60 error. */
export function qualityTier(score: number | undefined): "success" | "warning" | "error" | null {
  if (score === undefined) return null;
  if (score >= 80) return "success";
  if (score >= 60) return "warning";
  return "error";
}
