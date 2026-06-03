/**
 * Bulk Launch Distribution — selection rollup (Step 3).
 *
 * Step 3 surfaces four selection levels (Ad Accounts / Campaigns / Ad Groups /
 * Ads). Distribution operates on a flat, DEDUPED set of affected ads. This
 * module collapses whatever the user selected across levels into:
 *   - the union of affected ad ids (each ad counted ONCE even if reached via its
 *     campaign AND selected directly),
 *   - a {@link StatusSplit} (active / paused / unknown) for the distribution core,
 *   - level counts for the bulk bar headline ("2 campaigns -> 46 ad sets -> 180 ads"),
 *   - an `accountConstrained` flag.
 *
 * ─── Account-level is intentionally NOT rolled up ───────────────────────────
 * Campaigns, ad sets, and ads carry NO ad-account foreign key in `LaunchFull`
 * (an ad account links to a launch, not to individual campaigns). So an
 * account-level selection cannot be resolved to a concrete subset of ads. Rather
 * than silently rolling an account selection up to the WHOLE launch (which would
 * launch far more than the user pointed at), we flag `accountConstrained: true`
 * and contribute NOTHING from the account level. The bar/preview then guide the
 * user to select at Campaign / Ad Set / Ad level instead.
 *
 * Pure: no React / no Supabase.
 */
import type { LaunchFull, LaunchAd } from "@/hooks/use-launch-data";
import { splitByStatus, type DistAd, type StatusSplit } from "@/lib/launch-distribution";

/** Which Step-3 tab is driving the selection (mirrors the tab value). */
export type SelectionLevel = "accounts" | "campaigns" | "adgroups" | "ads";

export interface SelectionSets {
  accounts: Set<string>;
  campaigns: Set<string>;
  adgroups: Set<string>;
  ads: Set<string>;
}

export interface RollupCounts {
  accounts: number;
  campaigns: number;
  adsets: number;
  ads: number;
}

export interface SelectionRollup {
  /** Deduped affected ad ids (union across the active level + direct ad picks). */
  adIds: string[];
  /** Active / paused / unknown split of the affected ads, ready for the core. */
  statusSplit: StatusSplit;
  /** Counts for the headline. `accounts` reflects the raw account selection. */
  counts: RollupCounts;
  /** True when an account-level selection was made (cannot be distributed). */
  accountConstrained: boolean;
}

/** Map a LaunchAd to the minimal DistAd the distribution core consumes. */
function toDistAd(ad: LaunchAd): DistAd {
  return { id: ad.id, status: ad.status, adset_id: ad.adset_id };
}

/**
 * Roll a Step-3 selection up to a deduped set of affected ads + status split.
 *
 * `activeLevel` selects WHICH level drives the rollup (the tab the bulk bar is
 * shown on). Direct ad picks (`sel.ads`) are ALWAYS unioned in, so an ad chosen
 * via its campaign and also ticked directly is counted exactly once.
 *
 *  - "campaigns": every ad under every selected campaign (campaign -> adsets -> ads).
 *  - "adgroups":  every ad under every selected ad set.
 *  - "ads":       the directly selected ads.
 *  - "accounts":  contributes NO ads; sets `accountConstrained` (see file header).
 *
 * Regardless of `activeLevel`, if `sel.accounts` is non-empty we surface
 * `accountConstrained` so the UI can warn even while the user sits on another tab.
 */
export function rollupSelection(
  launch: LaunchFull,
  sel: SelectionSets,
  activeLevel: SelectionLevel
): SelectionRollup {
  const adById = new Map<string, LaunchAd>();
  for (const ad of launch.ads) adById.set(ad.id, ad);

  // adset_id -> ads (built once, reused for campaign + adgroup rollups).
  const adsByAdset = new Map<string, LaunchAd[]>();
  for (const ad of launch.ads) {
    const list = adsByAdset.get(ad.adset_id);
    if (list) list.push(ad);
    else adsByAdset.set(ad.adset_id, [ad]);
  }

  // campaign_id -> adset ids.
  const adsetsByCampaign = new Map<string, string[]>();
  for (const adset of launch.adsets) {
    const list = adsetsByCampaign.get(adset.campaign_id);
    if (list) list.push(adset.id);
    else adsetsByCampaign.set(adset.campaign_id, [adset.id]);
  }

  const affected = new Set<string>(); // deduped affected ad ids
  const touchedAdsets = new Set<string>();
  const touchedCampaigns = new Set<string>();

  const addAd = (ad: LaunchAd | undefined) => {
    if (!ad) return;
    affected.add(ad.id);
    touchedAdsets.add(ad.adset_id);
  };

  // 1) Level-driven contribution.
  if (activeLevel === "campaigns") {
    for (const campaignId of sel.campaigns) {
      touchedCampaigns.add(campaignId);
      const adsetIds = adsetsByCampaign.get(campaignId) ?? [];
      for (const adsetId of adsetIds) {
        for (const ad of adsByAdset.get(adsetId) ?? []) addAd(ad);
      }
    }
  } else if (activeLevel === "adgroups") {
    for (const adsetId of sel.adgroups) {
      for (const ad of adsByAdset.get(adsetId) ?? []) addAd(ad);
    }
  } else if (activeLevel === "ads") {
    for (const adId of sel.ads) addAd(adById.get(adId));
  }
  // "accounts": no ad contribution by design (see header).

  // 2) Direct ad picks ALWAYS union in (cross-level dedupe is automatic via the Set).
  if (activeLevel !== "ads") {
    for (const adId of sel.ads) addAd(adById.get(adId));
  }

  // Derive parent campaigns for the touched adsets (for an honest adset/campaign count).
  if (touchedAdsets.size > 0) {
    const campaignByAdset = new Map<string, string>();
    for (const adset of launch.adsets) campaignByAdset.set(adset.id, adset.campaign_id);
    for (const adsetId of touchedAdsets) {
      const campaignId = campaignByAdset.get(adsetId);
      if (campaignId) touchedCampaigns.add(campaignId);
    }
  }

  const adIds = Array.from(affected);
  const distAds: DistAd[] = adIds.map((id) => toDistAd(adById.get(id)!));
  const statusSplit = splitByStatus(distAds);

  const accountConstrained = sel.accounts.size > 0;

  return {
    adIds,
    statusSplit,
    counts: {
      accounts: sel.accounts.size,
      campaigns: touchedCampaigns.size,
      adsets: touchedAdsets.size,
      ads: adIds.length,
    },
    accountConstrained,
  };
}
