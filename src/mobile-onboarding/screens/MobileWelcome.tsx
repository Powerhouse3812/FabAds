import {
  Image as ImageIcon,
  Play,
  Sparkles,
  Star,
  Telescope,
  TrendingUp,
  Zap,
} from "lucide-react";
import { MobileFlowShell } from "../components/MobileFlowShell";

export interface MobileWelcomeProps {
  onClose: () => void;
  onBack?: () => void;
  onContinue: () => void;
}

/**
 * Welcome — PLAIN. One version only.
 *
 * Web renders three payment-status variants at this step (success /
 * failed / stuck-waiting, plus a "Demo status" toggle pill — see
 * `OnboardingShell.tsx` → `WelcomeStatusShell`). All three are dropped
 * here by design: this flow is opened from the More menu by an already
 * paid-up, signed-in user, so a payment verdict is not part of the story
 * and a status toggle would be pure noise on a phone.
 *
 * Copy is lifted from the "common" (product-agnostic) variant of
 * `src/onboarding-demo/steps/Welcome.tsx` — the one that does not lead with
 * payment — minus its "Payment confirmed" eyebrow, confetti burst, and
 * "Preview payment screen" link.
 */

const STATS: { icon: typeof Sparkles; value: string; label: string }[] = [
  { icon: Telescope, value: "50M+", label: "Ads analyzed" },
  { icon: Star, value: "12K+", label: "Marketers trust us" },
  { icon: TrendingUp, value: "4.2×", label: "Avg. ROAS lift" },
  { icon: Zap, value: "<60s", label: "First creative ready" },
];

const FEATURES: { icon: typeof Sparkles; label: string }[] = [
  { icon: Sparkles, label: "Genie Creative Generation" },
  { icon: Telescope, label: "Industry Insights" },
  { icon: Play, label: "Video Sage Analysis" },
  { icon: ImageIcon, label: "Creative Library" },
];

export function MobileWelcome({
  onClose,
  onBack,
  onContinue,
}: MobileWelcomeProps) {
  return (
    <MobileFlowShell
      eyebrow="Welcome"
      title={
        <>
          Your unfair{" "}
          <span className="rounded bg-primary/30 px-1.5">advantage</span> starts
          now.
        </>
      }
      subtitle="Creative generation, competitor intelligence, and everything in between — set up in a couple of minutes."
      onBack={onBack}
      onClose={onClose}
      primaryLabel="Let's get started"
      onPrimary={onContinue}
      footerNote="Choose your path · Takes under 2 minutes"
    >
      {/* Brag stats — 2×2 on a phone instead of web's 1×4 row. */}
      <div className="grid grid-cols-2 gap-2.5">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="flex flex-col items-center rounded-xl border border-border bg-card px-3 py-3.5 text-center"
            >
              <Icon className="mb-1.5 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              <div className="font-mono text-[22px] font-bold leading-none tabular-nums text-foreground">
                {s.value}
              </div>
              <div className="mt-1.5 text-[11px] leading-tight text-muted-foreground">
                {s.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature list — stacked rows, not web's centred wrap. */}
      <ul className="mt-4 flex flex-col gap-2.5">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <li key={f.label} className="flex items-center gap-2.5">
              <span
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-foreground"
                aria-hidden
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="text-[13px] text-foreground">{f.label}</span>
            </li>
          );
        })}
      </ul>
    </MobileFlowShell>
  );
}
