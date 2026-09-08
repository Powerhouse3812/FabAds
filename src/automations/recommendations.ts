/**
 * recommendations.ts — reads a workflow graph and says what's wrong with it.
 *
 * Neeraj's ask (Slack 2026-08-03): "kuch chije likhni pdegi in automation —
 * recommendations, like add naming conditions if you run multiple niches."
 * `WorkflowGraph.recommendations` already carries HAND-AUTHORED prose per
 * template. This file is the other half: advice DERIVED from the graph the user
 * actually built, so it stays true as they edit instead of describing the
 * template they started from.
 *
 * WHY A PURE FUNCTION, NOT A STORE: every consumer (builder strip, list-row
 * badge, and later the Overview) needs the same verdict for the same graph.
 * A store would be a second copy of state that can disagree with the graph it
 * describes. Callers wrap this in `useMemo` keyed on the graph — same rule the
 * sync selectors follow.
 *
 * NO CLOCK, NO `Math.random`, NO REACT. The same reproducibility rule the run
 * engine states: identical graph in, identical advice out, every reload. The
 * one time-shaped check (`manual-only`) reads `graph.enabled`/`graph.schedule`,
 * never "now" — whether a schedule is CURRENTLY in window is
 * `scheduleState`'s job, at render time, with the caller's clock.
 *
 * HONESTY RULE: never claim a number this module can't derive. The condition
 * checks talk about the SHAPE of a condition set ("nothing narrows this"), not
 * about how many creatives would match — matching is `evaluateConditions`'
 * job against a live dataset, and guessing here would put a confident wrong
 * count in front of the user.
 */
import type { WorkflowCondition } from "@/workflows/core";
import { reachableFrom, topologicalOrder } from "@/workflows/core";
import {
  NODE_KIND_META,
  findSourceNode,
  nodeConfigIssue,
  type WorkflowGraph,
  type WorkflowEdgeModel,
} from "@/automations/model";

/**
 * How loud a recommendation is.
 *   blocker    — the workflow cannot run, or will run and do nothing.
 *   warning    — it will run, but not the way the user probably means.
 *   suggestion — it works; this makes it better.
 * Ordered deliberately: `sortBySeverity` relies on this array's index.
 */
export const RECOMMENDATION_SEVERITIES = ["blocker", "warning", "suggestion"] as const;
export type RecommendationSeverity = (typeof RECOMMENDATION_SEVERITIES)[number];

export interface WorkflowRecommendation {
  /** Stable per (check, subject) so React keys and dedupe both behave. */
  id: string;
  severity: RecommendationSeverity;
  /** Imperative, ≤ 6 words — this is the line that gets read. */
  title: string;
  /** One sentence: what happens if they ignore it. */
  detail: string;
  /** Nodes this is about, for canvas highlighting. Empty for graph-level advice. */
  nodeIds: string[];
}

/* ------------------------------------------------------------------ */
/*  Field vocabulary                                                   */
/* ------------------------------------------------------------------ */

/**
 * Condition fields that identify WHICH creative rather than HOW IT PERFORMED.
 * Used only by the naming/niche check. `field` is an opaque string at the core
 * layer, so this list is a heuristic over the ids the Creative Report domain
 * actually emits (see `NodeConfigPanel`'s field picker) — an unknown field is
 * treated as a metric, which is the safe direction: it can produce a
 * suggestion the user doesn't need, never suppress one they do.
 */
const IDENTITY_FIELDS = new Set([
  "name",
  "creativeName",
  "brand",
  "brandId",
  "category",
  "categoryId",
  "product",
  "productId",
  "platform",
  "format",
]);

function isIdentityCondition(c: WorkflowCondition): boolean {
  return IDENTITY_FIELDS.has(c.field);
}

/* ------------------------------------------------------------------ */
/*  Graph helpers                                                      */
/* ------------------------------------------------------------------ */

