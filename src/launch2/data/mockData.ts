/**
 * Mock data for Launch 2.0 — realistic placeholder data so the whole module is
 * demonstrable behind the mock service. Brand names follow the design system's
 * realistic-names rule (Mamaearth, boAt, Noise, Sleepyhead + a US DTC account).
 *
 * [I] All numbers here are invented-but-plausible placeholders. Cap headroom is
 * deliberately varied (healthy / near-cap / full / restricted) so the 250-cap
 * pre-check, Account-Health and distribution previews all have something to show.
 */
import type {
  AccountHealth,
  ActivityEvent,
  AdAccount,
  Catalogue,
  DistributionStrategy,
  LaunchPlan,
  LaunchRunStatus,
  LaunchTarget,
  LaunchTemplate,
  StrategyId,
  WinnerStrategy,
} from "../types";
import { getStrategy } from "./strategies";

const now = Date.now();
const iso = (msAgo: number) => new Date(now - msAgo).toISOString();
const isoIn = (msAhead: number) => new Date(now + msAhead).toISOString();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/* ------------------------------------------------------------------ */
/*  Ad accounts (pages carry cap headroom variety)                     */
/* ------------------------------------------------------------------ */

export const MOCK_ACCOUNTS: AdAccount[] = [
  {
    id: "act_acme_us",
    name: "Acme DTC — US",
    currency: "USD",
    status: "active",
    pages: [
      { id: "pg_acme_store", fbPageId: "fb_1001", name: "Acme Store", activeAds: 18, category: "Retail" },
      { id: "pg_acme_outlet", fbPageId: "fb_1002", name: "Acme Outlet", activeAds: 5, category: "Retail" },
    ],
    pixels: [{ id: "px_acme", name: "Acme Pixel", lastEventAt: iso(12 * MIN) }],
  },
  {
    id: "act_mamaearth",
    name: "Mamaearth — Performance",
    currency: "INR",
    status: "active",
    pages: [
      { id: "pg_mama", fbPageId: "fb_2001", name: "Mamaearth", activeAds: 210, category: "Beauty" },
      { id: "pg_mama_skin", fbPageId: "fb_2002", name: "Mamaearth Skincare", activeAds: 40, category: "Beauty" },
    ],
    pixels: [{ id: "px_mama", name: "Mamaearth Pixel", lastEventAt: iso(3 * MIN) }],
  },
  {
    id: "act_boat",
    name: "boAt Lifestyle",
    currency: "INR",
    status: "restricted",
    pages: [
      { id: "pg_boat_audio", fbPageId: "fb_3001", name: "boAt Audio", activeAds: 250, category: "Electronics" },
      { id: "pg_boat_wear", fbPageId: "fb_3002", name: "boAt Wearables", activeAds: 180, category: "Electronics" },
    ],
    pixels: [{ id: "px_boat", name: "boAt Pixel", lastEventAt: iso(2 * HOUR) }],
  },
  {
    id: "act_noise",
    name: "Noise",
    currency: "INR",
    status: "active",
    pages: [
      { id: "pg_noise", fbPageId: "fb_4001", name: "Noise Official", activeAds: 95, category: "Electronics" },
    ],
    pixels: [{ id: "px_noise", name: "Noise Pixel", lastEventAt: iso(40 * MIN) }],
  },
  {
    id: "act_sleepy",
    name: "Sleepyhead",
    currency: "INR",
    status: "active",
    pages: [
      { id: "pg_sleepy", fbPageId: "fb_5001", name: "Sleepyhead", activeAds: 12, category: "Home" },
    ],
    pixels: [{ id: "px_sleepy", name: "Sleepyhead Pixel", lastEventAt: iso(6 * HOUR) }],
  },
];

export function findAccount(id: string): AdAccount | undefined {
  return MOCK_ACCOUNTS.find((a) => a.id === id);
}

