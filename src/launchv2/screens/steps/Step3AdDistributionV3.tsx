/**
 * Step3AdDistributionV3 — Merged creative + distribution split-pane step.
 *
 * Left pane (default 60%): all creative content from Step3Spread verbatim.
 *   Format picker → Creative mode toggle → Source chips + CopyFromRunning →
 *   Ad creative card (WholeAdGrid / SelectedItemsRow) → AdCopyCollapsed / AdContent →
 *   SaveBundleRow → CatalogueAdCopy branch → SourceSheet portal
 *
 * Right pane (default 40%): distribution controls only — NO AdTreeVisualization,
 *   NO live preview, NO DistributionTemplateBar.
 *   1. Page Split (2×2 grid)
 *   2. Campaign Structure (StructureEditor + formula note)
 *   3. Creative spread (2×2 grid)
 *   4. CapMeterWithFixes at the bottom
 *
 * Draggable resize divider between panes — clamp 25–80%.
 * FabFunnel design system v1.2 throughout (lime #8FB821, rounded-2xl, Geist Mono, off-white bgBase).
 */

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Check,
  ChevronDown,
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
import { FORMATS, getTemplate, SOURCES } from "../../data";
import type { UseFlowV2 } from "../../state/useFlowV2";
import type { AdFormat, AdCopy, CreativeRef, SourceType, SpreadMode } from "../../types";
import AdContent from "./spread/AdContent";
import SelectedItemsRow from "./spread/SelectedItemsRow";
import { SourceSheet } from "./spread/SourceSheet";
import { FORMAT_ICON } from "./spread/meta";
import { WholeAdGrid } from "./spread/WholeAdCard";
import { SaveBundleRow } from "./spread/SaveBundleRow";
import CopyFromRunning, { runningAdItems, applyRunningAd } from "./shared/CopyFromRunning";
import CapMeterWithFixes from "./distribution/CapMeterWithFixes";
import StructureEditor from "./distribution/StructureEditor";
import { DistributionSectionChip } from "./distribution/DistributionTemplateBar";
import { adSetCount, adsPerDestination, capCheck } from "../../deriveV2";
import { formatMoney } from "@/launch2/utils/time";

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

// ── Page split options ────────────────────────────────────────────────────────
type PageSplitId = "one_page" | "fill_first" | "equal" | "duplicate";
const PAGE_SPLIT_OPTIONS: { id: PageSplitId; label: string; blurb: string; popular?: boolean }[] = [
  { id: "fill_first", label: "Fill first",  blurb: "Pack one page first — overflow spills to the next", popular: true },
  { id: "equal",      label: "Equal",       blurb: "Same number of ads on each page",                  popular: true },
  { id: "one_page",   label: "One page",    blurb: "All ads go to a single page" },
  { id: "duplicate",  label: "Duplicate",   blurb: "Every page runs the full set — budget multiplies per page" },
];

// ── Creative spread (mapping) options ─────────────────────────────────────────
const MAPPING_OPTIONS: { id: SpreadMode; label: string; blurb: string; example: string; popular?: boolean }[] = [
  { id: "round_robin",   label: "Rotating",       blurb: "Creatives cycle evenly across all ad sets",          example: "e.g. 3 creatives → 5 ad sets, rotates A→B→C→A→B", popular: true },
  { id: "one_per_adset", label: "One per ad set", blurb: "Each ad set gets exactly one unique creative",         example: "e.g. 3 creatives → 3 ad sets, 1 unique each",        popular: true },
  { id: "stacked",       label: "Stacked",        blurb: "Every ad set gets all the creatives",                  example: "e.g. 3 creatives → 2 ad sets, both get all 3" },
  { id: "multiply",      label: "Multiply",       blurb: "Each creative gets its own ad set",                    example: "e.g. 3 creatives → 3 new ad sets, 1 per creative" },
  { id: "custom",        label: "Custom",         blurb: "Define exact campaign structure yourself",             example: "Opens structure editor below ↓" },
];

// ── Live preview helpers ──────────────────────────────────────────────────────

