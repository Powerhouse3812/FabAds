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
 */
import type { FlowAction, FlowActionId, FlowModule, FlowModuleKey } from "../flowTypes";

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
    requiresAnalysis: false,
  },

  // ── "Use X" family — Rule 2, always asks for the entity, lands on Step 2 ──
  "use-script": {
    id: "use-script",
    label: "Use script",
    desc: "Carry this script into a new ad. You'll pick who it's for.",
    icon: "FileText",
    asksNothing: false,
    entityTab: "product",
    preselectEntity: false,
    produces: "A new ad built from this script. You'll pick who it's for next.",
    requiresAnalysis: true,
  },
  "use-concept": {
    id: "use-concept",
    label: "Use concept",
    desc: "Carry this concept into a new ad. You'll pick who it's for.",
    icon: "Lightbulb",
    asksNothing: false,
    entityTab: "product",
    preselectEntity: false,
    produces: "A new ad built from this concept. You'll pick who it's for next.",
    requiresAnalysis: true,
  },
  "use-framework": {
    id: "use-framework",
    label: "Use framework",
    desc: "Carry this framework's structure into a new ad. You'll pick who it's for.",
    icon: "LayoutGrid",
    asksNothing: false,
    // Frameworks are reusable structure, not a single-product asset — brand
    // is the more common starting tab, though the user can switch tabs freely.
    entityTab: "brand",
    preselectEntity: false,
    produces: "A new ad built on this framework. You'll pick who it's for next.",
    requiresAnalysis: true,
  },
  "use-storyboard": {
    id: "use-storyboard",
    label: "Use storyboard",
    desc: "Carry this storyboard's scenes into a new ad. You'll pick who it's for.",
    icon: "Clapperboard",
    asksNothing: false,
    entityTab: "product",
    preselectEntity: false,
    produces: "A new ad built from this storyboard. You'll pick who it's for next.",
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
    produces: "One new script, written around this trend.",
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
    desc: "Analysed videos — scripts, concepts, frameworks and storyboards ready to reuse.",
    icon: "Video",
    state: "live",
    modulePath: "/iq/video-sage",
    actions: [
      "use-script",
      "use-concept",
      "use-framework",
      "use-storyboard",
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
