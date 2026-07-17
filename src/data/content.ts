/**
 * Creative Report 2.0 — content pools for the deterministic generator.
 * Realistic agency material (jewellery / beauty / supplements / home décor)
 * so the dummy data reads like a real multi-client Meta+TikTok+NewsBreak book,
 * not lorem. Ad-level names follow a clean convention; campaign/ad-set names
 * are intentionally messy human strings (product-plan §8.2).
 */
import type { Archetype, CreativeFormat } from "@/data/model";

export interface ConceptSeed {
  name: string;
  thesis: string;
  /** Account this concept mostly runs under. */
  accountId: string;
  product: string;
  angles: string[];
}

/** 8 concepts across 4 client accounts. */
export const CONCEPT_SEEDS: ConceptSeed[] = [
  {
    name: "Everyday Luxe",
    thesis: "Affordable pieces that pass for fine jewellery.",
    accountId: "acc-amalfa-meta",
    product: "Thalia Necklace",
    angles: ["Looks-expensive", "Dress-up-dress-down", "Under-$50 flex"],
  },
  {
    name: "Proof It Lasts",
    thesis: "Water-resistant, tarnish-free — wear it every day.",
    accountId: "acc-amalfa-meta",
    product: "Crystal Collar",
    angles: ["Shower test", "1-year wear", "No green wrist"],
  },
  {
    name: "Gift Without Guessing",
    thesis: "The safe gift she'll actually keep wearing.",
    accountId: "acc-amalfa-meta",
    product: "Calista Studs",
    angles: ["Him buying for her", "Gift-ready box", "Last-minute save"],
  },
  {
    name: "Skin First",
    thesis: "Visible results beat ingredient bragging.",
    accountId: "acc-glowkart",
    product: "Nova Serum",
    angles: ["Before / after", "Dermatologist POV", "Texture demo"],
  },
  {
    name: "The 30-Day Glow",
    thesis: "A simple routine anyone can stick to.",
    accountId: "acc-glowkart",
    product: "Glow Mask",
    angles: ["Routine walkthrough", "Diary day-1 to day-30"],
  },
  {
    name: "Fuel The Grind",
    thesis: "Clean energy for people who train early.",
    accountId: "acc-peaksupps",
    product: "Peak Whey",
    angles: ["5am gym", "Taste test", "Macros that fit"],
  },
  {
    name: "Calm Corners",
    thesis: "Small swaps that make a room feel cosy.",
    accountId: "acc-nordic",
    product: "Nordic Throw",
    angles: ["Room makeover", "Texture close-up"],
  },
  {
    name: "Light The Mood",
    thesis: "Warm ambient light for the 7pm wind-down.",
    accountId: "acc-nordic",
    product: "Aurora Lamp",
    angles: ["Sunset scene", "Gift for the home"],
  },
];

export const HOOKS = [
  "POV: you found the one",
  "This sold out 3 times",
  "Unboxing the hype",
  "Dermatologist reacts",
  "$20 vs $200",
  "Before you scroll…",
  "The 3am impulse buy",
  "Her reaction says it all",
  "I was skeptical too",
  "Watch it survive a shower",
  "Day 1 vs Day 30",
  "Don't buy until you see this",
];

export const HEADLINES = [
  "Water resistant. Tarnish free.",
  "First order 20% off",
  "Free shipping today only",
  "As seen on TikTok",
  "The gift she keeps wearing",
  "Results in 30 days or less",
  "Trusted by 40,000 buyers",
  "Restocked — won't last",
];

export const PRIMARY_TEXTS = [
  "Water resistant",
  "Tarnish free",
  "First purchase offer",
  "Gift-ready packaging",
  "Limited drop",
  "Bundle & save",
  "30-day results",
  "Clean ingredients",
];

export const CTAS = ["Shop Now", "Get Offer", "Learn More", "Shop the Drop", "Order Today"];

export const VISUAL_STYLES = [
  "UGC selfie",
  "Studio flatlay",
  "Model close-up",
  "Split-screen demo",
  "Text-on-plain",
  "Lifestyle outdoor",
];

/** Messy, human-authored campaign name templates — NOT parseable (§8.2). */
export const MESSY_CAMPAIGN_TEMPLATES = [
  "Sales campaign Neha ma'am's strategy {product}, {collection} Jai Guruji Shukrana GuruJi",
  "{product}_neha ma'am's strategy_ Jai Mata Di – Copy",
  "Prospecting {geo} | {product} BAU",
  "TOF {product} test v2 FINAL (use this one)",
  "{collection} retargeting – Copy – Copy",
  "New Launch {product} 🙏 pls dont pause",
  "ABO {product} {geo} scaling ma'am approved",
  "Q3 {product} push — Rahul bhai",
];

/** Messy ad-set name templates. */
export const MESSY_ADSET_TEMPLATES = [
  "{age} {gender} broad – Copy 2",
  "LLA 3% purchasers ({geo})",
  "Interest stack — jewellery lovers ma'am",
  "Retarget 30d ATC no purchase",
  "Broad {geo} advantage+ FINAL",
  "{age} test dont touch",
];

export const COLLECTIONS = [
  "Crystal Collar",
  "Festive Drop",
  "Summer Edit",
  "Jai Guruji",
  "Diwali Set",
];

/** Format weights — video-heavy but with real static + carousel presence. */
export const FORMAT_WEIGHTS: { value: CreativeFormat; weight: number }[] = [
  { value: "video", weight: 5 },
  { value: "static", weight: 3 },
  { value: "carousel", weight: 2 },
];

/**
 * Archetype quota over the ~60 creatives (handoff §4). The remainder are
 * "steady" mid-pack. Sum here = 20; the rest (~40) become steady.
 */
export const ARCHETYPE_QUOTA: { archetype: Archetype; count: number }[] = [
  { archetype: "winner", count: 3 },
  { archetype: "fake-winner", count: 2 },
  { archetype: "fatiguing", count: 3 },
  { archetype: "scaling", count: 2 },
  { archetype: "new", count: 4 },
  { archetype: "loser", count: 6 },
];

export const PLACEMENTS = ["feed", "stories", "reels", "audience-network", "search"];
export const GEOS = ["US", "UK", "CA", "AU", "DE", "IN"];
export const DEVICES = ["mobile", "desktop", "tablet"];
export const OBJECTIVES = ["conversions", "traffic", "awareness"];
export const AGES = ["18-24", "25-34", "35-44", "45-54", "55+"];
export const GENDERS = ["all", "female", "male"];
