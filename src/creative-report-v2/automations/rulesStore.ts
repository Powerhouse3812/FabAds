/**
 * Creative Report 2.0 — automation rules store (iter-2 P4).
 * localStorage-backed useSyncExternalStore, same pattern/discipline as
 * columns.ts / cardMetrics.ts / boards.ts (stable cached snapshot reference,
 * defensive sanitization of whatever localStorage hands back).
 */
import { useSyncExternalStore } from "react";
import {
  ACTIONS_BY_RULE_TYPE,
  RULE_TYPES,
  type AutomationRule,
  type RuleAction,
  type RuleCondition,
  type RuleSchedule,
  type RuleType,
} from "@/creative-report-v2/automations/model";
import { sanitizeSchedule } from "@/workflows/core";
import { ACCOUNT_BY_ID } from "@/data/accounts";
import { clearFiredForRule } from "@/creative-report-v2/automations/sync/syncStore";

const KEY = "creative-report-v2-automation-rules";

function isValidCondition(c: unknown): c is RuleCondition {
  if (!c || typeof c !== "object") return false;
  const cond = c as RuleCondition;
  if (
    typeof cond.field !== "string" ||
    typeof cond.operator !== "string" ||
    (typeof cond.value !== "string" && typeof cond.value !== "number")
  ) {
    return false;
  }
  // A "between" condition with no finite upper bound would silently match
  // everything (>= value, no ceiling) — worse than losing the condition,
  // since the builder's live match-count would read a confident number
  // that's wrong. Reject here; sanitize() drops just this condition, not
  // the whole rule.
  if (cond.operator === "between" && !(typeof cond.value2 === "number" && Number.isFinite(cond.value2))) {
    return false;
  }
  return true;
}

function isValidAction(a: unknown): a is RuleAction {
  if (!a || typeof a !== "object") return false;
  const action = a as RuleAction;
  if (action.type === "addToBoard") return typeof action.boardId === "string";
  if (action.type === "syncToAccounts") {
    return Array.isArray(action.accountIds) && action.accountIds.every((id) => typeof id === "string");
  }
  return action.type === "pause" || action.type === "queueInLaunch";
}

function isValidRule(r: unknown): r is AutomationRule {
  if (!r || typeof r !== "object") return false;
  const rule = r as AutomationRule;
  return (
    typeof rule.id === "string" &&
    typeof rule.name === "string" &&
    (RULE_TYPES as readonly string[]).includes(rule.type) &&
    typeof rule.enabled === "boolean" &&
    Array.isArray(rule.conditions) &&
    Array.isArray(rule.actions) &&
    typeof rule.createdAt === "string"
    // schedule/autoRun are optional and normalised in sanitize() below —
    // any value (missing, malformed, or valid) is "accepted" here and never
    // gates whether the rule itself survives.
  );
}

function sanitize(raw: unknown): AutomationRule[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isValidRule).map((rule) => {
    // Structurally-broken individual conditions/actions are dropped one at a
    // time — a single bad item must not nuke the whole rule (that would be
    // the same silent-data-loss failure mode this file exists to avoid).
    const conditions = rule.conditions.filter(isValidCondition);

    const actions = rule.actions
      .filter(isValidAction)
      // Drop any action that isn't valid for this rule's type (e.g. a stale
      // "pause" action surviving a hand-edited categorise rule).
      .filter((a) => (ACTIONS_BY_RULE_TYPE[rule.type] as string[]).includes(a.type))
      // syncToAccounts ids reference src/data/accounts.ts, not a fixed enum
      // — an account may since have been removed. Drop unknown ids; if none
      // survive, the action has nothing left to sync to and is dropped too.
      // The explicit RuleAction[] annotation is load-bearing: without it TS infers
      // a union of two array types from the branches and widens `actions` to unknown[].
      .flatMap((action): RuleAction[] => {
        if (action.type !== "syncToAccounts") return [action];
        const accountIds = action.accountIds.filter((id) => ACCOUNT_BY_ID[id]);
        return accountIds.length > 0 ? [{ ...action, accountIds }] : [];
      });

    return {
      ...rule,
      conditions,
      actions,
      // MIGRATION HAZARD — every rule already in localStorage predates the
      // schedule field. sanitizeSchedule() degrades undefined/malformed
      // input to a valid empty schedule ({}), never throws, so nothing
      // downstream calls a date helper with `undefined`.
      schedule: sanitizeSchedule(rule.schedule),
      // MIGRATION HAZARD — every rule already in localStorage predates
      // autoRun and has enabled:true. Anything but an explicit boolean
      // `true` sanitises to `false`, so pre-existing launch-type rules
      // don't start auto-pausing creatives the instant this ships. Only
      // createRule may hand out `true` for brand-new rules.
      autoRun: rule.autoRun === true,
    };
  });
}

