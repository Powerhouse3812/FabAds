/**
 * Creative Report 2.0 — derived selector layer.
 *
 * Every metric shown in the UI is folded here from AdInstance.daily[] rows.
 * The cardinal rule (product-plan §8.3): sum ADDITIVE metrics (spend,
 * impressions, clicks, purchases, revenue…) then RECOMPUTE ratios from the
 * sums — never average ROAS/CTR/CPA across instances or days.
 *
 * Also owns: bucket assignment, the fatigue rule, spend-trend, compare-period
 * deltas, component roll-ups (spend-weighted win-rate), and confidence.
 */
import type {
  AdInstance,
  Creative,
  Dataset,
  DailyRow,
  Platform,
} from "@/data/model";
import type { BucketKey, ComponentTab } from "@/creative-report/lib/paramSchema";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type Confidence = "high" | "medium" | "low";

export interface FoldedMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  outboundClicks: number;
  purchases: number;
  revenue: number;
  /** null when the creative has no video component (static/carousel). */
  video3s: number | null;
  thruplays: number | null;
  // Recomputed ratios (from the sums above):
  ctr: number; // %
  outboundCtr: number; // %
  cpc: number | null;
  cpm: number;
  cpa: number | null;
  cvr: number; // %
  roas: number;
  hookRate: number | null; // %  (video only)
  holdRate: number | null; // %  (video only)
  frequency: number; // mean of daily snapshots
}

export interface FatigueVerdict {
  isFatiguing: boolean;
  /** Human reason chip, e.g. "CTR −22% / 14d" or "Freq 4.8". */
  reason: string | null;
  ctrDeltaPct: number | null;
  hookDeltaPct: number | null;
  freq7: number;
}

export interface SeriesPoint {
  date: string;
  spend: number;
  revenue: number;
  ctr: number;
  frequency: number;
  hookRate: number | null;
}

export interface CreativeRollup {
  creative: Creative;
  metrics: FoldedMetrics;
  bucket: BucketKey | null;
  fatigue: FatigueVerdict;
  /** Data confidence from sample size (purchases n). */
  confidence: Confidence;
  /** null = not enough data. */
  spendTrendPct: number | null;
  roasDeltaPct: number | null;
  cpaDeltaPct: number | null;
  platforms: Platform[];
  accountIds: string[];
  instanceCount: number;
  isCrossPlatform: boolean;
  /** Whether this creative belongs to a flagged near-duplicate pair. */
  dedupGroupId?: string;
  dedupMatch?: number;
  series: SeriesPoint[];
  /** Ad instances that survived the filter (for drawer "where it's running"). */
  instances: AdInstance[];
  ageDays: number;
}

export interface FilterInput {
  from: string;
  to: string;
  compareEnabled: boolean;
  accounts: string[];
  statuses: string[];
  platforms: string[];
  formats: string[];
  geo: string[];
  device: string[];
  objective: string[];
  age: string[];
  gender: string[];
  q?: string;
}

/* ------------------------------------------------------------------ */
/*  Bucket rules (hardcoded, visible on hover — handoff §5.1)          */
/* ------------------------------------------------------------------ */

export const BUCKET_RULES: Record<BucketKey, string> = {
  winners: "ROAS ≥ 2.0 and spend ≥ $1,000 in range",
  scaling: "Spend up ≥ 20% (last 7d vs prior 7d) with ROAS ≥ 1.5",
  fatiguing: "14-day CTR down ≥ 15%, or frequency > 4, or hook-rate falling",
  new: "Launched in the last 7 days",
  losers: "ROAS < 1.0 at spend ≥ $500",
};

const WINNER_ROAS = 2.0;
const WINNER_SPEND = 1000;
const SCALING_ROAS = 1.5;
const SCALING_TREND = 20;
const LOSER_ROAS = 1.0;
const LOSER_SPEND = 500;
const FATIGUE_MIN_SPEND = 500;
const FATIGUE_CTR_DROP = 15; // percent
const FATIGUE_FREQ = 4;
const NEW_AGE_DAYS = 7;

/* ------------------------------------------------------------------ */
/*  Date helpers                                                       */
/* ------------------------------------------------------------------ */

