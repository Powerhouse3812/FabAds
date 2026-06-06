/**
 * SpreadPicker — tiles for the 5 spread modes (labels from SPREAD_LABELS).
 * DCO (dynamic creative optimization) is a toggle that surfaces ON the stacked
 * tile when stacked is selected — it's not its own mode.
 */
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { SPREAD_LABELS } from "../../../data";
import type { SpreadMode } from "../../../types";
import type { UseFlowV2 } from "../../../state/useFlowV2";
import { SPREAD_META, SPREAD_ORDER } from "./meta";

export default function SpreadPicker({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Spread mode</h3>
      <div className="grid grid-cols-2 gap-2">
        {SPREAD_ORDER.map((mode) => {
          const on = plan.spread === mode;
          const meta = SPREAD_META[mode];
          const Icon = meta.icon;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => flow.patch({ spread: mode })}
              aria-pressed={on}
              className={cn(
                "flex flex-col gap-1.5 rounded-2xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                on ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/50",
                mode === "manual" && "col-span-2",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Icon className={cn("h-4 w-4", on ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-xs font-medium text-foreground">{SPREAD_LABELS[mode]}</span>
                </span>
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{meta.ratio}</span>
              </div>
              <p className="text-[11px] leading-snug text-muted-foreground">{meta.blurb}</p>

              {/* DCO lives on the stacked tile */}
              {mode === "stacked" && on && (
                <div
                  className="mt-1 flex items-center justify-between rounded-xl border border-border bg-background px-2 py-1.5"
                  onClick={(e) => e.stopPropagation()}
                  role="presentation"
                >
                  <span className="text-[11px] font-medium text-foreground">
                    Dynamic creative (DCO)
                    <span className="block text-[10px] font-normal text-muted-foreground">Auto-mix assets per impression.</span>
                  </span>
                  <Switch
                    checked={plan.advantageCreative}
                    onCheckedChange={(v) => flow.patch({ advantageCreative: v })}
                    aria-label="Dynamic creative optimization"
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
