/**
 * graph.ts — Domain-free directed-graph vocabulary and walks for workflows.
 *
 * NO-IMPORTS RULE (same as every file in `src/workflows/core/`): nothing here
 * may import `@/creative-report/*`, `@/data/*`, `@/components/*`, or `react`.
 * A node is an `{ id, kind }` pair where `kind` is an OPAQUE STRING — this
 * layer never knows that "condition" evaluates metrics or that
 * "syncFolderToAccounts" talks to an ad account. Node semantics live in the
 * consuming module (`src/automations/model.ts`); only structure lives here.
 *
 * Why these four functions and no more: they are exactly what a canvas
 * workflow needs and nothing it doesn't.
 *   - `topologicalOrder`  → the run order, and (via its null return) the
 *                           save-time cycle gate.
 *   - `wouldCreateCycle`  → per-connection validation while dragging an edge,
 *                           cheap enough to call on every hover.
 *   - `reachableFrom`     → which nodes are actually on the executable path,
 *                           so orphans can be reported as skipped-with-reason
 *                           instead of silently ignored.
 *   - `incomingOf`        → a node's inputs, for gathering upstream results.
 *
 * Deliberately NOT here: layout, positions, rendering hints, or anything
 * react-flow-shaped. Positions are persisted by the domain model because they
 * are a property of the editor, not of the graph.
 */

/** A node as this layer sees it: an id and an opaque kind tag. */
export interface GraphNodeRef {
  id: string;
  kind: string;
}

/** A directed edge. `id` is carried so callers can map back to their own edge records. */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
}

/** Every edge pointing AT `nodeId`. Order follows the input array. */
export function incomingOf(nodeId: string, edges: GraphEdge[]): GraphEdge[] {
  return edges.filter((e) => e.target === nodeId);
}

/**
 * Kahn's algorithm. Returns node ids in an order where every node comes after
 * all of its dependencies, or `null` if the graph contains a cycle.
 *
 * `null` is the cycle signal rather than a throw because both callers treat a
 * cycle as a user-facing validation failure ("this workflow loops"), not an
 * exception: the builder blocks Save, and the run engine refuses to start.
 *
 * Edges referencing ids absent from `nodeIds` are ignored — a stale edge left
 * behind by a deleted node must not be able to deadlock the sort (it would
 * otherwise inflate an in-degree that can never be decremented, and the whole
 * graph would read as one big cycle).
 */
export function topologicalOrder(nodeIds: string[], edges: GraphEdge[]): string[] | null {
  const present = new Set(nodeIds);
  const liveEdges = edges.filter((e) => present.has(e.source) && present.has(e.target));

  const inDegree = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  for (const id of nodeIds) {
    inDegree.set(id, 0);
    outgoing.set(id, []);
  }
  for (const e of liveEdges) {
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
    outgoing.get(e.source)?.push(e.target);
  }

  // Seeded in `nodeIds` order so the result is deterministic for a given input
  // — the run engine stamps step order from this, and a demo that reorders
  // itself between runs on identical input would look broken.
  const queue = nodeIds.filter((id) => inDegree.get(id) === 0);
  const ordered: string[] = [];

  while (queue.length > 0) {
    const id = queue.shift() as string;
    ordered.push(id);
    for (const next of outgoing.get(id) ?? []) {
      const remaining = (inDegree.get(next) ?? 0) - 1;
      inDegree.set(next, remaining);
      if (remaining === 0) queue.push(next);
    }
  }

  return ordered.length === nodeIds.length ? ordered : null;
}

/**
 * Would adding `candidate` introduce a cycle? Walks forward from
 * `candidate.target` looking for `candidate.source` — if the target can
 * already reach the source, closing the link would loop.
 *
 * A self-link (source === target) is reported as a cycle without walking.
 */
export function wouldCreateCycle(
  edges: GraphEdge[],
  candidate: { source: string; target: string },
): boolean {
  if (candidate.source === candidate.target) return true;
  return reachableFrom(candidate.target, edges).has(candidate.source);
}

/**
 * Every node reachable by following edges forward from `startId`, INCLUDING
 * `startId` itself.
 *
 * Cycle-safe (the `visited` set doubles as the guard), so this is callable on
 * an unvalidated graph — which matters because `wouldCreateCycle` calls it
 * precisely to find out whether a cycle exists.
 */
export function reachableFrom(startId: string, edges: GraphEdge[]): Set<string> {
  const outgoing = new Map<string, string[]>();
  for (const e of edges) {
    const list = outgoing.get(e.source);
    if (list) list.push(e.target);
    else outgoing.set(e.source, [e.target]);
  }

  const visited = new Set<string>([startId]);
  const stack = [startId];
  while (stack.length > 0) {
    const id = stack.pop() as string;
    for (const next of outgoing.get(id) ?? []) {
      if (visited.has(next)) continue;
      visited.add(next);
      stack.push(next);
    }
  }
  return visited;
}
