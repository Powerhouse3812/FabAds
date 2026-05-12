import { useSyncExternalStore } from "react";

/**
 * useSubNavCollapsed — global app-shell preference for whether the secondary
 * (sub-) navigation panel is collapsed.
 *
 * Mirrors the useV7Shape pattern: module-level state + listener Set +
 * useSyncExternalStore so AppShell, SecondaryNavigationPanel, and any
 * "Open panel" reopen-button render against the same source of truth.
 *
 * Persisted to localStorage so the collapse state survives reloads and
 * cross-module navigation. Default: expanded.
 */

const STORAGE_KEY = "fabads.subnav.collapsed";

let state: boolean = (() => {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
})();

const listeners = new Set<() => void>();

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function getSnapshot(): boolean {
  return state;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useSubNavCollapsed(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function setSubNavCollapsed(next: boolean): void {
  if (state === next) return;
  state = next;
  try {
    if (next) window.localStorage.setItem(STORAGE_KEY, "1");
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  for (const fn of listeners) fn();
}

export function toggleSubNavCollapsed(): void {
  setSubNavCollapsed(!state);
}
