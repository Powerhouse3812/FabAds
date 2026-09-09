import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, LayoutGrid, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "../components/SectionHeader";
import { StudioHomeDirectionToggle } from "../components/StudioHomeDirectionToggle";
import { useStudioHomeDirection } from "../state/useStudioHomeDirection";
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

/**
 * ModeCard — the ONE renderer both the "Ad" and "Trending" grids call
 * (2026-09-09, when the roster split into two grids off the same array).
 * `available` decides a card's skin — live vs. Soon — not which grid it
 * renders in, so a Trending entry that ships can stay in Trending and read
 * as live with zero markup changes. A second copy of this button was the
 * exact kind of duplication that made this session's badge-grammar and
 * focus-ring fixes have to be applied twice already; there is now nowhere
 * for the two grids to disagree.
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
    // push the row wider than the 4 columns and break the grid.
    <li className="min-w-0">
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
            : cn(
                "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm",
                SCHEME[m.tone].wash,
              ),
        )}
      >
        {/* Corner slot: SOON wins if a Mode is ever both unavailable and
            tagged (no Mode is today); the requirement tag otherwise. See the
            CORNER BADGE comment above for why both share this slot again. */}
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
            soon ? SOON_ICON_TILE : cn(SCHEME[m.tone].bg, SCHEME[m.tone].text),
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
}

