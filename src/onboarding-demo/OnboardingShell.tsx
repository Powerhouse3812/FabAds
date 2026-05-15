import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Welcome } from "./steps/Welcome";
import { ChooseMode } from "./steps/ChooseMode";
import { CountrySelection } from "./steps/CountrySelection";
import { EcommerceInput } from "./steps/EcommerceInput";
import { AffiliateInput } from "./steps/AffiliateInput";
import { Processing } from "./steps/Processing";
import { Done } from "./steps/Done";

type Mode = "ecom" | "affiliate";
type WelcomeVariant = "creative" | "insights";
/** -1 Welcome  ·  0 ChooseMode  ·  1 Country  ·  2 Input  ·  3 Processing  ·  4 Done */
type Step = -1 | 0 | 1 | 2 | 3 | 4;

interface OnboardingData {
  mode: Mode;
  welcomeVariant: WelcomeVariant;
  /** Country selection (Step 1 — both flows). */
  countryCode?: string;
  countryName?: string;
  countryFlag?: string;
  /* E-com — single input */
  brandUrl?: string;
  /* Affiliate — full field set */
  category?: string;
  industry?: string;
  platforms?: string[];
  audience?: string;
  refUrls?: string[];
  affLink?: string;
}

interface OnboardingShellProps {
  onComplete?: () => void;
}

/* ── URL <-> internal state mapping ──────────────────────────────── */

interface StateTriple {
  step: Step;
  mode: Mode;
  welcomeVariant: WelcomeVariant;
}

const URL_TO_STATE: Record<string, StateTriple> = {
  welcome: { step: -1, mode: "ecom", welcomeVariant: "creative" },
  "welcome-insights": { step: -1, mode: "ecom", welcomeVariant: "insights" },
  "choose-mode": { step: 0, mode: "ecom", welcomeVariant: "creative" },
  country: { step: 1, mode: "ecom", welcomeVariant: "creative" },
  "ecom-input": { step: 2, mode: "ecom", welcomeVariant: "creative" },
  "ecom-processing": { step: 3, mode: "ecom", welcomeVariant: "creative" },
  "ecom-done": { step: 4, mode: "ecom", welcomeVariant: "creative" },
  "affiliate-input": { step: 2, mode: "affiliate", welcomeVariant: "creative" },
  "affiliate-processing": {
    step: 3,
    mode: "affiliate",
    welcomeVariant: "creative",
  },
  "affiliate-done": {
    step: 4,
    mode: "affiliate",
    welcomeVariant: "creative",
  },
};

function stateToUrl(
  step: Step,
  mode: Mode,
  welcomeVariant: WelcomeVariant,
): string {
  if (step === -1) {
    return welcomeVariant === "insights" ? "welcome-insights" : "welcome";
  }
  if (step === 0) return "choose-mode";
  if (step === 1) return "country";
  const prefix = mode;
  if (step === 2) return `${prefix}-input`;
  if (step === 3) return `${prefix}-processing`;
  return `${prefix}-done`;
}

/**
 * Demo first-login onboarding flow.
 *
 * Steps:
 *   -1  Welcome           (pre-stepper celebration screen, two variants)
 *    0  Choose Mode       (E-commerce | Affiliate)
 *    1  Country           (where you're based — tailors ad formats /
 *                          compliance / platform recs)
 *    2  Input             E-com: Brand URL  ·  Affiliate: Category + full
 *                          field set (Industry, Platforms, Audience,
 *                          Reference URLs, Affiliate link)
 *    3  Processing        (4 simulated stages)
 *    4  Done              (Brand/Category Ready! summary)
 *
 * URL state: ?onb_step=<slug> with slugs matching the print routes.
 */
export function OnboardingShell({ onComplete }: OnboardingShellProps = {}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialUrlStep = searchParams.get("onb_step");
  const initialState: StateTriple =
    (initialUrlStep && URL_TO_STATE[initialUrlStep]) ?? {
      step: -1,
      mode: "ecom",
      welcomeVariant: "creative",
    };

  const [step, setStep] = useState<Step>(initialState.step);
  const [data, setData] = useState<OnboardingData>({
    mode: initialState.mode,
    welcomeVariant: initialState.welcomeVariant,
  });

  useEffect(() => {
    const target = stateToUrl(step, data.mode, data.welcomeVariant);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (next.get("onb_step") !== target) next.set("onb_step", target);
        return next;
      },
      { replace: true },
    );
  }, [step, data.mode, data.welcomeVariant, setSearchParams]);

  const goto = useCallback((s: Step) => {
    setStep(s);
    requestAnimationFrame(() =>
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }),
    );
  }, []);

  const finish = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("onb_step");
        return next;
      },
      { replace: true },
    );
    if (onComplete) onComplete();
    else navigate("/insights-v2/feed");
  }, [onComplete, navigate, setSearchParams]);

  const goToLogin = useCallback(() => navigate("/auth"), [navigate]);

  const setWelcomeVariant = useCallback((v: WelcomeVariant) => {
    setData((d) => ({ ...d, welcomeVariant: v }));
  }, []);

  if (step === -1) {
    return (
      <Welcome
        variant={data.welcomeVariant}
        onVariantChange={setWelcomeVariant}
        onContinue={() => goto(0)}
      />
    );
  }

  if (step === 0) {
    return (
      <ChooseMode
        onPick={(mode) => {
          setData((d) => ({ ...d, mode }));
          goto(1);
        }}
        onSkip={finish}
        onLogin={goToLogin}
      />
    );
  }

  if (step === 1) {
    return (
      <CountrySelection
        selected={data.countryCode}
        onBack={() => goto(0)}
        onContinue={(c) => {
          setData((d) => ({
            ...d,
            countryCode: c.code,
            countryName: c.name,
            countryFlag: c.flag,
          }));
          goto(2);
        }}
      />
    );
  }

  if (step === 2) {
    return data.mode === "affiliate" ? (
      <AffiliateInput
        onBack={() => goto(1)}
        onContinue={(input) => {
          setData((d) => ({ ...d, ...input }));
          goto(3);
        }}
      />
    ) : (
      <EcommerceInput
        onBack={() => goto(1)}
        onContinue={(input) => {
          setData((d) => ({ ...d, ...input }));
          goto(3);
        }}
      />
    );
  }

  if (step === 3) {
    return (
      <Processing
        mode={data.mode}
        onBack={() => goto(2)}
        onDone={() => goto(4)}
      />
    );
  }

  return (
    <Done
      mode={data.mode}
      brandUrl={data.brandUrl}
      category={data.category}
      onBack={() => goto(2)}
      onStart={finish}
      onRestart={() => goto(0)}
    />
  );
}
