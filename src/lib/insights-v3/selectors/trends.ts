/**
 * Launch frequency, trend %, Rising and Scaling (Q7).
 *
 * - Launch date = startedAt, else firstSeenAt.
 * - Trend % = launches in the period vs the previous equal period. Period "all"
 *   compares the last 30 days vs the 30 before. Previous = 0 → null ("New this period").
 * - Rising = launches up vs the previous period (null-with-launches counts as rising).
 *   `rising()` ranks by trend %; "new this period" items rank after numeric risers.
 * - Scaling = active-ad count up vs the end of the previous period AND ≥1 winner.
 *
 * Pass ads that are scoped by industry/category/prefs but NOT by period
 * (`adsInBaseScope`), so the previous period is visible.
 */
import { ACTIVE_WINDOW_DAYS } from "../types";
import type { Ad, ElementType, PeriodKey, Scope, TagGroupKey, TrendBucket, TrendSeries } from "../types";
import { INDEX, slugify } from "../data";
import type { DataIndex } from "../data";
import { DAY_MS, byKeys, comparisonDays, periodDays, toMs } from "./context";
import { adsInBaseScope } from "./scope";
import type { ScopeOpts } from "./scope";
import { tagLabel } from "./tags";
import { isWinner } from "./winner";

export function launchMs(ad: Ad): number {
  return toMs(ad.startedAt) ?? toMs(ad.firstSeenAt) ?? 0;
}

export function bucketFor(period: PeriodKey): TrendBucket {
  const d = periodDays(period);
  if (d != null && d <= 30) return "day";
  if (d != null && d <= 180) return "week";
  return "month";
}

export function trendPct(cur: number, prev: number): number | null {
  if (prev === 0) return null;
  return Math.round(((cur - prev) / prev) * 100);
}

function startOfUtcDay(ms: number): number {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

const UNIT: Record<TrendBucket, string> = {
  day: "new ads per day",
  week: "new ads per week",
  month: "new ads per month",
};

/** Bucket starts (ms) covering the period up to now. */
function bucketStarts(period: PeriodKey, now: number, earliest: number | null): { starts: number[]; bucket: TrendBucket } {
  const bucket = bucketFor(period);
  const days = periodDays(period);
  const today = startOfUtcDay(now);
  if (bucket === "day") {
    const n = days ?? 30;
    return { bucket, starts: Array.from({ length: n }, (_, i) => today - (n - 1 - i) * DAY_MS) };
  }
  if (bucket === "week") {
    const n = Math.ceil((days ?? 180) / 7);
    const lastStart = today - 6 * DAY_MS;
    return { bucket, starts: Array.from({ length: n }, (_, i) => lastStart - (n - 1 - i) * 7 * DAY_MS) };
  }
  const from = days != null ? now - days * DAY_MS : earliest ?? now - 365 * DAY_MS;
  const start = new Date(from);
  const end = new Date(now);
  const starts: number[] = [];
  let y = start.getUTCFullYear();
  let m = start.getUTCMonth();
  while (y < end.getUTCFullYear() || (y === end.getUTCFullYear() && m <= end.getUTCMonth())) {
    starts.push(Date.UTC(y, m, 1));
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }
  return { bucket, starts };
}

/** Launch counts in the current vs previous comparison window. */
export function launchCompare(ads: Ad[], period: PeriodKey, now: number): { cur: number; prev: number; changePct: number | null } {
  const d = comparisonDays(period) * DAY_MS;
  let cur = 0;
  let prev = 0;
  for (const a of ads) {
    const t = launchMs(a);
    if (t > now - d && t <= now) cur++;
    else if (t > now - 2 * d && t <= now - d) prev++;
  }
  return { cur, prev, changePct: trendPct(cur, prev) };
}

/** Launch series for an already-filtered set of ads (no scope filtering here). */
export function launchSeries(ads: Ad[], period: PeriodKey, now: number): TrendSeries {
  let earliest: number | null = null;
  if (period === "all") for (const a of ads) earliest = earliest == null ? launchMs(a) : Math.min(earliest, launchMs(a));
  const { starts, bucket } = bucketStarts(period, now, earliest);
  const counts = new Array(starts.length).fill(0) as number[];
  const first = starts[0] ?? now;
  for (const a of ads) {
    const t = launchMs(a);
    if (t < first || t > now) continue;
    // binary search for the bucket
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= t) lo = mid;
      else hi = mid - 1;
    }
    counts[lo]++;
  }
  return {
    unit: UNIT[bucket],
    bucket,
    points: starts.map((s, i) => ({ start: new Date(s).toISOString(), count: counts[i] })),
    changePct: launchCompare(ads, period, now).changePct,
  };
}

