import { INSIGHT_INDUSTRIES } from "@/lib/insights-dummy-data";
import { MobileFlowShell } from "../components/MobileFlowShell";
import { MobileChipPicker } from "../components/MobileChipPicker";
import { MobileInsightsSeedNote } from "../components/MobileInsightsSeedNote";
import type { MobileOnboardingStartMode } from "../types";

export interface MobileInsightsIndustriesProps {
  onClose: () => void;
  onBack: () => void;
  onContinue: () => void;
  value: string[];
  onChange: (next: string[]) => void;
  startMode: MobileOnboardingStartMode;
  stepIndex: number;
  stepCount: number;
}

/**
 * Insights step 1 of 3 — Industries.
 *
 * This is tab 1 of the web 3-tab picker
 * (`src/components/insights/OnboardingModal.tsx`), re-cut as its own screen.
 * Options come from the same `INSIGHT_INDUSTRIES` constant, so the two
 * surfaces can never drift.
 *
 * ⚠️  No persistence. Selections live in the parent flow's React state and
 *     die when the flow closes. `useInsightPreferences().upsert` is NOT
 *     imported here — see `useMobileOnboardingSeed.ts`.
 *
 * Skippable: web gates its single Save button on "at least one pick across
 * all three tabs". A stepper can't enforce that per screen without trapping
 * the user, so each step is skippable and the primary label says which it is.
 */
export function MobileInsightsIndustries({
  onClose,
  onBack,
  onContinue,
  value,
  onChange,
  startMode,
  stepIndex,
  stepCount,
}: MobileInsightsIndustriesProps) {
  const empty = value.length === 0;

  return (
    <MobileFlowShell
      eyebrow="Set up your feed"
      stepIndex={stepIndex}
      stepCount={stepCount}
      stepLabel="Industries"
      title={
        <>
          Pick your{" "}
          <span className="rounded bg-primary/30 px-1.5">industries</span>
        </>
      }
      subtitle="Choose industries to personalize your feed. We'll surface winning ads, top performing landing pages, and emerging trends — updated daily."
      onBack={onBack}
      onClose={onClose}
      primaryLabel={empty ? "Skip for now" : `Continue · ${value.length} picked`}
      onPrimary={onContinue}
    >
      <MobileInsightsSeedNote startMode={startMode} seededCount={value.length} />

      <MobileChipPicker
        options={INSIGHT_INDUSTRIES}
        value={value}
        onChange={onChange}
        ariaLabel="Industries"
      />

      {/* Zero-selection state — reassurance, not an error. */}
      {empty && (
        <p className="mt-4 rounded-lg border border-dashed border-border px-3.5 py-3 text-[12px] leading-relaxed text-muted-foreground">
          Nothing selected yet. Tap any industry above, or skip — you can set
          this later from <span className="font-mono text-foreground/80">My Feeds</span> →
          Settings.
        </p>
      )}
    </MobileFlowShell>
  );
}
