import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Film,
  Maximize2,
  Mic,
  Repeat,
  Scissors,
  Video,
  Wand2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { HeroHeader } from "../components/HeroHeader";
import type { Mode, UseWizardReturn } from "../state/useWizard";
import {
  APPROACH_SUBTYPES,
  APPROACHES_BY_FORMAT,
  autoFillForApproach,
  hasSubTypes,
} from "../data/approach-subtypes";
import { getApproachVisual } from "../data/studio-visuals";
import { PreviewVideo as PreviewVideoBase } from "../components/PreviewVideo";

interface Step3Props {
  wizard: UseWizardReturn;
  onAdvance: () => void;
  onBack?: () => void;
}

interface ApproachMode {
  id: Mode;
  Icon: React.ElementType;
  title: string;
  desc: string;
}

/**
 * §5 lists SEVEN approaches and §1 says they "already exist and work — do not
 * rebuild them", so all seven stay here.
 *
 * §21.2's fix for the on-screen contradiction is FILTERING, not deletion, and
 * its own two examples prove which way each one filters: "Format=Image still
 * offers *Image to Video*" (so Image to Video is video-only) and "Format=Video
 * still offers *BG Remover* and *Resize*" (so those two are image-only). That
 * mapping lives in APPROACHES_BY_FORMAT — see its doc comment.
 *
 * An earlier pass read §8's "BG Remover, Resize, Create Variations and Image to
 * Video are tools/apps — not approaches" as an instruction to delete all four
 * and hand off to Other Apps. That produced two worse problems: none of the
 * four is among §8's locked 15 apps, so the hand-off was a dead end and the
 * capabilities existed nowhere; and Format=Image collapsed to a single offered
 * approach, i.e. a step that asks a question with one answer. §8's line governs
 * how the Other Apps registry is built, not what this step offers.
 *
 * A-12.71 (Maalik, MOM 06-05): the Approach step is VISUAL. Each card leads
 * with an autoplay-loop video preview (getApproachVisual) instead of just an
 * icon. The lucide icon survives as a small glass badge on the poster. Modes
 * that branch (ugc-video, create-variations, image-to-video) reveal a "Choose a
 * style" row of sub-type cards instead of advancing immediately; the rest
 * advance on click.
 */
const ALL_MODES: ApproachMode[] = [
  {
    id: "ugc-video",
    Icon: Mic,
    title: "UGC Video",
    desc: "Avatar-led talking-head, script-first.",
  },
  {
    id: "create-variations",
    Icon: Repeat,
    title: "Create Variations",
    desc: "Iterate on existing creatives — keep layout, colors, or copy.",
  },
  {
    id: "image-to-video",
    Icon: Video,
    title: "Image to Video",
    desc: "Animate a static image — subtle motion or full AI.",
  },
  {
    id: "broll",
    Icon: Film,
    title: "B-Roll",
    desc: "Cutaway footage to layer with primary content.",
  },
  {
    id: "bg-remover",
    Icon: Scissors,
    title: "BG Remover",
    desc: "Strip backgrounds from product shots.",
  },
  {
    id: "resize",
    Icon: Maximize2,
    title: "Resize",
    desc: "Reformat to platform aspect ratios.",
  },
  {
    id: "scratch",
    Icon: Wand2,
    title: "From scratch",
    desc: "Full flow — prompt, references, angle, model, output count.",
  },
];

/** Path owned by the Apps UI agent (OtherApps.tsx). Not a route I own — just
 *  a Link target, per §6/§8's hand-off for the four removed approaches. */
const OTHER_APPS_PATH = "/iq/genie6/apps";

/** Shared autoplay-loop video preview (muted + playsInline required for
 *  autoplay). Poster covers slow loads. preload="metadata" keeps it cheap —
 *  the pool is ~8 URLs so the browser caches across every tile. */
function PreviewVideo({
  seed,
  className,
}: {
  seed: string;
  className?: string;
}) {
  const { poster, video } = getApproachVisual(seed);
  return <PreviewVideoBase src={video} poster={poster} className={className} />;
}

/**
 * SingleApproachCard — the §21.2 "don't ship a one-card grid" handling. Wide,
 * asymmetric row (preview left, copy + CTA right) rather than a grid cell, so
 * it visibly reads as "here is your one path", not "the grid is broken".
 * Explains WHY it's the only option and where the other four approaches went.
 */
