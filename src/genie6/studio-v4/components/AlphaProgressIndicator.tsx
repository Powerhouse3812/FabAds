import { Fragment } from "react";
import { cn } from "@/lib/utils";

export type AlphaStep = 1 | 2 | 3 | 4;

interface AlphaProgressIndicatorProps {
  step: AlphaStep;
  /**
   * NEW (2026-09-08) — the ordered sequence of steps to actually render for
   * THIS run, straight from `resolveGenerationStepsForState(state)
   * .visibleSteps` (owned by `state/useWizard.ts`). A step a target/source
   * combo doesn't need (e.g. Approach for a Concept→Script hand-off, which
   * already carries both angle and concept) must never render here.
   *
   * Defaults to all four — every existing Ad caller resolves
   * `visibleSteps: [1, 2, 3, 4]` from the contract anyway, so an Ad run's
   * breadcrumb is byte-for-byte unchanged whether or not the caller passes
   * this prop explicitly.
   */
  visibleSteps?: AlphaStep[];
  /** Optional. When provided, done steps become clickable. */
  onJumpTo?: (step: AlphaStep) => void;
}

// §21.2: Mode + Format merged onto one screen (was "Format" alone) — the
// label says so, and it's why Mode is no longer a Home-only, invisible
// "step zero": it's right here, in the breadcrumb, changeable via Back.
const STEP_LABEL: Record<AlphaStep, string> = {
  1: "Mode & Format",
  2: "Product",
  3: "Approach",
  4: "Configure",
};

const ALL_STEPS: AlphaStep[] = [1, 2, 3, 4];

/**
 * AlphaProgressIndicator (A-12.28) — breadcrumb chevron pattern.
 * Past steps muted + clickable, current bold with lime dot prefix,
 * future steps faint. Reads instantly without numbered circles.
 *
 * §5/§7 asset-generation update (2026-09-08) — renders exactly
 * `visibleSteps`, in wizard order, so a flow that skips a step (Approach,
 * for a hand-off that already carries angle+concept) shows e.g.
 * "Mode & Format › Product › Configure" — never a phantom step that isn't
 * part of this run. "Done" / "current" state is computed off POSITION
 * within `visibleSteps`, not the raw step number, so numbering stays
 * truthful for a shorter run (a 3-step flow reads as 1-of-3 / 2-of-3 /
 * 3-of-3 internally, never implying a 4th step that was never shown).
 */
export function AlphaProgressIndicator({
  step,
  visibleSteps = ALL_STEPS,
  onJumpTo,
}: AlphaProgressIndicatorProps) {
  const currentIndex = visibleSteps.indexOf(step);

  return (
    <nav
      aria-label="Wizard progress"
      className="flex items-center gap-1.5 overflow-hidden text-[12px]"
    >
      {visibleSteps.map((num, i) => {
        const isDone = currentIndex !== -1 && i < currentIndex;
        const isCurrent = i === currentIndex;
        const canJump = isDone && onJumpTo !== undefined;
        return (
          <Fragment key={num}>
            {i > 0 && (
              <span aria-hidden className="font-mono text-[11px] text-muted-foreground/40">
                ›
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              {isCurrent && (
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(74_81%_59%/0.6)]"
                />
              )}
              {canJump ? (
                <button
                  type="button"
                  onClick={() => onJumpTo!(num)}
                  className="font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {STEP_LABEL[num]}
                </button>
              ) : (
                <span
                  className={cn(
                    "font-medium",
                    isCurrent
                      ? "font-bold text-foreground"
                      : isDone
                        ? "text-muted-foreground"
                        : "text-muted-foreground/40",
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {STEP_LABEL[num]}
                </span>
              )}
            </span>
          </Fragment>
        );
      })}
    </nav>
  );
}
