/**
 * LaunchV2Flow — the 4-step orchestrator. Pattern A: Steps 1–3 are focused
 * centered screens; Step 4 (Review & Launch) is a full-height Meta two-pane.
 * Chrome: running-context chips + step progress + footer (Back/Next/Launch).
 * Step bodies are filled by build agents; this owns the shell + flow control.
 */
import { useSearchParams, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useFlowV2, type StepV2, type UseFlowV2 } from "../state/useFlowV2";
import { useLaunchV2 } from "../state/LaunchV2Context";
import { capCheck, estimateAds } from "../deriveV2";
import type { PlanV2 } from "../types";
import Step1Start from "./steps/Step1Start";
import Step2Setup from "./steps/Step2Setup";
import Step3Spread from "./steps/Step3Spread";
import Step4Review from "./steps/Step4Review";

const STEP_TITLES: Record<StepV2, string> = {
  1: "Start",
  2: "Setup",
  3: "Creative spread",
  4: "Review & Launch",
};

function stepValid(plan: PlanV2, step: StepV2): boolean {
  switch (step) {
    case 1:
      return !!plan.objective && !!plan.format;
    case 2:
      return plan.targets.length > 0 && plan.budgetAmount > 0;
    case 3:
      return plan.creatives.length > 0;
    case 4:
      return capCheck(plan).ok;
  }
}

export default function LaunchV2Flow() {
  const [sp] = useSearchParams();
  const flow = useFlowV2(sp.get("draft") ?? undefined);
  const service = useLaunchV2();
  const navigate = useNavigate();
  const { plan, step } = flow;

  const valid = stepValid(plan, step);
  const allValid = ([1, 2, 3, 4] as StepV2[]).every((s) => stepValid(plan, s));
  const twoPane = step === 4;

  const handleLaunch = () => {
    if (!allValid) return;
    const run = service.launch(plan);
    navigate(`/launchv2/${run.id}`);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Running context + progress */}
      <div className="flex-shrink-0 border-b border-border bg-background px-5 py-3">
        <ContextChips flow={flow} />
        <Progress step={step} onJump={(s) => s <= step && flow.setStep(s)} />
      </div>

      {/* Body */}
      <div className={cn("flex-1 min-h-0", twoPane ? "overflow-hidden" : "overflow-y-auto")}>
        <div className={cn(twoPane ? "h-full" : "mx-auto max-w-4xl px-5 py-6")}>
          {step === 1 && <Step1Start flow={flow} />}
          {step === 2 && <Step2Setup flow={flow} />}
          {step === 3 && <Step3Spread flow={flow} />}
          {step === 4 && <Step4Review flow={flow} />}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-shrink-0 items-center justify-between border-t border-border bg-background px-5 py-3">
        <Button variant="ghost" onClick={flow.back} disabled={step === 1}>Back</Button>
        <span className="text-xs text-muted-foreground">Autosaved</span>
        {step < 4 ? (
          <Button onClick={flow.next} disabled={!valid}>Next</Button>
        ) : (
          <Button onClick={handleLaunch} disabled={!allValid}>
            Launch {estimateAds(plan)} ads
          </Button>
        )}
      </div>
    </div>
  );
}

/* ---- chrome ---- */
function ContextChips({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  const chips = [
    plan.intent !== "custom" ? plan.intent : null,
    plan.objective?.replace("OUTCOME_", "").toLowerCase(),
    plan.format,
    plan.targets.length ? `${plan.targets.length} dest` : null,
    plan.creatives.length ? `${plan.creatives.length} creatives` : null,
  ].filter(Boolean) as string[];
  if (!chips.length) return null;
  return (
    <div className="mb-2 flex flex-wrap gap-1.5">
      {chips.map((c) => (
        <span key={c} className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">{c}</span>
      ))}
    </div>
  );
}

function Progress({ step, onJump }: { step: StepV2; onJump: (s: StepV2) => void }) {
  return (
    <div className="flex items-center gap-2">
      {([1, 2, 3, 4] as StepV2[]).map((s) => {
        const done = step > s;
        const active = step === s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onJump(s)}
            className="flex flex-1 items-center gap-2 text-left"
          >
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold",
                active ? "bg-primary text-primary-foreground" : done ? "bg-primary/20 text-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {s}
            </span>
            <span className={cn("text-xs", active ? "font-medium text-foreground" : "text-muted-foreground")}>{STEP_TITLES[s]}</span>
            {s < 4 && <span className={cn("h-px flex-1", done ? "bg-primary/40" : "bg-border")} />}
          </button>
        );
      })}
    </div>
  );
}
