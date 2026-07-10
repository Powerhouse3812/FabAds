/**
 * reducer.ts — the Meta-grounded "brain" of Launch v2.
 *
 * Encodes LAUNCH2_V2_META_MATRIX.md (ODAX 2026 / Marketing API v25): the
 * objective→destination→optimization cascade, format gating, ASC-as-derived-
 * state, budget/bid availability, special-ad-category locks, intent defaults,
 * and the master HIDE / LOCK / DEFAULT field policy.
 *
 * Principle: lock ONLY where Meta locks; soft-default everything else (Advanced
 * reveal). High-confidence rules are hard-coded; the 15 med-confidence items
 * (matrix §7) are treated as soft (warn, don't hard-block) — flagged in code.
 */
import type {
  AdFormat,
  BidStrategy,
  DestinationType,
  FieldPolicy,
  Intent,
  Objective,
  OptimizationGoal,
  PlanV2,
} from "./types";
import { accountsWithZeroPostAds, capCheck } from "./deriveV2";

/* ------------------------------------------------------------------ */
/*  §1 Objective → destinations                                        */
/* ------------------------------------------------------------------ */
export const DESTINATIONS_BY_OBJECTIVE: Record<Objective, DestinationType[]> = {
  OUTCOME_AWARENESS: [], // "on your ad" only — no location picker
  OUTCOME_TRAFFIC: ["WEBSITE", "APP", "MESSENGER", "WHATSAPP", "INSTAGRAM_DIRECT", "PHONE_CALL"],
  OUTCOME_ENGAGEMENT: ["ON_POST", "ON_PAGE", "ON_EVENT", "ON_VIDEO", "MESSENGER", "WHATSAPP", "INSTAGRAM_DIRECT", "WEBSITE", "APP", "PHONE_CALL"],
  OUTCOME_LEADS: ["WEBSITE", "ON_AD", "MESSENGER", "INSTAGRAM_DIRECT", "WHATSAPP", "PHONE_CALL", "APP"],
  OUTCOME_APP_PROMOTION: ["APP"], // locked, no picker
  OUTCOME_SALES: ["WEBSITE", "APP", "MESSENGER", "WHATSAPP", "PHONE_CALL", "PRODUCT_CATALOG_SALES"],
};

/** Does the objective show a conversion-location picker? */
export function showsLocationPicker(o: Objective): boolean {
  return o !== "OUTCOME_AWARENESS" && o !== "OUTCOME_APP_PROMOTION";
}

/** Default destination for an objective (first sensible). */
export function defaultDestination(o: Objective): DestinationType | null {
  if (o === "OUTCOME_AWARENESS") return null;
  if (o === "OUTCOME_APP_PROMOTION") return "APP";
  return DESTINATIONS_BY_OBJECTIVE[o][0] ?? null;
}

/* ------------------------------------------------------------------ */
/*  §1 {objective, destination} → optimization + event                 */
/* ------------------------------------------------------------------ */
export type EventField = "required" | "optional" | "hidden";
export interface Cascade {
  optimizationGoals: OptimizationGoal[];
  /** When exactly one goal, it's locked read-only. */
  lockedGoal?: OptimizationGoal;
  eventField: EventField;
}

const C = (goals: OptimizationGoal[], eventField: EventField): Cascade => ({
  optimizationGoals: goals,
  lockedGoal: goals.length === 1 ? goals[0] : undefined,
  eventField,
});

