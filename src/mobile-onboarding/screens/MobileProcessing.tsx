import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileFlowShell } from "../components/MobileFlowShell";
import { PROCESSING_STAGES } from "../data";
import type { MobileGenieMode } from "../types";

export interface MobileProcessingProps {
  onClose: () => void;
  onBack: () => void;
  onDone: () => void;
  mode: MobileGenieMode;
  stepIndex: number;
  stepCount: number;
}

const STAGE_DURATION_MS = 1100;
const FINAL_DELAY_MS = 600;

/**
 * Genie step 4 — Processing. Stage copy + timings lifted from
 * `src/onboarding-demo/steps/Processing.tsx`.
 *
 * Nothing is actually computed — the stages are a scripted animation, same as
 * web. It auto-advances to Done.
 *
 * The footer primary stays visible but disabled and reads "Setting up…"
 * rather than disappearing: a footer that vanishes for one screen makes the
 * layout jump, and a disabled-with-reason control is clearer than an absent
 * one. Back and ✕ both stay live, so a user who mis-typed their URL is not
 * held hostage by the animation.
 */
export function MobileProcessing({
  onClose,
  onBack,
  onDone,
  mode,
  stepIndex,
  stepCount,
}: MobileProcessingProps) {
  const stages = PROCESSING_STAGES[mode];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (current >= stages.length) {
      const t = setTimeout(onDone, FINAL_DELAY_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCurrent((c) => c + 1), STAGE_DURATION_MS);
    return () => clearTimeout(t);
  }, [current, stages.length, onDone]);

  return (
    <MobileFlowShell
      eyebrow="Genie setup"
      stepIndex={stepIndex}
      stepCount={stepCount}
      stepLabel="Setting up"
      title={
        <>
          Setting up your{" "}
          <span className="rounded bg-primary/30 px-1.5">workspace…</span>
        </>
      }
      subtitle="This usually takes 10–20 seconds."
      onBack={onBack}
      onClose={onClose}
      primaryLabel="Setting up…"
      primaryDisabled
      hidePrimaryArrow
      onPrimary={() => {
        /* no-op — the screen advances itself */
      }}
    >
      <div className="flex justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
      </div>

      <ul
        className="mt-6 flex list-none flex-col gap-3.5 rounded-2xl border border-border bg-card px-4 py-4"
        aria-live="polite"
      >
        {stages.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className="flex items-center gap-3">
              <span
                className={cn(
                  "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary bg-primary/15",
                  !done && !active && "border-border bg-background",
                )}
                aria-hidden
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" />
                ) : active ? (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                ) : null}
              </span>
              <span
                className={cn(
                  "text-[13.5px] transition-colors",
                  done && "text-foreground",
                  active && "font-semibold text-foreground",
                  !done && !active && "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ul>
    </MobileFlowShell>
  );
}
