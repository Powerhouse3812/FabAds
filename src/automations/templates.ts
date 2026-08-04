/**
 * templates.ts — hand-authored seed workflows for the Automations canvas.
 *
 * Every graph here is STATIC DATA: literal ids, fixed ISO timestamps, no
 * clock- or random-number-derived values anywhere. `graphStore.ts` seeds
 * these into `"workflows-graphs"` the first time the key is absent (see its
 * `readInitial()`), and `cloneWorkflowFromTemplate()` deep-clones one of these
 * into a fresh, independently-editable graph with new ids.
 *
 * `benchmark: true` + `enabled: false` on all three — these are the
 * "FabFunnel benchmark" reference workflows, never auto-running out of the
 * box (per `WorkflowGraph.enabled`'s doc: an enabled switch that does nothing
 * would be a lie, and these ship unconfigured against a real account/folder
 * choice the user hasn't made yet).
 *
 * `folderId` values below (`"tpl-folder-winners"`, `"tpl-folder-refresh"`)
 * are PLACEHOLDER ids for seed data only — real `cl_folders` ids are
 * workspace-scoped and unknowable at module load time. The config panel on
 * the `addToFolder` node is where a user picks a real folder; until they do,
 * `nodeConfigIssue` has no opinion here (folderId is non-empty, so the node
 * reads as configured) — that's an accepted seam of shipping example data,
 * not a bug.
 */
import type { WorkflowGraph } from "@/automations/model";

const SEED_TIMESTAMP = "2026-08-01T09:00:00.000Z";

/* ------------------------------------------------------------------ */
/*  Template 1 — Scale winners into new variations                    */
/* ------------------------------------------------------------------ */

const SCALE_WINNERS: WorkflowGraph = {
  id: "wf-tpl-scale-winners",
  name: "Scale winners into new variations",
  nodes: [
    {
      id: "wf-tpl-scale-winners-n1",
      kind: "source",
      position: { x: 80, y: 180 },
      data: { kind: "source", module: "creative-report" },
    },
    {
      id: "wf-tpl-scale-winners-n2",
      kind: "condition",
      position: { x: 330, y: 180 },
      data: {
        kind: "condition",
        conditions: [
          { field: "roas", operator: "gte", value: 3 },
          { field: "spend", operator: "gte", value: 500 },
        ],
      },
    },
    {
      id: "wf-tpl-scale-winners-n3",
      kind: "generateVariation",
      position: { x: 580, y: 180 },
      data: { kind: "generateVariation", count: 2 },
    },
    {
      id: "wf-tpl-scale-winners-n4",
      kind: "addToFolder",
      position: { x: 830, y: 180 },
      // Placeholder folder id — see file header note.
      data: { kind: "addToFolder", folderId: "tpl-folder-winners", folderName: "Winners" },
    },
    {
      id: "wf-tpl-scale-winners-n5",
      kind: "syncFolderToAccounts",
      position: { x: 1080, y: 180 },
      // Real ids from src/data/accounts.ts — the 3 "meta" platform accounts.
      data: {
        kind: "syncFolderToAccounts",
        accountIds: ["acc-amalfa-meta", "acc-glowkart", "acc-peaksupps"],
      },
    },
    {
      id: "wf-tpl-scale-winners-n6",
      kind: "note",
      position: { x: 330, y: 360 },
      data: { kind: "note", text: "Sync runs against the folder, not individual ad accounts." },
    },
  ],
  edges: [
    { id: "wf-tpl-scale-winners-e1", source: "wf-tpl-scale-winners-n1", target: "wf-tpl-scale-winners-n2" },
    { id: "wf-tpl-scale-winners-e2", source: "wf-tpl-scale-winners-n2", target: "wf-tpl-scale-winners-n3" },
    { id: "wf-tpl-scale-winners-e3", source: "wf-tpl-scale-winners-n3", target: "wf-tpl-scale-winners-n4" },
    { id: "wf-tpl-scale-winners-e4", source: "wf-tpl-scale-winners-n4", target: "wf-tpl-scale-winners-n5" },
  ],
  enabled: false,
  recommendations: [
    "Add a naming condition if you run multiple niches — otherwise variations from different products land in the same folder.",
    "Benchmarks are set from the FabFunnel account and shown for reference, not applied automatically.",
  ],
  benchmark: true,
  createdAt: SEED_TIMESTAMP,
  updatedAt: SEED_TIMESTAMP,
};

