/**
 * Launch v2 mock data — objective/format/bid labels, sources, targeting
 * templates. Reuses launch2's mock ad-accounts + creatives (same app, no point
 * re-authoring) and maps them to the v2 shapes.
 */
import { MOCK_ACCOUNTS } from "@/launch2/data/mockData";
import { MOCK_CREATIVES } from "@/launch2/data/mockCreatives";
import type {
  AdFormat,
  BidStrategy,
  CatalogV2,
  CreativeRef,
  CustomAudienceV2,
  DestinationType,
  Intent,
  Objective,
  PlacementSelection,
  ProductV2,
  RunningAdSetV2,
  RunningAdV2,
  RunningCampaignV2,
  SourceType,
  SpecialAdCategory,
  SpreadMode,
  Strategy,
  TargetPair,
} from "./types";

/* ---- Step 1 reducer options ---- */
export const INTENTS: { id: Intent; label: string; blurb: string }[] = [
  { id: "test", label: "Test", blurb: "Clean per-creative reads · ABO · 1 creative / ad set" },
  { id: "scale", label: "Scale", blurb: "Let Meta optimize · CBO · Advantage+ · stacked" },
  { id: "custom", label: "Custom", blurb: "Full manual control — no preset" },
];

export const OBJECTIVES: { id: Objective; label: string; desc: string }[] = [
  { id: "OUTCOME_AWARENESS", label: "Awareness", desc: "Be remembered by the most people." },
  { id: "OUTCOME_TRAFFIC", label: "Traffic", desc: "Send people to a destination." },
  { id: "OUTCOME_ENGAGEMENT", label: "Engagement", desc: "Messages, video views, post engagement." },
  { id: "OUTCOME_LEADS", label: "Leads", desc: "Collect leads for your business." },
  { id: "OUTCOME_APP_PROMOTION", label: "App promotion", desc: "Drive installs / app events." },
  { id: "OUTCOME_SALES", label: "Sales", desc: "Find people likely to purchase." },
];

export const FORMATS: { id: AdFormat; label: string }[] = [
  { id: "single_image", label: "Static" },
  { id: "single_video", label: "Video" },
  { id: "carousel", label: "Carousel" },
  { id: "collection", label: "Collection" },
  { id: "flexible", label: "Flexible" },
  { id: "dpa", label: "Catalogue (DPA)" },
];

export const SOURCES: { id: SourceType; label: string }[] = [
  { id: "library", label: "Library" },
  { id: "genie", label: "Genie" },
  { id: "reports", label: "Report" },
  { id: "post_id", label: "Post ID" },
  { id: "folder", label: "Folder" },
  { id: "upload", label: "Upload" },
  { id: "url", label: "URL" },
  { id: "drive", label: "Google Drive" },
];

/** UI label for each canonical bid-strategy enum (2026 names). */
export const BID_LABELS: Record<BidStrategy, string> = {
  LOWEST_COST_WITHOUT_CAP: "Highest volume",
  COST_CAP: "Cost per result goal",
  LOWEST_COST_WITH_BID_CAP: "Bid cap",
  LOWEST_COST_WITH_MIN_ROAS: "ROAS goal",
  HIGHEST_VALUE: "Highest value",
};

export const SPREAD_LABELS: Record<SpreadMode, string> = {
  one_per_adset: "One per ad set (1:1)",
  round_robin: "Round-robin",
  stacked: "Stacked",
  multiply: "Multiply",
  manual: "Manual",
  custom: "Custom",
};

export const SPECIAL_CATEGORIES: { id: SpecialAdCategory; label: string }[] = [
  { id: "HOUSING", label: "Housing" },
  { id: "EMPLOYMENT", label: "Employment" },
  { id: "FINANCIAL_PRODUCTS_SERVICES", label: "Financial products & services" },
  { id: "ISSUES_ELECTIONS_POLITICS", label: "Social issues, elections or politics" },
];

/* ---- Targeting templates (the only template type) ---- */
export interface TargetingTemplateV2 {
  id: string;
  name: string;
  /** Minimal summary chips shown inline. */
  summary: string[];
  advantageAudience: boolean;
  advantageCreative: boolean;
  /** Per-template conversion location — drives the cascade when this template is selected. */
  destinationType: DestinationType;
  /** Ad-set-level settings (kept light for the mock). */
  settings: {
    locations: string;
    ageMin: number;
    ageMax: number;
    gender: "all" | "men" | "women";
    placements: "advantage" | "manual";
    detailedTargeting: string[];
    exclusions: string[];
  };
  // Filter metadata (optional — used by template picker filters)
  objective?: Objective;
  ageRange?: "18-24" | "25-34" | "35-44" | "45+";
  locationType?: "national" | "city-level" | "tier1" | "tier2";
  interestCategory?: "fashion" | "tech" | "health" | "beauty" | "fitness" | "food" | "travel";
  gender?: "all" | "male" | "female";
}

