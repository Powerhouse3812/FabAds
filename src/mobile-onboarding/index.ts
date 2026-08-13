/**
 * ═══════════════════════════════════════════════════════════════════════
 *  src/mobile-onboarding — PUBLIC SURFACE
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  Flow A, "Set up my feed & Genie": a mobile-native re-cut of the web
 *  onboarding, launched deliberately from the mobile More menu.
 *
 *  ⚠️  NOTHING IN THIS MODULE PERSISTS — no Supabase write, no localStorage,
 *      no `useInsightPreferences().upsert`. It is a pure visual demo and is
 *      fully replayable (there is no "already seen" flag). Full rationale in
 *      the header of `MobileOnboardingFlowA.tsx`.
 *
 *  ── How to mount it ──
 *
 *      import { MobileOnboardingFlowA } from "@/mobile-onboarding";
 *
 *      const [open, setOpen] = useState(false);
 *      // …a "Set up my feed & Genie" row in the More menu calls setOpen(true)
 *      <MobileOnboardingFlowA open={open} onOpenChange={setOpen} />
 *
 *  Props (all documented on `MobileOnboardingFlowAProps`):
 *
 *      open           required   controlled visibility
 *      onOpenChange   required   called with `false` on dismiss or completion
 *      mode           optional   "replay" | "fresh" — pre-answers the launch
 *                                prompt; omit to let the user choose
 *      onComplete     optional   ("genie" | "insights") => void, fired on
 *                                finish; the flow closes itself regardless
 *
 *  The flow renders its own full-screen Dialog, so the caller needs no
 *  wrapper, no portal, and no layout changes. It is dismissible by design
 *  (header ✕ / Escape) because it is menu-launched — see the divergence note
 *  in `components/MobileFlowShell.tsx`.
 */
export { MobileOnboardingFlowA } from "./MobileOnboardingFlowA";

export type {
  MobileOnboardingFlowAProps,
  MobileOnboardingStartMode,
  MobileOnboardingBranch,
} from "./types";