/** Upstream-first walk from `nodeId`, following edges backwards. Cycle-safe. */
function ancestorsOf(nodeId: string, edges: WorkflowEdgeModel[]): Set<string> {
  const incoming = new Map<string, string[]>();
  for (const e of edges) {
    const list = incoming.get(e.target);
    if (list) list.push(e.source);
    else incoming.set(e.target, [e.source]);
  }
  const seen = new Set<string>();
  const stack = [nodeId];
  while (stack.length > 0) {
    const id = stack.pop() as string;
    for (const prev of incoming.get(id) ?? []) {
      if (seen.has(prev)) continue;
      seen.add(prev);
      stack.push(prev);
    }
  }
  return seen;
}

/** Every node reachable downstream of `nodeId`, excluding itself. */
function descendantsOf(nodeId: string, edges: WorkflowEdgeModel[]): Set<string> {
  const set = reachableFrom(nodeId, edges);
  set.delete(nodeId);
  return set;
}

const ACTION_KINDS = new Set([
  "markStatus",
  "generateVariation",
  "addToFolder",
  "syncFolderToAccounts",
]);

/* ------------------------------------------------------------------ */
/*  The checks                                                         */
/* ------------------------------------------------------------------ */

/**
 * Every check, in the order they're evaluated. Each returns zero or more
 * recommendations. Adding advice means adding one function here, not editing a
 * growing `if` chain in `analyseWorkflow`.
 */
type Check = (graph: WorkflowGraph) => WorkflowRecommendation[];

/** No trigger at all — nothing to feed the chain. */
const checkTrigger: Check = (graph) => {
  if (findSourceNode(graph.nodes)) return [];
  return [
    {
      id: "no-trigger",
      severity: "blocker",
      title: "Add a trigger",
      detail:
        "Without a Creative Report trigger there is nothing for the steps to run on — the workflow will refuse to start.",
      nodeIds: [],
    },
  ];
};

/** A loop — `topologicalOrder` returns null and the engine refuses to run. */
const checkCycle: Check = (graph) => {
  const order = topologicalOrder(
    graph.nodes.map((n) => n.id),
    graph.edges,
  );
  if (order) return [];
  return [
    {
      id: "cycle",
      severity: "blocker",
      title: "The workflow loops back",
      detail:
        "Some steps feed into each other in a circle, so there is no order to run them in. Remove one of the links to break the loop.",
      nodeIds: [],
    },
  ];
};

/** Half-built nodes. One recommendation per node so the canvas can highlight. */
const checkNodeSetup: Check = (graph) =>
  graph.nodes
    .map((node): WorkflowRecommendation | null => {
      const issue = nodeConfigIssue(node.data);
      if (!issue) return null;
      // A blank NOTE is not a blocker. Notes never execute (`buildSteps` skips
      // them before it even looks at their config), so an empty one cannot
      // affect a single creative — yet as a blocker it disabled auto-run for the
      // whole graph, which an adversarial pass rightly called out: a blank
      // sticky note silently switching off a working automation is absurd.
      // It is still worth saying, hence a suggestion.
      const isNote = node.kind === "note";
      return {
        id: `needs-setup:${node.id}`,
        severity: isNote ? "suggestion" : "blocker",
        title: `${NODE_KIND_META[node.kind].label}: ${issue.toLowerCase()}`,
        detail: isNote
          ? "An empty note tells the next person nothing. It doesn't affect the run."
          : "The run will skip this step and say why, so the chain stops here.",
        nodeIds: [node.id],
      };
    })
    .filter((r): r is WorkflowRecommendation => r !== null);

/** Steps stranded off the executable path. */
const checkOrphans: Check = (graph) => {
  const source = findSourceNode(graph.nodes);
  if (!source) return []; // `checkTrigger` already owns this case.

  const live = reachableFrom(source.id, graph.edges);
  const orphans = graph.nodes.filter(
    (n) => n.kind !== "note" && n.kind !== "source" && !live.has(n.id),
  );
  if (orphans.length === 0) return [];

  return [
    {
      id: "orphan-steps",
      severity: "warning",
      title: orphans.length === 1 ? "One step isn't connected" : `${orphans.length} steps aren't connected`,
      detail:
        "Nothing reaches them from the trigger, so the run logs them as skipped and they never do anything.",
      nodeIds: orphans.map((n) => n.id),
    },
  ];
};

