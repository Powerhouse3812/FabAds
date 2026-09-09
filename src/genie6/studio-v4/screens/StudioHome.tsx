import { Link } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  LayoutGrid,
  FileText,
  Lightbulb,
  Clapperboard,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "../components/SectionHeader";
import { MODES, MODE_SCHEME as SCHEME, type AlphaMode } from "../data/modes";
import { GENIE_APPS, APP_PATH } from "@/genie6/apps/data/appRegistry";
import { resolveIcon } from "@/genie6/apps/lib/icons";
import { useBatches } from "@/genie6/lib/genieRunStore";
import { useDemoData } from "@/genie6/hooks/useDemoData";
import { isStoryboardOfferable, type GenerationTarget } from "../state/useWizard";

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

/** Where every output Genie has ever produced lives (§8 — one Library, no
 *  per-surface history). Same literal the other ~15 call sites use; there is
 *  no exported route constant to import, and routes.tsx is not this file's
 *  to edit. */
const LIBRARY_PATH = "/iq/genie6/library";

/* ── CORNER BADGE ────────────────────────────────────────────────────────────
 * REVERTED (2026-09-09, owner: "bring back category Ad tag in performance
 * Ad"): the corner briefly answered availability ONLY, with a Mode's
 * requirement tag ("+ Category") demoted to a body line, specifically to
 * stop the slot answering two different questions. The owner asked for the
 * tag back in the corner anyway, so TAG_BADGE below reintroduces that
 * ambiguity deliberately — the two badges are visually distinct (tinted
 * pill vs. neutral+Lock) precisely because they no longer read as one
 * grammar, and only one can occupy the slot at a time (soon wins if a Mode
 * were ever both). This is a product call, not an oversight; do not
 * "re-fix" it back to body-line without asking again.
 *
 * The SOON classes below are lifted VERBATIM from `apps/components/AppCard.tsx`
 * (its `!isLive` branches) rather than re-invented, because the same app —
 * Resize Image, say — renders through AppCard on /iq/genie6/apps and through
 * this file on Studio home, and the two were visibly different: AppCard
 * muted the whole card and stamped a Lock, Studio home only greyed the text
 * and kept the live border plus a colour-tinted icon tile. Reusing AppCard's
 * skin closes that, and it is what drops Podcast's `sky` tint (one fewer
 * `MODE_SCHEME` raw-palette usage) when it is unavailable.
 *
 * Deliberate divergence from AppCard, in one place only: AppCard's
 * coming-soon card is still a `<Link>` (it navigates to a stub screen), so
 * it keeps a hover lift. Podcast here is a genuinely `disabled` <button> —
 * a hover lift on something that cannot be activated is a lie, so the mode
 * grid's disabled skin carries `cursor-not-allowed` and no hover. */
const SOON_SURFACE = "border-border/70 bg-muted/30";
const SOON_ICON_TILE = "bg-foreground/[0.06] text-muted-foreground";
const SOON_BADGE =
  "absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-border bg-background px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground";

/** A Mode's requirement tag ("+ Category"), back in the corner. Tinted
 *  (tokens, not raw palette) so it reads as a different kind of fact from
 *  SOON_BADGE's neutral pill even though both now share the slot. */
