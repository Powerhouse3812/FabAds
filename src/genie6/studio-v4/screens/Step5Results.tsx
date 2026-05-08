import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { sampleOutputs } from "../../mocks/sample-outputs";
import { BulkToolbar } from "../../components/BulkToolbar";
import { PreviewPane } from "../../components/PreviewPane";
import type { OutputData, EllipsisAction } from "../../types/output";
import { HeroHeader } from "../components/HeroHeader";
import { OutputCardHybrid } from "../components/OutputCardHybrid";
import { SaveToKbModal } from "../components/SaveToKbModal";
import { addWinnerAd } from "@/genie6/concepts/saved-store";
import type { EntityType, EntityId } from "@/mocks/shared";
import { SectionHeader } from "../components/SectionHeader";
import type { UseWizardReturn } from "../state/useWizard";

interface Step5Props {
  wizard: UseWizardReturn;
  done: boolean;
  regenKey: number;
  onGenerateAgain: () => void;
  onSaveBatch: () => void;
  onStartOver: () => void;
  onBack?: () => void;
}

/** Default concept labels when the user hasn't picked specific concepts. */
const DEFAULT_CONCEPT_LABELS = [
  "Hero Shot",
  "Lifestyle",
  "Social Proof",
  "Urgency",
  "Comparison",
  "Feature Highlight",
  "Before / After",
  "Unboxing",
];

const ANGLE_LABEL: Record<string, string> = {
  hero: "Hero Shot",
  lifestyle: "Lifestyle",
  "social-proof": "Social Proof",
  urgency: "Urgency",
  comparison: "Comparison",
  "ugc-style": "UGC Style",
  unboxing: "Unboxing",
  infographic: "Infographic",
};

/**
 * Step5Results — A-12.18 concept-wise rows redesign.
 *
 * Outputs are grouped by CONCEPT — each concept gets its own horizontal row
 * containing all its variations side-by-side. Multiple concepts stack
 * vertically. Reference: per Maalik's screenshot — Genie 5 ad-card style.
 */
