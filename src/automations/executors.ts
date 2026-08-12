/**
 * executors.ts — per-node-kind execution logic for a SIMULATED workflow run.
 *
 * Same spirit as the Creative Report v3 action registry
 * (`@/creative-report/automations/actions/registry.ts`), one shape different:
 * v3's `apply()` is subject-ids-in / label-out, because a v3 automation is a
 * dead end (one condition -> one action). A workflow CHAINS, so an executor
 * here is payload-in / payload-out — it returns the `RunItem[]` that flows
 * down the outgoing edges as well as the honest past-tense `detail`.
 *
 * HONESTY CONVENTIONS (inherited from v3, do not relax):
 *  - `detail` is PAST TENSE and carries NO trailing "(simulated)" — the caller
 *    (`runEngine`) appends that exactly once, so it can never be doubled or
 *    dropped.
 *  - Nothing applied => say why. A step that queued zero uploads must not read
 *    like a step that queued some ("every creative was already synced to X",
 *    not "queued 0 for sync").
 *  - Never print a raw id where a name belongs — resolve account names through
 *    `ACCOUNT_BY_ID`, and fall back to a phrase ("the selected accounts") that
 *    fabricates no name either.
 *  - Never fabricate data to make a step look busier than it was. Generated
 *    variations get no invented metrics and no dataset rows; see the comments
 *    on `condition` and `generateVariation`.
 *
 * NO CLOCK IN THIS FILE — not one clock call of any kind. Every timestamp
 * arrives as `ctx.at` (one value per step, stamped by the run engine), so a
 * step's recorded time can never drift from the engine's own. NO RANDOMNESS
 * either: `runDataAudit()` must stay ALL PASS, so the repo's only sanctioned
 * random source is `hashString` from `@/data/rng` — which this file does not
 * need, since nothing it produces is random (variation ids are derived from
 * the parent id and an index).
 *
 * Both invariants are grep-checkable — a search for the random helper or
 * either clock constructor must come back empty for this file, comments
 * included, so keep them unspelled here too.
 *
 * SIDE EFFECTS are confined to three calls, all of them stores that already
 * own the "this is simulated" disclaimer themselves: `setStatusTagMany`,
 * `setMarkedWinner`, `enqueueSyncMany`. Everything else is pure.
 */
import { automationSubjects } from "@/creative-report/automations/subjects";
import { matchCreativeCondition } from "@/creative-report/automations/engine";
import { enqueueSyncMany } from "@/creative-report/automations/sync/syncStore";
import { setMarkedWinner } from "@/creative-report/actions/actionStore";
import type { CreativeRollup } from "@/creative-report/lib/selectors";
import { ACCOUNT_BY_ID } from "@/data/accounts";
import { evaluateConditions } from "@/workflows/core";
import { STATUS_TAG_LABELS, type WorkflowNodeData, type WorkflowNodeKind } from "@/automations/model";
import { setStatusTagMany, SIMULATED_STATUS_NOTE } from "@/automations/statusStore";
import type { ExecutorCtx, ExecutorResult, RunItem } from "@/automations/runModel";

export interface ExecutorInput {
  items: RunItem[];
  data: WorkflowNodeData;
  ctx: ExecutorCtx;
  /** Real CreativeRollups for the run, keyed by creative id — built once at
   *  the source step so downstream condition nodes can still resolve metrics. */
  rollupsById: Map<string, CreativeRollup>;
}

export type NodeExecutor = (input: ExecutorInput) => ExecutorResult;

/* ------------------------------------------------------------------ */
/*  Copy helpers                                                       */
/* ------------------------------------------------------------------ */

/** This repo's copy gets scrutinised — every count string is pluralised, so
 *  the noun is never hard-coded next to a `${n}`. */
