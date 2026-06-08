/**
 * SpreadPicker — compact pill row of spread modes.
 * Selected mode's description shows below. DCO toggle inline for stacked.
 */
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { SPREAD_LABELS } from "../../../data";
import type { UseFlowV2 } from "../../../state/useFlowV2";
import { SPREAD_META, SPREAD_ORDER } from "./meta";

export default function SpreadPicker({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  const selected = SPREAD_META[plan.spread];

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Creative spread (how creatives map to ad sets)</Label>

      {/* Pill row */}
      <div className="flex flex-wrap gap-1.5">
        {SPREAD_ORDER.map((mode) => {
          const on = plan.spread === mode;
          const Icon = SPREAD_META[mode].icon;
          // Short label: just first word ("One", "Round-robin", "Stacked", "Multiply")
          const shortLabel = SPREAD_LABELS[mode].split(" ")[0];
          return (
            <button
              key={mode}
              type="button"
              onClick={() => flow.patch({ spread: mode })}
              aria-pressed={on}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                on
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
              )}
            >
              <Icon className="h-3 w-3" />
              {shortLabel}
              <span className="font-mono text-[10px] tabular-nums opacity-60">{SPREAD_META[mode].ratio}</span>
            </button>
          );
        })}
      </div>

      {/* Description of selected mode */}
      <p className="text-[11px] text-muted-foreground">{selected.blurb}</p>

      {/* DCO toggle — only for stacked */}
      {plan.spread === "stacked" && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2">
          <div>
            <p className="text-xs font-medium text-foreground">Dynamic creative (DCO)</p>
            <p className="text-[11px] text-muted-foreground">Auto-mix assets per impression.</p>
          </div>
          <Switch
            checked={plan.advantageCreative}
            onCheckedChange={(v) => flow.patch({ advantageCreative: v })}
            aria-label="Dynamic creative optimization"
          />
        </div>
      )}
    </div>
  );
}
