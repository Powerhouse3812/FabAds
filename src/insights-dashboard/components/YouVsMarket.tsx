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
 * SCOPE RULE — read before touching this file: creative behaviour only. Live
 * ad counts, launch cadence, creative lifespan, format/angle mix. Never
 * spend, never ROAS, never performance — Insights does not see the user's
 * results and must not imply it does. `scopeNote` is rendered as a standing
 * banner, not a tooltip, because it's the sentence that keeps this whole
 * block honest.
 *
 * VERDICT RENDERING — the other rule that matters here: `verdict` ships as a
 * LABEL, never a colour. Being below the market on creative lifespan is not
 * "bad" — fatigue and saturation cut both ways — so there is no red/green
 * scorecard anywhere in this file. `VerdictPill` uses one neutral tone for
 * all four verdicts; only the icon shape and the words change, exactly like
 * the direction-only delta chip in KpiRow.
 *
 * THIN STATE — `myBrand` is present in thin (unlike most other blocks, whose
 * collections go empty). Your own creative behaviour comes from your own
 * account and doesn't depend on how much of the market we've scanned, so the
 * asymmetry — your side full, the market side honestly absent — IS the
 * state's story. `hasMarketBaseline`/`marketBaselineNote` render that
 * explicitly instead of quietly blanking the market column; the per-row
 * `MetricStat` naReason handles the rest without a special-cased render path.
 */
import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp, CircleHelp, Equal, GitCompareArrows, Info, ShieldAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricStat } from "@/creative-report-v2/components/MetricStat";
import { InsightsV2EmptyState } from "@/components/insights-v2/InsightsV2EmptyState";
import { Provenance } from "@/insights-dashboard/components/Provenance";
import {
  useMyBrandVsMarket,
  type BrandComparisonRow,
  type BrandComparisonVerdict,
  type FormatMixEntry,
} from "@/insights-dashboard/lib/selectors";

const VERDICT_META: Record<BrandComparisonVerdict, { label: string; icon: LucideIcon }> = {
  above: { label: "Above the market", icon: ArrowUp },
  below: { label: "Below the market", icon: ArrowDown },
  similar: { label: "Similar to the market", icon: Equal },
  unknown: { label: "No comparison yet", icon: CircleHelp },
};

/**
 * Direction-only, exactly like `KpiRow`'s delta chip: one neutral tone for
 * every verdict. "Below" is not a worse icon than "above" — it is a
 * different one. No `text-destructive`, no `text-primary-text`, anywhere.
 */
function VerdictPill({ verdict }: { verdict: BrandComparisonVerdict }) {
  const meta = VERDICT_META[verdict];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2 py-0.5",
        "text-xs font-medium text-muted-foreground",
      )}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

function ComparisonRow({ row }: { row: BrandComparisonRow }) {
  return (
    // TWO COLUMNS, always. The four-column `sm:` variant fired at a 640px
    // VIEWPORT while this card is ~347px wide (2-up inside the 8-of-12
    // column), so label / you / market / verdict each got ~60px: "New ads per
    // week" wrapped over four lines and "Per advertiser, averaged over the
    // 12-week cadence window" over seven. Tailwind breakpoints can't see the
    // container, so the stacked form is the only honest one here.
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border/60 py-3 first:border-t-0">
      <div className="col-span-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{row.label}</p>
        <VerdictPill verdict={row.verdict} />
      </div>

      <div className="flex items-start gap-1.5">
        <MetricStat label="You" value={row.yourValue} size="sm" />
        <Provenance tier="derived" label="Derived · your account" compact className="mt-0.5" />
      </div>

      <div className="flex items-start gap-1.5">
        <div className="flex flex-col gap-0.5">
          <MetricStat
            label="Market"
            value={row.marketValue}
            naReason={row.marketNaReason}
            size="sm"
          />
          <span className="text-[10px] leading-snug text-muted-foreground/80">{row.marketLabel}</span>
        </div>
        {row.marketValue !== null && (
          <Provenance tier="derived" label="Derived · observed ads" compact className="mt-0.5" />
        )}
      </div>
    </div>
  );
}

/**
 * Your format mix only — quiet, single-hue, labelled. Not a comparison (the
 * rows above are the substance); this just makes "creative behaviour" a
 * little more concrete. Segments are told apart by the printed label + pct,
 * never by hue, so opacity steps on one colour are enough.
 */
function FormatMixBar({ entries }: { entries: FormatMixEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div>
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
        {entries.map((entry, i) => (
          <div
            key={entry.format}
            className="h-full bg-primary"
            style={{ width: `${entry.pct}%`, opacity: Math.max(1 - i * 0.28, 0.28) }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
        {entries.map((entry) => (
          <span key={entry.format} className="text-[11px] text-muted-foreground">
            {entry.format} <span className="font-medium tabular-nums text-foreground">{entry.pct}%</span>
          </span>
        ))}
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
    formatMix,
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
          <h2 className="text-sm font-semibold text-foreground">You vs the market</h2>
        </header>
        <Skeleton className="mb-3 h-8 w-full rounded-md" />
        <div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border/60 py-3 first:border-t-0">
              <div className="col-span-2 flex items-center justify-between gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
          <div className="mt-4 border-t border-border/60 pt-3">
            <Skeleton className="mb-1.5 h-3 w-24" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <header className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">You vs the market</h2>
        {hasBrand && brandName && (
          <span className="shrink-0 text-xs text-muted-foreground">{brandName}</span>
        )}
      </header>

      <p className="mb-3 flex items-start gap-1.5 rounded-md bg-muted/40 px-2.5 py-2 text-xs leading-snug text-muted-foreground">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{scopeNote}</span>
      </p>

      {isEmpty || !hasBrand ? (
        <InsightsV2EmptyState
          icon={GitCompareArrows}
          title="No brand connected yet"
          description={marketBaselineNote ?? "Connect your own account to compare your creative behaviour against the market."}
        />
      ) : (
        <div>
          {!hasMarketBaseline && marketBaselineNote && (
            <p className="mb-1 flex items-start gap-1.5 rounded-md border border-dashed border-border px-2.5 py-2 text-xs leading-snug text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{marketBaselineNote}</span>
            </p>
          )}

          <div>
            {rows.map((row) => (
              <ComparisonRow key={row.key} row={row} />
            ))}
          </div>

          <div className="mt-1 flex flex-wrap items-start justify-between gap-3 border-t border-border/60 pt-3">
            <div className="flex items-start gap-1.5">
              <MetricStat label="Refresh cadence" value={refreshCadenceLabel} size="sm" />
              {refreshCadenceLabel !== null && (
                <Provenance tier="derived" label="Derived · your account" compact className="mt-0.5" />
              )}
            </div>
            <p className="max-w-[240px] text-[11px] leading-snug text-muted-foreground">
              Your-side only — there's no honest market baseline for refresh cadence, so it isn't a comparison row.
            </p>
          </div>

          {formatMix.length > 0 && (
            <div className="mt-4 border-t border-border/60 pt-3">
              <p className="mb-1.5 text-xs font-medium text-foreground">Your format mix</p>
              <FormatMixBar entries={formatMix} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
