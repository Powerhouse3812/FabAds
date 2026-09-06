/**
 * Other Flows — contract types (Genie 2.0 §6, §7).
 *
 * "Other Flows" is a Genie sub-nav surface listing every module that can send
 * work INTO Genie. Opening a module card shows that module's actions; picking
 * an action carries a source reference into Studio under the six universal
 * redirect rules.
 *
 * WHY THE CONTEXT LIVES IN THE URL, NOT A STORE
 * Rule 5 says the user must always know where they came from, through the whole
 * flow. A banner backed by React state dies on refresh and on a shared link —
 * so the context is three URL params (?src, ?ref, ?act) that any Studio step
 * can resolve back into the full object via resolveFlowContext(). Everything
 * else (labels, thumbnails, produced-output note) is DERIVED from the registry,
 * never encoded, so URLs stay short and the copy can never drift from the data.
 */

/** A module that can feed Genie. Order here is the order of the module list. */
export type FlowModuleKey =
  | "industry-insights"
  | "video-sage"
  | "reports"
  | "trends"
  | "campaign-urls"
  | "creative-library"
  | "dashboard"
  | "folders"
  | "automated-workflow"
  | "rrm"
  | "copilot";

/**
 * Action ids. Variation is deliberately THREE named actions (§7.1) — there is
 * no generic "Generate variation" button for Video-Sage-class sources.
 */
export type FlowActionId =
  // Variation family — asks nothing (Rule 1)
  | "vary-script"
  | "vary-concept"
  | "vary-whole-video"
  | "generate-variation"
  // "Use X" family — always asks for the entity (Rule 2)
  | "use-script"
  | "use-concept"
  | "use-framework"
  | "use-storyboard"
  // Reference / new-ad family
  | "winner-as-reference"
  | "top-performer-as-reference"
  | "reference-for-new-ad"
  | "refresh-fatigued"
  | "generate-against-trend"
  | "script-from-trend"
  | "generate-from-url"
  | "send-to-other-apps";

/** Which Step-2 tab an action lands on. */
export type EntityKind = "brand" | "product" | "category";

export interface FlowAction {
  id: FlowActionId;
  label: string;
  /** One line, plain, says what happens. No "Elevate"-class copy. */
  desc: string;
  /** lucide icon name, resolved by the UI's ICONS map. */
  icon: string;
  /**
   * Rule 1 — a variation asks nothing and lands straight on Configure.
   * Rule 2 — a "use this" flow always stops on Step 2 to ask who it's for.
   */
  asksNothing: boolean;
  /** Which Step-2 tab opens. The SOURCE decides the tab, not the user. */
  entityTab: EntityKind;
  /**
   * Rule 4 — the detected entity is HIGHLIGHTED, not selected. Only Campaign
   * URLs pre-selects (the documented exception), because the landing page is
   * the user's own.
   */
  preselectEntity: boolean;
  /** Sentence for the banner's "what will be produced" slot. */
  produces: string;
  /** Requires the source ad to have been analysed first (§7.2 / §7.3). */
  requiresAnalysis?: boolean;
  /** True when the action leaves Genie's Studio for the Other Apps surface. */
  toOtherApps?: boolean;
}

export interface FlowModule {
  key: FlowModuleKey;
  label: string;
  /** One line describing what this module sends into Genie. */
  desc: string;
  icon: string;
  state: "live" | "coming-soon";
  /** Path back to the source module, used by the banner's exit. */
  modulePath: string;
  actions: FlowActionId[];
  /**
   * §7.2 — the ad in Industry Insights belongs to a COMPETITOR, so the picker
   * must highlight the user's own default brand, never the source's brand.
   * Getting this wrong suggests the user create an ad for a rival.
   */
  competitorOwned?: boolean;
  /** §7.3 — variation of a flexible/carousel ad outputs static only for now. */
  staticOnlyNote?: string;
}

/** A concrete thing the user picked inside a source module. */
export interface FlowSourceRef {
  id: string;
  module: FlowModuleKey;
  /** What the user sees, e.g. "Mamaearth Onion Oil — Winter Hair Fall". */
  title: string;
  /** Second line: the evidence that makes this reference worth using. */
  subtitle: string;
  thumbnail?: string;
  /** Owning brand as the SOURCE knows it. For competitor ads this is the rival. */
  sourceBrandName: string;
  /**
   * Per-ref competitor flag (§7.2). Industry Insights sets it at module
   * level, but Dashboard AGGREGATES Insights' competitor rows next to the
   * user's own — so a module-level flag alone let "boAt · Competitor" be
   * pre-selected as the brand of the user's new ad. Any ref with this set is
   * treated exactly like an Industry Insights ad: own default brand only.
   */
  competitorOwned?: boolean;
  /** Detected entity in OUR catalogue — what Step 2 highlights. */
  detectedEntity?: { kind: EntityKind; id: string; name: string };
  /** Whether the source ad has been analysed (gates the Video Sage actions). */
  analysed?: boolean;
  /** Format of the source creative — drives the static-only banner note. */
  sourceFormat?: "image" | "video" | "carousel" | "flexible";
  /** Extra evidence chips, e.g. "ROAS 4.2×" / "Spend ₹2.4L" / "+186% in 14d". */
  metrics?: { label: string; value: string }[];
  /** Trends only — the angle this trend fills in (§7.4). */
  trendAngle?: string;
  /** Campaign URLs only — the visible, editable extraction (§7.5). */
  extraction?: CampaignUrlExtraction;
}

/**
 * §7.5 — Campaign URL context extraction is VISIBLE and EDITABLE, because the
 * extraction is a POC and will sometimes be wrong. The user must be able to see
 * and fix it, not discover the error in the output.
 */
export interface CampaignUrlExtraction {
  url: string;
  product: string;
  offer: string;
  claims: string[];
  images: string[];
  /** Set when the URL matched a catalogue product — drives pre-selection. */
  matchedProductId?: string;
}

/**
 * The resolved flow context — everything the banner and Studio need, derived
 * from the three URL params. `null` means Studio is running standalone.
 */
export interface FlowContext {
  module: FlowModule;
  action: FlowAction;
  ref: FlowSourceRef;
  /** Step the flow lands on: 4 (Configure) for variations, 2 for "use X". */
  landingStep: 2 | 4;
  /** Entity to highlight (or pre-select) at the top of the Step-2 picker. */
  highlight?: { kind: EntityKind; id: string; name: string };
  /** True when `highlight` should be selected outright (Campaign URLs only). */
  preselect: boolean;
  /** Module-level OR ref-level competitor ownership — what the banner's
   *  "Competitor ad" chip and Step 2's explanatory note must read. */
  competitorOwned: boolean;
  /** Banner sentence — "what will be produced". */
  produces: string;
  /** Extra warning line, e.g. carousel → static only. */
  caveat?: string;
}

/** The three URL params that carry a flow. Read by Studio on every step. */
export const FLOW_PARAM_SRC = "src";
export const FLOW_PARAM_REF = "ref";
export const FLOW_PARAM_ACT = "act";

/** Builds the query string that hands a flow to Studio. */
export function flowSearchParams(
  module: FlowModuleKey,
  refId: string,
  action: FlowActionId,
): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set(FLOW_PARAM_SRC, module);
  sp.set(FLOW_PARAM_REF, refId);
  sp.set(FLOW_PARAM_ACT, action);
  return sp;
}
