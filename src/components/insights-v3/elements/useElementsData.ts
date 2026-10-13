/**
 * Everything the Creative Element Insights page derives from the data layer,
 * memoised on the PRIMITIVE scope fields + tab (not on the URL string) so that
 * opening an overlay or toggling a tag never re-aggregates 800 ads.
 *
 * Tag filtering and sorting are applied by the page on top of `rows`, because
 * they are cheap and must not change any other count (non-negotiable #3).
 */
import { useMemo } from "react";
import {
  ALL,
  PERIOD_OPTIONS,
  type Ad,
  type AiSummary,
  type ElementType,
  type Kpi,
  type PeriodKey,
  type Scope,
  type TopTenGroup,
  type TrendSeries,
} from "@/lib/insights-v3/types";
import { MODULE_NOW, getAds } from "@/lib/insights-v3/data";
import {
  adsInBaseScope,
  adsInScope,
  aiSummary,
  categoryOptions,
  elementGroupKeys,
  elementKpis,
  elementRows,
  elementValue,
  groupKeysForScope,
  industryOptions,
  launchFrequency,
  rising,
  scaling,
  tagGroups,
  type ElementRow,
  type TrendItem,
} from "@/lib/insights-v3/selectors";
import type { ScopeOption } from "@/components/insights-v3/shared";
import { ELEMENT_TAB_KEYS } from "./constants";

export interface ElementsData {
  /** Ads in scope (period applied). */
  scoped: Ad[];
  tabCounts: Record<ElementType, number>;
  industries: ScopeOption[];
  categories: ScopeOption[];
  periodCounts: Record<PeriodKey, number>;
  groups: TopTenGroup[];
  rows: ElementRow[];
  /** Ads in scope where this tab's element could be identified (denominator for shares). */
  analysedAds: number;
  kpis: Kpi[];
  summary: AiSummary;
  launch: TrendSeries;
  rising: TrendItem[];
  scaling: TrendItem[];
  baseAdCount: number;
}

export function useElementsData(type: ElementType, scope: Scope, lastVisitAt: string, forceEmpty: boolean): ElementsData {
  const { industry, category, period } = scope;
  return useMemo(() => {
    const sc: Scope = { industry, category, period, myPrefsOnly: false };
    const now = MODULE_NOW;
    const opts = { now };
    const allAds = forceEmpty ? [] : getAds();
    const baseAds = adsInBaseScope(allAds, sc, opts);
    const scoped = adsInScope(allAds, sc, opts);
    const ctx = { now, lastVisitAt };

    const seen: Record<ElementType, Set<string>> = {
      framework: new Set(),
      hook: new Set(),
      angle: new Set(),
      concept: new Set(),
    };
    for (const a of scoped) {
      for (const t of ELEMENT_TAB_KEYS) {
        const v = elementValue(a, t);
        if (v) seen[t].add(v);
      }
    }
    const tabCounts = Object.fromEntries(ELEMENT_TAB_KEYS.map((t) => [t, seen[t].size])) as Record<ElementType, number>;

    const toOption = (o: { id: string; label: string; count: number }): ScopeOption => ({ id: o.id, label: o.label, count: o.count });
    const industries = industryOptions(allAds, sc, opts).filter((o) => o.id !== ALL).map(toOption);
    const categories = categoryOptions(allAds, sc, opts).filter((o) => o.id !== ALL).map(toOption);
    const periodCounts = Object.fromEntries(
      PERIOD_OPTIONS.map((p) => [p.key, adsInScope(allAds, { ...sc, period: p.key }, opts).length]),
    ) as Record<PeriodKey, number>;

    const analysedAds = scoped.filter((a) => elementValue(a, type) != null).length;
    const groups = tagGroups(scoped, groupKeysForScope(elementGroupKeys(type), sc));
    const rows = elementRows(type, scoped, { ...ctx, scope: sc, baseAds, shareBase: analysedAds });

    return {
      scoped,
      tabCounts,
      industries,
      categories,
      periodCounts,
      groups,
      rows,
      analysedAds,
      kpis: elementKpis(type, baseAds, sc, ctx),
      summary: aiSummary({ kind: "element-list", elementType: type, ads: scoped }),
      launch: launchFrequency(allAds, sc, now),
      rising: rising(type, baseAds, period, now, { limit: 5 }),
      scaling: scaling(type, baseAds, period, now, { limit: 5 }),
      baseAdCount: baseAds.length,
    };
  }, [type, industry, category, period, lastVisitAt, forceEmpty]);
}
