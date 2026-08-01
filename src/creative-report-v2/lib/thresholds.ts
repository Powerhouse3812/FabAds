/**
 * Creative Report 2.0 — editable bucket/fatigue thresholds (iter-2 W2).
 *
 * The honest alternative to a black-box score: every bucket rule and the
 * fatigue rule are visible formulas, AND the buyer can tune the thresholds
 * to fit their account (a lead-gen account's "winner" bar isn't an e-com
 * account's). External-store pattern (mirrors genie6/useDemoData), persisted
 * to localStorage, with a one-click reset to the shipped defaults.
 */
import { useSyncExternalStore } from "react";

export interface BucketThresholds {
  winnerRoas: number;
  winnerSpend: number;
  scalingRoas: number;
  scalingTrendPct: number;
  loserRoas: number;
  loserSpend: number;
  fatigueMinSpend: number;
  fatigueCtrDropPct: number;
  fatigueFreq: number;
  newAgeDays: number;
}

export const DEFAULT_THRESHOLDS: BucketThresholds = {
  winnerRoas: 2.0,
  winnerSpend: 1000,
  scalingRoas: 1.5,
  scalingTrendPct: 20,
  loserRoas: 1.0,
  loserSpend: 500,
  fatigueMinSpend: 500,
  fatigueCtrDropPct: 15,
  fatigueFreq: 4,
  newAgeDays: 7,
};

const KEY = "creative-report-v2-thresholds";

function read(): BucketThresholds {
  if (typeof window === "undefined") return DEFAULT_THRESHOLDS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_THRESHOLDS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_THRESHOLDS, ...parsed };
  } catch {
    return DEFAULT_THRESHOLDS;
  }
}

let current = read();
const listeners = new Set<() => void>();

function persist(next: BucketThresholds) {
  current = next;
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      current = read();
      cb();
    }
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): BucketThresholds {
  return current;
}

/** Non-hook getter — selectors.ts and audit.ts run outside React. */
export function getThresholds(): BucketThresholds {
  return current;
}

export function setThreshold<K extends keyof BucketThresholds>(key: K, value: BucketThresholds[K]) {
  persist({ ...current, [key]: value });
}

export function resetThresholds() {
  persist(DEFAULT_THRESHOLDS);
}

export function useBucketThresholds(): BucketThresholds {
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_THRESHOLDS);
}
