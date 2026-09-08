/**
 * model.ts — the Automations module's node/graph vocabulary.
 *
 * This is the domain-aware layer that sits on top of `@/workflows/core`'s
 * domain-free graph walks. Split rationale: `core/graph.ts` knows about ids,
 * edges and cycles; THIS file knows that a "condition" filters creatives and
 * that "syncFolderToAccounts" talks to Meta.
 *
 * AUTOMATION vs WORKFLOW (Maalik + Neeraj, Slack 2026-08-03):
 *   Automation = ONE condition -> ONE action, a dead end. That already exists
 *     as the Creative Report v3 rule engine (`@/creative-report/automations`)
 *     and is NOT reimplemented here — the Automations home surfaces those
 *     rules read-mostly in its "Reporting automations" tab.
 *   Workflow  = multiple conditions, multiple MODULES, multiple actions
 *     CHAINED. That is what this module builds, on a canvas.
 * Canonical chain: creative-report metric -> generate variation (Genie) ->
 * add to folder -> sync folder to a Meta ad account.
 *
 * NO `@xyflow/react` IMPORT IN THIS FILE — deliberate. `graphStore.ts` imports
 * these types and is itself imported by the non-lazy Automations home, so a
 * react-flow import here (even type-only, which is fragile under
 * `isolatedModules`-style transpilation if someone later imports a value)
 * risks pulling ~50 kB of canvas into the main bundle. The
 * WorkflowNode <-> react-flow Node mappers therefore live in
 * `canvas/flowAdapters.ts`, inside the lazy chunk.
 */
import type { WorkflowCondition, WorkflowSchedule, GraphEdge } from "@/workflows/core";
import { wouldCreateCycle } from "@/workflows/core";

/* ------------------------------------------------------------------ */
/*  Status tags                                                        */
/* ------------------------------------------------------------------ */

/**
 * The user-definable status vocabulary Neeraj asked to expose as a full
 * dropdown ("wo poora dropdown dalo fir wha") — the same four labels the
 * Creative Report shows as buckets.
 *
 * HONESTY BOUNDARY: applying one of these via a workflow writes a SIMULATED
 * display tag (see `statusStore.ts`), it does NOT change the creative's
 * report bucket. Buckets are derived from thresholds by a private
 * `assignBucket` in `@/creative-report/lib/selectors`, with no override
 * mechanism; inventing one here would make every bucket-derived surface in
 * the report disagree with itself. Every surface that shows a workflow status
 * tag must say so.
 */
export const WORKFLOW_STATUS_TAGS = ["winner", "loser", "fatigue", "scaling"] as const;
export type WorkflowStatusTag = (typeof WORKFLOW_STATUS_TAGS)[number];

export const STATUS_TAG_LABELS: Record<WorkflowStatusTag, string> = {
  winner: "Winner",
  loser: "Loser",
  fatigue: "Fatiguing",
  scaling: "Scaling",
};

/* ------------------------------------------------------------------ */
/*  Nodes                                                              */
/* ------------------------------------------------------------------ */

/** Which module a `source` node draws its subjects from. Only one today; the
 *  field exists so a second domain is a new union member, not a migration. */
export const SOURCE_MODULES = ["creative-report"] as const;
export type SourceModule = (typeof SOURCE_MODULES)[number];

/**
 * What a sync step pushes. See the `syncFolderToAccounts` node data for the
 * decision history — both granularities are first-class as of 2026-08-13.
 */
export const SYNC_GRANULARITIES = ["folder", "creatives"] as const;
export type SyncGranularity = (typeof SYNC_GRANULARITIES)[number];

export const SYNC_GRANULARITY_META: Record<
  SyncGranularity,
  { label: string; blurb: string }
> = {
  folder: {
    label: "Whole folder",
    blurb: "Push a launch-ready folder to the ad account as one unit",
  },
  creatives: {
    label: "Matched creatives",
    blurb: "Push only the creatives this run matched, without a folder",
  },
};

export type WorkflowNodeKind =
  | "source"
  | "condition"
  | "markStatus"
  | "generateVariation"
  | "addToFolder"
  | "syncFolderToAccounts"
  | "note";

export const WORKFLOW_NODE_KINDS: WorkflowNodeKind[] = [
  "source",
  "condition",
  "markStatus",
  "generateVariation",
  "addToFolder",
  "syncFolderToAccounts",
  "note",
];

