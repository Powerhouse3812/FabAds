import { ArrowUpRight, Check, Monitor, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  TOUR_CHECKLIST,
  isTourTargetReachable,
} from "@/mobile-tour/tourContent";
import {
  markMobileTourStepOpened,
  resetMobileTour,
  toggleMobileTourStepDone,
  useMobileTourProgress,
  type MobileTourStepId,
} from "@/mobile-tour/useMobileTourProgress";

/**
 * MobileTourChecklist — the four getting-started steps of Flow B.
 *
 * WHY A CHECKLIST AND NOT MORE SLIDES
 * Slides tell; a checklist makes the user do the thing once, in the real
 * surface, with their real data. Each step deep-links into the product rather
 * than simulating it, so the "aha" happens where the value actually lives — and
 * so nothing here can drift out of sync with a screen that got redesigned.
 *
 * TICKING IS MANUAL. `done` is only ever set by the user tapping the circle.
 * See the header of `useMobileTourProgress.ts` for why completion is not
 * auto-detected (short version: the only cheap signal is "count > 0", which is
 * already true for existing users and would tick steps nobody performed). What
 * IS automatic is `opened` — tapping the deep link is an observable fact — and
 * the UI says exactly that: "Opened — tick it when you're done."
 *
 * `to` is not a <Link>: the parent must close the sheet before the route
 * changes, otherwise the user lands on the destination with a full-screen
 * overlay still covering it. Hence `onNavigate`.
 */

export interface MobileTourChecklistProps {
  /** Close the overlay, then navigate. Invoked with the step's deep link. */
  onNavigate: (to: string) => void;
  /** Re-run the three welcome screens without losing tick state. */
  onReplayWelcome: () => void;
  /** Rendered as the footer's primary dismiss. */
  onClose: () => void;
}

export default function MobileTourChecklist({
  onNavigate,
  onReplayWelcome,
  onClose,
}: MobileTourChecklistProps) {
  const progress = useMobileTourProgress();

  const handleOpen = (id: MobileTourStepId, to: string) => {
    // Order matters: record the tap before the route change unmounts us.
    markMobileTourStepOpened(id);
    onNavigate(to);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
        {/* ── progress header ───────────────────────────────────────────── */}
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Getting started
        </p>
        <h2 className="mt-2 text-2xl font-semibold leading-tight text-foreground">
          {progress.allDone
            ? "That's all four. You're set."
            : "Four things worth doing once"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {progress.allDone
            ? "Nothing left here. Reset it any time if you want to walk a teammate through the same four."
            : "Each one takes under a minute and happens in the real screen, not a demo. Tick them off as you go — we'll remember."}
        </p>

        <div className="mt-4 flex items-center gap-3">
          <Progress
            value={progress.percent}
            className="h-2 flex-1"
            aria-label="Getting started progress"
          />
          <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
            {progress.doneCount} of {progress.total} done
          </span>
        </div>

        {/* ── the steps ─────────────────────────────────────────────────── */}
        <ul className="mt-5 space-y-3">
          {TOUR_CHECKLIST.map((item, i) => {
            const status = progress.statuses[item.id];
            const isDone = status === "done";
            const reachable = isTourTargetReachable(item.to);
            const Icon = item.icon;
            // Hoisted out of the JSX: narrowing on `item.alt` would be discarded
            // inside the onClick closure, and a `!` assertion is not allowed here.
            const alt = item.alt;

            return (
              <li
                key={item.id}
                className={cn(
                  "rounded-xl border p-3 transition-colors",
                  isDone
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-card",
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Tick target: 44px square, hit area larger than the 24px
                      circle it draws. aria-pressed carries the state, so the
                      tick is never communicated by colour alone (WCAG 1.4.1). */}
                  <button
                    type="button"
                    onClick={() => toggleMobileTourStepDone(item.id)}
                    aria-pressed={isDone}
                    aria-label={
                      isDone
                        ? `Mark "${item.title}" as not done`
                        : `Mark "${item.title}" as done`
                    }
                    className={cn(
                      "-m-2.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      "active:bg-muted/60",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
                        isDone
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-transparent",
                      )}
                      aria-hidden
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isDone ? "text-primary" : "text-muted-foreground",
                        )}
                        aria-hidden
                      />
                      <h3
                        className={cn(
                          "text-sm font-medium text-foreground",
                          isDone && "line-through decoration-primary/50",
                        )}
                      >
                        {/* Numbered so the list reads as a sequence, not a menu. */}
                        {i + 1}. {item.title}
                      </h3>
                    </div>

                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>

                    {/* Only shown between "tapped the link" and "ticked it" —
                        an explicit nudge, and an honest one: we know they went,
                        we don't know they finished. */}
                    {status === "opened" && (
                      <p className="mt-1.5 text-xs font-medium text-primary">
                        Opened — tick it when you're done.
                      </p>
                    )}

                    {reachable ? (
                      <div className="mt-2 flex flex-col gap-1">
                        <Button
                          type="button"
                          variant={isDone ? "outline" : "secondary"}
                          size="sm"
                          onClick={() => handleOpen(item.id, item.to)}
                          className="min-h-11 w-full justify-between"
                        >
                          <span>{isDone ? "Open again" : item.cta}</span>
                          <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
                        </Button>
                        {alt && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpen(item.id, alt.to)}
                            className="min-h-11 w-full text-xs text-muted-foreground"
                          >
                            {alt.label}
                          </Button>
                        )}
                      </div>
                    ) : (
                      /* Defensive, not decorative: if the route policy ever
                         blocks this target, the step must say so rather than
                         drop the user on the gate screen. */
                      <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                        <Monitor className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                        This one moved to desktop-only — do it on a laptop, then
                        tick it here.
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-5 flex flex-col gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReplayWelcome}
            className="min-h-11 w-full text-xs text-muted-foreground"
          >
            Read the three intro screens again
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetMobileTour}
            className="min-h-11 w-full text-xs text-muted-foreground"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            {/* Says only what it does: ticks go back to zero, the list stays
                open. The full "Start fresh" branch lives in the launch prompt. */}
            Clear all four ticks
          </Button>
        </div>
      </div>

      {/* In flow, not fixed — same reasoning as the welcome footer. This is the
          thumb-reachable twin of the sheet's top-right X, which is far from a
          thumb on a tall phone. */}
      <div className="shrink-0 border-t border-border bg-background px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <Button type="button" onClick={onClose} className="min-h-11 w-full">
          {progress.allDone ? "Done" : "I'll finish these later"}
        </Button>
      </div>
    </div>
  );
}
