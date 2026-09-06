import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, PanelRightOpen, PanelRightClose } from "lucide-react";
import { AlphaProgressIndicator, type AlphaStep } from "./components/AlphaProgressIndicator";
import { AlphaStep1Format } from "./screens/AlphaStep1Format";
import { Step2Product } from "./screens/Step2Product";
import { Step3Approach } from "./screens/Step3Approach";
import { AlphaStep3Configure } from "./screens/AlphaStep3Configure";
// A-12.181: StudioAlpha now lands on the new Step5ResultsQueue surface —
// the dual-variant queue redesign (V1 dense, V2 centered) Maalik shipped
// the queue components for but never wired through this entry. The
// legacy Step5Results stays on disk in case the concept-rows-only layout
// needs to be revived as a fallback.
import { Step5ResultsQueue } from "./screens/Step5ResultsQueue";
import { StudioHome, type AlphaMode } from "./screens/StudioHome";
import { ContextRail } from "./components/ContextRail";
import { MobileContextRailSheet } from "./components/MobileContextRailSheet";
import { useWizard, type WizardState, type Format, type Mode } from "./state/useWizard";
import { useStudioAlphaUrlSync } from "./state/useUrlSync";
import { isKnownConceptId } from "./data/concepts";
// §6 Rule 5 — the persistent flow banner + the context it renders from. Both
// owned by other agents (Flow Data / Flows UI) per the shared build brief;
// imported by contract path + signature, not reimplemented here.
import { resolveFlowContext, flowInitialPatch } from "@/genie6/flows/data/resolveFlowContext";
import { FlowBanner } from "@/genie6/flows/FlowBanner";
import type { FlowContext } from "@/genie6/flows/flowTypes";

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
  flowCtx: FlowContext | null,
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
  const resolution = searchParams.get("resolution");
  if (resolution === "720p" || resolution === "1080p" || resolution === "4K")
    patch.videoResolution = resolution;
  const audio = searchParams.get("audio");
  if (audio === "off") patch.videoAudio = false;
  const bg = searchParams.get("bg");
  if (bg === "off") patch.useBrandGuidelines = false;
  const kb = searchParams.get("kb");
  if (kb === "off") patch.useKnowledgeBase = false;
  // Mirror useUrlSync's mount-time reads. Without these, a hard refresh on
  // Step 2 mounted the picker with bulkMode=false — its useState reads the
  // array once, on the paint where it was still [] — and language/upload
  // flashed their defaults before the sync effect caught up.
  const lang = searchParams.get("lang");
  if (lang) patch.language = lang;
  const bulkProducts = searchParams.get("bulkProducts");
  if (bulkProducts) patch.bulkProductIds = bulkProducts.split(",").filter(Boolean);
  const productImage = searchParams.get("productImage");
  if (productImage) patch.uploadedProductImage = productImage;
  // §12 — a concept hand-off must land on the FIRST paint, same reasoning as
  // every other param read here. Unknown ids are dropped (see useUrlSync).
  const conceptsParam = searchParams.get("concepts");
  if (conceptsParam) {
    const ids = conceptsParam.split(",").filter(Boolean).filter(isKnownConceptId);
    if (ids.length > 0) patch.selectedConceptIds = ids;
  }
  // A-12.52 (Maalik): ?demo=1 seeds a full sample-result shape — 4 concept
  // rows × 4 variations = 16 outputs. Used to deliver shareable sample-result
  // URLs for HTML.to.design captures + design reviews.
  if (searchParams.get("demo") === "1") {
    // These were ["c-hero", "c-lifestyle", "c-social-proof", "c-unboxing"] —
    // none of which exist in data/concepts.ts's CONCEPTS. The sample-result
    // URL therefore rendered with four unresolvable concept ids, so every
    // concept row fell back to a placeholder. Replaced with real ids.
    patch.selectedConceptIds = ["c-hero-pack", "c-morning-ritual", "c-founder-note", "c-before-after"];
    patch.count = 4;
    patch.credits = 16;
    if (!patch.angleId) patch.angleId = "hero";
    if (!patch.format) patch.format = "image";
  }
  // §6 Rules 1 & 2 (Studio Shell agent) — a flow context resolved from
  // ?src/?ref/?act seeds the wizard at CONSTRUCTION, same reasoning as the
  // rest of this function: no effect tick, so a hard refresh or a shared
  // flow link lands pre-filled on the very first paint. flowInitialPatch()
  // supplies the actual field values (brand/product/mode/etc.) AND
  // `step: ctx.landingStep` — Rule 1 (variation asks nothing) lands on
  // Configure, Rule 2 (use-X still asks for the entity) lands on Product;
  // this function never re-derives that rule, it just honours it.
  //
  // In practice the module-side entry points (SendToGenieMenu,
  // FlowModuleDetail) already navigate to an explicit /product or /configure
  // path segment matching landingStep, so `pathStep` above and
  // `flowCtx.landingStep` here agree. Merged AFTER the individual param
  // reads so a flow's own field values win over any stray matching query
  // param on the rarer path where a flow link omits the step segment.
  if (flowCtx) {
    // The explicit :step path segment wins over the flow's landingStep.
    // Otherwise a hard refresh / deep link on /results rendered Step 5 for
    // one paint (its mount effect started a phantom batch) and then bounced
    // to Configure because landingStep (4) overwrote the path's step (5).
    const { step: landingStep, ...flowPatch } = flowInitialPatch(flowCtx);
    Object.assign(patch, flowPatch);
    if (!patch.step) patch.step = landingStep;
    patch.category = "ad"; // flows only ever produce ads, never assets
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
 * Step names for the mobile step-context footer. Below `md` the wizard is
 * one-screen-per-step and the breadcrumb stepper is hidden (it clips hard at
 * 375px — AlphaProgressIndicator is `overflow-hidden` with no ellipsis), so
 * the sticky footer carries "Step N of 4 · Label" instead.
 */
const STEP_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  // §21.2 — Mode + Format merged onto one screen; label reflects both now.
  1: "Mode & Format",
  2: "Product",
  3: "Approach",
  4: "Configure",
  5: "Results",
};