export type WorkflowNodeData =
  /** Trigger / subject source. Exactly one per graph. */
  | { kind: "source"; module: SourceModule }
  /** AND-chained within the node. Chained condition nodes AND across, fan-out branches. */
  | { kind: "condition"; conditions: WorkflowCondition[] }
  | { kind: "markStatus"; status: WorkflowStatusTag }
  /** How many simulated Genie variants to emit per incoming creative. */
  | { kind: "generateVariation"; count: number }
  /** `folderName` is a denormalised snapshot — same reasoning as v3's
   *  AddToFolderAction: the runner ticks off a module-level clock with no
   *  React/Supabase in scope, so it can never re-fetch `cl_folders` live. */
  | { kind: "addToFolder"; folderId: string; folderName: string }
  /**
   * Meta ad-account libraries. `accountIds` re-validated against ACCOUNT_BY_ID
   * on load.
   *
   * `mode` settles the open product call from the Aug-3 thread (Neeraj: "sync
   * folders ke against hona chahiye, ad accounts ke nahi") against what the
   * first build shipped (creative -> account pairs). Maalik's ruling
   * 2026-08-13: support BOTH, in one node, because they are different jobs —
   * "folder" pushes a launch-ready folder as a unit, "creatives" pushes just
   * the creatives this run matched. One node with a mode beats two node kinds:
   * the grammar, the executor and the config panel all stay single-copy.
   *
   * `folderId`/`folderName` are only meaningful in "folder" mode, and are a
   * denormalised snapshot for the same reason `addToFolder` denormalises —
   * the runner ticks off a module-level clock with no React/Supabase in scope
   * and can never re-fetch `cl_folders` live.
   */
  | {
      kind: "syncFolderToAccounts";
      accountIds: string[];
      mode: SyncGranularity;
      folderId?: string;
      folderName?: string;
    }
  /** On-canvas sticky. Never executes, never connects. */
  | { kind: "note"; text: string };

export interface WorkflowNode {
  id: string;
  /** Mirrors `data.kind`. Duplicated at the top level so the sanitiser can
   *  gate on a cheap string check before it trusts the `data` payload. */
  kind: WorkflowNodeKind;
  /** Editor coordinate space (react-flow). Persisted — a saved workflow must
   *  reopen with the same layout the user arranged. */
  position: { x: number; y: number };
  data: WorkflowNodeData;
}

export interface WorkflowEdgeModel {
  id: string;
  source: string;
  target: string;
}

/* ------------------------------------------------------------------ */
/*  Graph                                                             */
/* ------------------------------------------------------------------ */

export interface WorkflowGraph {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdgeModel[];
  /**
   * Armed for unattended auto-run. LIVE as of 2026-08-13 — `autoRunner.ts`
   * re-checks armed graphs about every 10 seconds and starts at most one run a
   * minute, so this is no longer the "coming soon" placeholder it shipped as.
   *
   * The clock is in-page, so an armed workflow does nothing while the tab is
   * closed, and every surface that shows this must say so — `enabled` alone
   * would read as a server-side promise the prototype cannot keep. That is v3's
   * BoardsPanel principle applied to auto-run: a switch that silently does
   * nothing "would make that switch a lie".
   *
   * Arming is gated on the graph having no blockers (`hasBlockers` in
   * `recommendations.ts`). Every surface that offers the switch — the builder
   * and the Automation Center list — refuses to turn it ON while blockers
   * exist, and the runner's eligibility pass reads the same function, so no two
   * of them can give different answers about one workflow. Turning it OFF is
   * always allowed everywhere; a user must never be trapped with a workflow
   * armed.
   *
   * Note this flag is stored INTENT, not the live verdict. An armed workflow
   * that is outside its date range is a legitimate disagreement between
   * `enabled` and `describeAutoRunState(...).armed` — one the UI must explain,
   * never paper over by binding the switch to the derived verdict.
   */
  enabled: boolean;
  schedule?: WorkflowSchedule;
  /**
   * Written recommendation strips (Neeraj: "kuch chije likhni pdegi in
   * automation — recommendations, like add naming conditions if you run
   * multiple niches"). Graph-level PROSE metadata, not executable nodes —
   * keeping advice out of the node union means the run engine has no no-op
   * kinds to skip.
   *
   * This is the HAND-AUTHORED half, per template. The DERIVED half — advice
   * computed from the graph the user actually built — lives in
   * `recommendations.ts` and is deliberately not stored: a cached verdict can
   * disagree with the graph it describes.
   */
  recommendations: string[];
  /** true => "FabFunnel benchmark" badge (the pre-seeded templates). */
  benchmark: boolean;
  /** Which seed template this was cloned from, if any. */
  templateId?: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
}

