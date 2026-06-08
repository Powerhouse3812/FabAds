/**
 * Launch v2 — domain types (the fresh redesign).
 *
 * A from-scratch 4-step flow: Start (reducer) → Setup → Creative-spread →
 * Review & Launch. The reducer (intent + objective + ad-format) prefills /
 * hides / locks downstream fields exactly as Meta does (see reducer.ts, encoded
 * from LAUNCH2_V2_META_MATRIX.md). Canonical Meta enums throughout.
 *
 * v1 Launch (/launch) and current Launch 2.0 (/launch2) are untouched. This
 * reuses launch2's reliability-sim pattern + 250-cap + mock asset data, but has
 * its own plan model, reducer, flow-state and screens.
 */

/* ---- Step 1: the reducer inputs ---- */

/** Intent = how aggressive/structured. Test & Scale prefill; Custom = manual. */
export type Intent = "test" | "scale" | "custom";

/** Meta ODAX objectives (the 6 outcomes). */
export type Objective =
  | "OUTCOME_AWARENESS"
  | "OUTCOME_TRAFFIC"
  | "OUTCOME_ENGAGEMENT"
  | "OUTCOME_LEADS"
  | "OUTCOME_APP_PROMOTION"
  | "OUTCOME_SALES";

export type AdFormat =
  | "single_image"
  | "single_video"
  | "carousel"
  | "collection"
  | "flexible"
  | "dpa";

export type SourceType = "url" | "library" | "upload" | "genie" | "drive" | "reports" | "post_id" | "folder";

/* ---- Meta cascade enums (from the matrix) ---- */

export type DestinationType =
  | "WEBSITE"
  | "APP"
  | "MESSENGER"
  | "WHATSAPP"
  | "INSTAGRAM_DIRECT"
  | "ON_AD" // instant forms
  | "ON_POST"
  | "ON_PAGE"
  | "ON_EVENT"
  | "ON_VIDEO"
  | "PHONE_CALL"
  | "PRODUCT_CATALOG_SALES";

export type OptimizationGoal =
  | "REACH"
  | "IMPRESSIONS"
  | "AD_RECALL_LIFT"
  | "THRUPLAY"
  | "TWO_SECOND_CONTINUOUS_VIDEO_VIEWS"
  | "LINK_CLICKS"
  | "LANDING_PAGE_VIEWS"
  | "POST_ENGAGEMENT"
  | "PAGE_LIKES"
  | "EVENT_RESPONSES"
  | "CONVERSATIONS"
  | "OFFSITE_CONVERSIONS"
  | "VALUE"
  | "LEAD_GENERATION"
  | "QUALITY_LEAD"
  | "QUALITY_CALL"
  | "APP_INSTALLS"
  | "VISIT_INSTAGRAM_PROFILE";

/** Bid strategy (canonical API enum; UI labels mapped in data.ts). */
export type BidStrategy =
  | "LOWEST_COST_WITHOUT_CAP" // Highest volume (default)
  | "COST_CAP" // Cost per result goal
  | "LOWEST_COST_WITH_BID_CAP" // Bid cap
  | "LOWEST_COST_WITH_MIN_ROAS" // ROAS goal (needs VALUE)
  | "HIGHEST_VALUE"; // (needs VALUE)

export type BudgetMode = "ABO" | "CBO"; // ASC is a DERIVED state, not a 3rd mode

export type SpecialAdCategory =
  | "HOUSING"
  | "EMPLOYMENT"
  | "FINANCIAL_PRODUCTS_SERVICES"
  | "ISSUES_ELECTIONS_POLITICS";

/* ---- Step 3: creative spread ---- */

/** Creative→ad-set mapping. one_per_adset = "Bruno"/1:1. */
export type SpreadMode = "one_per_adset" | "round_robin" | "stacked" | "multiply" | "manual";

/** When loose multi-media + multi-text: how they combine. */
export type CombinationMode = "all" | "paired";

export interface CreativeRef {
  id: string;
  name: string;
  format: AdFormat;
  source: SourceType;
  thumbnail?: string;
  /** A complete saved ad (Library/Reports) carries its own copy — applied as-is. */
  savedAd?: boolean;
  /** Discriminates the kind of Library item: media asset, text-only copy, or a saved whole-ad. */
  itemType?: "media" | "text" | "ad";
  /** Full text content for itemType="text" items (name is truncated; this holds the complete copy). */
  text?: string;
}

