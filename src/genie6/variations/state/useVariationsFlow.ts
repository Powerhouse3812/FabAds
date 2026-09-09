import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { computeBreakdown, exceedsBalance, type CreditLine } from "../../lib/credits";
import { startBatch } from "../../lib/genieRunStore";
import type { RunOrigin } from "../../lib/genieRunTypes";
import { analyseAd } from "../data/analyseAd";
import { analyseAsset } from "../data/analyseAsset";
import { recommendedActionsFor } from "../data/recommendedActions";
import { assetRecommendationsFor } from "../data/assetRecommendations";
import { getVariationElement } from "../data/variationElements";
import { assetElementsFor, getAssetElement } from "../data/assetElements";
import { brands } from "@/mocks/shared/brands";
import { products } from "@/mocks/shared/products";
import type {
  AdAnalysis,
  AnyElementId,
  AssetAnalysis,
  AssetElementDef,
  AssetOutputKind,
  EditScope,
  EntitySelection,
  PickedThing,
  RecommendedAction,
  VariationEdit,
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
  pick: (picked: PickedThing) => void;
  clearSource: () => void;

  /** Step 2 — how many variations. Clamped to the shared bounds. */
  setCount: (n: number) => void;

  /** Which family this run is varying. null until a source exists. */
  family: "ad" | "asset" | null;

  /** Step 3 — set only on an AD run. The two analyses report different rows,
   *  so they stay separate rather than collapsing into a lossy shared shape. */
  analysis: AdAnalysis | null;
  /** Step 3 — set only on an ASSET run. */
  assetAnalysis: AssetAnalysis | null;

  /** Step 4 — 3-4 contextual actions from whichever analysis is live. */
  recommendations: RecommendedAction[];

  /** The elements an asset run can vary. Empty on an ad run, which uses
   *  VARIATION_ELEMENTS directly. Narrowed by asset kind (no framework on a
   *  concept), so the screen never offers something the kind can't do. */
  assetElements: AssetElementDef[];

  /** A quick action applies to all N and asks nothing. Tap again to drop it. */
  toggleQuickAction: (element: AnyElementId) => void;
  isQuickAction: (element: AnyElementId) => boolean;

  /**
   * Step 5 — going MANUAL on an element. Raises the scope selector, then the
   * element's prompt becomes editable text seeded from the detection.
   */
  beginEdit: (element: AnyElementId, scope: EditScope) => void;
  setEditScope: (element: AnyElementId, scope: EditScope) => void;
  setEditPrompt: (element: AnyElementId, prompt: string) => void;
  setEditIndexes: (element: AnyElementId, indexes: number[]) => void;
  setEditPromptForIndex: (element: AnyElementId, index: number, prompt: string) => void;
  cancelEdit: (element: AnyElementId) => void;
  editFor: (element: AnyElementId) => VariationEdit | undefined;

  /** Asset runs only — the Brand/Product/Category these are for. Empty = Auto. */
  setEntity: (next: EntitySelection) => void;

  /** True once anything at all has been asked for beyond the plain N copies. */
  hasChanges: boolean;
  /** Every element the run will touch — quick actions plus manual edits. */
  touchedElements: AnyElementId[];

  /**
   * What the run produces. null on an ad run (it produces ads).
   *
   * A script gains visuals ⇒ it comes back as a STORYBOARD. That is the
   * owner's ruling that a storyboard is a script with visual directions, and
   * it is the one place the flow's output type is decided.
   */
  outputKind: AssetOutputKind | null;

  /** Asset generation is free (`isFreeGeneration` in useWizard.ts). */
  free: boolean;
  credits: { lines: CreditLine[]; total: number; overdrawn: boolean };

  canGenerate: boolean;
  generate: () => void;
}

function clampCount(n: number): number {
  if (Number.isNaN(n)) return COUNT_DEFAULT;
  return Math.max(COUNT_MIN, Math.min(COUNT_MAX, Math.round(n)));
}

