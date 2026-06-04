import type { LaunchStrategy } from "@/lib/launch-distribution";

// ── Types ──────────────────────────────────────────────────────────

export type EntityLevel = "account" | "campaign" | "adset" | "ad";
export type EntityStatus = "Active" | "Paused" | "Archived";
export type Platform = "Meta" | "Google" | "TikTok";
export type CreativeType = "image" | "video";
export type AdType = "Static" | "Flexible" | "Carousel";
export type Objective = "Conversions" | "Traffic" | "Awareness" | "Engagement";
export type BudgetType = "Daily" | "Lifetime";

export interface ReportMetrics {
  spend: number;
  revenue: number;
  roas: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpa: number;
  cpc: number;
  cpm: number;
  conversions: number;
  margin: number;
  marginPercent: number;
}

export interface VideoEngagement {
  hookRate: number;
  playRate: number;
  completionRate: number;
  avgPlayTime: number;
}

export interface CreativeData {
  id: string;
  adId: string;
  type: CreativeType;
  adGroupName: string;
  thumbnailUrl: string;
  primaryText: string;
  headline: string;
  description: string;
  mediaCount: number;
  adType: AdType;
  createdAt: string;
  videoEngagement?: VideoEngagement;
}

export interface ReportEntity {
  id: string;
  name: string;
  parentId: string | null;
  level: EntityLevel;
  status: EntityStatus;
  platform: Platform;
  country: string;
  objective?: Objective;
  budgetType?: BudgetType;
  budgetValue?: number;
  metrics: ReportMetrics;
  creative?: CreativeData;
  parentName?: string;
  // ── Bulk Launch Distribution provenance (optional) ───────────────
  // Tagged on a subset of entities so the analytics report can be filtered
  // by where an entity came from. Absent on entities not produced by a
  // distributed bulk launch.
  launchBatchId?: string;
  launchStrategy?: LaunchStrategy;
  destinationFbPageId?: string;
  destinationPageName?: string;
  destinationAdAccountName?: string;
  sourceAdName?: string;
}

// ── Seeded random ─────────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

// ── Generator ─────────────────────────────────────────────────────

const PLATFORMS: Platform[] = ["Meta", "Google", "TikTok"];
const STATUSES: EntityStatus[] = ["Active", "Paused", "Archived"];
const COUNTRIES = ["US", "UK", "DE", "FR", "BR", "AU", "CA", "JP"];
const OBJECTIVES: Objective[] = ["Conversions", "Traffic", "Awareness", "Engagement"];
const BUDGET_TYPES: BudgetType[] = ["Daily", "Lifetime"];
const AD_TYPES: AdType[] = ["Static", "Flexible", "Carousel"];
const AD_GROUP_NAMES = [
  "Summer Sale Creatives", "Brand Awareness Pack", "Retargeting Bundle",
  "UGC Collection", "Holiday Special", "Product Launch", "Evergreen Set",
  "Lookalike Audience", "Dynamic Catalog", "Seasonal Promo",
];
const THUMBNAILS = [
  "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1563986768609-322da13575f2?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=200&h=200&fit=crop",
];
const HEADLINES = [
  "Shop Now & Save 50%", "Limited Time Offer", "Free Shipping Today",
  "New Collection Out", "Best Deals Inside", "Don't Miss Out",
];
const PRIMARY_TEXTS = [
  "Discover our latest products at unbeatable prices.",
  "Transform your routine with our bestsellers.",
  "Join thousands of happy customers today.",
  "Quality meets affordability — shop now.",
];
const DESCRIPTIONS = [
  "Premium quality guaranteed", "Fast & free delivery",
  "30-day money-back guarantee", "Trusted by 10K+ customers",
];

// ── Bulk Launch Distribution provenance pools ────────────────────────
// A subset of ad-level entities is tagged as having come from a distributed
// bulk launch. These power the analytics provenance filters.
const LAUNCH_BATCHES = [
  { id: "batch_spring", strategy: "fill_first" as LaunchStrategy },
  { id: "batch_summer", strategy: "equal" as LaunchStrategy },
  { id: "batch_bfcm", strategy: "duplicate" as LaunchStrategy },
];
const DESTINATION_PAGES = [
  { fbPageId: "fbp_brand_001", pageName: "Acme Brand Page", accountName: "Acme Corp US" },
  // Same Facebook Page identity linked under a DIFFERENT account (shared page).
  { fbPageId: "fbp_brand_001", pageName: "Acme Brand Page", accountName: "Acme Corp EU" },
  { fbPageId: "fbp_shop_002", pageName: "ShopMax Storefront", accountName: "ShopMax Direct" },
  { fbPageId: "fbp_trend_003", pageName: "TrendWave Page", accountName: "TrendWave Media" },
];
const SOURCE_AD_NAMES_POOL = [
  "UGC Hook — Skin Glow", "Static — Bold Discount", "Carousel — Bestsellers",
  "Video — Founder Story", "Static — Social Proof",
];

