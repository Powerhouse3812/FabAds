import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import MobileTourChecklist from "@/mobile-tour/MobileTourChecklist";
import MobileTourWelcome from "@/mobile-tour/MobileTourWelcome";
import {
  getMobileTourProgress,
  markMobileTourWelcomeSeen,
  resetMobileTour,
} from "@/mobile-tour/useMobileTourProgress";

/**
 * MobileTourFlow — Flow B's overlay: 3 welcome screens → 4-item checklist.
 *
 * WHY A FULL-HEIGHT SHEET RATHER THAN A CUSTOM `fixed` OVERLAY
 * `SheetContent` (Radix Dialog underneath) already gives the three things a
 * hand-rolled overlay gets wrong: a focus trap, Escape-to-close, and — since
 * `ui/sheet.tsx` preventDefaults both outside-interaction events — the standing
 * app rule that overlays never dismiss on an outside tap. Stretching it to
 * `100dvh` turns it into a full-screen takeover without re-implementing any of
 * that. `dvh` (not `vh`) because mobile Safari's `vh` includes the collapsing
 * URL bar, which would push the sticky footer under the chrome.
 *
 * Because dismissal is explicit-only, there are two close controls on purpose:
 * the X `SheetContent` renders at top-right, plus the one below at top-LEFT
 * (thumb-side on a right-handed grip, and it cannot collide with the built-in
 * one). Both do the same thing. The checklist's footer button is the third,
 * fully thumb-reachable exit.
 *
 * This component is deliberately NOT merged with Flow A in
 * `src/mobile-onboarding/` — two separate flows by instruction.
 */

/**
 * `replay` keeps whatever the user already ticked.
 * `fresh` wipes tick state first — the destructive branch of the launch prompt.
 */
export type MobileTourMode = "replay" | "fresh";

/** `auto` = welcome for a first-timer, straight to the checklist for a returner. */
export type MobileTourStartAt = "auto" | "welcome" | "checklist";

export interface MobileTourFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Default `replay` — non-destructive, so a mis-wired caller cannot erase progress. */
  mode?: MobileTourMode;
  /** Default `auto`. Ignored when `mode` is `fresh` (a fresh run always starts at screen 1). */
  startAt?: MobileTourStartAt;
}

type Stage = "welcome" | "checklist";

export default function MobileTourFlow({
  open,
  onOpenChange,
  mode = "replay",
  startAt = "auto",
}: MobileTourFlowProps) {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("welcome");
  const wasOpen = useRef(false);

  // Resolve the entry point on the closed→open edge only. Doing this in render
  // would re-resolve mid-flow (and `mode: "fresh"` would re-wipe progress on
  // every re-render), and doing it on every `open` change would fight the user's
  // own navigation between the two stages.
  useEffect(() => {
    if (open && !wasOpen.current) {
      if (mode === "fresh") {
        resetMobileTour();
        setStage("welcome");
      } else if (startAt === "checklist") {
        setStage("checklist");
      } else if (startAt === "welcome") {
        setStage("welcome");
      } else {
        // `auto`: skip the prose for anyone who has already read it.
        setStage(getMobileTourProgress().welcomeSeen ? "checklist" : "welcome");
      }
    }
    wasOpen.current = open;
  }, [open, mode, startAt]);

  const goToChecklist = useCallback(() => {
    // Recorded on both Next-through-the-end AND Skip: in either case the user
    // has been offered the prose, so `auto` should not show it again.
    markMobileTourWelcomeSeen();
    setStage("checklist");
  }, []);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  // Close first, then navigate — otherwise the user arrives at the destination
  // with a 100dvh overlay still on top of it.
  const handleNavigate = useCallback(
    (to: string) => {
      onOpenChange(false);
      navigate(to);
    },
    [navigate, onOpenChange],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          // Full-screen takeover: square corners, no default padding, and the
          // children own all spacing so the footer can sit flush.
          "flex h-[100dvh] max-h-[100dvh] flex-col gap-0 rounded-none p-0",
          // Shifts content clear of a notch. The built-in top-right X stays at
          // its own top-4 offset, which is why the primary X below is in-flow.
          "pt-[env(safe-area-inset-top)]",
        )}
      >
        {/* ── header ───────────────────────────────────────────────────────
            `pr-12` reserves the corner for SheetContent's own X instead of
            letting the title run under it. */}
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2 pr-12">
          <button
            type="button"
            onClick={close}
            aria-label="Close the mobile tour"
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground",
              "transition-colors active:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
          <SheetTitle className="min-w-0 truncate text-base">
            Mobile tour
          </SheetTitle>
          {/* Radix warns without a description; the visible copy inside each
              stage is the real explanation, so this is for assistive tech only. */}
          <SheetDescription className="sr-only">
            A short tour of what FabAds does on a phone, followed by four
            getting-started steps.
          </SheetDescription>
        </div>

        {stage === "welcome" ? (
          <MobileTourWelcome onFinish={goToChecklist} onSkip={goToChecklist} />
        ) : (
          <MobileTourChecklist
            onNavigate={handleNavigate}
            onReplayWelcome={() => setStage("welcome")}
            onClose={close}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
