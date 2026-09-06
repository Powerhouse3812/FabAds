/**
 * Other Flows — source catalogue (Genie 2.0 §7).
 *
 * A FlowSourceRef is "a concrete thing the user picked inside a source
 * module" (flowTypes.ts). This file is a curated catalogue for the Other
 * Flows browsing surface — module card → pick a source → pick an action —
 * not a live mirror of every row those modules can ever render. That's why
 * ">=40 across the 7 live modules, min 5 per module" is the bar, not "one
 * per real row": Industry Insights alone has 800 rows, Reports' tree has
 * hundreds more, and a static registry cannot (and shouldn't try to) cover
 * either exhaustively. `resolveFlowContext` already treats an unknown ref id
 * as "degrade to plain Studio", so a module-side kebab wired to a real row
 * this file doesn't happen to carry fails soft, not hard.
 *
 * Wherever the source module already has real generator output, this file
 * reads it directly instead of hand-transcribing values — DUMMY_ADS,
 * getDummyVideos(), getDataset() (Reports), getTrendById() (Trends),
 * LIBRARY_ADGROUPS/LIBRARY_MEDIA and getDashboardVariantData() are all
 * imported live. That guarantees the ids, names and numbers here are never
 * a parallel universe: they are the same objects the real module renders.
 * The one deliberate exception is Campaign URLs — RECON confirms there is no
 * seeded dummy data for it at all (Supabase-backed, empty in the demo), so
 * those 6 refs are hand-authored fresh, on the real brand roster.
 *
 * Reports is a partial exception too: its dataset is built from a private,
 * unexported string-pool generator (`reports-dummy-data.ts`), so the picks
 * below are made by FILTERING the real `getDataset(0)` output for the shapes
 * we need (a Carousel, a Flexible, one with launch provenance, plain Statics)
 * rather than indexing to hand-verified positions — deterministic (seed is
 * fixed), always real entities, but the exact ad names are whatever that
 * seed produces, not something transcribed here. Ids follow the real
 * `ad_{account}_{campaign}_{adset}_{ad}` convention, so anyone tracing a
 * ref back to reports-dummy-data.ts's own output will land on the same row.
 *
 * Every ref also gets an `analysed` state and, on formats that call for it,
 * a `sourceFormat` — Video Sage's own two edge cases (demo-video-1 still
 * analysing, demo-video-8 failed) are pulled in as-is instead of filtered
 * out, specifically so the "Video Sage actions gate on analysis" rule has a
 * real, unanalysed row to point at.
 */
import type {
  CampaignUrlExtraction,
  EntityKind,
  FlowModuleKey,
  FlowSourceRef,
} from "../flowTypes";
import { DUMMY_ADS } from "@/lib/insights-dummy-data";
import { getDummyVideos } from "@/lib/video-sage-dummy-data";
import { getDataset, type ReportEntity } from "@/lib/reports-dummy-data";
import { getTrendById } from "@/insights-trends/mocks/trendsData";
import { LIBRARY_ADGROUPS, LIBRARY_MEDIA } from "@/mocks/shared/library-items";
import { getDashboardVariantData } from "@/dashboard-variants/variantData";
import { getBrand } from "@/mocks/shared/brands";
import { getProduct } from "@/mocks/shared/products";
import { getCategory } from "@/mocks/shared/categories";

/**
 * The user's own default brand (§7.2, §7.5) — Mamaearth is FabAds' primary
 * demo brand across Dashboard, Library and Catalogue already (see
 * `src/dashboard-variants/variantData.ts`'s `userName: "Rahul"` + Mamaearth
 * recent-work rows), so it is the natural "your brand" anchor here too.
 * Read from the real brands.ts record rather than a literal string, so a
 * rename there can't silently desync this file.
 */
export const DEFAULT_BRAND_ID = "mamaearth";
export const DEFAULT_BRAND_NAME = getBrand(DEFAULT_BRAND_ID)?.name ?? "Mamaearth";

