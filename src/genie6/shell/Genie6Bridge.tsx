import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { useGenie6Theme, setVariant, type GenieVariant } from "../hooks/useGenie6Theme";
import { useWelcomeCarousel } from "./WelcomeCarousel";
import { useNewGenerationOverlay } from "./NewGenerationOverlay";
import { resolvePrefillFromRoute } from "../lib/prefillContext";

/**
 * Lightweight wrapper for all /iq/genie6/* routes.
 *
 * Jobs:
 *  1. Mirror FabAds' next-themes onto <html data-theme=...> via useGenie6Theme().
 *  2. Auto-open WelcomeCarousel on first visit.
 *  3. Bind keyboard shortcuts:
 *       ⌘N   — open New Generation overlay (with route-derived prefill)
 *       ⌘1/2/3/4 — switch variant directly
 *       ⌘⇧D — toggle dark mode
 *
 * Iter-5: Command palette modal removed. Keyboard shortcuts live here directly,
 * no longer inside a CommandPaletteProvider. ⌘K binding removed entirely (was
 * for opening the palette, which is gone).
 *
 * Wraps the Outlet in `g6-root` so Geist + token-based bg/text apply to page content.
 */
export function Genie6Bridge() {
  useGenie6Theme();
  useGenie6KeyboardShortcuts();

  const { open: openCarousel, hasBeenSeen } = useWelcomeCarousel();

  // Welcome carousel — auto-open on first visit
  useEffect(() => {
    if (hasBeenSeen()) return;
    const t = setTimeout(() => openCarousel(), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="g6-root flex flex-1 flex-col" data-g6-build="2026-04-30-iter5">
      <Outlet />
    </div>
  );
}

/** Genie 6 keyboard shortcuts. Standalone — no palette dependency. */
function useGenie6KeyboardShortcuts() {
  const { variant } = useGenie6Theme();
  const { setTheme, resolvedTheme } = useTheme();
  const { open: openNewGenOverlay } = useNewGenerationOverlay();
  const { pathname } = useLocation();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const inField = tag === "input" || tag === "textarea" || target?.isContentEditable;
      const meta = e.metaKey || e.ctrlKey;

      if (!meta) return;
      if (inField) return; // never hijack while user is typing

      // ⌘⇧D — toggle dark mode
      if (e.key.toLowerCase() === "d" && e.shiftKey) {
        e.preventDefault();
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
        return;
      }

      // ⌘N — quick new generation (open focused overlay)
      if (e.key.toLowerCase() === "n" && !e.shiftKey) {
        e.preventDefault();
        openNewGenOverlay(resolvePrefillFromRoute(pathname));
        return;
      }

      // ⌘1/2/3/4 — switch variant directly
      if (["1", "2", "3", "4"].includes(e.key)) {
        const variants: GenieVariant[] = ["studio", "canvas", "command", "modular"];
        const next = variants[parseInt(e.key, 10) - 1];
        if (next && next !== variant) {
          e.preventDefault();
          setVariant(next);
        }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [variant, setTheme, resolvedTheme, openNewGenOverlay, pathname]);
}
