/**
 * Launch 2.0 — domain types (single source of truth).
 *
 * Greenfield Meta bulk-launch module. These types model the reducers,
 * distribution, targeting, creative, the reliability spine (idempotent
 * dispatch + failed≠launched accounting), and the dashboard entities.
 */

/* ───────────────────────── Reducers (entry overlay) ───────────────────────── */

export type LaunchMode = "quick" | "preset" | "custom";

export type LaunchObjective = "sales" | "leads" | "traffic" | "engagement";

export type StrategyKey =
  | "bruno"
  | "bidcap"
  | "phasewise"
  | "tg"
  | "asc"
  | "duplication"
  | "socialproof";

/* ───────────────────────── Accounts / distribution ───────────────────────── */

export type HealthStatus = "healthy" | "review" | "restricted";

export interface BusinessManager {
  id: string;
  name: string;
}

export interface AdAccount {
  id: string;
  name: string;
  bmId: string;
  currency: string; // e.g. "USD"
  health: HealthStatus;
  /** Free-text health note when not healthy (rejection reason / restriction). */
  note?: string;
}

export interface Page {
  id: string;
  name: string;
  accountId: string;
  health: HealthStatus;
  /** Ads currently live against this Page (counts toward the 250 cap). */
  adCount: number;
  /** Meta per-Page ad cap (default 250). */
  capLimit: number;
}

export interface Pixel {
  id: string;
  name: string;
  accountId: string;
  status: "active" | "inactive";
  /** Conversion events seen in the last 7 days (for optimization-event hints). */
  eventsLast7d: number;
}

/** One row of the account×page distribution matrix. */
export interface DistributionEntry {
  accountId: string;
  pageId: string;
  pixelId: string | null;
  /** How many ad sets are allotted to this account/page pair. */
  adsets: number;
}

/* ───────────────────────── Targeting ───────────────────────── */

/** Campaign Budget Optimization vs Ad-set Budget Optimization. */
export type BudgetLevel = "campaign" | "adset";

export type AudienceType = "saved" | "lal" | "custom" | "broad" | "interest";

export interface SavedAudience {
  id: string;
  name: string;
  type: AudienceType;
  /** Estimated reach, e.g. 2_400_000. */
  size: number;
  detail?: string;
}

export interface Catalog {
  id: string;
  name: string;
  productCount: number;
}

export interface ProductSet {
  id: string;
  catalogId: string;
  name: string;
  productCount: number;
}

/* ───────────────────────── Creative + structure ───────────────────────── */

export type AdType =
  | "image"
  | "video"
  | "carousel"
  | "collection"
  | "flexible"
  | "catalogue"
  | "partnership";

export type CreativeSource =
  | "upload"
  | "drive"
  | "library"
  | "folder"
  | "postid"
  | "reports"
  | "product";

export interface CreativeAsset {
  id: string;
  name: string;
  kind: "image" | "video";
  thumbUrl: string;
  source: CreativeSource;
  /** Aspect ratio label, e.g. "4:5". */
  ratio?: string;
}

export interface CopySet {
  primaryText: string;
  headline: string;
  description: string;
  cta: string; // e.g. "Shop now"
  destinationUrl: string;
}

/* ───────────────────────── Dashboard entities ───────────────────────── */

export type LaunchStatus =
  | "draft"
  | "queued"
  | "launching"
  | "live"
  | "partial"
  | "rejected"
  | "complete";

/** Progress accounting — the failed≠launched contract lives here. */
export interface LaunchProgress {
  total: number;
  created: number; // == "live"
  failed: number;
  pending: number;
}

export interface LaunchSummary {
  id: string;
  name: string;
  strategy: StrategyKey;
  objective: LaunchObjective;
  status: LaunchStatus;
  createdAt: string; // ISO
  createdBy: string;
  counts: { campaigns: number; adsets: number; ads: number };
  progress: LaunchProgress;
  /** Number of ad accounts this launch spans. */
  accountSpan: number;
}

/** Winners shelf entity. NO performance metrics by design (ops signal only). */
export interface WinnerAd {
  id: string;
  name: string;
  adType: AdType;
  thumbUrl: string;
  strategy: StrategyKey;
  lastLaunchedAt: string; // ISO
  relaunchCount: number;
  proven: boolean;
}

