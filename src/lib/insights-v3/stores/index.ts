/**
 * Industry Insights V2 — client stores (localStorage, safe when blocked).
 * Import from "@/lib/insights-v3/stores".
 */
import { boardsStore, savedAdsStore } from "./boards";
import { competitorsStore } from "./competitors";
import { followsStore } from "./follows";

export * from "./lastVisit";
export * from "./follows";
export * from "./competitors";
export * from "./boards";
export * from "./prefs";
export { STORAGE_KEYS, STORAGE_PREFIX } from "./storage";
export type { FollowsState, CompetitorsState, SavedAdEntry } from "./seed";

/** Re-seed follows, competitor marks, boards and saved ads (last visit is left alone). */
export function resetInsightsV3DemoState(): void {
  followsStore.reset();
  competitorsStore.reset();
  boardsStore.reset();
  savedAdsStore.reset();
}
