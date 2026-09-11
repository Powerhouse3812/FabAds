import type {
  AnalysedField,
  AssetAnalysis,
  AssetElementId,
  RecommendedAction,
} from "../types";
import {
  ASSET_ELEMENTS,
  assetActionLabel,
  assetElementOrder,
  getAssetElement,
} from "./assetElements";

/**
 * Which 3-4 quick actions to offer for THIS asset — the Part 2 twin of
 * `recommendedActionsFor`, and it keeps that file's two hard rules: fail
 * closed (never offer an element the source can't carry) and never justify an
 * action with something the analysis didn't find.
 *
 * Scoring is kind-aware, because the highest-value move genuinely differs:
 * on a script with no visuals it is adding them (that turns the run's output
 * into storyboards), on a storyboard the visuals already exist so the move is
 * re-directing them, and on a concept there is no framework at all — its
 * strongest levers are angle, visual direction and attaching an entity.
 */

const MAX = 4;
/** A 4th action has to be worth a chip; below this we show 3. */
const FOURTH_FLOOR = 60;

const ALL_ELEMENTS: AssetElementId[] = ASSET_ELEMENTS.map((e) => e.id);

function fieldOf(a: AssetAnalysis, element: AssetElementId): AnalysedField<unknown> {
  return a[getAssetElement(element).field] as AnalysedField<unknown>;
}

function isDerived(a: AssetAnalysis, element: AssetElementId): boolean {
  return fieldOf(a, element).provenance === "detected";
}

function valueOf(a: AssetAnalysis, element: AssetElementId): string | null {
  const v = fieldOf(a, element).value;
  return typeof v === "string" && v.trim() ? v : null;
}

/**
 * The entity row is two fields, and §7.2 binds: a competitor's brand is
 * display text on the analysis and is never something the user "has".
 */
function hasEntity(a: AssetAnalysis): boolean {
  if (a.source.competitorOwned) return false;
  if (a.type.provenance === "not-found" || a.type.value === "not-found") return false;
  return a.entityName.provenance !== "not-found";
}

/**
 * `RecommendedAction.element` in types.ts is typed `VariationElementId`, which
 * cannot name "framework" or "entity" — it predates Part 2 and wants widening
 * to `AnyElementId` (as `VariationEdit.element` already is). Reported, not
 * edited; this is the one cast that gap forces.
 */
function act(
  a: AssetAnalysis,
  element: AssetElementId,
  reason: string,
): RecommendedAction {
  return {
    element: element as RecommendedAction["element"],
    label: assetActionLabel(element, a),
    reason,
  };
}

/* ------------------------------------------------------------ capability */

/** appliesTo is the only gate — it is what keeps framework off a concept. */
function canVary(a: AssetAnalysis, element: AssetElementId): boolean {
  return getAssetElement(element).appliesTo.includes(a.assetKind);
}

/* --------------------------------------------------------------- scoring */

function baseScore(a: AssetAnalysis, element: AssetElementId): number {
  switch (element) {
    case "angle":
      return 90;
    case "visual-direction":
      // Adding visuals to a script is the one move that changes what the run
      // produces, so it outranks everything; on a storyboard it's an edit.
      if (!a.hasVisuals) return a.assetKind === "script" ? 100 : 80;
      return 70;
    case "concept":
      // Rebuilding the idea of a Concept asset is close to starting over.
      return a.assetKind === "concept" ? 55 : 70;
    case "framework":
      return 65;
    case "entity":
      // Unattached, an asset generates for nobody in particular — and a bare
      // Concept is the kind that gains most from being pointed at something.
      if (!hasEntity(a)) return 85;
      return a.assetKind === "concept" ? 70 : 30;
  }
}

function score(a: AssetAnalysis, element: AssetElementId): number {
  // Derived beats absent but loses to stored — we don't know it's what the
  // asset actually used. Entity leans on `type`, not its own row's trust.
  const trust = element !== "entity" && isDerived(a, element) ? -20 : 0;
  return baseScore(a, element) + trust;
}

/* --------------------------------------------------------------- reasons */