/** Build a (account → page) target from ids. */
export function makeTarget(accountId: string, pageId: string): LaunchTarget {
  const account = findAccount(accountId)!;
  const page = account.pages.find((p) => p.id === pageId)!;
  return {
    accountId: account.id,
    accountName: account.name,
    pageId: page.id,
    fbPageId: page.fbPageId,
    pageName: page.name,
    pixelId: account.pixels[0]?.id,
  };
}

/* ------------------------------------------------------------------ */
/*  Catalogues (per account)                                           */
/* ------------------------------------------------------------------ */

export const MOCK_CATALOGUES: Catalogue[] = [
  {
    id: "cat_acme",
    accountId: "act_acme_us",
    name: "Acme Master Catalog",
    productCount: 642,
    productSets: [
      { id: "ps_acme_best", name: "Best Sellers", productCount: 48, sampleProducts: ["Aero Runner", "Trail Pro 2", "City Pack 20L", "Flux Bottle", "Drift Cap"] },
      { id: "ps_acme_new", name: "New Arrivals", productCount: 96 },
      { id: "ps_acme_sale", name: "Clearance", productCount: 120 },
    ],
  },
  {
    id: "cat_mama",
    accountId: "act_mamaearth",
    name: "Mamaearth Catalog",
    productCount: 318,
    productSets: [
      { id: "ps_mama_face", name: "Face Care", productCount: 64, sampleProducts: ["Vitamin C Serum", "Ubtan Face Wash", "Aqua Glow Gel", "Rice Toner", "Tea Tree Foam"] },
      { id: "ps_mama_hair", name: "Hair Care", productCount: 52 },
    ],
  },
  {
    id: "cat_boat",
    accountId: "act_boat",
    name: "boAt Catalog",
    productCount: 274,
    productSets: [
      { id: "ps_boat_tws", name: "TWS Earbuds", productCount: 38, sampleProducts: ["Airdopes 161", "Airdopes 311 Pro", "Nirvana Ion", "Airdopes 91 Prime"] },
      { id: "ps_boat_watch", name: "Smartwatches", productCount: 41 },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Winners shelf — OPS SIGNAL ONLY (no ROAS / CTR)                    */
/* ------------------------------------------------------------------ */

export const MOCK_WINNERS: WinnerStrategy[] = [
  { id: "win_1", strategyId: "bruno", name: "Bruno — Acme Q2 spray", lastLaunchedAt: iso(2 * DAY), relaunchCount: 4, proven: true },
  { id: "win_2", strategyId: "asc-scaling", name: "ASC Scaling — Mamaearth Face", lastLaunchedAt: iso(5 * DAY), relaunchCount: 2, proven: true },
  { id: "win_3", strategyId: "social-proofing", name: "Social Proofing — boAt launch post", lastLaunchedAt: iso(8 * DAY), relaunchCount: 3, proven: true },
  { id: "win_4", strategyId: "tg-testing", name: "TG Testing — Noise wearables", lastLaunchedAt: iso(11 * DAY), relaunchCount: 1, proven: false },
];

/* ------------------------------------------------------------------ */
/*  Activity log                                                       */
/* ------------------------------------------------------------------ */

export const MOCK_ACTIVITY: ActivityEvent[] = [
  { id: "ev_1", type: "launch", title: "Bruno spray launched on Acme Store", detail: "50 ads requested · batched", at: iso(20 * MIN), launchId: "rn_live" },
  { id: "ev_2", type: "failure", title: "2 ads failed on Acme Store", detail: "1 policy review · 1 throttled", at: iso(16 * MIN), launchId: "rn_live" },
  { id: "ev_3", type: "retry", title: "Retried 2 failed ads — Mamaearth relaunch", detail: "1 recovered · 1 still failing", at: iso(2 * HOUR), launchId: "rn_partial" },
  { id: "ev_4", type: "launch", title: "ASC scaling launched on Acme Store", detail: "10 ads · completed clean", at: iso(6 * HOUR), launchId: "rn_done" },
  { id: "ev_5", type: "schedule", title: "Phase-audience test scheduled — Noise", detail: "Runs in ~1 day", at: iso(8 * HOUR), launchId: "rn_sched" },
  { id: "ev_6", type: "draft", title: "Draft saved — Mamaearth winter SKU test", at: iso(26 * HOUR) },
  { id: "ev_7", type: "recovery", title: "boAt Audio Page hit the 250 cap", detail: "Pause or rotate ads to free slots", at: iso(2 * DAY) },
  { id: "ev_8", type: "settings", title: "Default naming convention updated", at: iso(3 * DAY) },
];

/* ------------------------------------------------------------------ */
/*  Account health                                                     */
/* ------------------------------------------------------------------ */

export const MOCK_HEALTH: AccountHealth[] = MOCK_ACCOUNTS.map((a) => ({
  accountId: a.id,
  accountName: a.name,
  status: a.status,
  pages: a.pages.map((p) => ({
    pageId: p.id,
    pageName: p.name,
    activeAds: p.activeAds,
    capacity: 250,
  })),
  issues:
    a.status === "restricted"
      ? [{ severity: "error" as const, message: "Account flagged in review — new ad delivery limited until resolved." }]
      : a.pages.some((p) => p.activeAds >= 250)
        ? [{ severity: "error" as const, message: "A Page is at the 250 active-ad cap — pause or rotate to free slots." }]
        : a.pages.some((p) => p.activeAds >= 200)
          ? [{ severity: "warn" as const, message: "A Page is near the 250 active-ad cap." }]
          : undefined,
}));

/* ------------------------------------------------------------------ */
/*  Plan builder + drafts + seed runs                                  */
/* ------------------------------------------------------------------ */

interface MakePlanArgs {
  id: string;
  name: string;
  strategyId: StrategyId;
  targets: LaunchTarget[];
  distribution?: DistributionStrategy;
  mode?: LaunchPlan["mode"];
  scheduledFor?: string | null;
  updatedAtMsAgo?: number;
}

export function makePlan(args: MakePlanArgs): LaunchPlan {
  const s = getStrategy(args.strategyId)!;
  const account = findAccount(args.targets[0].accountId)!;
  return {
    id: args.id,
    name: args.name,
    mode: args.mode ?? "preset",
    strategyId: args.strategyId,
    objective: s.objective,
    targets: args.targets,
    distribution: args.distribution ?? "fill-first",
    audienceLabel: "Broad · 18–45 · all genders",
    catalogueId: null,
    productSetId: null,
    budgetPerAdSet: s.budgetPerAdSet,
    adType: "single-image",
    creatives: [
      { id: "cr_seed_1", name: "Acme — Hero static", type: "single-image", source: "library", assetId: "cr_acme_hero" },
    ],
    structure: { ...s.structure },
    allocation: "distribute",
    creativeSlotMap: {},
    destinationUrl: "https://example.com/shop",
    displayLink: null,
    utmTemplate: "utm_source=facebook&utm_medium=paid&utm_campaign={{campaign}}&utm_content={{adset}}",
    specialAdCategories: [],
    namingPattern: "{brand}_{strategy}_{objective}_{date}",
    templateId: null,
    scheduledFor: args.scheduledFor ?? null,
    createdAt: iso((args.updatedAtMsAgo ?? HOUR) + HOUR),
    updatedAt: iso(args.updatedAtMsAgo ?? HOUR),
  };
}

/** Seed Targeting Templates (saved configs, applied to new plans). */
export const MOCK_TEMPLATES: LaunchTemplate[] = [
  {
    id: "tpl_broad_prospecting",
    name: "Broad Prospecting — Sales",
    strategyId: "bruno",
    objective: "sales",
    audienceLabel: "Broad · 18–45 · all genders",
    budgetPerAdSet: 1,
    distribution: "fill-first",
    specialAdCategories: [],
    createdAt: iso(9 * DAY),
  },
  {
    id: "tpl_lookalike_scale",
    name: "Lookalike 1% — ASC Scaling",
    strategyId: "asc-scaling",
    objective: "sales",
    audienceLabel: "Lookalike 1% (Purchasers) · 18–54",
    budgetPerAdSet: 500,
    distribution: "fill-first",
    specialAdCategories: [],
    createdAt: iso(15 * DAY),
  },
  {
    id: "tpl_engagement_proof",
    name: "Engagement — Social Proofing",
    strategyId: "social-proofing",
    objective: "engagement",
    audienceLabel: "Broad · 18–35 · India metros",
    budgetPerAdSet: 8,
    distribution: "fill-first",
    specialAdCategories: [],
    createdAt: iso(20 * DAY),
  },
];

/** In-progress drafts (autosaved, resumable). */
export const MOCK_DRAFTS: LaunchPlan[] = [
  makePlan({
    id: "draft_mama_winter",
    name: "Mamaearth winter SKU test",
    strategyId: "phase-audience",
    mode: "custom",
    targets: [makeTarget("act_mamaearth", "pg_mama_skin")],
    updatedAtMsAgo: 26 * HOUR,
  }),
  makePlan({
    id: "draft_acme_bruno",
    name: "Acme — Bruno spray",
    strategyId: "bruno",
    mode: "quick",
    targets: [makeTarget("act_acme_us", "pg_acme_store")],
    updatedAtMsAgo: 3 * DAY,
  }),
];

/**
 * Seed runs the service materializes at init. `created`/`failed` describe the
 * desired outcome split; the service builds the unit list + marks statuses so
 * the accounting always reconciles (created + failed + pending = requested).
 */
export interface SeedRunSpec {
  plan: LaunchPlan;
  status: LaunchRunStatus;
  created: number;
  failed: number;
  startedMsAgo?: number;
  completedMsAgo?: number;
}

export const MOCK_SEED_RUNS: SeedRunSpec[] = [
  {
    // Live: actively launching — resumes ticking when a screen mounts.
    plan: makePlan({
      id: "plan_live",
      name: "Bruno spray — Acme Store",
      strategyId: "bruno",
      mode: "quick",
      targets: [makeTarget("act_acme_us", "pg_acme_store")],
      updatedAtMsAgo: 21 * MIN,
    }),
    status: "launching",
    created: 37,
    failed: 2,
    startedMsAgo: 20 * MIN,
  },
  {
    // Partial: done with failures — Retry-failed-only is demoable immediately.
    plan: makePlan({
      id: "plan_partial",
      name: "Bruno relaunch — Mamaearth",
      strategyId: "bruno",
      mode: "preset",
      targets: [makeTarget("act_mamaearth", "pg_mama_skin")],
      updatedAtMsAgo: 2 * HOUR,
    }),
    status: "partial",
    created: 48,
    failed: 2,
    startedMsAgo: 2 * HOUR + 5 * MIN,
    completedMsAgo: 2 * HOUR,
  },
  {
    // Completed clean.
    plan: makePlan({
      id: "plan_done",
      name: "ASC scaling — Acme Store",
      strategyId: "asc-scaling",
      mode: "preset",
      targets: [makeTarget("act_acme_us", "pg_acme_store")],
      updatedAtMsAgo: 6 * HOUR,
    }),
    status: "completed",
    created: 10,
    failed: 0,
    startedMsAgo: 6 * HOUR + 4 * MIN,
    completedMsAgo: 6 * HOUR,
  },
  {
    // Scheduled for the future.
    plan: makePlan({
      id: "plan_sched",
      name: "Phase-audience test — Noise",
      strategyId: "phase-audience",
      mode: "custom",
      targets: [makeTarget("act_noise", "pg_noise")],
      scheduledFor: isoIn(DAY),
      updatedAtMsAgo: 8 * HOUR,
    }),
    status: "scheduled",
    created: 0,
    failed: 0,
  },
];

/** Run id for a seed plan id (stable). */
export const SEED_RUN_ID: Record<string, string> = {
  plan_live: "rn_live",
  plan_partial: "rn_partial",
  plan_done: "rn_done",
  plan_sched: "rn_sched",
};