function parseISO(d: string): Date {
  return new Date(`${d}T00:00:00`);
}
function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}
function daysBetween(from: string, to: string): number {
  return Math.round((parseISO(to).getTime() - parseISO(from).getTime()) / 86400000);
}
function inRange(date: string, from: string, to: string): boolean {
  return date >= from && date <= to;
}

/* ------------------------------------------------------------------ */
/*  Folding                                                            */
/* ------------------------------------------------------------------ */

function emptyFold(): {
  spend: number; impressions: number; clicks: number; outboundClicks: number;
  purchases: number; revenue: number; video3s: number; thruplays: number;
  freqSum: number; freqCount: number; hasVideo: boolean;
} {
  return {
    spend: 0, impressions: 0, clicks: 0, outboundClicks: 0,
    purchases: 0, revenue: 0, video3s: 0, thruplays: 0,
    freqSum: 0, freqCount: 0, hasVideo: false,
  };
}

/** Fold a set of daily rows into recomputed metrics. */
export function foldRows(rows: DailyRow[], isVideo: boolean): FoldedMetrics {
  const a = emptyFold();
  for (const r of rows) {
    a.spend += r.spend;
    a.impressions += r.impressions;
    a.clicks += r.clicks;
    a.outboundClicks += r.outboundClicks;
    a.purchases += r.purchases;
    a.revenue += r.revenue;
    if (r.video3s !== null) {
      a.video3s += r.video3s;
      a.hasVideo = true;
    }
    if (r.thruplays !== null) a.thruplays += r.thruplays;
    a.freqSum += r.frequency;
    a.freqCount += 1;
  }
  const video = isVideo && a.hasVideo;
  return {
    spend: a.spend,
    impressions: a.impressions,
    clicks: a.clicks,
    outboundClicks: a.outboundClicks,
    purchases: a.purchases,
    revenue: a.revenue,
    video3s: video ? a.video3s : null,
    thruplays: video ? a.thruplays : null,
    ctr: a.impressions > 0 ? (a.clicks / a.impressions) * 100 : 0,
    outboundCtr: a.impressions > 0 ? (a.outboundClicks / a.impressions) * 100 : 0,
    cpc: a.clicks > 0 ? a.spend / a.clicks : null,
    cpm: a.impressions > 0 ? (a.spend / a.impressions) * 1000 : 0,
    cpa: a.purchases > 0 ? a.spend / a.purchases : null,
    cvr: a.clicks > 0 ? (a.purchases / a.clicks) * 100 : 0,
    roas: a.spend > 0 ? a.revenue / a.spend : 0,
    hookRate: video && a.impressions > 0 ? (a.video3s / a.impressions) * 100 : null,
    holdRate: video && a.video3s > 0 ? (a.thruplays / a.video3s) * 100 : null,
    frequency: a.freqCount > 0 ? a.freqSum / a.freqCount : 0,
  };
}

/* ------------------------------------------------------------------ */
/*  Instance filtering                                                 */
/* ------------------------------------------------------------------ */

function instanceMatches(inst: AdInstance, f: FilterInput): boolean {
  if (f.accounts.length && !f.accounts.includes(inst.accountId)) return false;
  if (f.statuses.length && !f.statuses.includes(inst.status)) return false;
  if (f.platforms.length && !f.platforms.includes(inst.platform)) return false;
  if (f.geo.length && !f.geo.includes(inst.geo)) return false;
  if (f.device.length && !f.device.includes(inst.device)) return false;
  if (f.objective.length && !f.objective.includes(inst.objective)) return false;
  if (f.age.length && !f.age.includes(inst.age)) return false;
  if (f.gender.length && !f.gender.includes(inst.gender)) return false;
  return true;
}

/** Rows of an instance clipped to a date window. */
function rowsInWindow(inst: AdInstance, from: string, to: string): DailyRow[] {
  return inst.daily.filter((r) => inRange(r.date, from, to));
}

/* ------------------------------------------------------------------ */
/*  Fatigue                                                            */
/* ------------------------------------------------------------------ */

interface DateAgg {
  impressions: number;
  clicks: number;
  video3s: number;
  hasVideo: boolean;
  freqSum: number;
  freqCount: number;
}

