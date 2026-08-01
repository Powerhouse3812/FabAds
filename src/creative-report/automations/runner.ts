/**
 * runner.ts — the auto-evaluation pass for automation rules.
 *
 * This is the thing that turns "click Run now" into "conditions meet hote hi
 * folder mein file ho jaaye". It owns exactly two decisions:
 *
 *   1. WHEN to evaluate  — every 20th tick of the shared module-level clock.
 *   2. WHICH creatives   — the edge-triggered `newlyMatched` set below.
 *
 * It deliberately owns NEITHER of these:
 *   - WHAT an action does  -> delegated to `ACTION_REGISTRY[type].apply`, so
 *     there is no per-type branch here and no second copy of `engine.ts`'s
 *     action logic.
 *   - WHETHER a creative has already been filed for a rule -> tracked in
 *     `fireLedger.ts`'s edge-trigger marks (guard 2 below).
 *
 * NO REACT STATE. The clock is module-level (`@/workflows/core/clock`) so the
 * pass keeps running as the user moves between the module's screens. Do NOT
 * reach for Genie's `setTimeout`-chain-inside-`useEffect` pattern; that dies
 * the moment its component unmounts.
 *
 * NO `Math.random`. Every outcome is a deterministic function of the dataset,
 * the rules, and the fire marks.
 *
 * RESTORED (Maalik, 2026-08-01): `syncToAccounts` is back as a rule action,
 * so this file's `onTick` once again advances the simulated upload queue
 * every tick via `sync/syncStore.ts`'s `advanceQueue` — cheap; the store
 * early-outs and returns false when nothing is in flight. That's a SEPARATE
 * decision from the ~10s evaluation pass below (WHEN rules re-evaluate):
 * a queued sync record needs to progress toward "done" every tick regardless
 * of whether any rule condition just changed.
 *
 * v3-ONLY: `useWorkflowRunner(enabled)` is mounted once from
 * `CreativeReportLayout` with `enabled` gated on the v3 base path, so
 * `/reports/creative-v2` behaves exactly as it does today.
 */
import { useEffect } from "react";
import {
  registerWorkflowRunner,
  setClockArmed,
  WORKFLOW_TICK_MS,
} from "@/workflows/core";
import { automationSubjects } from "@/creative-report/automations/subjects";
import { evaluateRule } from "@/creative-report/automations/engine";
import { isRuleEligible, type AutomationRule, type RuleAction } from "@/creative-report/automations/model";
import { getRules, recordRuleRun } from "@/creative-report/automations/rulesStore";
import {
  ACTION_REGISTRY,
  type WorkflowActionDescriptor,
} from "@/creative-report/automations/actions/registry";
import { firedFor, markFired, unmarkFired } from "@/creative-report/automations/fireLedger";
import { recordRuleActivity, type RuleRunOutcomeItem } from "@/creative-report/automations/activityStore";
import { advanceQueue } from "@/creative-report/automations/sync/syncStore";
import { toast } from "@/hooks/use-toast";

const RUNNER_ID = "creative-report-automations";

/**
 * One evaluation pass per 20 ticks. At WORKFLOW_TICK_MS = 500 that is ~10s —
 * slow enough that a demo watcher sees discrete events rather than a blur,
 * fast enough that "conditions meet hote hi" reads as immediate.
 */
const EVAL_EVERY_N_TICKS = 20;
export const EVALUATION_INTERVAL_MS = EVAL_EVERY_N_TICKS * WORKFLOW_TICK_MS;

/* ------------------------------------------------------------------ */
/*  Action delegation                                                  */
/* ------------------------------------------------------------------ */

interface RuleOutcome {
  /** Past-tense labels straight from the registry, e.g. `filed into "Winners"`. */
  labels: RuleRunOutcomeItem[];
  /** Honest reasons an action applied nothing, straight from the registry. */
  skipReasons: RuleRunOutcomeItem[];
  /** True when at least one action returned a result of either kind. */
  processed: boolean;
}

const warnedMissingAction = new Set<string>();

/**
 * `ACTION_REGISTRY` is a mapped type keyed by action type, so indexing it with
 * a *union* key collapses `apply` into an intersection of the four signatures
 * and TypeScript reduces its parameter to `never`. The cast re-widens it to the
 * base descriptor; `action` is by construction the variant matching
 * `action.type`, which is the correlation the compiler can't express.
 */
function descriptorFor(type: RuleAction["type"]): WorkflowActionDescriptor<RuleAction> | undefined {
  return ACTION_REGISTRY[type] as unknown as WorkflowActionDescriptor<RuleAction> | undefined;
}

