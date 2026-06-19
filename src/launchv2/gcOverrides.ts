/**
 * gcOverrides — garbage-collect orphaned nodeOverrides entries.
 *
 * `plan.nodeOverrides` is keyed by stable node IDs. When the plan's shape
 * changes (fewer targets, fewer campaigns, fewer ad sets, or a per-adset
 * adsPerAdSet override that shrinks the ad count), some keys reference nodes
 * that no longer exist. `gcNodeOverrides` removes those stale entries so they
 * don't silently reapply if the user later re-adds a matching structure.
 *
 * Placed in its own file to avoid the circular import:
 *   planUnits.ts  →  nodeOverrides.ts  (resolveNodeValue)
 * Adding `buildPlanUnits` to nodeOverrides.ts would create a cycle; this
 * separate module is imported by neither of those files.
 */
import type { PlanV2 } from "./types";
import { buildPlanUnits } from "./planUnits";

/**
 * WeakMap cache: plan object → Set of valid node IDs derived from buildPlanUnits.
 * Keyed by the plan reference itself so the cache is naturally invalidated whenever
 * a new plan object is produced (i.e. after any patch that changes the shape).
 */
const gcCache = new WeakMap<PlanV2, Set<string>>();

/**
 * Return the set of all valid node IDs for `plan`, computing it once and
 * caching it on the plan reference. Subsequent calls with the same plan
 * reference (same object identity) skip the full buildPlanUnits expansion.
 */
function getValidIds(plan: PlanV2): Set<string> {
  if (gcCache.has(plan)) return gcCache.get(plan)!;
  const units = buildPlanUnits(plan);
  const ids = new Set<string>();
  for (const u of units) {
    ids.add(u.accountNodeId);
    ids.add(u.campaignNodeId);
    ids.add(u.adSetNodeId);
    ids.add(u.adNodeId);
  }
  gcCache.set(plan, ids);
  return ids;
}

/**
 * Return a new plan with any `nodeOverrides` keys that reference non-existent
 * nodes removed. Returns the same plan reference when nothing needs cleaning.
 */
export function gcNodeOverrides(plan: PlanV2): PlanV2 {
  if (!plan.nodeOverrides || Object.keys(plan.nodeOverrides).length === 0) return plan;

  const validIds = getValidIds(plan);

  const cleaned: typeof plan.nodeOverrides = {};
  for (const [nodeId, fields] of Object.entries(plan.nodeOverrides)) {
    if (validIds.has(nodeId)) cleaned[nodeId] = fields;
  }

  const removedCount = Object.keys(plan.nodeOverrides).length - Object.keys(cleaned).length;
  if (removedCount === 0) return plan;
  return { ...plan, nodeOverrides: cleaned };
}
