import { getFrameworkMeta } from "@/lib/video-sage-dummy-data";
import { angles } from "@/mocks/shared/angles";
import { brands } from "@/mocks/shared/brands";
import { getCategory } from "@/mocks/shared/categories";
import { concepts } from "@/mocks/shared/concepts";
import { products } from "@/mocks/shared/products";
import { scripts, type ScriptAsset, type ScriptFramework } from "@/mocks/shared/scripts";
import { storyboards, type StoryboardAsset, type StoryboardScene } from "@/mocks/shared/storyboards";
import type { Brand, Concept } from "@/genie6/types/entities";
import {
  GENERATED_CONCEPTS,
  GENERATED_SCRIPTS,
  GENERATED_STORYBOARDS,
  type GeneratedConceptItem,
  type GeneratedScriptItem,
  type GeneratedStoryboardItem,
} from "../../library/tabs/generatedAssetPool";
import { LANGUAGES, getLanguage, languageLabel } from "../../lib/languages";
import type {
  AdTypeKind,
  AnalysedField,
  AssetAnalysis,
  AssetKind,
  PastedAssetStub,
  PickedAsset,
  UploadedAssetStub,
  VariationSource,
} from "../types";

/**
 * analyseAsset — the Part 2 twin of `analyseAd`. One deriver behind the asset
 * variations overview: a Script, a Concept or a Storyboard.
 *
 * Same provenance grammar, same rules for which row is which:
 *   stored     — read off the asset record as-is (including a faithful
 *                rendering of stored data, e.g. a storyboard's scene list).
 *   detected   — DERIVED, because the record does not carry it: read off the
 *                asset's own words where they can say (the language, a pasted
 *                storyboard's shot lines), else keyed off a stable hash of the
 *                asset id. No Math.random, no Date.
 *   not-found  — genuinely absent, OR inapplicable to this kind (`framework`
 *                on a concept, `scenes` on a script). The overview decides
 *                what to hide; this file never fabricates the difference.
 *
 * Maalik (2026-09-09): "Storyboard is nothing but script with visual
 * directions." So `hasVisuals` is the whole distinction, and it is true only
 * where visual directions exist ON THIS ASSET — its own prose, its own scenes,
 * or its own pasted shot lines. A visual direction BORROWED from a sibling
 * record (the generated-concept shape drops `visualDirection`) is reported on
 * the row, chipped Detected, and deliberately does NOT set `hasVisuals`:
 * another asset's visuals must not silently turn this run into storyboards.
 */

/* ------------------------------------------------------------------ labels */

const ASSET_KIND_LABELS: Record<AssetKind, string> = {
  script: "Script",
  concept: "Concept",
  storyboard: "Storyboard",
};

export function assetKindLabel(kind: AssetKind): string {
  return ASSET_KIND_LABELS[kind] ?? "Asset";
}

/* ------------------------------------------------------------- field ctors */

function stored<T>(value: T | null | undefined, detail?: string | null): AnalysedField<T> {
  if (value === null || value === undefined || value === "") return notFound<T>();
  return { value, provenance: "stored", detail: detail ?? null };
}

function detected<T>(value: T | null | undefined, detail?: string | null): AnalysedField<T> {
  if (value === null || value === undefined || value === "") return notFound<T>();
  return { value, provenance: "detected", detail: detail ?? null };
}

function notFound<T>(): AnalysedField<T> {
  return { value: null, provenance: "not-found", detail: null };
}

/* ------------------------------------------------------- determinism only */

