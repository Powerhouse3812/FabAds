/**
 * variantData.ts — shared static data contract for the 4 dashboard-variant
 * showcase pages (Editorial / Terminal / Tonal / Classic Dark).
 *
 * This is a pure, hook-free, hardcoded snapshot faithful to the REAL AI-plan
 * dashboard content — sourced by reading (read-only, no imports):
 *   - AnalyticsHero.tsx        → genieKpis / industryKpis
 *   - CreditUsageCard.tsx      → credits
 *   - IndustryInsightsTile.tsx → creativeDistribution / trendingKeywords
 *   - ModeLauncherBar.tsx      → modes (mirrors OUTSIDE_CTAS)
 *   - RecentlyFetchedCard.tsx  → recentlyFetched
 *   - NewAdsFetchedTile.tsx    → newAdsFetched
 *   - RecentWorkStrip.tsx      → recentWork
 *   - ActivityLogsTile.tsx     → activity
 *   - mocks/shared/brands.ts   → Indian brand names (Mamaearth, Noise, Boat, ...)
 *
 * No hooks, no framework imports — every one of the 4 variant pages calls
 * getDashboardVariantData() and renders it however its own visual language
 * dictates. Keep this contract stable; the 4 pages import it verbatim.
 */

export interface VariantKpi {
  key: string;
  label: string;
  value: string;
  delta?: string;
  deltaDir?: "up" | "down";
  spark?: number[];
}

export interface VariantCredits {
  used: number;
  total: number;
  pct: number;
  burnPerDay: number;
  daysLeft: number;
}

export interface VariantModeAction {
  key: string;
  label: string;
  desc: string;
}

export interface VariantListItem {
  id: string;
  title: string;
  sub: string;
  time?: string;
  status?: string;
}

export interface VariantActivity {
  id: string;
  text: string;
  time: string;
  kind: string;
}

export interface VariantDonutSlice {
  name: string;
  value: number;
}

export interface DashboardVariantData {
  userName: string;
  genieKpis: VariantKpi[];
  industryKpis: VariantKpi[];
  credits: VariantCredits;
  creativeDistribution: VariantDonutSlice[];
  trendingKeywords: string[];
  modes: VariantModeAction[];
  recentlyFetched: VariantListItem[];
  newAdsFetched: VariantListItem[];
  recentWork: VariantListItem[];
  activity: VariantActivity[];
  sparkSeries: number[];
}

