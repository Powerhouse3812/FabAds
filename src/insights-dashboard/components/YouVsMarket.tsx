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
 * imply it does. The scope note now lives behind the `InfoTip` next to the
 * title, whose registry copy (`block.you-vs-market`) already carries the
 * "creative behaviour only" guardrail — nothing else on the card repeats it.
 *
 * VERDICT RENDERING — the other rule that matters here: `verdict` ships as
 * an ARROW + a mono-caps micro-word, never a colour. Being below the market
 * on creative lifespan is not "bad" — fatigue and saturation cut both ways —
 * so there is no red/green scorecard anywhere in this file. One neutral tone
 * for all four verdicts; only the icon shape and the word change, exactly
 * like the direction-only delta chip in KpiRow.
 *
 * NO BRAND CONNECTED (`empty` state only — `myBrand` is null there and only
 * there; `firstTime` gets a small real brand, `loading` renders a skeleton
 * first) — Maalik's own named example for this whole pass: "if the user
 * hasn't done their first launch, show 'launch your first batch of ads to
 * unlock the insights'." The card keeps the exact same grid — column
 * headers, three rows, footer — instead of swapping to a generic centred
 * empty state: the MARKET side of every row is a real, grounded number
 * (`useKpis()` / `useLaunchCadence()`, the same hooks the KPI strip and the
 * cadence chart already read, so this card can't disagree with them), and
 * the YOUR side renders as the words "Not launched yet" — never a `0`, never
 * a dash. The footer swaps the "Refresh cadence" stat for Maalik's own
 * unlock line plus the one action that fixes it.
 *
 * DROPPED FOR SPACE: the format-mix bar. It was the least load-bearing
 * element in the old layout (a second, weaker comparison-lite for a card
 * that's already making its point with the three rows) and doesn't fit the
 * new height budget. Nothing else moved off the surface — see the tooltip
 * and the footer line for where the two prose notes went.
 */
import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp, CircleHelp, Equal, Info } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { InfoTip } from "@/insights-dashboard/components/InfoTip";
import {
  useKpis,
  useLaunchCadence,
  useMyBrandVsMarket,
  type BrandComparisonKey,
  type BrandComparisonVerdict,
} from "@/insights-dashboard/lib/selectors";

const VERDICT_META: Record<
  BrandComparisonVerdict,
  { word: string; icon: LucideIcon; srLabel: string }
> = {
  above: { word: "ABOVE", icon: ArrowUp, srLabel: "Above the market" },
  below: { word: "BELOW", icon: ArrowDown, srLabel: "Below the market" },
  similar: { word: "EVEN", icon: Equal, srLabel: "Similar to the market" },
  // NEVER "N/A", never a bare dash, and never a coined caps token either:
  // "NO BASIS" was jargon shouting in a column whose own row reads "Not
  // launched yet" in plain words. The absence of a verdict is not a verdict,
  // so it renders as ordinary sentence-case words (see `VerdictMark`, which
  // drops the mono-caps treatment for this one case) rather than borrowing
  // the shape of ABOVE / BELOW / EVEN.
  unknown: { word: "No comparison yet", icon: CircleHelp, srLabel: "No comparison yet" },
};

/**
 * What `CompareRow` actually needs to render one line. `BrandComparisonRow`
 * (the hook's real, brand-present shape) satisfies this structurally, and so
 * does the synthetic "no brand yet" row built below — one render path for
 * both, which is what keeps the grid identical across states.
 */
interface RenderRow {
  key: BrandComparisonKey;
  label: string;
  yourValue: string;
  marketValue: string | null;
  marketNaReason?: string;
  marketLabel: string;
  verdict: BrandComparisonVerdict;
}

/** Row label -> its own `metric.*` tooltip. One per concept, on the label. */
const ROW_TIP: Record<BrandComparisonKey, string> = {
  "live-ads": "metric.you-vs-market-live-ads",
  "ads-per-week": "metric.you-vs-market-ads-per-week",
  "creative-lifespan": "metric.you-vs-market-lifespan",
};

/**
 * Arrow + mono-caps micro-word, never a colour. Both carry the verdict so it
 * isn't colour-only, but neither is `text-destructive` / `text-primary-text`
 * — "below" is a different reading, not a worse one.
 */
function VerdictMark({ verdict }: { verdict: BrandComparisonVerdict }) {
  const meta = VERDICT_META[verdict];
  const Icon = meta.icon;
  const isUnknown = verdict === "unknown";
  return (
    <span
      className="inline-flex shrink-0 items-center gap-0.5 text-foreground/70"
      role="img"
      aria-label={meta.srLabel}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span
        className={cn(
          isUnknown
            ? // Not a verdict — plain words, so it reads as the sentence it
              // is rather than as a fourth verdict token.
              "whitespace-nowrap text-[10px] font-normal"
            : "font-mono text-[9px] font-medium uppercase tracking-[0.1em]",
        )}
      >
        {meta.word}
      </span>
    </span>
  );
}

/**
 * `showVerdictTip` fires on exactly one row (the first) — "verdict" is one
 * concept repeated three times, and the trigger-discipline rule is one tip
 * per concept, not per instance. Wrapped in a `<span tabIndex={0}>` rather
 * than handed straight to `asChild`: `VerdictMark` doesn't forward a ref,
 * same reason `Badge` gets the same wrapper elsewhere on this page.
 */
function CompareRow({ row, showVerdictTip }: { row: RenderRow; showVerdictTip?: boolean }) {
  return (
    <div className="border-t border-border/60 py-2 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 flex-1 items-center gap-1">
          <span className="truncate text-[11px] font-medium text-foreground/70">{row.label}</span>
          <InfoTip tip={ROW_TIP[row.key]} />
        </span>
        {showVerdictTip ? (
          <InfoTip tip="metric.you-vs-market-verdict" asChild>
            <span
              tabIndex={0}
              className="inline-flex shrink-0 items-center rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <VerdictMark verdict={row.verdict} />
            </span>
          </InfoTip>
        ) : (
          <VerdictMark verdict={row.verdict} />
        )}
      </div>
      <div className="mt-0.5 flex items-baseline justify-between gap-2">
        <span className="text-base font-semibold tabular-nums text-foreground">{row.yourValue}</span>
        {row.marketValue !== null ? (
          <span className="text-xs tabular-nums text-foreground/70">{row.marketValue}</span>
        ) : (
          <span className="max-w-[52%] text-right text-[10px] italic leading-snug text-foreground/70">
            {row.marketNaReason ?? "not indexed yet"}
          </span>
        )}
      </div>
    </div>
  );
}

export function YouVsMarket({ className }: { className?: string }): JSX.Element {
  const { hasBrand, brandName, rows, refreshCadenceLabel, hasMarketBaseline, marketBaselineNote, isLoading } =
    useMyBrandVsMarket();
  // Same hooks the KPI strip and the cadence chart read — reusing them here
  // (rather than re-deriving a market number of our own) is the only way
  // this card and those two can never print two different answers for what
  // is, on the market side, the exact same question.
  const { byKey: kpiByKey } = useKpis();
  const cadence = useLaunchCadence();

  // CHECK isLoading BEFORE `isEmpty` / `!hasBrand`. `myBrand` is null in both
  // `loading` and `empty` — a skeleton keeps first paint from claiming "no
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

  // NO BRAND CONNECTED (`empty` only) — Maalik's own named example. The
  // market side stays real (same KPI tiles + cadence average the rest of the
  // page already shows), the your side renders as words, never `0`/a dash.
  const liveAdsTile = kpiByKey["live-ads"];
  const lifespanTile = kpiByKey["creative-lifespan"];
  const noBrandRows: RenderRow[] = [
    {
      key: "live-ads",
      label: "Live ads",
      yourValue: "Not launched yet",
      marketValue: liveAdsTile?.value ?? null,
      marketNaReason: liveAdsTile?.value == null ? liveAdsTile?.naReason ?? "not indexed yet" : undefined,
      marketLabel: "Live right now, across the industries FabAds tracks",
      verdict: "unknown",
    },
    {
      key: "ads-per-week",
      label: "New ads per week",
      yourValue: "Not launched yet",
      marketValue: cadence.weekCount ? `${Math.round(cadence.average)}` : null,
      marketNaReason: cadence.weekCount ? undefined : "no launches indexed yet",
      marketLabel: "New creative per week, across the market",
      verdict: "unknown",
    },
    {
      key: "creative-lifespan",
      label: "Average creative lifespan",
      yourValue: "Not launched yet",
      marketValue: lifespanTile?.value ?? null,
      marketNaReason: lifespanTile?.value == null ? lifespanTile?.naReason ?? "not indexed yet" : undefined,
      marketLabel: "Median across the industries FabAds tracks",
      verdict: "unknown",
    },
  ];

  const displayRows: RenderRow[] = hasBrand ? rows : noBrandRows;

  return (
    <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <header className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          <h2 className="truncate font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70">
            You vs market
          </h2>
          <InfoTip tip="block.you-vs-market" />
        </div>
        {hasBrand && brandName && (
          <span className="shrink-0 truncate text-[11px] text-foreground/70">{brandName}</span>
        )}
      </header>

      <div>
        {/* Column labels — without these, "224 vs 47" reads left-to-right
            by convention only. Once here, not repeated per row. */}
        <div className="flex items-baseline justify-between gap-2 pb-1">
          {/* `/70` (5.99:1), not `/50` (3.21:1 on `bg-card` — fails AA for
              text). Matches every other micro-label in this file. */}
          <span className="font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-foreground/70">
            You
          </span>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  tabIndex={0}
                  className="inline-flex shrink-0 items-center gap-0.5 rounded-sm font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-foreground/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  Market
                  <Info className="h-2.5 w-2.5" aria-hidden="true" />
                </span>
              </TooltipTrigger>
              {/* Portalled — an unportalled TooltipContent clips inside any
                  ancestor scroller. Same pattern as `InfoTip`/`Provenance`. */}
              <TooltipPrimitive.Portal>
                <TooltipContent side="top" className="max-w-[220px]">
                  <p className="text-xs leading-snug">
                    {Array.from(new Set(displayRows.map((r) => r.marketLabel))).join(" · ")}
                  </p>
                </TooltipContent>
              </TooltipPrimitive.Portal>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div>
          {displayRows.map((row, i) => (
            <CompareRow key={row.key} row={row} showVerdictTip={i === 0} />
          ))}
        </div>

        {hasBrand ? (
          <>
            <div className="mt-1 flex items-center justify-between gap-2 border-t border-border/60 pt-2">
              <div className="flex flex-col gap-0.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-foreground/70">
                  Refresh cadence
                  <InfoTip tip="metric.refresh-cadence" />
                </span>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {refreshCadenceLabel}
                </span>
              </div>
            </div>
            {!hasMarketBaseline && marketBaselineNote && (
              <p className="mt-2 text-[10px] leading-snug text-foreground/70">{marketBaselineNote}</p>
            )}
          </>
        ) : (
          <div className="mt-1 flex items-center justify-between gap-2 border-t border-border/60 pt-2">
            <p className="min-w-0 text-[11px] leading-snug text-foreground/70">
              Launch your first batch of ads to unlock this comparison.
            </p>
            <Button asChild size="sm" variant="outline" className="h-6 shrink-0 px-2 text-[11px]">
              <Link to="/launchv2/new">+ Launch an ad</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
