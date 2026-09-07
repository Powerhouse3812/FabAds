/**
 * Other Flows — the registry (Genie 2.0 §7).
 *
 * Two flat tables, not a nested one. A module lists WHICH actions it offers
 * (by id); the action itself is defined once, in FLOW_ACTIONS, and reused by
 * every module that offers it. This is deliberate: Rule 1 and Rule 2 say the
 * SAME action must look and behave identically no matter which module sent
 * the user in ("Same wording, same behaviour, same result in all three" —
 * handoff §21.2, said about variation, but it is the house rule for every
 * action here). A per-module copy of "Vary script" would drift in wording
 * the first time someone edited only one of them.
 *
 * FLOW_MODULES is in the exact §7 table order (Industry Insights → Co-pilot).
 * The 7 live modules carry real action lists; the 4 coming-soon modules carry
 * an empty one — there is nothing to wire yet, and an empty list is honest
 * about that instead of guessing.
 *
 * ASSETS TOO, NOT ONLY ADS (2026-09-08) — six actions now carry a formal
 * `source` (use-script/use-concept/use-framework/use-angle/use-hook/
 * use-storyboard) and can each produce more than the Ad they always could.
 * use-storyboard is the SAME action §8.1 already shipped (Video Sage's
 * "Use storyboard") — extended in place to carry `source: "storyboard"`
 * instead of `"none"`, per the owner's later ruling that a storyboard is
 * "nothing but a script with visuals." WIDENED same day: its target set is
 * now all four — Ad, Script, Concept AND Storyboard (that last one valid
 * only as a variation, same precedent as concept ← concept) — not just Ad
 * and Concept. No second storyboard action was added. Which targets any of
 * these six can actually reach is computed by `targetsForSource()` below,
 * straight off
 * `isValidSourceForTarget`/`VALID_SOURCES_BY_TARGET` (useWizard.ts, read-only)
 * — there is no second copy of that matrix here. Every other action keeps
 * `source: "none"` and `targets: ["ad"]`: they attach a REFERENCE (a whole
 * winning ad, a trend, a landing page…), not angle/hook/concept/framework/
 * script/storyboard content, so "Ad, from anything" is the only pair that
 * ever applied.
 */
import type { FlowAction, FlowActionId, FlowModule, FlowModuleKey } from "../flowTypes";
import { isValidSourceForTarget, type GenerationSource, type GenerationTarget } from "../../studio-v4/state/useWizard";

/** Every target the wizard knows about — the universe `targetsForSource`
 *  filters down from. Keep in sync with `GenerationTarget` (useWizard.ts). */
const ALL_TARGETS: GenerationTarget[] = ["ad", "script", "concept", "storyboard"];

/**
 * Which targets a given `GenerationSource` can actually produce, per
 * `isValidSourceForTarget` — checked both as a plain pair AND as a variation,
 * so "concept" correctly appears for `source: "concept"` (the concept ←
 * concept variation is the only way that pair is valid at all). "none" always
 * resolves to `["ad"]`, matching every reference-attaching action.
 */
function targetsForSource(source: GenerationSource): GenerationTarget[] {
  if (source === "none") return ["ad"];
  return ALL_TARGETS.filter(
    (t) => isValidSourceForTarget(t, source) || isValidSourceForTarget(t, source, true),
  );
}

/**
 * Action ids classified "asks nothing" (Rule 1 — variation family) vs "asks
 * for the entity" (Rule 2 and everything else that seeds a brand-new ad).
 * Kept as a comment, not a second data structure, so FLOW_ACTIONS stays the
 * one place this is decided:
 *
 *   asksNothing: true   → vary-script, vary-concept, vary-whole-video,
 *                          generate-variation, refresh-fatigued
 *   asksNothing: false  → everything else (use-*, the reference/trend/url
 *                          family, send-to-other-apps)
 *
 * "Refresh a fatigued creative" reads like it could go either way, but it is
 * explicitly re-running THIS SAME running ad (§7.3) — not seeding a new one
 * for a possibly-different brand — so it belongs with the variation family,
 * not with "Use X".
 */
