/**
 * AdTreeVisualization — live preview-first tree for Step 4 Distribution.
 * Top: stats row.
 * Middle: campaign structure tree (1 representative campaign with ad sets and creative chips).
 * Bottom: per-page allocation list with inline cap meter bars.
 */
import { Layers, FolderTree, ImageIcon, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { spreadPreview, perPageDemand } from "../../../deriveV2";
import { SPREAD_LABELS } from "../../../data";
import type { UseFlowV2 } from "../../../state/useFlowV2";

export default function AdTreeVisualization({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  const p = spreadPreview(plan);
  const pages = perPageDemand(plan);

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-mono text-xs tabular-nums text-foreground">
          {plan.structure.campaigns}c · {p.adSets}as · {p.adsPerDest} ads/dest
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
        <StructureTree flow={flow} />
      </div>

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

function StructureTree({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  const adSetsToShow = Math.min(plan.structure.adSetsPerCampaign, 3);
  const adsPerSet = plan.structure.adsPerAdSet;
  const creativesPool = plan.creatives;

  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-1.5">
      <div className="flex items-center gap-2 text-xs">
        <Layers className="h-3 w-3 text-muted-foreground" />
        <span className="font-mono text-foreground">Campaign 1</span>
        <span className="text-[10px] text-muted-foreground/60">
          ({plan.structure.adSetsPerCampaign} ad set{plan.structure.adSetsPerCampaign !== 1 ? "s" : ""})
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
        {plan.structure.adSetsPerCampaign > adSetsToShow && (
          <div className="text-[10px] text-muted-foreground/60 ml-4">
            +{plan.structure.adSetsPerCampaign - adSetsToShow} more ad sets…
          </div>
        )}
      </div>
      {plan.structure.campaigns > 1 && (
        <div className="text-[10px] text-muted-foreground/60 pt-1 border-t border-border/50">
          ×{plan.structure.campaigns} identical campaigns
        </div>
      )}
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
