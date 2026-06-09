/**
 * Launch v2 — Templates feature types.
 *
 * Three template kinds:
 *   1. SetupTemplate        — flat snapshot of Step 2 Setup (destinations + campaign + adset + audience).
 *   2. DistributionTemplate — flat snapshot of Step 4 Distribution (structure + spread + page-distribution + UTM).
 *   3. AdCopyBundle         — copy block that lives on a Creative Library folder ("Creative Bundle").
 *
 * All payloads are FLAT snapshots — no nested refs to other templates. When the user
 * applies an audience template at Step 2 §3, the values populate inline; saving a
 * SetupTemplate snapshots those values flat (the existing `targetingTemplateId` flow
 * remains separate and untouched).
 *
 * All templates are workspace-scoped; v1 uses a constant 'default' workspace.
 * Edit-after-apply policy is FORK-ONLY — there is no "update existing template"
 * affordance; "Save as new" creates a new entity.
 */

import type {
  AdFormat,
  AttributionWindow,
  BidStrategy,
  BudgetMode,
  DestinationType,
  Intent,
  Objective,
  OptimizationGoal,
  PageDistribution,
  SpecialAdCategory,
  SpreadMode,
} from "../types";

/* ────────────────────────────────────────────────────────────────────────── */
/* 1. SetupTemplate — flat snapshot of Step 2                                 */
/* ────────────────────────────────────────────────────────────────────────── */

/** One destination tuple. Multi-account is supported by holding many of these. */
export interface SetupDestination {
  accountId: string;
  pageIds: string[];
  pixelId?: string;
}

/** Campaign-level config captured in a Setup template. */
export interface SetupCampaignConfig {
  objective: Objective | null;
  intent: Intent;
  budgetMode: BudgetMode;
  advantagePlus: boolean;
  bidStrategy: BidStrategy;
  /** ABO carries dailyBudget; CBO/lifetime carry lifetimeBudget. v1 stores both optional. */
  dailyBudget?: number;
  lifetimeBudget?: number;
  /** Format is captured so applying a template can also restore the chosen ad format. */
  format: AdFormat | null;
}

/** Adset-level config captured in a Setup template. */
export interface SetupAdsetConfig {
  /** Placements: "advantage" (auto) or "manual". Mirrors targeting-template.settings.placements. */
  placements: "advantage" | "manual";
  optimizationGoal: OptimizationGoal | null;
  /** Schedule type: "standard" (run continuously) or "lifetime" (start/end window). */
  scheduleType: "standard" | "lifetime";
  specialAdCategory: SpecialAdCategory[];
  attribution: AttributionWindow;
  destinationType: DestinationType | null;
  conversionEvent: string | null;
}

/**
 * Audience config — INLINE snapshot of the targeting params used by Step 2 §3.
 * Mirrors TargetingTemplateV2.settings (data.ts) so payloads are assignment-compatible.
 * Does NOT include `targetingTemplateId` — applying a Setup template overrides that flow.
 */
export interface SetupAudienceConfig {
  locations: string;
  ageMin: number;
  ageMax: number;
  gender: "all" | "men" | "women";
  detailedTargeting: string[];
  exclusions: string[];
  advantageAudience: boolean;
  advantageCreative: boolean;
}

export interface SetupTemplatePayload {
  destinations: SetupDestination[];
  campaign: SetupCampaignConfig;
  adset: SetupAdsetConfig;
  audience: SetupAudienceConfig;
}

export interface SetupTemplate {
  id: string;
  name: string;
  /** Reserved for future per-workspace filtering; constant 'default' in v1. */
  workspaceId: string;
  createdAt: number;
  updatedAt: number;
  payload: SetupTemplatePayload;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 2. DistributionTemplate — flat snapshot of Step 4                          */
/* ────────────────────────────────────────────────────────────────────────── */

export interface DistributionStructure {
  campaigns: number;
  adSetsPerCampaign: number;
  adsPerAdSet: number;
}

export interface DistributionTemplatePayload {
  structure: DistributionStructure;
  spread: SpreadMode;
  pageDistribution: PageDistribution;
  utmTemplate: string;
}

export interface DistributionTemplate {
  id: string;
  name: string;
  workspaceId: string;
  createdAt: number;
  updatedAt: number;
  payload: DistributionTemplatePayload;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 3. AdCopyBundle — copy block attached to a Creative Library folder         */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Ad copy that ships with a Creative Library folder ("Creative Bundle").
 * Mirrors the bundle-shareable subset of `AdCopy` (launchv2/types.ts).
 *
 * Included (matches AdCopy field names exactly):
 *   - primaryText, headline, description, utmTemplate, textVariations
 *
 * Excluded (per-ad inline only): cta, destinationUrl, displayLink.
 *
 * Field types match `AdCopy` (primaryText/headline/description are `string`)
 * so a bundle can be spread directly into `plan.adCopy` without coercion.
 */
export interface AdCopyBundle {
  primaryText: string;
  headline: string;
  description: string;
  /** Optional — bundles may or may not carry a UTM template. */
  utmTemplate?: string;
  /** DCO/Advantage+ extra variations (advanced). */
  textVariations?: string[];
}

/** Derived bundle status — computed at read-time from the folder's media + defaultCopy. */
export type CreativeBundleStatus = "bundle_ready" | "media_only" | "empty";

/**
 * Wrapper around the canonical Creative Library folder type (`ClFolder` in
 * `src/hooks/use-cl-folders.ts`). The canonical type is Supabase-backed and
 * shouldn't be edited in v1, so the bundle's optional `defaultCopy` lives in
 * a parallel store (see `bundlesService` in `./bundles.ts`).
 *
 * This wrapper is what the Step 3 folder picker consumes — it carries the
 * folder's identity + media count + derived status + (optional) defaultCopy.
 */
export interface CreativeBundleFolder {
  id: string;
  name: string;
  /** How many creatives this folder currently holds (used for status derivation). */
  mediaCount: number;
  /** Optional default copy — present only when the folder has graduated to a bundle. */
  defaultCopy?: AdCopyBundle | null;
  /** Derived at read-time from (mediaCount, defaultCopy). */
  status: CreativeBundleStatus;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Common                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

export type TemplateKind = "setup" | "distribution";

/** Persisted shape on localStorage. */
export interface TemplateStoreV1 {
  setup: SetupTemplate[];
  distribution: DistributionTemplate[];
}

export const DEFAULT_WORKSPACE_ID = "default";
