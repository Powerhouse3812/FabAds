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
 * `compact` — a dense ~130-150px variant for the narrow (~240px) right-hand
 * column this block shares with `LaunchCadenceChart`. At that height budget
 * a stacked donut-then-legend (the full-size layout) no longer fits six
 * legend rows, so compact runs the donut and legend SIDE BY SIDE instead —
 * a small fixed-size donut plus a legend column that keeps the full ~240px
 * minus the donut's width, not a viewport breakpoint, so the earlier
 * "Be…"/"Qu…" truncation bug (a `sm:flex-row` firing on viewport width
 * while the card was ~324px) cannot recur: the layout is chosen once, by
 * `compact`, sized against this container's own budget, never re-measured
 * against the window. Drops the biggest-gap takeaway sentence and the
 * basisNote footnote, surfacing the single sharpest gap as a signed number
 * in the header instead. Every slice still navigates and the legend's
 * market-vs-yours comparison per row survives untouched — those two things
 * are what earn this block its place at all (see above). `compact`
 * undefined/false is pixel-identical to the original block.
 */
import { Link, useNavigate } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, ChartPie } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { InsightsV2EmptyState } from "@/components/insights-v2/InsightsV2EmptyState";
import { Provenance } from "@/insights-dashboard/components/Provenance";
import {
  useAngleMix,
  type AngleMixDisplayRow,
  type AngleMixRow,
} from "@/insights-dashboard/lib/selectors";

const CHART_SIZE = 160;
const OUTER_RADIUS = 76;
const INNER_RADIUS = 48;

/** `compact` demotes this block into the ~130-150px supporting row it shares
 * with `LaunchCadenceChart`, laid out side-by-side (donut left, legend
 * right) rather than stacked, so six legend rows fit the height budget. The
 * slices stay real navigation and the market-vs-yours comparison per row
 * survives, because those are the two things that earn this block its
 * place (see file header). `compact` undefined/false renders identically
 * to the original block. */
const CHART_SIZE_COMPACT = 48;
const OUTER_RADIUS_COMPACT = 22;
const INNER_RADIUS_COMPACT = 13;

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

/** The sharpest gap as a signed number for the compact header — replaces the
 * full takeaway sentence (dropped in compact). Positive = you outrun the
 * market on this angle; negative = you trail it. Text carries the sign, the
 * icon just reinforces it, so this never relies on colour alone. */
function GapChip({ row }: { row: AngleMixRow }): JSX.Element | null {
  if (row.yourPct === null || row.gapPct === null) return null;
  const yourLead = round1(-row.gapPct);
  const Icon = yourLead >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className="inline-flex items-center gap-0.5 font-mono text-[9px] font-medium tabular-nums text-foreground/70"
      title={`Widest gap — ${row.angle}: market ${row.marketPct}% vs your ${row.yourPct}%`}
    >
      <Icon className="h-2.5 w-2.5" aria-hidden="true" />
      {yourLead > 0 ? "+" : ""}
      {yourLead}pt
    </span>
  );
}

/** Tooltip for the Others row. The angle taxonomy currently has exactly 6
 * members, so Others typically folds in exactly one — naming it directly
 * (rather than a vague "and more") keeps the bucket honest about what it
 * actually hides. Falls back to a list if the taxonomy ever grows. */
