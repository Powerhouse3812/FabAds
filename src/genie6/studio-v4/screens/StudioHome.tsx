import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, LayoutGrid, Lock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "../components/SectionHeader";
import { ModeThumb } from "../components/ModeThumb";
import { PreviewVideo } from "../components/PreviewVideo";
import { videoForSeed, posterForSeed } from "../data/studio-visuals";
import { OtherAppsModal } from "../components/OtherAppsModal";
import { MODES, MODE_SCHEME as SCHEME, type AlphaMode, type ModeOption } from "../data/modes";
import { GENIE_APPS, APP_PATH } from "@/genie6/apps/data/appRegistry";
import { resolveIcon } from "@/genie6/apps/lib/icons";
import { useBatches } from "@/genie6/lib/genieRunStore";
import { useDemoData } from "@/genie6/hooks/useDemoData";
import type { GenerationTarget } from "../state/useWizard";

// Re-exported so existing consumers (`ContextRail`, `MobileContextRailSheet`,
// `AlphaStep3Configure` all import `type { AlphaMode } from "../screens/StudioHome"`)
// keep working unchanged — the type's home moved to data/modes.ts (§21.2, so
// AlphaStep1Format can share the same roster), StudioHome just re-exports it.
export type { AlphaMode };

interface StudioHomeProps {
  onStart: (mode: AlphaMode) => void;
  /**
   * REMOVED FROM THE UI, NOT FROM THE CONTRACT (2026-09-09, owner: "Remove:
   * script/concept/storyboard generation for now"). This screen used to
   * render Script/Concept/Storyboard as a third card group calling this prop
   * the moment one was picked; that group is gone. The prop stays — still
   * mirroring `startWizard`'s shape in StudioAlpha.tsx (patch
   * `{ generationTarget: target, category: "asset", step: 1 }`, no
   * `studioMode`) — specifically so a future return of this capability is a
   * UI-only change here, not a rebuild of the caller-side plumbing. Currently
   * unused: nothing in this file calls it.
   */
  onGenerateAsset?: (target: Exclude<GenerationTarget, "ad">) => void;
}

/**
 * FEATURED APPS (2026-09-10, owner scope cut: "only 4 we decided to give for
 * now, and others will be coming soon... remaining will be in view more modal
 * with coming soon tag").
 *
 * DERIVED, never a hardcoded key list. The registry's own `state` decides what
 * is featured, so the day a fifth app ships it appears here by flipping one
 * word in appRegistry.ts — and nothing on this screen can drift out of sync
 * with the roster the way a hand-copied id list silently does (the bug class
 * `data/modes.ts` documents at length, hit three separate times in this module
 * already). The count is read off the array too; nothing here says "4".
 */
const LIVE_APPS = GENIE_APPS.filter((a) => a.state === "live");
const SOON_APPS = GENIE_APPS.filter((a) => a.state === "coming-soon");

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
 * "re-fix" it back to body-line without asking again. */
const SOON_SURFACE = "border-border/70 bg-muted/30";
const SOON_ICON_TILE = "bg-foreground/[0.06] text-muted-foreground";
const SOON_BADGE =
  "inline-flex items-center gap-1 rounded-full border border-border bg-background px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground";
/* OPAQUE, not a tint (2026-09-10, owner: "Category tag in performance Ad card
 * is not visible"). This was `bg-primary/10` — a 10%-alpha lime that worked
 * when the card body behind it was flat white, but the tag now sits ON the
 * card's artwork, where a near-transparent fill just dissolves into the
 * picture. It takes the same opaque `bg-background` plate the SOON badge uses
 * (which is exactly why that one stayed legible), keeping the lime as border
 * + text so the two badges still read as different KINDS of fact. */
const TAG_BADGE =
  "inline-flex items-center rounded-full border border-primary/40 bg-background px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-primary-text shadow-sm";

/**
 * ModeCard — the big Ad-mode card (2026-09-10, owner: "6 modes abhi ignore ho
 * rhe hai thode, we can make big cards for them and add static thumbnails but
 * related and engaging").
 *
 * It was a 2.5-padding icon tile in a 4-col grid, which is exactly the
 * "ignored" the owner is describing — six identical small tiles read as a
 * settings list, not as the six things this product actually makes. The card
 * now leads with artwork (`ModeThumb`, keyed on the Mode id) and the tone
 * tile floats over that art instead of stacking above the title.
 *
 * The artwork is DRAWN, not photographed: the repo's 45 photos all carry
 * AI-generated gibberish text, invisible on Genie 5's small cards but plainly
 * readable at this size — see the note in data/modes.ts. An unmapped Mode id
 * gets `ModeThumb`'s neutral composition, so a new Mode renders a complete
 * card rather than a hole.
 *
 * `available` still decides the skin — live vs. Soon — not which grid it
 * renders in, so a Mode that goes unavailable degrades in place. All six are
 * live today; the Soon branch is not dead code, it is the state-coverage path.
 */