/** FNV-1a, the same shape `analyseAd` and the mock rosters use. */
function hash(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function pick<T>(pool: readonly T[], seed: string): T | undefined {
  if (pool.length === 0) return undefined;
  return pool[hash(seed) % pool.length];
}

/* ---------------------------------------------------------------- language */

/**
 * MIRRORED, NOT IMPORTED. `analyseAd.ts` keeps its language readers private
 * and is not editable in this change, so the table below is a copy of its
 * rules — deliberately identical, because two different answers to "what
 * language is this?" across the two halves of one flow is the defect. The
 * follow-up is one shared `languageFromText` module both files import.
 *
 * LATIN IS DELIBERATELY ABSENT: dozens of languages share it and separating
 * them by word lists is fabrication wearing a detection chip. Latin copy
 * resolves to English and no finer.
 */
const SCRIPTS: { code: string; script: string; re: RegExp }[] = [
  // Devanagari also carries Marathi and Nepali; the text cannot separate them.
  { code: "hi", script: "Devanagari", re: /[\u0900-\u097f]/g },
  { code: "bn", script: "Bengali", re: /[\u0980-\u09ff]/g },
  { code: "pa", script: "Gurmukhi", re: /[\u0a00-\u0a7f]/g },
  { code: "gu", script: "Gujarati", re: /[\u0a80-\u0aff]/g },
  { code: "or", script: "Odia", re: /[\u0b00-\u0b7f]/g },
  { code: "ta", script: "Tamil", re: /[\u0b80-\u0bff]/g },
  { code: "te", script: "Telugu", re: /[\u0c00-\u0c7f]/g },
  { code: "kn", script: "Kannada", re: /[\u0c80-\u0cff]/g },
  { code: "ml", script: "Malayalam", re: /[\u0d00-\u0d7f]/g },
  { code: "si", script: "Sinhala", re: /[\u0d80-\u0dff]/g },
  { code: "th", script: "Thai", re: /[\u0e00-\u0e7f]/g },
  { code: "ar", script: "Arabic", re: /[\u0600-\u06ff]/g },
  { code: "he", script: "Hebrew", re: /[\u0590-\u05ff]/g },
  { code: "el", script: "Greek", re: /[\u0370-\u03ff]/g },
  { code: "ru", script: "Cyrillic", re: /[\u0400-\u04ff]/g },
  { code: "ko", script: "Hangul", re: /[\uac00-\ud7af]/g },
  { code: "zh-CN", script: "Han", re: /[\u4e00-\u9fff]/g },
];

const KANA = /[\u3040-\u30ff]/g;
const LATIN_LETTER = /[A-Za-z]/;
const RUPEE = /₹|\bRs\.?\s?\d|\bINR\b/;
const POUND = /£|\bGBP\b/;

function baseTag(code: string | undefined): string {
  return (code ?? "").split("-")[0].toLowerCase();
}

/** Rosters hold "hi" where an asset may carry "hi-IN"; never print a raw code. */
function labelForLanguageCode(code: string | undefined): string | undefined {
  if (!code) return undefined;
  if (getLanguage(code)) return languageLabel(code);
  const match = LANGUAGES.find((l) => l.code === baseTag(code) || baseTag(l.code) === baseTag(code));
  return match ? languageLabel(match.code) : code;
}

function countMatches(text: string, re: RegExp): number {
  return text.match(re)?.length ?? 0;
}

/** By character count — a Latin brand name inside Tamil copy must not turn a
 *  Tamil script English. */
function scriptOf(text: string): { code: string; script: string } | undefined {
  // Kana anywhere settles Japanese: its copy carries Han characters too.
  if (countMatches(text, KANA) > 0) return { code: "ja", script: "Japanese kana" };
  let best: { code: string; script: string; n: number } | undefined;
  for (const s of SCRIPTS) {
    const n = countMatches(text, s.re);
    if (n > 0 && (!best || n > best.n)) best = { code: s.code, script: s.script, n };
  }
  return best;
}

/** `Product.price` is a formatted string ("₹699"), so this is read data — and
 *  it keeps an Indian brand on a .com domain out of US English. */
function brandCurrency(brandId: string | undefined): string {
  if (!brandId) return "";
  return products
    .filter((p) => p.brandId === brandId)
    .map((p) => p.price)
    .join(" ");
}

function englishRegion(text: string, brand: Brand | undefined): { code: string; why: string } {
  if (RUPEE.test(text)) return { code: "en-IN", why: "₹ pricing" };
  if (POUND.test(text)) return { code: "en-GB", why: "£ pricing" };
  if (RUPEE.test(brandCurrency(brand?.id))) return { code: "en-IN", why: "brand prices in ₹" };
  const d = brand?.domain?.toLowerCase() ?? "";
  if (d.endsWith(".in")) return { code: "en-IN", why: "Indian brand domain" };
  if (d.endsWith(".uk")) return { code: "en-GB", why: "UK brand domain" };
  return { code: "en-US", why: "no regional signal" };
}

/**
 * An asset carries no stored language field of any kind — not on the saved
 * rosters, not on the generated pool — so this row is always read off the
 * asset's own words, and N/F when there are none to read.
 */
function languageField(text: string, brand: Brand | undefined): AnalysedField {
  const script = scriptOf(text);
  if (script) {
    return detected(labelForLanguageCode(script.code), `${script.script} script in the asset's own words`);
  }
  if (LATIN_LETTER.test(text)) {
    const en = englishRegion(text, brand);
    return detected(labelForLanguageCode(en.code), `Latin-script text · ${en.why}`);
  }
  return notFound();
}

/* ------------------------------------------------------------ roster joins */

function brandFor(brandId: string | undefined, brandName: string | undefined): Brand | undefined {
  // Id first — asset rosters carry real `brands.ts` ids, unlike the ad pool's
  // `priorConfig.brandId` ("wow-skin" vs "wow-skin-science") — then by name,
  // which is the authoritative display value either way.
  const byId = brandId ? brands.find((b) => b.id === brandId) : undefined;
  if (byId) return byId;
  if (!brandName) return undefined;
  return brands.find((b) => b.name.toLowerCase() === brandName.trim().toLowerCase());
}

const NAME_STOPWORDS = new Set(["the", "for", "with", "and", "pack", "day", "size", "free", "set", "gift"]);

/** Asset titles name their subject in prose ("Onion Shampoo — hair fall PAS")
 *  and never equal a catalogue name, so sibling joins match on distinctive
 *  tokens rather than on a string equality that would never fire. */
function nameTokens(name: string): string[] {
  return name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !NAME_STOPWORDS.has(t));
}

