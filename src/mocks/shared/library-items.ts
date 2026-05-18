/**
 * Creative Library — central mock pool.
 *
 * Single source of truth for Library items. Designed to feel like data
 * that came from Genie (generated), Industry Insights (pinned competitor
 * ads), or user uploads. Cross-surface sync target: when Genie /
 * Insights / Reports wire to mock data, they should pull from THIS
 * module so the workspace feels coherent (Mamaearth's library matches
 * Mamaearth's Genie library matches Mamaearth's pinned insights).
 *
 * Volume (per Maalik's 75-150 per tab ask):
 *   ~150 Media items
 *   ~150 Headlines
 *   ~150 Primary text
 *   ~100 Descriptions
 *   ~90  Adgroups (each references real Media + Headline + Primary IDs)
 *
 * Brand attribution mix (per Maalik's "Mixed" call):
 *   ~70% branded, ~30% orphan/library (no brand)
 *
 * All items are deterministically generated at module load — no
 * randomness. Same arrays on every render.
 */
import type { CreativeAsset } from "@/hooks/use-creative-assets";
import type { ClTextItem } from "@/hooks/use-cl-text-items";
import type { ClAdgroup } from "@/hooks/use-cl-adgroups";

// ─────────────────────────────────────────────────────────────────────────────
// Source ⇢ library item
// ─────────────────────────────────────────────────────────────────────────────
/** Where an item entered the library. Future cross-surface sync uses this. */
export type LibrarySource =
  | "uploaded"           // user dropped a file
  | "generated"          // Genie produced this
  | "pinned-insights"    // user pinned a competitor ad from Industry Insights
  | "reference"          // brand asset (logo / palette etc.)
  | "imported";          // from external source (Drive / Dropbox)

/** Library-level metadata layered on top of the DB row types. */
export interface LibraryItemMeta {
  brand_id: string | null;        // null = orphan / shared library
  source: LibrarySource;
  quality_score?: number;         // only for source="generated"
  used_in_adgroup_ids?: string[]; // reverse-ref for "used in N ads"
  is_dummy: true;
}

// Augmented row types (DB row + library meta) that components consume.
export type LibraryAsset    = CreativeAsset & LibraryItemMeta & { tags: string[] };
export type LibraryTextItem = ClTextItem    & LibraryItemMeta;
export type LibraryAdgroup  = ClAdgroup     & LibraryItemMeta;

// ─────────────────────────────────────────────────────────────────────────────
// 8 representative brands (subset of mocks/shared/brands.ts).
// We use a small set so adgroups read as coherent campaigns.
// ─────────────────────────────────────────────────────────────────────────────
interface BrandProfile {
  id: string;
  name: string;
  pageName: string;
  domain: string;
  /** Headline-style ad copy. Short, punchy. */
  headlines: string[];
  /** Body / primary text — longer, story-led. */
  primaryTexts: string[];
  /** Value-prop descriptions. */
  descriptions: string[];
  /** File-name fragments per content type. */
  mediaFragments: string[];
  /** CTAs the brand uses. */
  ctas: string[];
}

