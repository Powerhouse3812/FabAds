import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { exceedsBalance, type CreditLine } from "../../lib/credits";
import { startBatch } from "../../lib/genieRunStore";
import type { RunOrigin } from "../../lib/genieRunTypes";
import { analyseAd } from "../data/analyseAd";
import { analyseAsset } from "../data/analyseAsset";
import { recommendedActionsFor } from "../data/recommendedActions";
import { assetRecommendationsFor } from "../data/assetRecommendations";
import type {
  AdAnalysis,
  AdTypeKind,
  AssetAnalysis,
  EntitySelection,
  PickedThing,
  RecommendedAction,
  VariationCardState,
  VariationCardSummary,
  VariationsFlowState,
} from "../types";

/**
 * useVariationsFlow — the spine of Generate Variations.
 *
 * REDESIGNED 2026-09-10. Two rulings reshaped it:
 *
 *   1. "Source can be anything, but the generation will be always Whole Ad."
 *      An asset source is read and produces ads, so there is no output-kind
 *      decision left, no free path, and no `RunBatch.target` to set. Asset
 *      *generation* moved to its own coming-soon Other Apps.
 *   2. Raising the count spawns one CARD per variation, each carrying the
 *      wizard's real configuration section prefilled from the source. So the
 *      All / Multiple / Individually scope model is gone — an edit no longer
 *      needs a scope once every variation is its own editable card.
 *
 * WHY THIS HOOK DOES NOT OWN THE CARDS' CONFIG: each card mounts its own
 * `useWizard`, because `ContextOverviewBand` / `PromptReferenceBar` /
 * `useStudioContextSummary` all require a real `UseWizardReturn` and faking a
 * lighter shape would mean maintaining a parallel copy of the wizard's API.
 * `useWizard` is plain `useState`, so N instances are safe; the singletons are
 * `useStudioAlphaUrlSync` (owns ~18 unqualified query params) and Configure's
 * `?picker=` modal identity, neither of which a card uses.
 *
 * This hook therefore holds only what the PARENT needs: the source, the count,
 * the card list, and the summaries cards report up for pricing and the payload.
 */

/** The shared count contract (NumberStepper): min 1, max 20, default 4. */
export const COUNT_MIN = 1;
export const COUNT_MAX = 20;
export const COUNT_DEFAULT = 4;

/** §18 stage names — names, never a fixed ETA. */
export const VARIATION_STAGES = ["Queued", "Reading the source", "Generating", "Finishing"];

/** Nominal per-item rate. Every run produces ads now, so there is one rate. */
export const VARIATION_CREDITS_PER_ITEM = 4;

let cardSeq = 0;
function newCardId(): string {
  cardSeq += 1;
  return `card-${cardSeq}`;
}

function freshCard(): VariationCardState {
  return { id: newCardId(), adType: null };
}

function clampCount(n: number): number {
  if (Number.isNaN(n)) return COUNT_DEFAULT;
  return Math.max(COUNT_MIN, Math.min(COUNT_MAX, Math.round(n)));
}

/** Where the batch says it came from, honestly per source kind. */
function originFor(picked: PickedThing, title: string): RunOrigin {
  if (picked.family === "asset") {
    const kind = picked.asset.kind;
    if (kind === "uploaded-asset" || kind === "pasted-asset") return { kind: "upload" };
    return { kind: "studio" };
  }
  const ad = picked.ad;
  if (ad.kind === "upload") return { kind: "upload" };
  if (ad.kind === "flow-ref") {
    return { kind: "flow", module: ad.ref.module, action: "generate-variation", refTitle: title };
  }
  return { kind: "studio" };
}

/**
 * The run's instructions as one readable snippet. `RunBatch.config` has no
 * per-card shape, so without this every card's configuration would be dropped
 * at generate time and the Library would describe a run nobody asked for.
 */
function promptSnippetFor(state: VariationsFlowState): string | undefined {
  const parts = state.cards
    .map((card, i) => {
      const s = state.summaries[card.id];
      if (!s) return null;
      const bits = [
        s.adType ?? undefined,
        s.format ?? undefined,
        s.angle ?? undefined,
        s.hasScript ? "scripted" : undefined,
        s.prompt?.trim() ? `"${s.prompt.trim().slice(0, 60)}"` : undefined,
      ].filter(Boolean);
      return bits.length ? `#${i + 1} ${bits.join(" · ")}` : null;
    })
    .filter(Boolean);
  return parts.length ? parts.join(" | ") : undefined;
}

export interface UseVariationsFlowReturn {
  state: VariationsFlowState;

  /** The picker modal resolved. Resets everything downstream. */
  pick: (picked: PickedThing) => void;
  clearSource: () => void;

  /** Raising this appends cards; lowering truncates from the end. */
  setCount: (n: number) => void;

  /** Which family the SOURCE is. The output is always an ad either way. */
  family: "ad" | "asset" | null;
  analysis: AdAnalysis | null;
  assetAnalysis: AssetAnalysis | null;

  /** 3-4 contextual suggestions from the source analysis, shown on every card. */
  recommendations: RecommendedAction[];

  /** One per variation, always `count` long. */
  cards: VariationCardState[];
  /** The per-card ad-type override. null = follow the card's own entity. */
  setCardAdType: (cardId: string, adType: AdTypeKind | null) => void;
  /** A card reporting its config upward, for pricing and the payload. */
  reportCardSummary: (summary: VariationCardSummary) => void;

  entity: EntitySelection;
  setEntity: (next: EntitySelection) => void;

