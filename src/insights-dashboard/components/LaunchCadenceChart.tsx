/**
 * LaunchCadenceChart — "when are competitors ramping".
 *
 * A 12-week column chart of new-ad launches across the advertisers you
 * follow. One dominant hue (washed brand green), exactly one emphasised
 * column — the fixture-flagged spike — annotated inline with its
 * `spikeNote` via a positioned caption + a dashed reference line, plus a
 * subtle average reference line. No dual-axis, no vanity totals, no second
 * series: this is a magnitude-over-time read with one story to tell.
 *
 * A chart on a landing page only earns its place if the mark itself is
 * actionable, so every column is clickable — it calls `onSelectWeek` and the
 * page filters the change feed to that week. When `onSelectWeek` is
 * undefined the columns render as plain, non-interactive marks rather than
 * faking an affordance that does nothing.
 *
 * `compact` — a dense ~130-150px variant for the narrow (~240px) right-hand
 * column this block shares with `AngleMixDonut`. Shrinks the plot area and
 * margins hard and drops the average reference line + scope caption; the
 * spike bar, its click-to-select and its annotation all survive because
 * they're the chart's entire reason for existing — the annotation just
 * moves from a bordered callout box to a single truncated micro-line under
 * the chart, since a two-line bubble no longer fits the height budget. The
 * header also gains the latest-week delta as a signed number — "more data,
 * less height" instead of leaving that pixel row half-empty. `compact`
 * undefined/false is pixel-identical to the original block.
 */
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Provenance } from "@/insights-dashboard/components/Provenance";
import {
  useLaunchCadence,
  type LaunchCadenceWeek,
} from "@/insights-dashboard/lib/selectors";

const BAR_SIZE = 22;
const BAR_SIZE_COMPACT = 14;
const CHART_HEIGHT = 190;
/** `compact` demotes this block into the ~130-150px supporting row it shares
 * with `AngleMixDonut`. The plot area shrinks hard — average line and scope
 * caption are dropped entirely — while the spike bar, its annotation and
 * click-to-select all survive because they're this chart's entire reason
 * for existing. */
const CHART_HEIGHT_COMPACT = 68;
/** Reserved top band (px) the spike caption floats inside — kept clear of bars
 *  by the headroom baked into `yDomain` below. */
const TOP_MARGIN = 34;
const TOP_MARGIN_COMPACT = 14;

/** Signed, tabular-nums delta chip for the compact header — text carries the
 * sign so this never relies on colour alone. */
function DeltaChip({ pct }: { pct: number }): JSX.Element {
  const isUp = pct >= 0;
  const Icon = isUp ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center gap-0.5 font-mono text-[9px] font-medium tabular-nums text-foreground">
      <Icon className="h-2.5 w-2.5" aria-hidden="true" />
      {isUp ? "+" : ""}
      {pct}%
    </span>
  );
}

function weekTickRenderer(anchorIndices: Set<number>) {
  return function WeekTick(props: {
    x?: number;
    y?: number;
    payload?: { value: string };
    index?: number;
  }) {
    const { x, y, payload, index } = props;
    if (index === undefined || !anchorIndices.has(index) || x === undefined || y === undefined) {
      return null;
    }
    return (
      <text
        x={x}
        y={y + 12}
        textAnchor="middle"
        className="fill-muted-foreground"
        style={{ fontSize: 9 }}
      >
        {payload?.value}
      </text>
    );
  };
}

function ValueLabel({
  x,
  y,
  width,
  value,
  isSpike,
}: {
  x?: number;
  y?: number;
  width?: number;
  value?: number | string;
  isSpike: boolean;
}) {
  if (x === undefined || y === undefined || width === undefined) return null;
  return (
    <text
      x={x + width / 2}
      y={y - 4}
      textAnchor="middle"
      className={isSpike ? "fill-foreground" : "fill-muted-foreground"}
      style={{ fontSize: 9, fontWeight: isSpike ? 600 : 500, fontVariantNumeric: "tabular-nums" }}
    >
      {value}
    </text>
  );
}

