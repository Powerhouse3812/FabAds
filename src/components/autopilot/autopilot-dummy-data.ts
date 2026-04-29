export interface DummyPage {
  id: string;
  name: string;
  activeAds: number;
  rejectedAds: number;
  totalAds: number;
}

export const DUMMY_PAGES: DummyPage[] = [
  { id: "pg-1", name: "Weight Loss LP – US", activeAds: 42, rejectedAds: 3, totalAds: 45 },
  { id: "pg-2", name: "Skincare Offer – EU", activeAds: 18, rejectedAds: 1, totalAds: 19 },
  { id: "pg-3", name: "Keto Diet – CA", activeAds: 65, rejectedAds: 8, totalAds: 73 },
  { id: "pg-4", name: "Beauty Promo – UK", activeAds: 30, rejectedAds: 0, totalAds: 30 },
  { id: "pg-5", name: "Supplement Sale – AU", activeAds: 12, rejectedAds: 2, totalAds: 14 },
];

export interface DummyCreative {
  id: string;
  name: string;
  type: "image" | "video";
}

export const DUMMY_CREATIVES: DummyCreative[] = [
  { id: "cr-1", name: "Hero Banner v1", type: "image" },
  { id: "cr-2", name: "Product Showcase", type: "image" },
  { id: "cr-3", name: "Testimonial Clip", type: "video" },
  { id: "cr-4", name: "Before & After", type: "image" },
  { id: "cr-5", name: "UGC Review #1", type: "video" },
  { id: "cr-6", name: "Lifestyle Shot", type: "image" },
  { id: "cr-7", name: "Promo Reel 15s", type: "video" },
  { id: "cr-8", name: "Carousel Card Set", type: "image" },
];

export interface DummyWarmupLink {
  id: string;
  url: string;
  label: string;
}

export const DUMMY_WARMUP_LINKS: DummyWarmupLink[] = [
  { id: "wl-1", url: "https://example.com/lp/weight-loss", label: "Weight Loss LP" },
  { id: "wl-2", url: "https://example.com/lp/skincare", label: "Skincare LP" },
  { id: "wl-3", url: "https://example.com/lp/keto-diet", label: "Keto Diet LP" },
  { id: "wl-4", url: "https://example.com/lp/supplement", label: "Supplement LP" },
  { id: "wl-5", url: "https://example.com/lp/beauty", label: "Beauty Promo LP" },
  { id: "wl-6", url: "https://example.com/lp/fitness", label: "Fitness LP" },
];

export interface DummyFolderCreative {
  id: string;
  name: string;
  type: "image" | "video";
}

export interface DummyFolder {
  id: string;
  name: string;
  creatives: DummyFolderCreative[];
}

export const DUMMY_FOLDERS_WITH_CREATIVES: DummyFolder[] = [
  {
    id: "fld-1",
    name: "Weight Loss Creatives",
    creatives: [
      { id: "fc-1", name: "WL Hero Banner", type: "image" },
      { id: "fc-2", name: "WL Testimonial Video", type: "video" },
      { id: "fc-3", name: "WL Before & After", type: "image" },
      { id: "fc-4", name: "WL Product Shot", type: "image" },
    ],
  },
  {
    id: "fld-2",
    name: "Skincare Bundle",
    creatives: [
      { id: "fc-5", name: "SC Promo Reel", type: "video" },
      { id: "fc-6", name: "SC Lifestyle Photo", type: "image" },
      { id: "fc-7", name: "SC UGC Clip", type: "video" },
    ],
  },
  {
    id: "fld-3",
    name: "Keto & Supplements",
    creatives: [
      { id: "fc-8", name: "Keto Results Banner", type: "image" },
      { id: "fc-9", name: "Supplement Unboxing", type: "video" },
      { id: "fc-10", name: "Keto Recipe Video", type: "video" },
      { id: "fc-11", name: "Supplement Infographic", type: "image" },
      { id: "fc-12", name: "Before After Collage", type: "image" },
    ],
  },
];

/* ─── Strategy Insights (dummy) ─── */

export interface StrategyInsightMetrics {
  strategyAlias: string;
  totalAdsLaunched: number;
  totalSpend: number;
  revenue: number;
  roas: number;
  activeAds: number;
  rejectedAds: number;
  inReviewAds: number;
  topCreatives: { name: string; spend: number; roas: number }[];
  launchHistory: { date: string; account: string; adsLaunched: number; spend: number; status: string }[];
}

