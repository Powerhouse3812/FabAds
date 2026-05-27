import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * useCredits — single source of truth for credit usage on the AI-plan
 * surface during the upsell-redesign phase.
 *
 * This is a MOCK hook. It returns deterministic values today so the new
 * "approaching limit" + "at limit" states can be designed, demoed, and
 * QA'd before the real entitlement service exists. When the entitlement
 * service lands, this hook is the only place that needs to change — every
 * consumer (HeaderCreditsChip, CreditUsageCard, CreditApproachingBanner,
 * CreditAtLimitModal) reads from here.
 *
 * Defaults:
 *   used  = 1218   (81% — close to the warning band, but not in it)
 *   limit = 1500
 *
 * URL override (demo-only):
 *   ?credits=1275  → moves into the warning band (85%)
 *   ?credits=1500  → at-limit state
 *
 * `currentTierLabel` / `upgradeTierLabel` / `upgradeTierLimit` are
 * hardcoded for the Growth umbrella locked decision. The trial length is
 * 14 days everywhere — those CTAs live in the consumer components.
 */

const DEFAULT_USED = 1218;
const DEFAULT_LIMIT = 1500;
const RESET_DATE = new Date("2026-08-26T00:00:00Z");

export interface CreditState {
  used: number;
  limit: number;
  percent: number;
  daysToReset: number;
  resetDate: Date;
  isApproaching: boolean;
  isAtLimit: boolean;
  /** Tier label of the user's CURRENT plan, e.g. "AI Individual". */
  currentTierLabel: string;
  /** Tier label of the recommended upgrade, e.g. "Growth Starter". */
  upgradeTierLabel: string;
  /** Credit limit on the upgrade tier, e.g. 1500. */
  upgradeTierLimit: number;
}

export function useCredits(): CreditState {
  const [searchParams] = useSearchParams();
  const override = searchParams.get("credits");

  return useMemo<CreditState>(() => {
    const parsed = override !== null ? Number.parseInt(override, 10) : NaN;
    const used =
      Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_USED;
    const limit = DEFAULT_LIMIT;
    const percent = Math.round((used / limit) * 100);

    const now = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysToReset = Math.max(
      0,
      Math.ceil((RESET_DATE.getTime() - now.getTime()) / msPerDay),
    );

    return {
      used,
      limit,
      percent,
      daysToReset,
      resetDate: RESET_DATE,
      isApproaching: percent >= 85,
      isAtLimit: percent >= 100,
      currentTierLabel: "AI Individual",
      upgradeTierLabel: "Growth Starter",
      upgradeTierLimit: 1500,
    };
  }, [override]);
}
