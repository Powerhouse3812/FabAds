import { useState } from "react";
import { ArrowRight, Check, Smartphone, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import MobileTourFlow from "@/mobile-tour/MobileTourFlow";
import { TOUR_CHECKLIST } from "@/mobile-tour/tourContent";
import {
  setMobileTourCardDismissed,
  useMobileTourProgress,
} from "@/mobile-tour/useMobileTourProgress";

/**
 * MobileTourChecklistCard — the checklist's home on the mobile landing screen.
 *
 * WHY THE CHECKLIST NEEDS A CARD AND NOT JUST A MENU ENTRY
 * A checklist buried behind More → Mobile tour is a checklist nobody finishes:
 * out of sight, it stops existing. A card on the landing screen keeps the
 * remaining work visible (NN/g #1, visibility of system status) and turns
 * "1 of 4 done" into the cheap progress cue that gets the other three done
 * (Zeigarnik / endowed progress). It is one tap from the thing it asks for.
 *
 * SELF-CONTAINED BY DESIGN
 * It owns its own overlay state and renders `MobileTourFlow` itself, so mounting
 * it is a single self-closing tag with no props and no wiring:
 *
 *   import { MobileTourChecklistCard } from "@/mobile-tour";
 *   <MobileTourChecklistCard />
 *
 * It disappears on its own when it should: on desktop, once dismissed, and —
 * if `hideWhenComplete` is set — once all four are ticked.
 */

export interface MobileTourChecklistCardProps {
  className?: string;
  /**
   * Render regardless of viewport. Default `false`: the card describes the phone
   * shell (bottom tabs, More menu), so on a desktop dashboard it is noise.
   */
  ignoreViewport?: boolean;
  /**
   * `true` removes the card the moment the fourth item is ticked. Default
   * `false` — the completed state is the payoff, and it carries its own Hide
   * button so the user chooses when it goes.
   */
  hideWhenComplete?: boolean;
}

export function MobileTourChecklistCard({
  className,
  ignoreViewport = false,
  hideWhenComplete = false,
}: MobileTourChecklistCardProps) {
  const isMobile = useIsMobile();
  const progress = useMobileTourProgress();
  const [tourOpen, setTourOpen] = useState(false);

  const hidden =
    (!ignoreViewport && !isMobile) ||
    progress.cardDismissed ||
    (hideWhenComplete && progress.allDone);

  if (hidden) return null;

  // First step that is not ticked. `opened` still counts as outstanding — the
  // user went and looked but never confirmed, which is exactly what to nudge.
  const nextStep = TOUR_CHECKLIST.find(
    (item) => progress.statuses[item.id] !== "done",
  );

  return (
    <>
      <section
        aria-labelledby="mobile-tour-card-title"
        className={cn(
          "relative rounded-2xl border border-border bg-card p-4",
          className,
        )}
      >
        {/* Dismiss is a preference, not a reset: ticks survive, and the More
            menu can bring the flow back at any time. 44px hit area, offset with
            a negative margin so the visual sits tight to the corner. */}
        <button
          type="button"
          onClick={() => setMobileTourCardDismissed(true)}
          aria-label="Hide the getting-started card"
          className={cn(
            "absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full",
            "text-muted-foreground transition-colors active:bg-muted",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <div className="flex items-center gap-2 pr-12">
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              progress.allDone ? "bg-primary text-primary-foreground" : "bg-primary/10",
            )}
            aria-hidden
          >
            {progress.allDone ? (
              <Check className="h-4 w-4" strokeWidth={3} />
            ) : (
              <Smartphone className="h-4 w-4 text-primary" />
            )}
          </span>
          <h2
            id="mobile-tour-card-title"
            className="min-w-0 text-sm font-semibold text-foreground"
          >
            {progress.allDone ? "You're set up on mobile" : "Get set up on mobile"}
          </h2>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <Progress
            value={progress.percent}
            className="h-2 flex-1"
            aria-label="Getting started progress"
          />
          {/* The count is text, not just a bar: a bar alone is a shape, and the
              exact "1 of 4" is what makes the remaining work feel finishable. */}
          <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
            {progress.doneCount} of {progress.total} done
          </span>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {progress.allDone
            ? "All four done. Open it again any time to walk someone else through it."
            : nextStep
              ? `Next up: ${nextStep.title.toLowerCase()}. Takes about a minute.`
              : "Four quick things to try on your phone."}
        </p>

        <Button
          type="button"
          onClick={() => setTourOpen(true)}
          variant={progress.allDone ? "outline" : "default"}
          size="sm"
          className="mt-3 min-h-11 w-full justify-between"
        >
          <span>
            {progress.allDone
              ? "Review the tour"
              : progress.started
                ? "Continue"
                : "Start the tour"}
          </span>
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
        </Button>
      </section>

      {/* `startAt="auto"` — the welcome screens for a first-timer, straight to
          the four steps for anyone who has already read them. Never `fresh`:
          this card must not be able to erase progress. */}
      <MobileTourFlow
        open={tourOpen}
        onOpenChange={setTourOpen}
        mode="replay"
        startAt="auto"
      />
    </>
  );
}

export default MobileTourChecklistCard;
