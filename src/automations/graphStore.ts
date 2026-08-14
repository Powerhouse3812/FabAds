/**
 * graphStore.ts — Automations canvas workflow store.
 * localStorage-backed useSyncExternalStore, same store discipline as
 * `@/creative-report/automations/rulesStore.ts` (stable cached snapshot
 * reference, defensive per-item sanitization of whatever localStorage hands
 * back — a single bad node must never nuke the whole graph, and a single
 * bad graph must never nuke the whole list).
 */
import { useSyncExternalStore } from "react";
import {
  SYNC_GRANULARITIES,
  WORKFLOW_NODE_KINDS,
  WORKFLOW_STATUS_TAGS,
  defaultDataForKind,
  type WorkflowEdgeModel,
  type WorkflowGraph,
  type WorkflowNode,
  type WorkflowNodeData,
  type WorkflowNodeKind,
  type WorkflowStatusTag,
  type SyncGranularity,
} from "@/automations/model";
import { WORKFLOW_TEMPLATES } from "@/automations/templates";
import { sanitizeSchedule, type WorkflowCondition, type WorkflowSchedule } from "@/workflows/core";
import { ACCOUNT_BY_ID } from "@/data/accounts";

const KEY = "workflows-graphs";

/* ------------------------------------------------------------------ */
/*  Sanitisation                                                       */
/* ------------------------------------------------------------------ */

function isValidWorkflowCondition(c: unknown): c is WorkflowCondition {
  if (!c || typeof c !== "object") return false;
  const cond = c as Record<string, unknown>;
  if (typeof cond.field !== "string") return false;
  if (typeof cond.operator !== "string") return false;
  if (typeof cond.value !== "string" && typeof cond.value !== "number") return false;
  // Mirrors rulesStore.ts's isValidCondition: a "between" condition with no
  // finite upper bound would silently match everything (>= value, no
  // ceiling) — worse than losing the condition, since the builder's live
  // match-count would read a confident number that's wrong. Reject here;
  // sanitizeNodeData drops just this condition, not the whole node.
  if (cond.operator === "between" && !(typeof cond.value2 === "number" && Number.isFinite(cond.value2))) {
    return false;
  }
  return true;
}

/**
 * Validates + coerces one node's `data` payload for its (already-confirmed)
 * `kind`. Returns `null` only when the payload is structurally unusable
 * (wrong `data.kind`, or — for `condition` — no `conditions` array at all);
 * `sanitizeNode` treats a `null` here as "drop this node individually".
 *
 * Every other kind coerces toward a safe default instead of dropping the
 * node, because an under-configured node (empty folder, zero accounts) is a
 * legitimate mid-edit editor state that `nodeConfigIssue()` already reports
 * honestly — it is not the same failure mode as a corrupt payload.
 */
