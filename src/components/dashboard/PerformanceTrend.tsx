import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { timeSeries, type MetricKey } from "@/lib/dashboard-selectors";

const CHIPS: { key: MetricKey; label: string; format: (v: number) => string }[] = [
  { key: "spend", label: "Spend", format: (v) => `$${v.toLocaleString()}` },
  { key: "revenue", label: "Revenue", format: (v) => `$${v.toLocaleString()}` },
  { key: "margin", label: "Margin", format: (v) => `$${v.toLocaleString()}` },
  { key: "roas", label: "ROAS", format: (v) => v.toFixed(2) },
];

interface PerformanceTrendProps {
  dateSeed: number;
}

export function PerformanceTrend({ dateSeed }: PerformanceTrendProps) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>("spend");
  const data = timeSeries(dateSeed, activeMetric);
  const activeChip = CHIPS.find((c) => c.key === activeMetric)!;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-semibold">Performance Trend</CardTitle>
          <div className="flex gap-1.5">
            {CHIPS.map((chip) => (
              <button
                key={chip.key}
                onClick={() => setActiveMetric(chip.key)}
                className={cn(
                  "px-2.5 py-0.5 text-xs font-medium rounded-full border transition-colors",
                  activeMetric === chip.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-secondary-foreground border-border hover:bg-accent/10"
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
            <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" width={60} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0];
                return (
                  <div className="bg-popover border border-border rounded-lg shadow-md px-3 py-2">
                    <p className="text-xs text-muted-foreground">{point.payload.date}</p>
                    <p className="text-sm font-semibold">
                      {activeChip.label}: {activeChip.format(point.value as number)}
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              fill="url(#areaGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
