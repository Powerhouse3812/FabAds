import {
  AudioLines,
  Compass,
  Crop,
  FileText,
  Languages,
  Lightbulb,
  Package,
  Palette,
  UserRound,
} from "lucide-react";
import type { VariationElementDef, VariationElementId } from "../types";

/**
 * The nine elements of a WHOLE AD this flow can vary (Part 1 only).
 *
 * Order matches the overview's row order in `AdAnalysis`, so a chip and the
 * row it edits never appear in a different sequence to the user.
 *
 * `promptFrom` is the seed text for the manual textarea. It must read as a
 * usable instruction and must never surface a null — every one has a
 * detection-grounded form and a not-found form.
 */

/** Keeps a long detected script from filling the textarea it seeds. */
function clip(text: string, max = 90): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max).trimEnd()}…` : flat;
}

const ELEMENTS: Record<VariationElementId, VariationElementDef> = {
  product: {
    id: "product",
    label: "Product",
    actionLabel: "Product Swap",
    desc: "Runs the same ad for a different product.",
    Icon: Package,
    field: "entityName",
    promptFrom: (a) =>
      a.entityName.value
        ? `Swap the product from ${a.entityName.value} to a different one. Keep the angle, the pacing and the copy structure exactly as they are.`
        : `Swap in a different product from the catalogue. Keep the angle, the pacing and the copy structure exactly as they are.`,
  },
  angle: {
    id: "angle",
    label: "Angle",
    actionLabel: "Change Angle",
    desc: "Sells the same thing on a different argument.",
    Icon: Compass,
    field: "angle",
    promptFrom: (a) =>
      a.angle.value
        ? `Move off the "${a.angle.value}" angle to a different one. Same product, same visual treatment.`
        : `Argue for the same product from a different angle. Same product, same visual treatment.`,
  },
  concept: {
    id: "concept",
    label: "Concept",
    actionLabel: "Change Concept",
    desc: "Rebuilds the ad on a different creative idea.",
    Icon: Lightbulb,
    field: "concept",
    promptFrom: (a) =>
      a.concept.value
        ? `Rebuild the ad on a new concept instead of "${a.concept.value}". Hold the angle and the product steady.`
        : `Rebuild the ad on a new concept. Hold the angle and the product steady.`,
  },
  avatar: {
    id: "avatar",
    label: "Avatar",
    actionLabel: "Change Avatar",
    desc: "Recasts who presents the ad.",
    Icon: UserRound,
    field: "avatar",
    promptFrom: (a) => {
      if (!a.avatar.value) {
        return "Recast the presenter — use a different avatar and keep the script and the delivery as they are.";
      }
      const detail = a.avatar.detail ? ` (${a.avatar.detail})` : "";
      return `Recast the presenter. Currently ${a.avatar.value}${detail} — use a different avatar and keep the script and the delivery as they are.`;
    },
  },
  voice: {
    id: "voice",
    label: "Voice",
    actionLabel: "Change Voice",
    desc: "Reads the same script in a different voice.",
    Icon: AudioLines,
    field: "voice",
    promptFrom: (a) => {
      if (!a.voice.value) {
        return "Read the same script in a different voice. Same words, same timing.";
      }
      const detail = a.voice.detail ? ` (${a.voice.detail})` : "";
      return `Change the voice from ${a.voice.value}${detail} to a different one. Same words, same timing.`;
    },
  },
  language: {
    id: "language",
    label: "Language",
    actionLabel: "Change Language",
    desc: "Produces the same ad in another language.",
    Icon: Languages,
    field: "language",
    promptFrom: (a) =>
      a.language.value
        ? `Produce this in a language other than ${a.language.value}. Adapt the idioms rather than translating word for word.`
        : `Produce this in a different language. Adapt the idioms rather than translating word for word.`,
  },
  script: {
    id: "script",
    label: "Script",
    actionLabel: "Rewrite Script",
    desc: "Rewrites the words, keeps everything else.",
    Icon: FileText,
    field: "script",
    promptFrom: (a) =>
      a.script.value
        ? `Rewrite the script. It currently opens with "${clip(a.script.value)}" — keep roughly the same length and the same call to action.`
        : `Rewrite the script for this ad. Keep roughly the same length and the same call to action.`,
  },
  "visual-direction": {
    id: "visual-direction",
    label: "Visual Direction",
    actionLabel: "Change Visual Direction",
    desc: "Changes the setting, lighting and shot style.",
    Icon: Palette,
    field: "visualDirection",
    promptFrom: (a) =>
      a.visualDirection.value
        ? `Take the look away from "${a.visualDirection.value}" — new setting, lighting and shot style. Keep the script and the product as they are.`
        : `Give the ad a different setting, lighting and shot style. Keep the script and the product as they are.`,
  },
  "aspect-ratio": {
    id: "aspect-ratio",
    label: "Aspect Ratio",
    actionLabel: "Change Aspect Ratio",
    desc: "Reframes the ad for a different placement.",
    Icon: Crop,
    field: "aspectRatio",
    promptFrom: (a) =>
      a.aspectRatio.value
        ? `Reframe from ${a.aspectRatio.value} to another aspect ratio. Keep the subject in frame and don't crop the text.`
        : `Reframe to a different aspect ratio. Keep the subject in frame and don't crop the text.`,
  },
};

/** Display order — the same order the overview lists the rows it edits. */
export const VARIATION_ELEMENTS: VariationElementDef[] = [
  ELEMENTS.product,
  ELEMENTS.angle,
  ELEMENTS.concept,
  ELEMENTS.avatar,
  ELEMENTS.voice,
  ELEMENTS.language,
  ELEMENTS.script,
  ELEMENTS["visual-direction"],
  ELEMENTS["aspect-ratio"],
];

/** Total over the closed id union, so callers can chain off it without a guard. */
export function getVariationElement(id: VariationElementId): VariationElementDef {
  return ELEMENTS[id];
}

/** Ranking tiebreak: earlier in the display order wins. */
export function elementOrder(id: VariationElementId): number {
  return VARIATION_ELEMENTS.findIndex((e) => e.id === id);
}
