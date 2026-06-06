/**
 * LivePreview — the hero. A live mini-tree built from spreadPreview(plan) that
 * re-renders the moment creatives / spread / structure change, plus a 250-cap
 * headroom meter from capCheck(plan). For manual spread it also hosts the
 * slot→creative mapper (≤24 slots) writing plan.creativeSlotMap.
 */
import { AlertTriangle, CheckCircle2, FolderTree, Image, Layers, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { spreadPreview, capCheck, perPageDemand } from "../../../deriveV2";
import { SPREAD_LABELS } from "../../../data";
import { MAX_ADS_PER_PAGE } from "../../../types";
import type { UseFlowV2 } from "../../../state/useFlowV2";

const MAX_SLOTS = 24;

export default function LivePreview({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  const p = spreadPreview(plan);
  const cap = capCheck(plan);
  const pages = perPageDemand(plan);
  const nCreatives = Math.max(plan.creatives.length, 1);

  return (
    <div className="space-y-3">
      {/* Headline structure sentence — updates real-time */}
      <div className="rounded-2xl border border-border bg-card p-3">
        <div className="flex items-center gap-1.5 text-sm">
          <FolderTree className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-foreground">
            <span className="font-mono font-semibold tabular-nums">{p.creatives || 0}</span> creatives
            {" × "}
            <span className="font-medium">{SPREAD_LABELS[plan.spread]}</span>
            {" → "}
            <span className="font-mono font-semibold tabular-nums">{p.adSets}</span> ad-sets ·{" "}
            <span className="font-mono font-semibold tabular-nums">{p.adsPerDest}</span> ads / destination
          </span>
        </div>

        {/* Mini-tree */}
        <div className="mt-3 space-y-1">
          <TreeRow depth={0} icon={<Layers className="h-3.5 w-3.5" />} label="Campaign" count={plan.structure.campaigns} />
          <TreeRow depth={1} icon={<FolderTree className="h-3.5 w-3.5" />} label="Ad sets" count={p.adSets} />
          <TreeRow depth={2} icon={<Image className="h-3.5 w-3.5" />} label="Ads / destination" count={p.adsPerDest} highlight />
          <div className="pl-6 pt-0.5">
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {p.total} ads total{plan.pageDistribution === "duplicate" && plan.targets.length > 1 ? ` (× ${plan.targets.length} destinations)` : ""}
            </span>
          </div>
        </div>
      </div>

      {/* 250-cap headroom */}
      <div className={cn("rounded-2xl border p-3", cap.ok ? "border-border bg-card" : "border-destructive/40 bg-destructive/5")}>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            {cap.ok ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <AlertTriangle className="h-4 w-4 text-destructive" />}
            Page cap headroom
          </span>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">/ {MAX_ADS_PER_PAGE} per page</span>
        </div>
        {pages.length === 0 ? (
          <p className="mt-2 text-[11px] text-muted-foreground">Pick destinations in Setup to see cap headroom.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {pages.map((pg) => {
              const total = pg.current + pg.demand;
              const pct = Math.min(100, (total / MAX_ADS_PER_PAGE) * 100);
              return (
                <div key={pg.fbPageId} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="min-w-0 truncate text-muted-foreground">{pg.pageName}</span>
                    <span className={cn("font-mono tabular-nums", pg.over ? "text-destructive" : "text-muted-foreground")}>
                      {total}/{MAX_ADS_PER_PAGE}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full", pg.over ? "bg-destructive" : "bg-primary")} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {!cap.ok && (
              <p className="text-[11px] text-destructive">
                Over the 250-ad page cap — reduce creatives, switch spread, or change page distribution in Review.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Manual slot mapper */}
      {plan.spread === "manual" && <SlotMapper flow={flow} slots={Math.min(MAX_SLOTS, Math.max(nCreatives, p.adSets || 1))} />}
    </div>
  );
}

function TreeRow({
  depth,
  icon,
  label,
  count,
  highlight,
}: {
  depth: number;
  icon: React.ReactNode;
  label: string;
  count: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5" style={{ paddingLeft: depth * 14 }}>
      {depth > 0 && <span className="text-muted-foreground/40">└</span>}
      <span className={cn("text-muted-foreground", highlight && "text-primary")}>{icon}</span>
      <span className={cn("text-xs", highlight ? "font-medium text-foreground" : "text-muted-foreground")}>{label}</span>
      <span className="ml-auto font-mono text-xs font-semibold tabular-nums text-foreground">{count}</span>
    </div>
  );
}

function SlotMapper({ flow, slots }: { flow: UseFlowV2; slots: number }) {
  const { plan } = flow;
  const set = (slot: number, id: string) => {
    const next = { ...plan.creativeSlotMap };
    if (id === "__none__") delete next[slot];
    else next[slot] = id;
    flow.patch({ creativeSlotMap: next });
  };
  const assigned = Object.keys(plan.creativeSlotMap).length;

  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">Slot mapping</span>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{assigned}/{slots} placed</span>
      </div>
      {plan.creatives.length === 0 ? (
        <p className="mt-2 text-[11px] text-muted-foreground">Select creatives first.</p>
      ) : (
        <div className="mt-2 space-y-1.5">
          {Array.from({ length: slots }, (_, i) => i).map((slot) => (
            <div key={slot} className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-[11px] tabular-nums text-muted-foreground">
                {slot + 1}
              </span>
              <Select value={plan.creativeSlotMap[slot] ?? "__none__"} onValueChange={(v) => set(slot, v)}>
                <SelectTrigger className="h-7 flex-1 text-xs">
                  <SelectValue placeholder="Empty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" className="text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <X className="h-3 w-3" /> Empty
                    </span>
                  </SelectItem>
                  {plan.creatives.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
