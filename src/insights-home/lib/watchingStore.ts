/**
 * Industry Insights → Home — "Watching" store (mock-first, no new
 * Supabase tables). Same localStorage + useSyncExternalStore discipline as
 * src/lib/insights-setup.ts / src/creative-report-v2/automations/rulesStore.ts
 * (stable cached snapshot reference, defensive sanitization of whatever
 * localStorage hands back, cross-tab 'storage' sync).
 *
 * A watched signal is a user's personal shortlist of TrendItems worth
 * revisiting — it stores the BOUNDED test-window text the trend already
 * carried at save time (TrendItem.intelligence.testWindow), never a
 * countdown or freshly-computed deadline (Trends-doc language, Maalik's
 * locked decision — see src/insights-trends/lib/trendsDisplay.ts).
 */
import { useSyncExternalStore } from "react";
import type { TrendItem } from "@/insights-trends/types";

const KEY = "fabads:insights:watching:v1";

export interface WatchedSignal {
  id: string;
  title: string;
  /** Bounded test-window label carried over from TrendItem.intelligence.testWindow at save time — never a countdown. */
  testWindow: string;
  savedAt: string;
}

function isValidSignal(raw: unknown): raw is WatchedSignal {
  if (!raw || typeof raw !== "object") return false;
  const r = raw as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.title === "string" &&
    typeof r.testWindow === "string" &&
    typeof r.savedAt === "string"
  );
}

function sanitize(raw: unknown): WatchedSignal[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isValidSignal);
}

function readInitial(): WatchedSignal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? sanitize(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

const EMPTY_SIGNALS: WatchedSignal[] = [];
let signals: WatchedSignal[] = readInitial();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(signals));
    } catch {
      // Quota exceeded or storage unavailable — keep the in-memory list and
      // don't let a write failure wedge the store.
    }
  }
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function snapshot(): WatchedSignal[] {
  return signals;
}

// Cross-tab sync — another tab watching/unwatching should update this
// tab's store without a manual call here.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    signals = readInitial();
    emit();
  });
}

export function useWatchedSignals(): { signals: WatchedSignal[]; loading: boolean } {
  const list = useSyncExternalStore(subscribe, snapshot, () => EMPTY_SIGNALS);
  // Pure localStorage read — nothing async underneath, so there is never a
  // real loading window. The field is kept on the return shape so callers
  // can treat this hook like the app's other insight hooks uniformly.
  return { signals: list, loading: false };
}

export function watchSignal(item: TrendItem): void {
  if (signals.some((s) => s.id === item.id)) return; // already watched, no dup
  const entry: WatchedSignal = {
    id: item.id,
    title: item.title,
    testWindow: item.intelligence.testWindow,
    savedAt: new Date().toISOString(),
  };
  signals = [entry, ...signals];
  persist();
}

export function unwatchSignal(id: string): void {
  if (!signals.some((s) => s.id === id)) return;
  signals = signals.filter((s) => s.id !== id);
  persist();
}

export function isWatched(id: string): boolean {
  return signals.some((s) => s.id === id);
}
