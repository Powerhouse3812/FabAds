/**
 * CompareBarChart — single-metric grouped comparison across compared
 * columns (handoff §5.4 addendum). One bar per column (creative or
 * platform); the value always comes from that column's own already-folded
 * metrics — never an aggregate across columns. No composite score, no
 * "winner" call — a neutral read, the buyer draws the conclusion.
 */
import { useState } from "react";
import {
  BarChart,
  Bar,
  Cell,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fmtCurrency, fmtMultiple, fmtPct, truncate } from "@/creative-report/lib/format";
import { COMPARE_CHART_COLORS } from "@/creative-report/components/CompareLineChart";
import type { CompareMetrics } from "@/creative-report/components/CompareColumn";

export interface CompareMetricColumn {
  key: string;
  title: string;
  metrics: CompareMetrics;
}

type BarMetric = "roas" | "spend" | "cpa" | "ctr" | "cvr";

const METRIC_OPTIONS: { value: BarMetric; label: string }[] = [
  { value: "roas", label: "ROAS" },
  { value: "spend", label: "Spend" },
  { value: "cpa", label: "CPA" },
  { value: "ctr", label: "CTR" },
  { value: "cvr", label: "CVR" },
];

const AXIS_NAME_MAX = 16;

function metricValue(m: CompareMetrics, metric: BarMetric): number {
  switch (metric) {
    case "roas":
      return m.roas;
    case "spend":
      return m.spend;
    case "cpa":
      return m.cpa ?? 0;
    case "ctr":
      return m.ctr;
    case "cvr":
      return m.cvr;
  }
}

function formatMetric(v: number, metric: BarMetric): string {
  switch (metric) {
    case "roas":
      return fmtMultiple(v);
    case "spend":
    case "cpa":
      return fmtCurrency(v);
    case "ctr":
    case "cvr":
      return fmtPct(v);
  }
}

interface BarRow {
  key: string;
  fullTitle: string;
  title: string;
  value: number;
  noPurchases: boolean;
  /** Pre-formatted top label — "—" when CPA has no purchases, so a null CPA
   *  never renders as a fabricated "$0.00" best-in-class bar label. */
  label: string;
}

function BarTooltip({
  active,
  payload,
  metric,
}: {
  active?: boolean;
  payload?: { payload: BarRow }[];
  metric: BarMetric;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const label = METRIC_OPTIONS.find((o) => o.value === metric)?.label ?? metric;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground">{row.fullTitle}</p>
      <p className="text-xs">
        <span className="text-muted-foreground">{label}: </span>
        <span className="font-medium text-foreground">
          {metric === "cpa" && row.noPurchases ? "—" : formatMetric(row.value, metric)}
        </span>
      </p>
      {metric === "cpa" && row.noPurchases && (
        <p className="text-xs text-muted-foreground">No purchases</p>
      )}
    </div>
  );
}

/** Grouped bar comparison for one user-picked metric at a time — ROAS by
 *  default (the safest "always present" read alongside spend). */
export function CompareBarChart({ columns }: { columns: CompareMetricColumn[] }) {
  const [metric, setMetric] = useState<BarMetric>("roas");

  if (columns.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing selected to chart yet.</p>;
  }

  const data: BarRow[] = columns.map((col) => {
    const value = metricValue(col.metrics, metric);
    const noPurchases = metric === "cpa" && col.metrics.cpa === null;
    return {
      key: col.key,
      fullTitle: col.title,
      title: truncate(col.title, AXIS_NAME_MAX).text,
      value,
      noPurchases,
      label: noPurchases ? "—" : formatMetric(value, metric),
    };
  });
  // Explicit zero-based domain with headroom for the top LabelList — recharts'
  // "auto" domain doesn't reliably start at 0 for a single small-range series.
  const maxValue = Math.max(0, ...data.map((d) => d.value));
  const yDomain: [number, number] = [0, maxValue > 0 ? maxValue * 1.15 : 1];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">Compare by metric</span>
        <Select value={metric} onValueChange={(v) => setMetric(v as BarMetric)}>
          <SelectTrigger className="h-8 w-[110px] text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {METRIC_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis dataKey="title" tick={{ fontSize: 11 }} className="text-muted-foreground" />
            <YAxis hide domain={yDomain} />
            <Tooltip content={<BarTooltip metric={metric} />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={64}>
              {data.map((row, i) => (
                <Cell key={row.key} fill={COMPARE_CHART_COLORS[i % COMPARE_CHART_COLORS.length]} />
              ))}
              <LabelList
                dataKey="label"
                position="top"
                fill="hsl(var(--foreground))"
                style={{ fontSize: 11 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