function aggregateByDate(instances: AdInstance[], from: string, to: string): Map<string, DateAgg> {
  const map = new Map<string, DateAgg>();
  for (const inst of instances) {
    for (const r of rowsInWindow(inst, from, to)) {
      let e = map.get(r.date);
      if (!e) {
        e = { impressions: 0, clicks: 0, video3s: 0, hasVideo: false, freqSum: 0, freqCount: 0 };
        map.set(r.date, e);
      }
      e.impressions += r.impressions;
      e.clicks += r.clicks;
      if (r.video3s !== null) {
        e.video3s += r.video3s;
        e.hasVideo = true;
      }
      e.freqSum += r.frequency;
      e.freqCount += 1;
    }
  }
  return map;
}

/** Mean CTR (%) over [winFrom, winTo] from a per-date aggregate. */
function windowCtr(byDate: Map<string, DateAgg>, winFrom: string, winTo: string): number | null {
  let impr = 0;
  let clicks = 0;
  for (const [date, e] of byDate) {
    if (inRange(date, winFrom, winTo)) {
      impr += e.impressions;
      clicks += e.clicks;
    }
  }
  return impr > 0 ? (clicks / impr) * 100 : null;
}

function windowHookRate(byDate: Map<string, DateAgg>, winFrom: string, winTo: string): number | null {
  let impr = 0;
  let v3 = 0;
  let hasVideo = false;
  for (const [date, e] of byDate) {
    if (inRange(date, winFrom, winTo)) {
      impr += e.impressions;
      v3 += e.video3s;
      if (e.hasVideo) hasVideo = true;
    }
  }
  return hasVideo && impr > 0 ? (v3 / impr) * 100 : null;
}

function computeFatigue(
  instances: AdInstance[],
  to: string,
  spend: number,
): FatigueVerdict {
  const toDate = parseISO(to);
  const last14From = isoDate(addDays(toDate, -13));
  const prior14From = isoDate(addDays(toDate, -27));
  const prior14To = isoDate(addDays(toDate, -14));
  const last7From = isoDate(addDays(toDate, -6));

  const byDate = aggregateByDate(instances, prior14From, to);

  // Frequency over last 7 days (mean of daily means).
  let freqSum = 0;
  let freqCount = 0;
  for (const [date, e] of byDate) {
    if (inRange(date, last7From, to) && e.freqCount > 0) {
      freqSum += e.freqSum / e.freqCount;
      freqCount += 1;
    }
  }
  const freq7 = freqCount > 0 ? freqSum / freqCount : 0;

  const lastCtr = windowCtr(byDate, last14From, to);
  const priorCtr = windowCtr(byDate, prior14From, prior14To);
  const ctrDeltaPct =
    lastCtr !== null && priorCtr !== null && priorCtr > 0
      ? ((lastCtr - priorCtr) / priorCtr) * 100
      : null;

  const lastHook = windowHookRate(byDate, last14From, to);
  const priorHook = windowHookRate(byDate, prior14From, prior14To);
  const hookDeltaPct =
    lastHook !== null && priorHook !== null && priorHook > 0
      ? ((lastHook - priorHook) / priorHook) * 100
      : null;

  const ctrFatigued = ctrDeltaPct !== null && ctrDeltaPct <= -FATIGUE_CTR_DROP;
  const freqFatigued = freq7 > FATIGUE_FREQ;
  const hookFatigued = hookDeltaPct !== null && hookDeltaPct <= -FATIGUE_CTR_DROP;
  const enoughSpend = spend >= FATIGUE_MIN_SPEND;

  const isFatiguing = enoughSpend && (ctrFatigued || freqFatigued || hookFatigued);

  // Reason chip = the most salient trigger.
  let reason: string | null = null;
  if (isFatiguing) {
    if (ctrFatigued && ctrDeltaPct !== null) reason = `CTR ${Math.round(ctrDeltaPct)}% / 14d`;
    else if (freqFatigued) reason = `Freq ${freq7.toFixed(1)}`;
    else if (hookFatigued && hookDeltaPct !== null) reason = `Hook rate ${Math.round(hookDeltaPct)}% / 14d`;
  }

  return { isFatiguing, reason, ctrDeltaPct, hookDeltaPct, freq7 };
}

/* ------------------------------------------------------------------ */
/*  Confidence                                                         */
/* ------------------------------------------------------------------ */

export function confidenceFromN(purchases: number): Confidence {
  if (purchases >= 30) return "high";
  if (purchases >= 10) return "medium";
  return "low";
}

/* ------------------------------------------------------------------ */
/*  Per-creative rollup                                                */
/* ------------------------------------------------------------------ */

