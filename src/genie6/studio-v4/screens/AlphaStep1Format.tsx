import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { HeroHeader } from "../components/HeroHeader";
import { SectionHeader } from "../components/SectionHeader";
import type { Format, UseWizardReturn } from "../state/useWizard";
import { MODES, MODE_SCHEME, type AlphaMode } from "../data/modes";

/**
 * AlphaStep1Format — Step 1: Mode + Format, ONE screen (§21.2).
 *
 * A-12.20 (Maalik: "boring + wireframmy" → make it feel like a creative studio):
 *   - Ambient layer: 22px dot grid + radial lime wash + 2 lime geometric shapes
 *     behind the grid. Pure CSS, no SVG / Framer Motion.
 *   - Image preview: 3 stacked aspect-ratio frames (1:1 / 4:5 / 9:16) that
 *     fan out on group-hover. Hand-built from divs + Tailwind transitions.
 *   - Video preview: wide frame + opacity-pulsing lime play disc; pulse
 *     intensifies on group-hover.
 *   - Format pills under each title, Fabfunnel pill DNA.
 *   - Selected state untouched; hover lifts 1px and brightens borders.
 *   - All colours via design-system tokens (foreground / primary / muted-fg
 *     / border / card). No raw Tailwind palette.
 *
 * §21.2 MERGE (Studio Shell agent): "The breadcrumb reads Format › Product ›
 * Approach › Configure and says 'Step 1 of 4' — so the mode chosen on Studio
 * home is a step zero with no way back except Home. Either make Mode a
 * visible step, or merge Mode and Format into one screen... the Format screen
 * currently spends a whole 800px canvas on a binary choice, which makes
 * merging the stronger option." Merged: a compact Mode row now sits above the
 * Format cards on this same step-1 screen, so Back from Step 2 lands
 * somewhere the user can change EITHER — no more full exit-to-Home required
 * just to swap Mode. StudioHome (the pre-wizard landing page with its own
 * Mode grid + History strip) is UNCHANGED and still the entry point; this is
 * about what's reachable once you're already inside the wizard.
 *
 * Mode itself is NOT an ad-type selector — §4 is unambiguous that the Step-2
 * tab (Brand/Product/Category) is the only ad-type picker in Genie. Mode
 * stays the coarser "what kind of creative journey" choice from Studio Home
 * (see data/modes.ts for the §22-item-2 reconciliation note).
 */

interface Step1Props {
  wizard: UseWizardReturn;
  onAdvance: () => void;
  onBack?: () => void;
  /** Current Mode (from StudioAlpha's homeMode) — shown selected in the row. */
  mode: AlphaMode | null;
  /** Changing Mode here does NOT advance — it's a parallel selection, not a
   *  "next" action. Only Format advances (unchanged click-to-advance rule). */
  onModeChange: (mode: AlphaMode) => void;
}

interface FormatOption {
  id: Format;
  title: string;
  desc: string;
  pills: [string, string, string];
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    id: "image",
    title: "Image",
    desc: "Static ad creatives — hero shots, carousels, story frames.",
    pills: ["Static", "Carousel", "Story"],
  },
  {
    id: "video",
    title: "Video",
    desc: "Motion creatives — UGC, reels, product demos.",
    pills: ["UGC", "Reel", "Demo"],
  },
];

const PILL_CLS =
  "rounded-full border border-border/60 bg-background/40 px-2 py-0.5 text-[10px] font-mono text-muted-foreground";

const FRAME_BASE =
  "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md border backdrop-blur-sm transition-all duration-300 ease-out";

function ImagePreview({ selected }: { selected: boolean }) {
  const accent = selected ? "border-primary/50" : "border-border/70";
  const fill = selected ? "bg-primary/15" : "bg-foreground/5";
  const front = selected ? "bg-primary/25" : "bg-card";
  return (
    // h-20 at phone widths trims 16px per card so both format cards fit one
    // screen without scrolling; the frames inside are centered and unchanged,
    // so the preview reads identically. md: restores h-24.
    <div className="relative h-20 w-32 md:h-24">
      {/* 9:16 back, leans left */}
      <div className={cn(FRAME_BASE, accent, fill, "h-20 w-[45px] -rotate-[10deg] group-hover:-translate-x-[34px] group-hover:-rotate-[14deg]")} />
      {/* 4:5 middle, leans right */}
      <div className={cn(FRAME_BASE, accent, fill, "h-20 w-16 rotate-[8deg] group-hover:translate-x-[10px] group-hover:rotate-[12deg]")} />
      {/* 1:1 front, lifts up */}
      <div className={cn(FRAME_BASE, accent, front, "h-16 w-16 shadow-sm group-hover:-translate-y-[calc(50%+4px)]")} />
    </div>
  );
}

