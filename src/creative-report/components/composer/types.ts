/**
 * Element composer — shared types (replaces Brief Builder, see composerConfig
 * doc-comment in elementMeta.ts for the full rationale).
 *
 * The composer holds one `ElementPick` per slot. Only one creative can supply
 * a given slot at a time — picking a second Hook replaces the first, which is
 * why `ComposerState` is keyed by ElementKey rather than a list.
 */

/** Every pickable element, per Maalik's settled list. "media" = asset only,
 *  no copy. "framework" is analysis-gated (see frameworkGate.ts). */
export type ElementKey =
  | "hook"
  | "headline"
  | "primaryText"
  | "cta"
  | "visualDirection"
  | "offer"
  | "media"
  | "framework";

export const ELEMENT_ORDER: ElementKey[] = [
  "hook",
  "headline",
  "primaryText",
  "cta",
  "visualDirection",
  "offer",
  "media",
  "framework",
];

export const ELEMENT_LABELS: Record<ElementKey, string> = {
  hook: "Hook",
  headline: "Headline",
  primaryText: "Primary text",
  cta: "CTA",
  visualDirection: "Visual direction",
  offer: "Offer",
  media: "Media only",
  framework: "Framework",
};

/** One assembled slot. Carries the source creative's REAL folded metrics
 *  (never invented) so the composer can show honest context next to the
 *  pick without re-deriving anything — CompareColumn already has these
 *  folded numbers, so they're threaded straight through. */
export interface ElementPick {
  key: ElementKey;
  creativeId: string;
  creativeName: string;
  sourceRoas: number;
  sourceSpend: number;
  /** Editable text value. Undefined for "media" (asset-only — no copy to
   *  edit) and for a locked/never-set "framework". */
  value?: string;
  /** True once the buyer has hand-edited the pre-filled value — mirrors
   *  Brief Builder's touched-tracking so re-picking never clobbers an edit
   *  the buyer already made to a DIFFERENT slot. */
  edited?: boolean;
}

export type ComposerState = Partial<Record<ElementKey, ElementPick>>;

/** Mirrors the in-flight analysisStore's per-creative state shape (see
 *  frameworkGate.ts) — defined here so both the gate adapter and
 *  CompareColumn's props can reference one type without a circular import. */
export type AnalysisStatus = "idle" | "analysing" | "analysed";

/** Everything CompareColumn needs to render per-element pick affordances,
 *  bundled into one prop so the column's signature stays small. Omitted
 *  entirely in contexts-mode (no single source `creative` to pick from). */
export interface ColumnComposerProps {
  picks: ComposerState;
  /** This creative's analysis state — gates the Framework chip only. */
  frameworkStatus: AnalysisStatus;
  /** Whether the mock credit balance can cover a reveal right now — shown
   *  in the locked Framework tooltip so "Run analysis to use" is never a
   *  dead end (credits, not just gating). */
  canRunAnalysis: boolean;
  onPickText: (key: ElementKey, value: string) => void;
  onPickMedia: () => void;
  onPickFramework: () => void;
  onPickWholeAd: () => void;
  /** Kicks off the real credit-gated analysis for this creative. */
  onRunAnalysis: () => void;
}
