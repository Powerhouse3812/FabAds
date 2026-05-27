import type { OutputData, ModeId, MediaType } from "../types/output";

/**
 * Sample generation outputs — expanded to 50+ in iter-6 A-9.3.
 *
 * Spans all 6 modes (brand-ad, product-ad, affiliate-ad, ugc-video, forge,
 * image-to-ad), all 3 media types (image/video/text-only), with realistic
 * non-round numbers per design system §6 (qualityScore: 87 not 80; CTR /
 * impressions vary). Includes lineage chains via parentWinnerId.
 *
 * Used by: StudioHome, StudioLibrary, StudioResultsScreen, CanvasHome,
 * CanvasLibrary, ModularLibrary, GeneratedOutputsTab, LineageChip,
 * OutputCardShowcase + 7 other consumers (15+ total).
 */

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const NOW = new Date("2026-04-28T14:32:00").getTime();

const o = (
  id: string,
  hoursAgo: number,
  mediaType: MediaType,
  mode: ModeId,
  brand: string,
  product: string | undefined,
  headline: string,
  body: string,
  cta: string,
  qualityScore: number | undefined,
  thumbnail: string | undefined,
  parentWinnerId?: string
): OutputData => ({
  id,
  mediaType,
  mode,
  generatedAt: new Date(NOW - hoursAgo * HOUR),
  ...(thumbnail ? { thumbnail } : {}),
  headline,
  body,
  cta,
  brand: { name: brand },
  ...(product ? { product: { name: product } } : {}),
  ...(qualityScore !== undefined ? { qualityScore } : {}),
  ...(parentWinnerId ? { parentWinnerId } : {}),
});

// Curated Unsplash photo IDs — DTC product / lifestyle aesthetic.
const IMG = {
  haircare:    "https://images.unsplash.com/photo-1631730486572-226d1f595b68?auto=format&fit=crop&w=600&q=70",
  watch:       "https://images.unsplash.com/photo-1617043786394-f977fa12eddf?auto=format&fit=crop&w=600&q=70",
  earbuds:     "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=600&q=70",
  bedroom:     "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=70",
  vitamin:     "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=70",
  bundle:      "https://images.unsplash.com/photo-1586367474466-3b09c1d6d3b1?auto=format&fit=crop&w=600&q=70",
  facewash:    "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=600&q=70",
  serum:       "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=70",
  skincare:    "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=600&q=70",
  lipstick:    "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=70",
  fashion:     "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=70",
  streetwear:  "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=70",
  sneakers:    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=70",
  glasses:     "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=600&q=70",
  jewellery:   "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=70",
  furniture:   "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=70",
  travel:      "https://images.unsplash.com/photo-1565620731358-7b6c1b95dadd?auto=format&fit=crop&w=600&q=70",
  beard:       "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=70",
  protein:     "https://images.unsplash.com/photo-1610450949065-1f2841536c88?auto=format&fit=crop&w=600&q=70",
  pet:         "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=70",
  food:        "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=600&q=70",
  mattress:    "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?auto=format&fit=crop&w=600&q=70",
};

