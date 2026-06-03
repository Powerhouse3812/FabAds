/**
 * Small presentational helpers shared by the Step-3 distribution surfaces
 * (LaunchStrategyBar, LaunchDistributionPreview, LaunchConfirmDialog).
 *
 * Keeps strategy labels, CTA copy, currency formatting, and the LaunchAdset ->
 * DistAdset mapping in ONE place so the bar / preview / confirm never drift.
 * No genie6 tokens, no emojis. Pure.
 */
import type { LaunchFull } from "@/hooks/use-launch-data";
import type { LaunchStrategy, DistAdset, CurrencyBudget } from "@/lib/launch-distribution";

/** Human label for a strategy chip. */
export function strategyLabel(strategy: LaunchStrategy): string {
  switch (strategy) {
    case "fill_first":
      return "Fill First";
    case "equal":
      return "Equal Distribution";
    case "duplicate":
      return "Duplicate to Each";
  }
}

/**
 * Primary CTA copy per strategy. Duplicate NEVER says "Launch" — it copies the
 * same ads into every pair, so it is framed as a duplication action.
 */
export function primaryCtaLabel(strategy: LaunchStrategy): string {
  return strategy === "duplicate" ? "Duplicate to Selected Pages" : "Launch Selected Ads";
}

/**
 * Map the launch's adsets to DistAdset for budgetByCurrency. Adsets carry no
 * currency in LaunchFull, so the caller passes ONE resolved launch currency
 * (see resolveLaunchCurrency) applied to every adset.
 */
export function toDistAdsets(launch: LaunchFull, currency: string): DistAdset[] {
  return launch.adsets.map((a) => ({
    id: a.id,
    budget_value: a.budget_value,
    currency,
  }));
}

/** Format a budget amount with its currency code (e.g. "USD 1,200"). */
export function formatBudget(currency: string, amount: number): string {
  return `${currency} ${Math.round(amount).toLocaleString()}`;
}

/** One-line "before -> after" budget summary for a currency row. */
export function budgetDelta(b: CurrencyBudget): string {
  if (b.multiplier === 1) return formatBudget(b.currency, b.final);
  return `${formatBudget(b.currency, b.base)} -> ${formatBudget(b.currency, b.final)} (x${b.multiplier})`;
}
