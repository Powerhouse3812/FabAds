import { useState } from "react";
import { Eye, Sparkles } from "lucide-react";
import { MobileFlowShell } from "../components/MobileFlowShell";
import { MobileOptionCard } from "../components/MobileOptionCard";
import type { MobileOnboardingBranch } from "../types";

export interface MobileProductChooserProps {
  onClose: () => void;
  onBack: () => void;
  onPick: (branch: MobileOnboardingBranch) => void;
}

/**
 * Product Chooser — the branch point.
 *
 * Copy lifted verbatim from `src/onboarding-demo/steps/ProductChooser.tsx`.
 * Difference from web: web's cards commit on tap; here the tap SELECTS and
 * the sticky footer commits. On a phone a scroll-flick can land as a tap, and
 * this choice forks the entire rest of the flow — a two-beat commit is the
 * cheap insurance (NN/g #5, error prevention).
 */

const OPTIONS: {
  id: MobileOnboardingBranch;
  icon: typeof Sparkles;
  title: string;
  kicker: string;
  desc: string;
  features: string[];
}[] = [
  {
    id: "genie",
    icon: Sparkles,
    title: "Setup your Genie",
    kicker: "AI Creative Generation",
    desc: "Generate high performing ad creatives with AI. Static images, videos, and carousel ads — ready to launch in under 60 seconds.",
    features: [
      "AI powered creatives",
      "Bulk launch ready",
      "Multi platform formats",
      "Brand kit integration",
    ],
  },
  {
    id: "insights",
    icon: Eye,
    title: "Industry Insights",
    kicker: "Competitor Intelligence",
    desc: "Spy on what your competitors are running. See their top performing ads, landing pages, and creative strategies — updated daily.",
    features: [
      "Competitor ad library",
      "Winning creative alerts",
      "Landing page analysis",
      "Trend detection",
    ],
  },
];

export function MobileProductChooser({
  onClose,
  onBack,
  onPick,
}: MobileProductChooserProps) {
  const [picked, setPicked] = useState<MobileOnboardingBranch | null>(null);

  return (
    <MobileFlowShell
      eyebrow="One more thing"
      title={
        <>
          What do you want to do{" "}
          <span className="rounded bg-primary/30 px-1.5">first</span>?
        </>
      }
      subtitle="Pick one to get started — you can always access both from your dashboard."
      onBack={onBack}
      onClose={onClose}
      primaryLabel="Continue"
      primaryDisabled={picked === null}
      onPrimary={() => picked && onPick(picked)}
      footerNote="You'll have access to everything · This just sets up your first workflow"
    >
      <div className="flex flex-col gap-2.5">
        {OPTIONS.map((opt) => (
          <MobileOptionCard
            key={opt.id}
            icon={opt.icon}
            kicker={opt.kicker}
            title={opt.title}
            blurb={opt.desc}
            bullets={opt.features}
            selected={picked === opt.id}
            onSelect={() => setPicked(opt.id)}
          />
        ))}
      </div>
    </MobileFlowShell>
  );
}
