import { Fragment } from "react";
import { cn } from "@/lib/utils";

export type AlphaStep = 1 | 2 | 3 | 4;

interface AlphaProgressIndicatorProps {
  step: AlphaStep;
  /** Optional. When provided, done steps become clickable. */
  onJumpTo?: (step: AlphaStep) => void;
}

const STEPS: { num: AlphaStep; label: string }[] = [
  // §21.2: Mode + Format merged onto one screen (was "Format" alone) — the
  // label says so, and it's why Mode is no longer a Home-only, invisible
  // "step zero": it's right here, in the breadcrumb, changeable via Back.
  { num: 1, label: "Mode & Format" },
  { num: 2, label: "Product" },
  { num: 3, label: "Approach" },
  { num: 4, label: "Configure" },
];

/**
 * AlphaProgressIndicator (A-12.28) — breadcrumb chevron pattern.
 * Past steps muted + clickable, current bold with lime dot prefix,
 * future steps faint. Reads instantly without numbered circles.
 */
export function AlphaProgressIndicator({ step, onJumpTo }: AlphaProgressIndicatorProps) {
  return (
    <nav
      aria-label="Wizard progress"
      className="flex items-center gap-1.5 overflow-hidden text-[12px]"
    >
      {STEPS.map((s, i) => {
        const isDone = step > s.num;
        const isCurrent = step === s.num;
        const canJump = isDone && onJumpTo !== undefined;
        return (
          <Fragment key={s.num}>
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
                  onClick={() => onJumpTo!(s.num)}
                  className="font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {s.label}
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
                  {s.label}
                </span>
              )}
            </span>
          </Fragment>
        );
      })}
    </nav>
  );
}
