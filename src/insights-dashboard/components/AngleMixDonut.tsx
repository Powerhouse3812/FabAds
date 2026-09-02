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
 * `compact` — a dense ~130-150px variant for the narrow right-hand column
 * this block shares with `YouVsMarket` (stacked underneath it). At that
 * height budget a stacked donut-then-legend (the full-size layout) no longer
 * fits six legend rows, so compact runs the donut and legend SIDE BY SIDE
 * instead — a small fixed-size donut plus a legend column that keeps the
 * rest of the column's width, not a viewport breakpoint, so the earlier
 * "Be…"/"Qu…" truncation bug (a `sm:flex-row` firing on viewport width
 * while the card was ~324px) cannot recur: the layout is chosen once, by
 * `compact`, sized against this container's own budget, never re-measured
 * against the window. Drops the biggest-gap takeaway sentence and the
 * basisNote footnote. An earlier revision resurfaced the sharpest gap as a
 * signed "-10.7pt" figure in the header instead — that shipped with no
 * visible unit explanation, no stated sign referent, and the angle it was
 * about hidden in a native `title=""`. Maalik couldn't decode it ("ek %
 * samajh ati, why 2 and what are the pt value in top?"). Rather than
 * re-patch a number with nowhere legible to put angle + sign + magnitude in
 * a ~120px header slot, it's dropped outright: the header now carries a
 * one-time "You / Market" column label (see the header JSX below) so every
 * row's own pair — rendered you-first to match `YouVsMarket`'s column order —
 * reads on its own, no abbreviation, no hidden `title`. Every slice still
 * navigates and the legend's market-vs-yours comparison per row survives
 * untouched — those two things are what earn this block its place at all
 * (see above). `compact` undefined/false is pixel-identical to the original
 * block.
 */
import { Link, useNavigate } from "react-router-dom";
import { ChartPie } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { InsightsV2EmptyState } from "@/components/insights-v2/InsightsV2EmptyState";
import { Provenance } from "@/insights-dashboard/components/Provenance";
import { InfoTip } from "@/insights-dashboard/components/InfoTip";
import {
  useAngleMix,
  type AngleMixRow,
} from "@/insights-dashboard/lib/selectors";

const CHART_SIZE = 160;
const OUTER_RADIUS = 76;
const INNER_RADIUS = 48;

