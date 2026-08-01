/**
 * Small shared statistics helpers for Creative Report 2.0.
 *
 * Lives here so the honesty layer has ONE median to point at: several surfaces
 * (VisualSummaryPanel's hook/hold read, ComponentBreakdown's hook row) compare
 * a creative against "your median for the current view", and those comparisons
 * must be computed identically or the copy contradicts itself.
 *
 * Deliberately NOT the "pick the middle of a sorted array" shortcut that
 * `componentRollups` uses for its own vsMedianPct — that one is an internal
 * ranking aid, this one is surfaced to buyers as a number.
 */

/** True median — averages the two centre values on an even-length list
 *  instead of arbitrarily picking one. Returns null for an empty list. */
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
