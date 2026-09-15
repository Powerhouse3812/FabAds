import type { Avatar, Voice, VoiceId } from "@/genie6/types/entities";
import type { EnvironmentId, PersonalityId } from "@/genie6/brain/avatarTaxonomy";
import type { Provenance } from "@/genie6/lib/genieRunTypes";
import { posterForSeed, videoForSeed } from "@/genie6/studio-v4/data/studio-visuals";
import { voices } from "./voices";

/**
 * Avatars — single source of truth (Catalogue ↔ Genie sync).
 *
 * 52 entries · multilingual personas across regions + ages. Used by
 * the Studio generation flow to anchor on-camera identity for video
 * outputs.
 *
 * Genie 2.0 §11/§13 additions (additive — see `Avatar` in
 * `@/genie6/types/entities`):
 *  - `environmentId` / `personalityId` — every avatar tagged from the shared
 *    taxonomy in `src/genie6/brain/avatarTaxonomy.ts`. That file also owns
 *    two deliberate edge cases (an empty environment, a singleton
 *    personality) — this file's tags are what populate them, not a bug.
 *  - `previewVideo` (+ `thumbnail` as its poster) — §13 upgrade 1, reusing
 *    the deterministic seeded-clip pool already built for Studio Alpha
 *    (`studio-v4/data/studio-visuals.ts`) rather than inventing a second
 *    pool. Two avatars (`ava-david`, `ava-mai-vn`) deliberately carry no
 *    preview — the "avatar with no preview video yet" edge case.
 *  - `provenance` — a handful of entries are tagged `client-created`
 *    (a brand's own supplied presenter) against the `fabfunnel-seeded`
 *    default, so the taxonomy browser in Genie Brain has both kinds to show,
 *    per §21.2.
 *
 * Schema: see `Avatar` in `@/genie6/types/entities`.
 */

const CLIENT_CREATED_IDS = new Set([
  "ava-vikram",
  "ava-zoya",
  "ava-jessica",
  "ava-mei",
  "ava-kwame",
  "ava-margaret",
]);

/** Deliberately missing a preview clip yet — the "no preview video" edge case. */
const NO_PREVIEW_IDS = new Set(["ava-david", "ava-mai-vn"]);

/**
 * `demographic` is the single source of truth for gender/ageRange/race/segment
 * (owner spec 2026-09-14, see `Avatar` in `@/genie6/types/entities`). We parse
 * it here instead of hand-typing the four fields alongside the string, because
 * hand-typing gives two places that describe the same persona and no way to
 * guarantee they agree — e.g. someone edits "F · 28-34 · South Asian" to
 * "F · 29-35 · South Asian" and forgets the sibling `ageRange` field, and the
 * card silently shows the stale age forever.
 *
 * Every one of the 52 seed rows below is "F|M · <age range> · <race>" with
 * zero or more trailing qualifier words ("metro", "mom", "tier-1", or
 * multi-word ones like "gen-z creator", "urban Shanghai") joined back with
 * " · " into `segment`. All 52 rows were read and fit this 3-or-4-part shape
 * (a couple of races are themselves multi-word — "South Indian", "West
 * African", "Singaporean Chinese" — which is fine since we split on "·", not
 * spaces). None needed special-casing.
 *
 * Malformed/short input must not throw (a hand-edited row should still
 * render), so missing parts fall back to "" and an unrecognised gender token
 * is kept verbatim rather than guessed at.
 */
function parseDemographic(demographic: string): {
  gender: string;
  ageRange: string;
  race: string;
  segment?: string;
} {
  const parts = demographic
    .split("·")
    .map((p) => p.trim())
    .filter(Boolean);
  const [genderToken = "", ageRange = "", race = "", ...rest] = parts;
  const gender = genderToken === "F" ? "Female" : genderToken === "M" ? "Male" : genderToken;
  return {
    gender,
    ageRange,
    race,
    segment: rest.length > 0 ? rest.join(" · ") : undefined,
  };
}

/**
 * Tiny deterministic hash (FNV-1a) — same algorithm as the one in
 * `voices.ts`, duplicated rather than imported because this task is scoped
 * to editing only this file and that hash isn't exported. Stable per input
 * string, no runtime randomness, so the same avatar always resolves to the
 * same voice.
 */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * A handful of voices never spell out "female"/"male" in their own name or
 * description (the classifier below reads those words literally), because
 * the seed author trusted the first name to carry it — "Priya", "Vikram",
 * "David". This is the same trust an Indian-agency demo audience would extend
 * reading the roster, just made explicit so the voice-pairing rule below can
 * still honour gender without guessing at name etymology in code.
 */