function othersTooltip(row: AngleMixDisplayRow): string {
  const { rolledUp } = row;
  if (rolledUp.length === 1) {
    return `Others — folds in "${rolledUp[0]}", the only angle outside the top 5.`;
  }
  return `Others — folds in ${rolledUp.length} angles: ${rolledUp.join(", ")}.`;
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
  const { displayRows, isEmpty, isLoading, hasYourSide, yourBrandName, totalAdCount, biggestGap, basisNote } =
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
        <header className={cn("flex items-center justify-between gap-2", compact ? "mb-1" : "mb-3")}>
          <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70">Copy angle mix</h2>
          {compact && <Skeleton className="h-2.5 w-14" />}
        </header>
        <div className={cn(compact ? "flex items-center gap-1.5" : "flex flex-col gap-4")}>
          <div className="relative mx-auto shrink-0" style={{ width: chartSize, height: chartSize }}>
            <Skeleton className="h-full w-full rounded-full" />
          </div>
          <ul className={cn("min-w-0 flex-1", compact ? "space-y-1" : "space-y-1.5")}>
            {Array.from({ length: 6 }).map((_, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-center justify-between gap-2 px-1.5",
                  compact ? "py-0" : "py-1",
                )}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Skeleton className="h-2.5 w-2.5 shrink-0 rounded-full" />
                  <Skeleton className={cn("h-3", compact ? "w-14" : "w-24")} />
                </div>
                {!compact && <Skeleton className="h-3 w-16" />}
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
        <header className={cn("flex items-center justify-between gap-2", compact ? "mb-1" : "mb-3")}>
          <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70">Copy angle mix</h2>
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
      <header className={cn("flex items-center justify-between gap-2", compact ? "mb-1" : "mb-3")}>
        <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70">Copy angle mix</h2>
        {/* Compact drops the biggest-gap takeaway sentence below and
            resurfaces it here as a signed number — "more data, less height"
            costs nothing extra vertically since it shares this header row. */}
        {compact && (
          <span className="flex items-center gap-1.5">
            {hasYourSide && biggestGap && <GapChip row={biggestGap} />}
            <Provenance tier="derived" compact />
          </span>
        )}
      </header>

      {/* Full size: STACKED, never side-by-side. This card sits in a 2-up row
          inside the 8-of-12 main column — ~324px of usable width at 1440.
          Beside a 160px donut the legend had ~148px, of which the percent
          cluster took ~90, leaving every angle label rendered as "Be…",
          "Qu…", "Pr…". Tailwind breakpoints track the viewport, not the
          card, so no `sm:`/`xl:` gate fixes it; the legend simply needs the
          full card width.
          Compact: SIDE BY SIDE instead. At the ~130-150px height budget six
          stacked legend rows below a donut no longer fit, so compact shrinks
          the donut to a fixed 60px and hands the legend the rest of the
          ~240px card width — still comfortably wider than the ~148px that
          caused the truncation bug above, because the donut itself is much
          smaller here. This is a fixed layout choice keyed off `compact`,
          not a viewport breakpoint, so it can't refire the same bug. */}
      <div className={cn(compact ? "flex items-center gap-1.5" : "flex flex-col gap-4")}>
        {/* Donut — decorative/mouse-only, see file header for why. */}
        <div
          className="relative mx-auto shrink-0"
          style={{ width: chartSize, height: chartSize }}
          aria-hidden="true"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={displayRows}
                dataKey="marketPct"
                nameKey="angle"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                paddingAngle={2}
                stroke="none"
                isAnimationActive={false}
                onClick={(_, index) => {
                  // Others carries no `discoverHref` — there is no single
                  // `?angle=` value meaning "everything else", so a click on
                  // that wedge is a no-op rather than a lying destination.
                  const href = displayRows[index]?.discoverHref;
                  if (href) navigate(href);
                }}
              >
                {displayRows.map((row, i) => (
                  <Cell
                    key={row.key}
                    fill={sliceFill(i)}
                    cursor={row.discoverHref ? "pointer" : "default"}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={cn(
                "font-semibold tabular-nums text-foreground",
                compact ? "text-[9px] leading-none" : "text-lg",
              )}
            >
              {totalAdCount.toLocaleString()}
            </span>
            {/* At 48px the donut is too small to hold a two-line centre
                label without the text bleeding past the inner ring, so
                compact drops the "live ads" sub-label — the count alone is
                still a real mark, and the full figure lives in the KPI row
                above this block anyway. */}
            {!compact && (
              <span className="font-mono font-medium uppercase tracking-[0.14em] text-foreground/70 text-[9px]">
                live ads
              </span>
            )}
          </div>
        </div>

        {/* Legend — the real, keyboard-reachable navigation surface. Each
            row genuinely returns `adCount` ads at `discoverHref` once
            InsightsDiscover reads the param (see file header). `compact`
            tightens row padding/type only — every row, the market-vs-yours
            comparison and the click-through all stay. */}
        <ul className={cn("min-w-0 flex-1", compact ? "space-y-0" : "space-y-0.5")}>
          {displayRows.map((row, i) => {
            // Others is a remainder, not a peer: quieter text than a named
            // angle (the wedge/dot already lands on the ramp's faintest step
            // since it's always last in `displayRows`), and — because there
            // is no single `?angle=` meaning "everything else" — plain text
            // instead of a `<Link>` that would point somewhere dishonest.
            const rowInner = (
              <>
                <span className={cn("flex min-w-0 items-center", compact ? "gap-1.5" : "gap-2")}>
                  <span
                    className={cn("shrink-0 rounded-full", compact ? "h-1.5 w-1.5" : "h-2.5 w-2.5")}
                    style={{ backgroundColor: sliceFill(i) }}
                    aria-hidden="true"
                  />
                  <span
                    className={cn(
                      "truncate",
                      compact ? "text-[10px]" : "text-xs",
                      row.isOthers ? "font-normal text-foreground/70" : "font-medium text-foreground",
                    )}
                  >
                    {row.angle}
                  </span>
                </span>
                <span
                  className={cn(
                    "flex shrink-0 items-baseline tabular-nums",
                    compact ? "gap-0.5 text-[9px]" : "gap-1 text-xs",
                  )}
                >
                  {/* Compact rounds to whole points — density over precision
                      at ~130-150px, and it buys back the width "Direct /
                      product" and "Question-led" need to render in full
                      rather than truncating (the earlier "Be…"/"Qu…" bug). */}
                  <span className={row.isOthers ? "text-foreground/70" : "text-foreground"}>
                    {compact ? Math.round(row.marketPct) : row.marketPct}%
                  </span>
                  {row.yourPct !== null ? (
                    <span className="text-foreground/70">
                      {compact ? `/${Math.round(row.yourPct)}%` : `you ${row.yourPct}%`}
                    </span>
                  ) : (
                    // Absent brand data, never a bare dash — "n/a" in compact
                    // (space-constrained), the full label at full size. Kept
                    // visually distinct from a real `yourPct: 0`, which
                    // renders as an actual "0%" above.
                    <span className="italic text-foreground/70">
                      {compact ? "n/a" : "no brand data"}
                    </span>
                  )}
                </span>
              </>
            );

            if (row.isOthers) {
              return (
                <li key={row.key}>
                  <div
                    className={cn(
                      "flex items-center justify-between gap-1 rounded-md px-1",
                      compact ? "py-px" : "py-1",
                    )}
                    title={othersTooltip(row)}
                  >
                    {rowInner}
                  </div>
                </li>
              );
            }

            return (
              <li key={row.key}>
                <Link
                  to={row.discoverHref as string}
                  title={`${row.adCount.toLocaleString()} ads — open in Discover`}
                  className={cn(
                    "group -mx-1 flex items-center justify-between gap-1 rounded-md px-1 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    compact ? "py-px" : "py-1",
                  )}
                >
                  {rowInner}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* The takeaway sentence and the basisNote footnote are the two things
          compact sheds entirely — the sentence restates what the legend's
          market-vs-yours column already shows, and the footnote is a
          methodology caption of the same class as LaunchCadenceChart's
          `scopeNote`. Both survive at full size; in compact the sharpest
          gap moves into the header as a signed number instead (see header
          above), and the `Provenance` marker moves there too, so neither is
          actually lost — they're demoted, not deleted. */}
      {!compact && (
        <>
          {hasYourSide && biggestGap ? (
            <p className="mt-3 text-xs leading-snug text-foreground/70">
              {biggestGapSentence(biggestGap)}
            </p>
          ) : (
            <p className="mt-3 text-xs italic leading-snug text-foreground/70">
              No brand configured — showing market mix only.
            </p>
          )}
          <div className="mt-3 flex items-start justify-between gap-3 border-t border-border/60 pt-2">
            <p className="max-w-prose text-[11px] leading-snug text-foreground/70">{basisNote}</p>
            <Provenance tier="derived" />
          </div>
        </>
      )}
    </section>
  );
}
