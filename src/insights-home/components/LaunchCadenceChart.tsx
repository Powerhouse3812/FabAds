import { useId, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLaunchCadence } from "@/insights-home/lib/homeSelectors";

/**
 * LaunchCadenceChart — twelve weekly columns of launch volume.
 *
 * The chart is deliberately dumb: every bar is context, rendered in one
 * flat token colour. The ONE week with a { advertiser, pct } spike (see
 * CadencePoint in homeSelectors.ts) gets a visible inline annotation
 * naming the advertiser and the percentage — that label is the point of
 * the block, not the bar heights. Hand-rolled inline SVG, no chart lib,
 * no new tokens: fills/strokes are all existing Tailwind/shadcn classes.
 */

const CHART_WIDTH = 560;
const CHART_HEIGHT = 168;
const BASELINE_Y = 132;
const TOP_PAD = 30;
const BAR_RADIUS = 3;
const BAR_GAP = 6;

// Rounded-top / flat-bottom rect, so every column shares one visual
// baseline (BASELINE_Y) with no rounding at the foot of the bar.
function roundedTopRectPath(x: number, yTop: number, width: number, yBase: number, radius: number): string {
  const h = yBase - yTop;
  if (h <= 0) return "";
  const r = Math.max(0, Math.min(radius, width / 2, h));
  return [
    `M ${x} ${yTop + r}`,
    `Q ${x} ${yTop} ${x + r} ${yTop}`,
    `L ${x + width - r} ${yTop}`,
    `Q ${x + width} ${yTop} ${x + width} ${yTop + r}`,
    `L ${x + width} ${yBase}`,
    `L ${x} ${yBase}`,
    `Z`,
  ].join(" ");
}

export function LaunchCadenceChart() {
  const { points, loading } = useLaunchCadence();
  const titleId = useId();

  const layout = useMemo(() => {
    if (!points.length) return null;
    const n = points.length;
    const maxLaunches = Math.max(...points.map((p) => p.launches), 1);
    const scaleMax = maxLaunches * 1.2; // headroom for the spike annotation
    const usableHeight = BASELINE_Y - TOP_PAD;
    const barWidth = (CHART_WIDTH - BAR_GAP * (n - 1)) / n;
    const spikeIndex = points.findIndex((p) => p.spike);

    const bars = points.map((p, i) => {
      const x = i * (barWidth + BAR_GAP);
      const h = (p.launches / scaleMax) * usableHeight;
      const yTop = BASELINE_Y - h;
      return { x, yTop, isSpike: !!p.spike };
    });

    return { n, barWidth, spikeIndex, bars };
  }, [points]);

  if (loading) {
    return (
      <div className="space-y-2" aria-hidden>
        <Skeleton className="h-[168px] w-full rounded-md" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
    );
  }

  if (!points.length || !layout) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border py-10 text-center">
        <p className="text-sm text-foreground">No launch cadence yet</p>
        <p className="text-xs text-muted-foreground">
          This fills in once a few weeks of competitor launches have been tracked.
        </p>
      </div>
    );
  }

  const { n, barWidth, spikeIndex, bars } = layout;
  const spike = spikeIndex >= 0 ? points[spikeIndex] : null;

  const summary = points
    .map(
      (p) =>
        `${p.weekLabel}: ${p.launches} launches${
          p.spike ? `, a ${p.spike.pct}% spike from ${p.spike.advertiser}` : ""
        }`,
    )
    .join("; ");

  // Keep the annotation text inside the viewBox regardless of which week
  // the spike lands on.
  let labelAnchor: "start" | "middle" | "end" = "middle";
  let labelX = 0;
  let labelY = 0;
  if (spike && spikeIndex >= 0) {
    const bar = bars[spikeIndex];
    labelX = bar.x + barWidth / 2;
    labelY = Math.max(bar.yTop - 10, 12);
    if (labelX < 56) labelAnchor = "start";
    else if (labelX > CHART_WIDTH - 56) labelAnchor = "end";
  }

  return (
    <div className="space-y-1.5">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full"
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>
          Weekly launch cadence, last {n} weeks
          {spike?.spike
            ? ` — ${spike.spike.advertiser} spiked ${spike.spike.pct}% the week of ${spike.weekLabel}`
            : ""}
        </title>
        <line
          x1={0}
          y1={BASELINE_Y}
          x2={CHART_WIDTH}
          y2={BASELINE_Y}
          className="stroke-border"
          strokeWidth={1}
        />
        {bars.map((bar, i) => (
          <path
            key={i}
            d={roundedTopRectPath(bar.x, bar.yTop, barWidth, BASELINE_Y, BAR_RADIUS)}
            className={bar.isSpike ? "fill-primary" : "fill-muted-foreground/25"}
          />
        ))}
        {spike && spikeIndex >= 0 && (
          <g>
            <line
              x1={bars[spikeIndex].x + barWidth / 2}
              y1={labelY + 4}
              x2={bars[spikeIndex].x + barWidth / 2}
              y2={bars[spikeIndex].yTop}
              className="stroke-primary/60"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
            <text
              x={labelX}
              y={labelY}
              textAnchor={labelAnchor}
              className="fill-primary text-[10px] font-semibold"
            >
              {spike?.spike?.advertiser} +{spike?.spike?.pct}%
            </text>
          </g>
        )}
      </svg>
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>{points[0].weekLabel}</span>
        <span>{points[n - 1].weekLabel}</span>
      </div>
      <p className="sr-only">Weekly launch cadence, last {n} weeks: {summary}.</p>
    </div>
  );
}