export const sampleOutputs: OutputData[] = [
  // Mamaearth (5)
  o("var_4a2k7q9",      2,  "image", "product-ad",   "Mamaearth", "Onion shampoo",      "Hair fall is real. This is not.",                "Mamaearth Onion Shampoo — clinically tested for visible reduction in 6 weeks.", "Shop ₹699",   87, IMG.haircare),
  o("var_mama_2",       4,  "image", "product-ad",   "Mamaearth", "VC face wash",       "Vitamin C face wash, ₹50 off your first.",       "20% Vit C complex · made for sensitive skin · plant-based.",                  "Buy ₹399",   83, IMG.facewash),
  o("var_mama_3",       6,  "video", "ugc-video",    "Mamaearth", "Onion shampoo",      "Real mom, real results, 6 weeks in.",            "Mom of 2 · 6-week test · 47% less hair fall · UGC handheld.",                 "₹699",       91, IMG.haircare),
  o("var_mama_4",       8,  "image", "brand-ad",     "Mamaearth", undefined,             "Made Safe certified. Plant-based. Mom-tested.",  "Mamaearth — Indian DTC's #1 toxin-free brand.",                               "Explore",    79, IMG.skincare),
  o("var_mama_5",      18,  "video", "image-to-ad",  "Mamaearth", "VC face wash",       "Your favourite static, now in motion.",          "Mamaearth Vitamin C Face Wash — 6s subtle parallax + product reveal.",        "Buy ₹399",   82, IMG.facewash, "var_4a2k7q9"),

  // Noise (5)
  o("var_n9k3v1m",      5,  "video", "ugc-video",    "Noise",     "ColorFit Pro 5",     "Tested 3 smartwatches. This one stayed.",        "Real reviewer · 31 days · Noise ColorFit Pro 5 — battery beat the rest.",     "₹3,499",     73, IMG.watch),
  o("var_noise_2",     10,  "image", "product-ad",   "Noise",     "ColorFit Pro 5",     "AMOLED. BT calling. ₹3,499.",                    "100+ sport modes · 10-day battery · made in India.",                          "Shop now",   86, IMG.watch),
  o("var_noise_3",     14,  "image", "product-ad",   "Noise",     "Buds VS104",         "60-hour playtime. ₹999.",                        "ENC tech · IPX5 · instacharge · best-seller.",                                "Buy ₹999",   81, IMG.earbuds),
  o("var_noise_4",     22,  "video", "brand-ad",     "Noise",     undefined,             "Wear Your Beat.",                                "Noise — wearable tech for the next India.",                                   "Explore",    77, IMG.watch),
  o("var_noise_5",     30,  "image", "forge",        "Noise",     "ColorFit Pro 5",     "POV: you found the watch that survives squat day.","Variant: aspirational angle · gym B-roll · sub-2K segment.",                  "₹3,499",     68, IMG.watch, "var_n9k3v1m"),

  // boAt (5)
  o("var_b7t4h2x",      8,  "text-only", "image-to-ad", "Boat",   "Airdopes 161",       "Stop scrolling if you've ever had AirPods die at 6pm.", "Boat Airdopes 161 — 40 hours total playback. ₹999, free returns.",     "Order now",  undefined, undefined),
  o("var_boat_2",      11,  "image", "product-ad",   "Boat",      "Airdopes 141",       "Plug-in. Plush bass. Pure boAt.",                "ENx tech · 42hr · BT 5.0 · ₹1,299. Buy 2 ₹2,099.",                            "Buy ₹1,299", 88, IMG.earbuds),
  o("var_boat_3",      15,  "image", "product-ad",   "Boat",      "Rockerz 450",        "On-ear comfort. 15-hour battery.",               "Foldable · BT 5.0 · ₹1,499.",                                                 "Shop now",   75, IMG.earbuds),
  o("var_boat_4",      26,  "video", "ugc-video",    "Boat",      "Airdopes 141",       "10 mins charge. 200 mins playback.",             "ASAP charge demo · gym to commute · cricket fan UGC.",                        "₹1,299",     84, IMG.earbuds),
  o("var_boat_5",      40,  "image", "affiliate-ad", "Boat",      "Airdopes 141",       "ASAP charge: faster than your morning chai.",    "Affiliate · IPL season · ₹1,299 · cricket angle.",                            "Buy now",    72, IMG.earbuds),

  // Sleepyhead / Wakefit (4)
  o("var_s8m1q5z",     24,  "image", "brand-ad",     "Sleepyhead", undefined,            "Sleep that earns its place in your day.",        "Sleepyhead — engineered for the back you don't think about anymore.",         "Try 100 nights", 91, IMG.bedroom),
  o("var_sleep_2",     36,  "image", "product-ad",   "Sleepyhead", "Original mattress", "100 nights to fall in love. Or your money back.","Memory foam · queen size · 30% off + free pillow.",                           "Buy ₹14,999", 89, IMG.mattress),
  o("var_wake_1",      48,  "image", "product-ad",   "Wakefit",    "Orthopedic mattress","Built to last 10 years. ₹12,999.",              "Ortho-curve · 100-night trial · cooling gel.",                                "Shop now",   85, IMG.mattress),
  o("var_wake_2",      72,  "video", "ugc-video",    "Wakefit",    "Orthopedic mattress","Wake up without back pain. Or send it back.",   "Real customer · 30-day journey · before-after sleep score.",                  "Buy ₹12,999", 87, IMG.mattress),

  // Plum (3)
  o("var_p3l6e8w",     72,  "image", "forge",        "Plum",      "Biotin gummies",     "10 reasons your hair gummy isn't working.",      "Plum Goodness Biotin Gummies — 5,000 mcg, dermatologist-formulated.",         "Shop ₹449",  64, IMG.vitamin, "var_4a2k7q9"),
  o("var_plum_2",      52,  "image", "product-ad",   "Plum",      "Niacinamide serum",  "Niacinamide 10% — for the pores you can see.",   "Plum · 2% niacinamide · oil-control · vegan.",                                "Buy ₹699",   80, IMG.serum),
  o("var_plum_3",      66,  "text-only", "image-to-ad", "Plum",   "GH serum",           "₹100 off your first Plum order.",                "Code: NEWPLUM · valid till Sunday.",                                          "Shop now",   undefined, undefined),

  // Mensa Brands (1)
  o("var_m2c8r1y",     96,  "image", "affiliate-ad", "Mensa Brands", undefined,         "5 founders. 11 brands. ₹2,499 starter kit.",     "Mensa Brands x first-time buyers. Limited to first 1,284 orders.",            "Claim",      79, IMG.bundle),

  // SUGAR / MyGlamm (4)
  o("var_sugar_1",     12,  "video", "ugc-video",    "SUGAR",     "Matte As Hell",      "Matte. As. Hell. 12-hour wear.",                 "Lipstick application + 12-hour wear test · gen-z model.",                     "Shop ₹499",  88, IMG.lipstick),
  o("var_sugar_2",     32,  "image", "product-ad",   "SUGAR",     "Ace Of Face",        "Foundation made for Indian skin. Finally.",      "30 shades · SPF 15 · 12-hour wear.",                                          "Buy ₹999",   82, IMG.lipstick),
  o("var_mg_1",        20,  "image", "product-ad",   "MyGlamm",   "LIT kajal",          "Smudge-proof for 12 hours. ₹399.",               "Kohl-black · 12-hour wear · vegan · Buy 2 ₹699.",                            "Buy now",    79, IMG.lipstick),
  o("var_mg_2",        38,  "image", "brand-ad",     "MyGlamm",   undefined,             "Manish Malhotra collab. While stocks last.",     "Bridal-ready makeup · 30+ exclusive shades · celeb-collab.",                  "Explore",    74, IMG.lipstick),

  // Lenskart (3)
  o("var_lk_1",        16,  "image", "product-ad",   "Lenskart",  "Vincent Chase aviators", "Polarized aviators — ₹1,499.",                "UV400 · stainless-steel · free eye test.",                                    "Buy now",    81, IMG.glasses),
  o("var_lk_2",        44,  "video", "ugc-video",    "Lenskart",  "Air clip-on",        "3D try-on before you buy.",                      "Webcam-style 3D try-on · UI demo · multiple frame swaps.",                    "Try on",     85, IMG.glasses),
  o("var_lk_3",        58,  "text-only", "image-to-ad", "Lenskart", undefined,           "Free home eye check. Frames from ₹999.",         "Code: NEWFRAME · valid this week.",                                           "Book test",  undefined, undefined),

  // BlueStone / CaratLane (2)
  o("var_bs_1",        50,  "image", "product-ad",   "BlueStone", "Heart pendant",      "Adorable Heart 18kt pendant — ₹12,999.",         "BIS-hallmarked · try-at-home · 30-day returns.",                              "Shop now",   78, IMG.jewellery),
  o("var_cl_1",        70,  "image", "product-ad",   "CaratLane", "Solitaire studs",    "First-anniversary gift sorted.",                 "Solitaire studs · ₹18,999 · IGI-certified · 10% off first order.",            "Buy now",    83, IMG.jewellery),

  // Bewakoof / Souled Store / Snitch (3)
  o("var_bw_1",        18,  "image", "product-ad",   "Bewakoof",  "Naruto Sage tee",    "Naruto Sage Mode tee — ₹599. Limited drop.",     "Official anime print · oversized fit · 100% cotton.",                         "Shop now",   85, IMG.streetwear),
  o("var_ss_1",        42,  "image", "product-ad",   "The Souled Store", "Marvel hoodie", "Marvel Avengers Hoodie — ₹1,499.",            "Official Marvel license · fleece-lined · unisex fit.",                        "Buy now",    77, IMG.fashion),
  o("var_sn_1",        62,  "video", "brand-ad",     "Snitch",    undefined,             "Weekly drops. New stock every Friday.",          "Friday-themed reel · 3 looks · counter-tick animation.",                      "Shop now",   72, IMG.fashion),

  // Bombay Shaving Co / Beardo (2)
  o("var_bsc_1",       28,  "image", "product-ad",   "Bombay Shaving Co.", "Sensiblade", "6 blades. Zero nicks. ₹599.",                  "Sensiblade · 5x more durable · India-first.",                                 "Buy now",    81, IMG.beard),
  o("var_bd_1",        56,  "video", "ugc-video",    "Beardo",    "Beard oil",          "Hrithik trusts it. Shouldn't you?",              "Celeb endorsement reel · beard transformation · ₹399.",                       "Shop ₹399",  87, IMG.beard),

  // Yoga Bar / OZiva (2)
  o("var_yb_1",        34,  "image", "product-ad",   "Yoga Bar",  "20g protein bar",    "20g protein. Real food. No maltitol.",           "Pack of 6 · clean ingredients · ₹659.",                                       "Buy now",    79, IMG.protein),
  o("var_oz_1",        46,  "image", "brand-ad",     "OZiva",     "Protein for women",  "Plant protein for women. Designed by women.",    "OZiva · plant + ayurveda · DGCA-certified.",                                  "Shop ₹999",  82, IMG.protein),

  // Mokobara / Uppercase (2)
  o("var_mk_1",        54,  "image", "product-ad",   "Mokobara",  "Em Cabin",           "10-year warranty. Aerospace polycarbonate.",     "Em Cabin · ₹14,499 · Hinomoto wheels · modular tracker.",                     "Buy now",    84, IMG.travel),
  o("var_uc_1",        68,  "image", "product-ad",   "Uppercase", "Ranger 55",          "100% recycled. Lifetime warranty.",              "Ranger 55 · ₹3,999 · TSA-lock · sustainable.",                                "Shop now",   75, IMG.travel),

  // Country Delight / Licious (2)
  o("var_cd_1",        76,  "video", "ugc-video",    "Country Delight", "A2 milk",      "Fresh A2 milk. Delivered before sunrise.",       "Pre-dawn doorstep delivery · daily routine montage.",                         "Subscribe",  73, IMG.food),
  o("var_lc_1",        88,  "image", "product-ad",   "Licious",   "Chicken curry cut",  "Antibiotic-free. 2-hour delivery.",              "Cut → packing → delivery rider · ₹449/kg.",                                   "Order now",  78, IMG.food),

  // Pepperfry / Urban Ladder (2)
  o("var_pp_1",        90,  "image", "product-ad",   "Pepperfry", "Mark recliner",      "Festive 20% off — only this Diwali.",            "Mark 3-seater recliner · ₹49,999 · 2-yr warranty.",                           "Shop now",   71, IMG.furniture),
  o("var_ul_1",       100,  "image", "brand-ad",     "Urban Ladder", undefined,         "Designed in India. Built to last.",              "Modern furniture · showroom + online · assembly included.",                   "Explore",    74, IMG.furniture),

  // Damensch / XYXX (1)
  o("var_dm_1",        82,  "image", "product-ad",   "DaMensch",  "Bamboo trunks",      "Bamboo modal. Anti-bacterial. Sweat-wicking.",   "Pack of 3 · ₹1,199 · tag-free · odor-resistant.",                             "Shop now",   80, IMG.fashion),

  // Foxtale / Minimalist / The Derma Co (3)
  o("var_fx_1",         9,  "image", "product-ad",   "Foxtale",   "Niacinamide serum",  "Niacinamide formulated for Indian skin tones.",  "Foxtale · ₹599 · dermatologist-approved.",                                    "Buy ₹599",   83, IMG.serum),
  o("var_mn_1",        21,  "image", "product-ad",   "Minimalist","Niacinamide 10",     "Open ingredient list. No marketing fluff.",      "Minimalist · 10% niacinamide · ₹599 · transparent.",                          "Shop now",   86, IMG.serum),
  o("var_td_1",        45,  "video", "ugc-video",    "The Derma Co.", "SA face wash",   "Real spot-clearing in 30 days.",                 "Real customer · before-after · BHA · ₹399.",                                  "Buy now",    88, IMG.facewash),

  // Edge case — zero-data fallback test
  o("var_zerocase",   216,  "image", "product-ad",   "",          undefined,             "",                                               "",                                                                            "",           undefined, undefined),
];