/**
 * The category behind a named product — EXACT name match only. It rides in the
 * entityName's detail line, which carries no provenance chip of its own, so it
 * has to be a read fact. A bundle's prose name ("Onion Shampoo + Vitamin C
 * Facewash gift set") is no single SKU and spans two categories; token-matching
 * it to the shampoo would print one plausible half as if it were the answer.
 */
function categoryForProductName(brandId: string | undefined, productName: string | undefined): string | undefined {
  if (!productName) return undefined;
  const pool = brandId ? products.filter((p) => p.brandId === brandId) : products;
  const match = pool.find((p) => p.name.toLowerCase() === productName.trim().toLowerCase());
  return match?.categoryId ? getCategory(match.categoryId)?.name : undefined;
}

function angleByLabel(label: string | undefined) {
  if (!label) return undefined;
  const t = label.trim().toLowerCase();
  return angles.find((a) => a.label.toLowerCase() === t);
}

function angleById(angleId: string | undefined) {
  if (!angleId) return undefined;
  return angles.find((a) => a.id === angleId);
}

function conceptIsVideo(c: Concept): boolean {
  return c.format.toLowerCase().includes("video");
}

function formatIsVideo(formatLabel: string | undefined): boolean {
  return (formatLabel ?? "").toLowerCase().includes("video");
}

/**
 * Same derivation as `analyseAd`: nothing joins a script or a storyboard to
 * the concept it came from (neither roster carries a conceptId, and the ad
 * pool's `priorConfig.conceptId` is a synthetic slug that joins to nothing),
 * so the concept is DERIVED from the roster by brand, preferring one of the
 * asset's own media type, then its angle.
 */
function deriveConcept(
  brandId: string | undefined,
  angleLabel: string | undefined,
  isVideo: boolean,
  seedId: string,
): Concept | undefined {
  if (!brandId) return undefined;
  const byBrand = concepts.filter((c) => c.brandId === brandId);
  if (byBrand.length === 0) return undefined;
  const byMedia = byBrand.filter((c) => conceptIsVideo(c) === isVideo);
  const pool = byMedia.length > 0 ? byMedia : byBrand;
  const byAngle = angleLabel ? pool.find((c) => c.angle.toLowerCase() === angleLabel.toLowerCase()) : undefined;
  return byAngle ?? pick(pool, `concept:${seedId}`);
}

