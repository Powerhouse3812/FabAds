/**
 * SpreadPicker — card-grid of creative distribution modes.
 * Selected mode's DCO toggle shows for stacked. Custom opens StructureEditor below.
 */
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { UseFlowV2 } from "../../../state/useFlowV2";
import type { SpreadMode } from "../../../types";
import StructureEditor from "../distribution/StructureEditor";
import { adSetCount, adsPerDestination } from "../../../deriveV2";

const DISTRIBUTION_OPTIONS = [
  {
    id: "one_per_adset" as SpreadMode,
    label: "One per ad set",
    blurb: "Each ad set gets one unique creative, never repeated",
    example: "e.g. 3 creatives → 3 ad sets, 1 unique each",
    popular: true,
  },
  {
    id: "round_robin" as SpreadMode,
    label: "Rotating",
    blurb: "Creatives cycle evenly across all ad sets",
    example: "e.g. 3 creatives → 5 ad sets, rotates A→B→C→A→B",
    popular: true,
  },
  {
    id: "stacked" as SpreadMode,
    label: "Stacked",
    blurb: "Every ad set runs all creatives — Meta picks the winner",
    example: "e.g. 3 creatives → 2 ad sets, both get all 3",
  },
  {
    id: "multiply" as SpreadMode,
    label: "Multiply",
    blurb: "Each creative gets its own dedicated ad set",
    example: "e.g. 3 creatives → 3 new ad sets, 1 per creative",
  },
  {
    id: "custom" as SpreadMode,
    label: "Custom",
    blurb: "Define exact campaign structure yourself",
    example: "Opens structure editor below ↓",
  },
];

function livePreviewText(mode: SpreadMode, creatives: number, adSets: number, adsPerDest: number): string {
  const c = creatives;
  const a = adSets;
  switch (mode) {
    case "one_per_adset": return `${c} creative${c !== 1 ? "s" : ""} → ${c} ad set${c !== 1 ? "s" : ""}, 1 unique each`;
    case "round_robin": return `${c} creative${c !== 1 ? "s" : ""} → ${a} ad set${a !== 1 ? "s" : ""}, rotates evenly`;
    case "stacked": return `${c} creative${c !== 1 ? "s" : ""} → ${a} ad set${a !== 1 ? "s" : ""}, all ${c} in each (${adsPerDest} ads total)`;
    case "multiply": return `${c} creative${c !== 1 ? "s" : ""} → ${c * a} ad set${c * a !== 1 ? "s" : ""}, 1 per creative`;
    case "custom": return "Structure editor below ↑";
    default: return "";
  }
}

export default function SpreadPicker({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;

  const [showExamples, setShowExamples] = useState<boolean>(() => {
    try { return localStorage.getItem("fabads:dist:hideExamples") !== "1"; }
    catch { return true; }
  });
  const dismissExamples = () => {
    try { localStorage.setItem("fabads:dist:hideExamples", "1"); } catch {}
    setShowExamples(false);
  };

  const creativeCount = Math.max(plan.creatives.length, 1);
  const adSets = adSetCount(plan);
  const adsPerDest = adsPerDestination(plan);

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Creative distribution</Label>

      {/* Card grid */}
      <div className="grid grid-cols-2 gap-3">
        {DISTRIBUTION_OPTIONS.map((card) => {
          const mode = card.id;
          const isSelected = plan.spread === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => flow.patch({ spread: mode })}
              aria-pressed={isSelected}
              className={cn(
                "flex flex-col gap-2 rounded-2xl border p-5 text-left transition-colors",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-foreground/30",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-foreground">{card.label}</span>
                {card.popular && !isSelected && (
                  <span className="font-mono text-[10px] uppercase tracking-wide text-primary">POPULAR</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{card.blurb}</span>
              {isSelected && (
                <span className="font-mono text-[11px] text-primary/80 font-medium">
                  {"→"} {livePreviewText(card.id, creativeCount, adSets, adsPerDest)}
                </span>
              )}
              {!isSelected && showExamples && (
                <span className="font-mono text-[11px] text-muted-foreground/70">{card.example}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Dismiss examples — shown only when examples visible and nothing selected yet */}
      {showExamples && !plan.spread && (
        <button
          type="button"
          onClick={dismissExamples}
          className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          Don&apos;t show examples next time
        </button>
      )}

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

      {/* Structure editor — only for Custom spread */}
      {plan.spread === "custom" && (
        <div className="rounded-2xl border border-border bg-muted/20 p-3">
          <p className="mb-3 text-[11px] text-muted-foreground">
            Define exact structure — how many campaigns, ad sets per campaign, and ads per ad set.
          </p>
          <StructureEditor flow={flow} />
        </div>
      )}
    </div>
  );
}
