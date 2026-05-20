import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { BreadcrumbStepper } from "../components/queue/BreadcrumbStepper";
import { QueueHeader } from "../components/queue/QueueHeader";
import { QueueListV3 } from "../components/queue/QueueListV3";
import { BatchDetailsAccordion } from "../components/queue/BatchDetailsAccordion";
import { BatchActionsBar } from "../components/queue/BatchActionsBar";
import { PromptDock } from "../components/queue/PromptDock";
import { ResultsConcepts } from "../components/queue/ResultsConcepts";
import { VariantToggle, type QueueVariant } from "../components/queue/VariantToggle";
import { BulkToolbar } from "../../components/BulkToolbar";
import {
  defaultActiveBatchId,
  queueBatches as seedBatches,
} from "../mocks/queue-batches";
import {
  MAX_CONCURRENT_GENERATING,
  type QueueBatch,
} from "../types/queue";
import type { OutputData } from "../../types/output";
import type { UseWizardReturn } from "../state/useWizard";

interface Step5ResultsQueueProps {
  wizard: UseWizardReturn;
  onStartOver: () => void;
}

/**
 * Step5ResultsQueue — the redesigned Results / Generations Queue surface.
 *
 * Replaces the legacy `Step5Results` concept-rows-only layout. Mounts at
 * step 5 of the Studio v4 wizard. URL drives view state:
 *
 *   ?queue=v1   → dense left-aligned header strip (default)
 *   ?queue=v2   → centered title + Back-nav layout
 *   ?queue=v3   → Finder-style split-pane (vertical queue list + right pane)
 *   ?batch=<id> → which batch is "active" (drives the concept rows)
 *   ?editing=<output-id> → forks the dock chip from this ad (V1/V2 only)
 *
 * Variant toggle pill is shown ONLY in dev (`import.meta.env.DEV`) so
 * production users never see the indecision.
 *
 * V3 specifics (Maalik A-12.182):
 *   - 260px vertical queue list (search at top, flat compact rows)
 *   - Right pane: BatchActionsBar (always visible, batch-scope actions)
 *     → BatchDetailsAccordion (closed by default; expands config + prompt)
 *     → ResultsConcepts (concept-grouped result rows, controlled selection)
 *   - NO PromptDock (refinement happens via Regenerate, not a free-text bar)
 *   - BulkToolbar (sticky bottom) slides in when 2+ outputs selected
 *   - Edge states: no batch selected · batch generating · batch failed
 *
 * State model:
 *   - `batches` is local component state seeded from the mock; new submits
 *     (V1/V2 dock) prepend to the array.
 *   - The 10-concurrent backend cap is enforced at submit time.
 *   - V3 hoists `selectedAds` so BulkToolbar can render off it.
 */
