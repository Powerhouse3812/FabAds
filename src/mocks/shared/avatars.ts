import type { Avatar } from "@/genie6/types/entities";

/**
 * Avatars — single source of truth (Catalogue ↔ Genie sync).
 *
 * 52 entries · multilingual personas across regions + ages. Used by
 * the Studio generation flow to anchor on-camera identity for video
 * outputs.
 *
 * Schema: see `Avatar` in `@/genie6/types/entities`.
 */

const av = (id: string, name: string, demographic: string, language: string[]): Avatar => ({
  id, name, demographic, language,
});

export const avatars: Avatar[] = [
  // South Asian
  av("ava-priya", "Priya", "F · 28-34 · South Asian", ["en-IN", "hi-IN"]),
  av("ava-aarav", "Aarav", "M · 25-31 · South Asian", ["en-IN", "hi-IN"]),
  av("ava-naina", "Naina", "F · 21-26 · South Asian", ["en-IN", "hi-IN"]),
  av("ava-rohan", "Rohan", "M · 30-38 · Pan-Asian", ["en-IN", "en-US"]),
  av("ava-ananya", "Ananya", "F · 24-30 · South Asian · metro", ["en-IN", "hi-IN"]),
  av("ava-vikram", "Vikram", "M · 32-40 · South Asian · tier-1", ["en-IN", "hi-IN"]),
  av("ava-meera", "Meera", "F · 35-44 · South Asian · mom", ["en-IN", "hi-IN", "ta-IN"]),
  av("ava-arjun", "Arjun", "M · 22-28 · South Asian · gen-z", ["en-IN", "hi-IN"]),
  av("ava-divya", "Divya", "F · 26-32 · South Indian", ["en-IN", "ta-IN", "hi-IN"]),
  av("ava-karthik", "Karthik", "M · 28-36 · South Indian", ["en-IN", "ta-IN", "te-IN"]),
  av("ava-kavya", "Kavya", "F · 22-28 · South Indian · gen-z", ["en-IN", "ta-IN"]),
  av("ava-sanya", "Sanya", "F · 30-38 · Punjabi · expressive", ["en-IN", "hi-IN", "pa-IN"]),
  av("ava-ishaan", "Ishaan", "M · 24-30 · Bengali · creative", ["en-IN", "hi-IN", "bn-IN"]),
  av("ava-rohini", "Rohini", "F · 38-46 · Maharashtrian · mom", ["en-IN", "hi-IN", "mr-IN"]),
  av("ava-zoya", "Zoya", "F · 25-32 · South Asian · urban-fashion", ["en-IN", "hi-IN", "ur"]),
  av("ava-dev", "Dev", "M · 35-44 · South Asian · executive", ["en-IN", "hi-IN", "en-GB"]),

  // MENA
  av("ava-zara", "Zara", "F · 32-38 · MENA", ["en-US", "ar"]),
  av("ava-omar", "Omar", "M · 28-36 · MENA · urban", ["en-US", "ar"]),
  av("ava-leila", "Leila", "F · 24-30 · MENA · modest-fashion", ["en-US", "ar", "fr"]),
  av("ava-hassan", "Hassan", "M · 36-44 · MENA · entrepreneur", ["en-US", "ar"]),

  // Caucasian / North America / Europe
  av("ava-emily", "Emily", "F · 24-30 · Caucasian", ["en-US", "en-GB"]),
  av("ava-marcus", "Marcus", "M · 28-34 · African-American", ["en-US"]),
  av("ava-james", "James", "M · 32-40 · Caucasian · finance", ["en-US"]),
  av("ava-sarah", "Sarah", "F · 35-42 · Caucasian · mom-of-2", ["en-US"]),
  av("ava-jessica", "Jessica", "F · 22-28 · Caucasian · gen-z creator", ["en-US"]),
  av("ava-ethan", "Ethan", "M · 26-32 · Caucasian · tech bro", ["en-US"]),
  av("ava-olivia", "Olivia", "F · 30-38 · Caucasian · UK-based", ["en-GB"]),
  av("ava-ava", "Ava", "F · 28-34 · Caucasian · LA fitness", ["en-US"]),
  av("ava-noah", "Noah", "M · 24-30 · Caucasian · NY hipster", ["en-US"]),
  av("ava-isabella", "Isabella", "F · 30-36 · Latina · LA", ["en-US", "es"]),
  av("ava-mateo", "Mateo", "M · 25-32 · Latino · Miami", ["en-US", "es"]),
  av("ava-sofia", "Sofia", "F · 26-32 · European · Spain", ["en-GB", "es", "fr"]),

  // East Asian
  av("ava-yuki", "Yuki", "F · 26-32 · East Asian", ["ja", "en-US"]),
  av("ava-hiroshi", "Hiroshi", "M · 30-38 · Japanese", ["ja", "en-US"]),
  av("ava-mei", "Mei", "F · 24-30 · Chinese · urban Shanghai", ["zh-CN", "en-US"]),
  av("ava-kenji", "Kenji", "M · 28-36 · Japanese · creative", ["ja", "en-US"]),
  av("ava-ji-eun", "Ji-eun", "F · 22-28 · Korean · K-beauty enthusiast", ["ko", "en-US"]),
  av("ava-min-jun", "Min-jun", "M · 26-32 · Korean · streetwear", ["ko", "en-US"]),
  av("ava-xiao-lin", "Xiao Lin", "F · 30-38 · Chinese · mom in Beijing", ["zh-CN"]),

  // SEA
  av("ava-anya-th", "Anya", "F · 24-30 · Thai · Bangkok urban", ["th", "en-US"]),
  av("ava-darius", "Darius", "M · 28-34 · Filipino · Manila", ["en-PH", "fil"]),
  av("ava-rina-id", "Rina", "F · 22-28 · Indonesian · Jakarta gen-z", ["id", "en-US"]),
  av("ava-aaron-sg", "Aaron", "M · 30-38 · Singaporean Chinese", ["en-SG", "zh-CN"]),
  av("ava-mai-vn", "Mai", "F · 26-32 · Vietnamese · Saigon", ["vi", "en-US"]),

  // Africa
  av("ava-amara", "Amara", "F · 28-34 · West African · Lagos", ["en-NG"]),
  av("ava-kwame", "Kwame", "M · 26-32 · West African · Accra", ["en-GH"]),
  av("ava-thandi", "Thandi", "F · 30-38 · South African · Johannesburg", ["en-ZA"]),

  // Australia / Oceania
  av("ava-max-au", "Max", "M · 30-38 · Australian · Sydney creative", ["en-AU"]),
  av("ava-charlotte-au", "Charlotte", "F · 26-32 · Australian · Melbourne mom", ["en-AU"]),

  // Senior / older
  av("ava-margaret", "Margaret", "F · 50-60 · Caucasian · empty-nester", ["en-US"]),
  av("ava-david", "David", "M · 55-65 · Caucasian · semi-retired", ["en-US", "en-GB"]),
  av("ava-uncle-rajan", "Uncle Rajan", "M · 50-60 · South Asian · traditional", ["en-IN", "hi-IN"]),
];
