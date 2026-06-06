/**
 * Step 3 — Creative. Single-column compact layout.
 * Format (moved from Step 1) + Media + Copy = "Ad creative" card.
 * Spread = compact pill row. Preview = compact stats.
 */
import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { fieldPolicy, allowedFormats, defaultDestination } from "../../reducer";
import { FORMATS } from "../../data";
import type { UseFlowV2 } from "../../state/useFlowV2";
import type { AdFormat, AdCopy, CreativeRef } from "../../types";
import AdContent from "./spread/AdContent";
import SpreadPicker from "./spread/SpreadPicker";
import LivePreview from "./spread/LivePreview";
import SelectedItemsRow from "./spread/SelectedItemsRow";
import { SourceSheet } from "./spread/SourceSheet";
import CombinationChooser, { showCombination } from "./spread/CombinationChooser";
import { FORMAT_ICON } from "./spread/meta";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-4 p-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {children}
      </CardContent>
    </Card>
  );
}

export default function Step3Spread({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  const policy = fieldPolicy(plan);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Format chips (moved from Step 1)
  const allowedFmts: AdFormat[] = plan.objective
    ? allowedFormats(plan.objective, defaultDestination(plan.objective), null)
    : [];
  const formatSet = new Set(allowedFmts);

  const acPolicy = policy.advantageCreative;
  const showStandaloneAdvantage = acPolicy.visibility !== "hidden" && plan.spread !== "stacked";

  const handleSheetSave = (items: CreativeRef[], suggestedCopy?: Partial<AdCopy>) => {
    const updates: Partial<typeof plan> = { creatives: items };
    if (suggestedCopy && !plan.adCopy.headline && !plan.adCopy.primaryText) {
      updates.adCopy = { ...plan.adCopy, ...suggestedCopy };
    }
    flow.patch(updates);
    setSheetOpen(false);
  };

  const handleRemoveCreative = (id: string) => {
    flow.patch({ creatives: plan.creatives.filter((c) => c.id !== id) });
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">

        {/* ── 1. Ad creative ─────────────────── */}
        <SectionCard title="Ad creative">

          {/* Format row */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Format
              {!plan.objective && (
                <span className="ml-1 text-muted-foreground/60">— pick an objective first</span>
              )}
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {FORMATS.map((f) => {
                const enabled = formatSet.has(f.id);
                const selected = plan.format === f.id;
                const Icon = FORMAT_ICON[f.id];
                return (
                  <button
                    key={f.id}
                    type="button"
                    disabled={!enabled}
                    onClick={() => {
                      if (!plan.objective || !enabled) return;
                      flow.chooseObjectiveFormat(plan.objective, f.id);
                    }}
                    aria-pressed={selected}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      selected
                        ? "border-primary bg-primary/5 text-foreground"
                        : enabled
                          ? "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                          : "cursor-not-allowed border-border/50 text-muted-foreground/40",
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Media row */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Media</Label>
              {plan.creatives.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSheetOpen(true)}
                  className="text-xs text-primary hover:underline"
                >
                  + Add more
                </button>
              )}
            </div>
            {plan.creatives.length === 0 ? (
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
                Add from Genie, Library or upload
              </button>
            ) : (
              <SelectedItemsRow
                creatives={plan.creatives}
                onRemove={handleRemoveCreative}
                onChangeSource={() => setSheetOpen(true)}
              />
            )}
          </div>

          <Separator />

          {/* Copy */}
          <AdContent flow={flow} />

          {/* Advantage+ creative */}
          {showStandaloneAdvantage && (
            <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Sparkles
                  className={cn("h-4 w-4", plan.advantageCreative ? "text-primary" : "text-muted-foreground")}
                />
                <div>
                  <p className="text-sm font-medium text-foreground">Advantage+ creative</p>
                  <p className="text-[11px] text-muted-foreground">
                    Auto-enhance and reformat each creative per placement.
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
        </SectionCard>

        {/* ── 2. Spread ──────────────────────── */}
        <SectionCard title="Creative spread">
          <SpreadPicker flow={flow} />
          {showCombination(flow) && <CombinationChooser flow={flow} />}
        </SectionCard>

        {/* ── 3. Preview ─────────────────────── */}
        <LivePreview flow={flow} />

        {/* Sheet portal */}
        <SourceSheet
          open={sheetOpen}
          source={plan.source.type}
          currentSelections={plan.creatives}
          format={plan.format}
          onSave={handleSheetSave}
          onClose={() => setSheetOpen(false)}
        />
      </div>
    </TooltipProvider>
  );
}
