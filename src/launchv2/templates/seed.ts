/**
 * Launch v2 — Templates seed.
 *
 * Inserts 2-3 sample SetupTemplates and 2 DistributionTemplates on first load,
 * but ONLY when storage is empty (so user-saved templates are never overwritten).
 * UI agents rely on these to have data to render.
 */

import {
  DEFAULT_WORKSPACE_ID,
  type DistributionTemplate,
  type SetupTemplate,
  type TemplateStoreV1,
} from "./types";

const NOW = () => Date.now();

function makeSetup(
  id: string,
  name: string,
  payload: SetupTemplate["payload"],
  createdAgoMs: number,
): SetupTemplate {
  const ts = NOW() - createdAgoMs;
  return { id, name, workspaceId: DEFAULT_WORKSPACE_ID, createdAt: ts, updatedAt: ts, payload };
}

function makeDistribution(
  id: string,
  name: string,
  payload: DistributionTemplate["payload"],
  createdAgoMs: number,
): DistributionTemplate {
  const ts = NOW() - createdAgoMs;
  return { id, name, workspaceId: DEFAULT_WORKSPACE_ID, createdAt: ts, updatedAt: ts, payload };
}

/* ── Seed setup templates ──────────────────────────────────────────────── */

const SEED_SETUP: SetupTemplate[] = [
  makeSetup(
    "setupTpl_seed_scale_mama_us_in",
    "Q4 scale — Mamaearth (US + IN)",
    {
      destinations: [
        { accountId: "act_mamaearth", pageIds: ["pg_mama", "pg_mama_skin"], pixelId: "px_mama" },
      ],
      campaign: {
        objective: "OUTCOME_SALES",
        intent: "scale",
        budgetMode: "CBO",
        advantagePlus: true,
        bidStrategy: "COST_CAP",
        dailyBudget: 100,
        format: "single_image",
      },
      adset: {
        placements: "advantage",
        optimizationGoal: "OFFSITE_CONVERSIONS",
        scheduleType: "standard",
        specialAdCategory: [],
        attribution: "7d_click_1d_view",
        destinationType: "WEBSITE",
        conversionEvent: "Purchase",
      },
      audience: {
        locations: "United States, India",
        ageMin: 18,
        ageMax: 54,
        gender: "all",
        detailedTargeting: ["Beauty enthusiasts", "Skincare buyers"],
        exclusions: ["Purchasers (30d)"],
        advantageAudience: true,
        advantageCreative: true,
      },
    },
    /* createdAgoMs = */ 7 * 24 * 60 * 60 * 1000,
  ),

  makeSetup(
    "setupTpl_seed_test_low_budget",
    "Testing setup — low budget",
    {
      destinations: [
        { accountId: "act_acme_us", pageIds: ["pg_acme_store"], pixelId: "px_acme" },
      ],
      campaign: {
        objective: "OUTCOME_TRAFFIC",
        intent: "test",
        budgetMode: "ABO",
        advantagePlus: false,
        bidStrategy: "LOWEST_COST_WITHOUT_CAP",
        dailyBudget: 10,
        format: "single_image",
      },
      adset: {
        placements: "advantage",
        optimizationGoal: "LINK_CLICKS",
        scheduleType: "standard",
        specialAdCategory: [],
        attribution: "7d_click_1d_view",
        destinationType: "WEBSITE",
        conversionEvent: null,
      },
      audience: {
        locations: "United States",
        ageMin: 18,
        ageMax: 65,
        gender: "all",
        detailedTargeting: [],
        exclusions: [],
        advantageAudience: true,
        advantageCreative: true,
      },
    },
    /* createdAgoMs = */ 3 * 24 * 60 * 60 * 1000,
  ),

  makeSetup(
    "setupTpl_seed_in_metro_engaged",
    "India metros — engaged shoppers",
    {
      destinations: [
        { accountId: "act_boat", pageIds: ["pg_boat_audio", "pg_boat_wear"], pixelId: "px_boat" },
      ],
      campaign: {
        objective: "OUTCOME_SALES",
        intent: "scale",
        budgetMode: "CBO",
        advantagePlus: false,
        bidStrategy: "LOWEST_COST_WITHOUT_CAP",
        dailyBudget: 60,
        format: "single_video",
      },
      adset: {
        placements: "manual",
        optimizationGoal: "OFFSITE_CONVERSIONS",
        scheduleType: "standard",
        specialAdCategory: [],
        attribution: "7d_click_1d_view",
        destinationType: "WEBSITE",
        conversionEvent: "Purchase",
      },
      audience: {
        locations: "Delhi, Mumbai, Bangalore",
        ageMin: 18,
        ageMax: 35,
        gender: "all",
        detailedTargeting: ["Engaged shoppers"],
        exclusions: [],
        advantageAudience: false,
        advantageCreative: true,
      },
    },
    /* createdAgoMs = */ 24 * 60 * 60 * 1000,
  ),
];

/* ── Seed distribution templates ───────────────────────────────────────── */

const SEED_DISTRIBUTION: DistributionTemplate[] = [
  makeDistribution(
    "distTpl_seed_stacked_scale",
    "Stacked scale",
    {
      structure: { campaigns: 1, adSetsPerCampaign: 1, adsPerAdSet: 6 },
      spread: "stacked",
      pageDistribution: "fill_first",
      utmTemplate:
        "utm_source=facebook&utm_medium=paid&utm_campaign={{campaign}}&utm_content={{adset}}&utm_term=scale",
    },
    /* createdAgoMs = */ 5 * 24 * 60 * 60 * 1000,
  ),
  makeDistribution(
    "distTpl_seed_round_robin_test",
    "Round-robin test",
    {
      structure: { campaigns: 1, adSetsPerCampaign: 5, adsPerAdSet: 1 },
      spread: "round_robin",
      pageDistribution: "equal",
      utmTemplate:
        "utm_source=facebook&utm_medium=paid&utm_campaign={{campaign}}&utm_content={{adset}}&utm_term=test",
    },
    /* createdAgoMs = */ 2 * 24 * 60 * 60 * 1000,
  ),
];

/**
 * Return a store with seeds applied, or the original store if either collection
 * already has entries (i.e. only seed when truly empty).
 */
export function seedTemplatesIfEmpty(store: TemplateStoreV1): TemplateStoreV1 {
  const needsSetup = store.setup.length === 0;
  const needsDist = store.distribution.length === 0;
  if (!needsSetup && !needsDist) return store;
  return {
    setup: needsSetup ? SEED_SETUP : store.setup,
    distribution: needsDist ? SEED_DISTRIBUTION : store.distribution,
    audiencePlacement: store.audiencePlacement,
  };
}
