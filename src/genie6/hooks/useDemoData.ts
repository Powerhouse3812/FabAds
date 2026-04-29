import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * Demo-data toggle store.
 *
 * When ON: Genie 6 surfaces render the curated mock data (brands, products,
 * outputs, hooks, etc.). Realistic populated state, the default for demos.
 *
 * When OFF: surfaces render the empty / first-time state with onboarding
 * affordances. Used to demo "what does a brand-new user see?" without
 * having to touch real data.
 *
 * Toggle lives in the Assets header (visible because Assets is the asset
 * onboarding hub). Persisted to localStorage. Same external-store pattern
 * as useGenie6Theme so all consumers stay in sync from any caller.
 */

const KEY = "genie6-demo-data";
const DEFAULT_ON = true;

function read(): boolean {
  if (typeof window === "undefined") return DEFAULT_ON;
  const v = window.localStorage.getItem(KEY);
  if (v === "off" || v === "false" || v === "0") return false;
  return DEFAULT_ON;
}

let current = read();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function getSnapshot() {
  return current;
}

function getServerSnapshot() {
  return DEFAULT_ON;
}

export function setDemoDataOn(next: boolean) {
  if (next === current) return;
  current = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, next ? "on" : "off");
  }
  emit();
}

export function useDemoData() {
  const on = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { on, set: setDemoDataOn, toggle: () => setDemoDataOn(!current) };
}

// Cross-tab sync via storage event
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    const next = read();
    if (next !== current) {
      current = next;
      emit();
    }
  });
}