/** Launch-frequency chart for a page: industry/category/prefs from `scope`, bucketed by `scope.period`. */
export function launchFrequency(ads: Ad[], scope: Scope, now: number, opts?: Partial<ScopeOpts>): TrendSeries {
  return launchSeries(adsInBaseScope(ads, scope, opts), scope.period, now);
}

/* ── per-entity comparison ──────────────────────────────────────────────── */

export interface PeriodComparison {
  /** Launches this period / previous period. */
  cur: number;
  prev: number;
  changePct: number | null;
  /** Active (seen live) now vs at the end of the previous period. */
  activeNow: number;
  activePrev: number;
  winners: number;
}

function wasActiveAt(ad: Ad, t: number): boolean {
  const last = toMs(ad.lastSeenAt) ?? 0;
  return launchMs(ad) <= t && last >= t - ACTIVE_WINDOW_DAYS * DAY_MS;
}

export function compareEntity(ads: Ad[], period: PeriodKey, now: number): PeriodComparison {
  const { cur, prev, changePct } = launchCompare(ads, period, now);
  const prevEnd = now - comparisonDays(period) * DAY_MS;
  let activeNow = 0;
  let activePrev = 0;
  let winners = 0;
  for (const a of ads) {
    if (a.status === "active") activeNow++;
    if (wasActiveAt(a, prevEnd)) activePrev++;
    if (isWinner(a)) winners++;
  }
  return { cur, prev, changePct, activeNow, activePrev, winners };
}

export function isRisingComparison(c: Pick<PeriodComparison, "cur" | "prev" | "changePct">): boolean {
  return c.changePct != null ? c.changePct > 0 : c.cur > 0;
}

export function isScalingComparison(c: Pick<PeriodComparison, "activeNow" | "activePrev" | "winners">): boolean {
  return c.activeNow > c.activePrev && c.winners >= 1;
}

/* ── rising / scaling lists ─────────────────────────────────────────────── */

export type TrendEntityKind = "page" | "domain" | "landing-page" | "offer" | ElementType | "keyword";

export interface TrendItem extends PeriodComparison {
  kind: TrendEntityKind;
  id: string;
  label: string;
  /** Ads of this entity in the base scope. */
  adCount: number;
}

const KIND_GROUP: Partial<Record<TrendEntityKind, TagGroupKey>> = {
  framework: "framework",
  hook: "hookStyle",
  angle: "angle",
  concept: "concept",
  keyword: "keyword",
  "landing-page": "landingPage",
  offer: "offerDomain",
};

export function entityKeysOf(ad: Ad, kind: TrendEntityKind, data: DataIndex = INDEX): string[] {
  switch (kind) {
    case "page": return [ad.pageAdvertiserId];
    case "domain": return ad.domainAdvertiserId ? [ad.domainAdvertiserId] : [];
    case "landing-page": return ad.landingPageId ? [ad.landingPageId] : [];
    case "offer": {
      const lp = ad.landingPageId ? data.landingPageById.get(ad.landingPageId) : undefined;
      return lp?.offerDomain ? [lp.offerDomain] : [];
    }
    case "framework": return ad.analysis.framework ? [ad.analysis.framework] : [];
    case "hook": return ad.analysis.hookStyle ? [ad.analysis.hookStyle] : [];
    case "angle": return ad.analysis.angle ? [ad.analysis.angle] : [];
    case "concept": return ad.analysis.concept ? [ad.analysis.concept] : [];
    case "keyword": return Array.from(new Set(ad.analysis.keywords.map(slugify)));
    default: return [];
  }
}