/** The cascade for a given objective + destination (matrix §1). */
export function cascade(objective: Objective, dest: DestinationType | null): Cascade {
  switch (objective) {
    case "OUTCOME_AWARENESS":
      return C(["REACH", "IMPRESSIONS", "AD_RECALL_LIFT", "THRUPLAY", "TWO_SECOND_CONTINUOUS_VIDEO_VIEWS"], "hidden");
    case "OUTCOME_TRAFFIC":
      if (dest === "INSTAGRAM_DIRECT") return C(["VISIT_INSTAGRAM_PROFILE"], "hidden");
      if (dest === "PHONE_CALL") return C(["QUALITY_CALL"], "hidden");
      if (dest === "APP") return C(["LINK_CLICKS", "REACH"], "hidden");
      if (dest === "MESSENGER" || dest === "WHATSAPP") return C(["LINK_CLICKS", "REACH", "CONVERSATIONS", "IMPRESSIONS"], "hidden");
      return C(["LANDING_PAGE_VIEWS", "LINK_CLICKS", "REACH", "CONVERSATIONS", "IMPRESSIONS"], "hidden");
    case "OUTCOME_ENGAGEMENT":
      if (dest === "ON_PAGE") return C(["PAGE_LIKES"], "hidden");
      if (dest === "ON_VIDEO") return C(["THRUPLAY", "TWO_SECOND_CONTINUOUS_VIDEO_VIEWS"], "hidden");
      if (dest === "ON_EVENT") return C(["EVENT_RESPONSES", "POST_ENGAGEMENT", "REACH", "IMPRESSIONS"], "hidden");
      if (dest === "ON_POST") return C(["POST_ENGAGEMENT", "REACH", "IMPRESSIONS"], "hidden");
      if (dest === "MESSENGER" || dest === "WHATSAPP" || dest === "INSTAGRAM_DIRECT") return C(["CONVERSATIONS", "LEAD_GENERATION", "LINK_CLICKS"], "hidden");
      if (dest === "WEBSITE") return C(["OFFSITE_CONVERSIONS", "LANDING_PAGE_VIEWS", "LINK_CLICKS", "REACH", "IMPRESSIONS"], "required");
      if (dest === "APP") return C(["APP_INSTALLS", "LINK_CLICKS", "REACH"], "required");
      if (dest === "PHONE_CALL") return C(["QUALITY_CALL"], "hidden");
      return C(["POST_ENGAGEMENT", "REACH", "IMPRESSIONS"], "hidden");
    case "OUTCOME_LEADS":
      if (dest === "PHONE_CALL") return C(["QUALITY_CALL"], "hidden");
      if (dest === "WEBSITE") return C(["LEAD_GENERATION", "QUALITY_LEAD"], "required");
      if (dest === "ON_AD") return C(["LEAD_GENERATION", "QUALITY_LEAD"], "hidden"); // instant forms
      if (dest === "WHATSAPP") return C(["CONVERSATIONS"], "hidden");
      if (dest === "MESSENGER" || dest === "INSTAGRAM_DIRECT") return C(["LEAD_GENERATION"], "hidden");
      if (dest === "APP") return C(["APP_INSTALLS"], "optional");
      return C(["LEAD_GENERATION"], "hidden");
    case "OUTCOME_APP_PROMOTION":
      return C(["APP_INSTALLS", "LINK_CLICKS", "REACH", "VALUE"], "optional");
    case "OUTCOME_SALES":
      if (dest === "PHONE_CALL") return C(["QUALITY_CALL"], "hidden");
      if (dest === "PRODUCT_CATALOG_SALES") return C(["OFFSITE_CONVERSIONS", "VALUE", "LINK_CLICKS", "IMPRESSIONS"], "required");
      if (dest === "APP") return C(["OFFSITE_CONVERSIONS", "LINK_CLICKS", "REACH", "IMPRESSIONS"], "required");
      if (dest === "MESSENGER" || dest === "WHATSAPP") return C(["OFFSITE_CONVERSIONS", "LINK_CLICKS", "REACH"], "required");
      return C(["OFFSITE_CONVERSIONS", "VALUE", "LANDING_PAGE_VIEWS", "LINK_CLICKS", "REACH", "IMPRESSIONS"], "required");
  }
}

/* ------------------------------------------------------------------ */
/*  §2 Format gating                                                   */
/* ------------------------------------------------------------------ */
const VIDEO_VIEW_GOALS: OptimizationGoal[] = ["THRUPLAY", "TWO_SECOND_CONTINUOUS_VIDEO_VIEWS"];

/** Allowed ad formats for {objective, destination, optimizationGoal} (matrix §2). */
export function allowedFormats(objective: Objective, dest: DestinationType | null, goal: OptimizationGoal | null): AdFormat[] {
  // Catalog destination ⇒ DPA only.
  if (dest === "PRODUCT_CATALOG_SALES") return ["dpa"];
  // Video-view goals ⇒ video-led only.
  if (goal && VIDEO_VIEW_GOALS.includes(goal)) return ["single_video", "carousel"];
  // App promotion: no collection.
  if (objective === "OUTCOME_APP_PROMOTION") return ["single_image", "single_video", "carousel", "flexible"];
  // Messaging / instant-form / calls / on-ad engagement: no collection.
  const noCollection: DestinationType[] = ["MESSENGER", "WHATSAPP", "INSTAGRAM_DIRECT", "ON_AD", "PHONE_CALL", "ON_POST", "ON_PAGE", "ON_EVENT", "ON_VIDEO"];
  const base: AdFormat[] = ["single_image", "single_video", "carousel", "flexible"];
  if (dest && noCollection.includes(dest)) {
    // is_dynamic_creative disabled for Sales & App → flexible still allowed (it IS the route)
    return base;
  }
  // Web/app conversion contexts: collection + (sales) dpa allowed.
  const full: AdFormat[] = [...base, "collection"];
  if (objective === "OUTCOME_SALES" || objective === "OUTCOME_TRAFFIC" || objective === "OUTCOME_ENGAGEMENT" || objective === "OUTCOME_LEADS") {
    full.push("dpa");
  }
  return full;
}