export function getDashboardVariantData(): DashboardVariantData {
  return {
    userName: "Rahul",

    // Row 1 — Genie insights (AnalyticsHero.tsx CardGenerations/Brands/Products/Categories)
    genieKpis: [
      {
        key: "generations",
        label: "Generations",
        value: "192",
        delta: "+4.5%",
        deltaDir: "up",
        spark: [8, 10, 13, 11, 14, 12, 15, 18, 16, 19, 17, 19],
      },
      {
        key: "brands",
        label: "Brands",
        value: "15",
        delta: "+4.5%",
        deltaDir: "up",
      },
      {
        key: "products",
        label: "Products",
        value: "47",
        delta: "+8%",
        deltaDir: "up",
      },
      {
        key: "categories",
        label: "Categories",
        value: "12",
        delta: "+2",
        deltaDir: "up",
      },
    ],

    // Row 2 — Industry insights (AnalyticsHero.tsx CardBrandsFollowed/Competitors/TotalAds/CategoriesTracked)
    industryKpis: [
      {
        key: "brands-followed",
        label: "Brands followed",
        value: "8",
        delta: "+1",
        deltaDir: "up",
      },
      {
        key: "competitors",
        label: "Competitors",
        value: "15 / 20",
        delta: "+4.5%",
        deltaDir: "up",
      },
      {
        key: "total-ads",
        label: "Total ads",
        value: "24,851",
        delta: "+12%",
        deltaDir: "up",
        spark: [
          14, 17, 15, 19, 22, 20, 24, 27, 23, 28, 31, 29, 33, 36, 32, 35, 39,
          42, 38, 43, 47, 45,
        ],
      },
      {
        key: "categories-tracked",
        label: "Categories tracked",
        value: "9",
        delta: "+2",
        deltaDir: "up",
      },
    ],

    // CreditUsageCard.tsx — used=1218/limit=1500 (81%), ~6/day burn,
    // reset date 2026-08-26; daysLeft computed against the snapshot's
    // "today" of 2026-07-10.
    credits: {
      used: 1218,
      total: 1500,
      pct: 81,
      burnPerDay: 6,
      daysLeft: 47,
    },

    // IndustryInsightsTile.tsx DONUT_DATA — Creatives 30, Videos 34
    creativeDistribution: [
      { name: "Creatives", value: 30 },
      { name: "Videos", value: 34 },
    ],

    // IndustryInsightsTile.tsx TRENDING_KEYWORDS
    trendingKeywords: ["skincare routine", "summer sale", "Vitamin C benefits"],

    // ModeLauncherBar.tsx — mirrors OUTSIDE_CTAS (genie6/generate-new/types)
    modes: [
      {
        key: "brand-ad",
        label: "Brand Ad",
        desc: "Hero ads anchored to a brand profile.",
      },
      {
        key: "product-ad",
        label: "Product Ad",
        desc: "Sell a specific product with brand context.",
      },
      {
        key: "affiliate-ad",
        label: "Affiliate Ad",
        desc: "Performance ads anchored to a category + landing page.",
      },
      {
        key: "product-shoot",
        label: "Product Shoot",
        desc: "Studio-quality product photography in any setting.",
      },
      {
        key: "ugc-video",
        label: "UGC Video",
        desc: "Avatar / script / talking-head video for any Type.",
      },
      {
        key: "variation",
        label: "Variations",
        desc: "Generate variants of a winning ad.",
      },
    ],

    // RecentlyFetchedCard.tsx FETCHED_ITEMS
    recentlyFetched: [
      {
        id: "mamaearth-f",
        title: "Mamaearth",
        sub: "8 new ads · Facebook, Instagram",
        time: "1d ago",
        status: "Brand",
      },
      {
        id: "boat-f",
        title: "Boat",
        sub: "6 new ads · Instagram, TikTok",
        time: "2d ago",
        status: "Competitor",
      },
      {
        id: "noise-f",
        title: "Noise",
        sub: "5 new ads · Facebook",
        time: "2d ago",
        status: "Competitor",
      },
      {
        id: "skincare-f",
        title: "Skincare",
        sub: "4 new ads · Instagram",
        time: "3d ago",
        status: "Category",
      },
      {
        id: "wearables-f",
        title: "Wearables",
        sub: "2 new ads · Google",
        time: "4d ago",
        status: "Category",
      },
    ],

    // NewAdsFetchedTile.tsx TOP_BRANDS
    newAdsFetched: [
      {
        id: "mamaearth",
        title: "Mamaearth",
        sub: "8 new · Facebook, Instagram",
        time: "3 min ago",
        status: "Brand",
      },
      {
        id: "boat",
        title: "Boat",
        sub: "6 new · Instagram, TikTok",
        time: "12 min ago",
        status: "Competitor",
      },
      {
        id: "noise",
        title: "Noise",
        sub: "5 new · Facebook",
        time: "18 min ago",
        status: "Competitor",
      },
      {
        id: "sleepyhead",
        title: "Sleepyhead",
        sub: "3 new · Google",
        time: "25 min ago",
        status: "Brand",
      },
      {
        id: "skincare-trends",
        title: "Skincare Trends",
        sub: "4 new · Instagram, TikTok",
        time: "31 min ago",
        status: "Category",
      },
      {
        id: "wearables",
        title: "Wearables",
        sub: "2 new · Google, Facebook",
        time: "40 min ago",
        status: "Category",
      },
    ],

    // RecentWorkStrip.tsx RECENT_WORK
    recentWork: [
      {
        id: "g-1",
        title: "Festive Diwali bundle — gifting angle",
        sub: "Brand Ad",
        time: "now",
        status: "in-progress",
      },
      {
        id: "g-2",
        title: "Mamaearth Vitamin C — UGC testimonial",
        sub: "UGC Video",
        time: "12 min ago",
        status: "success",
      },
      {
        id: "g-3",
        title: "Noise Smartwatch — discount push",
        sub: "Adcopy",
        time: "1 h ago",
        status: "success",
      },
      {
        id: "g-4",
        title: "Boat Stone speaker — image-to-video",
        sub: "Image-to-Ad",
        time: "2 h ago",
        status: "failed",
      },
      {
        id: "g-5",
        title: "Sleepyhead — winter sleep angle",
        sub: "Variant",
        time: "3 h ago",
        status: "queued",
      },
    ],

    // ActivityLogsTile.tsx ENTRIES
    activity: [
      {
        id: "1",
        text: "Profile removed: Rahul removed profile 'IdeaClan_FB' (ID: 12345)",
        time: "Today, 10:00 PM",
        kind: "destructive",
      },
      {
        id: "2",
        text: "Rahul removed Profile 'IdeaClan_FB' (ID: 12345)",
        time: "Today, 9:42 PM",
        kind: "info",
      },
      {
        id: "3",
        text: "You removed Ad account (ID: 90872)",
        time: "Today, 8:18 PM",
        kind: "info",
      },
      {
        id: "4",
        text: "Rule 'Pause Low Performance' applied to Ad set 'Test Ad set'. Action: Paused.",
        time: "Today, 6:30 PM",
        kind: "info",
      },
      {
        id: "5",
        text: "Rule 'Adjust Bids' applied to Ad 'Ad creative 1'. Action: Bid decreased by 5%.",
        time: "Today, 4:15 PM",
        kind: "info",
      },
      {
        id: "6",
        text: "Rule 'Optimize Budget' applied to campaign 'Summer sale'. Action: Budget increased by 10%.",
        time: "Today, 2:02 PM",
        kind: "info",
      },
    ],

    // Generic 22-point series for any variant page that wants a standalone
    // hero sparkline/area chart not tied to a specific KPI.
    sparkSeries: [
      14, 17, 15, 19, 22, 20, 24, 27, 23, 28, 31, 29, 33, 36, 32, 35, 39, 42,
      38, 43, 47, 45,
    ],
  };
}
