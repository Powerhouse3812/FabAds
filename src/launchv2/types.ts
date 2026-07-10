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
export type SpreadMode = "one_per_adset" | "round_robin" | "stacked" | "multiply" | "manual" | "custom";

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
  /** Advantage+ creative / multiple-text toggle. When on, the *Variations arrays apply (max 5 each). */
  multiTextEnabled?: boolean;
  /** DCO/Advantage+ extra PRIMARY-text variations (up to 5 total incl. primaryText). */
  textVariations?: string[];
  /** Extra HEADLINE variations (up to 5 total incl. headline). */
  headlineVariations?: string[];
  /** Extra DESCRIPTION variations (up to 5 total incl. description). */
  descriptionVariations?: string[];
}

/** One carousel card (Meta link_data.child_attachments[]). Carousel = 2–10 cards. */
export interface CarouselCard {
  id: string;
  /** selected media creative id for this card. */
  creativeId?: string;
  headline: string;
  description: string;
  link: string;
  cta: string;
}

/* ---- Step 3: media scope ---- */
export type MediaScope = "whole_ads" | "individual_media";

/* ---- Step 4: page distribution (ad→page axis) ---- */
export type PageDistribution = "one_page" | "fill_first" | "equal" | "duplicate" | "custom";

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

export const MAX_ADS_PER_PAGE = 250;           // existing — firm Meta limit, per Facebook Page

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

/* ---- Catalogue ads (mock) ---- */
export interface ProductV2 {
  id: string;
  name: string;
  thumbnail: string;
  price: string;        // pre-formatted, e.g. "₹499"
}
export interface ProductSetV2 {
  id: string;
  name: string;
  productCount: number;
  /** Sample products (for card preview). */
  products: ProductV2[];
}
export interface CatalogV2 {
  id: string;
  name: string;
  productCount: number;
  productSets: ProductSetV2[];
}
export type CatalogFormat = "carousel" | "advantage_auto";
/** A single account's catalogue selection. */
export interface CatalogSelection {
  catalogId: string | null;
  productSetIds: string[];
}

/** New campaign-level catalogue config (one entry per campaign within an account). */
export interface CatalogueCampaignConfig {
  id: string;
  catalogId: string | null;
  productSetIds: string[];
  adSetDuplicates: number;       // how many ad set copies per product set, default 1 min 1
  collection: boolean;           // "Show as Collection" toggle
  // Ad copy (only when collection=true):
  promotedProductPreference: string | null;
  productSetSuggestion: string | null;
  primaryText: string;
  headline: string;
  description: string;
}

/* ---- Copy-from-running source entities (mock, Birch-style) ---- */
export interface RunningCampaignV2 {
  id: string;
  name: string;
  objective: Objective;
  budgetMode: BudgetMode;
  budgetAmount: number;
  bidStrategy: BidStrategy;
  advantagePlus: boolean;
  status: "active" | "paused";
  // optional metrics
  spend30d?: number;      // INR spend last 30d
  roas30d?: number;       // e.g. 4.2
  cpm30d?: number;        // INR CPM
}
export interface RunningAdSetV2 {
  id: string;
  name: string;
  campaignName: string;
  optimizationGoal: OptimizationGoal;
  audienceName: string;
  placements: "Automatic" | "Manual — Feed + Stories";
  status: "active" | "paused";
  // optional metrics
  spend30d?: number;
  cpa30d?: number;        // cost per result
  reach30d?: number;      // unique reach
  frequency30d?: number;  // e.g. 3.2
}
export interface RunningAdV2 {
  id: string;
  name: string;
  pageName: string;
  /** Owner Page's Facebook Page id — the capacity-bucket key (a Page can be shared across accounts). */
  fbPageId: string;
  postId: string;        // existing post id (use_existing_post)
  thumbnail: string;
  format: AdFormat;
  // optional metrics
  spend30d?: number;
  ctr30d?: number;        // e.g. 2.4 (percentage)
  roas30d?: number;
  status?: "active" | "paused";
}

export interface CustomAudienceV2 {
  id: string;
  name: string;
  type: "lookalike" | "custom_list" | "website_traffic" | "engagement";
  estimatedSize: number; // e.g. 180000
  accountId: string;    // which ad account owns it
}

/* ---- Manual placement selection ---- */
export interface PlacementSelection {
  facebook: {
    feeds: boolean;
    profileFeed: boolean;
    videoFeeds: boolean;
    inStreamVideos: boolean;
    stories: boolean;
    reels: boolean;
    rightColumn: boolean;
    marketplace: boolean;
    searchResults: boolean;
    businessExplore: boolean;
    notifications: boolean;
  };
  instagram: {
    feed: boolean;
    profileFeed: boolean;
    explore: boolean;
    exploreHome: boolean;
    stories: boolean;
    reels: boolean;
    searchResults: boolean;
  };
  audienceNetwork: {
    nativeBannerInterstitial: boolean;
    rewardedVideos: boolean;
  };
  messenger: {
    inbox: boolean;
    stories: boolean;
    sponsoredMessages: boolean;
  };
  threads: {
    feed: boolean;
  };
}