/** `compact` demotes this block into the ~130-150px supporting row it shares
 * with `YouVsMarket`, laid out side-by-side (donut left, legend right)
 * rather than stacked, so six legend rows fit the height budget. The
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

/* GapChip and othersTooltip used to live here, surfacing the widest gap as a
 * signed "-10.7pt" header figure and an angle-list explanation as native
 * `title=""` hovers. Both are gone: "pt" is unlabelled jargon, the sign had
 * no stated referent, and the angle it belonged to lived only in a
 * `title` — invisible to anyone who doesn't hover, and the exact failure
 * this file is being fixed for (see the compact doc above). Rather than
 * patch a number that has nowhere legible to put angle + sign + magnitude in
 * a ~120px header slot, it's dropped: the header now carries a one-time
 * "You / Market" column label (rendered inline below) that makes every row's
 * own pair self-explanatory instead. */

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
          <h2 className="flex items-center gap-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70">
            Copy angle mix
            <InfoTip tip="block.angle-mix" />
          </h2>
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
          <h2 className="flex items-center gap-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70">
            Copy angle mix
            <InfoTip tip="block.angle-mix" />
          </h2>
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
        <h2 className="flex items-center gap-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70">
          Copy angle mix
          <InfoTip tip="block.angle-mix" />
        </h2>
        {/* Compact drops the biggest-gap takeaway sentence below in favour of
            one column label for the whole legend: "You / Market" — stated
            once here rather than repeated on all six rows, and read left-to-
            right to match the order each row renders its own pair in (see
            the legend below), and `YouVsMarket`'s own You/Market order.
            It's also this block's only literal column-header-shaped text, so
            `metric.copy-angle-share` (per-row market-vs-you share) hangs its
            one tip here rather than on any of the six repeated row values. */}
        {compact && (
          <span className="flex items-center gap-1.5">
            {/* With no brand connected there is no "you" column to name and
                each row prints ONE number, so the header names that one
                thing instead of promising a pair the rows can't deliver.
                (The pair-with-a-placeholder version rendered "n/a /25%" —
                an absence dressed up as a value, which is the dash-in-
                disguise this page's copy rule forbids.) */}
            <span className="flex items-center gap-1 font-mono text-[8px] font-medium uppercase tracking-[0.08em] text-foreground/70">
              {hasYourSide ? "You / Market" : "Market share"}
              <InfoTip tip="metric.copy-angle-share" />
            </span>
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
          the donut to a fixed 48px and hands the legend the rest of the
          column's width — still comfortably wider than the ~148px that
          caused the truncation bug above, because the donut itself is much
          smaller here. This is a fixed layout choice keyed off `compact`,
          not a viewport breakpoint, so it can't refire the same bug. */}
      <div className={cn(compact ? "flex items-center gap-1.5" : "flex flex-col gap-4")}>
        {/* Donut + centre-count wrapper. `mx-auto` used to sit directly on
            the sized `relative` div; it now sits on this outer flex-col so
            compact can hang a "live ads" caption underneath the circle
            without touching the circle's own size — the caption has the
            legend column's full ~100px of unused vertical budget to sit in
            (the legend's six rows are taller than the 48px donut regardless),
            so it costs nothing extra vertically. Full size is unaffected:
            one child, same as before. */}
        <div className="mx-auto flex shrink-0 flex-col items-center">
          {/* Donut — decorative/mouse-only, see file header for why. */}
          <div
            className="relative"
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
                {totalAdCount.toLocaleString("en-US")}
              </span>
              {/* At 48px the donut is too small to hold a two-line centre
                  label without the text bleeding past the inner ring, so
                  full size keeps its label inside (room for two lines); the
                  compact equivalent renders as a caption below the circle
                  instead (see below) rather than going unlabelled. */}
              {!compact && (
                <span className="font-mono font-medium uppercase tracking-[0.14em] text-foreground/70 text-[9px]">
                  live ads
                </span>
              )}
            </div>
          </div>
          {/* Compact: same "live ads" label as full size, just relocated
              outside the circle where there's room — the legend column next
              to it is already taller than the 48px donut, so this costs no
              extra section height. Fixes the bare, unlabelled "182" Maalik
              flagged. */}
          {compact && (
            <span className="mt-0.5 whitespace-nowrap font-mono text-[7px] font-medium uppercase tracking-[0.08em] text-foreground/70">
              live ads
            </span>
          )}
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
                  {/* Full size: market first (bare number, the ranking
                      metric), "you X%" second — already labelled, unambiguous
                      as-is. Compact: reordered you-first/market-second to
                      match the "You / Market" column header above (and
                      `YouVsMarket`'s own column order) — the header names the
                      order once, so neither number here needs its own label.
                      Compact still rounds to whole points for width (buys
                      back the room "Direct / product" and "Question-led"
                      need to render in full rather than truncating — the
                      earlier "Be…"/"Qu…" bug). */}
                  {compact ? (
                    // A missing `yourPct` is an ABSENCE, and this page's rule
                    // is that an absence renders as words, never as a token
                    // standing in for a number. There is no room for words in
                    // a ~40px compact value slot, so the row drops the pair
                    // entirely and prints the one number it actually has —
                    // the header above says "Market share" when that happens,
                    // so nothing is left unlabelled. A real `yourPct: 0` still
                    // prints "0%", which is a measurement, not an absence.
                    row.yourPct !== null ? (
                      <>
                        <span className={row.isOthers ? "text-foreground/70" : "text-foreground"}>
                          {Math.round(row.yourPct)}%
                        </span>
                        <span className="text-foreground/70">/{Math.round(row.marketPct)}%</span>
                      </>
                    ) : (
                      <span className={row.isOthers ? "text-foreground/70" : "text-foreground"}>
                        {Math.round(row.marketPct)}%
                      </span>
                    )
                  ) : (
                    <>
                      <span className={row.isOthers ? "text-foreground/70" : "text-foreground"}>
                        {row.marketPct}%
                      </span>
                      {row.yourPct !== null ? (
                        <span className="text-foreground/70">you {row.yourPct}%</span>
                      ) : (
                        <span className="italic text-foreground/70">no brand data</span>
                      )}
                    </>
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
                  aria-label={`${row.angle}, ${row.adCount.toLocaleString("en-US")} ads — open in Discover`}
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
          compact sheds entirely. The sentence restated what the legend's
          market-vs-yours column already shows — and now that compact labels
          that column ("You / Market", see header above), it has nothing left
          to add, so it's dropped rather than fixed. The footnote is a
          methodology caption; only the `Provenance` marker survives from this
          block in compact, relocated into the header. Both the sentence and
          the footnote still render in full. */}
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
