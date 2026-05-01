import { useEffect, useSyncExternalStore } from "react";

/**
 * FabAds shell-level navigation variant.
 *
 * Sets one attribute on <html>:
 *   data-fabads-nav-variant="rail|sections|focus"
 *
 * Variants:
 *   rail      — icon rail (60px) + collapsible sub-panel (200px). Default.
 *               Two-tier; everything one click away. Linear/Mercury vibe.
 *   sections  — single-pane (240px expanded / 60px collapsed) with functional
 *               group labels (RUN / DISCOVER / CREATE / AUTOMATE) and inline
 *               accordion sub-items. Vercel/Sana/Peec vibe.
 *   focus     — drill-in pane (220px). Active module's sub-items foregrounded;
 *               other modules demoted to compact quick-jump strip below.
 *               Designed from scratch for agency director "80% in 2-3 modules"
 *               behaviour. Filing-cabinet metaphor.
 *
 * Mirrors the architecture of `useGenie6Theme.ts` — module-level external
 * store + useSyncExternalStore. See that file for rationale.
 *
 * Persistence: localStorage key `fabads-nav-variant`. Default: `"rail"`.
 * Toggle behaviour: single-icon click cycles rail → sections → focus → rail.
 */

export type FabAdsNavVariant = "rail" | "sections" | "focus";

const VARIANT_KEY = "fabads-nav-variant";
const DEFAULT_VARIANT: FabAdsNavVariant = "rail";

/** Cycle order for the single-icon NavVariantToggle. */
const CYCLE_ORDER: FabAdsNavVariant[] = ["rail", "sections", "focus"];

function readVariantFromStorage(): FabAdsNavVariant {
  if (typeof window === "undefined") return DEFAULT_VARIANT;
  const v = window.localStorage.getItem(VARIANT_KEY);
  return v === "rail" || v === "sections" || v === "focus" ? v : DEFAULT_VARIANT;
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

/** Cycles through all variants in order. Click handler convenience. */
export function cycleNavVariant() {
  const idx = CYCLE_ORDER.indexOf(currentVariant);
  const next = CYCLE_ORDER[(idx + 1) % CYCLE_ORDER.length];
  setNavVariant(next);
}

/** Returns the variant that comes next in the cycle (for tooltip labels). */
export function getNextVariant(current: FabAdsNavVariant): FabAdsNavVariant {
  const idx = CYCLE_ORDER.indexOf(current);
  return CYCLE_ORDER[(idx + 1) % CYCLE_ORDER.length];
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
