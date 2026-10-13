/**
 * List rows for Advertiser (Domain / Page), LP & Offers, and Creative Element tabs.
 *
 * Pass `ads` = the ads the list should aggregate (scoped, and union-filtered by
 * the selected tags). An item appears only when it has ≥1 of those ads, so the
 * union filter carries over to lists automatically.
 * Pass `ctx.baseAds` = the same source scoped by industry/category/prefs but NOT
 * by period (`adsInBaseScope`) so trend / rising / scaling can see the previous
 * period. Without it, trends fall back to `ads`.
 */
import { FUNNEL_TYPE_LABEL } from "../types";
import type { Ad, Advertiser, AdvertiserKind, CreativeElement, ElementType, FunnelType, LandingPage, Scope, TrendSeries } from "../types";
import { INDEX } from "../data";
import type { DataIndex } from "../data";
import { pct } from "./context";
import type { RankedItem, SelectorCtx } from "./context";
import { elementValue } from "./kpis";
import { compareEntity, groupByEntity, isRisingComparison, isScalingComparison, launchSeries } from "./trends";
import { isNew, isWinner } from "./winner";

export interface RowCtx extends SelectorCtx {
  scope: Scope;
  /** Industry/category/prefs-scoped ads without the period filter, for trends. */
  baseAds?: Ad[];
  /** Denominator for element share %; defaults to `ads.length`. */
  shareBase?: number;
}

/* ── shared helpers ─────────────────────────────────────────────────────── */

export function longestRun(ads: Ad[]): number | null {
  let max: number | null = null;
  for (const a of ads) if (a.daysLive != null && (max == null || a.daysLive > max)) max = a.daysLive;
  return max;
}

/** Count + share of each value in `ads`, count desc then label. */
export function rankBy(ads: Ad[], valuesOf: (a: Ad) => (string | null | undefined)[], labelOf: (id: string) => string, base = ads.length): RankedItem[] {
  const m = new Map<string, number>();
  for (const a of ads) {
    const seen = new Set<string>();
    for (const v of valuesOf(a)) {
      if (!v || seen.has(v)) continue;
      seen.add(v);
      m.set(v, (m.get(v) ?? 0) + 1);
    }
  }
  return Array.from(m, ([id, count]) => ({ id, label: labelOf(id), count, sharePct: pct(count, base) })).sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label) || (a.id < b.id ? -1 : 1),
  );
}

function topOf(ads: Ad[], type: ElementType, data: DataIndex): RankedItem | null {
  const analysed = ads.filter((a) => elementValue(a, type) != null);
  return rankBy(analysed, (a) => [elementValue(a, type)], (id) => data.elementById[type].get(id)?.label ?? id)[0] ?? null;
}

const industryLabel = (data: DataIndex) => (id: string) => data.industryById.get(id)?.label ?? id;
const categoryLabel = (data: DataIndex) => (id: string) => data.categoryById.get(id)?.label ?? id;

/* ── advertisers ────────────────────────────────────────────────────────── */

export interface AdvertiserRow {
  id: string;
  kind: AdvertiserKind;
  name: string;
  avatarUrl: string | null;
  firstSeenAt: string;
  totalAds: number;
  activeAds: number;
  winningAds: number;
  /** Longest-running ad's days live; null when no ad has a known start. */
  longestRunDays: number | null;
  launchTrend: TrendSeries;
  changePct: number | null;
  /** New ads launched in the current comparison window. */
  launchesThisPeriod: number;
  topFramework: RankedItem | null;
  topHook: RankedItem | null;
  topConcept: RankedItem | null;
  industries: RankedItem[];
  categories: RankedItem[];
  landingPageCount: number;
  offerCount: number;
  isNew: boolean;
  isRising: boolean;
  isScaling: boolean;
  adIds: string[];
}

