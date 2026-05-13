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
 * Designed for use inside a 720px modal. Two parts:
 *   1. Sticky 3px progress bar pinned to the top of the modal's scroll
 *      container — fills with lime as the user advances. Reads as ambient
 *      progress without dominating the page.
 *   2. A row below with: Back link (left) · mono step chip
 *      "STEP 02 / 04 · INPUT" (center) · Start-over (right).
 *
 * Was previously fixed-positioned to viewport for the standalone full-page
 * route; now sticky inside the modal so it pins to the modal top, not the
 * window top.
 */
export function StepNav({ active, onBack, backLabel, onRestart }: StepNavProps) {
  const progress = ((active + 1) / ONB_STEPS.length) * 100;
  const currentLabel = ONB_STEPS[active];

  return (
    <>
      {/* Sticky progress bar at top of modal scroll container */}
      <div className="sticky top-0 inset-x-0 h-[3px] bg-border/60 z-20">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Action row — Back link / step chip / start over */}
      <div className="flex items-center justify-between gap-2 px-5 pt-5 pb-1">
        <div className="flex-1 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="truncate">{backLabel ?? "Back"}</span>
            </button>
          )}
        </div>

        {/* Center: step chip */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 backdrop-blur px-2.5 py-1 text-[10px] font-mono shrink-0">
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
              className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="truncate">Start over</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
