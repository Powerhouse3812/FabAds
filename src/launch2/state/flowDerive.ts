/**
 * flowDerive — pure derivations over a LaunchPlan. Shared by the flow steps,
 * the Review pre-flight, and the live-budget panel. Pure + deterministic so
 * the same plan always yields the same estimate, cap demand, and validation.
 */
import { MAX_ADS_PER_PAGE, type LaunchPlan, type LaunchTarget } from "../types";
import { adsPerDestination, getStrategy } from "../data/strategies";
import { MOCK_ACCOUNTS } from "../data/mockData";

function remainingCap(target: LaunchTarget): number {
  const acc = MOCK_ACCOUNTS.find((a) => a.id === target.accountId);
  const pg = acc?.pages.find((p) => p.id === target.pageId);
  return Math.max(0, MAX_ADS_PER_PAGE - (pg?.activeAds ?? 0));
}

function currentActive(target: LaunchTarget): number {
  const acc = MOCK_ACCOUNTS.find((a) => a.id === target.accountId);
  const pg = acc?.pages.find((p) => p.id === target.pageId);
  return pg?.activeAds ?? 0;
}

/** Ads each target receives, given the distribution strategy. */
export function perTargetCounts(plan: LaunchPlan): number[] {
  const s = getStrategy(plan.strategyId);
  const n = plan.targets.length;
  if (!s || n === 0) return [];
  const base = adsPerDestination(s);

  if (plan.distribution === "duplicate") return plan.targets.map(() => base);
  if (plan.distribution === "equal") {
    const q = Math.floor(base / n);
    const r = base % n;
    return plan.targets.map((_, i) => q + (i < r ? 1 : 0));
  }
  // fill-first
  const caps = plan.targets.map(remainingCap);
  let left = base;
  const out = plan.targets.map(() => 0);
  for (let i = 0; i < n && left > 0; i++) {
    const take = Math.min(caps[i], left);
    out[i] = take;
    left -= take;
  }
  if (left > 0) out[n - 1] += left; // overflow → flagged by capCheck
  return out;
}

/** Total ads this plan will request. */
export function estimateRequested(plan: LaunchPlan): number {
  const s = getStrategy(plan.strategyId);
  if (!s || plan.targets.length === 0) return 0;
  const base = adsPerDestination(s);
  return plan.distribution === "duplicate" ? base * plan.targets.length : base;
}

/** Daily budget = active ad sets × budget/ad set (× targets if duplicating). */
export function budgetPerDay(plan: LaunchPlan): number {
  const s = getStrategy(plan.strategyId);
  if (!s) return 0;
  const adSets = s.structure.campaigns * s.structure.adSetsPerCampaign;
  const mult = plan.distribution === "duplicate" ? Math.max(plan.targets.length, 1) : 1;
  return adSets * plan.budgetPerAdSet * mult;
}

export interface PageDemand {
  fbPageId: string;
  pageName: string;
  accountName: string;
  current: number;
  demand: number;
  capacity: number;
  /** current + demand > capacity */
  over: boolean;
  available: number;
}

/** Per-unique-Page demand vs the 250 cap (a Page shared by 2 targets sums). */
export function perPageDemand(plan: LaunchPlan): PageDemand[] {
  const counts = perTargetCounts(plan);
  const byPage = new Map<string, PageDemand>();
  plan.targets.forEach((t, i) => {
    const existing = byPage.get(t.fbPageId);
    if (existing) {
      existing.demand += counts[i] ?? 0;
    } else {
      const current = currentActive(t);
      byPage.set(t.fbPageId, {
        fbPageId: t.fbPageId,
        pageName: t.pageName,
        accountName: t.accountName,
        current,
        demand: counts[i] ?? 0,
        capacity: MAX_ADS_PER_PAGE,
        over: false,
        available: Math.max(0, MAX_ADS_PER_PAGE - current),
      });
    }
  });
  const out = [...byPage.values()];
  out.forEach((p) => {
    p.over = p.current + p.demand > p.capacity;
  });
  return out;
}

export interface CapCheck {
  ok: boolean;
  offenders: PageDemand[];
}

/** Hard cap check — over-cap Pages block launch. */
export function capCheck(plan: LaunchPlan): CapCheck {
  const offenders = perPageDemand(plan).filter((p) => p.over);
  return { ok: offenders.length === 0, offenders };
}

export interface StepValidation {
  ok: boolean;
  errors: string[];
}

/** Per-step validation. step 5 surfaces the hard cap block. */
export function validateStep(plan: LaunchPlan, step: 1 | 2 | 3 | 4 | 5): StepValidation {
  const errors: string[] = [];
  switch (step) {
    case 1:
      if (!plan.strategyId) errors.push("Pick a strategy.");
      if (!plan.objective) errors.push("Pick an objective.");
      break;
    case 2:
      if (plan.targets.length === 0) errors.push("Add at least one ad account → Page destination.");
      break;
    case 3:
      if (plan.budgetPerAdSet <= 0) errors.push("Set a budget per ad set.");
      break;
    case 4:
      if (plan.creatives.length === 0) errors.push("Add at least one creative.");
      break;
    case 5: {
      const cap = capCheck(plan);
      if (!cap.ok) {
        cap.offenders.forEach((o) =>
          errors.push(`${o.pageName} would exceed the 250-ad cap (${o.current} active + ${o.demand} new).`),
        );
      }
      break;
    }
  }
  return { ok: errors.length === 0, errors };
}
