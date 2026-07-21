/**
 * PortfolioTrendChart — spend vs revenue across every filtered creative,
 * rendered above the Table layout (Motion's "graph + table" pattern, iter-2 W4).
 * Sums fold from rollup.series, never from stored aggregates.
 */
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { WhyDot } from "@/creative-report/components/WhyDot";
import { fmtCompactCurrency, fmtDate, fmtDateRange } from "@/creative-report/lib/format";
import { aggregatePortfolioSeries, type CreativeRollup, type PortfolioSeriesPoint } from "@/creative-report/lib/selectors";

function PortfolioTooltip({ active, payload }: { active?: boolean; payload?: { payload: PortfolioSeriesPoint }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground">{fmtDate(point.date)}</p>
      <p className="text-xs">
        <span className="text-muted-foreground">Spend: </span>
        <span className="font-medium text-foreground">{fmtCompactCurrency(point.spend)}</span>
      </p>
      <p className="text-xs">
        <span className="text-muted-foreground">Revenue: </span>
        <span className="font-medium text-foreground">{fmtCompactCurrency(point.revenue)}</span>
      </p>
    </div>
  );
}

export function PortfolioTrendChart({ rollups }: { rollups: CreativeRollup[] }) {
  const data = aggregatePortfolioSeries(rollups);
  const rangeHint = data.length > 0 ? fmtDateRange(data[0].date, data[data.length - 1].date) : null;

  if (data.length === 0) return null;

  return (
    <div className="mb-4 rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-sm font-medium text-foreground">
          Portfolio spend vs revenue
          <WhyDot id="grid.portfolio.trend" />
        </span>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-muted-foreground" aria-hidden />
            Spend
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
            Revenue
          </span>
          {rangeHint && <span>{rangeHint}</span>}
        </div>
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="portfolioSpendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.25} />
                <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="portfolioRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tickFormatter={(d: string) => fmtDate(d)}
              interval="preserveStartEnd"
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
            />
            <YAxis hide />
            <Tooltip content={<PortfolioTooltip />} />
            <Area
              type="monotone"
              dataKey="spend"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              fill="url(#portfolioSpendGrad)"
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#portfolioRevenueGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