export function Step5Results({ wizard, done, regenKey, onGenerateAgain, onSaveBatch, onStartOver, onBack }: Step5Props) {
  const totalOutputs = wizard.state.credits;
  const variations = wizard.state.count;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [saveKbForOutput, setSaveKbForOutput] = useState<OutputData | null>(null);

  useEffect(() => {
    setSelectedIds(new Set());
    setPreviewId(null);
    setSaveKbForOutput(null);
  }, [regenKey]);

  const outputs = useMemo(() => {
    const all = sampleOutputs.slice();
    all.sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0));
    return all.slice(0, totalOutputs);
  }, [totalOutputs]);

  /** Group outputs into concept rows. Each concept = 1 chunk of `variations` outputs. */
  const conceptRows = useMemo(() => {
    const conceptCount = Math.max(1, Math.round(totalOutputs / Math.max(variations, 1)));
    const angleLabel = wizard.state.angleId ? ANGLE_LABEL[wizard.state.angleId] : null;

    const rows: { id: string; label: string; outputs: typeof outputs }[] = [];
    for (let i = 0; i < conceptCount; i++) {
      const start = i * variations;
      const chunk = outputs.slice(start, start + variations);
      if (chunk.length === 0) break;
      const label =
        i === 0 && angleLabel
          ? angleLabel
          : DEFAULT_CONCEPT_LABELS[i] ?? `Concept ${i + 1}`;
      rows.push({ id: `concept-${i}`, label, outputs: chunk });
    }
    return rows;
  }, [outputs, totalOutputs, variations, wizard.state.angleId]);

  const selectedOutputs = useMemo(
    () => outputs.filter((o) => selectedIds.has(o.id)),
    [outputs, selectedIds],
  );

  const previewOutput = useMemo(
    () => (previewId ? outputs.find((o) => o.id === previewId) ?? null : null),
    [previewId, outputs],
  );

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const clearSelection = () => setSelectedIds(new Set());

  const handleAction = (output: OutputData, action: EllipsisAction) => {
    if (action === "saveToKb") {
      setSaveKbForOutput(output);
      return;
    }
    console.log(`[Step5] ${action}`, output.id);
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 pt-8 pb-10">
      <HeroHeader title={done ? "Done!" : "Generating with Genie…"} onBack={onBack} />

      {/* Loader chip — shown only while !done */}
      {!done && (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            Working… {totalOutputs} variant{totalOutputs === 1 ? "" : "s"}
          </div>
        </div>
      )}

      {/* BulkToolbar — slides in when 2+ selected */}
      {done && selectedOutputs.length >= 2 && (
        <BulkToolbar
          selectedOutputs={selectedOutputs}
          onClear={clearSelection}
          onEditBatch={() => console.log("[Step5] edit batch", selectedIds)}
          onBulkDownload={() => console.log("[Step5] bulk download", selectedIds)}
          onBulkLaunch={() => console.log("[Step5] bulk launch", selectedIds)}
          onAddToFolder={() => console.log("[Step5] add to folder", selectedIds)}
          onBulkRegenerate={() => console.log("[Step5] bulk regenerate", selectedIds)}
        />
      )}

      {/* Concept-wise rows — each concept = 1 horizontal row of variations */}
      <div className="space-y-8">
        {conceptRows.map((row, rowIdx) => (
          <section key={row.id} className="space-y-3">
            {/* Concept row header — shared SectionHeader (lime stripe pattern). */}
            <SectionHeader
              title={row.label}
              count={row.outputs.length}
              hint={`${row.outputs.length === 1 ? "variation" : "variations"}`}
              trailing={
                <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/50">
                  Concept {rowIdx + 1}
                </span>
              }
            />
            {/* Variations strip — Suno-style horizontal scroll. Bleeds to container
                edge so cards scroll under the boundary. Hidden scrollbar; snap-to-card. */}
            <ul className="-mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
              {row.outputs.map((output) => (
                <li key={output.id} className="snap-start shrink-0 w-[200px]">
                  {done ? (
                    <OutputCardHybrid
                      output={output}
                      selected={selectedIds.has(output.id)}
                      onToggleSelect={() => toggleSelect(output.id)}
                      onClick={() => setPreviewId(output.id)}
                      onSave={() => handleAction(output, "saveAsConcept")}
                      onLaunch={() => console.log("[Step5] launch", output.id)}
                      onDownload={() => handleAction(output, "downloadMediaOnly")}
                      onAction={(a) => handleAction(output, a)}
                    />
                  ) : (
                    <SkeletonCard />
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* PreviewPane — overlay (not a flex column) */}
      {previewOutput && (
        <PreviewPane
          output={previewOutput}
          onClose={() => setPreviewId(null)}
          onSave={() => handleAction(previewOutput, "saveAsConcept")}
          onLaunch={() => console.log("[Step5] launch", previewOutput.id)}
          onDownload={() => handleAction(previewOutput, "downloadMediaOnly")}
          onEllipsisAction={(a) => handleAction(previewOutput, a)}
        />
      )}

      {/* SaveToKbModal — cross-app save flow stub. Maalik's directive:
          Winner Ads must always ask "kiske liye?" (Brand / Product / Category) +
          which one. */}
      {saveKbForOutput && (
        <SaveToKbModal
          sourceLabel={`Output ${saveKbForOutput.id}`}
          onClose={() => setSaveKbForOutput(null)}
          onSave={(payload) => {
            // Persist into the global saved-store. Auto-derives a paired
            // concept (Maalik: jitne winner ads, utne concepts).
            const out = saveKbForOutput;
            const headline =
              out.headline ?? out.body?.slice(0, 50) ?? `Saved output ${out.id}`;
            addWinnerAd({
              id: `wa-saved-${out.id}-${Date.now()}`,
              entityType: payload.entityType as EntityType,
              entityId: payload.entityId as EntityId,
              source: "saved-from-genie",
              thumbnail: out.thumbnail,
              format: out.mediaType === "video" ? "video" : "image",
              headline,
              description: out.body ?? out.headline ?? undefined,
              capturedAt: new Date(),
            });
            setSaveKbForOutput(null);
          }}
        />
      )}

      {/* Batch actions row */}
      {done && (
        <div className="flex items-center justify-between border-t border-border/40 pt-4">
          <button
            type="button"
            onClick={onStartOver}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Start over
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onGenerateAgain}
              disabled={!done}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/50 px-4 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-foreground/30 hover:bg-background/70 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Regenerate
            </button>
            <button
              type="button"
              onClick={onSaveBatch}
              disabled={!done}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save batch
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── *
 *  Skeleton card — matches OutputCardHybrid dimensions for a
 *  no-layout-shift loading state.
 * ─────────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-1.5">
        <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
        <div className="flex-1 space-y-1">
          <div className="h-2 w-20 animate-pulse rounded bg-muted" />
          <div className="h-1.5 w-12 animate-pulse rounded bg-muted/60" />
        </div>
      </div>
      <div className="space-y-1 px-3 py-1.5">
        <div className="h-2 w-full animate-pulse rounded bg-muted" />
        <div className="h-2 w-3/4 animate-pulse rounded bg-muted" />
      </div>
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted to-muted-foreground/10" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur">
            <Sparkles className="h-3 w-3" />
            Generating…
          </div>
        </div>
      </div>
      <div className="space-y-1 border-t border-border px-3 py-1.5">
        <div className="h-2 w-full animate-pulse rounded bg-muted" />
        <div className="h-1.5 w-1/2 animate-pulse rounded bg-muted/60" />
      </div>
    </div>
  );
}