function count(n: number, singular: string, plural = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

/** Detail clauses are joined with " · " so a step's log line reads as one
 *  sentence with asides, not as three sentences fighting for the same row. */
function joinClauses(clauses: string[]): string {
  return clauses.filter(Boolean).join(" · ");
}

const passThrough = (items: RunItem[], detail: string): ExecutorResult => ({ output: items, detail });

function splitByOrigin(items: RunItem[]): { real: RunItem[]; generated: RunItem[] } {
  return {
    real: items.filter((i) => !i.generated),
    generated: items.filter((i) => i.generated),
  };
}

/* ------------------------------------------------------------------ */
/*  buildRollupIndex                                                   */
/* ------------------------------------------------------------------ */

/**
 * Builds the id -> rollup map (and the source node's item list) from
 * `automationSubjects()`. Called ONCE per run by `runEngine`: the rollup fold
 * is the expensive part, and re-reading it per node would also risk a step
 * mid-run seeing a different subject set than the step before it.
 *
 * `automationSubjects()` hands back its SHARED CACHED ARRAY — it is only read
 * here (a `for…of` walk), never sorted, spliced, or otherwise mutated.
 */
export function buildRollupIndex(): { items: RunItem[]; rollupsById: Map<string, CreativeRollup> } {
  const subjects = automationSubjects();
  const rollupsById = new Map<string, CreativeRollup>();
  const items: RunItem[] = [];

  for (const rollup of subjects) {
    rollupsById.set(rollup.creative.id, rollup);
    items.push({ id: rollup.creative.id, name: rollup.creative.name, generated: false });
  }

  return { items, rollupsById };
}

/* ------------------------------------------------------------------ */
/*  Per-kind executors                                                 */
/* ------------------------------------------------------------------ */

/**
 * The trigger. Ignores whatever `items` says and emits the run's whole subject
 * set — which `runEngine` passes in as `input.items`, straight from
 * `buildRollupIndex()`, so the source step and the rollup index can never
 * disagree about what was in scope.
 */
const source: NodeExecutor = ({ items }) =>
  passThrough(items, `${count(items.length, "creative")} in scope`);

/**
 * Filters real creatives on their real metrics via the v3 matcher.
 *
 * GENERATED ITEMS PASS THROUGH UNFILTERED, and are counted separately. A
 * creative Genie has only just been asked for does not exist in any ad account
 * and has no spend, no ROAS, no impressions — fabricating metrics for it purely
 * so a filter has something to bite on would be exactly the kind of invented
 * data this project forbids. Dropping them silently would be just as
 * dishonest (the user would see a chain quietly lose the variations it just
 * generated), so they flow on and the detail says they were not evaluated.
 * The connection grammar already discourages this shape —
 * `CONNECTION_RULES.generateVariation` omits `condition` — but a condition can
 * still sit downstream of a fan-in, so the executor stays correct on its own.
 */
const condition: NodeExecutor = ({ items, data, rollupsById }) => {
  if (data.kind !== "condition") return passThrough(items, "");

  const { real, generated } = splitByOrigin(items);
  const generatedNote =
    generated.length > 0
      ? `${count(generated.length, "generated variation")} passed through (no metrics yet)`
      : "";

  // Only items that still resolve to a rollup can be evaluated. One that
  // doesn't has aged out of the subject window since the run started — say so
  // rather than counting it as a non-match.
  const subjects: CreativeRollup[] = [];
  for (const item of real) {
    const rollup = rollupsById.get(item.id);
    if (rollup) subjects.push(rollup);
  }
  const missing = real.length - subjects.length;
  const missingNote = missing > 0 ? `${count(missing, "creative")} no longer in the report` : "";

  // Zero conditions returns [] BY DESIGN (see `evaluateConditions` in
  // `@/workflows/core/evaluate.ts`) — an empty list must never mean "match
  // everything". Say that plainly instead of reporting "0 of 12 matched",
  // which reads like the thresholds were simply too tight.
  if (data.conditions.length === 0) {
    return {
      output: generated,
      detail: joinClauses(["no conditions set — nothing matched", generatedNote]),
    };
  }

  const matched = evaluateConditions(data.conditions, subjects, matchCreativeCondition);
  const matchedIds = new Set(matched.map((r) => r.creative.id));

  // Rebuild from `items` so the surviving order is the incoming order — a run
  // log that reshuffles its payload between steps is needlessly hard to read.
  const output = items.filter((item) => item.generated || matchedIds.has(item.id));

  return {
    output,
    detail: joinClauses([`${matched.length} of ${subjects.length} matched`, generatedNote, missingNote]),
  };
};

/**
 * Writes a DISPLAY-ONLY simulated status tag (`statusStore`) — it does not
 * change the creative's report bucket, and `SIMULATED_STATUS_NOTE` is carried
 * into the detail so the run log says so in the store's own words.
 *
 * `winner` additionally flips `setMarkedWinner`, so the Winners affordances the
 * card and drawer already have reflect the workflow instead of quietly
 * disagreeing with it. (That store is not persisted — it resets on reload,
 * see its header — whereas the status tag is; the divergence is the existing
 * store's, not something to paper over here.)
 *
 * Tagging removes nothing, so ALL input passes through unchanged.
 */
const markStatus: NodeExecutor = ({ items, data, ctx }) => {
  if (data.kind !== "markStatus") return passThrough(items, "");

  const { real, generated } = splitByOrigin(items);
  const realIds = real.map((i) => i.id);
  const label = STATUS_TAG_LABELS[data.status];
  // A generated variation has no row in the report yet, so there is nothing
  // for a report-side tag to attach to.
  const generatedNote =
    generated.length > 0
      ? `${count(generated.length, "generated variation")} skipped — not in the report yet`
      : "";

  if (realIds.length === 0) {
    return passThrough(items, joinClauses([`nothing to tag as "${label}"`, generatedNote]));
  }

  const tagged = setStatusTagMany(realIds, {
    status: data.status,
    workflowId: ctx.workflowId,
    workflowName: ctx.workflowName,
    at: ctx.at,
  });

  if (data.status === "winner") {
    for (const id of realIds) setMarkedWinner(id);
  }

  return passThrough(
    items,
    joinClauses([`tagged ${count(tagged, "creative")} as "${label}" — ${SIMULATED_STATUS_NOTE}`, generatedNote]),
  );
};

/**
 * Simulated Genie call: emits `data.count` derived items per incoming item.
 *
 * NO STORE WRITE AND NO DATASET ROWS. Inserting fabricated creatives into the
 * generator's dataset would corrupt the audited creative count and quietly
 * change every metric the Creative Report folds from it — the variations exist
 * only as payload on this run's edges, which is exactly as real as a simulated
 * generation should look.
 *
 * OUTPUT IS THE GENERATED ITEMS ONLY. The canonical chain is
 * metric -> generate -> file -> sync, and what gets filed and uploaded is the
 * NEW creatives; passing the originals along too would re-file the very
 * creatives the workflow was reacting to.
 */
const generateVariation: NodeExecutor = ({ items, data }) => {
  if (data.kind !== "generateVariation") return passThrough(items, "");

  if (items.length === 0) return { output: [], detail: "nothing to vary" };
  // `nodeConfigIssue` already flags a zero count as unfinished setup; the
  // executor stays honest on its own rather than claiming it generated a
  // batch of nothing.
  if (data.count <= 0) return { output: [], detail: "no variation count set — nothing generated" };

  const output: RunItem[] = [];
  for (const item of items) {
    for (let i = 1; i <= data.count; i += 1) {
      output.push({
        id: `${item.id}-var-${i}`,
        name: `${item.name} — variation ${i}`,
        generated: true,
      });
    }
  }

  return {
    output,
    detail: `asked Genie for ${count(output.length, "variation")} across ${count(items.length, "creative")}`,
  };
};

/**
 * Files the payload into a Creative Library folder — SIMULATED, with the same
 * documented limitation as v3's `addToFolder` descriptor: there is no live
 * `cl_folders` write and no existence check, because this runs off a
 * module-level clock tick with no React-Query/Supabase client in scope. It
 * therefore always "succeeds", which is not a lie about anything real when the
 * whole action is simulated by design — and there are no fabricated failures
 * either.
 *
 * Passes input through unchanged: filing is additive, and a sync node
 * downstream needs the same payload.
 */
const addToFolder: NodeExecutor = ({ items, data }) => {
  if (data.kind !== "addToFolder") return passThrough(items, "");

  // Never the raw folderId — an id in a sentence where a name belongs reads
  // like a bug even when the write succeeded.
  const folderLabel = data.folderName.trim() ? `"${data.folderName}"` : "the selected folder";

  if (items.length === 0) return passThrough(items, `nothing to file into ${folderLabel}`);

  return passThrough(items, `filed ${count(items.length, "creative")} into ${folderLabel}`);
};

/**
 * Queues a simulated upload of the payload to one or more Meta ad account
 * libraries, via the same `enqueueSyncMany` v3 uses (so its duplicate-pair
 * guard is shared, not reimplemented).
 *
 * SYNCS WHATEVER WAS FILED, INCLUDING GENERATED VARIATIONS. An earlier version
 * excluded generated items on the grounds that a SyncRecord for a creative that
 * exists in no ad account would be a phantom row. That had it backwards:
 * uploading a new variation into an ad library is precisely HOW it comes to
 * exist there, and excluding it made the canonical chain
 * (condition -> generate -> add to folder -> sync) terminate with nothing to
 * do — the flagship template could never complete. A record for an id the
 * Creative Report doesn't know is inert, not poisonous: the drawer looks
 * records up BY creative id, so one keyed to a variation is simply never
 * rendered.
 *
 * OPEN PRODUCT QUESTION (for the meeting, not resolved here): Neeraj's ask was
 * "sync to meta hme FOLDER k against dena chiye". This still models sync as a
 * creative->account pair, inherited from v3's per-creative upload and its
 * `pairKey` guard. A true folder->account sync would key records on
 * `folder::account` and take its target from the nearest upstream
 * `addToFolder`. The chain demonstrates the intent either way; the record
 * granularity is the part still to decide.
 *
 * TERMINAL: an upload ends a chain (`CONNECTION_RULES.syncFolderToAccounts` is
 * empty), so output is always [].
 */
const syncFolderToAccounts: NodeExecutor = ({ items, data, ctx }) => {
  if (data.kind !== "syncFolderToAccounts") return { output: [], detail: "" };

  const { generated } = splitByOrigin(items);
  // Named, not excluded — see the header. Kept in the detail so a reader can
  // see that part of the payload is newly generated rather than already live.
  const generatedNote =
    generated.length > 0
      ? `${count(generated.length, "newly generated variation")} included`
      : "";

  // Account NAMES, never ids; an id whose account has left the mock directory
  // falls back to a phrase that fabricates no name either.
  const accountNames = data.accountIds
    .map((id) => ACCOUNT_BY_ID[id]?.name)
    .filter((name): name is string => !!name);
  const accountLabel = accountNames.length > 0 ? accountNames.join(", ") : "the selected accounts";

  // `enqueueSyncMany` with no accounts would return {queued: 0, skipped: 0} and
  // fall through to the success wording below — which would claim an upload
  // that never had a destination.
  if (data.accountIds.length === 0) {
    return { output: [], detail: joinClauses(["no ad account selected — nothing was queued", generatedNote]) };
  }

  const syncIds = items.map((i) => i.id);
  if (syncIds.length === 0) {
    return { output: [], detail: `nothing reached this step — nothing to sync to ${accountLabel}` };
  }

  const { queued, skipped } = enqueueSyncMany(syncIds, data.accountIds, {
    ruleId: ctx.workflowId,
    ruleName: ctx.workflowName,
  });

  // v3's rule, kept verbatim: `queued === 0 && skipped > 0` is NOT a success.
  // Reporting one would imply an upload happened when nothing was queued.
  if (queued === 0 && skipped > 0) {
    return {
      output: [],
      detail: joinClauses([`every creative was already synced to ${accountLabel}`, generatedNote]),
    };
  }

  const skippedNote =
    skipped > 0 ? `${count(skipped, "pair")} already synced and skipped` : "";

  return {
    output: [],
    detail: joinClauses([
      `queued ${count(queued, "creative–account pair")} for sync to ${accountLabel}`,
      skippedNote,
      generatedNote,
    ]),
  };
};

/**
 * Notes never execute — `runEngine` excludes them from the run entirely. The
 * entry exists only so `NODE_EXECUTORS` is total over `WorkflowNodeKind`: a
 * partial record would let a future kind be added with no executor and no
 * compile error.
 */
const note: NodeExecutor = () => ({ output: [], detail: "" });

/**
 * Dispatch table. Typed as `Record<WorkflowNodeKind, NodeExecutor>` so
 * `runEngine` can index it with a dynamic `node.kind`; each executor re-narrows
 * `data` itself with a `data.kind !== "…"` guard. Those guard branches are
 * unreachable for a well-formed node (`WorkflowNode.kind` mirrors
 * `data.kind` — see `model.ts`) and are there so a mismatched pair degrades to
 * a harmless pass-through instead of reading a field off the wrong variant.
 */
export const NODE_EXECUTORS: Record<WorkflowNodeKind, NodeExecutor> = {
  source,
  condition,
  markStatus,
  generateVariation,
  addToFolder,
  syncFolderToAccounts,
  note,
};
