import { describe, it, expect } from "vitest";
import { rollupSelection, type SelectionSets } from "./launch-selection-rollup";
import type { LaunchFull, LaunchAd, LaunchAdset, LaunchCampaign, LaunchAdAccount } from "@/hooks/use-launch-data";

// ─── Minimal LaunchFull builder ─────────────────────────────────────────────
// Hierarchy used across tests:
//   camp_1
//     adset_1 -> ad_1 (active), ad_2 (paused)
//     adset_2 -> ad_3 (active), ad_4 (weird/unknown)
//   camp_2
//     adset_3 -> ad_5 (active)

function ad(id: string, adset_id: string, status: string): LaunchAd {
  return {
    id, launch_id: "L", adset_id, workspace_id: "W", name: id,
    primary_text: null, headline: null, description: null, cta: null,
    destination_url: null, display_link: null, media_urls: null, media_type: null,
    sort_order: 0, status,
  };
}
function adset(id: string, campaign_id: string): LaunchAdset {
  return {
    id, launch_id: "L", campaign_id, workspace_id: "W", name: id,
    schedule_start: null, schedule_end: null, targeting: null, placements: null,
    performance_goal: null, budget_value: 100, budget_period: null, bid_strategy: null,
    bid_amount: null, delivery_type: null, sort_order: 0, status: "active",
  };
}
function campaign(id: string): LaunchCampaign {
  return {
    id, launch_id: "L", workspace_id: "W", name: id, objective: null, budget_type: null,
    budget_period: null, budget_value: null, bid_strategy: null, delivery_type: null,
    special_ad_category: null, sort_order: 0, status: "active", catalogue_ads_override: null,
  };
}
function account(id: string): LaunchAdAccount {
  return { id, launch_id: "L", fb_ad_account_id: `fb_${id}`, workspace_id: "W", setup_config: null };
}

const LAUNCH: LaunchFull = {
  id: "L", workspace_id: "W", name: "Test", status: "draft", platform: "facebook",
  launch_config: null, created_by: "u", created_at: "", updated_at: "", completed_step: 2,
  targeting_template_id: null,
  ad_accounts: [account("acc_1"), account("acc_2")],
  campaigns: [campaign("camp_1"), campaign("camp_2")],
  adsets: [adset("adset_1", "camp_1"), adset("adset_2", "camp_1"), adset("adset_3", "camp_2")],
  ads: [
    ad("ad_1", "adset_1", "active"),
    ad("ad_2", "adset_1", "paused"),
    ad("ad_3", "adset_2", "active"),
    ad("ad_4", "adset_2", "in_review"), // unknown status
    ad("ad_5", "adset_3", "active"),
  ],
};

function emptySel(): SelectionSets {
  return { accounts: new Set(), campaigns: new Set(), adgroups: new Set(), ads: new Set() };
}

describe("rollupSelection", () => {
  it("rolls a campaign down to all its ads with a correct status split", () => {
    const sel = { ...emptySel(), campaigns: new Set(["camp_1"]) };
    const r = rollupSelection(LAUNCH, sel, "campaigns");

    expect(r.adIds.sort()).toEqual(["ad_1", "ad_2", "ad_3", "ad_4"]);
    expect(r.counts.campaigns).toBe(1);
    expect(r.counts.adsets).toBe(2);
    expect(r.counts.ads).toBe(4);
    expect(r.statusSplit.active.map((a) => a.id).sort()).toEqual(["ad_1", "ad_3"]);
    expect(r.statusSplit.paused.map((a) => a.id)).toEqual(["ad_2"]);
    expect(r.statusSplit.unknown.map((a) => a.id)).toEqual(["ad_4"]); // never treated as paused
    expect(r.accountConstrained).toBe(false);
  });

  it("DEDUPES an ad reached via its campaign AND selected directly (counted once)", () => {
    // camp_1 already includes ad_1; also tick ad_1 directly. Must appear ONCE.
    const sel = {
      ...emptySel(),
      campaigns: new Set(["camp_1"]),
      ads: new Set(["ad_1"]),
    };
    const r = rollupSelection(LAUNCH, sel, "campaigns");

    const occurrences = r.adIds.filter((id) => id === "ad_1").length;
    expect(occurrences).toBe(1);
    expect(r.adIds.sort()).toEqual(["ad_1", "ad_2", "ad_3", "ad_4"]);
    expect(r.counts.ads).toBe(4); // not 5 — no double count
  });

  it("unions a cross-campaign direct ad pick into a campaign rollup once", () => {
    // Active level = campaigns (camp_1 -> ad_1..ad_4), plus direct ad_5 from camp_2.
    const sel = {
      ...emptySel(),
      campaigns: new Set(["camp_1"]),
      ads: new Set(["ad_5"]),
    };
    const r = rollupSelection(LAUNCH, sel, "campaigns");
    expect(r.adIds.sort()).toEqual(["ad_1", "ad_2", "ad_3", "ad_4", "ad_5"]);
    expect(r.counts.adsets).toBe(3); // adset_1, adset_2 (camp_1) + adset_3 (ad_5)
    expect(r.counts.campaigns).toBe(2); // camp_1 + camp_2 (via ad_5)
  });

  it("account-level selection is constrained and contributes NO ads", () => {
    const sel = { ...emptySel(), accounts: new Set(["acc_1", "acc_2"]) };
    const r = rollupSelection(LAUNCH, sel, "accounts");

    expect(r.accountConstrained).toBe(true);
    expect(r.adIds).toEqual([]); // never silently rolled up to the whole launch
    expect(r.counts.ads).toBe(0);
    expect(r.counts.accounts).toBe(2);
    expect(r.statusSplit.active).toEqual([]);
  });

  it("surfaces accountConstrained even when sitting on another tab", () => {
    // User picked an account, then switched to the Ads tab and ticked ad_1.
    const sel = {
      ...emptySel(),
      accounts: new Set(["acc_1"]),
      ads: new Set(["ad_1"]),
    };
    const r = rollupSelection(LAUNCH, sel, "ads");
    expect(r.accountConstrained).toBe(true);
    expect(r.adIds).toEqual(["ad_1"]); // the ad pick still rolls up normally
  });

  it("rolls an ad-group selection down to its ads", () => {
    const sel = { ...emptySel(), adgroups: new Set(["adset_2"]) };
    const r = rollupSelection(LAUNCH, sel, "adgroups");
    expect(r.adIds.sort()).toEqual(["ad_3", "ad_4"]);
    expect(r.counts.adsets).toBe(1);
    expect(r.counts.campaigns).toBe(1); // camp_1 via adset_2
  });
});
