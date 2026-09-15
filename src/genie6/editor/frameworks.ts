/**
 * Frameworks — the Genie 2.0 §21.2 "real object".
 *
 * "'Select the CTA in the framework' requires Framework to be an ordered
 * list of named sections — Hook / Problem / Proof / Demo / CTA — each
 * carrying a time range. It also becomes a saveable, reusable asset type.
 * Storyboard shares this same object: a storyboard IS a framework with
 * per-section visuals. Build them together or build Framework twice."
 *
 * THREE OTHER AGENTS IMPORT THIS FILE — the Catalogue agent (Frameworks as
 * a Creative-asset type, §9), the Brain agent, and the wiring/typecheck
 * pass. The three names in the module manifest (`FrameworkSection`,
 * `Framework`, `FRAMEWORKS`) and the three required fields on each
 * (`{ id, name, startSec, endSec, roll }` / `{ id, name, sections,
 * provenance, usageCount }`) are LOCKED. Every other field below is an
 * extension for the storyboard need, added on top, never in place of them.
 *
 * WHERE THE DATA CAME FROM
 * `src/lib/video-sage-dummy-data.ts` already has four real frameworks
 * analysed on real demo videos — PAS, AIDA (in `ANALYSES[0/1].framework`)
 * and BAB, FAB (in `FRAMEWORK_MAP`) — each with `segments: {label,
 * duration, color}[]`. Those durations ARE this file's time ranges: a
 * cumulative walk over `segments` turns "duration: 8" into
 * `{startSec: 3, endSec: 11}`. This file does not invent a parallel PAS —
 * it derives from the one Video Sage already analysed, and links back to
 * it via `sourceVideoId` (Video Sage's `demo-video-*` ids) so a user who
 * opens the Framework asset can trace it to the video it came from.
 *
 * Five more frameworks are added (real, named marketing structures — HSO,
 * StoryBrand, 4Ps, QUEST) to clear the "8+" floor, plus one deliberately
 * different one: "Carousel Reveal" is `mediaKind: "image-sequence"` — see
 * the note on `imageOutputMode` below for why (§22 item 3, still open).
 *
 * A-ROLL / B-ROLL
 * Direct-address beats (cold open, CTA, testimonial delivery) are a-roll;
 * explanatory/illustrative beats (problem montage, feature cutaways, proof
 * inserts) are b-roll. This is the ONLY place roll is decided at the
 * template level — a specific output's realised instance can end up with a
 * different roll per section once a user swaps in different footage (see
 * `outputFramework.ts`), because per Genie 2.0 §21.2 "A-roll/B-roll
 * replacement is part of the framework-based editor — the same mechanism,
 * not a separate feature": roll is a property of whichever clip is
 * currently in the section, not an independent toggle.
 */
import type { Provenance } from "../lib/genieRunTypes";
import { angles } from "@/mocks/shared/angles";
import { concepts } from "@/mocks/shared/concepts";

/**
 * Owner spec 2026-09-14 — a Framework in the Asset Library reads as "Name ·
 * Angle + concept", and must cover "with or without visual direction — both".
 * This adds the two new fields below (`angleId`/`conceptId`, both optional —
 * see the per-framework rationale comments next to each seed for why) and
 * audits the existing `visualDirection` split.
 *
 * Cycle check done first, per instruction: `angles.ts` imports only
 * `Angle` (type-only) from `types/entities`, so it's a leaf — no risk.
 * `concepts.ts` was mid-edit by another agent to value-import `avatars.ts` +
 * `voices.ts`; traced both — `avatars.ts` value-imports
 * `studio-v4/data/studio-visuals.ts` (which only type-imports from
 * `mocks/sample-outputs.ts`), and `voices.ts` value-imports
 * `brain/avatarTaxonomy.ts` (which only type-imports `Brand`). Neither leads
 * back to this file, `catalogue/assetTypes.ts`, `brain/GenieBrain.tsx`, or
 * `video-sage/SaveFrameworkDialog.tsx` (the only files that import this
 * module) — no cycle.
 *
 * `visualDirection` audit BEFORE this change: all 9 frameworks carried it on
 * every section (PAS/AIDA/BAB/FAB derived verbatim from real analysed video,
 * HSO/StoryBrand/Carousel Reveal are shot-specific by nature). AFTER: 4Ps and
 * QUEST have it stripped from every section — both are named, described
 * above as translations of pure copywriting/direct-response formulas (4Ps:
 * "Copywriting's oldest structure, translated to video"; QUEST: a
 * considered-purchase funnel, not a shot list) rather than a specific shoot
 * plan, so they are the honest "structure only" candidates the owner asked
 * for. The other 7 keep every section's `visualDirection` unchanged.
 */
