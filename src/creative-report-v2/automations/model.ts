/**
 * Creative Report 2.0 — automations engine types (iter-2 P4).
 *
 * ONE rule-matching engine shared by both rule "types" (per Maalik's
 * decision): a "categorise" rule auto-files matching creatives into a
 * smart board; a "launch" rule auto-pauses or auto-queues matching
 * creatives (reusing the existing actionStore, simulated — no real ad
 * platform calls). Both share the exact same `RuleCondition[]` matcher —
 * only the available `RuleAction`s differ per type.
 *
 * Condition fields deliberately exclude the generator-internal `archetype`
 * signal (winner/fake-winner/steady/…) — that's an audit-only concept, never
 * surfaced to the user anywhere else in this module, so rules must be
 * buildable from the same honest, visible signals a user actually sees
 * (bucket, fatigue, folded metrics, platform, brand, format, tags).
 */
import type { MetricKey } from "@/creative-report-v2/lib/columns";
import type { BucketKey, CreativeFormat, Platform } from "@/creative-report-v2/lib/paramSchema";
import { isWithinSchedule, type WorkflowSchedule } from "@/workflows/core";

export const CONDITION_FIELDS = [
  "bucket",
  "fatiguing",
  "platform",
  "brand",
  "format",
  "messagingAngle",
  "emotion",
  ...([
    "spend",
    "revenue",
    "roas",
    "cpa",
    "ctr",
    "outboundCtr",
    "cvr",
    "cpm",
    "cpc",
    "hookRate",
    "holdRate",
    "frequency",
    "purchases",
  ] as MetricKey[]),
] as const;
export type ConditionField = (typeof CONDITION_FIELDS)[number];

export const METRIC_CONDITION_FIELDS: MetricKey[] = [
  "spend",
  "revenue",
  "roas",
  "cpa",
  "ctr",
  "outboundCtr",
  "cvr",
  "cpm",
  "cpc",
  "hookRate",
  "holdRate",
  "frequency",
  "purchases",
];

export function isMetricField(field: ConditionField): field is MetricKey {
  return (METRIC_CONDITION_FIELDS as string[]).includes(field);
}

export const NUMERIC_OPERATORS = ["gt", "gte", "lt", "lte", "between"] as const;
export type NumericOperator = (typeof NUMERIC_OPERATORS)[number];

export const EQUALITY_OPERATORS = ["eq", "neq"] as const;
export type EqualityOperator = (typeof EQUALITY_OPERATORS)[number];

export type Operator = NumericOperator | EqualityOperator;

/** A single AND-chained condition. `value` is a number for metric fields
 *  (compared with a NumericOperator), a string for everything else
 *  (compared with an EqualityOperator against bucket key / platform /
 *  brand id / format / tag value / boolean-as-"true"|"false" for fatiguing). */
export interface RuleCondition {
  field: ConditionField;
  operator: Operator;
  value: string | number;
  /** Inclusive upper bound — only meaningful when `operator === "between"`. */
  value2?: number;
}

export const RULE_TYPES = ["categorise", "launch"] as const;
export type RuleType = (typeof RULE_TYPES)[number];

/** categorise-type actions: file the creative into a board (auto-filing). */
export interface AddToBoardAction {
  type: "addToBoard";
  boardId: string;
}

/** launch-type actions: reuse the existing optimistic actionStore — this is
 *  the same simulated pause/queue the user can trigger manually from a
 *  card's action row, just triggered by a rule instead of a click. */
export interface PauseAction {
  type: "pause";
}
export interface QueueInLaunchAction {
  type: "queueInLaunch";
}

/** categorise-type action: simulated background sync of the matching
 *  creative into a Meta ad account's library (see `sync/syncModel.ts`).
 *  Lives under "categorise" rather than a new rule type — one categorise
 *  rule can both file to a board AND sync, matching the "either ... or"
 *  ask without a new branch in the builder's type toggle or label map. */
export interface SyncToAccountsAction {
  type: "syncToAccounts";
  /** Ids from src/data/accounts.ts. Ids only — never denormalised names. */
  accountIds: string[];
}

export type RuleAction = AddToBoardAction | PauseAction | QueueInLaunchAction | SyncToAccountsAction;

export const ACTIONS_BY_RULE_TYPE: Record<RuleType, RuleAction["type"][]> = {
  categorise: ["addToBoard", "syncToAccounts"],
  launch: ["pause", "queueInLaunch"],
};

/** Re-exported so this module stays the single import site for rule types —
 *  callers reach for `RuleSchedule` here, never `@/workflows/core` directly. */
/** `export type { X as Y }` creates an export alias with NO local binding, so
 *  `schedule?: RuleSchedule` below could not see it. Alias locally, then re-export. */
export type RuleSchedule = WorkflowSchedule;

export interface AutomationRule {
  id: string;
  name: string;
  type: RuleType;
  enabled: boolean;
  /** AND-chained — every condition must match. */
  conditions: RuleCondition[];
  actions: RuleAction[];
  createdAt: string;
  /** Simulated "Run now" bookkeeping — no real cron in this prototype. */
  lastRunAt?: string;
  lastMatchCount?: number;
  /** Date-range gate on auto-evaluation. Undefined = always in range. */
  schedule?: RuleSchedule;
  /**
   * Gates unattended auto-evaluation of this rule. MIGRATION HAZARD: every
   * rule already sitting in a user's localStorage was created before this
   * field existed and therefore has `enabled: true` with no `autoRun` at
   * all. If a missing `autoRun` were treated as `true`, shipping
   * auto-evaluation would make those pre-existing `launch`-type rules start
   * auto-pausing creatives the instant this ships, with no action from the
   * user. So: undefined/missing `autoRun` MUST be sanitised to `false` —
   * only rules created after this feature landed may default to `true`.
   * (Enforced by the sanitiser in rulesStore.ts, not here — this file only
   * carries the type and this warning.)
   */
  autoRun?: boolean;
}

/**
 * Pure eligibility check for unattended auto-evaluation — no store access.
 * `enabled === false` always wins over everything else: the manual on/off
 * toggle beats the schedule, so a disabled rule never fires just because
 * its date range happens to be active.
 */
export function isRuleEligible(
  rule: Pick<AutomationRule, "enabled" | "autoRun" | "schedule">,
  now: Date,
): boolean {
  if (!rule.enabled) return false;
  if (!rule.autoRun) return false;
  return isWithinSchedule(rule.schedule, now);
}

export type { BucketKey, CreativeFormat, Platform };
