import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Welcome } from "./steps/Welcome";
import { ChooseMode } from "./steps/ChooseMode";
import { EcommerceInput } from "./steps/EcommerceInput";
import { AffiliateInput } from "./steps/AffiliateInput";
import { Processing } from "./steps/Processing";
import { Done } from "./steps/Done";

type Mode = "ecom" | "affiliate";
type WelcomeVariant = "creative" | "insights";
/** -1 = Welcome celebration screen (pre-wizard, plays before Choose Mode). */
type Step = -1 | 0 | 1 | 2 | 3;

interface OnboardingData {
  mode: Mode;
  /** Welcome screen variant (Creative vs Insights). Only relevant when step === -1. */
  welcomeVariant: WelcomeVariant;
  /** E-commerce — single input */
  brandUrl?: string;
  /** Affiliate — two inputs */
  category?: string;
  refUrls?: string[];
}

interface OnboardingShellProps {
  /**
   * Called when the user completes the flow (Start Creating) or chooses
   * to skip. The parent (OnboardingModal) listens to this to dismiss
   * the modal. When omitted, falls back to navigating to /insights-v2/feed
   * (legacy standalone-route usage).
   */
  onComplete?: () => void;
}

/* ── URL <-> internal state mapping ──────────────────────────────── */

interface StateTriple {
  step: Step;
  mode: Mode;
  welcomeVariant: WelcomeVariant;
}

/** Encoded URL step name → internal state. welcomeVariant is only
    meaningful when step === -1. For non-welcome steps it defaults to
    "creative" (ignored by the renderers). */
const URL_TO_STATE: Record<string, StateTriple> = {
  "welcome": { step: -1, mode: "ecom", welcomeVariant: "creative" },
  "welcome-insights": { step: -1, mode: "ecom", welcomeVariant: "insights" },
  "choose-mode": { step: 0, mode: "ecom", welcomeVariant: "creative" },
  "ecom-input": { step: 1, mode: "ecom", welcomeVariant: "creative" },
  "ecom-processing": { step: 2, mode: "ecom", welcomeVariant: "creative" },
  "ecom-done": { step: 3, mode: "ecom", welcomeVariant: "creative" },
  "affiliate-input": { step: 1, mode: "affiliate", welcomeVariant: "creative" },
  "affiliate-processing": { step: 2, mode: "affiliate", welcomeVariant: "creative" },
  "affiliate-done": { step: 3, mode: "affiliate", welcomeVariant: "creative" },
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
  const prefix = mode;
  if (step === 1) return `${prefix}-input`;
  if (step === 2) return `${prefix}-processing`;
  return `${prefix}-done`;
}

/**
 * Demo first-login onboarding flow ported from the ff.ai marketing site.
 *
 * Flow:
 *   Step -1 Welcome          (Celebration screen, two variants: creative /
 *                              insights, toggleable)
 *   Step 0  Choose Mode      (E-commerce | Affiliate)
 *   Step 1  Input            E-com: Brand URL only
 *                            Affiliate: Category name + Reference URLs
 *   Step 2  Processing       (4 simulated stages)
 *   Step 3  Done             Brand/category-ready summary using the
 *                            locked field list per mode (see Done.tsx)
 *
 * Step + mode + welcomeVariant sync to URL as `?onb_step=...`. Same
 * naming as the public `/onboarding-print/:step` routes used by
 * html.to.design export. Toggling the welcome variant updates the
 * URL from `?onb_step=welcome` to `?onb_step=welcome-insights` and
 * vice versa.
 *
 * Rendered inside a forced-flow OnboardingModal — `onComplete` is invoked
 * to close the modal once the user finishes or skips. Sign-in still
 * navigates away (to /auth) since that exits the demo entirely.
 */
export function OnboardingShell({ onComplete }: OnboardingShellProps = {}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Hydrate initial state from `?onb_step=` if present (deep-link).
  // Default landing: welcome / creative.
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

  // Write current step/mode/variant back to URL on any change.
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
    // Clear the onboarding URL state on exit
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("onb_step");
        return next;
      },
      { replace: true },
    );
    if (onComplete) {
      onComplete();
    } else {
      navigate("/insights-v2/feed");
    }
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
    return data.mode === "affiliate" ? (
      <AffiliateInput
        onBack={() => goto(0)}
        onContinue={(input) => {
          setData((d) => ({ ...d, ...input }));
          goto(2);
        }}
      />
    ) : (
      <EcommerceInput
        onBack={() => goto(0)}
        onContinue={(input) => {
          setData((d) => ({ ...d, ...input }));
          goto(2);
        }}
      />
    );
  }

  if (step === 2) {
    return (
      <Processing
        mode={data.mode}
        onBack={() => goto(1)}
        onDone={() => goto(3)}
      />
    );
  }

  return (
    <Done
      mode={data.mode}
      brandUrl={data.brandUrl}
      category={data.category}
      onBack={() => goto(1)}
      onStart={finish}
      onRestart={() => goto(0)}
    />
  );
}