const TAG_BADGE =
  "absolute right-2 top-2 inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-primary-text";

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
 *   1. "Ad" — the elevated hero card's first group (8-card mode grid). Ad
 *      path. UNCHANGED identity/order/availability.
 *   2. "Script · Concept · Storyboard" — the hero card's second group, the
 *      other three generation targets (§1). See `onGenerateAsset`.
 *   3. Other Apps — a horizontal-scroll strip of the real GENIE_APPS tools.
 *
 * LABELLING (2026-09-09, product owner): §1 of GENERATION_TARGETS.md treats
 * Ad · Script · Concept · Storyboard as FOUR PEER targets, and both entry
 * points (`startWizard` / `startAssetWizard`) run the same
 * `resolveGenerationSteps`. So group 1 is not "Mode" — it is eight journeys
 * that all produce an Ad, and the word "Ad" appeared nowhere on a screen
 * where 8 of 11 cards make one. Both groups are labelled now, and the bare
 * `border-t` between them is gone: two SectionHeaders (lime stripe + mono
 * label) already separate the groups, so a rule on top of that was
 * double-signalling the same boundary.
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

  /** The group label NAMES the three targets rather than reaching for a
   *  catch-all ("Assets" / "Extras") that would read as leftovers next to
   *  Ad. Derived from `assetOptions`, never hardcoded, so the label can't
   *  claim a card the filter above just removed. */
  const assetGroupLabel = assetOptions.map((o) => o.title).join(" · ");

  /** THE LIBRARY POINTER (2026-09-09). Genie's nav rail lands on Studio home,
   *  and nothing on this screen said where finished work went — a returning
   *  user's 14 batches were invisible from the one screen they always see
   *  first. Read through `useBatches()`, the store's own selector (same call
   *  `GenieBrain` and `LibraryTopBar` make) — NOT a second count derived from
   *  `sample-outputs.ts`, which is a read-only reference 15+ files import and
   *  which the store has already consumed into batches. Hidden entirely at 0
   *  so a brand-new user's first visit isn't handed a link to an empty room.
   *
   *  GATED ON THE DEMO TOGGLE (review fix): `useBatches()` reads the run store,
   *  which `seedStore()` fills unconditionally at import time and which the
   *  demo-data toggle does NOT clear. `Library.tsx` DOES honour that toggle
   *  (`!demoOn` → `EmptyStateOnboarding`), so an ungated count promised
   *  "14 batches in Library" and then landed the user on "Your library is
   *  empty". The pointer must agree with its destination, so it reads the same
   *  toggle the destination reads. This is also what makes the 0 branch below
   *  reachable at all — the seeded store can never itself be empty. */
  const { on: demoOn } = useDemoData();
  const batches = useBatches();
  const batchCount = demoOn ? batches.length : 0;

  return (
    // WIDTH (2026-09-09): was a flat `max-w-3xl` — 768px of an ~1736px content
    // column, 44% utilisation, which is what forced the mode-card descriptions
    // to `line-clamp-1` at 164px and made them unreadable. Widens in two steps
    // (`lg:max-w-5xl` / `2xl:max-w-6xl`, both already in use across genie6 —
    // Step1Setup/Step4Configure and OtherApps/OtherFlows respectively) rather
    // than one jump, so the 4-col mode grid grows from ~164px to ~232px to
    // ~260px per card instead of stretching straight to the viewport. The
    // descriptions get `lg:line-clamp-2` at the same breakpoint the extra
    // width arrives, so the clamp only relaxes where there is room to relax it.
    <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col gap-5 px-6 pt-6 pb-6 lg:max-w-5xl 2xl:max-w-6xl">
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
            {/* "Ad", not "Mode" — the label has to say what you walk out
                with; `count` carries the roster size (8) that the label
                can't, and the hint keeps the word "mode" on screen since
                the wizard's Step 1 and the ContextRail both call it that.
                Gated on the roster so the label can never head an empty
                grid (state coverage — zero-data). */}
            {/* KNOWN IMPRECISION, ACCEPTED BY THE OWNER (2026-09-09) — do not
                "discover" this as a bug. A review pass correctly found that
                this header over-claims on two counts:
                  · Product Shoot, the FIRST card, is classified `asset` by
                    `deriveCategory` (StudioAlpha.tsx) and describes itself as
                    product photography — not an ad.
                  · `count={MODES.length}` is 8 and includes Podcast, which is
                    `available: false` and currently produces nothing.
                The options offered were: move Product Shoot into the asset
                group; soften the hint to "most" and count only the available
                modes; or drop the count and the claim. Maalik chose to leave
                it as-is — Product Shoot still makes creative FOR ads, Podcast
                will ship, and the sentence's real job is getting the word
                "Ad" onto a page where it appeared nowhere despite eight of
                eleven cards producing one. Revisit only if he asks. */}
            {MODES.length > 0 && (
              <SectionHeader
                title="Ad"
                count={MODES.length}
                hint="modes — each one produces a finished ad"
                size="compact"
              />
            )}
            <ul className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
              {MODES.map((m) => {
                const soon = !m.available;
                return (
                  // `min-w-0` — a 60-char Mode title has to wrap inside its
                  // column, never widen it; grid items default to
                  // `min-width:auto` and would otherwise push the row wider
                  // than the 4 columns and break the grid.
                  <li key={m.id} className="min-w-0">
                    <button
                      type="button"
                      disabled={soon}
                      aria-disabled={soon}
                      onClick={() => m.available && onStart(m.id)}
                      title={m.available ? undefined : `${m.title} — coming soon`}
                      className={cn(
                        "fab-focus relative flex h-full w-full flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition-all",
                        soon
                          ? cn("cursor-not-allowed", SOON_SURFACE)
                          : "border-border bg-background hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm",
                      )}
                    >
                      {/* Corner slot: SOON wins if a Mode is ever both
                          unavailable and tagged (no Mode is today); the
                          requirement tag otherwise. See the CORNER BADGE
                          comment above the constants for why both share this
                          slot again. */}
                      {soon ? (
                        <span className={SOON_BADGE}>
                          <Lock className="h-2.5 w-2.5" />
                          Soon
                        </span>
                      ) : (
                        m.tag && <span className={TAG_BADGE}>{m.tag}</span>
                      )}
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                          soon
                            ? SOON_ICON_TILE
                            : cn(SCHEME[m.tone].bg, SCHEME[m.tone].text),
                        )}
                      >
                        <m.Icon className="h-4 w-4" strokeWidth={2} />
                      </span>
                      <p className="break-words text-[12px] font-bold leading-tight text-foreground">
                        {m.title}
                      </p>
                      <p className="line-clamp-1 text-[10px] text-muted-foreground lg:line-clamp-2">
                        {m.desc}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* The other three generation targets — byte-identical card markup
              to the Ad modes above (icon tile, bold title, 1-line desc).
              The top-right badge slot is now EMPTY here: the per-card "Free"
              badge was removed on the owner's instruction (2026-09-09,
              "remove free tag"). That reverses §16's per-card treatment, and
              the reversal is total for THIS screen — free-ness is now stated
              nowhere on Studio home, neither per-card nor as the
              section-level caption the badge originally replaced. It
              survives elsewhere (`library/tabs/GeneratedAssetCard.tsx`
              still stamps its own "Free" pill). `FREE_GENERATION_LABEL` in
              useWizard.ts is now genuinely UNRENDERED — its only other
              renderer was the rollout experiment's frozen legacy arm, deleted
              2026-09-09 once the owner picked a single winner. Left exported
              rather than deleted, in case a silently free action here starts
              reading as a missing price and this badge comes back. */}
          {assetOptions.length > 0 && (
            <div className="mt-4">
              <SectionHeader
                title={assetGroupLabel}
                hint="generated on their own — no mode, no ad"
                size="compact"
              />
              <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {assetOptions.map((o) => (
                  <li key={o.id} className="min-w-0">
                    <button
                      type="button"
                      title={o.desc}
                      onClick={() => onGenerateAsset?.(o.id)}
                      className="fab-focus relative flex h-full w-full flex-col items-start gap-1 rounded-xl border border-border bg-background p-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                          SCHEME[o.tone].bg,
                          SCHEME[o.tone].text,
                        )}
                      >
                        <o.Icon className="h-4 w-4" strokeWidth={2} />
                      </span>
                      <p className="break-words text-[12px] font-bold leading-tight text-foreground">
                        {o.title}
                      </p>
                      <p className="line-clamp-1 text-[10px] text-muted-foreground lg:line-clamp-2">
                        {o.desc}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
        <SectionHeader
          title="Other Apps"
          icon={LayoutGrid}
          size="compact"
          /* Genie's rail lands on this screen, so this is the only place a
             returning user is guaranteed to look — and until now it named no
             route to the work they already have. Text link, not a button:
             this is a wayfinding cue competing with 33 cards, not a fourth
             call to action. Absent at 0 batches (see `batchCount`). */
          trailing={
            batchCount > 0 ? (
              <Link
                to={LIBRARY_PATH}
                className="fab-focus inline-flex items-center gap-1 rounded-full font-mono text-[10px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {batchCount} {batchCount === 1 ? "batch" : "batches"} in Library
                <ArrowRight className="h-3 w-3" />
              </Link>
            ) : undefined
          }
        />
        {ALL_APPS.length === 0 ? (
          /* Zero-data: an empty registry must not leave a section label
             heading a void. Composed row, same mono caption grammar as the
             rest of the screen. */
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            No apps yet
          </div>
        ) : (
          /* `min-h-[6.5rem]` guarantees ONE complete 96px app tile plus a
             sliver of the next, so this always reads as a scrollable list.
             Without it the flex-1 region collapsed to 53px at 1280x720 —
             every tile clipped mid-card, which looks like a rendering fault
             rather than something you can scroll. It measured 101px at
             1366x768, clearing a tile by only 5px, so any future card that
             grows a line would have broken that size too.
             Owner's call (2026-09-09), knowing the cost: this makes the PAGE
             scroll at 1280x720, which it previously never did. A clipped
             section was judged worse than a scrolling page. The alternative
             was moving the two-line descriptions to `2xl:`, which would have
             kept the height but lost readability at the common laptop size. */
          <ul className="grid min-h-[6.5rem] flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto pb-1 sm:grid-cols-4">
            {ALL_APPS.map((app) => {
              const Icon = resolveIcon(app.icon);
              const soon = app.state === "coming-soon";
              return (
                <li key={app.key} className="min-w-0">
                  <Link
                    to={APP_PATH(app.key)}
                    className={cn(
                      "fab-focus group relative flex h-full w-full flex-col gap-1.5 rounded-xl border p-2.5 text-left transition-all hover:-translate-y-0.5",
                      soon
                        ? // AppCard's own coming-soon skin — NOT `v3-glass-card`,
                          // whose unlayered `border`/`background` would beat these
                          // utilities and keep the card looking live.
                          cn(SOON_SURFACE, "hover:border-foreground/15")
                        : "v3-glass-card hover:border-foreground/20 hover:shadow-md",
                    )}
                  >
                    {soon && (
                      <span className={SOON_BADGE}>
                        <Lock className="h-2.5 w-2.5" />
                        Soon
                      </span>
                    )}
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg",
                        soon ? SOON_ICON_TILE : "bg-primary/10 text-primary-text",
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
        )}
      </section>
    </div>
  );
}
