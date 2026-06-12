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
  facebook: { feeds: true, inStreamVideos: true, stories: true, reels: true, searchResults: true, marketplace: true },
  instagram: { feed: true, profileFeed: true, stories: true, reels: true, explore: true },
  audienceNetwork: { nativeBannerInterstitial: true, rewardedVideos: true },
  messenger: { inbox: true, stories: true },
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

/** Current active ads on a page (for the 250-cap meter). */
export function pageActiveAds(fbPageId: string): number {
  for (const a of MOCK_ACCOUNTS) {
    const pg = a.pages.find((p) => p.fbPageId === fbPageId);
    if (pg) return pg.activeAds;
  }
  return 0;
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
    pageName: "Mamaearth", postId: "1789234567890_9988776655",
    thumbnail: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80",
    format: "single_image", status: "active",
    spend30d: 41200, ctr30d: 3.4, roas30d: 4.8,
  },
  {
    id: "rad_002", name: "Freedom Spot — 15s",
    pageName: "boAt Lifestyle", postId: "1654321098765_1122334455",
    thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
    format: "single_video", status: "active",
    spend30d: 28700, ctr30d: 2.1, roas30d: undefined,
  },
  {
    id: "rad_003", name: "Deep Rest — Testimonial",
    pageName: "Sleepyhead", postId: "1456789012345_5566778899",
    thumbnail: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=400&q=80",
    format: "single_video", status: "paused",
    spend30d: 19800, ctr30d: 1.8, roas30d: undefined,
  },
  {
    id: "rad_004", name: "Noise ColorFit — Carousel",
    pageName: "Noise", postId: "1321456789876_3344556677",
    thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
    format: "carousel", status: "active",
    spend30d: 34100, ctr30d: 4.2, roas30d: 3.6,
  },
  {
    id: "rad_005", name: "Mensa — Office Style UGC",
    pageName: "Mensa Brands", postId: "1213456781234_7788990011",
    thumbnail: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&q=80",
    format: "single_video", status: "active",
    spend30d: 61400, ctr30d: 2.9, roas30d: undefined,
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