/** Where the batch says it came from, honestly per source kind. */
function originFor(picked: PickedThing, title: string): RunOrigin {
  if (picked.family === "asset") {
    // An uploaded or pasted asset is the user's own file/text; a saved or
    // generated one was already theirs inside Genie.
    const kind = picked.asset.kind;
    if (kind === "uploaded-asset" || kind === "pasted-asset") return { kind: "upload" };
    return { kind: "studio" };
  }
  const ad = picked.ad;
  if (ad.kind === "upload") return { kind: "upload" };
  if (ad.kind === "flow-ref") {
    return {
      kind: "flow",
      module: ad.ref.module,
      action: "generate-variation",
      refTitle: title,
    };
  }
  // Varying Genie's own output didn't arrive from another module, so claiming
  // a flow module would put a source on the batch the user never picked.
  return { kind: "studio" };
}

/**
 * What an asset run comes back as.
 *
 * The owner's ruling (2026-09-09): "Storyboard is nothing but script with
 * visual directions." So a script that gains visuals produces STORYBOARDS,
 * and this is the only place that decides it — the screen reads it, never
 * re-derives it. A concept stays a concept; visuals are part of its own shape
 * already and turning one into a storyboard was never asked for.
 */
function resolveOutputKind(
  analysis: AssetAnalysis,
  touched: AnyElementId[],
): AssetOutputKind {
  if (analysis.assetKind === "concept") return "concept";
  if (analysis.assetKind === "storyboard") return "storyboard";
  const gainsVisuals = analysis.hasVisuals || touched.includes("visual-direction");
  return gainsVisuals ? "storyboard" : "script";
}

/** Item title for an asset run, e.g. "Storyboard 3". */
function assetKindTitle(kind: AssetOutputKind): string {
  return kind === "script" ? "Script" : kind === "concept" ? "Concept" : "Storyboard";
}

/**
 * The brand the user attached, if any — a product implies its own brand.
 * Returns undefined for an empty selection, which means Auto rather than
 * "no brand", so the caller falls back to whatever the source carried.
 */
function entityBrandName(entity: EntitySelection): string | undefined {
  if (entity.brandId) return brands.find((b) => b.id === entity.brandId)?.name;
  if (entity.productId) {
    const product = products.find((p) => p.id === entity.productId);
    if (product) return brands.find((b) => b.id === product.brandId)?.name;
  }
  return undefined;
}

/** Label for an element in either family — the registries are separate. */
function elementLabel(element: AnyElementId, family: "ad" | "asset"): string {
  return family === "asset"
    ? getAssetElement(element as never).label
    : getVariationElement(element as never).label;
}

/**
 * The instructions the run is actually carrying, as one readable snippet.
 *
 * `RunBatch.config` has no per-element/per-variation shape, so without this
 * every scope, subset and typed prompt was dropped at generate time and the
 * Library's provenance panel described a run nobody asked for.
 */