/* ------------------------------------------------------------------ */
/*  Node presentation metadata                                        */
/* ------------------------------------------------------------------ */

export interface NodeKindMeta {
  label: string;
  /** One-line palette description. */
  blurb: string;
  /** Grouping in the palette + node chrome family. */
  family: "trigger" | "condition" | "action" | "annotation";
}

export const NODE_KIND_META: Record<WorkflowNodeKind, NodeKindMeta> = {
  source: {
    label: "Creative Report",
    blurb: "Every creative in the report, unfiltered",
    family: "trigger",
  },
  condition: {
    label: "Condition",
    blurb: "Keep only creatives that match",
    family: "condition",
  },
  markStatus: {
    label: "Set status",
    blurb: "Tag as winner / loser / fatiguing / scaling",
    family: "action",
  },
  generateVariation: {
    label: "Generate variation",
    blurb: "Ask Genie for new creatives",
    family: "action",
  },
  addToFolder: {
    label: "Add to folder",
    blurb: "File into a Creative Library folder",
    family: "action",
  },
  syncFolderToAccounts: {
    label: "Sync to ad account",
    blurb: "Upload a folder — or just this run's matches — to a Meta ad library",
    family: "action",
  },
  note: {
    label: "Note",
    blurb: "A sticky reminder on the canvas",
    family: "annotation",
  },
};

/** Default `data` for a freshly-dropped node of each kind. Intentionally
 *  under-configured (empty conditions, no folder) so the config panel has
 *  something to ask for — and so a half-built node reads as unfinished
 *  rather than silently doing the wrong thing. */
export function defaultDataForKind(kind: WorkflowNodeKind): WorkflowNodeData {
  switch (kind) {
    case "source":
      return { kind: "source", module: "creative-report" };
    case "condition":
      return { kind: "condition", conditions: [] };
    case "markStatus":
      return { kind: "markStatus", status: "winner" };
    case "generateVariation":
      return { kind: "generateVariation", count: 2 };
    case "addToFolder":
      return { kind: "addToFolder", folderId: "", folderName: "" };
    case "syncFolderToAccounts":
      // Folder-first default: Neeraj's stated position, and the safer of the
      // two — a folder sync is the launch-ready path.
      return { kind: "syncFolderToAccounts", accountIds: [], mode: "folder" };
    case "note":
      return { kind: "note", text: "" };
  }
}

/** Is this node fully configured enough to do what it claims? Drives the
 *  "needs setup" chip on the node and the run engine's honest skip reason. */
