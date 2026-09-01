/**
 * AngleMixDonut — which copy angles the market is running, versus yours.
 *
 * WHY THIS BLOCK EARNS ITS PLACE (two conditions, both must hold):
 *
 * 1. Every slice navigates. `discoverHref` on each row is resolved by
 *    `useAngleMix` from real ad headlines via the intent bank
 *    (`/insights/discover?angle=<angleKey>`) — following it genuinely
 *    returns `adCount` ads. Both the donut wedges (mouse) and the legend rows
 *    (real `react-router-dom` `Link`s, keyboard + screen reader reachable)
 *    point at it. The link is live: `InsightsDiscover` reads `?angle=` and
 *    filters through the same `angleForHeadline` classification this block
 *    counts with, so the destination set matches the slice's claim.
 *
 * 2. It carries a baseline. A bare "Lifestyle 32%" means nothing without
 *    knowing what you run. The legend renders market-vs-yours per row, and
 *    the sharpest gap (`biggestGap`) becomes the block's one-line takeaway —
 *    "the market runs 3× more X than you do" is the actionable sentence,
 *    the raw split isn't.
 *
 * ABSENT vs ZERO — the distinction the whole file is built to respect:
 * `row.yourPct === null` means we have no brand configured (absent, not
 * measured). `row.yourPct === 0` means the brand exists and runs none of
 * that angle (a real, reportable zero). The legend renders these two claims
 * differently — "no brand data" (italic, absent) vs "you 0%" (real zero) —
 * and never falls back to a bare dash for either.
 *
 * KEYBOARD ACCESSIBILITY — recharts hardcodes `tabIndex: -1` on every Pie
 * sector at render time (see `Pie.js` → `renderSectorsStatically`), which
 * silently overrides any `tabIndex` passed via `<Cell>`. So per-wedge
 * keyboard focus is not achievable here no matter what props we hand the
 * chart. The legend is therefore the real navigation surface — genuine
 * `<Link>` elements, one per angle — and the donut is marked `aria-hidden`
 * so screen readers aren't offered a dead-end duplicate of the same data.
 * The wedges stay mouse-clickable as a visual shortcut on top of that.
 *
 * CHART DISCIPLINE — one dominant hue (`--primary`), stepped opacity in
 * magnitude order (rows arrive sorted `marketPct` descending), 2px slice
 * gaps, no animation, centre shows the total live-ad count the donut is a
 * breakdown of. Never a categorical rainbow, never a new token.
 *
 * `compact` — a shorter variant for the demoted supporting row this block
 * shares with `LaunchCadenceChart`. Shrinks the donut and tightens the
 * legend rows; drops the biggest-gap takeaway sentence and the basisNote
 * footnote. Every slice still navigates and the legend's market-vs-yours
 * comparison per row survives untouched — those two things are what earn
 * this block its place at all (see above). `compact` undefined/false is
 * pixel-identical to the original block.
 */
import { Link, useNavigate } from "react-router-dom";
import { ChartPie } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { InsightsV2EmptyState } from "@/components/insights-v2/InsightsV2EmptyState";
import { Provenance } from "@/insights-dashboard/components/Provenance";
import { useAngleMix, type AngleMixRow } from "@/insights-dashboard/lib/selectors";

const CHART_SIZE = 160;
const OUTER_RADIUS = 76;
const INNER_RADIUS = 48;

/** `compact` demotes this block into the supporting row it shares with
 * `LaunchCadenceChart` — same donut/legend ratio, scaled down, with the
 * biggest-gap takeaway sentence dropped and the legend tightened. The
 * slices stay real navigation and the market-vs-yours comparison per row
 * survives, because those are the two things that earn this block its
 * place (see file header). `compact` undefined/false renders identically
 * to the original block. */
const CHART_SIZE_COMPACT = 92;
const OUTER_RADIUS_COMPACT = 42;
const INNER_RADIUS_COMPACT = 26;

/** Stepped opacity by market-share rank — rows are pre-sorted descending, so
 * index order IS magnitude order. Floors at the faintest step past 6. */
