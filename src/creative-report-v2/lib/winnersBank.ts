/**
 * Creative Report 2.0 — Winners Bank (iter-2 W2 foundation).
 *
 * The benchmark set every "how does this compare to what already works"
 * signal grades against — the honest alternative to a competitor's opaque
 * composite score (Hawky calls theirs "FeatherDB"; ours is just the buyer's
 * own explicitly Mark-Winner'd creatives, curated — never inferred).
 *
 * Bootstrap rule: a fresh account has no curated winners yet, so the bank
 * would be empty and every benchmark in P2 would have nothing to compare
 * against. Until the buyer marks at least one winner, the bank falls back to
 * the generator's `archetype === "winner"` creatives — clearly labeled
 * `source: "bootstrap"` so the UI can say so, never presented as curated.
 */
import { useMemo } from "react";
import { getDataset } from "@/data/generator";
import { fullRangeFilter, rollupCreative } from "@/creative-report-v2/lib/selectors";
import { useAllActions } from "@/creative-report-v2/actions/actionStore";
import type { Dataset } from "@/data/model";

export type BankDimension =
  | "hook"
  | "headline"
  | "primaryText"
  | "cta"
  | "visualStyle"
  | "messagingAngle"
  | "hookTactic"
  | "offerType"
  | "visualFormat"
  | "emotion";

export interface WinnersBankEntry {
  dimension: BankDimension;
  value: string;
  creativeCount: number;
  totalSpend: number;
  /** Spend-weighted average ROAS across the winner creatives carrying this value. */
  avgRoas: number;
}

export interface WinnersBank {
  entries: WinnersBankEntry[];
  /** "curated" once the buyer has Mark-Winner'd at least one creative. */
  source: "curated" | "bootstrap";
  creativeIds: string[];
}

const DIMENSION_ACCESSORS: Record<BankDimension, (c: Dataset["creatives"][number]) => string> = {
  hook: (c) => c.components.hook,
  headline: (c) => c.components.headline,
  primaryText: (c) => c.components.primaryText,
  cta: (c) => c.components.cta,
  visualStyle: (c) => c.components.visualStyle,
  messagingAngle: (c) => c.tags.messagingAngle,
  hookTactic: (c) => c.tags.hookTactic,
  offerType: (c) => c.tags.offerType,
  visualFormat: (c) => c.tags.visualFormat,
  emotion: (c) => c.tags.emotion,
};

/** Pure function (no hooks) so it's testable/reusable outside React. */
export function computeWinnersBank(dataset: Dataset, creativeIds: string[]): WinnersBankEntry[] {
  const filter = fullRangeFilter();
  const groups = new Map<string, { dimension: BankDimension; spend: number; revenue: number; count: number }>();

  for (const id of creativeIds) {
    const creative = dataset.creativeById[id];
    if (!creative) continue;
    const rollup = rollupCreative(dataset, creative, filter);
    if (!rollup) continue;

    for (const dimension of Object.keys(DIMENSION_ACCESSORS) as BankDimension[]) {
      const value = DIMENSION_ACCESSORS[dimension](creative);
      const key = `${dimension}::${value}`;
      const g = groups.get(key) ?? { dimension, spend: 0, revenue: 0, count: 0 };
      g.spend += rollup.metrics.spend;
      g.revenue += rollup.metrics.revenue;
      g.count += 1;
      groups.set(key, g);
    }
  }

  const entries: WinnersBankEntry[] = [];
  for (const [key, g] of groups) {
    const value = key.slice(g.dimension.length + 2);
    entries.push({
      dimension: g.dimension,
      value,
      creativeCount: g.count,
      totalSpend: g.spend,
      avgRoas: g.spend > 0 ? g.revenue / g.spend : 0,
    });
  }
  return entries.sort((a, b) => b.totalSpend - a.totalSpend);
}

/** Look up a single dimension+value's bank entry, if the bank has one. */
export function findBankEntry(
  bank: WinnersBankEntry[],
  dimension: BankDimension,
  value: string,
): WinnersBankEntry | null {
  return bank.find((e) => e.dimension === dimension && e.value === value) ?? null;
}

export function useWinnersBank(): WinnersBank {
  const dataset = getDataset();
  const actions = useAllActions();

  return useMemo(() => {
    const curatedIds = Object.entries(actions.byCreative)
      .filter(([, state]) => state.markedWinner)
      .map(([id]) => id);

    const bootstrapIds = dataset.creatives
      .filter((c) => c.archetype === "winner")
      .map((c) => c.id);

    const useCurated = curatedIds.length > 0;
    const creativeIds = useCurated ? curatedIds : bootstrapIds;

    return {
      entries: computeWinnersBank(dataset, creativeIds),
      source: useCurated ? "curated" : "bootstrap",
      creativeIds,
    };
  }, [dataset, actions]);
}
