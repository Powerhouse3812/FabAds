/**
 * Creative Report 2.0 — automations engine types.
 *
 * Scoped down (Maalik, 2026-07-31) to exactly ONE automation: "file into
 * folder", pointing at REAL Creative Library folders (`cl_folders`, via
 * `@/hooks/use-cl-folders.ts`) — never the module's own synthetic `Board`
 * concept (that lives on unchanged in `automations/boards.ts`/`BoardsPanel.tsx`
 * as a separate, pre-existing, manual-only feature; this engine no longer
 * writes to it). The "launch" rule type (pause/queue-in-launch) is
 * deprioritized for later — removed from the live type union, not deleted
 * from history.
 *
 * RESTORED (Maalik, 2026-08-01): the sync-to-ad-account action is back —
 * `SyncToAccountsAction` below — after briefly moving out of Creative Report
 * entirely. This time it's rule-action-only, ONE consumer surface (the
 * drawer's `SyncStatusPanel`, restored at
 * `@/creative-report/drawer/SyncStatusPanel.tsx`) — the creative card badge,
 * table column, and bulk-bar duplicate warning stay retired. Don't
 * reintroduce those three just because the underlying `sync/syncStore.ts`
 * data is available again; that's a deliberate scope line, not an oversight.
 *
 * Condition fields deliberately exclude the generator-internal `archetype`
 * signal (winner/fake-winner/steady/…) — that's an audit-only concept, never
 * surfaced to the user anywhere else in this module, so rules must be
 * buildable from the same honest, visible signals a user actually sees
 * (bucket, fatigue, folded metrics, platform, brand, format, tags).
 */
import type { MetricKey } from "@/creative-report/lib/columns";
import type { BucketKey, CreativeFormat, Platform } from "@/creative-report/lib/paramSchema";
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

export const RULE_TYPES = ["categorise"] as const; // "launch" removed — deprioritized, not deleted from history
export type RuleType = (typeof RULE_TYPES)[number];

/** Real Creative Library folder (`cl_folders.id`) — never our synthetic Board. */
export interface AddToFolderAction {
  type: "addToFolder";
  folderId: string;
  /** Snapshot of the folder's name at save time. The runner ticks off a module-level
   *  clock with no React/Supabase access, so it cannot re-fetch cl_folders live —
   *  same denormalisation pattern this codebase already uses for SyncRecord.ruleName. */
  folderName: string;
}

/** Sync matching creatives to one or more Meta ad account libraries.
 *  Meta-only — `AccountPicker` filters non-Meta accounts out to disabled
 *  "Soon" rows, so `accountIds` here should never contain a non-meta id, but
 *  `rulesStore.isValidAction` still re-validates against `ACCOUNT_BY_ID` on
 *  load rather than trusting the builder wrote it correctly. */
export interface SyncToAccountsAction {
  type: "syncToAccounts";
  accountIds: string[];
}

export type RuleAction = AddToFolderAction | SyncToAccountsAction; // AddToBoardAction,
                                                                    // PauseAction, QueueInLaunchAction
                                                                    // still removed

export const ACTIONS_BY_RULE_TYPE: Record<RuleType, RuleAction["type"][]> = {
  categorise: ["addToFolder", "syncToAccounts"],
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
