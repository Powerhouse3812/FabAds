/**
 * types.ts — Domain-agnostic type vocabulary for the FabAds workflow core.
 *
 * This directory (`src/workflows/core/`) is the seam between the future
 * top-level "Automation" module (see `src/components/sidebar/modules.ts`,
 * the `automation` entry at `/automation`) and whatever domain eventually
 * plugs into it (Creative Report today, others later).
 *
 * NO-IMPORTS RULE: nothing in `src/workflows/**` may import
 * `@/creative-report/*`, `@/data/*`, `@/components/*`, or `react`. This
 * directory must compile and be reasoned about as pure TypeScript, with zero
 * knowledge of any specific domain's shapes. Domains resolve `field` ids and
 * supply a `ConditionMatcher<S>` — they never need this module to know what
 * `S` is.
 */

export const WORKFLOW_NUMERIC_OPERATORS = ["gt", "gte", "lt", "lte", "between"] as const;
export const WORKFLOW_EQUALITY_OPERATORS = ["eq", "neq"] as const;

export type WorkflowNumericOperator = (typeof WORKFLOW_NUMERIC_OPERATORS)[number];
export type WorkflowEqualityOperator = (typeof WORKFLOW_EQUALITY_OPERATORS)[number];
export type WorkflowOperator = WorkflowNumericOperator | WorkflowEqualityOperator;

/** Domain-agnostic condition. `field` is an opaque id the domain resolves. */
export interface WorkflowCondition {
  field: string;
  operator: WorkflowOperator;
  value: string | number;
  /** Upper bound — only meaningful when operator === "between". Inclusive. */
  value2?: number;
}

/** The pluggable evaluator — this is the seam. */
export type ConditionMatcher<S> = (subject: S, condition: WorkflowCondition) => boolean;

export const WORKFLOW_JOB_STATUSES = ["queued", "running", "done", "failed"] as const;
export type WorkflowJobStatus = (typeof WORKFLOW_JOB_STATUSES)[number];