/* ---- Distribution redesign (account-wise + page-wise) ---- */
/** How N ads split across the selected ad accounts. custom = explicit ad counts summing to total. */
export type AccountDistribution = "equal" | "duplicate" | "custom";
export type StructureCounts = { campaigns: number; adSetsPerCampaign: number; adsPerAdSet: number };

/* ---- Per-level naming patterns (nomenclature) ---- */
export interface NamingPatterns {
  campaign: string;
  adset: string;
  ad: string;
}

/* ---- Audience / targeting spec (Meta parity) ---- */
export interface GeoEntry {
  key: string;
  name?: string;
  radius?: number;
  distanceUnit?: "mile" | "kilometer";
}
export interface GeoLocations {
  countries: string[];
  regions: GeoEntry[];
  cities: GeoEntry[];
  zips: GeoEntry[];
  customLocations: { latitude: number; longitude: number; radius: number; distanceUnit: "mile" | "kilometer"; name?: string }[];
  geoMarkets: GeoEntry[];
  locationTypes: ("home" | "recent" | "travel_in" | "recent_and_home")[];
}
export interface TargetingTermRef {
  id: string;
  name: string;
}
/** One OR-group of detailed targeting (interests/behaviors/demographics). */
export interface TargetingGroup {
  interests: TargetingTermRef[];
  behaviors: TargetingTermRef[];
  demographics: TargetingTermRef[];
}
export interface AudienceRef {
  id: string;
  name: string;
  subtype?: string;
}
export type DevicePlatform = "desktop" | "mobile" | "ios";
export type UserOs = "android" | "ios";
export interface TargetingSpec {
  geoLocations: GeoLocations;
  excludedGeoLocations?: Partial<GeoLocations>;
  ageMin: number;
  ageMax: number;
  genders: ("male" | "female")[]; // empty = all
  locales: TargetingTermRef[];
  customAudiences: AudienceRef[];
  excludedCustomAudiences: AudienceRef[];
  /** AND-groups; entries within a group are OR'd, each extra group narrows ("must also match"). */
  flexibleSpec: TargetingGroup[];
  exclusions: TargetingGroup;
  /** Advantage+ Audience: when true the above act as suggestions, not hard constraints. */
  advantageAudience: boolean;
  /** Device platforms. Empty array = all devices. */
  devicePlatforms: DevicePlatform[];
  /** User operating systems. Empty array = all OS. */
  userOs: UserOs[];
}

/* ---- Attribution window (per-plan setting; default 7-day click + 1-day view) ---- */
export type AttributionWindow = "1d_click" | "7d_click" | "7d_click_1d_view";

/* ---- Per-node overrides (Review master-detail editor) ----
 * The plan holds the GLOBAL defaults. Each node in the review tree
 * (account / campaign / ad set / ad) inherits those defaults unless an entry
 * exists here. An override is a sparse bag keyed by settings-registry field id
 * (see settingsRegistry.ts). Absent key = inherited; present key = overridden;
 * delete key = reset-to-default. The store is keyed by the stable tree node id
 * produced by buildReviewTree / buildPlanUnits (new ti-inclusive encoding):
 *   account:  "acct:t{ti}:{fbPageId}"
 *   campaign: "t{ti}:{fbPageId}:c{ci}"
 *   adset:    "t{ti}:{fbPageId}:c{ci}:s{si}"
 *   ad:       "t{ti}:{fbPageId}:c{ci}:s{si}:a{k}"
 *
 * Per-placement asset customization (the crop matrix) is stored under the
 * reserved field id "__assetCustomization" as an array of rules.
 */
export type NodeOverride = Record<string, unknown>;

