import {
  Camera,
  Captions,
  Clapperboard,
  CopyPlus,
  Megaphone,
  Mic,
  Repeat,
  ShoppingBag,
  Smartphone,
  TrendingUp,
} from "lucide-react";

/**
 * modes — Studio "Mode" metadata (§21.2 / §4).
 *
 * Extracted out of StudioHome.tsx so the SAME roster + tone scheme can also
 * render on the merged Format step (AlphaStep1Format) — §21.2 asks Mode and
 * Format to become one screen, so the mode picker needs a home in two places
 * now: the pre-wizard StudioHome landing page, and the in-wizard step where
 * the user can change it without exiting to Home.
 *
 * §4 — Mode vs ad type is RESOLVED, not open. Mode stays a coarse, separate
 * "creative journey" selector; §4/§5 are unambiguous that the Step-2 tab
 * (Brand/Product/Category) is the ONLY ad-type picker in Genie. Nothing here
 * decides ad type.
 *
 * Maalik's call (2026-09-08): Affiliate and Custom/Manual dropped from
 * Studio entirely — both had sat `available: false` with no shipped date,
 * unlike Product Shoot/Social below which flip straight to live. Product
 * Shoot and Social enabled the same day.
 *
 * Superseded in part (2026-09-09): the roster grew to EIGHT — Podcast (§9,
 * speaker count is what makes it a Mode), Animated AI (Social's shape in
 * animation) and Custom, which he asked back in as the 8th, this time live
 * rather than the `available: false` stub that got dropped. Affiliate stays
 * gone.
 *
 * SPLIT INTO TWO GROUPS, same day (owner): "only 3 section: modes... trending
 * approaches... Other Apps." Studio home now renders two separate mode grids
 * off ONE array, filtered by `group` below — not two hardcoded id lists,
 * which is exactly the class of bug that bit this session three times
 * already today (a hand-copied list silently drifting from its source of
 * truth). `group: "now"` is the 6 live ad-journeys (Podcast and Animated AI
 * moved OUT to make room — see their own entries). `group: "trending"` is a
 * DELIBERATELY OPEN section for trend-led formats: "jab jo chiz chal rhi hai,
 * will add in here" — new cards land here as formats catch on, not only at
 * launch time. All 4 trending entries are `available: false` today because
 * none is built yet, not because the section is permanently soon-only: a
 * trending entry can ship and stay in this group rather than migrating to
 * "now" — the two groups are about WHAT KIND of thing a Mode is, not whether
 * it currently works.
 */
export type AlphaMode =
  | "product-shoot"
  | "brand-ad"
  | "product-ad"
  | "social"
  | "animated-ai"
  | "performance-ad"
  | "podcast"
  | "generate-variations"
  | "gif-video"
  | "static-caption";

/** The three things a generation can be scoped to. */
export type EntityKind = "brand" | "product" | "category";

/**
 * Per-Mode Step-2 rules (Maalik, 2026-09-09, verbatim intent):
 *   Brand Ad       → brand mandatory
 *   Product Ad     → product mandatory
 *   Product Shoot  → product mandatory, MULTI-select
 *   Performance Ad → category mandatory, product optional
 *   Social         → all three optional, "one or nothing"
 *   Animated AI    → same as Social
 * The complaint that produced this: the same three-tab segmented picker was
 * shown for every Mode, so a Brand Ad offered a Category tab that its own
 * flow has no use for, and nothing was ever actually mandatory.
 *
 * NOTE `also`: Performance Ad (category + optional product) and Product Shoot
 * (several products at once) are both impossible under the Step-2 XOR
 * invariant that `brandId`/`productId`/`categoryId` currently encode — see
 * useWizard.ts. `kinds` and `required` are honest here; the picker is what has
 * to catch up, and multi-select needs a state shape XOR can't express.
 */
export interface ModeEntityRule {
  /** Tabs this Mode offers, in display order. */
  kinds: EntityKind[];
  /** Must be picked before the user can continue. null = all optional. */
  required: EntityKind | null;
  /** Any `kinds` beyond `required` that are offered but never blocking. */
  also?: EntityKind[];
  /** `required` accepts more than one selection (Product Shoot only today). */
  multi?: boolean;
}

