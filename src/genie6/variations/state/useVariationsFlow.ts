import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { computeBreakdown, exceedsBalance, type CreditLine } from "../../lib/credits";
import { startBatch } from "../../lib/genieRunStore";
import type { RunOrigin } from "../../lib/genieRunTypes";
import { analyseAd } from "../data/analyseAd";
import { recommendedActionsFor } from "../data/recommendedActions";
import { getVariationElement } from "../data/variationElements";
import type {
  AdAnalysis,
  EditScope,
  PickedSource,
  RecommendedAction,
  VariationEdit,
  VariationElementId,
  VariationsFlowState,
} from "../types";

/**
 * useVariationsFlow — the single spine both UI versions run on.
 *
 * Every rule — what the analysis says, which actions get recommended, what a
 * scope means, what the run costs, what Generate fires — lives here or in
 * `data/`, never in the screen. That split is why the flow could be built as
 * two competing UI versions at once, and it stays worth keeping.
 *
 * Deliberately NOT built on useWizard: that hook's step machine is a closed
 * 0-5 union whose steps are semantically hardcoded (1=Format, 2=Entity,
 * 3=Approach, 4=Configure). This flow's steps are none of those. It reuses
 * the shared CONTRACTS instead — the 1/20/4 count bounds, computeBreakdown,
 * the run store — which is what actually has to stay consistent.
 */

/** The shared count contract (NumberStepper): min 1, max 20, default 4. */
export const COUNT_MIN = 1;
export const COUNT_MAX = 20;
export const COUNT_DEFAULT = 4;

/** §18 stage names for a variation batch — names, never a fixed ETA. */
export const VARIATION_STAGES = ["Queued", "Reading the source", "Generating", "Finishing"];

/** Nominal per-item rate for a whole-ad variation. */
export const VARIATION_CREDITS_PER_ITEM = 4;

export interface UseVariationsFlowReturn {
  state: VariationsFlowState;

  /** Step 1 — the picker resolved. Resets everything downstream. */
  pick: (picked: PickedSource) => void;
  clearSource: () => void;

  /** Step 2 — how many variations. Clamped to the shared bounds. */
  setCount: (n: number) => void;

  /** Step 3 — what the source ad was found to be. null until a source exists. */
  analysis: AdAnalysis | null;

  /** Step 4 — 3-4 contextual actions derived from `analysis`. */
  recommendations: RecommendedAction[];

  /** A quick action applies to all N and asks nothing. Tap again to drop it. */
  toggleQuickAction: (element: VariationElementId) => void;
  isQuickAction: (element: VariationElementId) => boolean;

  /**
   * Step 5 — going MANUAL on an element. Raises the scope selector, then the
   * element's prompt becomes editable text seeded from the detection.
   */
  beginEdit: (element: VariationElementId, scope: EditScope) => void;
  setEditScope: (element: VariationElementId, scope: EditScope) => void;
  setEditPrompt: (element: VariationElementId, prompt: string) => void;
  setEditIndexes: (element: VariationElementId, indexes: number[]) => void;
  setEditPromptForIndex: (element: VariationElementId, index: number, prompt: string) => void;
  cancelEdit: (element: VariationElementId) => void;
  editFor: (element: VariationElementId) => VariationEdit | undefined;

  /** True once anything at all has been asked for beyond the plain N copies. */
  hasChanges: boolean;
  /** Every element the run will touch — quick actions plus manual edits. */
  touchedElements: VariationElementId[];

  credits: { lines: CreditLine[]; total: number; overdrawn: boolean };

  canGenerate: boolean;
  generate: () => void;
}

function clampCount(n: number): number {
  if (Number.isNaN(n)) return COUNT_DEFAULT;
  return Math.max(COUNT_MIN, Math.min(COUNT_MAX, Math.round(n)));
}

/** Where the batch says it came from, honestly per source kind. */
function originFor(picked: PickedSource, title: string): RunOrigin {
  if (picked.kind === "upload") return { kind: "upload" };
  if (picked.kind === "flow-ref") {
    return {
      kind: "flow",
      module: picked.ref.module,
      action: "generate-variation",
      refTitle: title,
    };
  }
  // Varying Genie's own output didn't arrive from another module, so claiming
  // a flow module would put a source on the batch the user never picked.
  return { kind: "studio" };
}

/**
 * The instructions the run is actually carrying, as one readable snippet.
 *
 * `RunBatch.config` has no per-element/per-variation shape, so without this
 * every scope, subset and typed prompt was dropped at generate time and the
 * Library's provenance panel described a run nobody asked for.
 */
