import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { sampleOutputs } from "../../mocks/sample-outputs";
import { BulkToolbar } from "../../components/BulkToolbar";
import { PreviewPane } from "../../components/PreviewPane";
import type { OutputData, EllipsisAction } from "../../types/output";
import { HeroHeader } from "../components/HeroHeader";
import { OutputCardHybrid } from "../components/OutputCardHybrid";
import type { UseWizardReturn } from "../state/useWizard";

interface Step5Props {
  wizard: UseWizardReturn;
}

/**
 * Step5Results — Genie 5 adcopy / Meta-ad style results screen (A-12.5).
 *
 * Pulls realistic ad data from `mocks/sample-outputs.ts` (filtered by
 * brand if available, otherwise top-quality outputs). Renders Meta-ad
 * cards via OutputCardHybrid. Multi-select with BulkToolbar (slides in
 * when 2+ selected). Click a card → PreviewPane slides in 320px on the
 * right with full details + actions.
 */
export function Step5Results({ wizard }: Step5Props) {
  const totalOutputs = wizard.state.credits;
  const [done, setDone] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewId, setPreviewId] = useState<string | null>(null);

  useEffect(() => {
    setDone(false);
    setSelectedIds(new Set());
    setPreviewId(null);
    const t = setTimeout(() => setDone(true), 2500);
    return () => clearTimeout(t);
  }, [wizard.state.step]);

  // Pick `totalOutputs` realistic outputs from sample-outputs.ts.
  // If the user picked a productId / brand context, prefer matching outputs.
  const outputs = useMemo(() => {
    const all = sampleOutputs.slice();
    // Sort by qualityScore desc for top-N feel; fall back to insertion order
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

  const generateAgain = () => {
    setDone(false);
    setSelectedIds(new Set());
    setPreviewId(null);
    setTimeout(() => setDone(true), 2500);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl gap-4 px-6 pt-4 pb-6">
      {/* Main column — header + bulk toolbar + grid */}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <HeroHeader
          eyebrow="Output"
          title={done ? "Done!" : "Generating with Genie…"}
          subtitle={
            done
              ? `${totalOutputs} ${totalOutputs === 1 ? "variant" : "variants"} ready · click to preview, multi-select for bulk actions`
              : `Crafting ${totalOutputs} ${totalOutputs === 1 ? "variant" : "variants"} based on your inputs…`
          }
        />

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

        {/* Action footer */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={generateAgain}
            disabled={!done}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-5 py-2 text-sm font-medium transition-colors",
              done ? "hover:border-primary/40" : "cursor-not-allowed opacity-50",
            )}
          >
            <Sparkles className="h-4 w-4" />
            Generate again
          </button>
          <button
            type="button"
            disabled={!done}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition-transform",
              done ? "hover:scale-[1.02]" : "cursor-not-allowed opacity-50",
            )}
          >
            Save batch
          </button>
          <button
            type="button"
            onClick={() => wizard.reset()}
            className="inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Start over
          </button>
        </div>
      </div>

      {/* Right-rail PreviewPane — slides in on card click */}
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