/**
 * StudioAlpha (A-12.26) — Studio Alpha shell.
 *
 * Architecture:
 *   - Home phase: StudioHome — click any available mode card → startWizard.
 *   - Wizard phase: 5 internal steps + a global right-side ContextRail.
 *       Step 1 = Mode & Format (§21.2: merged onto one screen — Mode is now
 *         ALSO changeable here, not only on Home) — AlphaStep1Format
 *       Step 2 = Product — Step2Product
 *       Step 3 = Approach — Step3Approach
 *       Step 4 = Configure — AlphaStep3Configure
 *       Step 5 = Results — Step5Results (final screen, NOT in stepper)
 *   - ContextRail: GLOBAL right rail visible across ALL wizard steps. Shows
 *     overview of selections so far (mode, format, brand, product, angle, KB
 *     instruction, winners). Collapsible — railOpen state persists across
 *     step navigation.
 *   - Click-to-advance: each step auto-advances on selection (no footer buttons).
 *   - Topbar: ← Back (one step back; from step 1 → exits to Home). Because
 *     Mode now lives on step 1 too, Back-to-step-1 is enough to change Mode —
 *     Home is no longer the only way back to it (§21.2).
 *   - AlphaProgressIndicator: 4 steps only (Mode & Format/Product/Approach/
 *     Configure). Hidden on step 5 (Results).
 *   - FlowBanner (§6 Rule 5): mounted above the wizard body, on every step
 *     including Results, whenever ?src/?ref/?act resolve to a FlowContext —
 *     see resolveFlowContext() usage below and readUrlIntoState's flowCtx
 *     branch for how Rules 1 & 2 seed the wizard at construction.
 */
