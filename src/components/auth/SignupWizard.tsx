import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Step1PlanSelection } from "@/components/auth/signup/Step1PlanSelection";
import { Step2ProfileSetup } from "@/components/auth/signup/Step2ProfileSetup";
import { INITIAL_SIGNUP_DATA } from "@/components/auth/signup/types";
import { AuthNav } from "@/pages/Auth";

/**
 * SignupWizard — the redesigned 2-step, PLAN-FIRST signup flow (Figma
 * 10990:44968 "Plan selection" → 10421:45965 / 10506:50469 "Profile
 * setup"). Replaces the earlier 3-step profile → agency → invite-members
 * wizard, which was built from the wrong Figma frames and has been deleted
 * along with its step components. Pure UI: no Supabase/UMS call anywhere
 * in this component or its steps — plans/prices are static display data
 * (see signup/plans.ts for the full data-mapping + per-figure citations).
 *
 * `nav.step` (URL-driven, ?view=signup&step=1|2) is the single source of
 * truth for which step renders — this component never keeps its own "which
 * step am I on" state, only the field values the user has typed so far
 * (kept here so they survive step changes, since SignupWizard itself stays
 * mounted across the whole flow per the Auth.tsx contract).
 */
export function SignupWizard({ nav }: { nav: AuthNav }) {
  const navigate = useNavigate();
  const [data, setData] = useState(INITIAL_SIGNUP_DATA);

  const handleComplete = () => {
    // No backend for signup yet — hand off straight to the existing
    // first-login onboarding wizard (InsightsV2Feed reads ?onboarding=true
    // and pops FirstLoginOnboardingModal) instead of building a new
    // "signup complete" screen. See src/pages/insights-v2/InsightsV2Feed.tsx.
    navigate("/insights-v2/feed?onboarding=true");
  };

  return (
    <AuthLayout>
      {nav.step === 1 && (
        <Step1PlanSelection
          data={data}
          setData={setData}
          onNext={() => nav.goTo("signup", { step: 2 })}
          onLogin={() => nav.goTo("login")}
        />
      )}
      {nav.step === 2 && (
        <Step2ProfileSetup
          data={data}
          setData={setData}
          onBack={() => nav.goTo("signup", { step: 1 })}
          onComplete={handleComplete}
        />
      )}
    </AuthLayout>
  );
}