const VOICE_GENDER_OVERRIDES: Record<string, "Female" | "Male"> = {
  "voice-priya-warm": "Female",
  "voice-aarav-energetic": "Male",
  "voice-naina-confident": "Female",
  "voice-meera-mom": "Female",
  "voice-vikram-authority": "Male",
  "voice-rohan-corporate": "Male",
  "voice-zoya-fashion": "Female",
  "voice-arjun-genz": "Male",
  "voice-ananya-storyteller": "Female",
  "voice-emily-calm": "Female",
  "voice-marcus-bold": "Male",
  "voice-james-finance": "Male",
  "voice-sarah-mom": "Female",
  "voice-ethan-tech": "Male",
  "voice-jessica-creator": "Female",
  "voice-olivia-rp": "Female",
  "voice-david-narrator": "Male",
  "voice-yuki-bright": "Female",
  "voice-hiroshi-narrator": "Male",
  "voice-uncle-rajan": "Male",
  "voice-sutradhaar": "Male",
};

/** Reads a voice's own words first ("Divya — Tamil female"), then the
 *  override table above, before giving up as unknown. */
function voiceGender(voice: Voice): "Female" | "Male" | "Unknown" {
  const text = `${voice.name} ${voice.description}`;
  if (/\bfemale\b/i.test(text)) return "Female";
  if (/\bmale\b/i.test(text)) return "Male";
  return VOICE_GENDER_OVERRIDES[voice.id] ?? "Unknown";
}

/**
 * Pairing rule (owner spec 2026-09-14 — Avatar + voice is one row, so every
 * avatar needs a real `voiceId`, deterministically, never `Math.random()`):
 *
 *  1. Language first — narrow to voices whose `language` is one of the
 *     avatar's own language tags (exact match, e.g. an "en-IN"/"hi-IN"
 *     avatar only sees Indian-locale voices, never generic "en-US"). If
 *     nothing matches exactly (a few avatars carry a locale no voice uses
 *     verbatim, like "en-NG" or "en-PH"), widen to any voice sharing the
 *     base language before the "-" (so "en-NG" still finds the "en" voices
 *     instead of falling through to a random language).
 *  2. Gender second — within that language pool, prefer voices read as the
 *     avatar's own gender; if none in the pool carry that gender, keep the
 *     whole language pool rather than leaving the avatar unpaired.
 *  3. Pick deterministically via `hash(avatarId)` into whatever pool
 *     survives, so pairings are stable and spread across the roster instead
 *     of every avatar landing on voice #1.
 */
function pickVoiceId(avatarId: string, languages: string[], gender: string): VoiceId {
  const exact = voices.filter((v) => languages.includes(v.language));
  const basePrefixes = new Set(languages.map((l) => l.split("-")[0]));
  const byBaseLanguage = voices.filter((v) => basePrefixes.has(v.language.split("-")[0]));
  const languagePool = exact.length > 0 ? exact : byBaseLanguage.length > 0 ? byBaseLanguage : voices;

  const genderPool = languagePool.filter((v) => voiceGender(v) === gender);
  const pool = genderPool.length > 0 ? genderPool : languagePool;

  return pool[hash(`${avatarId}:voice`) % pool.length].id;
}

const av = (
  id: string,
  name: string,
  demographic: string,
  language: string[],
  environmentId: EnvironmentId,
  personalityId: PersonalityId,
): Avatar => {
  const seed = `avatar:${id}`;
  const provenance: Provenance = CLIENT_CREATED_IDS.has(id) ? "client-created" : "fabfunnel-seeded";
  const hasPreview = !NO_PREVIEW_IDS.has(id);
  const { gender, ageRange, race, segment } = parseDemographic(demographic);
  return {
    id,
    name,
    demographic,
    gender,
    ageRange,
    race,
    ...(segment !== undefined ? { segment } : {}),
    voiceId: pickVoiceId(id, language, gender),
    language,
    environmentId,
    personalityId,
    provenance,
    ...(hasPreview
      ? { thumbnail: posterForSeed(seed), previewVideo: videoForSeed(seed) }
      : {}),
  };
};

