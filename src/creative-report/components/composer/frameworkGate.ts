/**
 * Framework-gate adapter — isolates the composer's dependency on
 * `@/creative-report/lib/analysisStore` (landed mid-build, from a parallel
 * agent) to ONE file, so nothing else in the composer imports it directly.
 *
 * Real API (not a stub): `useAnalysisStore` is the store's ONE external
 * subscription hook (call once per render tree — Compare.tsx does this, NOT
 * inside the 2-4-item column `.map()`, since hook-call count must stay
 * stable across renders); `getStatus` is the pure per-creative derivation,
 * safe to call per item in a loop, wrapped by callers in useMemo where it
 * matters; `startAnalysis` is the real credit-gated mock action (idle →
 * analysing → analysed, see analysisStore's own doc-comment) — wired to the
 * locked Framework chip's "Run analysis to use" affordance so it's a working
 * action, not a dead-end label.
 */
import {
  useAnalysisStore,
  getStatus,
  startAnalysis,
  canAffordReveal,
  REVEAL_COST,
  type AnalysisStatus,
} from "@/creative-report/lib/analysisStore";

export type { AnalysisStatus };
export { REVEAL_COST };

/** The store's ONE external subscription hook — call once per render tree
 *  (Compare.tsx), never inside a loop. */
export function useAnalysisSnapshot() {
  return useAnalysisStore();
}

/** Pure per-creative derivation — safe to call per item in a `.map()`. */
export function deriveFrameworkStatus(
  snapshot: ReturnType<typeof useAnalysisStore>,
  creativeId: string,
): AnalysisStatus {
  return getStatus(snapshot, creativeId);
}

/** Whether the mock credit balance covers a reveal right now. */
export function canRunAnalysis(snapshot: ReturnType<typeof useAnalysisStore>): boolean {
  return canAffordReveal(snapshot);
}

/** Kicks off the real (mock) credit-gated analysis for one creative. */
export function runAnalysis(creativeId: string): void {
  startAnalysis(creativeId);
}
