import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { sampleOutputs } from "../../mocks/sample-outputs";
import { BulkToolbar } from "../../components/BulkToolbar";
import { PreviewPane } from "../../components/PreviewPane";
import type { OutputData, EllipsisAction } from "../../types/output";
import { HeroHeader } from "../components/HeroHeader";
import { OutputCardHybrid } from "../components/OutputCardHybrid";
import type { UseWizardReturn } from "../state/useWizard";

interface Step5Props {
  wizard: UseWizardReturn;
  /** Done flag — owned by StudioV4 so WizardNav footer can disable
   *  Generate again / Save batch until generation completes. */
  done: boolean;
  /** Bumped by StudioV4 when user clicks "Generate again" — used as a
   *  reset key to clear local selection / preview state. */
  regenKey: number;
  onGenerateAgain: () => void;
  onSaveBatch: () => void;
  onStartOver: () => void;
}

/**
 * Step5Results — Genie 5 adcopy / Meta-ad style results screen.
 *
 * Pulls realistic ad data from `mocks/sample-outputs.ts` (sorted by
 * qualityScore desc, sliced to the user's variants count). Renders
 * Meta-ad cards via OutputCardHybrid. Multi-select with BulkToolbar
 * (slides in when 2+ selected). Click a card → PreviewPane slides in
 * 320px on the right with full details + actions.
 *
 * Action footer (Generate again / Save batch / Start over) lives in
 * WizardNav for consistency — same footer chassis as the other steps.
 */
export function Step5Results({ wizard, done, regenKey, onGenerateAgain, onSaveBatch, onStartOver }: Step5Props) {
  const totalOutputs = wizard.state.credits;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewId, setPreviewId] = useState<string | null>(null);

  // Reset local selection / preview when generation restarts.
  useEffect(() => {
    setSelectedIds(new Set());
    setPreviewId(null);
  }, [regenKey]);

  // Pick `totalOutputs` realistic outputs from sample-outputs.ts.
  // Sorted by qualityScore desc for top-N feel.
  const outputs = useMemo(() => {
    const all = sampleOutputs.slice();
    all.sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0));
    return all.slice(0, totalOutputs);
  }, [totalOutputs]);

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
    // Stub — log to console; real wiring is a follow-up
    console.log(`[Step5] ${action}`, output.id);
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 pt-8 pb-10">
      <HeroHeader title={done ? "Done!" : "Generating with Genie…"} />

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

      {/* Grid of Meta-ad-styled output cards */}
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {outputs.map((output) => (
          <li key={output.id}>
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

      {/* Batch actions row */}
      {done && (
        <div className="flex items-center justify-between border-t border-border pt-4">
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
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-foreground/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Regenerate
            </button>
            <button
              type="button"
              onClick={onSaveBatch}
              disabled={!done}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
