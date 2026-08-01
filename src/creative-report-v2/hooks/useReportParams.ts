/**
 * Creative Report 2.0 — typed access to the module's URL params.
 * Wraps useSearchParams; every screen reads filters through this hook so the
 * URL stays the single source of truth (shareable, back-button-friendly).
 */
import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AD_STATUSES,
  AdStatus,
  BUCKETS,
  BucketKey,
  COMPARE_MODES,
  COMPONENT_TABS,
  CompareMode,
  ComponentTab,
  CreativeFormat,
  FILTER_PARAM_KEYS,
  FORCED_STATES,
  FORMATS,
  ForcedState,
  GROUP_BYS,
  GroupBy,
  LAYOUTS,
  Layout,
  P,
  PLATFORMS,
  ParamKey,
  Platform,
  SortSpec,
  defaultDateRange,
  encodeSort,
  parseCsv,
  parseCsvFree,
  parseSort,
} from "@/creative-report-v2/lib/paramSchema";

export interface ReportFilters {
  /** yyyy-MM-dd (defaults: last 30 days) */
  from: string;
  to: string;
  /** compare vs previous period — on by default */
  compareEnabled: boolean;
  accounts: string[];
  statuses: AdStatus[];
  platforms: Platform[];
  formats: CreativeFormat[];
  geo: string[];
  device: string[];
  objective: string[];
  age: string[];
  gender: string[];
  placement: string[];
  /** iter-2 W1 — Catalogue-linked scoping. */
  brands: string[];
  categories: string[];
  products: string[];
}

export interface ReportViewState {
  q: string;
  sort: SortSpec;
  group: GroupBy;
  bucket: BucketKey | null;
  creativeId: string | null;
  tab: ComponentTab;
  compareIds: string[];
  compareMode: CompareMode;
  forcedState: ForcedState | null;
  layout: Layout;
}

function pickAllowed<T extends string>(
  raw: string | null,
  allowed: readonly T[],
): T | null {
  return raw && (allowed as readonly string[]).includes(raw) ? (raw as T) : null;
}

export function useReportParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: ReportFilters = useMemo(() => {
    const def = defaultDateRange();
    return {
      from: searchParams.get(P.from) ?? def.from,
      to: searchParams.get(P.to) ?? def.to,
      compareEnabled: searchParams.get(P.compare) !== "none",
      accounts: parseCsvFree(searchParams.get(P.accounts)),
      statuses: parseCsv(searchParams.get(P.status), AD_STATUSES),
      platforms: parseCsv(searchParams.get(P.platform), PLATFORMS),
      formats: parseCsv(searchParams.get(P.format), FORMATS),
      geo: parseCsvFree(searchParams.get(P.geo)),
      device: parseCsvFree(searchParams.get(P.device)),
      objective: parseCsvFree(searchParams.get(P.objective)),
      age: parseCsvFree(searchParams.get(P.age)),
      gender: parseCsvFree(searchParams.get(P.gender)),
      placement: parseCsvFree(searchParams.get(P.placement)),
      brands: parseCsvFree(searchParams.get(P.brand)),
      categories: parseCsvFree(searchParams.get(P.category)),
      products: parseCsvFree(searchParams.get(P.product)),
    };
  }, [searchParams]);

  const view: ReportViewState = useMemo(
    () => ({
      q: searchParams.get(P.q) ?? "",
      sort: parseSort(searchParams.get(P.sort)),
      group: pickAllowed(searchParams.get(P.group), GROUP_BYS) ?? "none",
      bucket: pickAllowed(searchParams.get(P.bucket), BUCKETS),
      creativeId: searchParams.get(P.creative),
      tab: pickAllowed(searchParams.get(P.tab), COMPONENT_TABS) ?? "hooks",
      compareIds: parseCsvFree(searchParams.get(P.ids)),
      compareMode: pickAllowed(searchParams.get(P.mode), COMPARE_MODES) ?? "creatives",
      forcedState: pickAllowed(searchParams.get(P.state), FORCED_STATES),
      layout: pickAllowed(searchParams.get(P.layout), LAYOUTS) ?? "grid",
    }),
    [searchParams],
  );

  /** Set one param; null/empty removes it. Uses replace to avoid history spam. */
  const setParam = useCallback(
    (key: ParamKey, value: string | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value === null || value === "") next.delete(key);
          else next.set(key, value);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  /** Patch several params at once (null removes). */
  const setParams = useCallback(
    (patch: Partial<Record<ParamKey, string | null>>, opts?: { replace?: boolean }) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            if (value === null || value === "" || value === undefined) next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        { replace: opts?.replace ?? true },
      );
    },
    [setSearchParams],
  );

  /** Toggle one value inside a CSV param (accounts, platform, format …). */
  const toggleCsvValue = useCallback(
    (key: ParamKey, value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const current = parseCsvFree(next.get(key));
          const updated = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value];
          if (updated.length === 0) next.delete(key);
          else next.set(key, updated.join(","));
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  /** Clear every daily/advanced filter (keeps view + dev state params). */
  const clearFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const key of FILTER_PARAM_KEYS) {
          if (key !== P.state) next.delete(key);
        }
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const setSort = useCallback(
    (sort: SortSpec) => setParam(P.sort, encodeSort(sort)),
    [setParam],
  );

  /** Count of active (non-default) filters — for the "Clear filters" affordance. */
  const activeFilterCount = useMemo(() => {
    let n = 0;
    for (const key of FILTER_PARAM_KEYS) {
      if (key === P.state) continue;
      if (searchParams.get(key)) n++;
    }
    return n;
  }, [searchParams]);

  return {
    searchParams,
    filters,
    view,
    setParam,
    setParams,
    toggleCsvValue,
    clearFilters,
    setSort,
    activeFilterCount,
  };
}
