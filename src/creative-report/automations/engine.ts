/**
 * Creative Report 2.0 — the automations engine (iter-2 P4).
 *
 * ONE evaluator shared by categorise and launch rules (Maalik's decision —
 * a single engine, not two parallel implementations). `evaluateRule` never
 * mutates anything; `runRule` is the only place actions are actually applied,
 * and it's always an explicit call (a "Run now" button in this prototype —
 * there is no real background cron, per the project's mock-data-only rule).
 */
import { pauseMany, queueManyInLaunch } from "@/creative-report/actions/actionStore";
import { addCreativeToBoard, getBoardById } from "@/creative-report/automations/boards";
import { isMetricField, type AutomationRule, type RuleCondition } from "@/creative-report/automations/model";
import { recordRuleRun } from "@/creative-report/automations/rulesStore";
import type { CreativeRollup } from "@/creative-report/lib/selectors";
import type { Platform } from "@/creative-report/lib/paramSchema";

function conditionMatches(rollup: CreativeRollup, condition: RuleCondition): boolean {
  const { field, operator, value } = condition;

  if (isMetricField(field)) {
    const actual = rollup.metrics[field];
    if (actual === null || actual === undefined) return false;
    const target = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(target)) return false;
    switch (operator) {
      case "gt": return actual > target;
      case "gte": return actual >= target;
      case "lt": return actual < target;
      case "lte": return actual <= target;
      default: return false; // metric fields only support numeric operators
    }
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
}

/** Pure — never mutates, always safe to call for a live preview count. */
export function evaluateRule(rule: Pick<AutomationRule, "conditions">, rollups: CreativeRollup[]): CreativeRollup[] {
  if (rule.conditions.length === 0) return [];
  return rollups.filter((r) => rule.conditions.every((c) => conditionMatches(r, c)));
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

  // Applied-action labels, human-readable — never raw action-type identifiers.
  const appliedLabels: string[] = [];
  let deadBoard = false;

  for (const action of rule.actions) {
    if (action.type === "addToBoard") {
      // addCreativeToBoard silently no-ops on an unknown boardId (e.g. the
      // board was deleted after this rule was created) — check first so the
      // summary never claims a filing that didn't happen.
      const board = getBoardById(action.boardId);
      if (!board) {
        deadBoard = true;
        continue;
      }
      for (const id of ids) addCreativeToBoard(action.boardId, id);
      appliedLabels.push(`filed into "${board.name}"`);
    } else if (action.type === "pause") {
      pauseMany(ids);
      appliedLabels.push("paused");
    } else if (action.type === "queueInLaunch") {
      queueManyInLaunch(ids);
      appliedLabels.push("queued for relaunch");
    }
  }

  recordRuleRun(rule.id, matched.length);

  const n = matched.length;
  const plural = n === 1 ? "creative" : "creatives";
  let summary: string;
  if (n === 0) {
    summary = "No creatives matched — nothing to do.";
  } else if (appliedLabels.length === 0 && deadBoard) {
    summary = `${n} ${plural} matched, but the target board no longer exists — nothing was filed. Edit the rule to pick a board.`;
  } else {
    summary = `${n} ${plural} matched and ${appliedLabels.join(" and ")}.`;
    if (deadBoard) summary += " One target board no longer exists and was skipped.";
  }

  return { matched, summary };
}
