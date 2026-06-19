import type { AdUnitV2, LaunchRunV2 } from "../types";

function daysAgoIso(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function makeUnit(
  id: string,
  unitNum: number,
  campaignName: string,
  adSetName: string,
  creativeName: string,
  accountId: string,
  accountName: string,
  currency: string,
  pageId: string,
  fbPageId: string,
  pageName: string,
  status: AdUnitV2["status"],
  failed = false
): AdUnitV2 {
  return {
    id,
    name: `${campaignName} › ${adSetName} › ${creativeName}`,
    campaignName,
    adSetName,
    creativeName,
    target: {
      accountId,
      accountName,
      currency,
      pageId,
      fbPageId,
      pageName,
    },
    status,
    ...(failed
      ? {
          failure: {
            code: "API_ERROR_400",
            message: "Ad account daily limit reached",
            retryable: true,
          },
        }
      : {}),
  };
}

const SEED_RUNS: LaunchRunV2[] = [
  // Run 1: Mamaearth — completed, 4 units
  {
    id: "seed_run_01",
    planId: "plan_seed_01",
    planHash: "hash_1",
    name: "Mamaearth — Scale Sales IN Metro #247",
    status: "completed",
    budgetPerDay: 15000,
    currency: "INR",
    requested: 40,
    created: 40,
    failed: 0,
    pending: 0,
    retryCount: 0,
    createdAt: daysAgoIso(0),
    units: [
      makeUnit("seed_run_01_u1", 1, "Mamaearth Scale Sales", "Metro Women 25-34", "Video Testimonial", "act_111001", "Mamaearth Main", "INR", "page_mama01", "fb_mama01", "Mamaearth India", "created"),
      makeUnit("seed_run_01_u2", 2, "Mamaearth Scale Sales", "Metro Men 25-34", "Carousel Product", "act_111001", "Mamaearth Main", "INR", "page_mama01", "fb_mama01", "Mamaearth India", "created"),
      makeUnit("seed_run_01_u3", 3, "Mamaearth Scale Sales", "Metro Retargeting", "Single Image CTA", "act_111002", "Mamaearth Secondary", "INR", "page_mama01", "fb_mama01", "Mamaearth India", "created"),
      makeUnit("seed_run_01_u4", 4, "Mamaearth Scale Sales", "Lookalike 1pct", "DPA Feed", "act_111002", "Mamaearth Secondary", "INR", "page_mama01", "fb_mama01", "Mamaearth India", "created"),
    ],
  },

  // Run 2: boAt — partial, 2 created + 1 failed
  {
    id: "seed_run_02",
    planId: "plan_seed_02",
    planHash: "hash_2",
    name: "boAt India — Test Image ABO #31",
    status: "partial",
    budgetPerDay: 2000,
    currency: "INR",
    requested: 12,
    created: 8,
    failed: 4,
    pending: 0,
    retryCount: 1,
    createdAt: daysAgoIso(1),
    units: [
      makeUnit("seed_run_02_u1", 1, "boAt Test Image ABO", "Youth 18-24", "Lifestyle Image 1", "act_222001", "boAt India Ads", "INR", "page_boat01", "fb_boat01", "boAt India", "created"),
      makeUnit("seed_run_02_u2", 2, "boAt Test Image ABO", "Music Enthusiasts", "Lifestyle Image 2", "act_222001", "boAt India Ads", "INR", "page_boat01", "fb_boat01", "boAt India", "created"),
      makeUnit("seed_run_02_u3", 3, "boAt Test Image ABO", "Tech Audience", "Product Flat Lay", "act_222002", "boAt India Secondary", "INR", "page_boat01", "fb_boat01", "boAt India", "failed", true),
    ],
  },

  // Run 3: mCaffeine — completed
  {
    id: "seed_run_03",
    planId: "plan_seed_03",
    planHash: "hash_3",
    name: "mCaffeine — DPA Retargeting #8",
    status: "completed",
    budgetPerDay: 8000,
    currency: "INR",
    requested: 18,
    created: 18,
    failed: 0,
    pending: 0,
    retryCount: 0,
    createdAt: daysAgoIso(2),
    units: [
      makeUnit("seed_run_03_u1", 1, "mCaffeine DPA Retargeting", "Cart Abandoners", "DPA Dynamic Creative", "act_333001", "mCaffeine Ads", "INR", "page_mcaf01", "fb_mcaf01", "mCaffeine", "created"),
      makeUnit("seed_run_03_u2", 2, "mCaffeine DPA Retargeting", "Product Viewers 7d", "DPA Collection", "act_333001", "mCaffeine Ads", "INR", "page_mcaf01", "fb_mcaf01", "mCaffeine", "created"),
      makeUnit("seed_run_03_u3", 3, "mCaffeine DPA Retargeting", "Buyers Upsell", "DPA Story Format", "act_333001", "mCaffeine Ads", "INR", "page_mcaf01", "fb_mcaf01", "mCaffeine", "created"),
    ],
  },

  // Run 4: Noise — failed
  {
    id: "seed_run_04",
    planId: "plan_seed_04",
    planHash: "hash_4",
    name: "Noise India — Awareness Reels #14",
    status: "failed",
    budgetPerDay: 4000,
    currency: "INR",
    requested: 8,
    created: 0,
    failed: 8,
    pending: 0,
    retryCount: 2,
    createdAt: daysAgoIso(3),
    units: [
      makeUnit("seed_run_04_u1", 1, "Noise Awareness Reels", "Broad 18-35", "Reels Creative A", "act_444001", "Noise India Ads", "INR", "page_noise01", "fb_noise01", "Noise India", "failed", true),
      makeUnit("seed_run_04_u2", 2, "Noise Awareness Reels", "Tech Interest", "Reels Creative B", "act_444001", "Noise India Ads", "INR", "page_noise01", "fb_noise01", "Noise India", "failed", true),
      makeUnit("seed_run_04_u3", 3, "Noise Awareness Reels", "Lookalike Buyers", "Reels Creative C", "act_444002", "Noise Secondary", "INR", "page_noise01", "fb_noise01", "Noise India", "failed", true),
    ],
  },

  // Run 5: Plix — completed
  {
    id: "seed_run_05",
    planId: "plan_seed_05",
    planHash: "hash_5",
    name: "Plix Wellness — Lead Gen Form #5",
    status: "completed",
    budgetPerDay: 5000,
    currency: "INR",
    requested: 9,
    created: 9,
    failed: 0,
    pending: 0,
    retryCount: 0,
    createdAt: daysAgoIso(4),
    units: [
      makeUnit("seed_run_05_u1", 1, "Plix Lead Gen Form", "Wellness Seekers", "Form Creative A", "act_555001", "Plix Wellness Ads", "INR", "page_plix01", "fb_plix01", "Plix Wellness", "created"),
      makeUnit("seed_run_05_u2", 2, "Plix Lead Gen Form", "Fitness Audience", "Form Creative B", "act_555001", "Plix Wellness Ads", "INR", "page_plix01", "fb_plix01", "Plix Wellness", "created"),
      makeUnit("seed_run_05_u3", 3, "Plix Lead Gen Form", "Lookalike Subscribers", "Form Creative C", "act_555001", "Plix Wellness Ads", "INR", "page_plix01", "fb_plix01", "Plix Wellness", "created"),
    ],
  },

  // Run 6: Sleepyhead — completed, high budget
  {
    id: "seed_run_06",
    planId: "plan_seed_06",
    planHash: "hash_6",
    name: "Sleepyhead — Scale Collection #19",
    status: "completed",
    budgetPerDay: 50000,
    currency: "INR",
    requested: 60,
    created: 60,
    failed: 0,
    pending: 0,
    retryCount: 0,
    createdAt: daysAgoIso(5),
    units: [
      makeUnit("seed_run_06_u1", 1, "Sleepyhead Scale Collection", "Home Owners 25-44", "Collection Video", "act_666001", "Sleepyhead Main", "INR", "page_sleep01", "fb_sleep01", "Sleepyhead", "created"),
      makeUnit("seed_run_06_u2", 2, "Sleepyhead Scale Collection", "New Home Buyers", "Collection Carousel", "act_666001", "Sleepyhead Main", "INR", "page_sleep01", "fb_sleep01", "Sleepyhead", "created"),
      makeUnit("seed_run_06_u3", 3, "Sleepyhead Scale Collection", "Retargeting 30d", "Single Image Offer", "act_666002", "Sleepyhead Secondary", "INR", "page_sleep01", "fb_sleep01", "Sleepyhead", "created"),
      makeUnit("seed_run_06_u4", 4, "Sleepyhead Scale Collection", "Lookalike Purchasers", "DPA Feed Creative", "act_666002", "Sleepyhead Secondary", "INR", "page_sleep01", "fb_sleep01", "Sleepyhead", "created"),
    ],
  },

  // Run 7: Kapiva — stale, 2 pending
  {
    id: "seed_run_07",
    planId: "plan_seed_07",
    planHash: "hash_7",
    name: "Kapiva Ayurveda — Engagement CBO #7",
    status: "stale",
    budgetPerDay: 3000,
    currency: "INR",
    requested: 12,
    created: 10,
    failed: 0,
    pending: 2,
    retryCount: 0,
    createdAt: daysAgoIso(6),
    units: [
      makeUnit("seed_run_07_u1", 1, "Kapiva Engagement CBO", "Ayurveda Audience", "Video Awareness", "act_777001", "Kapiva Ayurveda Ads", "INR", "page_kapi01", "fb_kapi01", "Kapiva Ayurveda", "created"),
      makeUnit("seed_run_07_u2", 2, "Kapiva Engagement CBO", "Health Conscious 30+", "Carousel Products", "act_777001", "Kapiva Ayurveda Ads", "INR", "page_kapi01", "fb_kapi01", "Kapiva Ayurveda", "created"),
      makeUnit("seed_run_07_u3", 3, "Kapiva Engagement CBO", "Retargeting Website", "Single Image CTA", "act_777001", "Kapiva Ayurveda Ads", "INR", "page_kapi01", "fb_kapi01", "Kapiva Ayurveda", "pending"),
    ],
  },

  // Run 8: Bombay Shaving Co — completed
  {
    id: "seed_run_08",
    planId: "plan_seed_08",
    planHash: "hash_8",
    name: "Bombay Shaving Co — ROAS Video #22",
    status: "completed",
    budgetPerDay: 20000,
    currency: "INR",
    requested: 32,
    created: 32,
    failed: 0,
    pending: 0,
    retryCount: 0,
    createdAt: daysAgoIso(8),
    units: [
      makeUnit("seed_run_08_u1", 1, "BSC ROAS Video", "Men 22-40 Grooming", "Shaving Video A", "act_888001", "Bombay Shaving Co", "INR", "page_bsc01", "fb_bsc01", "Bombay Shaving Company", "created"),
      makeUnit("seed_run_08_u2", 2, "BSC ROAS Video", "Skincare Interest", "Shaving Video B", "act_888001", "Bombay Shaving Co", "INR", "page_bsc01", "fb_bsc01", "Bombay Shaving Company", "created"),
      makeUnit("seed_run_08_u3", 3, "BSC ROAS Video", "Purchase Retargeting", "Product Demo Video", "act_888002", "BSC Secondary Account", "INR", "page_bsc01", "fb_bsc01", "Bombay Shaving Company", "created"),
      makeUnit("seed_run_08_u4", 4, "BSC ROAS Video", "Lookalike Buyers 2pct", "Unboxing Video", "act_888002", "BSC Secondary Account", "INR", "page_bsc01", "fb_bsc01", "Bombay Shaving Company", "created"),
    ],
  },

  // Run 9: Mensa — USD, completed
  {
    id: "seed_run_09",
    planId: "plan_seed_09",
    planHash: "hash_9",
    name: "Mensa Brands US — Scale USD #3",
    status: "completed",
    budgetPerDay: 500,
    currency: "USD",
    requested: 24,
    created: 24,
    failed: 0,
    pending: 0,
    retryCount: 0,
    createdAt: daysAgoIso(10),
    units: [
      makeUnit("seed_run_09_u1", 1, "Mensa US Scale", "US Women 25-45", "Brand Video US", "act_999001", "Mensa US Account", "USD", "page_mens01", "fb_mens01", "Mensa Brands", "created"),
      makeUnit("seed_run_09_u2", 2, "Mensa US Scale", "High Income HH", "Carousel Collection", "act_999001", "Mensa US Account", "USD", "page_mens01", "fb_mens01", "Mensa Brands", "created"),
      makeUnit("seed_run_09_u3", 3, "Mensa US Scale", "Retargeting 14d", "Single Image Offer", "act_999001", "Mensa US Account", "USD", "page_mens01", "fb_mens01", "Mensa Brands", "created"),
    ],
  },

  // Run 10: boAt — partial, 7 failed
  {
    id: "seed_run_10",
    planId: "plan_seed_10",
    planHash: "hash_10",
    name: "boAt India — Scale Multi-Account #44",
    status: "partial",
    budgetPerDay: 25000,
    currency: "INR",
    requested: 45,
    created: 38,
    failed: 7,
    pending: 0,
    retryCount: 1,
    createdAt: daysAgoIso(12),
    units: [
      makeUnit("seed_run_10_u1", 1, "boAt Scale Multi-Account", "Premium Earbuds Audience", "Product Launch Video", "act_222001", "boAt India Ads", "INR", "page_boat01", "fb_boat01", "boAt India", "created"),
      makeUnit("seed_run_10_u2", 2, "boAt Scale Multi-Account", "Gaming Community", "Lifestyle Carousel", "act_222003", "boAt India Account B", "INR", "page_boat01", "fb_boat01", "boAt India", "created"),
      makeUnit("seed_run_10_u3", 3, "boAt Scale Multi-Account", "Music Streamers", "Single Image Ad", "act_222004", "boAt India Account C", "INR", "page_boat01", "fb_boat01", "boAt India", "failed", true),
    ],
  },

  // Run 11: Mamaearth — completed, small test
  {
    id: "seed_run_11",
    planId: "plan_seed_11",
    planHash: "hash_11",
    name: "Mamaearth — Test Image ABO #31",
    status: "completed",
    budgetPerDay: 1500,
    currency: "INR",
    requested: 6,
    created: 6,
    failed: 0,
    pending: 0,
    retryCount: 0,
    createdAt: daysAgoIso(14),
    units: [
      makeUnit("seed_run_11_u1", 1, "Mamaearth Test Image ABO", "Control Group", "Image Variant A", "act_111001", "Mamaearth Main", "INR", "page_mama01", "fb_mama01", "Mamaearth India", "created"),
      makeUnit("seed_run_11_u2", 2, "Mamaearth Test Image ABO", "Test Group", "Image Variant B", "act_111001", "Mamaearth Main", "INR", "page_mama01", "fb_mama01", "Mamaearth India", "created"),
    ],
  },

  // Run 12: Noise Global — USD
  {
    id: "seed_run_12",
    planId: "plan_seed_12",
    planHash: "hash_12",
    name: "Noise Global — Awareness USD #2",
    status: "completed",
    budgetPerDay: 300,
    currency: "USD",
    requested: 6,
    created: 6,
    failed: 0,
    pending: 0,
    retryCount: 0,
    createdAt: daysAgoIso(18),
    units: [
      makeUnit("seed_run_12_u1", 1, "Noise Global Awareness", "US Tech Enthusiasts", "Brand Awareness Video", "act_444003", "Noise Global Ads", "USD", "page_noise02", "fb_noise02", "Noise Global", "created"),
      makeUnit("seed_run_12_u2", 2, "Noise Global Awareness", "UK Sports Audience", "Reels Awareness", "act_444003", "Noise Global Ads", "USD", "page_noise02", "fb_noise02", "Noise Global", "created"),
      makeUnit("seed_run_12_u3", 3, "Noise Global Awareness", "AUS Fitness", "Story Ad Format", "act_444003", "Noise Global Ads", "USD", "page_noise02", "fb_noise02", "Noise Global", "created"),
    ],
  },

  // Run 13: Plix — failed
  {
    id: "seed_run_13",
    planId: "plan_seed_13",
    planHash: "hash_13",
    name: "Plix Wellness — Leads Carousel #11",
    status: "failed",
    budgetPerDay: 2500,
    currency: "INR",
    requested: 8,
    created: 0,
    failed: 8,
    pending: 0,
    retryCount: 3,
    createdAt: daysAgoIso(22),
    units: [
      makeUnit("seed_run_13_u1", 1, "Plix Leads Carousel", "Weight Loss Seekers", "Carousel Slide 1-5", "act_555001", "Plix Wellness Ads", "INR", "page_plix01", "fb_plix01", "Plix Wellness", "failed", true),
      makeUnit("seed_run_13_u2", 2, "Plix Leads Carousel", "Fitness Enthusiasts", "Carousel Offer", "act_555002", "Plix Secondary", "INR", "page_plix01", "fb_plix01", "Plix Wellness", "failed", true),
      makeUnit("seed_run_13_u3", 3, "Plix Leads Carousel", "Health Goals Audience", "Carousel Testimonial", "act_555002", "Plix Secondary", "INR", "page_plix01", "fb_plix01", "Plix Wellness", "failed", true),
    ],
  },

  // Run 14: Kapiva — completed, oldest
  {
    id: "seed_run_14",
    planId: "plan_seed_14",
    planHash: "hash_14",
    name: "Kapiva Ayurveda — Scale App CBO #6",
    status: "completed",
    budgetPerDay: 12000,
    currency: "INR",
    requested: 20,
    created: 20,
    failed: 0,
    pending: 0,
    retryCount: 0,
    createdAt: daysAgoIso(30),
    units: [
      makeUnit("seed_run_14_u1", 1, "Kapiva Scale App CBO", "App Install Audience", "App Install Video", "act_777001", "Kapiva Ayurveda Ads", "INR", "page_kapi01", "fb_kapi01", "Kapiva Ayurveda", "created"),
      makeUnit("seed_run_14_u2", 2, "Kapiva Scale App CBO", "Re-engage Users", "App Retargeting", "act_777001", "Kapiva Ayurveda Ads", "INR", "page_kapi01", "fb_kapi01", "Kapiva Ayurveda", "created"),
      makeUnit("seed_run_14_u3", 3, "Kapiva Scale App CBO", "Lookalike App Users", "App Creative B", "act_777002", "Kapiva Secondary Ads", "INR", "page_kapi01", "fb_kapi01", "Kapiva Ayurveda", "created"),
      makeUnit("seed_run_14_u4", 4, "Kapiva Scale App CBO", "High Value Users", "App Creative C", "act_777002", "Kapiva Secondary Ads", "INR", "page_kapi01", "fb_kapi01", "Kapiva Ayurveda", "created"),
    ],
  },
];

/** The 14 realistic seed runs. Used by runsService to auto-seed on first load. */
export { SEED_RUNS };