export interface DraftSummary {
  id: string;
  name: string;
  strategy: StrategyKey | null;
  /** Furthest step reached (2..5). */
  step: number;
  updatedAt: string; // ISO
}

export interface ActivityEntry {
  id: string;
  ts: string; // ISO
  user: string;
  action: string; // e.g. "launched", "retried", "edited targeting"
  launchId?: string;
  launchName?: string;
  detail: string;
  status?: "ok" | "warn" | "error";
}

/* ───────────────────────── Strategy presets ───────────────────────── */

export interface StrategyPreset {
  key: StrategyKey;
  label: string;
  tagline: string;
  /** [V] verified from workspace vs [I] inferred default (flag in UI). */
  verified: boolean;
  budgetLevel: BudgetLevel;
  adsetCount: number;
  creativesPerAdset: number;
  /** Per ad-set daily budget (ABO) or note the campaign budget (CBO). */
  perUnitBudget: number;
  bidStrategy: "lowest_cost" | "cost_cap" | "bid_cap";
  defaultObjective: LaunchObjective;
  audienceHint: string;
  notes: string;
}

/* ───────────────────────── Flow state ───────────────────────── */

export interface LaunchFlowState {
  // entry reducers
  mode: LaunchMode | null;
  strategy: StrategyKey | null;
  objective: LaunchObjective | null;

  // step 2 — account + distribution
  accountIds: string[];
  pageIds: string[];
  pixelId: string | null;
  autoSpread: boolean;
  distribution: DistributionEntry[];

  // step 3 — objective + targeting
  budgetLevel: BudgetLevel;
  dailyBudget: number; // per ad set (ABO) — live budget multiplies this out
  optimizationEvent: string | null;
  audienceId: string | null;
  placementsAuto: boolean;
  scheduleStart: string | null;
  scheduleEnd: string | null;
  dayparting: boolean;
  useCatalogue: boolean;
  catalogId: string | null;
  productSetId: string | null;

  // step 4 — creative + structure
  adType: AdType;
  creativeSource: CreativeSource;
  creativeIds: string[];
  copy: CopySet;
  /** 1:N:M structure — ad sets per account/page and creatives per ad set. */
  adsetCount: number;
  creativesPerAdset: number;

  // meta / reliability
  cloneSourceId: string | null;
  draftId: string;
  /** Idempotency key — same across retries so N=N holds. */
  dedupeKey: string;
  currentStep: number; // 2..5
  lastSavedAt: string | null;
}

/* ───────────────────────── Launch service (reliability core) ───────────────────────── */

export type EntityLevel = "campaign" | "adset" | "ad";

export interface PlanEntity {
  id: string;
  level: EntityLevel;
  parentId: string | null;
  name: string;
}

export interface PreflightIssue {
  level: "block" | "warn" | "info";
  code: "cap_breach" | "policy" | "missing_field" | "budget";
  message: string;
  entityId?: string;
}

export interface PreflightResult {
  ok: boolean; // false if any "block"
  issues: PreflightIssue[];
  totalAds: number;
  dailyBudgetTotal: number;
}

export interface DispatchItem {
  id: string;
  name: string;
  level: EntityLevel;
}

export interface DispatchResult {
  id: string;
  ok: boolean;
  metaId?: string;
  error?: string;
}

export interface DispatchRequest {
  /** Idempotency key — identical on retry so the server dedupes. */
  dedupeKey: string;
  items: DispatchItem[];
}

export type DispatchProgress = (done: number, total: number, latest: DispatchResult) => void;

export interface MetaLaunchService {
  validate(state: LaunchFlowState): Promise<PreflightResult>;
  dispatch(req: DispatchRequest, onProgress?: DispatchProgress): Promise<DispatchResult[]>;
  /** Re-dispatch ONLY the failed items, same dedupeKey. */
  retryFailed(req: DispatchRequest, onProgress?: DispatchProgress): Promise<DispatchResult[]>;
}

/* ───────────────────────── Variants ───────────────────────── */

export type Launch2Variant = "mission" | "ops" | "launchpad";
