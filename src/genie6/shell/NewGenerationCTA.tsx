import { useLocation } from "react-router-dom";
import { Plus } from "lucide-react";
import { useNewGenerationOverlay } from "./NewGenerationOverlay";
import { resolvePrefillFromRoute } from "../lib/prefillContext";

/**
 * Universal "+ New generation" CTA.
 *
 * Lives in FabAds AppLayout topbar (rendered conditionally on /iq/genie6/* routes).
 * On click → resolves prefill from current pathname (workspace brand / library concept /
 * etc.) → opens the overlay with that context, so the overlay header shows a
 * "pre-filled · Mamaearth" chip and downstream Generate routes carry the entity IDs.
 */
export function NewGenerationCTA() {
  const { open } = useNewGenerationOverlay();
  const { pathname } = useLocation();

  const handleClick = () => {
    const prefill = resolvePrefillFromRoute(pathname);
    open(prefill);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex h-8 items-center gap-1.5 rounded-g6-pill bg-g6-primary px-3 text-g6-sm font-semibold text-g6-text-on-accent shadow-g6-primary-btn transition-colors hover:bg-g6-primary-hover active:bg-g6-primary-active"
    >
      <Plus className="h-4 w-4" aria-hidden />
      New generation
    </button>
  );
}
