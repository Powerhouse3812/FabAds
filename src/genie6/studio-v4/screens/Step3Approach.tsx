import { useEffect } from "react";
import { ModeCard } from "../components/ModeCard";
import { HeroHeader } from "../components/HeroHeader";
import type { Mode, UseWizardReturn } from "../state/useWizard";

interface Step3Props {
  wizard: UseWizardReturn;
  onAdvance: () => void;
}

interface ActiveMode {
  id: Mode;
  emoji: string;
  title: string;
  desc: string;
  /** When user picks this mode, auto-set angleId to this. null = clear. */
  autoAngleId?: string | null;
}

const ACTIVE_MODES: ActiveMode[] = [
  {
    id: "ugc-video",
    emoji: "🎬",
    title: "UGC Video",
    desc: "Avatar-led, script-first, talking-head. Angle pre-selected as UGC Style.",
    autoAngleId: "ugc-style",
  },
];

const DISABLED_MODES: { emoji: string; title: string; desc: string }[] = [
  {
    emoji: "🔄",
    title: "Create Variations",
    desc: "Iterate on existing creatives — keep layout, colors, or copy.",
  },
  {
    emoji: "🖼️",
    title: "Image-to-Video",
    desc: "Animate a static image — subtle motion or full AI.",
  },
  {
    emoji: "🎥",
    title: "B-Roll",
    desc: "Cutaway footage to layer with primary content.",
  },
  {
    emoji: "✂️",
    title: "BG Remover",
    desc: "Strip backgrounds from product shots.",
  },
  {
    emoji: "📐",
    title: "Resize",
    desc: "Reformat to platform aspect ratios.",
  },
];

export function Step3Approach({ wizard, onAdvance }: Step3Props) {
  // Auto-select "scratch" on mount if nothing is selected yet.
  useEffect(() => {
    if (!wizard.state.mode) {
      wizard.set("mode", "scratch");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mode picker handler — also auto-sets angleId where the mode profile
  // calls for it (UGC Video → ugc-style angle).
  const pickMode = (mode: Mode, autoAngleId?: string | null) => {
    if (autoAngleId !== undefined) {
      wizard.patch({ mode, angleId: autoAngleId });
    } else {
      wizard.set("mode", mode);
    }
    onAdvance();
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 pt-8 pb-10">
      <HeroHeader title="What's your approach?" />

      {/* Active modes — Custom first (equal-priority grid, no hero variant) */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {/* Custom / Scratch — first, auto-selected */}
        <ModeCard
          variant="grid"
          emoji="✨"
          title="Custom"
          description="Full flow — prompt, references, angle, model, output count."
          selected={wizard.state.mode === "scratch"}
          onClick={() => pickMode("scratch", null)}
        />
        {ACTIVE_MODES.map((m) => (
          <ModeCard
            key={m.id}
            variant="grid"
            emoji={m.emoji}
            title={m.title}
            description={m.desc}
            selected={wizard.state.mode === m.id}
            onClick={() => pickMode(m.id, m.autoAngleId)}
          />
        ))}
      </section>

      {/* Coming soon divider */}
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
          Coming soon
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* Disabled preset modes */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {DISABLED_MODES.map((m) => (
          <ModeCard
            key={m.title}
            variant="grid"
            emoji={m.emoji}
            title={m.title}
            description={m.desc}
            disabled
          />
        ))}
      </section>
    </div>
  );
}

