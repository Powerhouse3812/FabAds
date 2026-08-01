/**
 * Creative Report 2.0 — annotation overlay (dev-only "why?" layer).
 *
 * A design/architecture annotation layer, NOT an end-user feature — same
 * Maalik-only convention as the nav-variant cycler and StatesSwitcher. When
 * "Annotate mode" is on, computed signals, metrics, and actions grow a small
 * "why?" dot that opens a popover documenting the payload below.
 *
 * The overlay is pure front-end — a static typed registry + a popover, zero
 * runtime computation. The ONLY field carrying backend thinking is `howTo`:
 * for a derived/ours-only number it describes the *optimised* way that number
 * would actually be produced (and `backend` tags the cost class). It's a
 * recommendation written to be feasible — never code that runs here.
 */

/** Where the number comes from. Omitted for pure actions/UI affordances. */
export type Provenance =
  | "meta-direct" // a raw Meta Marketing API field, used as-is
  | "derived-from-meta" // computed by us from Meta-direct fields (e.g. ROAS = revenue/spend)
  | "ours-only"; // synthesized by us, no Meta equivalent (buckets, fatigue, benchmarks)

/** The backend cost class of producing this — how `howTo` should be built.
 *  Omitted for pure actions/UI (nothing runs). */
export type BackendCost =
  | "read-time" // trivial ratio from already-fetched sums; free
  | "daily-series" // needs stored per-creative daily rows (bounded 90d window)
  | "batch-rollup" // cross-creative aggregation; nightly job + cache, never on read
  | "meta-breakdown-call"; // extra Meta API call with a breakdown param (per-creative cost)

export type Importance = "high" | "medium" | "low";

/** The repo's four canonical personas (see CLAUDE.md). */
export type Persona =
  | "Solo creator"
  | "Agency lead"
  | "Performance marketer"
  | "Brand manager";

export interface AnnotationSpec {
  /** Why this element exists / what it represents. */
  reason: string;
  /** What it means for the spend or next decision. */
  impact: string;
  /** The trigger — when a buyer should act on it. */
  whenToAct: string;
  importance: Importance;
  personas: Persona[];
  /** Where the number comes from. Omit for pure actions/UI affordances. */
  provenance?: Provenance;
  /** For a metric/signal: the optimised derivation (must be BE-feasible).
   *  For an action: what it does + that it's simulated. */
  howTo: string;
  /** Backend cost class. Omit for actions/UI — nothing runs there. */
  backend?: BackendCost;
}

/** A registry slice — a partial map of element id → spec. Each surface owns
 *  its own slice file so they can be authored in parallel without conflicts;
 *  index.ts merges them. */
export type AnnotationSlice = Record<string, AnnotationSpec>;