function applyActions(rule: AutomationRule, subjectIds: string[], at: string): RuleOutcome {
  const labels: RuleRunOutcomeItem[] = [];
  const skipReasons: RuleRunOutcomeItem[] = [];
  let processed = false;

  for (const action of rule.actions) {
    const descriptor = descriptorFor(action.type);
    if (!descriptor) {
      // A rule referencing an action type the registry doesn't implement is a
      // wiring bug, not a user error. Warn once per type so it's visible
      // without spamming the console every 10 seconds, and report nothing — so
      // the fire marks stay unset and no toast claims a success.
      if (!warnedMissingAction.has(action.type)) {
        warnedMissingAction.add(action.type);
        console.error(
          `[automations/runner] no ACTION_REGISTRY entry for "${action.type}" — rule "${rule.name}" cannot apply it.`,
        );
      }
      continue;
    }

    const result = descriptor.apply(action, {
      subjectIds,
      ruleId: rule.id,
      // Captured at run time — sync records must survive the rule being deleted.
      ruleName: rule.name,
      at,
      source: "auto",
    });

    if (result.appliedLabel) {
      labels.push({ actionType: action.type, text: result.appliedLabel });
      processed = true;
    } else if (result.skippedReason) {
      skipReasons.push({ actionType: action.type, text: result.skippedReason });
      processed = true;
    }
  }

  return { labels, skipReasons, processed };
}

/* ------------------------------------------------------------------ */
/*  Toasts                                                            */
/* ------------------------------------------------------------------ */

/**
 * Toast policy — at most ONE toast per rule per pass, and only when the rule
 * actually processed something on this edge. Every message carries an explicit
 * "(simulated)": nothing here writes to Supabase or a real ad platform, and
 * the copy must never let a viewer believe otherwise. The registry
 * deliberately returns labels *without* that suffix so it is appended exactly
 * once, here.
 *
 * `addToFolder` never returns a `skippedReason` (see registry.ts), so the
 * common case there is simply "N creatives matched and filed into 'X'
 * (simulated)." `syncToAccounts` can return one — e.g. every matching
 * creative was already synced to the picked accounts — which is why
 * `skipped` is still joined in below even though it was long a no-op.
 */
function announce(rule: AutomationRule, count: number, outcome: RuleOutcome): void {
  const plural = count === 1 ? "creative" : "creatives";
  const skipped = outcome.skipReasons.map((r) => r.text).join("; ");

  if (outcome.labels.length === 0) {
    toast({
      title: rule.name,
      description: `${count} new ${plural} matched, but nothing was applied — ${skipped} (simulated).`,
    });
    return;
  }

  let description = `${count} new ${plural} matched and ${outcome.labels.map((l) => l.text).join(" and ")} (simulated).`;
  if (skipped) description += ` Skipped: ${skipped}.`;
  toast({ title: rule.name, description });
}

/* ------------------------------------------------------------------ */
/*  The evaluation pass                                               */
/* ------------------------------------------------------------------ */

/**
 * GUARD 2 — edge-triggered fire marks, with re-arm.
 *
 * Per eligible rule:
 *
 *   matched          = evaluateRule(rule, automationSubjects())
 *   newlyMatched     = matched - firedFor(rule.id)      -> actions apply to THESE ONLY
 *   noLongerMatching = firedFor(rule.id) - matched      -> unmarkFired(...)  (re-arm)
 *
 * EDGE, not level. Without the subtraction, every pass re-applies every action
 * to the entire matching set: a toast every 10 seconds and a filed-count that
 * keeps double-counting the same creatives forever. Retrofitting this later
 * doesn't help — by then the persisted log is already garbage.
 *
 * AND IT RE-ARMS. A creative that drops out of the matching set has its mark
 * cleared, so when it matches again it fires again. That is what "conditions
 * meet hote hi ... any time a ad or creative hits that condition" literally
 * asks for; a one-shot latch would fire once per creative per rule forever and
 * then quietly stop working.
 */
function evaluateOneRule(rule: AutomationRule, at: string): void {
  const matched = evaluateRule(rule, automationSubjects());
  const matchedIds = matched.map((r) => r.creative.id);
  const matchedIdSet = new Set(matchedIds);
  const alreadyFired = firedFor(rule.id);

  // Re-arm first. The two sets are disjoint, so order isn't load-bearing —
  // doing it first just means a rule whose actions all fail still keeps its
  // marks honest.
  const noLongerMatching = alreadyFired.filter((id) => !matchedIdSet.has(id));
  if (noLongerMatching.length > 0) unmarkFired(rule.id, noLongerMatching);

  const firedSet = new Set(alreadyFired);
  const newlyMatchedIds = matchedIds.filter((id) => !firedSet.has(id));
  if (newlyMatchedIds.length === 0) return; // Nothing on the rising edge: no actions, no toast, no mark.

  const outcome = applyActions(rule, newlyMatchedIds, at);

  if (!outcome.processed) {
    // No action returned a result at all — the rule has no actions, or none of
    // its action types resolve in the registry. Deliberately do NOT mark these
    // ids: the next pass retries and the rule starts working the moment the
    // wiring is fixed, without the user having to poke it. Deliberately no
    // toast either — a recurring "nothing happened" every 10s is pure noise,
    // and the console error above already names the real problem.
    return;
  }

  // Marked AFTER the actions ran, never before. If an action throws, the ids
  // stay unmarked and the next pass retries — a retry is recoverable (filing
  // into a folder is idempotent-in-spirit here since nothing real is ever
  // written), whereas marking first would silently drop the creative forever.
  //
  // Note this would also mark on an *explained skip*, if `addToFolder` ever
  // returned one (it currently never does — see registry.ts). That's
  // deliberate: the alternative re-fires and re-toasts the same unfixable
  // rule every 10 seconds, which is exactly the spam this guard exists to
  // prevent. The user gets one honest toast naming what to fix.
  markFired(rule.id, newlyMatchedIds);
  recordRuleRun(rule.id, matched.length);
  recordRuleActivity({
    rule,
    matched: matched.filter((r) => newlyMatchedIds.includes(r.creative.id)),
    outcome: { labels: outcome.labels, skipReasons: outcome.skipReasons },
    source: "auto",
    at,
  });
  announce(rule, newlyMatchedIds.length, outcome);
}

