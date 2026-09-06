import type { Avatar } from "@/genie6/types/entities";
import type { EnvironmentId, PersonalityId } from "@/genie6/brain/avatarTaxonomy";
import type { Provenance } from "@/genie6/lib/genieRunTypes";
import { posterForSeed, videoForSeed } from "@/genie6/studio-v4/data/studio-visuals";

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
  return {
    id,
    name,
    demographic,
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