// ─────────────────────────────────────────────────────────────────────────────
// Backfill — angleId + priorConfig
// ─────────────────────────────────────────────────────────────────────────────
// Schema additions for the Library redesign: every output gets an `angleId`
// (so Group-by-Angle view has a non-empty pool per angle) and a `priorConfig`
// snapshot (so Variant B of the AdDetailDrawer has data to render).
//
// Deterministic round-robin so output ordering, counts, and the "first card
// in row gets featured" treatment are stable across refreshes.
// ─────────────────────────────────────────────────────────────────────────────

/** 8 representative angle IDs taken from `src/mocks/shared/angles.ts`. */
const ANGLE_ROTATION = [
  "ang-asp-lifestyle",   // Aspirational lifestyle
  "ang-social-proof",    // Social proof
  "ang-before-after",    // Before-after
  "ang-urgency",         // Urgency
  "ang-comparison",      // Comparison
  "ang-expert-led",      // Expert-led
  "ang-emotional-story", // Emotional storytelling
  "ang-empowerment",     // Empowerment
] as const;

const BRAND_SLUG: Record<string, string> = {
  Mamaearth: "mamaearth",
  Noise: "noise",
  Boat: "boat",
  Sleepyhead: "sleepyhead",
  "WOW Skin Science": "wow-skin",
  Plum: "plum",
  mCaffeine: "mcaffeine",
  "The Derma Co.": "the-derma-co",
  Minimalist: "minimalist",
  Foxtale: "foxtale",
  Pepperfry: "pepperfry",
  "Urban Ladder": "urban-ladder",
  DaMensch: "damensch",
};