export function requiresCatalog(plan: PlanV2): boolean {
  return plan.format === "dpa" || plan.destinationType === "PRODUCT_CATALOG_SALES";
}
export function requiresPixel(plan: PlanV2): boolean {
  const c = plan.objective ? cascade(plan.objective, plan.destinationType) : null;
  return c?.eventField === "required" && (plan.optimizationGoal === "OFFSITE_CONVERSIONS" || plan.optimizationGoal === "VALUE");
}
export function requiresLeadgenTos(plan: PlanV2): boolean {
  return plan.objective === "OUTCOME_LEADS" && plan.destinationType === "ON_AD";
}

/* ------------------------------------------------------------------ */
/*  §3 ASC (Advantage+) — DERIVED state                                */
/* ------------------------------------------------------------------ */
/** ASC is not a mode — it's derived when the 3 levers are all on (+ scale+sales). */
export function isAdvantagePlus(plan: PlanV2): boolean {
  // ASC is sales-only + carousel/collection per Meta docs
  return (
    plan.advantagePlus &&
    plan.budgetMode === "CBO" &&
    plan.advantageAudience &&
    plan.objective === "OUTCOME_SALES" &&
    plan.format !== null &&
    (plan.format === "carousel" || plan.format === "collection")
  );
}

/* ------------------------------------------------------------------ */
/*  §4 Budget + bid                                                    */
/* ------------------------------------------------------------------ */
const VALUE_GOAL: OptimizationGoal = "VALUE";

/** Bid strategies valid for {objective, optimizationGoal} (matrix §4). TARGET_COST dropped. */
export function allowedBidStrategies(objective: Objective, goal: OptimizationGoal | null): BidStrategy[] {
  const base: BidStrategy[] = ["LOWEST_COST_WITHOUT_CAP", "LOWEST_COST_WITH_BID_CAP"];
  // Value strategies only on Sales (+ value-capable App) with VALUE optimization.
  if (objective === "OUTCOME_SALES" && goal === VALUE_GOAL) {
    return ["LOWEST_COST_WITHOUT_CAP", "COST_CAP", "LOWEST_COST_WITH_BID_CAP", "LOWEST_COST_WITH_MIN_ROAS", "HIGHEST_VALUE"];
  }
  // Cost cap on conversion-ish objectives.
  if (objective === "OUTCOME_SALES" || objective === "OUTCOME_LEADS" || objective === "OUTCOME_TRAFFIC" || objective === "OUTCOME_ENGAGEMENT") {
    return ["LOWEST_COST_WITHOUT_CAP", "COST_CAP", "LOWEST_COST_WITH_BID_CAP"];
  }
  // Awareness/Reach: volume + bid cap only.
  return base;
}

/** CBO default-on objectives. */
export function defaultBudgetMode(objective: Objective | null, intent: Intent): "ABO" | "CBO" {
  if (intent === "scale") return "CBO";
  if (objective === "OUTCOME_SALES" || objective === "OUTCOME_LEADS" || objective === "OUTCOME_APP_PROMOTION") return "CBO";
  return "ABO";
}

/* ------------------------------------------------------------------ */
/*  §5 Special ad category                                             */
/* ------------------------------------------------------------------ */
export function specialCategoryActive(plan: PlanV2): boolean {
  return plan.specialAdCategories.length > 0;
}

/* ------------------------------------------------------------------ */
/*  Intent defaults (the "smart reduction" prefill)                    */
/* ------------------------------------------------------------------ */
export interface IntentDefaults {
  budgetMode: "ABO" | "CBO";
  spread: PlanV2["spread"];
  bidStrategy: BidStrategy;
  structure: PlanV2["structure"];
  advantagePlus: boolean;
  budgetAmount: number;
}
export function intentDefaults(intent: Intent, objective: Objective | null): IntentDefaults {
  if (intent === "test") {
    return { budgetMode: "ABO", spread: "one_per_adset", bidStrategy: "LOWEST_COST_WITHOUT_CAP", structure: { campaigns: 1, adSetsPerCampaign: 5, adsPerAdSet: 1 }, advantagePlus: false, budgetAmount: 10 };
  }
  if (intent === "scale") {
    return { budgetMode: "CBO", spread: "stacked", bidStrategy: "COST_CAP", structure: { campaigns: 1, adSetsPerCampaign: 1, adsPerAdSet: 6 }, advantagePlus: true, budgetAmount: 100 };
  }
  // custom — no opinion
  return { budgetMode: defaultBudgetMode(objective, "custom"), spread: "one_per_adset", bidStrategy: "LOWEST_COST_WITHOUT_CAP", structure: { campaigns: 1, adSetsPerCampaign: 1, adsPerAdSet: 1 }, advantagePlus: false, budgetAmount: 20 };
}

