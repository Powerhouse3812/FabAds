import { useId, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Flame,
  Users,
  Sparkles,
  Megaphone,
  MessageCircleQuestion,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAngleMix, type AngleSlice } from "@/insights-home/lib/homeSelectors";

/**
 * AngleMixDonut — share of ads per creative angle, from useAngleMix().
 *
 * Maalik's condition for shipping this block at all: every slice AND
 * every legend row is a real control that navigates to Discover, not a
 * passive chart. Every control here navigates to
 * `/insights/discover?angle=<angle>`, which InsightsDiscover reads and
 * filters on with the SAME angleForAd() bucket function useAngleMix() used
 * to compute the slice — so the count on the slice and the count in the
 * grid agree, and Discover renders a removable "Filtered by angle" chip.
 *
 * (Earlier revision pointed at `?q=<angle>`. That was wrong: `?q=` is a
 * free-text search over headline/pageName, and the bucket names are derived
 * labels that appear in no headline — every slice landed on an empty grid.)
 *
 * Hand-rolled inline SVG donut (stroke-dasharray technique) — no chart
 * lib, no new tokens. Colour is never the only way to tell slices apart:
 * legend row order matches clockwise slice order 1:1, each row carries an
 * icon + the angle name + share + count in text, and screen readers get
 * a full aria-label per slice.
 */

const ANGLE_ICONS: Record<string, LucideIcon> = {
  Curiosity: HelpCircle,
  Urgency: Flame,
  "Social proof": Users,
  "Benefit-led": Sparkles,
  "Direct offer": Megaphone,
  "Question hook": MessageCircleQuestion,
};

// Purely decorative opacity steps on a single existing token colour
// (fill/stroke-primary) — never the sole way meaning is carried; icon +
// label + shared ordering do that job.
const SLICE_OPACITY = [1, 0.8, 0.62, 0.48, 0.36, 0.26];

const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 70;
const STROKE_WIDTH = 30;
const GAP_PX = 3;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function discoverHref(angle: string): string {
  return `/insights/discover?angle=${encodeURIComponent(angle)}`;
}

export function AngleMixDonut() {
  const { slices, totalAds, loading } = useAngleMix();
  const navigate = useNavigate();
  const titleId = useId();
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const arcs = useMemo(() => {
    let cumulative = 0;
    // Arc length comes from the raw adCount, NOT the rounded `share` label —
    // `share` is integer-apportioned for display and can differ from the true
    // fraction by up to a point, which would leave a visible gap or overlap
    // where the ring closes.
    return slices.map((slice, i) => {
      const fraction = totalAds > 0 ? slice.adCount / totalAds : 0;
      const segLen = fraction * CIRCUMFERENCE;
      const visibleLen = Math.max(segLen - GAP_PX, 0);
      const dashoffset = -cumulative;
      cumulative += segLen;
      return {
        slice,
        i,
        dasharray: `${visibleLen} ${Math.max(CIRCUMFERENCE - visibleLen, 0)}`,
        dashoffset,
        opacity: SLICE_OPACITY[i % SLICE_OPACITY.length],
      };
    });
  }, [slices, totalAds]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6" aria-hidden>
        <Skeleton className="h-[168px] w-[168px] shrink-0 rounded-full" />
        <div className="flex w-full flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  const isZero = !slices.length || totalAds === 0;

  if (isZero) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border py-10 text-center">
        <p className="text-sm text-foreground">No angle mix yet</p>
        <p className="text-xs text-muted-foreground">
          This fills in once tracked competitors have ads with headline copy to bucket.
        </p>
      </div>
    );
  }

  const summary = slices
    .map((s) => `${s.angle}: ${s.share}% (${s.adCount} ads)`)
    .join("; ");

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-[168px] w-[168px] shrink-0"
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>
          Ad angle mix, {totalAds} ads total. {summary}.
        </title>
        {/* Track */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE_WIDTH}
          className="stroke-muted"
        />
        <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
          {arcs.map(({ slice, i, dasharray, dashoffset, opacity }) => (
            <g key={slice.angle}>
              {focusedIndex === i && (
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS}
                  fill="none"
                  strokeWidth={STROKE_WIDTH + 8}
                  strokeDasharray={dasharray}
                  strokeDashoffset={dashoffset}
                  className="stroke-ring/70"
                  aria-hidden
                  pointerEvents="none"
                />
              )}
              <circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={dasharray}
                strokeDashoffset={dashoffset}
                style={{ opacity }}
                className="stroke-primary cursor-pointer transition-opacity hover:opacity-90"
                tabIndex={0}
                role="button"
                aria-label={`${slice.angle} — ${slice.share}% of ads, ${slice.adCount} ads. View in Discover.`}
                onFocus={() => setFocusedIndex(i)}
                onBlur={() => setFocusedIndex((cur) => (cur === i ? null : cur))}
                onClick={() => navigate(discoverHref(slice.angle))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(discoverHref(slice.angle));
                  }
                }}
              />
            </g>
          ))}
        </g>
        <text
          x={CENTER}
          y={CENTER - 4}
          textAnchor="middle"
          className="fill-foreground text-[26px] font-semibold"
        >
          {totalAds}
        </text>
        <text
          x={CENTER}
          y={CENTER + 16}
          textAnchor="middle"
          className="fill-muted-foreground text-[10px] uppercase tracking-wider"
        >
          ads
        </text>
      </svg>

      <ul className="flex w-full min-w-0 flex-col gap-1">
        {slices.map((slice: AngleSlice, i) => {
          const Icon = ANGLE_ICONS[slice.angle] ?? Sparkles;
          return (
            <li key={slice.angle}>
              <button
                type="button"
                onClick={() => navigate(discoverHref(slice.angle))}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md border border-transparent px-2 py-1.5 text-left text-sm transition-colors",
                  "hover:border-border/60 hover:bg-muted/40",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                )}
                aria-label={`${slice.angle} — ${slice.share}% of ads, ${slice.adCount} ads. View in Discover.`}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary"
                  style={{ opacity: SLICE_OPACITY[i % SLICE_OPACITY.length] }}
                  aria-hidden
                />
                <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-foreground">{slice.angle}</span>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {slice.share}% · {slice.adCount}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
