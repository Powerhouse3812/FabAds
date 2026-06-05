import type { Mode } from "../state/useWizard";

/**
 * approach-subtypes — per-approach sub-types + the auto-fill mapping for the
 * Selection & Preview redesign (Maalik MOM 06-05).
 *
 * Decisions locked with Maalik:
 *  - Approach selection stays its OWN step, but each approach can carry
 *    sub-types (e.g. UGC Video → Tutorial / Unboxing / Talking-head …).
 *  - After approach (+ sub-type) is chosen, the Configure screen AUTO-FILLS
 *    angle + concept and shows them COLLAPSED on the prompt bar (editable).
 *
 * `autoFillForApproach()` is the single source of that auto-fill: given a mode
 * + optional sub-type, it returns the angle id + concept ids to pre-select.
 * Concept ids reference `data/concepts.ts` (CONCEPTS[].id).
 */

export interface ApproachSubType {
  id: string;
  label: string;
  desc: string;
  /** Angle auto-applied when this sub-type is chosen. */
  autoAngleId: string;
  /** Concept(s) auto-selected (concepts.ts ids). */
  conceptIds: string[];
}

/**
 * Sub-types per approach. Only approaches that genuinely branch carry entries;
 * the rest map to [] (no sub-type step). UGC Video is the richest per the MOM.
 */
export const APPROACH_SUBTYPES: Record<Mode, ApproachSubType[]> = {
  "ugc-video": [
    { id: "talking-head", label: "Talking head", desc: "Creator speaks to camera, script-led.", autoAngleId: "ugc-style", conceptIds: ["c-ugc-creator"] },
    { id: "tutorial",     label: "Tutorial",     desc: "Step-by-step how-to with the product.", autoAngleId: "educational", conceptIds: ["c-ugc-creator"] },
    { id: "unboxing",     label: "Unboxing",     desc: "First-open reveal + reaction.", autoAngleId: "unboxing", conceptIds: ["c-ugc-creator"] },
    { id: "reaction",     label: "Reaction",     desc: "Genuine first-impression reaction.", autoAngleId: "social-proof", conceptIds: ["c-ugc-creator"] },
    { id: "testimonial",  label: "Testimonial",  desc: "Customer shares a real result.", autoAngleId: "testimonial", conceptIds: ["c-before-after"] },
    { id: "day-in-life",  label: "Day in the life", desc: "Product woven into a daily routine.", autoAngleId: "lifestyle", conceptIds: ["c-morning-ritual"] },
  ],
  "create-variations": [
    { id: "whole-ad",   label: "Whole ad",   desc: "Re-imagine the entire creative.", autoAngleId: "hero", conceptIds: ["c-hero-pack"] },
    { id: "media-only", label: "Media only", desc: "Keep copy, vary the visual.", autoAngleId: "lifestyle", conceptIds: ["c-morning-ritual"] },
    { id: "copy-only",  label: "Copy only",  desc: "Keep visual, vary the copy.", autoAngleId: "benefit-led", conceptIds: ["c-hero-pack"] },
  ],
  "image-to-video": [
    { id: "subtle",    label: "Subtle motion", desc: "Gentle parallax / drift on a still.", autoAngleId: "premium", conceptIds: ["c-detail-macro"] },
    { id: "full-ai",   label: "Full AI",       desc: "Fully animate the scene.", autoAngleId: "hero", conceptIds: ["c-hero-pack"] },
  ],
  "broll": [],
  "bg-remover": [],
  "resize": [],
  "scratch": [],
};

/** Does this approach have sub-types to choose from? */
export function hasSubTypes(mode: Mode): boolean {
  return (APPROACH_SUBTYPES[mode]?.length ?? 0) > 0;
}

export function getSubType(mode: Mode, subTypeId: string | null): ApproachSubType | undefined {
  if (!subTypeId) return undefined;
  return APPROACH_SUBTYPES[mode]?.find((s) => s.id === subTypeId);
}

export interface AutoFill {
  angleId: string | null;
  conceptIds: string[];
}

/**
 * The auto-fill for a given approach (+ optional sub-type). Sub-type wins; else
 * fall back to a sensible per-approach default. Consumed by AlphaStep3Configure
 * to pre-select angle + concept (shown collapsed on the prompt bar).
 */
export function autoFillForApproach(mode: Mode, subTypeId: string | null): AutoFill {
  const sub = getSubType(mode, subTypeId);
  if (sub) return { angleId: sub.autoAngleId, conceptIds: sub.conceptIds };

  const DEFAULTS: Partial<Record<Mode, AutoFill>> = {
    "ugc-video":        { angleId: "ugc-style", conceptIds: ["c-ugc-creator"] },
    "create-variations": { angleId: "hero", conceptIds: ["c-hero-pack"] },
    "image-to-video":   { angleId: "hero", conceptIds: ["c-hero-pack"] },
    "broll":            { angleId: "lifestyle", conceptIds: [] },
    "bg-remover":       { angleId: "hero", conceptIds: [] },
    "resize":           { angleId: null, conceptIds: [] },
    "scratch":          { angleId: null, conceptIds: [] },
  };
  return DEFAULTS[mode] ?? { angleId: null, conceptIds: [] };
}
