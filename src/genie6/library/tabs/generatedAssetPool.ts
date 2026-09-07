import { sampleOutputs } from "../../mocks/sample-outputs";

/**
 * generatedAssetPool — the non-ad half of "everything Genie generated".
 *
 * `sampleOutputs` (sample-outputs.ts) models generated ADS, joined to a real
 * `RunBatch` via `useOutputBatchIndex`. Genie also generates Scripts and
 * Concepts — see this feature's build brief — but neither the run store
 * (`genieRunTypes.ts` — `RunItem.outputId` only ever points at an ad) nor
 * the Catalogue's `scripts`/`concepts` mock arrays (`src/mocks/shared/`)
 * carry a per-batch "this came from generation run X" linkage: Catalogue's
 * own `scripts`/`concepts` are already-saved, reviewed assets, not a queue
 * of fresh generations waiting on a save decision. `ConceptsLibrary.tsx`
 * hit the exact same gap and documents it as a known, honest limitation
 * ("RunBatch carries no concept-id linkage field") rather than fabricating
 * one — this file follows the same rule.
 *
 * So this is a small, self-contained pool of Scripts + Concepts Genie has
 * generated but the user has not yet saved to Catalogue — the thing the
 * Library's new tabs actually need to show. It never touches the real run
 * store (owned by another agent) and never forks/mutates `sampleOutputs`
 * (15+ modules depend on that array's reference identity) — it only reads
 * `sampleOutputs` thumbnails, the same read-only pattern
 * `concepts/conceptItems.ts` already uses for the same reason.
 *
 * Each item carries its own plausible batch id + source module + relative
 * time — the same provenance vocabulary `BatchGroupHeader` /
 * `HowThisWasMade` use elsewhere (Batch ID, source module, Created By,
 * provenance) — so "Save to Catalogue" always has a real "where did this
 * come from" answer next to it, never a bare card.
 *
 * One batch per type is deliberately left PARTIAL (mixed done/failed items)
 * — the same `BatchStatus` vocabulary as `genieRunTypes.ts` — so the
 * Library's Scripts/Concepts tabs cover populated / partial / zero-data
 * (design system §3) without inventing a parallel demo-flag mechanism.
 */

export type GeneratedAssetStatus = "done" | "failed";

interface GeneratedAssetBase {
  id: string;
  batchId: string;
  batchLabel: string;
  /** Source module label — same vocabulary as `originLabels.ts`. */
  module: string;
  createdBy: string;
  generatedAt: Date;
  status: GeneratedAssetStatus;
  brandId: string;
  brandName: string;
  productName?: string;
}

export interface GeneratedScriptItem extends GeneratedAssetBase {
  title: string;
  framework: "PAS" | "AIDA" | "BAB" | "FAB";
  body: string;
  durationSec: number;
  tags: string[];
}

