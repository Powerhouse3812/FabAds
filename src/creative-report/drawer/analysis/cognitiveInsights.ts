/**
 * cognitiveInsights — deterministic, video-sage-style "brain/psychology"
 * predictions for the credit-gated Cognitive Insights sub-tab.
 *
 * Maalik's framing: this is "AI se analysis krwaya hua data, brain-psychology
 * ke according kaisa perform krega" — i.e. an AI-estimate layer, explicitly
 * NOT the report's own measured FB spend-side numbers. Everything this module
 * produces must render behind a "Predicted"/"AI estimate" badge, never the
 * "Measured" one VisualSummaryPanel uses for hookRate/holdRate/win-rates.
 *
 * Per the audited data model: per-element attribution for a single creative
 * cannot be computed (no elementId on DailyRow, nothing to attribute a daily
 * row to a component) — so there is no invented composite score here, seeded
 * or otherwise. This module only enumerates the elements the qualitative
 * engagement note reasons over, plus that note's own prose.
 * Deterministic via hashString (src/data/rng.ts), no Math.random, so the
 * copy is byte-identical across reloads.
 */
import { hashString, seededRandom, pick } from "@/data/rng";
import type { ComponentKind, Creative } from "@/data/model";

export interface PredictedElement {
  kind: ComponentKind;
  label: string;
  value: string;
}

const ELEMENT_LABEL: Record<ComponentKind, string> = {
  hook: "Hook",
  headline: "Headline",
  "primary-text": "Primary text",
  cta: "CTA",
  "visual-style": "Visual style",
};

function valueForKind(creative: Creative, kind: ComponentKind): string {
  switch (kind) {
    case "hook":
      return creative.components.hook;
    case "headline":
      return creative.components.headline;
    case "primary-text":
      return creative.components.primaryText;
    case "cta":
      return creative.components.cta;
    case "visual-style":
      return creative.components.visualStyle;
  }
}

const KINDS: readonly ComponentKind[] = ["hook", "headline", "primary-text", "cta", "visual-style"];

/** The elements this creative's engagement estimate reasons over — label +
 *  actual tagged value only, no per-element score (no elementId exists to
 *  compute one for real; see the module doc). Order is fixed (not seeded)
 *  since there's no ranking to derive. */
export function derivePredictedElements(creative: Creative): PredictedElement[] {
  return KINDS.map((kind) => ({
    kind,
    label: ELEMENT_LABEL[kind],
    value: valueForKind(creative, kind),
  }));
}

const PEAK_MOMENTS = [
  "the opening frame, where the pattern interrupt lands",
  "the mid-roll reveal, where the problem crystallizes",
  "the before/after cut, where the contrast is sharpest",
  "the close-up on the product, right before the CTA",
  "the CTA itself, where urgency language appears",
] as const;

/** Predicted engagement-peak prose — deterministic, framed as an estimate.
 *  Draws on the creative's already-tagged `tags` (messagingAngle, hookTactic,
 *  emotion) for narrative grounding rather than inventing new attributes —
 *  those tags are themselves illustrative (same honesty class), so this
 *  stays one level of "predicted" derived from already-labelled inputs. */
export function derivePredictedEngagementNote(creative: Creative): string {
  const rand = seededRandom(hashString(`${creative.id}:cognitive-note`));
  const peak = pick(PEAK_MOMENTS, rand);
  return `Estimated engagement likely peaks around ${peak}. The "${creative.tags.hookTactic}" hook tactic paired with a "${creative.tags.emotion}" emotional register is the model's best guess for why — not a measured retention curve.`;
}

/** Predicted "levers" this creative appears to pull, for the sub-tab's
 *  summary chips. Deterministic, drawn from existing tag fields. */
export function derivePredictedLevers(creative: Creative): string[] {
  return [creative.tags.messagingAngle, creative.tags.hookTactic, creative.tags.offerType];
}