/* ------------------------------------------------------------------ */
/*  §6 Master field policy — HIDE / LOCK / DEFAULT                     */
/* ------------------------------------------------------------------ */
const SHOW: FieldPolicy = { visibility: "show", locked: false };
const ADV: FieldPolicy = { visibility: "advanced", locked: false };
const HIDDEN: FieldPolicy = { visibility: "hidden", locked: true };
const lock = (reason: string): FieldPolicy => ({ visibility: "show", locked: true, reason });

/**
 * The per-field policy for the current plan. Screens read this to decide
 * show/advanced/hidden + locked. Keys are stable field ids.
 */
export function fieldPolicy(plan: PlanV2): Record<string, FieldPolicy> {
  const asc = isAdvantagePlus(plan);
  const special = specialCategoryActive(plan);
  const c = plan.objective ? cascade(plan.objective, plan.destinationType) : null;

  return {
    // Campaign
    objective: lock("Chosen at Start"),
    specialAdCategories: SHOW,
    budgetMode: asc ? lock("Advantage+ uses campaign budget") : ADV,
    bidStrategy: ADV,
    advantagePlus: SHOW,

    // Ad set
    destinationType: plan.objective && showsLocationPicker(plan.objective) ? SHOW : HIDDEN,
    optimizationGoal: c?.lockedGoal ? lock("Only option for this destination") : ADV,
    conversionEvent: c?.eventField === "required" ? SHOW : c?.eventField === "optional" ? ADV : HIDDEN,
    budgetAmount: SHOW,
    adSetBidControls: asc ? HIDDEN : ADV,
    advantageAudience: asc ? lock("Required for Advantage+") : SHOW,
    placements: asc ? { visibility: "hidden", locked: true, reason: "Advantage+ placements" } : ADV,
    // Targeting detail: suggestions under A+, but LOCKED under special category
    detailedTargeting: special ? lock("Restricted for special ad category") : ADV,
    ageGender: special ? lock("Fixed 18–65+ / All for special ad category") : ADV,
    lookalikes: special ? HIDDEN : ADV,
    // hard controls always editable
    location: SHOW,
    languages: ADV,

    // Ad
    pageId: lock("Selected destination Page"),
    format: SHOW,
    catalog: requiresCatalog(plan) ? SHOW : HIDDEN,
    advantageCreative: SHOW,
  };
}

/* ------------------------------------------------------------------ */
/*  Soft warnings (warn, don't block) — matrix §6 / §7                 */
/* ------------------------------------------------------------------ */
export interface SoftWarning { code: string; message: string }
export function softWarnings(plan: PlanV2, adSetCount: number): SoftWarning[] {
  const w: SoftWarning[] = [];
  if (plan.budgetMode === "CBO" && adSetCount > 70) {
    w.push({ code: "CBO_70", message: "Over 70 ad sets under CBO — bid-strategy edits lock." });
  }
  if (adSetCount > 200) {
    w.push({ code: "ADSET_200", message: "200 ad-set cap per campaign (CBO)." });
  }
  if (plan.intent === "test" && plan.structure.adSetsPerCampaign > 8 && plan.budgetAmount < 10) {
    w.push({ code: "FRAGMENT", message: "Many thin ad sets — learning-phase fragmentation risk." });
  }
  return w;
}

/**
 * Cumulative validation — checks every step UP TO and INCLUDING throughStep.
 * Step order (new 5-step flow):
 *   1 Start     — objective required
 *   2 Setup     — at least 1 destination + positive budget
 *   3 Ad        — format selected + at least 1 creative
 *   4 Distribution — cap check (fix buttons shown inline)
 *   5 Review    — same cap check (must be resolved before launch)
 */
export function planReady(plan: PlanV2, throughStep: 1 | 2 | 3 | 4 | 5): boolean {
  if (throughStep >= 1 && !plan.objective) return false;
  if (throughStep >= 2 && (plan.targets.length === 0 || plan.budgetAmount <= 0)) return false;
  if (throughStep >= 3 && (!plan.format || plan.creatives.length === 0)) return false;
  // Post mode ("show = launch"): an ad account with 0 resulting ads is a hard
  // block, not a soft warning — post-mode toggle + post selection both happen
  // by Step 3 (Ad & Distribution) in the running 4-step flow, so gate here.
  if (throughStep >= 3 && accountsWithZeroPostAds(plan).length > 0) return false;
  if (throughStep >= 4 && !capCheck(plan).ok) return false;
  if (throughStep >= 5 && !capCheck(plan).ok) return false;
  return true;
}

/** When catalogue is off, catalog/product-set selections are meaningless. */
export function catalogActive(plan: PlanV2): boolean {
  return plan.catalogueToggle === true;
}
