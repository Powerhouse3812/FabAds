import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import type { TrendSeries } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";
import { BasedOnNote } from "./BasedOnNote";
import { DisabledSection } from "./DisabledSection";
import { Hint } from "./Hint";
import { bucketRangeLabel, bucketTickLabel, fmtInt, fmtPct } from "./format";

/**
 * "+24% vs previous period" / "New this period" (previous = 0) / "−8% …". Never wraps.
 * `compact` (table rows) shortens to "+24% vs prev." / "New"; the full text moves to the tooltip.
 */
export function ChangeChip({ changePct, compact, className }: { changePct: number | null; compact?: boolean; className?: string }) {
  const full = changePct === null ? "New this period" : `${fmtPct(changePct)} vs previous period`;
  const up = changePct !== null && changePct > 0;
  const down = changePct !== null && changePct < 0;
  const chip = (
    <span
      aria-label={compact ? full : undefined}
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium",
        changePct === null && "border-primary/30 bg-primary/10 text-primary-text",
        up && "border-success-text/30 bg-success-text/10 text-success-text",
        down && "border-error-text/30 bg-error-text/10 text-error-text",
        changePct === 0 && "border-border bg-muted text-muted-foreground",
        className,
      )}
    >
      {changePct === null ? (
        compact ? "New" : "New this period"
      ) : (
        <>
          <span className="font-mono tabular-nums">{fmtPct(changePct)}</span>
          <span className="ml-1 font-normal opacity-80">{compact ? "vs prev." : "vs previous period"}</span>
        </>
      )}
    </span>
  );
  return compact ? <Hint content={full}>{chip}</Hint> : chip;
}

export interface TrendBarsProps {
  series: TrendSeries;
  /** Card title, e.g. "Launch frequency". */
  title?: string;
  /** Shown when the series is empty or all zero. */
  emptyReason?: string;
  /** Adds the "Based on X ads" note. */
  basedOn?: number;
  height?: number;
  className?: string;
}

function isEmpty(series: TrendSeries) {
  return series.points.length === 0 || series.points.every((p) => p.count === 0);
}

interface TipProps {
  active?: boolean;
  payload?: { payload: { start: string; count: number } }[];
  series: TrendSeries;
}

function BarTip({ active, payload, series }: TipProps) {
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

/** Lime bars, latest bucket emphasised. Unit label is always visible; every bar has a tooltip. */
export function TrendBars({ series, title, emptyReason, basedOn, height = 160, className }: TrendBarsProps) {
  if (isEmpty(series)) {
    return (
      <DisabledSection
        title={title ?? "Trend"}
        reason={emptyReason ?? `No ${series.unit} in this scope and period, so there is nothing to chart yet.`}
        minHeight={height + 60}
        className={className}
      />
    );
  }
  const last = series.points[series.points.length - 1];
  const summary = `${title ?? "Trend"}: ${series.unit}. ${series.points.length} ${series.bucket} buckets, latest ${last.count}.`;
  const tickEvery = Math.max(0, Math.ceil(series.points.length / 6) - 1);

  return (
    <section aria-label={title ?? "Trend"} className={cn("flex h-full flex-col rounded-xl border border-border bg-card p-4", className)}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {title && <h3 className="truncate text-sm font-semibold text-foreground">{title}</h3>}
          <p className="text-xs text-muted-foreground">
            Unit: <span className="font-medium text-foreground">{series.unit}</span>
          </p>
        </div>
        <ChangeChip changePct={series.changePct} />
      </header>

      <div role="img" aria-label={summary} className="mt-3 w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={series.points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="18%">
            <XAxis
              dataKey="start"
              tickFormatter={(v: string) => bucketTickLabel(v, series.bucket)}
              interval={tickEvery}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              height={22}
            />
            <YAxis
              width={32}
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <RTooltip cursor={{ fill: "hsl(var(--primary) / 0.12)" }} content={<BarTip series={series} />} />
            <Bar dataKey="count" radius={[3, 3, 0, 0]} isAnimationActive={false}>
              {series.points.map((p, i) => (
                <Cell
                  key={p.start}
                  fill={i === series.points.length - 1 ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.5)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {basedOn !== undefined && <BasedOnNote ads={basedOn} className="mt-2" />}
    </section>
  );
}

export interface TrendSparkProps {
  series: TrendSeries;
  width?: number;
  height?: number;
  className?: string;
  /** "bars" (default) or a clean "line" with the latest point as a dot. */
  variant?: "bars" | "line";
}

/** Mini line + area + latest dot (rounded joins). Flat dashed line when empty is handled by the caller. */
function SparkLine({ pts, width, height, max }: { pts: TrendSeries["points"]; width: number; height: number; max: number }) {
  const pad = 3;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const xy = pts.map((p, i) => [pad + (pts.length > 1 ? (i / (pts.length - 1)) * w : w / 2), pad + (1 - p.count / max) * h] as const);
  const line = xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [lx, ly] = xy[xy.length - 1];
  const area = `M${xy[0][0].toFixed(1)},${height - pad} L${line.replace(/ /g, " L")} L${lx.toFixed(1)},${height - pad} Z`;
  return (
    <>
      {xy.length > 1 && <path d={area} fill="hsl(var(--primary) / 0.14)" stroke="none" />}
      {xy.length > 1 && (
        <polyline points={line} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
      )}
      <circle cx={lx} cy={ly} r="2.5" fill="hsl(var(--primary))" />
    </>
  );
}

/** Mini bars (or line) for table rows. Plain SVG (cheap at 1000+ rows). Label + tooltip carry the unit. */
export function TrendSpark({ series, width = 72, height = 24, className, variant = "bars" }: TrendSparkProps) {
  const empty = isEmpty(series);
  const pts = series.points;
  const max = Math.max(1, ...pts.map((p) => p.count));
  const last = pts[pts.length - 1];
  const change = series.changePct === null ? "new this period" : `${fmtPct(series.changePct)} vs previous period`;
  const label = empty
    ? `No ${series.unit} in this period`
    : `${series.unit}: latest ${last.count}, ${change}`;
  const gap = 1;
  const bw = pts.length ? Math.max(1, (width - gap * (pts.length - 1)) / pts.length) : 0;

  return (
    <Hint
      content={
        empty ? (
          label
        ) : (
          <>
            <span className="font-mono tabular-nums">{fmtInt(last.count)}</span> {series.unit} (latest) · {change}
          </>
        )
      }
    >
      <svg
        role="img"
        aria-label={label}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={cn("shrink-0", className)}
      >
        {empty ? (
          <line x1="0" x2={width} y1={height - 1} y2={height - 1} stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="3 3" />
        ) : variant === "line" ? (
          <SparkLine pts={pts} width={width} height={height} max={max} />
        ) : (
          pts.map((p, i) => {
            const h = Math.max(p.count > 0 ? 2 : 1, (p.count / max) * (height - 2));
            return (
              <rect
                key={p.start}
                x={i * (bw + gap)}
                y={height - h}
                width={bw}
                height={h}
                rx="1"
                fill={i === pts.length - 1 ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.5)"}
              />
            );
          })
        )}
      </svg>
    </Hint>
  );
}
