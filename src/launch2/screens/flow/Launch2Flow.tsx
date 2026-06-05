/**
 * Launch2Flow — the 5-step guided launch flow orchestrator.
 *
 * Owns nothing itself: it composes the frozen contract. useLaunch2Flow holds
 * the wizard state (plan + step + autosave); flowDerive validates each step;
 * the service submits. Renders CONTENT ONLY inside the FabAds shell — a
 * centered wizard container with a step header, the active step body, and a
 * sticky footer (Back / Next, or Launch on step 5) plus an Autosaved cue.
 *
 * Gating: Next is disabled until validateStep(plan, step) passes. On step 5 the
 * Launch button additionally blocks on any earlier-step gap (the 250-cap hard
 * block is itself step-5 validation).
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLaunch2Flow, type FlowStep } from "../../state/useLaunch2Flow";
import { useLaunch2 } from "../../state/Launch2Context";
import { estimateRequested, validateStep } from "../../state/flowDerive";
import { getStrategy } from "../../data/strategies";
import type { LaunchMode, StrategyId } from "../../types";
import { FlowHeader } from "./FlowHeader";
import { FlowFooter } from "./FlowFooter";
import { Step1Strategy } from "./Step1Strategy";
import { Step2Distribution } from "./Step2Distribution";
import { Step3Targeting } from "./Step3Targeting";
import { Step4Creative } from "./Step4Creative";
import { Step5Review } from "./Step5Review";

export default function Launch2Flow() {
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get("draft") ?? undefined;
  const flow = useLaunch2Flow(draftId);
  const service = useLaunch2();
  const navigate = useNavigate();

  const [launching, setLaunching] = useState(false);

  // Honor Home's deep-links: /launch2/new?strategy=bruno&mode=quick. Apply once,
  // and never when resuming a draft (the draft owns its own selections).
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current || draftId) return;
    seededRef.current = true;
    const mode = searchParams.get("mode");
    if (mode === "quick" || mode === "preset" || mode === "custom") {
      flow.setMode(mode as LaunchMode);
    }
    const strategy = searchParams.get("strategy");
    if (strategy && getStrategy(strategy)) {
      flow.chooseStrategy(strategy as StrategyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId]);

  const { plan, step } = flow;

  // Current step valid? — drives Next / inline errors.
  const stepValid = validateStep(plan, step).ok;

  // Step 5 Launch additionally requires every earlier step to be complete.
  const allValid = ([1, 2, 3, 4, 5] as FlowStep[]).every((s) => validateStep(plan, s).ok);

  /** Jump to a step — only backward or to the current step (don't skip ahead). */
  function jumpTo(s: FlowStep) {
    if (s <= step) flow.setStep(s);
  }

  function handleLaunch() {
    if (launching || !allValid) return;
    setLaunching(true);
    // Service is synchronous (returns the run immediately, then streams progress).
    const run = service.launch(plan);
    navigate(`/launch2/${run.id}`);
  }

  const requested = estimateRequested(plan);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="mx-auto flex max-w-4xl flex-col gap-5 pb-2">
        <FlowHeader step={step} planName={plan.name} onJump={jumpTo} />

        <div>
          {step === 1 && <Step1Strategy flow={flow} />}
          {step === 2 && <Step2Distribution flow={flow} />}
          {step === 3 && <Step3Targeting flow={flow} />}
          {step === 4 && <Step4Creative flow={flow} />}
          {step === 5 && <Step5Review flow={flow} onJump={jumpTo} />}
        </div>

        <FlowFooter
          step={step}
          canAdvance={step === 5 ? allValid : stepValid}
          onBack={flow.back}
          onNext={flow.next}
          onLaunch={handleLaunch}
          launching={launching}
          launchLabel={`Launch ${requested} ad${requested === 1 ? "" : "s"}`}
        />
      </div>
    </TooltipProvider>
  );
}
