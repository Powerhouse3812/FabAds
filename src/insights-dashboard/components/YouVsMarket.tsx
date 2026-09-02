/**
 * YouVsMarket — the block no pure-play ad-intelligence tool can build.
 *
 * Foreplay's Spyder (competitor intel) and Lens (own-ads analytics) are two
 * separate products whose data never joins. Every ad-intelligence tool has
 * the same structural gap: they can see the market, or they can see you —
 * never both. FabAds is the ad manager, so it sees both, and this card
 * answers the Monday-morning question a media buyer actually has: are they
 * refreshing creative faster than me because they found a better angle, or
 * because they hit the same fatigue wall I did?
 *
 * SCANNABLE PASS (2026-08-31): this now sits in a three-up row of small
 * modules (~200-260px tall), so the block reads as three compact compare
 * tiles — label · your number · market number · arrow — instead of a
 * sentence-driven card. Nothing here was deleted, only demoted:
 *
 * SCOPE RULE — read before touching this file: creative behaviour only. Live
 * ad counts, launch cadence, creative lifespan. Never spend, never ROAS,
 * never performance — Insights does not see the user's results and must not
 * imply it does. `scopeNote` used to render as a standing banner; it now
 * lives behind the info icon next to the title AND as one micro-line under
 * the rows, so the guardrail stays reachable without eating a card's worth
 * of height on every load.
 *
 * VERDICT RENDERING — the other rule that matters here: `verdict` ships as
 * an ARROW + a mono-caps micro-word, never a colour. Being below the market
 * on creative lifespan is not "bad" — fatigue and saturation cut both ways —
 * so there is no red/green scorecard anywhere in this file. One neutral tone
 * for all four verdicts; only the icon shape and the word change, exactly
 * like the direction-only delta chip in KpiRow.
 *
 * THIN STATE — `myBrand` is present in thin (unlike most other blocks, whose
 * collections go empty). Your own creative behaviour comes from your own
 * account and doesn't depend on how much of the market we've scanned, so the
 * asymmetry — your side full, the market side honestly absent — IS the
 * state's story. Each row's `marketNaReason` carries that per metric; the
 * `marketBaselineNote` line underneath makes the shape of the gap explicit
 * instead of leaving three separate reasons unexplained.
 *
 * DROPPED FOR SPACE: the format-mix bar. It was the least load-bearing
 * element in the old layout (a second, weaker comparison-lite for a card
 * that's already making its point with the three rows) and doesn't fit the
 * new height budget. Nothing else moved off the surface — see the tooltip
 * and the footer line for where the two prose notes went.
 */
import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp, CircleHelp, Equal, GitCompareArrows, Info } from "lucide-react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MetricStat } from "@/creative-report-v2/components/MetricStat";
import { InsightsV2EmptyState } from "@/components/insights-v2/InsightsV2EmptyState";
import {
  useMyBrandVsMarket,
  type BrandComparisonRow,
  type BrandComparisonVerdict,
} from "@/insights-dashboard/lib/selectors";

const VERDICT_META: Record<
  BrandComparisonVerdict,
  { word: string; icon: LucideIcon; srLabel: string }
> = {
  above: { word: "ABOVE", icon: ArrowUp, srLabel: "Above the market" },
  below: { word: "BELOW", icon: ArrowDown, srLabel: "Below the market" },
  similar: { word: "EVEN", icon: Equal, srLabel: "Similar to the market" },
  // NEVER "N/A" (nor a bare dash): the page's own copy rule is that a missing
  // value names its cause. The row already prints `marketNaReason` beside this
  // chip, so the word only has to say that no comparison exists — not stand in
  // as a blank. See the `naReason` rule in `MetricStat`.
  unknown: { word: "NO BASIS", icon: CircleHelp, srLabel: "No comparison yet" },
};

/**
 * Arrow + mono-caps micro-word, never a colour. Both carry the verdict so it
 * isn't colour-only, but neither is `text-destructive` / `text-primary-text`
 * — "below" is a different reading, not a worse one.
 */
