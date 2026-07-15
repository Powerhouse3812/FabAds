import { useSyncExternalStore } from "react";

/**
 * auth-v2 variant persistence — mirrors src/components/sidebar/useV7Shape.ts's
 * architecture exactly: module-level external store + useSyncExternalStore +
 * localStorage, with cross-tab sync via the `storage` event.
 *
 * Two final candidate designs for the standalone auth-v2 surface:
 *   - "dark-stage"    : Dark Stage variant
 *   - "living-split"  : Living Split variant
 *
 * Dev-only toggle (see VariantToggle.tsx) — not user-facing.
 */

export type AuthV2Variant = "dark-stage" | "living-split";

const KEY = "fabads-authv2-variant";
const DEFAULT_VARIANT: AuthV2Variant = "dark-stage";

function isValid(v: string | null): v is AuthV2Variant {
  return v === "dark-stage" || v === "living-split";
}

function read(): AuthV2Variant {
  if (typeof window === "undefined") return DEFAULT_VARIANT;
  const v = window.localStorage.getItem(KEY);
  return isValid(v) ? v : DEFAULT_VARIANT;
}

let current: AuthV2Variant = read();
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

function getSnapshot(): AuthV2Variant {
  return current;
}

function getServerSnapshot(): AuthV2Variant {
  return DEFAULT_VARIANT;
}

export function setAuthV2Variant(next: AuthV2Variant) {
  if (next === current) return;
  current = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, next);
  }
  emit();
}

export function cycleAuthV2Variant() {
  setAuthV2Variant(current === "dark-stage" ? "living-split" : "dark-stage");
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

export function useAuthV2Variant() {
  const variant = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    variant,
    setVariant: setAuthV2Variant,
    cycle: cycleAuthV2Variant,
  };
}
