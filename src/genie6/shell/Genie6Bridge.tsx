import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { useGenie6Theme, setVariant, type GenieVariant } from "../hooks/useGenie6Theme";
import { useNewGenerationOverlay } from "./NewGenerationOverlay";
import { resolvePrefillFromRoute } from "../lib/prefillContext";

/**
 * Lightweight wrapper for all /iq/genie6/* routes.
 *
 * Jobs:
 *  1. Mirror FabAds' next-themes onto <html data-theme=...> via useGenie6Theme().
 *  2. Bind keyboard shortcuts:
 *       ⌘N   — open New Generation overlay (with route-derived prefill)
 *       ⌘1/2/3/4 — switch variant directly
 *       ⌘⇧D — toggle dark mode
 *
 * A-12.46 (Maalik): WelcomeCarousel auto-open removed. It was firing on every
 * fresh browser context (incl. HTMLtoDesign / Figma plugin captures), polluting
 * every screen with the onboarding overlay. The carousel component itself
 * stays (power users can still trigger it manually via the help icon),
 * but it no longer fires automatically.
 *
 * Iter-5: Command palette modal removed. Keyboard shortcuts live here directly,
 * no longer inside a CommandPaletteProvider. ⌘K binding removed entirely (was
 * for opening the palette, which is gone).
 *
 * Wraps the Outlet in `g6-root` so Geist + token-based bg/text apply to page content.
 *
 * `overflow-y-auto` — the shared scroll region for every Genie route.
 *
 * The FabAds shell is a fixed 100dvh box with INTERNAL scroll regions; routed
 * content sits inside a `flex-1 min-h-0 overflow-hidden` container, so a page
 * taller than the viewport is silently CLIPPED rather than scrolled. The
 * shell's own `md:overflow-auto` can't rescue it — that intermediate container
 * has already hidden the overflow before the shell sees it.
 *
 * Long-standing pages each solved this themselves (StudioLibrary wraps its
 * body, StudioAlpha puts it on its `<main>`), but eight of the nine pages
 * added in Genie 2.0 didn't, and lost everything below the fold: at 1440x820,
 * Other Flows rendered 1242px of content into an 820px box and 422px of it was
 * unreachable. Nothing looked broken, which is exactly why it shipped.
 *
 * Fixing it here rather than in each page means the next new Genie route can't
 * reintroduce it. Pages that already manage their own scrolling are unaffected:
 * they size to `h-full` (= this container's height), so they never overflow it
 * and this scroller stays inert while their inner region keeps scrolling.
 */
export function Genie6Bridge() {
  useGenie6Theme();
  useGenie6KeyboardShortcuts();

  return (
    <div
      className="g6-root flex min-h-0 flex-1 flex-col overflow-y-auto"
      data-g6-build="2026-04-30-iter5"
    >
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
