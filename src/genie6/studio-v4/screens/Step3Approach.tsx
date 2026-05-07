import { ModeCard } from "../components/ModeCard";
import { HeroHeader } from "../components/HeroHeader";
import type { UseWizardReturn } from "../state/useWizard";

interface Step3Props {
  wizard: UseWizardReturn;
}

const PRESET_MODES: {
  emoji: string;
  title: string;
  desc: string;
}[] = [
  {
    emoji: "🔄",
    title: "Create Variations",
    desc: "Iterate on existing creatives — keep layout, colors, or copy.",
  },
  {
    emoji: "🎬",
    title: "UGC Video",
    desc: "Avatar-led, script-first, talking-head.",
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

export function Step3Approach({ wizard }: Step3Props) {
  return (
    <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 pt-4 pb-6">
      {/* Ambient backdrop */}
      <BackdropMesh />

      {/* Hero header — minimal title only */}
      <div className="relative">
        <HeroHeader title="What's your approach?" />
      </div>

      {/* Hero Scratch ModeCard */}
      <section className="relative">
        <ModeCard
          variant="hero"
          emoji="✨"
          title="Scratch · Custom"
          description="Full advanced flow — prompt, references, angle, model, output count, all knobs available."
          recommended
          selected={wizard.state.mode === "scratch"}
          onClick={() => wizard.set("mode", "scratch")}
        />
      </section>

      {/* Section divider */}
      <div className="relative flex items-center gap-3">
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          Coming soon — preset modes
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* Grid of 6 disabled modes */}
      <section className="relative grid grid-cols-3 gap-4">
        {PRESET_MODES.map((m) => (
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

/* ────────────────────────────────────────────────────────── *
 *  Ambient gradient mesh + dot grid — copied from Step1Setup
 *  to keep the same backdrop language across wizard steps.
 * ────────────────────────────────────────────────────────── */
function BackdropMesh() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {/* Lime orb top-left */}
      <div className="absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-primary/15 blur-[120px]" />
      {/* Amber bottom-right */}
      <div className="absolute -bottom-32 -right-32 h-[380px] w-[380px] rounded-full bg-amber-300/15 blur-[120px]" />
      {/* Sky middle */}
      <div className="absolute top-1/3 left-1/2 h-[280px] w-[280px] -translate-x-1/2 rounded-full bg-sky-300/10 blur-[100px]" />
      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />
    </div>
  );
}
