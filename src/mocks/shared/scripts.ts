import type { Provenance } from "@/genie6/lib/genieRunTypes";
import { avatars } from "./avatars";
import { voices } from "./voices";
import { FRAMEWORKS } from "@/genie6/editor/frameworks";

/**
 * Scripts — reusable ad-video scripts, a Creative-asset type new in
 * Genie 2.0 (§9 / §21.1 Catalogue merge). Written against a named
 * framework (PAS / AIDA / BAB / FAB — same vocabulary as Video Sage,
 * see `src/lib/video-sage-dummy-data.ts`) so a script can be handed
 * straight to the framework-based video editor (§14) once that ships.
 *
 * §21.2 "Script becomes a gated pre-step" — generate → review → edit →
 * approve → generate the ad. These are the reviewed/approved scripts
 * that live in the Catalogue afterward, available to reuse without
 * regenerating from scratch.
 *
 * Owner spec 2026-09-14 — the Asset Library's Script detail reads as
 * "content · Angle + concept · Avatar + voice · B/P/C+p or no type ·
 * Framework". Four additions below, none of them replacing an existing
 * field:
 *
 *  - `conceptId` — into `./concepts`. Every concept already carries its own
 *    `brandId`, so a script's concept is always drawn from the SAME brand
 *    as the script (never cross-brand). Left `undefined` on the two rows
 *    with no brand at all, and on the one brand (`mcaffeine`) that has no
 *    concept seeded yet — `undefined` here, not a mismatched borrow.
 *  - `avatarId` / `voiceId` — into `./avatars` / `./voices`. `voiceId` is
 *    NEVER hand-picked independently: it always comes from whichever voice
 *    the chosen avatar is paired with (`Avatar.voiceId`), via `voiceForAvatar`
 *    below, so the two can't drift like a persona and a tone chosen twice
 *    would. `Avatar.voiceId` is being seeded by a parallel change; until
 *    every avatar carries one, `voiceForAvatar` falls back to the same
 *    deterministic FNV-1a hash `./voices.ts` already uses for its own
 *    `durationSec`, so the pairing is stable either way and self-corrects
 *    the moment the real pairing lands.
 *  - `productId` / `categoryId` — the "B/P/C+p or no type" spread (§ below).
 *  - `frameworkId` — points at the REAL `Framework` entity in
 *    `@/genie6/editor/frameworks` (`fw-pas` / `fw-aida` / …) so the Script
 *    detail can link out to the Framework library item, distinct from the
 *    bare `framework` string union other code already reads (kept
 *    unchanged). Derived from `framework` inside the `s()` builder below —
 *    never hand-typed per row — so the two can never disagree.
 *
 * THE B/P/C+p SPREAD — every script ties to one of four entity states, and
 * all four are deliberately represented across the 12 seed rows so the UI
 * has to render each at least once:
 *   1. brand only          — `brandId` set, no product, no category.
 *   2. brand + product     — `brandId` + `productId`, no category.
 *   3. brand + category + product ("C+p") — all three set. `productId`'s
 *      own `brandId`/`categoryId` (in `./products`) always match the row's,
 *      never a product borrowed from a different brand.
 *   4. no entity at all    — `brandId`, `productId`, `categoryId` ALL
 *      undefined. This is the "or no type" case a blank-looking card could
 *      hide by accident, so it's forced to exist here (the two "draft, not
 *      yet tagged to a brand" rows) rather than left to be discovered later.
 */

export type ScriptFramework = "PAS" | "AIDA" | "BAB" | "FAB";