export const avatars: Avatar[] = [
  // South Asian
  av("ava-priya", "Priya", "F · 28-34 · South Asian", ["en-IN", "hi-IN"], "home-kitchen", "warm-friend"),
  av("ava-aarav", "Aarav", "M · 25-31 · South Asian", ["en-IN", "hi-IN"], "studio-seamless", "calm-expert"),
  av("ava-naina", "Naina", "F · 21-26 · South Asian", ["en-IN", "hi-IN"], "studio-seamless", "high-energy-hype"),
  av("ava-rohan", "Rohan", "M · 30-38 · Pan-Asian", ["en-IN", "en-US"], "office-desk", "calm-expert"),
  av("ava-ananya", "Ananya", "F · 24-30 · South Asian · metro", ["en-IN", "hi-IN"], "bathroom-vanity", "girl-next-door"),
  av("ava-vikram", "Vikram", "M · 32-40 · South Asian · tier-1", ["en-IN", "hi-IN"], "office-desk", "no-nonsense-value"),
  av("ava-meera", "Meera", "F · 35-44 · South Asian · mom", ["en-IN", "hi-IN", "ta-IN"], "home-kitchen", "warm-friend"),
  av("ava-arjun", "Arjun", "M · 22-28 · South Asian · gen-z", ["en-IN", "hi-IN"], "studio-seamless", "high-energy-hype"),
  av("ava-divya", "Divya", "F · 26-32 · South Indian", ["en-IN", "ta-IN", "hi-IN"], "bathroom-vanity", "girl-next-door"),
  av("ava-karthik", "Karthik", "M · 28-36 · South Indian", ["en-IN", "ta-IN", "te-IN"], "retail-aisle", "calm-expert"),
  av("ava-kavya", "Kavya", "F · 22-28 · South Indian · gen-z", ["en-IN", "ta-IN"], "studio-seamless", "high-energy-hype"),
  av("ava-sanya", "Sanya", "F · 30-38 · Punjabi · expressive", ["en-IN", "hi-IN", "pa-IN"], "outdoor-street", "aspirational"),
  av("ava-ishaan", "Ishaan", "M · 24-30 · Bengali · creative", ["en-IN", "hi-IN", "bn-IN"], "studio-seamless", "dry-deadpan"),
  av("ava-rohini", "Rohini", "F · 38-46 · Maharashtrian · mom", ["en-IN", "hi-IN", "mr-IN"], "home-kitchen", "warm-friend"),
  av("ava-zoya", "Zoya", "F · 25-32 · South Asian · urban-fashion", ["en-IN", "hi-IN", "ur"], "retail-aisle", "aspirational"),
  av("ava-dev", "Dev", "M · 35-44 · South Asian · executive", ["en-IN", "hi-IN", "en-GB"], "office-desk", "calm-expert"),

  // MENA
  av("ava-zara", "Zara", "F · 32-38 · MENA", ["en-US", "ar"], "living-room", "aspirational"),
  av("ava-omar", "Omar", "M · 28-36 · MENA · urban", ["en-US", "ar"], "outdoor-street", "dry-deadpan"),
  av("ava-leila", "Leila", "F · 24-30 · MENA · modest-fashion", ["en-US", "ar", "fr"], "retail-aisle", "girl-next-door"),
  av("ava-hassan", "Hassan", "M · 36-44 · MENA · entrepreneur", ["en-US", "ar"], "office-desk", "calm-expert"),

  // Caucasian / North America / Europe
  av("ava-emily", "Emily", "F · 24-30 · Caucasian", ["en-US", "en-GB"], "bathroom-vanity", "girl-next-door"),
  av("ava-marcus", "Marcus", "M · 28-34 · African-American", ["en-US"], "gym", "high-energy-hype"),
  av("ava-james", "James", "M · 32-40 · Caucasian · finance", ["en-US"], "office-desk", "calm-expert"),
  av("ava-sarah", "Sarah", "F · 35-42 · Caucasian · mom-of-2", ["en-US"], "home-kitchen", "warm-friend"),
  av("ava-jessica", "Jessica", "F · 22-28 · Caucasian · gen-z creator", ["en-US"], "studio-seamless", "high-energy-hype"),
  av("ava-ethan", "Ethan", "M · 26-32 · Caucasian · tech bro", ["en-US"], "office-desk", "dry-deadpan"),
  av("ava-olivia", "Olivia", "F · 30-38 · Caucasian · UK-based", ["en-GB"], "living-room", "aspirational"),
  av("ava-ava", "Ava", "F · 28-34 · Caucasian · LA fitness", ["en-US"], "gym", "high-energy-hype"),
  av("ava-noah", "Noah", "M · 24-30 · Caucasian · NY hipster", ["en-US"], "outdoor-street", "dry-deadpan"),
  av("ava-isabella", "Isabella", "F · 30-36 · Latina · LA", ["en-US", "es"], "retail-aisle", "aspirational"),
  av("ava-mateo", "Mateo", "M · 25-32 · Latino · Miami", ["en-US", "es"], "outdoor-street", "high-energy-hype"),
  av("ava-sofia", "Sofia", "F · 26-32 · European · Spain", ["en-GB", "es", "fr"], "bathroom-vanity", "aspirational"),

  // East Asian
  av("ava-yuki", "Yuki", "F · 26-32 · East Asian", ["ja", "en-US"], "studio-seamless", "girl-next-door"),
  av("ava-hiroshi", "Hiroshi", "M · 30-38 · Japanese", ["ja", "en-US"], "office-desk", "calm-expert"),
  av("ava-mei", "Mei", "F · 24-30 · Chinese · urban Shanghai", ["zh-CN", "en-US"], "living-room", "girl-next-door"),
  av("ava-kenji", "Kenji", "M · 28-36 · Japanese · creative", ["ja", "en-US"], "studio-seamless", "dry-deadpan"),
  av("ava-ji-eun", "Ji-eun", "F · 22-28 · Korean · K-beauty enthusiast", ["ko", "en-US"], "bathroom-vanity", "girl-next-door"),
  av("ava-min-jun", "Min-jun", "M · 26-32 · Korean · streetwear", ["ko", "en-US"], "studio-seamless", "high-energy-hype"),
  av("ava-xiao-lin", "Xiao Lin", "F · 30-38 · Chinese · mom in Beijing", ["zh-CN"], "home-kitchen", "warm-friend"),

  // SEA
  av("ava-anya-th", "Anya", "F · 24-30 · Thai · Bangkok urban", ["th", "en-US"], "retail-aisle", "aspirational"),
  av("ava-darius", "Darius", "M · 28-34 · Filipino · Manila", ["en-PH", "fil"], "outdoor-street", "high-energy-hype"),
  av("ava-rina-id", "Rina", "F · 22-28 · Indonesian · Jakarta gen-z", ["id", "en-US"], "studio-seamless", "high-energy-hype"),
  av("ava-aaron-sg", "Aaron", "M · 30-38 · Singaporean Chinese", ["en-SG", "zh-CN"], "office-desk", "calm-expert"),
  av("ava-mai-vn", "Mai", "F · 26-32 · Vietnamese · Saigon", ["vi", "en-US"], "home-kitchen", "girl-next-door"),

  // Africa
  av("ava-amara", "Amara", "F · 28-34 · West African · Lagos", ["en-NG"], "outdoor-street", "aspirational"),
  av("ava-kwame", "Kwame", "M · 26-32 · West African · Accra", ["en-GH"], "gym", "high-energy-hype"),
  av("ava-thandi", "Thandi", "F · 30-38 · South African · Johannesburg", ["en-ZA"], "office-desk", "calm-expert"),

  // Australia / Oceania
  av("ava-max-au", "Max", "M · 30-38 · Australian · Sydney creative", ["en-AU"], "outdoor-street", "dry-deadpan"),
  av("ava-charlotte-au", "Charlotte", "F · 26-32 · Australian · Melbourne mom", ["en-AU"], "home-kitchen", "warm-friend"),

  // Senior / older
  av("ava-margaret", "Margaret", "F · 50-60 · Caucasian · empty-nester", ["en-US"], "living-room", "trusted-elder"),
  av("ava-david", "David", "M · 55-65 · Caucasian · semi-retired", ["en-US", "en-GB"], "living-room", "trusted-elder"),
  av("ava-uncle-rajan", "Uncle Rajan", "M · 50-60 · South Asian · traditional", ["en-IN", "hi-IN"], "home-kitchen", "trusted-elder"),
];