function brandEntity(id: string): { kind: "brand"; id: string; name: string } {
  return { kind: "brand", id, name: getBrand(id)?.name ?? id };
}
function productEntity(id: string): { kind: "product"; id: string; name: string } {
  return { kind: "product", id, name: getProduct(id)?.name ?? id };
}
function categoryEntity(id: string): { kind: "category"; id: string; name: string } {
  return { kind: "category", id, name: getCategory(id)?.name ?? id };
}

// ─────────────────────────────────────────────────────────────────────────
// Industry Insights — DUMMY_ADS (src/lib/insights-dummy-data.ts), 800 rows.
// competitorOwned:true on the module means the picker highlight is forced to
// DEFAULT_BRAND regardless of what's "detected" here — so these refs never
// carry a `detectedEntity` at all. There is nothing in OUR catalogue to
// detect from a rival's ad; pretending otherwise would be the bug §7.2 warns
// against, not a feature.
// ─────────────────────────────────────────────────────────────────────────

/** Hand-picked indices for spread across brand, format and analysed state —
 *  not the first N, which would all be the same few brands. */
const INSIGHTS_PICKS = [0, 1, 2, 4, 30, 32] as const;

function insightsRef(ad: (typeof DUMMY_ADS)[number]): FlowSourceRef {
  const sourceFormat: FlowSourceRef["sourceFormat"] =
    ad.adType === "Carousel" ? "carousel" : ad.mediaType;
  return {
    id: ad.id,
    module: "industry-insights" as FlowModuleKey,
    // The feed card shows the ad's PRIMARY TEXT, never its headline — a
    // banner reading "Trusted by 100K+ teams" for a card the user saw as
    // "The bag that's been on every waitlist…" looked like the wrong ad.
    // Recognition over recall: name it the way the user just saw it.
    title: ad.primaryText || ad.headline,
    subtitle: `${ad.pageName} · ${ad.adType} · ${ad.spend} spent · active ${ad.activeDuration}`,
    thumbnail: ad.thumbUrl || undefined,
    sourceBrandName: ad.brand,
    analysed: ad.analysed,
    sourceFormat,
    metrics: [
      { label: "Impressions", value: ad.impressions },
      { label: "Spend", value: ad.spend },
      { label: "Active", value: ad.activeDuration },
    ],
  };
}

function insightsRefs(): FlowSourceRef[] {
  return INSIGHTS_PICKS.map((i) => insightsRef(DUMMY_ADS[i]));
}

// ─────────────────────────────────────────────────────────────────────────
// Video Sage — getDummyVideos() (src/lib/video-sage-dummy-data.ts), 8 rows.
// demo-video-1 (analysing) and demo-video-8 (failed) are BOTH included on
// purpose — they are the only two rows in the whole catalogue that can
// demonstrate the "Video Sage actions gate on analysis" rule failing closed.
// Entity mapping is deliberately sparse: most of these titles describe
// fictional products with no real Catalogue counterpart (this is the user's
// OWN uploaded footage, not a competitor's, so an honest "nothing detected"
// is the right state for most of them — same shape as Campaign URLs' "no
// match" branch, minus the pre-select that's exclusive to §7.5).
// ─────────────────────────────────────────────────────────────────────────

const VIDEO_ENTITY: Record<string, { kind: "brand" | "product"; id: string }> = {
  "demo-video-2": { kind: "brand", id: "oziva" },
  "demo-video-3": { kind: "product", id: "plum-gh-serum" },
  "demo-video-5": { kind: "brand", id: "sleepyhead" },
  "demo-video-6": { kind: "brand", id: "supertails" },
};

