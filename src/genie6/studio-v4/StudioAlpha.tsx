import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, PanelRightOpen } from "lucide-react";
import { AlphaProgressIndicator, type AlphaStep } from "./components/AlphaProgressIndicator";
import { AlphaStep1Format } from "./screens/AlphaStep1Format";
import { Step2Product } from "./screens/Step2Product";
import { Step3Approach } from "./screens/Step3Approach";
import { AlphaStep3Configure } from "./screens/AlphaStep3Configure";
import { Step5Results } from "./screens/Step5Results";
import { StudioHome, type AlphaMode } from "./screens/StudioHome";
import { ContextRail } from "./components/ContextRail";
import { useWizard, type WizardState, type Format, type Mode } from "./state/useWizard";
import { useStudioAlphaUrlSync } from "./state/useUrlSync";

/**
 * A-12.49 (Maalik): Read the URL (path :step + query string) and produce a
 * partial wizard state suitable for the initial useWizard() construction.
 * This makes hard-refresh on any step + deep linking restore the full wizard
 * shape on the very first render — no effect tick needed.
 *
 * We mirror the shape of useStudioAlphaUrlSync's mount-time read, but for the
 * INITIAL state (not a post-mount patch). Both hooks coexist: this one seeds
 * useState, the hook keeps URL ↔ state in sync afterwards.
 */
function readUrlIntoState(
  pathStep: string | undefined,
  searchParams: URLSearchParams,
): Partial<WizardState> {
  const patch: Partial<WizardState> = {};
  if (pathStep && SLUG_TO_STEP[pathStep]) {
    patch.step = SLUG_TO_STEP[pathStep];
    patch.category = "ad";
  }
  const format = searchParams.get("format");
  if (format === "image" || format === "video") patch.format = format as Format;
  const brand = searchParams.get("brand");
  if (brand) patch.brandId = brand;
  const product = searchParams.get("product");
  if (product) patch.productId = product;
  const category = searchParams.get("category");
  if (category) patch.categoryId = category;
  const approach = searchParams.get("approach");
  if (approach) patch.mode = approach as Mode;
  const angle = searchParams.get("angle");
  if (angle) patch.angleId = angle;
  const ratio = searchParams.get("ratio");
  if (ratio === "1:1" || ratio === "4:5" || ratio === "9:16" || ratio === "16:9")
    patch.aspectRatio = ratio;
  const count = searchParams.get("count");
  if (count) {
    const n = parseInt(count, 10);
    if (!Number.isNaN(n)) patch.count = n;
  }
  const model = searchParams.get("model");
  if (model) patch.modelId = model;
  const bg = searchParams.get("bg");
  if (bg === "off") patch.useBrandGuidelines = false;
  const kb = searchParams.get("kb");
  if (kb === "off") patch.useKnowledgeBase = false;
  // A-12.52 (Maalik): ?demo=1 seeds a full sample-result shape — 4 concept
  // rows × 4 variations = 16 outputs. Used to deliver shareable sample-result
  // URLs for HTML.to.design captures + design reviews.
  if (searchParams.get("demo") === "1") {
    patch.selectedConceptIds = ["c-hero", "c-lifestyle", "c-social-proof", "c-unboxing"];
    patch.count = 4;
    patch.credits = 16;
    if (!patch.angleId) patch.angleId = "hero";
    if (!patch.format) patch.format = "image";
  }
  return patch;
}

type AlphaPhase = "home" | "wizard";

const STEP_TO_SLUG: Record<number, string> = {
  1: "format",
  2: "product",
  3: "approach",
  4: "configure",
  5: "results",
};