export const TARGETING_TEMPLATES: TargetingTemplateV2[] = [
  {
    id: "tpl_us_broad",
    name: "US Broad",
    summary: ["US", "18–65", "Advantage+ Audience", "Auto placements"],
    advantageAudience: true,
    advantageCreative: true,
    destinationType: "WEBSITE",
    settings: { locations: "United States", ageMin: 18, ageMax: 65, gender: "all", placements: "advantage", detailedTargeting: [], exclusions: ["Purchasers (90d)"] },
    objective: "OUTCOME_SALES",
    ageRange: "25-34",
    locationType: "national",
    gender: "all",
    interestCategory: "fashion",
  },
  {
    id: "tpl_lal1",
    name: "Lookalike 1% (Purchasers)",
    summary: ["US", "18–54", "LAL 1%", "Advantage+ Creative"],
    advantageAudience: true,
    advantageCreative: true,
    destinationType: "WEBSITE",
    settings: { locations: "United States", ageMin: 18, ageMax: 54, gender: "all", placements: "advantage", detailedTargeting: ["Lookalike 1% – Purchasers"], exclusions: [] },
    objective: "OUTCOME_SALES",
    ageRange: "25-34",
    locationType: "national",
    gender: "all",
  },
  {
    id: "tpl_in_metro",
    name: "India Metros — Engaged",
    summary: ["India metros", "18–35", "Manual placements"],
    advantageAudience: false,
    advantageCreative: true,
    destinationType: "WEBSITE",
    settings: { locations: "Delhi, Mumbai, Bangalore", ageMin: 18, ageMax: 35, gender: "all", placements: "manual", detailedTargeting: ["Engaged shoppers"], exclusions: [] },
    objective: "OUTCOME_TRAFFIC",
    ageRange: "25-34",
    locationType: "city-level",
    gender: "all",
    interestCategory: "fashion",
  },
  // P1-1 / P1-2 additions — covers AWARENESS, ENGAGEMENT, LEADS, APP_PROMOTION + US TRAFFIC
  {
    id: "tpl_in_awareness_video",
    name: "India — Brand Awareness (Video)",
    summary: ["India", "18–45", "Video views", "Advantage+ Audience"],
    advantageAudience: true,
    advantageCreative: true,
    destinationType: "WEBSITE",
    settings: { locations: "India", ageMin: 18, ageMax: 45, gender: "all", placements: "advantage", detailedTargeting: ["Online video viewers", "Frequent travellers — domestic"], exclusions: [] },
    objective: "OUTCOME_AWARENESS",
    ageRange: "25-34",
    locationType: "national",
    gender: "all",
    interestCategory: "travel",
  },
  {
    id: "tpl_in_engagement",
    name: "India — Post Engagement",
    summary: ["India", "18–40", "Post engagement", "Manual placements"],
    advantageAudience: false,
    advantageCreative: true,
    destinationType: "WEBSITE",
    settings: { locations: "India", ageMin: 18, ageMax: 40, gender: "all", placements: "manual", detailedTargeting: ["Engaged shoppers", "Beauty enthusiasts"], exclusions: ["Customers (180d)"] },
    objective: "OUTCOME_ENGAGEMENT",
    ageRange: "25-34",
    locationType: "national",
    gender: "all",
    interestCategory: "beauty",
  },
  {
    id: "tpl_in_leads_native",
    name: "India — Lead Gen (Instant Form)",
    summary: ["India", "25–54", "Instant form", "Advantage+ Audience"],
    advantageAudience: true,
    advantageCreative: true,
    destinationType: "ON_AD",
    settings: { locations: "India", ageMin: 25, ageMax: 54, gender: "all", placements: "advantage", detailedTargeting: ["Decision makers", "Small business owners"], exclusions: [] },
    objective: "OUTCOME_LEADS",
    ageRange: "35-44",
    locationType: "national",
    gender: "all",
  },
  {
    id: "tpl_in_app_installs",
    name: "India — App Installs (Android)",
    summary: ["India", "18–34", "App installs", "Advantage+ App campaigns"],
    advantageAudience: true,
    advantageCreative: false,
    destinationType: "APP",
    settings: { locations: "India", ageMin: 18, ageMax: 34, gender: "all", placements: "advantage", detailedTargeting: ["Mobile app users — Android", "Tech enthusiasts"], exclusions: ["Existing app users"] },
    objective: "OUTCOME_APP_PROMOTION",
    ageRange: "18-24",
    locationType: "national",
    gender: "all",
    interestCategory: "tech",
  },
  {
    id: "tpl_us_traffic",
    name: "US — Link Clicks (Traffic)",
    summary: ["United States", "18–65", "Link clicks", "Advantage+ Audience"],
    advantageAudience: true,
    advantageCreative: true,
    destinationType: "WEBSITE",
    settings: { locations: "United States", ageMin: 18, ageMax: 65, gender: "all", placements: "advantage", detailedTargeting: [], exclusions: [] },
    objective: "OUTCOME_TRAFFIC",
    ageRange: "25-34",
    locationType: "national",
    gender: "all",
  },
];

export function getTemplate(id: string | null): TargetingTemplateV2 | undefined {
  return id ? TARGETING_TEMPLATES.find((t) => t.id === id) : undefined;
}

export const DEFAULT_PLACEMENTS: PlacementSelection = {
  facebook: { feeds: true, profileFeed: true, videoFeeds: true, inStreamVideos: true, stories: true, reels: true, rightColumn: true, marketplace: true, searchResults: true, businessExplore: true, notifications: true },
  instagram: { feed: true, profileFeed: true, explore: true, exploreHome: true, stories: true, reels: true, searchResults: true },
  audienceNetwork: { nativeBannerInterstitial: true, rewardedVideos: true },
  messenger: { inbox: true, stories: true, sponsoredMessages: true },
  threads: { feed: true },
};

/* ---- Strategy presets ---- */
export const STRATEGIES: Strategy[] = [
  {
    id: "preset_test",
    name: "Test",
    type: "preset",
    budgetMode: "ABO",
    budgetAmount: 10,
    bidStrategy: "LOWEST_COST_WITHOUT_CAP",
    structure: { campaigns: 1, adSetsPerCampaign: 5, adsPerAdSet: 1 },
    spread: "one_per_adset",
    advantagePlus: false,
    targetingTemplateId: null,
  },
  {
    id: "preset_scale",
    name: "Scale",
    type: "preset",
    budgetMode: "CBO",
    budgetAmount: 100,
    bidStrategy: "COST_CAP",
    structure: { campaigns: 1, adSetsPerCampaign: 1, adsPerAdSet: 6 },
    spread: "stacked",
    advantagePlus: true,
    targetingTemplateId: null,
  },
];