const SLICE_ALPHA_STEPS = [1, 0.8, 0.62, 0.48, 0.36, 0.26] as const;
function sliceFill(rankIndex: number): string {
  const alpha = SLICE_ALPHA_STEPS[Math.min(rankIndex, SLICE_ALPHA_STEPS.length - 1)];
  return `hsl(var(--primary) / ${alpha})`;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** The one-line takeaway: the sharpest angle gap, phrased as an action, not
 * a raw split. Only called when `yourPct` is non-null (guaranteed whenever
 * `hasYourSide` is true, since `biggestGap` is picked from rows that have a
 * gap in the first place). */
function biggestGapSentence(row: AngleMixRow): string {
  const { angle, marketPct, yourPct } = row;
  if (yourPct === 0) {
    return `${angle} makes up ${marketPct}% of the market's live creative — you run none of it.`;
  }
  if (yourPct === null) return "";
  const ratio = marketPct / yourPct;
  return ratio >= 1.4
    ? `The market runs ${round1(ratio)}× more ${angle.toLowerCase()} copy than you do — ${marketPct}% vs your ${yourPct}%.`
    : `${angle} is your widest gap: the market runs ${marketPct}% of live creative vs your ${yourPct}%.`;
}

export function AngleMixDonut({
  className,
  compact,
}: {
  className?: string;
  /** Demoted layout for the compact supporting row (see file header).
   * Undefined/false renders identically to the original full block. */
  compact?: boolean;
}): JSX.Element {
  const { rows, isEmpty, isLoading, hasYourSide, yourBrandName, totalAdCount, biggestGap, basisNote } =
    useAngleMix();
  const navigate = useNavigate();

  const chartSize = compact ? CHART_SIZE_COMPACT : CHART_SIZE;
  const outerRadius = compact ? OUTER_RADIUS_COMPACT : OUTER_RADIUS;
  const innerRadius = compact ? INNER_RADIUS_COMPACT : INNER_RADIUS;

  // CHECK isLoading BEFORE `isEmpty`. `rows` is `[]` in both `loading` and a
  // genuinely empty angle mix — a donut+legend skeleton keeps first paint from
  // claiming "no copy angle data" while the scan is still running.
  if (isLoading) {
    return (
      <section className={cn("rounded-lg border border-border bg-card", compact ? "p-3" : "p-4", className)}>
        <header className={cn("flex items-center justify-between gap-2", compact ? "mb-1.5" : "mb-3")}>
          <h2 className="text-sm font-semibold text-foreground">Copy angle mix</h2>
        </header>
        <div className={cn("flex flex-col", compact ? "gap-2" : "gap-4")}>
          <div className="relative mx-auto shrink-0" style={{ width: chartSize, height: chartSize }}>
            <Skeleton className="h-full w-full rounded-full" />
          </div>
          <ul className={cn("min-w-0 flex-1", compact ? "space-y-1" : "space-y-1.5")}>
            {Array.from({ length: 6 }).map((_, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-center justify-between gap-2 px-1.5",
                  compact ? "py-0.5" : "py-1",
                )}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Skeleton className="h-2.5 w-2.5 shrink-0 rounded-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-3 w-16" />
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  if (isEmpty) {
    return (
      <section className={cn("rounded-lg border border-border bg-card", compact ? "p-3" : "p-4", className)}>
        <header className={cn("flex items-center justify-between gap-2", compact ? "mb-1.5" : "mb-3")}>
          <h2 className="text-sm font-semibold text-foreground">Copy angle mix</h2>
        </header>
        <InsightsV2EmptyState
          icon={ChartPie}
          title={yourBrandName ? "No market data indexed yet" : "No copy angle data yet"}
          description={
            yourBrandName
              ? `${yourBrandName}'s own copy angles are tracked, but nothing is indexed on the market side yet — there's nothing to compare against.`
              : "Follow an industry to see which copy angles the market is running."
          }
        />
      </section>
    );
  }

  return (
    <section className={cn("rounded-lg border border-border bg-card", compact ? "p-3" : "p-4", className)}>
      <header className={cn("flex items-center justify-between gap-2", compact ? "mb-1.5" : "mb-3")}>
        <h2 className="text-sm font-semibold text-foreground">Copy angle mix</h2>
      </header>

      {/* STACKED, never side-by-side. This card sits in a 2-up row inside the
          8-of-12 main column — ~324px of usable width at 1440. Beside a 160px
          donut the legend had ~148px, of which the percent cluster took ~90,
          leaving every angle label rendered as "Be…", "Qu…", "Pr…". Tailwind
          breakpoints track the viewport, not the card, so no `sm:`/`xl:` gate
          fixes it; the legend simply needs the full card width. `compact`
          keeps this same stacked order — only the donut shrinks and the
          legend rows tighten — so a narrower compact card doesn't reopen the
          truncation bug the comment above describes. */}
      <div className={cn("flex flex-col", compact ? "gap-2" : "gap-4")}>
        {/* Donut — decorative/mouse-only, see file header for why. */}
        <div
          className="relative mx-auto shrink-0"
          style={{ width: chartSize, height: chartSize }}
          aria-hidden="true"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={rows}
                dataKey="marketPct"
                nameKey="angle"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                paddingAngle={2}
                stroke="none"
                isAnimationActive={false}
                onClick={(_, index) => navigate(rows[index].discoverHref)}
              >
                {rows.map((row, i) => (
                  <Cell key={row.angleKey} fill={sliceFill(i)} cursor="pointer" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={cn(
                "font-semibold tabular-nums text-foreground",
                compact ? "text-sm" : "text-lg",
              )}
            >
              {totalAdCount.toLocaleString()}
            </span>
            <span
              className={cn(
                "font-mono font-medium uppercase tracking-[0.14em] text-muted-foreground",
                compact ? "text-[8px]" : "text-[9px]",
              )}
            >
              live ads
            </span>
          </div>
        </div>

        {/* Legend — the real, keyboard-reachable navigation surface. Each
            row genuinely returns `adCount` ads at `discoverHref` once
            InsightsDiscover reads the param (see file header). `compact`
            tightens row padding/type only — every row, the market-vs-yours
            comparison and the click-through all stay. */}
        <ul className={cn("min-w-0 flex-1", compact ? "space-y-0" : "space-y-0.5")}>
          {rows.map((row, i) => (
            <li key={row.angleKey}>
              <Link
                to={row.discoverHref}
                title={`${row.adCount.toLocaleString()} ads — open in Discover`}
                className={cn(
                  "group -mx-1.5 flex items-center justify-between gap-2 rounded-md px-1.5 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  compact ? "py-0.5" : "py-1",
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn("shrink-0 rounded-full", compact ? "h-2 w-2" : "h-2.5 w-2.5")}
                    style={{ backgroundColor: sliceFill(i) }}
                    aria-hidden="true"
                  />
                  <span
                    className={cn(
                      "truncate font-medium text-foreground",
                      compact ? "text-[11px]" : "text-xs",
                    )}
                  >
                    {row.angle}
                  </span>
                </span>
                <span
                  className={cn(
                    "flex shrink-0 items-baseline gap-1.5 tabular-nums",
                    compact ? "text-[11px]" : "text-xs",
                  )}
                >
                  <span className="text-foreground">{row.marketPct}%</span>
                  {row.yourPct !== null ? (
                    <span className="text-muted-foreground">you {row.yourPct}%</span>
                  ) : (
                    <span className="italic text-muted-foreground">no brand data</span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* The takeaway sentence is the first thing compact sheds — it's prose
          restating what the legend's market-vs-yours column already shows,
          not new information the way the legend itself is. */}
      {!compact &&
        (hasYourSide && biggestGap ? (
          <p className="mt-3 text-xs leading-snug text-muted-foreground">
            {biggestGapSentence(biggestGap)}
          </p>
        ) : (
          <p className="mt-3 text-xs italic leading-snug text-muted-foreground">
            No brand configured — showing market mix only.
          </p>
        ))}

      {/* `basisNote` is a methodology footnote (share-of-creative, not
          share-of-spend) — same class of supporting caption as
          LaunchCadenceChart's `scopeNote`, so it's dropped in compact for
          the same reason. The `Provenance` marker stays either way: it's
          the one disclosure this dashboard never hides regardless of
          density. */}
      <div
        className={cn(
          "flex items-start justify-between gap-3 border-t border-border/60",
          compact ? "mt-2 pt-1.5" : "mt-3 pt-2",
        )}
      >
        {!compact && (
          <p className="max-w-prose text-[11px] leading-snug text-muted-foreground">{basisNote}</p>
        )}
        <Provenance tier="derived" compact={compact} className={compact ? "ml-auto" : undefined} />
      </div>
    </section>
  );
}
