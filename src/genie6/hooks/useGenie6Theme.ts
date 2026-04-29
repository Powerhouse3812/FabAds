import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

/**
 * Genie 6 theme + variant mirror (Track 5).
 *
 * Sets two attributes on <html>:
 *   data-theme="light|dark"           — mirrored from FabAds' next-themes
 *   data-genie6-variant="..."         — selected design direction (Track 5)
 *
 * Variants: mirage | operator | soft | mercury (default = operator).
 *
 * On unmount (leaving /iq/genie6/* routes), both attributes are removed so
 * FabAds' .dark-class theme keeps working unaffected on other routes.
 */

export type GenieVariant = "mirage" | "operator" | "soft" | "mercury";

const VARIANT_KEY = "genie6-variant";
const DEFAULT_VARIANT: GenieVariant = "operator";

function readVariant(): GenieVariant {
  if (typeof window === "undefined") return DEFAULT_VARIANT;
  const v = window.localStorage.getItem(VARIANT_KEY);
  return v === "mirage" || v === "operator" || v === "soft" || v === "mercury"
    ? v
    : DEFAULT_VARIANT;
}

export function useGenie6Theme() {
  const { resolvedTheme } = useTheme();
  const [variant, setVariantState] = useState<GenieVariant>(readVariant);

  // Mirror theme + variant onto <html>
  useEffect(() => {
    const value = resolvedTheme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = value;
    document.documentElement.dataset.genie6Variant = variant;
    return () => {
      delete document.documentElement.dataset.theme;
      delete document.documentElement.dataset.genie6Variant;
    };
  }, [resolvedTheme, variant]);

  // Cross-tab sync
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
