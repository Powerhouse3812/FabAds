/**
 * frameworkSegments — deterministic, video-sage-style script-timeline
 * derivation for the credit-gated Framework sub-tab.
 *
 * Everything here is explicitly a PREDICTION, not a measurement: this repo's
 * data model has no per-second video timing on any entity (grep confirms —
 * DailyRow/AdInstance/Creative carry no duration field), so segment lengths
 * are illustrative estimates, always rendered behind a "Predicted" badge by
 * the caller. What IS real: `creative.script.framework` (an existing tagged
 * field) drives which stage sequence is used.
 *
 * Deterministic by construction — seeded off `hashString(creative.id + salt)`
 * (src/data/rng.ts), the same helper the mock data generator uses, so the
 * output is byte-identical across reloads. No Math.random anywhere in this
 * file; runDataAudit() never touches this module (it's presentation-layer
 * only, not part of the audited dataset) but the "no Math.random" rule is
 * repo-wide, so it's honoured here regardless.
 */
import { hashString, seededRandom, randInt, pick } from "@/data/rng";
import type { Creative, Framework } from "@/data/model";

export interface FrameworkSegment {
  key: string;
  label: string;
  /** Tailwind background class — proportional segment colour. */
  colorClass: string;
  durationSec: number;
  /** Predicted dialog/audio note for this segment — illustrative. */
  note: string;
}

const SEGMENT_COLOR: Record<string, string> = {
  hook: "bg-amber-400",
  discovery: "bg-lime-400",
  benefits: "bg-violet-400",
  beforeAfter: "bg-teal-400",
  cta: "bg-rose-400",
};

// Illustrative per-framework stage sequences — mirrors the copy structure a
// script tagged with this framework tends to follow. Same honesty class as
// the `script.framework` tag itself (model.ts: "an illustrative tag, not a
// live classification").
const FRAMEWORK_STAGES: Record<Framework, { key: string; label: string }[]> = {
  PAS: [
    { key: "hook", label: "Hook" },
    { key: "discovery", label: "Problem" },
    { key: "benefits", label: "Agitate" },
    { key: "beforeAfter", label: "Solution" },
    { key: "cta", label: "CTA" },
  ],
  AIDA: [
    { key: "hook", label: "Hook" },
    { key: "discovery", label: "Interest" },
    { key: "benefits", label: "Desire" },
    { key: "cta", label: "CTA" },
  ],
  BAB: [
    { key: "hook", label: "Hook" },
    { key: "discovery", label: "Before" },
    { key: "beforeAfter", label: "After" },
    { key: "benefits", label: "Bridge" },
    { key: "cta", label: "CTA" },
  ],
  FAB: [
    { key: "hook", label: "Hook" },
    { key: "discovery", label: "Feature" },
    { key: "benefits", label: "Advantage" },
    { key: "beforeAfter", label: "Benefit" },
    { key: "cta", label: "CTA" },
  ],
  "Star-Story-Solution": [
    { key: "hook", label: "Star" },
    { key: "discovery", label: "Story" },
    { key: "benefits", label: "Tension" },
    { key: "beforeAfter", label: "Solution" },
    { key: "cta", label: "CTA" },
  ],
};

const DIALOG_NOTES = [
  "Curiosity gap builds an urge to stop and clear it.",
  "Direct address names the viewer's problem in plain language.",
  "Music playing in background, no dialog.",
  "Testimonial-style voiceover reinforces the claim.",
  "On-screen text carries the beat, no dialog.",
  "A pattern interrupt resets attention here.",
] as const;

const SUMMARY_TEMPLATES: Record<Framework, string> = {
  PAS: "This creative opens on a hook before naming a problem, agitating it, then resolving it with the offer — a classic problem-agitate-solution build.",
  AIDA: "This creative moves through attention, interest and desire before closing on a direct call to action.",
  BAB: "This creative frames a before state, contrasts it with an after state, then bridges the gap with the offer.",
  FAB: "This creative walks a feature into its advantage and then the benefit the viewer actually cares about.",
  "Star-Story-Solution": "This creative introduces a lead ('star'), builds a short story around them, then lands on the solution.",
};

/** Predicted, deterministic segment breakdown for one creative. */
export function deriveFrameworkSegments(creative: Creative): FrameworkSegment[] {
  const rand = seededRandom(hashString(`${creative.id}:framework-segments`));
  const stages = FRAMEWORK_STAGES[creative.script.framework];
  return stages.map((stage) => ({
    key: stage.key,
    label: stage.label,
    colorClass: SEGMENT_COLOR[stage.key],
    durationSec: randInt(rand, 3, 12),
    note: pick(DIALOG_NOTES, rand),
  }));
}

export function totalDurationSec(segments: FrameworkSegment[]): number {
  return segments.reduce((sum, seg) => sum + seg.durationSec, 0);
}

/** Predicted one-line summary of the creative's script arc. Deterministic —
 *  keyed off the framework tag only, no randomness needed. */
export function deriveFrameworkSummary(creative: Creative): string {
  return SUMMARY_TEMPLATES[creative.script.framework];
}