export function Step5ResultsQueue({
  wizard,
  onStartOver: _onStartOver,
}: Step5ResultsQueueProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const variant: QueueVariant = (() => {
    const v = searchParams.get("queue");
    if (v === "v2") return "v2";
    if (v === "v3") return "v3";
    return "v1";
  })();
  const urlBatchId = searchParams.get("batch");
  const editingId = searchParams.get("editing");

  // Local batch store — seeded from mock, mutated by new submits.
  const [batches, setBatches] = useState<QueueBatch[]>(seedBatches);

  // Active batch — URL-driven; falls back to mock default if unset / invalid.
  const activeBatchId = useMemo(() => {
    if (urlBatchId && batches.some((b) => b.id === urlBatchId)) return urlBatchId;
    return defaultActiveBatchId;
  }, [urlBatchId, batches]);

  const activeBatch = useMemo(
    () => batches.find((b) => b.id === activeBatchId) ?? batches[0],
    [batches, activeBatchId],
  );

  // Concurrency cap state — used to disable Generate when 10 are live.
  const concurrentGenerating = useMemo(
    () => batches.filter((b) => b.status === "generating").length,
    [batches],
  );
  const atCapacity = concurrentGenerating >= MAX_CONCURRENT_GENERATING;

  // Prompt dock state — local, V1/V2 only
  const [promptText, setPromptText] = useState(activeBatch?.prompt ?? "");

  // V3 hoists output selection so BulkToolbar can render off it.
  const [selectedAds, setSelectedAds] = useState<Set<string>>(new Set());
  // Reset selection when the active batch changes — selection is batch-scoped.
  useEffect(() => {
    setSelectedAds(new Set());
  }, [activeBatchId]);

  const toggleAdSelect = useCallback((id: string) => {
    setSelectedAds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedAds(new Set()), []);

  const selectedOutputs = useMemo<OutputData[]>(() => {
    if (!activeBatch?.outputs) return [];
    return activeBatch.outputs.filter((o) => selectedAds.has(o.id));
  }, [activeBatch, selectedAds]);

  // Resolve the "Editing — Ad number N" chip label from `?editing=<id>`.
  const editingLabel = useMemo(() => {
    if (!editingId || !activeBatch?.outputs) return null;
    const idx = activeBatch.outputs.findIndex((o) => o.id === editingId);
    if (idx < 0) return null;
    return `Editing - Ad number ${idx + 1}`;
  }, [editingId, activeBatch?.outputs]);

  // ── URL helpers ──────────────────────────────────────────────────────
  const setVariant = useCallback(
    (next: QueueVariant) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (next === "v1") sp.delete("queue");
          else sp.set("queue", next);
          return sp;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const selectBatch = useCallback(
    (id: string) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          sp.set("batch", id);
          sp.delete("editing"); // forking context is batch-scoped
          return sp;
        },
        { replace: false },
      );
      const b = batches.find((x) => x.id === id);
      if (b) setPromptText(b.prompt ?? "");
    },
    [setSearchParams, batches],
  );

  const startEditing = useCallback(
    (output: OutputData) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          sp.set("editing", output.id);
          return sp;
        },
        { replace: true },
      );
      const fork = `Regenerate this ad with [your changes]: "${output.headline ?? output.body?.slice(0, 60) ?? "Untitled"}"`;
      setPromptText(fork);
    },
    [setSearchParams],
  );

  const clearEditing = useCallback(() => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.delete("editing");
        return sp;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const onBack = useCallback(() => wizard.goTo(4), [wizard]);

  // ── Submit — new generation joins the queue (V1/V2 dock only) ────────
  const handleSubmit = useCallback(() => {
    if (!promptText.trim() || atCapacity) return;

    const id = `batch-${Date.now()}`;
    const status =
      concurrentGenerating >= MAX_CONCURRENT_GENERATING ? "queued" : "generating";
    const next: QueueBatch = {
      id,
      title: editingLabel ? "Fork — ad refinement" : "New generation",
      submittedAt: new Date(),
      status,
      tags: editingLabel ? ["Fork", "Refinement"] : ["Performance", "Story Ad"],
      generationCount: 12,
      prompt: promptText,
    };
    setBatches((prev) => [next, ...prev]);
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.set("batch", id);
        sp.delete("editing");
        return sp;
      },
      { replace: false },
    );
    setPromptText("");
  }, [promptText, atCapacity, concurrentGenerating, editingLabel, setSearchParams]);

  const showVariantToggle = import.meta.env.DEV;

  // ── V3 layout ────────────────────────────────────────────────────────
  if (variant === "v3") {
    // Edge: no batches at all (clean account, no submits yet)
    if (batches.length === 0) {
      return (
        <div className="flex h-full min-h-0 flex-col">
          <BreadcrumbStepper activeStep={2} />
          {showVariantToggle && (
            <div className="flex shrink-0 items-center justify-end border-b border-border/60 px-5 py-2">
              <VariantToggle active={variant} onSwitch={setVariant} />
            </div>
          )}
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                No generations yet
              </p>
              <p className="mt-1 text-[14px] text-foreground">
                Submit a generation from the wizard to start queueing batches.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-full min-h-0 flex-col">
        <BreadcrumbStepper activeStep={2} />

        {showVariantToggle && (
          <div className="flex shrink-0 items-center justify-end border-b border-border/60 px-5 py-2">
            <VariantToggle active={variant} onSwitch={setVariant} />
          </div>
        )}

        {/* Split pane: 260px left queue + flex-1 right detail */}
        <div className="flex min-h-0 flex-1">
          <QueueListV3
            batches={batches}
            activeBatchId={activeBatch?.id ?? null}
            onSelectBatch={selectBatch}
          />

          {/* Right pane */}
          <div className="flex min-h-0 flex-1 flex-col">
            {activeBatch ? (
              <>
                <BatchActionsBar
                  batch={activeBatch}
                  onEdit={() => {
                    toast("Edit batch — reopen wizard with this config");
                    onBack();
                  }}
                  onRegenerateAll={() =>
                    toast(`Regenerating all ${activeBatch.generationCount} variations`)
                  }
                  onSaveAll={() =>
                    toast(`Saved all ${activeBatch.generationCount} variations`)
                  }
                  onLaunchAll={() =>
                    toast(`Launching ${activeBatch.generationCount} ads`)
                  }
                  onSaveToBoard={() =>
                    toast("Save to board — pick a board (modal coming next)")
                  }
                  onSaveToFolder={() =>
                    toast("Save to folder — folder picker coming next")
                  }
                />

                <BatchDetailsAccordion batch={activeBatch} />

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                  <ResultsConcepts
                    batch={activeBatch}
                    onEdit={startEditing}
                    selected={selectedAds}
                    onToggleSelect={toggleAdSelect}
                  />
                </div>

                {/* Bulk toolbar — sticky bottom, slides in only when 2+
                    outputs selected. BulkToolbar auto-hides at <2. */}
                {selectedOutputs.length >= 2 && (
                  <div className="shrink-0 border-t border-border/60 bg-background px-5 py-3">
                    <BulkToolbar
                      selectedOutputs={selectedOutputs}
                      onEditBatch={() => toast("Edit batch selection")}
                      onBulkDownload={() =>
                        toast(`Downloading ${selectedOutputs.length} ads`)
                      }
                      onBulkLaunch={() =>
                        toast(`Launching ${selectedOutputs.length} ads`)
                      }
                      onAddToFolder={() =>
                        toast(`Save ${selectedOutputs.length} to folder`)
                      }
                      onBulkRegenerate={() =>
                        toast(`Regenerating ${selectedOutputs.length} ads`)
                      }
                      onClear={clearSelection}
                    />
                  </div>
                )}
              </>
            ) : (
              // Edge: batches exist but none is "active" (URL had a stale id)
              <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    No batch selected
                  </p>
                  <p className="mt-1 text-[14px] text-foreground">
                    Pick a batch from the queue to see its results.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── V1 / V2 layout (legacy strip header + dock) ──────────────────────
  if (!activeBatch) {
    // Defensive: shouldn't happen with the mock, but if batches array is
    // ever empty, render an empty state instead of crashing.
    return (
      <div className="flex h-full min-h-0 flex-col">
        <BreadcrumbStepper activeStep={2} />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">No batches in queue yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <BreadcrumbStepper activeStep={2} />

      <QueueHeader
        variant={variant}
        batches={batches}
        activeBatchId={activeBatch.id}
        onSelectBatch={selectBatch}
        onBack={variant === "v2" ? onBack : undefined}
        onSwitchVariant={setVariant}
        showVariantToggle={showVariantToggle}
      />

      {/* Results body — flex-1 so the dock can pin to the bottom */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <ResultsConcepts batch={activeBatch} onEdit={startEditing} />
      </div>

      <PromptDock
        editingLabel={editingLabel}
        onClearEditing={editingLabel ? clearEditing : undefined}
        value={promptText}
        onChange={setPromptText}
        creditCost={24}
        onSubmit={handleSubmit}
        disabled={atCapacity}
        disabledReason={
          atCapacity
            ? `${MAX_CONCURRENT_GENERATING} generations already in progress — wait for one to finish.`
            : undefined
        }
      />
    </div>
  );
}
