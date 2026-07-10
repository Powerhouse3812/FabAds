import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { SignupHeader } from "@/components/auth/signup/SignupHeader";
import { SignupStepper } from "@/components/auth/signup/SignupStepper";
import { Step1Profile } from "@/components/auth/signup/Step1Profile";
import { Step2Agency } from "@/components/auth/signup/Step2Agency";
import { Step3InviteMembers } from "@/components/auth/signup/Step3InviteMembers";
import { INITIAL_SIGNUP_DATA } from "@/components/auth/signup/types";
import { AuthNav } from "@/pages/Auth";

/**
 * SignupWizard — the 3-step signup flow (Figma nodes 9431:54018 / 54707 /
 * 55392: "Set Profile" → "Assemble Agency" → "Invite Members"). Pure UI:
 * there is no Supabase/UMS call anywhere in this component or its steps.
 *
 * `nav.step` (URL-driven, ?view=signup&step=1|2|3) is the single source of
 * truth for which step renders — this component never keeps its own "which
 * step am I on" state, only the field values the user has typed so far
 * (kept here so they survive step changes, since SignupWizard itself stays
 * mounted across the whole flow per the Auth.tsx contract).
 */
export function SignupWizard({ nav }: { nav: AuthNav }) {
  const navigate = useNavigate();
  const [data, setData] = useState(INITIAL_SIGNUP_DATA);

  const goToStep = (step: 1 | 2 | 3) => nav.goTo("signup", { step });

  const handleComplete = () => {
    // No backend for signup yet — hand off straight to the existing
    // first-login onboarding wizard (InsightsV2Feed reads ?onboarding=true
    // and pops FirstLoginOnboardingModal) instead of building a new
    // "signup complete" screen. See src/pages/insights-v2/InsightsV2Feed.tsx.
    navigate("/insights-v2/feed?onboarding=true");
  };

  return (
    <AuthLayout hero="signup">
      <div className="flex w-full flex-col items-center gap-8">
        <SignupHeader />
        <SignupStepper current={nav.step} />

        <div className="w-full">
          {nav.step === 1 && <Step1Profile data={data} setData={setData} onNext={() => goToStep(2)} />}
          {nav.step === 2 && (
            <Step2Agency data={data} setData={setData} onNext={() => goToStep(3)} onBack={() => goToStep(1)} />
          )}
          {nav.step === 3 && (
            <Step3InviteMembers
              data={data}
              setData={setData}
              onComplete={handleComplete}
              onBack={() => goToStep(2)}
            />
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => nav.goTo("login")}
            className="fab-focus rounded-sm font-medium text-primary-text hover:underline"
          >
            Log in
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}
