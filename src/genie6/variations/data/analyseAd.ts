import { getDummyVideos, type DummyVideo, type VideoSageAnalysis } from "@/lib/video-sage-dummy-data";
import { angles } from "@/mocks/shared/angles";
import { avatars } from "@/mocks/shared/avatars";
import { brands } from "@/mocks/shared/brands";
import { getCategory } from "@/mocks/shared/categories";
import { concepts } from "@/mocks/shared/concepts";
import { getProduct, products } from "@/mocks/shared/products";
import { scripts, type ScriptAsset } from "@/mocks/shared/scripts";
import { voices } from "@/mocks/shared/voices";
import { WINNER_ADS } from "@/mocks/shared/winnerAds";
import type { Avatar, Concept, Voice } from "@/genie6/types/entities";
import { personalityLabel, toneLabel } from "../../brain/avatarTaxonomy";
import { getFlowModule } from "../../flows/data/flowRegistry";
import type { FlowSourceRef } from "../../flows/flowTypes";
import { getBatchForOutput } from "../../lib/genieRunStore";
import type { RunBatch } from "../../lib/genieRunTypes";
import { DEFAULT_LANGUAGE, LANGUAGES, getLanguage, languageLabel } from "../../lib/languages";
import { approachLabel } from "../../studio-v4/components/queue/batchDisplay";
import type { OutputData } from "../../types/output";
import type {
  AdAnalysis,
  AdTypeKind,
  AnalysedField,
  PickedSource,
  UploadedAdStub,
  VariationSource,
} from "../types";

/**
 * analyseAd — the one deriver behind the Generate Variations analysis overview.
 *
 * Both UI versions render its output, so nothing about presentation lives here.
 * Every row carries its own `provenance`, and the rules for which is which are
 * the whole point of the file:
 *
 *   stored     — read off the picked object, its source record, or the
 *                `RunBatch.config` of the batch that produced it, as-is.
 *   detected   — DERIVED, because the data model does not persist it: read off
 *                the ad's own copy where the copy can say (the language), else
 *                keyed off a stable hash of the ad's id, so the same ad always
 *                shows the same avatar/voice/concept. No Math.random, no Date.
 *   not-found  — genuinely absent. The UI renders "N/F".
 *
 * Maalik (2026-09-09): avatar and voice ARE to be derived and chipped
 * "Detected" — nothing stores which avatar or voice an ad used. But a
 * COMPETITOR ad and an UPLOAD get `not-found` across the board, because there
 * we genuinely know nothing and inventing is the defect (same rule
 * `HowThisWasMade.tsx` states: "never a fabricated ratio or approach").
 */

/* ------------------------------------------------------------------ labels */

const AD_TYPE_LABELS: Record<AdTypeKind, string> = {
  brand: "Brand",
  product: "Product",
  category: "Category",
  "category-product": "Category + Product",
  other: "Other",
  "not-found": "N/F",
};