// In-place decoration — keeps the `sampleOutputs` array reference intact for
// the 15+ consumers that import it.
sampleOutputs.forEach((out, idx) => {
  // Skip the zero-data edge-case row.
  if (!out.brand?.name) return;

  const angleId = ANGLE_ROTATION[idx % ANGLE_ROTATION.length];
  const brandId = BRAND_SLUG[out.brand.name];

  out.angleId = angleId;
  out.priorConfig = {
    mode: out.mode,
    angleId,
    ...(brandId ? { brandId } : {}),
    ...(out.product?.name
      ? { productId: `prod-${brandId ?? "x"}-${out.product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` }
      : {}),
    // Deterministic conceptId derived from mode + angle position.
    conceptId: `concept-${out.mode}-${idx % 12}`,
    // Deterministic hook pick — 70% of outputs carry a hook, 30% don't.
    ...(idx % 10 < 7 ? { hookId: `hook-${idx % 18}` } : {}),
    // Prompt snippet — derived from headline + body (first ~110 chars).
    ...(out.headline
      ? { promptSnippet: `${out.headline} — ${out.body ?? ""}`.slice(0, 110).trim() }
      : {}),
    // Every 4th output was "from a template" — gives Variant B a state to render.
    ...(idx % 4 === 0
      ? { generatedFromTemplate: `${out.brand.name} · ${out.mode.replace("-", " ")} template` }
      : {}),
    generatedAt: out.generatedAt,
  };
});