export interface ModeOption {
  id: AlphaMode;
  Icon: React.ElementType;
  title: string;
  desc: string;
  available: boolean;
  /**
   * Which Studio-home section this Mode's card renders in. REQUIRED, not
   * optional — an optional field with an implicit default is how a new entry
   * silently ends up in the wrong section (or no section) the moment someone
   * forgets to set it; requiring it turns that mistake into a compile error
   * instead of a runtime surprise.
   *   "now"      — the Ad-journey grid. Live, first-class.
   *   "trending" — the Trending Approaches grid, open-ended by design.
   */
  group: "now" | "trending";
  /** Optional badge label shown top-right of the card (e.g. "Affiliate"). */
  tag?: string;
  /** Which Brand/Product/Category the Step-2 picker offers for this Mode, and
   *  which of them the user MUST pick. Absent = the old behaviour (all three
   *  tabs, the target's own `entityRequired` decides). */
  entity?: ModeEntityRule;
  /** Per-mode tonal SCHEME key (same palette as Step 3 Approach). */
  tone: "rose" | "fuchsia" | "lime" | "indigo" | "amber" | "sky" | "slate";
}

/** Soft-tint per card. Shared by StudioHome's grid and Step 1's compact row.
 *  `wash` (2026-09-10, Studio home "Tone Grid" direction) is a two-stop
 *  gradient in the same tone, used ONLY by StudioHome's local `ModeCard` as
 *  its live-card background — a mode's colour carries its identity instead
 *  of a flat white card. Soon cards ignore it (SOON_SURFACE always wins),
 *  and Step 1's compact row doesn't read this field, so adding it here is
 *  additive to every existing consumer. */
export const MODE_SCHEME = {
  rose: {
    bg: "bg-rose-50",   text: "text-rose-600",
    bgSel: "bg-rose-100", textSel: "text-rose-700",
    wash: "bg-gradient-to-br from-rose-50 to-rose-100/70",
  },
  fuchsia: {
    bg: "bg-fuchsia-50", text: "text-fuchsia-600",
    bgSel: "bg-fuchsia-100", textSel: "text-fuchsia-700",
    wash: "bg-gradient-to-br from-fuchsia-50 to-fuchsia-100/70",
  },
  lime: {
    bg: "bg-primary/[0.10]", text: "text-primary",
    bgSel: "bg-primary/[0.18]", textSel: "text-primary",
    wash: "bg-gradient-to-br from-primary/[0.08] to-primary/[0.16]",
  },
  indigo: {
    bg: "bg-indigo-50", text: "text-indigo-600",
    bgSel: "bg-indigo-100", textSel: "text-indigo-700",
    wash: "bg-gradient-to-br from-indigo-50 to-indigo-100/70",
  },
  amber: {
    bg: "bg-amber-50", text: "text-amber-600",
    bgSel: "bg-amber-100", textSel: "text-amber-700",
    wash: "bg-gradient-to-br from-amber-50 to-amber-100/70",
  },
  sky: {
    bg: "bg-sky-50", text: "text-sky-600",
    bgSel: "bg-sky-100", textSel: "text-sky-700",
    wash: "bg-gradient-to-br from-sky-50 to-sky-100/70",
  },
  slate: {
    bg: "bg-slate-50", text: "text-slate-600",
    bgSel: "bg-slate-100", textSel: "text-slate-700",
    wash: "bg-gradient-to-br from-slate-50 to-slate-100/70",
  },
} as const;

