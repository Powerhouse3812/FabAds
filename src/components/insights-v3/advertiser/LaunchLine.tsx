/**
 * "Launch activity": how many ads a competitor started per day / week / month, as a line.
 * Same frame, tooltip and units as shared/TrendBars; a line reads better than bars for one
 * competitor's rhythm. Empty / all-zero → the dashed DisabledSection (the layout never collapses).
 */
import { Area, AreaChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import type { TrendSeries } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";
import { BasedOnNote, ChangeChip, DisabledSection, fmtInt } from "../shared";
import { bucketRangeLabel, bucketTickLabel } from "../shared/format";

export interface LaunchLineProps {
  series: TrendSeries;
  /** "Based on N ads" note. */
  basedOn: number;
  title?: string;
  /** Shown when the series is empty or all zero. */
  emptyReason?: string;
  height?: number;
  className?: string;
}

const STROKE = "hsl(var(--primary))";
const TICK = { fontSize: 11, fill: "hsl(var(--muted-foreground))" } as const;

function isEmpty(series: TrendSeries) {
  return series.points.length === 0 || series.points.every((p) => p.count === 0);
}

interface TipProps {
  active?: boolean;
  payload?: { payload: { start: string; count: number } }[];
  series: TrendSeries;
}

function LineTip({ active, payload, series }: TipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md">
      <div className="text-muted-foreground">{bucketRangeLabel(p.start, series.bucket)}</div>
      <div>
        <span className="font-mono font-semibold tabular-nums">{fmtInt(p.count)}</span> {series.unit}
      </div>
    </div>
  );
}

export function LaunchLine({ series, basedOn, title = "Launch activity", emptyReason, height = 170, className }: LaunchLineProps) {
  if (isEmpty(series)) {
    return (
      <DisabledSection
        title={title}
        reason={emptyReason ?? `No ${series.unit} in this scope and period, so there is nothing to chart yet.`}
        minHeight={height + 60}
        className={className}
      />
    );
  }
  const last = series.points[series.points.length - 1];
  const summary = `${title}: ${series.unit}. ${series.points.length} ${series.bucket} points, latest ${last.count}.`;
  const tickEvery = Math.max(0, Math.ceil(series.points.length / 6) - 1);
  const gradId = "launch-line-fill";

  return (
    <section aria-label={title} className={cn("rounded-xl border border-border bg-card p-4", className)}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">
            Unit: <span className="font-medium text-foreground">{series.unit}</span>
          </p>
        </div>
        <ChangeChip changePct={series.changePct} />
      </header>

      <div role="img" aria-label={summary} className="mt-3 w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series.points} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={STROKE} stopOpacity={0.28} />
                <stop offset="100%" stopColor={STROKE} stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="start"
              tickFormatter={(v: string) => bucketTickLabel(v, series.bucket)}
              interval={tickEvery}
              tickLine={false}
              axisLine={false}
              tick={TICK}
              height={22}
            />
            <YAxis width={32} allowDecimals={false} domain={[0, "auto"]} tickLine={false} axisLine={false} tick={TICK} />
            <RTooltip cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }} content={<LineTip series={series} />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke={STROKE}
              strokeWidth={2}
              fill={`url(#${gradId})`}
              dot={{ r: 2.5, fill: STROKE, stroke: "hsl(var(--card))", strokeWidth: 1 }}
              activeDot={{ r: 4, fill: STROKE, stroke: "hsl(var(--card))", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <BasedOnNote ads={basedOn} className="mt-2" />
    </section>
  );
}
