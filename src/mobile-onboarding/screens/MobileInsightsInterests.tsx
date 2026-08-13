import { INSIGHT_INTERESTS } from "@/lib/insights-dummy-data";
import { MobileFlowShell } from "../components/MobileFlowShell";
import { MobileChipPicker } from "../components/MobileChipPicker";
import { MobileInsightsSeedNote } from "../components/MobileInsightsSeedNote";
import type { MobileOnboardingStartMode } from "../types";

export interface MobileInsightsInterestsProps {
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
 * Insights step 2 of 3 — Interests. Tab 2 of the web 3-tab picker, on its
 * own screen. Options from the shared `INSIGHT_INTERESTS` constant.
 *
 * ⚠️  No persistence. See `useMobileOnboardingSeed.ts`.
 */
export function MobileInsightsInterests({
  onClose,
  onBack,
  onContinue,
  value,
  onChange,
  startMode,
  stepIndex,
  stepCount,
}: MobileInsightsInterestsProps) {
  const empty = value.length === 0;

  return (
    <MobileFlowShell
      eyebrow="Set up your feed"
      stepIndex={stepIndex}
      stepCount={stepCount}
      stepLabel="Interests"
      title={
        <>
          Fine-tune with{" "}
          <span className="rounded bg-primary/30 px-1.5">interests</span>
        </>
      }
      subtitle="Pick interests to fine-tune your feed. These sharpen the ranking inside the industries you chose."
      onBack={onBack}
      onClose={onClose}
      primaryLabel={empty ? "Skip for now" : `Continue · ${value.length} picked`}
      onPrimary={onContinue}
    >
      <MobileInsightsSeedNote startMode={startMode} seededCount={value.length} />

      <MobileChipPicker
        options={INSIGHT_INTERESTS}
        value={value}
        onChange={onChange}
        ariaLabel="Interests"
      />

      {empty && (
        <p className="mt-4 rounded-lg border border-dashed border-border px-3.5 py-3 text-[12px] leading-relaxed text-muted-foreground">
          Nothing selected yet — that's fine. Your feed will follow your
          industries only.
        </p>
      )}
    </MobileFlowShell>
  );
}
