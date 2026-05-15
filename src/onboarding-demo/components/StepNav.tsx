import { Check, RotateCcw, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const ONB_STEPS = [
  "Choose Mode",
  "Country",
  "Input",
  "Processing",
  "Done",
] as const;

interface StepNavProps {
  active: number; // 0-4 (5 wizard steps; Welcome is pre-stepper at step -1)
  onBack?: () => void;
  backLabel?: string;
  onRestart?: () => void;
}

/**
 * 4-step circles + connecting bars indicator. Active step shows lime
 * fill, done steps show a check, upcoming steps are neutral.
 *
 * Reverted from the A-12.118 thin-progress-bar + mono-chip variant after
 * Maalik flagged it as "worst" — back to the explicit circles pattern
 * that signals "wizard, 4 steps, you are here" without ambiguity.
 *
 * Inside the 720px modal the labels can wrap on narrow widths; that's
 * acceptable since each row stays compact.
 */
export function StepNav({ active, onBack, backLabel, onRestart }: StepNavProps) {
  return (
    <div className="w-full px-5 pt-5 pb-2">
      {(onBack || onRestart) && (
        <div className="mb-4 flex items-center justify-between">
          {onBack ? (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {backLabel ?? "Back"}
            </button>
          ) : (
            <span />
          )}
          {onRestart && (
            <button
              onClick={onRestart}
              className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Start over
            </button>
          )}
        </div>
      )}
      <div className="flex items-center justify-center gap-y-2 flex-wrap">
        {ONB_STEPS.map((label, i) => {
          const isActive = i === active;
          const isDone = i < active;
          return (
            <div key={label} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-7 w-7 rounded-full inline-flex items-center justify-center text-[12px] font-semibold border-2 transition-all shrink-0",
                    isDone &&
                      "bg-primary text-primary-foreground border-primary",
                    isActive &&
                      "bg-primary/20 text-foreground border-primary",
                    !isActive && !isDone &&
                      "bg-background text-muted-foreground border-border",
                  )}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-[12px] whitespace-nowrap transition-colors",
                    isActive
                      ? "font-semibold text-foreground"
                      : isDone
                        ? "text-foreground"
                        : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </div>
              {i < ONB_STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-px w-6 mx-2 transition-colors shrink-0",
                    i < active ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
