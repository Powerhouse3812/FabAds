import { useEffect, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

/**
 * Genie 6 theme + architectural variant mirror.
 *
 * Sets two attributes on <html>:
 *   data-theme="light|dark"               — mirrored from FabAds' next-themes
 *   data-genie6-variant="..."             — architectural variant (full layout fork)
 *
 * Architectural variants (each is a complete UI architecture, not a token swap):
 *   studio   — 3-column workspace (mode tree + form + live preview)         · default
 *   canvas   — editor-first (massive viewport + vertical tools)
 *   command  — ops dashboard (KPIs + brands + activity always visible)
 *   modular  — composable workbench (draggable module cards on dark canvas)
 *
 * Theme is universal across variants — light mode = light for all 4, dark
 * mode = dark for all 4. Variants only differ in JSX layout architecture +
 * helper classes (g6-canvas-floor, g6-halo, g6-code-h).
 *
 * IMPLEMENTATION NOTE — external store pattern.
 *
 * Earlier revisions used per-component useState + a CustomEvent broadcast
 * to keep multiple consumers in sync (topbar switcher + each page-level
 * router). That was fragile under HMR: components mounted before the hook
 * file was patched could carry a stale closure of setVariant without the
 * broadcast call, leaving them out of sync.
 *
 * This revision uses a module-level store + useSyncExternalStore. A single
 * `currentVariant` lives at module scope; every consumer subscribes via the
 * React 18 primitive. setVariant updates the module variable and notifies
 * all subscribers. There's no per-component state, no closure drift, and
 * HMR-friendly because the store is shared.
 */

export type GenieVariant = "studio" | "canvas" | "command" | "modular";

const VARIANT_KEY = "genie6-variant";
const DEFAULT_VARIANT: GenieVariant = "studio";

function readVariantFromStorage(): GenieVariant {
  if (typeof window === "undefined") return DEFAULT_VARIANT;
  const v = window.localStorage.getItem(VARIANT_KEY);
  return v === "studio" || v === "canvas" || v === "command" || v === "modular"
    ? v
    : DEFAULT_VARIANT;
}

/* ─────────────────────────────────────────────────────────
   External store — one source of truth across all consumers
   ───────────────────────────────────────────────────────── */
let currentVariant: GenieVariant = readVariantFromStorage();
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

function getSnapshot(): GenieVariant {
  return currentVariant;
}

function getServerSnapshot(): GenieVariant {
  return DEFAULT_VARIANT;
}

export function setVariant(next: GenieVariant) {
  if (next === currentVariant) return;
  currentVariant = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(VARIANT_KEY, next);
  }
  emit();
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
export function useGenie6Theme() {
  const { resolvedTheme } = useTheme();
  const variant = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    const value = resolvedTheme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = value;
    document.documentElement.dataset.genie6Variant = variant;
    return () => {
      delete document.documentElement.dataset.theme;
      delete document.documentElement.dataset.genie6Variant;
    };
  }, [resolvedTheme, variant]);

  return { variant, setVariant };
}
