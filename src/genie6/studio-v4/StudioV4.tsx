import { useEffect, useState } from "react";
import { ProgressIndicator } from "./components/ProgressIndicator";
import { WizardNav } from "./components/WizardNav";
import { Step1Setup } from "./screens/Step1Setup";
import { Step2Product } from "./screens/Step2Product";
import { Step3Approach } from "./screens/Step3Approach";
import { Step4Configure } from "./screens/Step4Configure";
import { Step5Results } from "./screens/Step5Results";
import { useWizard } from "./state/useWizard";

export function StudioV4() {
  const wizard = useWizard();
  const { state } = wizard;

  // Step 5 — done flag + regen counter live here so the WizardNav footer
  // and Step5Results body share the same state. WizardNav owns the action
  // buttons (Start over · Generate again · Save batch); Step5Results just
  // renders the grid and reads `done` to swap skeletons → cards.
  const [step5Done, setStep5Done] = useState(false);
  const [step5Key, setStep5Key] = useState(0);

  useEffect(() => {
    if (state.step !== 5) return;
    setStep5Done(false);
    const t = setTimeout(() => setStep5Done(true), 2500);
    return () => clearTimeout(t);
  }, [state.step, step5Key]);

  const canContinue = (() => {
    switch (state.step) {
      case 1:
        return state.category !== null && state.format !== null;
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
    console.log("[StudioV4] Step 5 save batch (stub)");
  };
  const handleStartOver = () => {
    wizard.reset();
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background text-foreground">
      <ProgressIndicator
        step={state.step}
        ctaLayout={state.ctaLayout}
        onJumpTo={wizard.goTo}
      />

      <main className="min-h-0 flex-1 overflow-y-auto">
        {state.step === 1 && <Step1Setup wizard={wizard} />}
        {state.step === 2 && <Step2Product wizard={wizard} />}
        {state.step === 3 && <Step3Approach wizard={wizard} />}
        {state.step === 4 && <Step4Configure wizard={wizard} />}
        {state.step === 5 && (
          <Step5Results
            wizard={wizard}
            done={step5Done}
            regenKey={step5Key}
          />
        )}
      </main>

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
        onStartOver={handleStartOver}
        resultsReady={step5Done}
      />
    </div>
  );
}

export default StudioV4;
