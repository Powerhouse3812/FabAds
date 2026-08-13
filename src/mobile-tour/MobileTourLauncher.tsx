import { useEffect, useRef, useState } from "react";
import { ListChecks, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import MobileTourFlow, { type MobileTourMode } from "@/mobile-tour/MobileTourFlow";
import { useMobileTourProgress } from "@/mobile-tour/useMobileTourProgress";

/**
 * MobileTourLauncher — the single component the More menu needs to mount.
 *
 * WHY A PROMPT AT ALL
 * Relaunching a tour is ambiguous: "replay" could reasonably mean "show me the
 * screens again" or "wipe it and start over", and one of those two readings
 * destroys work the user did. Guessing is not an option — an irreversible action
 * fired from a menu tap breaks NN/g #3 (user control) and #5 (error prevention).
 * So the choice is made explicit, once, before anything is touched:
 *
 *   Replay      → keep every tick, re-run the 3 welcome screens.
 *   Start fresh → clear all ticks, then re-run from screen 1.
 *
 * WHY A FIRST-TIMER NEVER SEES IT
 * With nothing ticked and nothing seen, both branches are identical, so the
 * prompt would be a pure extra tap on the exact path that should be frictionless.
 * `progress.started` gates it.
 *
 * Menu wiring is one piece of state:
 *   const [tourOpen, setTourOpen] = useState(false);
 *   <MobileTourLauncher open={tourOpen} onOpenChange={setTourOpen} />
 */

export interface MobileTourLauncherProps {
  /** Open the tour (show the prompt first when there is progress to protect). */
  open: boolean;
  /** Called with `false` when the prompt is cancelled or the tour is closed. */
  onOpenChange: (open: boolean) => void;
}

type Phase = "prompt" | "flow";

export default function MobileTourLauncher({
  open,
  onOpenChange,
}: MobileTourLauncherProps) {
  const progress = useMobileTourProgress();
  const [phase, setPhase] = useState<Phase>("flow");
  const [mode, setMode] = useState<MobileTourMode>("replay");
  const wasOpen = useRef(false);

  // Decide on the closed→open edge only, so ticking an item mid-flow (which
  // changes `progress.started`) can never bounce the user back to the prompt.
  useEffect(() => {
    if (open && !wasOpen.current) {
      if (progress.started) {
        setPhase("prompt");
      } else {
        setPhase("flow");
        setMode("replay"); // nothing to keep or clear; both branches are equal
      }
    }
    wasOpen.current = open;
  }, [open, progress.started]);

  const start = (next: MobileTourMode) => {
    setMode(next);
    setPhase("flow");
  };

  if (open && phase === "prompt") {
    return (
      <Sheet open onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="flex flex-col gap-0 rounded-t-2xl p-0"
        >
          {/* `pr-12` leaves the corner to SheetContent's own X. Sheets here never
              dismiss on an outside tap, so Cancel below is the required explicit
              exit rather than a nicety. */}
          <div className="border-b border-border px-5 py-3 pr-12">
            <SheetTitle className="text-base">Mobile tour</SheetTitle>
            <SheetDescription className="mt-1 text-xs">
              You've already got {progress.doneCount} of {progress.total} ticked
              off. How do you want to run it?
            </SheetDescription>
          </div>

          <div className="flex flex-col gap-2 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <Button
              type="button"
              onClick={() => start("replay")}
              className="min-h-14 w-full justify-start gap-3 text-left"
            >
              <ListChecks className="h-5 w-5 shrink-0" aria-hidden />
              <span className="min-w-0">
                <span className="block text-sm font-medium">Replay</span>
                <span className="block text-xs font-normal opacity-80">
                  Keep my ticks, show the screens again
                </span>
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => start("fresh")}
              className="min-h-14 w-full justify-start gap-3 text-left"
            >
              <RotateCcw className="h-5 w-5 shrink-0" aria-hidden />
              <span className="min-w-0">
                <span className="block text-sm font-medium">Start fresh</span>
                {/* Names the consequence before the tap, not after. */}
                <span className="block text-xs font-normal text-muted-foreground">
                  Clear all {progress.total} ticks and begin again
                </span>
              </span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="min-h-11 w-full text-muted-foreground"
            >
              Cancel
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <MobileTourFlow
      open={open && phase === "flow"}
      onOpenChange={onOpenChange}
      mode={mode}
      // A relaunch from the menu always means "show me the screens", so the
      // welcome stage is forced rather than auto-skipped for a returning user.
      startAt="welcome"
    />
  );
}
