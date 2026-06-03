import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  budgetByCurrency,
  targetPairsCount,
  uniquePagesCount,
  MAX_ADS_PER_PAGE,
} from "@/lib/launch-distribution";
import type {
  StatusSplit,
  TargetPair,
  PageCapacity,
  DistAd,
  DistAdset,
  LaunchStrategy,
} from "@/lib/launch-distribution";

interface DistributionSummaryProps {
  statusSplit: StatusSplit;
  targetPairs: TargetPair[];
  capacities: PageCapacity[];
  /** The ads feeding the budget rollup (estimate in Step 1). */
  selectedAds: DistAd[];
  adsets: DistAdset[];
  strategy: LaunchStrategy;
  /** Final ads that will be created under the current strategy + pages. */
  outputCount: number;
  /** True in Step 1: ad counts are an estimate, not the final selection. */
  pending: boolean;
}

function formatAmount(currency: string, value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const num = rounded.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${currency} ${num}`;
}

function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground truncate">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground truncate">{hint}</p>}
    </div>
  );
}

export function DistributionSummary({
  statusSplit,
  targetPairs,
  capacities,
  selectedAds,
  adsets,
  strategy,
  outputCount,
  pending,
}: DistributionSummaryProps) {
  const pairCount = targetPairsCount(targetPairs);
  const pageCount = uniquePagesCount(targetPairs);

  // Total available active slots across the UNIQUE pages selected (dedupe shared
  // fb_page_id so a page linked under two accounts counts its 250-bucket once).
  const capByPage = new Map<string, number>();
  for (const cap of capacities) {
    if (!capByPage.has(cap.fb_page_id)) capByPage.set(cap.fb_page_id, cap.currentActive);
  }
  let totalAvailable = 0;
  const uniqueFbIds = new Set(targetPairs.map((p) => p.fb_page_id));
  for (const fbId of uniqueFbIds) {
    const current = capByPage.get(fbId) ?? 0;
    totalAvailable += Math.max(0, MAX_ADS_PER_PAGE - current);
  }

  const budgets = budgetByCurrency(selectedAds, adsets, strategy, pairCount);
  const totalAds = statusSplit.active.length + statusSplit.paused.length + statusSplit.unknown.length;

  const pagesValue =
    pairCount === pageCount
      ? `${pairCount}`
      : `${pairCount} pairs · ${pageCount} pages`;

  return (
    <Card className="border border-border bg-card">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Distribution summary</p>
          {pending && (
            <Badge variant="secondary" className="text-[10px]">Estimated</Badge>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Stat
            label="Ads selected"
            value={totalAds}
            hint={`${statusSplit.active.length} active · ${statusSplit.paused.length} paused · ${statusSplit.unknown.length} unknown`}
          />
          <Stat
            label="Ads to create"
            value={outputCount}
            hint={
              strategy === "duplicate" && pairCount > 0
                ? `${totalAds} × ${pairCount} destination${pairCount === 1 ? "" : "s"}`
                : "same as selected"
            }
          />
          <Stat
            label="Pages selected"
            value={pagesValue}
            hint={pairCount === 0 ? "No pages yet" : undefined}
          />
          <Stat
            label="Available slots"
            value={totalAvailable.toLocaleString("en-US")}
            hint={`of ${(uniqueFbIds.size * MAX_ADS_PER_PAGE).toLocaleString("en-US")} across pages`}
          />
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Selected budget</p>
            {budgets.length === 0 ? (
              <p className="mt-0.5 text-sm font-medium text-foreground">—</p>
            ) : (
              <div className="mt-0.5 space-y-0.5">
                {budgets.map((b) => (
                  <p key={b.currency} className="text-sm font-medium text-foreground truncate">
                    {formatAmount(b.currency, b.base)}
                  </p>
                ))}
              </div>
            )}
            {budgets.some((b) => b.unavailableAdsets > 0) && (
              <p className="text-[11px] text-muted-foreground">
                Budget unavailable for{" "}
                {budgets.reduce((sum, b) => sum + b.unavailableAdsets, 0)} ad set
                {budgets.reduce((sum, b) => sum + b.unavailableAdsets, 0) === 1 ? "" : "s"}
              </p>
            )}
          </div>
        </div>

        {statusSplit.unknown.length > 0 && (
          <p className="text-[11px] text-muted-foreground">
            {statusSplit.unknown.length} ad{statusSplit.unknown.length === 1 ? "" : "s"} with unknown status will be
            excluded from launch.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