export const DUMMY_STRATEGY_INSIGHTS: Record<string, StrategyInsightMetrics> = {
  "us-wl": {
    strategyAlias: "us-wl",
    totalAdsLaunched: 342,
    totalSpend: 12480,
    revenue: 41200,
    roas: 3.3,
    activeAds: 89,
    rejectedAds: 14,
    inReviewAds: 7,
    topCreatives: [
      { name: "WL Hero Banner", spend: 3200, roas: 4.1 },
      { name: "WL Before & After", spend: 2800, roas: 3.8 },
      { name: "WL Testimonial Video", spend: 2100, roas: 3.2 },
    ],
    launchHistory: [
      { date: "2026-03-03", account: "US – Main", adsLaunched: 5, spend: 420, status: "Active" },
      { date: "2026-03-02", account: "US – Main", adsLaunched: 5, spend: 380, status: "Active" },
      { date: "2026-03-01", account: "US – Main", adsLaunched: 5, spend: 510, status: "Mixed" },
      { date: "2026-02-28", account: "US – Main", adsLaunched: 5, spend: 290, status: "Active" },
      { date: "2026-02-27", account: "US – Main", adsLaunched: 5, spend: 350, status: "Active" },
    ],
  },
  "eu-sc": {
    strategyAlias: "eu-sc",
    totalAdsLaunched: 156,
    totalSpend: 5640,
    revenue: 14100,
    roas: 2.5,
    activeAds: 42,
    rejectedAds: 6,
    inReviewAds: 3,
    topCreatives: [
      { name: "SC Promo Reel", spend: 1800, roas: 3.0 },
      { name: "SC Lifestyle Photo", spend: 1200, roas: 2.6 },
      { name: "SC UGC Clip", spend: 980, roas: 2.2 },
    ],
    launchHistory: [
      { date: "2026-03-03", account: "EU – Scale", adsLaunched: 3, spend: 210, status: "Active" },
      { date: "2026-03-02", account: "EU – Scale", adsLaunched: 3, spend: 190, status: "Active" },
      { date: "2026-03-01", account: "EU – Scale", adsLaunched: 3, spend: 175, status: "Paused" },
    ],
  },
};

/* ─── Strategy Change Log (dummy) ─── */

export interface StrategyChangeLogEntry {
  id: string;
  timestamp: string;
  user: string;
  field: string;
  oldValue: string;
  newValue: string;
}

export const DUMMY_STRATEGY_CHANGE_LOG: Record<string, StrategyChangeLogEntry[]> = {
  "cfg-1": [
    { id: "log-1", timestamp: "2026-03-03 09:15", user: "john@fabads.com", field: "nomenclature", oldValue: "{ad-account-alias}_{date}", newValue: "{ad-account-alias}_{date}_{location}" },
    { id: "log-2", timestamp: "2026-03-01 14:30", user: "john@fabads.com", field: "adsCount", oldValue: "3", newValue: "5" },
    { id: "log-3", timestamp: "2026-02-28 11:00", user: "sarah@fabads.com", field: "folder", oldValue: "—", newValue: "Folder A" },
    { id: "log-4", timestamp: "2026-02-25 16:45", user: "john@fabads.com", field: "Strategy", oldValue: "—", newValue: "Created" },
  ],
  "cfg-2": [
    { id: "log-5", timestamp: "2026-03-02 10:20", user: "sarah@fabads.com", field: "campaignUrlId", oldValue: "Weight Loss – US", newValue: "Skincare – EU" },
    { id: "log-6", timestamp: "2026-02-26 09:00", user: "sarah@fabads.com", field: "Strategy", oldValue: "—", newValue: "Created" },
  ],
};

/* ─── AutoPilot cross-references (dummy) ─── */

export interface DummyAutoPilotUsage {
  strategyName: string;
  strategyAlias: string;
  accountCount: number;
}

/** Folders referenced by AutoPilot strategies (keyed by folder name for prototype) */
export const DUMMY_FOLDER_AUTOPILOT_USAGE: Record<string, DummyAutoPilotUsage[]> = {
  "Folder A": [{ strategyName: "US Weight Loss AutoPilot", strategyAlias: "us-wl", accountCount: 2 }],
  "Folder C": [{ strategyName: "EU Skincare Scale", strategyAlias: "eu-sc", accountCount: 1 }],
};

/** Campaign URLs referenced by AutoPilot strategies (keyed by campaign URL id) */
export const DUMMY_CAMPAIGN_URL_AUTOPILOT_USAGE: Record<string, DummyAutoPilotUsage[]> = {
  "cu-1": [{ strategyName: "US Weight Loss AutoPilot", strategyAlias: "us-wl", accountCount: 2 }],
  "cu-2": [{ strategyName: "EU Skincare Scale", strategyAlias: "eu-sc", accountCount: 1 }],
};

/* ─── Catalogue Ads (account-level access) ─── */

/** Maps ad account IDs to the catalogue IDs they have access to */
export const DUMMY_ACCOUNT_CATALOGUES: Record<string, string[]> = {
  "acc-1": ["cat-1", "cat-2"],
  "acc-2": ["cat-2", "cat-3"],
  "acc-3": ["cat-1", "cat-3", "cat-4"],
  "acc-4": ["cat-4"],
};

/** Facebook dynamic product tags for catalogue ad copy */
export const CATALOGUE_DYNAMIC_TAGS = [
  "{{product.name}}",
  "{{product.price}}",
  "{{product.brand}}",
  "{{product.description}}",
  "{{product.current_price}}",
  "{{product.retailer_id}}",
];

export const CATALOGUE_CTA_OPTIONS = [
  "Shop now",
  "Learn more",
  "Sign up",
  "Get offer",
  "Order now",
  "Book now",
];