  credits: { lines: CreditLine[]; total: number; overdrawn: boolean };
  canGenerate: boolean;
  generate: () => void;
}

export function useVariationsFlow(): UseVariationsFlowReturn {
  const navigate = useNavigate();
  const [state, setState] = useState<VariationsFlowState>(() => ({
    picked: null,
    count: COUNT_DEFAULT,
    cards: Array.from({ length: COUNT_DEFAULT }, freshCard),
    summaries: {},
    entity: {},
  }));

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

  /** A new source invalidates the analysis every card was seeded from, so the
   *  cards are rebuilt — new ids, so their wizards remount on the new source. */
  const pick = useCallback((picked: PickedThing) => {
    setState((prev) => ({
      ...prev,
      picked,
      cards: Array.from({ length: prev.count }, freshCard),
      summaries: {},
      entity: {},
    }));
  }, []);

  const clearSource = useCallback(() => {
    setState((prev) => ({
      ...prev,
      picked: null,
      cards: Array.from({ length: prev.count }, freshCard),
      summaries: {},
      entity: {},
    }));
  }, []);

  const setCount = useCallback((n: number) => {
    setState((prev) => {
      const count = clampCount(n);
      if (count === prev.count) return prev;
      // Keep the cards the user already tuned: append or truncate at the end
      // rather than rebuilding the list, so existing ids — and the wizard
      // state mounted under them — survive a count change.
      const cards =
        count > prev.cards.length
          ? [...prev.cards, ...Array.from({ length: count - prev.cards.length }, freshCard)]
          : prev.cards.slice(0, count);
      const keep = new Set(cards.map((c) => c.id));
      const summaries = Object.fromEntries(
        Object.entries(prev.summaries).filter(([id]) => keep.has(id)),
      );
      return { ...prev, count, cards, summaries };
    });
  }, []);

  const setCardAdType = useCallback((cardId: string, adType: AdTypeKind | null) => {
    setState((prev) => ({
      ...prev,
      cards: prev.cards.map((c) => (c.id === cardId ? { ...c, adType } : c)),
    }));
  }, []);

  const reportCardSummary = useCallback((summary: VariationCardSummary) => {
    setState((prev) => {
      const existing = prev.summaries[summary.id];
      // Cards report on every wizard change; bail when nothing moved so a
      // report can't loop back into a re-render of the card that sent it.
      if (existing && shallowEqualSummary(existing, summary)) return prev;
      return { ...prev, summaries: { ...prev.summaries, [summary.id]: summary } };
    });
  }, []);

  const setEntity = useCallback((next: EntitySelection) => {
    setState((prev) => ({ ...prev, entity: next }));
  }, []);

  /**
   * The run costs the SUM of what each card costs — and each card prices
   * itself with `buildCreditLines`, the same formula the wizard's own prompt
   * bar quotes inside it.
   *
   * This replaced a flat `VARIATION_CREDITS_PER_ITEM × count`, which made the
   * card say "1 credit" while this rail said "16" for the same run. §21.2
   * exists for exactly that defect: ONE credit formula, so two surfaces can
   * never disagree. A card that hasn't reported yet falls back to the nominal
   * rate so the rail is never blank mid-mount.
   */
  const credits = useMemo(() => {
    let reported = 0;
    let pending = 0;
    for (const card of state.cards) {
      const total = state.summaries[card.id]?.creditsTotal;
      if (typeof total === "number") reported += total;
      else pending += 1;
    }
    const total = reported + pending * VARIATION_CREDITS_PER_ITEM;
    const lines: CreditLine[] = [
      { label: `${state.count} variation${state.count === 1 ? "" : "s"}`, factor: total, op: "base" },
    ];
    return { lines, total, overdrawn: exceedsBalance(total) };
  }, [state.cards, state.summaries, state.count]);

  const canGenerate = !!state.picked && !credits.overdrawn;

  const generate = useCallback(() => {
    if (!state.picked) return;
    const live = analysis ?? assetAnalysis;
    if (!live) return;
    const title = live.source.title;

    const batchId = startBatch({
      origin: originFor(state.picked, title),
      label: `${title} · ${state.count} variation${state.count === 1 ? "" : "s"}`,
      stages: VARIATION_STAGES,
      count: state.count,
      creditsPerItem: VARIATION_CREDITS_PER_ITEM,
      creditsTotal: credits.total,
      // No `target`: every run produces ads now, and absent means "ad".
      config: {
        language: live.language.value ?? undefined,
        brandName: live.source.competitorOwned
          ? undefined
          : (live.entityName.value ?? undefined),
        promptSnippet: promptSnippetFor(state),
      },
      itemSeed: (i) => ({ title: `Variation ${i + 1}` }),
    });
    navigate(`/iq/genie6/studio-alpha/results?batch=${batchId}`);
  }, [state, analysis, assetAnalysis, credits.total, navigate]);

  return {
    state,
    pick,
    clearSource,
    setCount,
    family,
    analysis,
    assetAnalysis,
    recommendations,
    cards: state.cards,
    setCardAdType,
    reportCardSummary,
    entity: state.entity,
    setEntity,
    credits,
    canGenerate,
    generate,
  };
}

function shallowEqualSummary(a: VariationCardSummary, b: VariationCardSummary): boolean {
  return (
    a.adType === b.adType &&
    a.format === b.format &&
    a.angle === b.angle &&
    a.conceptCount === b.conceptCount &&
    a.hasScript === b.hasScript &&
    a.prompt === b.prompt &&
    a.model === b.model &&
    a.aspectRatio === b.aspectRatio
  );
}