const SLUG_TO_STEP: Record<string, 1 | 2 | 3 | 4 | 5> = {
  format: 1,
  product: 2,
  approach: 3,
  configure: 4,
  results: 5,
};

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
  const navigate = useNavigate();
  const params = useParams<{ step?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  // A-12.49 (Maalik): hydrate wizard.state directly from the URL at construction
  // so deep links and hard refresh land on the correct step + selections
  // BEFORE first paint. Previously this happened via useEffect, which left
  // a one-tick gap where state.step was still 1 — long enough for HTML.to.design
  // (and other headless capture tools) to grab the wrong frame.
  const wizard = useWizard(readUrlIntoState(params.step, searchParams));
  const { state } = wizard;
  // Selections / toggles ↔ URL (?brand, ?product, ?angle, ?ratio, etc.)
  useStudioAlphaUrlSync(wizard);
  const [phase, setPhase] = useState<AlphaPhase>(() => (params.step ? "wizard" : "home"));
  const [homeMode, setHomeMode] = useState<AlphaMode | null>("product-ad");

  // A-12.48 (Maalik): derive the render step DIRECTLY from URL on every render
  // (not just from `state.step`). This guarantees first-paint correctness when
  // the page is deep-linked — HTML.to.design plugin captures the synchronous
  // initial paint, and useEffect-driven step sync was firing too late for the
  // capture window. state.step still gets reconciled via the URL → state effect
  // below (so other consumers like AlphaProgressIndicator + ContextRail stay
  // consistent on second paint), but the active step component is picked from
  // the URL-derived step right from render 0.
  const urlStep =
    params.step && SLUG_TO_STEP[params.step]
      ? SLUG_TO_STEP[params.step]
      : null;
  const renderStep =
    phase === "wizard" ? (urlStep ?? state.step) : state.step;

  // Global rail open/closed ↔ URL (?rail=closed; default = open).
  const railOpen = searchParams.get("rail") !== "closed";
  const setRailOpen = (next: boolean) => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (next) sp.delete("rail");
        else sp.set("rail", "closed");
        return sp;
      },
      { replace: true },
    );
  };

  // Step 5 — generation done flag + regen counter.
  // A-12.52: when ?demo=1 is present, skip the 2.5s loader entirely — sample
  // URLs render the finished state immediately for HTML.to.design captures.
  const isDemoMode = searchParams.get("demo") === "1";
  const [step5Done, setStep5Done] = useState(isDemoMode);
  const [step5Key, setStep5Key] = useState(0);

  useEffect(() => {
    if (state.step !== 5) return;
    if (isDemoMode) {
      setStep5Done(true);
      return;
    }
    setStep5Done(false);
    const t = setTimeout(() => setStep5Done(true), 2500);
    return () => clearTimeout(t);
  }, [state.step, step5Key, isDemoMode]);

  // URL → wizard.state.step + phase sync (on mount + URL changes from Back/Forward).
  // A-12.47 (Maalik): also sync state.step IMMEDIATELY here on first mount so
  // the state→URL effect below doesn't race and override the URL back to /format.
  // Bug was: deep-linked /studio-alpha/product loaded with state.step=1, the
  // state→URL effect fired first and forced URL → /format, masking Step 2-5.
  const urlSyncedRef = useRef(false);
  useEffect(() => {
    if (!params.step) {
      if (phase !== "home") setPhase("home");
      urlSyncedRef.current = true;
      return;
    }
    const targetStep = SLUG_TO_STEP[params.step];
    if (!targetStep) {
      urlSyncedRef.current = true;
      return;
    }
    if (phase === "home") {
      setPhase("wizard");
      wizard.patch({ category: "ad", step: targetStep });
    } else if (state.step !== targetStep) {
      wizard.goTo(targetStep);
    }
    urlSyncedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.step]);

  // wizard.state.step → URL sync (when state advances via clicks).
  // Skip until urlSyncedRef is set — otherwise we'd navigate /product → /format
  // before the URL→state effect has had a chance to bump state.step from 1 → 2.
  useEffect(() => {
    if (!urlSyncedRef.current) return;
    if (phase !== "wizard") return;
    const slug = STEP_TO_SLUG[state.step];
    if (!slug) return;
    if (params.step !== slug) {
      navigate(`/iq/genie6/studio-alpha/${slug}`, { replace: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step, phase]);

  const startWizard = (mode: AlphaMode) => {
    setHomeMode(mode);
    const category = mode === "product-shoot" ? "asset" : "ad";
    wizard.patch({ category, step: 1 });
    setPhase("wizard");
    navigate("/iq/genie6/studio-alpha/format", { replace: false });
  };

  const exitToHome = () => {
    wizard.reset();
    setHomeMode("product-ad");
    setPhase("home");
    navigate("/iq/genie6/studio-alpha", { replace: false });
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
  // Uses renderStep so the stepper highlight matches the screen on deep-link.
  const alphaStep = Math.min(renderStep, 4) as AlphaStep;
  const showStepper = renderStep <= 4;

  return (
    <div className="v3-page-mesh flex h-[100dvh] flex-col overflow-hidden bg-background text-foreground">
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
          <div className="relative flex min-h-0 flex-1">
            {/* Main step content — scrollable */}
            <main className="min-h-0 flex-1 overflow-y-auto">
              {renderStep === 1 && (
                <AlphaStep1Format wizard={wizard} onAdvance={wizard.next} onBack={handleBack} />
              )}
              {renderStep === 2 && (
                <Step2Product wizard={wizard} onAdvance={wizard.next} onBack={handleBack} />
              )}
              {renderStep === 3 && (
                <Step3Approach wizard={wizard} onAdvance={wizard.next} onBack={handleBack} />
              )}
              {renderStep === 4 && (
                <AlphaStep3Configure wizard={wizard} studioMode={homeMode ?? undefined} onBack={handleBack} />
              )}
              {renderStep === 5 && (
                <Step5Results
                  wizard={wizard}
                  done={step5Done}
                  regenKey={step5Key}
                  onGenerateAgain={handleGenerateAgain}
                  onSaveBatch={handleSaveBatch}
                  onStartOver={exitToHome}
                  onBack={handleBack}
                />
              )}
            </main>

            {/* Global ContextRail — visible across all wizard steps. Container
                is transparent so the glass rail card sits over the page mesh. */}
            {railOpen && (
              <aside className="hidden shrink-0 transition-all duration-300 md:flex md:flex-col md:w-[300px]">
                <div className="flex-1 overflow-y-auto p-3">
                  <ContextRail
                    wizard={wizard}
                    studioMode={homeMode ?? undefined}
                    onCollapse={() => setRailOpen(false)}
                  />
                </div>
              </aside>
            )}
            {!railOpen && (
              <button
                type="button"
                onClick={() => setRailOpen(true)}
                aria-label="Show overview"
                className="group absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-card/80 shadow-md backdrop-blur-md transition-all duration-300 ease-out hover:scale-105 hover:border-foreground/30 hover:bg-card"
              >
                <PanelRightOpen className="h-4 w-4 text-foreground transition-transform duration-300 group-hover:-rotate-12" />
              </button>
            )}
          </div>
          {/* NO WizardNav footer — all steps are click-to-advance or inline Send */}
        </>
      )}
    </div>
  );
}

export default StudioAlpha;