/** One per-placement asset-customization rule (Meta asset_customization_rules). */
export interface AssetCustomizationRule {
  /** stable id for UI keying */
  id: string;
  /** placement-group key this rule targets (e.g. "feed", "stories_reels", "instream"). */
  placementGroup: string;
  /** specific placement keys when expanded to individual placements (optional). */
  placements?: string[];
  /** crop aspect-ratio key applied to the master asset, e.g. "1x1", "9x16", "1.91x1". */
  cropKey?: string;
  /** replacement creative id when the user swaps the asset for this placement group. */
  replacementCreativeId?: string;
  isDefault?: boolean;
}

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
  /** Daily vs Lifetime budget window. */
  budgetPeriod: "daily" | "lifetime";
  bidStrategy: BidStrategy;
  bidValue: number | null;
  /** The Advantage+ toggle. Scale + the 3 levers ⇒ ASC (derived). */
  advantagePlus: boolean;
  targetingTemplateId: string | null;
  advantageAudience: boolean;
  advantageCreative: boolean;
  specialAdCategories: SpecialAdCategory[];
  /** Master toggle for the Special Ad Category declaration. When false, the category picker is hidden and the array is cleared. */
  specialAdDeclared: boolean;
  /** Authorization: who paid for the ad (required by Meta for ISSUES_ELECTIONS_POLITICS). */
  payor?: string;
  /** Authorization: who the ad benefits (required by Meta for ISSUES_ELECTIONS_POLITICS). */
  beneficiary?: string;
  attribution: AttributionWindow;
  /** Which strategy preset/saved is active (null = custom, no preset). */
  strategyId: string | null;
  /** Catalogue Ads toggle — if true, Step 3 pre-selects the Catalogue format. */
  catalogueToggle: boolean;
  /** Catalogue ads: per-account catalog + product-set selection (keyed by accountId). Only used when catalogueToggle is true. */
  catalogSelections: Record<string, CatalogSelection>;
  /** Creative format for catalogue ads. */
  catalogFormat: CatalogFormat;
  /** New campaign-level catalogue config: accountId → array of campaign configs */
  catalogueAccountConfigs: Record<string, CatalogueCampaignConfig[]>;
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
  /** Carousel cards (only used when format === "carousel"). 2–10 cards. */
  carouselCards: CarouselCard[];
  /** Collection: cover media creative id (the cover card above the product grid). */
  collectionCoverCreativeId: string | null;
  structure: { campaigns: number; adSetsPerCampaign: number; adsPerAdSet: number };

  // Step 4 — Review & Launch
  pageDistribution: PageDistribution;
  pageWeights: Record<string, number>;
  namingPattern: string;
  scheduledFor: string | null;

  /** Per-node setting overrides (master-detail editor). Keyed by tree node id. */
  nodeOverrides: Record<string, NodeOverride>;

  /* ── Templates v2 (foundation) ──────────────────────────────────────
   * Track which Setup / Distribution template (if any) is currently linked
   * to this plan. Set when the user opts-in to apply a template; remains
   * set when the user edits values (so the bar can show "linked — Edited");
   * cleared only when the user "Unlinks". Both default null. The existing
   * `targetingTemplateId` flow above is separate and untouched.
   */
  appliedSetupTemplateId?: string | null;
  appliedDistributionTemplateId?: string | null;

  // Post ID per account — toggle + selections
  /** Per-account "Use existing posts" toggle. When true, Step 3 shows the posted-ads picker for that account. */
  useExistingPostByAccount: Record<string, boolean>;
  postIdsByAccount: Record<string, string[]>; // { accountId: [postId1, postId2, ...] }

  // Custom audience
  useCustomAudience: boolean;
  customAudienceId: string | null;
  customAudienceMode: "select" | "upload";

  // Per-account catalogue (simplified per-account toggle + product-set selection)
  catalogueByAccount: Record<string, boolean>;
  productSetByAccount: Record<string, CatalogSelection>;

  // Manual placement
  placementMode: "advantage" | "manual";
  placements: PlacementSelection;

  /** Targeting editor mode toggle. Defaults to "manual". */
  targetingMode: "template" | "manual";

  /* ── Meeting redesign additions ───────────────────────────────────── */
  // Flow (Step 1): strategy-first branch + fast launch
  /** Derived from strategy choice: custom = manual walk, template = prefilled. */
  flowMode: "custom" | "template";
  /** Fast launch mode — skip straight to Review. */
  fastLaunch: boolean;

  // Distribution (Step 3): account-wise split + per-account structure + per-account page split
  /** How total ads split across selected accounts. */
  accountDistribution: AccountDistribution;
  /** custom account split: explicit ad counts keyed by accountId (must sum to total). */
  accountWeights: Record<string, number>;
  /** Per-account structure override (fallback to global `structure`). Keyed by accountId. */
  structureByAccount: Record<string, StructureCounts>;
  /** Per-account page-split override (fallback to global `pageDistribution`). Keyed by accountId. */
  pageDistributionByAccount: Record<string, PageDistribution>;
  /** Step 3 distribution variant: v1 = split panel, v2 = left ad-account panel. */
  distVariant: "v1" | "v2";

  // Audience / targeting (Meta parity)
  targeting: TargetingSpec;

  // Special ad category country/region (Meta requirement)
  specialAdCountries: string[];

  // Nomenclature (per-level naming patterns)
  namingPatterns: NamingPatterns;

  // Review (Step 4) variant
  reviewVariant: "tree" | "table";

  /** When pageDistribution === 'duplicate', which level gets duplicated. Default 'ad'. */
  duplicateLevel?: 'ad' | 'adset' | 'campaign';

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
export type RunStatus = "queued" | "launching" | "partial" | "completed" | "failed" | "scheduled" | "stale";
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
  /** Stable hash of the plan's targets + structure used for stale-detection on re-hydration. */
  planHash?: string;
}
