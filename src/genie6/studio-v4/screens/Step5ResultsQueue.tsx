import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  approachLabel,
  buildCreditLines,
  stagesForFormat,
} from "../components/queue/batchDisplay";
import { MAX_CONCURRENT_GENERATING } from "../types/queue";
import type { OutputData } from "../../types/output";
import type { UseWizardReturn, WizardState } from "../state/useWizard";
import { sampleOutputs } from "@/genie6/mocks/sample-outputs";
import { getBrand, getProduct, getCategory } from "@/genie6/mocks";
import { concepts as conceptCatalog } from "@/mocks/shared";
import { computeBreakdown } from "@/genie6/lib/credits";
import {
  batchStatus,
  type RetryScope,
  type RunBatch,
  type RunItem,
  type RunOrigin,
} from "@/genie6/lib/genieRunTypes";
import {
  useBatch,
  useBatches,
  startBatch,
  retry,
  cancelBatch,
  creditsForRetry,
} from "@/genie6/lib/genieRunStore";
import { BatchProgressHeader } from "@/genie6/progress";
import { resolveFlowContext } from "@/genie6/flows/data/resolveFlowContext";

interface Step5ResultsQueueProps {
  wizard: UseWizardReturn;
  onStartOver: () => void;
}

/**
 * Resolve the concept labels a fresh batch should fan out over.
 *
 * §12 — "the user can multi-select concepts. One generate produces one ad
 * per concept, all in a single batch." §12 also excludes Product Shoot from
 * this fan-out. StudioAlpha never passes its `homeMode`/`studioMode` prop
 * down to this screen (see StudioAlpha.tsx — `<Step5ResultsQueue wizard=.../>`
 * has no such prop, and this agent does not own that file to add one), so
 * Product Shoot is detected the same way StudioAlpha itself marks it
 * internally: `startWizard` sets `category: "asset"` ONLY for Product Shoot
 * (`category: mode === "product-shoot" ? "asset" : "ad"`). That flows through
 * `wizard.state.category`, which IS available here.
 */
function isProductShootRun(state: WizardState): boolean {
  return state.category === "asset";
}

function resolveConceptLabels(state: WizardState, isProductShoot: boolean): string[] {
  if (isProductShoot) return [];
  return state.selectedConceptIds
    .map((id) => conceptCatalog.find((c) => c.id === id)?.name)
    .filter((n): n is string => Boolean(n));
}

function buildConfigSnapshot(state: WizardState): RunBatch["config"] {
  const brand = state.brandId ? getBrand(state.brandId) : undefined;
  const product = state.productId ? getProduct(state.productId) : undefined;
  const category = state.categoryId ? getCategory(state.categoryId) : undefined;
  return {
    format: state.format ?? undefined,
    approach: state.mode,
    model: state.modelId,
    angle: state.angleId ?? undefined,
    language: state.language,
    aspectRatio: state.aspectRatio,
    promptSnippet: state.prompt ? state.prompt.slice(0, 140) : undefined,
    brandName: brand?.name ?? (state.uploadedProductImage ? "Uploaded brand" : undefined),
    productName: product?.name ?? category?.name,
  };
}

function buildLabel(state: WizardState, isProductShoot: boolean): string {
  const brand = state.brandId ? getBrand(state.brandId) : undefined;
  const product = state.productId ? getProduct(state.productId) : undefined;
  const category = state.categoryId ? getCategory(state.categoryId) : undefined;
  const subject = product?.name ?? category?.name ?? brand?.name ?? "Studio run";
  const approach = isProductShoot ? "Product Shoot" : approachLabel(state.mode);
  return approach ? `${subject} — ${approach}` : subject;
}

function hasMinimalWizardConfig(state: WizardState): boolean {
  return Boolean(
    state.format ||
      state.brandId ||
      state.productId ||
      state.categoryId ||
      state.uploadedProductImage,
  );
}

