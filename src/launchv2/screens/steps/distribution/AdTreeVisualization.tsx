/**
 * AdTreeVisualization — scannable distribution summary for Step 4.
 * 2-second comprehension target: how many ads, where, how much cap left.
 *
 * v2 — removed IDE folder tree (StructureTree) and raw math formula.
 * Replaced with:
 *   1. Summary header — headline count + friendly spread chip
 *   2. Duplicate-mode banner (friendlier copy)
 *   3. Page destination rows — 3-colour capacity bar + human label ("47 free", "At cap", "⚠ 3 over cap")
 */
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { spreadPreview, perPageDemand, adSetCount, adsPerDestination } from "../../../deriveV2";
import type { UseFlowV2 } from "../../../state/useFlowV2";
import { MAX_ADS_PER_PAGE } from "../../../types";

const FRIENDLY_SPREAD: Record<string, string> = {
  round_robin: "Rotating evenly",
  one_per_adset: "1 per ad set",
  stacked: "All creatives in each",
  multiply: "1 ad set per creative",
  manual: "Custom mapping",
};

export default function AdTreeVisualization({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  const p = spreadPreview(plan);
  const pages = perPageDemand(plan);

  const campaigns = Math.max(plan.structure.campaigns, 1);
  const effectiveAdSets = Math.max(1, adSetCount(plan));
  const adsPerAdSet = Math.max(1, Math.round(adsPerDestination(plan) / effectiveAdSets));
  const totalAds = p.total;
  const friendlySpread = FRIENDLY_SPREAD[plan.spread] ?? plan.spread.replace(/_/g, " ");

  const campaignLabel = campaigns === 1 ? "campaign" : "campaigns";
  const adSetLabel = effectiveAdSets === 1 ? "ad set" : "ad sets";

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
      {/* 1. Summary header */}
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-foreground">
          {totalAds.toLocaleString()} ads going out
        </p>
        <p className="text-xs text-muted-foreground">
          {campaigns} {campaignLabel} · {effectiveAdSets} {adSetLabel} · {adsPerAdSet} per set
        </p>
        <span className="inline-block rounded-full bg-muted px-2.5 py-1 font-mono text-[11px] text-foreground capitalize">
          {friendlySpread}
        </span>
      </div>

      {/* 2. Duplicate-mode banner */}
      {plan.pageDistribution === "duplicate" && pages.length > 1 && (
        <div className="rounded-xl border border-amber-300/60 bg-amber-50/30 dark:bg-amber-950/20 px-3 py-2 font-mono text-[11px] text-amber-700 dark:text-amber-400">
          <strong>Duplicate mode:</strong> every page runs the full ad set — budget multiplies to{" "}
          {plan.budgetAmount.toLocaleString()} × {pages.length} pages/day
        </div>
      )}

      {/* 3. Page destinations */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Globe className="h-3 w-3" /> Page destinations ({pages.length})
        </div>
        <PageList pages={pages} />
      </div>
    </div>
  );
}

function PageList({ pages }: { pages: ReturnType<typeof perPageDemand> }) {
  if (pages.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 px-3 py-2.5 text-[11px] text-muted-foreground italic">
        Pick destinations in Setup step to see per-page allocation.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-2">
      {pages.map((page) => {
        const remaining = MAX_ADS_PER_PAGE - page.current - page.demand;
        const existingPct = Math.min(100, (page.current / MAX_ADS_PER_PAGE) * 100);
        const demandPct = Math.min(100 - existingPct, (page.demand / MAX_ADS_PER_PAGE) * 100);

        let capacityLabel: string;
        let labelClass: string;
        if (page.over) {
          const overBy = page.demand - (MAX_ADS_PER_PAGE - page.current);
          capacityLabel = `${overBy} over cap`;
          labelClass = "text-[11px] font-medium text-destructive tabular-nums font-mono";
        } else if (remaining === 0) {
          capacityLabel = "At cap";
          labelClass = "text-[11px] font-medium text-amber-600 dark:text-amber-400 tabular-nums font-mono";
        } else {
          capacityLabel = `${remaining} free`;
          labelClass = "text-[11px] text-muted-foreground tabular-nums font-mono";
        }

        return (
          <div key={page.fbPageId} className="flex items-center justify-between gap-3">
            {/* Left: page name + account chip */}
            <div className="min-w-0 flex-1 flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-medium text-foreground truncate">
                {page.pageName}
              </span>
              <span className="inline-block rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground shrink-0">
                {page.accountName}
              </span>
            </div>

            {/* Right: capacity bar + label */}
            <div className="flex items-center gap-2 shrink-0">
              <span className={cn(labelClass)}>{capacityLabel}</span>
              <CapacityBar existingPct={existingPct} demandPct={demandPct} over={page.over} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CapacityBar({
  existingPct,
  demandPct,
  over,
}: {
  existingPct: number;
  demandPct: number;
  over: boolean;
}) {
  return (
    <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
      <div className="flex h-full">
        {/* Existing ads — grey fill */}
        <div
          style={{ width: `${existingPct}%` }}
          className="bg-muted-foreground/30 shrink-0"
        />
        {/* New demand — lime fill (amber if over cap) */}
        <div
          style={{ width: `${demandPct}%` }}
          className={cn(
            "shrink-0",
            over ? "bg-amber-500/80" : "bg-primary"
          )}
        />
        {/* Remaining — bar background handles this naturally */}
      </div>
    </div>
  );
}