export const MODES: ModeOption[] = [
  {
    id: "product-shoot",
    Icon: Camera,
    title: "Product Shoot",
    desc: "Studio-quality product photography. Hero shots, detail macros, bundles.",
    available: true,
    group: "now",
    tone: "rose",
    // Several products in one shoot (bundles, ranges) — the only multi today.
    entity: { kinds: ["product"], required: "product", multi: true },
  },
  {
    id: "brand-ad",
    Icon: Megaphone,
    title: "Brand Ad",
    desc: "Top-of-funnel awareness. Tone, story, brand positioning.",
    available: true,
    group: "now",
    tone: "fuchsia",
    entity: { kinds: ["brand"], required: "brand" },
  },
  {
    id: "product-ad",
    Icon: ShoppingBag,
    title: "Product Ad",
    desc: "Conversion-driven product creative with offer + CTA.",
    available: true,
    group: "now",
    tone: "lime",
    entity: { kinds: ["product"], required: "product" },
  },
  {
    id: "performance-ad",
    Icon: TrendingUp,
    title: "Performance Ad",
    // Maalik (2026-09-08): "Category me hi category Ads bnti hai" — a
    // Category-level ad (rather than one scoped to a single Brand/Product)
    // runs through Performance Ad specifically, not a mode of its own. Led
    // with it so it survives the card's line-clamp-1 even if "Tested
    // angles..." gets truncated; the tag badge is a second, guaranteed-
    // visible confirmation.
    desc: "Category-wide, ROAS-driven. Tested angles, urgency, social proof.",
    tag: "+ Category",
    available: true,
    group: "now",
    tone: "amber",
    // Category is the mandatory scope; a product may narrow it but never
    // replaces it — the one Mode that needs TWO entities set at once.
    entity: { kinds: ["category", "product"], required: "category", also: ["product"] },
  },
  {
    id: "social",
    Icon: Smartphone,
    title: "Social",
    desc: "Organic content for feed, Stories, Reels, and carousels.",
    available: true,
    group: "now",
    tone: "indigo",
    // "One or nothing" — Social is the case that must be able to proceed with
    // no entity at all, which is why `required` is null rather than absent.
    entity: { kinds: ["brand", "product", "category"], required: null },
  },
  {
    id: "generate-variations",
    Icon: CopyPlus,
    // Maalik (2026-09-09, later the same day): "Custom" is replaced by Generate
    // Variations, which has its own locked flow — pick a source ad, say how
    // many, see what we detected, change elements. It is the ONLY Mode that
    // does not enter the 4-step wizard: StudioAlpha's `startWizard` intercepts
    // it and routes to /iq/genie6/variations. `entity` is therefore never read
    // for this Mode (the source ad decides the entity, not a Step-2 pick) and
    // is kept only so the card satisfies the same shape as its siblings.
    title: "Generate Variations",
    desc: "Start from an ad you already have. We read it, then vary what you choose.",
    available: true,
    group: "now",
    tone: "slate",
    entity: { kinds: ["brand", "product", "category"], required: null },
  },

  // ── TRENDING APPROACHES ────────────────────────────────────────────────
  // Kept together here, after every "now" entry, purely for readability —
  // `group` is what StudioHome actually filters on, not array position.
  {
    id: "animated-ai",
    Icon: Clapperboard,
    title: "Animated AI",
    // Maalik (2026-09-08): "same as Social, but with animated video rather
    // than reality type" — the reference case is the "main Hulk hoon re" reel
    // format, which brands, influencers AND performance advertisers all built
    // creative on. So this is trend-led animated video that must be able to
    // come out as a real Ad, not just organic content. Entity stays optional
    // for the same reason a trend format usually isn't brand-tied at the
    // point of pick.
    //
    // MOVED to "trending" (2026-09-09, owner: "only 3 section... trending
    // approaches: Podcast, Animated video..."). Was `available: true` and
    // sat next to Social in the Ad grid; now `available: false` to match
    // "just coming-soon for now" for the whole section. The wizard support
    // behind it is untouched — flipping `available` back to true is what
    // ships it again, same mechanism as Podcast below.
    desc: "Trend-led animated video. Stylised characters, not live-action.",
    available: false,
    group: "trending",
    // Shares Social's tint deliberately — it IS Social's shape, in animation.
    tone: "indigo",
    entity: { kinds: ["brand", "product", "category"], required: null },
  },
  {
    id: "podcast",
    Icon: Mic,
    title: "Podcast",
    // Maalik (2026-09-08): Podcast is its own Mode, not a generation target —
    // what forces that is the speaker count, which no other Mode has: 0, 1, 2,
    // or more, with no upper bound. Entity stays optional here because he
    // expects most podcast content to be editorial rather than tied to a
    // Brand/Product/Category.
    desc: "Conversational audio-led creative. Solo, co-hosted, or no speaker.",
    // Maalik (2026-09-09): "podcast abhi coming soon daal do." The speaker
    // count and its Configure field are built and working behind this flag —
    // flipping `available` back to true is all that ships it. Confirmed
    // staying in "trending" (not moving to "now") the same day the group
    // split landed.
    available: false,
    group: "trending",
    tone: "sky",
    entity: { kinds: ["brand", "product", "category"], required: null },
  },
  {
    id: "gif-video",
    Icon: Repeat,
    title: "Gif Video",
    // Owner (2026-09-09), verbatim list: "Gif video". No spec beyond the
    // name yet — entity kept fully optional (Social/Podcast's shape) rather
    // than guessed at, since nothing here is built. `available: false` is
    // permanent until it is.
    desc: "A short looping clip, formatted and sized like a GIF.",
    available: false,
    group: "trending",
    tone: "indigo",
    entity: { kinds: ["brand", "product", "category"], required: null },
  },
  {
    id: "static-caption",
    Icon: Captions,
    title: "Static + Audio",
    // Owner (2026-09-09), verbatim: "Static image with subtitle and bg
    // audio." Title leads with audio (the less obvious half); the caption
    // half is carried in `desc` and in the icon itself.
    desc: "A still image with on-screen captions and a background audio track.",
    available: false,
    group: "trending",
    tone: "sky",
    entity: { kinds: ["brand", "product", "category"], required: null },
  },
];
