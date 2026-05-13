import { Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const ONB_STEPS = ["Choose Mode", "Input", "Processing", "Done"] as const;

interface StepNavProps {
  active: number; // 0-3
  onBack?: () => void;
  backLabel?: string;
  onRestart?: () => void;
}

/**
 * Top-of-page step indicator. Four dots + connecting bars. Shows ✓ for done
 * steps, lime fill for active, neutral for upcoming. Matches the wireframe's
 * 4-step structure but uses Fabfunnel tokens (Geist, lime accent, clean
 * borders) — no hand-drawn aesthetic.
 */
export function StepNav({ active, onBack, backLabel, onRestart }: StepNavProps) {
  return (
    <div className="w-full max-w-[880px] mx-auto pt-8 px-6">
      {(onBack || onRestart) && (
        <div className="mb-6 flex items-center justify-between">
          {onBack ? (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              ← {backLabel ?? "Back"}
            </button>
          ) : (
            <span />
          )}
          {onRestart && (
            <button
              onClick={onRestart}
              className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Start over
            </button>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-center gap-y-3">
        {ONB_STEPS.map((label, i) => {
          const isActive = i === active;
          const isDone = i < active;
          return (
            <div key={label} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-7 w-7 rounded-full inline-flex items-center justify-center text-[12px] font-semibold border-2 transition-all",
                    isDone &&
                      "bg-primary text-primary-foreground border-primary",
                    isActive &&
                      "bg-primary/15 text-foreground border-primary",
                    !isActive && !isDone &&
                      "bg-background text-muted-foreground border-border",
                  )}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-[13px] whitespace-nowrap transition-colors",
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
                    "h-px w-12 mx-3 transition-colors",
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
