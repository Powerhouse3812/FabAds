/** Pure derivations for Launch v2 — ad counts (spread-aware), budget, 250-cap. */
import { MAX_ADS_PER_PAGE, type PlanV2 } from "./types";
import { pageActiveAds } from "./data";

/** Ad sets produced (spread-aware). */
export function adSetCount(plan: PlanV2): number {
  const n = Math.max(plan.creatives.length, 1);
  const base = plan.structure.campaigns * plan.structure.adSetsPerCampaign;
  switch (plan.spread) {
    case "one_per_adset":
      return n;
    case "multiply":
      return base * n;
    default:
      return base; // stacked / round_robin / manual
  }
}

/** Ads produced per destination (spread-aware). */
export function adsPerDestination(plan: PlanV2): number {
  const n = Math.max(plan.creatives.length, 1);
  const base = plan.structure.campaigns * plan.structure.adSetsPerCampaign * plan.structure.adsPerAdSet;
  switch (plan.spread) {
    case "one_per_adset":
      return n; // n ad sets × 1 ad
    case "stacked":
      return plan.structure.campaigns * plan.structure.adSetsPerCampaign * n; // ad sets × n ads
    case "multiply":
      return base * n;
    default:
      return base; // round_robin / manual fill existing slots
  }
}

/** Total ads requested (× targets if duplicating across pages). */
export function estimateAds(plan: PlanV2): number {
  const per = adsPerDestination(plan);
  const t = Math.max(plan.targets.length, 1);
  return plan.pageDistribution === "duplicate" ? per * t : per;
}

/** Daily budget. CBO = campaign budget; ABO = per ad set × ad sets. */
export function budgetPerDay(plan: PlanV2): number {
  const mult = plan.pageDistribution === "duplicate" ? Math.max(plan.targets.length, 1) : 1;
  if (plan.budgetMode === "CBO") return plan.budgetAmount * mult;
  return plan.budgetAmount * adSetCount(plan) * mult;
}

export interface PageDemand {
  fbPageId: string;
  pageName: string;
  accountName: string;
  current: number;
  demand: number;
  available: number;
  over: boolean;
}

/** Ads each target receives, given page distribution. */
function perTargetCounts(plan: PlanV2): number[] {
  const per = adsPerDestination(plan);
  const n = plan.targets.length;
  if (n === 0) return [];
  if (plan.pageDistribution === "duplicate") return plan.targets.map(() => per);
  if (plan.pageDistribution === "equal") {
    const q = Math.floor(per / n);
    const r = per % n;
    return plan.targets.map((_, i) => q + (i < r ? 1 : 0));
  }
  // fill-first
  const caps = plan.targets.map((t) => Math.max(0, MAX_ADS_PER_PAGE - pageActiveAds(t.fbPageId)));
  let left = per;
  const out = plan.targets.map(() => 0);
  for (let i = 0; i < n && left > 0; i++) {
    const take = Math.min(caps[i], left);
    out[i] = take;
    left -= take;
  }
  if (left > 0) out[n - 1] += left;
  return out;
}

/** Per-unique-Page demand vs the 250 cap (shared pages summed). */
export function perPageDemand(plan: PlanV2): PageDemand[] {
  const counts = perTargetCounts(plan);
  const byPage = new Map<string, PageDemand>();
  plan.targets.forEach((t, i) => {
    const ex = byPage.get(t.fbPageId);
    if (ex) ex.demand += counts[i] ?? 0;
    else {
      const current = pageActiveAds(t.fbPageId);
      byPage.set(t.fbPageId, {
        fbPageId: t.fbPageId,
        pageName: t.pageName,
        accountName: t.accountName,
        current,
        demand: counts[i] ?? 0,
        available: Math.max(0, MAX_ADS_PER_PAGE - current),
        over: false,
      });
    }
  });
  const out = [...byPage.values()];
  out.forEach((p) => (p.over = p.current + p.demand > MAX_ADS_PER_PAGE));
  return out;
}

export function capCheck(plan: PlanV2): { ok: boolean; offenders: PageDemand[] } {
  const offenders = perPageDemand(plan).filter((p) => p.over);
  return { ok: offenders.length === 0, offenders };
}

/** Spread preview for Step 3's live mini-tree. */
export function spreadPreview(plan: PlanV2): { creatives: number; adSets: number; adsPerDest: number; total: number } {
  return {
    creatives: plan.creatives.length,
    adSets: adSetCount(plan),
    adsPerDest: adsPerDestination(plan),
    total: estimateAds(plan),
  };
}
