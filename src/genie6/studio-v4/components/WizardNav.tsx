import { ChevronLeft, RotateCw, Save, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardNavProps {
  step: 1 | 2 | 3 | 4 | 5;
  ctaLayout: "inline" | "footer";
  count: number;
  credits: number;
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
  /** Step 5 actions — wired by Step5Results so the footer can drive
   *  the same actions that used to live in the body. */
  onGenerateAgain?: () => void;
  onSaveBatch?: () => void;
  onStartOver?: () => void;
  /** Step 5 only — disables the action buttons until generation is done. */
  resultsReady?: boolean;
}

export function WizardNav({
  step,
  ctaLayout,
  count,
  credits,
  canContinue,
  onBack,
  onContinue,
  onGenerateAgain,
  onSaveBatch,
  onStartOver,
  resultsReady,
}: WizardNavProps) {
  // Variant A's Step 4 hides the WizardNav (Step4TopBar replaces it +
  // PromptReferenceBar's inline Send fires Generate). Step 5 keeps the
  // footer for action consistency.
  if (step === 4 && ctaLayout === "inline") return null;

  const isGenerate = step === 4;
  const isResults = step === 5;
  const showBack = step > 1 && !isResults;

  // Total outputs = credits (since credits = max(concepts, 1) * count, 1 credit = 1 output)
  // concepts = credits / count (with safety guard)
  const totalOutputs = credits;
  const variations = count;
  const conceptCount = Math.max(
    1,
    Math.round(totalOutputs / Math.max(variations, 1)),
  );

  // Step 5 — Results footer with batch actions
  if (isResults) {
    const ready = resultsReady ?? false;
    return (
      <div className="sticky bottom-0 z-10 flex items-center justify-between border-t border-border bg-background/90 px-6 py-4 backdrop-blur">
        <button
          type="button"
          onClick={onStartOver}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Start over
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onGenerateAgain}
            disabled={!ready}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-5 py-2 text-sm font-medium transition-colors",
              ready ? "hover:border-primary/40" : "cursor-not-allowed opacity-50",
            )}
          >
            <RotateCw className="h-4 w-4" />
            Generate again
          </button>
          <button
            type="button"
            onClick={onSaveBatch}
            disabled={!ready}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition-transform",
              ready ? "hover:scale-[1.02]" : "cursor-not-allowed opacity-50",
            )}
          >
            <Save className="h-4 w-4" />
            Save batch
          </button>
        </div>
      </div>
    );
  }

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
              {conceptCount === 1
                ? `· ${variations}× · ${totalOutputs} cr`
                : `· ${conceptCount}×${variations} = ${totalOutputs} · ${totalOutputs} cr`}
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
