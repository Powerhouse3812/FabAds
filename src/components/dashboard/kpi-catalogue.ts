import {
  BarChart3,
  DollarSign,
  Eye,
  MousePointerClick,
  Percent,
  Target,
  type LucideIcon,
} from "lucide-react";
import {
  aggregateMetrics,
  getByLevel,
  type ReportMetrics,
} from "@/lib/reports-dummy-data";
import type { KpiData } from "@/lib/dashboard-selectors";

/**
 * KPI catalogue — the selectable pool for the customizable Performance
 * Overview band (A-12.200). Every entry maps 1:1 to a Reports-table metric
 * column, so "what you can pin to the dashboard" == "what the Reports
 * table can show". Order here is the default menu order; the user's chosen
 * subset + order is persisted via useDashboardKpiPrefs.
 */

export interface KpiColumn {
  /** Key into the aggregated ReportMetrics object. */
  key: keyof ReportMetrics;
  label: string;
  format: (v: number) => string;
  icon: LucideIcon;
}

const fmt = {
  currency: (v: number) => `$${Math.round(v).toLocaleString()}`,
  number: (v: number) => Math.round(v).toLocaleString(),
  percent: (v: number) => `${v}%`,
  decimal: (v: number) => v.toFixed(2),
};

export const KPI_COLUMNS: KpiColumn[] = [
  { key: "spend", label: "Total Spend", format: fmt.currency, icon: DollarSign },
  { key: "revenue", label: "Revenue", format: fmt.currency, icon: DollarSign },
  { key: "margin", label: "Gross Margin", format: fmt.currency, icon: DollarSign },
  { key: "marginPercent", label: "Margin %", format: fmt.percent, icon: Percent },
  { key: "roas", label: "ROAS", format: fmt.decimal, icon: BarChart3 },
  { key: "impressions", label: "Impressions", format: fmt.number, icon: Eye },
  { key: "clicks", label: "Clicks", format: fmt.number, icon: MousePointerClick },
  { key: "ctr", label: "CTR", format: fmt.percent, icon: Percent },
  { key: "cpa", label: "CPA", format: fmt.currency, icon: DollarSign },
  { key: "cpc", label: "CPC", format: fmt.currency, icon: DollarSign },
  { key: "cpm", label: "CPM", format: fmt.currency, icon: DollarSign },
  { key: "conversions", label: "Conversions", format: fmt.number, icon: Target },
];

export const KPI_COLUMN_BY_KEY: Record<string, KpiColumn> = Object.fromEntries(
  KPI_COLUMNS.map((c) => [c.key, c]),
);

/** Max metrics a user can pin to the band at once (Maalik: max 5). */
export const MAX_KPI_COLUMNS = 5;

/** Default band when the user hasn't customized — the 5 a media buyer
 *  glances at first. */
export const DEFAULT_KPI_KEYS: string[] = [
  "spend",
  "revenue",
  "margin",
  "roas",
  "ctr",
];

// Deterministic seeded RNG so change% + sparkline are stable per column
// across renders (no per-render jitter).
function seeded(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function keySeed(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 2147483647;
  return h;
}

/**
 * Build KpiData[] for the selected columns, in the given order, from the
 * aggregated account-level report metrics. value comes straight from the
 * Reports aggregate; change% + sparkline are deterministically seeded per
 * column (mock — swap for real period-over-period when the data lands).
 */
export function buildKpis(selectedKeys: string[], dateSeed = 0): KpiData[] {
  const accounts = getByLevel("account", dateSeed);
  const agg = aggregateMetrics(accounts);

  return selectedKeys
    .map((key) => {
      const col = KPI_COLUMN_BY_KEY[key];
      if (!col) return null;
      const raw = agg[col.key] ?? 0;
      const rand = seeded(keySeed(key) + dateSeed * 101 + 13);
      const change = +(rand() * 28 - 8).toFixed(1); // -8% .. +20%
      const base = raw / 7 || 1;
      const sparkline = Array.from({ length: 7 }, () => base * (0.7 + rand() * 0.6));
      return {
        label: col.label,
        value: col.format(raw),
        change,
        sparkline,
      } satisfies KpiData;
    })
    .filter((k): k is KpiData => k !== null);
}
