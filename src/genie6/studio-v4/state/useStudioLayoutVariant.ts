import { useSyncExternalStore } from "react";

/**
 * Studio wizard layout persistence — mirrors src/auth-v2/shared/
 * useAuthV2Variant.ts's architecture exactly: module-level external store +
 * useSyncExternalStore + localStorage, with cross-tab sync via `storage`.
 *
 * Two candidates (Maalik, 2026-09-08):
 *   - "rail"   : today's layout — ContextRail as a fixed right-side rail.
 *   - "linear" : Overview (editable Angle+Concept) at the top of the main
 *                column, Script in the middle, Prompt bar last — one
 *                top-to-bottom reading path instead of a side rail.
 *
 * Dev-only toggle (see StudioLayoutToggle.tsx) — not user-facing.
 */

export type StudioLayoutVariant = "rail" | "linear";

const KEY = "studio-layout-variant";
const DEFAULT_VARIANT: StudioLayoutVariant = "rail";

function isValid(v: string | null): v is StudioLayoutVariant {
  return v === "rail" || v === "linear";
}

function read(): StudioLayoutVariant {
  if (typeof window === "undefined") return DEFAULT_VARIANT;
  const v = window.localStorage.getItem(KEY);
  return isValid(v) ? v : DEFAULT_VARIANT;
}

let current: StudioLayoutVariant = read();
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

function getSnapshot(): StudioLayoutVariant {
  return current;
}

function getServerSnapshot(): StudioLayoutVariant {
  return DEFAULT_VARIANT;
}

export function setStudioLayoutVariant(next: StudioLayoutVariant) {
  if (next === current) return;
  current = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, next);
  }
  emit();
}

export function cycleStudioLayoutVariant() {
  setStudioLayoutVariant(current === "rail" ? "linear" : "rail");
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

export function useStudioLayoutVariant() {
  const variant = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    variant,
    setVariant: setStudioLayoutVariant,
    cycle: cycleStudioLayoutVariant,
  };
}
