import { useLocation } from "react-router-dom";
import { Plus, Command } from "lucide-react";
import { useNewGenerationOverlay } from "./NewGenerationOverlay";
import { useCommandPalette } from "./CommandPalette";
import { resolvePrefillFromRoute } from "../lib/prefillContext";

/**
 * Right rail (Genie 6 routes only). Iter-3 IA: post-topbar removal, the
 * primary "+ New generation" CTA + ⌘K palette affordance live here.
 *
 * Width: ~64px. Sits flush right, full height, separated by a left border.
 * Renders only on /iq/genie6/* — wrapped at the AppLayout level so other
 * routes don't see this column.
 */
export function RightRail() {
  const { pathname } = useLocation();
  const { open: openOverlay } = useNewGenerationOverlay();
  const { toggle: togglePalette } = useCommandPalette();

  const handleNewGen = () => {
    const prefill = resolvePrefillFromRoute(pathname);
    openOverlay(prefill);
  };

  return (
    <aside className="flex flex-col items-center w-14 border-l border-border bg-background py-3 gap-2 flex-shrink-0">
      {/* Primary CTA — full lime, prominent */}
      <button
        type="button"
        onClick={handleNewGen}
        title="New generation (⌘N)"
        aria-label="New generation"
        className="flex h-10 w-10 items-center justify-center rounded-g6-base bg-g6-primary text-g6-text-on-accent shadow-g6-glow hover:opacity-90 transition-opacity"
      >
        <Plus className="h-5 w-5" />
      </button>

      {/* ⌘K palette affordance — small pill, hints at keyboard shortcut */}
      <button
        type="button"
        onClick={togglePalette}
        title="Command palette (⌘K)"
        aria-label="Open command palette"
        className="flex h-9 w-9 items-center justify-center rounded-g6-base border border-border bg-background text-g6-text-tertiary hover:bg-g6-bg-spotlight hover:text-g6-text transition-colors"
      >
        <Command className="h-3.5 w-3.5" />
      </button>
    </aside>
  );
}