export function getStrategy(id: string | null): Strategy | undefined {
  return id ? STRATEGIES.find((s) => s.id === id) : undefined;
}

/* ---- Reuse launch2 accounts/pages/creatives ---- */
export const ACCOUNTS = MOCK_ACCOUNTS;

export function makeTargetV2(accountId: string, pageId: string): TargetPair | null {
  const acc = MOCK_ACCOUNTS.find((a) => a.id === accountId);
  const pg = acc?.pages.find((p) => p.id === pageId);
  if (!acc || !pg) return null;
  return {
    accountId: acc.id,
    accountName: acc.name,
    currency: acc.currency,
    pageId: pg.id,
    fbPageId: pg.fbPageId,
    pageName: pg.name,
    pixelId: acc.pixels[0]?.id,
  };
}

/**
 * Current active ads on a page (for the 250-cap meter).
 * A Page can be shared across multiple Ad Accounts (same fbPageId, e.g. two
 * Business Manager accounts posting through one brand Page) — dedupe to the
 * first matching Page rather than summing, so a shared page is never
 * double-counted just because it's listed under more than one account.
 */
export function pageActiveAds(fbPageId: string): number {
  const pg = MOCK_ACCOUNTS.flatMap((a) => a.pages).find((p) => p.fbPageId === fbPageId);
  return pg?.activeAds ?? 0;
}

export const CREATIVES: CreativeRef[] = MOCK_CREATIVES.map((c) => ({
  id: c.id,
  name: c.name,
  format: c.type === "carousel" ? "carousel" : c.type === "video" ? "single_video" : c.type === "dpa" ? "dpa" : "single_image",
  source: c.source === "post" ? "library" : (c.source as SourceType),
  thumbnail: c.thumbnail,
}));

export function creativesForFormat(format: AdFormat | null): CreativeRef[] {
  if (!format) return CREATIVES;
  if (format === "dpa") return CREATIVES.filter((c) => c.format === "dpa");
  if (format === "single_video") return CREATIVES.filter((c) => c.format === "single_video");
  if (format === "carousel") return CREATIVES.filter((c) => c.format === "carousel" || c.format === "single_image");
  return CREATIVES.filter((c) => c.format !== "dpa");
}

