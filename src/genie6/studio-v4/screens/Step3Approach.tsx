import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { HeroHeader } from "../components/HeroHeader";
import type { Mode, UseWizardReturn } from "../state/useWizard";

interface Step3Props {
  wizard: UseWizardReturn;
  onAdvance: () => void;
}

interface ApproachMode {
  id: Mode;
  emoji: string;
  title: string;
  desc: string;
  /** When user picks this mode, auto-set angleId to this. undefined = leave as is. */
  autoAngleId?: string | null;
}

/**
 * Single unified mode list — no "Coming soon" split. All entries are clickable
 * and run the same pickMode flow (advances to next step). Order: UGC Video
 * first, "From scratch" last so users see the special-purpose modes before
 * the catch-all custom flow.
 */
const ALL_MODES: ApproachMode[] = [
  {
    id: "ugc-video",
    emoji: "🎬",
    title: "UGC Video",
    desc: "Avatar-led talking-head, script-first.",
    autoAngleId: "ugc-style",
  },
  {
    id: "create-variations",
    emoji: "🔄",
    title: "Create Variations",
    desc: "Iterate on existing creatives — keep layout, colors, or copy.",
  },
  {
    id: "image-to-video",
    emoji: "🖼️",
    title: "Image to Video",
    desc: "Animate a static image — subtle motion or full AI.",
  },
  {
    id: "broll",
    emoji: "🎥",
    title: "B-Roll",
    desc: "Cutaway footage to layer with primary content.",
  },
  {
    id: "bg-remover",
    emoji: "✂️",
    title: "BG Remover",
    desc: "Strip backgrounds from product shots.",
  },
  {
    id: "resize",
    emoji: "📐",
    title: "Resize",
    desc: "Reformat to platform aspect ratios.",
  },
  {
    id: "scratch",
    emoji: "✨",
    title: "From scratch",
    desc: "Full flow — prompt, references, angle, model, output count.",
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
    <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 pt-8 pb-10">
      {/* Ambient bg — consistent with Step 1 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div
          className="absolute inset-0 text-foreground opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,hsl(74_81%_59%/0.08),transparent_70%)]" />
      </div>

      <HeroHeader title="What's your approach?" />

      {/* Single unified grid — 2 cols mobile, 3 cols md.
          With 7 cards at max-w-2xl, this produces a 3+3+1 layout on desktop. */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {ALL_MODES.map((m) => {
          const selected = wizard.state.mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => pickMode(m.id, m.autoAngleId)}
              className={cn(
                "v3-glass-card group flex flex-col items-center gap-2 rounded-2xl p-5 transition-all",
                selected
                  ? "ring-2 ring-primary/30 shadow-[0_8px_32px_rgba(195,235,66,0.15)]"
                  : "hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md",
              )}
            >
              <span className="text-3xl leading-none">{m.emoji}</span>
              <span className="text-[13px] font-bold text-foreground">
                {m.title}
              </span>
              <span className="line-clamp-2 text-center text-[11px] text-muted-foreground">
                {m.desc}
              </span>
            </button>
          );
        })}
      </section>
    </div>
  );
}