/* ------------------------------------------------------------ entity rows */

interface EntityRows {
  type: AnalysedField<AdTypeKind>;
  entityName: AnalysedField;
}

/**
 * An asset's entity is optional by design (`TARGET_SPECS` marks every asset
 * target `entityRequired: false`), so "brand only" is a real answer, not a
 * partial one. "category-product" is NOT reachable here: an asset is never
 * category-scoped in either roster, and reporting a product's own category as
 * a category SCOPE would be a different fact from the one stored.
 */
function entityRows(brand: Brand | undefined, brandName: string | undefined, productName: string | undefined): EntityRows {
  const name = brand?.name ?? brandName;
  const category = categoryForProductName(brand?.id, productName);
  if (productName) {
    return {
      type: stored<AdTypeKind>("product"),
      entityName: stored(productName, [name, category].filter(Boolean).join(" · ") || null),
    };
  }
  if (name) {
    return { type: stored<AdTypeKind>("brand"), entityName: stored(name, brand?.category) };
  }
  return { type: notFound<AdTypeKind>(), entityName: notFound() };
}

/* -------------------------------------------------------- visual direction */

/**
 * Shot vocabulary, matched only at the START of a line or after a scene
 * marker. Deliberately strict: a narration line mentioning B-roll inside a
 * client note ("[Client note: swap in the new waterproof B-roll…]") is not a
 * visual direction, and treating it as one would flip a script's `hasVisuals`
 * and silently change what the run produces.
 */
const SHOT_WORDS = [
  "close-?up",
  "wide(?: shot)?",
  "mid(?:dle)? shot",
  "medium shot",
  "macro",
  "overhead",
  "top-?down",
  "establishing(?: shot)?",
  "tracking(?: shot)?",
  "pan(?:ning)?",
  "insert",
  "cutaway",
  "cut to",
  "b-?roll",
  "montage",
  "split-?screen",
  "slow motion",
  "pack ?shot",
  "end ?card",
  "title card",
  "pov",
  "int\\.",
  "ext\\.",
];

const SHOT_LINE = new RegExp(`^\\s*(?:${SHOT_WORDS.join("|")})\\b`, "i");
const SCENE_MARKER = /^\s*(?:scene|shot|frame)\s*#?\s*\d+/i;
/** A whole line in brackets is a direction; a bracketed aside mid-sentence is not. */
const BRACKETED_LINE = /^\s*[[(][^\])]{4,}[\])]\s*$/;

