import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChooseMode } from "./steps/ChooseMode";
import { EcommerceInput } from "./steps/EcommerceInput";
import { AffiliateInput } from "./steps/AffiliateInput";
import { Processing } from "./steps/Processing";
import { Done } from "./steps/Done";

type Mode = "ecom" | "affiliate";
type Step = 0 | 1 | 2 | 3;

interface OnboardingData {
  mode: Mode;
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

/** Encoded URL step name → internal {step, mode} pair. */
const URL_TO_STATE: Record<string, { step: Step; mode: Mode }> = {
  "choose-mode": { step: 0, mode: "ecom" },
  "ecom-input": { step: 1, mode: "ecom" },
  "ecom-processing": { step: 2, mode: "ecom" },
  "ecom-done": { step: 3, mode: "ecom" },
  "affiliate-input": { step: 1, mode: "affiliate" },
  "affiliate-processing": { step: 2, mode: "affiliate" },
  "affiliate-done": { step: 3, mode: "affiliate" },
};

function stateToUrl(step: Step, mode: Mode): string {
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
 *   Step 0  Choose Mode      (E-commerce | Affiliate)
 *   Step 1  Input            E-com: Brand URL only
 *                            Affiliate: Category name + Reference URLs
 *   Step 2  Processing       (4 simulated stages)
 *   Step 3  Done             Brand/category-ready summary using the
 *                            locked field list per mode (see Done.tsx)
 *
 * Step + mode sync to URL as `?onb_step=ecom-input` etc. so the URL
 * reflects the current state and is shareable / deep-linkable. The
 * same step names map to the public `/onboarding-print/:step` routes
 * used by html.to.design export.
 *
 * No backend wiring — Step 2 is purely cosmetic (timed stages), Step 3 shows
 * hardcoded sample data. Drop-in demo for showing prospective users the
 * onboarding UX without needing a real scraping pipeline yet.
 *
 * Rendered inside a forced-flow OnboardingModal — `onComplete` is invoked
 * to close the modal once the user finishes or skips. Sign-in still
 * navigates away (to /auth) since that exits the demo entirely.
 */
export function OnboardingShell({ onComplete }: OnboardingShellProps = {}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Hydrate initial step/mode from `?onb_step=` if present (deep-link).
  const initialUrlStep = searchParams.get("onb_step");
  const initialState =
    (initialUrlStep && URL_TO_STATE[initialUrlStep]) ??
    { step: 0 as Step, mode: "ecom" as Mode };

  const [step, setStep] = useState<Step>(initialState.step);
  const [data, setData] = useState<OnboardingData>({ mode: initialState.mode });

  // Write step/mode back to URL whenever they change (replace history so
  // the back button isn't spammed).
  useEffect(() => {
    const target = stateToUrl(step, data.mode);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (next.get("onb_step") !== target) next.set("onb_step", target);
        return next;
      },
      { replace: true },
    );
  }, [step, data.mode, setSearchParams]);

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