function generateMetrics(rand: () => number, scale: number): ReportMetrics {
  const spend = Math.round(rand() * 5000 * scale + 500);
  const roas = +(rand() * 4 + 0.5).toFixed(2);
  const revenue = Math.round(spend * roas);
  const impressions = Math.round(spend * (rand() * 30 + 10));
  const clicks = Math.round(impressions * (rand() * 0.04 + 0.005));
  const conversions = Math.round(clicks * (rand() * 0.15 + 0.02));
  const ctr = +(clicks / Math.max(impressions, 1) * 100).toFixed(2);
  const cpa = conversions > 0 ? +(spend / conversions).toFixed(2) : 0;
  const cpc = clicks > 0 ? +(spend / clicks).toFixed(2) : 0;
  const cpm = impressions > 0 ? +(spend / impressions * 1000).toFixed(2) : 0;
  const margin = revenue - spend;
  const marginPercent = revenue > 0 ? +((margin / revenue) * 100).toFixed(1) : 0;
  return { spend, revenue, roas, impressions, clicks, ctr, cpa, cpc, cpm, conversions, margin, marginPercent };
}

function generateVideoEngagement(rand: () => number): VideoEngagement {
  return {
    hookRate: +(rand() * 40 + 20).toFixed(1),
    playRate: +(rand() * 50 + 30).toFixed(1),
    completionRate: +(rand() * 30 + 10).toFixed(1),
    avgPlayTime: +(rand() * 12 + 3).toFixed(1),
  };
}

export function generateDataset(dateSeed = 0): ReportEntity[] {
  const rand = seededRandom(42 + dateSeed);
  const entities: ReportEntity[] = [];

  const accountNames = [
    "Acme Corp US", "Acme Corp EU", "BrandX Global",
    "ShopMax Direct", "TrendWave Media",
  ];

  for (let a = 0; a < 5; a++) {
    const accId = `acc_${a}`;
    const accPlatform = PLATFORMS[a % 3];
    const accCountry = COUNTRIES[a % COUNTRIES.length];
    entities.push({
      id: accId, name: accountNames[a], parentId: null, level: "account",
      status: pick(["Active", "Active", "Paused"] as EntityStatus[], rand),
      platform: accPlatform, country: accCountry,
      metrics: generateMetrics(rand, 10),
    });

    const numCampaigns = Math.floor(rand() * 3) + 3;
    for (let c = 0; c < numCampaigns; c++) {
      const cmpId = `cmp_${a}_${c}`;
      const obj = pick(OBJECTIVES, rand);
      entities.push({
        id: cmpId, name: `Campaign ${obj} #${a * 10 + c + 1}`, parentId: accId,
        level: "campaign", status: pick(STATUSES, rand), platform: accPlatform,
        country: accCountry, objective: obj,
        metrics: generateMetrics(rand, 5), parentName: accountNames[a],
      });

      const numAdsets = Math.floor(rand() * 3) + 2;
      for (let s = 0; s < numAdsets; s++) {
        const asId = `as_${a}_${c}_${s}`;
        const bt = pick(BUDGET_TYPES, rand);
        entities.push({
          id: asId, name: `AdSet ${bt} #${a * 100 + c * 10 + s + 1}`,
          parentId: cmpId, level: "adset", status: pick(STATUSES, rand),
          platform: accPlatform, country: accCountry,
          budgetType: bt, budgetValue: Math.round(rand() * 500 + 50),
          metrics: generateMetrics(rand, 2),
          parentName: `Campaign ${obj} #${a * 10 + c + 1}`,
        });

        const numAds = Math.floor(rand() * 4) + 2;
        for (let d = 0; d < numAds; d++) {
          const adId = `ad_${a}_${c}_${s}_${d}`;
          const creativeType: CreativeType = rand() > 0.5 ? "image" : "video";
          const adType = pick(AD_TYPES, rand);
          // Tag ~40% of ads with bulk-launch provenance (deterministic via rand).
          const isDistributed = rand() < 0.4;
          const batch = isDistributed ? pick(LAUNCH_BATCHES, rand) : null;
          const dest = isDistributed ? pick(DESTINATION_PAGES, rand) : null;
          entities.push({
            id: adId, name: `Ad ${adType} #${a * 1000 + c * 100 + s * 10 + d + 1}`,
            parentId: asId, level: "ad", status: pick(STATUSES, rand),
            platform: accPlatform, country: accCountry,
            metrics: generateMetrics(rand, 1),
            parentName: `AdSet ${bt} #${a * 100 + c * 10 + s + 1}`,
            ...(batch && dest
              ? {
                  launchBatchId: batch.id,
                  launchStrategy: batch.strategy,
                  destinationFbPageId: dest.fbPageId,
                  destinationPageName: dest.pageName,
                  destinationAdAccountName: dest.accountName,
                  sourceAdName: pick(SOURCE_AD_NAMES_POOL, rand),
                }
              : {}),
            creative: {
              id: `cr_${adId}`, adId,
              type: creativeType,
              adGroupName: pick(AD_GROUP_NAMES, rand),
              thumbnailUrl: pick(THUMBNAILS, rand),
              primaryText: pick(PRIMARY_TEXTS, rand),
              headline: pick(HEADLINES, rand),
              description: pick(DESCRIPTIONS, rand),
              mediaCount: Math.floor(rand() * 4) + 1,
              adType,
              createdAt: new Date(2025, Math.floor(rand() * 12), Math.floor(rand() * 28) + 1).toISOString(),
              ...(creativeType === "video" ? { videoEngagement: generateVideoEngagement(rand) } : {}),
            },
          });
        }
      }
    }
  }

  return entities;
}