function ModeCard({
  mode: m,
  onStart,
}: {
  mode: ModeOption;
  onStart: (mode: AlphaMode) => void;
}) {
  const soon = !m.available;
  return (
    // `min-w-0` — a 60-char Mode title has to wrap inside its column, never
    // widen it; grid items default to `min-width:auto` and would otherwise
    // push the row wider than its columns and break the grid.
    <li className="min-w-0">
      <button
        type="button"
        disabled={soon}
        aria-disabled={soon}
        onClick={() => m.available && onStart(m.id)}
        title={m.available ? undefined : `${m.title} — coming soon`}
        className={cn(
          "fab-focus group flex h-full w-full flex-col overflow-hidden rounded-xl border text-left transition-all",
          soon
            ? cn("cursor-not-allowed", SOON_SURFACE)
            : "border-border bg-background hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
        )}
      >
        {/* Artwork. An ASPECT ratio, not a fixed height, so the six cards stay
            identical at every breakpoint the grid reflows through.
            `2/1` (2026-09-10, owner: "mode cards bohot bade ho gye hai, thoda
            sa compact kro") — was `16/10`, which at a ~230px column made each
            card ~208px tall and two rows of them ate the fold. A letterbox
            crop takes ~35px off every card without touching the type or
            dropping the second description line.
            DRAWN, not photographed — see the `thumb` note in data/modes.ts for
            why the repo's photo assets were rejected for this slot. */}
        <div className="relative w-full shrink-0 overflow-hidden aspect-[2/1]">
          <ModeThumb
            modeId={m.id}
            className={cn(
              "h-full w-full transition-transform duration-500 group-hover:scale-[1.04]",
              soon && "opacity-45 grayscale",
            )}
          />

          {/* Tone tile over the art. `backdrop-blur` + a translucent white
              plate keeps it legible on any photograph, dark or light. */}
          <span
            className={cn(
              "absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg shadow-sm backdrop-blur-sm",
              soon ? SOON_ICON_TILE : cn(SCHEME[m.tone].bg, SCHEME[m.tone].text),
            )}
          >
            <m.Icon className="h-3.5 w-3.5" strokeWidth={2} />
          </span>

          {/* Corner slot: SOON wins if a Mode is ever both unavailable and
              tagged (no Mode is today); the requirement tag otherwise. See the
              CORNER BADGE comment above for why both share this slot. */}
          <span className="absolute right-2 top-2">
            {soon ? (
              <span className={SOON_BADGE}>
                <Lock className="h-2.5 w-2.5" />
                Soon
              </span>
            ) : (
              m.tag && <span className={TAG_BADGE}>{m.tag}</span>
            )}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-0.5 p-2.5">
          <p
            className={cn(
              "break-words text-[12px] font-bold leading-tight",
              soon ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {m.title}
          </p>
          <p className="line-clamp-2 text-[10px] leading-snug text-muted-foreground">
            {m.desc}
          </p>
        </div>
      </button>
    </li>
  );
}

/**
 * TrendingCard — a Trending approach, led by a REAL looping video preview
 * (2026-09-10, owner: "Have to give more visibility to Trending / trending
 * Approaches... Add animated video thumbnail of there each type accordingly",
 * then "trending wale cards me, real video thumbnail example add kro").
 *
 * The clips are the design-phase placeholder pool the wizard's own preview
 * tiles already play — real licensed stock, bundled under
 * `public/studio-previews/`. This card does not own any of that: `PreviewVideo`
 * owns muted-autoplay and the never-frozen poster fallback, `videoForSeed`
 * owns which clip a Mode gets. Both swap to real generated previews in one
 * place when the backend lands, with no change here.
 *
 * Availability is read off `m.available`, NOT off the section. Every Trending
 * entry is unavailable today because none is built — but the day one ships it
 * stays in this section and simply stops being disabled, which is the whole
 * point of the group/available split (see data/modes.ts).
 */
function TrendingCard({
  mode: m,
  onStart,
}: {
  mode: ModeOption;
  onStart: (mode: AlphaMode) => void;
}) {
  const soon = !m.available;
  return (
    <li className="min-w-0">
      <button
        type="button"
        disabled={soon}
        aria-disabled={soon}
        onClick={() => m.available && onStart(m.id)}
        title={m.available ? undefined : `${m.title} — coming soon`}
        className={cn(
          "fab-focus group flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-background text-left transition-all",
          soon
            ? "cursor-not-allowed"
            : "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
        )}
      >
        <div className="relative w-full shrink-0 overflow-hidden aspect-[16/10]">
          {/* REAL FOOTAGE (owner, 2026-09-10: "trending wale cards me, real
              video thumbnail example add kro"). An earlier cut of this pass
              drew these as CSS/SVG motion sketches because I had only looked
              in `src/assets` and concluded the repo had no video. It does:
              `public/studio-previews/` holds real licensed stock, bundled
              SAME-ORIGIN on purpose (ad blockers silently stall cross-origin
              <video>, see studio-visuals.ts). `videoForSeed` routes each Mode
              id through the themed buckets the wizard's own preview tiles
              use, so the clip is on-theme and deterministic — the same Mode
              always shows the same clip across renders and reloads.
              `PreviewVideo` owns muted-autoplay, the loop, and the Ken-Burns
              poster fallback for when media can't decode. */}
          <PreviewVideo
            src={videoForSeed(`mode:${m.id}`)}
            poster={posterForSeed(`mode:${m.id}`)}
            className="h-full w-full"
          />
          {soon && (
            <span className={cn(SOON_BADGE, "absolute right-2 top-2")}>
              <Lock className="h-2.5 w-2.5" />
              Soon
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-0.5 p-3">
          <p className="break-words text-[13px] font-bold leading-tight text-foreground">
            {m.title}
          </p>
          <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
            {m.desc}
          </p>
        </div>
      </button>
    </li>
  );
}

/**
 * StudioHome — pre-wizard entry screen for Studio Alpha.
 *
 * LAYOUT (2026-09-10, owner). Two instructions reshaped this screen:
 *   1. "Keep only flagship studio design" — the Tone Grid / Flagship Split
 *      comparison toggle shipped on 2026-09-09 is GONE, along with its hook
 *      and its component. One design, no switch. (A peer session did the same
 *      to the wizard's V1/V2 Overview toggle in PR #39 the same day.)
 *   2. "Replace placements of Trending of Other Apps" — the two swapped.
 *      Trending was a cramped dashed shelf beside the Ad panel and is now a
 *      full-width row of animated previews; Other Apps was the full 22-card
 *      roster along the bottom and is now a compact 4-app panel with the rest
 *      behind "View more". The swap IS the "more visibility to Trending" ask —
 *      motion at full width beats a stack of muted rows in a side panel.
 *
 * THE THREE SECTIONS still hold (2026-09-09 IA, unchanged):
 *   1. "Ad" — `MODES.filter(m => m.group === "now")`. 6 live ad-journeys, now
 *      big photographic cards rather than small icon tiles.
 *   2. "Trending" — `MODES.filter(m => m.group === "trending")`. Open-ended by
 *      design ("jab jo chiz chal rhi hai, will add in here").
 *   3. "Other Apps" — the live roster, plus a modal for everything queued.
 *
 * HEIGHT: the old "no vertical scroll at 1440×900" budget is DELIBERATELY
 * retired here. It was what forced the six Modes down to 2.5-padding tiles,
 * which is the exact complaint ("6 modes abhi ignore ho rhe hai") this pass
 * answers. The page scrolls as one document now instead of parking a scroll
 * region inside Other Apps — with artwork on every card there is no honest way
 * to keep it to one viewport, and a real scroll reads better than clipping.
 */
export function StudioHome({ onStart }: StudioHomeProps) {
  // The two grids this screen renders, filtered off ONE array — never two
  // hardcoded id lists. See the `group` field's own doc comment in
  // data/modes.ts for why that matters.
  const nowModes = MODES.filter((m) => m.group === "now");
  const trendingModes = MODES.filter((m) => m.group === "trending");

  const [appsOpen, setAppsOpen] = useState(false);

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
   *  reachable at all — the seeded store can never itself be empty.
   *
   *  MOVED (2026-09-10) out of the Other Apps section header — that section is
   *  a compact side panel now with no room for a trailing link, and this
   *  pointer was never about apps anyway. It takes the hero's top-right slot,
   *  which the deleted direction toggle vacated. */
  const { on: demoOn } = useDemoData();
  const batches = useBatches();
  const batchCount = demoOn ? batches.length : 0;

  return (
    // WIDTH (2026-09-09): was a flat `max-w-3xl` — 768px of an ~1736px content
    // column, 44% utilisation. Widens in two steps (`lg:max-w-5xl` /
    // `2xl:max-w-6xl`, both already in use across genie6).
    // `overflow-y-auto` on the container (2026-09-10): the screen used to pin
    // the hero and scroll only the Other Apps strip. With artwork on every
    // card the whole page is taller than a viewport, so it scrolls as one
    // document — a nested scroll region would now clip the Trending row.
    <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col gap-5 overflow-y-auto px-6 pt-6 pb-8 lg:max-w-5xl 2xl:max-w-6xl">
      {/* ─── HERO ─── */}
      <section className="relative shrink-0">
        {/* Library pointer, top-right. Absent at 0 batches (see `batchCount`). */}
        <div className="mb-2 flex min-h-[1.75rem] items-center justify-end">
          {batchCount > 0 && (
            <Link
              to={LIBRARY_PATH}
              className="fab-focus inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-[10px] text-primary-text transition-colors hover:bg-primary/15"
            >
              {batchCount} {batchCount === 1 ? "batch" : "batches"} in Library
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {/* Eyebrow + title — centered for the home-screen entry-point feel */}
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

        {/* Hero chassis — Ad (the flagship) beside the compact Other Apps
            panel. The split ratio is the one the Flagship Split direction
            shipped with; only its right-hand occupant changed. */}
        <div className="v3-glass rounded-2xl p-5 shadow-md">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.9fr_1fr]">
            {/* ── Ad ── */}
            <div>
              {/* "Ad", not "Mode" — the label has to say what you walk out
                  with. Gated on the roster so the label can never head an
                  empty grid (state coverage — zero-data). */}
              {nowModes.length > 0 ? (
                <>
                  <SectionHeader
                    title="Ad"
                    count={nowModes.length}
                    hint="modes — each one produces a finished ad"
                    size="compact"
                  />
                  <ul className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {nowModes.map((m) => (
                      <ModeCard key={m.id} mode={m} onStart={onStart} />
                    ))}
                  </ul>
                </>
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  No modes yet
                </div>
              )}
            </div>

            {/* ── Other Apps (compact) ── owner's scope cut: the live roster
                only, everything queued behind "View more". Both the grid and
                the button's count read the registry, so neither can claim a
                number the data doesn't have. */}
            {/* Owner (2026-09-10): "Other apps ko waise hi show kro, jaise
                phle trending ko show kr rhe the" — take the compact
                stacked-row shelf the Trending panel used before the two
                swapped places, rather than the chunky 2-col tiles this slot
                first shipped with. Same panel grammar (muted ground, p-3),
                same row anatomy (6×6 tone tile · truncated name · trailing
                glyph), same `space-y-1.5` rhythm.
                ONE deliberate difference: that shelf had a DASHED border,
                which was carrying "Nothing shipped here yet" — these four
                apps have shipped, so a dashed edge here would signal an empty
                state that isn't true. Solid border, everything else as-was. */}
            <div className="flex flex-col rounded-xl border border-border bg-muted/20 p-3">
              <SectionHeader
                title="Other Apps"
                icon={LayoutGrid}
                count={LIVE_APPS.length}
                size="compact"
              />
              <p className="mb-2 mt-0.5 text-[10px] italic text-muted-foreground/80">
                one-shot tools — no wizard, no steps
              </p>

              {LIVE_APPS.length > 0 ? (
                <ul className="space-y-1.5">
                  {LIVE_APPS.map((app) => {
                    const Icon = resolveIcon(app.icon);
                    return (
                      <li key={app.key} className="min-w-0">
                        <Link
                          to={APP_PATH(app.key)}
                          className="fab-focus group/app flex w-full items-center gap-2 rounded-lg border border-border/70 bg-background/60 px-2 py-1.5 text-left transition-colors hover:border-primary/40 hover:bg-background"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary-text">
                            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                          </span>
                          {/* `title` so a long app name stays recoverable —
                              `truncate` in a ~1fr side panel clips hard. */}
                          <p
                            title={app.name}
                            className="min-w-0 flex-1 truncate text-[11px] font-semibold text-foreground"
                          >
                            {app.name}
                          </p>
                          <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground transition-transform group-hover/app:translate-x-0.5" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                /* Zero-data: every app queued. The button below still opens
                   the modal, so the section is never a dead end. */
                <div className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-4 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  None live yet
                </div>
              )}

              {SOON_APPS.length > 0 && (
                <button
                  type="button"
                  onClick={() => setAppsOpen(true)}
                  className="fab-focus mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary-text transition-colors hover:bg-primary/15"
                >
                  <Plus className="h-3 w-3" />
                  View more
                  <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold">
                    {SOON_APPS.length}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRENDING ─── promoted out of the hero's side shelf into a
          full-width row of animated previews. Open-ended by design: new
          approaches land here as formats catch on, so the grid is sized off
          the roster rather than pinned at four. */}
      {trendingModes.length > 0 && (
        <section className="shrink-0">
          <SectionHeader
            title="Trending"
            count={trendingModes.length}
            hint="approaches, coming soon — new ones land here as they catch on"
            size="compact"
          />
          <ul className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {trendingModes.map((m) => (
              <TrendingCard key={m.id} mode={m} onStart={onStart} />
            ))}
          </ul>
        </section>
      )}

      <OtherAppsModal open={appsOpen} onOpenChange={setAppsOpen} />
    </div>
  );
}