/**
 * `?demo=1` — a fully synthetic, already-`done` RunBatch, built WITHOUT
 * calling `startBatch()`. Why: genieRunStore's `outcome` param only decides
 * WHICH items eventually fail, not whether they resolve instantly — every
 * batch ticks over real wall-clock time (`TICK_MS` × stage count, "well
 * under a minute" per that file's own comment). The pre-existing contract
 * for `?demo=1` is a FINISHED sample rendered on first paint for
 * HTML.to.design captures, which a real ticking batch can no longer
 * guarantee. Bypassing the store here (this batch never gets a
 * `?batch=`/real batchId and isn't visible from Library — acceptable, since
 * its whole purpose is a disposable capture snapshot, not a run to keep) is
 * the smallest way to keep that promise without changing genieRunStore.ts,
 * which is a shared cross-agent contract file this agent doesn't own.
 */
function buildDemoBatch(state: WizardState, isProductShoot: boolean): RunBatch {
  const conceptLabels = resolveConceptLabels(state, isProductShoot);
  const conceptCount = conceptLabels.length;
  const variations = Math.max(state.count, 1);
  const itemCount = Math.max(conceptCount, 1) * variations;
  const stages = stagesForFormat(state.format);
  const total = computeBreakdown(buildCreditLines(state, isProductShoot)).total;
  const creditsPerItem = Math.max(1, Math.round(total / itemCount));

  const items: RunItem[] = Array.from({ length: itemCount }, (_, i) => {
    const groupIdx = conceptCount > 0 ? Math.floor(i / variations) : 0;
    const conceptLabel = conceptLabels[groupIdx] ?? "Generation";
    const sample = sampleOutputs[(i + 3) % sampleOutputs.length];
    return {
      id: `demo-item-${i}`,
      status: "done",
      progress: 100,
      stageIndex: Math.max(stages.length - 1, 0),
      title: `${conceptLabel} — Variation ${(i % variations) + 1}`,
      tags: [conceptLabel],
      thumbnail: sample?.thumbnail,
      outputId: sample?.id,
      credits: creditsPerItem,
      index: i,
    };
  });

  return {
    batchId: "BATCH-DEMO001",
    createdAt: Date.now(),
    origin: { kind: "studio" },
    provenance: "client-created",
    createdBy: "Demo",
    label: buildLabel(state, isProductShoot),
    stages,
    items,
    credits: items.reduce((sum, i) => sum + i.credits, 0),
    config: buildConfigSnapshot(state),
  };
}

/**
 * Step5ResultsQueue — the redesigned Results / Generations Queue surface.
 *
 * Runs on the REAL run store (`genieRunStore.ts`) instead of the old local
 * `mocks/queue-batches.ts` + component state — Studio and the Library now
 * read the SAME batch. §10: Batch ID = Job ID, one identifier, shown above
 * the batch (see BatchDetailsAccordion's closed header).
 *
 * URL drives view state:
 *   ?queue=v1   → dense left-aligned header strip (default)
 *   ?queue=v2   → centered title + Back-nav layout
 *   ?queue=v3   → Finder-style split-pane (vertical queue list + right pane)
 *   ?batch=<id> → THE run-store batch id this screen is showing. Set by
 *                 this screen on first arrival (see the start-effect below)
 *                 and read back on every mount, so a run is linkable and
 *                 SURVIVES REFRESH within the same session — the store is an
 *                 in-memory module singleton (same pattern as
 *                 src/lib/ad-entity-write-store.ts), so a hard page reload
 *                 resets it, same as every other mock store in this repo.
 *   ?editing=<output-id> → forks the dock chip from this ad (V1/V2 only)
 *   ?demo=1     → deterministic 16-output finished sample (unchanged
 *                 contract — wizard already seeds 4 concepts × 4 variations
 *                 for this flag). Rendered from a SYNTHETIC, already-`done`
 *                 batch (see `buildDemoBatch`) rather than a real
 *                 `startBatch()` call: genieRunStore ticks every batch over
 *                 real wall-clock time regardless of `outcome`, so a real
 *                 batch can no longer guarantee the instant-on-first-paint
 *                 render this flag has always promised for HTML.to.design
 *                 captures. This demo batch never gets a `?batch=` id and
 *                 isn't visible from Library — acceptable, its only job is a
 *                 disposable capture snapshot.
 *   ?outcome=all-done|one-failed|all-failed|partial → forces a deterministic
 *                 outcome on a FRESH batch, so every state in the §21.3
 *                 matrix is reachable from a plain URL for design review —
 *                 without this override, the run store ticks batches
 *                 naturally.
 *
 * Variant toggle pill is shown ONLY in dev (`import.meta.env.DEV`) so
 * production users never see the indecision.
 */
