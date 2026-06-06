/**
 * Step 3 — Creative spread (the hero of Launch v2).
 *
 * 2-column layout (§6c): controls left | live preview right.
 *  LEFT  — creative tray (multi-select) · shared ad-content + per-creative
 *          overrides + advanced variations · Advantage+ creative toggle.
 *  RIGHT — spread-mode tiles (DCO on stacked) · the LIVE mini-tree + 250-cap
 *          headroom (re-renders instantly) · combination chooser (loose
 *          multi-media + multi-text only).
 *
 * Reads the frozen contract only: spreadPreview / capCheck (deriveV2),
 * creativesForFormat / SPREAD_LABELS (data), fieldPolicy (reducer). Writes via
 * flow.patch (creatives / spread / combination / adCopy / copyOverrides /
 * creativeSlotMap / advantageCreative).
 */
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { fieldPolicy } from "../../reducer";
import type { UseFlowV2 } from "../../state/useFlowV2";
import CreativeTray from "./spread/CreativeTray";
import AdContent from "./spread/AdContent";
import SpreadPicker from "./spread/SpreadPicker";
import LivePreview from "./spread/LivePreview";
import CombinationChooser, { showCombination } from "./spread/CombinationChooser";

export default function Step3Spread({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  const policy = fieldPolicy(plan);
  const acPolicy = policy.advantageCreative;
  // DCO toggle already lives on the stacked tile — don't double up the lever.
  const showStandaloneAdvantage = acPolicy.visibility !== "hidden" && plan.spread !== "stacked";

  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT — controls */}
        <div className="space-y-6">
          <CreativeTray flow={flow} />

          <div className="h-px bg-border" />

          <AdContent flow={flow} />

          {showStandaloneAdvantage && (
            <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-3">
              <div className="flex items-center gap-2">
                <Sparkles className={cn("h-4 w-4", plan.advantageCreative ? "text-primary" : "text-muted-foreground")} />
                <div>
                  <p className="text-sm font-medium text-foreground">Advantage+ creative</p>
                  <p className="text-[11px] text-muted-foreground">
                    Let Meta auto-enhance and reformat each creative per placement.
                  </p>
                </div>
              </div>
              {acPolicy.locked ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Switch checked={plan.advantageCreative} disabled aria-label="Advantage+ creative (locked)" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{acPolicy.reason ?? "Locked by current settings"}</TooltipContent>
                </Tooltip>
              ) : (
                <Switch
                  checked={plan.advantageCreative}
                  onCheckedChange={(v) => flow.patch({ advantageCreative: v })}
                  aria-label="Advantage+ creative"
                />
              )}
            </div>
          )}
        </div>

        {/* RIGHT — spread + live preview (hero) */}
        <div className="space-y-6 lg:sticky lg:top-0 lg:self-start">
          <SpreadPicker flow={flow} />
          <LivePreview flow={flow} />
          {showCombination(flow) && <CombinationChooser flow={flow} />}
        </div>
      </div>
    </TooltipProvider>
  );
}
