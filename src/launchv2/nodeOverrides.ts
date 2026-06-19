/**
 * nodeOverrides — pure helpers for the per-node override model used by the
 * Review master-detail editor.
 *
 * The plan holds GLOBAL defaults. Each tree node inherits them unless an entry
 * exists in `plan.nodeOverrides[nodeId]`. A node override is a sparse bag keyed
 * by settings-registry field id. Absent = inherited; present = overridden;
 * deleted = reset-to-default.
 *
 * All functions are pure and return NEW objects (never mutate the plan), so they
 * compose with flow.patch({ nodeOverrides: ... }).
 */
import type { NodeOverride, PlanV2 } from "./types";

/** Reserved field id holding the per-placement asset-customization rule array. */
export const ASSET_CUSTOMIZATION_KEY = "__assetCustomization";

/** Reserved field id holding a per-ad creative-id override (swap which media an ad uses). */
export const CREATIVE_ID_KEY = "__creativeId";

/** Reserved field id holding per-ad carousel cards (format === "carousel"). */
export const CAROUSEL_CARDS_KEY = "__carouselCards";

/** Reserved field id holding a per-ad collection cover creative-id (format === "collection"). */
export const COLLECTION_COVER_KEY = "__collectionCover";

/** True when this node has an explicit override for `fieldId`. */
export function isOverridden(plan: PlanV2, nodeId: string, fieldId: string): boolean {
  const bag = plan.nodeOverrides[nodeId];
  return !!bag && Object.prototype.hasOwnProperty.call(bag, fieldId);
}

/**
 * Resolve a field's effective value for a node: the override if present,
 * otherwise the supplied plan-default.
 */
export function resolveNodeValue<T>(
  plan: PlanV2,
  nodeId: string,
  fieldId: string,
  planDefault: T,
): T {
  const bag = plan.nodeOverrides[nodeId];
  if (bag && Object.prototype.hasOwnProperty.call(bag, fieldId)) {
    return bag[fieldId] as T;
  }
  return planDefault;
}

/** How many fields this node overrides (excludes the empty bag). */
export function nodeOverrideCount(plan: PlanV2, nodeId: string): number {
  const bag = plan.nodeOverrides[nodeId];
  return bag ? Object.keys(bag).length : 0;
}

/** Total overridden fields under a set of node ids (e.g. a subtree). */
export function subtreeOverrideCount(plan: PlanV2, nodeIds: string[]): number {
  return nodeIds.reduce((n, id) => n + nodeOverrideCount(plan, id), 0);
}

/**
 * Set one field override on a node. Returns a NEW nodeOverrides map.
 * Pass through flow.patch({ nodeOverrides: setNodeOverride(...) }).
 */
export function setNodeOverride(
  store: Record<string, NodeOverride>,
  nodeId: string,
  fieldId: string,
  value: unknown,
): Record<string, NodeOverride> {
  const prevBag = store[nodeId] ?? {};
  return {
    ...store,
    [nodeId]: { ...prevBag, [fieldId]: value },
  };
}

/** Set several field overrides on a node at once (bulk edit). */
export function setNodeOverrides(
  store: Record<string, NodeOverride>,
  nodeId: string,
  fields: Record<string, unknown>,
): Record<string, NodeOverride> {
  const prevBag = store[nodeId] ?? {};
  return {
    ...store,
    [nodeId]: { ...prevBag, ...fields },
  };
}

/** Set the same field override across many nodes (bulk multi-select edit). */
export function setManyNodesOverride(
  store: Record<string, NodeOverride>,
  nodeIds: string[],
  fieldId: string,
  value: unknown,
): Record<string, NodeOverride> {
  // Build the result in a single pass to avoid O(n) intermediate spread objects.
  const result = { ...store };
  for (const id of nodeIds) {
    result[id] = result[id] ? { ...result[id], [fieldId]: value } : { [fieldId]: value };
  }
  return result;
}

/** Reset one field on a node back to the plan default (delete the key). */
export function resetNodeField(
  store: Record<string, NodeOverride>,
  nodeId: string,
  fieldId: string,
): Record<string, NodeOverride> {
  const prevBag = store[nodeId];
  if (!prevBag || !Object.prototype.hasOwnProperty.call(prevBag, fieldId)) return store;
  const nextBag = { ...prevBag };
  delete nextBag[fieldId];
  const next = { ...store };
  if (Object.keys(nextBag).length === 0) delete next[nodeId];
  else next[nodeId] = nextBag;
  return next;
}

/** Reset a whole node back to plan defaults (drop its bag entirely). */
export function resetNode(
  store: Record<string, NodeOverride>,
  nodeId: string,
): Record<string, NodeOverride> {
  if (!store[nodeId]) return store;
  const next = { ...store };
  delete next[nodeId];
  return next;
}