/**
 * Drops an `angleId`/`conceptId` that no longer resolves, rather than letting
 * it through — a dangling id would render as a broken cross-link in the
 * Asset Library.
 *
 * It DROPS and warns; it must never throw. This runs at module load, and
 * `FRAMEWORKS` is imported by `catalogue/assetTypes.ts`, which the sidebar
 * itself imports — so a throw here does not surface as "one framework has a
 * bad link", it blanks the entire app before anything renders. The seed
 * arrays this validates against are edited by hand in a prototype; a typo
 * there should cost one missing chip, not the whole build. (Same class of
 * failure as the TDZ `ReferenceError` documented in CLAUDE.md: it
 * type-checked fine, only running it failed.)
 */
function withResolvedLinks(fw: Framework): Framework {
  const next = { ...fw };
  if (next.angleId && !angles.some((a) => a.id === next.angleId)) {
    console.warn(`[frameworks] "${next.id}" drops unknown angleId "${next.angleId}"`);
    next.angleId = undefined;
  }
  if (next.conceptId && !concepts.some((c) => c.id === next.conceptId)) {
    console.warn(`[frameworks] "${next.id}" drops unknown conceptId "${next.conceptId}"`);
    next.conceptId = undefined;
  }
  return next;
}

/** LOCKED — do not rename or drop a required field. Optional fields below
 *  are the storyboard extension: a storyboard is a Framework whose sections
 *  carry `visualDirection` (what the frame shows) and `dialogue` (what's
 *  said/on-screen), so no parallel Storyboard type exists (§21.2). */
export interface FrameworkSection {
  id: string;
  name: string;
  startSec: number;
  endSec: number;
  roll: "a-roll" | "b-roll";
  /** The shot currently filling this section. Absent = "not generated yet" —
   *  this is what makes an output's framework instance read as PARTIAL. */
  thumbnail?: string;
  /** Free-text note — editorial comment, or the reason a shot is missing. */
  note?: string;
  /** Storyboard need — what the shot SHOWS. Present on every template
   *  section below so a Framework asset doubles as a Storyboard on open. */
  visualDirection?: string;
  /** Storyboard need — the line spoken or on-screen for this beat. */
  dialogue?: string;
}

/** LOCKED — do not rename or drop a required field. */
export interface Framework {
  id: string;
  name: string;
  sections: FrameworkSection[];
  /** §21.2 — every asset carries provenance, shown in the client UI. */
  provenance: Provenance;
  /** "13 runs" — asset-card grammar (§21.2). */
  usageCount: number;

  /** Spelled-out name, e.g. "Problem-Agitate-Solution" for "PAS". */
  fullName?: string;
  /** One line: what kind of ad this structure suits. Shown on the asset card. */
  description?: string;
  /**
   * §22 item 3 — "Storyboard for Image: one carousel with N frames, or N
   * separate ads? Different data model, different results screen, different
   * launch behaviour" is explicitly STILL OPEN. This field is how a
   * Framework can describe an image-led structure WITHOUT the data model
   * taking a side: "video" is the default and needs no per-section slide
   * semantics; "image-sequence" flags a structure whose sections are
   * ordered STILLS rather than a continuous timeline (so `startSec`/`endSec`
   * are read as "seconds this frame holds the screen in an exported
   * sequence", not literal video timecodes — the same numeric shape serves
   * both readings without forking the type).
   */
  mediaKind?: "video" | "image-sequence";
  /**
   * Only meaningful when `mediaKind === "image-sequence"`, and deliberately
   * OPTIONAL/undefined-able so the object never forces an answer to §22
   * item 3 — see the one seed below that leaves this unset on purpose, and
   * FrameworkEditor's report note on what it defaults to for DISPLAY only.
   */
  imageOutputMode?: "carousel" | "separate-ads";
  /** Video Sage's `demo-video-*` id this framework was analysed from, when
   *  the framework is a derivation rather than an authored template. */
  sourceVideoId?: string;

  /** Owner spec 2026-09-14 — the selling angle (from `@/mocks/shared/angles`)
   *  this structure best suits, e.g. PAS → a problem-led angle. Optional:
   *  a structure can be angle-agnostic. */
  angleId?: string;
  /** Owner spec 2026-09-14 — a worked example concept (from
   *  `@/mocks/shared/concepts`) showing the structure applied to a real
   *  brand/visual-direction pairing. Optional and deliberately UNSET on one
   *  seed below (Carousel Reveal) — see its comment for why "with or without
   *  a concept" is the honest state, not an oversight. */
  conceptId?: string;
}

