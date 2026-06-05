import type {
  ActivityEntry,
  AdAccount,
  BusinessManager,
  Catalog,
  CopySet,
  CreativeAsset,
  DraftSummary,
  LaunchSummary,
  Page,
  Pixel,
  ProductSet,
  SavedAudience,
  WinnerAd,
} from "../types";

/** Relative ISO helper so the demo always looks "fresh". */
const ago = (mins: number) => new Date(Date.now() - mins * 60_000).toISOString();

/* ───────────────────────── Business Managers + accounts ───────────────────────── */

export const businessManagers: BusinessManager[] = [
  { id: "bm_core", name: "IdeaClan Core BM" },
  { id: "bm_scale", name: "Scale Partners BM" },
];

export const accounts: AdAccount[] = [
  { id: "acc_01", name: "FabFunnel — Primary", bmId: "bm_core", currency: "USD", health: "healthy" },
  { id: "acc_02", name: "FabFunnel — Scale 2", bmId: "bm_core", currency: "USD", health: "healthy" },
  {
    id: "acc_03",
    name: "Rented — North",
    bmId: "bm_scale",
    currency: "USD",
    health: "review",
    note: "Ad account flagged for review — 1 ad pending policy decision.",
  },
  {
    id: "acc_04",
    name: "Rented — South",
    bmId: "bm_scale",
    currency: "USD",
    health: "restricted",
    note: "Account restricted: advertising disabled. Pixel inactive — recover before launching.",
  },
];

export const pages: Page[] = [
  { id: "pg_01", name: "FabFunnel Official", accountId: "acc_01", health: "healthy", adCount: 180, capLimit: 250 },
  { id: "pg_02", name: "FabFunnel Deals", accountId: "acc_01", health: "healthy", adCount: 60, capLimit: 250 },
  { id: "pg_03", name: "GlowSkin", accountId: "acc_02", health: "healthy", adCount: 240, capLimit: 250 },
  { id: "pg_04", name: "GlowSkin Clinic", accountId: "acc_02", health: "healthy", adCount: 12, capLimit: 250 },
  { id: "pg_05", name: "North Store", accountId: "acc_03", health: "review", adCount: 95, capLimit: 250 },
  { id: "pg_06", name: "South Store", accountId: "acc_04", health: "restricted", adCount: 30, capLimit: 250 },
];

export const pixels: Pixel[] = [
  { id: "px_01", name: "FabFunnel Pixel", accountId: "acc_01", status: "active", eventsLast7d: 4200 },
  { id: "px_02", name: "GlowSkin Pixel", accountId: "acc_02", status: "active", eventsLast7d: 980 },
  { id: "px_03", name: "North Pixel", accountId: "acc_03", status: "active", eventsLast7d: 120 },
  { id: "px_04", name: "South Pixel", accountId: "acc_04", status: "inactive", eventsLast7d: 0 },
];

/* ───────────────────────── Catalogue / DPA ───────────────────────── */

export const catalogs: Catalog[] = [
  { id: "cat_01", name: "FabFunnel Store", productCount: 320 },
  { id: "cat_02", name: "GlowSkin Catalog", productCount: 88 },
];

export const productSets: ProductSet[] = [
  { id: "ps_01", catalogId: "cat_01", name: "Best Sellers", productCount: 40 },
  { id: "ps_02", catalogId: "cat_01", name: "New Arrivals", productCount: 25 },
  { id: "ps_03", catalogId: "cat_02", name: "Hero SKUs", productCount: 12 },
];

/* ───────────────────────── Audiences ───────────────────────── */

export const savedAudiences: SavedAudience[] = [
  { id: "aud_01", name: "Purchasers 180d — LAL 1%", type: "lal", size: 2_100_000, detail: "Lookalike of 180-day purchasers" },
  { id: "aud_02", name: "Add-to-cart 30d", type: "custom", size: 340_000, detail: "Retargeting pool" },
  { id: "aud_03", name: "Broad — US 18-65", type: "broad", size: 28_000_000, detail: "No detailed targeting" },
  { id: "aud_04", name: "Skincare interest stack", type: "interest", size: 5_400_000 },
  { id: "aud_05", name: "SMKD Prospecting", type: "saved", size: 1_200_000 },
];

/* ───────────────────────── Creative assets (library source) ───────────────────────── */

