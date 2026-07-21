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
  type RuleType,
} from "@/creative-report/automations/model";

const KEY = "creative-report-automation-rules";

function isValidCondition(c: unknown): c is RuleCondition {
  if (!c || typeof c !== "object") return false;
  const cond = c as RuleCondition;
  return (
    typeof cond.field === "string" &&
    typeof cond.operator === "string" &&
    (typeof cond.value === "string" || typeof cond.value === "number")
  );
}

function isValidAction(a: unknown): a is RuleAction {
  if (!a || typeof a !== "object") return false;
  const action = a as RuleAction;
  if (action.type === "addToBoard") return typeof action.boardId === "string";
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
    rule.conditions.every(isValidCondition) &&
    Array.isArray(rule.actions) &&
    rule.actions.every(isValidAction) &&
    typeof rule.createdAt === "string"
  );
}

function sanitize(raw: unknown): AutomationRule[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isValidRule).map((rule) => ({
    ...rule,
    // Drop any action that isn't valid for this rule's type (e.g. a stale
    // "pause" action surviving a hand-edited categorise rule).
    actions: rule.actions.filter((a) => (ACTIONS_BY_RULE_TYPE[rule.type] as string[]).includes(a.type)),
  }));
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
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(rules));
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function snapshot(): AutomationRule[] {
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
    },
  ];
  persist();
  return id;
}

export function updateRule(id: string, patch: Partial<Pick<AutomationRule, "name" | "conditions" | "actions" | "enabled">>) {
  rules = rules.map((r) => (r.id === id ? { ...r, ...patch } : r));
  persist();
}

export function deleteRule(id: string) {
  rules = rules.filter((r) => r.id !== id);
  persist();
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
