import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Loader2, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLaunchFlow } from "@/launch2/store/launchFlowStore";
import { useLaunch2Overlay } from "@/launch2/shell/Launch2OverlayProvider";
import { computeBudget } from "@/launch2/lib/budget";
import { formatCurrency, relativeTime } from "@/launch2/lib/format";
import { EmptyState, StepNav } from "@/launch2/components";
import { Step2Distribution } from "@/launch2/flow/steps/Step2Distribution";
import { Step3Targeting } from "@/launch2/flow/steps/Step3Targeting";
import { Step4Creative } from "@/launch2/flow/steps/Step4Creative";
import { Step5Review } from "@/launch2/flow/steps/Step5Review";

/**
 * The guided-flow page at /launch2/new. Renders the active step (2–5) inside
 * a step-nav header + sticky footer (budget chip + Back/Continue). Step 5 owns
 * its own Launch CTA, so the shell renders no Continue there.
 */
export function FlowShell() {
  const { state, dispatch } = useLaunchFlow();
  const { open } = useLaunch2Overlay();
  const navigate = useNavigate();

  // Track the furthest step reached so the StepNav can gate forward jumps.
  const [maxReached, setMaxReached] = useState(state.currentStep);
  useEffect(() => {
    setMaxReached((prev) => Math.max(prev, state.currentStep));
  }, [state.currentStep]);

  // Zero-data: arrived at /launch2/new without starting a launch.
  if (state.mode === null) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16">
        <EmptyState
          icon={<Rocket className="h-5 w-5" />}
          title="Start a new launch"
          description="Choose a mode, strategy and objective to begin the guided flow. Your progress autosaves at every step."
          action={
            <button
              type="button"
              onClick={() => open()}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:bg-primary/90"
            >
              <Rocket className="h-4 w-4" />
              New Launch
            </button>
          }
        />
      </div>
    );
  }

  const budget = computeBudget(state);
  const isReview = state.currentStep === 5;

  const handleBack = () => {
    if (state.currentStep > 2) dispatch({ type: "SET_STEP", step: state.currentStep - 1 });
    else navigate("/launch2");
  };

  const handleContinue = () => {
    if (state.currentStep < 5) dispatch({ type: "SET_STEP", step: state.currentStep + 1 });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header — step nav + autosave indicator */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-3">
          <StepNav
            current={state.currentStep}
            maxReached={maxReached}
            onStep={(step) => dispatch({ type: "SET_STEP", step })}
          />
          <SaveIndicator lastSavedAt={state.lastSavedAt} />
        </div>
      </header>

      {/* Body — active step */}
      <div className="mx-auto w-full max-w-4xl px-6 py-6">
        {state.currentStep === 2 && <Step2Distribution />}
        {state.currentStep === 3 && <Step3Targeting />}
        {state.currentStep === 4 && <Step4Creative />}
        {state.currentStep === 5 && <Step5Review />}
      </div>

      {/* Footer — budget chip + nav */}
      <div className="sticky bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-3">
          <span className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs">
            <span className="font-g6-mono text-foreground">{budget.totalAds} ads</span>
            <span className="text-muted-foreground" aria-hidden>·</span>
            <span className="font-g6-mono text-foreground">
              {formatCurrency(budget.dailyTotal)}/day
            </span>
            <span className="text-muted-foreground">
              {budget.budgetLevel === "campaign" ? "CBO" : "ABO"}
            </span>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            {!isReview && (
              <button
                type="button"
                onClick={handleContinue}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:bg-primary/90"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Autosave indicator ───────────────────────── */

function SaveIndicator({ lastSavedAt }: { lastSavedAt: string | null }) {
  // Re-render every 30s so the relative time stays fresh.
  const [, force] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval>>();
  useEffect(() => {
    timer.current = setInterval(() => force((n) => n + 1), 30_000);
    return () => clearInterval(timer.current);
  }, []);

  if (!lastSavedAt) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Saving…
      </span>
    );
  }
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground")}>
      <Check className="h-3.5 w-3.5 text-[hsl(var(--success-text))]" />
      Saved {relativeTime(lastSavedAt)}
    </span>
  );
}