export interface ScriptAsset {
  id: string;
  title: string;
  brandId?: string;
  angleId?: string;
  /** Concept this script's hook/tone was written against, into `./concepts`. */
  conceptId?: string;
  /** On-camera presenter reading this script, into `./avatars`. */
  avatarId?: string;
  /** Always the voice `avatarId` is paired with — see `voiceForAvatar`. */
  voiceId?: string;
  /** Product this script is tied to, into `./products`. Part of the
   *  B/P/C+p spread — see the file header. */
  productId?: string;
  /** Category this script is tied to (only ever set alongside `productId`,
   *  the "C+p" state), into `./categories`. */
  categoryId?: string;
  framework: ScriptFramework;
  /** Real Framework entity this maps to, into `@/genie6/editor/frameworks`.
   *  Derived from `framework`, never hand-typed — see the file header.
   *  Optional only so the two hand-built `ScriptAsset` literals elsewhere
   *  (`src/catalogue/assetTypes.ts`, `generatedAssetsStore.ts`) that predate
   *  this field keep compiling; every row built via `s()` below always has
   *  one — `frameworkIdFor()` never returns `undefined`. */
  frameworkId?: string;
  /** Full script body — the line the presenter/avatar reads. */
  body: string;
  durationSec: number;
  tags: string[];
  usageCount: number;
  /** ISO date. */
  lastUsedAt: string;
  provenance: Provenance;
}

/** Tiny deterministic hash (FNV-1a) — same technique `./voices.ts` uses for
 *  `durationSec`. No `Math.random()` anywhere in this file. */
