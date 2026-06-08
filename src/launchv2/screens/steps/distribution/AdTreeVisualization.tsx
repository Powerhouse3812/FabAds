/**
 * AdTreeVisualization — live preview-first tree for Step 4 Distribution.
 * Top: stats row.
 * Middle: campaign structure tree (1 representative campaign with ad sets and creative chips).
 * Bottom: per-page allocation list with inline cap meter bars.
 *
 * Spread-aware: StructureTree iterates over effective counts derived from spreadPreview /
 * adsPerDestination, not raw plan.structure.* values. ×N identical campaigns is promoted
 * to a header badge. pageDistribution="duplicate" shows an above-the-fold note explaining
 * that the full structure is replicated across every page.
 */
import { Layers, FolderTree, ImageIcon, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { spreadPreview, perPageDemand, adSetCount, adsPerDestination } from "../../../deriveV2";
import { SPREAD_LABELS } from "../../../data";
import type { UseFlowV2 } from "../../../state/useFlowV2";

export default function AdTreeVisualization({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  const p = spreadPreview(plan);
  const pages = perPageDemand(plan);

  // Effective ad sets and ads per ad set, derived from spread mode.
  const campaigns = Math.max(plan.structure.campaigns, 1);
  const effectiveAdSetsPerCampaign = Math.max(1, Math.round(adSetCount(plan) / campaigns));
  const effectiveAdsPerAdSet = Math.max(
    1,
    Math.round(adsPerDestination(plan) / Math.max(adSetCount(plan), 1))
  );

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
      {/* Stats row — readable grammar instead of cryptic abbreviations */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-mono text-xs tabular-nums text-foreground">
          {plan.structure.campaigns} campaign{plan.structure.campaigns !== 1 ? "s" : ""} ×{" "}
          {effectiveAdSetsPerCampaign} ad set{effectiveAdSetsPerCampaign !== 1 ? "s" : ""} ×{" "}
          {effectiveAdsPerAdSet} ad{effectiveAdsPerAdSet !== 1 ? "s" : ""} each
        </span>
        <span className="text-muted-foreground/40">·</span>
        <span className="text-xs text-muted-foreground capitalize">{SPREAD_LABELS[plan.spread]}</span>
        {p.total > 0 && (
          <>
            <span className="text-muted-foreground/40">·</span>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">{p.total} total ads</span>
          </>
        )}
      </div>

      {/* Structure tree */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <FolderTree className="h-3 w-3" /> Campaign structure
        </div>
        <StructureTree
          flow={flow}
          effectiveAdSetsPerCampaign={effectiveAdSetsPerCampaign}
          effectiveAdsPerAdSet={effectiveAdsPerAdSet}
        />
      </div>

      {/* Duplicate-mode banner — explains that the full structure is replicated per page */}
      {plan.pageDistribution === "duplicate" && pages.length > 1 && (
        <div className="rounded-xl border border-amber-300/60 bg-amber-50/30 dark:bg-amber-950/20 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-400">
          <strong>Duplicate mode:</strong> each of the {pages.length} pages gets the full structure above →{" "}
          {(plan.structure.campaigns * adsPerDestination(plan) * pages.length).toLocaleString()} total ads ×{" "}
          {plan.budgetAmount.toLocaleString()} budget ={" "}
          {(plan.budgetAmount * pages.length).toLocaleString()} daily
        </div>
      )}

      {/* Pages with cap meters */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Globe className="h-3 w-3" /> Page destinations ({pages.length})
        </div>
        <PageList pages={pages} />
      </div>
    </div>
  );
}

function StructureTree({
  flow,
  effectiveAdSetsPerCampaign,
  effectiveAdsPerAdSet,
}: {
  flow: UseFlowV2;
  effectiveAdSetsPerCampaign: number;
  effectiveAdsPerAdSet: number;
}) {
  const { plan } = flow;
  const adSetsToShow = Math.min(effectiveAdSetsPerCampaign, 3);
  const adsPerSet = effectiveAdsPerAdSet;
  const creativesPool = plan.creatives;

  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-1.5">
      <div className="flex items-center gap-2 text-xs">
        <Layers className="h-3 w-3 text-muted-foreground" />
        <span className="font-mono text-foreground">Campaign 1</span>
        {plan.structure.campaigns > 1 && (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-medium text-primary">
            × {plan.structure.campaigns} identical
          </span>
        )}
        <span className="text-[10px] text-muted-foreground/60">
          ({effectiveAdSetsPerCampaign} ad set{effectiveAdSetsPerCampaign !== 1 ? "s" : ""})
        </span>
      </div>
      <div className="ml-4 space-y-1.5">
        {Array.from({ length: adSetsToShow }).map((_, i) => (
          <div key={i} className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <FolderTree className="h-3 w-3 text-muted-foreground" />
              <span className="font-mono text-foreground">Ad set {i + 1}</span>
              <span className="text-[10px] text-muted-foreground/60">
                ({adsPerSet} ad{adsPerSet !== 1 ? "s" : ""})
              </span>
            </div>
            <div className="ml-4 flex flex-wrap items-center gap-1">
              {Array.from({ length: Math.min(adsPerSet, 4) }).map((_, j) => {
                const c = creativesPool[j % Math.max(creativesPool.length, 1)];
                return (
                  <span key={j} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px]">
                    <ImageIcon className="h-2.5 w-2.5" />
                    <span className="font-mono truncate max-w-[100px]">
                      {c ? c.name.slice(0, 18) : "creative"}
                    </span>
                  </span>
                );
              })}
              {adsPerSet > 4 && (
                <span className="text-[10px] text-muted-foreground/60">+{adsPerSet - 4} more</span>
              )}
            </div>
          </div>
        ))}
        {effectiveAdSetsPerCampaign > adSetsToShow && (
          <div className="text-[10px] text-muted-foreground/60 ml-4">
            +{effectiveAdSetsPerCampaign - adSetsToShow} more ad sets…
          </div>
        )}
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
    <div className="rounded-xl border border-border bg-card p-3 space-y-1.5">
      {pages.map((p) => (
        <div key={p.fbPageId} className="flex items-center justify-between gap-2 text-xs">
          <div className="min-w-0 flex-1">
            <span className="font-mono text-foreground">{p.pageName}</span>
            <span className="ml-2 text-[10px] text-muted-foreground/60">({p.accountName})</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={cn(
              "font-mono text-[11px] tabular-nums",
              p.over ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
            )}>
              {p.current} + {p.demand} = {p.current + p.demand}/250
            </span>
            <CapMeterBar current={p.current} demand={p.demand} over={p.over} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CapMeterBar({ current, demand, over }: { current: number; demand: number; over: boolean }) {
  const fillPct = Math.min(100, (current / 250) * 100);
  const demandPct = Math.min(100 - fillPct, (demand / 250) * 100);
  return (
    <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
      <div className="flex h-full">
        <div style={{ width: `${fillPct}%`, backgroundColor: "rgba(0,0,0,0.25)" }} />
        <div style={{ width: `${demandPct}%`, backgroundColor: over ? "#f59e0b" : "#8FB821" }} />
      </div>
    </div>
  );
}
