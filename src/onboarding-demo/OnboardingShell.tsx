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
  // Ecommerce
  storeUrl?: string;
  brand?: string;
  // Affiliate
  category?: string;
  industry?: string;
  platforms?: string[];
  audience?: string;
  refUrls?: string[];
  affLink?: string;
}

/**
 * Demo first-login onboarding flow ported from the ff.ai marketing site.
 *
 * Flow:
 *   Step 0  Choose Mode      (E-commerce | Affiliate)
 *   Step 1  Input             (mode-specific form)
 *   Step 2  Processing        (4 simulated stages)
 *   Step 3  Done              (brand-ready summary + sample data + competitors)
 *
 * No backend wiring — Step 2 is purely cosmetic (timed stages), Step 3 shows
 * hardcoded sample data. Drop-in demo for showing prospective users the
 * onboarding UX without needing a real scraping pipeline yet.
 *
 * "Start Creating" lands on /insights-v2/feed (currently the most visual
 * surface to show a "filled-in" workspace).
 */
export function OnboardingShell() {
  const navigate = useNavigate();
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [data, setData] = useState<OnboardingData>({ mode: "ecom" });

  const goto = useCallback((s: 0 | 1 | 2 | 3) => {
    setStep(s);
    // Scroll the page-level container to top so each step starts at top.
    requestAnimationFrame(() =>
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }),
    );
  }, []);

  const skipToDashboard = useCallback(() => navigate("/insights-v2/feed"), [navigate]);

  if (step === 0) {
    return (
      <ChooseMode
        onPick={(mode) => {
          setData((d) => ({ ...d, mode }));
          goto(1);
        }}
        onSkip={skipToDashboard}
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
      brandName={data.brand}
      category={data.category}
      industry={data.industry}
      platforms={data.platforms}
      refUrls={data.refUrls}
      onBack={() => goto(1)}
      onStart={skipToDashboard}
      onRestart={() => goto(0)}
    />
  );
}
