import { ArrowLeft, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const ONB_STEPS = ["Choose Mode", "Input", "Processing", "Done"] as const;

interface StepNavProps {
  active: number; // 0-3
  onBack?: () => void;
  backLabel?: string;
  onRestart?: () => void;
}

/**
 * Modern stepper — Vercel / Linear / Arc inspired.
 *
 * Two parts:
 *   1. Fixed thin progress bar at the top edge of the viewport — fills with
 *      lime as the user advances. Reads as ambient progress without
 *      dominating the page.
 *   2. Floating "STEP 02 / 04 · INPUT" mono chip in the top-right —
 *      gives precise step context for power users.
 *
 * Back / Start-over actions sit in the top-left as plain text links.
 *
 * Replaces the older circles + connecting bars stepper after Maalik
 * asked for something "more trendy and modern."
 */
export function StepNav({ active, onBack, backLabel, onRestart }: StepNavProps) {
  const progress = ((active + 1) / ONB_STEPS.length) * 100;
  const currentLabel = ONB_STEPS[active];

  return (
    <>
      {/* Top-edge progress bar — fixed, 3px, lime fill */}
      <div className="fixed top-0 inset-x-0 h-[3px] bg-border/60 z-50">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Top bar — Back link (left) + step chip (right) */}
      <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-2">
        <div className="flex-1 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {backLabel ?? "Back"}
            </button>
          )}
        </div>

        {/* Center: step chip */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 backdrop-blur px-3 py-1.5 text-[11px] font-mono shrink-0">
          <span className="text-muted-foreground uppercase tracking-wider">
            Step
          </span>
          <span className="text-foreground font-semibold tabular-nums">
            {String(active + 1).padStart(2, "0")}
          </span>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-muted-foreground tabular-nums">
            {String(ONB_STEPS.length).padStart(2, "0")}
          </span>
          <span
            className={cn(
              "h-1 w-1 rounded-full bg-muted-foreground/40 mx-0.5",
            )}
            aria-hidden
          />
          <span className="text-foreground font-semibold uppercase tracking-wider">
            {currentLabel}
          </span>
        </div>

        <div className="flex-1 min-w-0 flex justify-end">
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
      </div>
    </>
  );
}