function runEvaluationPass(now: Date): void {
  const at = now.toISOString(); // One timestamp per pass, per the registry's ctx contract.

  // `getRules()`, not `useAutomationRules()` — this pass ticks off a module-level
  // interval with no render attached (the `getThresholds()`/`useBucketThresholds()`
  // split in `thresholds.ts` is the same precedent). It returns the store's own
  // module variable rather than re-reading localStorage, which is load-bearing:
  // `runEvaluationPassNow()` runs synchronously right after `createRule()`, so
  // anything render-driven or re-parsed from storage would be a step behind and
  // would miss the brand-new rule this immediate pass exists to run. Validation
  // and the safety-critical `autoRun` default live in `rulesStore.sanitize()`.
  for (const rule of getRules()) {
    // enabled && autoRun && within schedule. `enabled === false` never fires
    // regardless of schedule — the manual on/off toggle beats the date window.
    // A missing `autoRun` is false, so pre-existing rules never auto-fire.
    //
    // Ineligible rules are skipped WITHOUT touching their fire marks. Clearing
    // marks on disable would make re-enabling a rule re-blast its whole
    // matching set; keeping them makes a disable/enable cycle a no-op, which is
    // what a user flipping a switch expects.
    if (!isRuleEligible(rule, now)) continue;

    try {
      evaluateOneRule(rule, at);
    } catch (err) {
      // One malformed rule must not stop the other rules in this pass.
      console.error(`[automations/runner] rule "${rule.id}" threw during evaluation.`, err);
    }
  }
}

/* ------------------------------------------------------------------ */
/*  The tick                                                          */
/* ------------------------------------------------------------------ */

let tickCount = 0;

function onTick(now: Date): void {
  // Every tick: move the simulated sync upload queue forward. Cheap — the
  // store early-outs and returns false when nothing is in flight. This is
  // independent of the ~10s evaluation pass below.
  advanceQueue(now.getTime());

  tickCount += 1;
  if (tickCount >= EVAL_EVERY_N_TICKS) {
    tickCount = 0;
    runEvaluationPass(now);
  }
}

/**
 * Runs a pass immediately instead of waiting up to ~10s for the next scheduled
 * one — call right after a rule is created or enabled so a demo shows the
 * effect in the same breath as the click. Resets the tick counter so the next
 * scheduled pass is a full interval away rather than landing a tick later.
 */
export function runEvaluationPassNow(): void {
  tickCount = 0;
  runEvaluationPass(new Date());
}

/* ------------------------------------------------------------------ */
/*  Mount                                                             */
/* ------------------------------------------------------------------ */

let refCount = 0;
let unregister: (() => void) | null = null;

function start(): void {
  tickCount = 0;
  unregister = registerWorkflowRunner(RUNNER_ID, onTick);
  setClockArmed(true);
  // Immediate pass on start, so a page load with an already-enabled rule acts
  // at once instead of showing an idle screen for the first ten seconds.
  runEvaluationPassNow();
}

function stop(): void {
  unregister?.();
  unregister = null;
  // Deliberately NOT calling setClockArmed(false). `armed` is a shared global
  // latch; disarming it here would silence any other domain's runner that
  // happens to be registered. It isn't needed either — the clock clears its
  // own interval once no runners remain (`syncIntervalState`).
}

/**
 * Mounted ONCE, from `CreativeReportLayout`, with `enabled` gated on v3.
 *
 * REFCOUNTED, because React StrictMode double-mounts every effect in dev:
 * mount -> unmount -> mount. A naive `useEffect` would leave one live
 * registration plus one orphan, and two registrations double every upload.
 *
 * The refcount collapses concurrent mounts to a single registration: the first
 * mount takes the count 0 -> 1 and starts; any further mount only increments;
 * the last unmount takes it back to 0 and stops. StrictMode's *sequential*
 * double-mount therefore ends at exactly one registration, and the second
 * `start()` fires a second immediate pass that is harmless — guard 2 has
 * already marked those creatives, so `newlyMatched` is empty and nothing
 * re-applies.
 *
 * `registerWorkflowRunner` is itself idempotent per id, so this is belt and
 * braces: the refcount prevents the double *pass*, the clock's keyed map
 * prevents the double *registration*.
 */
export function useWorkflowRunner(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    refCount += 1;
    if (refCount === 1) start();
    return () => {
      refCount -= 1;
      if (refCount === 0) stop();
    };
  }, [enabled]);
}
