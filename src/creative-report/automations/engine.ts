/**
 * Creative Report 2.0 — the automations engine.
 *
 * As of the scope-down to a single "file into folder" automation, there is
 * exactly one rule type (`categorise`) and one action (`addToFolder`) — but
 * this evaluator stays generic over `RuleAction`/`ACTION_REGISTRY` rather
 * than hard-coding that fact, so a future action type is a registry entry,
 * not a rewrite here. `evaluateRule` never mutates anything; `runRule` is the
 * only place actions are actually applied, and it's always an explicit call
 * (a "Run now" button in this prototype — there is no real background cron,
 * per the project's mock-data-only rule).
 */
import { ACTION_REGISTRY, type ActionApplyContext, type WorkflowActionDescriptor } from "@/creative-report/automations/actions/registry";
import { isMetricField, type AutomationRule, type ConditionField, type RuleAction } from "@/creative-report/automations/model";
import { recordRuleRun } from "@/creative-report/automations/rulesStore";
import type { CreativeRollup } from "@/creative-report/lib/selectors";
import type { MetricKey } from "@/creative-report/lib/columns";
import type { Platform } from "@/creative-report/lib/paramSchema";
import { compareNumeric, evaluateConditions, type ConditionMatcher, type WorkflowCondition } from "@/workflows/core";

/**
 * The pluggable evaluator (the seam `evaluateConditions` from
 * `@/workflows/core` delegates into) — this had the right shape all along
 * (`(subject, condition) => boolean`), it just wasn't named or exported.
 */
export const matchCreativeCondition: ConditionMatcher<CreativeRollup> = (rollup, condition) => {
  const { field, operator, value } = condition;

  if (isMetricField(field as ConditionField)) {
    const actual = rollup.metrics[field as MetricKey];
    if (actual === null || actual === undefined) return false;
    const target = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(target)) return false;
    if (operator === "eq" || operator === "neq") return false; // metric fields only support numeric operators
    return compareNumeric(actual, operator, target, condition.value2);
  }

  let actual: string | boolean | null;
  switch (field) {
    case "bucket": actual = rollup.bucket; break;
    case "fatiguing": actual = rollup.fatigue.isFatiguing; break;
    case "platform": actual = rollup.platforms.includes(String(value) as Platform); break;
    case "brand": actual = rollup.creative.brandId ?? null; break;
    case "format": actual = rollup.creative.format; break;
    case "messagingAngle": actual = rollup.creative.tags.messagingAngle; break;
    case "emotion": actual = rollup.creative.tags.emotion; break;
    default: return false;
  }

  // "platform" is membership-in-set (a rollup can run on several platforms
  // at once), already resolved to a boolean above — treat it as an eq check
  // against "true".
  if (field === "platform") {
    const isMember = actual === true;
    return operator === "neq" ? !isMember : isMember;
  }

  if (field === "fatiguing") {
    const wantTrue = String(value).toLowerCase() === "true";
    const isTrue = actual === true;
    return operator === "neq" ? isTrue !== wantTrue : isTrue === wantTrue;
  }

  const match = actual === value;
  return operator === "neq" ? !match : match;
};

/** Pure — never mutates, always safe to call for a live preview count. */
export function evaluateRule(rule: Pick<AutomationRule, "conditions">, rollups: CreativeRollup[]): CreativeRollup[] {
  return evaluateConditions(rule.conditions as WorkflowCondition[], rollups, matchCreativeCondition);
}

/** `action.type` indexes `ACTION_REGISTRY` to the descriptor whose `apply`
 *  accepts exactly this action's shape — the cast just spares every call
 *  site a per-branch narrow the compiler can't infer from a dynamic key. */
function applyAction(action: RuleAction, ctx: ActionApplyContext) {
  const descriptor = ACTION_REGISTRY[action.type] as WorkflowActionDescriptor<RuleAction>;
  return descriptor.apply(action, ctx);
}

export interface RunRuleResult {
  matched: CreativeRollup[];
  summary: string;
}

/** Applies a rule's actions to every currently-matching creative, then
 *  records the run (bookkeeping only). This is the ONLY function in the
 *  engine that has side effects. */
export function runRule(rule: AutomationRule, rollups: CreativeRollup[]): RunRuleResult {
  const matched = evaluateRule(rule, rollups);
  const ids = matched.map((r) => r.creative.id);

  const ctx: ActionApplyContext = {
    subjectIds: ids,
    ruleId: rule.id,
    ruleName: rule.name,
    at: new Date().toISOString(),
    source: "manual",
  };

  // Applied-action labels, human-readable — never raw action-type identifiers.
  const appliedLabels: string[] = [];
  const skippedReasons: string[] = [];

  for (const action of rule.actions) {
    const result = applyAction(action, ctx);
    if (result.appliedLabel) appliedLabels.push(result.appliedLabel);
    if (result.skippedReason) skippedReasons.push(result.skippedReason);
  }

  recordRuleRun(rule.id, matched.length);

  const n = matched.length;
  const plural = n === 1 ? "creative" : "creatives";
  let summary: string;
  if (n === 0) {
    summary = "No creatives matched — nothing to do.";
  } else if (appliedLabels.length === 0 && skippedReasons.length > 0) {
    summary = `${n} ${plural} matched, but ${skippedReasons.join(" and ")}. Edit the rule to fix it.`;
  } else {
    summary = `${n} ${plural} matched and ${appliedLabels.join(" and ")} (simulated).`;
    if (skippedReasons.length > 0) summary += ` ${skippedReasons.join(" ")}`;
  }

  return { matched, summary };
}
