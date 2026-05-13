import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChooseMode } from "./steps/ChooseMode";
import { EcommerceInput } from "./steps/EcommerceInput";
import { AffiliateInput } from "./steps/AffiliateInput";
import { Processing } from "./steps/Processing";
import { Done } from "./steps/Done";

type Mode = "ecom" | "affiliate";

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
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [data, setData] = useState<OnboardingData>({ mode: "ecom" });

  const goto = useCallback((s: 0 | 1 | 2 | 3) => {
    setStep(s);
    requestAnimationFrame(() =>
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }),
    );
  }, []);

  const finish = useCallback(() => {
    if (onComplete) {
      onComplete();
    } else {
      navigate("/insights-v2/feed");
    }
  }, [onComplete, navigate]);

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
