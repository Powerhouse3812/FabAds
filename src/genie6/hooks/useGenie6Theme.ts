import { useEffect, useState } from "react";
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
 * Each variant has its own React component implementations per surface
 * (Home / Workspace / Generate / Library / Settings). Page-level routers in
 * src/genie6/variants/ select the right impl by reading this hook.
 *
 * Old token-only variants (mirage/operator/soft/mercury) were superseded by
 * this architectural-variant system in the same sprint.
 */

export type GenieVariant = "studio" | "canvas" | "command" | "modular";

const VARIANT_KEY = "genie6-variant";
const VARIANT_EVENT = "genie6-variant-change";
const DEFAULT_VARIANT: GenieVariant = "studio";

function readVariant(): GenieVariant {
  if (typeof window === "undefined") return DEFAULT_VARIANT;
  const v = window.localStorage.getItem(VARIANT_KEY);
  return v === "studio" || v === "canvas" || v === "command" || v === "modular"
    ? v
    : DEFAULT_VARIANT;
}

export function useGenie6Theme() {
  const { resolvedTheme } = useTheme();
  const [variant, setVariantState] = useState<GenieVariant>(readVariant);

  useEffect(() => {
    const value = resolvedTheme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = value;
    document.documentElement.dataset.genie6Variant = variant;
    return () => {
      delete document.documentElement.dataset.theme;
      delete document.documentElement.dataset.genie6Variant;
    };
  }, [resolvedTheme, variant]);

  // Listen for variant changes from any other useGenie6Theme caller in the same
  // tab. The native "storage" event only fires across tabs/windows, NOT same-tab,
  // so we broadcast our own CustomEvent in setVariant() to keep every consumer
  // (topbar switcher + page-level routers) in sync without a Context Provider.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === VARIANT_KEY) setVariantState(readVariant());
    };
    const onSameTab = (e: Event) => {
      const next = (e as CustomEvent<GenieVariant>).detail;
      if (next) setVariantState(next);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(VARIANT_EVENT, onSameTab as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(VARIANT_EVENT, onSameTab as EventListener);
    };
  }, []);

  return { variant, setVariant };

  function setVariant(next: GenieVariant) {
    window.localStorage.setItem(VARIANT_KEY, next);
    setVariantState(next);
    window.dispatchEvent(new CustomEvent<GenieVariant>(VARIANT_EVENT, { detail: next }));
  }
}
