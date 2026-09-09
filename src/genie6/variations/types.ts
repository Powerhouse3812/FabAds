import type { FlowModuleKey, FlowSourceRef } from "../flows/flowTypes";
import type { OutputData } from "../types/output";

/**
 * Generate Variations — the shared contract (Part 1: WHOLE AD).
 *
 * Replaces the "Custom" Mode card on Studio Home. Locked flow shape:
 *   1. pick ONE source whole ad (inline picker)
 *   2. ask how many variations (N) — BEFORE any analysis is shown
 *   3. show the analysis overview of what was detected
 *   4. offer 3-4 contextual recommended actions derived from (3)
 *   5. a recommended action applies to all N with no scope question; only
 *      going MANUAL on an element raises the All / Multiple / Individual
 *      scope selector and then exposes that element's prompt as text
 *   6. Generate fires the run store directly and lands on the results queue
 *
 * Two UI versions render this identical logic — A (one inline screen) and
 * B (2-3 sequential steps) — selected by `?ui=a|b`. Neither owns any rule:
 * everything decidable lives in `data/` so the versions cannot disagree.
 *
 * PART 2 (asset variations) IS NOT IN SCOPE and nothing here anticipates it.
 */

/* ------------------------------------------------------------------ source */

/** An uploaded ad — carries no catalogue provenance whatsoever by nature. */
export interface UploadedAdStub {
  id: string;
  name: string;
  previewUrl?: string;
  mediaType: "image" | "video";
}

/** What the picker hands over. Discriminated so the analyser never guesses. */
export type PickedSource =
  | { kind: "genie-output"; output: OutputData }
  | { kind: "flow-ref"; ref: FlowSourceRef }
  | { kind: "upload"; file: UploadedAdStub };

export type VariationSourceKind = PickedSource["kind"];

/** Normalised, display-ready identity of the picked ad. */
export interface VariationSource {
  kind: VariationSourceKind;
  /** OutputData.id | FlowSourceRef.id | upload-local id. */
  id: string;
  title: string;
  subtitle?: string;
  thumbnail?: string;
  /** The overview's "Source" row, e.g. "Industry Insights" / "Uploaded". */
  originLabel: string;
  module?: FlowModuleKey;
  /** §7.2 — a rival's ad. Never treat its brand as the user's own. */
  competitorOwned?: boolean;
  sourceFormat?: "image" | "video" | "carousel" | "flexible";
}

/* ---------------------------------------------------------------- analysis */

/** The Type row's six reportable values. "not-found" renders as "N/F". */
export type AdTypeKind =
  | "brand"
  | "product"
  | "category"
  | "category-product"
  | "other"
  | "not-found";

/**
 * How a value was arrived at — drives the chip beside it, so a real stored
 * fact can never be mistaken for a derived one.
 *   stored     — read off the output/batch/ref as-is
 *   detected   — derived (deterministically, keyed off the ad id) because the
 *                data model doesn't persist it. Maalik's call, 2026-09-09.
 *   not-found  — genuinely absent. Renders "N/F", never a fabricated value.
 */
export type FieldProvenance = "stored" | "detected" | "not-found";

export interface AnalysedField<T = string> {
  value: T | null;
  provenance: FieldProvenance;
  /** Second line: avatar personality, voice tone. Never a value substitute. */
  detail?: string | null;
}

/**
 * The overview's ten rows, in display order. `angle`+`concept` and `approach`
 * are alternates on one row — the overview shows angle+concept when either is
 * present and falls back to approach otherwise.
 */
export interface AdAnalysis {
  source: VariationSource;
  type: AnalysedField<AdTypeKind>;
  entityName: AnalysedField;
  angle: AnalysedField;
  concept: AnalysedField;
  approach: AnalysedField;
  avatar: AnalysedField;
  voice: AnalysedField;
  language: AnalysedField;
  script: AnalysedField;
  visualDirection: AnalysedField;
  aspectRatio: AnalysedField;
}

/* ---------------------------------------------------------------- elements */

/** Every element of an ad this flow can vary. Closed set — Part 1 only. */
export type VariationElementId =
  | "product"
  | "angle"
  | "concept"
  | "avatar"
  | "voice"
  | "language"
  | "script"
  | "visual-direction"
  | "aspect-ratio";

export interface VariationElementDef {
  id: VariationElementId;
  /** Noun, as the overview labels it: "Avatar". */
  label: string;
  /** Verb, as a quick action reads: "Change Avatar" / "Product Swap". */
  actionLabel: string;
  /** One plain line on what varying it does. No "Elevate"-class copy. */
  desc: string;
  /** lucide icon component. */
  Icon: React.ElementType;
  /** Which analysis row this element edits, for the "currently:" hint. */
  field: keyof Omit<AdAnalysis, "source">;
  /** Seeds the editable prompt text from what was detected. */
  promptFrom: (analysis: AdAnalysis) => string;
}

/* ------------------------------------------------------- recommendations */

/**
 * A contextual quick action. 3-4 are offered, chosen per-case from what the
 * analysis actually found — never a fixed set.
 */
export interface RecommendedAction {
  element: VariationElementId;
  /** Reuses the element's `actionLabel` unless the case wants sharper copy. */
  label: string;
  /** Why this is being suggested, grounded in the detection. One short line. */
  reason: string;
}

/* -------------------------------------------------------------- the edits */

/**
 * Scope of a MANUAL edit. Only raised when the user goes manual on an
 * element — a recommended action never asks this (it applies to all N).
 */
export type EditScope = "all" | "multiple" | "individual";

export interface VariationEdit {
  element: VariationElementId;
  scope: EditScope;
  /** "all" and "multiple" share one prompt. Unused for "individual". */
  prompt?: string;
  /** "multiple" only — zero-based variation indexes the prompt applies to. */
  variationIndexes?: number[];
  /** "individual" only — one prompt per variation index. */
  byIndex?: Record<number, string>;
}

/* --------------------------------------------------------------- ui state */

export type VariationsUiVersion = "a" | "b";

export interface VariationsFlowState {
  /** null until the picker resolves — gates everything downstream. */
  picked: PickedSource | null;
  /** Owned by the shared stepper contract: min 1, max 20, default 4. */
  count: number;
  /** Quick actions tapped. Applied to all N, stackable, no scope question. */
  quickActions: VariationElementId[];
  /** Manual edits, keyed by element id. */
  edits: Partial<Record<VariationElementId, VariationEdit>>;
}
