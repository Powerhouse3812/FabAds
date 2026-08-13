/**
 * Flow B — "Mobile tour". Public surface.
 *
 * A second, separate new-user flow for the phone shell, launched from the More
 * menu. Deliberately NOT merged with Flow A (`src/mobile-onboarding/`).
 *
 * Shape: 3 full-screen welcome screens → a 4-item getting-started checklist
 * that deep-links into the real surfaces. Tick state persists in localStorage
 * under `fabads.mobileTour.v1`.
 *
 * ─── Mounting, in two lines each ────────────────────────────────────────────
 *
 * 1. The More menu entry (handles the Replay vs Start fresh prompt itself):
 *
 *      const [tourOpen, setTourOpen] = useState(false);
 *      <button onClick={() => setTourOpen(true)}>Mobile tour</button>
 *      <MobileTourLauncher open={tourOpen} onOpenChange={setTourOpen} />
 *
 * 2. The checklist card on the mobile home (Dashboard). No props needed — it
 *    hides itself on desktop, once dismissed, and owns its own overlay:
 *
 *      <MobileTourChecklistCard />
 *
 * ─── Ticking ────────────────────────────────────────────────────────────────
 * `done` is MANUAL ONLY — the user taps the circle. `opened` (the user tapped a
 * step's deep link) is auto-detected and shown as such. See the header of
 * `useMobileTourProgress.ts` for why completion is not inferred.
 */

/* ── flow entry ─────────────────────────────────────────────────────────── */

/** Menu-facing entry. Prompts Replay vs Start fresh when there is progress to protect. */
export { default as MobileTourLauncher } from "@/mobile-tour/MobileTourLauncher";
export type { MobileTourLauncherProps } from "@/mobile-tour/MobileTourLauncher";

/** The overlay itself, for callers that want to skip the prompt and pick a mode. */
export { default as MobileTourFlow } from "@/mobile-tour/MobileTourFlow";
export type {
  MobileTourFlowProps,
  MobileTourMode,
  MobileTourStartAt,
} from "@/mobile-tour/MobileTourFlow";

/* ── the checklist's home on the mobile landing screen ───────────────────── */

export { MobileTourChecklistCard } from "@/mobile-tour/MobileTourChecklistCard";
export type { MobileTourChecklistCardProps } from "@/mobile-tour/MobileTourChecklistCard";

/* ── progress: hook, reset, and the mutators the UI uses ─────────────────── */

export {
  MOBILE_TOUR_STEP_IDS,
  MOBILE_TOUR_STORAGE_KEY,
  getMobileTourProgress,
  markMobileTourStepDone,
  markMobileTourStepOpened,
  markMobileTourWelcomeSeen,
  /** "Start fresh": clears ticks, welcome-seen and card dismissal, and removes the key. */
  resetMobileTour,
  setMobileTourCardDismissed,
  setMobileTourStepStatus,
  toggleMobileTourStepDone,
  useMobileTourProgress,
} from "@/mobile-tour/useMobileTourProgress";
export type {
  MobileTourProgress,
  MobileTourStepId,
  MobileTourStepStatus,
} from "@/mobile-tour/useMobileTourProgress";

/* ── content, exported for tests and for a future copy review ───────────── */

export {
  DESKTOP_ONLY_SURFACES,
  MOBILE_OPEN_SURFACES,
  TOUR_CHECKLIST,
  TOUR_TABS,
  TOUR_WELCOME_SCREENS,
  isTourTargetReachable,
} from "@/mobile-tour/tourContent";
export type {
  TourChecklistItem,
  TourDesktopOnlySurface,
  TourSurface,
  TourTab,
  TourWelcomeScreen,
} from "@/mobile-tour/tourContent";
