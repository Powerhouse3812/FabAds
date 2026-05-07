import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { AlphaProgressIndicator, type AlphaStep } from "./components/AlphaProgressIndicator";
import { WizardNav } from "./components/WizardNav";
import { Step2Product } from "./screens/Step2Product";
import { Step3Approach } from "./screens/Step3Approach";
import { AlphaStep3Configure } from "./screens/AlphaStep3Configure";
import { Step5Results } from "./screens/Step5Results";
import { StudioHome, type AlphaMode } from "./screens/StudioHome";
import { useWizard } from "./state/useWizard";
import type { Format } from "./state/useWizard";

type AlphaPhase = "home" | "wizard";

/**
 * StudioAlpha (A-12.8) — evolved Studio variant living at
 * /iq/genie6/studio-alpha. Beta stays untouched at /iq/genie6/studio.
 *
 * Architecture:
 *   - Home phase: StudioHome captures mode (Product Shoot / Brand Ad /
 *     Product Ad / Performance Ad) + format (Image / Video). Single
 *     Start button enters the wizard. Recent generations + Drafts
 *     strips below for quick continue affordance.
 *
 *   - Wizard phase: 4 steps — Product / Approach / Configure / Output.
 *     Reuses Beta's Step2Product (now labeled "Product"), Step3Approach
 *     ("Approach"), Step5Results ("Output"), and a NEW
 *     AlphaStep3Configure with prompt-on-top + trending concepts +
 *     no footer (HeyGen-minimal feel).
 *
 *   - Internal step numbering: Beta's wizard state uses 1-5 (with
 *     Step 1 = Setup). Alpha skips Setup (Home replaces it), so we
 *     map: alpha 1=beta 2 (Product), alpha 2=beta 3 (Approach),
 *     alpha 3=beta 4 (Configure), alpha 4=beta 5 (Output).
 *     `alphaStep = state.step - 1`.
 */
export function StudioAlpha() {
  const wizard = useWizard();
  const { state } = wizard;
  const [phase, setPhase] = useState<AlphaPhase>("home");

  // Home picks — default to "product-ad" + "image" so Start is immediately usable.
  const [homeMode, setHomeMode] = useState<AlphaMode | null>("product-ad");
  const [homeFormat, setHomeFormat] = useState<Format | null>("image");

  // Step 5 (alpha step 4) — done flag + regen counter shared between
  // Step5Results and WizardNav footer.
  const [step5Done, setStep5Done] = useState(false);
  const [step5Key, setStep5Key] = useState(0);

  useEffect(() => {
    if (state.step !== 5) return;
    setStep5Done(false);
    const t = setTimeout(() => setStep5Done(true), 2500);
    return () => clearTimeout(t);
  }, [state.step, step5Key]);

  const startWizard = () => {
    if (!homeMode || !homeFormat) return;
    // Patch wizard state with the Home picks. Alpha's Product Ad maps to
    // a "ad" category internally (matching Beta's Category type).
    const category = homeMode === "product-shoot" ? "asset" : "ad";
    wizard.patch({ category, format: homeFormat, step: 2 });
    setPhase("wizard");
  };

  const exitToHome = () => {
    wizard.reset();
    // Restore defaults so Start button is immediately usable on return.
    setHomeMode("product-ad");
    setHomeFormat("image");
    setPhase("home");
  };

  const alphaStep = (state.step >= 2 ? state.step - 1 : 1) as AlphaStep;

  // Wizard step gating — same as Beta but offset.
  const canContinue = (() => {
    switch (state.step) {
      case 2:
        return state.productId !== null || state.categoryId !== null;
      case 3:
        return state.mode === "scratch" || state.mode === "ugc-video";
      case 4:
        return state.prompt.trim().length > 0;
      default:
        return false;
    }
  })();

  const handleContinue = () => {
    if (state.step === 4) {
      wizard.goTo(5);
      return;
    }
    wizard.next();
  };

  const handleGenerateAgain = () => {
    setStep5Done(false);
    setStep5Key((k) => k + 1);
  };
  const handleSaveBatch = () => {
    console.log("[StudioAlpha] save batch (stub)");
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background text-foreground">
      {phase === "home" && (
        <main className="min-h-0 flex-1 overflow-y-auto">
          <StudioHome
            mode={homeMode}
            format={homeFormat}
            onPickMode={setHomeMode}
            onPickFormat={setHomeFormat}
            onStart={startWizard}
          />
        </main>
      )}

      {phase === "wizard" && (
        <>
          {/* Top bar with Back-to-Home chevron + Alpha stepper */}
          <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-background/80 px-6 py-2 backdrop-blur">
            <button
              type="button"
              onClick={exitToHome}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Home
            </button>
            <span className="text-muted-foreground/40">|</span>
            <div className="flex-1">
              <AlphaProgressIndicator
                step={alphaStep}
                onJumpTo={(s) => wizard.goTo((s + 1) as 2 | 3 | 4 | 5)}
              />
            </div>
          </div>

          <main className="min-h-0 flex-1 overflow-y-auto">
            {state.step === 2 && <Step2Product wizard={wizard} />}
            {state.step === 3 && <Step3Approach wizard={wizard} />}
            {state.step === 4 && <AlphaStep3Configure wizard={wizard} />}
            {state.step === 5 && (
              <Step5Results
                wizard={wizard}
                done={step5Done}
                regenKey={step5Key}
              />
            )}
          </main>

          {/* WizardNav footer — hidden on Step 4 (Configure) per
              "remove footer here" directive: Generate fires from
              prompt bar's inline Send. Visible on Steps 2/3/5. */}
          {state.step !== 4 && (
            <WizardNav
              step={state.step}
              ctaLayout={state.ctaLayout}
              count={state.count}
              credits={state.credits}
              canContinue={canContinue}
              onBack={wizard.back}
              onContinue={handleContinue}
              onGenerateAgain={handleGenerateAgain}
              onSaveBatch={handleSaveBatch}
              onStartOver={exitToHome}
              resultsReady={step5Done}
            />
          )}
        </>
      )}
    </div>
  );
}

export default StudioAlpha;
