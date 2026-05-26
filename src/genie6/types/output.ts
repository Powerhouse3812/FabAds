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

/**
 * AI verdict — every metric the model can hand-grade about the generation
 * itself, BEFORE the ad has any real-world performance data. Populates the
 * "AI Verdict" zone in both AdDetail drawer variants.
 *
 * Mock for now; real wiring lands when the scoring pipeline exists.
 */
export interface AiVerdict {
  /** Headline quality score 0–100. */
  quality: number;
  /** Estimated click-through rate as a percentage (e.g. 3.2 = 3.2%). */
  ctr: number;
  /** Delta vs angle average, in percentage points. Can be negative. */
  ctrDelta: number;
  /** Estimated conversion rate as a percentage. */
  cvr: number;
  cvrDelta: number;
  /** Audience-fit score 0–100. */
  audienceFit: number;
  /** Qualitative label e.g. "Strong match" / "Decent match" / "Weak match". */
  audienceFitLabel: string;
  /** Brand-voice / on-brand match score 0–100. */
  brandVoice: number;
  brandVoiceLabel: string;
}

/**
 * Comparison scores — quality scores of peer cohorts so the user can
 * place this generation against benchmarks.
 */
export interface ComparisonScores {
  /** Quality score of the top-performing ad in the same angle. */
  topInAngle: number;
  /** Avg quality of your last 10 generations across all angles. */
  your10Avg: number;
  /** Avg quality in the category (industry insights benchmark). */
  categoryAvg: number;
}

/**
 * AI-coach recommendation. Each rec is a concrete next-step the user can
 * take based on signals from this generation + their portfolio.
 *
 * The `icon` field is serialised as a string so this can be JSON-safe;
 * the rendering components map it to the actual lucide icon.
 */
export interface CoachRecommendation {
  id: string;
  icon: "sparkles" | "beaker" | "refresh-cw";
  title: string;
  sub: string;
  ctaLabel: string;
  ctaHref: string;
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

  /* ── AI-native surfaces (A-12.192) ──
       Populates the AdDetail drawer's AI Verdict / Peer Comparison / Coach
       zones. All optional — older outputs may lack these fields. */
  aiVerdict?: AiVerdict;
  comparison?: ComparisonScores;
  recommendations?: CoachRecommendation[];
  /** IDs of sibling outputs generated in the same batch. */
  siblings?: string[];
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
