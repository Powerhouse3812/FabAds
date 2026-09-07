import { Link } from "react-router-dom";
import { Sparkles, LayoutGrid, ArrowRight, FileText, Lightbulb, Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "../components/SectionHeader";
import { MODES, MODE_SCHEME as SCHEME, type AlphaMode } from "../data/modes";
import { GENIE_APPS, APP_PATH } from "@/genie6/apps/data/appRegistry";
import { resolveIcon } from "@/genie6/apps/lib/icons";
import {
  isStoryboardOfferable,
  FREE_GENERATION_LABEL,
  type GenerationTarget,
} from "../state/useWizard";

// Re-exported so existing consumers (`ContextRail`, `MobileContextRailSheet`,
// `AlphaStep3Configure` all import `type { AlphaMode } from "../screens/StudioHome"`)
// keep working unchanged — the type's home moved to data/modes.ts (§21.2, so
// AlphaStep1Format can share the same roster), StudioHome just re-exports it.
export type { AlphaMode };

interface StudioHomeProps {
  onStart: (mode: AlphaMode) => void;
  /**
   * CORRECTION (2026-09-08, product owner) — asset generation (Script /
   * Concept / Storyboard) lives on Studio home now, below the seven modes
   * ("with modes above and asset generation below"); it briefly lived on
   * AlphaStep1Format (Mode & Format) before the owner clarified their "step
   * 1" meant this Home screen, not the wizard's first step.
   *
   * Fires the moment the user picks one of the three asset targets. The
   * caller owns `generationTarget` on wizard state (this file has no wizard
   * instance) — it must mirror `startWizard` in StudioAlpha.tsx: patch
   * `{ generationTarget: target, category: "asset", step: 1 }` (no
   * `studioMode` — no creative Mode was chosen) and enter the wizard exactly
   * like `onStart` does, since every asset target's step plan
   * (`resolveGenerationSteps`) still requires Format.
   *
   * Optional so this file type-checks standalone before the call site is
   * wired — StudioAlpha.tsx is out of this file's ownership scope (cross-file
   * wiring step, done after). WIRE THIS for the feature to actually fire.
   */
  onGenerateAsset?: (target: Exclude<GenerationTarget, "ad">) => void;
}

/** Only the live apps surface here — §5 "Other tools/apps at the bottom of
 *  the page, replacing History" is explicit about findability, not a count. */
const LIVE_APPS = GENIE_APPS.filter((a) => a.state === "live");

interface AssetOption {
  id: Exclude<GenerationTarget, "ad">;
  Icon: typeof FileText;
  title: string;
  desc: string;
}

/** Script / Concept / Storyboard — the three free asset targets (§4/§5).
 *  Order fixed: the order the owner named them in.
 *
 * §3/Task-3 call: format isn't known yet on Home (it's chosen later, on the
 * wizard's Format step) — gating Storyboard here against a format that
 * doesn't exist yet would either hide it for no visible reason or show a
 * permanently-disabled card with no explanation, neither of which is
 * acceptable. `isStoryboardOfferable(null)` is the contract's own answer for
 * "format not chosen yet": true. So all three are offered, unconditionally,
 * on Home; the wizard's Format step (once format becomes known) is where
 * `resolveGenerationSteps`'s `formatValid` actually enforces video-only. */
const ASSET_OPTIONS: AssetOption[] = [
  {
    id: "script",
    Icon: FileText,
    title: "Script",
    desc: "Just the ad script — hook, body, CTA. No ad rendered.",
  },
  {
    id: "concept",
    Icon: Lightbulb,
    title: "Concept",
    desc: "A creative concept from an angle — no script or ad.",
  },
  {
    id: "storyboard",
    Icon: Clapperboard,
    title: "Storyboard",
    desc: "Scene-by-scene shot plan for a video ad. Video format only.",
  },
];

/**
 * StudioHome (A-12.9 hero pass, §5 apps-strip pass, 2026-09-08 asset-region
 * pass) — pre-wizard entry screen for Studio Alpha.
 *
 * Three regions, stacked, deliberately different visual classes so an ad, a
 * free asset and a tool never read as seventeen peer cards:
 *   1. Mode — the elevated hero card (7-card grid). Ad path. UNCHANGED
 *      identity/order/availability.
 *   2. "Or generate an asset" — a single compact horizontal bar (NOT a card
 *      grid) offering Script / Concept / Storyboard. See `onGenerateAsset`.
 *   3. Other Apps — a horizontal-scroll strip of the real GENIE_APPS tools.
 *
 * Height budget (hard constraint — no vertical scroll at 1440×900 or
 * 1366×768): adding region 2 without removing anything meant every existing
 * region got denser — hero card padding, mode-card padding/icon/desc, the
 * mode grid's column count (3→4, fewer rows), and the apps strip's
 * card padding/icon/desc all shrank. Nothing was deleted; §21.2's design
 * tokens (rounded-2xl, hover lift, mono uppercase badges) are unchanged,
 * only the sizes reading them.
 *
 * History and recent generations are OUT of Studio entirely (§5 — they live
 * only in Library). In their place: an Other Apps strip reading the real
 * `GENIE_APPS` registry, so the tools that got buried inside Performance Ad
 * in the demo ("create variation") are findable from Home instead.
 */
export function StudioHome({ onStart, onGenerateAsset }: StudioHomeProps) {
  const assetOptions = ASSET_OPTIONS.filter(
    (o) => o.id !== "storyboard" || isStoryboardOfferable(null),
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-6 pt-6 pb-6">
      {/* ─── HERO ─── mode picker, elevated card */}
      <section className="relative">
        {/* Eyebrow + title — sits ABOVE the hero card, centered for the
            home-screen entry-point feel */}
        <div className="mb-3 space-y-1 text-center">
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3 w-3" />
            Studio · Alpha
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            What are you creating today?
          </h1>
          <p className="mx-auto max-w-md text-xs text-muted-foreground">
            Pick a mode. Studio fills in everything else.
          </p>
        </div>

        {/* Hero card — elevated glass chassis containing the mode grid */}
        <div className="v3-glass rounded-2xl p-5 shadow-md">
          {/* Mode picker — 7-card grid (4+3 on desktop) */}
          <div>
            <SectionHeader title="Mode" size="compact" />
            <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {MODES.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    disabled={!m.available}
                    aria-disabled={!m.available}
                    onClick={() => m.available && onStart(m.id)}
                    title={m.available ? undefined : `${m.title} — coming soon`}
                    className={cn(
                      "relative flex h-full w-full flex-col items-start gap-1 rounded-xl border bg-background p-2.5 text-left transition-all",
                      m.available
                        ? "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
                        : "border-border cursor-not-allowed opacity-60",
                    )}
                  >
                    {m.tag && (
                      <span className="absolute right-2 top-2 inline-flex items-center rounded-full bg-primary/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-primary">
                        {m.tag}
                      </span>
                    )}
                    {!m.available && !m.tag && (
                      <span className="absolute right-2 top-2 inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Soon
                      </span>
                    )}
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                        SCHEME[m.tone].bg,
                        SCHEME[m.tone].text,
                      )}
                    >
                      <m.Icon className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <p className="text-[12px] font-bold leading-tight text-foreground">
                      {m.title}
                    </p>
                    <p className="line-clamp-1 text-[10px] text-muted-foreground">
                      {m.desc}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── ASSET GENERATION ─── (§4/§5, 2026-09-08 correction). A single
          compact bar, not a third card grid — reads as a different kind of
          thing than the Mode hero above it. Every option states it's free
          (§16: a silently free action reads as a missing price). */}
      <section className="space-y-1.5">
        <SectionHeader title="Or generate an asset" size="compact" hint="No ad rendered — instant" />
        <div className="flex divide-x divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-muted/20">
          {assetOptions.map((o) => (
            <button
              key={o.id}
              type="button"
              title={o.desc}
              onClick={() => onGenerateAsset?.(o.id)}
              className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 transition-colors duration-200 hover:bg-foreground/[0.03]"
            >
              <o.Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={2} />
              <span className="truncate text-[12px] font-semibold text-foreground">
                {o.title}
              </span>
              {/* Free — always stated, never absent. */}
              <span className="shrink-0 rounded-full bg-success-text/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.06em] text-success-text">
                {FREE_GENERATION_LABEL}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ─── OTHER APPS ─── replaces History (§5). Reads the real GENIE_APPS
          registry so tools like "create variation" don't get buried inside
          a mode again — they're findable from Home. */}
      <section className="space-y-2">
        <SectionHeader
          title="Other Apps"
          icon={LayoutGrid}
          size="compact"
          trailing={
            <Link
              to="/iq/genie6/apps"
              className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          }
        />
        <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {LIVE_APPS.map((app) => {
            const Icon = resolveIcon(app.icon);
            return (
              <li key={app.key} className="snap-start shrink-0 w-[180px]">
                <Link
                  to={APP_PATH(app.key)}
                  className="v3-glass-card group flex h-full w-full flex-col gap-1.5 rounded-xl p-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary-text">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <p className="line-clamp-1 text-[12px] font-semibold leading-tight text-foreground">
                    {app.name}
                  </p>
                  <p className="line-clamp-1 text-[10px] text-muted-foreground">
                    {app.tagline}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
