/** Real Meta Marketing API response shapes (mock values — swap-ready for live Graph API).
 *
 * IDs mirror the MOCK_ACCOUNTS in src/launch2/data/mockData.ts so that the
 * pre-flight validation layer can look up any TargetPair used in mockLaunchV2.
 *
 * account_status codes:
 *   1 = ACTIVE  2 = DISABLED  3 = UNSETTLED  7 = PENDING_RISK_REVIEW
 *
 * min_daily_budget is in the account currency's smallest unit
 *   (i.e. "cents" for USD/EUR/GBP/etc., "paise" for INR).
 *   Examples:  100 = $1.00 USD  |  5000 = ₹50.00 INR
 */

/* ── Interface shapes (aligned to Meta Graph API field names) ─────────── */

export interface MetaAdAccount {
  id: string;                      // "act_XXXXXXXX" (matches TargetPair.accountId)
  name: string;
  account_status: 1 | 2 | 3 | 7;  // 1=ACTIVE 2=DISABLED 3=UNSETTLED 7=PENDING_RISK_REVIEW
  currency: string;                // ISO-4217 e.g. "USD", "INR"
  has_payment_method: boolean;
  min_daily_budget: number;        // in account currency smallest unit (cents / paise)
  timezone_name: string;           // IANA tz, e.g. "America/Los_Angeles" / "Asia/Kolkata"
  disable_reason?: number;         // set when account_status !== 1
}

export interface MetaPage {
  id: string;                      // Facebook page ID (matches TargetPair.fbPageId)
  name: string;
  leadgen_tos_accepted: boolean;
  is_published: boolean;
}

export interface MetaDataset {     // "Pixel" in old API; "Dataset" in CAPI v17+
  id: string;                      // matches TargetPair.pixelId
  name: string;
  account_id: string;              // parent ad account id e.g. "act_281734592837"
}

/* ── Objective → valid optimization_goal combos (Meta ODAX spec) ─────── */

/** All valid optimization_goal values per objective (from Meta ODAX spec). */
export const VALID_OPTIMIZATION_GOALS: Record<string, string[]> = {
  OUTCOME_AWARENESS:      ["REACH", "IMPRESSIONS", "AD_RECALL_LIFT", "THRUPLAY"],
  OUTCOME_TRAFFIC:        ["LINK_CLICKS", "LANDING_PAGE_VIEWS", "REACH", "IMPRESSIONS", "CONVERSATIONS"],
  OUTCOME_ENGAGEMENT:     [
    "POST_ENGAGEMENT", "PAGE_LIKES", "EVENT_RESPONSES",
    "LINK_CLICKS", "REACH", "IMPRESSIONS", "CONVERSATIONS", "LEAD_GENERATION",
  ],
  OUTCOME_LEADS:          ["LEAD_GENERATION", "QUALITY_LEAD", "OFFSITE_CONVERSIONS", "LINK_CLICKS", "LANDING_PAGE_VIEWS"],
  OUTCOME_APP_PROMOTION:  ["APP_INSTALLS", "LINK_CLICKS", "OFFSITE_CONVERSIONS"],
  OUTCOME_SALES:          [
    "LINK_CLICKS", "LANDING_PAGE_VIEWS", "OFFSITE_CONVERSIONS",
    "VALUE", "REACH", "IMPRESSIONS",
  ],
};

/** Objectives that support Advantage+ Shopping (advantagePlus). */
export const ADVANTAGE_PLUS_OBJECTIVES = ["OUTCOME_SALES", "OUTCOME_LEADS"];

/** Objectives requiring promoted_object.pixel_id when goal is CONVERSIONS or VALUE. */
export const PIXEL_REQUIRED_OBJECTIVES = ["OUTCOME_SALES", "OUTCOME_LEADS"];

/* ── Mock ad accounts ────────────────────────────────────────────────── */
// Keys match TargetPair.accountId values in mockData.ts / useFlowV2 seed data.

