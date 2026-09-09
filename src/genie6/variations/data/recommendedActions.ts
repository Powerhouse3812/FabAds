import type {
  AdAnalysis,
  AnalysedField,
  RecommendedAction,
  VariationElementId,
} from "../types";
import {
  VARIATION_ELEMENTS,
  elementOrder,
  getVariationElement,
} from "./variationElements";

/**
 * Which 3-4 quick actions to offer for THIS ad.
 *
 * Two hard rules, both borrowed from the Other Flows grammar (flowTypes.ts):
 * fail closed — never offer an element the source can't support — and never
 * justify an action with anything the analysis didn't actually find.
 *
 * Three source shapes know almost nothing and get their own honest sets:
 * a competitor's ad, an unresolved type, and an upload. Everything else is
 * scored: media shape decides what's reachable, and a `detected` (derived)
 * field always ranks below a `stored` one because we're less sure of it.
 */

const MAX = 4;
/** A 4th action has to be worth a chip; below this we show 3. */
const FOURTH_FLOOR = 60;

/** Taken off the registry so a newly added element is ranked automatically. */
const ALL_ELEMENTS: VariationElementId[] = VARIATION_ELEMENTS.map((e) => e.id);

function fieldOf(a: AdAnalysis, element: VariationElementId): AnalysedField<unknown> {
  return a[getVariationElement(element).field] as AnalysedField<unknown>;
}

function found(a: AdAnalysis, element: VariationElementId): boolean {
  return fieldOf(a, element).provenance !== "not-found";
}

function isDerived(a: AdAnalysis, element: VariationElementId): boolean {
  return fieldOf(a, element).provenance === "detected";
}

function valueOf(a: AdAnalysis, element: VariationElementId): string | null {
  const v = fieldOf(a, element).value;
  return typeof v === "string" && v.trim() ? v : null;
}

function act(
  a: AdAnalysis,
  element: VariationElementId,
  reason: string,
  label?: string,
): RecommendedAction {
  return { element, label: label ?? getVariationElement(element).actionLabel, reason };
}

/* ------------------------------------------------------------ capability */

const VIDEO_FORMATS = new Set(["video"]);

function isVideo(a: AdAnalysis): boolean {
  return VIDEO_FORMATS.has(a.source.sourceFormat ?? "");
}

function hasProductToSwap(a: AdAnalysis): boolean {
  const typed = a.type.value === "product" || a.type.value === "category-product";
  // Can't swap a product we never identified — and a rival's product was never
  // in our catalogue to begin with (§7.2).
  if (a.source.competitorOwned) return false;
  return typed || found(a, "product");
}

/** Elements a given source can actually carry. */
function canVary(a: AdAnalysis, element: VariationElementId): boolean {
  switch (element) {
    case "product":
      return hasProductToSwap(a);
    case "avatar":
    case "voice":
      // A performer only exists on video, and only if we read one off it.
      return isVideo(a) && found(a, element);
    case "language":
      return isVideo(a) || found(a, "script") || found(a, "language");
    default:
      // angle / concept / script / visual-direction / aspect-ratio need
      // nothing from the catalogue and apply to any media.
      return true;
  }
}

/* --------------------------------------------------------------- scoring */

function baseScore(a: AdAnalysis, element: VariationElementId): number {
  switch (element) {
    case "product":
      // A product-typed ad is the strongest swap there is; a brand ad with a
      // known brand can have one swapped IN, but that's a weaker suggestion.
      return a.type.value === "product" || a.type.value === "category-product" ? 100 : 45;
    case "angle":
      return 90;
    case "avatar":
      return 75;
    case "concept":
      return 70;
    case "script":
      return 65;
    case "visual-direction":
      return 60;
    case "voice":
      return 55;
    case "language":
      return 40;
    case "aspect-ratio":
      return 35;
  }
}

function mediaBonus(a: AdAnalysis, element: VariationElementId): number {
  if (isVideo(a)) {
    if (element === "avatar") return 10;
    if (element === "voice") return 8;
    if (element === "script") return 6;
    if (element === "aspect-ratio") return -5;
    return 0;
  }
  // Image / carousel: the look and the framing are the levers that exist.
  if (element === "visual-direction") return 20;
  if (element === "aspect-ratio") return 15;
  if (element === "concept") return 10;
  if (element === "angle") return 8;
  return 0;
}

function score(a: AdAnalysis, element: VariationElementId): number {
  // Derived beats absent but loses to stored — we don't know it's what the ad used.
  const trust = isDerived(a, element) ? -20 : 0;
  return baseScore(a, element) + mediaBonus(a, element) + trust;
}

/* --------------------------------------------------------------- reasons */