/** Shared ad-copy block (per-creative overrides keyed by creative id). */
export interface AdCopy {
  primaryText: string;
  headline: string;
  description: string;
  cta: string;
  destinationUrl: string;
  displayLink: string;
  utmTemplate: string;
  /** DCO/Advantage+ extra variations (advanced). */
  textVariations?: string[];
}

/* ---- Step 3: media scope ---- */
export type MediaScope = "whole_ads" | "individual_media";

/* ---- Step 4: page distribution (ad→page axis) ---- */
export type PageDistribution = "one_page" | "fill_first" | "equal" | "duplicate";

/* ---- Strategy entity (bundles campaign defaults + targeting prefill) ---- */
export interface Strategy {
  id: string;
  name: string;
  type: "preset" | "saved";
  budgetMode: BudgetMode;
  budgetAmount: number;
  bidStrategy: BidStrategy;
  structure: { campaigns: number; adSetsPerCampaign: number; adsPerAdSet: number };
  spread: SpreadMode;
  advantagePlus: boolean;
  targetingTemplateId?: string | null;
}

export const MAX_ADS_PER_PAGE = 250;

/* ---- Destinations (account → page) ---- */
export interface TargetPair {
  accountId: string;
  accountName: string;
  currency: string;
  pageId: string;
  fbPageId: string;
  pageName: string;
  pixelId?: string;
}

/* ---- Attribution window (per-plan setting; default 7-day click + 1-day view) ---- */
export type AttributionWindow = "1d_click" | "7d_click" | "7d_click_1d_view";

/* ---- The plan ---- */
export interface PlanV2 {
  id: string;
  name: string;

  // Step 1 — Start (reducer)
  source: { type: SourceType | null; ref: string | null };
  intent: Intent;
  objective: Objective | null;
  format: AdFormat | null;

  // Step 2 — Setup
  targets: TargetPair[];
  destinationType: DestinationType | null;
  optimizationGoal: OptimizationGoal | null;
  conversionEvent: string | null;
  budgetMode: BudgetMode;
  budgetAmount: number;
  bidStrategy: BidStrategy;
  bidValue: number | null;
  /** The Advantage+ toggle. Scale + the 3 levers ⇒ ASC (derived). */
  advantagePlus: boolean;
  targetingTemplateId: string | null;
  advantageAudience: boolean;
  advantageCreative: boolean;
  specialAdCategories: SpecialAdCategory[];
  attribution: AttributionWindow;
  /** Which strategy preset/saved is active (null = custom, no preset). */
  strategyId: string | null;
  /** Catalogue Ads toggle — if true, Step 3 pre-selects the Catalogue format. */
  catalogueToggle: boolean;
  /** Campaign-level A/B test signal (Meta handles the split). */
  abTest: boolean;
  /** Whole ads (pre-built) vs individual media assets. */
  mediaScope: MediaScope;

  // Step 3 — Creative spread
  creatives: CreativeRef[];
  spread: SpreadMode;
  creativeSlotMap: Record<number, string>;
  combination: CombinationMode;
  adCopy: AdCopy;
  copyOverrides: Record<string, Partial<AdCopy>>;
  structure: { campaigns: number; adSetsPerCampaign: number; adsPerAdSet: number };

  // Step 4 — Review & Launch
  pageDistribution: PageDistribution;
  namingPattern: string;
  scheduledFor: string | null;

  createdAt: string;
  updatedAt: string;
}

/* ---- Reducer policy output ---- */
export type FieldVisibility = "show" | "advanced" | "hidden";
export interface FieldPolicy {
  visibility: FieldVisibility;
  locked: boolean;
  /** Human reason for a lock/hide, shown next to the control. */
  reason?: string;
}

/* ---- Launch run (reliability accounting — same spine as launch2) ---- */
export type RunStatus = "queued" | "launching" | "partial" | "completed" | "failed" | "scheduled";
export type UnitStatus = "pending" | "creating" | "created" | "failed";
export interface FailureReason { code: string; message: string; retryable: boolean }
export interface AdUnitV2 {
  id: string;
  name: string;
  campaignName: string;
  adSetName: string;
  creativeName: string;
  target: TargetPair;
  status: UnitStatus;
  failure?: FailureReason;
}
export interface LaunchRunV2 {
  id: string;
  planId: string;
  name: string;
  status: RunStatus;
  requested: number;
  created: number;
  failed: number;
  pending: number;
  units: AdUnitV2[];
  budgetPerDay: number;
  currency: string;
  retryCount: number;
  createdAt: string;
  scheduledFor?: string;
}
