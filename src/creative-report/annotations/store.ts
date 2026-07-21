/**
 * Annotate-mode toggle — dev-only, localStorage-backed useSyncExternalStore.
 * Snapshot returns a stable primitive (boolean), so no getSnapshot-instability
 * risk (the P3 bug class). Off by default.
 */
import { useSyncExternalStore } from "react";

const KEY = "creative-report-annotate-mode";

function readInitial(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) === "1";
}

let on = readInitial();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function snapshot(): boolean {
  return on;
}

export function setAnnotateMode(next: boolean) {
  on = next;
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, next ? "1" : "0");
  emit();
}

export function toggleAnnotateMode() {
  setAnnotateMode(!on);
}

export function useAnnotateMode(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
