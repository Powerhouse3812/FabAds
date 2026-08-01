/**
 * KpiStrip — Ref B's headline-metrics row: ALL-CAPS letter-spaced labels
 * above large tabular numbers, a delta rendered inline next to the number
 * ("1500 ↗ +4.5%") rather than stacked below it, vertical hairline dividers
 * between cells so the whole row reads as one continuous strip rather than
 * four separate boxes.
 *
 * Deliberately the business-OUTCOME numbers (spend, revenue, purchases,
 * reach) — none of which FunnelStrip already shows (CPM/CTR/outbound
 * CTR/CVR/CPA/ROAS). No number appears in both treatments. Spend's delta
 * uses `spendTrendPct` (last 7d vs prior 7d) — real, already folded, and not
 * shown anywhere else in the drawer. It's rendered neutrally (no lime/red)
 * since "spend went up" isn't inherently good or bad the way ROAS/CPA are —
 * that value judgement stays with FunnelStrip's ROAS/CPA deltas. This is a
 * deliberate, existing directional-correctness call, not an oversight — a
 * redesign of *how* it reads must not accidentally start colouring it.
 *
 * No composite score — every cell is one directly-measured, re-derivable
 * number (product-plan §7 / handoff rule, unchanged by this redesign). No
 * delta renders at all when a compare/trend period isn't real (never a
 * fabricated 0% or flat arrow).
 *
 * Renders as bare content (no self-wrapped card/border) — the drawer shell
 * owns whatever card/band wrapping surrounds this component.
 */
import { TrendingDown, TrendingUp } from "lucide-react";
import { fmtCompact, fmtCompactCurrency, fmtDelta } from "@/creative-report/lib/format";
import { WhyDot } from "@/creative-report/components/WhyDot";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

interface Stat {
  label: string;
  value: string;
  whyId: string;
  trend?: { label: string; tone: "up" | "down" | "flat" };
}

export function KpiStrip({ rollup }: { rollup: CreativeRollup }) {
  const { metrics, spendTrendPct } = rollup;
  const spendTrend = fmtDelta(spendTrendPct);

  const stats: Stat[] = [
    {
      label: "Spend",
      value: fmtCompactCurrency(metrics.spend),
      whyId: "drawer.kpi.spend",
      trend:
        spendTrendPct !== null
          ? { label: `${spendTrend.label} vs prior 7d`, tone: spendTrend.tone }
          : undefined,
    },
    { label: "Revenue", value: fmtCompactCurrency(metrics.revenue), whyId: "drawer.kpi.revenue" },
    { label: "Purchases", value: fmtCompact(metrics.purchases), whyId: "drawer.kpi.purchases" },
    { label: "Impressions", value: fmtCompact(metrics.impressions), whyId: "drawer.kpi.impressions" },
  ];

  return (
    <div className="flex items-stretch divide-x divide-border">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-1 flex-col gap-2 px-4 first:pl-0 last:pr-0">
          <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {stat.label}
            <WhyDot id={stat.whyId} className="h-3 w-3" />
          </span>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-3xl font-semibold leading-none tabular-nums text-foreground">
              {stat.value}
            </span>
            {stat.trend && (
              <span className="flex items-center gap-1 text-xs font-medium tabular-nums text-muted-foreground">
                {stat.trend.tone === "up" ? (
                  <TrendingUp className="h-3 w-3" />
                ) : stat.trend.tone === "down" ? (
                  <TrendingDown className="h-3 w-3" />
                ) : null}
                {stat.trend.label}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
