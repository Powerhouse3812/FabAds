/**
 * Industry Insights Dashboard — deterministic fixture corpus.
 *
 * Single source of data for the dashboard at `/insights/overview`. Every
 * component and selector reads `getDashboardFixture(state)` and nothing else.
 * Prototype data only: no network, no Supabase, no writes.
 *
 * ── DETERMINISM RULE (non-negotiable) ─────────────────────────────────────
 *  1. NO `Math.random()`. All variance comes from `hashString` (FNV-1a) over
 *     a descriptive string key. Same key ⇒ same number, forever, for every
 *     viewer and every re-render.
 *  2. NO ad-hoc `new Date()`. There is exactly ONE clock read in this file:
 *     `NOW_MS`, bucketed to the start of the local day. All dates and
 *     day-offsets are arithmetic off it, so labels cannot drift mid-session.
 *  3. Fixtures are memoised per state, so repeated calls are cheap AND
 *     reference-identical.
 *  4. Data only. No JSX, no React, no tokens, no colours in this file.
 *
 * ── TWO PROBLEMS IN THE SOURCE DATA, AND HOW WE SOLVE THEM ────────────────
 *  A. `InsightAd` metrics are pre-formatted DISPLAY STRINGS ("10.0K", "$200",
 *     "7 days", "500K - 1,000K"). Charts need numbers, so §3 below is a
 *     parser layer: `parseCompactNumber` / `parseMoney` / `parseDurationDays`
 *     / `parseAudienceRange`, folded into `AdNumerics` and memoised per ad.
 *  B. There is NO usable time series. The source generates `createdAt` as
 *     `Date.now() - i * 3 days`, so 800 ads span ~6.6 years and the recent
 *     weeks are nearly empty — useless for a 12-week chart. We ignore
 *     `createdAt` and synthesise `launchedDaysAgo` from a hash-seeded,
 *     recency-weighted curve (§4), which puts ~half the corpus inside the
 *     last 12 weeks.
 *
 * ── WHY SOME BANKS ARE MIRRORED HERE ─────────────────────────────────────
 * `src/lib/insights-dummy-data.ts` exports only `INSIGHT_INDUSTRIES`,
 * `INSIGHT_INTERESTS`, `TRENDING_TAGS`, `PLATFORMS`, `BRANDS`, `DUMMY_ADS`
 * and the `InsightAd` type. `DOMAINS` and `HEADLINES_BY_INTENT` are module-
 * private there, and this wave may not edit that file — so §2 mirrors both
 * verbatim. If that file's lists ever change, update the mirrors here too.
 */

import {
  BRANDS,
  DUMMY_ADS,
  INSIGHT_INDUSTRIES,
  type InsightAd,
} from "@/lib/insights-dummy-data";

// Trends teaser (§7.10 below) counts straight off the Trends newsroom's own
// mock corpus rather than a mirrored/typed-in number, so the dashboard and
// `/insights/trends` can never disagree about how many items exist. This is
// the one deliberate exception to this file's "no imports from outside the
// insights-dashboard data pipeline" instinct — see §7.10 for why.
import {
  BREAKING_STORIES,
  META_ADS,
  NEWS_ITEMS,
  OTHER_SOCIAL,
  SEARCH_DEMAND,
  TIKTOK_HOOKS,
} from "@/insights-trends/mocks/trendsData";

import type {
  AdNumerics,
  AdjacentIndustry,
  AngleKey,
  AngleMixEntry,
  AngleSlice,
  BoardHealth,
  BoardHealthItem,
  ChangeSignal,
  ChangeSignalKind,
  CoverageInfo,
  DashboardFixture,
  DashboardMeta,
  DashboardState,
  DailyBrief,
  DailyBriefFact,
  DataSourceKey,
  DataSourceStatus,
  DomainRow,
  DomainType,
  DomainTypeCounts,
  EcomPlatform,
  FollowedIndustry,
  FormatMixEntry,
  IndustryShareBrand,
  IndustryShareRow,
  KpiTile,
  LaunchCadenceWeek,
  NavSurfaceCount,
  NavSurfaceKey,
  PageRow,
  LongRunnerAd,
  LongRunnerTier,
  Mover,
  MyBrand,
  ProvenanceTier,
  SetupChecklistItem,
  ShareOfVoiceRow,
  StalenessInfo,
  StalenessLevel,
  TrackerValue,
  TrendsSourceCount,
  TrendsSourceKey,
  TrendsSummary,
  WatchItem,
  WatchStatus,
  WatchlistHealth,
} from "./types";

// ═════════════════════════════════════════════════════════════════════════
// §1  Determinism primitives
// ═════════════════════════════════════════════════════════════════════════

/**
 * FNV-1a 32-bit string hash, returned as a positive 31-bit int.
 * Mirrors the precedent in `src/lib/reports-dummy-data.ts`.
 */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 2147483646) + 1;
}

/** Lehmer / Park-Miller PRNG. Deterministic stream from an integer seed. */
export function seededRandom(seed: number): () => number {
  let s = Math.floor(seed) % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Deterministic float in [0, 1) from any string key.
 *
 * NOTE the avalanche step. Raw FNV-1a over near-identical sequential keys
 * ("launch|dummy-ad-1" … "launch|dummy-ad-800") is badly non-uniform once you
 * scale it to a float — measured deciles came out 125/106/111/91/82/56/43/58/
 * 38/90 instead of ~80 each, which visibly warped the weekly cadence buckets.
 * The Murmur3 `fmix32` finalizer below flattens that to within a few percent.
 * `hashString` itself is left alone because it is also used for stable
 * ordering, where only consistency matters.
 */
export function rand01(key: string): number {
  let h = hashString(key) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Deterministic integer in [min, max] inclusive. */
export function randInt(key: string, min: number, max: number): number {
  if (max <= min) return min;
  return min + Math.min(max - min, Math.floor(rand01(key) * (max - min + 1)));
}

/** Deterministic float in [min, max). */
export function randFloat(key: string, min: number, max: number): number {
  return min + rand01(key) * (max - min);
}

/** Deterministic pick from a list. */
export function randPick<T>(key: string, arr: readonly T[]): T {
  return arr[randInt(key, 0, arr.length - 1)];
}

/** Deterministic true/false at the given probability. */
export function randBool(key: string, probability: number): boolean {
  return rand01(key) < probability;
}

/**
 * Deterministic sample of `count` distinct items — a hash-seeded Fisher-Yates
 * over indices, then take the head.
 */
export function randSample<T>(key: string, pool: readonly T[], count: number): T[] {
  if (pool.length <= count) return [...pool];
  const rand = seededRandom(hashString(key));
  const idx = pool.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = idx[i];
    idx[i] = idx[j];
    idx[j] = t;
  }
  return idx.slice(0, count).map((i) => pool[i]);
}

// ── The one clock read ───────────────────────────────────────────────────

const DAY_MS = 86_400_000;

/**
 * THE single clock read in this module, bucketed to the start of the local
 * day so every label ("Aug 29", "6 days ago") is stable for the whole
 * session. Everything else is arithmetic off this constant.
 */
export const NOW_MS: number = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
})();

export const NOW_ISO: string = new Date(NOW_MS).toISOString();

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

/** "Aug 29" for a day-offset back from NOW. Locale-independent by design. */
export function shortDateLabel(daysAgo: number): string {
  const d = new Date(NOW_MS - daysAgo * DAY_MS);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** ISO string for a day-offset back from NOW. */
export function isoDaysAgo(daysAgo: number): string {
  return new Date(NOW_MS - daysAgo * DAY_MS).toISOString();
}

/** "6h ago" / "3 days ago" / "today" — for freshness captions. */
export function relativeDayLabel(daysAgo: number): string {
  if (daysAgo <= 0) return "today";
  if (daysAgo === 1) return "yesterday";
  return `${daysAgo} days ago`;
}

// ── Small formatting helpers (display strings for KpiTile.value) ─────────

/** 20515 → "20,515". */
export function formatInt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

/** 41_200_000 → "$41.2M"; 36_200 → "$36.2K". */
export function formatUsdCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n)}`;
}

/** 2_966_300 → "2.97M"; 8_400 → "8.4K". */
export function formatCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${Math.round(n)}`;
}

// ═════════════════════════════════════════════════════════════════════════
// §2  Mirrored banks (see file header for why)
// ═════════════════════════════════════════════════════════════════════════

/**
 * Verbatim mirror of the private `DOMAINS` list in
 * `src/lib/insights-dummy-data.ts`. Index-aligned with the exported `BRANDS`,
 * so `BRANDS[i]` owns `DOMAINS[i]`.
 */
export const DOMAINS: readonly string[] = [
  "glowskin.com", "techpulse.io", "fitzone.co", "urbanstyle.com", "dataforge.dev",
  "snapbite.app", "eduverse.org", "travelnow.com", "homelux.co", "autodrive.com",
  "playcore.gg", "beautyhq.com", "sportmax.com", "finedge.io", "cloudware.dev",
  "trendline.co", "wellco.health", "gamevault.gg", "shopease.com", "learnfast.edu",
  "rideon.app", "cookjoy.co", "designlab.io", "greenpower.eco", "nimbus.app",
  "vesper.co", "ardent.io", "lumen.studio", "northwind.co", "pixelpath.io",
  "mantralabs.com", "slingshot.app", "quillandroam.com", "atlasco.com", "verdafoods.com",
  "bluetrack.io", "orbitgym.com", "hearthhome.co", "cascade.app", "helioshealth.co",
];

/**
 * Verbatim mirror of the private `HEADLINES_BY_INTENT` bank, regrouped into
 * its six intent blocks. The source list is a flat 30 in this exact order
 * (5 per intent), and every generated ad's `headline` is one of these — which
 * is why angle attribution is a lookup, never a hash.
 */
export const HEADLINES_BY_INTENT: Readonly<Record<AngleKey, readonly string[]>> = {
  question: [
    "Tired of slow tools?", "Want better skin in 30 days?", "Ready to ship faster?",
    "Lost in your data?", "Need a faster checkout?",
  ],
  stat: [
    "Trusted by 100K+ teams", "12,000+ users can't be wrong", "Save up to 40%",
    "5-star rated, 47K reviews", "Used by Fortune 500",
  ],
  urgency: [
    "Limited time — ends Sunday", "Today only", "Last 24 hours",
    "While supplies last", "48-hour drop",
  ],
  benefit: [
    "Sleep better tonight", "Read 12 books a year", "Cut reporting time 70%",
    "Earn 5.1% APY", "Free returns, always",
  ],
  curiosity: [
    "The secret pros use", "What VCs don't tell founders", "Inside the 1%'s playbook",
    "The shortcut nobody talks about", "How they do it differently",
  ],
  direct: [
    "New collection drop", "Back in stock", "Now available",
    "Just launched", "Now shipping",
  ],
};

/** Human labels for the six angles. Used in slices, tables and prose. */
export const ANGLE_LABELS: Readonly<Record<AngleKey, string>> = {
  question: "Question-led",
  stat: "Proof / stat",
  urgency: "Urgency",
  benefit: "Benefit-led",
  curiosity: "Curiosity",
  direct: "Direct / product",
};

export const ANGLE_ORDER: readonly AngleKey[] = [
  "question", "stat", "urgency", "benefit", "curiosity", "direct",
];

const HEADLINE_TO_ANGLE: Map<string, AngleKey> = (() => {
  const m = new Map<string, AngleKey>();
  for (const key of ANGLE_ORDER) {
    for (const h of HEADLINES_BY_INTENT[key]) m.set(h, key);
  }
  return m;
})();

/**
 * Resolve an ad's copy angle from its real headline. Falls back to a hash
 * only if a headline ever appears that isn't in the bank (it shouldn't).
 */
export function angleForHeadline(headline: string): AngleKey {
  const hit = HEADLINE_TO_ANGLE.get(headline);
  if (hit) return hit;
  return randPick(`angle-fallback|${headline}`, ANGLE_ORDER);
}

// ═════════════════════════════════════════════════════════════════════════
// §3  Numeric derivation layer — parsers over the display strings
// ═════════════════════════════════════════════════════════════════════════

/**
 * "10.0K" → 10000 · "$36,200" → 36200 · "2.4M" → 2400000 · "" → 0.
 * Strips `$`, commas and whitespace, then applies a K/M/B multiplier.
 */
