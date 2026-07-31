/**
 * evaluate.ts — AND-chain evaluation of workflow conditions against subjects.
 *
 * Part of `src/workflows/core/`, the domain-agnostic workflow seam. NO-IMPORTS
 * RULE: nothing here may import `@/creative-report/*`, `@/data/*`,
 * `@/components/*`, or `react`. The generic `<S>` subject type and the
 * `ConditionMatcher<S>` are supplied entirely by the caller — this module
 * never inspects `S` itself.
 */

import type { ConditionMatcher, WorkflowCondition } from "./types";

/**
 * Filters `subjects` to those matching every condition (AND-chain).
 *
 * A rule with zero conditions returns `[]`, not all subjects — an empty
 * condition list must never be treated as "match everything." This mirrors
 * the existing engine's deliberate behaviour.
 */
export function evaluateConditions<S>(
  conditions: WorkflowCondition[],
  subjects: S[],
  match: ConditionMatcher<S>
): S[] {
  if (conditions.length === 0) return [];
  return subjects.filter((subject) => conditions.every((condition) => match(subject, condition)));
}