export function Step5ResultsQueue({
  wizard,
  onStartOver: _onStartOver,
}: Step5ResultsQueueProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const variant: QueueVariant = (() => {
    const v = searchParams.get("queue");
    if (v === "v2") return "v2";
    if (v === "v3") return "v3";
    return "v1";
  })();
  const urlBatchId = searchParams.get("batch");
  const editingId = searchParams.get("editing");
  const isDemoMode = searchParams.get("demo") === "1";
  const outcomeOverride = searchParams.get("outcome") as
    | "all-done"
    | "one-failed"
    | "all-failed"
    | "partial"
    | null;

  const isProductShoot = isProductShootRun(wizard.state);

  // §6 Rule 5 — "the user always knows where they came from" — resolved
  // from the ?src/?ref/?act flow params so a batch started under a flow
  // carries that origin (RunOrigin "flow") instead of a bare "studio" run.
  const flowCtx = useMemo(() => resolveFlowContext(searchParams), [searchParams]);

  // ── All batches (for the queue strip / list + the 10-concurrent cap) ──
  const allBatches = useBatches();
  const concurrentRunning = useMemo(
    () => allBatches.filter((b) => batchStatus(b) === "running").length,
    [allBatches],
  );
  const atCapacity = concurrentRunning >= MAX_CONCURRENT_GENERATING;

  // ── Task 1 — start a batch on fresh arrival, put its id in the URL ────
  const startedRef = useRef(false);
  const canStart = hasMinimalWizardConfig(wizard.state);

  useEffect(() => {
    if (isDemoMode) return; // demo renders a synthetic batch — see buildDemoBatch
    if (urlBatchId) return;
    if (startedRef.current) return;
    if (!canStart) return; // zero-data guard — nothing configured to generate
    startedRef.current = true;

    const conceptLabels = resolveConceptLabels(wizard.state, isProductShoot);
    const conceptCount = conceptLabels.length;
    const variations = Math.max(wizard.state.count, 1);
    // §12 — N concepts → N items in ONE batch (excludes Product Shoot).
    const itemCount = Math.max(conceptCount, 1) * variations;

    const lines = buildCreditLines(wizard.state, isProductShoot);
    const total = computeBreakdown(lines).total;
    const creditsPerItem = Math.max(1, Math.round(total / itemCount));

    const origin: RunOrigin = flowCtx
      ? {
          kind: "flow",
          module: flowCtx.module.key,
          action: flowCtx.action.id,
          refTitle: flowCtx.ref.title,
        }
      : { kind: "studio" };

    const id = startBatch({
      origin,
      label: buildLabel(wizard.state, isProductShoot),
      stages: stagesForFormat(wizard.state.format),
      count: itemCount,
      creditsPerItem,
      creditsTotal: total, // the figure the Generate button quoted — charged exactly, never re-rounded
      config: buildConfigSnapshot(wizard.state),
      // isDemoMode already returned above — outcomeOverride is the only
      // source of a forced outcome a REAL batch can reach.
      outcome: outcomeOverride ?? undefined,
      itemSeed: (i) => {
        const groupIdx = conceptCount > 0 ? Math.floor(i / variations) : 0;
        const conceptLabel = conceptLabels[groupIdx] ?? "Generation";
        const sample = sampleOutputs[(i + 3) % sampleOutputs.length];
        return {
          title: `${conceptLabel} — Variation ${(i % variations) + 1}`,
          tags: [conceptLabel],
          thumbnail: sample?.thumbnail,
          outputId: sample?.id,
        };
      },
    });

    setSearchParams(
      () => {
        // Live URL, not `prev` — see useUrlSync.ts's writer for why.
        const sp = new URLSearchParams(window.location.search);
        sp.set("batch", id);
        return sp;
      },
      { replace: true },
    );
    // Deliberately NOT depending on the full wizard object — this effect
    // must run exactly once per fresh arrival (guarded by startedRef), not
    // re-fire on every wizard state tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlBatchId, canStart, isDemoMode]);

  // ── Active batch — always call the hook; it no-ops on an empty id.
  // `?demo=1` overrides with the synthetic finished batch (see buildDemoBatch)
  // instead of anything from the real store. ─────────────────────────────
  const storeBatch = useBatch(urlBatchId ?? "");
  const demoBatch = useMemo(
    () => (isDemoMode ? buildDemoBatch(wizard.state, isProductShoot) : undefined),
    // Demo is a one-shot capture snapshot — deliberately not reactive to
    // every wizard keystroke, only to the flag itself and the two inputs
    // that decide its shape.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDemoMode],
  );
  const activeBatch = isDemoMode ? demoBatch : storeBatch;

  // Prompt dock state — local, V1/V2 only
  const [promptText, setPromptText] = useState("");
  useEffect(() => {
    setPromptText(activeBatch?.config?.promptSnippet ?? "");
    // Only re-seed when the ACTIVE BATCH changes, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBatch?.batchId]);

  // V3 hoists output selection so BulkToolbar can render off it. Keyed by
  // RunItem.id (RunItemTile has no selection affordance, so only items that
  // resolve to an OutputData — i.e. `done` items — ever get toggled).
  const [selectedAds, setSelectedAds] = useState<Set<string>>(new Set());
  useEffect(() => {
    setSelectedAds(new Set());
  }, [urlBatchId]);

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
    if (!activeBatch) return [];
    const out: OutputData[] = [];
    for (const item of activeBatch.items) {
      if (selectedAds.has(item.id) && item.outputId) {
        const o = sampleOutputs.find((s) => s.id === item.outputId);
        if (o) out.push(o);
      }
    }
    return out;
  }, [activeBatch, selectedAds]);

  // Resolve the "Editing — Ad number N" chip label from `?editing=<output-id>`.
  const editingLabel = useMemo(() => {
    if (!editingId || !activeBatch) return null;
    const idx = activeBatch.items.findIndex((it) => it.outputId === editingId);
    if (idx < 0) return null;
    return `Editing - Ad number ${idx + 1}`;
  }, [editingId, activeBatch]);

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
    },
    [setSearchParams],
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

  // ── Retry (§21.3) ──────────────────────────────────────────────────────
  // "Retry all failed" / "Retry whole batch" (credit-priced) and Cancel
  // already render on the Progress agent's BatchProgressHeader; "retry this
  // ad only" (and even a blind "different-model") render inline per item via
  // RunItemTile → FailureNotice. The one gap neither covers is a MODEL
  // CHOICE before "different-model" fires — this screen's BatchActionsBar
  // supplies that picker, so only its one credit number is needed here.
  const differentModelCredits = activeBatch
    ? creditsForRetry(activeBatch.batchId, "different-model")
    : undefined;

  const handleRetry = useCallback(
    (scope: RetryScope, opts?: { modelId?: string }) => {
      if (!activeBatch) return;
      retry(activeBatch.batchId, scope, opts);
    },
    [activeBatch],
  );

  const handleRetryItem = useCallback(
    (itemId: string, scope: RetryScope) => {
      if (!activeBatch) return;
      // genieRunStore.ts flags the same gap this screen ran into (RetryScope's
      // "this-item" with no item id on the base retry(batchId, scope)
      // signature) and closes it with an additive, optional `opts.itemId` on
      // `RetryOpts` — safe for every other call site since it only ever
      // passed `{ modelId }` before.
      retry(activeBatch.batchId, scope, { itemId });
    },
    [activeBatch],
  );

  // ── Cancel (§18/§21.2) — confirmed, since it stops in-flight paid work ──
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const handleCancelRequest = useCallback(() => setConfirmCancelOpen(true), []);
  const handleCancelConfirm = useCallback(() => {
    if (activeBatch) cancelBatch(activeBatch.batchId);
    setConfirmCancelOpen(false);
  }, [activeBatch]);

  // ── §21.2 long-render IA — notify-and-leave, does NOT cancel the run ──
  const handleNotifyAndLeave = useCallback(() => {
    if (activeBatch) {
      toast(
        `We'll notify you when ${activeBatch.batchId} is done — it keeps generating in the background.`,
      );
    }
    navigate("/iq/genie6/library");
  }, [activeBatch, navigate]);

  // ── Task 7 — credit breakdown, shared util with Configure ─────────────
  const breakdown = useMemo(
    () => computeBreakdown(buildCreditLines(wizard.state, isProductShoot)),
    [wizard.state, isProductShoot],
  );

  // ── Submit — dock fork / re-generate (V1/V2 dock only) ────────────────
  const handleSubmit = useCallback(() => {
    if (!promptText.trim() || atCapacity) return;

    const forkConfig = activeBatch?.config;
    const label = editingLabel
      ? "Fork — ad refinement"
      : forkConfig?.brandName
        ? `${forkConfig.brandName} — refinement`
        : "New generation";
    // §5 — never a hardcoded count. The dock's own label reads
    // "N outputs × …" from `breakdown`, so the fork produces exactly the
    // item count that figure was computed for (concepts × variations).
    const conceptCount = resolveConceptLabels(wizard.state, isProductShoot).length;
    const count = Math.max(conceptCount, 1) * Math.max(wizard.state.count, 1);
    const creditsPerItem = Math.max(1, Math.round(breakdown.total / count));

    const id = startBatch({
      origin: activeBatch?.origin ?? { kind: "studio" },
      label,
      stages: stagesForFormat((forkConfig?.format as WizardState["format"]) ?? wizard.state.format),
      count,
      creditsPerItem,
      creditsTotal: breakdown.total, // the dock's own quoted figure
      config: { ...forkConfig, promptSnippet: promptText.slice(0, 140) },
      itemSeed: (i) => {
        const sample = sampleOutputs[(i + 7) % sampleOutputs.length];
        return {
          title: `Fork — Variation ${i + 1}`,
          tags: ["Generation"],
          thumbnail: sample?.thumbnail,
          outputId: sample?.id,
        };
      },
    });

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
  }, [
    promptText,
    atCapacity,
    activeBatch,
    editingLabel,
    breakdown,
    wizard.state.format,
    setSearchParams,
  ]);

  // A-12.184: variant toggle now visible in production too — Maalik is
  // still iterating on V1/V2/V3 and needs to switch between them on the
  // deployed URL without rebuilding.
  const showVariantToggle = true;

  const cancelDialog = (
    <AlertDialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
      {/* AlertDialogContent's Radix type OMITS onPointerDownOutside /
          onInteractOutside entirely (see @radix-ui/react-alert-dialog's
          .d.ts) — an alert dialog can't be dismissed by outside interaction
          by construction, so the app's no-outside-click-dismiss rule is
          already satisfied here with nothing extra to wire. */}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this batch?</AlertDialogTitle>
          <AlertDialogDescription>
            {activeBatch?.batchId} stops generating immediately. Outputs already finished stay in
            your Library; anything still running is discarded and its credits are not refunded.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep generating</AlertDialogCancel>
          <AlertDialogAction onClick={handleCancelConfirm}>Cancel batch</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // ── Edge states shared by every variant ────────────────────────────────
  // (?demo=1 never has a ?batch= — it renders `demoBatch` directly — so
  // every guard below that reasons about urlBatchId is skipped in demo mode.)

  // Zero-data — nothing configured, nothing running, no link to resume.
  if (!isDemoMode && !urlBatchId && !canStart) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <BreadcrumbStepper activeStep={2} />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Nothing to show yet
          </p>
          <p className="max-w-sm text-[13px] text-foreground">
            This screen shows a generation batch, and none has started yet. Head back to Configure
            to set up a run.
          </p>
          <Button size="sm" onClick={onBack}>
            Back to Configure
          </Button>
        </div>
      </div>
    );
  }

  // About to start (effect hasn't set ?batch= yet) — shimmer, not a spinner.
  if (!isDemoMode && !urlBatchId) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <BreadcrumbStepper activeStep={2} />
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="h-6 w-48 animate-pulse rounded-md bg-muted" />
          <div className="h-16 w-full animate-pulse rounded-xl bg-muted" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Stale link — batch id in the URL but not in the (in-memory) store.
  if (!activeBatch) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <BreadcrumbStepper activeStep={2} />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Batch not found
          </p>
          <p className="max-w-sm text-[13px] text-foreground">
            <span className="font-mono">{urlBatchId}</span> isn't available — this is a
            prototype, and its run store resets on a full page reload, same as Library.
          </p>
          <Button size="sm" onClick={onBack}>
            Back to Configure
          </Button>
        </div>
      </div>
    );
  }

  const progressHeader = (
    <div className="px-6 pt-4">
      <BatchProgressHeader batch={activeBatch} onRetry={handleRetry} onCancel={handleCancelRequest} />
    </div>
  );
  const actionsBar = (
    <BatchActionsBar
      batch={activeBatch}
      onRetry={handleRetry}
      retryCredits={differentModelCredits}
      onNotifyAndLeave={handleNotifyAndLeave}
      onEdit={onBack}
      onSaveAll={() => toast(`Saved all — ${activeBatch.label}`)}
      onLaunchAll={() => toast(`Launching ${activeBatch.items.length} ads`)}
      onSaveToBoard={() => toast("Save to board — pick a board (modal coming next)")}
      onSaveToFolder={() => toast("Save to folder — folder picker coming next")}
    />
  );

  // ── V3 layout ────────────────────────────────────────────────────────
  if (variant === "v3") {
    return (
      <div className="flex h-full min-h-0 flex-col">
        {cancelDialog}
        <BreadcrumbStepper activeStep={2} />
        {showVariantToggle && (
          <div className="flex shrink-0 items-center justify-end border-b border-border/60 px-5 py-2">
            <VariantToggle active={variant} onSwitch={setVariant} />
          </div>
        )}
        <div className="flex min-h-0 flex-1">
          <QueueListV3
            batches={allBatches}
            activeBatchId={activeBatch.batchId}
            onSelectBatch={selectBatch}
          />
          <div className="flex min-h-0 flex-1 flex-col">
            {progressHeader}
            {actionsBar}
            <BatchDetailsAccordion batch={activeBatch} />
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <ResultsConcepts
                batch={activeBatch}
                onEdit={startEditing}
                onRetryItem={handleRetryItem}
                selected={selectedAds}
                onToggleSelect={toggleAdSelect}
              />
            </div>
            {selectedOutputs.length >= 2 && (
              <div className="shrink-0 border-t border-border/60 bg-background px-5 py-3">
                <BulkToolbar
                  selectedOutputs={selectedOutputs}
                  onEditBatch={() => toast("Edit batch selection")}
                  onBulkDownload={() => toast(`Downloading ${selectedOutputs.length} ads`)}
                  onBulkLaunch={() => toast(`Launching ${selectedOutputs.length} ads`)}
                  onAddToFolder={() => toast(`Save ${selectedOutputs.length} to folder`)}
                  onBulkRegenerate={() => toast(`Regenerating ${selectedOutputs.length} ads`)}
                  onClear={clearSelection}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── V1 / V2 layout (strip header + dock) ──────────────────────────────
  return (
    <div className="flex h-full min-h-0 flex-col">
      {cancelDialog}
      <BreadcrumbStepper activeStep={2} />

      <QueueHeader
        variant={variant}
        batches={allBatches}
        activeBatchId={activeBatch.batchId}
        onSelectBatch={selectBatch}
        onBack={variant === "v2" ? onBack : undefined}
        onSwitchVariant={setVariant}
        showVariantToggle={showVariantToggle}
      />

      {progressHeader}
      {actionsBar}

      {/* Results body — flex-1 so the dock can pin to the bottom */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <ResultsConcepts
          batch={activeBatch}
          onEdit={startEditing}
          onRetryItem={handleRetryItem}
        />
      </div>

      <PromptDock
        editingLabel={editingLabel}
        onClearEditing={editingLabel ? clearEditing : undefined}
        value={promptText}
        onChange={setPromptText}
        breakdown={breakdown}
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
