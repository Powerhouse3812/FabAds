import { useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useNewGenerationOverlay } from "./NewGenerationOverlay";
import { resolvePrefillFromRoute } from "../lib/prefillContext";

/**
 * "+ New generation" button — sleek, secondary style. Same visual shape as
 * the Genie 6 sub-nav search bar (rounded border, left icon, label, right
 * shortcut pill). Sits below the search bar in the sub-nav.
 *
 * Iter-5: replaces the right-rail's primary lime "+ New gen" button. Same
 * function (opens NewGenerationOverlay with route-derived prefill) but
 * lives in the sub-nav with secondary styling — doesn't dominate the page.
 */
export function Genie6SubnavNewGenButton() {
  const { open } = useNewGenerationOverlay();
  const { pathname } = useLocation();

  return (
    <button
      type="button"
      onClick={() => open(resolvePrefillFromRoute(pathname))}
      aria-label="New generation"
      className="group flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/30 px-2.5 py-1.5 text-left text-xs text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
    >
      <Sparkles className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 truncate font-medium">New generation</span>
    </button>
  );
}
