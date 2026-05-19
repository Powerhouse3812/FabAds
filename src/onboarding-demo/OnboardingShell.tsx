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
type WelcomeVariant = "creative" | "insights" | "common";
/**
 * What kind of marketer the user IS (captured at ChooseMode for internal
 * segmentation). Distinct from `Mode`, which is what the user wants to
 * START with — relevant for the wizard routing. For a single-type user
 * both values match; for a "both" user, profileType="both" + mode=their
 * chosen starting path. Stored in OnboardingData for analytics + later
 * UX tailoring; does NOT affect the wizard's structural flow.
 */
type ProfileType = "ecom" | "affiliate" | "both";
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
  /**
   * Profile-type segmentation captured at ChooseMode (Step 0):
   *   "ecom"      single-type ecom marketer
   *   "affiliate" single-type affiliate marketer
   *   "both"      user does a mix — their starting `mode` is decided
   *               via a second-stage picker on the same ChooseMode page
   * Internal-only — no impact on wizard routing or downstream UI.
   * Captured for analytics + future personalization.
   */
  profileType?: ProfileType;
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

/**
 * Sub-stage within Step 0 (ChooseMode). Both variants (Two-stage / Combined)
 * share this state so refresh + share-link work consistently across them.
 *   undefined → user is on the profile-picking screen (default)
 *   "start"   → user has picked "Both" and is on the start-trail screen
 *               (V1 Stage 2 OR V2 with Section B revealed)
 */
type ChooseModeSubStage = "start" | undefined;

interface StateTriple {
  step: Step;
  mode: Mode;
  welcomeVariant: WelcomeVariant;
  /** Only meaningful when step === 0. */
  chooseModeSubStage?: ChooseModeSubStage;
}

const URL_TO_STATE: Record<string, StateTriple> = {
  welcome: { step: -2, mode: "ecom", welcomeVariant: "creative" },
  "welcome-insights": { step: -2, mode: "ecom", welcomeVariant: "insights" },
  // "Common" variant — generic celebrate, ported from
  // wireframes/wf-onboarding.jsx → WelcomeCelebrateGeneric.
  "welcome-celebrate": { step: -2, mode: "ecom", welcomeVariant: "common" },
  "product-chooser": { step: -1, mode: "ecom", welcomeVariant: "creative" },
  "choose-mode": { step: 0, mode: "ecom", welcomeVariant: "creative" },
  // Sub-stage of ChooseMode — the "where to start" picker (only relevant
  // when profile=both). Maalik's call: URL must change between the two
  // screens of Step 1 so refresh + share-link work for either variant.
  "choose-mode-start": {
    step: 0,
    mode: "ecom",
    welcomeVariant: "creative",
    chooseModeSubStage: "start",
  },
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
  chooseModeSubStage?: ChooseModeSubStage,
): string {
  if (step === -2) {
    if (welcomeVariant === "insights") return "welcome-insights";
    if (welcomeVariant === "common") return "welcome-celebrate";
    return "welcome";
  }
  if (step === -1) return "product-chooser";
  if (step === 5) return "insights-setup";
  if (step === 0) {
    return chooseModeSubStage === "start" ? "choose-mode-start" : "choose-mode";
  }
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
  // Sub-stage within Step 0 — separate state because it's a screen-level
  // micro-flip that doesn't change the canonical step number. Hydrated
  // from URL on mount so refresh of ?onb_step=choose-mode-start lands
  // the user back on the start-trail screen with profile=both implicit.
  const [chooseModeSubStage, setChooseModeSubStage] =
    useState<ChooseModeSubStage>(initialState.chooseModeSubStage);

  useEffect(() => {
    const target = stateToUrl(
      step,
      data.mode,
      data.welcomeVariant,
      chooseModeSubStage,
    );
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (next.get("onb_step") !== target) next.set("onb_step", target);
        return next;
      },
      { replace: true },
    );
  }, [
    step,
    data.mode,
    data.welcomeVariant,
    chooseModeSubStage,
    setSearchParams,
  ]);

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
        subStage={chooseModeSubStage}
        onSubStageChange={setChooseModeSubStage}
        onPick={(mode, profileType) => {
          setData((d) => ({ ...d, mode, profileType }));
          // Reset sub-stage on advance so a future back-nav to Step 0
          // returns to the profile picker, not the start picker.
          setChooseModeSubStage(undefined);
          goto(mode === "affiliate" ? 2 : 1);
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
        onBack={() => goto(0)}
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
