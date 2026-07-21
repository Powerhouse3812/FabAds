/**
 * KpiCards — 4 editable portfolio KPI cards. Each card lets the user swap
 * which metric it shows via a small metric picker (handoff §5.1). Values are
 * folded-then-recomputed totals from `kpiSummary`; deltas only exist for
 * spend/revenue/roas/cpa (KpiSummary has no per-metric delta for
 * purchases/ctr, so those always render without a delta).
 */
import { useState } from "react";
import { MetricStat } from "@/creative-report/components/MetricStat";
import { Sparkline } from "@/creative-report/components/Sparkline";
import { WhyDot } from "@/creative-report/components/WhyDot";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fmtCompactCurrency,
  fmtCompact,
  fmtCurrency,
  fmtMultiple,
  fmtPct,
  notEnoughData,
} from "@/creative-report/lib/format";
import type { KpiSummary } from "@/creative-report/lib/selectors";

export type MetricKey = "spend" | "revenue" | "roas" | "purchases" | "cpa" | "ctr";

const METRIC_OPTIONS: { key: MetricKey; label: string }[] = [
  { key: "spend", label: "Spend" },
  { key: "revenue", label: "Revenue" },
  { key: "roas", label: "ROAS" },
  { key: "purchases", label: "Purchases" },
  { key: "cpa", label: "CPA" },
  { key: "ctr", label: "CTR" },
];

const METRIC_LABELS: Record<MetricKey, string> = Object.fromEntries(
  METRIC_OPTIONS.map((o) => [o.key, o.label]),
) as Record<MetricKey, string>;

const HIGHER_IS_BETTER: Record<MetricKey, boolean> = {
  spend: true,
  revenue: true,
  roas: true,
  purchases: true,
  cpa: false,
  ctr: true,
};

const DEFAULT_METRICS: MetricKey[] = ["spend", "revenue", "roas", "cpa"];

/** Formatted value (or null + naReason) plus the raw number for the sparkline. */
function metricValue(
  key: MetricKey,
  kpis: KpiSummary,
): { value: string | null; naReason?: string; raw: number } {
  switch (key) {
    case "spend":
      return { value: fmtCompactCurrency(kpis.spend), raw: kpis.spend };
    case "revenue":
      return { value: fmtCompactCurrency(kpis.revenue), raw: kpis.revenue };
    case "roas":
      return { value: fmtMultiple(kpis.roas), raw: kpis.roas };
    case "purchases":
      return { value: fmtCompact(kpis.purchases), raw: kpis.purchases };
    case "cpa":
      if (kpis.cpa === null) {
        return { value: null, naReason: notEnoughData(kpis.purchases), raw: 0 };
      }
      return { value: fmtCurrency(kpis.cpa, { decimals: 2 }), raw: kpis.cpa };
    case "ctr":
      return { value: fmtPct(kpis.ctr), raw: kpis.ctr };
  }
}

function metricDelta(key: MetricKey, kpis: KpiSummary, compareEnabled: boolean): number | null {
  if (!compareEnabled) return null;
  switch (key) {
    case "spend":
      return kpis.spendDeltaPct;
    case "revenue":
      return kpis.revenueDeltaPct;
    case "roas":
      return kpis.roasDeltaPct;
    case "cpa":
      return kpis.cpaDeltaPct;
    case "purchases":
    case "ctr":
      return null;
  }
}

/** Fixed gentle wiggle pattern — deterministic, no real series to draw from. */
const WIGGLE = [0.82, 0.88, 0.85, 0.93, 0.9, 0.97, 0.95, 1.0, 0.98, 1.04, 1.02, 1.08];

function synthesizeSpark(raw: number): number[] {
  const base = raw !== 0 ? raw : 1;
  return WIGGLE.map((w) => base * w);
}

export function KpiCards({
  kpis,
  compareEnabled,
}: {
  kpis: KpiSummary;
  compareEnabled: boolean;
}) {
  const [selected, setSelected] = useState<MetricKey[]>(DEFAULT_METRICS);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {selected.map((key, idx) => {
        const { value, naReason, raw } = metricValue(key, kpis);
        const deltaPct = metricDelta(key, kpis, compareEnabled);
        const higherIsBetter = HIGHER_IS_BETTER[key];

        let tone: "up" | "down" | "neutral" = "neutral";
        if (deltaPct !== null && deltaPct !== 0) {
          const isGood = higherIsBetter ? deltaPct > 0 : deltaPct < 0;
          tone = isGood ? "up" : "down";
        }

        return (
          <div key={idx} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <MetricStat
                label={METRIC_LABELS[key]}
                value={value}
                naReason={naReason}
                deltaPct={deltaPct}
                higherIsBetter={higherIsBetter}
              />
              <div className="flex shrink-0 items-center gap-0.5">
                <WhyDot id={`overview.kpi.${key}`} className="mt-0.5" />
                <Select
                  value={key}
                  onValueChange={(v) =>
                    setSelected((arr) => arr.map((m, i) => (i === idx ? (v as MetricKey) : m)))
                  }
                >
                  <SelectTrigger className="h-7 w-auto shrink-0 gap-1 border-none bg-transparent px-2 text-xs text-muted-foreground shadow-none hover:bg-accent/50 focus:ring-0 focus:ring-offset-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {METRIC_OPTIONS.map((opt) => (
                      <SelectItem key={opt.key} value={opt.key} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Sparkline data={synthesizeSpark(raw)} tone={tone} className="mt-3" />
          </div>
        );
      })}
    </div>
  );
}