/**
 * StudioHome (A-12.9 hero pass, §5 apps-strip pass, 2026-09-09 3-section
 * pass) — pre-wizard entry screen for Studio Alpha.
 *
 * THREE SECTIONS (owner, 2026-09-09, verbatim IA): "only 3 section: modes...
 * trending approaches... Other Apps." This replaced a 2-group hero card (Ad
 * modes + Script/Concept/Storyboard) — the asset-generation group is REMOVED
 * (see `onGenerateAsset`'s doc comment), and the Ad grid's own roster split in
 * two:
 *   1. "Ad" — `MODES.filter(m => m.group === "now")`. 6 live ad-journeys.
 *   2. "Trending" — `MODES.filter(m => m.group === "trending")`. Open-ended
 *      by design ("jab jo chiz chal rhi hai, will add in here"); every entry
 *      today is `available: false`, badged Soon, same card and same disabled
 *      skin as a Soon entry in group 1 — see `renderModeCard` below, the ONE
 *      renderer both grids call, so the two can never drift the way this
 *      session's duplicated card markup already has once today.
 *   3. Other Apps — a wrapping grid of the real GENIE_APPS tools.
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
export function StudioHome({ onStart }: StudioHomeProps) {
  // The two grids this screen renders, filtered off ONE array — never two
  // hardcoded id lists. See the `group` field's own doc comment in
  // data/modes.ts for why that matters.
  const nowModes = MODES.filter((m) => m.group === "now");
  const trendingModes = MODES.filter((m) => m.group === "trending");
  const { direction, setDirection } = useStudioHomeDirection();

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
        {/* Direction toggle (Maalik, 2026-09-10) — two Studio-home layout
            directions from the HeyGen/Worify comparison round, rebuilt in
            our own tokens. Not dev-gated: both are live on the deployed
            app, persisted per-browser via useStudioHomeDirection. */}
        <div className="mb-2 flex items-center justify-end">
          <StudioHomeDirectionToggle active={direction} onSwitch={setDirection} />
        </div>

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

        {/* Hero card — elevated glass chassis containing both mode grids
            (2026-09-09: "Ad" + "Trending"), same card type, same button
            (`ModeCard`), spaced by `mt-4` — no divider rule; the two
            SectionHeaders already mark the boundary. */}
        <div className="v3-glass rounded-2xl p-5 shadow-md">
          {direction === "toneGrid" ? (
            <>
              {/* Ad grid — live ad-journeys only (`group === "now"`). 6 cards
                  today; 4-col lands 4+2 without a lonely trailing single. */}
              <div>
                {/* "Ad", not "Mode" — the label has to say what you walk out
                    with; `count` carries the roster size that the label can't,
                    and the hint keeps the word "mode" on screen since the
                    wizard's Step 1 and the ContextRail both call it that. Gated
                    on the roster so the label can never head an empty grid
                    (state coverage — zero-data).
                    `count`/the grid both read `nowModes`, not `MODES` — the
                    stale version of this comment (before the 3-section split)
                    had to carry a paragraph explaining why the count included
                    Podcast; Podcast is in the Trending grid now, so that
                    imprecision is gone, not just accepted. Product Shoot is
                    still `group: "now"` and still `asset` by `deriveCategory`
                    (StudioAlpha.tsx) — that half of the original imprecision is
                    unchanged, and still the owner's explicit "leave it". */}
                {nowModes.length > 0 && (
                  <SectionHeader
                    title="Ad"
                    count={nowModes.length}
                    hint="modes — each one produces a finished ad"
                    size="compact"
                  />
                )}
                <ul className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
                  {nowModes.map((m) => (
                    <ModeCard key={m.id} mode={m} onStart={onStart} />
                  ))}
                </ul>
              </div>

              {/* Trending grid — `group === "trending"`, open-ended by design.
                  Owner (2026-09-09): "jab jo chiz chal rhi hai, will add in
                  here." Every entry is `available: false` today (nothing here
                  is built yet), so `ModeCard` renders all four Soon — but Soon
                  is a property of `available`, not of this grid, so a trending
                  entry that ships stays here and simply stops being disabled;
                  it does not need to migrate to the Ad grid. */}
              {trendingModes.length > 0 && (
                <div className="mt-4">
                  <SectionHeader
                    title="Trending"
                    count={trendingModes.length}
                    hint="approaches, coming soon — new ones land here as they catch on"
                    size="compact"
                  />
                  <ul className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
                    {trendingModes.map((m) => (
                      <ModeCard key={m.id} mode={m} onStart={onStart} />
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            /* "Flagship Split" (Maalik, 2026-09-10) — Ad collapses into one
               confident panel (badge + headline + a compact chip per mode,
               each one a REAL `onStart` call, not decorative) since no
               single mode in the roster is signalled as "the" default; a
               generic catch-all CTA would have had to invent a favourite, so
               there isn't one — the chips themselves are the only call to
               action. Trending gets a dashed "nothing shipped yet" shelf;
               the caption is data-driven off `available`, not hardcoded, so
               it stops claiming "nothing shipped" the day one entry ships. */
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.65fr_1fr]">
              <div className="rounded-xl border border-border bg-background p-4">
                <span className="mb-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-primary-text">
                  Start here
                </span>
                <h3 className="mb-1 text-[15px] font-bold leading-snug text-foreground">
                  {nowModes.length} guided modes — Studio runs the rest
                </h3>
                <p className="mb-3 text-[11px] text-muted-foreground">
                  Pick one, Studio fills in everything else.
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {nowModes.map((m) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => onStart(m.id)}
                        className="fab-focus inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1.5 text-[11px] font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40"
                      >
                        <span
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded-full",
                            SCHEME[m.tone].bg,
                            SCHEME[m.tone].text,
                          )}
                        >
                          <m.Icon className="h-3 w-3" strokeWidth={2} />
                        </span>
                        {m.title}
                        {m.tag && (
                          <span className="ml-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 font-mono text-[8px] font-semibold uppercase text-primary-text">
                            {m.tag}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {trendingModes.length > 0 && (
                <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-4">
                  <p className="mb-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {trendingModes.every((m) => !m.available)
                      ? "Nothing shipped here yet"
                      : "New this week"}
                  </p>
                  <h4 className="mb-2.5 text-[14px] font-bold text-foreground">Trending</h4>
                  <ul className="space-y-1.5">
                    {trendingModes.map((m) => {
                      const soon = !m.available;
                      return (
                        <li key={m.id}>
                          <button
                            type="button"
                            disabled={soon}
                            aria-disabled={soon}
                            onClick={() => m.available && onStart(m.id)}
                            title={m.available ? undefined : `${m.title} — coming soon`}
                            className={cn(
                              "fab-focus flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors",
                              soon
                                ? cn("cursor-not-allowed", SOON_SURFACE)
                                : "border-border/70 bg-background/60 hover:border-primary/40",
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                                soon ? SOON_ICON_TILE : cn(SCHEME[m.tone].bg, SCHEME[m.tone].text),
                              )}
                            >
                              <m.Icon className="h-3.5 w-3.5" strokeWidth={2} />
                            </span>
                            <p
                              className={cn(
                                "min-w-0 flex-1 truncate text-[11px] font-semibold",
                                soon ? "text-muted-foreground" : "text-foreground",
                              )}
                            >
                              {m.title}
                            </p>
                            {soon && <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
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