function liveSpreadPreview(mode: SpreadMode, c: number, a: number, adsPerDest: number): string {
  switch (mode) {
    case "one_per_adset": return `${c} creative${c !== 1 ? "s" : ""} → ${c} ad set${c !== 1 ? "s" : ""}, 1 unique each`;
    case "round_robin":   return `${c} creative${c !== 1 ? "s" : ""} → ${a} ad set${a !== 1 ? "s" : ""}, rotates evenly`;
    case "stacked":       return `${c} creative${c !== 1 ? "s" : ""} → ${a} ad set${a !== 1 ? "s" : ""}, all ${c} in each (${adsPerDest} ads)`;
    case "multiply":      return `${c} creative${c !== 1 ? "s" : ""} → ${c * a} ad set${c * a !== 1 ? "s" : ""}, 1 per creative`;
    case "custom":        return "Structure editor below ↑";
    default:              return "";
  }
}

function livePageSplitPreviewV3(id: PageSplitId, totalAds: number, pageCount: number): string {
  const p = Math.max(pageCount, 1);
  const perPage = Math.floor(totalAds / p);
  const rem = totalAds - perPage * p;
  switch (id) {
    case "fill_first": {
      const p1 = Math.min(totalAds, 250);
      const p2 = Math.max(0, totalAds - p1);
      return p2 > 0 ? `Page 1: ${p1}, Page 2: ${p2} ads` : `All ${totalAds} ads on Page 1`;
    }
    case "equal":    return `${perPage}–${perPage + (rem > 0 ? 1 : 0)} ads/page (${totalAds} ÷ ${p})`;
    case "one_page": return `All ${totalAds} ads → 1 page`;
    case "duplicate":return `${totalAds} × ${p} pages = ${totalAds * p} ads total`;
    default:         return "";
  }
}

// ── SectionCard (left pane) ───────────────────────────────────────────────────
function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-5 p-5">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

// ── AdCopyCollapsed — open by default ─────────────────────────────────────────
function AdCopyCollapsed({
  flow,
  hasAds,
  wholeAdMode = false,
}: {
  flow: UseFlowV2;
  hasAds: boolean;
  wholeAdMode?: boolean;
}) {
  const [open, setOpen] = useState(true);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
        {wholeAdMode ? "Ad settings" : `Ad copy ${hasAds ? "(pre-filled from selected ads)" : ""}`}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        <AdContent flow={flow} wholeAdMode={wholeAdMode} />
      </CollapsibleContent>
    </Collapsible>
  );
}

