/**
 * ═══════════════════════════════════════════════════════════════════════
 *  Mobile Onboarding — Flow A ("Set up my feed & Genie") · shared types
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  ⚠️  NOTHING IN THIS MODULE PERSISTS. See the header of
 *      `MobileOnboardingFlowA.tsx` for the full rule. No Supabase writes,
 *      no localStorage. Do not add any.
 */

/** Which of the two branches the user picked at Product Chooser. */
export type MobileOnboardingBranch = "genie" | "insights";

/**
 * Genie wizard mode — mirrors `Mode` in
 * `src/onboarding-demo/OnboardingShell.tsx`. What the user wants to START
 * with, which is what drives wizard routing.
 */
export type MobileGenieMode = "ecom" | "affiliate";

/**
 * What kind of marketer the user IS — mirrors `ProfileType` on web.
 * Captured for segmentation only; does not change wizard routing (a "both"
 * user still picks a starting `MobileGenieMode`).
 */
export type MobileProfileType = "ecom" | "affiliate" | "both";

/**
 * How the flow was launched.
 *
 *   "replay" → the Insights pickers open PRE-SEEDED with the workspace's
 *              current preferences, read-only, so the flow reads like
 *              editing an existing setup.
 *   "fresh"  → every picker opens empty.
 *
 * Because nothing is ever written back, this seed is the ONLY thing that
 * makes the two launch choices differ. See `useMobileOnboardingSeed`.
 */
export type MobileOnboardingStartMode = "replay" | "fresh";

/** A market option in the Country step. */
export interface MobileCountry {
  code: string;
  name: string;
  flag: string;
}

/**
 * Every screen the flow can render, in flow order.
 *
 *   launch-prompt        Replay vs Start fresh (skipped when `mode` is passed)
 *   welcome              plain welcome — NO payment-status variants
 *   product-chooser      Genie vs Industry Insights
 *
 *   Genie branch:        genie-mode → genie-country* → genie-input →
 *                        genie-processing → genie-done
 *                        (*country is skipped for the affiliate mode, same
 *                         as web, where AffiliateInput carries its own
 *                         optional country field)
 *
 *   Insights branch:     insights-industries → insights-interests →
 *                        insights-brands
 *                        (the web 3-TAB picker, re-cut as one tab per screen)
 */
export type MobileOnboardingScreen =
  | "launch-prompt"
  | "welcome"
  | "product-chooser"
  | "genie-mode"
  | "genie-country"
  | "genie-input"
  | "genie-processing"
  | "genie-done"
  | "insights-industries"
  | "insights-interests"
  | "insights-brands";

/**
 * Public props for the flow. Kept deliberately small — another agent wires
 * this into the mobile More menu.
 */
export interface MobileOnboardingFlowAProps {
  /** Controlled visibility. */
  open: boolean;
  /** Called with `false` on any dismissal or completion. */
  onOpenChange: (open: boolean) => void;
  /**
   * Pre-answer the launch prompt. Omit (the default) to let the user pick
   * "Replay" vs "Start fresh" on the first screen.
   */
  mode?: MobileOnboardingStartMode;
  /**
   * Optional completion hook — fired when the user finishes either branch
   * (Genie "Start Creating" / Insights "Finish setup"). The flow closes
   * itself either way; this is purely so the caller can navigate.
   */
  onComplete?: (branch: MobileOnboardingBranch) => void;
}