export function LaunchCadenceChart({
  className,
  onSelectWeek,
  compact,
}: {
  className?: string;
  /** Fired when a column is clicked. Page may leave it undefined. */
  onSelectWeek?: (weekIndex: number) => void;
  /** Demoted layout for the compact supporting row (see file header).
   * Undefined/false renders identically to the original full block. */
  compact?: boolean;
}): JSX.Element {
  const cadence = useLaunchCadence();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const interactive = Boolean(onSelectWeek);

  const {
    weeks,
    isEmpty,
    isLoading,
    scopeNote,
    spike,
    spikeNote,
    averageLabel,
    average,
    rangeLabel,
    latestDeltaPct,
  } = cadence;

  const chartHeight = compact ? CHART_HEIGHT_COMPACT : CHART_HEIGHT;
  const topMargin = compact ? TOP_MARGIN_COMPACT : TOP_MARGIN;
  const barSize = compact ? BAR_SIZE_COMPACT : BAR_SIZE;

  // CHECK isLoading BEFORE `isEmpty`. `weeks` is `[]` in both `loading` and a
  // genuinely empty cadence — a chart-shaped skeleton, not the "nothing to
  // chart yet" caption, is what tells a first-time visitor we're still
  // fetching rather than reporting zero launches.
  if (isLoading) {
    return (
      <section className={cn("rounded-lg border border-border bg-card", compact ? "p-3" : "p-4", className)}>
        <header className={cn("flex items-center justify-between gap-2", compact ? "mb-1" : "mb-1")}>
          <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70">Launch cadence</h2>
          {compact && <Skeleton className="h-2.5 w-14" />}
        </header>
        <Skeleton className="w-full rounded-md" style={{ height: chartHeight }} />
        {compact ? (
          <Skeleton className="mt-1.5 h-2.5 w-3/4" />
        ) : (
          <div className="mt-2 flex items-center justify-between gap-2 border-t border-border/60 pt-2">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-20" />
          </div>
        )}
      </section>
    );
  }

  if (isEmpty) {
    return (
      <section className={cn("rounded-lg border border-border bg-card", compact ? "p-3" : "p-4", className)}>
        <header className={cn("flex items-center justify-between gap-2", compact ? "mb-1" : "mb-3")}>
          <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70">Launch cadence</h2>
        </header>
        <p className={cn("text-foreground/70", compact ? "text-[11px] leading-snug" : "text-sm")}>{scopeNote}</p>
      </section>
    );
  }

  const spikeIndex = weeks.findIndex((w) => w.isSpike);
  const lastIndex = weeks.length - 1;
  const anchorTicks = new Set<number>([0, lastIndex]);
  if (spikeIndex >= 0) anchorTicks.add(spikeIndex);
  const renderTick = weekTickRenderer(anchorTicks);

  const maxValue = Math.max(1, ...weeks.map((w) => w.adsLaunched));
  const yDomain: [number, number] = [0, maxValue * 1.3];

  function handleSelect(week: LaunchCadenceWeek) {
    onSelectWeek?.(week.weekIndex);
  }

  return (
    <section className={cn("rounded-lg border border-border bg-card", compact ? "p-3" : "p-4", className)}>
      <header className={cn("flex items-center justify-between gap-2", compact ? "mb-1" : "mb-1")}>
        <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70">Launch cadence</h2>
        <span className="flex items-center gap-1.5">
          {rangeLabel && (
            <span className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-foreground/70">
              {rangeLabel}
            </span>
          )}
          {/* "More data, less height" — the latest-week delta as a signed
              number costs nothing extra vertically since it shares the
              header row the rangeLabel already occupies. */}
          {compact && latestDeltaPct !== null && <DeltaChip pct={latestDeltaPct} />}
          {compact && <Provenance tier="derived" compact />}
        </span>
      </header>

      <div className="relative" style={{ height: chartHeight }}>
        {/* The spike note used to float INSIDE the plot as a bubble anchored
            over its column. At this card's real width (~324px in the 2-up
            row) a three-line note is taller than `TOP_MARGIN` and covered the
            tops of five bars plus the average reference label. The spike bar
            is already unmistakable — full-opacity `--primary` against 0.28,
            bold value label, anchored X tick — so the note reads better as a
            caption under the chart, at full width. */}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={weeks}
            margin={{ top: topMargin, right: 6, left: 6, bottom: 4 }}
            barCategoryGap={6}
          >
            <CartesianGrid horizontal vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
            <YAxis hide domain={yDomain} width={0} />
            <XAxis
              dataKey="weekStartLabel"
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={renderTick}
              height={16}
            />
            {/* Average reference line is a secondary, "for context" mark —
                dropped in compact so the shrunk plot area stays legible and
                the one story that must survive (the spike) isn't crowded. */}
            {average > 0 && !compact && (
              <ReferenceLine
                y={average}
                stroke="hsl(var(--muted-foreground))"
                strokeOpacity={0.5}
                strokeDasharray="3 3"
                label={{
                  value: averageLabel,
                  position: "insideTopRight",
                  fontSize: 9,
                  fill: "hsl(var(--muted-foreground))",
                }}
              />
            )}
            <Bar
              dataKey="adsLaunched"
              maxBarSize={barSize}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
              label={(props: { x?: number; y?: number; width?: number; value?: number; index?: number }) => (
                <ValueLabel {...props} isSpike={Boolean(props.index !== undefined && weeks[props.index]?.isSpike)} />
              )}
            >
              {weeks.map((week, i) => {
                const hovered = interactive && hoveredIndex === i;
                const fill = week.isSpike
                  ? "hsl(var(--primary))"
                  : hovered
                    ? "hsl(var(--primary) / 0.5)"
                    : "hsl(var(--primary) / 0.28)";
                return (
                  <Cell
                    key={week.weekIndex}
                    fill={fill}
                    className={interactive ? "cursor-pointer transition-opacity" : undefined}
                    tabIndex={interactive ? 0 : undefined}
                    role={interactive ? "button" : undefined}
                    aria-label={
                      interactive
                        ? `Week of ${week.weekStartLabel}: ${week.adsLaunched} ads launched${
                            week.isSpike ? ". Spike week — " + (week.spikeNote ?? "") : ""
                          }. Filter change feed to this week.`
                        : undefined
                    }
                    onClick={interactive ? () => handleSelect(week) : undefined}
                    onMouseEnter={interactive ? () => setHoveredIndex(i) : undefined}
                    onMouseLeave={interactive ? () => setHoveredIndex(null) : undefined}
                    onKeyDown={
                      interactive
                        ? (event: React.KeyboardEvent) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              handleSelect(week);
                            }
                          }
                        : undefined
                    }
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* The annotated spike is the whole point of this chart, so it survives
          compact untouched in substance — only its shape changes. At full
          size it's a bordered callout box; in compact that box no longer
          fits the ~130-150px height budget, so it collapses to a single
          truncated micro-line with the same "Week of …" + spikeNote content. */}
      {spike && spikeNote && (
        compact ? (
          <p className="mt-1.5 truncate text-[10px] leading-snug text-foreground" title={`Week of ${spike.weekStartLabel} — ${spikeNote}`}>
            <span className="font-mono font-medium uppercase tracking-[0.14em] text-foreground/70">
              Wk {spike.weekStartLabel}
            </span>{" "}
            {spikeNote}
          </p>
        ) : (
          <p className="mt-2 rounded-md border border-border/60 bg-muted/30 px-2.5 py-2 text-[11px] leading-snug text-foreground">
            <span className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-foreground/70">
              Week of {spike.weekStartLabel}
            </span>{" "}
            {spikeNote}
          </p>
        )
      )}

      {!compact && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2">
          <p className="text-xs text-foreground/70">{scopeNote}</p>
          <Provenance tier="derived" />
        </div>
      )}
    </section>
  );
}