function buildSeries(instances: AdInstance[], from: string, to: string, isVideo: boolean): SeriesPoint[] {
  const byDate = new Map<string, { spend: number; revenue: number; impressions: number; clicks: number; video3s: number; hasVideo: boolean; freqSum: number; freqCount: number }>();
  for (const inst of instances) {
    for (const r of rowsInWindow(inst, from, to)) {
      let e = byDate.get(r.date);
      if (!e) {
        e = { spend: 0, revenue: 0, impressions: 0, clicks: 0, video3s: 0, hasVideo: false, freqSum: 0, freqCount: 0 };
        byDate.set(r.date, e);
      }
      e.spend += r.spend;
      e.revenue += r.revenue;
      e.impressions += r.impressions;
      e.clicks += r.clicks;
      if (r.video3s !== null) {
        e.video3s += r.video3s;
        e.hasVideo = true;
      }
      e.freqSum += r.frequency;
      e.freqCount += 1;
    }
  }
  return [...byDate.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, e]) => ({
      date,
      spend: e.spend,
      revenue: e.revenue,
      ctr: e.impressions > 0 ? (e.clicks / e.impressions) * 100 : 0,
      frequency: e.freqCount > 0 ? e.freqSum / e.freqCount : 0,
      hookRate: isVideo && e.hasVideo && e.impressions > 0 ? (e.video3s / e.impressions) * 100 : null,
    }));
}

function windowSpend(instances: AdInstance[], from: string, to: string): number {
  let s = 0;
  for (const inst of instances) for (const r of rowsInWindow(inst, from, to)) s += r.spend;
  return s;
}

function assignBucket(
  creative: Creative,
  metrics: FoldedMetrics,
  fatigue: FatigueVerdict,
  spendTrendPct: number | null,
  ageDays: number,
): BucketKey | null {
  // Priority order: New → Fatiguing → Winners → Scaling → Losers → steady.
  if (ageDays <= NEW_AGE_DAYS) return "new";
  if (fatigue.isFatiguing) return "fatiguing";
  if (metrics.roas >= WINNER_ROAS && metrics.spend >= WINNER_SPEND) return "winners";
  if (
    spendTrendPct !== null &&
    spendTrendPct >= SCALING_TREND &&
    metrics.roas >= SCALING_ROAS &&
    metrics.spend >= WINNER_SPEND
  ) {
    return "scaling";
  }
  if (metrics.roas < LOSER_ROAS && metrics.spend >= LOSER_SPEND) return "losers";
  return null;
}

export function rollupCreative(
  dataset: Dataset,
  creative: Creative,
  f: FilterInput,
): CreativeRollup | null {
  const all = dataset.instancesByCreative[creative.id] ?? [];
  const instances = all.filter((inst) => instanceMatches(inst, f));
  if (instances.length === 0) return null;

  const isVideo = creative.format === "video";
  const rangeRows: DailyRow[] = [];
  for (const inst of instances) rangeRows.push(...rowsInWindow(inst, f.from, f.to));
  if (rangeRows.length === 0) return null;

  const metrics = foldRows(rangeRows, isVideo);

  // Compare period (previous equal-length window immediately before `from`).
  const len = daysBetween(f.from, f.to); // inclusive length-1
  const prevTo = isoDate(addDays(parseISO(f.from), -1));
  const prevFrom = isoDate(addDays(parseISO(f.from), -(len + 1)));
  const prevRows: DailyRow[] = [];
  for (const inst of instances) prevRows.push(...rowsInWindow(inst, prevFrom, prevTo));
  const prev = prevRows.length ? foldRows(prevRows, isVideo) : null;

  const roasDeltaPct =
    f.compareEnabled && prev && prev.roas > 0 ? ((metrics.roas - prev.roas) / prev.roas) * 100 : null;
  const cpaDeltaPct =
    f.compareEnabled && prev && prev.cpa && metrics.cpa
      ? ((metrics.cpa - prev.cpa) / prev.cpa) * 100
      : null;

  // Spend trend: last 7 vs prior 7 (relative to `to`).
  const toDate = parseISO(f.to);
  const last7From = isoDate(addDays(toDate, -6));
  const prior7From = isoDate(addDays(toDate, -13));
  const prior7To = isoDate(addDays(toDate, -7));
  const last7 = windowSpend(instances, last7From, f.to);
  const prior7 = windowSpend(instances, prior7From, prior7To);
  const spendTrendPct = prior7 > 0 ? ((last7 - prior7) / prior7) * 100 : null;

  const fatigue = computeFatigue(instances, f.to, metrics.spend);
  const ageDays = Math.max(0, daysBetween(creative.createdAt, f.to));
  const bucket = assignBucket(creative, metrics, fatigue, spendTrendPct, ageDays);

  const platforms = [...new Set(instances.map((i) => i.platform))] as Platform[];
  const accountIds = [...new Set(instances.map((i) => i.accountId))];

  return {
    creative,
    metrics,
    bucket,
    fatigue,
    confidence: confidenceFromN(metrics.purchases),
    spendTrendPct,
    roasDeltaPct,
    cpaDeltaPct,
    platforms,
    accountIds,
    instanceCount: instances.length,
    isCrossPlatform: platforms.length > 1 || accountIds.length > 1,
    dedupGroupId: creative.dedupGroupId,
    dedupMatch: creative.dedupMatch,
    series: buildSeries(instances, f.from, f.to, isVideo),
    instances,
    ageDays,
  };
}

