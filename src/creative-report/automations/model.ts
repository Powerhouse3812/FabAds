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
import type { MetricKey } from "@/creative-report/lib/columns";
import type { BucketKey, CreativeFormat, Platform } from "@/creative-report/lib/paramSchema";

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

export const NUMERIC_OPERATORS = ["gt", "gte", "lt", "lte"] as const;
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

export type RuleAction = AddToBoardAction | PauseAction | QueueInLaunchAction;

export const ACTIONS_BY_RULE_TYPE: Record<RuleType, RuleAction["type"][]> = {
  categorise: ["addToBoard"],
  launch: ["pause", "queueInLaunch"],
};

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
}

export type { BucketKey, CreativeFormat, Platform };
