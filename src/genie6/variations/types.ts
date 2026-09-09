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
 * Built as two competing UI versions; the inline one won (Maalik, 2026-09-09)
 * and the stepped one is gone. The screen still owns no rule — everything
 * decidable lives in `data/` and the state spine.
 *
 * PART 2 — ASSET VARIATIONS (same day, same owner) reuses every stage above.
 * A run varies EITHER a whole ad OR an asset; the two differ only in what the
 * analysis reports and which elements can be varied. See `AssetKind` below.
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

/** Every source kind, either family. `VariationSource` is shared by both. */
export type AnySourceKind = PickedSource["kind"] | PickedAsset["kind"];

/** Normalised, display-ready identity of the picked ad or asset. */
export interface VariationSource {
  kind: AnySourceKind;
  /** OutputData.id | FlowSourceRef.id | asset id | upload/paste-local id. */
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
  /** Either family's element — an asset run recommends "framework"/"entity". */
  element: AnyElementId;
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
  element: AnyElementId;
  scope: EditScope;
  /** "all" and "multiple" share one prompt. Unused for "individual". */
  prompt?: string;
  /** "multiple" only — zero-based variation indexes the prompt applies to. */
  variationIndexes?: number[];
  /** "individual" only — one prompt per variation index. */
  byIndex?: Record<number, string>;
}

/* ------------------------------------------------ PART 2: asset variations */

/**
 * The three asset kinds a run can vary.
 *
 * Storyboard is NOT a separate journey. Maalik, 2026-09-09: "Storyboard is
 * nothing but script with visual directions" — so a storyboard run is a
 * script run whose visual-direction element is mandatory and pre-filled,
 * where a script run leaves it optional. Adding visuals to a script
 * variation is what makes the output a storyboard (`assetOutputKind`).
 */
export type AssetKind = "script" | "concept" | "storyboard";

/** Free text the user pasted. No saved identity, so nothing to resolve. */
export interface PastedAssetStub {
  id: string;
  assetKind: AssetKind;
  title: string;
  body: string;
}

/** An uploaded .txt/.md, read into text. Same shape once it's in memory. */
export interface UploadedAssetStub {
  id: string;
  assetKind: AssetKind;
  name: string;
  body: string;
}

/**
 * What the asset picker hands over. Saved and generated assets travel as
 * (kind, id) and are resolved by `analyseAsset` — the rosters live in
 * different modules and re-resolving in one place beats four call sites
 * each carrying a different object shape.
 */
export type PickedAsset =
  | { kind: "saved-asset"; assetKind: AssetKind; id: string }
  | { kind: "generated-asset"; assetKind: AssetKind; id: string }
  | { kind: "uploaded-asset"; file: UploadedAssetStub }
  | { kind: "pasted-asset"; text: PastedAssetStub };

/**
 * A run varies EITHER a whole ad OR an asset, never both. The family is an
 * explicit discriminant rather than two nullable fields, because two
 * mutually-exclusive nullables is precisely the shape that produced the
 * Step-2 XOR defects in useWizard.ts.
 */
export type PickedThing =
  | { family: "ad"; ad: PickedSource }
  | { family: "asset"; asset: PickedAsset };

/** What an asset run produces. Visuals present ⇒ storyboards. */
export type AssetOutputKind = AssetKind;

/**
 * The asset overview's rows. Reuses `AnalysedField` and `AdTypeKind` so the
 * stored / Detected / N-F grammar is identical to the ad overview — a user
 * who learned it once does not relearn it here.
 *
 * Not every row applies to every kind: `framework` and `duration` are
 * script/storyboard only, `scenes` is storyboard only. An inapplicable row is
 * not the same as a missing one, so those come back `not-found` with the
 * overview deciding what to hide.
 */
export interface AssetAnalysis {
  source: VariationSource;
  assetKind: AssetKind;
  /** True when visual directions are present — drives the output kind. */
  hasVisuals: boolean;
  type: AnalysedField<AdTypeKind>;
  entityName: AnalysedField;
  angle: AnalysedField;
  concept: AnalysedField;
  framework: AnalysedField;
  visualDirection: AnalysedField;
  language: AnalysedField;
  duration: AnalysedField;
  /** Storyboard only — value is the scene count, `detail` a beat summary. */
  scenes: AnalysedField<number>;
  /** The asset's own words. Long; the overview clamps it. */
  body: AnalysedField;
}

/**
 * What can be varied on an asset (Maalik, 2026-09-09): angle, concept and
 * framework, plus visual direction — optional on a Script (adding it makes
 * the output a Storyboard), mandatory on a Storyboard. `entity` is the fourth
 * control rather than a read-only row: on an asset the Brand/Product/Category
 * is optional and the user may add, remove or change it.
 *
 * Deliberately NOT varyable: the body itself. You change the angle, concept or
 * framework and the new words follow from that.
 */
export type AssetElementId =
  | "angle"
  | "concept"
  | "framework"
  | "visual-direction"
  | "entity";

/** Either family's element id. Only one family is ever active in a run. */
export type AnyElementId = VariationElementId | AssetElementId;

/**
 * Asset twin of `VariationElementDef`. Separate rather than shared because
 * `promptFrom` reads a different analysis and three ids overlap by name —
 * "angle" on an ad and "angle" on a script seed different prompts.
 */
export interface AssetElementDef {
  id: AssetElementId;
  label: string;
  actionLabel: string;
  desc: string;
  Icon: React.ElementType;
  /** Which analysis row this edits. `entity` reads `type`/`entityName`. */
  field: keyof Omit<AssetAnalysis, "source" | "assetKind" | "hasVisuals">;
  /** Asset kinds this element applies to. Framework skips concept. */
  appliesTo: AssetKind[];
  /** True where the element cannot be removed — visuals on a storyboard. */
  mandatoryFor?: AssetKind[];
  promptFrom: (analysis: AssetAnalysis) => string;
}

/**
 * The entity an asset variation is for. Optional throughout — no selection
 * means Auto, inferred from the source (`TARGET_SPECS` in useWizard.ts marks
 * every asset target `entityRequired: false`).
 *
 * Category and product may be set together (the Performance-Ad shape); brand
 * is the third, independent choice. §7.2 still binds: a competitor's brand
 * must never be written here — it is display text on the analysis, never an id.
 */
export interface EntitySelection {
  brandId?: string | null;
  productId?: string | null;
  categoryId?: string | null;
}

/* --------------------------------------------------------------- ui state */

export interface VariationsFlowState {
  /** null until a picker resolves — gates everything downstream. */
  picked: PickedThing | null;
  /** Owned by the shared stepper contract: min 1, max 20, default 4. */
  count: number;
  /** Quick actions tapped. Applied to all N, stackable, no scope question. */
  quickActions: AnyElementId[];
  /** Manual edits, keyed by element id. */
  edits: Partial<Record<AnyElementId, VariationEdit>>;
  /** Asset runs only — the entity the variations are for. Empty = Auto. */
  entity: EntitySelection;
}
