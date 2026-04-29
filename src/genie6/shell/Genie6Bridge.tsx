import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useGenie6Theme } from "../hooks/useGenie6Theme";
import { useWelcomeCarousel } from "./WelcomeCarousel";
import { useCommandPaletteShortcuts } from "./CommandPalette";

/**
 * Lightweight wrapper for all /iq/genie6/* routes.
 *
 * Jobs:
 *  1. Mirror FabAds' next-themes onto <html data-theme=...> via useGenie6Theme().
 *  2. Auto-open WelcomeCarousel on first visit.
 *  3. Bind global keyboard shortcuts (⌘K, ⌘1/2/3/4, ⌘N, ⌘⇧D).
 *
 * Note (iter 3): CommandPaletteProvider is now HOISTED to AppLayout (along with
 * NewGenerationOverlay + WelcomeCarousel) so the FabAds shell — including the
 * RightRail rendered next to the Outlet — can also use the palette.
 *
 * Wraps the Outlet in `g6-root` so Geist + token-based bg/text apply to page content.
 */
export function Genie6Bridge() {
  useGenie6Theme();
  useCommandPaletteShortcuts();

  const { open: openCarousel, hasBeenSeen } = useWelcomeCarousel();

  // Welcome carousel — auto-open on first visit
  useEffect(() => {
    if (hasBeenSeen()) return;
    const t = setTimeout(() => openCarousel(), 350);
    return () => clearTimeout(t);
    // Run once per Bridge mount (i.e., once per Genie 6 session entry)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="g6-root flex flex-1 flex-col" data-g6-build="2026-04-30-iter3">
      <Outlet />
    </div>
  );
}