export const FLOW_ACTIONS: Record<FlowActionId, FlowAction> = {
  // ── Variation family — Rule 1, asks nothing, lands on Configure (step 4) ──
  "vary-script": {
    id: "vary-script",
    label: "Vary script",
    desc: "Keep the visuals, rewrite the words.",
    icon: "FileText",
    asksNothing: true,
    entityTab: "product",
    preselectEntity: false,
    produces: "One video ad, same visuals, a new script.",
    source: "none",
    targets: ["ad"],
    requiresAnalysis: true,
  },
  "vary-concept": {
    id: "vary-concept",
    label: "Vary concept",
    desc: "Keep the script, try a new visual concept.",
    icon: "Sparkles",
    asksNothing: true,
    entityTab: "product",
    preselectEntity: false,
    produces: "One video ad, same script, new visuals.",
    source: "none",
    targets: ["ad"],
    requiresAnalysis: true,
  },
  "vary-whole-video": {
    id: "vary-whole-video",
    label: "Vary whole video",
    desc: "New script and new visuals — a full remake of this video.",
    icon: "RefreshCw",
    asksNothing: true,
    entityTab: "product",
    preselectEntity: false,
    produces: "One video ad, new script and new visuals — a full remake.",
    source: "none",
    targets: ["ad"],
    requiresAnalysis: true,
  },
  "generate-variation": {
    id: "generate-variation",
    label: "Generate variation",
    desc: "A quick remix of this ad — same core idea, new execution.",
    icon: "Repeat2",
    asksNothing: true,
    entityTab: "product",
    preselectEntity: false,
    produces: "One new ad from this one, same core idea, fresh execution.",
    source: "none",
    targets: ["ad"],
    requiresAnalysis: false,
  },
  "refresh-fatigued": {
    id: "refresh-fatigued",
    label: "Refresh fatigued creative",
    desc: "Same ad, same offer — new creative to beat the fatigue.",
    icon: "RotateCw",
    asksNothing: true,
    entityTab: "product",
    preselectEntity: false,
    produces: "One refreshed version of this ad, same offer, new creative.",
    source: "none",
    targets: ["ad"],
    requiresAnalysis: false,
  },

  // ── "Use X" family — Rule 2. On an Ad, always asks for the entity, lands
  // on Step 2. On an asset target (Script/Concept/Storyboard) the entity is
  // optional/Auto and Step 3 trims to whatever the source doesn't already
  // carry — see `resolveGenerationSteps` (useWizard.ts). `targets` below is
  // what actually offers the choice; nothing here hardcodes which one wins.
  "use-script": {
    id: "use-script",
    label: "Use script",
    desc: "Carry this script into a new generation. You'll pick what to make and who it's for.",
    icon: "FileText",
    asksNothing: false,
    entityTab: "product",
    preselectEntity: false,
    // Script can't reach Script (nothing to add) or Storyboard (not a
    // confirmed pair) — only Ad and Concept. targetsForSource("script")
    // derives exactly that from the contract, so this list stays correct if
    // the contract ever changes rather than silently drifting.
    produces: "An ad, or a free concept — built from this script. You'll pick what to generate next.",
    producesByTarget: {
      // Explicit "ad" line so the BANNER (which always shows a resolved
      // target, never "or") reads as a single crisp sentence instead of the
      // generic multi-option line above, which is for the action card
      // BEFORE a target is chosen (FlowModuleDetail).
      ad: "A new ad built from this script. You'll pick who it's for next.",
      concept: "A new concept, drawn from this script — free. You'll pick who it's for next.",
    },
    source: "script",
    targets: targetsForSource("script"),
    requiresAnalysis: true,
  },
  "use-concept": {
    id: "use-concept",
    label: "Use concept",
    desc: "Carry this concept into a new generation. You'll pick what to make and who it's for.",
    icon: "Lightbulb",
    asksNothing: false,
    entityTab: "product",
    preselectEntity: false,
    produces:
      "An ad — or a free script, storyboard, or another concept variation — built from this concept. You'll pick what to generate next.",
    producesByTarget: {
      ad: "A new ad built from this concept. You'll pick who it's for next.",
      script: "A new script, written from this concept — free. You'll pick who it's for next.",
      // The only concept ← concept pair (isValidSourceForTarget's variation
      // branch) — resolveFlowContext sets isVariation for this one, so it
      // asks nothing and lands straight on the last step, same as any other
      // variation. Worded to say so, not as a generic "who's it for" line.
      concept: "A new variation of this concept — free. Same core idea, a fresh take. Nothing else to fill in.",
      storyboard: "A new storyboard, built from this concept — free, video format only. You'll pick who it's for next.",
    },
    source: "concept",
    targets: targetsForSource("concept"),
    requiresAnalysis: true,
  },
  "use-framework": {
    id: "use-framework",
    label: "Use framework",
    desc: "Carry this framework's structure into a new generation. You'll pick what to make and who it's for.",
    icon: "LayoutGrid",
    asksNothing: false,
    // Frameworks are reusable structure, not a single-product asset — brand
    // is the more common starting tab, though the user can switch tabs freely.
    entityTab: "brand",
    preselectEntity: false,
    produces:
      "An ad — or a free script, concept, or storyboard — built on this framework's structure. You'll pick what to generate next.",
    producesByTarget: {
      ad: "A new ad built on this framework. You'll pick who it's for next.",
      script: "A new script, structured on this framework — free. You'll pick who it's for next.",
      concept: "A new concept, structured on this framework — free. You'll pick who it's for next.",
      storyboard: "A new storyboard, structured on this framework — free, video format only. You'll pick who it's for next.",
    },
    source: "framework",
    targets: targetsForSource("framework"),
    requiresAnalysis: true,
  },
  "use-storyboard": {
    id: "use-storyboard",
    label: "Use storyboard",
    desc: "Carry this storyboard's scenes into a new generation. You'll pick what to make and who it's for.",
    icon: "Clapperboard",
    asksNothing: false,
    entityTab: "product",
    preselectEntity: false,
    // NEW (2026-09-08, product owner, verbatim): "Storyboard se bhi build ho
    // skta hai, same as a script. Storyboard is nothing but a script with
    // visuals." So Storyboard is a formal GenerationSource, computed off the
    // exact same `isValidSourceForTarget`/`VALID_SOURCES_BY_TARGET` contract
    // as every other source (useWizard.ts) — no second copy of the matrix
    // lives here. This is the SAME action this module already offered
    // (source: "none" / targets: ["ad"]), extended in place rather than
    // added as a second "storyboard-source" action — it's already reachable
    // on the exact same 4 modules (Industry Insights, Video Sage, Reports,
    // Creative Library) that carry use-script/use-concept/use-framework/
    // use-angle/use-hook, so no module's action list needed to change.
    //
    // WIDENED (2026-09-08, same day, owner's follow-up ruling): the target
    // set is now ALL FOUR — Ad, Script, Concept AND Storyboard — not just Ad
    // and Concept. Reasoning, verbatim: a storyboard "carries the script"
    // (so Script is derivable from it by dropping the visuals) and "it can
    // seed a fresh storyboard as a variation." That last one is the ONE
    // exception below: storyboard ← storyboard is valid ONLY as a variation
    // (isValidSourceForTarget's `isVariation` branch — same precedent as
    // concept ← concept), so it asks nothing and lands straight on the last
    // step (§7 Rule 1) whenever `resolveFlowContext` resolves this action
    // with `target: "storyboard"`. `targetsForSource("storyboard")` below
    // already accounts for that branch, so this list is still fully derived,
    // never hand-typed.
    produces:
      "An ad, or a free script, concept, or another storyboard variation — built from this storyboard. You'll pick what to generate next.",
    producesByTarget: {
      ad: "A new ad built from this storyboard. You'll pick who it's for next.",
      script: "A new script, drawn from this storyboard — free. You'll pick who it's for next.",
      concept: "A new concept, drawn from this storyboard — free. You'll pick who it's for next.",
      // The only storyboard ← storyboard pair (isValidSourceForTarget's
      // variation branch) — asks nothing and lands straight on the last
      // step, same as concept's own self-variation line above it in
      // "use-concept". Video-format-only, same as every storyboard target
      // (isStoryboardOfferable / resolveGenerationSteps's `formatValid`).
      storyboard: "A new variation of this storyboard, video format only — free. Same scenes, a fresh take. Nothing else to fill in.",
    },
    source: "storyboard",
    targets: targetsForSource("storyboard"),
    requiresAnalysis: true,
  },
  "use-angle": {
    id: "use-angle",
    label: "Use angle",
    desc: "Carry this angle into a new generation. You'll pick what to make and who it's for.",
    icon: "Target",
    asksNothing: false,
    entityTab: "product",
    preselectEntity: false,
    produces:
      "An ad — or a free script, concept, or storyboard — built around this angle. You'll pick what to generate next.",
    producesByTarget: {
      ad: "A new ad built on this angle. You'll pick who it's for next.",
      script: "A new script, written around this angle — free. You'll pick who it's for next.",
      concept: "A new concept, built around this angle — free. You'll pick who it's for next.",
      storyboard: "A new storyboard, built around this angle — free, video format only. You'll pick who it's for next.",
    },
    source: "angle",
    targets: targetsForSource("angle"),
    requiresAnalysis: true,
  },
  "use-hook": {
    id: "use-hook",
    label: "Use hook",
    desc: "Carry this hook into a new generation. You'll pick what to make and who it's for.",
    icon: "Zap",
    asksNothing: false,
    entityTab: "product",
    preselectEntity: false,
    produces:
      "An ad — or a free script, concept, or storyboard — opening with this hook. You'll pick what to generate next.",
    producesByTarget: {
      ad: "A new ad built on this hook. You'll pick who it's for next.",
      script: "A new script, opening with this hook — free. You'll pick who it's for next.",
      concept: "A new concept, opening with this hook — free. You'll pick who it's for next.",
      storyboard: "A new storyboard, opening with this hook — free, video format only. You'll pick who it's for next.",
    },
    source: "hook",
    targets: targetsForSource("hook"),
    requiresAnalysis: true,
  },

  // ── Reference-for-a-new-ad family — never assumes the entity either ──
  "winner-as-reference": {
    id: "winner-as-reference",
    label: "Winner ad as reference",
    desc: "Use this winning ad as a reference for a brand-new ad — not a copy.",
    icon: "Trophy",
    asksNothing: false,
    entityTab: "brand",
    preselectEntity: false,
    produces: "A new ad, using this winner as your reference — not a copy.",
    source: "none",
    targets: ["ad"],
    requiresAnalysis: false,
  },
  "top-performer-as-reference": {
    id: "top-performer-as-reference",
    label: "Top performer as reference",
    desc: "Use this top performer as a reference for a brand-new ad.",
    icon: "TrendingUp",
    asksNothing: false,
    entityTab: "product",
    preselectEntity: false,
    produces: "A new ad, using this top performer as your reference — not a copy.",
    source: "none",
    targets: ["ad"],
    requiresAnalysis: false,
  },
  "reference-for-new-ad": {
    id: "reference-for-new-ad",
    label: "Reference for a new ad",
    desc: "Use this asset as a reference for a brand-new ad.",
    icon: "BookmarkPlus",
    asksNothing: false,
    entityTab: "product",
    preselectEntity: false,
    produces: "A new ad, using this as your reference — not a copy.",
    source: "none",
    targets: ["ad"],
    requiresAnalysis: false,
  },

  // ── Trends family (§7.4) ──
  "generate-against-trend": {
    id: "generate-against-trend",
    label: "Generate against this trend",
    desc: "Build a new ad around this trend's angle.",
    icon: "Flame",
    asksNothing: false,
    entityTab: "product",
    preselectEntity: false,
    produces: "One new ad built around this trend's angle.",
    source: "none",
    targets: ["ad"],
    requiresAnalysis: false,
  },
  "script-from-trend": {
    id: "script-from-trend",
    label: "Generate a script from this trend",
    desc: "Write a new script around this trend.",
    icon: "FileText",
    asksNothing: false,
    entityTab: "product",
    preselectEntity: false,
    // NOTE (out of this task's scope): this action's name/copy already say
    // "script", but it predates the target/source contract and isn't one of
    // the five confirmed source actions this change adds — left as `targets:
    // ["ad"]` (unchanged) rather than reclassified as a Script target, which
    // would be a separate, unreviewed change. Flagged in the build report.
    produces: "One new script, written around this trend.",
    source: "none",
    targets: ["ad"],
    requiresAnalysis: false,
  },

  // ── Campaign URLs (§7.5) — the ONE documented exception to Rule 4 ──
  "generate-from-url": {
    id: "generate-from-url",
    label: "Generate from this URL",
    desc: "Pull the page's product, offer and claims into a new ad.",
    icon: "Link2",
    asksNothing: false,
    entityTab: "product",
    preselectEntity: true,
    produces: "One new ad, pre-filled from this landing page — check the extraction before you generate.",
    source: "none",
    targets: ["ad"],
    requiresAnalysis: false,
  },

  // ── Leaves Genie's Studio entirely (§7.6, §6 Rule 6) ──
  "send-to-other-apps": {
    id: "send-to-other-apps",
    label: "Send to Other Apps",
    desc: "Hand this asset to an Other Apps tool — translate, upscale, swap a face, and more.",
    icon: "ExternalLink",
    // Doesn't land in Studio at all, so asksNothing/entityTab/preselectEntity
    // are unused by the UI for this one — set to harmless defaults so the
    // record stays total (every FlowActionId needs a value here).
    asksNothing: true,
    entityTab: "product",
    preselectEntity: false,
    produces: "Opens this asset in Other Apps — no ad is generated here.",
    source: "none",
    targets: ["ad"],
    requiresAnalysis: false,
    toOtherApps: true,
  },
};

