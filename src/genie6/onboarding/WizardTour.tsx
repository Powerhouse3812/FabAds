import { Sparkles } from "lucide-react";

/**
 * Wizard / Onboarding Tour — STUB.
 *
 * The legacy per-mode Wizard layout was removed (Track 5+). Per Maalik:
 * "drop the wizard type generation from all the modes, and keep it as
 * onboarding flow, in sub nav. keep it there only. will work on this in the last."
 *
 * This stub reserves the route + sub-nav slot. The real onboarding flow
 * (welcome carousel deep-dive · brand setup · first-generation walkthrough)
 * will be built in the final pass after variants land.
 */
export function WizardTour() {
  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-g6-2xl bg-g6-primary-bg">
        <Sparkles className="h-7 w-7 text-g6-primary" />
      </div>
      <h1 className="font-g6-sans text-g6-h1 font-black tracking-[-0.025em] text-g6-text">
        Onboarding tour
      </h1>
      <p className="text-g6-base text-g6-text-secondary max-w-md">
        Coming up — guided walkthrough of brand setup, mode selection, and your first
        winning generation. Built last after the visual variants ship.
      </p>
      <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
        wizard tour · stub
      </p>
    </div>
  );
}
