import { useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useNewGenerationOverlay } from "./NewGenerationOverlay";
import { resolvePrefillFromRoute } from "../lib/prefillContext";

/**
 * "+ New generation" button — primary lime CTA in the Genie 6 sub-nav (Q-1).
 *
 * Was a soft secondary that disappeared into the sidebar; promoted to a
 * filled primary button so it reads as the entry-point action it actually
 * is. Opens NewGenerationOverlay with route-derived prefill.
 */
export function Genie6SubnavNewGenButton() {
  const { open } = useNewGenerationOverlay();
  const { pathname } = useLocation();

  return (
    <button
      type="button"
      onClick={() => open(resolvePrefillFromRoute(pathname))}
      aria-label="New generation"
      className="group flex w-full items-center justify-center gap-1.5 rounded-md bg-g6-primary px-3 py-2 text-left text-xs font-semibold text-g6-text-on-accent shadow-g6-primary-btn transition-all hover:bg-g6-primary-hover hover:scale-[1.01] active:scale-[0.99]"
    >
      <Sparkles className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">New generation</span>
    </button>
  );
}