/**
 * The 7 live modules + 4 coming-soon, in exact §7 table order. Coming-soon
 * modules carry an empty `actions` list on purpose — there is no designed
 * flow yet, and a placeholder action would be lying about what's built.
 */
export const FLOW_MODULES: FlowModule[] = [
  {
    key: "industry-insights",
    label: "Industry Insights",
    desc: "Competitor ads worth reacting to — turn one into a reference, a variation, or a Video Sage breakdown.",
    icon: "Radar",
    state: "live",
    modulePath: "/insights-v2/feed",
    actions: [
      "generate-variation",
      "use-script",
      "use-concept",
      "use-framework",
      "use-storyboard",
      // 2026-09-08 — the asset-flow vocabulary addition; same reasoning as
      // video-sage below (these ARE the Video Sage seven, plus generate-
      // variation/winner-as-reference/generate-against-trend on top).
      "use-angle",
      "use-hook",
      "vary-script",
      "vary-concept",
      "vary-whole-video",
      "winner-as-reference",
      "generate-against-trend",
      // §6 Rule 6 — "Send to Other Apps" is NOT only a Library action. The
      // spec names three more hosts explicitly: Reports, Industry Insights
      // and Video Sage. SendToGenieMenu renders straight off this list, so
      // adding the id here is the whole fix at every call site.
      "send-to-other-apps",
    ],
    // §7.2's critical rule — these are a COMPETITOR'S ads. The picker must
    // highlight the user's OWN default brand, never the rival's, no matter
    // which of the actions above is chosen.
    competitorOwned: true,
  },
  {
    key: "video-sage",
    label: "Video Sage",
    desc: "Analysed videos — scripts, concepts, frameworks, angles, hooks and storyboards ready to reuse.",
    icon: "Video",
    state: "live",
    modulePath: "/iq/video-sage",
    actions: [
      "use-script",
      "use-concept",
      "use-framework",
      "use-storyboard",
      // 2026-09-08 — Angle and Hook join the Video Sage vocabulary alongside
      // Script/Concept/Framework/Storyboard, per the owner's asset-flow
      // ruling. Same source (an analysed video), same "use X" shape.
      "use-angle",
      "use-hook",
      "vary-script",
      "vary-concept",
      "vary-whole-video",
      // §6 Rule 6 — see the note on industry-insights above.
      "send-to-other-apps",
    ],
  },
  {
    key: "reports",
    label: "Reports",
    desc: "Ads already running — vary what's working, refresh what's tired.",
    icon: "BarChart3",
    state: "live",
    modulePath: "/reports/ads",
    actions: [
      "generate-variation",
      "use-script",
      "use-concept",
      "use-framework",
      "use-storyboard",
      // 2026-09-08 — Angle and Hook join Reports' "use X" vocabulary too,
      // same reasoning as industry-insights/video-sage above.
      "use-angle",
      "use-hook",
      // §7.3 — "Reports carries all Video Sage actions after analysis."
      // §7.1 defines the Video Sage vocabulary as seven actions total (the
      // four use-* above plus these three) — Industry Insights and Creative
      // Library both already carry all seven; Reports was missing these
      // three.
      "vary-script",
      "vary-concept",
      "vary-whole-video",
      "top-performer-as-reference",
      "refresh-fatigued",
      // §6 Rule 6 — see the note on industry-insights above.
      "send-to-other-apps",
    ],
    // §7.3 — Flexible/Carousel ads can be varied, but the output is static
    // only for now. The banner must say so plainly, not bury it.
    staticOnlyNote: "This ad runs as a flexible or carousel format — the variation Genie produces will be a single static creative for now.",
  },
  {
    key: "trends",
    label: "Trends",
    desc: "What's rising right now — hooks, angles and search demand you can build against.",
    icon: "TrendingUp",
    state: "live",
    modulePath: "/insights/trends",
    // Only 3 — the fourth §7.4 line item ("auto-inject trends into
    // Configure's suggestions rail") is a Configure-step behaviour, not a
    // card action, so it isn't an entry here. See flowSources.ts's file
    // header for the same note.
    actions: ["generate-against-trend", "script-from-trend", "generate-variation"],
  },
  {
    key: "campaign-urls",
    label: "Campaign URLs",
    desc: "Landing pages you already run — extract the product and offer straight into an ad.",
    icon: "Link2",
    state: "live",
    modulePath: "/launch/campaign-urls",
    actions: ["generate-from-url"],
  },
  {
    key: "creative-library",
    label: "Creative Library",
    desc: "Every asset you've made or saved — generated in Genie or not.",
    icon: "Folder",
    state: "live",
    modulePath: "/iq/creative-library",
    // §7.6 — folders get no manual action; only a single Ad redirects. This
    // registry only ever produces Ad-level FlowSourceRefs for this module
    // (see flowSources.ts) — there is no folder-level action to add here.
    actions: [
      "vary-script",
      "vary-concept",
      "vary-whole-video",
      "use-script",
      "use-concept",
      "use-framework",
      "use-storyboard",
      // 2026-09-08 — same asset-flow addition as the other three "use X"
      // modules above.
      "use-angle",
      "use-hook",
      "reference-for-new-ad",
      "send-to-other-apps",
    ],
  },
  {
    key: "dashboard",
    label: "Dashboard",
    desc: "Today's top signals from Trends, Industry Insights and Reports, one click from a new ad.",
    icon: "LayoutDashboard",
    state: "live",
    modulePath: "/dashboard",
    // §7.7 — Dashboard has no actions of its own; it surfaces the actions of
    // the modules whose data it displays. This is the representative union,
    // not a new vocabulary.
    actions: ["generate-variation", "winner-as-reference", "generate-against-trend", "top-performer-as-reference"],
  },
  {
    key: "folders",
    label: "Folders",
    desc: "Folder-level actions — coming soon.",
    icon: "FolderClosed",
    state: "coming-soon",
    modulePath: "/iq/creative-library",
    actions: [],
  },
  {
    key: "automated-workflow",
    label: "Automated workflow",
    desc: "Automated hand-off into Genie — coming soon.",
    icon: "Workflow",
    state: "coming-soon",
    modulePath: "/automation",
    actions: [],
  },
  {
    key: "rrm",
    label: "RRM",
    desc: "Rules-based recurring management hand-off — coming soon.",
    icon: "RefreshCcw",
    state: "coming-soon",
    modulePath: "/rrm",
    actions: [],
  },
  {
    key: "copilot",
    label: "Co-pilot",
    desc: "Co-pilot suggestions into Genie — coming soon.",
    icon: "Bot",
    state: "coming-soon",
    modulePath: "/iq/copilot",
    actions: [],
  },
];

export function getFlowModule(key: FlowModuleKey): FlowModule | undefined {
  return FLOW_MODULES.find((m) => m.key === key);
}

/** Resolves a module's action ids into full FlowAction objects, in order. */
export function actionsForModule(key: FlowModuleKey): FlowAction[] {
  const mod = getFlowModule(key);
  if (!mod) return [];
  return mod.actions.map((id) => FLOW_ACTIONS[id]).filter((a): a is FlowAction => !!a);
}