export function entityLabel(kind: TrendEntityKind, id: string, data: DataIndex = INDEX): string {
  if (kind === "page" || kind === "domain") return data.advertiserById.get(id)?.name ?? id;
  const group = KIND_GROUP[kind];
  return group ? tagLabel(group, id, data) : id;
}

/** Group base-scope ads by entity. */
export function groupByEntity(ads: Ad[], kind: TrendEntityKind, data: DataIndex = INDEX): Map<string, Ad[]> {
  const m = new Map<string, Ad[]>();
  for (const a of ads) {
    for (const k of entityKeysOf(a, kind, data)) {
      const list = m.get(k);
      if (list) list.push(a);
      else m.set(k, [a]);
    }
  }
  return m;
}

/** Period comparison for every entity of a kind found in `baseAds`. */
export function trendItems(kind: TrendEntityKind, baseAds: Ad[], period: PeriodKey, now: number, data: DataIndex = INDEX): TrendItem[] {
  const out: TrendItem[] = [];
  for (const [id, ads] of groupByEntity(baseAds, kind, data)) {
    out.push({ kind, id, label: entityLabel(kind, id, data), adCount: ads.length, ...compareEntity(ads, period, now) });
  }
  return out;
}

/**
 * Rank key for "fastest rising": positive % (desc) → "new this period" (by
 * launches) → flat / falling % → no launches at all.
 */
export function risingRank(c: Pick<PeriodComparison, "changePct" | "cur">): number {
  if (c.changePct != null && c.changePct > 0) return 2_000_000 + c.changePct;
  if (c.changePct == null && c.cur > 0) return 1_000_000 + c.cur;
  if (c.changePct != null) return c.changePct;
  return -1_000_000;
}

export interface TrendListOpts {
  limit?: number;
  data?: DataIndex;
}

/** Rising entities, top by trend % (no minimum base, Q7). */
export function rising(kind: TrendEntityKind, baseAds: Ad[], period: PeriodKey, now: number, opts: TrendListOpts = {}): TrendItem[] {
  return trendItems(kind, baseAds, period, now, opts.data)
    .filter((x) => x.id !== "other") // the catch-all bucket is never a "rising element"
    .filter(isRisingComparison)
    .sort(byKeys<TrendItem>(risingRank, (x) => x.cur))
    .slice(0, opts.limit ?? 10);
}

/** Scaling entities: active count up vs previous period AND ≥1 winner. */
export function scaling(kind: TrendEntityKind, baseAds: Ad[], period: PeriodKey, now: number, opts: TrendListOpts = {}): TrendItem[] {
  return trendItems(kind, baseAds, period, now, opts.data)
    .filter((x) => x.id !== "other")
    .filter(isScalingComparison)
    .sort(byKeys<TrendItem>((x) => x.activeNow - x.activePrev, (x) => x.winners))
    .slice(0, opts.limit ?? 10);
}

export interface TrendingTag {
  groupKey: Extract<TagGroupKey, "keyword" | "angle">;
  id: string;
  label: string;
  /** Launches this period. */
  count: number;
  changePct: number | null;
}

/**
 * Trending tags for the overview strip: rising keywords and angles in scope
 * (replaces the prototype's placeholder hashtags). Falls back to the most
 * launched this period when fewer than `limit` are rising.
 */
export function trendingTags(baseAds: Ad[], period: PeriodKey, now: number, opts: TrendListOpts = {}): TrendingTag[] {
  const limit = opts.limit ?? 12;
  const toTag = (x: TrendItem): TrendingTag => ({
    groupKey: x.kind === "angle" ? "angle" : "keyword",
    id: x.id,
    label: x.label,
    count: x.cur,
    changePct: x.changePct,
  });
  const all = [...trendItems("keyword", baseAds, period, now, opts.data), ...trendItems("angle", baseAds, period, now, opts.data)];
  const risers = all.filter(isRisingComparison).sort(byKeys<TrendItem>(risingRank, (x) => x.cur));
  const out = risers.slice(0, limit);
  if (out.length < limit) {
    const rest = all.filter((x) => !out.includes(x) && x.cur > 0).sort(byKeys<TrendItem>((x) => x.cur));
    out.push(...rest.slice(0, limit - out.length));
  }
  return out.map(toTag);
}
