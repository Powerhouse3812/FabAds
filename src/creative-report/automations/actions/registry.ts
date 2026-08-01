/**
 * Creative Report 2.0 — automation action registry.
 *
 * Extracted from `engine.ts`'s `runRule` (which used to be an `if/else if`
 * chain over `action.type`) — this registry is the seam instead, and it's
 * the seam `/automation` (the future top-level Automation module,
 * `src/components/sidebar/modules.ts` → `automation` entry) will also need.
 *
 * Scoped down (Maalik, 2026-07-31) to exactly ONE descriptor: `addToFolder`,
 * filing into a REAL Creative Library folder (`cl_folders`). The old
 * `addToBoard` (synthetic Board), `pause`/`queueInLaunch` (launch rule type,
 * deprioritized), and `syncToAccounts` (moved out of Creative Report
 * entirely) descriptors are gone.
 *
 * `simulated: true` — this prototype never talks to a real ad platform or
 * writes to Supabase. `apply()` is the ONLY place with side effects; it must
 * never fabricate an `appliedLabel` for something that didn't actually
 * happen — when nothing was applied, set `skippedReason` instead so the
 * caller can tell the user why, honestly.
 */
import type { RuleAction } from "@/creative-report/automations/model";

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
};
