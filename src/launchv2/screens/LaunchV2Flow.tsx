/**
 * LaunchV2Flow — the 4-step orchestrator. Pattern A: Steps 1–3 are focused
 * centered screens; Step 4 (Review & Launch) is a full-height Meta two-pane.
 * Chrome: running-context chips + step progress + footer (Back/Next/Launch).
 * Step bodies are filled by build agents; this owns the shell + flow control.
 *
 * Supports a V1/V2 design variant toggle (top-right of progress row).
 * V1 = corrected current design; V2 = fresh redesign.
 */
import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useFlowV2, type StepV2, type UseFlowV2 } from "../state/useFlowV2";
import { useLaunchV2 } from "../state/LaunchV2Context";
import { estimateAds } from "../deriveV2";
import { planReady } from "../reducer";
import type { PlanV2 } from "../types";
import Step1Start from "./steps/Step1Start";
import Step2Setup from "./steps/Step2Setup";
import Step3Spread from "./steps/Step3Spread";
import Step4Distribution from "./steps/Step4Distribution";
import Step4Review from "./steps/Step4Review";
import Step1StartV2 from "./steps/Step1StartV2";
import Step2SetupV2 from "./steps/Step2SetupV2";
import Step3SpreadV2 from "./steps/Step3SpreadV2";
import Step4DistributionV2 from "./steps/Step4DistributionV2";
import Step4ReviewV2 from "./steps/Step4ReviewV2";
import { VariantToggle } from "../components/VariantToggle";

const STEP_TITLES: Record<StepV2, string> = {
  1: "Start",
  2: "Setup",
  3: "Ad",
  4: "Distribution",
  5: "Review & Launch",
};

function stepValid(plan: PlanV2, step: StepV2): boolean {
  return planReady(plan, step);
}

export default function LaunchV2Flow() {
  const [sp] = useSearchParams();
  const flow = useFlowV2(sp.get("draft") ?? undefined);
  const service = useLaunchV2();
  const navigate = useNavigate();
  const { plan, step } = flow;
  const [saveAsStrategy, setSaveAsStrategy] = useState(false);
  const [variant, setVariant] = useState<'v1' | 'v2'>('v1');

  const valid = stepValid(plan, step);
  const allValid = ([1, 2, 3, 4, 5] as StepV2[]).every((s) => stepValid(plan, s));
  const twoPane = step === 4 || step === 5;

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
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Progress step={step} onJump={(s) => s <= step && flow.setStep(s)} />
          </div>
          <VariantToggle variant={variant} onToggle={() => setVariant((v) => (v === 'v1' ? 'v2' : 'v1'))} />
        </div>
      </div>

      {/* Body */}
      <div className={cn("flex-1 min-h-0", twoPane ? "overflow-hidden" : "overflow-y-auto")}>
        <div className={cn(twoPane ? "h-full" : "mx-auto max-w-4xl px-5 py-6")}>
          {step === 1 && (variant === 'v1' ? <Step1Start flow={flow} /> : <Step1StartV2 flow={flow} />)}
          {step === 2 && (variant === 'v1' ? <Step2Setup flow={flow} /> : <Step2SetupV2 flow={flow} />)}
          {step === 3 && (variant === 'v1' ? <Step3Spread flow={flow} /> : <Step3SpreadV2 flow={flow} />)}
          {step === 4 && (variant === 'v1' ? <Step4Distribution flow={flow} /> : <Step4DistributionV2 flow={flow} />)}
          {step === 5 && (variant === 'v1' ? <Step4Review flow={flow} /> : <Step4ReviewV2 flow={flow} />)}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-shrink-0 items-center justify-between border-t border-border bg-background px-5 py-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={flow.back} disabled={step === 1}>Back</Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/launchv2/settings")}
            aria-label="Launch settings"
            title="Launch settings"
          >
            <SettingsIcon className="h-4 w-4" />
          </Button>
        </div>
        <span className="text-xs text-muted-foreground">Autosaved</span>
        {step < 5 ? (
          <Button onClick={flow.next} disabled={!valid}>Next</Button>
        ) : (
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground select-none">
              <input
                type="checkbox"
                checked={saveAsStrategy}
                onChange={(e) => setSaveAsStrategy(e.target.checked)}
                className="h-3.5 w-3.5 rounded accent-primary"
              />
              Save as strategy
            </label>
            <Button onClick={handleLaunch} disabled={!allValid}>
              Launch {estimateAds(plan)} ads
            </Button>
          </div>
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
      {([1, 2, 3, 4, 5] as StepV2[]).map((s) => {
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
            {s < 5 && <span className={cn("h-px flex-1", done ? "bg-primary/40" : "bg-border")} />}
          </button>
        );
      })}
    </div>
  );
}
