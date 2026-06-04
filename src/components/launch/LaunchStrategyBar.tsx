/**
 * Sticky Bulk Launch Distribution bar for Step 3.
 *
 * Rendered ABOVE the existing per-level toolbars (it composes with them — it does
 * NOT replace AdBulkEditToolbar / AdGroupBulkToolbar). Shows the deduped affected
 * rollup, the chosen strategy, the OUTPUT count, capacity state, per-currency
 * budget, and an excluded-unknown warning. CTAs differ per strategy; Duplicate is
 * never framed as "Launch". When capacity is invalid it shows an inline warning
 * row with fix actions and disables the primary (Preview stays enabled). When an
 * account-level selection was made it shows a constrained notice instead.
 *
 * Pure presentational + computed: all distribution math comes from the frozen
 * core in launch-distribution.ts. Open-state for Preview/Confirm lives in the parent.
 */
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertTriangle, MoreHorizontal, ArrowRight, Building2, Info } from "lucide-react";
import {
  validateStrategy,
  computeOutputCount,
  budgetByCurrency,
  targetPairsCount,
  uniquePagesCount,
  type LaunchStrategy,
  type TargetPair,
  type PageCapacity,
  type DistAdset,
} from "@/lib/launch-distribution";
import type { SelectionRollup } from "@/lib/launch-selection-rollup";
import { strategyLabel, primaryCtaLabel, budgetDelta } from "./distribution/distribution-view-helpers";

interface LaunchStrategyBarProps {
  rollup: SelectionRollup;
  strategy: LaunchStrategy;
  targetPairs: TargetPair[];
  capacities: PageCapacity[];
  /** Adsets mapped to DistAdset (one resolved currency applied) for budget. */
  distAdsets: DistAdset[];
  configured: boolean;
  onPreview: () => void;
  onLaunch: () => void;
  onChangeStrategy: () => void;
  onChangePages: () => void;
  onReduceSelection: () => void;
}

export function LaunchStrategyBar({
  rollup,
  strategy,
  targetPairs,
  capacities,
  distAdsets,
  configured,
  onPreview,
  onLaunch,
  onChangeStrategy,
  onChangePages,
  onReduceSelection,
}: LaunchStrategyBarProps) {
  const selectedAdCount = rollup.adIds.length;
  const pairCount = targetPairsCount(targetPairs);
  const pageCount = uniquePagesCount(targetPairs);

  const validation = validateStrategy(strategy, rollup.statusSplit, targetPairs, capacities);
  const outputCount = computeOutputCount(strategy, selectedAdCount, pairCount);
  const budgets = budgetByCurrency(
    rollup.statusSplit.active
      .concat(rollup.statusSplit.scheduled)
      .concat(rollup.statusSplit.paused),
    distAdsets,
    strategy,
    pairCount
  );

  const activeCount = rollup.statusSplit.active.length;
  const scheduledCount = rollup.statusSplit.scheduled.length;
  const pausedCount = rollup.statusSplit.paused.length;
  const ctaLabel = primaryCtaLabel(strategy);

  // ─── Account-constrained takes precedence over everything else ──────────────
  if (rollup.accountConstrained && selectedAdCount === 0) {
    return (
      <div className="sticky top-0 z-20 flex items-start gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
        <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">
            Account-level selection isn't supported for distribution
          </p>
          <p className="text-xs text-muted-foreground">
            Ads aren't linked to a single ad account, so an account selection can't be distributed.
            Select at the <span className="font-medium">Campaign</span>,{" "}
            <span className="font-medium">Ad Set</span>, or <span className="font-medium">Ad</span> level instead.
          </p>
        </div>
      </div>
    );
  }

  const headline = (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
      <span className="font-medium text-foreground">{rollup.counts.campaigns}</span>
      <span className="text-muted-foreground">campaigns</span>
      <ArrowRight className="h-3 w-3 text-muted-foreground" />
      <span className="font-medium text-foreground">{rollup.counts.adsets}</span>
      <span className="text-muted-foreground">ad sets</span>
      <ArrowRight className="h-3 w-3 text-muted-foreground" />
      <span className="font-medium text-foreground">{rollup.counts.ads}</span>
      <span className="text-muted-foreground">ads</span>
    </div>
  );

  const isInvalid = !validation.available;

  return (
    <div className="sticky top-0 z-20 space-y-2 rounded-md border border-border bg-muted p-3 shadow-sm">
      {/* Constrained notice shown inline when the user ALSO has ads selected. */}
      {rollup.accountConstrained && (
        <div className="flex items-center gap-2 text-xs text-amber-700">
          <Building2 className="h-3.5 w-3.5 shrink-0" />
          <span>
            Account-level selection is ignored for distribution. Only Campaign / Ad Set / Ad
            selections are distributed.
          </span>
        </div>
      )}

      {/* Row 1: rollup + strategy + output + budget */}
      <div className="flex flex-wrap items-center gap-3">
        {headline}

        <div className="h-4 w-px bg-border" />

        <Badge variant="secondary" className="font-medium">
          {strategyLabel(strategy)}
        </Badge>

        <div className="flex items-center gap-1 text-sm">
          <span className="text-muted-foreground">Output:</span>
          <span className="font-semibold text-foreground">{outputCount.toLocaleString()}</span>
          <span className="text-muted-foreground">
            ad{outputCount === 1 ? "" : "s"}
            {strategy === "duplicate" && pairCount > 0 ? ` (${selectedAdCount} x ${pairCount} pairs)` : ""}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {activeCount} active / {scheduledCount} scheduled / {pausedCount} paused
          </span>
        </div>

        {budgets.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Budget:</span>
            {budgets.map((b) => (
              <span key={b.currency} className="font-medium text-foreground">
                {budgetDelta(b)}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            onClick={onLaunch}
            disabled={isInvalid || selectedAdCount === 0 || !configured}
            title={!configured ? "Set a distribution strategy in Step 1 first" : undefined}
          >
            {ctaLabel}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onChangeStrategy}>Change Launch Strategy</DropdownMenuItem>
              <DropdownMenuItem onClick={onPreview}>Preview Launch</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Excluded-unknown warning (non-blocking). */}
      {validation.excludedUnknown > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span>
            {validation.excludedUnknown} ad{validation.excludedUnknown === 1 ? "" : "s"} with an
            unrecognized status will be excluded from launch (never treated as paused).
          </span>
        </div>
      )}

      {/* Invalid capacity: inline warning row + fix actions. Primary disabled, Preview enabled. */}
      {isInvalid && selectedAdCount > 0 && (
        <div className="flex flex-col gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-xs text-destructive">{validation.reason ?? "This distribution can't fit."}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onChangeStrategy}>
              Change Strategy
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onChangePages}>
              Change Pages
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onReduceSelection}>
              Reduce Selection
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onPreview}>
              Preview
            </Button>
          </div>
        </div>
      )}

      {/* Page-count context line: pairs vs unique pages are different things. */}
      {pairCount > 0 && (
        <p className="text-[11px] text-muted-foreground">
          Targeting {pairCount} account-page pair{pairCount === 1 ? "" : "s"} across {pageCount} unique
          Facebook Page{pageCount === 1 ? "" : "s"}.
        </p>
      )}
    </div>
  );
}
