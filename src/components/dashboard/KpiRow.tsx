import { TrendingUp, TrendingDown, DollarSign, BarChart3, Target, ShieldAlert, Activity, Percent } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type KpiData } from "@/lib/dashboard-selectors";

const ICONS = [DollarSign, DollarSign, DollarSign, Percent, BarChart3, ShieldAlert];

interface KpiRowProps {
  kpis: KpiData[];
}

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
    <svg width={w} height={h} className="text-chart-1 opacity-60">
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" points={points} />
    </svg>
  );
}

export function KpiRow({ kpis }: KpiRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
      {kpis.map((kpi, i) => {
        const Icon = ICONS[i] || Activity;
        const isPositive = kpi.change >= 0;
        const isRisk = kpi.label === "Accounts at Risk";

        return (
          <Card
            key={kpi.label}
            className={cn(
              "relative overflow-hidden",
              isRisk && Number(kpi.value) > 0 && "border-destructive/40"
            )}
          >
            <CardContent className="p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex items-end justify-between gap-2">
                <span className="text-lg font-bold tracking-tight">{kpi.value}</span>
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
                    "text-xs font-medium",
                    isPositive ? "text-emerald-500" : "text-destructive"
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
  );
}
