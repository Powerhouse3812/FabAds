/**
 * operators.ts — Pure comparison primitives for workflow conditions.
 *
 * Part of `src/workflows/core/`, the domain-agnostic workflow seam. NO-IMPORTS
 * RULE: nothing here may import `@/creative-report/*`, `@/data/*`,
 * `@/components/*`, or `react`. These functions only ever see primitives
 * handed to them by the caller.
 */

import type { WorkflowEqualityOperator, WorkflowNumericOperator } from "./types";

/**
 * Compares `actual` against a numeric operator.
 *
 * `between` is inclusive on both ends and normalises min/max, so
 * `value=5, value2=2` behaves identically to `value=2, value2=5` — an
 * inverted range must never silently fail to match. If `value2` is not a
 * finite number when `op === "between"`, this returns `false` defensively
 * (the caller's sanitiser is responsible for dropping such conditions before
 * they get here).
 */
export function compareNumeric(
  actual: number,
  op: WorkflowNumericOperator,
  value: number,
  value2?: number
): boolean {
  switch (op) {
    case "gt":
      return actual > value;
    case "gte":
      return actual >= value;
    case "lt":
      return actual < value;
    case "lte":
      return actual <= value;
    case "between": {
      if (typeof value2 !== "number" || !Number.isFinite(value2)) return false;
      const lo = Math.min(value, value2);
      const hi = Math.max(value, value2);
      return actual >= lo && actual <= hi;
    }
    default: {
      const _exhaustive: never = op;
      return _exhaustive;
    }
  }
}

/** Compares `actual` against an equality operator using strict (===) semantics. */
export function compareEquality(actual: unknown, op: WorkflowEqualityOperator, value: unknown): boolean {
  switch (op) {
    case "eq":
      return actual === value;
    case "neq":
      return actual !== value;
    default: {
      const _exhaustive: never = op;
      return _exhaustive;
    }
  }
}
