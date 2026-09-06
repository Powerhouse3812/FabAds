import type { Provenance } from "@/genie6/lib/genieRunTypes";

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
 */

export type ScriptFramework = "PAS" | "AIDA" | "BAB" | "FAB";

export interface ScriptAsset {
  id: string;
  title: string;
  brandId?: string;
  angleId?: string;
  framework: ScriptFramework;
  /** Full script body — the line the presenter/avatar reads. */
  body: string;
  durationSec: number;
  tags: string[];
  usageCount: number;
  /** ISO date. */
  lastUsedAt: string;
  provenance: Provenance;
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
): ScriptAsset => ({ id, title, brandId, angleId, framework, body, durationSec, tags, usageCount, lastUsedAt, provenance });

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
  ),
  s(
    "script-client-diwali-bundle",
    "Diwali gifting bundle — draft v2",
    "mamaearth",
    "ang-gifting",
    "PAS",
    "Still haven't picked a Diwali gift that doesn't feel like an afterthought? [DRAFT — needs the bundle SKU list before this ships.] Mamaearth's festive hamper pairs the Onion Shampoo with Vitamin C Facewash in gift packaging your mom will actually keep the box for.",
    26,
    ["PAS", "festive", "draft"],
    2,
    "2026-09-03",
    "client-created",
  ),
  s(
    "script-client-boat-monsoon",
    "Airdopes — monsoon durability angle",
    "boat",
    "ang-problem-solution",
    "PAS",
    "Monsoon commute, and your last earbuds died from one splash. IPX4-rated Airdopes 161 are built for exactly this — sweat, rain, the whole season. [Client note: swap in the new waterproof B-roll once it's back from the shoot.]",
    22,
    ["PAS", "monsoon", "draft"],
    1,
    "2026-09-05",
    "client-created",
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
  ),
];

export function getScriptsForBrand(brandId: string): ScriptAsset[] {
  return scripts.filter((s) => s.brandId === brandId);
}
