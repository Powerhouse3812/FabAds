/**
 * Shared mock pools for Bulk Launch Distribution tests and UI previews.
 * Pure data + tiny builders — no React / no Supabase.
 */
import type { TargetPair, DistAd, DistAdset } from "./launch-distribution";

// ─── Target pairs ──────────────────────────────────────────────────────────────

/** Two distinct ad accounts, each with its own distinct Facebook Page. */
export const PAIR_ACC_A_PAGE_1: TargetPair = {
  ad_account_id: "act_A",
  account_name: "Account A",
  page_id: "link_A_1",
  fb_page_id: "fbpage_1",
  page_name: "Sunrise Coffee",
};

export const PAIR_ACC_B_PAGE_2: TargetPair = {
  ad_account_id: "act_B",
  account_name: "Account B",
  page_id: "link_B_2",
  fb_page_id: "fbpage_2",
  page_name: "Moonlit Tea",
};

export const PAIR_ACC_C_PAGE_3: TargetPair = {
  ad_account_id: "act_C",
  account_name: "Account C",
  page_id: "link_C_3",
  fb_page_id: "fbpage_3",
  page_name: "Harbor Bakery",
};

/**
 * SAME Facebook Page (`fbpage_1`) linked under TWO different ad accounts.
 * These two pairs MUST share one 250-slot capacity bucket.
 */
export const PAIR_ACC_A_SHARED_PAGE: TargetPair = {
  ad_account_id: "act_A",
  account_name: "Account A",
  page_id: "link_A_shared",
  fb_page_id: "fbpage_shared",
  page_name: "Shared Brand Page",
};

export const PAIR_ACC_B_SHARED_PAGE: TargetPair = {
  ad_account_id: "act_B",
  account_name: "Account B",
  page_id: "link_B_shared",
  fb_page_id: "fbpage_shared", // <-- intentionally identical fb_page_id
  page_name: "Shared Brand Page",
};

export const THREE_DISTINCT_PAIRS: TargetPair[] = [PAIR_ACC_A_PAGE_1, PAIR_ACC_B_PAGE_2, PAIR_ACC_C_PAGE_3];

export const TWO_PAIRS_SHARED_PAGE: TargetPair[] = [PAIR_ACC_A_SHARED_PAGE, PAIR_ACC_B_SHARED_PAGE];

// ─── Ad builders ────────────────────────────────────────────────────────────────

/** Build `count` ads with a given status, all parented to one adset. */
export function makeAds(count: number, status: string, adsetId = "adset_1", prefix = "ad"): DistAd[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}_${status}_${i + 1}`,
    status,
    adset_id: adsetId,
  }));
}

export function makeActiveAds(count: number, adsetId = "adset_1"): DistAd[] {
  return makeAds(count, "active", adsetId, "active");
}

export function makePausedAds(count: number, adsetId = "adset_1"): DistAd[] {
  return makeAds(count, "paused", adsetId, "paused");
}

// ─── Adset pools ──────────────────────────────────────────────────────────────

export const ADSET_USD: DistAdset = { id: "adset_usd", budget_value: 100, currency: "USD" };
export const ADSET_INR: DistAdset = { id: "adset_inr", budget_value: 5000, currency: "INR" };
export const ADSET_EUR_ZERO: DistAdset = { id: "adset_eur_zero", budget_value: 0, currency: "EUR" };
export const ADSET_GBP_NULL: DistAdset = { id: "adset_gbp_null", budget_value: null, currency: "GBP" };

export const MIXED_CURRENCY_ADSETS: DistAdset[] = [ADSET_USD, ADSET_INR, ADSET_EUR_ZERO, ADSET_GBP_NULL];