function promptSnippetFor(
  elements: AnyElementId[],
  state: VariationsFlowState,
  family: "ad" | "asset",
): string | undefined {
  if (elements.length === 0) return undefined;
  return elements
    .map((element) => {
      const label = elementLabel(element, family);
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
    entity: {},
  });

  const family = state.picked?.family ?? null;

  const analysis = useMemo(
    () => (state.picked?.family === "ad" ? analyseAd(state.picked.ad) : null),
    [state.picked],
  );

  const assetAnalysis = useMemo(
    () => (state.picked?.family === "asset" ? analyseAsset(state.picked.asset) : null),
    [state.picked],
  );

  const recommendations = useMemo(() => {
    if (analysis) return recommendedActionsFor(analysis);
    if (assetAnalysis) return assetRecommendationsFor(assetAnalysis);
    return [];
  }, [analysis, assetAnalysis]);

  const assetElements = useMemo(
    () => (assetAnalysis ? assetElementsFor(assetAnalysis.assetKind) : []),
    [assetAnalysis],
  );

  /**
   * Seeds an element's editable prompt from whichever analysis is live.
   * `setCount` and `beginEdit` both need it, and a second copy of this choice
   * is how the two would drift.
   */
  const seedRef = useRef<(element: AnyElementId) => string>(() => "");
  seedRef.current = (element: AnyElementId) => {
    if (assetAnalysis) return getAssetElement(element as never).promptFrom(assetAnalysis);
    if (analysis) return getVariationElement(element as never).promptFrom(analysis);
    return "";
  };

  /** A new source invalidates the analysis, so the choices made against it go
   *  too — including the entity, which was chosen for a different asset. */
  const pick = useCallback((picked: PickedThing) => {
    setState((prev) => ({ ...prev, picked, quickActions: [], edits: {}, entity: {} }));
  }, []);

  const clearSource = useCallback(() => {
    setState((prev) => ({ ...prev, picked: null, quickActions: [], edits: {}, entity: {} }));
  }, []);

  const setEntity = useCallback((next: EntitySelection) => {
    setState((prev) => ({ ...prev, entity: next }));
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
        const element = key as AnyElementId;
        const next: VariationEdit = { ...edit };
        if (next.variationIndexes) {
          next.variationIndexes = next.variationIndexes.filter((i) => i < count);
        }
        if (next.byIndex) {
          // Shrinking orphans indexes the batch has no item for; growing leaves
          // the new ones with no entry at all, which read as seeded in the UI
          // but submitted nothing. Both directions are reconciled here.
          const seed = seedRef.current(element);
          next.byIndex = Object.fromEntries(
            Array.from({ length: count }, (_, i) => [i, next.byIndex?.[i] ?? seed]),
          );
        }
        edits[element] = next;
      }
      return { ...prev, count, edits };
    });
  }, []);

  const toggleQuickAction = useCallback((element: AnyElementId) => {
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
    (element: AnyElementId) => state.quickActions.includes(element),
    [state.quickActions],
  );

  /**
   * Going manual supersedes the same element's quick action — one element
   * cannot both "change it for me" and carry a hand-written prompt.
   */
  const beginEdit = useCallback(
    (element: AnyElementId, scope: EditScope) => {
      setState((prev) => {
        const seed = seedRef.current(element);
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
    // Seeding goes through `seedRef`, which is refreshed on every render, so
    // this stays stable while still reading the live analysis.
    [],
  );

  const setEditScope = useCallback(
    (element: AnyElementId, scope: EditScope) => beginEdit(element, scope),
    [beginEdit],
  );

  const setEditPrompt = useCallback((element: AnyElementId, prompt: string) => {
    setState((prev) => {
      const edit = prev.edits[element];
      if (!edit) return prev;
      return { ...prev, edits: { ...prev.edits, [element]: { ...edit, prompt } } };
    });
  }, []);

  const setEditIndexes = useCallback((element: AnyElementId, indexes: number[]) => {
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
    (element: AnyElementId, index: number, prompt: string) => {
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

  const cancelEdit = useCallback((element: AnyElementId) => {
    setState((prev) => {
      if (!prev.edits[element]) return prev;
      const edits = { ...prev.edits };
      delete edits[element];
      return { ...prev, edits };
    });
  }, []);

  const editFor = useCallback(
    (element: AnyElementId) => state.edits[element],
    [state.edits],
  );

  const touchedElements = useMemo<AnyElementId[]>(() => {
    // A "multiple"-scoped edit targeting no variation applies to nothing, so it
    // is not a change — it must not read as one, and must not be charged for.
    const manual = (Object.keys(state.edits) as AnyElementId[]).filter((e) => {
      const edit = state.edits[e];
      if (!edit) return false;
      if (edit.scope === "multiple") return (edit.variationIndexes?.length ?? 0) > 0;
      return true;
    });
    return [...state.quickActions, ...manual.filter((e) => !state.quickActions.includes(e))];
  }, [state.quickActions, state.edits]);

  const hasChanges = touchedElements.length > 0;

  /** Asset generation is free — the owner's ruling, encoded once in
   *  `isFreeGeneration` (useWizard.ts) and mirrored by family here. */
  const free = family === "asset";

  const outputKind = useMemo(
    () => (assetAnalysis ? resolveOutputKind(assetAnalysis, touchedElements) : null),
    [assetAnalysis, touchedElements],
  );

  const credits = useMemo(() => {
    // A free run still reports a breakdown, so the screen has one shape to
    // render — it just has no lines and no total to charge.
    if (free) return { lines: [] as CreditLine[], total: 0, overdrawn: false };
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
  }, [free, state.count, touchedElements]);

  const canGenerate = !!state.picked && !credits.overdrawn;

  const generate = useCallback(() => {
    if (!state.picked) return;
    const live = analysis ?? assetAnalysis;
    if (!live) return;
    const title = live.source.title;
    const fam = state.picked.family;
    const changed = touchedElements.map((e) => elementLabel(e, fam));
    const snippet = promptSnippetFor(touchedElements, state, fam);

    const noun =
      fam === "asset" && outputKind
        ? `${state.count} ${outputKind}${state.count === 1 ? "" : "s"}`
        : `${state.count} variations`;

    const batchId = startBatch({
      origin: originFor(state.picked, title),
      label: changed.length ? `${title} · ${noun} · ${changed.join(", ")}` : `${title} · ${noun}`,
      stages: VARIATION_STAGES,
      count: state.count,
      // Absent means "ad" (see RunBatch.target) — so only an asset run sets it.
      target: fam === "asset" ? (outputKind ?? undefined) : undefined,
      creditsPerItem: free ? 0 : VARIATION_CREDITS_PER_ITEM,
      creditsTotal: free ? 0 : credits.total,
      config:
        fam === "asset" && assetAnalysis
          ? {
              // An element the run is CHANGING must not be recorded as the
              // value it is changing away from — the Library panel would then
              // state the exact opposite of what was asked for.
              angle: touchedElements.includes("angle")
                ? undefined
                : (assetAnalysis.angle.value ?? undefined),
              language: touchedElements.includes("language")
                ? undefined
                : (assetAnalysis.language.value ?? undefined),
              // The entity is a control on an asset run, so what the user
              // chose wins over what the source happened to carry.
              brandName: entityBrandName(state.entity) ?? (assetAnalysis.entityName.value ?? undefined),
              promptSnippet: snippet,
            }
          : analysis
            ? {
                angle: touchedElements.includes("angle")
                  ? undefined
                  : (analysis.angle.value ?? undefined),
                approach: analysis.approach.value ?? undefined,
                language: touchedElements.includes("language")
                  ? undefined
                  : (analysis.language.value ?? undefined),
                aspectRatio: touchedElements.includes("aspect-ratio")
                  ? undefined
                  : (analysis.aspectRatio.value ?? undefined),
                brandName: analysis.source.competitorOwned
                  ? undefined
                  : (analysis.entityName.value ?? undefined),
                promptSnippet: snippet,
              }
            : undefined,
      itemSeed: (i) =>
        fam === "asset" && outputKind
          ? { title: `${assetKindTitle(outputKind)} ${i + 1}` }
          : { title: `Variation ${i + 1}` },
    });
    navigate(`/iq/genie6/studio-alpha/results?batch=${batchId}`);
  }, [
    state,
    analysis,
    assetAnalysis,
    touchedElements,
    outputKind,
    free,
    credits.total,
    navigate,
  ]);

  return {
    state,
    pick,
    clearSource,
    setCount,
    family,
    analysis,
    assetAnalysis,
    assetElements,
    setEntity,
    outputKind,
    free,
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
