/**
 * Step 3 — Creative. Single-column compact layout.
 * V1 corrections applied:
 *  1. Creative type toggle moved ABOVE source chips (Format → Mode → Source → Card).
 *  2. Source chips now include Lucide icons.
 *  3. Ad copy (AdCopyCollapsed) now opens by default (defaultOpen).
 *  4. Warning banner uses design-token-aligned amber opacity classes.
 *  5. Format chips hidden when no objective (single locked hint line instead).
 */
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  ChevronDown,
  Copy,
  FolderOpen,
  HardDrive,
  Hash,
  Image,
  Library,
  Link2,
  Plus,
  Sparkles,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { allowedFormats, defaultDestination } from "../../reducer";
import { FORMATS, SOURCES } from "../../data";
import type { UseFlowV2 } from "../../state/useFlowV2";
import type { AdFormat, AdCopy, CreativeRef, SourceType } from "../../types";
import AdContent from "./spread/AdContent";
import SelectedItemsRow from "./spread/SelectedItemsRow";
import { SourceSheet } from "./spread/SourceSheet";
import { FORMAT_ICON } from "./spread/meta";
import { WholeAdGrid } from "./spread/WholeAdCard";
import { SaveBundleRow } from "./spread/SaveBundleRow";

// ── Source → Lucide icon map ──────────────────────────────────────────────────
const SOURCE_ICON: Record<SourceType, React.ElementType> = {
  genie: Sparkles,
  library: Library,
  upload: Upload,
  url: Link2,
  drive: HardDrive,
  reports: BarChart3,
  post_id: Hash,
  folder: FolderOpen,
};

// ── SectionCard ───────────────────────────────────────────────────────────────
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

