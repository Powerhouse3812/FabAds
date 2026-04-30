import type { ModeId, OutputType } from "../types/output";

/**
 * Mode configuration — drives both Wizard steps and Form fields.
 *
 * Track 4.2 refactor (research-backed):
 * - Output type is now a UNIVERSAL field (image / video / carousel / motion-static /
 *   adcopy / text-only) with a per-mode allowlist (`outputTypes`).
 * - Sub-methods are now ONLY mode-specific behaviors (Lead Gen, Avatar-led, etc.) —
 *   they no longer double as format selectors.
 * - Modes 6 (Image-to-Adcopy) + 7 (Image-to-Video) merged into single mode "Image to Ad".
 * - Mode 5 (Forge) keeps id `forge` but label is "Variants" (see types/output.ts).
 */

export type FieldType =
  | "sub-method-picker"
  | "output-type-picker"      // NEW (replaces the old text-only-toggle)
  | "brand-picker"
  | "product-picker"
  | "url-input"
  | "source-image-picker"
  | "source-winner-picker"
  | "avatar-picker"
  | "voice-picker"
  | "script-input"
  | "audience-picker"
  | "angle-picker"
  | "tone-picker"
  | "format-picker"            // aspect ratio (1:1 / 4:5 / 9:16 / 16:9)
  | "scene-picker"             // P-3: visual scene/composition (image modes)
  | "count-picker"
  | "references-panel"
  | "prompt-override";

export interface WizardStep {
  id: string;
  title: string;
  types: FieldType[];
}

export interface SubMethod {
  id: string;
  label: string;
}

export interface ModeTooltip {
  mentalState: string;
  working: string;
  bestWhen: string;
  example: string;
}

export interface ModeConfig {
  id: ModeId;
  label: string;
  description: string;
  tooltip: ModeTooltip;
  /** Allowed output types — universal vocabulary, per-mode subset. */
  outputTypes: OutputType[];
  defaultOutputType: OutputType;
  /** Mode-specific behaviors (NOT format selectors anymore). */
  subMethods?: SubMethod[];
  defaultSubMethod?: string;
  formFields: FieldType[];
  wizardSteps: WizardStep[];
}

export const ANGLES = [
  "FOMO",
  "Aspirational",
  "Comparison",
  "Social proof",
  "Urgency",
  "Authority",
  "Bundle",
  "Retargeting",
] as const;
export type AngleLabel = (typeof ANGLES)[number];

export const TONES = [
  "Premium",
  "Casual",
  "Urgent",
  "Playful",
  "Direct",
  "Empathetic",
  "Bold",
] as const;
export type ToneLabel = (typeof TONES)[number];

export const FORMATS = ["1:1", "4:5", "9:16", "16:9"] as const;
export const COUNTS = [4, 8, 12, 16, 24] as const;

const DIRECTION_STEP: WizardStep = {
  id: "direction",
  title: "Direction",
  types: ["audience-picker", "angle-picker", "tone-picker"],
};

const REFS_STEP: WizardStep = {
  id: "references",
  title: "References",
  types: ["references-panel"],
};

const REVIEW_STEP: WizardStep = {
  id: "review",
  title: "Review",
  types: [],
};

const OUTPUT_FULL_STEP: WizardStep = {
  id: "output",
  title: "Output settings",
  types: ["output-type-picker", "format-picker", "count-picker"],
};

