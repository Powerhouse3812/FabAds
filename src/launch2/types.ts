/**
 * Launch 2.0 — domain types (the frozen contract).
 *
 * This is a fresh, from-scratch parent module for Meta bulk ad-launching.
 * Everything is driven by a mock `MetaLaunchService` for now; the real Meta
 * Graph API swaps in later behind the same interface (see services/).
 *
 * Tags carried from the planning discovery:
 *   [V] verified  ·  [I] inferred (placeholder — Maalik will correct)  ·  [O] observed
 *
 * Reliability spine (acceptance criteria these types must support):
 *   - idempotent launch (N requested = N created; stable per-unit dedupe key)
 *   - failed ≠ launched accounting (created / failed / pending always reconcile)
 *   - retry-failed-only (never re-runs created units)
 *   - throttled / batched execution with live progress
 *   - 250-active-ads-per-Page cap pre-check
 */

/* ------------------------------------------------------------------ */
/*  Upfront reducers (Step 1)                                          */
/* ------------------------------------------------------------------ */

/** Mode = how much the user wants to configure. */
export type LaunchMode = "quick" | "preset" | "custom";

/** The 7 strategy playbooks. Only `bruno` is [V] verified; rest are [I]. */
export type StrategyId =
  | "bruno"
  | "bid-cap"
  | "phase-audience"
  | "tg-testing"
  | "asc-scaling"
  | "duplication"
  | "social-proofing";

/** Campaign objective. */
export type Objective = "sales" | "leads" | "traffic" | "engagement";

/* ------------------------------------------------------------------ */
/*  Distribution (Step 2) — 3 strategies, 250-cap                      */
/* ------------------------------------------------------------------ */

export type DistributionStrategy = "fill-first" | "equal" | "duplicate";

/** Hard cap: max active ads per unique Facebook Page. */
export const MAX_ADS_PER_PAGE = 250;

/* ------------------------------------------------------------------ */
/*  Meta assets (mock)                                                 */
/* ------------------------------------------------------------------ */

export type AccountStatus = "active" | "restricted" | "disabled";

export interface Page {
  id: string;
  /** Facebook Page id — the capacity bucket key. */
  fbPageId: string;
  name: string;
  /** Currently-active ads on this Page (of MAX_ADS_PER_PAGE). */
  activeAds: number;
  category?: string;
}

export interface Pixel {
  id: string;
  name: string;
  /** Recent signal — ops cue only, not a performance metric. */
  lastEventAt?: string;
}

export interface AdAccount {
  id: string;
  name: string;
  currency: string; // ISO 4217 e.g. "INR", "USD"
  status: AccountStatus;
  pages: Page[];
  pixels: Pixel[];
}

export interface ProductSet {
  id: string;
  name: string;
  productCount: number;
  /** A few representative product names — used to label DPA units. */
  sampleProducts?: string[];
}

export interface Catalogue {
  id: string;
  accountId: string;
  name: string;
  productCount: number;
  productSets: ProductSet[];
}

/* ------------------------------------------------------------------ */
/*  Strategy playbook                                                  */
/* ------------------------------------------------------------------ */

export interface StrategyPlaybook {
  id: StrategyId;
  name: string;
  tagline: string;
  /** true = [V] verified numbers; false = [I] inferred placeholder. */
  verified: boolean;
  /** Default objective this playbook is tuned for. */
  objective: Objective;
  /** Structure defaults (the 1:N:1 spine). */
  structure: {
    campaigns: number;
    adSetsPerCampaign: number;
    adsPerAdSet: number;
  };
  budgetPerAdSet: number; // per day, in account currency
  budgetType: "daily" | "lifetime";
  bidStrategy?: string;
  description: string;
  /** Shown when verified === false. */
  inferredNote?: string;
  recommendedFor?: string;
}

/* ------------------------------------------------------------------ */
/*  Flow / plan (the in-progress + saved launch definition)            */
/* ------------------------------------------------------------------ */

export type AdType = "single-image" | "carousel" | "video" | "dpa";
export type CreativeSource = "library" | "upload" | "post" | "catalogue";

/**
 * How selected creatives map onto the ad slots the structure produces.
 *  - distribute: round-robin creatives across existing ad slots (count unchanged)
 *  - multiply:   clone the whole structure once per creative (count × creatives)
 *  - manual:     explicit creativeSlotMap; unmapped slots fall back to round-robin
 */
export type AllocationMode = "distribute" | "multiply" | "manual";

/** Meta special ad categories (compliance — restricts targeting). */
export type SpecialAdCategory =
  | "credit"
  | "employment"
  | "housing"
  | "social-issues";

/** A pickable creative from the library/pool (the small "real creative" slice). */
export interface CreativeAsset {
  id: string;
  name: string;
  type: AdType;
  source: CreativeSource;
  thumbnail?: string;
  /** seconds, for video assets */
  durationSec?: number;
}

export interface CreativeSpec {
  id: string;
  name: string;
  type: AdType;
  source: CreativeSource;
  thumbnail?: string;
  /** id of the CreativeAsset this was picked from (when picked, not uploaded). */
  assetId?: string;
}

/** A single (Ad Account → Page) destination. */
export interface LaunchTarget {
  accountId: string;
  accountName: string;
  pageId: string;
  fbPageId: string;
  pageName: string;
  pixelId?: string;
}