function sanitizeNodeData(kind: WorkflowNodeKind, rawData: unknown): WorkflowNodeData | null {
  if (!rawData || typeof rawData !== "object") return null;
  const data = rawData as Record<string, unknown>;
  if (data.kind !== kind) return null;

  switch (kind) {
    case "source":
      // Only one SourceModule exists today (see model.ts's SOURCE_MODULES) —
      // nothing to validate beyond the kind match already done above.
      return defaultDataForKind("source");

    case "condition": {
      if (!Array.isArray(data.conditions)) return null;
      const conditions = data.conditions.filter(isValidWorkflowCondition);
      return { kind: "condition", conditions };
    }

    case "markStatus": {
      const status = (WORKFLOW_STATUS_TAGS as readonly string[]).includes(data.status as string)
        ? (data.status as WorkflowStatusTag)
        : "winner";
      return { kind: "markStatus", status };
    }

    case "generateVariation": {
      const raw = typeof data.count === "number" && Number.isFinite(data.count) ? data.count : 2;
      const count = Math.min(3, Math.max(1, Math.round(raw)));
      return { kind: "generateVariation", count };
    }

    case "addToFolder": {
      const folderId = typeof data.folderId === "string" ? data.folderId : "";
      const folderName = typeof data.folderName === "string" ? data.folderName : "";
      // Empty allowed — an unconfigured folder is honestly reported by
      // nodeConfigIssue() ("Choose a folder"), not fabricated here.
      return { kind: "addToFolder", folderId, folderName };
    }

    case "syncFolderToAccounts": {
      const accountIds = Array.isArray(data.accountIds)
        ? data.accountIds.filter((id): id is string => typeof id === "string" && !!ACCOUNT_BY_ID[id])
        : [];
      // Deliberately different from rulesStore.ts's
      // sanitizeSyncToAccountsAction, which drops the WHOLE action when zero
      // accounts survive. Here the node survives with an empty accountIds
      // list: an unconfigured syncFolderToAccounts node is a legitimate
      // editor state (the user hasn't picked accounts yet, or every id it
      // once pointed at was removed from the mock directory), and
      // nodeConfigIssue() already reports "Choose at least one ad account"
      // honestly rather than this sanitiser silently deleting the node out
      // from under the canvas.
      // `mode` coerces rather than dropping the node, but the fallback is NOT
      // the model's `defaultDataForKind` default. Two different questions:
      //   - New node the user just dropped -> "folder" (Neeraj's position; the
      //     launch-ready path). That's `defaultDataForKind`'s job.
      //   - Payload persisted BEFORE the granularity choice existed -> it must
      //     keep doing what it did yesterday. Pre-ruling nodes pushed
      //     creative->account pairs, which `executors.ts` documents as
      //     "creatives" mode byte for byte, and they carry no folder at all.
      // Defaulting those to "folder" changed their job silently AND
      // manufactured a blocker (`nodeConfigIssue` demands a folderId in folder
      // mode), so an untouched graph reopened refusing to arm. Adversarial
      // review confirmed this on a pre-batch profile: the flagship template
      // rendered a red "1 BLOCKER". Hence: honour a persisted folder if one is
      // there, otherwise preserve the old behaviour.
      const folderId = typeof data.folderId === "string" ? data.folderId : undefined;
      const folderName = typeof data.folderName === "string" ? data.folderName : undefined;
      const mode = (SYNC_GRANULARITIES as readonly string[]).includes(data.mode as string)
        ? (data.mode as SyncGranularity)
        : folderId
          ? "folder"
          : "creatives";
      return { kind: "syncFolderToAccounts", accountIds, mode, folderId, folderName };
    }

    case "note": {
      const text = typeof data.text === "string" ? data.text : "";
      return { kind: "note", text };
    }
  }
}

/** Validates + coerces one persisted node. Returns `null` to drop it
 *  individually — never throws. */
function sanitizeNode(raw: unknown): WorkflowNode | null {
  if (!raw || typeof raw !== "object") return null;
  const node = raw as Record<string, unknown>;

  if (typeof node.id !== "string") return null;
  if (!(WORKFLOW_NODE_KINDS as string[]).includes(node.kind as string)) return null;
  const kind = node.kind as WorkflowNodeKind;

  const rawPosition = node.position as Record<string, unknown> | undefined;
  const x = rawPosition && typeof rawPosition.x === "number" && Number.isFinite(rawPosition.x) ? rawPosition.x : NaN;
  const y = rawPosition && typeof rawPosition.y === "number" && Number.isFinite(rawPosition.y) ? rawPosition.y : NaN;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

  const data = sanitizeNodeData(kind, node.data);
  if (!data) return null;

  return { id: node.id, kind, position: { x, y }, data };
}

/** Validates + coerces one persisted graph. Returns `null` to drop it
 *  individually (e.g. missing required string fields) — a single unusable
 *  graph must never take the rest of the list down with it. Never throws;
 *  callers wrap this in try/catch as a second line of defense. */
