/**
 * AllocationSlotMapper — manual allocation only. Renders one row per ad slot
 * (capped at ~24 visible), each a Select over the currently-selected creatives,
 * writing adSlotIndex -> creativeId into plan.creativeSlotMap. Unmapped slots
 * show their round-robin fallback so the result is always explainable.
 *
 * Slot indices are the per-destination ad slots produced by the structure
 * (campaigns × adSetsPerCampaign × adsPerAdSet); the parent passes that count.
 *
 * Owned by the Step-4 agent (Allocation* prefix to avoid clashes).
 */
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { CreativeSpec } from "../../types";

const ROUND_ROBIN = "__rr__";
const MAX_VISIBLE_SLOTS = 24;

export function AllocationSlotMapper({
  totalSlots,
  creatives,
  slotMap,
  onChange,
}: {
  totalSlots: number;
  creatives: CreativeSpec[];
  slotMap: Record<number, string>;
  onChange: (next: Record<number, string>) => void;
}) {
  if (creatives.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
        Select at least one creative above to map it onto slots.
      </p>
    );
  }

  const visible = Math.min(totalSlots, MAX_VISIBLE_SLOTS);
  const hidden = totalSlots - visible;

  function setSlot(slot: number, creativeId: string) {
    const next = { ...slotMap };
    if (creativeId === ROUND_ROBIN) {
      delete next[slot];
    } else {
      next[slot] = creativeId;
    }
    onChange(next);
  }

  // round-robin fallback for an unmapped slot (mirrors the launch-time fill).
  function fallbackName(slot: number): string {
    const c = creatives[slot % creatives.length];
    return c ? c.name : "—";
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        {Array.from({ length: visible }).map((_, slot) => {
          const value = slotMap[slot] ?? ROUND_ROBIN;
          const mapped = value !== ROUND_ROBIN;
          return (
            <div
              key={slot}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-2.5 py-2",
                mapped ? "border-primary/40 bg-primary/[0.04]" : "border-border",
              )}
            >
              <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                #{slot + 1}
              </span>
              <Select value={value} onValueChange={(v) => setSlot(slot, v)}>
                <SelectTrigger className="h-8 min-w-0 flex-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ROUND_ROBIN} className="text-xs">
                    Auto · {fallbackName(slot)}
                  </SelectItem>
                  {creatives.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
      {hidden > 0 && (
        <p className="text-[11px] text-muted-foreground">
          +{hidden} more slot{hidden === 1 ? "" : "s"} fall back to round-robin (
          {creatives.length} creative{creatives.length === 1 ? "" : "s"}).
        </p>
      )}
      <p className="text-[10px] text-muted-foreground">
        Unmapped slots cycle through the selected creatives in order.
      </p>
    </div>
  );
}