export function advertiserRows(kind: AdvertiserKind, ads: Ad[], ctx: RowCtx): AdvertiserRow[] {
  const data = ctx.data ?? INDEX;
  const entityKind = kind === "page" ? "page" : "domain";
  const groups = groupByEntity(ads, entityKind, data);
  const baseGroups = ctx.baseAds ? groupByEntity(ctx.baseAds, entityKind, data) : groups;
  const rows: AdvertiserRow[] = [];
  for (const [id, list] of groups) {
    const adv = data.advertiserById.get(id) as Advertiser | undefined;
    if (!adv) continue;
    const trendAds = baseGroups.get(id) ?? list;
    const cmp = compareEntity(trendAds, ctx.scope.period, ctx.now);
    const lps = new Set<string>();
    const offers = new Set<string>();
    for (const a of list) {
      if (!a.landingPageId) continue;
      lps.add(a.landingPageId);
      const o = data.landingPageById.get(a.landingPageId)?.offerDomain;
      if (o) offers.add(o);
    }
    rows.push({
      id,
      kind,
      name: adv.name,
      avatarUrl: adv.avatarUrl,
      firstSeenAt: adv.firstSeenAt,
      totalAds: list.length,
      activeAds: list.filter((a) => a.status === "active").length,
      winningAds: list.filter(isWinner).length,
      longestRunDays: longestRun(list),
      launchTrend: launchSeries(trendAds, ctx.scope.period, ctx.now),
      changePct: cmp.changePct,
      launchesThisPeriod: cmp.cur,
      topFramework: topOf(list, "framework", data),
      topHook: topOf(list, "hook", data),
      topConcept: topOf(list, "concept", data),
      industries: rankBy(list, (a) => [a.industryId], industryLabel(data)),
      categories: rankBy(list, (a) => [a.categoryId], categoryLabel(data)),
      landingPageCount: lps.size,
      offerCount: offers.size,
      isNew: isNew(adv, ctx.lastVisitAt),
      isRising: isRisingComparison(cmp),
      isScaling: isScalingComparison(cmp),
      adIds: list.map((a) => a.id),
    });
  }
  return rows;
}

/* ── landing pages ──────────────────────────────────────────────────────── */

export interface LandingPageRow {
  id: string;
  landingPage: LandingPage;
  domain: string;
  /** Domain advertiser id when the domain is a known advertiser. */
  domainAdvertiserId: string | null;
  title: string | null;
  screenshotUrl: string | null;
  /** Null → UI "Not traced". */
  offerDomain: string | null;
  funnelType: FunnelType | null;
  funnelLabel: string | null;
  adsTotal: number;
  adsActive: number;
  /** Distinct pages (brands) sending ads here. */
  advertiserCount: number;
  winners: number;
  longestRunDays: number | null;
  trend: TrendSeries;
  changePct: number | null;
  launchesThisPeriod: number;
  isNew: boolean;
  isRising: boolean;
  isScaling: boolean;
  adIds: string[];
}

function buildLandingPageRow(lp: LandingPage, list: Ad[], trendAds: Ad[], ctx: RowCtx, data: DataIndex): LandingPageRow {
  const cmp = compareEntity(trendAds, ctx.scope.period, ctx.now);
  return {
    id: lp.id,
    landingPage: lp,
    domain: lp.domain,
    domainAdvertiserId: data.domainAdvertiserByName.get(lp.domain)?.id ?? null,
    title: lp.title,
    screenshotUrl: lp.screenshotUrl,
    offerDomain: lp.offerDomain,
    funnelType: lp.funnelType,
    funnelLabel: lp.funnelType ? FUNNEL_TYPE_LABEL[lp.funnelType] : null,
    adsTotal: list.length,
    adsActive: list.filter((a) => a.status === "active").length,
    advertiserCount: new Set(list.map((a) => a.pageAdvertiserId)).size,
    winners: list.filter(isWinner).length,
    longestRunDays: longestRun(list),
    trend: launchSeries(trendAds, ctx.scope.period, ctx.now),
    changePct: cmp.changePct,
    launchesThisPeriod: cmp.cur,
    isNew: isNew(lp, ctx.lastVisitAt),
    isRising: isRisingComparison(cmp),
    isScaling: isScalingComparison(cmp),
    adIds: list.map((a) => a.id),
  };
}