/* ── AI-native surfaces backfill (A-12.192) ─────────────────────────────
   Adds aiVerdict / comparison / recommendations / siblings to a deterministic
   subset of outputs so the AdDetail drawer (both Variant A refined + Variant
   C bento) has populated state to demo against. Subset chosen: every output
   whose qualityScore is defined gets a verdict; the first 5 outputs per brand
   get full coach + comparison data.
*/
sampleOutputs.forEach((out, idx) => {
  if (out.qualityScore === undefined) return;
  const q = out.qualityScore;
  // Verdict — vary realistically around the quality score.
  out.aiVerdict = {
    quality: q,
    ctr: Number(((q / 30) + (idx % 3) * 0.3).toFixed(1)),       // 2.0–4.0%
    ctrDelta: Number(((q - 75) / 12).toFixed(1)),                // +/- vs angle
    cvr: Number((0.9 + (q / 80)).toFixed(1)),                    // 1.0–2.1%
    cvrDelta: Number(((q - 80) / 20).toFixed(1)),
    audienceFit: Math.min(99, q + (idx % 4) - 5),
    audienceFitLabel: q >= 85 ? "Strong match" : q >= 70 ? "Decent match" : "Weak match",
    brandVoice: Math.min(99, q + (idx % 5)),
    brandVoiceLabel: q >= 85 ? "On-tone" : q >= 70 ? "Mostly on-tone" : "Off-tone",
  };
  // Comparison — top in angle is always above this ad, your-10 + category drift.
  out.comparison = {
    topInAngle: Math.min(99, q + 6),
    your10Avg: Math.max(45, q - 8),
    categoryAvg: Math.max(40, q - 16),
  };
  // Siblings — pick up to 3 other outputs from the same brand for a cohesive batch.
  out.siblings = sampleOutputs
    .filter((o) => o.brand?.name === out.brand?.name && o.id !== out.id)
    .slice(0, 3)
    .map((o) => o.id);
  // Recommendations — 3 deterministic coach lines per output.
  const angleLabel = out.priorConfig?.angleId ?? "this angle";
  const hookLabel =
    out.headline && out.headline.length > 0
      ? out.headline.split(/[.!?]/)[0].slice(0, 28).trim()
      : "this hook";
  out.recommendations = [
    {
      id: `${out.id}-forge`,
      icon: "sparkles",
      title: `Forge 10 more in ${angleLabel}`,
      sub: q >= 85
        ? `${angleLabel} is your strongest angle this week — riding the win`
        : `${angleLabel} is trending in your category — worth doubling up`,
      ctaLabel: "Run",
      ctaHref: `/iq/genie6/studio-alpha?mode=${out.mode}&angle=${angleLabel}`,
    },
    {
      id: `${out.id}-ab`,
      icon: "beaker",
      title: "Pit against a sibling variant",
      sub: "Same brand, opposite angle — clean A/B",
      ctaLabel: "Compare",
      ctaHref: `/iq/genie6/library?compare=${out.id}`,
    },
    {
      id: `${out.id}-refresh`,
      icon: "refresh-cw",
      title: "Refresh the hook",
      sub: `"${hookLabel}" fatigue — 4 ads in 30 days`,
      ctaLabel: "Regenerate",
      ctaHref: `/iq/genie6/studio-alpha?mode=${out.mode}&regen=true`,
    },
  ];
});

