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
 *
 * ASSETS TOO, NOT ONLY ADS (2026-09-08, product owner)
 * "Ads ka to humare paas full flow hai, but generating assets ke liye flow
 * nahi hai" — Script, Concept and Storyboard are now first-class things a
 * flow can produce, alongside Ad. Framework stays analyse-only; it is never a
 * target, only ever a source. The owner's two-stage model: the user picks the
 * SOURCE action here (e.g. "Use concept"), then picks the TARGET (what to
 * generate) on Studio's own Step 1 — so a fourth URL param, `?tgt`, now rides
 * alongside src/ref/act, and every FlowAction declares which targets it can
 * produce (`FlowAction.targets`). The authoritative target/source contract —
 * `GenerationTarget`, `GenerationSource`, `resolveGenerationSteps`,
 * `isValidSourceForTarget`, `isStoryboardOfferable` — lives in
 * `studio-v4/state/useWizard.ts` (read-only from here); this file only wires
 * Other-Flows data onto it, never re-derives the matrix.
 */
import type { GenerationSource, GenerationTarget, StepNumber } from "../studio-v4/state/useWizard";

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
  // "Use X" family — always asks for the entity on an Ad, optional/Auto on an
  // asset target (Rule 2, scoped by target — see FlowAction.targets below).
  // use-angle / use-hook are NEW (2026-09-08): the owner's asset-flow vocab
  // adds Angle and Hook alongside the three that already existed.
  | "use-script"
  | "use-concept"
  | "use-framework"
  | "use-storyboard"
  | "use-angle"
  | "use-hook"
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
   * Rule 1 — a variation asks nothing and lands straight on Configure. For an
   * asset target this is ALSO true whenever the chosen (target, source) pair
   * is only valid as a variation (today: concept ← concept) — that second
   * case isn't encoded here (it depends on the target the user picks, not
   * fixed per-action), so `FlowContext.isVariation` is the one place both
   * cases are actually combined. This flag alone still fully describes the
   * original Ad-variation family (vary-script/vary-concept/vary-whole-video/
   * generate-variation/refresh-fatigued).
   * Rule 2 — a "use this" flow always stops to ask who it's for, ON AN AD.
   * For an asset target (Script/Concept/Storyboard) the entity is optional —
   * Auto if the user picks nothing — per the owner's ruling; see `targets`.
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
  /**
   * Sentence for the banner's "what will be produced" slot BEFORE a target is
   * chosen (also what FlowModuleDetail's action card shows). For an action
   * offering more than one target, word this as the general capability
   * ("an ad — or a free script, concept or storyboard"), not just the Ad
   * case, so nobody reads this card and thinks Ad is the only option.
   */
  produces: string;
  /**
   * What kind of thing this action hands the wizard, in `GenerationSource`
   * terms — "none" for every action that attaches a REFERENCE instead
   * (winner-as-reference, generate-from-url, the whole vary-* family, …),
   * since those aren't angle/hook/concept/framework/script content in the
   * useWizard.ts sense.
   */
  source: GenerationSource;
  /**
   * Every `GenerationTarget` this action can actually produce, in display
   * order — first entry is the default when the URL carries no `?tgt` yet.
   * ALWAYS derived from `isValidSourceForTarget`/`VALID_SOURCES_BY_TARGET`
   * (useWizard.ts) via `targetsForSource()` in flowRegistry.ts — never
   * hand-typed, so a newly confirmed source→target pair is a change to that
   * one contract file, not a second matrix here. Actions with no formal
   * `GenerationSource` (source: "none") are hardcoded to `["ad"]` — "Ad, from
   * anything" is the only pair that ever applied to them.
   */
  targets: GenerationTarget[];
  /**
   * Per-target override of `produces`, for actions whose `targets` has more
   * than one entry — e.g. "Use concept" says something different once the
   * user has picked Script vs Storyboard. Missing target key (or the whole
   * field, for single-target actions) falls back to `produces`. Every
   * non-"ad" line states the target is free, per the owner's ruling that
   * asset generation is free and must say so rather than omit a cost.
   */
  producesByTarget?: Partial<Record<GenerationTarget, string>>;
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
  /**
   * Provenance line, e.g. "Pinned from Industry Insights" — display only,
   * never changes highlight/competitorOwned. Distinct from `competitorOwned`
   * (§7.2): a Creative Library asset pinned from a competitor ad is still
   * the USER's own catalogue brand, just worth labelling where it came from.
   */
  sourceNote?: string;
  /** Whether the source ad has been analysed (gates the Video Sage actions). */
  analysed?: boolean;
  /**
   * Why this row can't be picked for an analysis-gated action, when the
   * generic "needs analysis" sentence would be untrue. Trends has no analysis
   * step at all — a hookless trend is unpickable for `use-hook` because the
   * feed never carried a hook, not because the user skipped a step.
   */
  blockedReason?: string;
  /** Format of the source creative — drives the static-only banner note. */
  sourceFormat?: "image" | "video" | "carousel" | "flexible";
  /** Extra evidence chips, e.g. "ROAS 4.2×" / "Spend ₹2.4L" / "+186% in 14d". */
  metrics?: { label: string; value: string }[];
  /** Trends only — the angle this trend fills in (§7.4). */
  trendAngle?: string;
  /**
   * The literal hook LINE this source quotes — the opening sentence, not a
   * paraphrase. Distinct from `trendAngle`, which is the strategic angle and
   * on Trends deliberately falls back to headline/excerpt when there is no
   * hook; this field is only ever set when a real hook exists. It is what
   * `use-hook` carries into the wizard (`flowInitialPatch`), so an absent
   * value means the action must not be offered — which is exactly what
   * `analysed`/`blockedReason` already encode for a hookless trend.
   */
  hook?: string;
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
  /**
   * The resolved generation target — always one of `action.targets`. Comes
   * from `?tgt` when it names one of those targets, else defaults to
   * `action.targets[0]` (today, always "ad" for every pre-2026-09-08 action,
   * since `targets` is hardcoded `["ad"]` for anything with `source: "none"`).
   */
  target: GenerationTarget;
  /** Echoes `action.source` — what this action hands the wizard. */
  source: GenerationSource;
  /**
   * Rule 1, fully resolved: true when `action.asksNothing` (the Ad-variation
   * family) OR the chosen (target, source) pair is only valid AS a variation
   * (today, only concept ← concept — see `isValidSourceForTarget`'s
   * `isVariation` branch in useWizard.ts). Either way, Studio asks nothing
   * and lands on the last step — this is the ONE flag both cases share.
   */
  isVariation: boolean;
  /**
   * Step the flow lands on — the resolved plan's own first visible step
   * (`resolveGenerationSteps(target, source, { isVariation, format })` in
   * useWizard.ts), never a literal. In practice this is always 4 when
   * `isVariation` (Rule 1 overrides everything, asks nothing) or 1 otherwise
   * (an Ad, or any asset target, always starts the wizard fresh at Step 1 —
   * that's also where the target picker itself lives) — but it is typed
   * generically because the plan is what decides, not this file.
   */
  landingStep: StepNumber;
  /** Entity to highlight (or pre-select) at the top of the Step-2 picker. */
  highlight?: { kind: EntityKind; id: string; name: string };
  /** True when `highlight` should be selected outright (Campaign URLs only). */
  preselect: boolean;
  /** Module-level OR ref-level competitor ownership — what the banner's
   *  "Competitor ad" chip and Step 2's explanatory note must read. */
  competitorOwned: boolean;
  /**
   * True for every non-"ad" target (Script/Concept/Storyboard) — asset
   * generation is free. Exists so the banner/action copy can say so plainly
   * (`produces` already states it in words; this is the structured flag any
   * caller can key off instead of parsing the sentence).
   */
  free: boolean;
  /** Banner sentence — "what will be produced" — for THIS resolved target. */
  produces: string;
  /** Extra warning line, e.g. carousel → static only. */
  caveat?: string;
}

