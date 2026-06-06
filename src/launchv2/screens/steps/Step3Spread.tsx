/**
 * Step 3 — Creative spread (the hero of Launch v2).
 *
 * 2-column layout (§6c): controls left | live preview right.
 *  LEFT  — source picker → selected items summary → ad-content + per-creative
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
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { fieldPolicy } from "../../reducer";
import type { UseFlowV2 } from "../../state/useFlowV2";
import SourcePicker from "./spread/SourcePicker";
import SelectedItemsRow from "./spread/SelectedItemsRow";
import { SourceSheet } from "./spread/SourceSheet";
import AdContent from "./spread/AdContent";
import SpreadPicker from "./spread/SpreadPicker";
import LivePreview from "./spread/LivePreview";
import CombinationChooser, { showCombination } from "./spread/CombinationChooser";
import type { SourceType, CreativeRef, AdCopy } from "../../types";

export default function Step3Spread({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  const policy = fieldPolicy(plan);
  const acPolicy = policy.advantageCreative;
  // DCO toggle already lives on the stacked tile — don't double up the lever.
  const showStandaloneAdvantage = acPolicy.visibility !== "hidden" && plan.spread !== "stacked";

  const [sheetOpen, setSheetOpen] = useState(false);

  const handleSourceSelect = (s: SourceType) => {
    // Clear old selections when switching source, update plan.source, open sheet
    flow.patch({
      source: { type: s, ref: null },
      creatives: [],
    });
    setSheetOpen(true);
  };

  const handleSheetSave = (items: CreativeRef[], suggestedCopy?: Partial<AdCopy>) => {
    const updates: Partial<typeof flow.plan> = { creatives: items };
    // Pre-fill adCopy only if currently empty (don't overwrite user's work)
    if (suggestedCopy && !flow.plan.adCopy.headline && !flow.plan.adCopy.primaryText) {
      updates.adCopy = { ...flow.plan.adCopy, ...suggestedCopy };
    }
    flow.patch(updates);
    setSheetOpen(false);
  };

  const handleRemoveCreative = (id: string) => {
    flow.patch({ creatives: flow.plan.creatives.filter((c) => c.id !== id) });
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT — controls */}
        <div className="space-y-6">
          {/* Source picker */}
          <SourcePicker
            selectedSource={plan.source.type}
            hasSelections={plan.creatives.length > 0}
            onSelect={handleSourceSelect}
          />

          {/* Selected items row — only shown when there are selections */}
          {plan.creatives.length > 0 && (
            <SelectedItemsRow
              creatives={plan.creatives}
              onRemove={handleRemoveCreative}
              onChangeSource={() => setSheetOpen(true)}
            />
          )}

          <div className="h-px bg-border" />

          {/* AdContent — always present (D4=A) */}
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

      <SourceSheet
        open={sheetOpen}
        source={plan.source.type}
        currentSelections={plan.creatives}
        format={plan.format}
        onSave={handleSheetSave}
        onClose={() => setSheetOpen(false)}
      />
    </TooltipProvider>
  );
}