function kindNoun(a: AssetAnalysis): string {
  return a.assetKind === "storyboard" ? "storyboard" : a.assetKind;
}

/**
 * How much of a detected value a reason may quote. A reason is ONE line in a
 * compact card in a grid, and some detected values are long prose — a 5-scene
 * storyboard's visual direction is the whole shot list (400+ chars), which
 * doubled its card's row and stretched every sibling. The bound belongs here,
 * at the source: "one short line" is a property of the data, not of the card.
 */
const VALUE_BUDGET = 44;

/** The first beat/clause of a detected value, cut on a word boundary. Naming
 *  what was actually detected is the point of these reasons, so this trims the
 *  value rather than replacing it with something generic. */
function short(raw: string): string {
  // " · " joins a storyboard's scenes and a concept's direction fragments;
  // " → " joins scene beats.
  const first = raw.trim().split(/\s+(?:·|→)\s+/)[0].trim();
  if (first.length <= VALUE_BUDGET) return first;
  const cut = first.slice(0, VALUE_BUDGET);
  const space = cut.lastIndexOf(" ");
  const kept = space > VALUE_BUDGET / 2 ? cut.slice(0, space) : cut;
  return `${kept.replace(/[\s,;:.—-]+$/, "")}…`;
}

function reasonFor(a: AssetAnalysis, element: AssetElementId): string {
  const v = valueOf(a, element);
  const derived = isDerived(a, element);

  switch (element) {
    case "angle":
      if (v && !derived) return `Angle on file is "${short(v)}" — a different one reuses the rest of this ${kindNoun(a)}.`;
      if (v) return `Angle reads as "${short(v)}" (derived) — a new one doesn't depend on that.`;
      return "No angle stored — a different reason to buy is the cheapest change here.";
    case "concept":
      if (v && !derived) return `Concept is "${short(v)}" — a new idea keeps the angle intact.`;
      if (v) return `Concept reads as "${short(v)}" (derived) — a fresh idea keeps the angle.`;
      return "No concept stored — a fresh idea keeps the angle intact.";
    case "framework":
      if (v && !derived) return `Written on ${short(v)} — the same claims in another structure read differently.`;
      if (v) return `Structure reads as ${short(v)} (derived) — switching it keeps every claim.`;
      return "No framework stored — putting this on PAS, AIDA, BAB or FAB tightens it.";
    case "visual-direction":
      if (!a.hasVisuals) {
        return a.assetKind === "script"
          ? "A script with no visuals — adding them makes each variation a storyboard."
          : `No visuals on this ${kindNoun(a)} — adding them shows what it looks like.`;
      }
      if (v && !derived) return `Shot direction opens on "${short(v)}" — re-directing reuses every line as written.`;
      if (v) return `Look reads as "${short(v)}" (derived) — a new direction reuses the words.`;
      return "Visuals are here but none of the direction was stored — re-directing is safe.";
    case "entity":
      if (a.source.competitorOwned) return "Source is a competitor's — attach one of your own brands or products.";
      if (!hasEntity(a)) return "Nothing is attached — point these at a brand, product or category.";
      if (v && !derived) return `Currently for ${short(v)} — the same ${kindNoun(a)} for a different one is a new set.`;
      if (v) return `Reads as ${short(v)} (derived) — set it yourself if that isn't right.`;
      return "Attached, but we couldn't read to what — name the brand or product explicitly.";
  }
}

/* ------------------------------------------------------------- the rule */

export function assetRecommendationsFor(analysis: AssetAnalysis): RecommendedAction[] {
  const ranked = ALL_ELEMENTS.filter((e) => canVary(analysis, e))
    .map((e) => ({ element: e, s: score(analysis, e) }))
    .sort(
      (x, y) =>
        y.s - x.s || assetElementOrder(x.element) - assetElementOrder(y.element),
    );

  const picked = ranked.slice(0, MAX);
  // Never pad to four with something barely worth tapping.
  if (picked.length === MAX && picked[MAX - 1].s < FOURTH_FLOOR) picked.pop();

  return picked.map(({ element }) => act(analysis, element, reasonFor(analysis, element)));
}
