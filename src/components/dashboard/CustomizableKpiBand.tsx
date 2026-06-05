import { useMemo } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { buildKpis, KPI_COLUMN_BY_KEY } from "./kpi-catalogue";
import { useDashboardKpiPrefs } from "./useDashboardKpiPrefs";
import { CustomizeKpiPopover } from "./CustomizeKpiPopover";

/**
 * CustomizableKpiBand — the Performance Overview band, now user-customizable
 * (A-12.200). Replaces the fixed KpiRow.
 *
 *   - User pins up to 5 Reports columns + reorders them, via the gear
 *     popover anchored top-right of the band.
 *   - Selection persists per-browser (useDashboardKpiPrefs → localStorage).
 *   - Card values come straight from the Reports aggregate so the band
 *     can't contradict the Reports table.
 *
 * Visual matches the finalised Figma band: label + icon, big value +
 * mini sparkline, delta + "vs last month". Column count drives the grid
 * so 3 picks render as a clean row of 3, 5 as a row of 5.
 */

const GRID_BY_COUNT: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
};

function MiniSparkline({ data }: { data: number[] }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 20;
  const w = 48;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");
  return (
    <svg width={w} height={h} className="text-chart-1 opacity-60" aria-hidden>
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" points={points} />
    </svg>
  );
}

export function CustomizableKpiBand({ dateSeed = 0 }: { dateSeed?: number }) {
  const prefs = useDashboardKpiPrefs();
  const kpis = useMemo(
    () => buildKpis(prefs.selected, dateSeed),
    [prefs.selected, dateSeed],
  );

  return (
    <section aria-label="Performance overview" className="flex flex-col gap-2">
      {/* Slim header — section name (matches finalised Figma) + gear,
          top-right of the band per Maalik. */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Performance overview
        </span>
        <CustomizeKpiPopover prefs={prefs} />
      </div>

      <div
        className={cn(
          "grid grid-cols-2 gap-2.5 md:grid-cols-3",
          GRID_BY_COUNT[kpis.length] ?? "lg:grid-cols-5",
        )}
      >
        {kpis.map((kpi, i) => {
          const key = prefs.selected[i];
          const Icon = KPI_COLUMN_BY_KEY[key]?.icon;
          const isPositive = kpi.change >= 0;
          return (
            <Card key={key} className="relative overflow-hidden">
              <CardContent className="space-y-1.5 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {kpi.label}
                  </span>
                  {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
                <div className="flex items-end justify-between gap-2">
                  <span className="text-lg font-bold tracking-tight tabular-nums">
                    {kpi.value}
                  </span>
                  <MiniSparkline data={kpi.sparkline} />
                </div>
                <div className="flex items-center gap-1">
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-destructive" />
                  )}
                  <span
                    className={cn(
                      "text-xs font-medium tabular-nums",
                      isPositive ? "text-emerald-500" : "text-destructive",
                    )}
                  >
                    {isPositive ? "+" : ""}
                    {kpi.change}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs last month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