export function landingPageRows(ads: Ad[], ctx: RowCtx): LandingPageRow[] {
  const data = ctx.data ?? INDEX;
  const groups = groupByEntity(ads, "landing-page", data);
  const baseGroups = ctx.baseAds ? groupByEntity(ctx.baseAds, "landing-page", data) : groups;
  const rows: LandingPageRow[] = [];
  for (const [id, list] of groups) {
    const lp = data.landingPageById.get(id);
    if (lp) rows.push(buildLandingPageRow(lp, list, baseGroups.get(id) ?? list, ctx, data));
  }
  return rows;
}

/* ── elements ───────────────────────────────────────────────────────────── */

export interface ElementRow {
  id: string;
  type: ElementType;
  label: string;
  description?: string;
  adsUsing: number;
  /** Share of ads in scope (ctx.shareBase, default ads.length). */
  sharePct: number;
  winningAds: number;
  avgDaysLive: number | null;
  /** Ads with a known start behind avgDaysLive. */
  avgDaysLiveBasedOn: number;
  trend: TrendSeries;
  changePct: number | null;
  launchesThisPeriod: number;
  isRising: boolean;
  isScaling: boolean;
  /** One example ad: a winner if any, else the longest-running, then most cloned. */
  exampleAdId: string | null;
  /** Pages using it most (up to 3). */
  topAdvertisers: RankedItem[];
  liveAds: number;
  advertiserCount: number;
  longestRunDays: number | null;
  totalClones: number;
  adIds: string[];
}

export function pickExampleAd(ads: Ad[]): Ad | null {
  let best: Ad | null = null;
  const key = (a: Ad) => [isWinner(a) ? 1 : 0, a.daysLive ?? -1, a.clones];
  for (const a of ads) {
    if (!best) {
      best = a;
      continue;
    }
    const ka = key(a);
    const kb = key(best);
    for (let i = 0; i < ka.length; i++) {
      if (ka[i] !== kb[i]) {
        if (ka[i] > kb[i]) best = a;
        break;
      }
      if (i === ka.length - 1 && a.id < best.id) best = a;
    }
  }
  return best;
}

export function elementRows(type: ElementType, ads: Ad[], ctx: RowCtx): ElementRow[] {
  const data = ctx.data ?? INDEX;
  const groups = groupByEntity(ads, type, data);
  const baseGroups = ctx.baseAds ? groupByEntity(ctx.baseAds, type, data) : groups;
  const shareBase = ctx.shareBase ?? ads.length;
  const rows: ElementRow[] = [];
  for (const [id, list] of groups) {
    const el = data.elementById[type].get(id) as CreativeElement | undefined;
    if (!el) continue;
    const trendAds = baseGroups.get(id) ?? list;
    const cmp = compareEntity(trendAds, ctx.scope.period, ctx.now);
    let sum = 0;
    let known = 0;
    let clones = 0;
    for (const a of list) {
      clones += a.clones;
      if (a.daysLive != null) {
        sum += a.daysLive;
        known++;
      }
    }
    rows.push({
      id,
      type,
      label: el.label,
      description: el.description,
      adsUsing: list.length,
      sharePct: pct(list.length, shareBase),
      winningAds: list.filter(isWinner).length,
      avgDaysLive: known ? Math.round(sum / known) : null,
      avgDaysLiveBasedOn: known,
      trend: launchSeries(trendAds, ctx.scope.period, ctx.now),
      changePct: cmp.changePct,
      launchesThisPeriod: cmp.cur,
      isRising: isRisingComparison(cmp),
      isScaling: isScalingComparison(cmp),
      exampleAdId: pickExampleAd(list)?.id ?? null,
      topAdvertisers: rankBy(list, (a) => [a.pageAdvertiserId], (pid) => data.advertiserById.get(pid)?.name ?? pid).slice(0, 3),
      liveAds: list.filter((a) => a.status === "active").length,
      advertiserCount: new Set(list.map((a) => a.pageAdvertiserId)).size,
      longestRunDays: longestRun(list),
      totalClones: clones,
      adIds: list.map((a) => a.id),
    });
  }
  return rows;
}
