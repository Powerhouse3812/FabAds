import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useGenie6Theme } from "../hooks/useGenie6Theme";
import { useNewGenerationOverlay } from "./NewGenerationOverlay";
import { useWelcomeCarousel } from "./WelcomeCarousel";
import { resolvePrefillFromRoute } from "../lib/prefillContext";

/**
 * Lightweight wrapper for all /iq/genie6/* routes.
 *
 * Three jobs:
 *  1. Mirror FabAds' next-themes onto <html data-theme=...> via useGenie6Theme().
 *  2. Auto-open WelcomeCarousel on first visit (only fires inside Genie 6 routes,
 *     not on FabAds shell pages — even though the provider lives at AppLayout level).
 *  3. Bind Cmd-K (Ctrl-K) to open the NewGenerationOverlay with route-derived prefill.
 *
 * Wraps the Outlet in `g6-root` so Geist + token-based bg/text apply to page content.
 *
 * The NewGenerationOverlay + WelcomeCarousel providers are HOISTED to AppLayout so
 * the FabAds topbar (rendered above this Bridge) can call open() too.
 */
export function Genie6Bridge() {
  useGenie6Theme();
  const { pathname } = useLocation();
  const { open: openOverlay } = useNewGenerationOverlay();
  const { open: openCarousel, hasBeenSeen } = useWelcomeCarousel();

  // 1. Welcome carousel — auto-open on first visit
  useEffect(() => {
    if (hasBeenSeen()) return;
    const t = setTimeout(() => openCarousel(), 350);
    return () => clearTimeout(t);
    // Run once per Bridge mount (i.e., once per Genie 6 session entry)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Cmd-K / Ctrl-K → open NewGenerationOverlay with route prefill
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        // Don't fire when user is typing in an input
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || target?.isContentEditable) {
          // Allow Cmd-K only when user is NOT inside a text field
          return;
        }
        e.preventDefault();
        const prefill = resolvePrefillFromRoute(pathname);
        openOverlay(prefill);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pathname, openOverlay]);

  return (
    <div className="g6-root flex flex-1 flex-col">
      <Outlet />
    </div>
  );
}
