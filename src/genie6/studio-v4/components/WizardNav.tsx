import { ChevronLeft, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardNavProps {
  step: 1 | 2 | 3 | 4 | 5;
  ctaLayout: "inline" | "footer";
  count: number;
  credits: number;
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
}

export function WizardNav({
  step,
  ctaLayout,
  count,
  credits,
  canContinue,
  onBack,
  onContinue,
}: WizardNavProps) {
  if (step === 5) return null;
  if (step === 4 && ctaLayout === "inline") return null;

  const isGenerate = step === 4;
  const showBack = step > 1;

  return (
    <div className="sticky bottom-0 z-10 flex items-center justify-between border-t border-border bg-background/90 px-6 py-4 backdrop-blur">
      <div>
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        ) : (
          <span />
        )}
      </div>
      <button
        type="button"
        disabled={!canContinue}
        onClick={onContinue}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-6 py-2.5 text-sm font-bold transition-all",
          canContinue
            ? "bg-primary text-primary-foreground hover:scale-[1.02] hover:bg-primary/95"
            : "cursor-not-allowed bg-muted text-muted-foreground",
        )}
      >
        {isGenerate ? (
          <>
            <Sparkles className="h-4 w-4" />
            <span>Generate</span>
            <span className="font-mono text-[11px] opacity-80">
              · {count}× · {credits} cr
            </span>
          </>
        ) : (
          <>
            Continue
            <span aria-hidden>{"→"}</span>
          </>
        )}
      </button>
    </div>
  );
}