const img = (seed: string) => `https://picsum.photos/seed/${seed}/480/600`;

export const creativeAssets: CreativeAsset[] = [
  { id: "cr_01", name: "Serum hero 4:5", kind: "image", thumbUrl: img("fab-serum"), source: "library", ratio: "4:5" },
  { id: "cr_02", name: "UGC unboxing 9:16", kind: "video", thumbUrl: img("fab-ugc"), source: "library", ratio: "9:16" },
  { id: "cr_03", name: "Before / after", kind: "image", thumbUrl: img("fab-ba"), source: "library", ratio: "1:1" },
  { id: "cr_04", name: "Testimonial reel", kind: "video", thumbUrl: img("fab-testi"), source: "drive", ratio: "9:16" },
  { id: "cr_05", name: "Bundle flatlay", kind: "image", thumbUrl: img("fab-bundle"), source: "folder", ratio: "4:5" },
  { id: "cr_06", name: "Founder story", kind: "video", thumbUrl: img("fab-founder"), source: "reports", ratio: "9:16" },
];

export const defaultCopy: CopySet = {
  primaryText: "Glow that lasts. Dermatologist-tested, clinically proven — see results in 14 days.",
  headline: "Meet your new skincare ritual",
  description: "Free shipping over $40",
  cta: "Shop now",
  destinationUrl: "https://fabfunnel.example/glowskin",
};

/* ───────────────────────── Winners (NO perf metrics — ops signal only) ───────────────────────── */

export const winners: WinnerAd[] = [
  { id: "win_01", name: "Serum hero — broad", adType: "image", thumbUrl: img("win-1"), strategy: "bruno", lastLaunchedAt: ago(60 * 26), relaunchCount: 7, proven: true },
  { id: "win_02", name: "UGC unboxing", adType: "video", thumbUrl: img("win-2"), strategy: "asc", lastLaunchedAt: ago(60 * 50), relaunchCount: 5, proven: true },
  { id: "win_03", name: "Before / after carousel", adType: "carousel", thumbUrl: img("win-3"), strategy: "duplication", lastLaunchedAt: ago(60 * 8), relaunchCount: 12, proven: true },
  { id: "win_04", name: "Testimonial reel", adType: "video", thumbUrl: img("win-4"), strategy: "socialproof", lastLaunchedAt: ago(60 * 120), relaunchCount: 3, proven: true },
  { id: "win_05", name: "Bundle offer", adType: "collection", thumbUrl: img("win-5"), strategy: "bidcap", lastLaunchedAt: ago(60 * 200), relaunchCount: 2, proven: false },
  { id: "win_06", name: "Founder story", adType: "video", thumbUrl: img("win-6"), strategy: "tg", lastLaunchedAt: ago(60 * 14), relaunchCount: 4, proven: true },
];

/* ───────────────────────── Recent launches (mixed status) ───────────────────────── */

export const launches: LaunchSummary[] = [
  {
    id: "ln_01", name: "GlowSkin — Bruno broad", strategy: "bruno", objective: "sales",
    status: "launching", createdAt: ago(6), createdBy: "Maalik",
    counts: { campaigns: 1, adsets: 50, ads: 50 },
    progress: { total: 50, created: 38, failed: 2, pending: 10 }, accountSpan: 1,
  },
  {
    id: "ln_02", name: "FabFunnel — ASC scale", strategy: "asc", objective: "sales",
    status: "complete", createdAt: ago(90), createdBy: "Maalik",
    counts: { campaigns: 1, adsets: 1, ads: 6 },
    progress: { total: 6, created: 6, failed: 0, pending: 0 }, accountSpan: 1,
  },
  {
    id: "ln_03", name: "North — Bid-cap CPA", strategy: "bidcap", objective: "sales",
    status: "partial", createdAt: ago(180), createdBy: "Aman",
    counts: { campaigns: 1, adsets: 5, ads: 10 },
    progress: { total: 10, created: 7, failed: 3, pending: 0 }, accountSpan: 1,
  },
  {
    id: "ln_04", name: "South — Social proof", strategy: "socialproof", objective: "engagement",
    status: "rejected", createdAt: ago(320), createdBy: "Aman",
    counts: { campaigns: 1, adsets: 1, ads: 1 },
    progress: { total: 1, created: 0, failed: 1, pending: 0 }, accountSpan: 1,
  },
  {
    id: "ln_05", name: "FabFunnel — TG prospecting", strategy: "tg", objective: "leads",
    status: "complete", createdAt: ago(1440), createdBy: "Maalik",
    counts: { campaigns: 1, adsets: 3, ads: 3 },
    progress: { total: 3, created: 3, failed: 0, pending: 0 }, accountSpan: 2,
  },
];

