import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Welcome } from "./steps/Welcome";
import { ProductChooser } from "./steps/ProductChooser";
import { InsightsQuickSetup } from "./steps/InsightsQuickSetup";
import { ChooseMode } from "./steps/ChooseMode";
import { CountrySelection } from "./steps/CountrySelection";
import { EcommerceInput } from "./steps/EcommerceInput";
import { AffiliateInput } from "./steps/AffiliateInput";
import { Processing } from "./steps/Processing";
import { Done } from "./steps/Done";

type Mode = "ecom" | "affiliate";
type WelcomeVariant = "creative" | "insights";
/**
 *  -2  Welcome                  (pre-wizard celebration, two variants)
 *  -1  Product Chooser          (Genie vs Industry Insights)
 *   0  Choose Mode              (Genie path — stepper starts here)
 *   1  Country
 *   2  Input
 *   3  Processing
 *   4  Done
 *   5  Insights Quick Setup     (Insights path — single screen, no wizard)
 */
type Step = -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5;

interface OnboardingData {
  mode: Mode;
  welcomeVariant: WelcomeVariant;
  countryCode?: string;
  countryName?: string;
  countryFlag?: string;
  brandUrl?: string;
  category?: string;
  industry?: string;
  platforms?: string[];
  audience?: string;
  refUrls?: string[];
  affLink?: string;
  /** Set when user picks Industry Insights from ProductChooser. */
  insightsIndustry?: string;
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
  welcome: { step: -2, mode: "ecom", welcomeVariant: "creative" },
  "welcome-insights": { step: -2, mode: "ecom", welcomeVariant: "insights" },
  "product-chooser": { step: -1, mode: "ecom", welcomeVariant: "creative" },
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
  "insights-setup": { step: 5, mode: "ecom", welcomeVariant: "creative" },
};

function stateToUrl(
  step: Step,
  mode: Mode,
  welcomeVariant: WelcomeVariant,
): string {
  if (step === -2) {
    return welcomeVariant === "insights" ? "welcome-insights" : "welcome";
  }
  if (step === -1) return "product-chooser";
  if (step === 5) return "insights-setup";
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
 * 7-screen sequence (pre-stepper + 5-step wizard):
 *   Welcome → Product Chooser → Choose Mode → Country → Input →
 *   Processing → Done
 *
 * The Welcome + Product Chooser screens are pre-stepper (no step
 * dots visible). The stepper appears from Choose Mode onwards with
 * 5 labels.
 *
 * URL state: ?onb_step=<slug>. Slugs match the public
 * /onboarding-print/:step routes 1:1 for design-tool export.
 */
export function OnboardingShell({ onComplete }: OnboardingShellProps = {}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialUrlStep = searchParams.get("onb_step");
  const initialState: StateTriple =
    (initialUrlStep && URL_TO_STATE[initialUrlStep]) ?? {
      step: -2,
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

  if (step === -2) {
    return (
      <Welcome
        variant={data.welcomeVariant}
        onVariantChange={setWelcomeVariant}
        onContinue={() => goto(-1)}
      />
    );
  }

  if (step === -1) {
    return (
      <ProductChooser
        onPickGenie={() => goto(0)}
        onPickInsights={() => goto(5)}
      />
    );
  }

  if (step === 5) {
    return (
      <InsightsQuickSetup
        onContinue={(industry) => {
          setData((d) => ({ ...d, insightsIndustry: industry }));
          finish();
        }}
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
      onRestart={() => goto(-2)}
    />
  );
}
