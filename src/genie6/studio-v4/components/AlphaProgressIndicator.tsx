import { Fragment } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlphaStep = 1 | 2 | 3 | 4;

interface AlphaProgressIndicatorProps {
  step: AlphaStep;
  /** Optional. When provided, done steps become clickable. */
  onJumpTo?: (step: AlphaStep) => void;
}

const STEPS: { num: AlphaStep; label: string }[] = [
  { num: 1, label: "Format" },
  { num: 2, label: "Product" },
  { num: 3, label: "Approach" },
  { num: 4, label: "Configure" },
];

/**
 * AlphaProgressIndicator (A-12.8) — 4-step stepper for Studio Alpha's
 * wizard (Product / Approach / Configure / Output). Mode + format are
 * picked on Home before the wizard begins, so they don't take a step.
 *
 * Same Stripe-faithful numbered-circle pattern as Beta's
 * ProgressIndicator. Done steps clickable; future not.
 */
export function AlphaProgressIndicator({
  step,
  onJumpTo,
}: AlphaProgressIndicatorProps) {
  return (
    <div className="flex justify-center">
      <div className="flex w-full max-w-2xl items-start">
        {STEPS.map((s, i) => {
          const isDone = step > s.num;
          const isCurrent = step === s.num;
          const isFuture = step < s.num;
          const canJump = isDone && onJumpTo !== undefined;
          const lineFilled = step > i;

          return (
            <Fragment key={s.num}>
              {i > 0 && (
                <span
                  className={cn(
                    "mx-1 mt-3 h-px flex-1",
                    lineFilled ? "bg-foreground/25" : "bg-border",
                  )}
                />
              )}
              <div className="flex shrink-0 flex-col items-center gap-1">
                {canJump ? (
                  <button
                    type="button"
                    onClick={() => onJumpTo!(s.num)}
                    title={`Go back to ${s.label}`}
                    className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-primary/15 text-primary transition-colors hover:bg-primary/25"
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </button>
                ) : isDone ? (
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                ) : isCurrent ? (
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-foreground/90 text-background ring-2 ring-foreground/15">
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