// ── CatalogueAdCopy ───────────────────────────────────────────────────────────
function CatalogueAdCopy({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  return (
    <div className="space-y-3">
      {/* Headline */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Headline</label>
        <input
          value={plan.adCopy.headline}
          onChange={(e) => flow.patch({ adCopy: { ...plan.adCopy, headline: e.target.value } })}
          placeholder="e.g. {{product.name}} — Shop now"
          className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-[13px] outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">
          Description{" "}
          <span className="text-muted-foreground/50">(optional)</span>
        </label>
        <textarea
          value={plan.adCopy.description}
          onChange={(e) =>
            flow.patch({ adCopy: { ...plan.adCopy, description: e.target.value } })
          }
          rows={2}
          placeholder="Short description — supports {{product.*}} tokens"
          className="w-full resize-none rounded-lg border border-border bg-background px-2.5 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Destination URL */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">
          Destination URL{" "}
          <span className="text-[11px] text-muted-foreground/60">(from catalogue — you can override)</span>
        </label>
        <input
          value={plan.adCopy.destinationUrl ?? ""}
          onChange={(e) =>
            flow.patch({ adCopy: { ...plan.adCopy, destinationUrl: e.target.value } })
          }
          placeholder="https://yourstore.com/product"
          className="h-9 w-full rounded-lg border border-border bg-background px-2.5 font-mono text-[12px] outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Step3AdDistributionV3({ flow }: { flow: UseFlowV2 }) {
  const { plan, patch } = flow;

  // ── Left pane: creative state ──────────────────────────────────────────────
  const [sheetOpen, setSheetOpen] = useState(false);
  const [appliedFolder, setAppliedFolder] = useState<{ id: string; name: string } | null>(null);

  // Pre-select Catalogue format when catalogueToggle is on from Step 2
  useEffect(() => {
    if (plan.catalogueToggle && !plan.format && plan.objective) {
      flow.chooseObjectiveFormat(plan.objective, "dpa");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.catalogueToggle]);

  const allowedFmts: AdFormat[] = plan.objective
    ? allowedFormats(plan.objective, defaultDestination(plan.objective), null)
    : [];
  const formatSet = new Set(allowedFmts);

  const [creativeMode, setCreativeMode] = useState<"ads" | "media">(() => {
    if (plan.mediaScope === "whole_ads") return "ads";
    if (plan.creatives.some((c) => c.itemType === "ad" || c.savedAd)) return "ads";
    return "media";
  });
  const [pendingMode, setPendingMode] = useState<"ads" | "media" | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  // ── Cap status — drives chip + auto-expand on transition ─────────────────
  const cap = capCheck(plan);
  const capIssueCount = cap.offenders.length;
  const prevCapOk = useRef<boolean | null>(null);
  useEffect(() => {
    // Open Setup summary when cap status flips to bad, or first-mount-bad.
    if (prevCapOk.current === true && cap.ok === false) {
      setSummaryOpen(true);
    } else if (prevCapOk.current === null && cap.ok === false) {
      setSummaryOpen(true);
    }
    prevCapOk.current = cap.ok;
  }, [cap.ok]);

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

  // ── Right pane: distribution derived values ────────────────────────────────
  const currency = plan.targets[0]?.currency ?? "INR";
  const duplicateMultiplier = Math.max(plan.targets.length, 1);
  const distCreativeCount = Math.max(plan.creatives.length, 1);
  const distAdSets = adSetCount(plan);
  const distAdsPerDest = adsPerDestination(plan);
  const distTotalAds = plan.structure.campaigns * plan.structure.adSetsPerCampaign * plan.structure.adsPerAdSet;
  const distPageCount = Math.max(plan.targets.length, 1);

  // ── Draggable divider ───────────────────────────────────────────────────────
  const [leftWidth, setLeftWidth] = useState(55); // percentage, clamped 25–80 (right pane gets 45% by default for breathing room)
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const raw = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftWidth(Math.min(80, Math.max(25, raw)));
    };
    const onMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const handleDividerMouseDown = () => {
    isDraggingRef.current = true;
    setIsDragging(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      data-screen="lv2-step3-v3"
      ref={containerRef}
      className="flex h-full min-h-0"
    >
      {/* ── Left pane: Ad creative ───────────────────────────────────────── */}
      <div
        style={{ width: `${leftWidth}%` }}
        className="h-full overflow-y-auto px-8 py-6 min-w-0"
      >
        <div className="space-y-6">

          {/* ── Setup summary card ───────────────────────────────────── */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <button
              type="button"
              onClick={() => setSummaryOpen((v) => !v)}
              className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted/20 transition-colors"
            >
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform duration-200",
                  summaryOpen && "rotate-180",
                )}
              />
              <span className="flex-1 text-left text-xs font-semibold text-foreground">Setup summary</span>
              {!summaryOpen && (
                <div className="flex items-center gap-1.5 overflow-hidden">
                  {!cap.ok && (
                    <span className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono whitespace-nowrap flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {capIssueCount} cap issue{capIssueCount !== 1 ? "s" : ""}
                    </span>
                  )}
                  {plan.targets.length > 0 && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                      {new Set(plan.targets.map((t) => t.accountId)).size}A · {plan.targets.length}P
                    </span>
                  )}
                  {plan.budgetAmount > 0 && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                      {currency} {plan.budgetAmount.toLocaleString("en-IN")}/{plan.budgetMode}
                    </span>
                  )}
                  {plan.creatives.length > 0 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-mono text-primary whitespace-nowrap">
                      {plan.creatives.length} cr
                    </span>
                  )}
                </div>
              )}
            </button>

            {summaryOpen && (
              <div className="divide-y divide-border/30 border-t border-border/50">
                {/* Cap status — surfaced first so user can't miss it */}
                {(() => {
                  if (cap.ok) {
                    return (
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-[11px] text-muted-foreground">Cap status</span>
                        <span className="font-mono text-[11px] text-primary flex items-center gap-1">
                          <Check className="h-3 w-3" /> All pages under 250
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div className="px-3 py-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">Cap status</span>
                        <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {capIssueCount} page{capIssueCount !== 1 ? "s" : ""} over cap
                        </span>
                      </div>
                      {cap.offenders.slice(0, 3).map((p) => (
                        <div
                          key={p.fbPageId}
                          className="flex items-center justify-between pl-2 text-[10px] text-muted-foreground"
                        >
                          <span className="truncate">{p.pageName}</span>
                          <span className="font-mono shrink-0 ml-2">
                            {p.current + p.demand}/250
                          </span>
                        </div>
                      ))}
                      {cap.offenders.length > 3 && (
                        <div className="pl-2 text-[10px] text-muted-foreground/70 italic">
                          +{cap.offenders.length - 3} more
                        </div>
                      )}
                    </div>
                  );
                })()}
                {/* Accounts + pages */}
                {plan.targets.length > 0 && (
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-[11px] text-muted-foreground">Accounts & pages</span>
                    <span className="font-mono text-[11px] text-foreground">
                      {new Set(plan.targets.map((t) => t.accountId)).size} acct · {plan.targets.length} page{plan.targets.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                {/* Budget */}
                {plan.budgetAmount > 0 && (
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-[11px] text-muted-foreground">Budget</span>
                    <span className="font-mono text-[11px] text-foreground">
                      {currency} {plan.budgetAmount.toLocaleString("en-IN")}/day · {plan.budgetMode}{plan.advantagePlus ? " · A+" : ""}
                    </span>
                  </div>
                )}
                {/* Optimization goal */}
                {plan.optimizationGoal && (
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-[11px] text-muted-foreground">Optimization</span>
                    <span className="font-mono text-[11px] text-foreground">
                      {plan.optimizationGoal.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                  </div>
                )}
                {/* Targeting template */}
                {plan.targetingTemplateId && (
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-[11px] text-muted-foreground">Audience</span>
                    <span className="text-[11px] text-foreground">
                      {getTemplate(plan.targetingTemplateId)?.name ?? plan.targetingTemplateId}
                    </span>
                  </div>
                )}
                {/* Structure */}
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-[11px] text-muted-foreground">Structure</span>
                  <span className="font-mono text-[11px] text-foreground">
                    {plan.structure.campaigns}C × {plan.structure.adSetsPerCampaign}AS × {plan.structure.adsPerAdSet}Ad
                  </span>
                </div>
                {/* Creatives */}
                {plan.creatives.length > 0 && (
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-[11px] text-muted-foreground">Creatives</span>
                    <span className="font-mono text-[11px] text-foreground">
                      {plan.creatives.length} selected
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── 1+2. Creative type — unified card (format + mode) ──────── */}
          <SectionCard
            title="Creative type"
            subtitle="Choose your ad format and how you want to add creatives"
          >
            {/* Progress pills */}
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium transition-colors",
                  plan.format
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {plan.format ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <span className="font-mono">1</span>
                )}
                Ad format
              </span>
              <span className="text-muted-foreground/40">→</span>
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium transition-colors bg-primary/10 text-primary">
                <Check className="h-3 w-3" />
                Creative mode
              </span>
            </div>

            {/* Ad format chips */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Ad type
                {plan.catalogueToggle && (
                  <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    pre-selected from Setup
                  </span>
                )}
              </Label>

              {!plan.objective ? (
                <p className="text-[10px] italic text-muted-foreground/60">
                  Pick an objective in Step 1 — that unlocks formats.
                </p>
              ) : (
                <div className="flex flex-wrap gap-3">
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
                          "fab-focus inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
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

            {/* Divider */}
            <div className="border-t border-border/40 my-3" />

            {/* Creative mode toggle */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
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
                      "fab-focus flex flex-col items-start gap-0.5 rounded-xl border px-4 py-2.5 text-left transition-colors",
                      creativeMode === mode
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-foreground/30",
                    )}
                  >
                    <span className="text-xs font-semibold text-foreground">
                      {mode === "ads" ? "Whole Ads" : "Individual Media"}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                      {mode === "ads"
                        ? "Use complete saved ads from Genie or Library"
                        : "Mix images and videos with your own ad copy"}
                    </span>
                  </button>
                ))}
              </div>

              {/* Warning banner */}
              {pendingMode && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span className="flex-1 text-amber-600 dark:text-amber-400">
                    Switching clears {plan.creatives.length} selected{" "}
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
          </SectionCard>

          {/* Disabled Next hint */}
          {!plan.format && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              Pick an ad format to continue
            </p>
          )}

          {plan.catalogueToggle ? (
            /* Catalogue mode — copy only */
            <SectionCard
              title="Ad copy"
              subtitle="Meta fills your creative from the product catalogue — provide copy only."
            >
              <CatalogueAdCopy flow={flow} />
            </SectionCard>
          ) : (
            <>
              {/* ── 3. Source chips with icons ──────────────────────────── */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-foreground">Creative source</Label>
                    <p className="text-[11px] text-muted-foreground">Where to pull your creatives from</p>
                  </div>
                  <CopyFromRunning
                    triggerLabel="Copy from running ad"
                    items={runningAdItems()}
                    onPick={(id) => applyRunningAd(flow, id)}
                    pickerType="ad"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
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
                          "fab-focus inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
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

              {/* ── 4. Ad creative card ─────────────────────────────────── */}
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
            </>
          )}

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
      </div>

      {/* ── Drag handle ──────────────────────────────────────────────────────── */}
      <div
        onMouseDown={handleDividerMouseDown}
        className={cn(
          "w-1 cursor-col-resize shrink-0 select-none transition-colors",
          isDragging ? "bg-primary/40" : "bg-border hover:bg-primary/40",
        )}
      />

      {/* ── Right pane: Distribution ─────────────────────────────────────────── */}
      <div
        style={{ width: `${100 - leftWidth}%` }}
        className="h-full overflow-y-auto px-8 py-6 min-w-0 border-l border-border"
      >
        <div className="space-y-8">

          {/* Right pane section eyebrow */}
          <span className="font-mono text-[11px] uppercase tracking-[0.05em] text-muted-foreground block mb-4">
            Distribution
          </span>

          {/* ── 1. Page Split ──────────────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-foreground tracking-[-0.01em]">
                Page Split
              </span>
              <DistributionSectionChip flow={flow} section="pageDistribution" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {PAGE_SPLIT_OPTIONS.map((opt) => {
                const on = plan.pageDistribution === opt.id;
                const isDupe = opt.id === "duplicate";
                const showRecommended = opt.id === "fill_first" && !on;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => patch({ pageDistribution: opt.id })}
                    aria-pressed={on}
                    className={cn(
                      "fab-focus flex flex-col gap-2 rounded-2xl border p-5 text-left transition-colors",
                      on
                        ? isDupe
                          ? "border-amber-400 bg-amber-50/40 dark:bg-amber-950/20"
                          : "border-primary bg-primary/5"
                        : opt.popular
                          ? "border-border bg-card ring-1 ring-border hover:border-foreground/30"
                          : "border-border bg-card hover:border-foreground/30",
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[13px] font-semibold text-foreground">{opt.label}</span>
                      {showRecommended && (
                        <span className="font-mono text-[10px] uppercase tracking-wide text-primary">
                          RECOMMENDED
                        </span>
                      )}
                    </div>
                    {on ? (
                      isDupe ? (
                        <span className="font-mono text-[11px] text-amber-700 dark:text-amber-300">
                          {formatMoney(plan.budgetAmount, currency)} →{" "}
                          {formatMoney(plan.budgetAmount * duplicateMultiplier, currency)} ×
                          {duplicateMultiplier}
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] text-primary/80 font-medium">
                          → {livePageSplitPreviewV3(opt.id, distTotalAds, distPageCount)}
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground">{opt.blurb}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── 2. Creative distribution ──────────────────────────────────── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-foreground tracking-[-0.01em]">
                Creative distribution
              </span>
              <DistributionSectionChip flow={flow} section="spread" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {MAPPING_OPTIONS.map((opt) => {
                const on = plan.spread === opt.id;
                const showCommon = opt.popular && !on;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => patch({ spread: opt.id })}
                    aria-pressed={on}
                    className={cn(
                      "fab-focus flex flex-col gap-2 rounded-2xl border p-5 text-left transition-colors",
                      on
                        ? "border-primary bg-primary/5"
                        : opt.popular
                          ? "border-border bg-card ring-1 ring-border hover:border-foreground/30"
                          : "border-border bg-card hover:border-foreground/30",
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[13px] font-semibold text-foreground">{opt.label}</span>
                      {showCommon && (
                        <span className="font-mono text-[10px] uppercase tracking-wide text-primary">
                          COMMON
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{opt.blurb}</span>
                    {on ? (
                      <span className="font-mono text-[11px] text-primary/80 font-medium">
                        → {liveSpreadPreview(opt.id, distCreativeCount, distAdSets, distAdsPerDest)}
                      </span>
                    ) : (
                      <span className="font-mono text-[11px] text-muted-foreground/70">{opt.example}</span>
                    )}
                  </button>
                );
              })}
            </div>
            {plan.spread === "custom" && (
              <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
                <p className="text-[11px] text-muted-foreground">
                  Define exact structure — campaigns, ad sets per campaign, and ads per ad set.
                </p>
                <StructureEditor flow={flow} />
              </div>
            )}
          </div>

          {/* ── 4. Cap meter ──────────────────────────────────────────────── */}
          <CapMeterWithFixes flow={flow} />
        </div>
      </div>
    </div>
  );
}