type SegSeed = {
  label: string;
  duration: number;
  roll: "a-roll" | "b-roll";
  thumbnail?: string;
  note?: string;
  /** Optional — see the owner-spec comment above `withResolvedLinks`: 4Ps and
   *  QUEST omit this on every section (structure-only), everyone else keeps
   *  it, so both render states exist in the seed data. */
  visualDirection?: string;
  dialogue: string;
};

/** Cumulative walk: `duration` → real `startSec`/`endSec` that add up. */
function buildSections(frameworkId: string, segs: SegSeed[]): FrameworkSection[] {
  let t = 0;
  return segs.map((s, i) => {
    const startSec = t;
    t += s.duration;
    return {
      id: `${frameworkId}-sec-${i + 1}`,
      name: s.label,
      startSec,
      endSec: t,
      roll: s.roll,
      thumbnail: s.thumbnail ?? `https://picsum.photos/seed/fw-${frameworkId}-${i + 1}/400/225`,
      ...(s.note ? { note: s.note } : {}),
      ...(s.visualDirection ? { visualDirection: s.visualDirection } : {}),
      dialogue: s.dialogue,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────
// 1–4: derived verbatim from src/lib/video-sage-dummy-data.ts durations
// (ANALYSES[0]=PAS, ANALYSES[1]=AIDA, FRAMEWORK_MAP.BAB, FRAMEWORK_MAP.FAB).
// ─────────────────────────────────────────────────────────────────────────

const PAS: Framework = {
  id: "fw-pas",
  name: "PAS",
  fullName: "Problem-Agitate-Solution",
  description: "Cold-open pain point, twist the knife, then relieve it with the product. Direct-response staple.",
  provenance: "fabfunnel-seeded",
  usageCount: 212,
  sourceVideoId: "demo-video-2",
  // Angle: problem-led, the direct hit for a Problem-Agitate-Solution beat.
  // Concept: the-derma-co's BHA concept is itself tagged "Problem-solution"
  // and its visual direction is literally an acne before/after + 30-day
  // timeline — Agitate (acne) into Solution (proof), the same shape as PAS.
  angleId: "ang-problem-solution",
  conceptId: "concept-derma-sa-clear",
  sections: buildSections("pas", [
    { label: "Hook", duration: 3, roll: "a-roll", visualDirection: "Close-up, direct address to camera", dialogue: "Are you tired of dealing with this every single day?" },
    { label: "Problem", duration: 8, roll: "b-roll", visualDirection: "Montage — the everyday frustration this problem causes, shown not told", dialogue: "This is a problem millions of people deal with, quietly, every day." },
    { label: "Agitate", duration: 12, roll: "b-roll", visualDirection: "Split screen — the workaround people already tried, still falling short", dialogue: "The fixes you've already tried only cover it up, temporarily." },
    { label: "Solution", duration: 10, roll: "a-roll", visualDirection: "Product shot with real proof on screen — data, certification, or a testimonial", dialogue: "This is built differently — and the proof is right here, not just a claim." },
    { label: "CTA", duration: 3, roll: "a-roll", visualDirection: "Product shot with the offer and next step clearly on screen", dialogue: "Get the offer while it's live — the link's right here." },
  ]),
};

const AIDA: Framework = {
  id: "fw-aida",
  name: "AIDA",
  fullName: "Attention-Interest-Desire-Action",
  description: "Classic four-beat funnel — grab attention, build interest with proof, create desire, close with action.",
  provenance: "fabfunnel-seeded",
  usageCount: 178,
  sourceVideoId: "demo-video-3",
  // Angle: Comparison — AIDA's Interest beat is explicitly "compared against
  // the old way". Concept: noise's ColorFit Pro 5 concept is tagged
  // "Comparison" too and its own arc (3 watches lined up → the one that
  // stayed → pricing) tracks AIDA's four beats almost exactly.
  angleId: "ang-comparison",
  conceptId: "concept-noise-perf-comparison",
  sections: buildSections("aida", [
    { label: "Attention", duration: 4, roll: "a-roll", visualDirection: "High-energy cold open — mid-action, dramatic framing", dialogue: "What if the thing you've been putting up with didn't have to be this hard?" },
    { label: "Interest", duration: 10, roll: "b-roll", visualDirection: "Explainer visuals — the mechanism, compared against the old way", dialogue: "Here's exactly why this works faster than what you're used to." },
    { label: "Desire", duration: 14, roll: "b-roll", visualDirection: "Testimonial cutaways from real customers, before/after where it applies", dialogue: "Tens of thousands of people already made the switch — here's what they say." },
    { label: "Action", duration: 4, roll: "a-roll", visualDirection: "Product lineup with pricing, limited time badge", dialogue: "Join them today — the first step costs you nothing to try." },
  ]),
};

const BAB: Framework = {
  id: "fw-bab",
  name: "BAB",
  fullName: "Before-After-Bridge",
  description: "Show the pain state, show the resolved state, then bridge the gap with the product as the mechanism.",
  provenance: "fabfunnel-seeded",
  usageCount: 96,
  sourceVideoId: "demo-video-4",
  // Angle: Before-after, the literal name-match for a transformation
  // structure. Concept: Wakefit's back-pain concept is tagged
  // "Problem-solution" in its own catalogue entry, but its visual direction
  // — "Person tossing in bed → switch → peaceful sleep · split-screen" — IS
  // a before/after split screen, a better fit for BAB than any concept
  // actually labelled "Before-after" (none exists in the catalogue).
  angleId: "ang-before-after",
  conceptId: "concept-wakefit-back-pain",
  sections: buildSections("bab", [
    { label: "Before", duration: 10, roll: "a-roll", visualDirection: "The old way — visibly effortful, cluttered, exhausting", dialogue: "Before this, it used to take hours and it was exhausting every time." },
    { label: "After", duration: 12, roll: "a-roll", visualDirection: "Same subject, visibly relaxed, the product doing the work", dialogue: "Now it takes minutes — same effort, ten times the result." },
    { label: "Bridge", duration: 10, roll: "b-roll", visualDirection: "Product walkthrough — the mechanism doing the work, step by step", dialogue: "The difference is one thing: it handles the hard part for you." },
  ]),
};

const FAB: Framework = {
  id: "fw-fab",
  name: "FAB",
  fullName: "Features-Advantages-Benefits",
  description: "Walk from what the product DOES, to why that matters, to what the customer actually GETS.",
  provenance: "fabfunnel-seeded",
  usageCount: 61,
  sourceVideoId: "demo-video-6",
  // Angle + concept: Plum's niacinamide concept is tagged "Ingredient
  // deep-dive" and its own arc — macro pore-texture before/after over a
  // 30-day timeline — walks Feature (the ingredient %) → Advantage (visible
  // pore change) → Benefit (clear skin over time), the same shape as FAB.
  angleId: "ang-ingredient-deep-dive",
  conceptId: "concept-plum-niacinamide",
  sections: buildSections("fab", [
    { label: "Features", duration: 10, roll: "b-roll", visualDirection: "Product walkthrough — each feature shown doing its job, back to back", dialogue: "Here's exactly what it does — no fluff, just the feature list." },
    { label: "Advantages", duration: 10, roll: "b-roll", visualDirection: "Comparison — time, effort or cost saved against doing it manually", dialogue: "That means far less time spent on the parts that used to slow you down." },
    { label: "Benefits", duration: 12, roll: "a-roll", visualDirection: "Happy customer testimonials, real growth numbers on screen", dialogue: "The people using it are already seeing it pay off — you could be next." },
  ]),
};

// ─────────────────────────────────────────────────────────────────────────
// 5–8: real, named short-form ad structures (not in Video Sage's pool) —
// clears the "8+" floor without inventing a parallel PAS/AIDA.
// ─────────────────────────────────────────────────────────────────────────

const HSO: Framework = {
  id: "fw-hso",
  name: "HSO",
  fullName: "Hook-Story-Offer",
  description: "The DTC UGC workhorse — three beats only. A strong cold open, a lived story, a hard offer.",
  provenance: "fabfunnel-seeded",
  usageCount: 34,
  // Angle + concept: Mamaearth's mom-emotional concept is tagged "Emotional
  // storytelling" and its own visual direction — "Real mom + toddler in
  // bath · UGC handheld feel · 30s narrative arc" — is a literal HSO Story
  // beat (UGC talking-head intercut with daily use).
  angleId: "ang-emotional-story",
  conceptId: "concept-mamaearth-mom-emotional",
  sections: buildSections("hso", [
    { label: "Hook", duration: 4, roll: "a-roll", visualDirection: "Handheld, mid-sentence cold open — feels caught, not staged", dialogue: "I almost didn't post this, but enough people asked." },
    { label: "Story", duration: 20, roll: "a-roll", visualDirection: "UGC talking-head intercut with the product in daily use", dialogue: "I'd tried everything before this — this is the only one that actually stuck." },
    { label: "Offer", duration: 8, roll: "a-roll", visualDirection: "Product in hand, price and code clearly on screen", dialogue: "Use the code before it's gone — it's sold out before." },
  ]),
};

const STORYBRAND: Framework = {
  id: "fw-storybrand",
  name: "StoryBrand",
  fullName: "Character-Problem-Guide-Plan-CTA",
  description: "The customer is the hero, the brand is the guide. Five beats, built for founder-led and B2B ads.",
  provenance: "client-created",
  usageCount: 9,
  // Angle + concept: the-derma-co's clinical-credibility concept is tagged
  // "Authority" and shows the brand positioned as the dermatologist expert —
  // exactly StoryBrand's Guide beat ("the brand is the guide").
  angleId: "ang-authority",
  conceptId: "concept-derma-clinical",
  sections: buildSections("storybrand", [
    { label: "Character", duration: 5, roll: "a-roll", visualDirection: "Founder or customer introduced, establishing shot", dialogue: "Every person like you hits the same wall eventually." },
    { label: "Problem", duration: 8, roll: "b-roll", visualDirection: "The obstacle, made concrete and specific", dialogue: "It's not one big problem — it's the same small one, every single day." },
    { label: "Guide", duration: 6, roll: "a-roll", visualDirection: "Brand positioned as the expert who has solved this before", dialogue: "We've helped people solve exactly this, over and over." },
    { label: "Plan", duration: 6, roll: "b-roll", visualDirection: "Simple step-by-step walkthrough of how it works", dialogue: "Here's all it takes — three steps, start to finish." },
    { label: "CTA", duration: 5, roll: "a-roll", visualDirection: "Direct ask, product mark, clear next step on screen", dialogue: "Start today — there's nothing to lose in trying." },
  ]),
};

const FOUR_PS: Framework = {
  id: "fw-4ps",
  name: "4Ps",
  fullName: "Promise-Picture-Proof-Push",
  description: "Copywriting's oldest structure, translated to video — make a promise, picture the payoff, prove it, push to act.",
  provenance: "fabfunnel-seeded",
  usageCount: 17,
  // Angle + concept: Promise's own dialogue ("...or your money back") IS a
  // risk-reversal promise. Sleepyhead's 100-night-trial concept is tagged
  // "Risk reversal" and its hook is the same guarantee verbatim.
  angleId: "ang-risk-reversal",
  conceptId: "concept-sleepyhead-100-night",
  // visualDirection stripped from every section below — 4Ps is "Copywriting's
  // oldest structure, translated to video" (see description above), a
  // direct-response copy formula rather than a shot list. This is one of the
  // 2 seeds deliberately left structure-only, per the owner-spec comment
  // above `withResolvedLinks` — the "without visual direction" render state.
  sections: buildSections("4ps", [
    { label: "Promise", duration: 5, roll: "a-roll", dialogue: "A real result, in a real number of days — or your money back." },
    { label: "Picture", duration: 10, roll: "b-roll", dialogue: "Picture actually liking the result, without thinking twice about it." },
    { label: "Proof", duration: 10, roll: "b-roll", dialogue: "Thousands of verified reviews say the same thing we just did." },
    { label: "Push", duration: 5, roll: "a-roll", dialogue: "Today only — act on it before the offer's gone." },
  ]),
};

const QUEST: Framework = {
  id: "fw-quest",
  name: "QUEST",
  fullName: "Qualify-Understand-Educate-Stimulate-Transition",
  description: "A slower-burn five-beat structure for considered purchases — qualifies the viewer before it educates them.",
  provenance: "client-created",
  usageCount: 3,
  // Angle + concept: the Educate beat is a demo of the mechanism — Lenskart's
  // 3D try-on concept is tagged "Explainer" and is that exact demo, for the
  // same kind of considered purchase (eyewear) QUEST is built for.
  angleId: "ang-explainer",
  conceptId: "concept-lenskart-3d-tryon",
  // visualDirection stripped from every section below — the other of the 2
  // deliberately structure-only seeds (see the 4Ps comment above and the
  // owner-spec note by `withResolvedLinks`): QUEST is a considered-purchase
  // funnel shape, not a shoot plan.
  sections: buildSections("quest", [
    { label: "Qualify", duration: 4, roll: "a-roll", dialogue: "Still comparing options after weeks of looking? This one's for you." },
    { label: "Understand", duration: 6, roll: "a-roll", dialogue: "You've read every review. You still don't know which one to trust." },
    { label: "Educate", duration: 10, roll: "b-roll", dialogue: "Here's the one thing that makes this different, tested and proven." },
    { label: "Stimulate", duration: 8, roll: "b-roll", dialogue: "Thousands of people already switched over in the last year alone." },
    { label: "Transition", duration: 4, roll: "a-roll", dialogue: "Try it risk-free — send it back if it's not the one." },
  ]),
};

// ─────────────────────────────────────────────────────────────────────────
// 9: Storyboard-for-Image — §22 item 3 is deliberately left OPEN here.
// `imageOutputMode` is UNSET on purpose: this Framework instance is the
// proof that the object can describe an image-led structure without
// picking "one carousel" vs "N separate ads" for it. FrameworkEditor
// defaults the on-screen READING to "carousel" — see its file header for
// why — but the data underneath never commits.
// ─────────────────────────────────────────────────────────────────────────

const CAROUSEL_REVEAL: Framework = {
  id: "fw-carousel-reveal",
  name: "Carousel Reveal",
  fullName: "Cover-Problem-Feature-Feature-Offer",
  // §22 item 3 (carousel vs separate ads) is still open — that's a comment
  // for us, not copy for the user. Spec section numbers never render.
  description: "A 5-frame reveal built for Meta carousel — one beat per card, image-led.",
  provenance: "client-created",
  usageCount: 2,
  mediaKind: "image-sequence",
  // imageOutputMode intentionally omitted — see note above.
  // Angle: Feature 2's beat is a certification badge shot verbatim
  // ("Tested and certified — nothing to second-guess") — "ang-certification"
  // is the literal match, distinct from every other framework's angle here.
  angleId: "ang-certification",
  // conceptId deliberately left UNSET — this is the "one or two frameworks
  // with no concept" the owner said was fine and realistic. Carousel Reveal
  // is a generic, product-agnostic Meta-carousel shape (any brand, any
  // vertical); tying it to one brand's worked example would undercut the
  // universality that's the whole point of the template, unlike the other 8
  // seeds above which each got a concept chosen for a specific structural
  // echo.
  sections: buildSections("carousel-reveal", [
    { label: "Cover", duration: 3, roll: "a-roll", visualDirection: "Bold product hero shot, single word headline", dialogue: "Finally." },
    { label: "Problem", duration: 3, roll: "b-roll", visualDirection: "The frustration, shown not told — failed attempts, visibly discarded", dialogue: "Tried everything else. None of it actually worked." },
    { label: "Feature 1", duration: 3, roll: "b-roll", visualDirection: "Macro detail shot with a single callout label", dialogue: "One detail. One reason it works." },
    { label: "Feature 2", duration: 3, roll: "b-roll", visualDirection: "Packaging or detail shot with certification badges", dialogue: "Tested and certified — nothing to second-guess." },
    { label: "Offer", duration: 3, roll: "a-roll", visualDirection: "Price card, swipe-to-shop arrow", dialogue: "One price. Swipe to shop." },
  ]),
};

/** At least 8, seeded — Catalogue's Frameworks asset type reads this directly.
 *  `.map(withResolvedLinks)` validates every `angleId`/`conceptId` above at
 *  module load and DROPS any that no longer resolves, warning to the console.
 *  It deliberately does not throw — see that function's own comment for why a
 *  throw here would blank the whole app. `strict`/`strictNullChecks` are OFF
 *  in this repo (CLAUDE.md's typecheck gotcha), so `tsc` alone cannot catch a
 *  bad id and this runtime pass is what actually does. */
export const FRAMEWORKS: Framework[] = [
  PAS,
  AIDA,
  BAB,
  FAB,
  HSO,
  STORYBRAND,
  FOUR_PS,
  QUEST,
  CAROUSEL_REVEAL,
].map(withResolvedLinks);

export function getFramework(id: string): Framework | undefined {
  return FRAMEWORKS.find((f) => f.id === id);
}

/** Total runtime (or, for an image-sequence framework, total on-screen
 *  seconds across the sequence) — the last section's endSec. */
export function frameworkDuration(fw: Framework): number {
  const last = fw.sections[fw.sections.length - 1];
  return last ? last.endSec : 0;
}