function promptSnippetFor(
  elements: VariationElementId[],
  state: VariationsFlowState,
): string | undefined {
  if (elements.length === 0) return undefined;
  return elements
    .map((element) => {
      const { label } = getVariationElement(element);
      const edit = state.edits[element];
      if (!edit) return `${label}: Genie's pick, all ${state.count}`;
      if (edit.scope === "all") return `${label} (all ${state.count}): ${edit.prompt ?? ""}`.trim();
      if (edit.scope === "multiple") {
        const which = (edit.variationIndexes ?? []).map((i) => i + 1).join(", ");
        return `${label} (variations ${which}): ${edit.prompt ?? ""}`.trim();
      }
      const perVariation = Object.entries(edit.byIndex ?? {})
        .map(([i, prompt]) => `#${Number(i) + 1} ${prompt}`)
        .join(" · ");
      return `${label} (one by one): ${perVariation}`;
    })
    .join(" | ");
}

export function useVariationsFlow(): UseVariationsFlowReturn {
  const navigate = useNavigate();
  const [state, setState] = useState<VariationsFlowState>({
    picked: null,
    count: COUNT_DEFAULT,
    quickActions: [],
    edits: {},
  });

  const analysis = useMemo(
    () => (state.picked ? analyseAd(state.picked) : null),
    [state.picked],
  );

  const recommendations = useMemo(
    () => (analysis ? recommendedActionsFor(analysis) : []),
    [analysis],
  );

  /** Lets the state updaters re-seed prompts without taking `analysis` as a
   *  dep — a changed analysis means a changed source, which clears edits anyway. */
  const analysisRef = useRef(analysis);
  analysisRef.current = analysis;

  /** A new source invalidates the analysis, so the choices made against it go too. */
  const pick = useCallback((picked: PickedSource) => {
    setState((prev) => ({ ...prev, picked, quickActions: [], edits: {} }));
  }, []);

  const clearSource = useCallback(() => {
    setState((prev) => ({ ...prev, picked: null, quickActions: [], edits: {} }));
  }, []);

  const setCount = useCallback((n: number) => {
    setState((prev) => {
      const count = clampCount(n);
      if (count === prev.count) return prev;
      // Shrinking N can orphan per-variation targets — drop the out-of-range
      // ones rather than sending indexes the batch has no item for.
      const edits: VariationsFlowState["edits"] = {};
      for (const [key, edit] of Object.entries(prev.edits)) {
        if (!edit) continue;
        const element = key as VariationElementId;
        const next: VariationEdit = { ...edit };
        if (next.variationIndexes) {
          next.variationIndexes = next.variationIndexes.filter((i) => i < count);
        }
        if (next.byIndex) {
          // Shrinking orphans indexes the batch has no item for; growing leaves
          // the new ones with no entry at all, which read as seeded in the UI
          // but submitted nothing. Both directions are reconciled here.
          const seed = analysisRef.current
            ? getVariationElement(element).promptFrom(analysisRef.current)
            : "";
          next.byIndex = Object.fromEntries(
            Array.from({ length: count }, (_, i) => [i, next.byIndex?.[i] ?? seed]),
          );
        }
        edits[element] = next;
      }
      return { ...prev, count, edits };
    });
  }, []);

  const toggleQuickAction = useCallback((element: VariationElementId) => {
    setState((prev) => {
      const on = prev.quickActions.includes(element);
      // Symmetric with beginEdit dropping the quick action: one element cannot
      // both be handed to Genie AND carry a hand-written instruction. Turning
      // the quick action on REPLACES the manual edit rather than hiding it —
      // the UI says "replaces your instruction", so it has to actually do it.
      const edits = { ...prev.edits };
      if (!on) delete edits[element];
      return {
        ...prev,
        edits,
        quickActions: on
          ? prev.quickActions.filter((e) => e !== element)
          : [...prev.quickActions, element],
      };
    });
  }, []);

  const isQuickAction = useCallback(
    (element: VariationElementId) => state.quickActions.includes(element),
    [state.quickActions],
  );

  /**
   * Going manual supersedes the same element's quick action — one element
   * cannot both "change it for me" and carry a hand-written prompt.
   */
  const beginEdit = useCallback(
    (element: VariationElementId, scope: EditScope) => {
      setState((prev) => {
        const seed = analysis ? getVariationElement(element).promptFrom(analysis) : "";
        const existing = prev.edits[element];
        // Scope is a view onto the same edit, so switching away and back must
        // not destroy what the user typed in the other scope's fields. Only
        // `scope` decides which of them is authoritative at generate time.
        const edit: VariationEdit = {
          element,
          scope,
          prompt: existing?.prompt ?? seed,
          variationIndexes: existing?.variationIndexes ?? [0],
          byIndex:
            existing?.byIndex ??
            Object.fromEntries(Array.from({ length: prev.count }, (_, i) => [i, seed])),
        };
        return {
          ...prev,
          quickActions: prev.quickActions.filter((e) => e !== element),
          edits: { ...prev.edits, [element]: edit },
        };
      });
    },
    [analysis],
  );

  const setEditScope = useCallback(
    (element: VariationElementId, scope: EditScope) => beginEdit(element, scope),
    [beginEdit],
  );

  const setEditPrompt = useCallback((element: VariationElementId, prompt: string) => {
    setState((prev) => {
      const edit = prev.edits[element];
      if (!edit) return prev;
      return { ...prev, edits: { ...prev.edits, [element]: { ...edit, prompt } } };
    });
  }, []);

  const setEditIndexes = useCallback((element: VariationElementId, indexes: number[]) => {
    setState((prev) => {
      const edit = prev.edits[element];
      if (!edit) return prev;
      return {
        ...prev,
        edits: { ...prev.edits, [element]: { ...edit, variationIndexes: indexes } },
      };
    });
  }, []);

  const setEditPromptForIndex = useCallback(
    (element: VariationElementId, index: number, prompt: string) => {
      setState((prev) => {
        const edit = prev.edits[element];
        if (!edit) return prev;
        return {
          ...prev,
          edits: {
            ...prev.edits,
            [element]: { ...edit, byIndex: { ...(edit.byIndex ?? {}), [index]: prompt } },
          },
        };
      });
    },
    [],
  );

  const cancelEdit = useCallback((element: VariationElementId) => {
    setState((prev) => {
      if (!prev.edits[element]) return prev;
      const edits = { ...prev.edits };
      delete edits[element];
      return { ...prev, edits };
    });
  }, []);

  const editFor = useCallback(
    (element: VariationElementId) => state.edits[element],
    [state.edits],
  );

  const touchedElements = useMemo<VariationElementId[]>(() => {
    // A "multiple"-scoped edit targeting no variation applies to nothing, so it
    // is not a change — it must not read as one, and must not be charged for.
    const manual = (Object.keys(state.edits) as VariationElementId[]).filter((e) => {
      const edit = state.edits[e];
      if (!edit) return false;
      if (edit.scope === "multiple") return (edit.variationIndexes?.length ?? 0) > 0;
      return true;
    });
    return [...state.quickActions, ...manual.filter((e) => !state.quickActions.includes(e))];
  }, [state.quickActions, state.edits]);

  const hasChanges = touchedElements.length > 0;

  const credits = useMemo(() => {
    const lines: CreditLine[] = [
      { label: "Variations", factor: state.count, op: "base" },
      { label: "Per variation", factor: VARIATION_CREDITS_PER_ITEM, op: "multiply" },
    ];
    // Each element the run has to re-derive costs more than a plain copy.
    if (touchedElements.length > 0) {
      lines.push({
        label: touchedElements.length === 1 ? "1 element changed" : `${touchedElements.length} elements changed`,
        factor: 1 + touchedElements.length * 0.25,
        op: "multiply",
      });
    }
    const { total } = computeBreakdown(lines);
    return { lines, total, overdrawn: exceedsBalance(total) };
  }, [state.count, touchedElements]);

  const canGenerate = !!state.picked && !credits.overdrawn;

  const generate = useCallback(() => {
    if (!state.picked || !analysis) return;
    const title = analysis.source.title;
    const changed = touchedElements.map((e) => getVariationElement(e).label);
    const batchId = startBatch({
      origin: originFor(state.picked, title),
      label: changed.length
        ? `${title} · ${state.count} variations · ${changed.join(", ")}`
        : `${title} · ${state.count} variations`,
      stages: VARIATION_STAGES,
      count: state.count,
      creditsPerItem: VARIATION_CREDITS_PER_ITEM,
      creditsTotal: credits.total,
      config: {
        // An element the run is CHANGING must not be recorded as the value it
        // is changing away from — the Library panel would then state the exact
        // opposite of what was asked for.
        angle: touchedElements.includes("angle") ? undefined : (analysis.angle.value ?? undefined),
        approach: analysis.approach.value ?? undefined,
        language: touchedElements.includes("language")
          ? undefined
          : (analysis.language.value ?? undefined),
        aspectRatio: touchedElements.includes("aspect-ratio")
          ? undefined
          : (analysis.aspectRatio.value ?? undefined),
        brandName: analysis.source.competitorOwned ? undefined : (analysis.entityName.value ?? undefined),
        promptSnippet: promptSnippetFor(touchedElements, state),
      },
      itemSeed: (i) => ({ title: `Variation ${i + 1}` }),
    });
    navigate(`/iq/genie6/studio-alpha/results?batch=${batchId}`);
  }, [state, analysis, touchedElements, credits.total, navigate]);

  return {
    state,
    pick,
    clearSource,
    setCount,
    analysis,
    recommendations,
    toggleQuickAction,
    isQuickAction,
    beginEdit,
    setEditScope,
    setEditPrompt,
    setEditIndexes,
    setEditPromptForIndex,
    cancelEdit,
    editFor,
    hasChanges,
    touchedElements,
    credits,
    canGenerate,
    generate,
  };
}
