/**
 * Launch v2 — Strategies service (localStorage-backed mock).
 *
 * Saves entire PlanV2 snapshots as reusable "launch strategies".
 * Storage key: `fabads:launchv2:strategies:v1`.
 * v1 uses a single hard-coded workspaceId — no per-workspace filtering yet.
 */

import type { PlanV2 } from "../types";

export const DEFAULT_WORKSPACE_ID = "ws_default";
const STORAGE_KEY = "fabads:launchv2:strategies:v4"; // bumped → all strategies now have non-empty targets for card display

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface LaunchStrategy {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  workspaceId: string;
  /** Snapshot of the full plan at save time. */
  plan: Partial<PlanV2>;
  /** Free-form user-defined tags (lowercase kebab/camel, no `#` in storage). */
  tags?: string[];
  /** ISO timestamp this strategy was last applied to a launch. */
  lastUsedAt?: string;
  /** How many launches have applied this strategy. */
  useCount?: number;
  /** Section ids the user chose to leave blank and be prompted for at launch. */
  askAtLaunch?: string[];
}

/** Human-readable summary of a strategy's key config for overview pills. */
export interface StrategySummary {
  objective: string;      // e.g. "Sales"
  intent: string;         // e.g. "Scale"
  budgetDisplay: string;  // e.g. "₹5,000/day · CBO"
  destinationsCount: number;
  format: string;         // e.g. "Video"
  spreadMode: string;     // e.g. "Round-robin"
  audienceSummary: string; // e.g. "India · 25–45"
}

/* ------------------------------------------------------------------ */
/*  Seed data (shown on first-ever empty load)                         */
/* ------------------------------------------------------------------ */

const NOW = new Date().toISOString();

/**
 * Demo strategies — explicitly cover the locked test/scale/partial scenarios
 * for Launch 2.0 redesign storytelling. These are intentionally partial in
 * places so testers see "lands at first missing step" behavior in Step 2/3/4.
 * They appear first so they're easy to find at the top of the seed list.
 */