// ── Selectors ─────────────────────────────────────────────────────

const _cache = new Map<number, ReportEntity[]>();

function getBaseDataset(dateSeed = 0): ReportEntity[] {
  if (!_cache.has(dateSeed)) _cache.set(dateSeed, generateDataset(dateSeed));
  return _cache.get(dateSeed)!;
}

// ── Launch-scope deterministic attribution ────────────────────────────
// A real launch id (e.g. a UUID from the launches table) will never match
// the random `batch_*` provenance tags baked into the dummy data, so a naive
// `launchBatchId === <realId>` filter would always be empty. To keep the demo
// realistic, when a launch scope is requested we clone the dataset and
// deterministically attribute a hash-seeded subset (~8-15 rows spanning every
// level, including image-type creatives) to that launch. The base cache is
// never mutated, so unscoped views are unaffected.

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Keep it a positive 31-bit int so it seeds seededRandom cleanly.
  return (h >>> 0) % 2147483646 + 1;
}

const _scopedCache = new Map<string, ReportEntity[]>();

// Pick `count` deterministic distinct items from `pool` using `rand`.
function sampleDeterministic<T>(pool: T[], count: number, rand: () => number): T[] {
  if (pool.length <= count) return [...pool];
  const idxs = pool.map((_, i) => i);
  // Fisher-Yates driven by the seeded rng, then take the first `count`.
  for (let i = idxs.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
  }
  return idxs.slice(0, count).map((i) => pool[i]);
}

function buildScopedDataset(launchScopeId: string, dateSeed: number): ReportEntity[] {
  const base = getBaseDataset(dateSeed);
  const rand = seededRandom(hashString(launchScopeId));
  // Stable strategy for this launch (so the Launch Strategy column is coherent).
  const strategy = pick(LAUNCH_BATCHES, rand).strategy;
  const dest = pick(DESTINATION_PAGES, rand);
  const sourceAd = pick(SOURCE_AD_NAMES_POOL, rand);

  // Choose a deterministic subset at each level. Guarantee that some image-type
  // ads are included so the creative (image) report is non-empty as well.
  const tagIds = new Set<string>();
  const add = (items: ReportEntity[], count: number) => {
    for (const e of sampleDeterministic(items, count, rand)) tagIds.add(e.id);
  };

  add(base.filter((e) => e.level === "account"), 2);
  add(base.filter((e) => e.level === "campaign"), 3);
  add(base.filter((e) => e.level === "adset"), 3);
  add(base.filter((e) => e.level === "ad" && e.creative?.type === "image"), 3);
  add(base.filter((e) => e.level === "ad" && e.creative?.type === "video"), 2);

  return base.map((e) =>
    tagIds.has(e.id)
      ? {
          ...e,
          launchBatchId: launchScopeId,
          launchStrategy: strategy,
          destinationFbPageId: dest.fbPageId,
          destinationPageName: dest.pageName,
          destinationAdAccountName: dest.accountName,
          sourceAdName: sourceAd,
        }
      : e
  );
}

/**
 * Returns the report dataset. When `launchScopeId` is provided, a deterministic
 * subset of rows (spanning all levels) is attributed to that launch so a
 * `launchBatchId === launchScopeId` filter yields a realistic non-empty set.
 */
