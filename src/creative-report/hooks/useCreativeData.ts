/**
 * Creative Report 2.0 — the single data entry point for every screen.
 *
 * Bridges the deterministic dataset + selectors + URL filters + the dev-only
 * forced-state layer into one memoized result with an explicit status so each
 * screen can render the right §8 state (loading / empty / filtered-empty /
 * low-data / error) without duplicating logic.
 */
import { useMemo } from "react";
import { getDataset } from "@/data/generator";
import {
  bucketCounts,
  componentRollups,
  fatiguingNow,
  kpiSummary,
  selectCreatives,
  topMovers,
  type ComponentRow,
  type CreativeRollup,
  type FilterInput,
  type KpiSummary,
} from "@/creative-report/lib/selectors";
import { useReportParams } from "@/creative-report/hooks/useReportParams";
import { useForcedState } from "@/creative-report/state/ForcedStateContext";
import type { BucketKey, ComponentTab } from "@/creative-report/lib/paramSchema";

export type DataStatus = "ready" | "loading" | "empty" | "filtered-empty" | "error";

export interface CreativeData {
  status: DataStatus;
  /** Rollups after all filters (sorted by the screen, not here). */
  rollups: CreativeRollup[];
  buckets: Record<BucketKey, number>;
  fatiguing: CreativeRollup[];
  movers: CreativeRollup[];
  kpis: KpiSummary;
  /** True when the current filter set is non-default (drives filtered-empty). */
  hasActiveFilters: boolean;
  /** Whole dataset (for lookups the drawer/compare need). */
  getComponents: (tab: ComponentTab) => ComponentRow[];
  filterInput: FilterInput;
}

function toFilterInput(
  filters: ReturnType<typeof useReportParams>["filters"],
  q: string,
): FilterInput {
  return {
    from: filters.from,
    to: filters.to,
    compareEnabled: filters.compareEnabled,
    accounts: filters.accounts,
    statuses: filters.statuses,
    platforms: filters.platforms,
    formats: filters.formats,
    geo: filters.geo,
    device: filters.device,
    objective: filters.objective,
    age: filters.age,
    gender: filters.gender,
    brands: filters.brands,
    categories: filters.categories,
    products: filters.products,
    q,
  };
}

export function useCreativeData(): CreativeData {
  const { filters, view, activeFilterCount } = useReportParams();
  const forced = useForcedState();

  const filterInput = useMemo(
    () => toFilterInput(filters, view.q),
    [filters, view.q],
  );

  return useMemo<CreativeData>(() => {
    // Dev-only forced states short-circuit the real pipeline.
    if (forced === "loading") {
      return emptyResult("loading", filterInput, activeFilterCount > 0);
    }
    if (forced === "error") {
      return emptyResult("error", filterInput, activeFilterCount > 0);
    }
    if (forced === "empty") {
      return emptyResult("empty", filterInput, activeFilterCount > 0);
    }
    if (forced === "filtered-empty") {
      return emptyResult("filtered-empty", filterInput, true);
    }

    const dataset = getDataset();
    // `low-data` is simulated by narrowing to a single brand-new-ish account
    // window; we keep real data but flag it low via the rollups' confidence.
    const effectiveFilter =
      forced === "low-data"
        ? { ...filterInput, from: filterInput.to } // one-day window → tiny n
        : filterInput;

    const rollups = selectCreatives(dataset, effectiveFilter);
    const hasActiveFilters = activeFilterCount > 0 || forced === "low-data";

    if (rollups.length === 0) {
      return emptyResult(
        hasActiveFilters ? "filtered-empty" : "empty",
        effectiveFilter,
        hasActiveFilters,
      );
    }

    return {
      status: "ready",
      rollups,
      buckets: bucketCounts(rollups),
      fatiguing: fatiguingNow(rollups),
      movers: topMovers(rollups),
      kpis: kpiSummary(dataset, effectiveFilter),
      hasActiveFilters,
      getComponents: (tab) => componentRollups(dataset, effectiveFilter, tab),
      filterInput: effectiveFilter,
    };
  }, [forced, filterInput, activeFilterCount]);
}

function emptyResult(
  status: DataStatus,
  filterInput: FilterInput,
  hasActiveFilters: boolean,
): CreativeData {
  return {
    status,
    rollups: [],
    buckets: { winners: 0, scaling: 0, fatiguing: 0, new: 0, losers: 0 },
    fatiguing: [],
    movers: [],
    kpis: {
      spend: 0, revenue: 0, roas: 0, purchases: 0, cpa: null, ctr: 0,
      spendDeltaPct: null, revenueDeltaPct: null, roasDeltaPct: null, cpaDeltaPct: null,
    },
    hasActiveFilters,
    getComponents: () => [],
    filterInput,
  };
}
