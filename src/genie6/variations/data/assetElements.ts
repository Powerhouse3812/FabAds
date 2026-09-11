import { Building2, Compass, Layers, Lightbulb, Palette } from "lucide-react";
import type { AssetAnalysis, AssetElementDef, AssetElementId, AssetKind } from "../types";

/**
 * The five elements of an ASSET this flow can vary (Part 2).
 *
 * The narrow set is the owner's ruling (Maalik, 2026-09-09): angle, concept,
 * framework and visual direction, plus entity as a fourth control. The body is
 * deliberately absent — change the angle, concept or framework and the new
 * words follow from that.
 *
 * Order follows the `AssetElementId` union in types.ts rather than the
 * `AssetAnalysis` row order, because entity is a dedicated control at the end
 * of the panel and not one of the three "what it says" levers.
 *
 * `promptFrom` seeds the manual textarea. Every one has a detection-grounded
 * form and a not-found form — a null must never reach user-visible text.
 */

const ALL_KINDS: AssetKind[] = ["script", "concept", "storyboard"];

/** Script + storyboard only. A concept has no PAS/AIDA structure to switch. */
const SCRIPTED_KINDS: AssetKind[] = ["script", "storyboard"];

const ELEMENTS: Record<AssetElementId, AssetElementDef> = {
  angle: {
    id: "angle",
    label: "Angle",
    actionLabel: "Change Angle",
    desc: "Argues for the same thing on a different reason to buy.",
    Icon: Compass,
    field: "angle",
    appliesTo: ALL_KINDS,
    promptFrom: (a) =>
      a.angle.value
        ? `Move off the "${a.angle.value}" angle to a different one. Keep the same subject and the same length.`
        : `Argue for the same subject from a different angle. Keep the same length.`,
  },
  concept: {
    id: "concept",
    label: "Concept",
    actionLabel: "Change Concept",
    desc: "Rebuilds the asset on a different creative idea.",
    Icon: Lightbulb,
    field: "concept",
    appliesTo: ALL_KINDS,
    promptFrom: (a) =>
      a.concept.value
        ? `Rebuild this on a new concept instead of "${a.concept.value}". Hold the angle steady.`
        : `Rebuild this on a new concept. Hold the angle steady.`,
  },
  framework: {
    id: "framework",
    label: "Framework",
    actionLabel: "Switch Framework",
    desc: "Reorders the same argument into a different copy structure.",
    Icon: Layers,
    field: "framework",
    appliesTo: SCRIPTED_KINDS,
    promptFrom: (a) =>
      a.framework.value
        ? `Restructure this from ${a.framework.value} into a different framework. Same angle, same claims, new order.`
        : `Restructure this onto a named framework — PAS, AIDA, BAB or FAB. Same angle, same claims, new order.`,
  },
  "visual-direction": {
    id: "visual-direction",
    label: "Visual Direction",
    actionLabel: "Add Visuals",
    desc: "Sets the setting, lighting and shot style for each beat.",
    Icon: Palette,
    field: "visualDirection",
    appliesTo: ALL_KINDS,
    mandatoryFor: ["storyboard"],
    promptFrom: (a) => {
      if (!a.hasVisuals) {
        return "Add visuals, turning this into a storyboard — give every beat a setting, a lighting note and a shot style. Leave the words alone.";
      }
      return a.visualDirection.value
        ? `Change the existing visual direction — take it away from "${a.visualDirection.value}" to a new setting, lighting and shot style. Leave the words alone.`
        : "Change the existing visual direction — new setting, lighting and shot style for every beat. Leave the words alone.";
    },
  },
  entity: {
    id: "entity",
    label: "Entity",
    actionLabel: "Change Entity",
    desc: "Optional — pick a brand, product or category. Leave it empty for Auto.",
    Icon: Building2,
    field: "entityName",
    appliesTo: ALL_KINDS,
    promptFrom: (a) =>
      a.entityName.value
        ? `Point these variations at a different entity. Currently ${a.entityName.value} — leave it empty for Auto.`
        : `Point these variations at a brand, product or category. Nothing is attached right now, so Auto is being used.`,
  },
};

/** Display order — matches the `AssetElementId` union in types.ts. */
export const ASSET_ELEMENTS: AssetElementDef[] = [
  ELEMENTS.angle,
  ELEMENTS.concept,
  ELEMENTS.framework,
  ELEMENTS["visual-direction"],
  ELEMENTS.entity,
];

/** Total over the closed id union, so callers can chain off it without a guard. */
export function getAssetElement(id: AssetElementId): AssetElementDef {
  return ELEMENTS[id];
}

/** The elements offerable for a kind — framework skips concept assets. */
export function assetElementsFor(kind: AssetKind): AssetElementDef[] {
  return ASSET_ELEMENTS.filter((e) => e.appliesTo.includes(kind));
}

export function appliesToKind(id: AssetElementId, kind: AssetKind): boolean {
  return ELEMENTS[id].appliesTo.includes(kind);
}

/** Visual direction on a storyboard — changeable, never removable. */
export function isMandatoryFor(id: AssetElementId, kind: AssetKind): boolean {
  return !!ELEMENTS[id].mandatoryFor?.includes(kind);
}

/**
 * The action verb adapts to what exists: adding visuals to a script is a
 * different move from re-directing a storyboard, on the same element.
 */
export function assetActionLabel(id: AssetElementId, analysis: AssetAnalysis): string {
  if (id === "visual-direction") {
    return analysis.hasVisuals ? "Change Visuals" : "Add Visuals";
  }
  return ELEMENTS[id].actionLabel;
}

/** Ranking tiebreak: earlier in the display order wins. */
export function assetElementOrder(id: AssetElementId): number {
  return ASSET_ELEMENTS.findIndex((e) => e.id === id);
}