export function StudioAlpha() {
  const navigate = useNavigate();
  const params = useParams<{ step?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  // §6 Rule 5 / Rules 1 & 2 — resolved ONCE per searchParams identity, reused
  // by construction-time hydration below, the phase/step sync effect, and the
  // FlowBanner render. `null` when Studio is running standalone (no ?src).
  const flowCtx = useMemo(() => resolveFlowContext(searchParams), [searchParams]);
  // A-12.49 (Maalik): hydrate wizard.state directly from the URL at construction
  // so deep links and hard refresh land on the correct step + selections
  // BEFORE first paint. Previously this happened via useEffect, which left
  // a one-tick gap where state.step was still 1 — long enough for HTML.to.design
  // (and other headless capture tools) to grab the wrong frame. A flow context
  // hydrates the exact same way (see readUrlIntoState's flowCtx branch) — no
  // extra tick for the flow-entry path either.
  const wizard = useWizard(readUrlIntoState(params.step, searchParams, flowCtx));
  const { state } = wizard;
  // Selections / toggles ↔ URL (?brand, ?product, ?angle, ?ratio, etc.)
  useStudioAlphaUrlSync(wizard);
  // A flow can land the wizard on step 2 or 4 via a URL with NO :step path
  // segment yet (e.g. /studio-alpha?src=trends&ref=...&act=...) — phase must
  // start "wizard" for that case too, not just when a :step segment exists.
  const [phase, setPhase] = useState<AlphaPhase>(() => (params.step || flowCtx ? "wizard" : "home"));
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

  // Mobile-only ContextRail tray. Below `md` the inline aside is
  // `hidden md:flex`, so the rail's real state feedback (brand / product /
  // angle summary, KB counts, winner ads) had NO surface on a phone — and no
  // affordance either, because the floating re-open button only renders while
  // ?rail=closed. This sheet is that surface; its trigger lives in the mobile
  // footer and is ALWAYS present on steps 1-4, independent of ?rail=.
  const [mobileRailOpen, setMobileRailOpen] = useState(false);

  // Count of resolved run-context picks, shown as a badge on the mobile
  // "Context" trigger so the button reads as run state, not decoration.
  const contextCount = [
    state.format,
    state.productId ?? state.brandId ?? state.categoryId,
    state.angleId,
  ].filter(Boolean).length;

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
      // §6 Rules 1 & 2 — a flow lands here with NO :step segment yet
      // (/studio-alpha?src=...&ref=...&act=...). state.step is already
      // flowCtx.landingStep from construction and phase is already "wizard"
      // (see the useState initializer above) — don't force Home. The
      // state→URL effect below pushes the matching /product or /configure
      // slug once urlSyncedRef flips, same as any other step change.
      if (flowCtx) {
        urlSyncedRef.current = true;
        return;
      }
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
      // Preserve the query string across the path change. `searchParams` from
      // this render can be one tick stale relative to useStudioAlphaUrlSync's
      // own state→URL effect (same wizard-state change, same commit, but that
      // hook's setSearchParams call — registered earlier in hook order — runs
      // first and already committed via history.replaceState by the time this
      // effect runs). Reading window.location.search directly picks up that
      // just-committed value instead of the stale closure, so a bare
      // navigate(path) here can't clobber ?format/?brand/... OR the flow's
      // ?src/?ref/?act — all of it rides along on every step change.
      navigate(
        { pathname: `/iq/genie6/studio-alpha/${slug}`, search: window.location.search },
        { replace: false },
      );
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

  // §21.2 — Mode is now ALSO changeable from inside the wizard (merged onto
  // Step 1 alongside Format, see AlphaStep1Format), not only from Home. This
  // is the in-wizard equivalent of startWizard's category derivation, without
  // resetting phase/step/navigating — the user stays exactly where they are.
  const handleModeChange = (mode: AlphaMode) => {
    setHomeMode(mode);
    const category = mode === "product-shoot" ? "asset" : "ad";
    if (state.category !== category) wizard.patch({ category });
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
    // Height: `h-full` at base, `md:h-[100dvh]` restores the desktop value
    // byte-for-byte. On mobile AppLayout already spends part of the 100dvh on
    // MobileTopBar + MobileTabBar (both siblings of the routed outlet), so a
    // hard 100dvh here overflowed the parent's `overflow-hidden` and pushed
    // this wizard's own bottom chrome below the fold — the sticky mobile
    // footer would have been unreachable. h-full fills exactly the space the
    // shell actually gives us.
    <div className="v3-page-mesh flex h-full flex-col overflow-hidden bg-background text-foreground md:h-[100dvh]">
      {phase === "home" && (
        <main className="min-h-0 flex-1 overflow-y-auto">
          <StudioHome onStart={startWizard} />
        </main>
      )}

      {phase === "wizard" && (
        <>
          {/* Topbar: ← Back + progress stepper (hidden on Results) */}
          <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-background/80 px-4 py-2 backdrop-blur md:px-6">
            {/* md:-only. On a phone this sat 54px below the shell's own Back
                chevron and duplicated the sticky footer's Back — three Back
                controls on one screen. The footer's is thumb-reachable, so
                that one wins on mobile. */}
            <button
              type="button"
              onClick={handleBack}
              className="hidden min-h-[44px] items-center gap-1 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground md:inline-flex md:min-h-0 md:py-0"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {state.step > 1 ? "Back" : "Home"}
            </button>
            {showStepper && (
              <>
                <span className="hidden text-muted-foreground/40 md:inline">|</span>
                {/* Breadcrumb stepper — md+ only. At 375px the 4 labels
                    overflow and AlphaProgressIndicator clips them without an
                    ellipsis; the mobile footer carries step context instead. */}
                <div className="hidden flex-1 md:block">
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

          {/* §6 Rule 5 — persistent flow banner. Runs through the WHOLE
              flow, on every step INCLUDING Results (step 5) — mounted here,
              above all step content, rather than inside any one step's
              component, so it survives Step5ResultsQueue owning its own
              chrome below. Source module + reference + action + what will be
              produced come from `ctx`; FlowBanner (Flows UI agent) resolves
              its own exit from ctx.module.modulePath. Lives entirely off the
              URL (?src/?ref/?act) per flowTypes.ts's header comment, so it
              survives step navigation and a hard refresh for free. */}
          {flowCtx && <FlowBanner ctx={flowCtx} className="shrink-0" />}

          {/* Wizard body — flex layout: main content + collapsible rail */}
          <div className="relative flex min-h-0 flex-1">
            {/* Main step content — scrollable */}
            <main className="min-h-0 flex-1 overflow-y-auto">
              {renderStep === 1 && (
                <AlphaStep1Format
                  wizard={wizard}
                  onAdvance={wizard.next}
                  onBack={handleBack}
                  mode={homeMode}
                  onModeChange={handleModeChange}
                />
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
                // Step5ResultsQueue owns its own chrome — BreadcrumbStepper
                // at top, dual-variant queue strip (V1 dense / V2 centered
                // via ?queue=v1|v2), and the PromptDock pinned to the bottom.
                // The legacy done/regenKey/onGenerateAgain/onSaveBatch/onBack
                // props collapse into the dock's submit flow + the
                // BreadcrumbStepper's nav.
                <Step5ResultsQueue
                  wizard={wizard}
                  onStartOver={exitToHome}
                />
              )}
            </main>

            {/* Global ContextRail — visible across wizard steps 1-4 ONLY.
                Hidden on step 5 (Results Queue) per Maalik A-12.183: the
                queue surface owns its own chrome (queue list on left in V3,
                strip on top in V1/V2) and the context rail collides with
                that, eating horizontal space the results grid needs. The
                expander button is also suppressed so the user can't pop
                the rail back open mid-triage.

                If the user navigates back to steps 1-4, the rail honors
                their last open/closed preference from ?rail= URL state. */}
            {renderStep !== 5 && railOpen && (
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
            {/* Floating re-open affordance — renders whenever the rail is
                closed. md+ only: below the breakpoint the inline aside is
                `hidden`, so flipping ?rail= there would do nothing visible.
                The mobile footer's "Context" button is the phone affordance
                and it is always present (see below). */}
            {renderStep !== 5 && !railOpen && (
              <button
                type="button"
                onClick={() => setRailOpen(true)}
                aria-label="Show overview"
                className="group absolute right-3 top-3 z-10 hidden h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-card/80 shadow-md backdrop-blur-md transition-all duration-300 ease-out hover:scale-105 hover:border-foreground/30 hover:bg-card md:inline-flex"
              >
                <PanelRightOpen className="h-4 w-4 text-foreground transition-transform duration-300 group-hover:-rotate-12" />
              </button>
            )}
          </div>

          {/* Mobile step chrome — md:hidden sticky footer. One screen per step
              below `md`, so this bar is the persistent "where am I / how do I
              get back / what's my context" strip. It deliberately has NO Next
              button: every step is click-to-advance (selection advances), and
              step 4 generates from the prompt bar's inline Send. Adding a Next
              here would invent a second, wrong advance path.

              No safe-area padding here on purpose: MobileTabBar is the last
              flex child of AppLayout and already owns the inset — adding it
              again would double-count it. */}
          {renderStep !== 5 && (
            <div className="flex shrink-0 items-center gap-2 border-t border-border bg-background/90 px-3 py-2 backdrop-blur md:hidden">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex h-11 items-center gap-1 rounded-xl px-3 text-[12px] font-semibold text-foreground transition-colors hover:bg-foreground/[0.06]"
              >
                <ChevronLeft className="h-4 w-4" />
                {state.step > 1 ? "Back" : "Home"}
              </button>

              <div className="min-w-0 flex-1 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Step {Math.min(renderStep, 4)} of 4
                </p>
                <p className="truncate text-[12px] font-semibold text-foreground">
                  {STEP_LABELS[Math.min(renderStep, 4) as 1 | 2 | 3 | 4]}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMobileRailOpen(true)}
                aria-label={`Show run context — ${contextCount} of 3 set`}
                className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-border/60 bg-card/70 px-3 text-[12px] font-semibold text-foreground transition-colors hover:border-foreground/30 hover:bg-card"
              >
                <PanelRightClose className="h-4 w-4" />
                Context
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/15 px-1 font-mono text-[10px] font-bold text-primary">
                  {contextCount}
                </span>
              </button>
            </div>
          )}

          {/* ContextRail's mobile home — same component, bottom sheet. */}
          {renderStep !== 5 && (
            <MobileContextRailSheet
              wizard={wizard}
              studioMode={homeMode ?? undefined}
              open={mobileRailOpen}
              onOpenChange={setMobileRailOpen}
            />
          )}
          {/* NO WizardNav footer — all steps are click-to-advance or inline Send */}
        </>
      )}
    </div>
  );
}

export default StudioAlpha;