export interface GeneratedConceptItem extends GeneratedAssetBase {
  name: string;
  angle: string;
  hook: string;
  tone: string;
  formatLabel: string;
  thumbnail?: string;
  generationCount: number;
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const now = () => Date.now();

/** Deterministic real thumbnail from the seeded ad pool — never a broken
 *  placeholder, never a fresh fetch. Same derivation as `conceptItems.ts`. */
const THUMB_POOL: string[] = sampleOutputs
  .map((o) => o.thumbnail)
  .filter((t): t is string => typeof t === "string");

function pickThumb(seed: string): string | undefined {
  if (THUMB_POOL.length === 0) return undefined;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffff;
  return THUMB_POOL[h % THUMB_POOL.length];
}

/* ── Scripts ─────────────────────────────────────────────────────────── */

const scr = (
  id: string,
  batchId: string,
  batchLabel: string,
  module: string,
  hoursAgo: number,
  status: GeneratedAssetStatus,
  brandId: string,
  brandName: string,
  productName: string | undefined,
  title: string,
  framework: GeneratedScriptItem["framework"],
  body: string,
  durationSec: number,
  tags: string[],
): GeneratedScriptItem => ({
  id,
  batchId,
  batchLabel,
  module,
  createdBy: "Rahul Saini",
  generatedAt: new Date(now() - hoursAgo * HOUR),
  status,
  brandId,
  brandName,
  productName,
  title,
  framework,
  body,
  durationSec,
  tags,
});

export const GENERATED_SCRIPTS: GeneratedScriptItem[] = [
  // BATCH-7QP3M1 — Mamaearth, Studio, all done.
  scr(
    "gscr-mamaearth-onion-1",
    "BATCH-7QP3M1",
    "Mamaearth Onion Shampoo · Script pass",
    "Studio",
    5,
    "done",
    "mamaearth",
    "Mamaearth",
    "Onion Hair Shampoo for Hair Fall Control",
    "Onion Shampoo — hair fall cold open",
    "PAS",
    "Hair fall every time you shower isn't in your head — most shampoos strip the scalp of the oils it needs to hold on. Mamaearth Onion Shampoo works differently: onion extract plus plant keratin rebuild strength from the root, clinically tested for visible reduction in 6 weeks. Try it risk-free — 30-day money back.",
    27,
    ["PAS", "haircare", "UGC"],
  ),
  scr(
    "gscr-mamaearth-onion-2",
    "BATCH-7QP3M1",
    "Mamaearth Onion Shampoo · Script pass",
    "Studio",
    5,
    "done",
    "mamaearth",
    "Mamaearth",
    "Onion Hair Shampoo for Hair Fall Control",
    "Onion Shampoo — mom testimonial bridge",
    "BAB",
    "Three months ago I was finding clumps of hair on my pillow every single morning. I'd already tried four shampoos — nothing changed. Then I switched to Mamaearth Onion: no parabens, no sulphates, just onion and real results. Look at my hairline now. This is the bridge I needed.",
    41,
    ["BAB", "testimonial", "haircare"],
  ),
  scr(
    "gscr-mamaearth-vc-1",
    "BATCH-7QP3M1",
    "Mamaearth Onion Shampoo · Script pass",
    "Studio",
    5,
    "done",
    "mamaearth",
    "Mamaearth",
    "Vitamin C Daily Glow Face Wash",
    "Vitamin C Face Wash — 4Ps push",
    "PAS",
    "A visible glow in 14 days, or your ₹399 back. Picture waking up to skin that actually looks awake — not just less oily. Mamaearth's Vitamin C complex is dermatologist-tested on 200+ Indian skin tones, and the reviews already say the same thing. Try it before the festive stock runs out.",
    22,
    ["PAS", "skincare"],
  ),

  // BATCH-4H8K2R — Noise + boAt, Video Sage flow, PARTIAL (1 failed).
  scr(
    "gscr-noise-colorfit-1",
    "BATCH-4H8K2R",
    "ColorFit Pro 5 · Battery claim rewrite",
    "Video Sage",
    29,
    "done",
    "noise",
    "Noise",
    "ColorFit Pro 5 Buzz with Bluetooth Calling",
    "ColorFit Pro 5 — battery AIDA",
    "AIDA",
    "Every smartwatch promises battery life. I tested three for a month — two died by day three. The Noise ColorFit Pro 5 was still going on day seven, AMOLED display and Bluetooth calling included. At ₹3,499 nothing else in this range keeps up. Link's below.",
    34,
    ["AIDA", "comparison", "wearables"],
  ),
  scr(
    "gscr-boat-airdopes-1",
    "BATCH-4H8K2R",
    "ColorFit Pro 5 · Battery claim rewrite",
    "Video Sage",
    29,
    "failed",
    "boat",
    "boAt",
    "Airdopes 141 with 42hr Battery",
    "Airdopes 141 — monsoon durability FAB",
    "FAB",
    "42-hour battery, ENx noise cancellation, splash resistance — built so you charge once a week, not once a day, and it survives a monsoon commute. ₹1,299. That's the whole pitch.",
    18,
    ["FAB", "spec-led", "audio"],
  ),

  // BATCH-2W9L5F — Plum + WOW, Creative Library, all done.
  scr(
    "gscr-plum-serum-1",
    "BATCH-2W9L5F",
    "Plum Green Tea Serum · Launch script",
    "Creative Library",
    52,
    "done",
    "plum",
    "Plum Goodness",
    "Green Tea Skin Clarifying Serum",
    "Green Tea Serum — clarity BAB",
    "BAB",
    "Before this, breakouts showed up every time the weather changed — no pattern, no warning. After three weeks of Plum's Green Tea serum, my skin barely reacts anymore. The bridge is one ingredient: green tea polyphenols, 100% vegan, cruelty-free, doing the calming work retinol usually gets credit for.",
    38,
    ["BAB", "skincare", "vegan"],
  ),
  scr(
    "gscr-wow-acv-1",
    "BATCH-2W9L5F",
    "Plum Green Tea Serum · Launch script",
    "Creative Library",
    52,
    "done",
    "wow-skin-science",
    "WOW Skin Science",
    "Apple Cider Vinegar Shampoo",
    "ACV Shampoo — scalp reset AIDA",
    "AIDA",
    "Your scalp isn't oily because of your hair — it's the buildup nothing's actually washing out. WOW's Apple Cider Vinegar Shampoo strips residue without sulphates, and 40,000+ reviews say the same thing: day-2 hair finally looks like day-1. First bottle ships free this week.",
    31,
    ["AIDA", "haircare"],
  ),

  // BATCH-9T1X6D — SUGAR, Industry Insights, all done.
  scr(
    "gscr-sugar-lipstick-1",
    "BATCH-9T1X6D",
    "SUGAR Matte Lipstick · Competitor-inspired",
    "Industry Insights",
    77,
    "done",
    "sugar",
    "SUGAR Cosmetics",
    "Matte As Hell Crayon Lipstick",
    "Matte Lipstick — 12-hour QUEST",
    "AIDA",
    "Still buying the same lipstick that fades by lunch? SUGAR's Matte As Hell crayon holds 12 hours flat, no touch-up, no transfer — even through chai and a mask. ₹649, one swipe, done.",
    24,
    ["AIDA", "makeup", "12hr"],
  ),
];

/* ── Concepts ────────────────────────────────────────────────────────── */

const con = (
  id: string,
  batchId: string,
  batchLabel: string,
  module: string,
  hoursAgo: number,
  status: GeneratedAssetStatus,
  brandId: string,
  brandName: string,
  productName: string | undefined,
  name: string,
  angle: string,
  hook: string,
  tone: string,
  formatLabel: string,
  generationCount: number,
): GeneratedConceptItem => ({
  id,
  batchId,
  batchLabel,
  module,
  createdBy: "Rahul Saini",
  generatedAt: new Date(now() - hoursAgo * HOUR),
  status,
  brandId,
  brandName,
  productName,
  name,
  angle,
  hook,
  tone,
  formatLabel,
  thumbnail: pickThumb(id),
  generationCount,
});

export const GENERATED_CONCEPTS: GeneratedConceptItem[] = [
  // BATCH-3K7Q9M — Mamaearth, Studio, all done.
  con(
    "gcon-mamaearth-1",
    "BATCH-3K7Q9M",
    "Mamaearth Onion Shampoo · Concept sweep",
    "Studio",
    6,
    "done",
    "mamaearth",
    "Mamaearth",
    "Onion Hair Shampoo for Hair Fall Control",
    "Hair fall, not imagined",
    "Problem-solution",
    "Hair fall is real. This is not — clinically tested, 6-week visible change.",
    "Direct, reassuring",
    "9:16 video",
    14,
  ),
  con(
    "gcon-mamaearth-2",
    "BATCH-3K7Q9M",
    "Mamaearth Onion Shampoo · Concept sweep",
    "Studio",
    6,
    "done",
    "mamaearth",
    "Mamaearth",
    "Vitamin C Daily Glow Face Wash",
    "Glow, not gloss",
    "Aspirational lifestyle",
    "A daily 2-minute routine — vitamin C, plant-based, made for Indian skin.",
    "Warm, everyday",
    "1:1 static",
    9,
  ),

  // BATCH-8N2V4C — Noise + boAt, Video Sage, PARTIAL (1 failed).
  con(
    "gcon-noise-1",
    "BATCH-8N2V4C",
    "ColorFit Pro 5 · Concept variations",
    "Video Sage",
    23,
    "done",
    "noise",
    "Noise",
    "ColorFit Pro 5 Buzz with Bluetooth Calling",
    "7 days, not 2",
    "Comparison",
    "Two smartwatches died by day three. This one was still going on day seven.",
    "Confident, tested",
    "9:16 video",
    7,
  ),
  con(
    "gcon-boat-1",
    "BATCH-8N2V4C",
    "ColorFit Pro 5 · Concept variations",
    "Video Sage",
    23,
    "failed",
    "boat",
    "boAt",
    "Airdopes 141 with 42hr Battery",
    "Monsoon-proof, on paper",
    "Spec-led durability",
    "Splash resistant, 42-hour battery — built for a commute, not a demo booth.",
    "Blunt, spec-first",
    "1:1 static",
    3,
  ),

  // BATCH-5R6B1H — Plum + WOW, Creative Library, all done.
  con(
    "gcon-plum-1",
    "BATCH-5R6B1H",
    "Plum Green Tea Serum · Concept sweep",
    "Creative Library",
    58,
    "done",
    "plum",
    "Plum Goodness",
    "Green Tea Skin Clarifying Serum",
    "Calm, not cover-up",
    "Emotional story",
    "Breakouts showed up with every weather change — until this became the routine.",
    "Vegan, vibrant",
    "9:16 video",
    11,
  ),
  con(
    "gcon-wow-1",
    "BATCH-5R6B1H",
    "Plum Green Tea Serum · Concept sweep",
    "Creative Library",
    58,
    "done",
    "wow-skin-science",
    "WOW Skin Science",
    "Apple Cider Vinegar Shampoo",
    "Day-2 hair, day-1 look",
    "Social proof",
    "40,000+ reviews say the same thing — buildup gone, without the sulphates.",
    "Direct, science-leaning",
    "1:1 static",
    6,
  ),

  // BATCH-1L4Y8Z — SUGAR, Industry Insights, all done.
  con(
    "gcon-sugar-1",
    "BATCH-1L4Y8Z",
    "SUGAR Matte Lipstick · Competitor-inspired",
    "Industry Insights",
    81,
    "done",
    "sugar",
    "SUGAR Cosmetics",
    "Matte As Hell Crayon Lipstick",
    "12 hours, zero touch-ups",
    "Urgency + proof",
    "Holds through chai, through a mask, through the whole day. One swipe.",
    "Sharp, witty",
    "9:16 video",
    19,
  ),
];

/** Batch ids that contain at least one failed item — the "Partial batch"
 *  signal each card's provenance row surfaces (same vocabulary as
 *  `genieRunTypes.ts`'s `BatchStatus`, computed the same way:
 *  "some failed" = partial, never a separate demo flag). */
export function partialBatchIds(
  items: { batchId: string; status: GeneratedAssetStatus }[],
): Set<string> {
  const ids = new Set<string>();
  for (const item of items) if (item.status === "failed") ids.add(item.batchId);
  return ids;
}

/** Which brands appear in either pool — for the tab's brand filter. */
export function poolBrandOptions(): { id: string; name: string }[] {
  const seen = new Map<string, string>();
  for (const s of GENERATED_SCRIPTS) seen.set(s.brandId, s.brandName);
  for (const c of GENERATED_CONCEPTS) seen.set(c.brandId, c.brandName);
  return Array.from(seen, ([id, name]) => ({ id, name })).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}