function hash(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * The voice `avatarId` is paired with. Reads `Avatar.voiceId` at runtime
 * first (a parallel change is seeding that field onto every avatar); when
 * an avatar doesn't carry one yet, falls back to a deterministic hash pick
 * so the result is stable and never a coin-flip either way.
 */
function voiceForAvatar(avatarId: string): string {
  const avatar = avatars.find((a) => a.id === avatarId);
  if (avatar?.voiceId) return avatar.voiceId;
  return voices[hash(avatarId) % voices.length].id;
}

/** `framework` string → the real Framework entity id. `FRAMEWORKS` carries
 *  `name` exactly equal to the `ScriptFramework` union ("PAS"/"AIDA"/"BAB"/
 *  "FAB"), so this derives rather than hand-types the mapping per row. */
function frameworkIdFor(framework: ScriptFramework): string {
  const found = FRAMEWORKS.find((f) => f.name === framework);
  if (!found) throw new Error(`No Framework entity named "${framework}" in @/genie6/editor/frameworks`);
  return found.id;
}

const s = (
  id: string,
  title: string,
  brandId: string | undefined,
  angleId: string | undefined,
  framework: ScriptFramework,
  body: string,
  durationSec: number,
  tags: string[],
  usageCount: number,
  lastUsedAt: string,
  provenance: Provenance = "fabfunnel-seeded",
  entity: {
    conceptId?: string;
    avatarId?: string;
    productId?: string;
    categoryId?: string;
  } = {},
): ScriptAsset => ({
  id,
  title,
  brandId,
  angleId,
  conceptId: entity.conceptId,
  avatarId: entity.avatarId,
  voiceId: entity.avatarId ? voiceForAvatar(entity.avatarId) : undefined,
  productId: entity.productId,
  categoryId: entity.categoryId,
  framework,
  frameworkId: frameworkIdFor(framework),
  body,
  durationSec,
  tags,
  usageCount,
  lastUsedAt,
  provenance,
});

export const scripts: ScriptAsset[] = [
  s(
    "script-mamaearth-onion-pas",
    "Onion Shampoo — hair fall PAS",
    "mamaearth",
    "ang-problem-solution",
    "PAS",
    "Hair fall every time you shower? You're not imagining it — most shampoos strip your scalp of the oils it needs. Mamaearth Onion Shampoo works differently: onion extract + plant keratin rebuild strength from the root. Clinically tested for visible reduction in 6 weeks. Try it risk-free — 30-day money back.",
    28,
    ["PAS", "UGC", "haircare"],
    31,
    "2026-08-22",
    "fabfunnel-seeded",
    // C+p — brand + category + product, all three consistent (mamaearth-onion-shampoo is mamaearth/hair-care).
    { conceptId: "concept-mamaearth-onion-ingredient", avatarId: "ava-priya", productId: "mamaearth-onion-shampoo", categoryId: "hair-care" },
  ),
  s(
    "script-mamaearth-onion-testimonial",
    "Onion Shampoo — mom testimonial BAB",
    "mamaearth",
    "ang-emotional-story",
    "BAB",
    "Three months ago I was finding clumps of hair on my pillow every morning. I tried four shampoos, nothing changed. Then I switched to Mamaearth Onion — no parabens, no sulphates, just onion and real results. Look at my hairline now. This is the bridge I needed.",
    42,
    ["BAB", "UGC", "testimonial"],
    19,
    "2026-08-30",
    "fabfunnel-seeded",
    // brand only — no product/category.
    { conceptId: "concept-mamaearth-mom-emotional", avatarId: "ava-meera" },
  ),
  s(
    "script-noise-colorfit-aida",
    "ColorFit Pro 5 — battery AIDA",
    "noise",
    "ang-comparison",
    "AIDA",
    "Every smartwatch promises battery life. I tested three for a month. Two died by day three. The Noise ColorFit Pro 5? Still going on day seven — AMOLED display, 100+ sport modes, Bluetooth calling included. At ₹3,499 there's nothing else in this range that keeps up. Link's below.",
    35,
    ["AIDA", "comparison", "tech"],
    22,
    "2026-08-18",
    "fabfunnel-seeded",
    // brand + product — no category (product's own categoryId "smartwatches" stays internal to ./products).
    { conceptId: "concept-noise-perf-comparison", avatarId: "ava-rohan", productId: "noise-colorfit-pro-5" },
  ),
  s(
    "script-boat-airdopes-fab",
    "Airdopes 161 — spec-led FAB",
    "boat",
    "ang-roi-led",
    "FAB",
    "40-hour battery. ENx noise cancellation. IPX4 water resistance. That's the Airdopes 161 — built so you charge once a week, not once a day, and it survives a monsoon commute. ₹999. That's the whole pitch.",
    18,
    ["FAB", "spec-led", "audio"],
    27,
    "2026-09-01",
    "fabfunnel-seeded",
    // C+p — brand + category + product, all three consistent (boat-airdopes-141 is boat/wireless-earbuds).
    { conceptId: "concept-boat-asap-charge", avatarId: "ava-arjun", productId: "boat-airdopes-141", categoryId: "wireless-earbuds" },
  ),
  s(
    "script-plum-serum-pas",
    "Vit C Serum — glow PAS",
    "plum",
    "ang-before-after",
    "PAS",
    "Dull skin that no amount of concealer fixes? It's usually dehydration plus dead skin buildup, not a 'bad skin day'. Plum's 15% Vit C serum targets both — brighter, more even tone in 2 weeks, dermat-tested on Indian skin. Vegan, cruelty-free, no animal testing ever.",
    31,
    ["PAS", "skincare", "before-after"],
    16,
    "2026-08-11",
    "fabfunnel-seeded",
    // brand + product — no category (product's own categoryId "skin-care" stays internal to ./products).
    { conceptId: "concept-plum-vegan", avatarId: "ava-divya", productId: "plum-gh-serum" },
  ),
  s(
    "script-sleepyhead-mattress-bab",
    "Original Mattress — sleep quality BAB",
    "sleepyhead",
    "ang-problem-solution",
    "BAB",
    "I used to wake up with a stiff back every single morning, no matter how many pillows I stacked. A friend recommended Sleepyhead's memory foam mattress with a 100-night trial — nothing to lose. Six weeks in, no more back pain, and I actually look forward to bedtime now.",
    38,
    ["BAB", "UGC", "sleep"],
    9,
    "2026-07-29",
    "fabfunnel-seeded",
    // brand only — no product/category.
    { conceptId: "concept-sleepyhead-100-night", avatarId: "ava-dev" },
  ),
  s(
    "script-mcaffeine-scrub-aida",
    "Coffee Body Scrub — energetic AIDA",
    "mcaffeine",
    "ang-asp-lifestyle",
    "AIDA",
    "Ever notice how a good coffee scrub feels like a reset button for your skin? mCaffeine's Coffee Body Scrub exfoliates AND caffeinates — visibly smoother skin from the first use. Cruelty-free, FDA-approved actives. Your 2-minute shower upgrade starts here.",
    24,
    ["AIDA", "lifestyle", "skincare"],
    11,
    "2026-08-05",
    "fabfunnel-seeded",
    // brand + product — no concept (mcaffeine has none seeded yet in ./concepts, left undefined rather than borrowed).
    { avatarId: "ava-naina", productId: "mcaffeine-coffee-bodyscrub" },
  ),
  s(
    "script-wakefit-pillow-fab",
    "Ortho Pillow — spec-led FAB",
    "wakefit",
    "ang-roi-led",
    "FAB",
    "Ortho-curve design. Cooling gel layer. CertiPUR-US certified foam. That's Wakefit's pillow — engineered for neck support, not just softness. ₹1,299, with a 100-night trial if it's not the one.",
    16,
    ["FAB", "sleep", "spec-led"],
    7,
    "2026-06-30",
    "fabfunnel-seeded",
    // brand only — no product/category (no pillow SKU seeded in ./products for wakefit; only mattress/bed exist, and neither is this pillow).
    { conceptId: "concept-wakefit-warranty", avatarId: "ava-karthik" },
  ),
  s(
    "script-client-diwali-bundle",
    "Diwali gifting bundle — draft v2",
    // No entity at all — the "or no type" state. This draft mentions Mamaearth in
    // the body, but hasn't been tagged to a brand/product/category yet (it's
    // pending the bundle SKU list per the note below); that's the point of this
    // row, not an oversight to "fix" by inferring brandId from the copy.
    undefined,
    "ang-gifting",
    "PAS",
    "Still haven't picked a Diwali gift that doesn't feel like an afterthought? [DRAFT — needs the bundle SKU list before this ships.] Mamaearth's festive hamper pairs the Onion Shampoo with Vitamin C Facewash in gift packaging your mom will actually keep the box for.",
    26,
    ["PAS", "festive", "draft"],
    2,
    "2026-09-03",
    "client-created",
    // No conceptId either — a concept is always brand-scoped, and this row has no brand.
    { avatarId: "ava-rohini" },
  ),
  s(
    "script-client-boat-monsoon",
    "Airdopes — monsoon durability angle",
    // No entity at all — the "or no type" state (second of the two forced rows).
    // Same as the Diwali draft above: names a brand in the copy but isn't
    // tagged yet, still awaiting the waterproof B-roll swap per the note below.
    undefined,
    "ang-problem-solution",
    "PAS",
    "Monsoon commute, and your last earbuds died from one splash. IPX4-rated Airdopes 161 are built for exactly this — sweat, rain, the whole season. [Client note: swap in the new waterproof B-roll once it's back from the shoot.]",
    22,
    ["PAS", "monsoon", "draft"],
    1,
    "2026-09-05",
    "client-created",
    { avatarId: "ava-ishaan" },
  ),
  s(
    "script-noise-comparison-long",
    "ColorFit Pro 5 — 60s deep comparison",
    "noise",
    "ang-comparison",
    "AIDA",
    "I lined up three smartwatches under ₹5,000 and wore each for ten days straight. The display washed out in sunlight on two of them. Battery dropped to a day and a half on the pricier one. The Noise ColorFit Pro 5 held AMOLED brightness outdoors and stretched to six full days — plus Bluetooth calling neither competitor offered. Full breakdown, timestamps in the caption. Link's below if you want to skip to checkout.",
    58,
    ["AIDA", "comparison", "long-form"],
    13,
    "2026-08-27",
    "fabfunnel-seeded",
    // brand only — no product/category.
    { conceptId: "concept-noise-amoled-hero", avatarId: "ava-vikram" },
  ),
  s(
    "script-plum-niacinamide-pas",
    "Niacinamide serum — pigmentation PAS",
    "plum",
    "ang-clinical",
    "PAS",
    "Dark spots that foundation just sits on top of, never actually fading? That's post-acne pigmentation, and most serums are too weak to touch it. Plum's 10% Niacinamide serum is dermat-tested to visibly fade marks in 4 weeks — lightweight enough for daily use, even under makeup.",
    27,
    ["PAS", "skincare", "clinical"],
    14,
    "2026-08-14",
    "fabfunnel-seeded",
    // C+p — brand + category + product, all three consistent (plum-niacinamide is plum/acne).
    { conceptId: "concept-plum-niacinamide", avatarId: "ava-ananya", productId: "plum-niacinamide", categoryId: "acne" },
  ),
];

export function getScriptsForBrand(brandId: string): ScriptAsset[] {
  return scripts.filter((s) => s.brandId === brandId);
}
