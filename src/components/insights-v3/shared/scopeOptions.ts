import { ALL } from "@/lib/insights-v3/types";

export interface ScopeOptionLike {
  id: string;
  label: string;
  count: number;
}

export interface BuiltScopeOptions {
  /** The "All …" row first, then the real options (any incoming "all" row removed). */
  options: { id: string; label: string; count: number; disabled?: boolean }[];
  /** Count shown on the "All …" row / trigger when it is selected. */
  allCount: number;
}

/**
 * Builds a picker's option list with the right count on its "All" row.
 * Priority: explicit `allCount` prop → an incoming row with id "all" (what the data
 * layer's industryOptions/categoryOptions return) → `fallback` (the page's totalCount).
 * An incoming "all" row is never rendered a second time.
 */
export function buildScopeOptions(
  incoming: ScopeOptionLike[],
  allLabel: string,
  fallback: number,
  explicitAll?: number,
): BuiltScopeOptions {
  const allRow = incoming.find((o) => o.id === ALL);
  const allCount = explicitAll ?? allRow?.count ?? fallback;
  const rest = incoming.filter((o) => o.id !== ALL);
  return {
    allCount,
    options: [
      { id: ALL, label: allLabel, count: allCount },
      ...rest.map((o) => ({ id: o.id, label: o.label, count: o.count, disabled: o.count === 0 })),
    ],
  };
}
