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

  const canContinue = (() => {
    switch (state.step) {
      case 1:
        return state.category !== null && state.format !== null;
      case 2:
        return state.productId !== null || state.categoryId !== null;
      case 3:
        return state.mode === "scratch";
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

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background text-foreground">
      <ProgressIndicator step={state.step} ctaLayout={state.ctaLayout} />

      <main className="min-h-0 flex-1 overflow-y-auto">
        {state.step === 1 && <Step1Setup wizard={wizard} />}
        {state.step === 2 && <Step2Product wizard={wizard} />}
        {state.step === 3 && <Step3Approach wizard={wizard} />}
        {state.step === 4 && <Step4Configure wizard={wizard} />}
        {state.step === 5 && <Step5Results wizard={wizard} />}
      </main>

      <WizardNav
        step={state.step}
        ctaLayout={state.ctaLayout}
        count={state.count}
        credits={state.credits}
        canContinue={canContinue}
        onBack={wizard.back}
        onContinue={handleContinue}
      />
    </div>
  );
}

export default StudioV4;