/* ------------------------------------------------------------------ */
/*  Collection selectors                                               */
/* ------------------------------------------------------------------ */

export function selectCreatives(dataset: Dataset, f: FilterInput): CreativeRollup[] {
  const q = f.q?.trim().toLowerCase();
  const rollups: CreativeRollup[] = [];
  for (const creative of dataset.creatives) {
    if (f.formats.length && !f.formats.includes(creative.format)) continue;
    if (q) {
      const hay = `${creative.name} ${creative.product} ${creative.components.hook}`.toLowerCase();
      if (!hay.includes(q)) continue;
    }
    const rollup = rollupCreative(dataset, creative, f);
    if (rollup) rollups.push(rollup);
  }
  return rollups;
}

export function bucketCounts(rollups: CreativeRollup[]): Record<BucketKey, number> {
  const counts: Record<BucketKey, number> = {
    winners: 0, scaling: 0, fatiguing: 0, new: 0, losers: 0,
  };
  for (const r of rollups) if (r.bucket) counts[r.bucket] += 1;
  return counts;
}

/** Fatiguing creatives, worst first, capped. */
export function fatiguingNow(rollups: CreativeRollup[], limit = 5): CreativeRollup[] {
  return rollups
    .filter((r) => r.bucket === "fatiguing")
    .sort((a, b) => b.metrics.spend - a.metrics.spend)
    .slice(0, limit);
}

/** Biggest movers by |ROAS Δ| (needs compare period). */
export function topMovers(rollups: CreativeRollup[], limit = 6): CreativeRollup[] {
  return rollups
    .filter((r) => r.roasDeltaPct !== null && r.metrics.spend >= 500)
    .sort((a, b) => Math.abs(b.roasDeltaPct!) - Math.abs(a.roasDeltaPct!))
    .slice(0, limit);
}

export interface KpiSummary {
  spend: number;
  revenue: number;
  roas: number;
  purchases: number;
  cpa: number | null;
  ctr: number;
  spendDeltaPct: number | null;
  revenueDeltaPct: number | null;
  roasDeltaPct: number | null;
  cpaDeltaPct: number | null;
}

