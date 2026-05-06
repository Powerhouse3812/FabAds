import { ProgressIndicator } from "./components/ProgressIndicator";
import { WizardNav } from "./components/WizardNav";
import { Step1Setup } from "./screens/Step1Setup";
import { Step2Product } from "./screens/Step2Product";
import { Step3Create } from "./screens/Step3Create";
import { Step4Results } from "./screens/Step4Results";
import { useWizard } from "./state/useWizard";

export function StudioV4() {
  const wizard = useWizard();
  const { state } = wizard;

  const canContinue = (() => {
    switch (state.step) {
      case 1:
        return state.category !== null && state.format !== null;
      case 2:
        return state.productId !== null;
      case 3:
        return true;
      default:
        return false;
    }
  })();

  const handleContinue = () => {
    if (state.step === 3) {
      wizard.goTo(4);
      return;
    }
    wizard.next();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {state.step !== 4 && <ProgressIndicator step={state.step} />}

      <main className="flex-1">
        {state.step === 1 && <Step1Setup wizard={wizard} />}
        {state.step === 2 && <Step2Product wizard={wizard} />}
        {state.step === 3 && (
          <Step3Create wizard={wizard} onGenerate={() => wizard.goTo(4)} />
        )}
        {state.step === 4 && <Step4Results wizard={wizard} />}
      </main>

      <WizardNav
        step={state.step}
        canContinue={canContinue}
        onBack={wizard.back}
        onContinue={handleContinue}
      />
    </div>
  );
}

export default StudioV4;