export function nodeConfigIssue(data: WorkflowNodeData): string | null {
  switch (data.kind) {
    case "condition":
      // Zero conditions is NOT "match everything" — `evaluateConditions`
      // returns [] for an empty list, deliberately (see evaluate.ts). Say so
      // rather than letting a user build a workflow that quietly matches
      // nothing.
      return data.conditions.length === 0 ? "Add at least one condition" : null;
    case "addToFolder":
      return data.folderId ? null : "Choose a folder";
    case "syncFolderToAccounts":
      if (data.accountIds.length === 0) return "Choose at least one ad account";
      // Folder mode without a folder would silently fall back to "whatever the
      // chain happened to file", which is exactly the kind of quiet guess this
      // function exists to prevent.
      if (data.mode === "folder" && !data.folderId) return "Choose the folder to push";
      return null;
    case "generateVariation":
      return data.count > 0 ? null : "Set how many variations";
    case "note":
      return data.text.trim() ? null : "Write the note";
    case "source":
    case "markStatus":
      return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Connection grammar                                                */
/* ------------------------------------------------------------------ */

/**
 * Which kinds may follow which. The grammar Neeraj described: trigger ->
 * conditions -> actions, with actions chainable.
 *
 * `syncFolderToAccounts` is terminal (an upload is the end of a chain — there
 * is nothing meaningful to hand onward), and `note` never connects at all.
 */
export const CONNECTION_RULES: Record<WorkflowNodeKind, WorkflowNodeKind[]> = {
  source: ["condition", "markStatus", "generateVariation", "addToFolder", "syncFolderToAccounts"],
  condition: ["condition", "markStatus", "generateVariation", "addToFolder", "syncFolderToAccounts"],
  markStatus: ["markStatus", "generateVariation", "addToFolder", "syncFolderToAccounts"],
  // A generated variation has no metrics yet, so re-filtering it on metrics
  // would be meaningless — condition is deliberately absent downstream of it.
  generateVariation: ["markStatus", "addToFolder", "syncFolderToAccounts"],
  addToFolder: ["markStatus", "generateVariation", "syncFolderToAccounts"],
  syncFolderToAccounts: [],
  note: [],
};

export interface ConnectionCheck {
  ok: boolean;
  /** Present when `ok` is false — shown as the reason a link refused to snap. */
  reason?: string;
}

/**
 * Full legality check for one proposed edge. Called from react-flow's
 * `isValidConnection` (so it must stay cheap — it runs on drag) and again at
 * save time.
 *
 * Order matters: structural impossibilities first, cycle check last, because
 * the cycle walk is the only one that touches the whole edge list.
 */
export function checkConnection(
  candidate: { source: string; target: string },
  nodes: WorkflowNode[],
  edges: WorkflowEdgeModel[],
): ConnectionCheck {
  if (candidate.source === candidate.target) {
    return { ok: false, reason: "A step can't connect to itself" };
  }

  const sourceNode = nodes.find((n) => n.id === candidate.source);
  const targetNode = nodes.find((n) => n.id === candidate.target);
  if (!sourceNode || !targetNode) {
    return { ok: false, reason: "One of these steps no longer exists" };
  }

  if (targetNode.kind === "source") {
    return { ok: false, reason: "The trigger is always the start of a workflow" };
  }
  if (sourceNode.kind === "note" || targetNode.kind === "note") {
    return { ok: false, reason: "Notes are annotations — they don't run" };
  }

  const allowed = CONNECTION_RULES[sourceNode.kind];
  if (!allowed.includes(targetNode.kind)) {
    if (allowed.length === 0) {
      return {
        ok: false,
        reason: `"${NODE_KIND_META[sourceNode.kind].label}" ends a workflow`,
      };
    }
    return {
      ok: false,
      reason: `"${NODE_KIND_META[sourceNode.kind].label}" can't lead into "${NODE_KIND_META[targetNode.kind].label}"`,
    };
  }

  if (edges.some((e) => e.source === candidate.source && e.target === candidate.target)) {
    return { ok: false, reason: "These steps are already connected" };
  }

  if (wouldCreateCycle(edges as GraphEdge[], candidate)) {
    return { ok: false, reason: "That would make the workflow loop back on itself" };
  }

  return { ok: true };
}

/** Boolean-only form for react-flow's `isValidConnection`. */
export function isLegalConnection(
  candidate: { source: string; target: string },
  nodes: WorkflowNode[],
  edges: WorkflowEdgeModel[],
): boolean {
  return checkConnection(candidate, nodes, edges).ok;
}

/** The single `source` node, if the graph has one. */
export function findSourceNode(nodes: WorkflowNode[]): WorkflowNode | undefined {
  return nodes.find((n) => n.kind === "source");
}

/** A graph may hold exactly one trigger — the palette disables `source` once
 *  one is placed, and this backs that check. */
export function canAddKind(kind: WorkflowNodeKind, nodes: WorkflowNode[]): boolean {
  if (kind !== "source") return true;
  return !findSourceNode(nodes);
}

/* ------------------------------------------------------------------ */
/*  Human-readable summaries (shared by node cards, list rows, run log) */
/* ------------------------------------------------------------------ */

/** One-line summary of what a configured node will do. Never invents a value:
 *  an unconfigured node reports its issue instead of a confident-looking blank. */
export function describeNode(data: WorkflowNodeData): string {
  const issue = nodeConfigIssue(data);
  if (issue) return issue;

  switch (data.kind) {
    case "source":
      return "Every creative in the report";
    case "condition":
      return data.conditions.length === 1
        ? "1 condition"
        : `${data.conditions.length} conditions (all must match)`;
    case "markStatus":
      return `Tag as ${STATUS_TAG_LABELS[data.status]}`;
    case "generateVariation":
      return data.count === 1 ? "1 variation each" : `${data.count} variations each`;
    case "addToFolder":
      return `Into "${data.folderName || data.folderId}"`;
    case "syncFolderToAccounts": {
      const target =
        data.accountIds.length === 1 ? "1 ad account" : `${data.accountIds.length} ad accounts`;
      return data.mode === "folder"
        ? `"${data.folderName || data.folderId}" → ${target}`
        : `Matched creatives → ${target}`;
    }
    case "note":
      return data.text;
  }
}