function SingleApproachCard({
  mode,
  selected,
  onPick,
}: {
  mode: ApproachMode;
  selected: boolean;
  onPick: () => void;
}) {
  const Icon = mode.Icon;
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={selected}
      className={cn(
        "v3-glass-card group flex flex-col overflow-hidden rounded-2xl text-left transition-all sm:flex-row",
        selected
          ? "ring-2 ring-primary/40 shadow-[0_8px_32px_rgba(195,235,66,0.18)]"
          : "hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md",
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted sm:aspect-auto sm:h-auto sm:w-56 sm:shrink-0">
        <PreviewVideo
          seed={mode.id}
          className="transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent sm:bg-gradient-to-r" />
        <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg border border-white/20 bg-black/35 text-white backdrop-blur-sm">
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        {selected && (
          <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-center gap-1.5 px-4 py-4 sm:px-5">
        <span className="text-[14px] font-bold text-foreground">{mode.title}</span>
        <span className="text-[12px] text-muted-foreground">{mode.desc}</span>
        <span className="mt-1 text-[11px] text-muted-foreground/80">
          The only approach for this format — the full custom flow covers
          everything a still image needs. UGC Video and B-Roll are motion-only.
        </span>
        <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground">
          Continue
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </button>
  );
}

export function Step3Approach({ wizard, onAdvance, onBack }: Step3Props) {
  // Which approach is "open" for sub-type selection. Mirrors wizard.mode for
  // approaches that branch; null when nothing is being chosen.
  const [openMode, setOpenMode] = useState<Mode | null>(null);
  const subTypeRef = useRef<HTMLDivElement | null>(null);

  // §21.2 — Approach filtered by Format. `format` should always be set by the
  // time this step renders (Step 1 precedes it), but fall back to the full
  // list defensively rather than rendering an empty grid.
  const visibleModes = wizard.state.format
    ? ALL_MODES.filter((m) => APPROACHES_BY_FORMAT[wizard.state.format!].includes(m.id))
    : ALL_MODES;
  const isSingleApproach = visibleModes.length === 1;

  // Keep `mode` inside the currently-visible set. Covers first mount (mode
  // defaults to "scratch", which is valid for both formats, so this is a
  // no-op) AND the case where the user picks an approach for Video, goes Back
  // to Step 1, switches Format to Image, and returns here — "scratch" is the
  // only survivor, so the stale video-only mode gets corrected instead of
  // silently pointing at a card that no longer renders. Never auto-advances.
  useEffect(() => {
    if (visibleModes.length > 0 && !visibleModes.some((m) => m.id === wizard.state.mode)) {
      wizard.set("mode", visibleModes[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizard.state.format]);

  // Bring the revealed sub-type section into view once it mounts.
  useEffect(() => {
    if (openMode) {
      subTypeRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [openMode]);

  // Pick an approach. Branching approaches reveal their sub-types (no advance);
  // leaf approaches set mode + auto-fill and advance immediately.
  const pickApproach = (mode: Mode) => {
    if (hasSubTypes(mode)) {
      // Highlight the approach + reveal "Choose a style". Don't auto-fill until
      // a sub-type is chosen so the Configure step receives the precise combo.
      wizard.set("mode", mode);
      setOpenMode(mode);
      return;
    }
    wizard.patch({
      mode,
      approachSubType: null,
      ...autoFillForApproach(mode, null),
    });
    setOpenMode(null);
    onAdvance();
  };

  // Pick a sub-type within the open approach → patch mode + sub-type + auto-fill
  // (angle + concepts) in one go, then advance.
  const pickSubType = (mode: Mode, subTypeId: string) => {
    wizard.patch({
      mode,
      approachSubType: subTypeId,
      ...autoFillForApproach(mode, subTypeId),
    });
    onAdvance();
  };

  const openApproach = openMode
    ? ALL_MODES.find((m) => m.id === openMode)
    : undefined;

  return (
    <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 pt-8 pb-10">
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

      <HeroHeader title="What's your approach?" onBack={onBack} />

      {/* §21.2 — a filtered list that comes out to exactly one card is a
          design smell (Format=Image only has "From scratch" left once the
          two video-only approaches are filtered out). Ship an intentional
          single wide card instead of a 1-cell grid that reads as broken. */}
      {isSingleApproach ? (
        <SingleApproachCard
          mode={visibleModes[0]}
          selected={wizard.state.mode === visibleModes[0].id}
          onPick={() => pickApproach(visibleModes[0].id)}
        />
      ) : (
        /* Approach grid — visual cards, 2 cols mobile / 3 cols md. */
        <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {visibleModes.map((m) => {
            const selected = wizard.state.mode === m.id;
            const isOpen = openMode === m.id;
            const Icon = m.Icon;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => pickApproach(m.id)}
                aria-pressed={selected}
                className={cn(
                  "v3-glass-card group flex flex-col overflow-hidden rounded-2xl text-left transition-all",
                  selected
                    ? "ring-2 ring-primary/40 shadow-[0_8px_32px_rgba(195,235,66,0.18)]"
                    : "hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md",
                )}
              >
                {/* Video preview — ~4:3, leads the card. */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                  <PreviewVideo
                    seed={m.id}
                    className="transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  {/* Legibility scrim */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                  {/* Lucide icon — small glass badge */}
                  <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg border border-white/20 bg-black/35 text-white backdrop-blur-sm">
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                  {/* Selected check */}
                  {selected && (
                    <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                  )}
                </div>
                {/* Title + 1-line desc */}
                <div className="flex flex-col gap-0.5 px-3 py-2.5">
                  <span className="flex items-center gap-1 text-[13px] font-bold text-foreground">
                    {m.title}
                    {isOpen && hasSubTypes(m.id) && (
                      <span className="rounded-full bg-primary/15 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-primary">
                        Pick style
                      </span>
                    )}
                  </span>
                  <span className="line-clamp-2 text-[11px] text-muted-foreground">
                    {m.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </section>
      )}

      {/* Format-aware recovery note. BG Remover / Resize are image-only and
          Image to Video / UGC / B-Roll are video-only (APPROACHES_BY_FORMAT),
          so the approach a user remembers may simply be behind the other
          format. The previous note sent them to Other Apps for these — none
          of them is among §8's 15 apps, so that link was a dead end. */}
      {wizard.state.format && (
        <p className="text-center text-[11px] text-muted-foreground">
          {wizard.state.format === "image"
            ? "Looking for Image to Video, UGC Video or B-Roll? "
            : "Looking for BG Remover or Resize? "}
          <button
            type="button"
            onClick={() => wizard.goTo(1)}
            className="inline-flex items-center gap-0.5 font-medium text-foreground underline underline-offset-2 hover:text-primary"
          >
            Switch the format on step 1
            <ArrowRight className="h-3 w-3" />
          </button>
        </p>
      )}

      {/* Sub-type reveal — appears below the grid when a branching approach is
          picked. "Choose a style" with smaller visual cards, each with its own
          seeded preview (`${mode}:${subType.id}`). */}
      {openApproach && (
        <section
          ref={subTypeRef}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-card/60 p-4 duration-300 animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">
              Choose a style
            </h2>
            <span className="text-[11px] text-muted-foreground">
              for {openApproach.title}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {APPROACH_SUBTYPES[openApproach.id].map((sub) => {
              const subSelected =
                wizard.state.mode === openApproach.id &&
                wizard.state.approachSubType === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => pickSubType(openApproach.id, sub.id)}
                  aria-pressed={subSelected}
                  className={cn(
                    "v3-glass-card group flex flex-col overflow-hidden rounded-xl text-left transition-all",
                    subSelected
                      ? "ring-2 ring-primary/40 shadow-[0_8px_32px_rgba(195,235,66,0.18)]"
                      : "hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md",
                  )}
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    <PreviewVideo
                      seed={`${openApproach.id}:${sub.id}`}
                      className="transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                  </div>
                  <div className="flex flex-col gap-0.5 px-2.5 py-2">
                    <span className="text-[12px] font-bold text-foreground">
                      {sub.label}
                    </span>
                    <span className="line-clamp-2 text-[10.5px] text-muted-foreground">
                      {sub.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