export function parseCompactNumber(raw: string | null | undefined): number {
  if (!raw) return 0;
  const cleaned = String(raw).replace(/[$,\s]/g, "");
  const m = /^(-?\d+(?:\.\d+)?)([kmb])?$/i.exec(cleaned);
  if (!m) {
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  const base = parseFloat(m[1]);
  const suffix = (m[2] || "").toLowerCase();
  const mult = suffix === "b" ? 1e9 : suffix === "m" ? 1e6 : suffix === "k" ? 1e3 : 1;
  return Math.round(base * mult);
}

/** "$1,240" → 1240. Same engine as `parseCompactNumber`; named for intent. */
export function parseMoney(raw: string | null | undefined): number {
  return parseCompactNumber(raw);
}

/** "7 days" → 7 · "3 weeks" → 21 · "2 months" → 60 · "" → 0. */
export function parseDurationDays(raw: string | null | undefined): number {
  if (!raw) return 0;
  const s = String(raw);
  const m = /(-?\d+(?:\.\d+)?)/.exec(s);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  if (/week/i.test(s)) return Math.round(n * 7);
  if (/month/i.test(s)) return Math.round(n * 30);
  if (/year/i.test(s)) return Math.round(n * 365);
  return Math.round(n);
}

/** "500K - 1,000K" → { min: 500000, max: 1000000 }. Single value ⇒ min = max. */
export function parseAudienceRange(raw: string | null | undefined): { min: number; max: number } {
  if (!raw) return { min: 0, max: 0 };
  const parts = String(raw).split(/\s*[-–—]\s*/).filter(Boolean);
  if (parts.length === 0) return { min: 0, max: 0 };
  const min = parseCompactNumber(parts[0]);
  const max = parts.length > 1 ? parseCompactNumber(parts[1]) : min;
  return min <= max ? { min, max } : { min: max, max: min };
}

// ═════════════════════════════════════════════════════════════════════════
// §4  Synthesised recent-activity distribution
// ═════════════════════════════════════════════════════════════════════════

/** How far back the synthesised launch curve reaches. */
export const SYNTH_HORIZON_DAYS = 400;

/** Weeks in the launch-cadence chart. */
export const CADENCE_WEEKS = 12;

/** Days covered by the cadence chart. */
const CADENCE_WINDOW_DAYS = CADENCE_WEEKS * 7;

/** Share of the corpus that lands inside the 12-week window. */
const IN_WINDOW_SHARE = 0.55;

/**
 * Synthesised "launched N days ago" for one ad.
 *
 * The source `createdAt` is unusable (one ad per 3 days, back-loaded over 6.6
 * years), so we replace it with a two-part hash-seeded curve:
 *
 *  - 55% of the corpus lands inside the 12-week window, with a GENTLE recency
 *    tilt (`u^1.15`), giving roughly a 1.5× ramp from the oldest week to the
 *    newest. A steeper exponent here (we tried 2.2 over the whole horizon)
 *    piles so much into the last fortnight that the chart becomes an
 *    exponential wall and a real spike can no longer out-rank the final week.
 *  - the remaining 45% spreads over the 84→400 day tail.
 */
export function syntheticLaunchDaysAgo(adId: string): number {
  const r = rand01(`launch|${adId}`);
  if (r < IN_WINDOW_SHARE) {
    const u = r / IN_WINDOW_SHARE;
    return Math.min(
      CADENCE_WINDOW_DAYS - 1,
      Math.floor(Math.pow(u, 1.15) * CADENCE_WINDOW_DAYS),
    );
  }
  const u = (r - IN_WINDOW_SHARE) / (1 - IN_WINDOW_SHARE);
  const tail = SYNTH_HORIZON_DAYS - CADENCE_WINDOW_DAYS;
  return Math.min(
    SYNTH_HORIZON_DAYS - 1,
    CADENCE_WINDOW_DAYS + Math.floor(Math.pow(u, 1.6) * tail),
  );
}

const NUMERICS_CACHE = new Map<string, AdNumerics>();

/** Parse one `InsightAd`'s display strings into real numbers. */
export function deriveAdNumerics(ad: InsightAd): AdNumerics {
  const audience = parseAudienceRange(ad.estimatedAudienceSize);
  return {
    adId: ad.id,
    impressions: parseCompactNumber(ad.impressions),
    reach: parseCompactNumber(ad.reach),
    spend: parseMoney(ad.spend),
    spendTillNow: parseMoney(ad.spendTillNow),
    activeDurationDays: parseDurationDays(ad.activeDuration),
    audienceMin: audience.min,
    audienceMax: audience.max,
    audienceMid: Math.round((audience.min + audience.max) / 2),
    similarAdsCount: ad.similarAdsCount,
    launchedDaysAgo: syntheticLaunchDaysAgo(ad.id),
  };
}

/** Memoised `deriveAdNumerics` by ad id. Returns null for an unknown id. */
export function getAdNumerics(adId: string): AdNumerics | null {
  const hit = NUMERICS_CACHE.get(adId);
  if (hit) return hit;
  const ad = DUMMY_ADS.find((a) => a.id === adId);
  if (!ad) return null;
  const n = deriveAdNumerics(ad);
  NUMERICS_CACHE.set(adId, n);
  return n;
}

/** All 800 ads as numerics, computed once. */
export const ALL_AD_NUMERICS: readonly AdNumerics[] = (() => {
  const out: AdNumerics[] = [];
  for (const ad of DUMMY_ADS) {
    const n = deriveAdNumerics(ad);
    NUMERICS_CACHE.set(ad.id, n);
    out.push(n);
  }
  return out;
})();

// ═════════════════════════════════════════════════════════════════════════
// §5  Scale constants for the populated workspace
// ═════════════════════════════════════════════════════════════════════════

/** Industries in the catalogue overall (of which the user follows a few). */
export const SEEDED_INDUSTRY_COUNT = 105;

/** A signal below this many observations is not yet a trend. */
export const SIGNAL_RECURRENCE_GATE = 2;

/** Long-runner tier boundaries, in days running. See `LongRunnerTier`. */
export const LONG_RUNNER_TIER_BOUNDS = { testingMax: 20, workingMax: 45 } as const;

/** Days without new creative before a followed advertiser reads as quiet. */
export const QUIET_THRESHOLD_DAYS = 21;

/** Days running past which longevity may mean saturation, not proof. */
export const SATURATION_CAVEAT_DAYS = 90;

/**
 * Brands followed in the populated workspace (`insight_follows`).
 *
 * THERE IS NO FOLLOW CAP. An earlier version of this file invented a 25-slot
 * limit and every caption on the page repeated it; the product has no such
 * limit, so the constant is gone and no wording refers to slots.
 *
 * The number is also the real length of `watchlist.items` — the tile says
 * "12 followed" because twelve rows exist, not because twelve was typed in.
 */
export const POPULATED_BRANDS_FOLLOWED = 12;

/**
 * Competitors followed in the populated workspace (`insight_competitors`) —
 * the followed brands you also track as competitors.
 *
 * Deliberately much smaller than `POPULATED_BRANDS_FOLLOWED`: these are two
 * different lists in FabAds, and the tracked-competitor list is the short one.
 * This set is the ONLY source of the `tracked` / `followed` flags on domain,
 * page and mover rows, so "Competitors followed" and every follow pill on the
 * page count the same thing.
 */
export const POPULATED_COMPETITORS_FOLLOWED = 6;

/**
 * The six followed industries in the populated state. All six are real values
 * in `INSIGHT_INDUSTRIES`, so a Discover `?industry=` deep-link resolves.
 * Their `indexedAds` sum to exactly 20,515 and `advertisers` to exactly 1,063
 * — the headline scale for the whole page.
 *
 * The SET is not arbitrary. The source generator assigns headlines as
 * `HEADLINES_BY_INTENT[(11i + 5) % 30]` while assigning industry as
 * `i % 15` — and because 30 = 2 × 15, every industry can only ever draw TWO
 * of the thirty headlines, i.e. at most two copy angles. A six-industry set
 * picked on vibes leaves two of the six angles at literally zero ads, which
 * makes the angle-mix block look broken. This set is chosen so the six
 * industries' headline pairs cover all six angles:
 *
 *   E-commerce → stat + curiosity      Fashion          → question + benefit
 *   Beauty     → benefit + question    Food & Beverage  → urgency  + direct
 *   Health & W → stat + curiosity      Finance          → benefit  + question
 *
 * If you change this list, re-check angle coverage or slices will go to 0.
 */
export const POPULATED_FOLLOWED: readonly FollowedIndustry[] = [
  { industry: "E-commerce",        indexedAds: 6420, advertisers: 318, lastScanDaysAgo: 0, scanState: "indexed" },
  { industry: "Beauty",            indexedAds: 4180, advertisers: 224, lastScanDaysAgo: 0, scanState: "indexed" },
  { industry: "Health & Wellness", indexedAds: 3905, advertisers: 196, lastScanDaysAgo: 0, scanState: "indexed" },
  { industry: "Fashion",           indexedAds: 2760, advertisers: 141, lastScanDaysAgo: 1, scanState: "indexed" },
  { industry: "Finance",           indexedAds: 1890, advertisers: 102, lastScanDaysAgo: 1, scanState: "indexed" },
  { industry: "Food & Beverage",   indexedAds: 1360, advertisers: 82,  lastScanDaysAgo: 2, scanState: "indexed" },
];

export const POPULATED_INDUSTRY_NAMES: readonly string[] =
  POPULATED_FOLLOWED.map((f) => f.industry);

export const POPULATED_LIVE_ADS = POPULATED_FOLLOWED.reduce((s, f) => s + f.indexedAds, 0); // 20,515

/** Domain universe. Sums to 1,063. */
export const POPULATED_DOMAIN_COUNTS: DomainTypeCounts = {
  ecom: 812,
  affiliate: 174,
  leadgen: 52,
  ppc: 18,
  telehealth: 7,
  total: 1063,
};

export const EMPTY_DOMAIN_COUNTS: DomainTypeCounts = {
  ecom: 0, affiliate: 0, leadgen: 0, ppc: 0, telehealth: 0, total: 0,
};

export const POPULATED_NEW_SIGNALS = 34;

/** StoreLeads modelled monthly sales across the 812 ecom domains. USD. */
export const POPULATED_EST_ECOM_SALES = 41_200_000;

const EXTENSION_URL = "https://chromewebstore.google.com/detail/fabads-insights";

// ═════════════════════════════════════════════════════════════════════════
// §5b  Source health + freshness
//
// This page's whole claim is that its numbers are honest about where they
// came from and how fresh they are. Every wording lives here exactly once,
// so a KPI tile and a table cell can never disagree about why the same
// figure is missing.
//
// The `error` state (a partial source failure, 3-day-old "last complete
// scan") has been REMOVED — see `DashboardState` in `./types.ts`. Nothing
// here fails any more; a source is either `ok` or `pending`. What remains is
// the honest "we haven't scanned this yet" story for `firstTime` / `empty` /
// `loading`, via `sourcesPending`, and `naReasonByTier` in `./selectors.ts`
// still reads it for real blocks.
// ═════════════════════════════════════════════════════════════════════════

/** Data this many days old (or older) is called stale, plainly, at the top. */
export const STALE_AFTER_DAYS = 2;

/** Data this many days old gets a caption, not a banner. */
export const AGING_AFTER_DAYS = 1;

/** Fixed render order for the source list. Observed → estimated → derived. */
export const DATA_SOURCE_ORDER: readonly DataSourceKey[] = [
  "meta-ad-library",
  "storeleads",
  "fabads-scan",
];

/** Display names. Print these, never the key. */
export const DATA_SOURCE_NAMES: Readonly<Record<DataSourceKey, string>> = {
  "meta-ad-library": "Meta Ad Library",
  storeleads: "StoreLeads",
  "fabads-scan": "FabAds scan history",
};

/** One source per provenance tier — the mapping the whole page leans on. */
export const DATA_SOURCE_TIERS: Readonly<Record<DataSourceKey, ProvenanceTier>> = {
  "meta-ad-library": "observed",
  storeleads: "estimated",
  "fabads-scan": "derived",
};

/** Which tier each source feeds, in words, for a source-list caption. */
export const DATA_SOURCE_SUPPLIES: Readonly<Record<DataSourceKey, string>> = {
  "meta-ad-library":
    "Live ads, advertisers, formats and start dates — everything marked Observed.",
  storeleads:
    "Modelled storefront sales and visits — everything marked Estimated.",
  "fabads-scan":
    "Lifespans, week-over-week deltas and change signals, computed by comparing consecutive scans — everything marked Derived.",
};

/** Reasons a figure is blank while we are still waiting, one per source. */
const PENDING_NA_REASON: Readonly<Record<DataSourceKey, string>> = {
  "meta-ad-library": "waiting on the Meta Ad Library",
  storeleads: "waiting on StoreLeads",
  "fabads-scan": "waiting for this scan to finish",
};

/** Assemble one source row, filling name / tier / supplies from the tables. */
function source(
  key: DataSourceKey,
  fields: Omit<DataSourceStatus, "key" | "name" | "tier" | "supplies">,
): DataSourceStatus {
  return {
    key,
    name: DATA_SOURCE_NAMES[key],
    tier: DATA_SOURCE_TIERS[key],
    supplies: DATA_SOURCE_SUPPLIES[key],
    ...fields,
  };
}

/** All three sources answering. */
function sourcesHealthy(): DataSourceStatus[] {
  return [
    source("meta-ad-library", {
      state: "ok",
      lastSuccessDaysAgo: 0,
      lastSuccessLabel: "Answered on the last run, 6h ago",
    }),
    source("storeleads", {
      state: "ok",
      lastSuccessDaysAgo: 0,
      lastSuccessLabel: "Answered on the last run, 6h ago",
    }),
    source("fabads-scan", {
      state: "ok",
      lastSuccessDaysAgo: 0,
      lastSuccessLabel: "Recomputed on the last run, 6h ago",
    }),
  ];
}

/**
 * Nothing has come back yet, and that is not a failure — it is `pending`.
 * There is no `failed` any more: a day-1 workspace never reads as broken.
 */
function sourcesPending(labels: Readonly<Record<DataSourceKey, string>>, notes: Readonly<Record<DataSourceKey, string>>, reasons: Readonly<Record<DataSourceKey, string>> = PENDING_NA_REASON): DataSourceStatus[] {
  return DATA_SOURCE_ORDER.map((key) =>
    source(key, {
      state: "pending",
      lastSuccessDaysAgo: null,
      lastSuccessLabel: labels[key],
      failureNote: notes[key],
      naReason: reasons[key],
    }),
  );
}

/** Threshold rule in ONE place. */
function stalenessLevelFor(ageDays: number | null): StalenessLevel {
  if (ageDays === null) return "unknown";
  if (ageDays >= STALE_AFTER_DAYS) return "stale";
  if (ageDays >= AGING_AFTER_DAYS) return "aging";
  return "fresh";
}

function buildStaleness(ageDays: number | null, label: string, note: string): StalenessInfo {
  const level = stalenessLevelFor(ageDays);
  return {
    level,
    ageDays,
    isStale: level === "stale",
    staleAfterDays: STALE_AFTER_DAYS,
    label,
    note,
  };
}

// ═════════════════════════════════════════════════════════════════════════
// §6  Corpus indices
// ═════════════════════════════════════════════════════════════════════════

/** `BRANDS[i]` ↔ `DOMAINS[i]`. */
export const BRAND_DOMAIN_PAIRS: readonly { brand: string; domain: string }[] =
  BRANDS.map((brand, i) => ({ brand, domain: DOMAINS[i % DOMAINS.length] }));

const DOMAIN_TO_BRAND: Map<string, string> = new Map(
  BRAND_DOMAIN_PAIRS.map((p) => [p.domain, p.brand]),
);

/**
 * A brand's REAL industry, keyed by its domain.
 *
 * The source generator assigns brand as `i % 40` and industry as `i % 15`
 * independently, so the same domain turns up under three unrelated industries
 * and inherits three unrelated copy banks. On screen that produced things like
 * "OrbitGym — Meal kits delivered weekly" and "BlueTrack — Sustainable
 * cashmere", which reads as broken to anyone who looks at two cards.
 *
 * Every domain therefore gets ONE industry here, read off the brand name.
 * `industryForDomain` is the only accessor, so fixing it here fixes the
 * watchlist, the movers table, the domain table, share-of-voice leaders, the
 * change feed and the long-runner gallery in one move. This does not edit the
 * shared `insights-dummy-data.ts` — the feed and every other surface are
 * untouched.
 *
 * The six followed industries all keep enough domains to fill their blocks:
 * E-commerce 4 · Beauty 3 · Health & Wellness 5 · Fashion 2 · Finance 2 ·
 * Food & Beverage 3. Share-of-voice needs three leaders in Beauty,
 * E-commerce and Health & Wellness — all satisfied.
 */
export const DOMAIN_INDUSTRY: Readonly<Record<string, string>> = {
  "glowskin.com": "Beauty",
  "techpulse.io": "Technology",
  "fitzone.co": "Health & Wellness",
  "urbanstyle.com": "Fashion",
  "dataforge.dev": "SaaS",
  "snapbite.app": "Food & Beverage",
  "eduverse.org": "Education",
  "travelnow.com": "Travel",
  "homelux.co": "Real Estate",
  "autodrive.com": "Automotive",
  "playcore.gg": "Gaming",
  "beautyhq.com": "Beauty",
  "sportmax.com": "Sports",
  "finedge.io": "Finance",
  "cloudware.dev": "SaaS",
  "trendline.co": "Fashion",
  "wellco.health": "Health & Wellness",
  "gamevault.gg": "Gaming",
  "shopease.com": "E-commerce",
  "learnfast.edu": "Education",
  "rideon.app": "Automotive",
  "cookjoy.co": "Food & Beverage",
  "designlab.io": "SaaS",
  "greenpower.eco": "Technology",
  "nimbus.app": "SaaS",
  "vesper.co": "Beauty",
  "ardent.io": "Finance",
  "lumen.studio": "Entertainment",
  "northwind.co": "Travel",
  "pixelpath.io": "Technology",
  "mantralabs.com": "Health & Wellness",
  "slingshot.app": "Gaming",
  "quillandroam.com": "E-commerce",
  "atlasco.com": "E-commerce",
  "verdafoods.com": "Food & Beverage",
  "bluetrack.io": "SaaS",
  "orbitgym.com": "Health & Wellness",
  "hearthhome.co": "E-commerce",
  "cascade.app": "Travel",
  "helioshealth.co": "Health & Wellness",
};

/**
 * Fallback only: a domain's most frequent industry in the corpus, tie-broken
 * by first appearance. Used for any domain missing from `DOMAIN_INDUSTRY`.
 */
const DOMAIN_TO_INDUSTRY: Map<string, string> = (() => {
  const tally = new Map<string, Map<string, number>>();
  for (const ad of DUMMY_ADS) {
    let inner = tally.get(ad.domain);
    if (!inner) { inner = new Map(); tally.set(ad.domain, inner); }
    inner.set(ad.industry, (inner.get(ad.industry) ?? 0) + 1);
  }
  const out = new Map<string, string>();
  tally.forEach((inner, domain) => {
    let best = "";
    let bestN = -1;
    inner.forEach((n, industry) => {
      if (n > bestN) { bestN = n; best = industry; }
    });
    out.set(domain, best);
  });
  return out;
})();

export function industryForDomain(domain: string): string {
  return DOMAIN_INDUSTRY[domain] ?? DOMAIN_TO_INDUSTRY.get(domain) ?? INSIGHT_INDUSTRIES[0];
}

export function brandForDomain(domain: string): string {
  return DOMAIN_TO_BRAND.get(domain) ?? domain.split(".")[0];
}

/**
 * Verbatim mirror of the private `PRIMARY_TEXT_BY_INDUSTRY` bank in
 * `src/lib/insights-dummy-data.ts` — the third mirror in this file, for the
 * reason given in the header (that module exports neither it nor `DOMAINS`,
 * and this wave may not edit it).
 *
 * Harvesting it from `DUMMY_ADS` instead does NOT work, and the reason is
 * worth recording: the generator picks copy as `variants[(i*7+3) % 5]` while
 * assigning industry as `i % 15`. Every ad in one industry shares `i mod 5`,
 * so the modulo is constant — each industry emits exactly ONE of its five
 * lines across all 800 ads. A harvested bank has one entry per industry and
 * four Health & Wellness cards all say "Better sleep starts tonight."
 */
const COPY_BY_INDUSTRY: Readonly<Record<string, readonly string[]>> = {
  "E-commerce": [
    "Best-sellers everyone's talking about. Free shipping on orders over $50.",
    "Up to 40% off — our biggest sale of the season. Ends Sunday.",
    "New arrivals just dropped. Shop before they're gone.",
    "The bag that's been on every waitlist this year. Back in stock — limited drop.",
    "Premium quality, honest pricing. No middlemen, no markups.",
  ],
  "SaaS": [
    "Cut your reporting time by 70%. Try the dashboard free for 14 days, no card needed.",
    "Used by 12,000+ teams to ship faster. Replaces 6 tools for the price of one.",
    "Stop juggling tools. One platform, all your customer data — fully integrated.",
    "From spreadsheet chaos to clean dashboards in under 10 minutes.",
    "Stripe, Shopify, HubSpot — connect them all and finally see the full picture.",
  ],
  "Gaming": [
    "The most addictive puzzle game of 2026. Free to play, no pay-to-win.",
    "Build your empire — millions are already playing. Free download, optional purchases.",
    "Real-time strategy meets card battling. Drop in, three minutes to a match.",
    "Compete in seasonal tournaments. New maps drop every Friday.",
    "Casual on the surface, deep underneath. The pros recommend it for a reason.",
  ],
  "Health & Wellness": [
    "Personalized supplements built around your DNA. Skin, energy, sleep — covered.",
    "12-week transformation backed by science. 87% of users hit their goal.",
    "The mindfulness app trusted by 500K+ users. 10 minutes a day is all it takes.",
    "Daily protein, the way pros take it. No bloat, no aftertaste.",
    "Better sleep starts tonight. Backed by clinical research.",
  ],
  "Finance": [
    "Earn 5.1% APY on your savings — no minimums, no fees, no nonsense.",
    "The credit card that pays you back. 2% on everything, 5% on rotating categories.",
    "Investing made simple. Start with as little as $5, no advisor required.",
    "Tax filing in 12 minutes. Get your refund up to 5 days early.",
    "Set it once, save automatically. The smarter way to build your safety net.",
  ],
  "Fashion": [
    "The dress that breaks the internet — back in stock for 48 hours.",
    "Made for movement. Built to last. Free returns within 30 days.",
    "Premium denim. Honest prices. The fit you've been chasing.",
    "Sustainable cashmere at a fraction of luxury brand prices.",
    "Curated by stylists. Delivered to your door. Keep what you love.",
  ],
  "Food & Beverage": [
    "Meal kits delivered weekly. Skip whenever, cancel anytime.",
    "The high-protein snack everyone's reaching for. 12g protein, 4g sugar.",
    "Organic coffee, shipped fresh from family farms. Try 3 roasts for $1.",
    "Plant-based, chef-developed. Eat better without thinking about it.",
    "The cookware your grandparents would have used — built to outlive trends.",
  ],
  "Education": [
    "Learn to code in 30 days — even if you've never written a line.",
    "Master a new skill in 15 minutes a day. Self-paced, no deadlines.",
    "From beginner to conversational fluency. The fastest way to learn a language.",
    "Real classes, real instructors. Get certified, get hired.",
    "Math finally clicks when it's taught like this. Risk-free 7-day trial.",
  ],
  "Travel": [
    "Hidden gems, vetted hotels, best price guaranteed. Travel without the FOMO.",
    "Plan your dream trip in under 5 minutes. Powered by AI, vetted by humans.",
    "Insider tips for the destinations on your list. From people who actually live there.",
    "Round-trip flights at last-minute prices, weeks in advance.",
    "The local experiences travel blogs don't tell you about.",
  ],
  "Real Estate": [
    "Find your next home — without the 3% agent fee.",
    "Off-market listings before they hit the MLS. Buyer's edge, built in.",
    "Rent smarter. Search by what actually matters — commute, daylight, deal-breakers.",
    "Down-payment savings, automated. Your home goal is closer than you think.",
    "Tour homes virtually. Schedule in-person walkthroughs in one tap.",
  ],
  "Automotive": [
    "Compare 1000+ models. Get a fair price in minutes — no dealer haggling.",
    "The smart way to buy a used car. Every car inspected, every history known.",
    "Lease deals updated daily — see this week's hidden offers before they go.",
    "Trade-in value in 60 seconds. Get cash, not a runaround.",
    "EV ownership made easy. Charging map, tax credits, the works.",
  ],
  "Entertainment": [
    "Unlimited streaming. Cancel anytime, no questions asked.",
    "The shows everyone's binging this week. New drops every Friday.",
    "Live concerts, no ticket scalpers. Real seats, real prices.",
    "The best of indie cinema, curated and ad-free.",
    "Audiobooks + podcasts, one subscription. 20,000+ titles included.",
  ],
  "Beauty": [
    "Skincare that actually works — backed by 47,000 5-star reviews.",
    "Customized for your skin. Built in 30 seconds, shipped in 3 days.",
    "Salon-grade results at home. The tool stylists are quietly switching to.",
    "Clean ingredients, real results. No greenwashing, no nonsense.",
    "The serum that's been on every dermatologist's recommendation list this year.",
  ],
  "Sports": [
    "Train with the pros. Get the gear they use, at the price they don't pay.",
    "The fitness tracker that does more — coaching, recovery, sleep, the lot.",
    "Performance gear, tested by athletes, priced for everyone.",
    "Run faster, recover smarter. The shoe biomechanists keep talking about.",
    "Adventure gear for the trips you've been planning.",
  ],
  "Technology": [
    "The laptop everyone's talking about — finally back in stock. Limited inventory.",
    "Faster Wi-Fi, fewer dropouts. Engineered for streamers and gamers who hate lag.",
    "AI-powered tools that save you 10 hours a week. 30-day free trial, no card.",
    "Privacy-first phone, no ads, no tracking, no compromise.",
    "The headphones audio engineers actually wear. Honest pricing, no hype.",
  ],
};

/**
 * First sentence of each bank line — what a gallery card actually shows.
 *
 * Lines whose opening sentence contains "AI" are dropped: the page never
 * labels anything "AI", and a hook is rendered text like any other. (Only
 * Technology loses a line; the second sentence of the Travel entry is cut by
 * the split anyway.)
 */
const HOOKS_BY_INDUSTRY: Readonly<Record<string, readonly string[]>> = (() => {
  const out: Record<string, string[]> = {};
  for (const [industry, lines] of Object.entries(COPY_BY_INDUSTRY)) {
    out[industry] = lines
      .map((line) => line.split(". ")[0].replace(/\.$/, "") + ".")
      .filter((hook) => !/\bAI\b/.test(hook));
  }
  return out;
})();

/**
 * A hook that belongs to `industry`, chosen deterministically from `seed`.
 * `offset` lets a caller step to the next option to break a duplicate without
 * losing determinism.
 */
export function hookForIndustry(industry: string, seed: string, offset = 0): string {
  const bank = HOOKS_BY_INDUSTRY[industry] ?? HOOKS_BY_INDUSTRY["E-commerce"];
  if (!bank || bank.length === 0) return "";
  const base = randInt(`hook|${industry}|${seed}`, 0, bank.length - 1);
  return bank[(base + offset) % bank.length];
}

/** Ads whose industry is one of the given set. */
function adsForIndustries(industries: readonly string[]): InsightAd[] {
  const set = new Set(industries);
  return DUMMY_ADS.filter((a) => set.has(a.industry));
}

/**
 * Domain → business-model type.
 *
 * Assigned by hash RANK rather than by hash bucket, so the 40 corpus domains
 * are guaranteed to cover all five types (a 0.7%-weight bucket would often
 * produce zero telehealth domains across only 40 items, and the table must be
 * able to demonstrate every column set). Quotas: 26 / 8 / 3 / 2 / 1.
 */
export const DOMAIN_TYPES: Readonly<Record<string, DomainType>> = (() => {
  const ranked = [...DOMAINS].sort(
    (a, b) => hashString(`dtype|${a}`) - hashString(`dtype|${b}`),
  );
  const quotas: Array<[DomainType, number]> = [
    ["ecom", 26], ["affiliate", 8], ["leadgen", 3], ["ppc", 2], ["telehealth", 1],
  ];
  const out: Record<string, DomainType> = {};
  let cursor = 0;
  for (const [type, n] of quotas) {
    for (let i = 0; i < n && cursor < ranked.length; i++, cursor++) {
      out[ranked[cursor]] = type;
    }
  }
  for (; cursor < ranked.length; cursor++) out[ranked[cursor]] = "ecom";
  return out;
})();

export function domainTypeFor(domain: string): DomainType {
  return DOMAIN_TYPES[domain] ?? "ecom";
}

const LIVE_ADS_RANGE_BY_TYPE: Readonly<Record<DomainType, [number, number]>> = {
  ecom: [24, 940],
  affiliate: [40, 620],
  leadgen: [18, 210],
  ppc: [12, 160],
  telehealth: [8, 95],
};

/** Live-ad count for a domain at index scale. Derived, not counted. */
function liveAdsForDomain(domain: string): number {
  const [lo, hi] = LIVE_ADS_RANGE_BY_TYPE[domainTypeFor(domain)];
  return randInt(`liveads|${domain}`, lo, hi);
}

const TRACKERS = ["RedTrack", "Voluum", "Clickflare"] as const;

/**
 * Tracker fingerprint. Undetected is the STRING "not detected", never empty
 * and never null — a blank cell reads as zero.
 */
function trackerFor(domain: string, undetectedProbability: number): TrackerValue {
  if (randBool(`tracker-miss|${domain}`, undetectedProbability)) return "not detected";
  return randPick(`tracker|${domain}`, TRACKERS);
}

const ECOM_PLATFORMS: readonly EcomPlatform[] = [
  "Shopify", "Shopify", "Shopify", "Shopify Plus", "WooCommerce",
];

const MARKET_CODES = ["US", "CA", "UK", "AU", "DE", "NZ"] as const;

// ═════════════════════════════════════════════════════════════════════════
// §7  Collection builders
// ═════════════════════════════════════════════════════════════════════════

// ── 7.1  Watchlist ───────────────────────────────────────────────────────

function statusFor(lastNewDaysAgo: number, newCreatives30d: number): WatchStatus {
  if (lastNewDaysAgo >= QUIET_THRESHOLD_DAYS) return "quiet";
  if (newCreatives30d >= 12 && lastNewDaysAgo <= 6) return "ramping";
  return "active";
}

/**
 * The brands you follow, and inside them the competitors you track.
 *
 * `items.length` IS `followCount` — the tile can say "12 followed" because
 * twelve rows exist. There is no cap and no hidden remainder.
 *
 * `trackedCompetitors` is the first `trackedCount` rows after the sort, i.e.
 * the followed brands shipping the most new creative — the ones you would
 * actually track. Their domains are what every `tracked` flag on the page is
 * derived from, so the KPI, the follow pills on the domain table and the
 * follow pills on the pages list all agree.
 *
 * `followCount` / `trackedCount` default to the populated-workspace scale
 * (12 / 6) but are overridable — `firstTime` passes a much smaller "a couple
 * of brands" count, per Maalik's own description of that state.
 */
function buildWatchlist(
  industries: readonly string[],
  followCount: number = POPULATED_BRANDS_FOLLOWED,
  trackedCount: number = POPULATED_COMPETITORS_FOLLOWED,
): WatchlistHealth {
  const pool = BRAND_DOMAIN_PAIRS.filter((p) =>
    industries.includes(industryForDomain(p.domain)),
  );
  const chosen = randSample(
    "watchlist-pick",
    pool.length ? pool : BRAND_DOMAIN_PAIRS,
    Math.min(followCount, (pool.length ? pool : BRAND_DOMAIN_PAIRS).length),
  );

  // Statuses are assigned by slot, not left to chance, so all three bands are
  // always on screen: exactly two quiet (the actionable signal, and the
  // "N inactive" sub-note on the Brands-followed KPI), three ramping, the rest
  // steady. Pure hashing here reliably produced zero ramping rows.
  // Slots clamped to the list length so a smaller pool cannot silently lose the
  // quiet band — the "N inactive" sub-note depends on it existing.
  const quietSlots = new Set(
    [3, 8].map((n) => Math.min(n, chosen.length - 1)).filter((n) => n >= 0),
  );
  const rampingSlots = new Set(
    [0, 1, 5].filter((n) => n < chosen.length && !quietSlots.has(n)),
  );

  const items: WatchItem[] = chosen.map((p, i) => {
    const band: WatchStatus =
      quietSlots.has(i) ? "quiet" : rampingSlots.has(i) ? "ramping" : "active";

    const lastNewCreativeDaysAgo =
      band === "quiet" ? randInt(`watch-quiet|${p.domain}`, QUIET_THRESHOLD_DAYS, 47) :
      band === "ramping" ? randInt(`watch-ramp-d|${p.domain}`, 0, 5) :
      randInt(`watch-fresh|${p.domain}`, 2, 18);

    const newCreatives30d =
      band === "quiet" ? randInt(`watch-n30q|${p.domain}`, 0, 2) :
      band === "ramping" ? randInt(`watch-n30r|${p.domain}`, 14, 31) :
      randInt(`watch-n30|${p.domain}`, 3, 11);

    return {
      id: `watch-${p.domain}`,
      advertiser: p.brand,
      domain: p.domain,
      industry: industryForDomain(p.domain),
      lastNewCreativeDaysAgo,
      liveAds: liveAdsForDomain(p.domain),
      newCreatives30d,
      status: statusFor(lastNewCreativeDaysAgo, newCreatives30d),
      avatarUrl: `https://i.pravatar.cc/150?u=${p.brand.toLowerCase().replace(/\s+/g, "")}`,
    };
  });

  items.sort((a, b) => b.newCreatives30d - a.newCreatives30d);

  // The competitors you track: the shortest, most active head of the follow
  // list. Deterministic (the sort above is), and the sole source of the
  // `tracked` flags everywhere else on the page.
  const trackedCompetitors = items.slice(0, trackedCount);
  const quietCount = items.filter((i) => i.status === "quiet").length;

  return {
    items,
    followCount: items.length,
    inactiveCount: quietCount,
    inactiveThresholdDays: QUIET_THRESHOLD_DAYS,
    trackedCompetitors,
    trackedCompetitorCount: trackedCompetitors.length,
    trackedCompetitorLiveAds: trackedCompetitors.reduce((s, i) => s + i.liveAds, 0),
    activeCount: items.filter((i) => i.status === "active").length,
    rampingCount: items.filter((i) => i.status === "ramping").length,
    quietCount,
  };
}

/** Nothing followed and nothing tracked. Every count is a real zero. */
const EMPTY_WATCHLIST = (): WatchlistHealth => ({
  items: [],
  followCount: 0,
  inactiveCount: 0,
  inactiveThresholdDays: QUIET_THRESHOLD_DAYS,
  trackedCompetitors: [],
  trackedCompetitorCount: 0,
  trackedCompetitorLiveAds: 0,
  activeCount: 0,
  rampingCount: 0,
  quietCount: 0,
});

// ── 7.2  New ads in the last 30 days, and the movers built from them ─────

/**
 * Ads a domain LAUNCHED in the 30 days before this one.
 *
 * Scaled off the same `liveAdsForDomain` the row prints, because the two sit on
 * one line and a reader will compare them: an independent random draw produced
 * rows like "28 live ads · 296 new ads (30d)", which reads as broken however
 * honest the labels are. A month's launches are a slice of what is running.
 */
function newAdsPrev30dFor(domain: string): number {
  const live = liveAdsForDomain(domain);
  return Math.max(1, Math.round(live * randFloat(`mover-prev-share|${domain}`, 0.06, 0.34)));
}

/**
 * Ads a domain LAUNCHED in the last 30 days.
 *
 * NOT `liveAdsForDomain` — that is ads running right now, a different question.
 * Both numbers appear on the same row, so the two must never be mixed up: the
 * column label is "New ads (30d)".
 *
 * Capped at 80% of the live count for the same plausibility reason as
 * `newAdsPrev30dFor`. The delta is derived from the two FINAL counts, so a
 * capped row is still internally consistent with what it prints.
 */
function newAds30dFor(domain: string): number {
  const prev = newAdsPrev30dFor(domain);
  const factor = randBool(`mover-dir|${domain}`, 0.62)
    ? randFloat(`mover-up|${domain}`, 1.34, 3.4)
    : randFloat(`mover-down|${domain}`, 0.22, 0.74);
  const ceiling = Math.max(1, Math.round(liveAdsForDomain(domain) * 0.8));
  return Math.min(ceiling, Math.max(1, Math.round(prev * factor)));
}

/** Whole-percent change, derived from the two counts so a row is checkable. */
function newAdsDeltaPct(cur: number, prev: number): number {
  return prev === 0 ? 0 : Math.round(((cur - prev) / prev) * 100);
}

/**
 * The 30-day figures for one domain, as they appear on a domain row, on that
 * domain's pages, and in `movers`. ONE function, so the three cannot disagree —
 * this is what makes the "Market movers" block safe to delete: its data now
 * rides on the row it was always describing.
 */
function newAdsWindowFor(domain: string): {
  newAds30d: number;
  newAdsPrev30d: number;
  newAds30dDeltaPct: number;
} {
  const newAdsPrev30d = newAdsPrev30dFor(domain);
  const newAds30d = newAds30dFor(domain);
  return {
    newAds30d,
    newAdsPrev30d,
    newAds30dDeltaPct: newAdsDeltaPct(newAds30d, newAdsPrev30d),
  };
}

function buildMovers(industries: readonly string[], trackedDomains: Set<string>): Mover[] {
  const pool = DOMAINS.filter((d) => industries.includes(industryForDomain(d)));
  const chosen = randSample("movers-pick", pool.length >= 8 ? pool : DOMAINS, 8);

  // The counts come from `newAdsWindowFor`, the SAME function the domain rows
  // and page rows use, so a domain's 30-day figures are identical wherever it
  // appears. Direction is hash-decided per domain (≈62% climbing), which keeps
  // real declines in the list — a mover list with no decline is a lie.
  const rows: Mover[] = chosen.map((domain) => {
    const w = newAdsWindowFor(domain);
    return {
      domain,
      industry: industryForDomain(domain),
      // Derived from the two counts, so the row is internally consistent.
      deltaPct: w.newAds30dDeltaPct,
      adCount30d: w.newAds30d,
      adCountPrev30d: w.newAdsPrev30d,
      tracked: trackedDomains.has(domain),
    };
  });

  return rows.sort((a, b) => b.deltaPct - a.deltaPct);
}

// ── 7.3  Launch cadence ──────────────────────────────────────────────────

/**
 * 12 weeks of launch counts, bucketed from the SYNTHESISED launch curve (not
 * from `createdAt`), scaled to the watchlist's slice of the index, with
 * exactly one annotated spike.
 */
function buildCadence(pool: InsightAd[], scale: number, spikeMover: Mover | null): LaunchCadenceWeek[] {
  const counts = new Array<number>(CADENCE_WEEKS).fill(0);
  for (const ad of pool) {
    const d = syntheticLaunchDaysAgo(ad.id);
    if (d >= CADENCE_WINDOW_DAYS) continue;
    counts[CADENCE_WEEKS - 1 - Math.floor(d / 7)] += 1;
  }

  const scaled = counts.map((c, i) => Math.max(8, Math.round(c * scale) + randInt(`cad-jitter|${i}`, -3, 3)));

  // Exactly one spike, positioned deterministically in the middle third.
  const spikeIndex = randInt("cadence-spike-week", 4, 9);
  const others = scaled.filter((_, i) => i !== spikeIndex);
  const mean = others.reduce((s, n) => s + n, 0) / Math.max(1, others.length);
  // Guarantee the spike actually reads as the outlier — a "spike" that isn't
  // the tallest bar is worse than no annotation at all.
  scaled[spikeIndex] = Math.max(
    Math.round(mean * 1.85),
    Math.max(...others) + Math.round(mean * 0.25),
  );

  return scaled.map((adsLaunched, weekIndex) => {
    const startDaysAgo = (CADENCE_WEEKS - 1 - weekIndex) * 7 + 6;
    const isSpike = weekIndex === spikeIndex;
    const week: LaunchCadenceWeek = {
      weekStartLabel: shortDateLabel(startDaysAgo),
      weekStartISO: isoDaysAgo(startDaysAgo),
      weekIndex,
      adsLaunched,
      isSpike,
    };
    if (isSpike) {
      week.spikeNote = spikeMover
        ? `${Math.round(adsLaunched / Math.max(1, mean) * 100 - 100)}% above the 12-week average. ${
            spikeMover.domain
          } accounts for most of it — ${spikeMover.adCount30d} new ads in ${spikeMover.industry}, up ${
            spikeMover.deltaPct
          }% on the prior 30 days.`
        : `${Math.round(adsLaunched / Math.max(1, mean) * 100 - 100)}% above the 12-week average across the industries FabAds tracks.`;
    }
    return week;
  });
}

// ── 7.4  Angle mix ───────────────────────────────────────────────────────

/**
 * Angle mix across LIVE creative in the followed industries.
 *
 * Scoped to `status === "active"` because the block is share of *live*
 * creative, and because the paused/inactive slice adds the uneven counts that
 * stop every percentage landing on a suspiciously round number.
 */
function buildAngles(pool: InsightAd[], yourMix: readonly AngleMixEntry[]): AngleSlice[] {
  const live = pool.filter((a) => a.status === "active");
  const counts = new Map<AngleKey, number>();
  for (const key of ANGLE_ORDER) counts.set(key, 0);
  for (const ad of live) {
    const key = angleForHeadline(ad.headline);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const total = live.length || 1;
  const yourByKey = new Map(yourMix.map((m) => [m.angleKey, m.pct]));

  return ANGLE_ORDER.map((angleKey) => {
    const adCount = counts.get(angleKey) ?? 0;
    return {
      angle: ANGLE_LABELS[angleKey],
      angleKey,
      marketPct: Math.round((adCount / total) * 1000) / 10,
      yourPct: yourByKey.get(angleKey) ?? 0,
      adCount,
      // Angle is resolved from real headlines via `angleForHeadline`, and
      // Discover now reads `?angle=` using that same function — so following
      // this link returns exactly `adCount` ads. Keep the two on one
      // implementation: the moment they diverge, the donut starts lying about
      // what its own slice leads to.
      discoverHref: `/insights/discover?angle=${angleKey}`,
    };
  }).sort((a, b) => b.marketPct - a.marketPct);
}

// ── 7.5  Domain table ────────────────────────────────────────────────────

function buildDomainRow(domain: string, trackedDomains: Set<string>): DomainRow {
  const type = domainTypeFor(domain);
  const base = {
    domain,
    industry: industryForDomain(domain),
    liveAds: liveAdsForDomain(domain),
    // 30-day launch window — the old "Market movers" data, on the row it
    // describes. Same function `movers` uses, so the two always match.
    ...newAdsWindowFor(domain),
    firstSeenDaysAgo: randInt(`dfirst|${domain}`, 34, 780),
    lastNewCreativeDaysAgo: randInt(`dlast|${domain}`, 0, 26),
    tracked: trackedDomains.has(domain),
  };

  if (type === "ecom") {
    return {
      ...base,
      // Sales/visits are StoreLeads MODELLED numbers, hence `estimated`.
      provenance: "estimated" as ProvenanceTier,
      type: "ecom",
      estSalesPerMonth: randInt(`esales|${domain}`, 18_000, 2_400_000),
      estVisits: randInt(`evisits|${domain}`, 12_000, 1_900_000),
      productCount: randInt(`eprod|${domain}`, 12, 3_400),
      platform: randPick(`eplat|${domain}`, ECOM_PLATFORMS),
    };
  }

  if (type === "affiliate") {
    return {
      ...base,
      // No modelled figures exist for these, so everything shown is observed.
      provenance: "observed" as ProvenanceTier,
      type: "affiliate",
      tracker: trackerFor(domain, 0.3),
      offers: randInt(`aoffers|${domain}`, 1, 14),
      avgCreativeLifeDays: randInt(`alife|${domain}`, 3, 21),
      rotation7d: {
        added: randInt(`arotadd|${domain}`, 2, 40),
        paused: randInt(`arotpause|${domain}`, 0, 34),
      },
    };
  }

  const marketCount = randInt(`dmarkets-n|${domain}`, 1, 3);
  return {
    ...base,
    provenance: "observed" as ProvenanceTier,
    type,
    tracker: trackerFor(domain, 0.45),
    landers: randInt(`flanders|${domain}`, 1, 28),
    topAngle: ANGLE_LABELS[randPick(`fangle|${domain}`, ANGLE_ORDER)],
    markets: randSample(`fmarkets|${domain}`, MARKET_CODES, marketCount),
  };
}

/**
 * 14-row domain table that GUARANTEES all five column sets are represented
 * (6 ecom / 4 affiliate / 2 leadgen / 1 ppc / 1 telehealth), each group
 * ordered by live-ad count. A table that only ever shows ecom rows can't
 * demonstrate that the columns genuinely differ by business model.
 */
function buildDomainRows(trackedDomains: Set<string>, industries: readonly string[]): DomainRow[] {
  // Scoped to the followed industries. The block is headed "…in your
  // industries" and sits directly under the movers list, which is scoped the
  // same way — an unscoped table put SaaS and Education domains under that
  // heading. The universe note still reports the full 1,063; only the SAMPLE
  // narrows. Telehealth has no domain inside these six industries, so that
  // type simply doesn't appear — the funnel column set is still demonstrated
  // by the lead-gen and PPC rows, which share it.
  const followed = new Set(industries);
  const all = DOMAINS
    .filter((d) => followed.has(industryForDomain(d)))
    .map((d) => buildDomainRow(d, trackedDomains));
  const byType = (t: DomainType) =>
    all.filter((r) => r.type === t).sort((a, b) => b.liveAds - a.liveAds);

  /**
   * Top `n` of a type, PLUS any tracked competitor of that type the cut would
   * have dropped.
   *
   * Without the second half, a competitor you follow could be missing from this
   * table while the "Total competitor ads" KPI still counted its ads — a number
   * on the page with nothing under it to check against. Every followed
   * competitor now has a row here, so the KPI is the sum of rows a reader can
   * see.
   */
  const pick = (t: DomainType, n: number): DomainRow[] => {
    const rows = byType(t);
    const head = rows.slice(0, n);
    const missingTracked = rows.filter((r) => r.tracked && !head.includes(r));
    return [...head, ...missingTracked].sort((a, b) => b.liveAds - a.liveAds);
  };

  return [
    ...pick("ecom", 6),
    ...pick("affiliate", 4),
    ...pick("leadgen", 2),
    ...pick("ppc", 1),
    ...pick("telehealth", 1),
  ];
}

// ── 7.6  Change signals ──────────────────────────────────────────────────

interface SignalCtx {
  advertiser: string;
  domain: string;
  industry: string;
  angle: string;
  format: string;
  n: number;
}

const SIGNAL_TEMPLATES: Readonly<Record<ChangeSignalKind, {
  provenance: ProvenanceTier;
  headline: (c: SignalCtx) => string;
  evidence: (c: SignalCtx) => string[];
}>> = {
  "new-angle": {
    provenance: "derived",
    headline: (c) => `${c.advertiser} switched to ${c.angle.toLowerCase()} messaging in its ads`,
    evidence: (c) => [
      `${c.n} new ads in the last 14 days open on a ${c.angle.toLowerCase()} hook — none did in the 30 days before.`,
      `Their previous ${c.industry} creative led on product benefits.`,
    ],
  },
  "offer-shift": {
    provenance: "observed",
    headline: (c) => `${c.advertiser} changed the offer in its ads`,
    evidence: (c) => [
      `Offer text changed across ${c.n} live ads on ${c.domain}.`,
      `The old discount copy no longer appears in any live creative.`,
    ],
  },
  "format-expansion": {
    provenance: "observed",
    headline: (c) => `${c.advertiser} started running ${c.format.toLowerCase()} ads`,
    evidence: (c) => [
      `${c.n} ${c.format.toLowerCase()} ads went live in the last 10 days; their mix was static-only before.`,
    ],
  },
  "velocity-change": {
    provenance: "derived",
    headline: (c) => `${c.advertiser} is shipping new creative faster than usual`,
    evidence: (c) => [
      `${c.n} new ads in the last 7 days against a 12-week average of ${Math.max(1, Math.round(c.n / 2.4))}.`,
      `Live-ad count on ${c.domain} is up over the same window.`,
    ],
  },
  "landing-page-change": {
    provenance: "observed",
    headline: (c) => `${c.advertiser} changed the page its ads link to`,
    evidence: (c) => [
      `${c.n} live ads now point at a different path on ${c.domain}.`,
      `The previous destination stopped receiving ad traffic in the same scan.`,
    ],
  },
  withdrawal: {
    provenance: "observed",
    headline: (c) => `${c.advertiser} stopped running ${c.n} ads in ${c.industry}`,
    evidence: (c) => [
      `${c.n} ads that were live in the previous scan are no longer running.`,
      `Nothing new replaced them on ${c.domain}.`,
    ],
  },
};

const SIGNAL_KINDS: readonly ChangeSignalKind[] = [
  "new-angle", "offer-shift", "format-expansion",
  "velocity-change", "landing-page-change", "withdrawal",
];

const FORMATS = ["Video", "Carousel", "Image"] as const;

/** Ready-to-render qualifier for each `advertiserRelationship` value. */
const ADVERTISER_RELATIONSHIP_LABEL: Readonly<Record<"followed" | "market", string>> = {
  followed: "a brand you follow",
  market: "part of the wider market",
};

/**
 * 8 signals: one of each of the six kinds plus two repeats. Index 6 is
 * deliberately a SINGLE observation so the UI can demonstrate the recurrence
 * gate — one sighting is not a trend.
 *
 * `trackedDomains` is the SAME tracked-competitor set every other block on
 * the page uses for its own `tracked` / `followed` flags (domains, pages,
 * movers) — passed in here so a signal's `advertiserRelationship` can never
 * disagree with what those blocks already say about the same domain. It is
 * never invented: in `empty` it is passed in empty, so every signal there
 * honestly resolves to "market"; in `firstTime` and `populated` it reflects
 * whatever the user has actually followed, so an intersection with the
 * six-industry preview is a real fact when it happens, not an assumption.
 */
function buildSignals(
  pool: InsightAd[],
  industries: readonly string[],
  trackedDomains: ReadonlySet<string> = new Set(),
): ChangeSignal[] {
  // Anchors are narrowed to advertisers whose OWN industry is followed —
  // signals name the advertiser and its industry, and a page scoped to six
  // industries must not report a change in a seventh.
  const followed = new Set(industries);
  const scoped = pool.filter((a) => followed.has(industryForDomain(a.domain)));
  const anchorPool = scoped.length >= 8 ? scoped : pool;
  if (anchorPool.length === 0) return [];

  // One signal per advertiser. Eight rows about six brands reads like a bug.
  // (`randSample` short-circuits when count === length, so shuffle by sort key
  // instead — same hash source, no early return.)
  const shuffled = [...anchorPool].sort(
    (a, b) => hashString(`signal-anchors|${a.id}`) - hashString(`signal-anchors|${b.id}`),
  );
  const seenDomains = new Set<string>();
  const anchors: InsightAd[] = [];
  for (const ad of shuffled) {
    if (seenDomains.has(ad.domain)) continue;
    seenDomains.add(ad.domain);
    anchors.push(ad);
    if (anchors.length === 8) break;
  }
  if (anchors.length < 8) {
    for (const ad of shuffled) {
      if (anchors.length === 8) break;
      if (!anchors.includes(ad)) anchors.push(ad);
    }
  }

  return anchors.map((ad, i) => {
    const kind = SIGNAL_KINDS[i % SIGNAL_KINDS.length];
    const tpl = SIGNAL_TEMPLATES[kind];
    const observationCount = i === 6 ? 1 : randInt(`sig-obs|${ad.id}`, 2, 6);
    const lastSeenDaysAgo = randInt(`sig-last|${ad.id}`, 0, 5);
    const ctx: SignalCtx = {
      // Same incoherence as the gallery: `ad.brand` and `ad.industry` are
      // independent modulos in the source, so a signal built from them says
      // "OrbitGym pulled 9 ads in Food & Beverage". Both come off the domain.
      advertiser: brandForDomain(ad.domain),
      domain: ad.domain,
      industry: industryForDomain(ad.domain),
      angle: ANGLE_LABELS[angleForHeadline(ad.headline)],
      format: randPick(`sig-fmt|${ad.id}`, FORMATS),
      n: randInt(`sig-n|${ad.id}`, 3, 19),
    };
    const advertiserRelationship: "followed" | "market" = trackedDomains.has(ctx.domain)
      ? "followed"
      : "market";
    return {
      id: `signal-${i + 1}-${ad.id}`,
      kind,
      advertiser: ctx.advertiser,
      domain: ctx.domain,
      industry: ctx.industry,
      headline: tpl.headline(ctx),
      evidence: tpl.evidence(ctx),
      observationCount,
      firstSeenDaysAgo: lastSeenDaysAgo + randInt(`sig-first|${ad.id}`, 2, 22),
      lastSeenDaysAgo,
      provenance: tpl.provenance,
      // A withdrawal has no live ad to point at — the ad is gone.
      representativeAdId: kind === "withdrawal" ? null : ad.id,
      meetsRecurrenceGate: observationCount >= SIGNAL_RECURRENCE_GATE,
      advertiserRelationship,
      advertiserRelationshipLabel: ADVERTISER_RELATIONSHIP_LABEL[advertiserRelationship],
    };
  });
}

// ── 7.7  Long runners ────────────────────────────────────────────────────

export function tierFor(daysRunning: number): LongRunnerTier {
  if (daysRunning <= LONG_RUNNER_TIER_BOUNDS.testingMax) return "testing";
  if (daysRunning <= LONG_RUNNER_TIER_BOUNDS.workingMax) return "working";
  return "proven";
}

/**
 * `activeDuration` in the source only spans 7–26 days, which would put every
 * ad in one tier. We spread it multiplicatively by a hash factor so the
 * gallery covers testing / working / proven and includes real 90+ day
 * creative to hang the saturation caveat on.
 */
export function daysRunningFor(ad: InsightAd): number {
  const base = parseDurationDays(ad.activeDuration) || 7;
  const mult = randFloat(`runlen|${ad.id}`, 1, 6.6);
  return Math.max(4, Math.round(base * mult));
}

/**
 * `ad.brand` / `ad.industry` / `ad.primaryText` do NOT agree in the source
 * corpus — brand comes off `i % 40` and industry off `i % 15`, so the copy
 * belongs to whichever industry the modulo landed on rather than to the brand.
 * The card therefore takes brand and industry from the DOMAIN (the one field
 * that is index-aligned with the brand) and its hook from that industry's own
 * copy bank. Nothing is invented: every hook is a real line from the corpus,
 * just read out of the right bank.
 */
function toLongRunner(ad: InsightAd, hookOffset = 0): LongRunnerAd {
  const daysRunning = daysRunningFor(ad);
  const saturationCaveat = daysRunning >= SATURATION_CAVEAT_DAYS;
  const industry = industryForDomain(ad.domain);
  const row: LongRunnerAd = {
    adId: ad.id,
    brand: brandForDomain(ad.domain),
    domain: ad.domain,
    industry,
    thumbUrl: ad.thumbUrl,
    mediaUrl: ad.mediaUrl,
    mediaType: ad.mediaType,
    mediaAspectRatio: ad.mediaAspectRatio ?? "1/1",
    headline: ad.headline,
    hook: hookForIndustry(industry, ad.id, hookOffset),
    daysRunning,
    tier: tierFor(daysRunning),
    similarCount: ad.similarAdsCount,
    format: ad.adType,
    provenance: "observed",
    saturationCaveat,
  };
  if (saturationCaveat) {
    row.caveatNote = `Running ${daysRunning} days. Past ${SATURATION_CAVEAT_DAYS} days longevity is a weak proxy — this could be saturated rather than proven.`;
  }
  return row;
}

/**
 * 12 cards. Eight longest-running (which carries the 90+ caveat cases) plus
 * two `working` and two `testing` so the gallery shows the whole maturity
 * spectrum rather than implying "longest = best".
 */
function buildLongRunners(industries: readonly string[]): LongRunnerAd[] {
  // Scoped by the DOMAIN's industry, not the ad row's — see `toLongRunner`.
  // Anything else puts a Beauty brand's card under a Food & Beverage heading.
  const followed = new Set(industries);
  const withMedia = DUMMY_ADS.filter(
    (a) => a.thumbUrl !== "" && followed.has(industryForDomain(a.domain)),
  );
  if (withMedia.length === 0) return [];

  const all = withMedia.map((a) => toLongRunner(a)).sort((a, b) => b.daysRunning - a.daysRunning);

  // ONE CARD PER ADVERTISER. Each domain owns ~20 ads in the corpus and
  // `daysRunningFor` multiplies a shared base, so the raw top-8 is three
  // brands repeated — the same logo four times over the same hook, which
  // reads as a rendering bug rather than as a market. Brand diversity is also
  // the honest answer to "what's running longest in my industries".
  const seenDomains = new Set<string>();
  const picked: LongRunnerAd[] = [];
  for (const row of all) {
    if (picked.length === 8) break;
    if (seenDomains.has(row.domain)) continue;
    seenDomains.add(row.domain);
    picked.push(row);
  }
  const seen = new Set(picked.map((p) => p.adId));

  // Sample the shorter tiers rather than taking the head of each — the head is
  // always that tier's ceiling, which produces duplicate day-counts (45, 45,
  // 20, 20) that read as fabricated. Same one-per-advertiser rule applies.
  const addFromTier = (tier: LongRunnerTier, n: number) => {
    const candidates = all.filter(
      (r) => r.tier === tier && !seen.has(r.adId) && !seenDomains.has(r.domain),
    );
    // Hash-sorted, not `randSample` — that helper short-circuits (returns the
    // pool unshuffled) when count === pool.length, and we need every candidate
    // in shuffled order so the domain filter can skip freely.
    const shuffled = [...candidates].sort(
      (a, b) => hashString(`lr-tier|${tier}|${a.adId}`) - hashString(`lr-tier|${tier}|${b.adId}`),
    );
    let added = 0;
    for (const row of shuffled) {
      if (added === n) break;
      if (seenDomains.has(row.domain)) continue;
      picked.push(row);
      seen.add(row.adId);
      seenDomains.add(row.domain);
      added++;
    }
  };
  addFromTier("working", 2);
  addFromTier("testing", 2);

  // Each industry bank only holds five lines, so two cards from the same
  // industry can land on the same hook — which is exactly the "EduVerse and
  // OrbitGym both sell meal kits" tell we just removed. Step any repeat to the
  // next line in its own bank; still deterministic, still real corpus copy.
  const usedHooks = new Set<string>();
  const deduped = picked.map((row) => {
    if (!usedHooks.has(row.hook)) {
      usedHooks.add(row.hook);
      return row;
    }
    for (let offset = 1; offset <= 5; offset++) {
      const hook = hookForIndustry(row.industry, row.adId, offset);
      if (!usedHooks.has(hook)) {
        usedHooks.add(hook);
        return { ...row, hook };
      }
    }
    usedHooks.add(row.hook);
    return row;
  });

  return deduped.sort((a, b) => b.daysRunning - a.daysRunning);
}

// ── 7.8  You vs your market ──────────────────────────────────────────────

interface MyBrandSeed {
  name: string;
  domain: string;
  industry: string;
  liveAds: number;
  adsLaunchedPerWeek: number;
  avgCreativeLifespanDays: number;
  refreshCadenceDays: number;
  formatMix: FormatMixEntry[];
  angleMix: Array<{ angleKey: AngleKey; pct: number }>;
}

const MY_BRAND_SEED_POPULATED: MyBrandSeed = {
  name: "Aurelia Skin",
  domain: "aureliaskin.com",
  industry: "Beauty",
  liveAds: 47,
  adsLaunchedPerWeek: 6,
  avgCreativeLifespanDays: 24,
  refreshCadenceDays: 9,
  formatMix: [
    { format: "Video", pct: 46 },
    { format: "Image", pct: 38 },
    { format: "Carousel", pct: 16 },
  ],
  angleMix: [
    { angleKey: "benefit", pct: 31 },
    { angleKey: "stat", pct: 22 },
    { angleKey: "direct", pct: 18 },
    { angleKey: "question", pct: 14 },
    { angleKey: "urgency", pct: 10 },
    { angleKey: "curiosity", pct: 5 },
  ],
};

/**
 * `firstTime`'s own brand — a real advertiser who has just started, per
 * Maalik's description of the state: a couple of brands followed, no
 * launches of any scale yet.
 *
 * Deliberately placed IN "Beauty" — one of the six `POPULATED_INDUSTRY_NAMES`
 * the market preview below is built from — rather than in an industry the
 * corpus has no data for. `firstTime` still shows real market angle mix,
 * industry share and long-runners (the market is never empty), and a brand
 * in an unrelated industry would make every "you vs market" comparison on
 * the page incoherent (your angle mix compared against a market you don't
 * even advertise in). A tiny Beauty brand keeps every comparison honest.
 */
const MY_BRAND_SEED_FIRST_TIME: MyBrandSeed = {
  name: "Lumo Beauty",
  domain: "lumobeauty.com",
  industry: "Beauty",
  liveAds: 6,
  adsLaunchedPerWeek: 1,
  avgCreativeLifespanDays: 12,
  refreshCadenceDays: 19,
  formatMix: [
    { format: "Image", pct: 52 },
    { format: "Video", pct: 34 },
    { format: "Carousel", pct: 14 },
  ],
  angleMix: [
    { angleKey: "urgency", pct: 34 },
    { angleKey: "benefit", pct: 26 },
    { angleKey: "question", pct: 18 },
    { angleKey: "stat", pct: 12 },
    { angleKey: "direct", pct: 8 },
    { angleKey: "curiosity", pct: 2 },
  ],
};

const MY_BRAND_SCOPE_NOTE =
  "Creative behaviour only — what's live, how often it changes, how long it lasts. Insights can't see spend or results, yours or anyone's.";

function buildMyBrand(seed: MyBrandSeed): MyBrand {
  return {
    name: seed.name,
    domain: seed.domain,
    industry: seed.industry,
    liveAds: seed.liveAds,
    adsLaunchedPerWeek: seed.adsLaunchedPerWeek,
    avgCreativeLifespanDays: seed.avgCreativeLifespanDays,
    refreshCadenceDays: seed.refreshCadenceDays,
    refreshCadenceLabel: `new creative every ${seed.refreshCadenceDays} days`,
    formatMix: seed.formatMix,
    angleMix: seed.angleMix.map<AngleMixEntry>((m) => ({
      angleKey: m.angleKey,
      angle: ANGLE_LABELS[m.angleKey],
      pct: m.pct,
    })),
    scopeNote: MY_BRAND_SCOPE_NOTE,
    provenance: "observed",
  };
}

const SOV_BASIS = "Share of live creative in this industry — not share of spend.";

/**
 * How the brand's own live ads split across the industries it advertises in.
 *
 * ONE source of truth, read by BOTH `buildShareOfVoice` and
 * `buildIndustryShare`. The counts sum to exactly `MY_BRAND_SEED_POPULATED
 * .liveAds` (47), so the two blocks and the brand card can never disagree
 * about how many ads the user is running.
 */
export const MY_BRAND_INDUSTRY_AD_COUNTS: readonly { industry: string; adCount: number }[] = [
  { industry: "Beauty", adCount: 31 },
  { industry: "E-commerce", adCount: 10 },
  { industry: "Health & Wellness", adCount: 6 },
];

/**
 * Creative share of voice, one row per industry in `industries`.
 *
 * `leaders` (the market) is always real — this is exactly the block the
 * "market is never empty" rule is about. `you` is a NON-NULL shape in every
 * row (never a bare dash), but when `myBrand` is absent, or this industry
 * isn't one it advertises in, `hasYourData` is `false` and `you` is a `0`
 * placeholder rather than a measured fact — check the flag before reading it
 * as real. `yourCountByIndustry` defaults to `myBrand`'s own single industry
 * (the common case: a brand that advertises in one place); `populated`
 * passes the explicit multi-industry `MY_BRAND_INDUSTRY_AD_COUNTS` map
 * instead, because Aurelia Skin runs ads in three.
 *
 * EVERY percentage here is DIVIDED, never declared — see the historical note
 * this replaced: two cards on one screen disagreeing about one advertiser is
 * the fastest way to lose a demo. Leaders come from `liveAdsForDomain`, the
 * same function the domain table prints.
 */
function buildShareOfVoice(
  industries: readonly string[],
  myBrand: MyBrand | null,
  yourCountByIndustry: ReadonlyMap<string, number> = new Map(
    myBrand ? [[myBrand.industry, myBrand.liveAds]] : [],
  ),
): ShareOfVoiceRow[] {
  const round1 = (n: number) => Math.round(n * 10) / 10;

  return industries.map((industry) => {
    const followed = POPULATED_FOLLOWED.find((f) => f.industry === industry);
    const totalLiveAds = followed?.indexedAds ?? 1000;
    const leaderDomains = DOMAINS
      .filter((d) => industryForDomain(d) === industry)
      .map((domain) => ({ domain, adCount: liveAdsForDomain(domain) }))
      .sort((a, b) => b.adCount - a.adCount)
      .slice(0, 3);

    const yourAdCount = myBrand ? yourCountByIndustry.get(industry) ?? null : null;
    const hasYourData = yourAdCount !== null;

    return {
      industry,
      you: {
        name: myBrand?.name ?? "Your brand",
        pct: hasYourData ? round1(((yourAdCount as number) / totalLiveAds) * 100) : 0,
        adCount: hasYourData ? (yourAdCount as number) : 0,
      },
      hasYourData,
      leaders: leaderDomains.map(({ domain, adCount }) => ({
        domain,
        pct: round1((adCount / totalLiveAds) * 100),
        adCount,
      })),
      totalLiveAds,
      basis: SOV_BASIS,
      provenance: "derived",
    };
  });
}

/** The three industries `firstTime` / `empty` show a market share-of-voice panorama for. */
const SHARE_OF_VOICE_MARKET_PREVIEW: readonly string[] = ["Beauty", "E-commerce", "Health & Wellness"];

// ── 7.8b  Pages (the advertiser's Meta page) ─────────────────────────────

/**
 * How many pages one advertiser runs. Most run one; some run a main page plus
 * a shop / regional page. Hash-decided, so a domain's page count never moves.
 */
function pageCountFor(domain: string): number {
  return randBool(`page-split|${domain}`, 0.35) ? 2 : 1;
}

/** Suffix for the second page of an advertiser. Plain words, no invention. */
const SECOND_PAGE_SUFFIXES = ["Shop", "Official", "Store"] as const;

/**
 * Pages behind the domain rows we already show.
 *
 * THE INVARIANT: the pages of one domain sum to EXACTLY that domain's
 * `liveAds`. A page's ads are a subset of its domain's ads, so a split — never
 * a fresh random number — is the only honest way to derive them. That is also
 * what makes the Domains ↔ Pages toggle worth having: the same corpus ranks
 * differently, without either view contradicting the other.
 *
 * `followed` mirrors the watchlist: an advertiser you follow is followed on its
 * MAIN page. Second pages start unfollowed, which is precisely Maalik's point
 * — the top advertisers are not necessarily the ones you already follow.
 */
function buildPages(rows: readonly DomainRow[], trackedDomains: Set<string>): PageRow[] {
  const out: PageRow[] = [];

  for (const row of rows) {
    const brand = brandForDomain(row.domain);
    const count = pageCountFor(row.domain);

    // Split the domain's live ads across its pages. The main page keeps the
    // larger share; the remainder goes to the second page, so the two always
    // add back up to `row.liveAds`.
    const mainShare = count === 1
      ? 1
      : randFloat(`page-share|${row.domain}`, 0.55, 0.82);
    const mainAds = count === 1 ? row.liveAds : Math.max(1, Math.round(row.liveAds * mainShare));
    const secondAds = row.liveAds - mainAds;

    // The 30-day launch counts split on the SAME share, so the pages of one
    // domain sum to that domain's `newAds30d` / `newAdsPrev30d` exactly — the
    // reconciliation rule `liveAds` already keeps.
    const splitWindow = (total: number): [number, number] => {
      if (count === 1) return [total, 0];
      const main = Math.min(total, Math.max(1, Math.round(total * mainShare)));
      return [main, total - main];
    };
    const [mainNew30, secondNew30] = splitWindow(row.newAds30d);
    const [mainPrev30, secondPrev30] = splitWindow(row.newAdsPrev30d);

    out.push({
      pageId: `page-${row.domain}-1`,
      pageName: brand,
      avatarUrl: `https://i.pravatar.cc/150?u=${brand.toLowerCase().replace(/\s+/g, "")}`,
      domain: row.domain,
      industry: row.industry,
      liveAds: mainAds,
      newAds30d: mainNew30,
      newAdsPrev30d: mainPrev30,
      newAds30dDeltaPct: newAdsDeltaPct(mainNew30, mainPrev30),
      followed: trackedDomains.has(row.domain),
      lastNewCreativeDaysAgo: row.lastNewCreativeDaysAgo,
      firstSeenDaysAgo: row.firstSeenDaysAgo,
      provenance: "observed",
    });

    if (count === 2 && secondAds > 0) {
      const suffix = randPick(`page-suffix|${row.domain}`, SECOND_PAGE_SUFFIXES);
      out.push({
        pageId: `page-${row.domain}-2`,
        pageName: `${brand} ${suffix}`,
        avatarUrl: `https://i.pravatar.cc/150?u=${row.domain}-2`,
        domain: row.domain,
        industry: row.industry,
        liveAds: secondAds,
        newAds30d: secondNew30,
        newAdsPrev30d: secondPrev30,
        newAds30dDeltaPct: newAdsDeltaPct(secondNew30, secondPrev30),
        followed: false,
        lastNewCreativeDaysAgo: randInt(`page2-last|${row.domain}`, 0, 34),
        firstSeenDaysAgo: Math.max(
          1,
          row.firstSeenDaysAgo - randInt(`page2-first|${row.domain}`, 0, 120),
        ),
        provenance: "observed",
      });
    }
  }

  return out.sort((a, b) => b.liveAds - a.liveAds);
}

// ── 7.8c  Top industry / category with brand share ───────────────────────

/**
 * Plain-words basis line. It is the ADS RUNNING, not the money behind them —
 * stated without jargon, because "share of voice" is exactly the invented
 * vocabulary this pass removes.
 */
export const INDUSTRY_SHARE_BASIS =
  "Share of the ads running in this industry right now. We can see ads, not spend.";

/** How many brands are named before the rest roll into Others. */
export const INDUSTRY_SHARE_NAMED_BRANDS = 4;

/**
 * Top industries, and inside each, which brands hold what share.
 *
 * Every number here is DIVIDED, never declared:
 *  - the denominator is `FollowedIndustry.indexedAds`, the same figure the
 *    coverage block prints;
 *  - each brand's ad count comes from `liveAdsForDomain`, the same function the
 *    domain table and the movers list print;
 *  - the user's own count comes from `yourCountByIndustry`, the SAME map
 *    `buildShareOfVoice` reads (`MY_BRAND_INDUSTRY_AD_COUNTS` for `populated`,
 *    or the default single-industry map derived from `myBrand` itself).
 *
 * So no two blocks on the page can report a different number for one brand.
 *
 * `followed` is the MARKET's industries to show a panorama for — NOT
 * necessarily the user's own follow list. `populated` passes its real
 * followed set (they're the same thing there); `firstTime` / `empty` pass
 * `POPULATED_FOLLOWED`, the market preview, because this block's whole
 * purpose is showing "who holds share in the market" regardless of what the
 * user follows. `you` on each row is `null` exactly when the user isn't
 * represented in that industry — the existing, already-nullable way this
 * page expresses an absent your-side.
 */
function buildIndustryShare(
  followed: readonly FollowedIndustry[],
  myBrand: MyBrand | null,
  yourCountByIndustry: ReadonlyMap<string, number> = new Map(
    myBrand ? [[myBrand.industry, myBrand.liveAds]] : [],
  ),
): IndustryShareRow[] {
  const round1 = (n: number) => Math.round(n * 10) / 10;
  const yourByIndustry = yourCountByIndustry;

  return [...followed]
    .filter((f) => f.indexedAds > 0)
    .sort((a, b) => b.indexedAds - a.indexedAds)
    .map<IndustryShareRow>((f) => {
      const total = f.indexedAds;

      const named = DOMAINS
        .filter((d) => industryForDomain(d) === f.industry)
        .map((domain) => ({ domain, liveAds: liveAdsForDomain(domain) }))
        .sort((a, b) => b.liveAds - a.liveAds)
        .slice(0, INDUSTRY_SHARE_NAMED_BRANDS);

      const brands: IndustryShareBrand[] = named.map((n) => ({
        key: n.domain,
        name: brandForDomain(n.domain),
        domain: n.domain,
        liveAds: n.liveAds,
        sharePct: round1((n.liveAds / total) * 100),
        isYou: false,
        isOthers: false,
        discoverHref: `/insights/discover?domain=${encodeURIComponent(n.domain)}`,
      }));

      const yourAdCount = myBrand ? yourByIndustry.get(f.industry) ?? null : null;
      const you: IndustryShareBrand | null =
        yourAdCount === null || !myBrand
          ? null
          : {
              key: "you",
              name: myBrand.name,
              domain: myBrand.domain,
              liveAds: yourAdCount,
              sharePct: round1((yourAdCount / total) * 100),
              isYou: true,
              isOthers: false,
              discoverHref: null,
            };

      if (you) brands.push(you);
      brands.sort((a, b) => b.liveAds - a.liveAds);

      const namedAds = brands.reduce((s, b) => s + b.liveAds, 0);
      const othersAds = Math.max(0, total - namedAds);
      // Others absorbs the rounding drift, so the row's percentages add to
      // EXACTLY 100 and a stacked bar can't overflow by a tenth.
      const namedPct = brands.reduce((s, b) => s + b.sharePct, 0);
      const othersRow: IndustryShareBrand = {
        key: "others",
        name: "Others",
        domain: null,
        liveAds: othersAds,
        sharePct: Math.max(0, round1(100 - namedPct)),
        isYou: false,
        isOthers: true,
        // There is no single `?domain=` value for "everyone else".
        discoverHref: null,
      };

      return {
        industry: f.industry,
        liveAds: total,
        advertisers: f.advertisers,
        brands: [...brands, othersRow],
        topBrand: brands.length ? brands[0] : null,
        you,
        basis: INDUSTRY_SHARE_BASIS,
        provenance: "derived",
      };
    });
}

// ── 7.8d  Nav overview counts ────────────────────────────────────────────

/** The six surfaces, in nav order, with FabAds' own names. */
const NAV_SURFACE_META: readonly {
  key: NavSurfaceKey;
  label: string;
  description: string;
  href: string;
  unitLabel: string;
}[] = [
  {
    key: "my-feeds",
    label: "My Feeds",
    description: "your personalized stream of ads from industries and brands you follow",
    href: "/insights-v2/feed",
    unitLabel: "industries followed",
  },
  {
    key: "discover",
    label: "Discover",
    description: "explore ads across every industry",
    href: "/insights/discover",
    unitLabel: "live ads",
  },
  {
    key: "saved-ads",
    label: "Saved Ads",
    description: "come back to ads you wanted to keep",
    href: "/insights/saved",
    unitLabel: "saved ads",
  },
  {
    key: "competitor",
    // Counts the competitors YOU FOLLOW — the same set as the "Competitors
    // followed" KPI. It used to count every advertiser in your industries
    // (1,063) under the word "competitors", which directly contradicted that
    // tile. The whole-market figure lives on the Domain surface below, where the
    // word is "domains".
    label: "Competitor",
    description: "keep an eye on brands and domains you care about",
    href: "/insights/competitors",
    unitLabel: "competitors followed",
  },
  {
    key: "domain",
    label: "Domain",
    description: "find advertisers and start tracking them",
    href: "/insights/competitors?view=domains",
    unitLabel: "domains",
  },
  {
    key: "trends",
    label: "Trends",
    description: "what's rising across the industries FabAds tracks",
    href: "/insights/trends",
    unitLabel: "updates in the newsroom",
  },
];

/**
 * Per-surface counts.
 *
 * `counts[key] === null` means we genuinely cannot say, and the matching
 * `reasons[key]` is printed instead of a number. Nothing here is a guess: every
 * figure is one another block on this page already shows.
 */
function buildNavSurfaces(
  counts: Readonly<Partial<Record<NavSurfaceKey, number | null>>>,
  reasons: Readonly<Partial<Record<NavSurfaceKey, string>>>,
): NavSurfaceCount[] {
  return NAV_SURFACE_META.map<NavSurfaceCount>((meta) => {
    const raw = counts[meta.key];
    const count = raw === undefined ? null : raw;
    if (count === null) {
      const naReason = reasons[meta.key] ?? "nothing indexed yet";
      return { ...meta, count: null, naReason, countLabel: naReason };
    }
    return { ...meta, count, countLabel: formatInt(count) };
  });
}

// ── 7.9  Boards ──────────────────────────────────────────────────────────

const BOARD_NAMES = [
  "Hook tests — Q3",
  "Competitor teardowns",
  "Winter offer angles",
  "Saved from feed",
] as const;

const BOARD_NOTE =
  "Stale means the source ad has since gone inactive. Never briefed means it was saved but never turned into a brief.";

function buildBoards(): BoardHealth {
  const boards: BoardHealthItem[] = BOARD_NAMES.map((name, i) => {
    const id = `board-${i + 1}`;
    const itemCount = randInt(`board-items|${id}`, 9, 84);
    return {
      id,
      name,
      itemCount,
      lastTouchedDaysAgo: randInt(`board-touch|${id}`, 0, 61),
      // Stale and never-briefed are subsets of itemCount, never larger.
      staleItemCount: Math.min(itemCount, randInt(`board-stale|${id}`, 0, Math.max(1, Math.round(itemCount * 0.34)))),
      neverBriefedCount: Math.min(itemCount, randInt(`board-nb|${id}`, 0, Math.max(1, Math.round(itemCount * 0.6)))),
      href: `/insights/boards/${id}`,
    };
  }).sort((a, b) => a.lastTouchedDaysAgo - b.lastTouchedDaysAgo);

  return {
    boards,
    staleTotal: boards.reduce((s, b) => s + b.staleItemCount, 0),
    neverBriefedTotal: boards.reduce((s, b) => s + b.neverBriefedCount, 0),
    note: BOARD_NOTE,
  };
}

const EMPTY_BOARDS: BoardHealth = {
  boards: [],
  staleTotal: 0,
  neverBriefedTotal: 0,
  note: BOARD_NOTE,
};

// ── 7.10  Coverage ───────────────────────────────────────────────────────

/**
 * The four adjacent industries offered in the thin state. Real counts are the
 * whole point: a suggestion is only credible if we can show what's behind it.
 */
const THIN_ADJACENT: readonly AdjacentIndustry[] = [
  { industry: "Debt Relief",          liveAds: 340,  advertisers: 12, reason: "Shares advertisers with Credit Repair" },
  { industry: "Personal Loans",       liveAds: 890,  advertisers: 31, reason: "Same audience, adjacent offer" },
  { industry: "Credit Cards",         liveAds: 1204, advertisers: 44, reason: "Highest live volume near your industry" },
  { industry: "Mortgage / Refinance", liveAds: 617,  advertisers: 22, reason: "Overlapping landing-page patterns" },
];

const POPULATED_ADJACENT: readonly AdjacentIndustry[] = [
  { industry: "Supplements",       liveAds: 2870, advertisers: 148, reason: "Shares 41 advertisers with Health & Wellness" },
  { industry: "Skincare Devices",  liveAds: 1130, advertisers: 57,  reason: "Adjacent to Beauty, mostly the same domains" },
  { industry: "Meal Delivery",     liveAds: 1642, advertisers: 74,  reason: "Overlapping creative angles with E-commerce" },
];

const ZERO_STARTER: readonly AdjacentIndustry[] = [
  { industry: "E-commerce",        liveAds: 6420, advertisers: 318, reason: "Widest coverage — good first follow" },
  { industry: "Beauty",            liveAds: 4180, advertisers: 224, reason: "High creative churn, lots to learn from" },
  { industry: "Health & Wellness", liveAds: 3905, advertisers: 196, reason: "Dense angle variety" },
  { industry: "Fashion",           liveAds: 2760, advertisers: 141, reason: "Fast offer cycles" },
  { industry: "Finance",           liveAds: 1890, advertisers: 102, reason: "Heavily tested copy" },
  { industry: "SaaS",              liveAds: 1360, advertisers: 82,  reason: "Long-running creative, clear positioning" },
];

// ── 7.11  Setup checklist ────────────────────────────────────────────────

/**
 * EXACTLY THREE items, always. No weekly-digest item — that feature does not
 * exist and the page will not promise it.
 */
function buildChecklist(done: { industries: boolean; competitor: boolean; extension: boolean }): SetupChecklistItem[] {
  return [
    {
      key: "follow-industries",
      label: "Follow your industries",
      description: "Tells us which slice of the ad library to scan for you.",
      done: done.industries,
      ctaLabel: done.industries ? "Manage industries" : "Pick industries",
      // `/insights/competitors?tab=industries` was a dead end: that page never
      // reads a `tab` param and has no industry-follow surface at all, so the
      // CTA landed on the competitor list with nothing to do. Industries are
      // followed in the feed's preferences modal, which opens on
      // `?modal=prefs` (InsightsV2Feed: `urlModal === "settings" || "prefs"`).
      href: "/insights-v2/feed?modal=prefs",
    },
    {
      key: "track-competitor",
      label: "Track your first competitor",
      description: "Follow an advertiser and we'll flag their new creative.",
      done: done.competitor,
      // "Manage watchlist" said "watchlist" — vocabulary that exists nowhere
      // else in FabAds. The surface is called Competitors, so this says that.
      ctaLabel: done.competitor ? "Manage competitors" : "Add a competitor",
      // `?modal=add` is the trigger InsightsCompetitors already implements for
      // exactly this step (its own comment names it); the bare path left the
      // CTA landing on the list without opening the add dialog it promises.
      href: "/insights/competitors?modal=add",
    },
    {
      key: "install-extension",
      label: "Install the Chrome extension",
      description: "Save any ad you see on Facebook or Instagram straight to a board.",
      done: done.extension,
      ctaLabel: done.extension ? "Extension installed" : "Install extension",
      href: EXTENSION_URL,
    },
  ];
}

// ── 7.12  KPI row ────────────────────────────────────────────────────────

/**
 * 12-point sparkline ending exactly on `end`, drifting from `end / (1+drift)`
 * with hash jitter. One decimal for sub-100 values so percentages survive.
 */
function makeSeries(key: string, end: number, driftPct: number): number[] {
  const start = end / (1 + driftPct / 100);
  const round = Math.abs(end) < 100
    ? (n: number) => Math.round(n * 10) / 10
    : (n: number) => Math.round(n);
  return Array.from({ length: 12 }, (_, i) => {
    if (i === 11) return round(end);
    const t = i / 11;
    const trend = start + (end - start) * t;
    return round(trend * (1 + (rand01(`${key}|pt${i}`) - 0.5) * 0.09));
  });
}

/**
 * ── THE HEADLINE FIVE, IN FABADS' OWN WORDS ───────────────────────────────
 *
 * The previous row said "Live ads observed", "Advertisers indexed", "Median
 * creative lifespan", "Your share of live creative". Three of those were
 * invented for this page: that vocabulary exists nowhere else in FabAds, so a
 * user (and the product owner) cannot find the metric they asked for. These
 * five reuse the words the FabAds Dashboard already uses.
 *
 * Every figure is one the rest of this page already shows, so no two blocks can
 * disagree:
 *
 *   Total saved ads        Σ `boards[].itemCount` — the Saved-Ads block's own rows
 *   Industries followed    `coverage.followedCount`
 *   Brands followed        `watchlist.followCount` === `watchlist.items.length`
 *   Competitors followed   `watchlist.trackedCompetitorCount` — the set every
 *                          `tracked` / `followed` flag on the page comes from
 *   Total competitor ads   `watchlist.trackedCompetitorLiveAds` — Σ `liveAds`
 *                          of those competitors, each one the same `liveAds`
 *                          the domain table and the pages list print
 *
 * TWO SEPARATE LISTS, because FabAds keeps two: brands you follow
 * (`insight_follows`) and competitors you track (`insight_competitors`).
 * "Competitors followed" is therefore a SMALL number and that is correct — and
 * "Total competitor ads" counts only those competitors' ads, not the whole
 * indexed market, so it cannot contradict the competitors block beneath it.
 *
 * The three follow counts carry NO delta: a follow list has no prior-scan
 * history to compare against, and inventing one would be a lie.
 */
function buildHeadlineKpis(ctx: {
  savedAdsTotal: number;
  industriesFollowed: number;
  brandsFollowed: number;
  inactiveBrands: number;
  inactiveThresholdDays: number;
  boardCount: number;
  competitorsFollowed: number;
  totalCompetitorAds: number;
}): KpiTile[] {
  return [
    {
      key: "total-saved-ads",
      label: "Total saved ads",
      value: formatInt(ctx.savedAdsTotal),
      caption: `Across your ${ctx.boardCount} ${plural(ctx.boardCount, "board", "boards")} · your own saves`,
      provenance: "derived",
    },
    {
      key: "industries-followed",
      label: "Industries followed",
      value: formatInt(ctx.industriesFollowed),
      caption: `of ${formatInt(SEEDED_INDUSTRY_COUNT)} in the catalogue · your follow list`,
      provenance: "derived",
    },
    {
      key: "brands-followed",
      label: "Brands followed",
      value: formatInt(ctx.brandsFollowed),
      caption: `Brands you follow · inactive means no new ads in ${ctx.inactiveThresholdDays}+ days`,
      // The one signal the deleted "Watchlist health" block carried.
      subNote: `${formatInt(ctx.brandsFollowed)} followed · ${formatInt(ctx.inactiveBrands)} inactive`,
      provenance: "derived",
    },
    {
      key: "competitors",
      label: "Competitors followed",
      value: formatInt(ctx.competitorsFollowed),
      caption: "Followed brands you also track as competitors · your own list",
      provenance: "derived",
    },
    {
      key: "total-competitor-ads",
      label: "Total competitor ads",
      value: formatInt(ctx.totalCompetitorAds),
      caption: `Ads running now from those ${formatInt(ctx.competitorsFollowed)} ${plural(ctx.competitorsFollowed, "competitor", "competitors")} · Meta Ad Library, last scan 6h ago`,
      deltaPct: 8.4,
      provenance: "observed",
      series: makeSeries("kpi-total-competitor-ads", ctx.totalCompetitorAds, 8.4),
    },
  ];
}

/** `count === 1 ? one : many`. Local copy — this file has no other pluraliser. */
function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

function buildPopulatedKpis(ctx: {
  quietCount: number;
  followCount: number;
  inactiveThresholdDays: number;
  competitorsFollowed: number;
  totalCompetitorAds: number;
  medianLifespanDays: number;
  yourSovPct: number;
  savedAdsTotal: number;
  boardCount: number;
}): KpiTile[] {
  return [
    ...buildHeadlineKpis({
      savedAdsTotal: ctx.savedAdsTotal,
      industriesFollowed: POPULATED_FOLLOWED.length,
      brandsFollowed: ctx.followCount,
      inactiveBrands: ctx.quietCount,
      inactiveThresholdDays: ctx.inactiveThresholdDays,
      boardCount: ctx.boardCount,
      competitorsFollowed: ctx.competitorsFollowed,
      totalCompetitorAds: ctx.totalCompetitorAds,
    }),
    {
      key: "live-ads",
      label: "Live ads observed",
      value: formatInt(POPULATED_LIVE_ADS),
      caption: `Across ${POPULATED_FOLLOWED.length} followed industries · Meta Ad Library, last scan 6h ago`,
      deltaPct: 8.4,
      provenance: "observed",
      series: makeSeries("kpi-live-ads", POPULATED_LIVE_ADS, 8.4),
    },
    {
      key: "advertisers",
      label: "Advertisers indexed",
      value: formatInt(POPULATED_DOMAIN_COUNTS.total),
      caption: "Distinct domains running live creative · last scan 6h ago",
      deltaPct: 3.1,
      provenance: "observed",
      series: makeSeries("kpi-advertisers", POPULATED_DOMAIN_COUNTS.total, 3.1),
    },
    {
      key: "new-signals",
      label: "Changes this week",
      value: formatInt(POPULATED_NEW_SIGNALS),
      caption: "This week's scan compared against last week's · 7-day window",
      deltaPct: 21.4,
      provenance: "derived",
      series: makeSeries("kpi-signals", POPULATED_NEW_SIGNALS, 21.4),
    },
    {
      key: "creative-lifespan",
      label: "Median creative lifespan",
      value: `${ctx.medianLifespanDays} days`,
      caption: "Computed from observed start dates across live ads in your industries",
      deltaPct: -4.2,
      provenance: "derived",
      series: makeSeries("kpi-lifespan", ctx.medianLifespanDays, -4.2),
    },
    {
      key: "est-ecom-sales",
      label: "Est. monthly sales, ecom",
      value: formatUsdCompact(POPULATED_EST_ECOM_SALES),
      caption: `StoreLeads modelled across ${formatInt(POPULATED_DOMAIN_COUNTS.ecom)} ecom domains · modelled, not measured`,
      deltaPct: 5.6,
      provenance: "estimated",
      series: makeSeries("kpi-est-sales", POPULATED_EST_ECOM_SALES, 5.6),
    },
    {
      key: "your-share-of-creative",
      label: "Your share of live creative",
      value: `${ctx.yourSovPct}%`,
      caption: "Your live ads against all live ads in Beauty · creative share, not spend",
      deltaPct: 0.4,
      provenance: "derived",
      series: makeSeries("kpi-your-sov", ctx.yourSovPct, 0.4),
    },
    {
      key: "quiet-advertisers",
      // Same word the Brands-followed sub-note uses. Two labels for one signal
      // is exactly the vocabulary drift this pass removes.
      label: "Inactive brands",
      value: `${ctx.quietCount} of ${ctx.followCount}`,
      caption: `No new creative in ${QUIET_THRESHOLD_DAYS}+ days · derived from scan history`,
      provenance: "derived",
    },
  ];
}

/**
 * The market-side KPI tiles shared by `firstTime` and `empty` — REAL numbers
 * regardless of what the user follows, because the market they describe is
 * true either way (the same rule the market collections follow). Captions
 * say plainly that the scope is the market FabAds tracks, not yet the user's
 * own picks — never claim these are "your" industries when they aren't.
 *
 * `your-share-of-creative` is the one tile that genuinely has no honest
 * number without a configured brand — `empty` passes `yourSovPct: null` and
 * it renders Maalik's own example verbatim: launch your first batch of ads
 * to unlock this comparison.
 */
function buildMarketOnlyKpis(ctx: {
  medianLifespanDays: number;
  yourSovPct: number | null;
  yourSovIndustry: string | null;
}): KpiTile[] {
  const scope = "the industries FabAds tracks — you haven't followed enough yet to scope this to your own picks";
  const tiles: KpiTile[] = [
    {
      key: "live-ads",
      label: "Live ads observed",
      value: formatInt(POPULATED_LIVE_ADS),
      caption: `Across ${scope} · Meta Ad Library, last scan 6h ago`,
      provenance: "observed",
    },
    {
      key: "advertisers",
      label: "Advertisers indexed",
      value: formatInt(POPULATED_DOMAIN_COUNTS.total),
      caption: `Distinct domains running live creative, across ${scope}`,
      provenance: "observed",
    },
    {
      key: "new-signals",
      label: "Changes this week",
      value: formatInt(POPULATED_NEW_SIGNALS),
      caption: `This week's scan compared against last week's, across ${scope}`,
      provenance: "derived",
    },
    {
      key: "creative-lifespan",
      label: "Median creative lifespan",
      value: `${ctx.medianLifespanDays} days`,
      caption: `Computed from observed start dates, across ${scope}`,
      provenance: "derived",
    },
    {
      key: "est-ecom-sales",
      label: "Est. monthly sales, ecom",
      value: formatUsdCompact(POPULATED_EST_ECOM_SALES),
      caption: `StoreLeads modelled across ${formatInt(POPULATED_DOMAIN_COUNTS.ecom)} ecom domains, across ${scope}`,
      provenance: "estimated",
    },
  ];

  tiles.push(
    ctx.yourSovPct !== null && ctx.yourSovIndustry
      ? {
          key: "your-share-of-creative",
          label: "Your share of live creative",
          value: `${ctx.yourSovPct}%`,
          caption: `Your live ads against all live ads in ${ctx.yourSovIndustry} · creative share, not spend`,
          provenance: "derived",
        }
      : {
          key: "your-share-of-creative",
          label: "Your share of live creative",
          value: null,
          naReason: "no brand launched yet",
          caption: "Launch your first batch of ads to unlock this comparison",
          provenance: "derived",
        },
  );

  return tiles;
}

/**
 * `firstTime`-state KPIs. The five headline tiles are REAL, small, honest
 * numbers reflecting the couple of brands this user has actually followed
 * (per Maalik's own description of the state) — not hardcoded zeros. The
 * market-side tiles come from `buildMarketOnlyKpis`, because the market this
 * page describes is real whether or not this workspace has caught up to it.
 */
function buildFirstTimeKpis(ctx: {
  followCount: number;
  trackedCount: number;
  trackedLiveAds: number;
  inactiveCount: number;
  inactiveThresholdDays: number;
  medianLifespanDays: number;
  yourSovPct: number | null;
  yourSovIndustry: string | null;
}): KpiTile[] {
  return [
    {
      key: "total-saved-ads",
      label: "Total saved ads",
      value: "0",
      caption: "You haven't saved an ad to a board yet",
      provenance: "derived",
    },
    {
      key: "industries-followed",
      label: "Industries followed",
      value: "1",
      caption: `of ${formatInt(SEEDED_INDUSTRY_COUNT)} in the catalogue · Credit Repair, added today`,
      provenance: "derived",
    },
    {
      key: "brands-followed",
      label: "Brands followed",
      value: formatInt(ctx.followCount),
      caption: `Brands you follow · inactive means no new ads in ${ctx.inactiveThresholdDays}+ days`,
      subNote: `${formatInt(ctx.followCount)} followed · ${formatInt(ctx.inactiveCount)} inactive`,
      provenance: "derived",
    },
    {
      key: "competitors",
      label: "Competitors followed",
      value: formatInt(ctx.trackedCount),
      caption: "Followed brands you also track as competitors · your own list",
      provenance: "derived",
    },
    {
      key: "total-competitor-ads",
      label: "Total competitor ads",
      value: formatInt(ctx.trackedLiveAds),
      caption: `Ads running now from ${ctx.trackedCount ? "that competitor" : "your tracked competitors"} · Meta Ad Library`,
      provenance: "observed",
    },
    ...buildMarketOnlyKpis(ctx),
    {
      key: "quiet-advertisers",
      label: "Inactive brands",
      value: `${ctx.inactiveCount} of ${ctx.followCount}`,
      caption: `No new creative in ${QUIET_THRESHOLD_DAYS}+ days · derived from scan history`,
      provenance: "derived",
    },
  ];
}

/**
 * `empty`-state KPIs. Nothing followed, nothing saved, nothing tracked — the
 * five headline tiles are genuine zeros, a fact about an empty workspace, not
 * a missing figure. The market-side tiles still come from
 * `buildMarketOnlyKpis`: an empty workspace does not make the market empty.
 */
function buildEmptyKpis(ctx: { medianLifespanDays: number }): KpiTile[] {
  return [
    {
      key: "total-saved-ads",
      label: "Total saved ads",
      value: "0",
      caption: "You haven't saved an ad to a board yet",
      provenance: "derived",
    },
    {
      key: "industries-followed",
      label: "Industries followed",
      value: "0",
      caption: `of ${formatInt(SEEDED_INDUSTRY_COUNT)} in the catalogue · pick one to start`,
      provenance: "derived",
    },
    {
      key: "brands-followed",
      label: "Brands followed",
      value: "0",
      caption: "Follow a brand and we'll track what it ships",
      provenance: "derived",
    },
    {
      key: "competitors",
      label: "Competitors followed",
      value: "0",
      caption: "Track a competitor and we'll watch what it ships",
      provenance: "derived",
    },
    {
      key: "total-competitor-ads",
      label: "Total competitor ads",
      value: "0",
      caption: "You're not tracking any competitors yet",
      provenance: "observed",
    },
    ...buildMarketOnlyKpis({
      medianLifespanDays: ctx.medianLifespanDays,
      yourSovPct: null,
      yourSovIndustry: null,
    }),
    {
      key: "quiet-advertisers",
      label: "Inactive brands",
      value: null,
      naReason: "nothing tracked yet",
      caption: "Follow a brand and we'll flag when it stops shipping",
      provenance: "derived",
    },
  ];
}

// ── 7.13  Written brief ──────────────────────────────────────────────────

/**
 * Assembled from this module's own numbers and nothing else. `facts` is
 * exactly the set the paragraph was built from, so the UI can show its
 * working. NEVER label this "AI".
 */
function buildPopulatedBrief(ctx: {
  topMover: Mover | null;
  topAngle: AngleSlice | null;
  quietCount: number;
  followCount: number;
  gatedSignalCount: number;
}): DailyBrief {
  const { topMover, topAngle, quietCount, followCount, gatedSignalCount } = ctx;

  const sentences: string[] = [
    `Across your ${POPULATED_FOLLOWED.length} followed industries we're seeing ${formatInt(POPULATED_LIVE_ADS)} live ads from ${formatInt(POPULATED_DOMAIN_COUNTS.total)} advertisers, and ${POPULATED_NEW_SIGNALS} changes since last week's scan — ${gatedSignalCount} of them have now shown up more than once.`,
  ];
  if (topMover) {
    sentences.push(
      `The sharpest move is ${topMover.domain} in ${topMover.industry} — ${topMover.adCount30d} new ads in the last 30 days against ${topMover.adCountPrev30d} the month before, up ${topMover.deltaPct}%.`,
    );
  }
  if (topAngle) {
    sentences.push(
      `${topAngle.marketPct}% of live creative in your industries opens on ${topAngle.angle.toLowerCase()} copy, against ${topAngle.yourPct}% of yours.`,
    );
  }
  sentences.push(
    `${quietCount} of the ${followCount} brands you follow haven't shipped anything new in ${QUIET_THRESHOLD_DAYS} days.`,
  );

  const facts: DailyBriefFact[] = [
    { label: "Live ads observed", value: formatInt(POPULATED_LIVE_ADS), provenance: "observed" },
    { label: "Advertisers indexed", value: formatInt(POPULATED_DOMAIN_COUNTS.total), provenance: "observed" },
    { label: "Changes detected this week", value: formatInt(POPULATED_NEW_SIGNALS), provenance: "derived" },
    { label: "Changes past the recurrence gate", value: String(gatedSignalCount), provenance: "derived" },
  ];
  if (topMover) {
    facts.push({
      label: "Fastest-growing domain",
      value: `${topMover.domain} · ${topMover.adCountPrev30d} → ${topMover.adCount30d} new ads (30d)`,
      provenance: "derived",
    });
  }
  if (topAngle) {
    facts.push({
      label: "Dominant market angle",
      value: `${topAngle.angle} · ${topAngle.marketPct}% of live creative`,
      provenance: "derived",
    });
  }
  facts.push({
    label: "Inactive brands",
    value: `${quietCount} of ${followCount}`,
    provenance: "derived",
  });

  return {
    paragraph: sentences.join(" "),
    facts,
    generatedLabel: `Written from your followed industries · ${gatedSignalCount} recurring changes in the 7 days to ${shortDateLabel(0)}`,
    available: true,
  };
}

// ═════════════════════════════════════════════════════════════════════════
// §8  State assemblers
// ═════════════════════════════════════════════════════════════════════════

const REFRESH_NOTE_POPULATED =
  "Last scanned 6h ago. We scan when you open Insights and when you add a follow — there's no scheduled re-sync, so these numbers move when you do.";
const REFRESH_NOTE_FIRST_TIME =
  "Credit Repair was added today and its first scan is running. Everything else on this page is the wider market FabAds already tracks. We scan an industry when you follow it and again when you open Insights — there's no scheduled re-sync.";
const REFRESH_NOTE_EMPTY =
  "Nothing scanned for you yet — you haven't followed an industry. Everything below is the wider market FabAds already tracks. We scan an industry when you follow it — there's no scheduled re-sync.";

function buildPopulated(): DashboardFixture {
  const pool = adsForIndustries(POPULATED_INDUSTRY_NAMES);

  const watchlist = buildWatchlist(POPULATED_INDUSTRY_NAMES);
  // `tracked` on a domain / page / mover row means "a competitor you follow",
  // NOT "a brand you follow" — so it comes off the competitor subset. That is
  // what keeps the "Competitors followed" KPI equal to the number of follow
  // pills already lit on the page.
  const trackedDomains = new Set(watchlist.trackedCompetitors.map((i) => i.domain));

  const movers = buildMovers(POPULATED_INDUSTRY_NAMES, trackedDomains);
  const topMover = movers.length ? movers[0] : null;
  const cadence = buildCadence(pool, 3, topMover);

  const myBrand = buildMyBrand(MY_BRAND_SEED_POPULATED);
  const angles = buildAngles(pool, myBrand.angleMix);
  const topAngle = angles.length ? angles[0] : null;

  const signals = buildSignals(pool, POPULATED_INDUSTRY_NAMES, trackedDomains);
  const longRunners = buildLongRunners(POPULATED_INDUSTRY_NAMES);
  const domains = buildDomainRows(trackedDomains, POPULATED_INDUSTRY_NAMES);
  // Pages are a SPLIT of the domain rows above, so the two views of one
  // advertiser always add up. See `buildPages`.
  const pages = buildPages(domains, trackedDomains);
  const yourAdCountsByIndustry = new Map(
    MY_BRAND_INDUSTRY_AD_COUNTS.map((c) => [c.industry, c.adCount]),
  );
  const shareOfVoice = buildShareOfVoice(
    MY_BRAND_INDUSTRY_AD_COUNTS.map((c) => c.industry),
    myBrand,
    yourAdCountsByIndustry,
  );
  const industryShare = buildIndustryShare(POPULATED_FOLLOWED, myBrand, yourAdCountsByIndustry);
  const boards = buildBoards();
  const savedAdsTotal = boards.boards.reduce((s, b) => s + b.itemCount, 0);

  // Median lifespan across the pool, from the parsed (not invented) durations.
  const durations = pool.map((a) => parseDurationDays(a.activeDuration)).sort((a, b) => a - b);
  const medianLifespanDays = durations.length
    ? Math.round(durations[Math.floor(durations.length / 2)] * 1.85)
    : 0;

  const kpis = buildPopulatedKpis({
    quietCount: watchlist.inactiveCount,
    followCount: watchlist.followCount,
    inactiveThresholdDays: watchlist.inactiveThresholdDays,
    competitorsFollowed: watchlist.trackedCompetitorCount,
    totalCompetitorAds: watchlist.trackedCompetitorLiveAds,
    medianLifespanDays,
    yourSovPct: shareOfVoice[0]?.you.pct ?? 0,
    savedAdsTotal,
    boardCount: boards.boards.length,
  });

  const navSurfaces = buildNavSurfaces(
    {
      "my-feeds": POPULATED_FOLLOWED.length,
      discover: POPULATED_LIVE_ADS,
      "saved-ads": savedAdsTotal,
      // Competitors you follow — the same number the KPI prints. The
      // whole-market figure is the Domain surface below it.
      competitor: watchlist.trackedCompetitorCount,
      domain: POPULATED_DOMAIN_COUNTS.total,
      // Same metric in every state as `TrendsSummary` prints — the newsroom's
      // own total. It used to be POPULATED_NEW_SIGNALS (a scan-derived
      // "changes detected this week" figure with its own KPI tile) here and
      // TRENDS_TOTAL_UPDATES in firstTime/empty: one row, two different
      // metrics by state.
      trends: TRENDS_TOTAL_UPDATES,
    },
    {},
  );

  const coverage: CoverageInfo = {
    followed: [...POPULATED_FOLLOWED],
    followedCount: POPULATED_FOLLOWED.length,
    seededIndustryCount: SEEDED_INDUSTRY_COUNT,
    indexedAdTotal: POPULATED_LIVE_ADS,
    adjacent: [...POPULATED_ADJACENT],
    adjacentHeading: "Industries next to yours",
    gapNote: null,
  };

  const brief = buildPopulatedBrief({
    topMover,
    topAngle,
    quietCount: watchlist.quietCount,
    followCount: watchlist.followCount,
    gatedSignalCount: signals.filter((s) => s.meetsRecurrenceGate).length,
  });

  const meta: DashboardMeta = {
    state: "populated",
    generatedAtISO: NOW_ISO,
    dataAsOfLabel: `Data as of ${shortDateLabel(0)}`,
    lastScanLabel: "Last scan 6h ago",
    refreshNote: REFRESH_NOTE_POPULATED,
    followedIndustryCount: POPULATED_FOLLOWED.length,
    seededIndustryCount: SEEDED_INDUSTRY_COUNT,
    liveAdsObserved: POPULATED_LIVE_ADS,
    domainCount: POPULATED_DOMAIN_COUNTS.total,
    domainTypeCounts: POPULATED_DOMAIN_COUNTS,
    newSignalsThisWeek: POPULATED_NEW_SIGNALS,
    cadenceScopeNote: `New ads per week from the ${watchlist.followCount} brands you follow · 12 weeks to ${shortDateLabel(0)}`,
    stateNote: `${POPULATED_FOLLOWED.length} of ${SEEDED_INDUSTRY_COUNT} industries followed.`,
    isLoading: false,
    sources: sourcesHealthy(),
    failedSources: [],
    degradedTiers: [],
    staleness: buildStaleness(
      0,
      "Last complete scan today, 6h ago",
      "Every figure below comes from a scan that completed 6h ago. We scan when you open Insights and when you add a follow — there's no scheduled re-sync.",
    ),
  };

  return {
    state: "populated",
    meta,
    kpis,
    signals,
    longRunners,
    cadence,
    angles,
    movers,
    domains,
    pages,
    industryShare,
    navSurfaces,
    domainTypeCounts: POPULATED_DOMAIN_COUNTS,
    myBrand,
    shareOfVoice,
    watchlist,
    boards,
    coverage,
    checklist: buildChecklist({ industries: true, competitor: true, extension: true }),
    brief,
    trends: TRENDS_SUMMARY_LIVE,
  };
}

/**
 * ═════════════════════════════════════════════════════════════════════════
 * §7.14  Market snapshot — shared by `firstTime` and `empty`
 * ═════════════════════════════════════════════════════════════════════════
 *
 * "Empty means YOUR side is empty. The market is never empty" (Maalik). Both
 * near-empty states show the SAME six-industry market preview
 * (`POPULATED_INDUSTRY_NAMES` — already tuned so every copy angle has real
 * coverage) for every block that isn't specifically about the user's own
 * follow list: top advertisers (`movers`), the domain table, angle mix,
 * industry brand share, share of voice, long-running creative, change
 * signals and the launch-cadence chart.
 *
 * This is DELIBERATELY NOT the user's own `coverage.followed` set (which, in
 * both states, tells a different, narrower story about the user's specific
 * follow gap — see `buildFirstTime` / `buildEmpty`). A component rendering
 * these collections in `firstTime` / `empty` must not caption them "in your
 * industries" — say "across the market" / "the industries FabAds tracks"
 * instead; only `coverage` and the setup checklist are about the user's own
 * picks.
 *
 * What stays a real zero or an absent `null` in both states is the USER'S
 * side: `trackedDomains` (which rows get `tracked: true`), `myBrand` (small
 * and present in `firstTime`, `null` in `empty`), and everything under
 * `watchlist` / `boards` / `coverage`, none of which this function touches.
 */
function buildMarketSnapshot(
  myBrand: MyBrand | null,
  trackedDomains: ReadonlySet<string>,
): {
  pool: InsightAd[];
  movers: Mover[];
  cadence: LaunchCadenceWeek[];
  angles: AngleSlice[];
  signals: ChangeSignal[];
  longRunners: LongRunnerAd[];
  domains: DomainRow[];
  pages: PageRow[];
  industryShare: IndustryShareRow[];
  shareOfVoice: ShareOfVoiceRow[];
} {
  const industries = POPULATED_INDUSTRY_NAMES;
  const pool = adsForIndustries(industries);
  const tracked = new Set(trackedDomains);

  const movers = buildMovers(industries, tracked);
  const topMover = movers.length ? movers[0] : null;
  const cadence = buildCadence(pool, 3, topMover);
  const angles = buildAngles(pool, myBrand?.angleMix ?? []);
  const signals = buildSignals(pool, industries, tracked);
  const longRunners = buildLongRunners(industries);
  const domains = buildDomainRows(tracked, industries);
  const pages = buildPages(domains, tracked);
  const industryShare = buildIndustryShare(POPULATED_FOLLOWED, myBrand);
  const shareOfVoice = buildShareOfVoice(SHARE_OF_VOICE_MARKET_PREVIEW, myBrand);

  return { pool, movers, cadence, angles, signals, longRunners, domains, pages, industryShare, shareOfVoice };
}

/** Median lifespan (days), from parsed durations — same formula `populated` uses. */
function medianLifespanFor(pool: readonly InsightAd[]): number {
  const durations = pool.map((a) => parseDurationDays(a.activeDuration)).sort((a, b) => a - b);
  return durations.length ? Math.round(durations[Math.floor(durations.length / 2)] * 1.85) : 0;
}

/**
 * `firstTime` (Day 1): one followed industry, "Credit Repair", not yet
 * indexed — the distinction the coverage story exists to make: 0 indexed
 * ads in Credit Repair is a gap on OUR side, not an empty market. A couple of
 * brands are followed (`buildWatchlist(..., 2, 1)`) and a small brand of the
 * user's own is configured, per Maalik's own description of the state.
 *
 * Every MARKET collection (`movers`, `domains`, `pages`, `industryShare`,
 * `angles`, `signals`, `longRunners`, `cadence`, `shareOfVoice`) is filled
 * from `buildMarketSnapshot` — the market never collapses to empty just
 * because Credit Repair hasn't been scanned yet.
 */
function buildFirstTime(): DashboardFixture {
  const myBrand = buildMyBrand(MY_BRAND_SEED_FIRST_TIME);

  const watchlist = buildWatchlist(POPULATED_INDUSTRY_NAMES, 2, 1);
  const trackedDomains = new Set(watchlist.trackedCompetitors.map((i) => i.domain));

  const market = buildMarketSnapshot(myBrand, trackedDomains);
  const medianLifespanDays = medianLifespanFor(market.pool);
  const yourShareRow = market.shareOfVoice.find((r) => r.hasYourData) ?? null;

  const followed: FollowedIndustry[] = [
    {
      industry: "Credit Repair",
      indexedAds: 0,
      advertisers: 0,
      lastScanDaysAgo: null,
      scanState: "scanning",
    },
  ];

  const coverage: CoverageInfo = {
    followed,
    followedCount: 1,
    seededIndustryCount: SEEDED_INDUSTRY_COUNT,
    indexedAdTotal: 0,
    adjacent: [...THIN_ADJACENT],
    adjacentHeading: "Industries we have indexed next to Credit Repair",
    gapNote:
      "We haven't indexed Credit Repair yet — that's a gap on our side, not an empty market. These four neighbours are indexed today, and they share advertisers with it.",
  };

  const meta: DashboardMeta = {
    state: "firstTime",
    generatedAtISO: NOW_ISO,
    dataAsOfLabel: `Data as of ${shortDateLabel(0)}`,
    lastScanLabel: "First scan of Credit Repair in progress",
    refreshNote: REFRESH_NOTE_FIRST_TIME,
    followedIndustryCount: 1,
    seededIndustryCount: SEEDED_INDUSTRY_COUNT,
    // The market preview IS real and indexed — only Credit Repair, the
    // user's own follow, isn't. These figures describe the market preview,
    // matching the KPI row and every market block on the page.
    liveAdsObserved: POPULATED_LIVE_ADS,
    domainCount: POPULATED_DOMAIN_COUNTS.total,
    domainTypeCounts: POPULATED_DOMAIN_COUNTS,
    newSignalsThisWeek: POPULATED_NEW_SIGNALS,
    cadenceScopeNote: `New ads per week across the industries FabAds tracks · 12 weeks to ${shortDateLabel(0)} — Credit Repair has no indexed ads yet`,
    stateNote:
      "1 industry followed, 0 ads indexed in it yet. Credit Repair isn't in our index yet — everything else on this page is the wider market.",
    isLoading: false,
    // Nothing has FAILED here — Credit Repair's first scan simply hasn't
    // finished, so its three sources are `pending`. A day-1 workspace must
    // never read as broken.
    sources: sourcesPending(
      {
        "meta-ad-library": "First scan of Credit Repair still running",
        storeleads: "No storefronts found in Credit Repair yet",
        "fabads-scan": "Needs a second scan before it can compute anything",
      },
      {
        "meta-ad-library":
          "The Meta Ad Library scan of Credit Repair started today and hasn't finished.",
        storeleads:
          "StoreLeads models storefronts. Credit Repair has no ecom domains indexed yet, so there is nothing for it to model.",
        "fabads-scan":
          "Everything derived compares two consecutive scans. We only have one so far.",
      },
      {
        "meta-ad-library": "first scan in progress",
        storeleads: "needs store data to estimate",
        "fabads-scan": "needs two scans to compare",
      },
    ),
    failedSources: [],
    degradedTiers: [],
    staleness: buildStaleness(
      null,
      "First scan in progress",
      "No scan of Credit Repair has completed yet, so there is nothing to be fresh or stale about YOUR follow. We scan when you add an industry and when you open Insights.",
    ),
  };

  return {
    state: "firstTime",
    meta,
    kpis: buildFirstTimeKpis({
      followCount: watchlist.followCount,
      trackedCount: watchlist.trackedCompetitorCount,
      trackedLiveAds: watchlist.trackedCompetitorLiveAds,
      inactiveCount: watchlist.inactiveCount,
      inactiveThresholdDays: watchlist.inactiveThresholdDays,
      medianLifespanDays,
      yourSovPct: yourShareRow?.you.pct ?? null,
      yourSovIndustry: yourShareRow?.industry ?? null,
    }),
    signals: market.signals,
    longRunners: market.longRunners,
    cadence: market.cadence,
    angles: market.angles,
    movers: market.movers,
    domains: market.domains,
    pages: market.pages,
    industryShare: market.industryShare,
    navSurfaces: buildNavSurfaces(
      {
        "my-feeds": 1,
        // Discover / Domain / Trends explore the WHOLE indexed library, not
        // just what you follow — real market totals, same as `populated`.
        discover: POPULATED_LIVE_ADS,
        "saved-ads": 0,
        // Your own follow list — a real, small count.
        competitor: watchlist.trackedCompetitorCount,
        domain: POPULATED_DOMAIN_COUNTS.total,
        trends: TRENDS_TOTAL_UPDATES,
      },
      {},
    ),
    domainTypeCounts: POPULATED_DOMAIN_COUNTS,
    myBrand,
    shareOfVoice: market.shareOfVoice,
    watchlist,
    boards: EMPTY_BOARDS,
    coverage,
    checklist: buildChecklist({ industries: true, competitor: true, extension: false }),
    brief: {
      paragraph: "",
      facts: [],
      generatedLabel: "",
      available: false,
      unavailableReason:
        "Nothing indexed in Credit Repair yet, so there's nothing of YOURS to summarise. Follow an indexed industry and this fills in on the next scan.",
    },
    trends: TRENDS_SUMMARY_FIRST_LOOK,
  };
}

/**
 * `empty`: brand new workspace, nothing followed, nothing saved, no brand
 * configured. Every collection about the USER is a real zero or an absent
 * `null` — but every MARKET collection (`movers`, `domains`, `pages`,
 * `industryShare`, `angles`, `signals`, `longRunners`, `cadence`,
 * `shareOfVoice`) is filled from `buildMarketSnapshot`, exactly as in
 * `firstTime`. Nothing followed does not mean nothing to show.
 */
function buildEmpty(): DashboardFixture {
  const market = buildMarketSnapshot(null, new Set());
  const medianLifespanDays = medianLifespanFor(market.pool);

  const coverage: CoverageInfo = {
    followed: [],
    followedCount: 0,
    seededIndustryCount: SEEDED_INDUSTRY_COUNT,
    indexedAdTotal: 0,
    adjacent: [...ZERO_STARTER],
    adjacentHeading: "Start with one of these",
    gapNote:
      `You're not following anything yet, so there's nothing for us to scan on your behalf. Pick an industry from the ${SEEDED_INDUSTRY_COUNT} in the catalogue and we'll index it.`,
  };

  const meta: DashboardMeta = {
    state: "empty",
    generatedAtISO: NOW_ISO,
    dataAsOfLabel: `Data as of ${shortDateLabel(0)}`,
    lastScanLabel: "Not scanned for you yet",
    refreshNote: REFRESH_NOTE_EMPTY,
    followedIndustryCount: 0,
    seededIndustryCount: SEEDED_INDUSTRY_COUNT,
    // Real market totals — nothing followed doesn't mean nothing indexed.
    liveAdsObserved: POPULATED_LIVE_ADS,
    domainCount: POPULATED_DOMAIN_COUNTS.total,
    domainTypeCounts: POPULATED_DOMAIN_COUNTS,
    newSignalsThisWeek: POPULATED_NEW_SIGNALS,
    cadenceScopeNote: `New ads per week across the industries FabAds tracks · 12 weeks to ${shortDateLabel(0)} — follow one to scope this to your own picks`,
    stateNote: `Nothing followed yet. ${SEEDED_INDUSTRY_COUNT} industries available — everything below is the wider market.`,
    isLoading: false,
    sources: sourcesPending(
      {
        "meta-ad-library": "Nothing followed yet, so nothing scanned for you",
        storeleads: "Nothing followed yet, so nothing modelled for you",
        "fabads-scan": "Nothing followed yet, so nothing computed for you",
      },
      {
        "meta-ad-library":
          "We scan the slice of the ad library you follow. You're not following anything yet.",
        storeleads:
          "StoreLeads models the storefronts we've found for what you follow. You're not following anything yet.",
        "fabads-scan":
          "Everything derived compares two consecutive scans of what you follow. Nothing has been scanned for you.",
      },
      {
        "meta-ad-library": "nothing followed to scan",
        storeleads: "needs store data to estimate",
        "fabads-scan": "nothing followed to compare",
      },
    ),
    failedSources: [],
    degradedTiers: [],
    staleness: buildStaleness(
      null,
      "Not scanned for you yet",
      "Nothing has been scanned on your behalf, so there is no freshness to report for your own follow list. We scan an industry when you follow it.",
    ),
  };

  return {
    state: "empty",
    meta,
    kpis: buildEmptyKpis({ medianLifespanDays }),
    signals: market.signals,
    longRunners: market.longRunners,
    cadence: market.cadence,
    angles: market.angles,
    movers: market.movers,
    domains: market.domains,
    pages: market.pages,
    industryShare: market.industryShare,
    navSurfaces: buildNavSurfaces(
      {
        "my-feeds": 0,
        // Discover / Domain / Trends explore the WHOLE indexed library, not
        // just what you follow — real market totals, same as `populated`.
        discover: POPULATED_LIVE_ADS,
        "saved-ads": 0,
        competitor: 0,
        domain: POPULATED_DOMAIN_COUNTS.total,
        trends: TRENDS_TOTAL_UPDATES,
      },
      {},
    ),
    domainTypeCounts: POPULATED_DOMAIN_COUNTS,
    myBrand: null,
    shareOfVoice: market.shareOfVoice,
    watchlist: EMPTY_WATCHLIST(),
    boards: EMPTY_BOARDS,
    coverage,
    checklist: buildChecklist({ industries: false, competitor: false, extension: false }),
    brief: {
      paragraph: "",
      facts: [],
      generatedLabel: "",
      available: false,
      unavailableReason:
        "Follow an industry and we'll write this from what we find in it.",
    },
    trends: TRENDS_SUMMARY_FIRST_LOOK,
  };
}

// ── 8.1  Loading: first paint, nothing resolved ──────────────────────────

/** Which source each KPI tile is waiting on. Drives the loading captions. */
const KPI_SOURCE: Readonly<Record<string, DataSourceKey>> = {
  // The headline five. The FOUR configuration counts (saved / followed /
  // tracked) come from our own records, so they sit under the FabAds scan; only
  // "Total competitor ads" counts something Meta has to answer for.
  "total-saved-ads": "fabads-scan",
  "industries-followed": "fabads-scan",
  "brands-followed": "fabads-scan",
  competitors: "fabads-scan",
  "total-competitor-ads": "meta-ad-library",
  "live-ads": "meta-ad-library",
  advertisers: "meta-ad-library",
  "new-signals": "fabads-scan",
  "creative-lifespan": "fabads-scan",
  "est-ecom-sales": "storeleads",
  "your-share-of-creative": "fabads-scan",
  "quiet-advertisers": "fabads-scan",
};

/** Loading captions, per source. Says what we are waiting on, nothing more. */
const KPI_LOADING_CAPTION: Readonly<Record<DataSourceKey, string>> = {
  "meta-ad-library": "Meta Ad Library · waiting for a response",
  storeleads: "StoreLeads · waiting for a response",
  "fabads-scan": "Computed once this scan lands",
};

/**
 * Loading KPIs — every tile `value: null`, every `naReason` naming the source
 * we are waiting on.
 *
 * The tiles exist (same seven keys, same labels, same provenance) so a
 * skeleton can occupy the exact footprint the real row will. The `naReason`
 * is the fallback for anything that renders the tile without a skeleton: it
 * says "waiting on X", never "no data", because those mean opposite things.
 */
function buildLoadingKpis(): KpiTile[] {
  return buildEmptyKpis({ medianLifespanDays: 0 }).map<KpiTile>((tile) => {
    const key = KPI_SOURCE[tile.key] ?? "fabads-scan";
    return {
      key: tile.key,
      label: tile.label,
      value: null,
      naReason: PENDING_NA_REASON[key],
      caption: KPI_LOADING_CAPTION[key],
      provenance: tile.provenance,
    };
  });
}

/**
 * Loading: FIRST PAINT. Nothing has come back from anywhere.
 *
 * Every collection is empty and every KPI is null — exactly like `zero` on the
 * surface, and the opposite of it in meaning. `meta.isLoading` is the ONLY
 * safe way to tell them apart, which is why it exists. Render skeletons here;
 * a "you have no data" empty state would be a lie about a page that simply
 * hasn't finished loading.
 *
 * The checklist still carries its three items (it always does, in every
 * state), but everything reads `done: false` because nothing is resolved —
 * so the checklist must render as a skeleton here too, not as "0 of 3 done".
 */
function buildLoading(): DashboardFixture {
  const coverage: CoverageInfo = {
    followed: [],
    followedCount: 0,
    seededIndustryCount: SEEDED_INDUSTRY_COUNT,
    indexedAdTotal: 0,
    // Deliberately empty: suggestions are only credible with real counts
    // attached, and we have not fetched any counts yet.
    adjacent: [],
    adjacentHeading: "Loading suggestions",
    gapNote: null,
  };

  const meta: DashboardMeta = {
    state: "loading",
    generatedAtISO: NOW_ISO,
    dataAsOfLabel: "Loading",
    lastScanLabel: "Checking for new data",
    refreshNote:
      "Loading what we have on file and asking the Meta Ad Library and StoreLeads for the rest. Nothing on this page is final until they answer.",
    followedIndustryCount: 0,
    seededIndustryCount: SEEDED_INDUSTRY_COUNT,
    liveAdsObserved: null,
    domainCount: null,
    domainTypeCounts: null,
    newSignalsThisWeek: 0,
    cadenceScopeNote: "Loading the last 12 weeks of launches.",
    stateNote: "Loading. Nothing on this page has resolved yet.",
    isLoading: true,
    sources: sourcesPending(
      {
        "meta-ad-library": "Waiting for a response",
        storeleads: "Waiting for a response",
        "fabads-scan": "Waiting for this scan to finish",
      },
      {
        "meta-ad-library": "We've asked the Meta Ad Library and haven't heard back yet.",
        storeleads: "We've asked StoreLeads and haven't heard back yet.",
        "fabads-scan":
          "Derived figures are computed once the scan lands. This one is still running.",
      },
    ),
    failedSources: [],
    degradedTiers: [],
    staleness: buildStaleness(
      null,
      "Checking for new data",
      "We haven't finished loading, so there's nothing to call fresh or stale yet.",
    ),
  };

  return {
    state: "loading",
    meta,
    kpis: buildLoadingKpis(),
    signals: [],
    longRunners: [],
    cadence: [],
    angles: [],
    movers: [],
    domains: [],
    pages: [],
    industryShare: [],
    // Every count is null with "waiting" as the reason. NOT zero: zero would
    // tell the user they have nothing when we simply haven't looked yet.
    navSurfaces: buildNavSurfaces(
      {
        "my-feeds": null,
        discover: null,
        "saved-ads": null,
        competitor: null,
        domain: null,
        trends: null,
      },
      {
        "my-feeds": "loading",
        discover: "loading",
        "saved-ads": "loading",
        competitor: "loading",
        domain: "loading",
        trends: "loading",
      },
    ),
    domainTypeCounts: EMPTY_DOMAIN_COUNTS,
    myBrand: null,
    shareOfVoice: [],
    watchlist: EMPTY_WATCHLIST(),
    boards: EMPTY_BOARDS,
    coverage,
    checklist: buildChecklist({ industries: false, competitor: false, extension: false }),
    brief: {
      paragraph: "",
      facts: [],
      generatedLabel: "",
      available: false,
      unavailableReason: "Still loading — the brief is written once the scan lands.",
    },
    trends: TRENDS_SUMMARY_LOADING,
  };
}

// ═════════════════════════════════════════════════════════════════════════
// §8.3  Trends teaser — numbers only
// ═════════════════════════════════════════════════════════════════════════
//
// A minimal, numbers-only summary of the Industry Insights Trends newsroom
// (`src/insights-trends`) for a small dashboard block that links out rather
// than repeating any story (Maalik: "Trends ke only numbers dikha de").
//
// SOURCE OF TRUTH: the six mock arrays imported at the top of this file from
// `trendsData.ts`. Every count below is that array's own `.length` — never a
// separately-typed number — so this block and `/insights/trends` can never
// disagree about how many items exist. If `trendsData.ts` ever grows a new
// source array, it needs a matching row here or the new source silently goes
// uncounted — there is no automatic discovery.
//
// DEEP LINKS verified against `useTrendsFilters`
// (`src/insights-trends/hooks/useTrendsFilters.ts`) and the per-tab dataset
// switch in `TrendsPage.tsx`:
//  - `news` and `search` land on a tab whose dataset IS that array exactly
//    (`NEWS_ITEMS` / `SEARCH_DEMAND`), so those two hrefs are exact filters.
//  - `meta-ads` / `tiktok-hooks` use the Social tab's real "Platform" facet
//    (`?fa=Meta` / `?fa=TikTok`), which `facetSlotMatches` derives from this
//    same data (`type === "meta"` / `"tiktok"`) and genuinely narrows to
//    exactly that source — not an invented param the page ignores.
//  - `breaking` has no dedicated tab or filter: breaking stories render only
//    on Overview, mixed in with every other source. Its href is the tab.
//  - `social` (Instagram/YouTube/LinkedIn/X, i.e. `OTHER_SOCIAL`) has no
//    single facet value that isolates exactly that mixed set either — same
//    fallback, the tab (which also includes Meta + TikTok, honestly broader
//    than this one row).

const TRENDS_HREF = "/insights/trends";

const TRENDS_SOURCE_DEFS: ReadonlyArray<{
  key: TrendsSourceKey;
  label: string;
  items: ReadonlyArray<{ publishedAt: string }>;
  href: string;
}> = [
  {
    key: "breaking",
    label: "Breaking stories",
    items: BREAKING_STORIES,
    href: `${TRENDS_HREF}?tab=overview`,
  },
  {
    key: "news",
    label: "News",
    items: NEWS_ITEMS,
    href: `${TRENDS_HREF}?tab=news`,
  },
  {
    key: "meta-ads",
    label: "Meta ads",
    items: META_ADS,
    href: `${TRENDS_HREF}?tab=social&fa=Meta`,
  },
  {
    key: "tiktok-hooks",
    label: "TikTok hooks",
    items: TIKTOK_HOOKS,
    href: `${TRENDS_HREF}?tab=social&fa=TikTok`,
  },
  {
    key: "search",
    label: "Search demand",
    items: SEARCH_DEMAND,
    href: `${TRENDS_HREF}?tab=search`,
  },
  {
    key: "social",
    label: "Other social",
    items: OTHER_SOCIAL,
    href: `${TRENDS_HREF}?tab=social`,
  },
];

/**
 * How many items across every source were published on the two most recent
 * calendar dates present in the mock corpus.
 *
 * Deterministic and `Date.now()`-free by construction: it never reads
 * today's real date, only the `publishedAt` strings already baked into
 * `trendsData.ts`, so the result is identical on every render and every day
 * this runs, exactly like every other number in this file.
 */
function trendsNewUpdatesCount(): number {
  const allDates = TRENDS_SOURCE_DEFS.flatMap((def) => def.items.map((i) => i.publishedAt));
  const mostRecentTwo = new Set(Array.from(new Set(allDates)).sort().slice(-2));
  return allDates.filter((d) => mostRecentTwo.has(d)).length;
}

const TRENDS_TOTAL_UPDATES = TRENDS_SOURCE_DEFS.reduce((sum, def) => sum + def.items.length, 0);
const TRENDS_NEW_UPDATES = trendsNewUpdatesCount();

/**
 * `populated`: Trends is fed by Google Trends and news/social sources, not by
 * the Meta Ad Library or StoreLeads scan, so it never depends on either.
 */
const TRENDS_SUMMARY_LIVE: TrendsSummary = {
  sources: TRENDS_SOURCE_DEFS.map(({ key, label, items, href }) => ({
    key,
    label,
    count: items.length,
    href,
  })),
  totalUpdates: TRENDS_TOTAL_UPDATES,
  newUpdates: TRENDS_NEW_UPDATES,
  lastCheckedLabel: "Last checked 6h ago",
  href: TRENDS_HREF,
  isEmpty: false,
  isLoading: false,
};

/**
 * `firstTime` / `empty`: Trends is genuinely UNAFFECTED by what the user
 * follows — Google Trends and news/social sources don't care whether this
 * workspace has followed anything — so its counts are the SAME real numbers
 * as `populated`. The one honest difference: `newUpdates` needs a PRIOR check
 * to diff against, and a brand new workspace has never checked before, so
 * that one field goes to `null` with a reason rather than a fabricated delta.
 * This replaced a previous version that zeroed out every count for these two
 * states, which was exactly the "make the market wrong to match your empty
 * account" mistake the rest of this file works hard to avoid.
 */
const TRENDS_SUMMARY_FIRST_LOOK: TrendsSummary = {
  ...TRENDS_SUMMARY_LIVE,
  newUpdates: null,
  // Kept to ~2 wrapped lines at the 180px slot it renders in. The long form
  // ("This is the first time we've checked Trends for your workspace — nothing
  // to compare against yet.") wrapped to four, which is the whole ~39px
  // difference between this block's height here and in `populated`.
  newUpdatesNaReason: "First check — nothing to compare against yet.",
  lastCheckedLabel: "Checked just now",
  isEmpty: false,
};

/**
 * Loading: nothing has resolved. Counts are 0, but `isLoading: true` is the
 * flag a component must branch on FIRST — this is "not yet", not "none",
 * exactly the distinction `DashboardMeta.isLoading` exists to make
 * everywhere else on this page.
 */
const TRENDS_SUMMARY_LOADING: TrendsSummary = {
  sources: TRENDS_SOURCE_DEFS.map<TrendsSourceCount>(({ key, label, href }) => ({
    key,
    label,
    count: 0,
    href,
  })),
  totalUpdates: 0,
  newUpdates: null,
  newUpdatesNaReason: "Still checking Trends for the first time.",
  lastCheckedLabel: "Checking now…",
  href: TRENDS_HREF,
  isEmpty: false,
  isLoading: true,
};

// ═════════════════════════════════════════════════════════════════════════
// §9  Entry point
// ═════════════════════════════════════════════════════════════════════════

const FIXTURE_CACHE = new Map<DashboardState, DashboardFixture>();

/**
 * THE entry point. Every dashboard component and selector reads from here.
 *
 * Memoised per state, so repeated calls are cheap AND reference-identical —
 * safe to call inside a render without churning `useMemo` dependencies.
 */
export function getDashboardFixture(state: DashboardState): DashboardFixture {
  const hit = FIXTURE_CACHE.get(state);
  if (hit) return hit;
  const built =
    state === "populated" ? buildPopulated() :
    state === "firstTime" ? buildFirstTime() :
    state === "loading" ? buildLoading() :
    buildEmpty();
  FIXTURE_CACHE.set(state, built);
  return built;
}

/**
 * The four states, in demo-toggle order: the three data states first, then
 * the loading transition. `DashboardState` is validated against this list in
 * `state/DashboardState.tsx`, so adding a member here is all it takes for
 * `?state=` to accept it. (`thin` / `zero` / `error` are gone — see
 * `DashboardState` in `./types.ts`; old links carrying those values are
 * aliased to their replacements in `state/DashboardState.tsx`, not here.)
 */
export const DASHBOARD_STATES: readonly DashboardState[] = [
  "populated",
  "firstTime",
  "empty",
  "loading",
];

/** Short labels for a state switcher. */
export const DASHBOARD_STATE_LABELS: Readonly<Record<DashboardState, string>> = {
  populated: "Populated",
  firstTime: "First-time (day 1)",
  empty: "Empty",
  loading: "Loading",
};

/**
 * Two groups for the dev state switcher: how much data there is, versus
 * whether the fetch behind it worked. `loading` stays in its own "Fetch" row
 * even though it is alone there now — `empty` and `loading` render almost
 * identically and mean opposite things, and separating them by heading keeps
 * a reviewer reading them as different questions rather than merging the
 * groups into one three-across row.
 */
export interface DashboardStateGroup {
  key: "data" | "fetch";
  /** Mono micro-label for the row, e.g. "DATA". */
  label: string;
  states: readonly DashboardState[];
}

export const DASHBOARD_STATE_GROUPS: readonly DashboardStateGroup[] = [
  { key: "data", label: "Data", states: ["populated", "firstTime", "empty"] },
  { key: "fetch", label: "Fetch", states: ["loading"] },
];