function sanitizeGraph(raw: Record<string, unknown>): WorkflowGraph | null {
  if (typeof raw.id !== "string") return null;
  if (typeof raw.name !== "string") return null;
  if (typeof raw.createdAt !== "string") return null;
  if (typeof raw.updatedAt !== "string") return null;

  const rawNodes = Array.isArray(raw.nodes) ? raw.nodes : [];
  // Structurally-broken individual nodes are dropped one at a time — a
  // single bad node must not nuke the whole graph.
  let nodes = rawNodes.map(sanitizeNode).filter((n): n is WorkflowNode => n !== null);

  // A graph may hold at most one `source` node (see model.ts's
  // canAddKind) — keep the first, drop later ones rather than rejecting the
  // whole graph over a duplicate.
  let seenSource = false;
  nodes = nodes.filter((n) => {
    if (n.kind !== "source") return true;
    if (seenSource) return false;
    seenSource = true;
    return true;
  });

  const nodeIds = new Set(nodes.map((n) => n.id));
  const rawEdges = Array.isArray(raw.edges) ? raw.edges : [];
  const edges: WorkflowEdgeModel[] = rawEdges
    .filter((e): e is Record<string, unknown> => !!e && typeof e === "object")
    .filter(
      (e) => typeof e.id === "string" && typeof e.source === "string" && typeof e.target === "string",
    )
    // Drop edges whose source/target no longer resolves to a surviving node
    // — the counterpart to nodes dropped above.
    .filter((e) => nodeIds.has(e.source as string) && nodeIds.has(e.target as string))
    .map((e) => ({ id: e.id as string, source: e.source as string, target: e.target as string }));

  const recommendations = Array.isArray(raw.recommendations)
    ? raw.recommendations.filter((r): r is string => typeof r === "string")
    : [];

  return {
    id: raw.id,
    name: raw.name,
    nodes,
    edges,
    enabled: raw.enabled === true,
    schedule: sanitizeSchedule(raw.schedule),
    recommendations,
    benchmark: raw.benchmark === true,
    templateId: typeof raw.templateId === "string" ? raw.templateId : undefined,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    lastRunAt: typeof raw.lastRunAt === "string" ? raw.lastRunAt : undefined,
  };
}

function sanitize(raw: unknown): WorkflowGraph[] {
  if (!Array.isArray(raw)) return [];
  const out: WorkflowGraph[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    try {
      const graph = sanitizeGraph(item as Record<string, unknown>);
      if (graph) out.push(graph);
    } catch {
      // One unexpectedly-shaped graph must not take the rest of the list
      // down with it — skip just this entry.
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  Seeding                                                            */
/* ------------------------------------------------------------------ */

function readInitial(): WorkflowGraph[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return sanitize(JSON.parse(raw));

    // Key ABSENT (not merely an empty array) — a brand-new browser. Seed the
    // FabFunnel benchmark templates so the list opens lived-in rather than
    // blank, and persist immediately so real user edits accumulate on top of
    // this seed instead of it re-appearing every visit.
    const seeded = WORKFLOW_TEMPLATES;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(seeded));
    } catch {
      // Quota exceeded or storage unavailable — the seeded templates still
      // return for this session, they just won't survive a reload.
    }
    return seeded;
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

const EMPTY_GRAPHS: WorkflowGraph[] = [];
let graphs: WorkflowGraph[] = readInitial();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(graphs));
    } catch {
      // Quota exceeded or storage unavailable — keep the in-memory graphs
      // and don't let a write failure wedge the store.
    }
  }
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Returns the module-cached `graphs` reference and constructs nothing. */
function snapshot(): WorkflowGraph[] {
  return graphs;
}

/** Non-hook accessor for callers with no render attached — specifically the
 *  future run engine, which ticks off a module-level clock. It reads this
 *  same module variable rather than localStorage, so it always sees the
 *  current state including a workflow created microseconds ago (a
 *  render-driven mirror would be one render stale). Mirrors `getRules()` in
 *  rulesStore.ts:204. Returns the cached reference — treat as read-only. */
export function getWorkflowGraphs(): WorkflowGraph[] {
  return graphs;
}

/**
 * The ONLY hook this store exports. Do NOT add a second hook (e.g.
 * `useWorkflowGraph(id)`) — consumers that need a single graph derive it
 * from this list with their own `useMemo`.
 */
export function useWorkflowGraphs(): WorkflowGraph[] {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY_GRAPHS);
}

/* ------------------------------------------------------------------ */
/*  Id minting                                                         */
/* ------------------------------------------------------------------ */

let idCounter = 0;

function makeGraphId(): string {
  idCounter += 1;
  return `wf-${Date.now()}-${idCounter}`;
}

function makeNodeId(): string {
  idCounter += 1;
  return `wfn-${Date.now()}-${idCounter}`;
}

function makeEdgeId(): string {
  idCounter += 1;
  return `wfe-${Date.now()}-${idCounter}`;
}

/* ------------------------------------------------------------------ */
/*  Mutations                                                          */
/* ------------------------------------------------------------------ */