/** Actions with no condition anywhere upstream: fires on the whole report. */
const checkUnfiltered: Check = (graph) => {
  const source = findSourceNode(graph.nodes);
  if (!source) return [];

  const live = reachableFrom(source.id, graph.edges);
  const byId = new Map(graph.nodes.map((n) => [n.id, n] as const));

  const unfiltered = graph.nodes.filter((n) => {
    if (!ACTION_KINDS.has(n.kind) || !live.has(n.id)) return false;
    const ancestors = ancestorsOf(n.id, graph.edges);
    for (const id of ancestors) {
      if (byId.get(id)?.kind === "condition") return false;
    }
    return true;
  });
  if (unfiltered.length === 0) return [];

  return [
    {
      id: "no-condition",
      severity: "warning",
      title: "Nothing narrows this down",
      detail:
        "These steps sit straight on the trigger with no condition in between, so they act on every creative in the report — not just the ones you care about.",
      nodeIds: unfiltered.map((n) => n.id),
    },
  ];
};

/**
 * Neeraj's naming ask, made specific: a workflow that fans out to several
 * folders or several ad accounts but only ever filters on performance will
 * treat every niche the same and cross-file between them.
 */
const checkNicheNaming: Check = (graph) => {
  const folders = new Set<string>();
  const accounts = new Set<string>();
  let hasIdentityCondition = false;
  let hasAnyCondition = false;

  for (const node of graph.nodes) {
    if (node.data.kind === "addToFolder" && node.data.folderId) folders.add(node.data.folderId);
    if (node.data.kind === "syncFolderToAccounts") {
      for (const id of node.data.accountIds) accounts.add(id);
      if (node.data.folderId) folders.add(node.data.folderId);
    }
    if (node.data.kind === "condition" && node.data.conditions.length > 0) {
      hasAnyCondition = true;
      if (node.data.conditions.some(isIdentityCondition)) hasIdentityCondition = true;
    }
  }

  const fansOut = folders.size > 1 || accounts.size > 1;
  if (!fansOut || hasIdentityCondition || !hasAnyCondition) return [];

  return [
    {
      id: "niche-naming",
      severity: "suggestion",
      title: "Add a brand or name condition",
      detail:
        "This workflow spreads across several destinations but only filters on performance, so a winner from one niche can land in another niche's folder or ad account.",
      nodeIds: [],
    },
  ];
};

/** Folder-mode sync pushing a folder that nothing in this chain fills. */
const checkSyncFolderSource: Check = (graph) => {
  const filled = new Set<string>();
  for (const node of graph.nodes) {
    if (node.data.kind === "addToFolder" && node.data.folderId) filled.add(node.data.folderId);
  }

  const out: WorkflowRecommendation[] = [];
  for (const node of graph.nodes) {
    if (node.data.kind !== "syncFolderToAccounts") continue;
    if (node.data.mode !== "folder" || !node.data.folderId) continue;
    if (filled.has(node.data.folderId)) continue;

    const label = node.data.folderName || node.data.folderId;
    out.push({
      id: `sync-folder-unfilled:${node.id}`,
      severity: "warning",
      title: "Pushing a folder this chain doesn't fill",
      detail: `Nothing upstream files creatives into "${label}", so this pushes whatever is already sitting in it — add an "Add to folder" step, or switch this step to matched creatives.`,
      nodeIds: [node.id],
    });
  }
  return out;
};