function readInitial(): AutomationRule[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? sanitize(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

const EMPTY_RULES: AutomationRule[] = [];
let rules: AutomationRule[] = readInitial();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(rules));
    } catch {
      // Quota exceeded or storage unavailable — keep the in-memory rules and
      // don't let a write failure wedge the store.
    }
  }
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function snapshot(): AutomationRule[] {
  return rules;
}

/** Non-hook accessor for callers with no render attached — specifically the
 *  workflow runner, which ticks off a module-level interval. It reads this same
 *  module variable rather than localStorage, so it always sees the current state
 *  including a rule created microseconds ago (a render-driven mirror would be one
 *  render stale, and runEvaluationPassNow() fires synchronously after createRule).
 *  Returns the cached reference — treat as read-only. */
export function getRules(): AutomationRule[] {
  return rules;
}

let idCounter = 0;
function makeId(): string {
  idCounter += 1;
  return `rule-${Date.now()}-${idCounter}`;
}

export function createRule(input: {
  name: string;
  type: RuleType;
  conditions: RuleCondition[];
  actions: RuleAction[];
  schedule?: RuleSchedule;
}): string {
  const id = makeId();
  rules = [
    ...rules,
    {
      id,
      name: input.name.trim() || "Untitled rule",
      type: input.type,
      enabled: true,
      conditions: input.conditions,
      actions: input.actions,
      createdAt: new Date().toISOString(),
      schedule: sanitizeSchedule(input.schedule),
      // New rules created after this feature landed are the only ones that
      // may default to auto-firing — see the MIGRATION HAZARD note on
      // sanitize() for why every pre-existing rule must NOT get this.
      autoRun: true,
    },
  ];
  persist();
  return id;
}

function conditionsOrActionsChanged(
  before: AutomationRule,
  patch: Partial<Pick<AutomationRule, "conditions" | "actions">>,
): boolean {
  if ("conditions" in patch && JSON.stringify(patch.conditions) !== JSON.stringify(before.conditions)) return true;
  if ("actions" in patch && JSON.stringify(patch.actions) !== JSON.stringify(before.actions)) return true;
  return false;
}

export function updateRule(
  id: string,
  patch: Partial<Pick<AutomationRule, "name" | "conditions" | "actions" | "enabled" | "schedule" | "autoRun">>,
) {
  const before = rules.find((r) => r.id === id);
  rules = rules.map((r) => (r.id === id ? { ...r, ...patch } : r));
  persist();

  // Editing conditions or actions makes this semantically a different rule
  // — the runner's edge-trigger marks (which creatives it already acted on)
  // are stale and must be cleared so the new logic gets a fresh pass.
  // Renaming or toggling `enabled` must NOT clear marks, or every rename
  // would re-fire (e.g. re-upload) everything the rule had already handled.
  if (before && conditionsOrActionsChanged(before, patch)) {
    clearFiredForRule(id);
  }
}

export function deleteRule(id: string) {
  rules = rules.filter((r) => r.id !== id);
  persist();
  // Drop this rule's edge-trigger marks — but never its sync records. The
  // upload genuinely happened, and SyncRecord.ruleName is denormalised
  // precisely so sync history still explains itself after the rule is gone.
  clearFiredForRule(id);
}

export function setRuleEnabled(id: string, enabled: boolean) {
  updateRule(id, { enabled });
}

/** Recorded by the engine after a "Run now" (or auto-run) pass — bookkeeping
 *  only, never changes which creatives matched. */
export function recordRuleRun(id: string, matchCount: number) {
  rules = rules.map((r) => (r.id === id ? { ...r, lastRunAt: new Date().toISOString(), lastMatchCount: matchCount } : r));
  persist();
}

export function useAutomationRules(): AutomationRule[] {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY_RULES);
}