/* ── Generation context backfill (A-12.196 canonical Ad Detail) ──
   Format / aiModel / KB / concepts / angleTags. Deterministic across the
   pool so the new drawer renders varied but stable mock state. */
sampleOutputs.forEach((out, idx) => {
  if (out.qualityScore === undefined) return;

  // Format — derive from mediaType
  out.format =
    out.mediaType === "video"
      ? "Video"
      : out.mediaType === "text-only"
        ? "Adcopy"
        : "Image";

  // AI model — rotate realistic options
  const models = ["GPT 5.5", "Claude Sonnet 4.5", "Imagen 3", "Veo 2"];
  out.aiModel = models[idx % models.length];

  // Knowledge base — every 3rd output consulted it
  out.knowledgeBaseUsed = idx % 3 === 0;
  if (out.knowledgeBaseUsed) {
    out.knowledgeBaseSources = [
      `${out.brand?.name ?? "Brand"} brand voice`,
      "Previous winners (Q1)",
    ].slice(0, (idx % 2) + 1);
  }

  // Concepts — 2 or 3 concepts, 3–5 variations each
  const conceptCount = 2 + (idx % 2);
  const variations = 3 + (idx % 3);
  out.concepts = Array.from({ length: conceptCount }, (_, i) => ({
    id: `${out.id}-concept-${i + 1}`,
    label: `Concept ${i + 1}`,
    variations,
  }));

  // Angle tags — base angle + 1-2 contextual tags
  const baseAngle = out.angleId ?? "performance";
  const extraTags: Record<string, string[]> = {
    "ang-asp-lifestyle": ["Performance", "Story Ad"],
    "ang-pain-point": ["Pain Point", "Performance"],
    "ang-social-proof": ["Social Proof"],
    "ang-urgency": ["Urgency", "Discount"],
    "ang-before-after": ["Before/After", "Proof"],
    "ang-comparison": ["Comparison"],
    "ang-expert-led": ["Expert", "Authority"],
    "ang-emotional-story": ["Story", "Emotional"],
    "ang-empowerment": ["Empowerment"],
  };
  out.angleTags = [baseAngle, ...(extraTags[baseAngle] ?? ["Performance"])].slice(0, 3);
});
