import { useEffect, useSyncExternalStore } from "react";

/**
 * FabAds shell-level navigation variant.
 *
 * Sets one attribute on <html>:
 *   data-fabads-nav-variant="rail|sections"
 *
 * Variants:
 *   rail      — icon rail (60px) + collapsible sub-panel (200px). Default.
 *   sections  — single-pane (240px expanded / 60px collapsed) with functional
 *               group labels (RUN / DISCOVER / CREATE / AUTOMATE) and inline
 *               accordion sub-items.
 *
 * Mirrors the architecture of `useGenie6Theme.ts` — module-level external
 * store + useSyncExternalStore. See that file for rationale.
 *
 * Persistence: localStorage key `fabads-nav-variant`. Default: `"rail"`.
 */

export type FabAdsNavVariant = "rail" | "sections";

const VARIANT_KEY = "fabads-nav-variant";
const DEFAULT_VARIANT: FabAdsNavVariant = "rail";

function readVariantFromStorage(): FabAdsNavVariant {
  if (typeof window === "undefined") return DEFAULT_VARIANT;
  const v = window.localStorage.getItem(VARIANT_KEY);
  return v === "rail" || v === "sections" ? v : DEFAULT_VARIANT;
}

/* ─────────────────────────────────────────────────────────
   External store — one source of truth across all consumers
   ───────────────────────────────────────────────────────── */
let currentVariant: FabAdsNavVariant = readVariantFromStorage();
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): FabAdsNavVariant {
  return currentVariant;
}

function getServerSnapshot(): FabAdsNavVariant {
  return DEFAULT_VARIANT;
}

export function setNavVariant(next: FabAdsNavVariant) {
  if (next === currentVariant) return;
  currentVariant = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(VARIANT_KEY, next);
  }
  emit();
}

/** Cycles between the two variants. Click handler convenience. */
export function cycleNavVariant() {
  setNavVariant(currentVariant === "rail" ? "sections" : "rail");
}

// Sync if another tab changes the variant.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== VARIANT_KEY) return;
    const next = readVariantFromStorage();
    if (next !== currentVariant) {
      currentVariant = next;
      emit();
    }
  });
}

/* ─────────────────────────────────────────────────────────
   Hook
   ───────────────────────────────────────────────────────── */
export function useFabAdsNavVariant() {
  const variant = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.dataset.fabadsNavVariant = variant;
    return () => {
      delete document.documentElement.dataset.fabadsNavVariant;
    };
  }, [variant]);

  return { variant, setVariant: setNavVariant, cycle: cycleNavVariant };
}