const DEMO_STRATEGIES: Array<{
  name: string;
  tags: string[];
  /** Days ago this was last applied (drives recently-used row + sort). */
  lastUsedDaysAgo?: number;
  useCount?: number;
  plan: Partial<PlanV2>;
}> = [
  {
    name: "ABO test — small audience",
    tags: ["test", "small-budget"],
    lastUsedDaysAgo: 1,
    useCount: 4,
    // Intentionally partial: no `targets` (account missing) and no creative source.
    plan: {
      objective: "OUTCOME_SALES",
      intent: "test",
      budgetAmount: 5,
      budgetMode: "ABO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "single_image",
      spread: "one_per_adset",
      advantagePlus: false,
      targets: [],
      structure: { campaigns: 1, adSetsPerCampaign: 3, adsPerAdSet: 1 },
      pageDistribution: "equal",
    },
  },
  {
    name: "Scale Sales — IN broad",
    tags: ["scale", "IN"],
    lastUsedDaysAgo: 0,
    useCount: 12,
    plan: {
      objective: "OUTCOME_SALES",
      intent: "scale",
      budgetAmount: 15000,
      budgetMode: "CBO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "single_video",
      spread: "stacked",
      advantagePlus: true,
      targets: [
        {
          accountId: "act_001",
          accountName: "Idea Clan — IN01",
          currency: "INR",
          pageId: "page_001",
          fbPageId: "fb_001",
          pageName: "Mamaearth Brand Page",
          pixelId: "px_001",
        },
      ],
      structure: { campaigns: 2, adSetsPerCampaign: 4, adsPerAdSet: 5 },
      pageDistribution: "fill_first",
      targetingTemplateId: "tpl_in_metro",
    },
  },
  {
    name: "DPA retargeting",
    tags: ["scale", "DPA"],
    lastUsedDaysAgo: 2,
    useCount: 7,
    // Partial: catalogue source set but no creative selection.
    plan: {
      objective: "OUTCOME_SALES",
      intent: "scale",
      budgetAmount: 8000,
      budgetMode: "CBO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "dpa",
      spread: "multiply",
      advantagePlus: true,
      catalogueToggle: true,
      targets: [
        {
          accountId: "act_004",
          accountName: "Idea Clan — IN04",
          currency: "INR",
          pageId: "page_004",
          fbPageId: "fb_004",
          pageName: "mCaffeine Page",
          pixelId: "px_004",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 3, adsPerAdSet: 6 },
      pageDistribution: "duplicate",
    },
  },
  {
    name: "Awareness Reels",
    tags: ["test", "awareness", "video"],
    lastUsedDaysAgo: 4,
    useCount: 3,
    plan: {
      objective: "OUTCOME_AWARENESS",
      intent: "test",
      budgetAmount: 2000,
      budgetMode: "ABO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "single_video",
      spread: "one_per_adset",
      advantagePlus: false,
      targets: [
        {
          accountId: "act_003",
          accountName: "Idea Clan — IN03",
          currency: "INR",
          pageId: "page_003",
          fbPageId: "fb_003",
          pageName: "Noise India",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 2, adsPerAdSet: 2 },
      pageDistribution: "equal",
      targetingTemplateId: "tpl_in_awareness_video",
    },
  },
  {
    name: "Lead Gen form",
    tags: ["lead-gen", "instant-form"],
    lastUsedDaysAgo: 7,
    useCount: 2,
    // Partial: no targeting template → user lands on Step 2 audience.
    plan: {
      objective: "OUTCOME_LEADS",
      intent: "scale",
      budgetAmount: 5000,
      budgetMode: "CBO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "carousel",
      spread: "round_robin",
      advantagePlus: true,
      destinationType: "ON_AD",
      targets: [
        {
          accountId: "act_006",
          accountName: "Idea Clan — IN06",
          currency: "INR",
          pageId: "page_006",
          fbPageId: "fb_006",
          pageName: "Plix Wellness",
          pixelId: "px_006",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 3, adsPerAdSet: 3 },
      pageDistribution: "fill_first",
    },
  },
];

const SEED_STRATEGIES: Array<{ name: string; plan: Partial<PlanV2> }> = [
  // ── OUTCOME_SALES (15) ────────────────────────────────────────────────
  {
    name: "Scale Sales — Stacked Video · ₹15k CBO",
    plan: {
      objective: "OUTCOME_SALES",
      intent: "scale",
      budgetAmount: 15000,
      budgetMode: "CBO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "single_video",
      spread: "stacked",
      advantagePlus: true,
      targets: [
        {
          accountId: "act_001",
          accountName: "Idea Clan — IN01",
          currency: "INR",
          pageId: "page_001",
          fbPageId: "fb_001",
          pageName: "Mamaearth Brand Page",
          pixelId: "px_001",
        },
      ],
      structure: { campaigns: 2, adSetsPerCampaign: 4, adsPerAdSet: 5 },
      pageDistribution: "fill_first",
    },
  },
  {
    name: "Test Sales — Image ABO · ₹2k",
    plan: {
      objective: "OUTCOME_SALES",
      intent: "test",
      budgetAmount: 2000,
      budgetMode: "ABO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "single_image",
      spread: "one_per_adset",
      advantagePlus: false,
      targets: [
        {
          accountId: "act_002",
          accountName: "Idea Clan — IN02",
          currency: "INR",
          pageId: "page_002",
          fbPageId: "fb_002",
          pageName: "boAt India",
          pixelId: "px_002",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 3, adsPerAdSet: 2 },
      pageDistribution: "equal",
    },
  },
  {
    name: "Scale Sales — DPA Multiply · ₹30k CBO",
    plan: {
      objective: "OUTCOME_SALES",
      intent: "scale",
      budgetAmount: 30000,
      budgetMode: "CBO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "dpa",
      spread: "multiply",
      advantagePlus: true,
      targets: [
        {
          accountId: "act_004",
          accountName: "Idea Clan — IN04",
          currency: "INR",
          pageId: "page_004",
          fbPageId: "fb_004",
          pageName: "mCaffeine Page",
          pixelId: "px_004",
        },
        {
          accountId: "act_006",
          accountName: "Idea Clan — IN06",
          currency: "INR",
          pageId: "page_006",
          fbPageId: "fb_006",
          pageName: "Plix Wellness",
          pixelId: "px_006",
        },
      ],
      structure: { campaigns: 2, adSetsPerCampaign: 5, adsPerAdSet: 8 },
      pageDistribution: "duplicate",
    },
  },
  {
    name: "Custom Sales — Carousel ROAS · ₹10k ABO",
    plan: {
      objective: "OUTCOME_SALES",
      intent: "custom",
      budgetAmount: 10000,
      budgetMode: "ABO",
      bidStrategy: "LOWEST_COST_WITH_MIN_ROAS",
      format: "carousel",
      spread: "round_robin",
      advantagePlus: false,
      targets: [
        {
          accountId: "act_008",
          accountName: "Idea Clan — IN08",
          currency: "INR",
          pageId: "page_008",
          fbPageId: "fb_008",
          pageName: "Bombay Shaving Company",
          pixelId: "px_008",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 4, adsPerAdSet: 3 },
      pageDistribution: "fill_first",
    },
  },
  {
    name: "Scale Sales — Collection CBO · ₹50k",
    plan: {
      objective: "OUTCOME_SALES",
      intent: "scale",
      budgetAmount: 50000,
      budgetMode: "CBO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "collection",
      spread: "stacked",
      advantagePlus: true,
      targets: [
        {
          accountId: "act_001",
          accountName: "Idea Clan — IN01",
          currency: "INR",
          pageId: "page_001",
          fbPageId: "fb_001",
          pageName: "Mamaearth Brand Page",
          pixelId: "px_001",
        },
        {
          accountId: "act_004",
          accountName: "Idea Clan — IN04",
          currency: "INR",
          pageId: "page_004",
          fbPageId: "fb_004",
          pageName: "mCaffeine Page",
          pixelId: "px_004",
        },
        {
          accountId: "act_008",
          accountName: "Idea Clan — IN08",
          currency: "INR",
          pageId: "page_008",
          fbPageId: "fb_008",
          pageName: "Bombay Shaving Company",
          pixelId: "px_008",
        },
      ],
      structure: { campaigns: 3, adSetsPerCampaign: 6, adsPerAdSet: 10 },
      pageDistribution: "equal",
    },
  },
  {
    name: "Test Sales — Flexible ABO · ₹3k",
    plan: {
      objective: "OUTCOME_SALES",
      intent: "test",
      budgetAmount: 3000,
      budgetMode: "ABO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "flexible",
      spread: "one_per_adset",
      advantagePlus: true,
      targets: [
        {
          accountId: "act_003",
          accountName: "Idea Clan — IN03",
          currency: "INR",
          pageId: "page_003",
          fbPageId: "fb_003",
          pageName: "Noise India",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 2, adsPerAdSet: 3 },
      pageDistribution: "equal",
    },
  },
  {
    name: "Scale Sales — Video Cost Cap · ₹20k CBO",
    plan: {
      objective: "OUTCOME_SALES",
      intent: "scale",
      budgetAmount: 20000,
      budgetMode: "CBO",
      bidStrategy: "COST_CAP",
      format: "single_video",
      spread: "multiply",
      advantagePlus: false,
      targets: [
        {
          accountId: "act_006",
          accountName: "Idea Clan — IN06",
          currency: "INR",
          pageId: "page_006",
          fbPageId: "fb_006",
          pageName: "Plix Wellness",
          pixelId: "px_006",
        },
      ],
      structure: { campaigns: 2, adSetsPerCampaign: 8, adsPerAdSet: 4 },
      pageDistribution: "fill_first",
    },
  },
  {
    name: "Custom Sales — DPA Collection · ₹8k ABO",
    plan: {
      objective: "OUTCOME_SALES",
      intent: "custom",
      budgetAmount: 8000,
      budgetMode: "ABO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "dpa",
      spread: "round_robin",
      advantagePlus: true,
      targets: [
        {
          accountId: "act_004",
          accountName: "Idea Clan — IN04",
          currency: "INR",
          pageId: "page_004",
          fbPageId: "fb_004",
          pageName: "mCaffeine Page",
          pixelId: "px_004",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 3, adsPerAdSet: 5 },
      pageDistribution: "duplicate",
    },
  },
  {
    name: "Scale Sales — USA USD · $500 CBO",
    plan: {
      objective: "OUTCOME_SALES",
      intent: "scale",
      budgetAmount: 500,
      budgetMode: "CBO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "single_video",
      spread: "stacked",
      advantagePlus: true,
      targets: [
        {
          accountId: "act_101",
          accountName: "Idea Clan — US01",
          currency: "USD",
          pageId: "page_101",
          fbPageId: "fb_101",
          pageName: "Mensa Brands US",
          pixelId: "px_101",
        },
      ],
      structure: { campaigns: 2, adSetsPerCampaign: 4, adsPerAdSet: 6 },
      pageDistribution: "fill_first",
    },
  },
  {
    name: "Test Sales — Carousel No Pixel · ₹1.5k ABO",
    plan: {
      objective: "OUTCOME_SALES",
      intent: "test",
      budgetAmount: 1500,
      budgetMode: "ABO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "carousel",
      spread: "one_per_adset",
      advantagePlus: false,
      targets: [
        {
          accountId: "act_003",
          accountName: "Idea Clan — IN03",
          currency: "INR",
          pageId: "page_003",
          fbPageId: "fb_003",
          pageName: "Noise India",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 2, adsPerAdSet: 2 },
      pageDistribution: "equal",
    },
  },
  {
    name: "Scale Sales — Multi-Account Stacked · ₹25k CBO",
    plan: {
      objective: "OUTCOME_SALES",
      intent: "scale",
      budgetAmount: 25000,
      budgetMode: "CBO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "single_image",
      spread: "stacked",
      advantagePlus: true,
      targets: [
        {
          accountId: "act_002",
          accountName: "Idea Clan — IN02",
          currency: "INR",
          pageId: "page_002",
          fbPageId: "fb_002",
          pageName: "boAt India",
          pixelId: "px_002",
        },
        {
          accountId: "act_003",
          accountName: "Idea Clan — IN03",
          currency: "INR",
          pageId: "page_003",
          fbPageId: "fb_003",
          pageName: "Noise India",
        },
      ],
      structure: { campaigns: 3, adSetsPerCampaign: 4, adsPerAdSet: 5 },
      pageDistribution: "duplicate",
    },
  },
  {
    name: "Custom Sales — ROAS Floor Video · ₹12k ABO",
    plan: {
      objective: "OUTCOME_SALES",
      intent: "custom",
      budgetAmount: 12000,
      budgetMode: "ABO",
      bidStrategy: "LOWEST_COST_WITH_MIN_ROAS",
      format: "single_video",
      spread: "multiply",
      advantagePlus: false,
      targets: [
        {
          accountId: "act_001",
          accountName: "Idea Clan — IN01",
          currency: "INR",
          pageId: "page_001",
          fbPageId: "fb_001",
          pageName: "Mamaearth Brand Page",
          pixelId: "px_001",
        },
        {
          accountId: "act_002",
          accountName: "Idea Clan — IN02",
          currency: "INR",
          pageId: "page_002",
          fbPageId: "fb_002",
          pageName: "boAt India",
          pixelId: "px_002",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 5, adsPerAdSet: 3 },
      pageDistribution: "fill_first",
    },
  },
  {
    name: "Scale Sales — Flexible Advantage+ · ₹40k CBO",
    plan: {
      objective: "OUTCOME_SALES",
      intent: "scale",
      budgetAmount: 40000,
      budgetMode: "CBO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "flexible",
      spread: "round_robin",
      advantagePlus: true,
      targets: [
        {
          accountId: "act_008",
          accountName: "Idea Clan — IN08",
          currency: "INR",
          pageId: "page_008",
          fbPageId: "fb_008",
          pageName: "Bombay Shaving Company",
          pixelId: "px_008",
        },
      ],
      structure: { campaigns: 2, adSetsPerCampaign: 6, adsPerAdSet: 8 },
      pageDistribution: "fill_first",
    },
  },
  {
    name: "Test Sales — USD Image ABO · $200",
    plan: {
      objective: "OUTCOME_SALES",
      intent: "test",
      budgetAmount: 200,
      budgetMode: "ABO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "single_image",
      spread: "one_per_adset",
      advantagePlus: false,
      targets: [
        {
          accountId: "act_102",
          accountName: "Idea Clan — US02",
          currency: "USD",
          pageId: "page_102",
          fbPageId: "fb_102",
          pageName: "Noise Global",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 2, adsPerAdSet: 2 },
      pageDistribution: "equal",
    },
  },
  {
    name: "Custom Sales — DPA ROAS Multi · ₹18k CBO",
    plan: {
      objective: "OUTCOME_SALES",
      intent: "custom",
      budgetAmount: 18000,
      budgetMode: "CBO",
      bidStrategy: "LOWEST_COST_WITH_MIN_ROAS",
      format: "dpa",
      spread: "multiply",
      advantagePlus: true,
      targets: [
        {
          accountId: "act_006",
          accountName: "Idea Clan — IN06",
          currency: "INR",
          pageId: "page_006",
          fbPageId: "fb_006",
          pageName: "Plix Wellness",
          pixelId: "px_006",
        },
        {
          accountId: "act_008",
          accountName: "Idea Clan — IN08",
          currency: "INR",
          pageId: "page_008",
          fbPageId: "fb_008",
          pageName: "Bombay Shaving Company",
          pixelId: "px_008",
        },
      ],
      structure: { campaigns: 2, adSetsPerCampaign: 3, adsPerAdSet: 6 },
      pageDistribution: "duplicate",
    },
  },
  // ── OUTCOME_AWARENESS (8) ─────────────────────────────────────────────
  {
    name: "Test Awareness — Image ABO · ₹1k",
    plan: {
      objective: "OUTCOME_AWARENESS",
      intent: "test",
      budgetAmount: 1000,
      budgetMode: "ABO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "single_image",
      spread: "one_per_adset",
      advantagePlus: false,
      targets: [
        {
          accountId: "act_002",
          accountName: "Idea Clan — IN02",
          currency: "INR",
          pageId: "page_002",
          fbPageId: "fb_002",
          pageName: "boAt India",
        },
      ],
      structure: { campaigns: 2, adSetsPerCampaign: 2, adsPerAdSet: 2 },
      pageDistribution: "equal",
    },
  },
  {
    name: "Scale Awareness — Video CBO · ₹8k",
    plan: {
      objective: "OUTCOME_AWARENESS",
      intent: "scale",
      budgetAmount: 8000,
      budgetMode: "CBO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "single_video",
      spread: "round_robin",
      advantagePlus: true,
      targets: [
        {
          accountId: "act_005",
          accountName: "Idea Clan — IN05",
          currency: "INR",
          pageId: "page_005",
          fbPageId: "fb_005",
          pageName: "Sleepyhead Brand",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 4, adsPerAdSet: 4 },
      pageDistribution: "fill_first",
    },
  },
  {
    name: "Custom Awareness — Carousel Multi · ₹5k ABO",
    plan: {
      objective: "OUTCOME_AWARENESS",
      intent: "custom",
      budgetAmount: 5000,
      budgetMode: "ABO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "carousel",
      spread: "stacked",
      advantagePlus: false,
      targets: [
        {
          accountId: "act_007",
          accountName: "Idea Clan — IN07",
          currency: "INR",
          pageId: "page_007",
          fbPageId: "fb_007",
          pageName: "Kapiva Ayurveda",
        },
        {
          accountId: "act_003",
          accountName: "Idea Clan — IN03",
          currency: "INR",
          pageId: "page_003",
          fbPageId: "fb_003",
          pageName: "Noise India",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 3, adsPerAdSet: 3 },
      pageDistribution: "duplicate",
    },
  },
  {
    name: "Scale Awareness — Flexible Advantage+ · ₹15k CBO",
    plan: {
      objective: "OUTCOME_AWARENESS",
      intent: "scale",
      budgetAmount: 15000,
      budgetMode: "CBO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "flexible",
      spread: "multiply",
      advantagePlus: true,
      targets: [
        {
          accountId: "act_007",
          accountName: "Idea Clan — IN07",
          currency: "INR",
          pageId: "page_007",
          fbPageId: "fb_007",
          pageName: "Kapiva Ayurveda",
        },
        {
          accountId: "act_005",
          accountName: "Idea Clan — IN05",
          currency: "INR",
          pageId: "page_005",
          fbPageId: "fb_005",
          pageName: "Sleepyhead Brand",
        },
      ],
      structure: { campaigns: 2, adSetsPerCampaign: 5, adsPerAdSet: 5 },
      pageDistribution: "equal",
    },
  },
  {
    name: "Test Awareness — USD Video · $300 ABO",
    plan: {
      objective: "OUTCOME_AWARENESS",
      intent: "test",
      budgetAmount: 300,
      budgetMode: "ABO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "single_video",
      spread: "one_per_adset",
      advantagePlus: false,
      targets: [
        {
          accountId: "act_101",
          accountName: "Idea Clan — US01",
          currency: "USD",
          pageId: "page_101",
          fbPageId: "fb_101",
          pageName: "Mensa Brands US",
          pixelId: "px_101",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 2, adsPerAdSet: 3 },
      pageDistribution: "fill_first",
    },
  },
  {
    name: "Scale Awareness — Image Round-Robin · ₹6k CBO",
    plan: {
      objective: "OUTCOME_AWARENESS",
      intent: "scale",
      budgetAmount: 6000,
      budgetMode: "CBO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "single_image",
      spread: "round_robin",
      advantagePlus: false,
      targets: [
        {
          accountId: "act_005",
          accountName: "Idea Clan — IN05",
          currency: "INR",
          pageId: "page_005",
          fbPageId: "fb_005",
          pageName: "Sleepyhead Brand",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 4, adsPerAdSet: 3 },
      pageDistribution: "duplicate",
    },
  },
  {
    name: "Custom Awareness — Pixel Carousel · ₹4k ABO",
    plan: {
      objective: "OUTCOME_AWARENESS",
      intent: "custom",
      budgetAmount: 4000,
      budgetMode: "ABO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "carousel",
      spread: "one_per_adset",
      advantagePlus: true,
      targets: [
        {
          accountId: "act_006",
          accountName: "Idea Clan — IN06",
          currency: "INR",
          pageId: "page_006",
          fbPageId: "fb_006",
          pageName: "Plix Wellness",
          pixelId: "px_006",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 3, adsPerAdSet: 2 },
      pageDistribution: "equal",
    },
  },
  {
    name: "Test Awareness — Flexible No Target · ₹500 ABO",
    plan: {
      objective: "OUTCOME_AWARENESS",
      intent: "test",
      budgetAmount: 500,
      budgetMode: "ABO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "flexible",
      spread: "round_robin",
      advantagePlus: false,
      targets: [
        {
          accountId: "act_002",
          accountName: "Idea Clan — IN02",
          currency: "INR",
          pageId: "page_002",
          fbPageId: "fb_002",
          pageName: "boAt India",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 1, adsPerAdSet: 2 },
      pageDistribution: "equal",
    },
  },
  // ── OUTCOME_TRAFFIC (8) ───────────────────────────────────────────────
  {
    name: "Scale Traffic — Video CBO · ₹10k",
    plan: {
      objective: "OUTCOME_TRAFFIC",
      intent: "scale",
      budgetAmount: 10000,
      budgetMode: "CBO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "single_video",
      spread: "stacked",
      advantagePlus: true,
      targets: [
        {
          accountId: "act_001",
          accountName: "Idea Clan — IN01",
          currency: "INR",
          pageId: "page_001",
          fbPageId: "fb_001",
          pageName: "Mamaearth Brand Page",
          pixelId: "px_001",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 5, adsPerAdSet: 4 },
      pageDistribution: "fill_first",
    },
  },
  {
    name: "Test Traffic — Image ABO · ₹2k",
    plan: {
      objective: "OUTCOME_TRAFFIC",
      intent: "test",
      budgetAmount: 2000,
      budgetMode: "ABO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "single_image",
      spread: "one_per_adset",
      advantagePlus: false,
      targets: [
        {
          accountId: "act_001",
          accountName: "Idea Clan — IN01",
          currency: "INR",
          pageId: "page_001",
          fbPageId: "fb_001",
          pageName: "Mamaearth Brand Page",
          pixelId: "px_001",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 3, adsPerAdSet: 2 },
      pageDistribution: "equal",
    },
  },
  {
    name: "Custom Traffic — Carousel Multi-Account · ₹7k ABO",
    plan: {
      objective: "OUTCOME_TRAFFIC",
      intent: "custom",
      budgetAmount: 7000,
      budgetMode: "ABO",
      bidStrategy: "COST_CAP",
      format: "carousel",
      spread: "round_robin",
      advantagePlus: false,
      targets: [
        {
          accountId: "act_003",
          accountName: "Idea Clan — IN03",
          currency: "INR",
          pageId: "page_003",
          fbPageId: "fb_003",
          pageName: "Noise India",
        },
        {
          accountId: "act_007",
          accountName: "Idea Clan — IN07",
          currency: "INR",
          pageId: "page_007",
          fbPageId: "fb_007",
          pageName: "Kapiva Ayurveda",
        },
      ],
      structure: { campaigns: 2, adSetsPerCampaign: 3, adsPerAdSet: 3 },
      pageDistribution: "duplicate",
    },
  },
  {
    name: "Scale Traffic — Flexible Advantage+ · ₹20k CBO",
    plan: {
      objective: "OUTCOME_TRAFFIC",
      intent: "scale",
      budgetAmount: 20000,
      budgetMode: "CBO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "flexible",
      spread: "multiply",
      advantagePlus: true,
      targets: [
        {
          accountId: "act_004",
          accountName: "Idea Clan — IN04",
          currency: "INR",
          pageId: "page_004",
          fbPageId: "fb_004",
          pageName: "mCaffeine Page",
          pixelId: "px_004",
        },
      ],
      structure: { campaigns: 2, adSetsPerCampaign: 4, adsPerAdSet: 6 },
      pageDistribution: "fill_first",
    },
  },
  {
    name: "Test Traffic — USA USD · $150 ABO",
    plan: {
      objective: "OUTCOME_TRAFFIC",
      intent: "test",
      budgetAmount: 150,
      budgetMode: "ABO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "single_image",
      spread: "one_per_adset",
      advantagePlus: false,
      targets: [
        {
          accountId: "act_102",
          accountName: "Idea Clan — US02",
          currency: "USD",
          pageId: "page_102",
          fbPageId: "fb_102",
          pageName: "Noise Global",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 2, adsPerAdSet: 2 },
      pageDistribution: "equal",
    },
  },
  {
    name: "Scale Traffic — DPA Stacked · ₹12k CBO",
    plan: {
      objective: "OUTCOME_TRAFFIC",
      intent: "scale",
      budgetAmount: 12000,
      budgetMode: "CBO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "dpa",
      spread: "stacked",
      advantagePlus: true,
      targets: [
        {
          accountId: "act_004",
          accountName: "Idea Clan — IN04",
          currency: "INR",
          pageId: "page_004",
          fbPageId: "fb_004",
          pageName: "mCaffeine Page",
          pixelId: "px_004",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 6, adsPerAdSet: 5 },
      pageDistribution: "duplicate",
    },
  },
  {
    name: "Custom Traffic — Video Cost Cap · ₹9k ABO",
    plan: {
      objective: "OUTCOME_TRAFFIC",
      intent: "custom",
      budgetAmount: 9000,
      budgetMode: "ABO",
      bidStrategy: "COST_CAP",
      format: "single_video",
      spread: "round_robin",
      advantagePlus: false,
      targets: [
        {
          accountId: "act_008",
          accountName: "Idea Clan — IN08",
          currency: "INR",
          pageId: "page_008",
          fbPageId: "fb_008",
          pageName: "Bombay Shaving Company",
          pixelId: "px_008",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 4, adsPerAdSet: 4 },
      pageDistribution: "fill_first",
    },
  },
  {
    name: "Test Traffic — Flexible No Pixel · ₹3k ABO",
    plan: {
      objective: "OUTCOME_TRAFFIC",
      intent: "test",
      budgetAmount: 3000,
      budgetMode: "ABO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "flexible",
      spread: "one_per_adset",
      advantagePlus: true,
      targets: [
        {
          accountId: "act_007",
          accountName: "Idea Clan — IN07",
          currency: "INR",
          pageId: "page_007",
          fbPageId: "fb_007",
          pageName: "Kapiva Ayurveda",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 2, adsPerAdSet: 3 },
      pageDistribution: "equal",
    },
  },
  // ── OUTCOME_LEADS (8) ─────────────────────────────────────────────────
  {
    name: "Scale Leads — Carousel · ₹8k CBO",
    plan: {
      objective: "OUTCOME_LEADS",
      intent: "scale",
      budgetAmount: 8000,
      budgetMode: "CBO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "carousel",
      spread: "round_robin",
      advantagePlus: true,
      targets: [
        {
          accountId: "act_006",
          accountName: "Idea Clan — IN06",
          currency: "INR",
          pageId: "page_006",
          fbPageId: "fb_006",
          pageName: "Plix Wellness",
          pixelId: "px_006",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 4, adsPerAdSet: 4 },
      pageDistribution: "fill_first",
    },
  },
  {
    name: "Test Leads — Image Cost Cap · ₹1k ABO",
    plan: {
      objective: "OUTCOME_LEADS",
      intent: "test",
      budgetAmount: 1000,
      budgetMode: "ABO",
      bidStrategy: "COST_CAP",
      format: "single_image",
      spread: "one_per_adset",
      advantagePlus: false,
      targets: [
        {
          accountId: "act_006",
          accountName: "Idea Clan — IN06",
          currency: "INR",
          pageId: "page_006",
          fbPageId: "fb_006",
          pageName: "Plix Wellness",
          pixelId: "px_006",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 2, adsPerAdSet: 2 },
      pageDistribution: "equal",
    },
  },
  {
    name: "Custom Leads — Video Multiply · ₹6k CBO",
    plan: {
      objective: "OUTCOME_LEADS",
      intent: "custom",
      budgetAmount: 6000,
      budgetMode: "CBO",
      bidStrategy: "COST_CAP",
      format: "single_video",
      spread: "multiply",
      advantagePlus: false,
      targets: [
        {
          accountId: "act_007",
          accountName: "Idea Clan — IN07",
          currency: "INR",
          pageId: "page_007",
          fbPageId: "fb_007",
          pageName: "Kapiva Ayurveda",
        },
      ],
      structure: { campaigns: 2, adSetsPerCampaign: 3, adsPerAdSet: 3 },
      pageDistribution: "duplicate",
    },
  },
  {
    name: "Scale Leads — Leads · USA USD · $400 CBO",
    plan: {
      objective: "OUTCOME_LEADS",
      intent: "scale",
      budgetAmount: 400,
      budgetMode: "CBO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "single_video",
      spread: "stacked",
      advantagePlus: true,
      targets: [
        {
          accountId: "act_101",
          accountName: "Idea Clan — US01",
          currency: "USD",
          pageId: "page_101",
          fbPageId: "fb_101",
          pageName: "Mensa Brands US",
          pixelId: "px_101",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 4, adsPerAdSet: 5 },
      pageDistribution: "fill_first",
    },
  },
  {
    name: "Test Leads — Carousel No Pixel · ₹2.5k ABO",
    plan: {
      objective: "OUTCOME_LEADS",
      intent: "test",
      budgetAmount: 2500,
      budgetMode: "ABO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "carousel",
      spread: "one_per_adset",
      advantagePlus: false,
      targets: [
        {
          accountId: "act_005",
          accountName: "Idea Clan — IN05",
          currency: "INR",
          pageId: "page_005",
          fbPageId: "fb_005",
          pageName: "Sleepyhead Brand",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 2, adsPerAdSet: 2 },
      pageDistribution: "equal",
    },
  },
  {
    name: "Scale Leads — Flexible Multi-Account · ₹14k CBO",
    plan: {
      objective: "OUTCOME_LEADS",
      intent: "scale",
      budgetAmount: 14000,
      budgetMode: "CBO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "flexible",
      spread: "round_robin",
      advantagePlus: true,
      targets: [
        {
          accountId: "act_002",
          accountName: "Idea Clan — IN02",
          currency: "INR",
          pageId: "page_002",
          fbPageId: "fb_002",
          pageName: "boAt India",
          pixelId: "px_002",
        },
        {
          accountId: "act_004",
          accountName: "Idea Clan — IN04",
          currency: "INR",
          pageId: "page_004",
          fbPageId: "fb_004",
          pageName: "mCaffeine Page",
          pixelId: "px_004",
        },
      ],
      structure: { campaigns: 2, adSetsPerCampaign: 5, adsPerAdSet: 4 },
      pageDistribution: "duplicate",
    },
  },
  {
    name: "Custom Leads — Image Stacked · ₹4k ABO",
    plan: {
      objective: "OUTCOME_LEADS",
      intent: "custom",
      budgetAmount: 4000,
      budgetMode: "ABO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "single_image",
      spread: "stacked",
      advantagePlus: false,
      targets: [
        {
          accountId: "act_008",
          accountName: "Idea Clan — IN08",
          currency: "INR",
          pageId: "page_008",
          fbPageId: "fb_008",
          pageName: "Bombay Shaving Company",
          pixelId: "px_008",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 3, adsPerAdSet: 3 },
      pageDistribution: "fill_first",
    },
  },
  {
    name: "Scale Leads — DPA Pixel · ₹10k CBO",
    plan: {
      objective: "OUTCOME_LEADS",
      intent: "scale",
      budgetAmount: 10000,
      budgetMode: "CBO",
      bidStrategy: "COST_CAP",
      format: "dpa",
      spread: "multiply",
      advantagePlus: true,
      targets: [
        {
          accountId: "act_008",
          accountName: "Idea Clan — IN08",
          currency: "INR",
          pageId: "page_008",
          fbPageId: "fb_008",
          pageName: "Bombay Shaving Company",
          pixelId: "px_008",
        },
      ],
      structure: { campaigns: 2, adSetsPerCampaign: 4, adsPerAdSet: 6 },
      pageDistribution: "equal",
    },
  },
  // ── OUTCOME_ENGAGEMENT (6) ────────────────────────────────────────────
  {
    name: "Scale Engagement — Video Reels CBO · ₹5k",
    plan: {
      objective: "OUTCOME_ENGAGEMENT",
      intent: "scale",
      budgetAmount: 5000,
      budgetMode: "CBO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "single_video",
      spread: "round_robin",
      advantagePlus: true,
      targets: [
        {
          accountId: "act_003",
          accountName: "Idea Clan — IN03",
          currency: "INR",
          pageId: "page_003",
          fbPageId: "fb_003",
          pageName: "Noise India",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 3, adsPerAdSet: 4 },
      pageDistribution: "fill_first",
    },
  },
  {
    name: "Test Engagement — Carousel ABO · ₹800",
    plan: {
      objective: "OUTCOME_ENGAGEMENT",
      intent: "test",
      budgetAmount: 800,
      budgetMode: "ABO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "carousel",
      spread: "one_per_adset",
      advantagePlus: false,
      targets: [
        {
          accountId: "act_003",
          accountName: "Idea Clan — IN03",
          currency: "INR",
          pageId: "page_003",
          fbPageId: "fb_003",
          pageName: "Noise India",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 1, adsPerAdSet: 3 },
      pageDistribution: "equal",
    },
  },
  {
    name: "Custom Engagement — Image Multi-Page · ₹3k ABO",
    plan: {
      objective: "OUTCOME_ENGAGEMENT",
      intent: "custom",
      budgetAmount: 3000,
      budgetMode: "ABO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "single_image",
      spread: "stacked",
      advantagePlus: false,
      targets: [
        {
          accountId: "act_001",
          accountName: "Idea Clan — IN01",
          currency: "INR",
          pageId: "page_001",
          fbPageId: "fb_001",
          pageName: "Mamaearth Brand Page",
          pixelId: "px_001",
        },
        {
          accountId: "act_006",
          accountName: "Idea Clan — IN06",
          currency: "INR",
          pageId: "page_006",
          fbPageId: "fb_006",
          pageName: "Plix Wellness",
          pixelId: "px_006",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 2, adsPerAdSet: 3 },
      pageDistribution: "duplicate",
    },
  },
  {
    name: "Scale Engagement — Flexible Advantage+ · ₹9k CBO",
    plan: {
      objective: "OUTCOME_ENGAGEMENT",
      intent: "scale",
      budgetAmount: 9000,
      budgetMode: "CBO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "flexible",
      spread: "multiply",
      advantagePlus: true,
      targets: [
        {
          accountId: "act_001",
          accountName: "Idea Clan — IN01",
          currency: "INR",
          pageId: "page_001",
          fbPageId: "fb_001",
          pageName: "Mamaearth Brand Page",
          pixelId: "px_001",
        },
      ],
      structure: { campaigns: 2, adSetsPerCampaign: 4, adsPerAdSet: 5 },
      pageDistribution: "fill_first",
    },
  },
  {
    name: "Test Engagement — USD Video · $100 ABO",
    plan: {
      objective: "OUTCOME_ENGAGEMENT",
      intent: "test",
      budgetAmount: 100,
      budgetMode: "ABO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "single_video",
      spread: "one_per_adset",
      advantagePlus: false,
      targets: [
        {
          accountId: "act_102",
          accountName: "Idea Clan — US02",
          currency: "USD",
          pageId: "page_102",
          fbPageId: "fb_102",
          pageName: "Noise Global",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 2, adsPerAdSet: 2 },
      pageDistribution: "equal",
    },
  },
  {
    name: "Custom Engagement — Pixel Carousel · ₹6k CBO",
    plan: {
      objective: "OUTCOME_ENGAGEMENT",
      intent: "custom",
      budgetAmount: 6000,
      budgetMode: "CBO",
      bidStrategy: "COST_CAP",
      format: "carousel",
      spread: "round_robin",
      advantagePlus: true,
      targets: [
        {
          accountId: "act_004",
          accountName: "Idea Clan — IN04",
          currency: "INR",
          pageId: "page_004",
          fbPageId: "fb_004",
          pageName: "mCaffeine Page",
          pixelId: "px_004",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 3, adsPerAdSet: 4 },
      pageDistribution: "duplicate",
    },
  },
  // ── OUTCOME_APP_PROMOTION (5) ─────────────────────────────────────────
  {
    name: "Scale App — Video Advantage+ · ₹12k CBO",
    plan: {
      objective: "OUTCOME_APP_PROMOTION",
      intent: "scale",
      budgetAmount: 12000,
      budgetMode: "CBO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "single_video",
      spread: "round_robin",
      advantagePlus: true,
      targets: [
        {
          accountId: "act_002",
          accountName: "Idea Clan — IN02",
          currency: "INR",
          pageId: "page_002",
          fbPageId: "fb_002",
          pageName: "boAt India",
          pixelId: "px_002",
        },
      ],
      structure: { campaigns: 2, adSetsPerCampaign: 4, adsPerAdSet: 5 },
      pageDistribution: "fill_first",
    },
  },
  {
    name: "Test App — Image ABO · ₹1.5k",
    plan: {
      objective: "OUTCOME_APP_PROMOTION",
      intent: "test",
      budgetAmount: 1500,
      budgetMode: "ABO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "single_image",
      spread: "one_per_adset",
      advantagePlus: false,
      targets: [
        {
          accountId: "act_002",
          accountName: "Idea Clan — IN02",
          currency: "INR",
          pageId: "page_002",
          fbPageId: "fb_002",
          pageName: "boAt India",
          pixelId: "px_002",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 2, adsPerAdSet: 2 },
      pageDistribution: "equal",
    },
  },
  {
    name: "Custom App — Flexible Multi · ₹7k CBO",
    plan: {
      objective: "OUTCOME_APP_PROMOTION",
      intent: "custom",
      budgetAmount: 7000,
      budgetMode: "CBO",
      bidStrategy: "COST_CAP",
      format: "flexible",
      spread: "stacked",
      advantagePlus: true,
      targets: [
        {
          accountId: "act_007",
          accountName: "Idea Clan — IN07",
          currency: "INR",
          pageId: "page_007",
          fbPageId: "fb_007",
          pageName: "Kapiva Ayurveda",
        },
        {
          accountId: "act_005",
          accountName: "Idea Clan — IN05",
          currency: "INR",
          pageId: "page_005",
          fbPageId: "fb_005",
          pageName: "Sleepyhead Brand",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 4, adsPerAdSet: 6 },
      pageDistribution: "duplicate",
    },
  },
  {
    name: "Scale App — USA USD Cost Cap · $600 CBO",
    plan: {
      objective: "OUTCOME_APP_PROMOTION",
      intent: "scale",
      budgetAmount: 600,
      budgetMode: "CBO",
      bidStrategy: "COST_CAP",
      format: "single_video",
      spread: "multiply",
      advantagePlus: true,
      targets: [
        {
          accountId: "act_101",
          accountName: "Idea Clan — US01",
          currency: "USD",
          pageId: "page_101",
          fbPageId: "fb_101",
          pageName: "Mensa Brands US",
          pixelId: "px_101",
        },
      ],
      structure: { campaigns: 2, adSetsPerCampaign: 3, adsPerAdSet: 4 },
      pageDistribution: "fill_first",
    },
  },
  {
    name: "Test App — Carousel No Pixel · ₹2k ABO",
    plan: {
      objective: "OUTCOME_APP_PROMOTION",
      intent: "test",
      budgetAmount: 2000,
      budgetMode: "ABO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "carousel",
      spread: "one_per_adset",
      advantagePlus: false,
      targets: [
        {
          accountId: "act_005",
          accountName: "Idea Clan — IN05",
          currency: "INR",
          pageId: "page_005",
          fbPageId: "fb_005",
          pageName: "Sleepyhead Brand",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 2, adsPerAdSet: 3 },
      pageDistribution: "equal",
    },
  },
];

/* ------------------------------------------------------------------ */
/*  Storage helpers                                                     */
/* ------------------------------------------------------------------ */

function readAll(): LaunchStrategy[] {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LaunchStrategy[]) : [];
  } catch {
    return [];
  }
}

function writeAll(list: LaunchStrategy[]): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore quota / privacy errors */
  }
}

function genId(): string {
  return `strat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/* ------------------------------------------------------------------ */
/*  Seed on first empty load                                           */
/* ------------------------------------------------------------------ */

let seeded = false;

/** Derive tags for the legacy seeded strategies (intent + objective shorthand). */
function deriveTags(name: string, plan: Partial<PlanV2>): string[] {
  const tags: string[] = [];
  if (plan.intent === "scale") tags.push("scale");
  if (plan.intent === "test") tags.push("test");
  if (plan.intent === "custom") tags.push("custom");
  if (plan.budgetMode === "CBO") tags.push("CBO");
  if (plan.budgetMode === "ABO") tags.push("ABO");
  if (plan.format === "dpa") tags.push("DPA");
  if (plan.format === "single_video") tags.push("video");
  if (plan.objective === "OUTCOME_LEADS") tags.push("lead-gen");
  if (plan.objective === "OUTCOME_AWARENESS") tags.push("awareness");
  const ccy = plan.targets?.[0]?.currency;
  if (ccy === "USD") tags.push("US");
  if (ccy === "INR") tags.push("IN");
  // Dedupe
  return Array.from(new Set(tags));
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function hydrate(): LaunchStrategy[] {
  let list = readAll();
  if (!seeded && list.length === 0) {
    const demo: LaunchStrategy[] = DEMO_STRATEGIES.map((d) => ({
      id: genId(),
      name: d.name,
      createdAt: NOW,
      updatedAt: d.lastUsedDaysAgo != null ? daysAgoIso(d.lastUsedDaysAgo) : NOW,
      workspaceId: DEFAULT_WORKSPACE_ID,
      plan: d.plan,
      tags: d.tags,
      lastUsedAt: d.lastUsedDaysAgo != null ? daysAgoIso(d.lastUsedDaysAgo) : undefined,
      useCount: d.useCount ?? 0,
    }));
    const legacy: LaunchStrategy[] = SEED_STRATEGIES.map(({ name, plan }, i) => ({
      id: genId(),
      name,
      createdAt: NOW,
      updatedAt: NOW,
      workspaceId: DEFAULT_WORKSPACE_ID,
      plan,
      tags: deriveTags(name, plan),
      // Stagger useCount so sort-by-most-used has variety
      useCount: Math.max(0, 8 - Math.floor(i / 6)),
      lastUsedAt: daysAgoIso(10 + i),
    }));
    list = [...demo, ...legacy];
    writeAll(list);
    seeded = true;
  } else {
    seeded = true;
  }
  return list;
}

/* ------------------------------------------------------------------ */
/*  Summarize helpers                                                   */
/* ------------------------------------------------------------------ */

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "AED ",
};

function currSym(code?: string): string {
  if (!code) return "";
  return CURRENCY_SYMBOLS[code] ?? `${code} `;
}

function formatBudget(plan: Partial<PlanV2>): string {
  const amount = plan.budgetAmount;
  const currency = plan.targets?.[0]?.currency;
  const mode = plan.budgetMode;
  if (!amount) return "—";
  const sym = currSym(currency);
  const formatted = `${sym}${Math.round(amount).toLocaleString("en-IN")}/day`;
  return mode ? `${formatted} · ${mode}` : formatted;
}

const SPREAD_LABELS: Record<string, string> = {
  round_robin: "Round-robin",
  one_per_adset: "One per ad set",
  stacked: "Stacked",
  multiply: "Multiply",
  manual: "Manual",
};

function prettifySpread(spread?: string): string {
  if (!spread) return "—";
  return SPREAD_LABELS[spread] ?? spread;
}

const FORMAT_LABELS: Record<string, string> = {
  single_image: "Image",
  single_video: "Video",
  carousel: "Carousel",
  collection: "Collection",
  flexible: "Flexible",
  dpa: "DPA",
};

function prettifyFormat(format?: string | null): string {
  if (!format) return "—";
  return FORMAT_LABELS[format] ?? format;
}

function prettifyObjective(objective?: string | null): string {
  if (!objective) return "—";
  // Strip "OUTCOME_" prefix and capitalize first letter, lowercase rest
  const raw = objective.replace(/^OUTCOME_/, "");
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function prettifyIntent(intent?: string | null): string {
  if (!intent) return "—";
  return intent.charAt(0).toUpperCase() + intent.slice(1);
}

/* ------------------------------------------------------------------ */
/*  Service                                                             */
/* ------------------------------------------------------------------ */

export const strategiesService = {
  /** Force re-hydration on next call (test hook). */
  _reset(): void {
    seeded = false;
  },

  list(): LaunchStrategy[] {
    return hydrate().sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  },

  get(id: string): LaunchStrategy | undefined {
    return hydrate().find((s) => s.id === id);
  },

  save(name: string, plan: Partial<PlanV2>): LaunchStrategy {
    const list = hydrate();
    const now = new Date().toISOString();
    const strategy: LaunchStrategy = {
      id: genId(),
      name: name.trim() || "Untitled strategy",
      createdAt: now,
      updatedAt: now,
      workspaceId: DEFAULT_WORKSPACE_ID,
      plan,
    };
    writeAll([...list, strategy]);
    return strategy;
  },

  rename(id: string, name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    const list = hydrate().map((s) =>
      s.id === id ? { ...s, name: trimmed, updatedAt: new Date().toISOString() } : s,
    );
    writeAll(list);
  },

  remove(id: string): void {
    writeAll(hydrate().filter((s) => s.id !== id));
  },

  summarize(strategy: LaunchStrategy): StrategySummary {
    const { plan } = strategy;

    // Audience summary: first location name + age range from targeting template
    // or from the first target name as fallback
    let audienceSummary = "—";
    const firstTarget = plan.targets?.[0];
    if (firstTarget) {
      const location = firstTarget.accountName.includes("IN") ? "India" : firstTarget.accountName;
      audienceSummary = location;
    }

    return {
      objective: prettifyObjective(plan.objective),
      intent: prettifyIntent(plan.intent),
      budgetDisplay: formatBudget(plan),
      destinationsCount: plan.targets?.length ?? 0,
      format: prettifyFormat(plan.format),
      spreadMode: prettifySpread(plan.spread),
      audienceSummary,
    };
  },

  duplicate(id: string): LaunchStrategy | undefined {
    const original = hydrate().find((s) => s.id === id);
    if (!original) return undefined;
    const list = hydrate();
    const now = new Date().toISOString();
    const copy: LaunchStrategy = {
      ...original,
      id: genId(),
      name: `Copy of ${original.name}`,
      createdAt: now,
      updatedAt: now,
      useCount: 0,
      lastUsedAt: undefined,
    };
    writeAll([...list, copy]);
    return copy;
  },

  markUsed(id: string): void {
    const now = new Date().toISOString();
    const list = hydrate().map((s) =>
      s.id === id
        ? { ...s, useCount: (s.useCount ?? 0) + 1, lastUsedAt: now, updatedAt: now }
        : s,
    );
    writeAll(list);
  },

  updatePlan(id: string, patch: Partial<PlanV2>): void {
    const list = hydrate().map((s) =>
      s.id === id ? { ...s, plan: { ...s.plan, ...patch }, updatedAt: new Date().toISOString() } : s
    );
    writeAll(list);
  },

  update(id: string, patch: { name?: string; tags?: string[]; plan?: Partial<PlanV2>; askAtLaunch?: string[] }): void {
    const list = hydrate().map((s) => {
      if (s.id !== id) return s;
      const next = { ...s, updatedAt: new Date().toISOString() };
      if (patch.name != null && patch.name.trim()) next.name = patch.name.trim();
      if (patch.tags != null) next.tags = patch.tags;
      if (patch.askAtLaunch != null) next.askAtLaunch = patch.askAtLaunch;
      if (patch.plan != null) next.plan = { ...s.plan, ...patch.plan };
      return next;
    });
    writeAll(list);
  },

  updateTags(id: string, tags: string[]): void {
    const list = hydrate().map((s) =>
      s.id === id ? { ...s, tags, updatedAt: new Date().toISOString() } : s
    );
    writeAll(list);
  },
};
