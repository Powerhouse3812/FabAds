import { useState, type Dispatch, type SetStateAction } from "react";
import { ExternalLink } from "lucide-react";

import signupLogo from "@/assets/auth/signup-plan-logo.svg";
import { Button } from "@/components/ui/button";
import { BillingToggle } from "@/components/auth/signup/BillingToggle";
import { PlanCard } from "@/components/auth/signup/PlanCard";
import { TrialRow } from "@/components/auth/signup/TrialRow";
import { SignupPlanStepper } from "@/components/auth/signup/SignupPlanStepper";
import { PAID_PLANS, type SelectablePlanId } from "@/components/auth/signup/plans";
import type { SignupFormData } from "@/components/auth/signup/types";

interface Step1PlanSelectionProps {
  data: SignupFormData;
  setData: Dispatch<SetStateAction<SignupFormData>>;
  onNext: () => void;
  onLogin: () => void;
}

/**
 * Step1PlanSelection — "Plan selection" screen (Figma 10990:44968, the
 * canonical card design; heading copy + trial row + annual pricing borrowed
 * from the "You're one step away from smarter marketing" variant frames —
 * see plans.ts for the full data-mapping rationale).
 */
export function Step1PlanSelection({ data, setData, onNext, onLogin }: Step1PlanSelectionProps) {
  // Which card's checklist is open — independent of `selectedPlan` so the
  // chevron can preview a plan's features without committing to it.
  // Defaults to whatever's selected (Starter, out of the box) to match the
  // Figma default state (Starter shown pre-expanded).
  const [expandedPlan, setExpandedPlan] = useState<SelectablePlanId | null>(data.selectedPlan);

  const selectPlan = (id: SelectablePlanId) => {
    setData((prev) => ({ ...prev, selectedPlan: id }));
    setExpandedPlan(id);
  };

  // Figma shows "Start trial & Set up profile" only on the trial-flavoured
  // frames; the plain paid-plan frame's CTA reads the same, but "Next" is
  // the more accurate label once a *paid* plan is chosen (there's no trial
  // being started) — documented deviation per the task brief's allowance.
  const ctaLabel = data.selectedPlan === "trial" ? "Start trial & Set up profile" : "Next";

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <img src={signupLogo} alt="FabAds" className="h-[26px] w-auto" />

      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-xl font-bold text-foreground">You're one step away from smarter marketing</h1>
        <p className="text-sm text-muted-foreground">
          Unlock automation, Integration, Launch, etc — all in one powerful platform
        </p>
      </div>

      <SignupPlanStepper current={1} />

      <BillingToggle value={data.billing} onChange={(billing) => setData((prev) => ({ ...prev, billing }))} />

      <div role="radiogroup" aria-label="Plan" className="flex w-full flex-col gap-3">
        <TrialRow selected={data.selectedPlan === "trial"} onSelect={() => selectPlan("trial")} />

        {PAID_PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            billing={data.billing}
            selected={data.selectedPlan === plan.id}
            expanded={expandedPlan === plan.id}
            onSelect={() => selectPlan(plan.id)}
            onToggleExpand={() => setExpandedPlan((current) => (current === plan.id ? null : plan.id))}
          />
        ))}
      </div>

      <a
        href="#"
        onClick={(event) => event.preventDefault()}
        className="fab-focus flex w-full items-center justify-end gap-1 rounded-sm text-xs text-muted-foreground hover:text-foreground"
      >
        View more about plan details
        <ExternalLink className="h-3 w-3" aria-hidden="true" />
      </a>

      <div className="flex w-full flex-col items-center gap-2">
        <Button type="button" onClick={onNext} disabled={!data.selectedPlan} className="h-10 w-full rounded-lg">
          {ctaLabel}
        </Button>
        <p className="text-sm text-muted-foreground">
          Already a user?{" "}
          <button
            type="button"
            onClick={onLogin}
            className="fab-focus rounded-sm font-medium text-primary-text hover:underline"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}