/** Generated variations that are never filed or pushed anywhere. */
const checkDeadEndVariations: Check = (graph) => {
  const byId = new Map(graph.nodes.map((n) => [n.id, n] as const));
  const stranded = graph.nodes.filter((n) => {
    if (n.kind !== "generateVariation") return false;
    for (const id of descendantsOf(n.id, graph.edges)) {
      const kind = byId.get(id)?.kind;
      if (kind === "addToFolder" || kind === "syncFolderToAccounts") return false;
    }
    return true;
  });
  if (stranded.length === 0) return [];

  return [
    {
      id: "variations-dead-end",
      severity: "warning",
      title: "Variations go nowhere",
      detail:
        "Genie is asked for new creatives but nothing files or pushes them, so they are generated and then left unused.",
      nodeIds: stranded.map((n) => n.id),
    },
  ];
};

/** Two status tags on one path — the later one silently wins. */
const checkStatusOverwrite: Check = (graph) => {
  const pairs: string[] = [];
  const tagNodes = graph.nodes.filter((n) => n.kind === "markStatus");
  for (const node of tagNodes) {
    const downstream = descendantsOf(node.id, graph.edges);
    for (const other of tagNodes) {
      if (other.id === node.id || !downstream.has(other.id)) continue;
      if (
        node.data.kind === "markStatus" &&
        other.data.kind === "markStatus" &&
        node.data.status !== other.data.status
      ) {
        pairs.push(node.id, other.id);
      }
    }
  }
  if (pairs.length === 0) return [];

  return [
    {
      id: "status-overwritten",
      severity: "suggestion",
      title: "Two status tags on one path",
      detail:
        "A creative flowing through both steps ends up with only the later tag. Branch the chain if you meant them to be alternatives.",
      nodeIds: [...new Set(pairs)],
    },
  ];
};

/** Conditions that can never all be true — the node matches nothing, forever. */
const checkImpossibleConditions: Check = (graph) => {
  const out: WorkflowRecommendation[] = [];

  for (const node of graph.nodes) {
    if (node.data.kind !== "condition") continue;
    const conditions = node.data.conditions;
    if (conditions.length === 0) continue; // `nodeConfigIssue` owns the empty case.

    let reason: string | null = null;

    // An inverted `between` can never match anything.
    for (const c of conditions) {
      if (
        c.operator === "between" &&
        typeof c.value === "number" &&
        typeof c.value2 === "number" &&
        c.value2 < c.value
      ) {
        reason = `its ${c.field} range runs backwards (${c.value} to ${c.value2})`;
        break;
      }
    }

    // Conditions are AND-chained inside a node, so a lower bound above an upper
    // bound on the SAME field is unsatisfiable.
    if (!reason) {
      const lower = new Map<string, number>();
      const upper = new Map<string, number>();
      for (const c of conditions) {
        if (typeof c.value !== "number") continue;
        if (c.operator === "gt" || c.operator === "gte") {
          lower.set(c.field, Math.max(lower.get(c.field) ?? -Infinity, c.value));
        }
        if (c.operator === "lt" || c.operator === "lte") {
          upper.set(c.field, Math.min(upper.get(c.field) ?? Infinity, c.value));
        }
      }
      for (const [field, low] of lower) {
        const high = upper.get(field);
        if (high !== undefined && high <= low) {
          reason = `${field} has to be above ${low} and below ${high} at the same time`;
          break;
        }
      }
    }

    if (reason) {
      out.push({
        id: `impossible-condition:${node.id}`,
        severity: "blocker",
        title: "These conditions can't all be true",
        detail: `This step matches nothing because ${reason}. Every step after it will receive an empty set.`,
        nodeIds: [node.id],
      });
    }
  }

  return out;
};

/** Built but never armed. Deliberately a suggestion, not a warning. */
const checkNotArmed: Check = (graph) => {
  if (graph.enabled) return [];
  // A graph that can't run yet has louder problems; don't pile on.
  const broken =
    !findSourceNode(graph.nodes) || graph.nodes.some((n) => nodeConfigIssue(n.data) !== null);
  if (broken) return [];

  return [
    {
      id: "manual-only",
      severity: "suggestion",
      title: "Turn on auto-run",
      detail:
        "This workflow only runs when you press Run. Switch it on to have it re-check on its own while FabAds is open.",
      nodeIds: [],
    },
  ];
};

