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

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === VARIANT_KEY) setVariantState(readVariant());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { variant, setVariant };

  function setVariant(next: GenieVariant) {
    window.localStorage.setItem(VARIANT_KEY, next);
    setVariantState(next);
  }
}