export function getDataset(dateSeed = 0, launchScopeId?: string | null): ReportEntity[] {
  if (!launchScopeId) return getBaseDataset(dateSeed);
  const key = `${dateSeed}::${launchScopeId}`;
  if (!_scopedCache.has(key)) _scopedCache.set(key, buildScopedDataset(launchScopeId, dateSeed));
  return _scopedCache.get(key)!;
}

export function getByLevel(level: EntityLevel, dateSeed = 0, launchScopeId?: string | null): ReportEntity[] {
  return getDataset(dateSeed, launchScopeId).filter((e) => e.level === level);
}

export function getChildren(parentId: string, dateSeed = 0): ReportEntity[] {
  return getDataset(dateSeed).filter((e) => e.parentId === parentId);
}

export function getById(id: string, dateSeed = 0): ReportEntity | undefined {
  return getDataset(dateSeed).find((e) => e.id === id);
}

export function aggregateMetrics(entities: ReportEntity[]): ReportMetrics {
  const m: ReportMetrics = {
    spend: 0, revenue: 0, roas: 0, impressions: 0, clicks: 0,
    ctr: 0, cpa: 0, cpc: 0, cpm: 0, conversions: 0, margin: 0, marginPercent: 0,
  };
  for (const e of entities) {
    m.spend += e.metrics.spend;
    m.revenue += e.metrics.revenue;
    m.impressions += e.metrics.impressions;
    m.clicks += e.metrics.clicks;
    m.conversions += e.metrics.conversions;
  }
  m.roas = m.spend > 0 ? +(m.revenue / m.spend).toFixed(2) : 0;
  m.ctr = m.impressions > 0 ? +(m.clicks / m.impressions * 100).toFixed(2) : 0;
  m.cpa = m.conversions > 0 ? +(m.spend / m.conversions).toFixed(2) : 0;
  m.cpc = m.clicks > 0 ? +(m.spend / m.clicks).toFixed(2) : 0;
  m.cpm = m.impressions > 0 ? +(m.spend / m.impressions * 1000).toFixed(2) : 0;
  m.margin = m.revenue - m.spend;
  m.marginPercent = m.revenue > 0 ? +((m.margin / m.revenue) * 100).toFixed(1) : 0;
  return m;
}

// ── Column definitions ────────────────────────────────────────────

export interface ColumnDef {
  key: string;
  label: string;
  numeric?: boolean;
  format?: (v: number) => string;
  width?: string;
}

const fmt = {
  currency: (v: number) => `$${v.toLocaleString()}`,
  number: (v: number) => v.toLocaleString(),
  percent: (v: number) => `${v}%`,
  decimal: (v: number) => v.toFixed(2),
};

export const METRIC_COLUMNS: ColumnDef[] = [
  { key: "spend", label: "Spend", numeric: true, format: fmt.currency },
  { key: "revenue", label: "Revenue", numeric: true, format: fmt.currency },
  { key: "roas", label: "ROAS", numeric: true, format: fmt.decimal },
  { key: "impressions", label: "Impressions", numeric: true, format: fmt.number },
  { key: "clicks", label: "Clicks", numeric: true, format: fmt.number },
  { key: "ctr", label: "CTR", numeric: true, format: fmt.percent },
  { key: "cpa", label: "CPA", numeric: true, format: fmt.currency },
  { key: "margin", label: "Margin", numeric: true, format: fmt.currency },
];

export const ENGAGEMENT_COLUMNS: ColumnDef[] = [
  { key: "hookRate", label: "Hook Rate", numeric: true, format: fmt.percent },
  { key: "playRate", label: "Play Rate", numeric: true, format: fmt.percent },
  { key: "completionRate", label: "Completion", numeric: true, format: fmt.percent },
];

// ── Grouping options per page ─────────────────────────────────────

export interface GroupingOption {
  value: string;
  label: string;
  getKey: (e: ReportEntity) => string;
}

// Human labels for the launch strategy enum (used in grouping + chips).
export const STRATEGY_LABELS: Record<string, string> = {
  fill_first: "Fill First",
  equal: "Equal Distribution",
  duplicate: "Duplicate to Each",
};