function VerdictMark({ verdict }: { verdict: BrandComparisonVerdict }) {
  const meta = VERDICT_META[verdict];
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex shrink-0 items-center gap-0.5 text-foreground/70"
      role="img"
      aria-label={meta.srLabel}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span className="font-mono text-[9px] font-medium uppercase tracking-[0.1em]">
        {meta.word}
      </span>
    </span>
  );
}

function CompareRow({ row }: { row: BrandComparisonRow }) {
  return (
    <div className="border-t border-border/60 py-2 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-medium text-foreground/70">{row.label}</span>
        <VerdictMark verdict={row.verdict} />
      </div>
      <div className="mt-0.5 flex items-baseline justify-between gap-2">
        <span className="text-base font-semibold tabular-nums text-foreground">{row.yourValue}</span>
        {row.marketValue !== null ? (
          <span className="text-xs tabular-nums text-foreground/70">{row.marketValue}</span>
        ) : (
          <span className="max-w-[52%] text-right text-[10px] italic leading-snug text-foreground/70">
            {row.marketNaReason ?? "No data"}
          </span>
        )}
      </div>
    </div>
  );
}

export function YouVsMarket({ className }: { className?: string }): JSX.Element {
  const {
    hasBrand,
    brandName,
    scopeNote,
    rows,
    refreshCadenceLabel,
    hasMarketBaseline,
    marketBaselineNote,
    isEmpty,
    isLoading,
  } = useMyBrandVsMarket();

  // CHECK isLoading BEFORE `isEmpty` / `!hasBrand`. `myBrand` is null in both
  // `loading` and `zero` — a skeleton keeps first paint from claiming "no
  // brand connected" while we simply haven't heard back yet.
  if (isLoading) {
    return (
      <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <header className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70">
            You vs market
          </h2>
        </header>
        <div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border-t border-border/60 py-2 first:border-t-0 first:pt-0">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-10" />
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-2">
                <Skeleton className="h-5 w-10" />
                <Skeleton className="h-3 w-14" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="mt-2 h-6 w-24" />
      </section>
    );
  }

  return (
    <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <header className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          <h2 className="truncate font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70">
            You vs market
          </h2>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  tabIndex={0}
                  aria-label="Scope: creative behaviour only"
                  className="inline-flex shrink-0 items-center rounded-sm text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <Info className="h-3 w-3" aria-hidden="true" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px]">
                <p className="text-xs leading-snug">{scopeNote}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {hasBrand && brandName && (
          <span className="shrink-0 truncate text-[11px] text-foreground/70">{brandName}</span>
        )}
      </header>

      {isEmpty || !hasBrand ? (
        <InsightsV2EmptyState
          icon={GitCompareArrows}
          title="No brand connected yet"
          description={marketBaselineNote ?? "Connect your own account to compare your creative behaviour against the market."}
        />
      ) : (
        <div>
          {/* Column labels — without these, "224 vs 47" reads left-to-right
              by convention only. Once here, not repeated per row. */}
          <div className="flex items-baseline justify-between gap-2 pb-1">
            <span className="font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-foreground/50">
              You
            </span>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    tabIndex={0}
                    className="inline-flex shrink-0 items-center gap-0.5 rounded-sm font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    Market
                    <Info className="h-2.5 w-2.5" aria-hidden="true" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[220px]">
                  <p className="text-xs leading-snug">
                    {Array.from(new Set(rows.map((r) => r.marketLabel))).join(" · ")}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div>
            {rows.map((row) => (
              <CompareRow key={row.key} row={row} />
            ))}
          </div>

          <div className="mt-1 flex items-center justify-between gap-2 border-t border-border/60 pt-2">
            <MetricStat label="Refresh cadence" value={refreshCadenceLabel} size="sm" />
          </div>

          {!hasMarketBaseline && marketBaselineNote && (
            <p className="mt-2 text-[10px] leading-snug text-foreground/70">{marketBaselineNote}</p>
          )}
        </div>
      )}
    </section>
  );
}
