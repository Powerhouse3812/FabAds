import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BreadcrumbStepper } from "../components/queue/BreadcrumbStepper";
import { QueueHeader } from "../components/queue/QueueHeader";
import { PromptDock } from "../components/queue/PromptDock";
import { ResultsConcepts } from "../components/queue/ResultsConcepts";
import type { QueueVariant } from "../components/queue/VariantToggle";
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
 *   ?queue=v1   → dense left-aligned layout (default)
 *   ?queue=v2   → centered + Back-nav layout
 *   ?batch=<id> → which queue card is "active" (drives the concept rows)
 *   ?editing=<output-id> → forks the dock chip from this ad
 *
 * Variant toggle pill is shown ONLY in dev (`import.meta.env.DEV`) so
 * production users never see the indecision.
 *
 * State model:
 *   - `batches` is local component state seeded from the mock; new submits
 *     prepend to the array. In production this becomes a server cache.
 *   - The 10-concurrent backend cap is enforced at submit time: if 10 are
 *     already `generating`, the new batch lands as `queued` (per Maalik's
 *     spec — "user can queue 100, only 10 compute at once").
 */
export function Step5ResultsQueue({
  wizard,
  onStartOver: _onStartOver,
}: Step5ResultsQueueProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const variant: QueueVariant =
    searchParams.get("queue") === "v2" ? "v2" : "v1";
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

  // Prompt dock state — local
  const [promptText, setPromptText] = useState(activeBatch.prompt ?? "");

  // Resolve the "Editing — Ad number N" chip label from `?editing=<id>`.
  const editingLabel = useMemo(() => {
    if (!editingId || !activeBatch.outputs) return null;
    const idx = activeBatch.outputs.findIndex((o) => o.id === editingId);
    if (idx < 0) return null;
    return `Editing - Ad number ${idx + 1}`;
  }, [editingId, activeBatch.outputs]);

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
      // Seed dock with that batch's prompt
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
      // Seed the dock with a sensible fork prompt
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

  // ── Submit — new generation joins the queue ──────────────────────────
  const handleSubmit = useCallback(() => {
    if (!promptText.trim() || atCapacity) return;

    const id = `batch-${Date.now()}`;
    const status = concurrentGenerating >= MAX_CONCURRENT_GENERATING ? "queued" : "generating";
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
    // Focus the new batch
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

  return (
    <div className="flex h-full min-h-0 flex-col">
      <BreadcrumbStepper activeStep={2} />

      <QueueHeader
        variant={variant}
        batches={batches}
        activeBatchId={activeBatch.id}
        onSelectBatch={selectBatch}
        onBack={variant === "v2" ? onBack : undefined}
        onSwitchVariant={() => setVariant(variant === "v1" ? "v2" : "v1")}
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