/* ------------------------------------------------------------------ */
/*  Template 2 — Retire underperformers                                */
/* ------------------------------------------------------------------ */

const RETIRE_LOSERS: WorkflowGraph = {
  id: "wf-tpl-retire-losers",
  name: "Retire underperformers",
  nodes: [
    {
      id: "wf-tpl-retire-losers-n1",
      kind: "source",
      position: { x: 80, y: 180 },
      data: { kind: "source", module: "creative-report" },
    },
    {
      id: "wf-tpl-retire-losers-n2",
      kind: "condition",
      position: { x: 330, y: 180 },
      data: {
        kind: "condition",
        conditions: [
          { field: "roas", operator: "lt", value: 1 },
          { field: "spend", operator: "gte", value: 500 },
        ],
      },
    },
    {
      id: "wf-tpl-retire-losers-n3",
      kind: "markStatus",
      position: { x: 580, y: 180 },
      data: { kind: "markStatus", status: "loser" },
    },
  ],
  edges: [
    { id: "wf-tpl-retire-losers-e1", source: "wf-tpl-retire-losers-n1", target: "wf-tpl-retire-losers-n2" },
    { id: "wf-tpl-retire-losers-e2", source: "wf-tpl-retire-losers-n2", target: "wf-tpl-retire-losers-n3" },
  ],
  enabled: false,
  recommendations: [
    "Review the matched list before pausing spend in Meta — this only tags a status here, it doesn't touch live budgets.",
  ],
  benchmark: true,
  createdAt: SEED_TIMESTAMP,
  updatedAt: SEED_TIMESTAMP,
};

/* ------------------------------------------------------------------ */
/*  Template 3 — Refresh fatiguing creatives                           */
/* ------------------------------------------------------------------ */

const FATIGUE_REFRESH: WorkflowGraph = {
  id: "wf-tpl-fatigue-refresh",
  name: "Refresh fatiguing creatives",
  nodes: [
    {
      id: "wf-tpl-fatigue-refresh-n1",
      kind: "source",
      position: { x: 80, y: 180 },
      data: { kind: "source", module: "creative-report" },
    },
    {
      id: "wf-tpl-fatigue-refresh-n2",
      kind: "condition",
      position: { x: 330, y: 180 },
      data: {
        kind: "condition",
        conditions: [{ field: "fatiguing", operator: "eq", value: "true" }],
      },
    },
    {
      id: "wf-tpl-fatigue-refresh-n3",
      kind: "markStatus",
      position: { x: 580, y: 180 },
      data: { kind: "markStatus", status: "fatigue" },
    },
    {
      id: "wf-tpl-fatigue-refresh-n4",
      kind: "generateVariation",
      position: { x: 830, y: 180 },
      data: { kind: "generateVariation", count: 3 },
    },
    {
      id: "wf-tpl-fatigue-refresh-n5",
      kind: "addToFolder",
      position: { x: 1080, y: 180 },
      // Placeholder folder id — see file header note.
      data: { kind: "addToFolder", folderId: "tpl-folder-refresh", folderName: "Refresh queue" },
    },
  ],
  edges: [
    { id: "wf-tpl-fatigue-refresh-e1", source: "wf-tpl-fatigue-refresh-n1", target: "wf-tpl-fatigue-refresh-n2" },
    { id: "wf-tpl-fatigue-refresh-e2", source: "wf-tpl-fatigue-refresh-n2", target: "wf-tpl-fatigue-refresh-n3" },
    { id: "wf-tpl-fatigue-refresh-e3", source: "wf-tpl-fatigue-refresh-n3", target: "wf-tpl-fatigue-refresh-n4" },
    { id: "wf-tpl-fatigue-refresh-e4", source: "wf-tpl-fatigue-refresh-n4", target: "wf-tpl-fatigue-refresh-n5" },
  ],
  enabled: false,
  recommendations: [
    "Pair this with a lower variation count if Genie's fatigue signal is noisy for your account — 3 fresh cuts per fatiguing creative adds up fast at scale.",
  ],
  benchmark: true,
  createdAt: SEED_TIMESTAMP,
  updatedAt: SEED_TIMESTAMP,
};

export const WORKFLOW_TEMPLATES: WorkflowGraph[] = [SCALE_WINNERS, RETIRE_LOSERS, FATIGUE_REFRESH];