/* ───────────────────────── Drafts (autosaved) ───────────────────────── */

export const drafts: DraftSummary[] = [
  { id: "dr_01", name: "Untitled — Bruno", strategy: "bruno", step: 4, updatedAt: ago(12) },
  { id: "dr_02", name: "Q3 GlowSkin push", strategy: "phasewise", step: 3, updatedAt: ago(75) },
  { id: "dr_03", name: "Duplication — winners", strategy: "duplication", step: 2, updatedAt: ago(240) },
  { id: "dr_04", name: "Untitled launch", strategy: null, step: 2, updatedAt: ago(2880) },
];

/* ───────────────────────── Activity log ───────────────────────── */

export const activity: ActivityEntry[] = [
  { id: "ac_01", ts: ago(6), user: "Maalik", action: "started launch", launchId: "ln_01", launchName: "GlowSkin — Bruno broad", detail: "50 ad sets · broad · $1/day", status: "ok" },
  { id: "ac_02", ts: ago(7), user: "system", action: "ad failed", launchId: "ln_01", launchName: "GlowSkin — Bruno broad", detail: "2 ads failed — transient API error, retryable", status: "warn" },
  { id: "ac_03", ts: ago(88), user: "Maalik", action: "launched", launchId: "ln_02", launchName: "FabFunnel — ASC scale", detail: "6/6 ads created", status: "ok" },
  { id: "ac_04", ts: ago(170), user: "Aman", action: "retried failed", launchId: "ln_03", launchName: "North — Bid-cap CPA", detail: "retried 3 failed ads — 0 recovered", status: "warn" },
  { id: "ac_05", ts: ago(178), user: "Aman", action: "launched", launchId: "ln_03", launchName: "North — Bid-cap CPA", detail: "7/10 ads created", status: "warn" },
  { id: "ac_06", ts: ago(320), user: "Aman", action: "ad rejected", launchId: "ln_04", launchName: "South — Social proof", detail: "Page restricted — sent to Account-Health", status: "error" },
  { id: "ac_07", ts: ago(1438), user: "Maalik", action: "launched", launchId: "ln_05", launchName: "FabFunnel — TG prospecting", detail: "3/3 ads created across 2 accounts", status: "ok" },
  { id: "ac_08", ts: ago(1500), user: "Maalik", action: "edited targeting", launchId: "ln_05", launchName: "FabFunnel — TG prospecting", detail: "Swapped audience → SMKD Prospecting", status: "ok" },
  { id: "ac_09", ts: ago(2880), user: "Maalik", action: "saved draft", detail: "Untitled launch — step 2", status: "ok" },
  { id: "ac_10", ts: ago(4320), user: "Aman", action: "connected account", detail: "Added Rented — North to Scale Partners BM", status: "ok" },
];

/* ───────────────────────── Targeting / copy templates ───────────────────────── */

export interface LaunchTemplate {
  id: string;
  name: string;
  kind: "targeting" | "copy" | "strategy";
  detail: string;
}

export const templates: LaunchTemplate[] = [
  { id: "tpl_01", name: "US Broad — Sales", kind: "targeting", detail: "US · 18-65 · all placements · Advantage+" },
  { id: "tpl_02", name: "Skincare Interest Stack", kind: "targeting", detail: "Skincare + beauty interests, 5.4M" },
  { id: "tpl_03", name: "GlowSkin — house copy", kind: "copy", detail: "Primary + 3 headline variants" },
  { id: "tpl_04", name: "Bruno default", kind: "strategy", detail: "50 × 1 × $1 broad" },
];

/* ───────────────────────── Naming convention (settings) ───────────────────────── */

export const namingConvention = {
  campaign: "{brand}_{objective}_{strategy}_{date}",
  adset: "{audience}_{placement}_{budget}",
  ad: "{creative}_{ratio}_{variant}",
};