/* ---- Catalogue ads (mock) ---- */
export const CATALOGS: CatalogV2[] = [
  {
    id: "cat_001",
    name: "Mamaearth — Full Catalog",
    productCount: 248,
    productSets: [
      { id: "ps_001", name: "All products", productCount: 248, products: [
        { id: "p_001", name: "Onion Hair Oil 250ml", thumbnail: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=200&q=80", price: "₹399" },
        { id: "p_002", name: "Vitamin C Face Wash 100ml", thumbnail: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=200&q=80", price: "₹249" },
        { id: "p_003", name: "Ubtan Face Mask", thumbnail: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=200&q=80", price: "₹299" },
        { id: "p_004", name: "Tea Tree Foaming Face Wash", thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80", price: "₹349" },
      ] },
      { id: "ps_002", name: "Best sellers", productCount: 32, products: [
        { id: "p_005", name: "Onion Hair Oil 250ml", thumbnail: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=200&q=80", price: "₹399" },
        { id: "p_006", name: "Vitamin C Daily Glow Serum", thumbnail: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=200&q=80", price: "₹599" },
        { id: "p_007", name: "Ubtan Face Wash", thumbnail: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=200&q=80", price: "₹249" },
      ] },
      { id: "ps_003", name: "Hair care", productCount: 54, products: [
        { id: "p_008", name: "Onion Hair Oil 250ml", thumbnail: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=200&q=80", price: "₹399" },
        { id: "p_009", name: "Onion Shampoo 250ml", thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80", price: "₹349" },
        { id: "p_010", name: "Onion Hair Conditioner", thumbnail: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=200&q=80", price: "₹329" },
      ] },
      { id: "ps_004", name: "Summer skincare", productCount: 41, products: [
        { id: "p_011", name: "Vitamin C Face Wash 100ml", thumbnail: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=200&q=80", price: "₹249" },
        { id: "p_012", name: "Aqua Glow Gel Moisturiser", thumbnail: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=200&q=80", price: "₹449" },
      ] },
    ],
  },
  {
    id: "cat_002",
    name: "boAt — Audio Catalog",
    productCount: 176,
    productSets: [
      { id: "ps_005", name: "All products", productCount: 176, products: [
        { id: "p_013", name: "Airdopes 141 TWS Earbuds", thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80", price: "₹1,299" },
        { id: "p_014", name: "Rockerz 450 Headphones", thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80", price: "₹1,499" },
        { id: "p_015", name: "Stone 350 Speaker", thumbnail: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=200&q=80", price: "₹999" },
        { id: "p_016", name: "Wave Call Smartwatch", thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80", price: "₹1,799" },
      ] },
      { id: "ps_006", name: "Wireless earbuds", productCount: 44, products: [
        { id: "p_017", name: "Airdopes 141 TWS Earbuds", thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80", price: "₹1,299" },
        { id: "p_018", name: "Airdopes 161 TWS Earbuds", thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80", price: "₹1,399" },
        { id: "p_019", name: "Airdopes Atom 81", thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80", price: "₹1,199" },
      ] },
      { id: "ps_007", name: "Headphones", productCount: 28, products: [
        { id: "p_020", name: "Rockerz 450 Headphones", thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80", price: "₹1,499" },
        { id: "p_021", name: "Rockerz 550 Over-Ear", thumbnail: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=200&q=80", price: "₹1,799" },
      ] },
      { id: "ps_008", name: "New arrivals", productCount: 19, products: [
        { id: "p_022", name: "Nirvana Ion ANC Earbuds", thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80", price: "₹2,499" },
        { id: "p_023", name: "Wave Sigma 2 Smartwatch", thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80", price: "₹1,999" },
      ] },
    ],
  },
  {
    id: "cat_003",
    name: "Sleepyhead — Mattress Catalog",
    productCount: 63,
    productSets: [
      { id: "ps_009", name: "All products", productCount: 63, products: [
        { id: "p_024", name: "The Original Mattress (Queen)", thumbnail: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=200&q=80", price: "₹18,999" },
        { id: "p_025", name: "Sense Ortho Mattress (King)", thumbnail: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=200&q=80", price: "₹27,499" },
        { id: "p_026", name: "Cloud Pillow (Pack of 2)", thumbnail: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=200&q=80", price: "₹2,499" },
      ] },
      { id: "ps_010", name: "Mattresses", productCount: 21, products: [
        { id: "p_027", name: "The Original Mattress (Queen)", thumbnail: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=200&q=80", price: "₹18,999" },
        { id: "p_028", name: "Sense Ortho Mattress (King)", thumbnail: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=200&q=80", price: "₹27,499" },
      ] },
      { id: "ps_011", name: "Bundles", productCount: 12, products: [
        { id: "p_029", name: "Mattress + 2 Pillows Combo", thumbnail: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=200&q=80", price: "₹21,999" },
        { id: "p_030", name: "Complete Bedroom Bundle", thumbnail: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=200&q=80", price: "₹34,999" },
      ] },
    ],
  },
];

export function getCatalog(id: string | null): CatalogV2 | undefined {
  return CATALOGS.find((c) => c.id === id);
}

/* ---- Copy-from-running source entities (mock) ---- */
export const RUNNING_CAMPAIGNS: RunningCampaignV2[] = [
  {
    id: "rc_001", name: "Mamaearth — Sales Scale Q2",
    objective: "OUTCOME_SALES", budgetMode: "CBO", budgetAmount: 5000,
    bidStrategy: "COST_CAP", advantagePlus: true, status: "active",
    spend30d: 124800, roas30d: 4.2, cpm30d: 48,
  },
  {
    id: "rc_002", name: "boAt — Traffic Always-On",
    objective: "OUTCOME_TRAFFIC", budgetMode: "ABO", budgetAmount: 1200,
    bidStrategy: "LOWEST_COST_WITHOUT_CAP", advantagePlus: false, status: "active",
    spend30d: 38400, roas30d: undefined, cpm30d: 32,
  },
  {
    id: "rc_003", name: "Sleepyhead — Awareness Burst",
    objective: "OUTCOME_AWARENESS", budgetMode: "CBO", budgetAmount: 3000,
    bidStrategy: "LOWEST_COST_WITHOUT_CAP", advantagePlus: false, status: "paused",
    spend30d: 72100, roas30d: undefined, cpm30d: 21,
  },
  {
    id: "rc_004", name: "Noise — Conversion Retargeting",
    objective: "OUTCOME_SALES", budgetMode: "ABO", budgetAmount: 2500,
    bidStrategy: "COST_CAP", advantagePlus: false, status: "active",
    spend30d: 54300, roas30d: 3.1, cpm30d: 39,
  },
  {
    id: "rc_005", name: "Mensa Brands — Lead Gen Q2",
    objective: "OUTCOME_LEADS", budgetMode: "CBO", budgetAmount: 8000,
    bidStrategy: "LOWEST_COST_WITHOUT_CAP", advantagePlus: true, status: "active",
    spend30d: 198500, roas30d: undefined, cpm30d: 61,
  },
];

export const RUNNING_ADSETS: RunningAdSetV2[] = [
  {
    id: "ras_001", name: "Lookalike 1% — IN",
    campaignName: "Mamaearth — Sales Scale Q2",
    optimizationGoal: "OFFSITE_CONVERSIONS",
    audienceName: "LAL 1% Purchasers", placements: "Automatic", status: "active",
    spend30d: 68400, cpa30d: 184, reach30d: 412000, frequency30d: 2.8,
  },
  {
    id: "ras_002", name: "Retargeting — 30d ATC",
    campaignName: "Mamaearth — Sales Scale Q2",
    optimizationGoal: "OFFSITE_CONVERSIONS",
    audienceName: "Add-to-cart 30d", placements: "Manual — Feed + Stories", status: "active",
    spend30d: 56400, cpa30d: 141, reach30d: 88700, frequency30d: 5.4,
  },
  {
    id: "ras_003", name: "Broad — 18-45",
    campaignName: "boAt — Traffic Always-On",
    optimizationGoal: "LINK_CLICKS",
    audienceName: "Broad IN 18-45", placements: "Automatic", status: "active",
    spend30d: 38400, cpa30d: 6, reach30d: 1240000, frequency30d: 1.9,
  },
  {
    id: "ras_004", name: "Interest — Tech Enthusiasts",
    campaignName: "Noise — Conversion Retargeting",
    optimizationGoal: "OFFSITE_CONVERSIONS",
    audienceName: "Tech + Gadgets interest", placements: "Automatic", status: "paused",
    spend30d: 29800, cpa30d: 312, reach30d: 76400, frequency30d: 3.1,
  },
  {
    id: "ras_005", name: "Lookalike 2-5% — Broad",
    campaignName: "Mensa Brands — Lead Gen Q2",
    optimizationGoal: "LEAD_GENERATION",
    audienceName: "LAL 2-5% High-LTV", placements: "Automatic", status: "active",
    spend30d: 112000, cpa30d: 248, reach30d: 2180000, frequency30d: 2.2,
  },
];

export const RUNNING_ADS: RunningAdV2[] = [
  {
    id: "rad_001", name: "Summer Glow — Hero",
    pageName: "Mamaearth", fbPageId: "fb_2001", postId: "1789234567890_9988776655",
    thumbnail: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80",
    format: "single_image", status: "active",
    spend30d: 41200, ctr30d: 3.4, roas30d: 4.8,
  },
  {
    id: "rad_002", name: "Freedom Spot — 15s",
    pageName: "boAt Lifestyle", fbPageId: "fb_3001", postId: "1654321098765_1122334455",
    thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
    format: "single_video", status: "active",
    spend30d: 28700, ctr30d: 2.1, roas30d: undefined,
  },
  {
    id: "rad_003", name: "Deep Rest — Testimonial",
    pageName: "Sleepyhead", fbPageId: "fb_5001", postId: "1456789012345_5566778899",
    thumbnail: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=400&q=80",
    format: "single_video", status: "paused",
    spend30d: 19800, ctr30d: 1.8, roas30d: undefined,
  },
  {
    id: "rad_004", name: "Noise ColorFit — Carousel",
    pageName: "Noise", fbPageId: "fb_4001", postId: "1321456789876_3344556677",
    thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
    format: "carousel", status: "active",
    spend30d: 34100, ctr30d: 4.2, roas30d: 3.6,
  },
  {
    id: "rad_005", name: "Mensa — Office Style UGC",
    pageName: "Mensa Brands", fbPageId: "fb_1001", postId: "1213456781234_7788990011",
    thumbnail: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&q=80",
    format: "single_video", status: "active",
    spend30d: 61400, ctr30d: 2.9, roas30d: undefined,
  },
  {
    // Second post on the shared Mamaearth Main page (fb_2001) — same physical
    // Page as rad_001, reachable from both act_mamaearth and act_mama_scale.
    id: "rad_006", name: "Ubtan Face Wash — UGC Testimonial",
    pageName: "Mamaearth", fbPageId: "fb_2001", postId: "2001_558243",
    thumbnail: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=400&q=80",
    format: "single_video", status: "active",
    spend30d: 33650, ctr30d: 2.7, roas30d: 5.1,
  },
  {
    id: "rad_007", name: "Vitamin C Serum — Before/After",
    pageName: "Mamaearth Skincare", fbPageId: "fb_2002", postId: "2002_390617",
    thumbnail: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80",
    format: "carousel", status: "paused",
    spend30d: 27840, ctr30d: 3.1, roas30d: 4.4,
  },
  {
    // Mamaearth Baby (fb_2003) — only reachable via act_mama_scale.
    id: "rad_008", name: "Baby lotion monsoon combo",
    pageName: "Mamaearth Baby", fbPageId: "fb_2003", postId: "2003_772109",
    thumbnail: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&q=80",
    format: "carousel", status: "active",
    spend30d: 15230, ctr30d: 2.3, roas30d: 3.2,
  },
  // --- Mamaearth (fb_2001) — bumped to ~24 posts total to exercise real
  // Page-scale volume (Meta caps a Page at MAX_ADS_PER_PAGE = 250 active ads;
  // this proves pagination/sort/chunked-reveal against a realistic mix). ---
  {
    id: "rad_009", name: "Ubtan Glow — Diwali Special",
    pageName: "Mamaearth", fbPageId: "fb_2001", postId: "2001_614829",
    thumbnail: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80",
    format: "carousel", status: "active",
    spend30d: 52340, ctr30d: 3.8, roas30d: 5.6,
  },
  {
    id: "rad_010", name: "Vitamin C Serum — Founder Story",
    pageName: "Mamaearth", fbPageId: "fb_2001", postId: "2001_627103",
    thumbnail: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&q=80",
    format: "single_video", status: "active",
    spend30d: 61870, ctr30d: 2.4, roas30d: undefined,
  },
  {
    id: "rad_011", name: "Rice Water Face Wash — Product Demo",
    pageName: "Mamaearth", fbPageId: "fb_2001", postId: "2001_638947",
    thumbnail: "https://images.unsplash.com/photo-1556228653-15d46a2f8a86?w=400&q=80",
    format: "single_image", status: "active",
    spend30d: 18420, ctr30d: 2.1, roas30d: 3.4,
  },
  {
    id: "rad_012", name: "Onion Hair Oil — Before/After",
    pageName: "Mamaearth", fbPageId: "fb_2001", postId: "2001_649215",
    thumbnail: "https://images.unsplash.com/photo-1556228694-7adde2ea05d6?w=400&q=80",
    format: "single_image", status: "active",
    spend30d: 44780, ctr30d: 4.6, roas30d: 6.2,
  },
  {
    id: "rad_013", name: "Charcoal Face Wash — UGC Unboxing",
    pageName: "Mamaearth", fbPageId: "fb_2001", postId: "2001_651078",
    thumbnail: "https://images.unsplash.com/photo-1556228841-7d2f1d2ec9b8?w=400&q=80",
    format: "single_video", status: "paused",
    spend30d: 9650, ctr30d: 1.2, roas30d: 1.8,
  },
  {
    id: "rad_014", name: "Tea Tree Face Wash — Review Compilation",
    pageName: "Mamaearth", fbPageId: "fb_2001", postId: "2001_662394",
    thumbnail: "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?w=400&q=80",
    format: "carousel", status: "active",
    spend30d: 27300, ctr30d: 2.9, roas30d: 3.9,
  },
  {
    id: "rad_015", name: "Sunscreen SPF 50 — Summer Push",
    pageName: "Mamaearth", fbPageId: "fb_2001", postId: "2001_673850",
    thumbnail: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&q=80",
    format: "single_image", status: "active",
    spend30d: 38900, ctr30d: 3.3, roas30d: 4.7,
  },
  {
    id: "rad_016", name: "Ubtan Face Pack — Testimonial",
    pageName: "Mamaearth", fbPageId: "fb_2001", postId: "2001_684127",
    thumbnail: "https://images.unsplash.com/photo-1586367474466-3b09c1d6d3b1?w=400&q=80",
    format: "single_video", status: "active",
    spend30d: 15230, ctr30d: 1.7, roas30d: 2.6,
  },
  {
    id: "rad_017", name: "New Mom Skincare Kit — Founder Story",
    pageName: "Mamaearth", fbPageId: "fb_2001", postId: "2001_695603",
    thumbnail: "https://images.unsplash.com/photo-1590658268037-41d3fd70a5cb?w=400&q=80",
    format: "single_video", status: "paused",
    spend30d: 6420, ctr30d: 0.9, roas30d: undefined,
  },
  {
    id: "rad_018", name: "Vitamin C Face Wash — Ingredient Highlight",
    pageName: "Mamaearth", fbPageId: "fb_2001", postId: "2001_706481",
    thumbnail: "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400&q=80",
    format: "single_image", status: "active",
    spend30d: 21980, ctr30d: 2.6, roas30d: 3.7,
  },
  {
    id: "rad_019", name: "Rakhi Gifting Combo — Carousel",
    pageName: "Mamaearth", fbPageId: "fb_2001", postId: "2001_717954",
    thumbnail: "https://images.unsplash.com/photo-1598257006458-087169a1f08d?w=400&q=80",
    format: "carousel", status: "active",
    spend30d: 33150, ctr30d: 3.1, roas30d: 4.3,
  },
  {
    id: "rad_020", name: "Onion Shampoo — Static Ad",
    pageName: "Mamaearth", fbPageId: "fb_2001", postId: "2001_728316",
    thumbnail: "https://images.unsplash.com/photo-1598662779094-110c2bad80b5?w=400&q=80",
    format: "single_image", status: "paused",
    spend30d: 7840, ctr30d: 1.1, roas30d: 1.6,
  },
  {
    id: "rad_021", name: "Bye Bye Blemishes — Before/After",
    pageName: "Mamaearth", fbPageId: "fb_2001", postId: "2001_739602",
    thumbnail: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=400&q=80",
    format: "single_video", status: "active",
    spend30d: 49720, ctr30d: 4.2, roas30d: 5.9,
  },
  {
    id: "rad_022", name: "Coffee Body Scrub — UGC",
    pageName: "Mamaearth", fbPageId: "fb_2001", postId: "2001_741879",
    thumbnail: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&q=80",
    format: "single_image", status: "paused",
    spend30d: 6980, ctr30d: 1.0, roas30d: 1.5,
  },
  {
    id: "rad_023", name: "Kumkumadi Glow Oil — Influencer",
    pageName: "Mamaearth", fbPageId: "fb_2001", postId: "2001_752046",
    thumbnail: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400&q=80",
    format: "single_video", status: "active",
    spend30d: 58430, ctr30d: 3.6, roas30d: 5.1,
  },
  {
    id: "rad_024", name: "Anti-Pollution Range — Product Demo",
    pageName: "Mamaearth", fbPageId: "fb_2001", postId: "2001_763518",
    thumbnail: "https://images.unsplash.com/photo-1607081692251-e91e3d7da42a?w=400&q=80",
    format: "carousel", status: "active",
    spend30d: 24560, ctr30d: 2.3, roas30d: 3.1,
  },
  {
    id: "rad_025", name: "Onion Hair Fall Kit — Testimonial",
    pageName: "Mamaearth", fbPageId: "fb_2001", postId: "2001_774293",
    thumbnail: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&q=80",
    format: "single_video", status: "paused",
    spend30d: 8920, ctr30d: 1.4, roas30d: 2.0,
  },
  {
    id: "rad_026", name: "New Year Skincare Resolution",
    pageName: "Mamaearth", fbPageId: "fb_2001", postId: "2001_785671",
    thumbnail: "https://images.unsplash.com/photo-1607082352121-fa243f3dde32?w=400&q=80",
    format: "single_image", status: "active",
    spend30d: 19870, ctr30d: 2.2, roas30d: 3.0,
  },
  {
    id: "rad_027", name: "Ubtan Body Lotion — Monsoon Push",
    pageName: "Mamaearth", fbPageId: "fb_2001", postId: "2001_796048",
    thumbnail: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&q=80",
    format: "carousel", status: "active",
    spend30d: 29640, ctr30d: 2.8, roas30d: 3.8,
  },
  {
    id: "rad_028", name: "Rice Face Mask — Review Carousel",
    pageName: "Mamaearth", fbPageId: "fb_2001", postId: "2001_807325",
    thumbnail: "https://images.unsplash.com/photo-1607602132700-068258431c6c?w=400&q=80",
    format: "carousel", status: "paused",
    spend30d: 5230, ctr30d: 0.8, roas30d: undefined,
  },
  {
    id: "rad_029", name: "Vitamin C Under Eye Cream — Founder Story",
    pageName: "Mamaearth", fbPageId: "fb_2001", postId: "2001_818602",
    thumbnail: "https://images.unsplash.com/photo-1610450949065-1f2841536c88?w=400&q=80",
    format: "single_video", status: "active",
    spend30d: 67210, ctr30d: 2.9, roas30d: undefined,
  },
  {
    id: "rad_030", name: "Wedding Season Skincare Edit — Static",
    pageName: "Mamaearth", fbPageId: "fb_2001", postId: "2001_829471",
    thumbnail: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&q=80",
    format: "single_image", status: "active",
    spend30d: 14320, ctr30d: 1.6, roas30d: 2.2,
  },
  // --- Noise (fb_4001) — bumped to ~12 posts to prove the pagination/sort
  // pattern isn't a one-off special case for just the shared Mamaearth page. ---
  {
    id: "rad_031", name: "ColorFit Pro 4 — Feature Highlight",
    pageName: "Noise", fbPageId: "fb_4001", postId: "4001_205817",
    thumbnail: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80",
    format: "single_video", status: "active",
    spend30d: 47250, ctr30d: 3.7, roas30d: 4.9,
  },
  {
    id: "rad_032", name: "Buds VS404 — Flash Sale",
    pageName: "Noise", fbPageId: "fb_4001", postId: "4001_218934",
    thumbnail: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&q=80",
    format: "single_image", status: "active",
    spend30d: 29870, ctr30d: 2.8, roas30d: 3.6,
  },
  {
    id: "rad_033", name: "Neckband N1 — UGC Unboxing",
    pageName: "Noise", fbPageId: "fb_4001", postId: "4001_227456",
    thumbnail: "https://images.unsplash.com/photo-1488998427799-e3362cec87c3?w=400&q=80",
    format: "single_video", status: "active",
    spend30d: 16430, ctr30d: 2.1, roas30d: 2.9,
  },
  {
    id: "rad_034", name: "Republic Day Sale — Carousel",
    pageName: "Noise", fbPageId: "fb_4001", postId: "4001_239871",
    thumbnail: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80",
    format: "carousel", status: "active",
    spend30d: 61240, ctr30d: 4.1, roas30d: 5.4,
  },
  {
    id: "rad_035", name: "ColorFit Icon — Comparison Ad",
    pageName: "Noise", fbPageId: "fb_4001", postId: "4001_248103",
    thumbnail: "https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=400&q=80",
    format: "single_image", status: "paused",
    spend30d: 8340, ctr30d: 1.0, roas30d: 1.4,
  },
  {
    id: "rad_036", name: "Buds VS201 — Battery Life Demo",
    pageName: "Noise", fbPageId: "fb_4001", postId: "4001_256742",
    thumbnail: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
    format: "single_video", status: "active",
    spend30d: 22980, ctr30d: 2.4, roas30d: 3.2,
  },
  {
    id: "rad_037", name: "Air Buds 2 — Influencer",
    pageName: "Noise", fbPageId: "fb_4001", postId: "4001_267319",
    thumbnail: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80",
    format: "single_video", status: "paused",
    spend30d: 6120, ctr30d: 0.8, roas30d: undefined,
  },
  {
    id: "rad_038", name: "Back to College Combo",
    pageName: "Noise", fbPageId: "fb_4001", postId: "4001_278954",
    thumbnail: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&q=80",
    format: "single_image", status: "active",
    spend30d: 18760, ctr30d: 1.9, roas30d: 2.5,
  },
  {
    id: "rad_039", name: "ColorFit Ultra — Testimonial",
    pageName: "Noise", fbPageId: "fb_4001", postId: "4001_289467",
    thumbnail: "https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=400&q=80",
    format: "single_video", status: "active",
    spend30d: 35410, ctr30d: 3.2, roas30d: 4.4,
  },
  {
    id: "rad_040", name: "Founder Story — Building Noise",
    pageName: "Noise", fbPageId: "fb_4001", postId: "4001_297821",
    thumbnail: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&q=80",
    format: "single_image", status: "active",
    spend30d: 12980, ctr30d: 1.5, roas30d: undefined,
  },
  {
    id: "rad_041", name: "Buds VS102 — Price Drop Alert",
    pageName: "Noise", fbPageId: "fb_4001", postId: "4001_308654",
    thumbnail: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80",
    format: "carousel", status: "paused",
    spend30d: 9430, ctr30d: 1.2, roas30d: 1.7,
  },
  // --- Acme Store (fb_1001) — bumped from 1 to 7 posts (moderate-volume page). ---
  {
    id: "rad_042", name: "Trail Pro 2 — Trailhead Unboxing",
    pageName: "Acme Store", fbPageId: "fb_1001", postId: "1001_284917",
    thumbnail: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80",
    format: "carousel", status: "active",
    spend30d: 36780, ctr30d: 3.2, roas30d: 4.1,
  },
  {
    id: "rad_043", name: "Aero Runner — 5K PR Testimonial",
    pageName: "Acme Store", fbPageId: "fb_1001", postId: "1001_297534",
    thumbnail: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80",
    format: "single_video", status: "active",
    spend30d: 52930, ctr30d: 2.6, roas30d: undefined,
  },
  {
    id: "rad_044", name: "City Pack 20L — Daily Commute Before/After",
    pageName: "Acme Store", fbPageId: "fb_1001", postId: "1001_308821",
    thumbnail: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&q=80",
    format: "single_image", status: "paused",
    spend30d: 8340, ctr30d: 1.3, roas30d: 1.9,
  },
  {
    id: "rad_045", name: "Memorial Day Flash Sale — 30% Off Sitewide",
    pageName: "Acme Store", fbPageId: "fb_1001", postId: "1001_316274",
    thumbnail: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80",
    format: "single_image", status: "active",
    spend30d: 44210, ctr30d: 3.7, roas30d: 5.3,
  },
  {
    id: "rad_046", name: "Flux Bottle vs. The Leading Competitor — Side-by-Side",
    pageName: "Acme Store", fbPageId: "fb_1001", postId: "1001_329608",
    thumbnail: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&q=80",
    format: "carousel", status: "active",
    spend30d: 21560, ctr30d: 2.4, roas30d: 2.8,
  },
  {
    id: "rad_047", name: "Founder Story — Why We Built Acme From A Garage",
    pageName: "Acme Store", fbPageId: "fb_1001", postId: "1001_341952",
    thumbnail: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
    format: "single_video", status: "paused",
    spend30d: 6120, ctr30d: 0.9, roas30d: undefined,
  },
  // --- Mamaearth Skincare (fb_2002) — bumped from 1 to 6 posts. ---
  {
    id: "rad_048", name: "Niacinamide Serum — Combination Skin UGC",
    pageName: "Mamaearth Skincare", fbPageId: "fb_2002", postId: "2002_401738",
    thumbnail: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80",
    format: "single_image", status: "active",
    spend30d: 31420, ctr30d: 2.7, roas30d: 3.9,
  },
  {
    id: "rad_049", name: "Sunscreen Matte SPF50 — Summer Product Demo",
    pageName: "Mamaearth Skincare", fbPageId: "fb_2002", postId: "2002_412956",
    thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
    format: "single_video", status: "active",
    spend30d: 45680, ctr30d: 3.4, roas30d: undefined,
  },
  {
    id: "rad_050", name: "Rice Water Toner — 30-Day Before/After",
    pageName: "Mamaearth Skincare", fbPageId: "fb_2002", postId: "2002_423817",
    thumbnail: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=400&q=80",
    format: "carousel", status: "active",
    spend30d: 19230, ctr30d: 2.2, roas30d: 3.3,
  },
  {
    id: "rad_051", name: "Holi Skincare Combo — Festive Carousel",
    pageName: "Mamaearth Skincare", fbPageId: "fb_2002", postId: "2002_434290",
    thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
    format: "carousel", status: "paused",
    spend30d: 7650, ctr30d: 1.1, roas30d: 1.7,
  },
  {
    id: "rad_052", name: "Vitamin C vs Niacinamide — Which One's Right For You",
    pageName: "Mamaearth Skincare", fbPageId: "fb_2002", postId: "2002_445603",
    thumbnail: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&q=80",
    format: "single_image", status: "active",
    spend30d: 26340, ctr30d: 2.5, roas30d: 3.6,
  },
  // --- Mamaearth Baby (fb_2003) — bumped from 1 to 4 posts (lands just under
  // the modal's REVEAL_INITIAL = 6, so the full grid is visible with no
  // "Show all" expand needed — a distinct low-but-not-zero case). ---
  {
    id: "rad_053", name: "Baby Shampoo Tear-Free — Pediatrician Endorsed",
    pageName: "Mamaearth Baby", fbPageId: "fb_2003", postId: "2003_783461",
    thumbnail: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80",
    format: "single_image", status: "active",
    spend30d: 22150, ctr30d: 2.9, roas30d: 3.8,
  },
  {
    id: "rad_054", name: "Baby Massage Oil — New Mom Testimonial",
    pageName: "Mamaearth Baby", fbPageId: "fb_2003", postId: "2003_794528",
    thumbnail: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&q=80",
    format: "single_video", status: "paused",
    spend30d: 6840, ctr30d: 1.2, roas30d: 1.6,
  },
  {
    id: "rad_055", name: "Diaper Rash Cream — Before/After Comparison",
    pageName: "Mamaearth Baby", fbPageId: "fb_2003", postId: "2003_805013",
    thumbnail: "https://images.unsplash.com/photo-1556228653-15d46a2f8a86?w=400&q=80",
    format: "carousel", status: "active",
    spend30d: 17960, ctr30d: 2.6, roas30d: 3.4,
  },
  // --- Sleepyhead (fb_5001) — bumped from 1 to 6 posts. ---
  {
    id: "rad_056", name: "The Original Mattress — Unboxing & Setup",
    pageName: "Sleepyhead", fbPageId: "fb_5001", postId: "5001_216394",
    thumbnail: "https://images.unsplash.com/photo-1556228694-7adde2ea05d6?w=400&q=80",
    format: "carousel", status: "active",
    spend30d: 33580, ctr30d: 2.8, roas30d: 4.2,
  },
  {
    // Deliberately long, still-plausible post name — exercises the card's
    // line-clamp-1 truncation (76 characters).
    id: "rad_057", name: "Why I Finally Stopped Waking Up With A Sore Back — Sleepyhead Ortho Mattress",
    pageName: "Sleepyhead", fbPageId: "fb_5001", postId: "5001_227815",
    thumbnail: "https://images.unsplash.com/photo-1556228841-7d2f1d2ec9b8?w=400&q=80",
    format: "single_image", status: "active",
    spend30d: 48720, ctr30d: 3.5, roas30d: 4.9,
  },
  {
    id: "rad_058", name: "Cloud Pillow Combo — Side Sleeper Review",
    pageName: "Sleepyhead", fbPageId: "fb_5001", postId: "5001_238947",
    thumbnail: "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?w=400&q=80",
    format: "single_video", status: "paused",
    spend30d: 9120, ctr30d: 1.4, roas30d: 2.1,
  },
  {
    id: "rad_059", name: "Diwali Mattress Sale — Flat 40% Off",
    pageName: "Sleepyhead", fbPageId: "fb_5001", postId: "5001_249562",
    thumbnail: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&q=80",
    format: "single_image", status: "active",
    spend30d: 27430, ctr30d: 2.3, roas30d: 3.5,
  },
  {
    id: "rad_060", name: "Sense Ortho Mattress — Chiropractor Recommended Demo",
    pageName: "Sleepyhead", fbPageId: "fb_5001", postId: "5001_251078",
    thumbnail: "https://images.unsplash.com/photo-1586367474466-3b09c1d6d3b1?w=400&q=80",
    format: "carousel", status: "active",
    spend30d: 15680, ctr30d: 1.9, roas30d: 2.7,
  },
];

export const CUSTOM_AUDIENCES: CustomAudienceV2[] = [
  { id: "ca_001", name: "Purchasers — 180d", type: "custom_list", estimatedSize: 48200, accountId: "act_mamaearth" },
  { id: "ca_002", name: "Website Visitors — 30d", type: "website_traffic", estimatedSize: 312000, accountId: "act_mamaearth" },
  { id: "ca_003", name: "LAL 1% — Purchasers IN", type: "lookalike", estimatedSize: 2100000, accountId: "act_mamaearth" },
  { id: "ca_004", name: "IG Engagers — 90d", type: "engagement", estimatedSize: 89400, accountId: "act_boat" },
  { id: "ca_005", name: "LAL 2% — High LTV", type: "lookalike", estimatedSize: 4400000, accountId: "act_boat" },
  { id: "ca_006", name: "ATC Abandonners — 14d", type: "website_traffic", estimatedSize: 22100, accountId: "act_sleepy" },
];