export interface LaunchStructure {
  campaigns: number;
  adSetsPerCampaign: number;
  adsPerAdSet: number;
}

/**
 * The launch definition. Lives as a draft while being edited (autosaved),
 * then handed to the service to produce a LaunchRun.
 */
export interface LaunchPlan {
  /** Stable id — also the idempotency key base for the run. */
  id: string;
  name: string;

  // Step 1
  mode: LaunchMode;
  strategyId: StrategyId | null;
  objective: Objective | null;

  // Step 2
  targets: LaunchTarget[];
  distribution: DistributionStrategy;

  // Step 3
  audienceLabel: string | null;
  catalogueId: string | null;
  productSetId: string | null;
  budgetPerAdSet: number;

  // Step 4 — creatives + allocation + tracking
  adType: AdType;
  creatives: CreativeSpec[];
  structure: LaunchStructure;
  /** How creatives fill ad slots. */
  allocation: AllocationMode;
  /** adSlotIndex -> creativeId, for manual allocation only. */
  creativeSlotMap: Record<number, string>;
  /** Landing/destination URL for the ads. */
  destinationUrl: string;
  displayLink: string | null;
  /** UTM/tracking template appended to destinationUrl; supports {{campaign}} / {{adset}} tokens. */
  utmTemplate: string;

  // Compliance + naming
  specialAdCategories: SpecialAdCategory[];
  /** Entity-naming pattern, e.g. "{brand}_{strategy}_{objective}_{date}". */
  namingPattern: string;

  /** Template this plan was seeded from (provenance; null = none). */
  templateId: string | null;

  // Scheduling (optional) — ISO string; if set + future, run is "scheduled".
  scheduledFor: string | null;

  createdAt: string;
  updatedAt: string;
}

/**
 * A saved Targeting/config template — captured from a plan, applied to a new
 * one. Thin today (the targeting model is shallow); grows automatically as the
 * targeting fields deepen. Note: V1's targeting option-lists are themselves
 * mock, so this is re-derived, not copied.
 */
export interface LaunchTemplate {
  id: string;
  name: string;
  strategyId: StrategyId | null;
  objective: Objective | null;
  audienceLabel: string | null;
  budgetPerAdSet: number;
  distribution: DistributionStrategy;
  specialAdCategories: SpecialAdCategory[];
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Launch run (after submit) + reliability accounting                 */
/* ------------------------------------------------------------------ */

export type LaunchRunStatus =
  | "queued"
  | "launching"
  | "partial" // completed with some failures
  | "completed"
  | "failed" // everything failed
  | "scheduled";

export type AdUnitStatus = "pending" | "creating" | "created" | "failed";

export interface FailureReason {
  code: string;
  message: string;
  /** Retryable failures recover on retry-failed-only; non-retryable don't. */
  retryable: boolean;
}

/**
 * One requested ad. `id` is the stable dedupe/idempotency key — the same
 * plan launched twice yields the same unit ids, so N requested = N created
 * and a created unit is never created again.
 */
export interface AdUnit {
  id: string;
  /** Resolved entity name (from the plan's namingPattern). */
  name: string;
  campaignName: string;
  adSetName: string;
  creativeName: string;
  creativeId?: string;
  /** Final tracked destination URL (destinationUrl + resolved UTM). */
  destinationUrl?: string;
  target: LaunchTarget;
  status: AdUnitStatus;
  failure?: FailureReason;
}

export interface LaunchRun {
  id: string;
  planId: string;
  name: string;
  strategyId: StrategyId;
  strategyName: string;
  objective: Objective;
  distribution: DistributionStrategy;
  status: LaunchRunStatus;

  // Reliability accounting — these always reconcile: created+failed+pending = requested
  requested: number;
  created: number;
  failed: number;
  pending: number;

  units: AdUnit[];

  budgetPerDay: number;
  currency: string;
  targets: LaunchTarget[];

  /** How many times retry-failed-only has been run. */
  retryCount: number;

  /** Snapshot of the plan that produced this run — enables exact clone/relaunch. */
  sourcePlan?: LaunchPlan;

  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  scheduledFor?: string;
}

/* ------------------------------------------------------------------ */
/*  Home shelves + secondary screens                                   */
/* ------------------------------------------------------------------ */

/**
 * Winners shelf — OPS SIGNAL ONLY. No performance metrics (no ROAS/CTR).
 * (Locked decision.)
 */
export interface WinnerStrategy {
  id: string;
  strategyId: StrategyId;
  name: string;
  /** Last time this proven setup was launched. */
  lastLaunchedAt: string;
  /** How many times it's been relaunched. */
  relaunchCount: number;
  proven: boolean;
  thumbnail?: string;
}

export type ActivityType =
  | "launch"
  | "retry"
  | "draft"
  | "schedule"
  | "failure"
  | "recovery"
  | "settings";

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  title: string;
  detail?: string;
  at: string;
  launchId?: string;
}

export interface AccountHealth {
  accountId: string;
  accountName: string;
  status: AccountStatus;
  pages: {
    pageId: string;
    pageName: string;
    activeAds: number;
    capacity: number;
  }[];
  issues?: { severity: "warn" | "error"; message: string }[];
}