function VideoPreview({ selected }: { selected: boolean }) {
  return (
    // h-20 at phone widths trims 16px per card so both format cards fit one
    // screen without scrolling; the frames inside are centered and unchanged,
    // so the preview reads identically. md: restores h-24.
    <div className="relative h-20 w-32 md:h-24">
      <div
        className={cn(
          "absolute inset-x-0 top-1/2 mx-auto h-[72px] w-32 -translate-y-1/2 overflow-hidden rounded-lg border transition-colors duration-300",
          selected ? "border-primary/50 bg-primary/10" : "border-border/70 bg-foreground/5",
        )}
      >
        <div className={cn("absolute inset-x-0 top-1/2 h-px -translate-y-1/2", selected ? "bg-primary/30" : "bg-foreground/10")} />
      </div>
      {/* play disc */}
      <div
        className={cn(
          "absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-300",
          selected
            ? "border-primary/60 bg-primary/20 group-hover:bg-primary/30"
            : "border-border/70 bg-card/80 group-hover:border-primary/40 group-hover:bg-primary/10",
        )}
      >
        <span className={cn("absolute inset-0 animate-ping rounded-full group-hover:bg-primary/25", selected ? "bg-primary/20" : "bg-primary/10")} />
        <Play className={cn("relative h-4 w-4 fill-current", selected ? "text-primary" : "text-foreground/70")} />
      </div>
    </div>
  );
}

export function AlphaStep1Format({ wizard, onAdvance, onBack, mode, onModeChange }: Step1Props) {
  return (
    // Mobile: fills the step viewport (min-h-full) and centers so the two
    // cards read as one screen; `md:` restores the original top-aligned,
    // auto-height, px-6 pt-8 pb-10 block exactly.
    <div className="relative mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center gap-4 px-4 pt-4 pb-4 md:min-h-0 md:justify-start md:gap-6 md:px-6 md:pt-8 md:pb-10">
      {/* Ambient layer — dot grid + radial lime wash + 2 geometric shapes */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 text-foreground opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] [background-size:22px_22px]" />
        <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,hsl(74_81%_59%/0.08),transparent_70%)]" />
        <div className="absolute -left-10 top-24 h-24 w-24 rotate-12 rounded-2xl border border-primary/20 bg-primary/[0.04]" />
        <div className="absolute -right-8 bottom-16 h-16 w-16 -rotate-6 rounded-full border border-primary/15" />
      </div>

      <div className="flex flex-col gap-2">
        <HeroHeader title="What are you creating?" onBack={onBack} />
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Step 1 of 4 · Mode + how your creative will appear
        </p>
      </div>

      {/* Mode row — compact, so Format keeps its visual weight below.
          Reachable here (not just on Studio Home) so Back from Step 2 can
          change Mode without exiting the wizard (§21.2). */}
      <section className="flex flex-col gap-2">
        <SectionHeader title="Mode" size="compact" />
        <ul className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] sm:flex-wrap sm:overflow-visible">
          {MODES.map((m) => {
            const selected = mode === m.id;
            return (
              <li key={m.id} className="shrink-0">
                <button
                  type="button"
                  disabled={!m.available}
                  aria-pressed={selected}
                  onClick={() => m.available && onModeChange(m.id)}
                  title={m.available ? m.title : `${m.title} — coming soon`}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-2 text-left transition-all",
                    !m.available && "cursor-not-allowed opacity-50",
                    m.available && selected
                      ? "border-primary/40 bg-primary/10 shadow-sm"
                      : m.available
                        ? "border-border bg-background hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"
                        : "border-border bg-background",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      selected ? MODE_SCHEME[m.tone].bgSel : MODE_SCHEME[m.tone].bg,
                      selected ? MODE_SCHEME[m.tone].textSel : MODE_SCHEME[m.tone].text,
                    )}
                  >
                    <m.Icon className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                  <span className="whitespace-nowrap text-[12px] font-semibold text-foreground">
                    {m.title}
                  </span>
                  {m.tag && (
                    <span className="rounded-full bg-primary/15 px-1.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-wider text-primary">
                      {m.tag}
                    </span>
                  )}
                  {!m.available && (
                    <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
                      Soon
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <SectionHeader title="Format" size="compact" />
        {/* 1 column at phone widths (two 300px-tall cards side by side at 375px
            left ~150px of usable card width — the preview + 3 pills collapsed).
            sm: goes back to the 2-up grid, md: is byte-identical to before. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-2 md:gap-6">
          {FORMAT_OPTIONS.map((f) => {
            const selected = wizard.state.format === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  wizard.set("format", f.id);
                  onAdvance();
                }}
                className={cn(
                  "v3-glass-card group relative flex min-h-[180px] cursor-pointer flex-col items-center gap-3 overflow-hidden rounded-3xl p-4 transition-all duration-300 ease-out",
                  "md:min-h-[300px] md:gap-5 md:p-8",
                  selected
                    ? "ring-2 ring-primary/30 shadow-[0_8px_32px_rgba(195,235,66,0.15)]"
                    : "shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:-translate-y-1 hover:border-foreground/30 hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)]",
                )}
              >
                {!selected && (
                  <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_at_top,hsl(74_81%_59%/0.12),transparent_75%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                )}

                <div className="flex flex-1 items-center justify-center">
                  {f.id === "image" ? <ImagePreview selected={selected} /> : <VideoPreview selected={selected} />}
                </div>

                <div className="flex flex-col items-center gap-2">
                  <span className="text-lg font-bold text-foreground">{f.title}</span>
                  <span className="text-center text-[13px] text-muted-foreground">{f.desc}</span>
                  <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
                    {f.pills.map((p) => (
                      <span key={p} className={PILL_CLS}>{p}</span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
