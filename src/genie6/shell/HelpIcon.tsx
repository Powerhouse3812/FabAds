import { HelpCircle } from "lucide-react";
import { useWelcomeCarousel } from "./WelcomeCarousel";

/**
 * Help icon — replays the welcome carousel.
 *
 * Lives in FabAds AppLayout topbar (rendered conditionally on /iq/genie6/* routes).
 * Click → opens the carousel from slide 1, regardless of seen-flag.
 */
export function HelpIcon() {
  const { open } = useWelcomeCarousel();

  return (
    <button
      type="button"
      onClick={() => open()}
      aria-label="Help — replay welcome"
      className="inline-flex h-8 w-8 items-center justify-center rounded-g6-base text-g6-text-secondary hover:bg-g6-bg-container hover:text-g6-text transition-colors"
    >
      <HelpCircle className="h-4 w-4" />
    </button>
  );
}