// ── AdCopyCollapsed — open by default (P1 fix) ────────────────────────────────
function AdCopyCollapsed({ flow, hasAds, wholeAdMode = false }: { flow: UseFlowV2; hasAds: boolean; wholeAdMode?: boolean }) {
  const [open, setOpen] = useState(true); // defaultOpen = true
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
        {wholeAdMode ? "Campaign settings" : `Ad copy ${hasAds ? "(pre-filled from selected ads)" : ""}`}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        <AdContent flow={flow} wholeAdMode={wholeAdMode} />
      </CollapsibleContent>
    </Collapsible>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Step3Spread({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  const [sheetOpen, setSheetOpen] = useState(false);

  const [appliedFolder, setAppliedFolder] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Pre-select Catalogue format when catalogueToggle is on from Step 2
  useEffect(() => {
    if (plan.catalogueToggle && !plan.format && plan.objective) {
      flow.chooseObjectiveFormat(plan.objective, "dpa");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.catalogueToggle]);

  // Format chips — only shown when objective is set
  const allowedFmts: AdFormat[] = plan.objective
    ? allowedFormats(plan.objective, defaultDestination(plan.objective), null)
    : [];
  const formatSet = new Set(allowedFmts);

  // creativeMode: synced with plan.mediaScope
  const [creativeMode, setCreativeMode] = useState<"ads" | "media">(() => {
    if (plan.mediaScope === "whole_ads") return "ads";
    if (plan.creatives.some(c => c.itemType === "ad" || c.savedAd)) return "ads";
    return "media";
  });
  const [pendingMode, setPendingMode] = useState<"ads" | "media" | null>(null);

  const activeSourceId = plan.source.type;

  const handleSheetSave = (items: CreativeRef[], suggestedCopy?: Partial<AdCopy>) => {
    const updates: Partial<typeof plan> = { creatives: items };
    if (suggestedCopy) {
      const isExplicitBundle =
        typeof suggestedCopy.primaryText === "string" &&
        suggestedCopy.primaryText.trim().length > 0;
      const copyBlockEmpty = !plan.adCopy.headline && !plan.adCopy.primaryText;
      if (isExplicitBundle || copyBlockEmpty) {
        updates.adCopy = { ...plan.adCopy, ...suggestedCopy };
      }
    }
    flow.patch(updates);
    setSheetOpen(false);
  };

  const handleRemoveCreative = (id: string) => {
    flow.patch({ creatives: plan.creatives.filter((c) => c.id !== id) });
  };

  const handleApplyFolder = (result: {
    creatives: CreativeRef[];
    suggestedCopy?: Partial<AdCopy>;
    folderId: string;
    folderName: string;
  }) => {
    handleSheetSave(result.creatives, result.suggestedCopy);
    setAppliedFolder({ id: result.folderId, name: result.folderName });
  };

  return (
    <div className="space-y-4">

      {/* ── 1. Format — standalone section ───────────────────────── */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          Ad type
          {plan.catalogueToggle && (
            <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              pre-selected from Setup
            </span>
          )}
        </Label>

        {/* V1 fix: hide all chips when no objective, show a single hint */}
        {!plan.objective ? (
          <p className="text-[10px] italic text-muted-foreground/60">
            Select an objective in Step 1 to unlock formats.
          </p>
        ) : (
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
        )}
      </div>

      {/* ── 2. Creative type toggle (moved ABOVE source) ─────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          {(["ads", "media"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                if (mode === creativeMode) return;
                if (plan.creatives.length > 0) {
                  setPendingMode(mode);
                } else {
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

        {/* V1 fix: design-token-aligned warning banner */}
        {pendingMode && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="flex-1 text-amber-600 dark:text-amber-400">
              Switching modes will clear your {plan.creatives.length} selected{" "}
              {pendingMode === "ads" ? "media item" : "whole ad"}
              {plan.creatives.length !== 1 ? "s" : ""}.
            </span>
            <button
              onClick={() => {
                flow.patch({ creatives: [] });
                setCreativeMode(pendingMode);
                setPendingMode(null);
              }}
              className="rounded-full border border-amber-500/40 bg-card px-2.5 py-1 font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 transition-colors"
            >
              Clear and switch
            </button>
            <button
              onClick={() => setPendingMode(null)}
              className="rounded-full px-2 py-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* ── 3. Source — chips with icons (V1 fix) ────────────────── */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Source</Label>
        <div className="flex flex-wrap gap-1.5">
          {SOURCES.map((s) => {
            const active = activeSourceId === s.id;
            const Icon = SOURCE_ICON[s.id as SourceType] ?? Image;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  flow.patch({ source: { type: s.id as SourceType, ref: null } });
                  setSheetOpen(true);
                }}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                )}
              >
                <Icon className="h-3 w-3" />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. Ad creative card ───────────────────────────────────── */}
      <SectionCard title="Ad creative">

        {creativeMode === "ads" ? (
          <div className="space-y-3">
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

            <SaveBundleRow
              appliedFolder={appliedFolder}
              adCopy={plan.adCopy}
              onSaved={() => setAppliedFolder((f) => (f ? { ...f } : f))}
            />

            {/* Whole ads: only campaign settings (CTA/URL/UTM), no copy fields */}
            <AdCopyCollapsed flow={flow} hasAds={plan.creatives.length > 0} wholeAdMode />
          </div>
        ) : (
          <>
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

            <SaveBundleRow
              appliedFolder={appliedFolder}
              adCopy={plan.adCopy}
              onSaved={() => setAppliedFolder((f) => (f ? { ...f } : f))}
            />

            <AdContent flow={flow} />
          </>
        )}
      </SectionCard>

      {/* Sheet portal */}
      <SourceSheet
        open={sheetOpen}
        source={plan.source.type}
        currentSelections={plan.creatives}
        creativeMode={creativeMode}
        onSave={(items, suggestedCopy) => {
          handleSheetSave(items, suggestedCopy);
          setAppliedFolder(null);
        }}
        onApplyFolder={handleApplyFolder}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}
