/**
 * Card metric picker store — localStorage-backed selection of which metrics
 * show on the grid's CreativeCard stat row (separate concern from the
 * table's column-preset store in columns.ts: this is a flat "pick up to 6"
 * list, no presets, no save/rename/delete).
 *
 * Mirrors the useSyncExternalStore external-store pattern in columns.ts.
 * IMPORTANT: columns.ts previously had a bug where its snapshot function
 * returned a NEW array on every call, which breaks useSyncExternalStore's
 * requirement for a stable reference when nothing changed (infinite render
 * loop / white screen). This store caches the snapshot array at module
 * scope and only produces a new reference when the selection actually
 * changes.
 */
import { useSyncExternalStore } from "react";
import { COLUMN_DEFS, type MetricKey } from "@/creative-report/lib/columns";

const KEY = "creative-report-card-metrics";
export const MAX_CARD_METRICS = 6;

export const DEFAULT_CARD_METRICS: MetricKey[] = ["spend", "roas", "cpa", "ctr"];

const VALID_METRIC_KEYS = new Set<string>(COLUMN_DEFS.map((c) => c.key));

function readInitial(): MetricKey[] {
  if (typeof window === "undefined") return DEFAULT_CARD_METRICS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CARD_METRICS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_CARD_METRICS;
    // Drop stale/unknown keys (would crash COLUMN_BY_KEY lookups on the card)
    // and re-apply the cap in case a stored list predates/exceeds it.
    const keys = parsed
      .filter((k): k is MetricKey => typeof k === "string" && VALID_METRIC_KEYS.has(k))
      .slice(0, MAX_CARD_METRICS);
    return keys.length > 0 ? keys : DEFAULT_CARD_METRICS;
  } catch {
    return DEFAULT_CARD_METRICS;
  }
}

// Cached snapshot reference — only reassigned when the selection changes,
// so useSyncExternalStore never sees a "new" value when nothing changed.
let cardMetrics: MetricKey[] = readInitial();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(cardMetrics));
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function snapshot(): MetricKey[] {
  return cardMetrics;
}

export function setCardMetrics(keys: MetricKey[]) {
  cardMetrics = keys;
  persist();
}

export function useCardMetrics() {
  const active = useSyncExternalStore(subscribe, snapshot, () => DEFAULT_CARD_METRICS);

  const toggle = (key: MetricKey) => {
    const has = active.includes(key);
    if (has) {
      if (active.length === 1) return; // never zero metrics
      setCardMetrics(active.filter((k) => k !== key));
    } else {
      if (active.length >= MAX_CARD_METRICS) return;
      setCardMetrics([...active, key]);
    }
  };

  return { active, toggle };
}
