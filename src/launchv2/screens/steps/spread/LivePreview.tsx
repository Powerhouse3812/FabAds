/**
 * LivePreview — compact stats card. Shows campaign structure summary +
 * cap status in one row. Slot mapper for manual spread is collapsible.
 */
import { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { spreadPreview, capCheck } from "../../../deriveV2";
import { SPREAD_LABELS } from "../../../data";
import type { UseFlowV2 } from "../../../state/useFlowV2";

const MAX_SLOTS = 24;

export default function LivePreview({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  const p = spreadPreview(plan);
  const cap = capCheck(plan);
  const nCreatives = Math.max(plan.creatives.length, 1);
  const slots = Math.min(MAX_SLOTS, Math.max(nCreatives, p.adSets || 1));

  return (
    <div className="space-y-3">
      {/* Compact stats row */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border px-4 py-2.5",
          cap.ok ? "border-border bg-muted/20" : "border-amber-300/60 bg-amber-50/40 dark:border-amber-800/40 dark:bg-amber-950/20",
        )}
      >
        <span className="font-mono text-xs tabular-nums text-foreground">
          {plan.structure.campaigns}c · {p.adSets}as · {p.adsPerDest} ads/dest
        </span>
        <span className="text-muted-foreground/40">·</span>
        <span className="text-xs text-muted-foreground capitalize">{SPREAD_LABELS[plan.spread]}</span>
        {p.total > 0 && (
          <>
            <span className="text-muted-foreground/40">·</span>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">{p.total} total</span>
          </>
        )}
        <span className="ml-auto flex items-center gap-1 text-[11px]">
          {cap.ok ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          )}
          <span className={cap.ok ? "text-muted-foreground" : "text-amber-600 dark:text-amber-400"}>
            {cap.ok ? "Cap OK" : "Cap warning"}
          </span>
        </span>
      </div>

      {/* Manual spread slot mapper — collapsible */}
      {plan.spread === "manual" && (
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
            <ChevronDown className="h-3.5 w-3.5 transition-transform [[data-state=open]_&]:rotate-180" />
            Slot mapping ({Object.keys(plan.creativeSlotMap).length}/{slots} placed)
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <SlotMapper flow={flow} slots={slots} />
          </CollapsibleContent>
        </Collapsible>
      )}
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

  if (plan.creatives.length === 0) {
    return <p className="text-[11px] text-muted-foreground">Select creatives first.</p>;
  }

  return (
    <div className="space-y-1.5 rounded-2xl border border-border bg-card p-3">
      {Array.from({ length: slots }, (_, i) => i).map((slot) => (
        <div key={slot} className="flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-[11px] tabular-nums text-muted-foreground">
            {slot + 1}
          </span>
          <Select
            value={plan.creativeSlotMap[slot] ?? "__none__"}
            onValueChange={(v) => set(slot, v)}
          >
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
  );
}