export function createWorkflow(input: { name: string }): string {
  const id = makeGraphId();
  const now = new Date().toISOString();
  const graph: WorkflowGraph = {
    id,
    name: input.name.trim() || "Untitled workflow",
    nodes: [
      {
        id: makeNodeId(),
        kind: "source",
        position: { x: 80, y: 180 },
        data: defaultDataForKind("source"),
      },
    ],
    edges: [],
    enabled: false,
    recommendations: [],
    benchmark: false,
    createdAt: now,
    updatedAt: now,
  };
  graphs = [...graphs, graph];
  persist();
  return id;
}

/** Deep-clones a `WORKFLOW_TEMPLATES` entry into a brand-new, independently
 *  editable graph: new node/edge ids throughout (edges remapped via the
 *  node-id substitution), `name` suffixed "(copy)", `benchmark: false` (a
 *  clone is a real user workflow, not the reference itself), `templateId`
 *  set so the origin is traceable. Returns `null` for an unknown id instead
 *  of throwing, since callers pass this straight from a list the user
 *  clicked in. */
export function cloneWorkflowFromTemplate(templateId: string): string | null {
  const template = WORKFLOW_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return null;

  const idMap = new Map<string, string>();
  const nodes: WorkflowNode[] = template.nodes.map((n) => {
    const newId = makeNodeId();
    idMap.set(n.id, newId);
    return {
      id: newId,
      kind: n.kind,
      position: { x: n.position.x, y: n.position.y },
      // Deep-clone the data payload (plain JSON, no functions/dates inside
      // WorkflowNodeData) so the clone never shares mutable state with the
      // static template it came from.
      data: JSON.parse(JSON.stringify(n.data)) as WorkflowNodeData,
    };
  });
  const edges: WorkflowEdgeModel[] = template.edges.map((e) => ({
    id: makeEdgeId(),
    source: idMap.get(e.source) ?? e.source,
    target: idMap.get(e.target) ?? e.target,
  }));

  const id = makeGraphId();
  const now = new Date().toISOString();
  const clone: WorkflowGraph = {
    id,
    name: `${template.name} (copy)`,
    nodes,
    edges,
    enabled: false,
    recommendations: [...template.recommendations],
    benchmark: false,
    templateId: template.id,
    createdAt: now,
    updatedAt: now,
  };
  graphs = [...graphs, clone];
  persist();
  return id;
}

export function updateWorkflowGraph(
  id: string,
  patch: Partial<Pick<WorkflowGraph, "name" | "nodes" | "edges" | "recommendations" | "schedule" | "enabled">>,
): void {
  graphs = graphs.map((g) => (g.id === id ? { ...g, ...patch, updatedAt: new Date().toISOString() } : g));
  persist();
}

/**
 * Arms or disarms auto-run for one workflow — the switch the auto-runner
 * (`@/automations/autoRunner`) reads first in its eligibility pass.
 *
 * A named wrapper over `updateWorkflowGraph`, NOT a second write path. There is
 * exactly one place in this file that assigns `graphs` and calls `persist()`
 * for a patch; a second copy would be a second chance to forget the emit and
 * leave the canvas showing stale state. The name earns its keep at the call
 * site: `setWorkflowEnabled(id, true)` says what a `{ enabled: true }` patch
 * only implies.
 */
export function setWorkflowEnabled(id: string, enabled: boolean): void {
  updateWorkflowGraph(id, { enabled });
}

/**
 * Sets the date range that gates auto-run. Sanitised HERE as well as on read:
 * `sanitizeSchedule` already runs when localStorage is parsed, but a half-typed
 * date written now would sit in the in-memory store — and in front of the user
 * via `describeSchedule` — until the next reload cleaned it up. Cheap, and it
 * keeps `isWithinSchedule`'s guarantees true for the current session too.
 *
 * The shape stays date-range-only (see `schedule.ts`'s header) — do not widen
 * it here by accepting extra fields a caller happens to pass.
 */
export function setWorkflowSchedule(id: string, schedule: WorkflowSchedule): void {
  updateWorkflowGraph(id, { schedule: sanitizeSchedule(schedule) });
}

export function deleteWorkflow(id: string): void {
  graphs = graphs.filter((g) => g.id !== id);
  persist();
}

/** Recorded after a "Run now" pass — bookkeeping only, never changes which
 *  creatives matched. */
export function recordWorkflowLastRun(id: string): void {
  const now = new Date().toISOString();
  graphs = graphs.map((g) => (g.id === id ? { ...g, lastRunAt: now, updatedAt: now } : g));
  persist();
}