export function adTypeLabel(kind: AdTypeKind): string {
  return AD_TYPE_LABELS[kind] ?? AD_TYPE_LABELS["not-found"];
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

/** FNV-1a, the same shape the mock rosters already use for stable picks. */
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

/** The languages this roster can actually present in. No longer a pool the
 *  language row is picked FROM — the ad's own copy decides that now (see
 *  `resolveLanguage`) — but still what `spokenByAvatar` prefers when an
 *  avatar speaks several and none of them is the one that won. */
const DERIVABLE_LANGUAGE_CODES = ["en-IN", "hi", "ta", "en-US", "mr", "bn", "gu", "en-GB"];

function baseTag(code: string | undefined): string {
  return (code ?? "").split("-")[0].toLowerCase();
}

/** Filtered, not hand-pruned: no avatar in the roster speaks Gujarati, and a
 *  language no derived presenter can speak contradicts the avatar row beside
 *  it. Recomputes itself if the avatar roster changes. */
const PRESENTABLE_LANGUAGE_CODES = DERIVABLE_LANGUAGE_CODES.filter((code) =>
  avatars.some((a) => a.language.some((c) => baseTag(c) === baseTag(code))),
);

/** Roster languages are BCP-47-ish codes; avatars/voices carry regionals like
 *  "hi-IN" that `LANGUAGES` only holds as "hi", so fall back to the base tag
 *  rather than printing a raw code at the user. */
function labelForLanguageCode(code: string | undefined): string | undefined {
  if (!code) return undefined;
  if (getLanguage(code)) return languageLabel(code);
  const match = LANGUAGES.find((l) => l.code === baseTag(code) || baseTag(l.code) === baseTag(code));
  return match ? languageLabel(match.code) : code;
}

/** Video Sage stores a language NAME ("Hindi"), not a code — and "English"
 *  is five rows in `LANGUAGES`, so prefer the roster's own market. */
function languageEntryByName(name: string | undefined) {
  if (!name) return undefined;
  const t = name.trim().toLowerCase();
  const matches = LANGUAGES.filter((l) => l.name.toLowerCase() === t);
  return matches.find((l) => l.region === "India") ?? matches[0];
}

/* -------------------------------------------------- language FROM the copy */

/**
 * WHY THE LANGUAGE IS READ, NOT HASHED (Maalik, 2026-09-09)
 * A hash over the roster made the cast internally coherent and the OVERVIEW
 * wrong: "Real mom, real results, 6 weeks in." — plainly English — reported
 * Tamil, with a Tamil avatar and voice to match. Language is now decided by
 * the ad's own visible copy, and the cast is narrowed to whatever wins.
 *
 * ONE script block → ONE reportable language. LATIN IS DELIBERATELY ABSENT
 * from this table: dozens of languages share it, and separating them by word
 * lists is fabrication wearing a detection chip. So Latin copy resolves to
 * English and no finer — a romanised-Hindi ("Sirf ₹699 mein") is reported as
 * English rather than guessed at.
 */
const SCRIPTS: { code: string; script: string; re: RegExp }[] = [
  // Devanagari also carries Marathi and Nepali. The text cannot separate them,
  // so this reports the dominant one and the row stays chipped "Detected".
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

function countMatches(text: string, re: RegExp): number {
  return text.match(re)?.length ?? 0;
}

/** The script the copy is actually written in, by character count — a stray
 *  Latin brand name inside Tamil copy must not turn a Tamil ad English. */
function scriptOf(text: string): { code: string; script: string } | undefined {
  // Kana anywhere settles Japanese: its copy carries Han characters too, which
  // a plain count would otherwise let outvote the kana.
  if (countMatches(text, KANA) > 0) return { code: "ja", script: "Japanese kana" };
  let best: { code: string; script: string; n: number } | undefined;
  for (const s of SCRIPTS) {
    const n = countMatches(text, s.re);
    if (n > 0 && (!best || n > best.n)) best = { code: s.code, script: s.script, n };
  }
  return best;
}

const RUPEE = /₹|\bRs\.?\s?\d|\bINR\b/;
const POUND = /£|\bGBP\b/;

/** The brand's own catalogue currency. `Product.price` is a formatted string
 *  ("₹699"), so this is read data, not an inference — and it is what keeps an
 *  Indian brand on a .com domain (gonoise.com, lenskart.com) out of US
 *  English. */
function brandCurrency(brandId: string | undefined): string {
  if (!brandId) return "";
  return products
    .filter((p) => p.brandId === brandId)
    .map((p) => p.price)
    .join(" ");
}

/** Which English. Signals in strength order: the ad's OWN pricing, then the
 *  brand's catalogue currency, then its TLD. None present means plain English
 *  rather than a market invented for it — and NEVER a word-list guess, which
 *  is why "for the next India" in an otherwise signal-free ad does not count. */
function englishRegion(text: string, brandId: string | undefined): { code: string; why: string } {
  if (RUPEE.test(text)) return { code: "en-IN", why: "₹ pricing" };
  if (POUND.test(text)) return { code: "en-GB", why: "£ pricing" };
  if (RUPEE.test(brandCurrency(brandId))) return { code: "en-IN", why: "brand prices in ₹" };
  const d = brandDomain(brandId)?.toLowerCase() ?? "";
  if (d.endsWith(".in")) return { code: "en-IN", why: "Indian brand domain" };
  if (d.endsWith(".uk")) return { code: "en-GB", why: "UK brand domain" };
  return { code: "en-US", why: "no regional signal" };
}

interface ResolvedLanguage {
  code: string | undefined;
  provenance: "stored" | "detected" | "not-found";
  detail?: string;
}

/** Reads the language out of the ad's own visible text. Undefined code = there
 *  was no text to read, which is N/F, not a licence to invent one. */
function readLanguage(text: string, brandId: string | undefined): ResolvedLanguage {
  const script = scriptOf(text);
  if (script) {
    return { code: script.code, provenance: "detected", detail: `${script.script} script in the ad's copy` };
  }
  if (LATIN_LETTER.test(text)) {
    const en = englishRegion(text, brandId);
    return { code: en.code, provenance: "detected", detail: `Latin-script copy · ${en.why}` };
  }
  // No headline, no body, no CTA (`var_zerocase`) — every other row of that ad
  // is N/F too, and a hashed language would be the one invented fact on it.
  return { code: undefined, provenance: "not-found" };
}

/**
 * A stored language still has to survive the ad it belongs to. The seeded
 * batches assign `config.language` BY POSITION, so a plainly-English boAt ad
 * carries a stored "ta" — reporting that is the exact defect this pass exists
 * to fix (the overview contradicting the copy in front of the user). So the
 * stored code is trusted while the copy's script agrees with it, and outranked
 * by the copy where it does not. Agreement is on the base tag, so a stored
 * "en-GB" on ₹-priced copy still reports the real stored regional variant
 * rather than the guessed one.
 */
function resolveLanguage(
  text: string,
  brandId: string | undefined,
  storedCode: string | undefined,
): ResolvedLanguage {
  const read = readLanguage(text, brandId);
  if (!storedCode) return read;
  if (!read.code || baseTag(read.code) === baseTag(storedCode)) {
    return { code: storedCode, provenance: "stored", detail: "read off the batch that produced it" };
  }
  return read;
}

function languageField(lang: ResolvedLanguage): AnalysedField {
  const label = labelForLanguageCode(lang.code);
  return lang.provenance === "stored" ? stored(label, lang.detail) : detected(label, lang.detail);
}

/** Every bit of the ad's own visible text, in one string to read. */
function outputCopy(out: OutputData): string {
  return [out.headline, out.body, out.cta].filter(Boolean).join(" ");
}

function refCopy(ref: FlowSourceRef): string {
  return [ref.title, ref.subtitle, ref.hook].filter(Boolean).join(" ");
}

function brandDomain(brandId: string | undefined): string | undefined {
  if (!brandId) return undefined;
  return brands.find((b) => b.id === brandId)?.domain;
}

/* ------------------------------------------------------------- roster joins */

function angleLabelById(angleId: string | undefined): { label: string; description?: string } | undefined {
  if (!angleId) return undefined;
  const a = angles.find((x) => x.id === angleId);
  return a ? { label: a.label, description: a.description } : undefined;
}

function conceptIsVideo(c: Concept): boolean {
  return c.format.toLowerCase().includes("video");
}

/**
 * The concept a source "used" is not recoverable: `priorConfig.conceptId` is a
 * synthetic slug (`concept-${mode}-${idx}`) that joins to nothing, and the
 * backfilled `output.concepts[]` labels are placeholders ("Concept 1"). So the
 * concept is DERIVED from the roster by brand, preferring one of the source's
 * own media type, then its angle.
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
  const byAngle = angleLabel
    ? pool.find((c) => c.angle.toLowerCase() === angleLabel.toLowerCase())
    : undefined;
  return byAngle ?? pick(pool, `concept:${seedId}`);
}

/** `trendAngle` deliberately falls back to a headline or excerpt, so it can
 *  arrive as a paragraph. Keep the first clause — a row value, not prose. */
function trimToValue(text: string): string {
  const first = text.split(/[.!?]\s|\s[—–]\s/)[0].trim() || text.trim();
  return first.length > 96 ? `${first.slice(0, 93).trimEnd()}…` : first;
}

/** "9:16 video" / "4:5 static" — the ratio hides in `Concept.format`. */
function ratioFromConceptFormat(format: string | undefined): string | undefined {
  const m = format?.match(/(\d+\s*:\s*\d+)/);
  return m ? m[1].replace(/\s+/g, "") : undefined;
}

/** Only report the concept's ratio when the concept is of the source's own
 *  media type — a brand whose concepts are all static would otherwise hand a
 *  video source a 1:1, which is a wrong fact, not a detection. */
function aspectRatioField(concept: Concept | undefined, isVideo: boolean): AnalysedField {
  if (!concept || conceptIsVideo(concept) !== isVideo) return notFound();
  return detected(ratioFromConceptFormat(concept.format), concept.format);
}

/** Narrowed to the source's language, so the detected avatar, voice and
 *  language read as one coherent triple rather than three unrelated picks.
 *  Returns nothing when neither tier matches — an avatar who does not speak
 *  the reported language is a wrong fact, not a detection. */
function narrow<T>(pool: readonly T[], exact: (x: T) => boolean, loose: (x: T) => boolean): readonly T[] {
  // Exact locale first — a base-tag match alone hands "en-IN" a Lagos avatar.
  const hit = pool.filter(exact);
  return hit.length > 0 ? hit : pool.filter(loose);
}

/* --------------------------------------------------------- gender coherence */

type Gender = "f" | "m";

/** `Avatar.demographic` is display prose ("F · 35-42 · Caucasian · mom-of-2");
 *  its leading token is the only gender signal the model carries. */
function avatarGender(a: Avatar): Gender | undefined {
  const lead = a.demographic.trim().charAt(0).toUpperCase();
  return lead === "F" ? "f" : lead === "M" ? "m" : undefined;
}

let genderByPersonName: Map<string, Gender> | null = null;

function genderForPersonName(name: string): Gender | undefined {
  if (!genderByPersonName) {
    genderByPersonName = new Map();
    for (const a of avatars) {
      const g = avatarGender(a);
      if (g) genderByPersonName.set(a.name.trim().toLowerCase(), g);
    }
  }
  return genderByPersonName.get(name.trim().toLowerCase());
}

/** `Voice` carries NO gender field, so this keys off the two honest signals it
 *  does have: an explicit "female"/"male" word in the name ("Divya — Tamil
 *  female"), then the voice's own person name matched against the avatar
 *  roster — the two rosters are named in pairs (`voice-sarah-mom` ↔
 *  `ava-sarah`). "Sutradhaar" matches neither and stays unknown, which keeps
 *  it out of a gendered pool instead of guessing. */
function voiceGender(v: Voice): Gender | undefined {
  if (/\bfemale\b/i.test(v.name)) return "f";
  if (/\bmale\b/i.test(v.name)) return "m";
  return genderForPersonName(v.name.split("—")[0]);
}

const FEMALE_WORDS = /\b(mom|mum|mother|woman|women|girl|girls|bride|sister|wife|daughter|her|she)\b/i;
const MALE_WORDS = /\b(dad|father|man|men|guy|guys|boy|boys|groom|brother|husband|son|his|he)\b/i;

/** The concept's own prose is the presenter cue — "Mom emotional story · Real
 *  mom + toddler in bath" beside a male avatar is the same incoherence as a
 *  male voice over a female one. Prose naming both stays unconstrained. */
function conceptGender(c: Concept | undefined): Gender | undefined {
  if (!c) return undefined;
  const text = `${c.name} ${c.visualDirection ?? ""} ${c.tone ?? ""}`;
  const f = FEMALE_WORDS.test(text);
  const m = MALE_WORDS.test(text);
  return f && !m ? "f" : m && !f ? "m" : undefined;
}

/* --------------------------------------------------------------- the cast */

interface DerivedCast {
  avatar?: Avatar;
  voice?: Voice;
  /** The one code the avatar, voice and language rows all report. */
  languageCode?: string;
}

/** The code all three rows report: the avatar's own regional spelling of the
 *  derived language ("hi" → "hi-IN"), so the voice join has a locale to hit. */
function spokenByAvatar(a: Avatar, target: string | undefined): string | undefined {
  const tag = baseTag(target);
  return (
    a.language.find((c) => c === target) ??
    a.language.find((c) => baseTag(c) === tag) ??
    a.language.find((c) => PRESENTABLE_LANGUAGE_CODES.some((p) => baseTag(p) === baseTag(c))) ??
    a.language[0]
  );
}

function deriveVoice(seedId: string, languageCode: string | undefined, gender: Gender | undefined): Voice | undefined {
  const pool = narrow(
    voices,
    (v) => v.language === languageCode,
    (v) => baseTag(v.language) === baseTag(languageCode),
  );
  // A male voice over a female presenter is the incoherence this exists for:
  // no same-gender voice in the language means N/F, not the wrong one.
  return pick(gender ? pool.filter((v) => voiceGender(v) === gender) : pool, `voice:${seedId}`);
}

/**
 * ONE pick, not three: the language is settled first (read off the copy or the
 * batch — never derived here any more), the avatar is picked from those who
 * speak it, and the voice inside that avatar's gender.
 *
 * The language is NOT bendable. It used to be — a female-cue concept in a
 * language whose only presenter is male (Bengali) moved to another language
 * instead — but that swap is only honest while the language is itself a guess.
 * Now that it is a read fact, a cue the roster cannot cast is answered by
 * whoever does speak the language; nothing may rewrite the language row.
 *
 * An empty `target` (a textless ad, every row of which is N/F) matches no
 * avatar, so the cast comes back empty rather than invented.
 */
function deriveCast(
  seedId: string,
  target: string | undefined,
  wantsVoice: boolean,
  hint?: Gender,
): DerivedCast {
  const spoken = narrow(
    avatars,
    (a) => a.language.includes(target ?? ""),
    (a) => a.language.some((c) => baseTag(c) === baseTag(target)),
  );
  const byHint = hint ? spoken.filter((a) => avatarGender(a) === hint) : [];
  const avatar = pick(byHint.length > 0 ? byHint : spoken, `avatar:${seedId}`);
  if (!avatar) return { languageCode: target };
  const languageCode = spokenByAvatar(avatar, target);
  return {
    avatar,
    voice: wantsVoice ? deriveVoice(seedId, languageCode, avatarGender(avatar)) : undefined,
    languageCode,
  };
}

function avatarField(a: Avatar | undefined): AnalysedField {
  if (!a) return notFound();
  return detected(a.name, `${a.demographic} · ${personalityLabel(a.personalityId)}`);
}

function voiceField(v: Voice | undefined): AnalysedField {
  if (!v) return notFound();
  const tone = v.tones?.[0] ? toneLabel(v.tones[0]) : undefined;
  const lang = labelForLanguageCode(v.language);
  return detected(v.name, [lang, tone].filter(Boolean).join(" · ") || null);
}

/* ----------------------------------------------------------------- scripts */

const NAME_STOPWORDS = new Set(["the", "for", "with", "and", "pack", "day", "size", "free"]);

/** Script titles name a product in prose ("Onion Shampoo — hair fall PAS"),
 *  and a source's product name ("Onion shampoo") never equals the catalogue's
 *  ("Onion Hair Shampoo for Hair Fall Control"), so match on distinctive
 *  tokens rather than on a string equality that would never fire. */
function nameTokens(name: string): string[] {
  return name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !NAME_STOPWORDS.has(t));
}

function titleNamesProduct(title: string, productName: string): boolean {
  const t = title.toLowerCase();
  const tokens = nameTokens(productName);
  if (tokens.length === 0) return false;
  const hits = tokens.filter((tok) => t.includes(tok)).length;
  return hits >= Math.min(2, tokens.length);
}

/** A model number in the title the source's product doesn't carry means a
 *  sibling SKU ("Airdopes 161" on an Airdopes 141 ad). The products roster
 *  alone can't catch that — not every SKU a script names exists in it. */
function namesAnotherProduct(title: string, productName: string, brandId: string): boolean {
  const mine = nameTokens(productName);
  const lead = title.split("—")[0];
  if (nameTokens(lead).some((t) => /\d/.test(t) && !mine.includes(t))) return true;
  return products.some(
    (p) => p.brandId === brandId && !titleNamesProduct(p.name, productName) && titleNamesProduct(title, p.name),
  );
}

/** Prefer the source's own angle, then a shipped script over a draft — a
 *  "draft v2" is not what an ad already in the library was made from. */
function bestScript(pool: readonly ScriptAsset[], angleId: string | undefined, seedId: string): ScriptAsset | undefined {
  const tiers = [
    angleId ? pool.filter((s) => s.angleId === angleId) : [],
    pool.filter((s) => !s.tags.includes("draft")),
    pool,
  ];
  for (const tier of tiers) {
    const s = pick(tier, `script:${seedId}`);
    if (s) return s;
  }
  return undefined;
}

/** A script is only derivable where one could exist — a video source — and
 *  only from the source's own brand. Where the source names a product, a
 *  sibling product's script is a wrong fact: N/F beats "Onion Shampoo — hair
 *  fall PAS" printed on a face-wash ad. */
function scriptField(
  isVideo: boolean,
  brandId: string | undefined,
  angleId: string | undefined,
  productName: string | undefined,
  seedId: string,
): AnalysedField {
  if (!isVideo || !brandId) return notFound();
  const byBrand = scripts.filter((s) => s.brandId === brandId);
  if (byBrand.length === 0) return notFound();

  let pool: readonly ScriptAsset[] = byBrand;
  if (productName) {
    const mine = byBrand.filter((s) => titleNamesProduct(s.title, productName));
    pool = mine.length > 0 ? mine : byBrand.filter((s) => !namesAnotherProduct(s.title, productName, brandId));
    if (pool.length === 0) return notFound();
  }

  const s = bestScript(pool, angleId, seedId);
  if (!s) return notFound();
  return detected(s.title, `${s.framework} · ${s.durationSec}s`);
}

/* ------------------------------------------------------- catalogue lookup */

/** Outputs carry brand/product NAMES, never catalogue ids — and the one id
 *  they do carry (`priorConfig.brandId`) is unreliable ("wow-skin" is not a
 *  brands.ts id). Match on the name, which is the authoritative display value
 *  either way. */
function brandIdForName(name: string | undefined): string | undefined {
  if (!name) return undefined;
  return brands.find((b) => b.name.toLowerCase() === name.trim().toLowerCase())?.id;
}

/* ----------------------------------------------------------- tracked batch */

/**
 * The approach, the output language and the aspect ratio are STORED facts —
 * but only on `RunBatch.config`, never on the output itself, which is why the
 * Approach row read N/F on every path before this. `getBatchForOutput` is the
 * plain, non-hook read added to genieRunStore for exactly this deriver (this
 * file is pure and runs inside a `useMemo`, so a hook is not an option). An
 * untracked output has no batch and keeps today's derived/N-F behaviour.
 */
function batchConfigFor(outputId: string): RunBatch["config"] | undefined {
  return getBatchForOutput(outputId)?.config;
}

/** `approachLabel()` returns undefined for anything that is not one of the
 *  seven real approach ids, ON PURPOSE (batchDisplay.ts) — so an app-origin
 *  batch (which never went through Step 3) and a mislabelled value both stay
 *  N/F instead of printing something that was never an approach. */
function approachField(config: RunBatch["config"] | undefined): AnalysedField {
  return stored(approachLabel(config?.approach), "read off the batch that produced it");
}

/* ------------------------------------------------------------- video sage */

let videoSageCache: Map<string, DummyVideo> | null = null;

/** `getDummyVideos()` rebuilds its array per call — index it once. The ref's
 *  id IS the video id, which is the only join back to the real script. */
function videoSageById(id: string): DummyVideo | undefined {
  if (!videoSageCache) {
    videoSageCache = new Map(getDummyVideos().map((v) => [v.id, v]));
  }
  return videoSageCache.get(id);
}

/* ------------------------------------------------------------------ source */

function sourceForOutput(out: OutputData): VariationSource {
  return {
    kind: "genie-output",
    id: out.id,
    title: out.headline || out.product?.name || out.brand?.name || "Untitled generation",
    subtitle:
      [out.brand?.name, out.product?.name, out.format ?? out.mediaType].filter(Boolean).join(" · ") ||
      undefined,
    thumbnail: out.thumbnail,
    originLabel: "Library",
    sourceFormat: out.mediaType === "video" ? "video" : "image",
  };
}

function sourceForRef(ref: FlowSourceRef): VariationSource {
  const mod = getFlowModule(ref.module);
  return {
    kind: "flow-ref",
    id: ref.id,
    title: ref.title,
    subtitle: ref.subtitle,
    thumbnail: ref.thumbnail,
    originLabel: mod?.label ?? "Other flow",
    module: ref.module,
    competitorOwned: ref.competitorOwned || mod?.competitorOwned || undefined,
    sourceFormat: ref.sourceFormat,
  };
}

function sourceForUpload(file: UploadedAdStub): VariationSource {
  return {
    kind: "upload",
    id: file.id,
    title: file.name || "Uploaded ad",
    thumbnail: file.previewUrl,
    originLabel: "Uploaded",
    sourceFormat: file.mediaType,
  };
}

/** Every row absent. The competitor and upload cases, and a Video Sage row
 *  whose analysis has not landed or failed outright. */
function nothingDetected(source: VariationSource): AdAnalysis {
  return {
    source,
    type: notFound<AdTypeKind>(),
    entityName: notFound(),
    angle: notFound(),
    concept: notFound(),
    approach: notFound(),
    avatar: notFound(),
    voice: notFound(),
    language: notFound(),
    script: notFound(),
    visualDirection: notFound(),
    aspectRatio: notFound(),
  };
}

/* ------------------------------------------------------------------ output */

function analyseOutput(out: OutputData): AdAnalysis {
  const source = sourceForOutput(out);
  const isVideo = out.mediaType === "video";
  const brandName = out.brand?.name || undefined;
  const productName = out.product?.name || undefined;
  const brandId = brandIdForName(brandName);

  const type: AdTypeKind = productName ? "product" : brandName ? "brand" : "not-found";
  const angle = angleLabelById(out.angleId ?? out.priorConfig?.angleId);
  const concept = deriveConcept(brandId, angle?.label, isVideo, out.id);
  const config = batchConfigFor(out.id);
  const lang = resolveLanguage(outputCopy(out), brandId, config?.language);
  // A static ad has no voice-over — an invented one would be worse than N/F.
  // The language is a read fact now, so the cast is narrowed TO it (locked)
  // rather than being free to rename it.
  const cast = deriveCast(out.id, lang.code, isVideo, conceptGender(concept));

  return {
    source,
    type: type === "not-found" ? notFound<AdTypeKind>() : stored<AdTypeKind>(type),
    entityName: stored(productName ?? brandName, productName ? brandName : undefined),
    angle: angle ? stored(angle.label, angle.description) : notFound(),
    concept: concept ? detected(concept.name, concept.tone) : notFound(),
    approach: approachField(config),
    avatar: avatarField(cast.avatar),
    voice: voiceField(cast.voice),
    language: languageField(lang),
    script: scriptField(isVideo, brandId, out.angleId ?? out.priorConfig?.angleId, productName, out.id),
    visualDirection: concept ? detected(concept.visualDirection, concept.name) : notFound(),
    aspectRatio: config?.aspectRatio
      ? stored(config.aspectRatio, "read off the batch that produced it")
      : aspectRatioField(concept, isVideo),
  };
}

/* --------------------------------------------------------------- flow ref */

/** A product entity still gives us its brand — which is what every concept /
 *  script join needs. Without this a product-scoped source loses its whole
 *  creative half of the overview. */
function brandIdForEntity(kind: string, id: string): string | undefined {
  if (kind === "brand") return id;
  if (kind === "product") return getProduct(id)?.brandId;
  return undefined;
}

function typeForRef(ref: FlowSourceRef): { type: AnalysedField<AdTypeKind>; name: AnalysedField; brandId?: string } {
  // A Winner Ad ref is the richest case — it carries a real catalogue
  // entityType + entityId, including the only `category` rows in the mocks.
  const winner = WINNER_ADS.find((w) => w.id === ref.id);
  if (winner) {
    const name =
      winner.entityType === "brand"
        ? brands.find((b) => b.id === winner.entityId)?.name
        : winner.entityType === "product"
          ? getProduct(winner.entityId)?.name
          : getCategory(winner.entityId)?.name;
    return {
      type: stored<AdTypeKind>(winner.entityType),
      name: stored(name ?? winner.entityId),
      brandId: brandIdForEntity(winner.entityType, winner.entityId),
    };
  }

  const e = ref.detectedEntity;
  if (e) {
    // Both a category and a product resolve to the paired type — the same
    // combination Performance Ad's entity rule already allows.
    const alsoProduct = e.kind === "category" ? ref.extraction?.matchedProductId : undefined;
    return {
      type: stored<AdTypeKind>(alsoProduct ? "category-product" : e.kind),
      name: stored(e.name),
      brandId: brandIdForEntity(e.kind, e.id) ?? (alsoProduct ? getProduct(alsoProduct)?.brandId : undefined),
    };
  }

  // §7.5 — the URL extraction is real, visible, editable data even when it
  // matched nothing in the catalogue.
  if (ref.extraction?.product) {
    return { type: detected<AdTypeKind>("other"), name: stored(ref.extraction.product) };
  }

  // Identifiable, but nothing of ours behind it (a trend, an unmatched row).
  // `sourceBrandName` is display text and must never become an entity, so the
  // entity row stays N/F rather than borrowing it.
  return { type: detected<AdTypeKind>("other"), name: notFound() };
}

function analyseVideoSage(ref: FlowSourceRef, source: VariationSource): AdAnalysis {
  const video = videoSageById(ref.id);
  const analysis: VideoSageAnalysis | null = video?.analysis ?? null;
  if (!analysis) return nothingDetected(source);

  const resolved = typeForRef(ref);
  const concept = deriveConcept(resolved.brandId, undefined, true, ref.id);
  const spoken = languageEntryByName(analysis.metadata.language ?? video?.language);
  // The language row here is STORED off the analysed video, so the cast is
  // narrowed to it rather than the other way round.
  const cast = deriveCast(ref.id, spoken?.code ?? DEFAULT_LANGUAGE, true, conceptGender(concept));

  return {
    source,
    type: resolved.type,
    entityName: resolved.name,
    angle: concept ? detected(concept.angle, concept.name) : notFound(),
    concept: concept ? detected(concept.name, concept.tone) : notFound(),
    // `analysis.framework` is a script framework (PAS / AIDA), not one of the
    // seven Studio approaches — reporting it here would repeat the exact
    // mislabelling `approachLabel()` refuses to pass through.
    approach: notFound(),
    avatar: avatarField(cast.avatar),
    voice: voiceField(cast.voice),
    language: stored(
      spoken ? languageLabel(spoken.code) : (analysis.metadata.language ?? video?.language),
      "read off the analysed video",
    ),
    script: stored(
      `${analysis.framework.name} · ${analysis.script.length} beats`,
      `${analysis.metadata.scriptingStyle} · ${analysis.metadata.duration}s`,
    ),
    visualDirection: stored(
      analysis.storyboard[0]?.visuals,
      `${analysis.metadata.captionTheme} caption theme`,
    ),
    // A Video Sage source is always a video.
    aspectRatio: aspectRatioField(concept, true),
  };
}

function analyseRef(ref: FlowSourceRef): AdAnalysis {
  const source = sourceForRef(ref);

  // §7.2 — a rival's ad. There is nothing in OUR catalogue behind it, which is
  // why Industry Insights refs deliberately carry no `detectedEntity` at all.
  if (source.competitorOwned) return nothingDetected(source);

  if (ref.module === "video-sage") return analyseVideoSage(ref, source);

  const isVideo = ref.sourceFormat === "video";
  const resolved = typeForRef(ref);
  const angleLabel = ref.trendAngle ? trimToValue(ref.trendAngle) : undefined;
  const concept = deriveConcept(resolved.brandId, angleLabel, isVideo, ref.id);
  // A Creative Library ref of Genie's OWN output carries the output id as its
  // ref id (`sampleOutputRef` in flowSources.ts), so it can reach the batch
  // that produced it. Every other module's ids match nothing here, which is
  // the honest answer for them.
  const config = batchConfigFor(ref.id);
  const lang = resolveLanguage(refCopy(ref), resolved.brandId, config?.language);
  const cast = deriveCast(ref.id, lang.code, isVideo, conceptGender(concept));
  // Only a product-scoped entity names a product — on "category-product" the
  // name row holds the CATEGORY, so reading it as a product would filter every
  // one of the brand's scripts out.
  const productName = resolved.type.value === "product" ? (resolved.name.value ?? undefined) : undefined;

  return {
    source,
    type: resolved.type,
    entityName: resolved.name,
    angle: angleLabel
      ? stored(angleLabel, "the angle this source fills in")
      : concept
        ? detected(concept.angle, concept.name)
        : notFound(),
    concept: concept ? detected(concept.name, concept.tone) : notFound(),
    approach: approachField(config),
    avatar: avatarField(cast.avatar),
    voice: voiceField(cast.voice),
    language: languageField(lang),
    script: scriptField(isVideo, resolved.brandId, undefined, productName, ref.id),
    visualDirection: concept ? detected(concept.visualDirection, concept.name) : notFound(),
    aspectRatio: config?.aspectRatio
      ? stored(config.aspectRatio, "read off the batch that produced it")
      : aspectRatioField(concept, isVideo),
  };
}

/* ------------------------------------------------------------------- entry */

export function analyseAd(picked: PickedSource): AdAnalysis {
  switch (picked.kind) {
    case "genie-output":
      return analyseOutput(picked.output);
    case "flow-ref":
      return analyseRef(picked.ref);
    case "upload":
      // An upload carries no provenance by nature. Everything but the source
      // row is honestly absent.
      return nothingDetected(sourceForUpload(picked.file));
  }
}
