/**
 * modeMatrix — the mode-aware INPUT ENGINE for Studio Alpha (FB-5752).
 *
 * The single source of truth for: given a top-level studio mode (Product Ad /
 * Brand Ad / Product Shoot / Performance Ad / Social), what inputs are
 * REQUIRED vs OPTIONAL, whether a Performance "what are you promoting?" sub-step
 * applies, and which creative APPROACHES are offered (and in what order).
 *
 * Before this engine, Studio's Approach step showed a generic 7-option list
 * (`ALL_MODES` in Step3Approach) regardless of what the user was actually
 * making, and every mode asked for the same inputs. This codifies the doc's
 * Mode → Required/Optional Inputs → Approaches matrix so the flow never asks
 * for irrelevant inputs and surfaces the right approaches per intent.
 *
 * Consumed by:
 *   - StudioHome           (mode cards — all modes now available)
 *   - Step2Product         (required/optional inputs + blockers + Performance sub-step)
 *   - Step3Approach        (approach list filtered/ordered per mode + sub-type + toggle)
 *   - AlphaStep3Configure  (auto-fill carries through via approach-subtypes)
 *
 * MOCK / design-prototype: no backend. Approach lists + copy are the UX spec.
 */

import {
  Camera,
  Megaphone,
  ShoppingBag,
  Smartphone,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { Mode } from "../state/useWizard";

/* ──────────────────────────────────────────────────────────────────────── *
 *  Top-level studio modes + Performance sub-types
 * ──────────────────────────────────────────────────────────────────────── */

/** Canonical top-level mode. Mirrors StudioHome's `AlphaMode` (kept in sync). */
export type StudioMode =
  | "product-ad"
  | "brand-ad"
  | "product-shoot"
  | "performance-ad"
  | "social";

/**
 * Performance Ad's "What are you promoting?" 3-way split (doc §, Maalik D3).
 * The market gap we own: nobody else distinguishes product vs service/SaaS
 * ad intent, so the offered approaches differ meaningfully per sub-type.
 */
export type PerformanceSubType =
  | "physical-product"
  | "app-saas"
  | "service-offer";

/** Selectable entity kinds Step 2 can require / offer. */
export type EntityKind =
  | "brand"
  | "product"
  | "category"
  | "product-image"
  | "niche";

/* ──────────────────────────────────────────────────────────────────────── *
 *  Approach catalog — creative approaches + utility (Edit/Adapt) ops.
 *  Approach ids ARE wizard `Mode` values (so auto-fill + visuals reuse the
 *  existing approach-subtypes / studio-visuals plumbing).
 * ──────────────────────────────────────────────────────────────────────── */

export type ApproachKind = "creative" | "utility";

export interface ApproachDef {
  id: Mode;
  title: string;
  desc: string;
  kind: ApproachKind;
}

/**
 * The full approach catalog. `modeMatrix` references these by id to compose
 * each mode's offered list. From Scratch is always appended LAST by the
 * resolver, never listed inside a mode's array.
 */
export const APPROACH_CATALOG: Record<Mode, ApproachDef> = {
  // ── Creative ──────────────────────────────────────────────────────────
  "product-hero": {
    id: "product-hero",
    title: "Product Hero",
    desc: "Product front-and-center — clean, conversion-first creative.",
    kind: "creative",
  },
  "problem-solution": {
    id: "problem-solution",
    title: "Problem → Solution",
    desc: "Open on the pain, land on your product as the fix.",
    kind: "creative",
  },
  "offer-push": {
    id: "offer-push",
    title: "Offer Push",
    desc: "Lead with the deal — urgency, discount, limited stock.",
    kind: "creative",
  },
  "eligibility-quiz": {
    id: "eligibility-quiz",
    title: "Eligibility Quiz",
    desc: "“Do you qualify?” framing — high-intent lead capture.",
    kind: "creative",
  },
  "founder-story": {
    id: "founder-story",
    title: "Founder Story",
    desc: "Personal origin + conviction — top-of-funnel trust.",
    kind: "creative",
  },
  "feature-demo": {
    id: "feature-demo",
    title: "Feature Demo",
    desc: "Show the product working — screens, flows, the “aha”.",
    kind: "creative",
  },
  "ugc-video": {
    id: "ugc-video",
    title: "UGC Video",
    desc: "Avatar-led talking-head, script-first.",
    kind: "creative",
  },
  "create-variations": {
    id: "create-variations",
    title: "Create Variations",
    desc: "Iterate on existing creatives — keep layout, colors, or copy.",
    kind: "creative",
  },
  "image-to-video": {
    id: "image-to-video",
    title: "Image to Video",
    desc: "Animate a static image — subtle motion or full AI.",
    kind: "creative",
  },
  scratch: {
    id: "scratch",
    title: "From scratch",
    desc: "Full flow — prompt, references, angle, model, output count.",
    kind: "creative",
  },
  // ── Utility (relocated to "Edit / Adapt") ───────────────────────────────
  broll: {
    id: "broll",
    title: "B-Roll",
    desc: "Cutaway footage to layer with primary content.",
    kind: "utility",
  },
  "bg-remover": {
    id: "bg-remover",
    title: "BG Remover",
    desc: "Strip backgrounds from product shots.",
    kind: "utility",
  },
  resize: {
    id: "resize",
    title: "Resize",
    desc: "Reformat to platform aspect ratios.",
    kind: "utility",
  },
};

/* ──────────────────────────────────────────────────────────────────────── *
 *  Mode definitions — the matrix itself
 * ──────────────────────────────────────────────────────────────────────── */

export interface ModeInputs {
  /**
   * Required entities. `oneOf` means the user must satisfy AT LEAST ONE of the
   * listed kinds (e.g. product OR category for Product Ad). `all` must each be
   * present (e.g. Product Shoot needs a product AND a product image).
   */
  requiredOneOf?: EntityKind[];
  requiredAll?: EntityKind[];
  /** Optional inputs surfaced but never blocking. */
  optional?: EntityKind[];
  /** Brand Ad's "Feature a product?" toggle. */
  productToggle?: boolean;
  /** Performance Ad's "What are you promoting?" 3-way sub-step. */
  performanceSubStep?: boolean;
}

export interface ModeBlocker {
  /** Short title shown on the guided blocker, e.g. "No products yet". */
  title: string;
  /** One-line explanation of what's missing + why it's needed. */
  body: string;
  /** Primary recovery CTA label. */
  ctaLabel: string;
}

export interface ModeDef {
  id: StudioMode;
  label: string;
  Icon: LucideIcon;
  /** Short tagline shown on the home mode card. */
  desc: string;
  /** Tonal scheme key (matches StudioHome SCHEME). */
  tone: "rose" | "fuchsia" | "lime" | "indigo" | "amber";
  inputs: ModeInputs;
  /** When the mode forces a single format (e.g. Product Shoot → image). */
  forcedFormat?: "image" | "video";
  /** Creative approach ids offered (order matters). Excludes From Scratch
   *  (appended last by the resolver) and utility ops (Edit/Adapt section). */
  approaches: Mode[];
  /** Guided blocker shown when required inputs are missing. */
  blocker: ModeBlocker;
}

export const MODE_MATRIX: Record<StudioMode, ModeDef> = {
  "product-ad": {
    id: "product-ad",
    label: "Product Ad",
    Icon: ShoppingBag,
    desc: "Conversion-driven product creative with offer + CTA.",
    tone: "lime",
    inputs: {
      requiredOneOf: ["product", "category"],
      optional: ["product-image"],
    },
    approaches: [
      "product-hero",
      "problem-solution",
      "ugc-video",
      "create-variations",
      "image-to-video",
    ],
    blocker: {
      title: "Pick a product to advertise",
      body: "Product Ads build around a specific product (or category). Choose one to continue, or paste a product URL.",
      ctaLabel: "Browse products",
    },
  },

  "brand-ad": {
    id: "brand-ad",
    label: "Brand Ad",
    Icon: Megaphone,
    desc: "Top-of-funnel awareness. Tone, story, brand positioning.",
    tone: "fuchsia",
    inputs: {
      requiredOneOf: ["brand"],
      productToggle: true,
      optional: ["product"],
    },
    approaches: [
      "founder-story",
      "problem-solution",
      "ugc-video",
      "create-variations",
    ],
    blocker: {
      title: "Pick a brand",
      body: "Brand Ads work at the brand level — tone, story, positioning. Choose a brand to continue.",
      ctaLabel: "Browse brands",
    },
  },

  "product-shoot": {
    id: "product-shoot",
    label: "Product Shoot",
    Icon: Camera,
    desc: "Studio-quality product photography. Hero shots, detail macros, bundles.",
    tone: "rose",
    inputs: {
      requiredAll: ["product", "product-image"],
    },
    forcedFormat: "image",
    approaches: ["product-hero", "create-variations", "image-to-video"],
    blocker: {
      title: "A product image is required",
      body: "Product Shoot restyles your real product photo. Pick a product that has an image, or upload one.",
      ctaLabel: "Upload product image",
    },
  },

  "performance-ad": {
    id: "performance-ad",
    label: "Performance Ad",
    Icon: TrendingUp,
    desc: "ROAS-driven format. Tested angles, urgency, social proof.",
    tone: "amber",
    inputs: {
      requiredOneOf: ["niche", "category", "product"],
      performanceSubStep: true,
    },
    // Default list (physical-product). Overridden per sub-type — see
    // PERFORMANCE_APPROACHES below + approachesForMode().
    approaches: ["product-hero", "offer-push", "problem-solution", "ugc-video"],
    blocker: {
      title: "Pick a niche or offer",
      body: "Performance Ads optimise around an offer. Choose a niche, category, or product to continue.",
      ctaLabel: "Browse offers",
    },
  },

  social: {
    id: "social",
    label: "Social",
    Icon: Smartphone,
    desc: "Adapt + reformat content for feed, Stories, Reels, carousels.",
    tone: "indigo",
    inputs: {
      optional: ["brand", "product", "category"],
    },
    approaches: ["create-variations", "image-to-video"],
    blocker: {
      title: "Nothing to adapt yet",
      body: "Social reformats existing creative. Pick a brand or product, or start from scratch.",
      ctaLabel: "Browse brands",
    },
  },
};

/**
 * Performance Ad's per-sub-type approach lists. The product-vs-SaaS-vs-service
 * distinction is the whole point of the 3-way split — each promotes differently.
 */
export const PERFORMANCE_APPROACHES: Record<PerformanceSubType, Mode[]> = {
  "physical-product": [
    "product-hero",
    "offer-push",
    "problem-solution",
    "ugc-video",
  ],
  "app-saas": [
    "feature-demo",
    "problem-solution",
    "offer-push",
    "ugc-video",
  ],
  "service-offer": [
    "offer-push",
    "eligibility-quiz",
    "founder-story",
    "problem-solution",
  ],
};

export const PERFORMANCE_SUBTYPES: {
  id: PerformanceSubType;
  label: string;
  desc: string;
}[] = [
  {
    id: "physical-product",
    label: "Physical Product",
    desc: "A shippable product — DTC, e-commerce, retail.",
  },
  {
    id: "app-saas",
    label: "App · SaaS",
    desc: "Software, a mobile app, or a subscription tool.",
  },
  {
    id: "service-offer",
    label: "Service · Offer · Affiliate",
    desc: "A service, lead-gen offer, or affiliate promotion.",
  },
];

/* ──────────────────────────────────────────────────────────────────────── *
 *  Resolvers
 * ──────────────────────────────────────────────────────────────────────── */

export function getModeDef(mode: StudioMode | null | undefined): ModeDef | undefined {
  if (!mode) return undefined;
  return MODE_MATRIX[mode];
}

/**
 * The ordered creative-approach list for a mode (+ optional Performance
 * sub-type + brand-ad product toggle). From Scratch is always appended last.
 */
export function approachesForMode(
  mode: StudioMode | null | undefined,
  opts?: { performanceSubType?: PerformanceSubType | null; featureProduct?: boolean },
): ApproachDef[] {
  const def = getModeDef(mode);
  if (!def) {
    return [APPROACH_CATALOG.scratch];
  }

  let ids: Mode[];
  if (mode === "performance-ad" && opts?.performanceSubType) {
    ids = [...PERFORMANCE_APPROACHES[opts.performanceSubType]];
  } else {
    ids = [...def.approaches];
  }

  // Brand Ad with "Feature a product?" ON → surface Product Hero too.
  if (mode === "brand-ad" && opts?.featureProduct && !ids.includes("product-hero")) {
    ids = ["product-hero", ...ids];
  }

  const list = ids
    .map((id) => APPROACH_CATALOG[id])
    .filter((a): a is ApproachDef => Boolean(a) && a.kind === "creative");

  // From Scratch always last (Maalik D4), de-duped.
  if (!list.some((a) => a.id === "scratch")) list.push(APPROACH_CATALOG.scratch);
  return list;
}

/** Utility ("Edit / Adapt") approaches — shown as a secondary section. */
export function utilityApproaches(): ApproachDef[] {
  return Object.values(APPROACH_CATALOG).filter((a) => a.kind === "utility");
}

/**
 * Does the user satisfy a mode's required inputs given the current selections?
 * Returns `{ ok, blocker }`. `ok=false` → render the guided blocker.
 */
export function checkModeInputs(
  mode: StudioMode | null | undefined,
  sel: {
    brandId?: string | null;
    productId?: string | null;
    categoryId?: string | null;
    hasProductImage?: boolean;
  },
): { ok: boolean; blocker: ModeBlocker | null; missing: EntityKind[] } {
  const def = getModeDef(mode);
  if (!def) return { ok: true, blocker: null, missing: [] };

  const present = (kind: EntityKind): boolean => {
    switch (kind) {
      case "brand":
        return Boolean(sel.brandId);
      case "product":
        return Boolean(sel.productId);
      case "category":
        return Boolean(sel.categoryId);
      case "niche":
        // niche is satisfied by a category or product proxy in the mock data
        return Boolean(sel.categoryId || sel.productId);
      case "product-image":
        return Boolean(sel.hasProductImage);
      default:
        return false;
    }
  };

  const missing: EntityKind[] = [];

  if (def.inputs.requiredOneOf && def.inputs.requiredOneOf.length > 0) {
    if (!def.inputs.requiredOneOf.some(present)) {
      missing.push(...def.inputs.requiredOneOf);
    }
  }
  if (def.inputs.requiredAll) {
    for (const kind of def.inputs.requiredAll) {
      if (!present(kind)) missing.push(kind);
    }
  }

  const ok = missing.length === 0;
  return { ok, blocker: ok ? null : def.blocker, missing };
}

/** All modes, in home-card display order. */
export const MODE_ORDER: StudioMode[] = [
  "product-ad",
  "brand-ad",
  "product-shoot",
  "performance-ad",
  "social",
];
