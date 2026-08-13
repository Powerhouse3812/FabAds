/**
 * ═══════════════════════════════════════════════════════════════════════
 *  Flow A — "Set up my feed & Genie" · mobile-native onboarding
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  A phone-native re-cut of the web onboarding in `src/onboarding-demo/`,
 *  launched deliberately from the mobile More menu (another module owns that
 *  menu entry — this file only exports the flow).
 *
 *  ── ⚠️  NOTHING PERSISTS. READ THIS BEFORE EDITING. ──
 *
 *  This is a pure VISUAL DEMO. Across every file in `src/mobile-onboarding/`
 *  there is:
 *    · no Supabase write of any kind,
 *    · no localStorage / sessionStorage / cookie write,
 *    · no call to `useInsightPreferences().upsert` or `.toggleFollowBrand`
 *      (the mutation surface is never even destructured — the single READ
 *      lives in `useMobileOnboardingSeed.ts` and is documented there),
 *    · no "already seen" / "completed" flag, which is what makes the flow
 *      fully replayable, every time, forever.
 *
 *  Every pick the user makes lives in this component's React state and is
 *  discarded when the flow closes. That is deliberate product direction from
 *  Maalik, not an unfinished TODO. Do not "finish" it by wiring persistence.
 *
 *  ── Screen order ──
 *
 *    launch-prompt        Replay vs Start fresh  (skipped when `mode` is passed)
 *      ↓
 *    welcome              plain — web's 3 payment-status variants are dropped
 *      ↓
 *    product-chooser      Genie  ·  Industry Insights
 *      ↓                        ↓
 *    ── Genie branch ──         ── Insights branch ──
 *    genie-mode                 insights-industries
 *    genie-country  (ecom only) insights-interests
 *    genie-input                insights-brands
 *    genie-processing
 *    genie-done
 *
 *  The Insights branch is the web 3-TAB preferences picker
 *  (`src/components/insights/OnboardingModal.tsx`) re-cut as a stepper —
 *  one tab per screen — NOT the shell's single-screen "Insights Quick Setup".
 *
 *  ── Dismissibility (deliberate divergence from web) ──
 *
 *  Web wraps this flow in a non-dismissible Dialog
 *  (`FirstLoginOnboardingModal.tsx`) because it fires automatically on first
 *  login. Here the user opened it on purpose from a menu, so a mis-tap has to
 *  be recoverable: there is a persistent ✕ on every screen and Escape works.
 *  Outside-click still does NOT dismiss — that is the standing app-wide rule
 *  (2026-08-01), enforced inside `ui/dialog.tsx`. Explicit control only.
 */
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MobileLaunchPrompt } from "./screens/MobileLaunchPrompt";
import { MobileWelcome } from "./screens/MobileWelcome";
import { MobileProductChooser } from "./screens/MobileProductChooser";
import { MobileChooseMode } from "./screens/MobileChooseMode";
import { MobileCountry } from "./screens/MobileCountry";
import { MobileEcommerceInput } from "./screens/MobileEcommerceInput";
import { MobileAffiliateInput } from "./screens/MobileAffiliateInput";
import { MobileProcessing } from "./screens/MobileProcessing";
import { MobileDone } from "./screens/MobileDone";
import { MobileInsightsIndustries } from "./screens/MobileInsightsIndustries";
import { MobileInsightsInterests } from "./screens/MobileInsightsInterests";
import { MobileInsightsBrands } from "./screens/MobileInsightsBrands";
import { useMobileOnboardingSeed } from "./useMobileOnboardingSeed";
import type {
  MobileCountry as Country,
  MobileGenieMode,
  MobileOnboardingBranch,
  MobileOnboardingFlowAProps,
  MobileOnboardingScreen,
  MobileOnboardingStartMode,
  MobileProfileType,
} from "./types";

/**
 * Step order per branch, used to derive the "Step N of M" indicator.
 * The affiliate path has one fewer step because — exactly as on web — it
 * skips the standalone Country screen and carries an optional country field
 * inside its own input screen instead.
 */
const GENIE_STEPS: Record<MobileGenieMode, MobileOnboardingScreen[]> = {
  ecom: [
    "genie-mode",
    "genie-country",
    "genie-input",
    "genie-processing",
    "genie-done",
  ],
  affiliate: ["genie-mode", "genie-input", "genie-processing", "genie-done"],
};

const INSIGHTS_STEPS: MobileOnboardingScreen[] = [
  "insights-industries",
  "insights-interests",
  "insights-brands",
];