function textLines(text: string): string[] {
  return text
    .split(/\r?\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
}

/** The direction lines an asset's own text carries, in order. */
function directionLines(text: string): string[] {
  return textLines(text).filter((l) => SCENE_MARKER.test(l) || SHOT_LINE.test(l) || BRACKETED_LINE.test(l));
}

function clamp(text: string, max: number): string {
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

/* ------------------------------------------------------------ scene reading */

function sceneBeats(scenes: readonly StoryboardScene[]): string {
  return scenes.map((s) => s.shot).join(" → ");
}

/** The scenes ARE the visual direction (Maalik's ruling) — summarised, not
 *  invented: the shot list itself, in order. */
function sceneVisuals(scenes: readonly StoryboardScene[]): string {
  return scenes.map((s) => `${s.shot}: ${clamp(s.description, 64)}`).join(" · ");
}

function renderScenes(scenes: readonly StoryboardScene[]): string {
  return scenes.map((s) => `${s.sceneNumber}. ${s.shot} — ${s.description} (${s.durationSec}s)`).join("\n");
}

function totalDuration(scenes: readonly StoryboardScene[]): number {
  return scenes.reduce((sum, s) => sum + s.durationSec, 0);
}

/* ------------------------------------------------------------------ source */

const ORIGIN_LABELS = {
  saved: "Saved asset",
  generated: "Genie generation",
  uploaded: "Uploaded",
  pasted: "Pasted",
} as const;

type Origin = keyof typeof ORIGIN_LABELS;

function sourceFor(args: {
  origin: Origin;
  id: string;
  title: string;
  subtitleParts?: (string | undefined)[];
  thumbnail?: string;
  formatLabel?: string;
}): VariationSource {
  return {
    // `VariationSourceKind` is `PickedSource["kind"]` — the AD union — so an
    // asset has to travel under the nearest honest one. `originLabel` carries
    // the real answer, which is what the overview's Source row shows.
    kind: args.origin === "uploaded" || args.origin === "pasted" ? "upload" : "genie-output",
    id: args.id,
    title: args.title,
    subtitle: (args.subtitleParts ?? []).filter(Boolean).join(" · ") || undefined,
    thumbnail: args.thumbnail,
    originLabel: ORIGIN_LABELS[args.origin],
    // These are the user's OWN assets — §7.2's competitor case cannot arise.
    competitorOwned: false,
    sourceFormat: args.formatLabel ? (formatIsVideo(args.formatLabel) ? "video" : "image") : undefined,
  };
}

/* ------------------------------------------------------ normalised records */

interface ScriptLike {
  source: VariationSource;
  seedId: string;
  brand: Brand | undefined;
  brandName?: string;
  productName?: string;
  title: string;
  angleId?: string;
  framework: ScriptFramework;
  body: string;
  durationSec: number;
}

interface ConceptLike {
  source: VariationSource;
  seedId: string;
  brand: Brand | undefined;
  brandName?: string;
  productName?: string;
  name: string;
  angle: string;
  hook: string;
  tone: string;
  formatLabel: string;
  /** Absent on `GeneratedConceptItem` — the shape drops it entirely. */
  visualDirection?: string;
}

interface StoryboardLike {
  source: VariationSource;
  seedId: string;
  brand: Brand | undefined;
  brandName?: string;
  productName?: string;
  title: string;
  formatLabel: string;
  scenes: readonly StoryboardScene[];
}

interface TextLike {
  source: VariationSource;
  assetKind: AssetKind;
  title: string;
  body: string;
}

/* ----------------------------------------------------------------- builders */

function frameworkField(framework: ScriptFramework | undefined, extra?: string): AnalysedField {
  if (!framework) return notFound();
  const meta = getFrameworkMeta(framework);
  return stored(framework, [meta.fullName, extra].filter(Boolean).join(" · "));
}

/**
 * A storyboard stores no framework. The brand's own saved script for the same
 * product/subject is a real join, so it is reported chipped Detected — and
 * scored, not first-match: a Diwali-bundle storyboard must land on the Diwali
 * script rather than on whichever of the brand's scripts happens to share two
 * tokens. No match at all means N/F, never a hash pick across four frameworks
 * with nothing behind it.
 */
function frameworkFromSiblingScript(
  brandId: string | undefined,
  productName: string | undefined,
  title: string,
): AnalysedField {
  if (!brandId) return notFound();
  const tokens = nameTokens(`${title} ${productName ?? ""}`);
  let best: { s: ScriptAsset; n: number } | undefined;
  for (const s of scripts.filter((x) => x.brandId === brandId)) {
    const t = s.title.toLowerCase();
    const n = new Set(tokens.filter((tok) => t.includes(tok))).size;
    if (n >= 2 && (!best || n > best.n)) best = { s, n };
  }
  if (!best) return notFound();
  return detected(best.s.framework, `matches the saved script “${best.s.title}”`);
}

function analyseScriptLike(a: ScriptLike): AssetAnalysis {
  const { type, entityName } = entityRows(a.brand, a.brandName, a.productName);
  const angle = angleById(a.angleId);
  // Scripts are ad-VIDEO scripts (scripts.ts header), so the concept join
  // prefers the brand's video concepts.
  const concept = deriveConcept(a.brand?.id, angle?.label, true, a.seedId);
  // Maalik's ruling read forwards: a script that DOES carry shot lines is a
  // storyboard already, so the parser runs here too rather than assuming none.
  const own = directionLines(a.body);
  return {
    source: a.source,
    assetKind: "script",
    hasVisuals: own.length > 0,
    type,
    entityName,
    angle: angle ? stored(angle.label, angle.description) : concept ? detected(concept.angle, concept.name) : notFound(),
    concept: concept ? detected(concept.name, concept.tone) : notFound(),
    framework: frameworkField(a.framework),
    visualDirection:
      own.length > 0
        ? detected(clamp(own.join(" · "), 220), `${own.length} direction line${own.length === 1 ? "" : "s"} in the script itself`)
        : // The absence IS the definition: no visuals is what makes this a
          // script rather than a storyboard.
          notFound(),
    language: languageField(`${a.title} ${a.body}`, a.brand),
    duration: stored(`${a.durationSec}s`, "as written"),
    scenes: notFound<number>(),
    body: stored(a.body, a.title),
  };
}

function analyseConceptLike(a: ConceptLike): AssetAnalysis {
  const { type, entityName } = entityRows(a.brand, a.brandName, a.productName);
  const angle = angleByLabel(a.angle);
  // `GeneratedConceptItem` drops `visualDirection`, so where the concept has
  // none of its own, the closest SAVED concept of the same brand + angle +
  // media type lends one — reported Detected, and NOT counted as this asset's
  // own visuals.
  const borrowed = a.visualDirection
    ? undefined
    : deriveConcept(a.brand?.id, a.angle, formatIsVideo(a.formatLabel), a.seedId);
  return {
    source: a.source,
    assetKind: "concept",
    hasVisuals: Boolean(a.visualDirection),
    type,
    entityName,
    angle: stored(a.angle, angle?.description ?? a.tone),
    concept: stored(a.name, a.tone),
    // A concept is not written against a script framework. Inapplicable, not
    // missing — the overview hides the row.
    framework: notFound(),
    visualDirection: a.visualDirection
      ? stored(a.visualDirection, a.name)
      : borrowed
        ? detected(borrowed.visualDirection, `from the saved concept “${borrowed.name}”`)
        : notFound(),
    language: languageField(`${a.name} ${a.hook} ${a.visualDirection ?? ""}`, a.brand),
    // No concept in either roster carries a duration.
    duration: notFound(),
    scenes: notFound<number>(),
    body: stored(a.hook, `${a.tone} · ${a.formatLabel}`),
  };
}

function analyseStoryboardLike(a: StoryboardLike): AssetAnalysis {
  const { type, entityName } = entityRows(a.brand, a.brandName, a.productName);
  const isVideo = formatIsVideo(a.formatLabel);
  const concept = deriveConcept(a.brand?.id, undefined, isVideo, a.seedId);
  const text = `${a.title} ${a.scenes.map((s) => s.description).join(" ")}`;
  return {
    source: a.source,
    assetKind: "storyboard",
    // The scenes are written; a saved or generated storyboard always has them.
    hasVisuals: a.scenes.length > 0,
    type,
    entityName,
    // Neither storyboard roster carries an angleId.
    angle: concept ? detected(concept.angle, concept.name) : notFound(),
    concept: concept ? detected(concept.name, concept.tone) : notFound(),
    framework: frameworkFromSiblingScript(a.brand?.id, a.productName, a.title),
    visualDirection: stored(sceneVisuals(a.scenes), `${a.scenes.length} scenes · ${a.formatLabel}`),
    language: languageField(text, a.brand),
    duration: stored(`${totalDuration(a.scenes)}s`, `summed across ${a.scenes.length} scenes`),
    scenes: stored(a.scenes.length, sceneBeats(a.scenes)),
    body: stored(renderScenes(a.scenes), a.title),
  };
}

/** Words per second at ~150 wpm — the only honest reading of a pasted text's
 *  length, and chipped Detected because it is an estimate, not a written one. */
const WORDS_PER_SECOND = 2.5;

function estimatedDuration(text: string): AnalysedField {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return notFound();
  const secs = Math.max(1, Math.round(words / WORDS_PER_SECOND));
  return detected(`~${secs}s`, `estimated from ${words} words at ~150 wpm`);
}

/**
 * An uploaded .txt/.md or a pasted block carries no catalogue provenance
 * whatsoever — same rule as `analyseAd`'s upload case. Only the rows the text
 * itself can answer are populated; everything joinable is honestly N/F.
 *
 * This is also how a user hand-authors a storyboard: paste a script, add shot
 * lines. So the directions are READ out of the text, and a paste that declares
 * itself a storyboard but carries no shot lines gets `hasVisuals: false` —
 * the picker's label does not create data; the flow's mandatory
 * visual-direction element is what fills it in.
 */
function analyseTextLike(a: TextLike): AssetAnalysis {
  const lines = directionLines(a.body);
  // The beats ARE the direction lines, including an unnumbered "End card:" —
  // counting only "Scene N" markers would report 2 beside a row that just said
  // it read 3 directions.
  const isTimed = a.assetKind === "script" || a.assetKind === "storyboard";
  return {
    source: a.source,
    assetKind: a.assetKind,
    hasVisuals: lines.length > 0,
    type: notFound<AdTypeKind>(),
    entityName: notFound(),
    angle: notFound(),
    concept: notFound(),
    framework: notFound(),
    visualDirection:
      lines.length > 0
        ? detected(
            clamp(lines.join(" · "), 220),
            `${lines.length} direction line${lines.length === 1 ? "" : "s"} read out of the text`,
          )
        : notFound(),
    language: languageField(`${a.title} ${a.body}`, undefined),
    duration: isTimed ? estimatedDuration(a.body) : notFound(),
    scenes:
      a.assetKind === "storyboard" && lines.length > 0
        ? detected(lines.length, `read out of the text · ${clamp(lines.map((l) => l.split(/[:—-]/)[0].trim()).join(" → "), 90)}`)
        : notFound<number>(),
    body: stored(a.body, a.title),
  };
}

/* --------------------------------------------------------- the seven cases */

function savedScript(s: ScriptAsset): AssetAnalysis {
  const brand = brandFor(s.brandId, undefined);
  return analyseScriptLike({
    source: sourceFor({
      origin: "saved",
      id: s.id,
      title: s.title,
      subtitleParts: [brand?.name, `${s.framework} · ${s.durationSec}s`],
    }),
    seedId: s.id,
    brand,
    title: s.title,
    angleId: s.angleId,
    framework: s.framework,
    body: s.body,
    durationSec: s.durationSec,
  });
}

function savedConcept(c: Concept): AssetAnalysis {
  const brand = brandFor(c.brandId, undefined);
  return analyseConceptLike({
    source: sourceFor({
      origin: "saved",
      id: c.id,
      title: c.name,
      subtitleParts: [brand?.name, c.format],
      formatLabel: c.format,
    }),
    seedId: c.id,
    brand,
    name: c.name,
    angle: c.angle,
    hook: c.hook,
    tone: c.tone,
    formatLabel: c.format,
    visualDirection: c.visualDirection,
  });
}

function savedStoryboard(s: StoryboardAsset): AssetAnalysis {
  const brand = brandFor(s.brandId, undefined);
  return analyseStoryboardLike({
    source: sourceFor({
      origin: "saved",
      id: s.id,
      title: s.title,
      subtitleParts: [brand?.name, s.productName, s.formatLabel],
      thumbnail: s.thumbnail,
      formatLabel: s.formatLabel,
    }),
    seedId: s.id,
    brand,
    productName: s.productName,
    title: s.title,
    formatLabel: s.formatLabel,
    scenes: s.scenes,
  });
}

function generatedScript(s: GeneratedScriptItem): AssetAnalysis {
  const brand = brandFor(s.brandId, s.brandName);
  return analyseScriptLike({
    source: sourceFor({
      origin: "generated",
      id: s.id,
      title: s.title,
      subtitleParts: [s.brandName, s.productName, s.batchLabel],
    }),
    seedId: s.id,
    brand,
    brandName: s.brandName,
    productName: s.productName,
    title: s.title,
    framework: s.framework,
    body: s.body,
    durationSec: s.durationSec,
  });
}

function generatedConcept(c: GeneratedConceptItem): AssetAnalysis {
  const brand = brandFor(c.brandId, c.brandName);
  return analyseConceptLike({
    source: sourceFor({
      origin: "generated",
      id: c.id,
      title: c.name,
      subtitleParts: [c.brandName, c.productName, c.formatLabel],
      thumbnail: c.thumbnail,
      formatLabel: c.formatLabel,
    }),
    seedId: c.id,
    brand,
    brandName: c.brandName,
    productName: c.productName,
    name: c.name,
    angle: c.angle,
    hook: c.hook,
    tone: c.tone,
    formatLabel: c.formatLabel,
  });
}

function generatedStoryboard(s: GeneratedStoryboardItem): AssetAnalysis {
  const brand = brandFor(s.brandId, s.brandName);
  return analyseStoryboardLike({
    source: sourceFor({
      origin: "generated",
      id: s.id,
      title: s.title,
      subtitleParts: [s.brandName, s.productName, s.formatLabel],
      thumbnail: s.thumbnail,
      formatLabel: s.formatLabel,
    }),
    seedId: s.id,
    brand,
    brandName: s.brandName,
    productName: s.productName,
    title: s.title,
    formatLabel: s.formatLabel,
    scenes: s.scenes,
  });
}

function uploadedAsset(file: UploadedAssetStub): AssetAnalysis {
  return analyseTextLike({
    source: sourceFor({
      origin: "uploaded",
      id: file.id,
      title: file.name || `Uploaded ${assetKindLabel(file.assetKind).toLowerCase()}`,
      subtitleParts: [assetKindLabel(file.assetKind)],
    }),
    assetKind: file.assetKind,
    title: file.name,
    body: file.body,
  });
}

function pastedAsset(text: PastedAssetStub): AssetAnalysis {
  return analyseTextLike({
    source: sourceFor({
      origin: "pasted",
      id: text.id,
      title: text.title || `Pasted ${assetKindLabel(text.assetKind).toLowerCase()}`,
      subtitleParts: [assetKindLabel(text.assetKind)],
    }),
    assetKind: text.assetKind,
    title: text.title,
    body: text.body,
  });
}

/** A (kind, id) pair the roster no longer holds — a stale deep link, a deleted
 *  asset. Every row absent, and the source still says what was asked for, so
 *  the screen degrades instead of throwing. */
function unresolved(picked: { assetKind: AssetKind; id: string }, origin: Origin): AssetAnalysis {
  return analyseTextLike({
    source: sourceFor({
      origin,
      id: picked.id,
      title: `${assetKindLabel(picked.assetKind)} not found`,
      subtitleParts: [picked.id],
    }),
    assetKind: picked.assetKind,
    title: "",
    body: "",
  });
}

/* ------------------------------------------------------------------- entry */

export function analyseAsset(picked: PickedAsset): AssetAnalysis {
  switch (picked.kind) {
    case "saved-asset": {
      if (picked.assetKind === "script") {
        const s = scripts.find((x) => x.id === picked.id);
        return s ? savedScript(s) : unresolved(picked, "saved");
      }
      if (picked.assetKind === "concept") {
        const c = concepts.find((x) => x.id === picked.id);
        return c ? savedConcept(c) : unresolved(picked, "saved");
      }
      const sb = storyboards.find((x) => x.id === picked.id);
      return sb ? savedStoryboard(sb) : unresolved(picked, "saved");
    }
    case "generated-asset": {
      if (picked.assetKind === "script") {
        const s = GENERATED_SCRIPTS.find((x) => x.id === picked.id);
        return s ? generatedScript(s) : unresolved(picked, "generated");
      }
      if (picked.assetKind === "concept") {
        const c = GENERATED_CONCEPTS.find((x) => x.id === picked.id);
        return c ? generatedConcept(c) : unresolved(picked, "generated");
      }
      const sb = GENERATED_STORYBOARDS.find((x) => x.id === picked.id);
      return sb ? generatedStoryboard(sb) : unresolved(picked, "generated");
    }
    case "uploaded-asset":
      return uploadedAsset(picked.file);
    case "pasted-asset":
      return pastedAsset(picked.text);
  }
}