function reasonFor(a: AdAnalysis, element: VariationElementId): string {
  const v = valueOf(a, element);
  const derived = isDerived(a, element);

  switch (element) {
    case "product":
      if (v && !derived) return `Product ad for ${v} — swap it and everything else carries over.`;
      if (v) return `Reads as ${v}, derived not stored — swap it if that's right.`;
      return "Brand ad with no product detected — you can swap one in.";
    case "angle":
      if (v && !derived) return `Angle on file is "${v}" — a different one reuses this exact ad.`;
      if (v) return `Angle looks like "${v}" (derived) — a new one doesn't depend on that.`;
      return "No angle stored — a new argument is the cheapest thing to change.";
    case "concept":
      if (v && !derived) return `Concept is "${v}" — a new one keeps the angle intact.`;
      if (v) return `Concept reads as "${v}" (derived) — a fresh one keeps the angle.`;
      return "No concept stored — a fresh idea keeps the angle intact.";
    case "avatar":
      if (v && !derived) return `Presented by ${v} — recasting needs no reshoot.`;
      return `Avatar reads as ${v ?? "one person on camera"} (derived) — recast if that's right.`;
    case "voice":
      if (v && !derived) return `Voice on file is ${v} — same script, different read.`;
      return `Voice reads as ${v ?? "a single voiceover"} (derived) — same script, different read.`;
    case "language":
      if (v && !derived) return `Currently ${v} — the same ad in another language is a new audience.`;
      if (v) return `Language reads as ${v} (derived) — another one opens a new audience.`;
      return "Language wasn't stored — naming one opens a new audience.";
    case "script":
      if (v && !derived) return "The script is on file — a rewrite keeps the format and the length.";
      if (v) return "Script was derived, not stored — a rewrite is the low-risk change.";
      return "No script stored — writing one is a clean change.";
    case "visual-direction":
      if (v && !derived) return `Shot as "${v}" — a new direction reuses the script as-is.`;
      if (v) return `Look reads as "${v}" (derived) — a new direction reuses the script.`;
      return "Nothing stored about the look — a new visual direction is safe.";
    case "aspect-ratio":
      if (v) return `Built at ${v} — reframing covers the other placements.`;
      return "Ratio wasn't stored — reframing covers the other placements.";
  }
}

/* ----------------------------------------------------------- thin cases */

/** A rival's ad, or one whose type never resolved: nothing catalogue-backed. */
function thinSet(a: AdAnalysis): RecommendedAction[] {
  const competitor = !!a.source.competitorOwned;
  const sawLook = found(a, "visual-direction");
  return [
    act(
      a,
      "angle",
      competitor
        ? "A competitor's ad — its angle is readable and reusing it touches nothing of theirs."
        : "Type came back N/F, but the angle doesn't depend on knowing it.",
    ),
    act(
      a,
      "script",
      competitor
        ? "Nothing here is in your library, so a script written from scratch is the honest change."
        : "We couldn't resolve what this ad is for — a fresh script is the safe change.",
    ),
    act(
      a,
      "visual-direction",
      competitor
        ? sawLook
          ? "Its look is all we detected — a new direction copies none of it."
          : "None of their data is yours — a look written from scratch borrows nothing."
        : sawLook
          ? "The look is readable even though the type isn't."
          : "Almost nothing resolved here — a new look needs no more than the media itself.",
    ),
  ];
}

/** An upload carries no provenance at all. Offer only what the file itself shows. */
function uploadSet(a: AdAnalysis): RecommendedAction[] {
  const out: RecommendedAction[] = [
    act(a, "visual-direction", "An uploaded file carries no library data — its look is all we can read."),
    act(a, "script", "Nothing about this upload is stored, so a fresh script is the honest change."),
  ];
  const ratio = valueOf(a, "aspect-ratio");
  if (ratio) {
    out.push(act(a, "aspect-ratio", `The file measures ${ratio} — reframing needs no other detail.`));
  } else {
    out.push(act(a, "angle", "Angle needs nothing from your library, so it works on an upload."));
  }
  return out;
}

/* ------------------------------------------------------------- the rule */

export function recommendedActionsFor(analysis: AdAnalysis): RecommendedAction[] {
  if (analysis.source.competitorOwned) return thinSet(analysis);
  if (analysis.source.kind === "upload") return uploadSet(analysis);
  if (analysis.type.value === "not-found" || analysis.type.provenance === "not-found") {
    return thinSet(analysis);
  }

  const ranked = ALL_ELEMENTS.filter((e) => canVary(analysis, e))
    .map((e) => ({ element: e, s: score(analysis, e) }))
    .sort((x, y) => y.s - x.s || elementOrder(x.element) - elementOrder(y.element));

  const picked = ranked.slice(0, MAX);
  // Never pad to four with something barely worth tapping.
  if (picked.length === MAX && picked[MAX - 1].s < FOURTH_FLOOR) picked.pop();

  return picked.map(({ element }) => act(analysis, element, reasonFor(analysis, element)));
}
