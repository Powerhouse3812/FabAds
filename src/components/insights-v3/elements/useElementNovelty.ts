/**
 * "New" for an element = nothing of it had been seen before the user's last
 * visit: its EARLIEST ad (across the whole index, not just the scope) was first
 * seen after that visit. Computed once per type, so a scope change can never
 * make an old element look new.
 */
import { getAds } from "@/lib/insights-v3/data";
import { elementValue, isNew } from "@/lib/insights-v3/selectors";
import type { ElementType } from "@/lib/insights-v3/types";

const earliest = new Map<ElementType, Map<string, string>>();

function earliestFor(type: ElementType): Map<string, string> {
  let m = earliest.get(type);
  if (m) return m;
  m = new Map();
  for (const a of getAds()) {
    const v = elementValue(a, type);
    if (!v) continue;
    const cur = m.get(v);
    if (!cur || a.firstSeenAt < cur) m.set(v, a.firstSeenAt);
  }
  earliest.set(type, m);
  return m;
}

export function isElementNew(type: ElementType, id: string, lastVisitAt: string): boolean {
  const first = earliestFor(type).get(id);
  return first ? isNew({ firstSeenAt: first }, lastVisitAt) : false;
}
