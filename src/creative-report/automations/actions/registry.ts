/**
 * Creative Report 2.0 — automation action registry.
 *
 * Extracted from `engine.ts`'s `runRule` (which used to be an `if/else if`
 * chain over `action.type`) — this registry is the seam instead, and it's
 * the seam `/automation` (the future top-level Automation module,
 * `src/components/sidebar/modules.ts` → `automation` entry) will also need.
 *
 * Scoped down (Maalik, 2026-07-31) to `addToFolder`, filing into a REAL
 * Creative Library folder (`cl_folders`). The old `addToBoard` (synthetic
 * Board) and `pause`/`queueInLaunch` (launch rule type, deprioritized)
 * descriptors stay gone.
 *
 * RESTORED (Maalik, 2026-08-01): `syncToAccounts` is back below — it queues
 * matching creatives for a simulated upload to one or more Meta ad account
 * libraries via `enqueueSyncMany`. Its result is read by exactly one surface
 * now, `SyncStatusPanel` in the drawer — the card badge / table column /
 * bulk-bar warning this data used to also feed are deliberately not wired
 * back up.
 *
 * `simulated: true` — this prototype never talks to a real ad platform or
 * writes to Supabase. `apply()` is the ONLY place with side effects; it must
 * never fabricate an `appliedLabel` for something that didn't actually
 * happen — when nothing was applied, set `skippedReason` instead so the
 * caller can tell the user why, honestly.
 */
import type { RuleAction } from "@/creative-report/automations/model";
import { enqueueSyncMany } from "@/creative-report/automations/sync/syncStore";
import { ACCOUNT_BY_ID } from "@/data/accounts";

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
  addToFolder: {
    type: "addToFolder",
    label: "File into folder",
    simulated: true,
    // No skip path — there is no live existence check against `cl_folders`
    // from this non-React, module-level context (no Supabase client reachable
    // from the runner's clock tick). This is a deliberate, documented
    // limitation, not an oversight. It always "succeeds" because nothing real
    // is ever written: same honesty principle as the sync feature it
    // replaces — no fabricated failures, no fabricated success either, since
    // reporting success is not a lie about anything real when the whole
    // action is simulated by design.
    apply: (action, ctx) => ({
      appliedLabel: `filed into "${action.folderName}"`, // engine.ts appends "(simulated)" once, don't duplicate it
      affectedCount: ctx.subjectIds.length,
    }),
  },
  syncToAccounts: {
    type: "syncToAccounts",
    label: "Sync to ad account library",
    simulated: true,
    // Delegates the actual queueing + duplicate-pair guard to
    // `enqueueSyncMany` (sync/syncStore.ts) — a (creative, account) pair
    // already queued/running/done by ANY rule (or a manual action) is
    // skipped, never re-uploaded. `queued === 0 && skipped > 0` is the
    // "every pair was already synced" case: that is NOT a success and must
    // not report an appliedLabel, or the toast/summary would imply an
    // upload happened when nothing was queued.
    apply: (action, ctx) => {
      const { queued, skipped } = enqueueSyncMany(ctx.subjectIds, action.accountIds, {
        ruleId: ctx.ruleId,
        ruleName: ctx.ruleName,
      });

      // Resolve account NAMES, never raw ids — an id whose account has since
      // been removed from the mock directory falls back to a phrase that
      // doesn't fabricate a name either.
      const accountNames = action.accountIds
        .map((id) => ACCOUNT_BY_ID[id]?.name)
        .filter((name): name is string => !!name);
      const accountLabel = accountNames.length > 0 ? accountNames.join(", ") : "the selected accounts";

      if (queued === 0 && skipped > 0) {
        return {
          appliedLabel: null,
          skippedReason: `every matching creative was already synced to ${accountLabel}`,
          affectedCount: 0,
        };
      }

      const result: ActionApplyResult = {
        appliedLabel: `queued for sync to ${accountLabel}`, // engine.ts appends "(simulated)" once, don't duplicate it
        affectedCount: queued,
      };
      if (skipped > 0) {
        result.skippedReason = `${skipped} ${skipped === 1 ? "pair was" : "pairs were"} already synced and skipped`;
      }
      return result;
    },
  },
};
