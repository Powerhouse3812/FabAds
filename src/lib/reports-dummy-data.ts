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
          entities.push({
            id: adId, name: `Ad ${adType} #${a * 1000 + c * 100 + s * 10 + d + 1}`,
            parentId: asId, level: "ad", status: pick(STATUSES, rand),
            platform: accPlatform, country: accCountry,
            metrics: generateMetrics(rand, 1),
            parentName: `AdSet ${bt} #${a * 100 + c * 10 + s + 1}`,
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

export function getDataset(dateSeed = 0): ReportEntity[] {
  if (!_cache.has(dateSeed)) _cache.set(dateSeed, generateDataset(dateSeed));
  return _cache.get(dateSeed)!;
}

export function getByLevel(level: EntityLevel, dateSeed = 0): ReportEntity[] {
  return getDataset(dateSeed).filter((e) => e.level === level);
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
