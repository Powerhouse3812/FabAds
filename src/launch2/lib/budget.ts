import type { LaunchFlowState } from "../types";

export interface BudgetBreakdown {
  totalAdsets: number;
  totalAds: number;
  /** Total daily spend across the whole launch. */
  dailyTotal: number;
  /** Rough monthly projection (daily × 30). */
  monthlyEstimate: number;
  budgetLevel: "campaign" | "adset";
}

/**
 * Live budget rollup. The model:
 *   - `adsetCount` is the TOTAL ad sets for the launch (e.g. Bruno = 50).
 *   - total ads = adsetCount × creativesPerAdset.
 *   - ABO daily total = adsetCount × per-ad-set daily budget.
 *   - CBO daily total = the single campaign budget (`dailyBudget`).
 */
export function computeBudget(state: LaunchFlowState): BudgetBreakdown {
  const totalAdsets = Math.max(0, state.adsetCount);
  const totalAds = totalAdsets * Math.max(1, state.creativesPerAdset);
  const dailyTotal =
    state.budgetLevel === "campaign"
      ? state.dailyBudget
      : totalAdsets * state.dailyBudget;
  return {
    totalAdsets,
    totalAds,
    dailyTotal,
    monthlyEstimate: dailyTotal * 30,
    budgetLevel: state.budgetLevel,
  };
}
