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
}

type SegSeed = {
  label: string;
  duration: number;
  roll: "a-roll" | "b-roll";
  thumbnail?: string;
  note?: string;
  visualDirection: string;
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
      visualDirection: s.visualDirection,
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
  sections: buildSections("4ps", [
    { label: "Promise", duration: 5, roll: "a-roll", visualDirection: "Bold on-screen claim, direct address", dialogue: "A real result, in a real number of days — or your money back." },
    { label: "Picture", duration: 10, roll: "b-roll", visualDirection: "Aspirational shots of the payoff, lived-in not staged", dialogue: "Picture actually liking the result, without thinking twice about it." },
    { label: "Proof", duration: 10, roll: "b-roll", visualDirection: "Before/after or close-up detail, review overlay", dialogue: "Thousands of verified reviews say the same thing we just did." },
    { label: "Push", duration: 5, roll: "a-roll", visualDirection: "Product in hand, offer card on screen", dialogue: "Today only — act on it before the offer's gone." },
  ]),
};

const QUEST: Framework = {
  id: "fw-quest",
  name: "QUEST",
  fullName: "Qualify-Understand-Educate-Stimulate-Transition",
  description: "A slower-burn five-beat structure for considered purchases — qualifies the viewer before it educates them.",
  provenance: "client-created",
  usageCount: 3,
  sections: buildSections("quest", [
    { label: "Qualify", duration: 4, roll: "a-roll", visualDirection: "Direct question to camera, filters the audience", dialogue: "Still comparing options after weeks of looking? This one's for you." },
    { label: "Understand", duration: 6, roll: "a-roll", visualDirection: "Empathetic delivery, names the specific frustration", dialogue: "You've read every review. You still don't know which one to trust." },
    { label: "Educate", duration: 10, roll: "b-roll", visualDirection: "Cutaway diagram or demo of how it actually works", dialogue: "Here's the one thing that makes this different, tested and proven." },
    { label: "Stimulate", duration: 8, roll: "b-roll", visualDirection: "Real customer reaction, first use or first result", dialogue: "Thousands of people already switched over in the last year alone." },
    { label: "Transition", duration: 4, roll: "a-roll", visualDirection: "Product shot with the risk-reversal clearly on screen", dialogue: "Try it risk-free — send it back if it's not the one." },
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
  sections: buildSections("carousel-reveal", [
    { label: "Cover", duration: 3, roll: "a-roll", visualDirection: "Bold product hero shot, single word headline", dialogue: "Finally." },
    { label: "Problem", duration: 3, roll: "b-roll", visualDirection: "The frustration, shown not told — failed attempts, visibly discarded", dialogue: "Tried everything else. None of it actually worked." },
    { label: "Feature 1", duration: 3, roll: "b-roll", visualDirection: "Macro detail shot with a single callout label", dialogue: "One detail. One reason it works." },
    { label: "Feature 2", duration: 3, roll: "b-roll", visualDirection: "Packaging or detail shot with certification badges", dialogue: "Tested and certified — nothing to second-guess." },
    { label: "Offer", duration: 3, roll: "a-roll", visualDirection: "Price card, swipe-to-shop arrow", dialogue: "One price. Swipe to shop." },
  ]),
};

/** At least 8, seeded — Catalogue's Frameworks asset type reads this directly. */
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
];

export function getFramework(id: string): Framework | undefined {
  return FRAMEWORKS.find((f) => f.id === id);
}

/** Total runtime (or, for an image-sequence framework, total on-screen
 *  seconds across the sequence) — the last section's endSec. */
export function frameworkDuration(fw: Framework): number {
  const last = fw.sections[fw.sections.length - 1];
  return last ? last.endSec : 0;
}
