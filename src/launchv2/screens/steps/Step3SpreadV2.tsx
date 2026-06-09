/**
 * Step 3 — Creative Spread V2.
 *
 * Philosophy: Creative studio, not a form.
 * - Creative mode is EXPLICIT — 2-card picker at top of section (Whole Ads vs Individual Media).
 * - Source selection is navigation (2-col card grid, primary 4 visible, rest collapsed).
 * - Format chips only when objective is set; locked hint otherwise.
 * - Picking a source can silently auto-switch mode if no creatives exist; warns otherwise.
 * - 2-col layout once items are selected: left = creative thumbnails, right = inline copy.
 * - Ad copy is always visible — never collapsed by default.
 * - SaveBundleRow lives as a footer inside the copy column.
 * - Empty state has direct shortcut CTAs.
 */
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  ChevronRight,
  Film,
  FolderOpen,
  HardDrive,
  Hash,
  Image as ImageIcon,
  Image,
  Layers,
  Library,
  Link2,
  Plus,
  Sparkles,
  SwitchCamera,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
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

// ── Creative mode picker ──────────────────────────────────────────────────────

interface CreativeModePicker {
  creativeMode: "ads" | "media";
  onSelect: (mode: "ads" | "media") => void;
}

function CreativeModePicker({ creativeMode, onSelect }: CreativeModePicker) {
  const modes = [
    {
      mode: "ads" as const,
      label: "Whole Ads",
      desc: "Use complete saved ads — copy, format and creative are already set.",
      icon: Layers,
    },
    {
      mode: "media" as const,
      label: "Individual Media",
      desc: "Pick images or videos and write copy separately for this campaign.",
      icon: ImageIcon,
    },
  ];

  return (
    <div className="space-y-2">
      <div>
        <p className="text-[13px] font-semibold text-foreground">Creative mode</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          How do you want to add creatives to this campaign?
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {modes.map(({ mode, label, desc, icon: Icon }) => (
          <button
            key={mode}
            type="button"
            onClick={() => onSelect(mode)}
            aria-pressed={creativeMode === mode}
            className={cn(
              "flex flex-col gap-1.5 rounded-2xl border p-4 text-left transition-colors",
              creativeMode === mode
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-foreground/30",
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                creativeMode === mode ? "text-primary" : "text-muted-foreground",
              )}
            />
            <span className="text-[13px] font-semibold text-foreground">{label}</span>
            <span className="text-[11px] text-muted-foreground leading-snug">{desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Source metadata ───────────────────────────────────────────────────────────

interface SourceMeta {
  id: SourceType;
  label: string;
  desc: string;
  icon: React.ElementType;
  /** Infers creative mode when this source is picked */
  impliedMode: "ads" | "media";
}

const SOURCE_META: SourceMeta[] = [
  { id: "genie",    label: "Genie",          desc: "Use AI-generated ad outputs",           icon: Sparkles,   impliedMode: "ads"   },
  { id: "library",  label: "Library",         desc: "Browse saved media & ad assets",        icon: Library,    impliedMode: "media" },
  { id: "upload",   label: "Upload",          desc: "Drag in images or videos",              icon: Upload,     impliedMode: "media" },
  { id: "reports",  label: "Winning Ads",     desc: "Re-use top performers from Reports",    icon: BarChart3,  impliedMode: "ads"   },
  { id: "folder",   label: "Folder",          desc: "Apply a pre-built creative bundle",     icon: FolderOpen, impliedMode: "media" },
  { id: "url",      label: "URL",             desc: "Import assets from a landing page",     icon: Link2,      impliedMode: "media" },
  { id: "post_id",  label: "Post ID",         desc: "Use an existing Facebook post",         icon: Hash,       impliedMode: "ads"   },
  { id: "drive",    label: "Google Drive",    desc: "Connect and pull from Drive",           icon: HardDrive,  impliedMode: "media" },
];

// Primary sources (visible by default); secondary are under "More"
const PRIMARY_SOURCE_IDS: SourceType[] = ["genie", "library", "upload", "reports"];

function getSourceMeta(id: SourceType): SourceMeta {
  return SOURCE_META.find(s => s.id === id) ?? {
    id, label: id, desc: "", icon: Image, impliedMode: "media",
  };
}

// ── SourceCardGrid ────────────────────────────────────────────────────────────

interface SourceCardGridProps {
  activeSourceId: SourceType | null;
  onSelect: (id: SourceType) => void;
}

function SourceCardGrid({ activeSourceId, onSelect }: SourceCardGridProps) {
  const [showMore, setShowMore] = useState(false);

  const primarySources = SOURCE_META.filter(s => PRIMARY_SOURCE_IDS.includes(s.id));
  const secondarySources = SOURCE_META.filter(s => !PRIMARY_SOURCE_IDS.includes(s.id));

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {primarySources.map(s => {
          const active = activeSourceId === s.id;
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              aria-pressed={active}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all duration-150",
                "hover:border-foreground/20 hover:bg-muted/50",
                active
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card",
              )}
            >
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                active ? "bg-primary/15" : "bg-muted",
              )}>
                <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div className="min-w-0">
                <p className={cn(
                  "text-xs font-semibold leading-tight",
                  active ? "text-foreground" : "text-foreground",
                )}>
                  {s.label}
                </p>
                <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground/70">
                  {s.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Secondary sources — collapsible */}
      {showMore && (
        <div className="grid grid-cols-2 gap-2">
          {secondarySources.map(s => {
            const active = activeSourceId === s.id;
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelect(s.id)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all duration-150",
                  "hover:border-foreground/20 hover:bg-muted/50",
                  active
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card",
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                  active ? "bg-primary/15" : "bg-muted",
                )}>
                  <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold leading-tight text-foreground">{s.label}</p>
                  <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground/70">{s.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowMore(v => !v)}
        className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronRight className={cn("h-3 w-3 transition-transform", showMore && "rotate-90")} />
        {showMore ? "Fewer sources" : "More sources"}
      </button>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

interface EmptyCreativeStateProps {
  onOpenSheet: (preferredSource?: SourceType) => void;
}

function EmptyCreativeState({ onOpenSheet }: EmptyCreativeStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
        <Film className="h-6 w-6 text-muted-foreground/50" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">No creatives yet</p>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
          Choose a source above to add creatives
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onOpenSheet("library")}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <Library className="h-3 w-3" />
          From Library
        </button>
        <button
          type="button"
          onClick={() => onOpenSheet("upload")}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <Upload className="h-3 w-3" />
          Upload
        </button>
      </div>
    </div>
  );
}

// ── Creative + Copy two-column layout ─────────────────────────────────────────

interface CreativePanelProps {
  flow: UseFlowV2;
  creativeMode: "ads" | "media";
  onSwitchMode: () => void;
  appliedFolder: { id: string; name: string } | null;
  onRemoveCreative: (id: string) => void;
  onOpenSheet: (preferredSource?: SourceType) => void;
  wholeAdMode?: boolean;
}

function CreativePanel({
  flow,
  creativeMode,
  onSwitchMode,
  appliedFolder,
  onRemoveCreative,
  onOpenSheet,
  wholeAdMode = false,
}: CreativePanelProps) {
  const { plan } = flow;
  const hasCreatives = plan.creatives.length > 0;

  return (
    <div className="space-y-3">
      {/* Mode indicator — minimal chip, escape hatch scrolls to picker */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
          {creativeMode === "ads" ? "Mode: Whole Ads" : "Mode: Individual Media"}
        </span>
        <button
          type="button"
          onClick={onSwitchMode}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          title="Switch creative mode"
        >
          <SwitchCamera className="h-3 w-3" />
          Change
        </button>
      </div>

      {!hasCreatives ? (
        <EmptyCreativeState onOpenSheet={onOpenSheet} />
      ) : (
        /* 2-column: creative grid (left) + copy (right) */
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">

          {/* Left — creative thumbnails */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/60">
                Creatives
                {" "}
                <span className="tabular-nums">({plan.creatives.length})</span>
              </span>
              <button
                type="button"
                onClick={() => onOpenSheet()}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline underline-offset-2"
              >
                <Plus className="h-3 w-3" />
                Add more
              </button>
            </div>

            {creativeMode === "ads" ? (
              <WholeAdGrid
                creatives={plan.creatives}
                onRemove={onRemoveCreative}
                onAdd={() => onOpenSheet()}
              />
            ) : (
              <SelectedItemsRow
                creatives={plan.creatives}
                onRemove={onRemoveCreative}
                onChangeSource={() => onOpenSheet()}
              />
            )}
          </div>

          {/* Right — copy + bundle graduation */}
          <div className="space-y-3 rounded-2xl border border-border bg-card p-3">
            <AdContent flow={flow} wholeAdMode={wholeAdMode} />
            {appliedFolder && (
              <>
                <Separator />
                <SaveBundleRow
                  appliedFolder={appliedFolder}
                  adCopy={plan.adCopy}
                  onSaved={() => {/* parent state stable */}}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* SaveBundleRow also shown below grid when no 2-col layout (zero-creatives guard above handles this) */}
      {hasCreatives && !appliedFolder && (
        <SaveBundleRow
          appliedFolder={appliedFolder}
          adCopy={plan.adCopy}
          onSaved={() => {/* parent state stable */}}
        />
      )}
    </div>
  );
}

// ── Mode-switch warning overlay ───────────────────────────────────────────────

interface ModeSwitchWarningProps {
  pendingMode: "ads" | "media";
  currentCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

function ModeSwitchWarning({ pendingMode, currentCount, onConfirm, onCancel }: ModeSwitchWarningProps) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
      <span className="flex-1 text-amber-600 dark:text-amber-400">
        Switching to {pendingMode === "ads" ? "Whole Ads" : "Individual Media"} will clear your{" "}
        <span className="font-mono tabular-nums">{currentCount}</span>{" "}
        selected {pendingMode === "ads" ? "media item" : "whole ad"}{currentCount !== 1 ? "s" : ""}.
      </span>
      <button
        onClick={onConfirm}
        className="rounded-full border border-amber-500/40 bg-card px-2.5 py-1 font-medium text-amber-700 transition-colors hover:bg-amber-500/10 dark:text-amber-300"
      >
        Clear and switch
      </button>
      <button
        onClick={onCancel}
        className="rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Cancel"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Step3SpreadV2({ flow }: { flow: UseFlowV2 }) {
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

  // Format chips
  const allowedFmts: AdFormat[] = plan.objective
    ? allowedFormats(plan.objective, defaultDestination(plan.objective), null)
    : [];
  const formatSet = new Set(allowedFmts);

  // Creative mode — inferred from source on pick, but user can override via escape hatch
  const [creativeMode, setCreativeMode] = useState<"ads" | "media">(() => {
    if (plan.mediaScope === "whole_ads") return "ads";
    if (plan.creatives.some(c => c.itemType === "ad" || c.savedAd)) return "ads";
    return "media";
  });
  const [pendingMode, setPendingMode] = useState<"ads" | "media" | null>(null);

  const activeSourceId = plan.source.type;

  // When user picks a source, infer the mode automatically
  const handleSourceSelect = (id: SourceType) => {
    const meta = getSourceMeta(id);
    const newMode = meta.impliedMode;

    if (newMode !== creativeMode && plan.creatives.length > 0) {
      // Would change mode with existing creatives — surface warning
      setPendingMode(newMode);
      // Still open the sheet so the user doesn't feel stuck; mode only applies on confirm
    } else {
      if (newMode !== creativeMode) setCreativeMode(newMode);
    }

    flow.patch({ source: { type: id, ref: null } });
    setSheetOpen(true);
  };

  const handleOpenSheet = (preferredSource?: SourceType) => {
    if (preferredSource) {
      flow.patch({ source: { type: preferredSource, ref: null } });
      const meta = getSourceMeta(preferredSource);
      if (meta.impliedMode !== creativeMode && plan.creatives.length === 0) {
        setCreativeMode(meta.impliedMode);
      }
    }
    setSheetOpen(true);
  };

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

  const handleSwitchMode = () => {
    const next: "ads" | "media" = creativeMode === "ads" ? "media" : "ads";
    if (plan.creatives.length > 0) {
      setPendingMode(next);
    } else {
      setCreativeMode(next);
    }
  };

  const confirmModeSwitch = () => {
    if (!pendingMode) return;
    flow.patch({ creatives: [] });
    setCreativeMode(pendingMode);
    setPendingMode(null);
    setAppliedFolder(null);
  };

  return (
    <div data-screen="lv2-step3-spread-v2" className="space-y-5">

      {/* ── 1. Format selection ───────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/60">
            Ad type
          </span>
          {plan.catalogueToggle && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-primary">
              from setup
            </span>
          )}
        </div>

        {!plan.objective ? (
          <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/30 px-3 py-2">
            <span className="font-mono text-[11px] text-muted-foreground/60">
              Choose an objective in Step 1 to unlock formats
            </span>
            <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
          </div>
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
                        : "cursor-not-allowed opacity-40",
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

      <Separator />

      {/* ── 2. Creative mode — explicit picker ───────────────────── */}
      <CreativeModePicker
        creativeMode={creativeMode}
        onSelect={(mode) => {
          if (mode !== creativeMode) {
            if (plan.creatives.length > 0) {
              setPendingMode(mode);
            } else {
              setCreativeMode(mode);
            }
          }
        }}
      />

      {/* Mode-switch warning (appears when mode picker or source change would flip mode) */}
      {pendingMode && (
        <ModeSwitchWarning
          pendingMode={pendingMode}
          currentCount={plan.creatives.length}
          onConfirm={confirmModeSwitch}
          onCancel={() => setPendingMode(null)}
        />
      )}

      <div className="border-t border-border/50" />

      {/* ── 3. Source card grid ───────────────────────────────────── */}
      <div className="space-y-2">
        <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/60">
          Pick your source
        </span>
        <SourceCardGrid
          activeSourceId={activeSourceId}
          onSelect={handleSourceSelect}
        />
      </div>

      <div className="border-t border-border/50" />

      {/* ── 4. Creative + Copy panel ──────────────────────────────── */}
      <CreativePanel
        flow={flow}
        creativeMode={creativeMode}
        onSwitchMode={handleSwitchMode}
        appliedFolder={appliedFolder}
        onRemoveCreative={handleRemoveCreative}
        onOpenSheet={handleOpenSheet}
        wholeAdMode={creativeMode === "ads"}
      />

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