/** Portfolio totals for the KPI cards (sum then recompute). */
export function kpiSummary(dataset: Dataset, f: FilterInput): KpiSummary {
  const cur = emptyFold();
  const prev = emptyFold();
  const len = daysBetween(f.from, f.to);
  const prevTo = isoDate(addDays(parseISO(f.from), -1));
  const prevFrom = isoDate(addDays(parseISO(f.from), -(len + 1)));

  for (const creative of dataset.creatives) {
    if (f.formats.length && !f.formats.includes(creative.format)) continue;
    const insts = (dataset.instancesByCreative[creative.id] ?? []).filter((i) => instanceMatches(i, f));
    for (const inst of insts) {
      for (const r of inst.daily) {
        if (inRange(r.date, f.from, f.to)) accumulate(cur, r);
        else if (f.compareEnabled && inRange(r.date, prevFrom, prevTo)) accumulate(prev, r);
      }
    }
  }

  const roas = cur.spend > 0 ? cur.revenue / cur.spend : 0;
  const cpa = cur.purchases > 0 ? cur.spend / cur.purchases : null;
  const ctr = cur.impressions > 0 ? (cur.clicks / cur.impressions) * 100 : 0;
  const prevRoas = prev.spend > 0 ? prev.revenue / prev.spend : 0;
  const prevCpa = prev.purchases > 0 ? prev.spend / prev.purchases : null;

  return {
    spend: cur.spend,
    revenue: cur.revenue,
    roas,
    purchases: cur.purchases,
    cpa,
    ctr,
    spendDeltaPct: f.compareEnabled && prev.spend > 0 ? ((cur.spend - prev.spend) / prev.spend) * 100 : null,
    revenueDeltaPct: f.compareEnabled && prev.revenue > 0 ? ((cur.revenue - prev.revenue) / prev.revenue) * 100 : null,
    roasDeltaPct: f.compareEnabled && prevRoas > 0 ? ((roas - prevRoas) / prevRoas) * 100 : null,
    cpaDeltaPct: f.compareEnabled && prevCpa && cpa ? ((cpa - prevCpa) / prevCpa) * 100 : null,
  };
}

function accumulate(a: ReturnType<typeof emptyFold>, r: DailyRow): void {
  a.spend += r.spend;
  a.impressions += r.impressions;
  a.clicks += r.clicks;
  a.outboundClicks += r.outboundClicks;
  a.purchases += r.purchases;
  a.revenue += r.revenue;
}

/* ------------------------------------------------------------------ */
/*  Component roll-ups (the strategist / next-brief view)              */
/* ------------------------------------------------------------------ */

export interface ComponentRow {
  value: string;
  creativeCount: number;
  spend: number;
  roas: number;
  /** Share of spend that met the winner bar — spend-weighted win-rate (%). */
  winRate: number;
  /** Win-rate vs the account median across values in this tab (pp). */
  vsMedianPct: number;
  trendPct: number | null;
  confidence: Confidence;
}

function componentValueFor(creative: Creative, tab: ComponentTab): string {
  switch (tab) {
    case "hooks": return creative.components.hook;
    case "headlines": return creative.components.headline;
    case "primary-text": return creative.components.primaryText;
    case "ctas": return creative.components.cta;
    case "visual-styles": return creative.components.visualStyle;
  }
}

export function componentRollups(
  dataset: Dataset,
  f: FilterInput,
  tab: ComponentTab,
): ComponentRow[] {
  const rollups = selectCreatives(dataset, f);
  const groups = new Map<string, CreativeRollup[]>();
  for (const r of rollups) {
    const value = componentValueFor(r.creative, tab);
    let arr = groups.get(value);
    if (!arr) {
      arr = [];
      groups.set(value, arr);
    }
    arr.push(r);
  }

  const rows: ComponentRow[] = [];
  for (const [value, group] of groups) {
    const spend = group.reduce((s, r) => s + r.metrics.spend, 0);
    const revenue = group.reduce((s, r) => s + r.metrics.revenue, 0);
    const purchases = group.reduce((s, r) => s + r.metrics.purchases, 0);
    const roas = spend > 0 ? revenue / spend : 0;
    // Spend-weighted win-rate: share of spend on winner-tier creatives.
    const winnerSpend = group
      .filter((r) => r.metrics.roas >= WINNER_ROAS)
      .reduce((s, r) => s + r.metrics.spend, 0);
    const winRate = spend > 0 ? (winnerSpend / spend) * 100 : 0;
    const trendVals = group.map((r) => r.roasDeltaPct).filter((v): v is number => v !== null);
    const trendPct = trendVals.length ? trendVals.reduce((a, b) => a + b, 0) / trendVals.length : null;
    rows.push({
      value,
      creativeCount: group.length,
      spend,
      roas,
      winRate,
      vsMedianPct: 0, // filled below
      trendPct,
      confidence: confidenceFromN(purchases),
    });
  }

  // vs median win-rate.
  const sortedWin = rows.map((r) => r.winRate).sort((a, b) => a - b);
  const median = sortedWin.length
    ? sortedWin[Math.floor(sortedWin.length / 2)]
    : 0;
  for (const r of rows) r.vsMedianPct = r.winRate - median;

  return rows.sort((a, b) => b.spend - a.spend);
}
