import { cn } from "@/lib/utils";

export interface MobileStepDotsProps {
  /** 1-based index of the current step. */
  index: number;
  /** Total steps in the current branch. */
  count: number;
  /** Human label for the current step, e.g. "Country". */
  label?: string;
}

/**
 * Step indicator for the mobile onboarding flow.
 *
 * Dots + an explicit "Step 2 of 5 · Country" readout. The text half is not
 * decoration: dots alone fail NN/g #1 (visibility of system status) for
 * anyone who can't count 5 small circles at a glance, and they are also the
 * only part a screen reader can use — hence `role="status"` on the wrapper
 * and `aria-hidden` on the dots themselves.
 *
 * Colour is never the only signal: completed and current dots differ in
 * WIDTH as well as fill, so this reads correctly for colour-blind users and
 * in both light and dark themes.
 */
export function MobileStepDots({ index, count, label }: MobileStepDotsProps) {
  return (
    <div role="status" className="flex items-center gap-2.5">
      <div className="flex items-center gap-1" aria-hidden>
        {Array.from({ length: count }, (_, i) => {
          const step = i + 1;
          const done = step < index;
          const current = step === index;
          return (
            <span
              key={step}
              className={cn(
                "h-1.5 rounded-full transition-all",
                current && "w-5 bg-primary",
                done && "w-1.5 bg-primary/60",
                !current && !done && "w-1.5 bg-border",
              )}
            />
          );
        })}
      </div>
      <span className="min-w-0 truncate font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        Step {index} of {count}
        {label ? ` · ${label}` : ""}
      </span>
    </div>
  );
}