export function MobileOnboardingFlowA({
  open,
  onOpenChange,
  mode,
  onComplete,
}: MobileOnboardingFlowAProps) {
  /* ── Flow position ─────────────────────────────────────────────────── */
  const [screen, setScreen] = useState<MobileOnboardingScreen>(
    mode ? "welcome" : "launch-prompt",
  );
  const [startMode, setStartMode] = useState<MobileOnboardingStartMode | null>(
    mode ?? null,
  );

  /* ── Genie branch answers ──────────────────────────────────────────── */
  const [genieMode, setGenieMode] = useState<MobileGenieMode>("ecom");
  const [, setProfileType] = useState<MobileProfileType>("ecom");
  const [country, setCountry] = useState<Country | null>(null);
  const [brandUrl, setBrandUrl] = useState("");
  const [category, setCategory] = useState("");

  /* ── Insights branch answers (in-memory only, never written) ───────── */
  const [industries, setIndustries] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  /**
   * Read-only look at the workspace's current preferences. Enabled whenever
   * the flow is open so the launch prompt can honestly report how much a
   * "Replay" would pre-fill. Applying it is gated on `startMode === "replay"`
   * below — that is what makes "Start fresh" genuinely blank.
   */
  const seed = useMobileOnboardingSeed(open);
  const [seedApplied, setSeedApplied] = useState(false);

  /* ── Full reset on every open ──────────────────────────────────────────
   * There is deliberately no persisted "already completed" flag, so opening
   * the flow always starts it from the top. This is the replayability
   * guarantee — do not memoize it away.
   */
  useEffect(() => {
    if (!open) return;
    setScreen(mode ? "welcome" : "launch-prompt");
    setStartMode(mode ?? null);
    setGenieMode("ecom");
    setProfileType("ecom");
    setCountry(null);
    setBrandUrl("");
    setCategory("");
    setIndustries([]);
    setInterests([]);
    setBrands([]);
    setSeedApplied(false);
  }, [open, mode]);

  /* ── Replay seeding ───────────────────────────────────────────────────
   * Applied once per run, and only for a Replay. Waits for `isReady` so a
   * slow read can't leave a Replay run looking like a fresh one.
   */
  useEffect(() => {
    if (!open || startMode !== "replay" || seedApplied || !seed.isReady) return;
    setIndustries(seed.industries);
    setInterests(seed.interests);
    setBrands(seed.brands);
    setSeedApplied(true);
  }, [open, startMode, seedApplied, seed]);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  const finish = useCallback(
    (branch: MobileOnboardingBranch) => {
      // A toast, not a save. The wording is deliberate: it must not imply
      // that anything was written.
      toast("Walkthrough complete", {
        description:
          branch === "genie"
            ? "This was a preview — your workspace is unchanged."
            : "This was a preview — your feed preferences are unchanged.",
      });
      onComplete?.(branch);
      close();
    },
    [close, onComplete],
  );

  /* ── Step indicator maths ──────────────────────────────────────────── */
  const genieSteps = GENIE_STEPS[genieMode];
  const genieStepIndex = genieSteps.indexOf(screen) + 1;
  const insightsStepIndex = INSIGHTS_STEPS.indexOf(screen) + 1;

  /* ── Screen router ─────────────────────────────────────────────────── */
  const renderScreen = () => {
    switch (screen) {
      case "launch-prompt":
        return (
          <MobileLaunchPrompt
            onClose={close}
            seedLoading={seed.isLoading}
            seedCount={
              seed.industries.length + seed.interests.length + seed.brands.length
            }
            onPick={(picked) => {
              setStartMode(picked);
              setSeedApplied(false);
              setScreen("welcome");
            }}
          />
        );

      case "welcome":
        return (
          <MobileWelcome
            onClose={close}
            // No Back when the caller pre-answered the launch prompt —
            // there is no earlier screen to return to.
            onBack={mode ? undefined : () => setScreen("launch-prompt")}
            onContinue={() => setScreen("product-chooser")}
          />
        );

      case "product-chooser":
        return (
          <MobileProductChooser
            onClose={close}
            onBack={() => setScreen("welcome")}
            onPick={(branch) =>
              setScreen(branch === "genie" ? "genie-mode" : "insights-industries")
            }
          />
        );

      /* ── Genie branch ────────────────────────────────────────────── */
      case "genie-mode":
        return (
          <MobileChooseMode
            onClose={close}
            onBack={() => setScreen("product-chooser")}
            stepIndex={genieStepIndex}
            stepCount={genieSteps.length}
            onContinue={(pickedMode, profile) => {
              setGenieMode(pickedMode);
              setProfileType(profile);
              // Affiliate skips the standalone Country screen, same as web.
              setScreen(pickedMode === "ecom" ? "genie-country" : "genie-input");
            }}
          />
        );

      case "genie-country":
        return (
          <MobileCountry
            onClose={close}
            onBack={() => setScreen("genie-mode")}
            selected={country?.code}
            stepIndex={genieStepIndex}
            stepCount={genieSteps.length}
            onContinue={(picked) => {
              setCountry(picked);
              setScreen("genie-input");
            }}
          />
        );

      case "genie-input":
        return genieMode === "affiliate" ? (
          <MobileAffiliateInput
            onClose={close}
            onBack={() => setScreen("genie-mode")}
            stepIndex={genieStepIndex}
            stepCount={genieSteps.length}
            onContinue={(data) => {
              setCategory(data.category);
              setScreen("genie-processing");
            }}
          />
        ) : (
          <MobileEcommerceInput
            onClose={close}
            onBack={() => setScreen("genie-country")}
            initialBrandUrl={brandUrl}
            stepIndex={genieStepIndex}
            stepCount={genieSteps.length}
            onContinue={(data) => {
              setBrandUrl(data.brandUrl);
              setScreen("genie-processing");
            }}
          />
        );

      case "genie-processing":
        return (
          <MobileProcessing
            onClose={close}
            onBack={() => setScreen("genie-input")}
            mode={genieMode}
            stepIndex={genieStepIndex}
            stepCount={genieSteps.length}
            onDone={() => setScreen("genie-done")}
          />
        );

      case "genie-done":
        return (
          <MobileDone
            onClose={close}
            // Back skips Processing and lands on Input — returning to a
            // finished progress animation just to watch it replay is a
            // dead end, not a step.
            onBack={() => setScreen("genie-input")}
            mode={genieMode}
            brandUrl={brandUrl}
            category={category}
            stepIndex={genieStepIndex}
            stepCount={genieSteps.length}
            onStart={() => finish("genie")}
          />
        );

      /* ── Insights branch — the 3-tab picker, one tab per screen ───── */
      case "insights-industries":
        return (
          <MobileInsightsIndustries
            onClose={close}
            onBack={() => setScreen("product-chooser")}
            value={industries}
            onChange={setIndustries}
            startMode={startMode ?? "fresh"}
            stepIndex={insightsStepIndex}
            stepCount={INSIGHTS_STEPS.length}
            onContinue={() => setScreen("insights-interests")}
          />
        );

      case "insights-interests":
        return (
          <MobileInsightsInterests
            onClose={close}
            onBack={() => setScreen("insights-industries")}
            value={interests}
            onChange={setInterests}
            startMode={startMode ?? "fresh"}
            stepIndex={insightsStepIndex}
            stepCount={INSIGHTS_STEPS.length}
            onContinue={() => setScreen("insights-brands")}
          />
        );

      case "insights-brands":
        return (
          <MobileInsightsBrands
            onClose={close}
            onBack={() => setScreen("insights-interests")}
            value={brands}
            onChange={setBrands}
            startMode={startMode ?? "fresh"}
            stepIndex={insightsStepIndex}
            stepCount={INSIGHTS_STEPS.length}
            onFinish={() => finish("insights")}
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={
          // Full-bleed phone sheet: cancel the centred `max-w-lg` card
          // geometry from `ui/dialog.tsx` and own the whole viewport.
          // `100dvh` (not `100vh`) so the iOS URL bar can't push the sticky
          // footer off-screen.
          "left-0 top-0 h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 " +
          "flex flex-col gap-0 overflow-hidden rounded-none border-0 p-0 " +
          // Hide the built-in 16px close affordance — it is far under the
          // 44px touch minimum. `MobileFlowShell` renders a 44px ✕ instead.
          // Direct-child selector, so only Radix's own Close is hit.
          "[&>button]:hidden"
        }
        // `ui/dialog.tsx` bakes in a centred-card entrance (slide from
        // left-1/2 + top-48%, zoom-95). tailwind-merge does NOT dedupe
        // `tailwindcss-animate`'s slide/zoom utilities, so overriding them by
        // class is unreliable — the animation reads these CSS variables, and
        // an inline style beats any class. Net result: a clean fade for a
        // full-bleed sheet instead of a diagonal slide of the whole screen.
        style={
          {
            "--tw-enter-translate-x": "0",
            "--tw-enter-translate-y": "0",
            "--tw-exit-translate-x": "0",
            "--tw-exit-translate-y": "0",
            "--tw-enter-scale": "1",
            "--tw-exit-scale": "1",
          } as CSSProperties
        }
        // Escape + the header ✕ are the exits. Outside-click is already
        // blocked for every Dialog in this app (see ui/dialog.tsx).
        aria-describedby={undefined}
      >
        {/* Radix requires an accessible name on the dialog. The visible per-
            screen <h1> lives inside the shell, so this one is SR-only and
            stable across screens. */}
        <DialogTitle className="sr-only">Set up my feed &amp; Genie</DialogTitle>
        {/* `key` forces a clean remount per screen — resets body scroll and
            any local field state instead of leaking it across steps. */}
        <div key={screen} className="flex min-h-0 flex-1 flex-col">
          {renderScreen()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
