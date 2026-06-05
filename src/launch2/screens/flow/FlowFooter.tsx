/**
 * FlowFooter — sticky-ish wizard footer: Back / Next (or Launch on step 5) plus
 * an "Autosaved" indicator. Next is disabled when the current step is invalid;
 * the step bodies render the matching inline errors themselves.
 */
import { ArrowLeft, ArrowRight, Check, Loader2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FlowStep } from "../../state/useLaunch2Flow";

export function FlowFooter({
  step,
  canAdvance,
  onBack,
  onNext,
  onLaunch,
  launching,
  launchLabel,
  className,
}: {
  step: FlowStep;
  /** Step 1-4: Next enabled? · Step 5: Launch enabled? (cap not breached, fields ok) */
  canAdvance: boolean;
  onBack: () => void;
  onNext: () => void;
  onLaunch: () => void;
  launching?: boolean;
  /** e.g. "Launch 50 ads" */
  launchLabel: string;
  className?: string;
}) {
  const isReview = step === 5;
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 -mx-4 mt-2 flex items-center gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        className,
      )}
    >
      <Button
        variant="outline"
        onClick={onBack}
        disabled={step === 1 || launching}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <span className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
        <Check className="h-3.5 w-3.5" style={{ color: "#52c41a" }} />
        Autosaved
      </span>

      <div className="ml-auto">
        {isReview ? (
          <Button onClick={onLaunch} disabled={!canAdvance || launching}>
            {launching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="h-4 w-4" />
            )}
            {launching ? "Launching…" : launchLabel}
          </Button>
        ) : (
          <Button onClick={onNext} disabled={!canAdvance}>
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
