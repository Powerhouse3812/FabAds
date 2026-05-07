import { Fragment } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  step: 1 | 2 | 3 | 4 | 5;
  ctaLayout: "inline" | "footer";
  /**
   * Optional. When provided, **done** steps become clickable and call this
   * with the target step number. Forward jumps are NEVER allowed (guardrail).
   * StudioV4 should pass `wizard.goTo` here.
   */
  onJumpTo?: (step: 1 | 2 | 3 | 4 | 5) => void;
}

const STEPS: { num: 1 | 2 | 3 | 4 | 5; label: string }[] = [
  { num: 1, label: "Setup" },
  { num: 2, label: "Product" },
  { num: 3, label: "Approach" },
  { num: 4, label: "Configure" },
  { num: 5, label: "Output" },
];

/**
 * ProgressIndicator (A-12.4 redesign) — Stripe-faithful numbered-circle
 * stepper with connecting lines. 5 nodes total. Done steps are clickable
 * (back-nav guardrail), future steps are not.
 *
 * Hide rules unchanged:
 *   - step === 5
 *   - step === 4 && ctaLayout === "inline" (Step4TopBar replaces it in Variant A)
 */
export function ProgressIndicator({
  step,
  ctaLayout,
  onJumpTo,
}: ProgressIndicatorProps) {
  if (step === 5) return null;
  if (step === 4 && ctaLayout === "inline") return null;

  return (
    <div className="sticky top-0 z-10 flex justify-center border-b border-border bg-background/80 px-6 py-2 backdrop-blur">
      <div className="flex w-full max-w-3xl items-start">
        {STEPS.map((s, i) => {
          const isDone = step > s.num;
          const isCurrent = step === s.num;
          const isFuture = step < s.num;
          const canJump = isDone && onJumpTo !== undefined;

          // Connecting line color — the line BEFORE this node (between i-1 and i)
          const lineFilled = step > i; // line i is filled if user has passed step (i)

          return (
            <Fragment key={s.num}>
              {/* Connecting line BEFORE this node (skip before first) */}
              {i > 0 && (
                <span
                  className={cn(
                    "mx-1 mt-3 h-px flex-1",
                    lineFilled ? "bg-primary/40" : "bg-border",
                  )}
                />
              )}

              {/* Node — circle + label */}
              <div className="flex shrink-0 flex-col items-center gap-1">
                {canJump ? (
                  <button
                    type="button"
                    onClick={() => onJumpTo!(s.num)}
                    title={`Go back to ${s.label}`}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary transition-colors hover:bg-primary/25 cursor-pointer"
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </button>
                ) : isDone ? (
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                ) : isCurrent ? (
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-primary/30">
                    <span className="font-mono text-[11px] font-bold">{s.num}</span>
                  </span>
                ) : (
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border text-muted-foreground">
                    <span className="font-mono text-[10px] font-medium">{s.num}</span>
                  </span>
                )}
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-wider",
                    isCurrent && "font-bold text-foreground",
                    isDone && "font-medium text-foreground",
                    isFuture && "font-medium text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
