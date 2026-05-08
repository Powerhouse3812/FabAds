import { useEffect, useSyncExternalStore } from "react";

/**
 * V7 shape sub-variant — only meaningful when active main variant is "clickup".
 *
 * Two values:
 *   - "floating" : merged shell has m-2 margin + rounded-2xl + shadow + ring
 *   - "edge"     : merged shell fills viewport edge-to-edge (no margin/rounded/shadow)
 *
 * Toggled by clicking the FabAds logo in the V7 rail. Persisted to
 * localStorage so it survives reloads. Default = "edge" (filled nav panel,
 * per Maalik A-12.36 — floating variant temporarily de-emphasised).
 *
 * Architecture: external store + useSyncExternalStore (mirrors useGenie6Theme +
 * useFabAdsNavVariant patterns).
 */

export type V7Shape = "floating" | "edge";

const KEY = "fabads-v7-shape";
const DEFAULT_SHAPE: V7Shape = "edge";

function read(): V7Shape {
  if (typeof window === "undefined") return DEFAULT_SHAPE;
  const v = window.localStorage.getItem(KEY);
  // Force edge default — ignore any stored "floating" so old localStorage
  // values don't keep users on the deprioritised floating variant.
  if (v === "edge") return "edge";
  return DEFAULT_SHAPE;
}

let current: V7Shape = read();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function getSnapshot(): V7Shape {
  return current;
}

function getServerSnapshot(): V7Shape {
  return DEFAULT_SHAPE;
}

export function setV7Shape(next: V7Shape) {
  if (next === current) return;
  current = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, next);
  }
  emit();
}

export function cycleV7Shape() {
  setV7Shape(current === "floating" ? "edge" : "floating");
}

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

export function useV7Shape() {
  const shape = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.dataset.fabadsV7Shape = shape;
    return () => {
      delete document.documentElement.dataset.fabadsV7Shape;
    };
  }, [shape]);

  return { shape, setShape: setV7Shape, cycle: cycleV7Shape };
}