const BRANDS: BrandProfile[] = [
  {
    id: "mamaearth", name: "Mamaearth", pageName: "Mamaearth", domain: "mamaearth.in",
    headlines: [
      "Hair fall? We solved it.",
      "Onion oil that actually works.",
      "Toxin-free skincare for moms.",
      "From our family to yours.",
      "Day 21 — I can't believe this.",
      "Onion + redensyl = regrowth.",
      "Built for Indian skin.",
      "Real ingredients. Real results.",
    ],
    primaryTexts: [
      "I tried Mamaearth Onion Hair Oil for 4 weeks. The bald patches are gone. Sharing my honest story before the trolls hit.",
      "I lost 60% of my hair after my second pregnancy. Mamaearth's onion + redensyl combo was the only thing that brought it back. Not sponsored.",
      "Toxin-free isn't a marketing word for us. Every product is certified by Made Safe® — the same group that audits baby food.",
      "After 14 days using their vitamin C face wash, my dark spots faded visibly. I've tried Olay, L'Oreal — nothing else worked this fast.",
      "Quick honest review — used the Ubtan Face Wash for 30 days. Glow is real. ₹249 well spent.",
    ],
    descriptions: [
      "Made Safe® certified. Free of sulphates, parabens, mineral oil.",
      "5M+ happy customers. 4.6★ rating. Free shipping on ₹399+.",
      "100% natural · dermatologist-approved · cruelty-free.",
      "Made in India for Indian hair & skin types.",
    ],
    mediaFragments: ["onion-oil-hero", "vitamin-c-face-wash", "ubtan-glow", "hair-growth-day21", "founder-story"],
    ctas: ["Shop now", "Order now", "Try risk-free", "Buy at ₹249"],
  },
  {
    id: "boat", name: "boAt", pageName: "boAt Lifestyle", domain: "boat-lifestyle.com",
    headlines: [
      "Built for Bharat.",
      "Sound that lasts 50 hours.",
      "Drop-proof. Sweat-proof. Yours.",
      "₹999 earbuds that don't suck.",
      "Made for Indian playlists.",
      "Bass that hits home.",
    ],
    primaryTexts: [
      "boAt Airdopes 161 — 40 hours playback, IPX4 sweat resistance, ₹1,299. Number one in India for a reason.",
      "We tested boAt against Sony, JBL, Boult. Battery life — boAt wins. Bass — boAt wins. Price — not even close.",
      "Built for the gym, the commute, and that one playlist you've been hiding. ENx™ noise cancellation keeps the world out.",
      "We don't import from China and slap a label. Every Rockerz model is QC'd at our Bhiwadi plant. Lifetime warranty included.",
    ],
    descriptions: [
      "40-hour playback · IPX5 sweat-proof · Made in India.",
      "1-year warranty · 4.3★ avg rating · India's #1 audio brand.",
      "Free EMI on Flipkart, Amazon, Myntra.",
      "Now with Beast Mode™ for sub-50ms latency.",
    ],
    mediaFragments: ["airdopes-161-launch", "rockerz-night-mode", "stone-bass-demo", "beast-mode-gaming"],
    ctas: ["Shop now", "Add to cart", "Buy now", "Order today"],
  },
  {
    id: "sleepyhead", name: "Sleepyhead", pageName: "Sleepyhead", domain: "sleepyhead.in",
    headlines: [
      "Sleep so good, you'll oversleep.",
      "100 nights. No regrets.",
      "Built for the Indian back.",
      "From mattress to bed-in-a-box.",
      "Free trial — sleep on it.",
    ],
    primaryTexts: [
      "100-night sleep trial. If you don't love it, we'll pick it up. No questions, full refund. We've never had to ask why.",
      "Designed for the Indian back. Pressure-relief memory foam at the top, orthopedic firm at the base. 7-zone support.",
      "Hot summers + soft mattresses = bad sleep. Our Original Mattress has a cooling gel layer that breathes through the night.",
      "Mattress in a box. Delivered, unboxed, sleeping in 5 minutes. Free returns if you change your mind.",
    ],
    descriptions: [
      "100-night trial · 10-year warranty · Free delivery.",
      "Memory foam + orthopedic base · 7-zone pressure relief.",
      "₹2,000 off your first order with code SLEEPY.",
      "Rated 4.7★ across 12,000+ reviews.",
    ],
    mediaFragments: ["original-mattress-cooling", "100-night-trial", "back-pain-relief", "unbox-in-5-min"],
    ctas: ["Try free for 100 nights", "Order yours", "Start your trial", "Shop bed"],
  },
  {
    id: "wow-skin", name: "WOW Skin Science", pageName: "WOW Skin Science", domain: "buywow.in",
    headlines: [
      "Skincare that doesn't lie.",
      "Coconut & vitamin C — that's it.",
      "Apple cider vinegar that works.",
      "100% natural. Always.",
    ],
    primaryTexts: [
      "WOW Apple Cider Vinegar Shampoo — gentle on hair, brutal on dandruff. No sulphates, parabens, or silicones. Ever.",
      "Vitamin C is having a moment, and we've done it longer than anyone. Brightens in 14 days. Money back if it doesn't.",
      "Made in India, formulated by dermatologists, sold across 30 countries. Not bragging — just receipts.",
    ],
    descriptions: [
      "Sulphate-free · Paraben-free · Cruelty-free.",
      "4.4★ avg · 8M+ bottles sold worldwide.",
      "Free shipping on ₹599+.",
    ],
    mediaFragments: ["apple-cider-shampoo", "vit-c-serum-glow", "founder-bottle-shot", "before-after-14d"],
    ctas: ["Shop now", "Buy bundle", "Save 20%", "Add to cart"],
  },
  {
    id: "plum", name: "Plum Goodness", pageName: "Plum", domain: "plumgoodness.com",
    headlines: [
      "Bestselling cleanser.",
      "Top-rated in 2025.",
      "Skincare for the kind.",
      "Now in 3 new shades.",
    ],
    primaryTexts: [
      "Plum's Green Tea Cleanser — voted bestselling face wash 4 years running. Now in a refillable pump bottle.",
      "Vegan. Cruelty-free. Recyclable packaging. We don't just say it — we publish our supply chain.",
      "Our chemists test every formula on 200+ Indian skin tones. Then on themselves. Never on animals.",
    ],
    descriptions: [
      "Vegan · cruelty-free · packed with antioxidants.",
      "Refillable packaging · 100% recyclable.",
      "Trusted by 1M+ customers.",
    ],
    mediaFragments: ["green-tea-cleanser-hero", "plum-bestseller-2025", "vegan-routine"],
    ctas: ["Shop now", "Buy refill", "Try sample", "Add to cart"],
  },
  {
    id: "mcaffeine", name: "mCaffeine", pageName: "mCaffeine", domain: "mcaffeine.com",
    headlines: [
      "4 angles tested · pick the winner.",
      "Caffeine. Skin care.",
      "Wake up your skin.",
      "Coffee for your face.",
    ],
    primaryTexts: [
      "mCaffeine's Coffee Face Scrub — 1M+ jars sold. The Reddit skincare community ranked it #1 in 2024.",
      "Why caffeine in skincare? Because it tightens, depuffs, and de-tans. Our chemists call it the unsung hero.",
      "100% vegan. No mineral oil, parabens, or SLES. Made in our own facility in Mumbai.",
    ],
    descriptions: [
      "1M+ jars sold · 4.5★ rated.",
      "100% vegan · made in India.",
      "Free shipping on ₹499+.",
    ],
    mediaFragments: ["coffee-scrub-hero", "depuff-eye-cream", "1m-jars-sold", "vegan-certified"],
    ctas: ["Shop now", "Buy bundle", "Order today"],
  },
  {
    id: "the-derma-co", name: "The Derma Co", pageName: "The Derma Co", domain: "thedermaco.com",
    headlines: [
      "Dermatologist-approved.",
      "Active ingredients only.",
      "Built by chemists.",
      "Science > skincare.",
    ],
    primaryTexts: [
      "The Derma Co's Niacinamide Serum — 10% concentration, the maximum your skin can absorb without irritation. Dermatologist-formulated.",
      "We don't sell a 'glow.' We sell active ingredients at clinical concentrations. Niacinamide, salicylic acid, retinol.",
      "Our co-founder is a board-certified dermatologist. Every formula is co-signed by her before it ships.",
    ],
    descriptions: [
      "Dermatologist-formulated · clinical-grade actives.",
      "Free skincare consultation with every order.",
      "4.6★ avg rating · 500K+ customers.",
    ],
    mediaFragments: ["niacinamide-serum", "salicylic-acid-cleanser", "dermatologist-co-founder"],
    ctas: ["Get free consult", "Shop actives", "Buy bundle"],
  },
  {
    id: "minimalist", name: "Minimalist", pageName: "Minimalist", domain: "beminimalist.co",
    headlines: [
      "Honest skincare.",
      "Ingredients, transparent.",
      "Built for your skin type.",
      "No drama. Just science.",
    ],
    primaryTexts: [
      "Minimalist's 10% Niacinamide — every bottle has the exact concentration, the lot number, and the chemist who signed off. Radical transparency.",
      "We list every ingredient on the bottle, the website, and the box. With reasons. Because skincare shouldn't be a mystery.",
      "Our founder Mohit Yadav left his banking job to build this. The first product was Niacinamide. The 50th is still as honest.",
    ],
    descriptions: [
      "Full ingredient transparency · lot-level traceability.",
      "4.7★ rated · 2M+ customers.",
      "Free shipping on ₹599+.",
    ],
    mediaFragments: ["niacinamide-10-hero", "transparency-promise", "founder-mohit-story"],
    ctas: ["Shop transparent", "Buy now", "Free consult"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Generic / orphan content — not tied to any brand. ~30% of total volume.
// ─────────────────────────────────────────────────────────────────────────────
const ORPHAN_HEADLINES = [
  "Hook the buyer in 3 seconds.",
  "Sale ends tonight.",
  "Free shipping. Always.",
  "Built for what you need.",
  "Limited stock. Order now.",
  "What customers are saying.",
  "Before-and-after, no filters.",
  "30-day money-back guarantee.",
  "Made in India. Built to last.",
  "As featured in Vogue.",
  "Doctors recommend it.",
  "What everyone's talking about.",
];
const ORPHAN_PRIMARIES = [
  "Quick honest review after 30 days — sharing my real before-and-after pictures. No filters, no edits. The result speaks for itself.",
  "I was skeptical at first. ₹399 for a face wash? But after 2 weeks the results were so visible my colleagues asked what changed.",
  "Tried 5 other brands before finding this one. Wish I'd skipped the rest and started here. Money saved, results visible.",
  "Free shipping, 100-day returns, 1M+ happy customers. We're not just another DTC brand. Read the reviews.",
  "Behind-the-scenes look at how we make our bestselling product. Spoiler: a lot more work than you'd think.",
];
const ORPHAN_DESCRIPTIONS = [
  "Free shipping on ₹499+ · 30-day returns.",
  "4.5★ rated · 1M+ happy customers.",
  "Made in India · cruelty-free.",
  "Limited-time offer · ends midnight.",
  "Trusted by 500K+ across India.",
];
const ORPHAN_MEDIA_FRAGMENTS = [
  "lifestyle-hero-shot",
  "founder-story-bts",
  "before-after-grid",
  "testimonial-reel",
  "ugc-creator-pack",
  "festive-banner",
  "limited-time-promo",
  "behind-the-scenes",
];

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic helpers — no Math.random, ever
// ─────────────────────────────────────────────────────────────────────────────
function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}
function pickMany<T>(arr: T[], seed: number, count: number): T[] {
  const out: T[] = [];
  for (let i = 0; i < count; i++) {
    out.push(arr[(seed + i * 7) % arr.length]);
  }
  return out;
}
function dateOffsetDays(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(9 + (daysAgo % 12), (daysAgo * 7) % 60, 0, 0);
  return d.toISOString();
}

// Stable workspace + user IDs for the mock (overwritten by consumer if needed)
const MOCK_WORKSPACE = "mock-workspace";
const MOCK_USER = "mock-user";

// ─────────────────────────────────────────────────────────────────────────────
// MEDIA — 150 items (mix of branded + orphan, image + video)
// ─────────────────────────────────────────────────────────────────────────────
function buildMedia(): LibraryAsset[] {
  const out: LibraryAsset[] = [];
  // Branded media: 13-14 per brand × 8 brands = ~105
  BRANDS.forEach((brand, bi) => {
    const perBrand = 13;
    for (let i = 0; i < perBrand; i++) {
      const isVideo = i % 4 === 3; // every 4th item is a video
      const fragment = pick(brand.mediaFragments, i);
      const seq = i + 1;
      const daysAgo = bi * 6 + i * 2;
      const source: LibrarySource =
        i % 5 === 0 ? "pinned-insights"
        : i % 3 === 0 ? "uploaded"
        : "generated";
      out.push({
        id: `lib-media-${brand.id}-${seq}`,
        workspace_id: MOCK_WORKSPACE,
        folder_id: i % 3 === 0 ? `lib-folder-${brand.id}-campaign-${(i % 2) + 1}` : null,
        file_name: `${brand.id}-${fragment}-${String(seq).padStart(2, "0")}.${isVideo ? "mp4" : "jpg"}`,
        file_type: isVideo ? "video" : "image",
        file_size: isVideo ? 8_000_000 + i * 500_000 : 800_000 + i * 90_000,
        width: isVideo ? 1080 : (i % 2 === 0 ? 600 : 800),
        height: isVideo ? 1920 : (i % 2 === 0 ? 800 : 600),
        storage_path: "",
        url: `https://picsum.photos/seed/${brand.id}${seq}/${isVideo ? 540 : 600}/${isVideo ? 960 : 800}`,
        thumbnail_url: null,
        uploaded_by: MOCK_USER,
        created_at: dateOffsetDays(daysAgo),
        brand_id: brand.id,
        source,
        quality_score: source === "generated" ? 70 + ((bi * 3 + i * 5) % 25) : undefined,
        used_in_adgroup_ids: [],
        is_dummy: true,
        tags: [brand.name, isVideo ? "Video" : "Image", source === "pinned-insights" ? "Competitor" : "Owned"],
      });
    }
  });
  // Orphan media: ~45 items
  for (let i = 0; i < 45; i++) {
    const isVideo = i % 5 === 0;
    const fragment = pick(ORPHAN_MEDIA_FRAGMENTS, i);
    out.push({
      id: `lib-media-orphan-${i + 1}`,
      workspace_id: MOCK_WORKSPACE,
      folder_id: null,
      file_name: `library-${fragment}-${String(i + 1).padStart(2, "0")}.${isVideo ? "mp4" : "jpg"}`,
      file_type: isVideo ? "video" : "image",
      file_size: isVideo ? 6_500_000 + i * 200_000 : 600_000 + i * 60_000,
      width: isVideo ? 1080 : 700,
      height: isVideo ? 1920 : 525,
      storage_path: "",
      url: `https://picsum.photos/seed/orphan${i + 1}/700/525`,
      thumbnail_url: null,
      uploaded_by: MOCK_USER,
      created_at: dateOffsetDays(50 + i),
      brand_id: null,
      source: i % 3 === 0 ? "reference" : "uploaded",
      quality_score: undefined,
      used_in_adgroup_ids: [],
      is_dummy: true,
      tags: [isVideo ? "Video" : "Image", "Library", "Generic"],
    });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEXT ITEMS — Headlines / Primary / Description
// ─────────────────────────────────────────────────────────────────────────────
function buildTextItems(
  kind: "headline" | "primary_text" | "description",
): LibraryTextItem[] {
  const out: LibraryTextItem[] = [];
  const orphanPool =
    kind === "headline" ? ORPHAN_HEADLINES
    : kind === "primary_text" ? ORPHAN_PRIMARIES
    : ORPHAN_DESCRIPTIONS;

  // Branded text: ~16-19 per brand for headlines/primary, ~10-12 for descriptions
  BRANDS.forEach((brand, bi) => {
    const pool =
      kind === "headline" ? brand.headlines
      : kind === "primary_text" ? brand.primaryTexts
      : brand.descriptions;
    // Generate variants by reusing pool entries with small mutations
    const perBrandTarget = kind === "description" ? 10 : 17;
    for (let i = 0; i < perBrandTarget; i++) {
      const base = pool[i % pool.length];
      out.push({
        id: `lib-${kind}-${brand.id}-${i + 1}`,
        workspace_id: MOCK_WORKSPACE,
        text: base,
        categories: [brand.name],
        tags: pickMany(["Hook", "Promo", "Testimonial", "Brand", "Seasonal", "Evergreen"], bi + i, 2),
        platforms: pickMany(["Meta", "TikTok", "Google", "NewsBreak"], bi * 2 + i, kind === "headline" ? 2 : 1),
        is_favourite: i % 9 === 0,
        created_by: MOCK_USER,
        created_at: dateOffsetDays(bi * 4 + i * 3),
        brand_id: brand.id,
        source: i % 4 === 0 ? "pinned-insights" : "generated",
        quality_score: 70 + ((bi + i) % 25),
        is_dummy: true,
      });
    }
  });
  // Orphan text: ~30 items
  const orphanCount = kind === "description" ? 25 : 35;
  for (let i = 0; i < orphanCount; i++) {
    out.push({
      id: `lib-${kind}-orphan-${i + 1}`,
      workspace_id: MOCK_WORKSPACE,
      text: orphanPool[i % orphanPool.length],
      categories: ["Generic"],
      tags: pickMany(["Hook", "Promo", "Evergreen", "Library"], i, 2),
      platforms: pickMany(["Meta", "TikTok", "Google"], i, 1),
      is_favourite: false,
      created_by: MOCK_USER,
      created_at: dateOffsetDays(60 + i),
      brand_id: null,
      source: "uploaded",
      is_dummy: true,
    });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADGROUPS — 90 items, all branded, with real references into Media + Text
// ─────────────────────────────────────────────────────────────────────────────
function buildAdgroups(
  media: LibraryAsset[],
  headlines: LibraryTextItem[],
  primaries: LibraryTextItem[],
  descriptions: LibraryTextItem[],
): LibraryAdgroup[] {
  const out: LibraryAdgroup[] = [];
  BRANDS.forEach((brand, bi) => {
    const perBrand = 11; // 8 × 11 = 88
    const brandMedia = media.filter((m) => m.brand_id === brand.id);
    const brandHeadlines = headlines.filter((h) => h.brand_id === brand.id);
    const brandPrimaries = primaries.filter((p) => p.brand_id === brand.id);
    const brandDescriptions = descriptions.filter((d) => d.brand_id === brand.id);
    if (
      brandMedia.length === 0 ||
      brandHeadlines.length === 0 ||
      brandPrimaries.length === 0
    ) {
      return; // skip — missing refs
    }

    for (let i = 0; i < perBrand; i++) {
      const mediaCount = (i % 3) + 1; // 1, 2, or 3 media per adgroup
      const mediaIds = pickMany(brandMedia.map((m) => m.id), i, mediaCount);
      const headlineRef = pick(brandHeadlines, i);
      const primaryRef = pick(brandPrimaries, i);
      const descriptionRef = i % 3 === 0 && brandDescriptions.length > 0
        ? pick(brandDescriptions, i).id
        : null;
      const cta = pick(brand.ctas, i);
      out.push({
        id: `lib-adg-${brand.id}-${i + 1}`,
        workspace_id: MOCK_WORKSPACE,
        name: `${brand.name} · ${["Hero", "Promo", "Retargeting", "Lookalike", "Awareness", "Conversion"][i % 6]} ${i + 1}`,
        page_name: brand.pageName,
        page_avatar_url: `https://picsum.photos/seed/${brand.id}-avatar/96/96`,
        ad_type: mediaCount > 1 ? "Carousel" : (brandMedia[i % brandMedia.length].file_type === "video" ? "Video" : "Static"),
        primary_text_id: primaryRef.id,
        headline_id: headlineRef.id,
        description_id: descriptionRef,
        media_ids: mediaIds,
        destination_url: `https://${brand.domain}/?utm_source=fabads&utm_campaign=mock`,
        display_link: brand.domain,
        cta,
        is_favourite: i % 7 === 0,
        created_by: MOCK_USER,
        created_at: dateOffsetDays(bi * 3 + i * 2),
        brand_id: brand.id,
        source: i % 4 === 0 ? "pinned-insights" : "generated",
        quality_score: 72 + ((bi * 5 + i * 3) % 24),
        is_dummy: true,
      });

      // Reverse-ref population on media — so "used in N ads" reads true
      mediaIds.forEach((mid) => {
        const m = media.find((x) => x.id === mid);
        if (m && !m.used_in_adgroup_ids?.includes(`lib-adg-${brand.id}-${i + 1}`)) {
          m.used_in_adgroup_ids = [
            ...(m.used_in_adgroup_ids ?? []),
            `lib-adg-${brand.id}-${i + 1}`,
          ];
        }
      });
    }
  });
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Build once at module load. Deterministic — no Math.random anywhere.
// ─────────────────────────────────────────────────────────────────────────────
export const LIBRARY_MEDIA: LibraryAsset[] = buildMedia();
export const LIBRARY_HEADLINES: LibraryTextItem[]    = buildTextItems("headline");
export const LIBRARY_PRIMARY_TEXTS: LibraryTextItem[] = buildTextItems("primary_text");
export const LIBRARY_DESCRIPTIONS: LibraryTextItem[]  = buildTextItems("description");
export const LIBRARY_ADGROUPS: LibraryAdgroup[] =
  buildAdgroups(LIBRARY_MEDIA, LIBRARY_HEADLINES, LIBRARY_PRIMARY_TEXTS, LIBRARY_DESCRIPTIONS);

// Brand list export for filter UIs
export const LIBRARY_BRANDS: { id: string; name: string }[] = BRANDS.map((b) => ({
  id: b.id,
  name: b.name,
}));

// Folder list — derived from media items that have folder_id set
export const LIBRARY_FOLDERS: { id: string; name: string; brand_id: string }[] = (() => {
  const set = new Map<string, { id: string; name: string; brand_id: string }>();
  LIBRARY_MEDIA.forEach((m) => {
    if (!m.folder_id || set.has(m.folder_id)) return;
    const brand = BRANDS.find((b) => b.id === m.brand_id);
    if (!brand) return;
    set.set(m.folder_id, {
      id: m.folder_id,
      name: m.folder_id.replace(`lib-folder-${brand.id}-`, "").replace(/-/g, " "),
      brand_id: brand.id,
    });
  });
  return Array.from(set.values());
})();

/**
 * Convenience filter — apply brand filter to any LibraryItem-shaped array.
 * Returns all items if brandId is null. Treats brand_id===null items as
 * orphan; they appear under "All" but not under a specific brand filter.
 */
export function filterByBrand<T extends { brand_id: string | null }>(
  items: T[],
  brandId: string | null,
): T[] {
  if (!brandId) return items;
  return items.filter((it) => it.brand_id === brandId);
}
