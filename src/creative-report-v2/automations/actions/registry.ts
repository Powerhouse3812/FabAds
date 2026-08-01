/**
 * Creative Report 2.0 — automation action registry.
 *
 * Extracted from `engine.ts`'s `runRule` (which used to be an `if/else if`
 * chain over `action.type`). A fourth branch (sync) would have piled job
 * creation, per-pair idempotency, provenance capture, honest-label assembly
 * and skip reasons into that switch — this registry is the seam instead, and
 * it's the seam `/automation` (the future top-level Automation module,
 * `src/components/sidebar/modules.ts` → `automation` entry) will also need.
 *
 * Every descriptor is `simulated: true` — this prototype never talks to a
 * real ad platform. `apply()` is the ONLY place with side effects; it must
 * never fabricate an `appliedLabel` for something that didn't actually
 * happen (see `syncToAccounts` below) — when nothing was applied, set
 * `skippedReason` instead so the caller can tell the user why, honestly.
 */
import { pauseMany, queueManyInLaunch } from "@/creative-report-v2/actions/actionStore";
import { addCreativeToBoard, getBoardById } from "@/creative-report-v2/automations/boards";
import type { RuleAction } from "@/creative-report-v2/automations/model";
import { enqueueSyncMany } from "@/creative-report-v2/automations/sync/syncStore";

export interface ActionApplyContext {
  subjectIds: string[];
  ruleId: string;
  /** Captured at run time — records must survive rule deletion. */
  ruleName: string;
  /** ISO, one timestamp per run. */
  at: string;
  source: "auto" | "manual";
}

export interface ActionApplyResult {
  /** Past tense, WITHOUT the "(simulated)" suffix — `runRule` adds that once. */
  appliedLabel: string | null;
  /** Set when nothing was applied and the user must be told why. */
  skippedReason?: string;
  affectedCount: number;
}

export interface WorkflowActionDescriptor<A extends RuleAction = RuleAction> {
  type: A["type"];
  label: string;
  simulated: true;
  apply: (action: A, ctx: ActionApplyContext) => ActionApplyResult;
}

export const ACTION_REGISTRY: { [K in RuleAction["type"]]: WorkflowActionDescriptor<Extract<RuleAction, { type: K }>> } = {
  addToBoard: {
    type: "addToBoard",
    label: "File into board",
    simulated: true,
    apply: (action, ctx) => {
      // getBoardById lets us verify the board still resolves instead of
      // relying on addCreativeToBoard's silent no-op when it was deleted
      // after this rule was created — the summary must never claim a
      // filing that didn't happen.
      const board = getBoardById(action.boardId);
      if (!board) {
        return {
          appliedLabel: null,
          skippedReason: "the target board no longer exists — nothing was filed",
          affectedCount: 0,
        };
      }
      for (const id of ctx.subjectIds) addCreativeToBoard(action.boardId, id);
      return { appliedLabel: `filed into "${board.name}"`, affectedCount: ctx.subjectIds.length };
    },
  },

  pause: {
    type: "pause",
    label: "Pause",
    simulated: true,
    apply: (_action, ctx) => {
      pauseMany(ctx.subjectIds);
      return { appliedLabel: "paused", affectedCount: ctx.subjectIds.length };
    },
  },

  queueInLaunch: {
    type: "queueInLaunch",
    label: "Queue in Launch",
    simulated: true,
    apply: (_action, ctx) => {
      queueManyInLaunch(ctx.subjectIds);
      return { appliedLabel: "queued for relaunch", affectedCount: ctx.subjectIds.length };
    },
  },

  syncToAccounts: {
    type: "syncToAccounts",
    label: "Sync to ad accounts",
    simulated: true,
    apply: (action, ctx) => {
      const { queued, skipped } = enqueueSyncMany(ctx.subjectIds, action.accountIds, {
        ruleId: ctx.ruleId,
        ruleName: ctx.ruleName,
      });
      if (queued === 0 && skipped > 0) {
        // Every pair was already synced — this is NOT a success. Never imply
        // an upload happened when it didn't.
        return {
          appliedLabel: null,
          skippedReason: "every creative/account pair was already synced — nothing new was queued",
          affectedCount: 0,
        };
      }
      // `queued` counts creative/account PAIRS, not accounts — reporting it as
      // an account count claimed "39 ad accounts" when one account was picked.
      // Count uploads, and take the account count from the action itself.
      const uploadWord = queued === 1 ? "upload" : "uploads";
      const accountCount = action.accountIds.length;
      const accountWord = accountCount === 1 ? "ad account" : "ad accounts";
      let appliedLabel = `queued ${queued} ${uploadWord} to ${accountCount} ${accountWord}`;
      if (skipped > 0) appliedLabel += ` · ${skipped} already there`;
      return { appliedLabel, affectedCount: queued };
    },
  },
};
