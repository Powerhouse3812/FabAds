import { Link } from "react-router-dom";
import { Sparkles, LayoutGrid, FileText, Lightbulb, Clapperboard } from "lucide-react";
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
/** Every app, live ones first. Maalik (2026-09-09): show ALL Other Apps on
 *  Studio and drop the "View all" link — with Other Apps gone from the
 *  sub-nav, a subset here would have left the rest reachable only by URL.
 *  Coming-soon entries still render, badged, rather than being hidden: a tool
 *  the user can see is coming reads better than one that silently isn't there. */
const ALL_APPS = [
  ...GENIE_APPS.filter((a) => a.state === "live"),
  ...GENIE_APPS.filter((a) => a.state === "coming-soon"),
];

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
// Maalik's call (2026-09-08): "these are modes too" — Script/Concept/
// Storyboard render as the exact same card as the five Ad modes above (icon
// tile, bold title, 1-line desc), in the SAME grid, just after a divider —
// not a separate compact bar. Each borrows one of the two `tone` schemes
// (sky/slate) that went unused once Affiliate/Custom-Manual were dropped
// from MODES; Storyboard reuses Product Shoot's rose since only two tones
// were free for three cards, and it sits far enough away in the grid (last
// card vs. first) that the repeat doesn't read as a mix-up.
const ASSET_OPTIONS: (AssetOption & { tone: keyof typeof SCHEME })[] = [
  {
    id: "script",
    Icon: FileText,
    title: "Script",
    desc: "Just the ad script — hook, body, CTA. No ad rendered.",
    tone: "sky",
  },
  {
    id: "concept",
    Icon: Lightbulb,
    title: "Concept",
    desc: "A creative concept from an angle — no script or ad.",
    tone: "slate",
  },
  {
    id: "storyboard",
    Icon: Clapperboard,
    title: "Storyboard",
    desc: "Scene-by-scene shot plan for a video ad. Video format only.",
    tone: "rose",
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
    <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col gap-5 px-6 pt-6 pb-6">
      {/* ─── HERO ─── mode picker, elevated card. `shrink-0` — this section is
          FIXED (Maalik, 2026-09-08): only Other Apps below it scrolls. */}
      <section className="relative shrink-0">
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

        {/* Hero card — elevated glass chassis containing the mode grid AND
            (2026-09-08, Maalik: "these are modes too") Script/Concept/
            Storyboard, same card type, same grid, after a divider — no
            longer a separate compact bar below the card. */}
        <div className="v3-glass rounded-2xl p-5 shadow-md">
          {/* Mode picker — 8 cards (Podcast, Animated AI and Custom joined).
              4-col lands a clean 4+4, which is why the single row of 5 this
              replaced had to go: nothing between 5 and 8 columns holds the
              roster without the lonely trailing row. */}
          <div>
            <SectionHeader title="Mode" size="compact" />
            <ul className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
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

          <div className="my-4 border-t border-border/60" aria-hidden />

          {/* Script / Concept / Storyboard — byte-identical card markup to
              Mode above (icon tile, bold title, 1-line desc); "Free" fills
              the same top-right badge slot Mode uses for "Soon" (§16: a
              silently free action reads as a missing price, so it's still
              stated, just per-card now instead of a section-level caption). */}
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {assetOptions.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  title={o.desc}
                  onClick={() => onGenerateAsset?.(o.id)}
                  className="relative flex h-full w-full flex-col items-start gap-1 rounded-xl border border-border bg-background p-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
                >
                  <span className="absolute right-2 top-2 inline-flex items-center rounded-full bg-success-text/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-success-text">
                    {FREE_GENERATION_LABEL}
                  </span>
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                      SCHEME[o.tone].bg,
                      SCHEME[o.tone].text,
                    )}
                  >
                    <o.Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <p className="text-[12px] font-bold leading-tight text-foreground">
                    {o.title}
                  </p>
                  <p className="line-clamp-1 text-[10px] text-muted-foreground">
                    {o.desc}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── OTHER APPS ─── replaces History (§5). Reads the real GENIE_APPS
          registry so tools like "create variation" don't get buried inside
          a mode again — they're findable from Home.
          2026-09-08 (Maalik): was a single horizontal-scroll row leaving the
          rest of the page empty below it. Now a wrapping grid — uses the
          full width, grows downward — inside the ONE region on this screen
          that scrolls, so it can fill whatever vertical space Mode doesn't
          use instead of leaving it blank, without Mode moving. */}
      <section className="flex min-h-0 flex-1 flex-col gap-2">
        <SectionHeader title="Other Apps" icon={LayoutGrid} size="compact" />
        <ul className="grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto pb-1 sm:grid-cols-4">
          {ALL_APPS.map((app) => {
            const Icon = resolveIcon(app.icon);
            const soon = app.state === "coming-soon";
            return (
              <li key={app.key}>
                <Link
                  to={APP_PATH(app.key)}
                  className="v3-glass-card group relative flex h-full w-full flex-col gap-1.5 rounded-xl p-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md"
                >
                  {soon && (
                    <span className="absolute right-2 top-2 inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Soon
                    </span>
                  )}
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      soon ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary-text",
                    )}
                  >
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