const CHECKS: Check[] = [
  checkTrigger,
  checkCycle,
  checkNodeSetup,
  checkImpossibleConditions,
  checkOrphans,
  checkUnfiltered,
  checkSyncFolderSource,
  checkDeadEndVariations,
  checkStatusOverwrite,
  checkNicheNaming,
  checkNotArmed,
];

/* ------------------------------------------------------------------ */
/*  Entry points                                                       */
/* ------------------------------------------------------------------ */

function severityRank(s: RecommendationSeverity): number {
  return RECOMMENDATION_SEVERITIES.indexOf(s);
}

/**
 * Every derived recommendation for `graph`, loudest first. Stable order for a
 * given graph — the checks run in a fixed order and the sort is stable, so a
 * re-render never reshuffles the strip under the user's cursor.
 *
 * Wrap in `useMemo` keyed on the graph. This walks the edge list a handful of
 * times; cheap for canvas-sized graphs, wasteful on every keystroke.
 */
export function analyseWorkflow(graph: WorkflowGraph): WorkflowRecommendation[] {
  const found = CHECKS.flatMap((check) => check(graph));
  return found.sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
}

export interface RecommendationCounts {
  blocker: number;
  warning: number;
  suggestion: number;
  total: number;
}

/** Counts for list-row badges, so a row doesn't have to render the prose. */
export function countRecommendations(recs: WorkflowRecommendation[]): RecommendationCounts {
  const counts: RecommendationCounts = { blocker: 0, warning: 0, suggestion: 0, total: recs.length };
  for (const r of recs) counts[r.severity] += 1;
  return counts;
}

/**
 * The AUTO-RUN eligibility gate — read by the builder's arm switch, by
 * `autoRunner`'s pass, and (via `countRecommendations().blocker > 0`, which is
 * the same predicate spelled differently) by the Automation Center's row
 * switches. They must agree, and they do: every caller feeds from
 * `analyseWorkflow` on the same graph object.
 *
 * **The Run button deliberately does NOT share this gate.** "Blocker" covers
 * three different fates, and an adversarial pass corrected an earlier version of
 * this comment that claimed only two:
 *   1. *Refuses to start* — no trigger, or a cycle. `startRunSimulated` rejects
 *      these by name and says why. (NOTE: its third refusal, "nothing reachable
 *      from the trigger", is unreachable in practice — `reachableFrom` seeds its
 *      visited set with the start node, so a graph that HAS a trigger always has
 *      at least one non-skipped step. "Nothing is connected" is also only a
 *      warning here, never a blocker.)
 *   2. *Starts, and skips the broken step* — a node whose `nodeConfigIssue` is
 *      non-null becomes a `skipped` step carrying that reason into the run log.
 *   3. *Starts, runs the step, and matches nothing* — `impossible-condition`.
 *      `nodeConfigIssue` only flags an EMPTY condition list, so a non-empty but
 *      contradictory one executes normally and honestly logs "0 of N matched".
 *
 * All three are truthful outcomes, which is why Run stays open: pressing it is
 * the fastest way for a user to SEE which fate they have. Gating Run on this
 * would remove the one control that explains a blocker.
 *
 * Auto-run is different in kind: unattended and repeating every ~10s. Arming a
 * graph that will fire forever and achieve nothing is noise the user never sees
 * coming, so it gets the stricter gate. The builder states this disagreement
 * on screen rather than hiding it.
 */
export function hasBlockers(recs: WorkflowRecommendation[]): boolean {
  return recs.some((r) => r.severity === "blocker");
}

/** Convenience for callers that only need the verdict. */
export function workflowBlockers(graph: WorkflowGraph): WorkflowRecommendation[] {
  return analyseWorkflow(graph).filter((r) => r.severity === "blocker");
}