export const MOCK_AD_ACCOUNTS: Record<string, MetaAdAccount> = {
  // Fully healthy — USD account, payment on file, generous budget floor
  act_acme_us: {
    id: "act_acme_us",
    name: "Acme US — Main",
    account_status: 1,
    currency: "USD",
    has_payment_method: true,
    min_daily_budget: 100,          // $1.00 USD minimum daily budget
    timezone_name: "America/Los_Angeles",
  },

  // Healthy INR account — Mamaearth (primary account in most flows)
  act_mamaearth: {
    id: "act_mamaearth",
    name: "Mamaearth India",
    account_status: 1,
    currency: "INR",
    has_payment_method: true,
    min_daily_budget: 5000,         // ₹50.00 INR minimum daily budget (Meta's typical floor for IN)
    timezone_name: "Asia/Kolkata",
  },

  // Healthy INR account — boAt
  act_boat: {
    id: "act_boat",
    name: "boAt Lifestyle",
    account_status: 1,
    currency: "INR",
    has_payment_method: true,
    min_daily_budget: 5000,         // ₹50.00 INR
    timezone_name: "Asia/Kolkata",
  },

  // Healthy INR account — Noise
  act_noise: {
    id: "act_noise",
    name: "Noise Official",
    account_status: 1,
    currency: "INR",
    has_payment_method: true,
    min_daily_budget: 5000,
    timezone_name: "Asia/Kolkata",
  },

  // USD edge-case account — high budget floor so C2 fires on low-budget plans
  act_fabads_test: {
    id: "act_fabads_test",
    name: "FabAds Test Account — USD Edge Case",
    account_status: 1,       // ACTIVE
    currency: "USD",
    has_payment_method: true,
    min_daily_budget: 5000,  // $50.00/day minimum — high enough to trigger C2 on low budgets
    timezone_name: "America/Los_Angeles",
  },

  // Edge-case: Unsettled (overdue balance) — no payment method on file
  act_sleepy: {
    id: "act_sleepy",
    name: "Sleepyhead Mattresses",
    account_status: 3,              // UNSETTLED — billing overdue
    currency: "INR",
    has_payment_method: false,
    min_daily_budget: 5000,
    timezone_name: "Asia/Kolkata",
    disable_reason: 3,              // billing issue
  },
};

/* ── Mock pages ──────────────────────────────────────────────────────── */
// Keys match TargetPair.fbPageId values from mockData.ts.

export const MOCK_PAGES: Record<string, MetaPage> = {
  // Acme pages
  fb_1001: {
    id: "fb_1001",
    name: "Acme Store",
    leadgen_tos_accepted: true,
    is_published: true,
  },
  fb_1002: {
    id: "fb_1002",
    name: "Acme Outlet",
    leadgen_tos_accepted: true,
    is_published: true,
  },

  // Mamaearth pages
  fb_2001: {
    id: "fb_2001",
    name: "Mamaearth",
    leadgen_tos_accepted: true,
    is_published: true,
  },
  fb_2002: {
    id: "fb_2002",
    name: "Mamaearth Skincare",
    leadgen_tos_accepted: false,    // Edge-case: leadgen TOS not yet accepted
    is_published: true,
  },

  // boAt pages
  fb_3001: {
    id: "fb_3001",
    name: "boAt Audio",
    leadgen_tos_accepted: true,
    is_published: true,
  },
  fb_3002: {
    id: "fb_3002",
    name: "boAt Wearables",
    leadgen_tos_accepted: true,
    is_published: true,
  },

  // Noise page
  fb_4001: {
    id: "fb_4001",
    name: "Noise Official",
    leadgen_tos_accepted: true,
    is_published: true,
  },

  // FabAds test page — LeadGen ToS not accepted, for C6 testing on a USD account
  fb_test_noleadgen: {
    id: "fb_test_noleadgen",
    name: "FabAds Test Page (No LeadGen ToS)",
    leadgen_tos_accepted: false,
    is_published: true,
  },

  // Sleepyhead page — unpublished (matches disabled account edge-case)
  fb_5001: {
    id: "fb_5001",
    name: "Sleepyhead",
    leadgen_tos_accepted: false,
    is_published: false,            // Edge-case: page not published
  },
};

/* ── Mock datasets (pixels) ─────────────────────────────────────────── */
// Keys match TargetPair.pixelId values from mockData.ts.

export const MOCK_DATASETS: Record<string, MetaDataset> = {
  px_acme: {
    id: "px_acme",
    name: "Acme Pixel",
    account_id: "act_acme_us",
  },
  px_mama: {
    id: "px_mama",
    name: "Mamaearth Pixel",
    account_id: "act_mamaearth",
  },
  px_boat: {
    id: "px_boat",
    name: "boAt Pixel",
    account_id: "act_boat",
  },
  px_noise: {
    id: "px_noise",
    name: "Noise Pixel",
    account_id: "act_noise",
  },
  px_sleepy: {
    id: "px_sleepy",
    name: "Sleepyhead Pixel",
    account_id: "act_sleepy",
  },
  px_fabads_test: {
    id: "px_fabads_test",
    name: "FabAds Test Pixel",
    account_id: "act_fabads_test",
  },
};
