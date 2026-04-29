import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useGenie6Theme } from "../hooks/useGenie6Theme";
import { useWelcomeCarousel } from "./WelcomeCarousel";
import { CommandPaletteProvider, useCommandPaletteShortcuts } from "./CommandPalette";

/**
 * Lightweight wrapper for all /iq/genie6/* routes.
 *
 * Jobs:
 *  1. Mirror FabAds' next-themes onto <html data-theme=...> via useGenie6Theme().
 *  2. Auto-open WelcomeCarousel on first visit.
 *  3. Mount CommandPalette + bind global keyboard shortcuts (⌘K, ⌘1/2/3/4, ⌘N, ⌘⇧D).
 *
 * Wraps the Outlet in `g6-root` so Geist + token-based bg/text apply to page content.
 *
 * The NewGenerationOverlay + WelcomeCarousel providers are HOISTED to AppLayout so
 * the FabAds topbar (rendered above this Bridge) can call open() too. The
 * CommandPaletteProvider is mounted here because the palette only makes sense on
 * Genie 6 routes.
 */
export function Genie6Bridge() {
  return (
    <CommandPaletteProvider>
      <Genie6BridgeInner />
    </CommandPaletteProvider>
  );
}

function Genie6BridgeInner() {
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
    <div className="g6-root flex flex-1 flex-col" data-g6-build="2026-04-29-2110">
      <Outlet />
    </div>
  );
}
