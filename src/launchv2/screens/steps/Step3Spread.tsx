/**
 * Step 3 — Creative. Single-column compact layout.
 * Format = standalone section (no card). Media + Copy = "Ad creative" card.
 * When all creatives are whole ads, show WholeAdGrid instead of media row + AdContent.
 * Spread = compact pill row. Preview = compact stats.
 */
import { useState } from "react";
import { ChevronDown, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { WholeAdGrid } from "./spread/WholeAdCard";

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

function AdCopyCollapsed({ flow, hasAds }: { flow: UseFlowV2; hasAds: boolean }) {
  return (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ChevronDown className="h-3.5 w-3.5 transition-transform [[data-state=open]_&]:rotate-180" />
        Ad copy {hasAds ? "(pre-filled from selected ads)" : ""}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        <AdContent flow={flow} />
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function Step3Spread({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  const policy = fieldPolicy(plan);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Format chips (standalone section above Ad creative card)
  const allowedFmts: AdFormat[] = plan.objective
    ? allowedFormats(plan.objective, defaultDestination(plan.objective), null)
    : [];
  const formatSet = new Set(allowedFmts);

  const acPolicy = policy.advantageCreative;
  const showStandaloneAdvantage = acPolicy.visibility !== "hidden" && plan.spread !== "stacked";

  // creativeMode: "ads" = whole saved ads (via Genie), "media" = individual media assets
  const [creativeMode, setCreativeMode] = useState<"ads" | "media">(() => {
    if (plan.creatives.some(c => c.itemType === "ad" || c.savedAd)) return "ads";
    if (plan.creatives.some(c => c.itemType === "media")) return "media";
    return "ads"; // default: whole ads
  });

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

        {/* ── Format — standalone section, no card wrapper ─── */}
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

          {/* Creative type toggle */}
          <div className="flex items-center gap-1.5">
            {(["ads", "media"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  if (mode !== creativeMode) {
                    // Clear creatives when switching mode
                    if (plan.creatives.length > 0) flow.patch({ creatives: [] });
                    setCreativeMode(mode);
                  }
                }}
                aria-pressed={creativeMode === mode}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  creativeMode === mode
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                )}
              >
                {mode === "ads" ? "Whole Ads" : "Individual Media"}
              </button>
            ))}
          </div>
        </div>

        {/* ── 1. Ad creative ─────────────────── */}
        <SectionCard title="Ad creative">

          {creativeMode === "ads" ? (
            <div className="space-y-3">
              {/* Whole ads display */}
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
                <WholeAdGrid
                  creatives={plan.creatives}
                  onRemove={handleRemoveCreative}
                  onAdd={() => setSheetOpen(true)}
                />
              )}

              {/* Ad copy — collapsed by default, pre-filled from selected ads */}
              <AdCopyCollapsed flow={flow} hasAds={plan.creatives.length > 0} />
            </div>
          ) : (
            <>
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
            </>
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
          creativeMode={creativeMode}
          onSave={handleSheetSave}
          onClose={() => setSheetOpen(false)}
        />
      </div>
    </TooltipProvider>
  );
}
