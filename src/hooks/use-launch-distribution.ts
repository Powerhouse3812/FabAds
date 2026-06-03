/**
 * Reads the Bulk Launch Distribution config (written by Step 1) off a launch and
 * resolves it into everything the Step-3 bar / preview / confirm need:
 *   - the chosen {@link LaunchStrategy},
 *   - the resolved {@link TargetPair}[] (account -> page pairs),
 *   - mock {@link PageCapacity}[] for the unique Facebook Pages referenced.
 *
 * Config shape (frozen):
 *   launch_config.distribution = {
 *     version: 1,
 *     strategy: "fill_first" | "equal" | "duplicate",
 *     target_pairs: TargetPair[],
 *     overflowAsPaused?: boolean,
 *     backendSupportsOverflow?: boolean,
 *   }
 *
 * Pure-ish: no network. Memoized off `launch_config`.
 */
import { useMemo } from "react";
import type { LaunchFull } from "@/hooks/use-launch-data";
import type { LaunchStrategy, TargetPair, PageCapacity } from "@/lib/launch-distribution";
import { getMockCapacities } from "@/components/launch/distribution/mock-page-capacity";

export interface LaunchDistributionConfig {
  version: number;
  strategy: LaunchStrategy;
  target_pairs: TargetPair[];
  overflowAsPaused: boolean;
  backendSupportsOverflow: boolean;
}

export interface ResolvedDistribution {
  /** True once Step 1 wrote a usable distribution config. */
  configured: boolean;
  strategy: LaunchStrategy;
  targetPairs: TargetPair[];
  capacities: PageCapacity[];
  overflowAsPaused: boolean;
  backendSupportsOverflow: boolean;
}

const VALID_STRATEGIES: LaunchStrategy[] = ["fill_first", "equal", "duplicate"];

/** Coerce a loosely-typed stored pair into a TargetPair, dropping incomplete rows. */
function coercePair(raw: unknown): TargetPair | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  const ad_account_id = typeof p.ad_account_id === "string" ? p.ad_account_id : "";
  const page_id = typeof p.page_id === "string" ? p.page_id : "";
  const fb_page_id = typeof p.fb_page_id === "string" ? p.fb_page_id : "";
  // A pair is only usable for capacity if it has the Facebook Page identity.
  if (!fb_page_id) return null;
  return {
    ad_account_id,
    account_name: typeof p.account_name === "string" ? p.account_name : ad_account_id || "Ad account",
    page_id: page_id || fb_page_id,
    fb_page_id,
    page_name: typeof p.page_name === "string" ? p.page_name : "Page",
  };
}

/**
 * Resolve `launch_config.distribution` into strategy + target pairs + capacities.
 * Falls back to a safe empty/`fill_first` shape with `configured: false` when the
 * config is missing or malformed, so callers can render a "set a strategy" state.
 */
export function useLaunchDistribution(launch: LaunchFull): ResolvedDistribution {
  return useMemo<ResolvedDistribution>(() => {
    const dist = (launch.launch_config as Record<string, unknown> | null)?.distribution as
      | Record<string, unknown>
      | undefined;

    const rawStrategy = dist?.strategy;
    const strategy: LaunchStrategy = VALID_STRATEGIES.includes(rawStrategy as LaunchStrategy)
      ? (rawStrategy as LaunchStrategy)
      : "fill_first";

    const rawPairs = Array.isArray(dist?.target_pairs) ? (dist!.target_pairs as unknown[]) : [];
    const targetPairs = rawPairs
      .map(coercePair)
      .filter((p): p is TargetPair => p !== null);

    const capacities = targetPairs.length > 0 ? getMockCapacities(targetPairs) : [];

    return {
      configured: !!dist && VALID_STRATEGIES.includes(rawStrategy as LaunchStrategy) && targetPairs.length > 0,
      strategy,
      targetPairs,
      capacities,
      overflowAsPaused: dist?.overflowAsPaused === true,
      backendSupportsOverflow: dist?.backendSupportsOverflow === true,
    };
  }, [launch.launch_config]);
}

/**
 * Resolve a single launch-level currency for budget display. Adsets in
 * `LaunchFull` carry no currency, and no account FK links an adset to its
 * account — so we use the launch's ad-account currency (first available),
 * defaulting to "USD". `budgetByCurrency` then groups all selected adsets under
 * this one currency. Kept here so the bar/preview share one resolution.
 */
export function resolveLaunchCurrency(launch: LaunchFull): string {
  for (const acc of launch.ad_accounts) {
    const cur = (acc as unknown as { currency?: unknown }).currency;
    if (typeof cur === "string" && cur.trim()) return cur;
    const cfgCur = (acc.setup_config as Record<string, unknown> | null)?.currency;
    if (typeof cfgCur === "string" && cfgCur.trim()) return cfgCur;
  }
  return "USD";
}