function videoSageRefs(): FlowSourceRef[] {
  return getDummyVideos().map((v) => {
    const mapped = VIDEO_ENTITY[v.id];
    const detectedEntity = mapped
      ? mapped.kind === "brand"
        ? brandEntity(mapped.id)
        : productEntity(mapped.id)
      : undefined;
    const subtitle =
      v.status === "analysing"
        ? "Analysing — actions unlock once this finishes."
        : v.status === "failed"
          ? "Analysis failed — no script, concept or storyboard to reuse yet."
          : `${v.concepts_count} concept${v.concepts_count === 1 ? "" : "s"} · ${v.language} · ${v.duration_seconds}s`;
    return {
      id: v.id,
      module: "video-sage" as FlowModuleKey,
      title: v.title,
      subtitle,
      thumbnail: v.thumbnail_url,
      sourceBrandName: v.title.split(" — ")[0] || v.title,
      detectedEntity,
      analysed: v.status === "analysed",
      sourceFormat: "video",
      metrics:
        v.status === "analysed"
          ? [
              { label: "Framework", value: v.analysis?.framework.name ?? "—" },
              { label: "Duration", value: `${v.duration_seconds}s` },
              { label: "Concepts", value: String(v.concepts_count) },
            ]
          : [{ label: "Status", value: v.status }],
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Reports — getDataset(0) (src/lib/reports-dummy-data.ts). Filtered, not
// indexed: the generator is a private seeded-random pool, so we ask for the
// SHAPES we need (a Carousel, a Flexible, one with launch-distribution
// provenance, plain Statics) instead of guessing positions. dateSeed is
// fixed at 0 so this is stable across reloads.
// ─────────────────────────────────────────────────────────────────────────

const REPORT_ACCOUNT_NAMES = ["Acme Corp US", "Acme Corp EU", "BrandX Global", "ShopMax Direct", "TrendWave Media"];
/** Reports has no D2C brand roster of its own (§ RECON — it's a disjoint,
 *  fictional 5-account universe). We still need something real in OUR
 *  Catalogue for Step 2 to highlight, so each picked ad is mapped to a real
 *  brand by POSITION, not by content (the content is seeded-random and not
 *  known at authoring time). This models an agency where one ad account
 *  runs creative for one real Catalogue brand. */
const REPORT_ENTITY_BY_POSITION = ["plum", "boat", "mamaearth", "minimalist", "sleepyhead", "wow-skin-science"];

function reportAccountName(entityId: string): string {
  const a = Number(entityId.split("_")[1]);
  return REPORT_ACCOUNT_NAMES[a] ?? "Reports account";
}

/** Deterministic, non-round "days running" — ReportEntity carries no date
 *  field to derive this from honestly, so it's hashed from the id instead of
 *  a round guess. Same id → same number, every load. */
function pseudoDaysRunning(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 97;
  return 12 + (h % 58);
}

type ReportAd = ReportEntity & { creative: NonNullable<ReportEntity["creative"]> };

function pickReportAds(all: ReportAd[], pred: (e: ReportAd) => boolean, count: number, used: Set<string>): ReportAd[] {
  const out: ReportAd[] = [];
  for (const e of all) {
    if (out.length >= count) break;
    if (used.has(e.id) || !pred(e)) continue;
    out.push(e);
    used.add(e.id);
  }
  return out;
}

function reportsRefs(): FlowSourceRef[] {
  const allAds = getDataset(0).filter((e): e is ReportAd => e.level === "ad" && !!e.creative);
  const used = new Set<string>();
  const picks: ReportAd[] = [
    ...pickReportAds(allAds, (e) => e.creative.adType === "Carousel", 1, used),
    ...pickReportAds(allAds, (e) => e.creative.adType === "Flexible", 1, used),
    ...pickReportAds(allAds, (e) => !!e.sourceAdName, 1, used),
    ...pickReportAds(allAds, (e) => e.creative.adType === "Static", 3, used),
  ];
  // Safety net: only matters if the seeded tree ever comes back unusually
  // small. Pads to 6 from whatever's left, so the module never drops below
  // the min-5 bar even in that edge case.
  if (picks.length < 6) picks.push(...pickReportAds(allAds, () => true, 6 - picks.length, used));

  return picks.map((e, i) => reportRef(e, i));
}

function reportRef(e: ReportAd, i: number): FlowSourceRef {
  const catalogueBrandId = REPORT_ENTITY_BY_POSITION[i % REPORT_ENTITY_BY_POSITION.length];
  const sourceFormat: FlowSourceRef["sourceFormat"] =
    e.creative.adType === "Carousel" ? "carousel" : e.creative.adType === "Flexible" ? "flexible" : e.creative.type;
  return {
    id: e.id,
    module: "reports" as FlowModuleKey,
    title: e.sourceAdName ?? e.creative.headline,
    subtitle: `${e.creative.adGroupName} · ${e.platform} · ${e.country} · ${e.status}`,
    thumbnail: e.creative.thumbnailUrl,
    sourceBrandName: reportAccountName(e.id),
    detectedEntity: brandEntity(catalogueBrandId),
    analysed: i % 2 === 0,
    sourceFormat,
    metrics: [
      { label: "ROAS", value: `${e.metrics.roas.toFixed(2)}×` },
      { label: "Spend", value: `$${e.metrics.spend.toLocaleString()}` },
      { label: "CTR", value: `${e.metrics.ctr}%` },
      { label: "Active", value: `${pseudoDaysRunning(e.id)} days` },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Trends — getTrendById() (src/insights-trends/mocks/trendsData.ts). Exactly
// the 6 ids RECON verified. §7.4 lists a 4th behaviour — "auto-inject trends
// into Configure's suggestions rail" — that is a Configure-step behaviour
// (the suggestions rail itself), not a card action a user picks from a list,
// so it has no FlowActionId and doesn't apply here or in flowRegistry.ts.
// ─────────────────────────────────────────────────────────────────────────

const TREND_META: Record<string, { angle: string; subtitle: string; metrics: { label: string; value: string }[] }> = {
  "bs-1": {
    angle: "Algorithmic optimization — lean into a high creative-variant count rather than one hero ad.",
    subtitle: "TechCrunch · growing · high confidence",
    metrics: [
      { label: "Managed spend", value: "$10B+" },
      { label: "Stage", value: "Growing" },
    ],
  },
  "meta-1": {
    angle: "Delayed product reveal — lead with the athlete or action, reveal the product only at the end.",
    subtitle: "Nike · Meta · active 12 days",
    metrics: [
      { label: "Est. reach", value: "18M-52M" },
      { label: "Active", value: "12 days" },
    ],
  },
  "tt-1": {
    angle: 'Problem-relief hook — "the only [product] that doesn\'t [common failure]".',
    subtitle: "@beautywithbelle · 890K followers · 6.2M views",
    metrics: [
      { label: "Views", value: "6.2M" },
      { label: "Shares", value: "78K" },
    ],
  },
  "news-1": {
    angle: "New-market social commerce — localise for Spain, Italy or Poland rather than porting US/UK creative.",
    subtitle: "Digiday · emerging · TikTok Shop expansion",
    metrics: [
      { label: "New markets", value: "10" },
      { label: "Stage", value: "Emerging" },
    ],
  },
  "sd-1": {
    angle: "Sustainability-forward activewear messaging, backed by a real material or supply-chain claim.",
    subtitle: "Google Trends · interest index 100 · CA / NY / OR",
    metrics: [
      { label: "Interest index", value: "100" },
      { label: "Window", value: "7-14 days" },
    ],
  },
  "bs-5": {
    angle: "Feed-readiness — richer structured product data, aimed at AI Overview placement in Shopping ads.",
    subtitle: "Search Engine Land · emerging · ~15% of US impressions",
    metrics: [
      { label: "Rollout", value: "~15% US" },
      { label: "Stage", value: "Emerging" },
    ],
  },
};

const TREND_IDS = ["bs-1", "meta-1", "tt-1", "news-1", "sd-1", "bs-5"] as const;

type TrendMeta = (typeof TREND_META)[string];
type Trend = NonNullable<ReturnType<typeof getTrendById>>;

function trendRef(t: Trend, meta: TrendMeta | undefined): FlowSourceRef {
  const sourceFormat: FlowSourceRef["sourceFormat"] =
    t.type === "meta" ? (t.format?.toLowerCase().includes("video") ? "video" : "image") : t.type === "tiktok" ? "video" : undefined;
  return {
    id: t.id,
    module: "trends" as FlowModuleKey,
    title: t.title,
    // Curated refs carry hand-written evidence; every other trend (the module
    // renders ~29 and the host bar wires all of them) reads its own fields.
    subtitle:
      meta?.subtitle ??
      [t.source ?? t.advertiser ?? t.creator, t.readTime ?? t.format ?? t.duration].filter(Boolean).join(" · "),
    thumbnail: t.thumbnail,
    sourceBrandName: t.advertiser ?? t.creator ?? t.source ?? "Industry signal",
    sourceFormat,
    trendAngle: meta?.angle ?? t.hook ?? t.headline ?? t.excerpt,
    metrics: meta?.metrics ?? [],
  };
}

function trendsRefs(): FlowSourceRef[] {
  return TREND_IDS.map((id): FlowSourceRef | undefined => {
    const t = getTrendById(id);
    const meta = TREND_META[id];
    if (!t || !meta) return undefined;
    return trendRef(t, meta);
  }).filter((r): r is FlowSourceRef => !!r);
}

// ─────────────────────────────────────────────────────────────────────────
// Campaign URLs — hand-authored. RECON confirms there is genuinely no
// seeded data for this module (Supabase-backed, empty in the demo), so these
// 6 are fresh, built on the real brand + product roster wherever they match,
// and on two invented client brands where they deliberately DON'T — the
// no-match branch of §7.5 needs at least one honestly-unmatched landing
// page, not a match forced for convenience.
// ─────────────────────────────────────────────────────────────────────────

function extraction(
  url: string,
  product: string,
  offer: string,
  claims: string[],
  images: string[],
  matchedProductId?: string,
): CampaignUrlExtraction {
  return { url, product, offer, claims, images, matchedProductId };
}

const CAMPAIGN_URL_REFS: FlowSourceRef[] = [
  {
    id: "cu-mamaearth-onion",
    module: "campaign-urls",
    title: "mamaearth.in/onion-shampoo",
    subtitle: "Landing page · matched Onion Hair Shampoo",
    thumbnail: "https://picsum.photos/seed/cu-mamaearth-onion/800/500",
    sourceBrandName: "Mamaearth",
    detectedEntity: productEntity("mamaearth-onion-shampoo"),
    sourceFormat: "image",
    extraction: extraction(
      "https://mamaearth.in/onion-shampoo?utm_source=fb&utm_campaign=hairfall_sep",
      getProduct("mamaearth-onion-shampoo")?.name ?? "Onion Hair Shampoo for Hair Fall Control",
      "Buy 2 Get 1 Free",
      ["reduces hair fall", "strengthens roots", "biotin-enriched", "sulfate-free"],
      ["https://picsum.photos/seed/cu-mamaearth-onion-1/800/800", "https://picsum.photos/seed/cu-mamaearth-onion-2/800/800"],
      "mamaearth-onion-shampoo",
    ),
  },
  {
    id: "cu-boat-airdopes",
    module: "campaign-urls",
    title: "boat-lifestyle.com/airdopes-141",
    subtitle: "Landing page · matched Airdopes 141",
    thumbnail: "https://picsum.photos/seed/cu-boat-airdopes/800/500",
    sourceBrandName: "boAt",
    detectedEntity: productEntity("boat-airdopes-141"),
    sourceFormat: "image",
    extraction: extraction(
      "https://boat-lifestyle.com/airdopes-141?utm_source=fb&utm_campaign=audio_sep",
      getProduct("boat-airdopes-141")?.name ?? "Airdopes 141 with 42hr Battery",
      "Buy 2 ₹2,099",
      ["42hr battery", "ENx tech", "ASAP charge", "Beast Mode"],
      ["https://picsum.photos/seed/cu-boat-airdopes-1/800/800"],
      "boat-airdopes-141",
    ),
  },
  {
    id: "cu-sleepyhead-mattress",
    module: "campaign-urls",
    title: "sleepyhead.in/original-mattress",
    subtitle: "Landing page · matched The Original Memory Foam Mattress",
    thumbnail: "https://picsum.photos/seed/cu-sleepyhead-mattress/800/500",
    sourceBrandName: "Sleepyhead",
    detectedEntity: productEntity("sleepyhead-original-mattress"),
    sourceFormat: "image",
    extraction: extraction(
      "https://sleepyhead.in/original-mattress?utm_source=fb&utm_campaign=monsoon_sep",
      getProduct("sleepyhead-original-mattress")?.name ?? "The Original Memory Foam Mattress",
      "30% OFF + Free Pillow",
      ["memory foam", "100-night trial", "CertiPUR-US", "made in India"],
      ["https://picsum.photos/seed/cu-sleepyhead-mattress-1/800/800", "https://picsum.photos/seed/cu-sleepyhead-mattress-2/800/800"],
      "sleepyhead-original-mattress",
    ),
  },
  {
    id: "cu-plum-serum",
    module: "campaign-urls",
    title: "plumgoodness.com/gt-serum",
    subtitle: "Landing page · matched Green Tea Skin Clarifying Serum",
    thumbnail: "https://picsum.photos/seed/cu-plum-serum/800/500",
    sourceBrandName: "Plum Goodness",
    detectedEntity: productEntity("plum-gh-serum"),
    sourceFormat: "image",
    extraction: extraction(
      "https://plumgoodness.com/gt-serum?utm_source=fb&utm_campaign=acne_clear_sep",
      getProduct("plum-gh-serum")?.name ?? "Green Tea Skin Clarifying Serum",
      "20% off first order",
      ["fades acne marks", "2% niacinamide", "oil-control", "vegan"],
      ["https://picsum.photos/seed/cu-plum-serum-1/800/800"],
      "plum-gh-serum",
    ),
  },
  {
    id: "cu-freshglow-vitc",
    module: "campaign-urls",
    title: "freshglowlabs.in/vitamin-c-serum",
    subtitle: "Landing page · no catalogue match",
    thumbnail: "https://picsum.photos/seed/cu-freshglow-vitc/800/500",
    sourceBrandName: "FreshGlow Labs",
    // No detectedEntity on purpose — FreshGlow Labs isn't in Catalogue yet.
    // §7.5: the picker opens neutral, DEFAULT_BRAND highlighted.
    sourceFormat: "image",
    extraction: extraction(
      "https://freshglowlabs.in/vitamin-c-serum?utm_source=ig&utm_campaign=launch_sep",
      "Vitamin C Brightening Serum",
      "Flat 25% off first order",
      ["10% vitamin C", "visible brightening in 2 weeks", "fragrance-free"],
      ["https://picsum.photos/seed/cu-freshglow-vitc-1/800/800"],
      undefined,
    ),
  },
  {
    id: "cu-vedantika-ashwagandha",
    module: "campaign-urls",
    title: "vedantikawellness.com/ashwagandha-gummies",
    subtitle: "Landing page · no catalogue match",
    thumbnail: "https://picsum.photos/seed/cu-vedantika-ashwagandha/800/500",
    sourceBrandName: "Vedantika Wellness",
    sourceFormat: "image",
    extraction: extraction(
      "https://vedantikawellness.com/ashwagandha-gummies?utm_source=fb&utm_campaign=stress_sep",
      "Ashwagandha Stress Relief Gummies — 30 Day Pack",
      "₹200 off with code CALM200",
      ["KSM-66 ashwagandha", "clinically studied dose", "vegan", "no melatonin"],
      ["https://picsum.photos/seed/cu-vedantika-ashwagandha-1/800/800"],
      undefined,
    ),
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Creative Library — LIBRARY_ADGROUPS (src/mocks/shared/library-items.ts).
// §7.6: folders get no manual action, only a single Ad — so every ref here
// is adgroup-level (a full ad: media + headline + primary + CTA), never a
// bare folder or a loose media file.
// ─────────────────────────────────────────────────────────────────────────

/** library-items.ts runs its own brand-id namespace, distinct from
 *  Catalogue's in one case ("wow-skin" here vs "wow-skin-science" there). */
const LIBRARY_BRAND_TO_CATALOGUE: Record<string, string> = {
  mamaearth: "mamaearth",
  boat: "boat",
  sleepyhead: "sleepyhead",
  "wow-skin": "wow-skin-science",
  plum: "plum",
  mcaffeine: "mcaffeine",
  "the-derma-co": "the-derma-co",
  minimalist: "minimalist",
};

const CREATIVE_LIBRARY_IDS = [
  "lib-adg-mamaearth-1",
  "lib-adg-boat-1",
  "lib-adg-plum-4",
  "lib-adg-sleepyhead-1",
  "lib-adg-wow-skin-1",
  "lib-adg-the-derma-co-3",
];

function creativeLibraryRef(adg: (typeof LIBRARY_ADGROUPS)[number], i: number): FlowSourceRef {
  const media = adg.media_ids.map((mid) => LIBRARY_MEDIA.find((m) => m.id === mid)).find((m): m is NonNullable<typeof m> => !!m);
  const catalogueBrandId = adg.brand_id ? LIBRARY_BRAND_TO_CATALOGUE[adg.brand_id] : undefined;
  const sourceFormat: FlowSourceRef["sourceFormat"] =
    adg.ad_type === "Carousel" ? "carousel" : media?.file_type === "video" ? "video" : "image";
  return {
    id: adg.id,
    module: "creative-library" as FlowModuleKey,
    title: adg.name,
    subtitle: `${adg.page_name} · ${adg.ad_type} · ${adg.source === "pinned-insights" ? "pinned from Insights" : "generated"}`,
    thumbnail: media?.url,
    sourceBrandName: adg.page_name,
    detectedEntity: catalogueBrandId ? brandEntity(catalogueBrandId) : undefined,
    analysed: i % 2 === 0,
    sourceFormat,
    metrics: [
      { label: "Quality", value: String(adg.quality_score ?? "—") },
      { label: "CTA", value: adg.cta },
    ],
  };
}

function creativeLibraryRefs(): FlowSourceRef[] {
  return CREATIVE_LIBRARY_IDS.map((id, i): FlowSourceRef | undefined => {
    const adg = LIBRARY_ADGROUPS.find((a) => a.id === id);
    return adg ? creativeLibraryRef(adg, i) : undefined;
  }).filter((r): r is FlowSourceRef => !!r);
}

/** The Creative Library's media-tile kebab passes a MEDIA id (`lib-media-*`),
 *  not an adgroup id — resolve it through the adgroup that carries it so the
 *  single-ad redirect (§7.6) works from every tile, not only the 6 curated
 *  adgroups. The ref keeps the media id so the URL round-trips. */
function libraryMediaRef(mediaId: string): FlowSourceRef | undefined {
  const media = LIBRARY_MEDIA.find((m) => m.id === mediaId);
  if (!media) return undefined;
  const adg = LIBRARY_ADGROUPS.find((a) => a.media_ids.includes(mediaId));
  if (!adg) return undefined;
  const base = creativeLibraryRef(adg, mediaId.length);
  return { ...base, id: mediaId, thumbnail: media.url ?? base.thumbnail, sourceFormat: media.file_type === "video" ? "video" : base.sourceFormat };
}

// ─────────────────────────────────────────────────────────────────────────
// Dashboard — getDashboardVariantData() (src/dashboard-variants/variantData.ts).
// §7.7: Dashboard surfaces actions on the Trends/Industry Insights/Reports
// data it shows, so these pull from `recentlyFetched` (Insights-flavoured
// fetched-ad batches) and `newAdsFetched`. `recentWork` (g-2) is included too,
// per BRIEF — it's Genie's OWN past output rather than a third-party source,
// which is exactly why it's a good fit for "Generate variation" specifically:
// the Dashboard card lets the user iterate on something they already made,
// without leaving the Dashboard to go find it in the Library.
// ─────────────────────────────────────────────────────────────────────────

interface DashboardPick {
  id: string;
  from: "recentlyFetched" | "newAdsFetched" | "recentWork";
  entity?: { kind: EntityKind; id: string };
  /** The dashboard row is labelled `status: "Competitor"` in variantData —
   *  §7.2 applies to it exactly as to an Industry Insights ad. */
  competitor?: boolean;
}

const DASHBOARD_PICKS: DashboardPick[] = [
  { id: "mamaearth-f", from: "recentlyFetched", entity: { kind: "brand", id: "mamaearth" } },
  // boAt / Noise are COMPETITOR rows (variantData.ts `status: "Competitor"`).
  // They carry no catalogue entity on purpose: with one, the variation
  // action pre-SELECTED boAt as the brand of the user's new ad.
  { id: "boat-f", from: "recentlyFetched", competitor: true },
  { id: "noise-f", from: "recentlyFetched", competitor: true },
  { id: "skincare-f", from: "recentlyFetched", entity: { kind: "category", id: "skin-care" } },
  { id: "sleepyhead", from: "newAdsFetched", entity: { kind: "brand", id: "sleepyhead" } },
  { id: "g-2", from: "recentWork", entity: { kind: "brand", id: "mamaearth" } },
];

function dashboardRefs(): FlowSourceRef[] {
  const data = getDashboardVariantData();
  return DASHBOARD_PICKS.map((p): FlowSourceRef | undefined => {
    const item = data[p.from].find((x) => x.id === p.id);
    if (!item) return undefined;
    const detectedEntity = p.entity
      ? p.entity.kind === "category"
        ? categoryEntity(p.entity.id)
        : brandEntity(p.entity.id)
      : undefined;
    return {
      id: `dash-${item.id}`,
      module: "dashboard" as FlowModuleKey,
      title: item.title,
      subtitle: item.time ? `${item.sub} · ${item.time}` : item.sub,
      sourceBrandName: item.title,
      detectedEntity,
      competitorOwned: p.competitor || undefined,
      analysed: p.from === "recentWork" ? true : undefined,
      sourceFormat: p.from === "recentWork" ? (item.sub.toLowerCase().includes("video") ? "video" : "image") : undefined,
    };
  }).filter((r): r is FlowSourceRef => !!r);
}

// ─────────────────────────────────────────────────────────────────────────
// Assembled catalogue — 6 + 8 + 6 + 6 + 6 + 6 + 6 = 44 across the 7 live
// modules, every one at or above the min-5 bar.
// ─────────────────────────────────────────────────────────────────────────

export const FLOW_SOURCES: FlowSourceRef[] = [
  ...insightsRefs(),
  ...videoSageRefs(),
  ...reportsRefs(),
  ...trendsRefs(),
  ...CAMPAIGN_URL_REFS,
  ...creativeLibraryRefs(),
  ...dashboardRefs(),
];

export function sourcesForModule(key: FlowModuleKey): FlowSourceRef[] {
  return FLOW_SOURCES.filter((s) => s.module === key);
}

export function getFlowSource(id: string): FlowSourceRef | undefined {
  return FLOW_SOURCES.find((s) => s.id === id) ?? resolveLazySource(id);
}

/**
 * Module-side entry points (Insights cards, Trends bars, Reports rows,
 * Creative Library tiles) pass the id of WHATEVER row the user clicked — 800
 * Insights ads, ~29 trends, hundreds of report ads. FLOW_SOURCES above is the
 * curated Other Flows browsing surface, not a mirror of those modules, so a
 * ref it doesn't carry is built on demand from the module's own live data
 * with the SAME builders. Before this, "Send to Genie" on 794 of 800 Insights
 * ads resolved to null and opened a bare, unbannered Studio.
 */
const lazyCache = new Map<string, FlowSourceRef | undefined>();
function resolveLazySource(id: string): FlowSourceRef | undefined {
  if (lazyCache.has(id)) return lazyCache.get(id);
  let ref: FlowSourceRef | undefined;
  const ad = DUMMY_ADS.find((a) => a.id === id || a.adId === id);
  if (ad) ref = insightsRef(ad);
  if (!ref) {
    const t = getTrendById(id);
    if (t) ref = trendRef(t, TREND_META[id]);
  }
  if (!ref) {
    const e = getDataset(0).find((x) => x.id === id);
    if (e && e.level === "ad" && e.creative) {
      const seed = Array.from(id).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
      ref = reportRef(e as ReportAd, seed);
    }
  }
  if (!ref) ref = libraryMediaRef(id);
  lazyCache.set(id, ref);
  return ref;
}