/** The URL params that carry a flow. Read by Studio on every step. */
export const FLOW_PARAM_SRC = "src";
export const FLOW_PARAM_REF = "ref";
export const FLOW_PARAM_ACT = "act";
/**
 * NEW (2026-09-08) — the chosen generation target, for actions whose
 * `targets` has more than one entry. Optional on purpose: every call site
 * written before this change omits it, and `resolveFlowContext` defaults to
 * `action.targets[0]` ("ad") when it's missing, so every existing flow link
 * keeps behaving exactly as it did. The Step-1 target picker (Studio agent)
 * is what actually sets this, by re-navigating with `?tgt=` added.
 */
export const FLOW_PARAM_TARGET = "tgt";

/**
 * §7 — the variation fork. A variation asks nothing by default (Rule 1) and
 * lands on Configure. When the user deliberately picks "Customize first", the
 * SAME action carries `tweak=1`: it is still a variation (lineage, credits and
 * the carried-over prompt are unchanged), but the wizard keeps all its steps
 * and stops at Step 2 so there is something to adjust.
 *
 * URL-borne, like every other piece of flow context, because the fork has to
 * survive a hard refresh and a shared link — a store-backed flag dies on both.
 * Absent (the overwhelmingly common case) = today's behaviour, untouched.
 */
export const FLOW_PARAM_TWEAK = "tweak";

/** Builds the query string that hands a flow to Studio. `target` is optional
 *  — omit it to let `resolveFlowContext` default to the action's primary
 *  target (see `FLOW_PARAM_TARGET` above). */
export function flowSearchParams(
  module: FlowModuleKey,
  refId: string,
  action: FlowActionId,
  target?: GenerationTarget,
): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set(FLOW_PARAM_SRC, module);
  sp.set(FLOW_PARAM_REF, refId);
  sp.set(FLOW_PARAM_ACT, action);
  if (target) sp.set(FLOW_PARAM_TARGET, target);
  return sp;
}
