import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { AlphaProgressIndicator, type AlphaStep } from "./components/AlphaProgressIndicator";
import { AlphaStep1Format } from "./screens/AlphaStep1Format";
import { Step2Product } from "./screens/Step2Product";
import { Step3Approach } from "./screens/Step3Approach";
import { AlphaStep3Configure } from "./screens/AlphaStep3Configure";
import { Step5Results } from "./screens/Step5Results";
import { StudioHome, type AlphaMode } from "./screens/StudioHome";
import { ContextRail } from "./components/ContextRail";
import { useWizard } from "./state/useWizard";
import { cn } from "@/lib/utils";

type AlphaPhase = "home" | "wizard";

/**
 * StudioAlpha (A-12.26) — Studio Alpha shell.
 *
 * Architecture:
 *   - Home phase: StudioHome — click any available mode card → startWizard.
 *   - Wizard phase: 5 internal steps + a global right-side ContextRail.
 *       Step 1 = Format (Image/Video) — AlphaStep1Format
 *       Step 2 = Product — Step2Product
 *       Step 3 = Approach — Step3Approach
 *       Step 4 = Configure — AlphaStep3Configure
 *       Step 5 = Results — Step5Results (final screen, NOT in stepper)
 *   - ContextRail: GLOBAL right rail visible across ALL wizard steps. Shows
 *     overview of selections so far (mode, format, brand, product, angle, KB
 *     instruction, winners). Collapsible — railOpen state persists across
 *     step navigation.
 *   - Click-to-advance: each step auto-advances on selection (no footer buttons).
 *   - Topbar: ← Back (one step back; from step 1 → exits to Home).
 *   - AlphaProgressIndicator: 4 steps only (Format/Product/Approach/Configure).
 *     Hidden on step 5 (Results).
 */
export function StudioAlpha() {
  const wizard = useWizard();
  const { state } = wizard;
  const [phase, setPhase] = useState<AlphaPhase>("home");
  const [homeMode, setHomeMode] = useState<AlphaMode | null>("product-ad");

  // Global rail state — persists across step navigation.
  const [railOpen, setRailOpen] = useState(true);

  // Step 5 — generation done flag + regen counter.
  const [step5Done, setStep5Done] = useState(false);
  const [step5Key, setStep5Key] = useState(0);

  useEffect(() => {
    if (state.step !== 5) return;
    setStep5Done(false);
    const t = setTimeout(() => setStep5Done(true), 2500);
    return () => clearTimeout(t);
  }, [state.step, step5Key]);

  const startWizard = (mode: AlphaMode) => {
    setHomeMode(mode);
    const category = mode === "product-shoot" ? "asset" : "ad";
    wizard.patch({ category, step: 1 });
    setPhase("wizard");
  };

  const exitToHome = () => {
    wizard.reset();
    setHomeMode("product-ad");
    setPhase("home");
  };

  const handleBack = () => {
    if (state.step > 1) {
      wizard.back();
    } else {
      exitToHome();
    }
  };

  const handleGenerateAgain = () => {
    setStep5Done(false);
    setStep5Key((k) => k + 1);
  };
  const handleSaveBatch = () => console.log("[StudioAlpha] save batch (stub)");

  // Stepper: AlphaStep is 1-4 (Format/Product/Approach/Configure).
  // Step 5 (Results) hides the stepper entirely.
  const alphaStep = Math.min(state.step, 4) as AlphaStep;
  const showStepper = state.step <= 4;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background text-foreground">
      {phase === "home" && (
        <main className="min-h-0 flex-1 overflow-y-auto">
          <StudioHome onStart={startWizard} />
        </main>
      )}

      {phase === "wizard" && (
        <>
          {/* Topbar: ← Back + progress stepper (hidden on Results) */}
          <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-background/80 px-6 py-2 backdrop-blur">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {state.step > 1 ? "Back" : "Home"}
            </button>
            {showStepper && (
              <>
                <span className="text-muted-foreground/40">|</span>
                <div className="flex-1">
                  <AlphaProgressIndicator
                    step={alphaStep}
                    onJumpTo={(s) => {
                      // Only allow jumping to already-completed steps
                      if (s < state.step) wizard.goTo(s as 1 | 2 | 3 | 4 | 5);
                    }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Wizard body — flex layout: main content + collapsible rail */}
          <div className="flex min-h-0 flex-1">
            {/* Main step content — scrollable */}
            <main className="min-h-0 flex-1 overflow-y-auto">
              {state.step === 1 && (
                <AlphaStep1Format wizard={wizard} onAdvance={wizard.next} />
              )}
              {state.step === 2 && (
                <Step2Product wizard={wizard} onAdvance={wizard.next} />
              )}
              {state.step === 3 && (
                <Step3Approach wizard={wizard} onAdvance={wizard.next} />
              )}
              {state.step === 4 && (
                <AlphaStep3Configure wizard={wizard} studioMode={homeMode ?? undefined} />
              )}
              {state.step === 5 && (
                <Step5Results
                  wizard={wizard}
                  done={step5Done}
                  regenKey={step5Key}
                  onGenerateAgain={handleGenerateAgain}
                  onSaveBatch={handleSaveBatch}
                  onStartOver={exitToHome}
                />
              )}
            </main>

            {/* Global ContextRail — visible across all wizard steps */}
            <aside
              className={cn(
                "hidden shrink-0 border-l border-border/40 bg-background/40 transition-all md:flex md:flex-col",
                railOpen ? "w-[280px]" : "w-10",
              )}
            >
              {railOpen ? (
                <div className="flex-1 overflow-y-auto p-3">
                  <ContextRail
                    wizard={wizard}
                    studioMode={homeMode ?? undefined}
                    onCollapse={() => setRailOpen(false)}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setRailOpen(true)}
                  className="flex h-full w-full flex-col items-center gap-2 py-4 transition-colors hover:bg-foreground/[0.04]"
                  aria-label="Show overview"
                >
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                  <span
                    className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                    style={{ writingMode: "vertical-rl" }}
                  >
                    Overview
                  </span>
                </button>
              )}
            </aside>
          </div>
          {/* NO WizardNav footer — all steps are click-to-advance or inline Send */}
        </>
      )}
    </div>
  );
}

export default StudioAlpha;