export const GROUPING_OPTIONS: Record<string, GroupingOption[]> = {
  accounts: [
    { value: "platform", label: "Platform", getKey: (e) => e.platform },
    { value: "status", label: "Status", getKey: (e) => e.status },
    { value: "country", label: "Country", getKey: (e) => e.country },
  ],
  campaigns: [
    { value: "parentName", label: "Ad Account", getKey: (e) => e.parentName || "Unknown" },
    { value: "status", label: "Status", getKey: (e) => e.status },
    { value: "objective", label: "Objective", getKey: (e) => e.objective || "Unknown" },
    { value: "platform", label: "Platform", getKey: (e) => e.platform },
  ],
  adsets: [
    { value: "parentName", label: "Campaign", getKey: (e) => e.parentName || "Unknown" },
    { value: "status", label: "Status", getKey: (e) => e.status },
    { value: "budgetType", label: "Budget Type", getKey: (e) => e.budgetType || "Unknown" },
  ],
  ads: [
    { value: "parentName", label: "Ad Set", getKey: (e) => e.parentName || "Unknown" },
    { value: "status", label: "Status", getKey: (e) => e.status },
    { value: "platform", label: "Platform", getKey: (e) => e.platform },
    { value: "launchStrategy", label: "Launch Strategy", getKey: (e) => STRATEGY_LABELS[e.launchStrategy ?? ""] ?? "Not from launch" },
    { value: "launchBatchId", label: "Launch Batch", getKey: (e) => e.launchBatchId || "Not from launch" },
    { value: "destinationPageName", label: "Destination Page", getKey: (e) => e.destinationPageName || "Not from launch" },
    { value: "destinationAdAccountName", label: "Destination Account", getKey: (e) => e.destinationAdAccountName || "Not from launch" },
    { value: "sourceAdName", label: "Source Ad", getKey: (e) => e.sourceAdName || "Not from launch" },
  ],
  creativeImage: [
    { value: "adGroupName", label: "Ad Group", getKey: (e) => e.creative?.adGroupName || "Unknown" },
    { value: "status", label: "Status", getKey: (e) => e.status },
    { value: "platform", label: "Platform", getKey: (e) => e.platform },
  ],
  creativeVideo: [
    { value: "adGroupName", label: "Ad Group", getKey: (e) => e.creative?.adGroupName || "Unknown" },
    { value: "status", label: "Status", getKey: (e) => e.status },
    { value: "platform", label: "Platform", getKey: (e) => e.platform },
  ],
  adGroups: [
    { value: "status", label: "Status", getKey: (e) => e.status },
    { value: "platform", label: "Platform", getKey: (e) => e.platform },
  ],
};

// ── Launch provenance filter options ─────────────────────────────────
// Derived from the dataset so the toolbar dropdowns only offer values that
// actually appear. The Launch Strategy axis is fixed (the 3 strategies).

export interface LaunchFilterOption {
  value: string;
  label: string;
}

export interface LaunchFilterOptions {
  strategies: LaunchFilterOption[]; // rendered as chips
  batches: LaunchFilterOption[];
  destinationPages: LaunchFilterOption[]; // value = fb_page_id
  destinationAccounts: LaunchFilterOption[];
  sourceAds: LaunchFilterOption[];
}

const BATCH_LABELS: Record<string, string> = {
  batch_spring: "Spring Sale",
  batch_summer: "Summer Drop",
  batch_bfcm: "BFCM Blast",
};

export function getLaunchFilterOptions(dateSeed = 0): LaunchFilterOptions {
  const ads = getByLevel("ad", dateSeed);

  const batchIds = new Set<string>();
  const pages = new Map<string, string>(); // fb_page_id -> page name
  const accounts = new Set<string>();
  const sourceAds = new Set<string>();

  for (const e of ads) {
    if (e.launchBatchId) batchIds.add(e.launchBatchId);
    if (e.destinationFbPageId) pages.set(e.destinationFbPageId, e.destinationPageName || e.destinationFbPageId);
    if (e.destinationAdAccountName) accounts.add(e.destinationAdAccountName);
    if (e.sourceAdName) sourceAds.add(e.sourceAdName);
  }

  const sortOpt = (a: LaunchFilterOption, b: LaunchFilterOption) => a.label.localeCompare(b.label);

  return {
    strategies: Object.entries(STRATEGY_LABELS).map(([value, label]) => ({ value, label })),
    batches: Array.from(batchIds)
      .map((id) => ({ value: id, label: BATCH_LABELS[id] ?? id }))
      .sort(sortOpt),
    destinationPages: Array.from(pages.entries())
      .map(([value, label]) => ({ value, label }))
      .sort(sortOpt),
    destinationAccounts: Array.from(accounts)
      .map((a) => ({ value: a, label: a }))
      .sort(sortOpt),
    sourceAds: Array.from(sourceAds)
      .map((s) => ({ value: s, label: s }))
      .sort(sortOpt),
  };
}