export const modeConfigs: ModeConfig[] = [
  // ─────────────────────────────────────────────────────────
  // 1. Brand Ad — awareness, recall, identity work
  //    Output: all 6 (research: Jasper $49+/mo proves text-only/adcopy market exists for brand)
  // ─────────────────────────────────────────────────────────
  {
    id: "brand-ad",
    label: "Brand Ad",
    description: "Build awareness and recall across formats.",
    tooltip: {
      mentalState: "I want to build brand presence and recall.",
      working: "AI uses your brand profile, identity, and goals to generate awareness-first creatives.",
      bestWhen: "Brand campaigns, festival launches, repositioning.",
      example: "Diwali awareness campaign for Zara Home — 12 brand-feel statics in 4:5.",
    },
    outputTypes: ["image", "video", "carousel", "motion-static", "adcopy", "text-only"],
    defaultOutputType: "image",
    defaultSubMethod: "single-ad",
    subMethods: [
      { id: "single-ad", label: "Single ad" },
      { id: "festival", label: "Festival" },
      { id: "series", label: "Series" },
      { id: "animated-brand", label: "Animated brand ad" },
    ],
    formFields: [
      "sub-method-picker",
      "output-type-picker",
      "brand-picker",
      "audience-picker",
      "angle-picker",
      "tone-picker",
      "scene-picker",
      "format-picker",
      "count-picker",
      "references-panel",
      "prompt-override",
    ],
    wizardSteps: [
      { id: "mode", title: "Output type", types: ["sub-method-picker", "output-type-picker"] },
      { id: "brand", title: "Brand", types: ["brand-picker"] },
      DIRECTION_STEP,
      REFS_STEP,
      { id: "output", title: "Output settings", types: ["scene-picker", "format-picker", "count-picker"] },
      REVIEW_STEP,
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 2. Product Ad — sell SKUs, promo, conversion-led
  //    Output: all 6 (research: dropshipper + agency overlap, need everything)
  // ─────────────────────────────────────────────────────────
  {
    id: "product-ad",
    label: "Product Ad",
    description: "Sell specific SKUs — static, video, carousel, motion, copy.",
    tooltip: {
      mentalState: "I want to move product and drive purchases.",
      working: "AI uses product benefits, price, and promo to create conversion-first ads.",
      bestWhen: "New product launch, promo periods, catalog ads.",
      example: "Mamaearth Onion Shampoo — 12 statics at ₹699 promo price.",
    },
    outputTypes: ["image", "video", "carousel", "motion-static", "adcopy", "text-only"],
    defaultOutputType: "image",
    defaultSubMethod: "single-sku",
    subMethods: [
      { id: "single-sku", label: "Single SKU" },
      { id: "multi-product", label: "Multi-product" },
      { id: "bundle", label: "Bundle" },
      { id: "dpa", label: "DPA" },
    ],
    formFields: [
      "sub-method-picker",
      "output-type-picker",
      "brand-picker",
      "product-picker",
      "audience-picker",
      "angle-picker",
      "tone-picker",
      "scene-picker",
      "format-picker",
      "count-picker",
      "references-panel",
      "prompt-override",
    ],
    wizardSteps: [
      { id: "mode", title: "Output type", types: ["sub-method-picker", "output-type-picker"] },
      { id: "source", title: "Brand & Product", types: ["brand-picker", "product-picker"] },
      DIRECTION_STEP,
      REFS_STEP,
      { id: "output", title: "Output settings", types: ["scene-picker", "format-picker", "count-picker"] },
      REVIEW_STEP,
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 3. Affiliate Ad — paid landing pages, DR, lead capture
  //    Output: 5 (no motion-static — DR rarely uses subtle motion).
  //    Sub-methods include LEAD GEN (locked-in addition).
  // ─────────────────────────────────────────────────────────
  {
    id: "affiliate-ad",
    label: "Affiliate Ad",
    description: "Paid landing pages, DR funnels, lead gen, comparison ads.",
    tooltip: {
      mentalState: "I need to send cold traffic to a specific landing page.",
      working: "AI reads your landing page URL and generates direct-response creatives.",
      bestWhen: "Paid social for landing pages, affiliate, DR funnels, lead capture.",
      example: "12 DR statics for a supplement landing page — urgency + comparison angles.",
    },
    outputTypes: ["image", "video", "carousel", "adcopy", "text-only"],
    defaultOutputType: "image",
    defaultSubMethod: "dr-funnel",
    subMethods: [
      { id: "lead-gen", label: "Lead Gen" },
      { id: "dr-funnel", label: "DR funnel" },
      { id: "catalog", label: "Catalog" },
      { id: "comparison", label: "Comparison" },
      { id: "retargeting", label: "Retargeting" },
      { id: "festival", label: "Festival / Seasonal" },
    ],
    formFields: [
      "sub-method-picker",
      "output-type-picker",
      "url-input",
      "brand-picker",
      "audience-picker",
      "angle-picker",
      "tone-picker",
      "format-picker",
      "count-picker",
      "references-panel",
      "prompt-override",
    ],
    wizardSteps: [
      { id: "mode", title: "Output type", types: ["sub-method-picker", "output-type-picker"] },
      { id: "source", title: "Landing page", types: ["url-input", "brand-picker"] },
      DIRECTION_STEP,
      REFS_STEP,
      { id: "output", title: "Output settings", types: ["format-picker", "count-picker"] },
      REVIEW_STEP,
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 4. UGC Video — avatar-led talking-head, demo, testimonial
  //    Output: 2 (Video + Adcopy — UGC creators write Meta copy too)
  // ─────────────────────────────────────────────────────────
  {
    id: "ugc-video",
    label: "UGC Video",
    description: "Avatar + product demos that feel human. Plus the supporting ad copy.",
    tooltip: {
      mentalState: "I want a talking-head or demo video without a film crew.",
      working: "AI generates avatar-based UGC videos with your voice, script, and product. Includes Meta ad copy alongside.",
      bestWhen: "Awareness + consideration, performance video, TikTok-style.",
      example: "Priya avatar talking about Mamaearth Onion Shampoo — 9:16, 4 variants + 8 ad copy hooks.",
    },
    outputTypes: ["video", "adcopy"],
    defaultOutputType: "video",
    defaultSubMethod: "avatar-led",
    subMethods: [
      { id: "avatar-led", label: "Avatar-led" },
      { id: "script-first", label: "Script-first" },
      { id: "product-demo", label: "Product demo" },
      { id: "testimonial", label: "Testimonial" },
      { id: "talking-head", label: "Talking head" },
      { id: "reaction", label: "Reaction" },
      { id: "b-roll-only", label: "B-roll only" },
    ],
    formFields: [
      "sub-method-picker",
      "output-type-picker",
      "brand-picker",
      "product-picker",
      "avatar-picker",
      "voice-picker",
      "script-input",
      "audience-picker",
      "angle-picker",
      "tone-picker",
      "format-picker",
      "count-picker",
      "references-panel",
      "prompt-override",
    ],
    wizardSteps: [
      { id: "mode", title: "UGC type", types: ["sub-method-picker", "output-type-picker"] },
      { id: "source", title: "Brand & Product", types: ["brand-picker", "product-picker"] },
      { id: "talent", title: "Avatar & Script", types: ["avatar-picker", "voice-picker", "script-input"] },
      DIRECTION_STEP,
      { id: "output", title: "Output settings", types: ["format-picker", "count-picker"] },
      REVIEW_STEP,
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 5. Variants (id stays `forge`) — clone/vary an existing winner
  //    No output type field — inherits from parent winner.
  //    Sub-method = scope of variation.
  //    Two-axis pattern: Intent (Subtle/Strong/Wild) × Scope.
  // ─────────────────────────────────────────────────────────
  {
    id: "forge",
    label: "Variants",
    description: "Create variants from a winning ad — vary intent (subtle / strong) and scope (whole / media / text / hooks).",
    tooltip: {
      mentalState: "I have a winning ad and want more like it.",
      working: "AI studies your winner and generates variants. Pick how far to stray (Subtle / Strong / Wild) and what to vary (Whole-ad / Media-only / Text-only / Hooks-only).",
      bestWhen: "Scaling a proven winner, fighting creative fatigue, hook A/B.",
      example: "Variants from Mamaearth Onion Shampoo winner — Subtle intent, Hooks-only scope.",
    },
    // Variants inherits output type from parent winner — no allowlist needed
    outputTypes: [],
    defaultOutputType: "image", // unused; placeholder
    defaultSubMethod: "whole-ad",
    subMethods: [
      { id: "whole-ad", label: "Whole ad" },
      { id: "media-only", label: "Media only" },
      { id: "text-only", label: "Text only" },
      { id: "hooks-only", label: "Hooks only" },
    ],
    formFields: [
      "sub-method-picker",
      "source-winner-picker",
      "count-picker",
      "prompt-override",
    ],
    wizardSteps: [
      { id: "source", title: "Source winner", types: ["sub-method-picker", "source-winner-picker"] },
      { id: "output", title: "Output settings", types: ["count-picker"] },
      REVIEW_STEP,
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 6. Image to Ad (merged former 6 + 7)
  //    Output: 4 (Image / Motion-static / Video / Adcopy)
  //    No carousel (single source image), no text-only (would waste image input).
  // ─────────────────────────────────────────────────────────
  {
    id: "image-to-ad",
    label: "Image to Ad",
    description: "Turn a product image (or brief) into a polished ad — image, motion, video, or copy.",
    tooltip: {
      mentalState: "I have a product photo, give me an ad.",
      working: "AI analyses the source image (or brief) and produces image / motion-static / video / ad copy. Output type drives whether motion-style sub-method is shown.",
      bestWhen: "Quick repurposing, image you already have, brief-to-batch testing.",
      example: "Plum Vitamin C Serum image → 12 motion-static parallax variants for IG.",
    },
    outputTypes: ["image", "motion-static", "video", "adcopy"],
    defaultOutputType: "image",
    defaultSubMethod: "image-to-ad",
    subMethods: [
      { id: "image-to-ad", label: "Image to Ad" },
      { id: "brief-to-ad", label: "Brief to Ad" },
      // Motion styles — relevant when outputType is video or motion-static
      { id: "motion-subtle", label: "Subtle motion" },
      { id: "motion-camera", label: "Camera move" },
      { id: "motion-element", label: "Element animation" },
      { id: "motion-full-ai", label: "Full AI motion" },
    ],
    formFields: [
      "sub-method-picker",
      "output-type-picker",
      "source-image-picker",
      "brand-picker",
      "audience-picker",
      "angle-picker",
      "tone-picker",
      "scene-picker",
      "format-picker",
      "count-picker",
      "references-panel",
      "prompt-override",
    ],
    wizardSteps: [
      { id: "mode", title: "Output + input method", types: ["output-type-picker", "sub-method-picker"] },
      { id: "source", title: "Source", types: ["source-image-picker", "brand-picker"] },
      DIRECTION_STEP,
      { id: "output", title: "Output settings", types: ["scene-picker", "format-picker", "count-picker"] },
      REVIEW_STEP,
    ],
  },
];

export function getModeConfig(mode: ModeId): ModeConfig {
  const config = modeConfigs.find((c) => c.id === mode);
  if (!config) throw new Error(`Unknown mode: ${mode}`);
  return config;
}
