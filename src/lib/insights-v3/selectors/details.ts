/**
 * Detail overlay aggregates: Advertiser (Domain / Page), Element, Landing page, Offer.
 * Each follows the scope bar (pass source ads + scope) and every block returns
 * its own `basedOn` ad count (non-negotiable #8). Blocks with no data return
 * `basedOn: 0` so the UI can disable them with a tooltip.
 */
import { FUNNEL_TYPE_LABEL } from "../types";
import type { Ad, Advertiser, AdvertiserKind, AiSummary, CreativeElement, ElementType, FunnelType, Kpi, LandingPage, Scope, TrendSeries } from "../types";
import { ELEMENT_TYPE_LABEL, FRAMEWORK_ELEMENT_LABEL, INDEX, slugify } from "../data";
import type { DataIndex, OfferInfo } from "../data";
import { formatCompact, formatDays, pct, plural } from "./context";
import type { RankedItem, SelectorCtx } from "./context";
import { avgDaysLive, elementValue } from "./kpis";
import { landingPageRows, longestRun, rankBy } from "./rows";
import type { LandingPageRow } from "./rows";
import { adsInBaseScope, adsInScope } from "./scope";
import { aiSummary } from "./summaries";
import { compareEntity, isRisingComparison, isScalingComparison, launchSeries } from "./trends";
import { isNew, isWinner } from "./winner";

export interface MixBlock {
  basedOn: number;
  items: RankedItem[];
}

export interface AdListBlock {
  basedOn: number;
  adIds: string[];
}

export interface QuoteBlock {
  basedOn: number;
  items: { adId: string; text: string }[];
}

export interface TrendBlock extends TrendSeries {
  basedOn: number;
}

/* ── helpers ────────────────────────────────────────────────────────────── */

function elementMix(ads: Ad[], type: ElementType, data: DataIndex, limit = 10): MixBlock {
  const analysed = ads.filter((a) => elementValue(a, type) != null);
  return {
    basedOn: analysed.length,
    items: rankBy(analysed, (a) => [elementValue(a, type)], (id) => data.elementById[type].get(id)?.label ?? id).slice(0, limit),
  };
}

function ctaMix(ads: Ad[], limit = 8): MixBlock {
  const withCta = ads.filter((a) => a.ctaLabel);
  const labels = new Map<string, string>();
  for (const a of withCta) labels.set(slugify(a.ctaLabel as string), a.ctaLabel as string);
  return { basedOn: withCta.length, items: rankBy(withCta, (a) => [slugify(a.ctaLabel as string)], (id) => labels.get(id) ?? id).slice(0, limit) };
}

function keywordMix(ads: Ad[], limit = 15): MixBlock {
  const withKw = ads.filter((a) => a.analysis.keywords.length);
  const labels = new Map<string, string>();
  for (const a of withKw) for (const k of a.analysis.keywords) labels.set(slugify(k), k);
  return { basedOn: withKw.length, items: rankBy(withKw, (a) => a.analysis.keywords.map(slugify), (id) => labels.get(id) ?? id).slice(0, limit) };
}

function frameworkElementMix(ads: Ad[], limit = 12): MixBlock {
  const withEl = ads.filter((a) => a.analysis.frameworkElements.length);
  return {
    basedOn: withEl.length,
    items: rankBy(withEl, (a) => a.analysis.frameworkElements, (id) => FRAMEWORK_ELEMENT_LABEL[id as keyof typeof FRAMEWORK_ELEMENT_LABEL] ?? id).slice(0, limit),
  };
}

function hookLines(ads: Ad[], limit = 8): QuoteBlock {
  const withHook = ads.filter((a) => a.analysis.hookText);
  const ordered = withHook.slice().sort((a, b) => Number(isWinner(b)) - Number(isWinner(a)) || (b.daysLive ?? -1) - (a.daysLive ?? -1) || (a.id < b.id ? -1 : 1));
  const seen = new Set<string>();
  const items: { adId: string; text: string }[] = [];
  for (const a of ordered) {
    const t = a.analysis.hookText as string;
    if (seen.has(t)) continue;
    seen.add(t);
    items.push({ adId: a.id, text: t });
    if (items.length >= limit) break;
  }
  return { basedOn: withHook.length, items };
}

/** Winners first, then longest running, then most cloned. */
function orderedAds(ads: Ad[]): Ad[] {
  return ads
    .slice()
    .sort(
      (a, b) =>
        Number(isWinner(b)) - Number(isWinner(a)) ||
        (b.daysLive ?? -1) - (a.daysLive ?? -1) ||
        b.clones - a.clones ||
        (a.id < b.id ? -1 : 1),
    );
}

function winnersBlock(ads: Ad[], limit = 12): AdListBlock {
  return { basedOn: ads.length, adIds: orderedAds(ads.filter(isWinner)).slice(0, limit).map((a) => a.id) };
}

function longestBlock(ads: Ad[], limit = 12): AdListBlock {
  const known = ads.filter((a) => a.daysLive != null);
  const sorted = known.slice().sort((a, b) => (b.daysLive ?? 0) - (a.daysLive ?? 0) || (a.id < b.id ? -1 : 1));
  return { basedOn: known.length, adIds: sorted.slice(0, limit).map((a) => a.id) };
}

function statKpis(ads: Ad[]): Kpi[] {
  const active = ads.filter((a) => a.status === "active").length;
  const winners = ads.filter(isWinner).length;
  const longest = longestRun(ads);
  const avg = avgDaysLive(ads);
  const lps = new Set(ads.map((a) => a.landingPageId).filter(Boolean)).size;
  const clones = ads.reduce((s, a) => s + a.clones, 0);
  const kpis: Kpi[] = [
    { key: "total", label: "Total ads", value: ads.length, display: formatCompact(ads.length), tooltip: "Ads in the current scope." },
    { key: "active", label: "Active ads", value: active, display: formatCompact(active), sub: `${pct(active, ads.length)}% of total`, tooltip: "Seen live in the last 14 days." },
    { key: "winning", label: "Winning ads", value: winners, display: formatCompact(winners), sub: `${pct(winners, ads.length)}% of total`, tooltip: "Seen live, 14+ days live and 2+ clones. Never based on likes." },
    {
      key: "longestRun",
      label: "Longest run",
      value: longest,
      display: longest == null ? "—" : formatDays(longest),
      tooltip: "Days live of the longest-running ad. Ads with an unknown start date are left out.",
      disabledReason: longest == null ? "No ad here has a known start date." : undefined,
    },
    {
      key: "avgDaysLive",
      label: "Avg days live",
      value: avg.value,
      display: avg.value == null ? "—" : formatDays(avg.value),
      sub: `based on ${plural(avg.basedOn, "ad")} with a known start`,
      tooltip: "Average days live, known start dates only.",
      disabledReason: avg.basedOn === 0 ? "No ad here has a known start date." : undefined,
    },
    { key: "landingPages", label: "Landing pages", value: lps, display: formatCompact(lps), tooltip: "Distinct landing pages these ads send to." },
    { key: "clones", label: "Total clones", value: clones, display: formatCompact(clones), tooltip: "Copies of these creatives seen across other advertisers." },
  ];
  return kpis;
}

/* ── advertiser ─────────────────────────────────────────────────────────── */

export interface AdvertiserDetail {
  advertiser: Advertiser;
  kind: AdvertiserKind;
  basedOn: number;
  summary: AiSummary;
  kpis: Kpi[];
  isNew: boolean;
  isRising: boolean;
  isScaling: boolean;
  changePct: number | null;
  launchActivity: TrendBlock;
  hooks: MixBlock;
  hookLines: QuoteBlock;
  angles: MixBlock;
  frameworks: MixBlock;
  concepts: MixBlock;
  ctas: MixBlock;
  keywords: MixBlock;
  industries: MixBlock;
  categories: MixBlock;
  winners: AdListBlock;
  longestRunning: AdListBlock;
  landingPages: { basedOn: number; rows: LandingPageRow[] };
  /** Pages behind a domain, or domains a page sends to. */
  related: MixBlock;
}

export function advertiserDetail(kind: AdvertiserKind, id: string, baseAds: Ad[], scope: Scope, ctx: SelectorCtx): AdvertiserDetail | null {
  const data = ctx.data ?? INDEX;
  const advertiser = data.advertiserById.get(id);
  if (!advertiser || advertiser.kind !== kind) return null;
  const own = (a: Ad) => (kind === "page" ? a.pageAdvertiserId === id : a.domainAdvertiserId === id);
  const ads = adsInScope(baseAds, scope, ctx).filter(own);
  const base = adsInBaseScope(baseAds, scope, ctx).filter(own);
  const cmp = compareEntity(base, scope.period, ctx.now);
  const lpRows = landingPageRows(ads, { ...ctx, scope, baseAds: base });
  const related =
    kind === "domain"
      ? rankBy(ads, (a) => [a.pageAdvertiserId], (pid) => data.advertiserById.get(pid)?.name ?? pid)
      : rankBy(ads.filter((a) => a.domainAdvertiserId), (a) => [a.domainAdvertiserId], (did) => data.advertiserById.get(did)?.name ?? did);
  return {
    advertiser,
    kind,
    basedOn: ads.length,
    summary: aiSummary({ kind: "advertiser", advertiser, ads }, data),
    kpis: statKpis(ads),
    isNew: isNew(advertiser, ctx.lastVisitAt),
    isRising: isRisingComparison(cmp),
    isScaling: isScalingComparison(cmp),
    changePct: cmp.changePct,
    launchActivity: { ...launchSeries(base, scope.period, ctx.now), basedOn: base.length },
    hooks: elementMix(ads, "hook", data),
    hookLines: hookLines(ads),
    angles: elementMix(ads, "angle", data),
    frameworks: elementMix(ads, "framework", data),
    concepts: elementMix(ads, "concept", data),
    ctas: ctaMix(ads),
    keywords: keywordMix(ads),
    industries: { basedOn: ads.length, items: rankBy(ads, (a) => [a.industryId], (x) => data.industryById.get(x)?.label ?? x) },
    categories: { basedOn: ads.length, items: rankBy(ads, (a) => [a.categoryId], (x) => data.categoryById.get(x)?.label ?? x) },
    winners: winnersBlock(ads),
    longestRunning: longestBlock(ads),
    landingPages: { basedOn: ads.filter((a) => a.landingPageId).length, rows: lpRows.sort((a, b) => b.adsTotal - a.adsTotal || (a.id < b.id ? -1 : 1)) },
    related: { basedOn: kind === "domain" ? ads.length : ads.filter((a) => a.domainAdvertiserId).length, items: related },
  };
}

/* ── element ────────────────────────────────────────────────────────────── */

export interface CoOccurrence extends RankedItem {
  /** P(other | this) / P(other in scope). >1 = shows up together more than usual. */
  lift: number;
}

export interface WorksWellWithGroup {
  type: ElementType;
  label: string;
  basedOn: number;
  items: CoOccurrence[];
}

export interface ElementDetail {
  element: CreativeElement;
  elementType: ElementType;
  basedOn: number;
  /** Ads in scope (denominator for share). */
  scopeAds: number;
  summary: AiSummary;
  kpis: Kpi[];
  isRising: boolean;
  isScaling: boolean;
  changePct: number | null;
  trend: TrendBlock;
  whereItWorks: { categories: MixBlock; industries: MixBlock; advertisers: MixBlock };
  worksWellWith: { basedOn: number; groups: WorksWellWithGroup[] };
  frameworkElements: MixBlock;
  topAds: AdListBlock;
  exampleHooks: QuoteBlock;
}

export function elementDetail(type: ElementType, id: string, baseAds: Ad[], scope: Scope, ctx: SelectorCtx): ElementDetail | null {
  const data = ctx.data ?? INDEX;
  const element = data.elementById[type].get(id);
  if (!element) return null;
  const scoped = adsInScope(baseAds, scope, ctx);
  const ads = scoped.filter((a) => elementValue(a, type) === id);
  const base = adsInBaseScope(baseAds, scope, ctx).filter((a) => elementValue(a, type) === id);
  const cmp = compareEntity(base, scope.period, ctx.now);

  const otherTypes = (["framework", "hook", "angle", "concept"] as ElementType[]).filter((t) => t !== type);
  const groups: WorksWellWithGroup[] = otherTypes.map((other) => {
    const withThis = ads.filter((a) => elementValue(a, other) != null);
    const scopeWith = scoped.filter((a) => elementValue(a, other) != null);
    const scopeCounts = new Map<string, number>();
    for (const a of scopeWith) {
      const v = elementValue(a, other) as string;
      scopeCounts.set(v, (scopeCounts.get(v) ?? 0) + 1);
    }
    const items = rankBy(withThis, (a) => [elementValue(a, other)], (x) => data.elementById[other].get(x)?.label ?? x)
      .slice(0, 6)
      .map((r) => {
        const pThis = withThis.length ? r.count / withThis.length : 0;
        const pAll = scopeWith.length ? (scopeCounts.get(r.id) ?? 0) / scopeWith.length : 0;
        return { ...r, lift: pAll ? Math.round((pThis / pAll) * 100) / 100 : 0 };
      });
    return { type: other, label: ELEMENT_TYPE_LABEL[other], basedOn: withThis.length, items };
  });

  const kpis = statKpis(ads);
  kpis.unshift({
    key: "share",
    label: "Share of ads in scope",
    value: pct(ads.length, scoped.length),
    display: `${pct(ads.length, scoped.length)}%`,
    sub: `${formatCompact(ads.length)} of ${formatCompact(scoped.length)} ads`,
    tooltip: "How many ads in the current scope use this element.",
  });
  kpis.push({
    key: "advertisers",
    label: "Advertisers",
    value: new Set(ads.map((a) => a.pageAdvertiserId)).size,
    display: formatCompact(new Set(ads.map((a) => a.pageAdvertiserId)).size),
    tooltip: "Pages (brands) running ads that use it.",
  });

  return {
    element,
    elementType: type,
    basedOn: ads.length,
    scopeAds: scoped.length,
    summary: aiSummary({ kind: "element", elementType: type, element, ads, scopeAds: scoped }, data),
    kpis,
    isRising: isRisingComparison(cmp),
    isScaling: isScalingComparison(cmp),
    changePct: cmp.changePct,
    trend: { ...launchSeries(base, scope.period, ctx.now), basedOn: base.length },
    whereItWorks: {
      categories: { basedOn: ads.length, items: rankBy(ads, (a) => [a.categoryId], (x) => data.categoryById.get(x)?.label ?? x).slice(0, 10) },
      industries: { basedOn: ads.length, items: rankBy(ads, (a) => [a.industryId], (x) => data.industryById.get(x)?.label ?? x) },
      advertisers: { basedOn: ads.length, items: rankBy(ads, (a) => [a.pageAdvertiserId], (x) => data.advertiserById.get(x)?.name ?? x).slice(0, 10) },
    },
    worksWellWith: { basedOn: ads.length, groups },
    frameworkElements: frameworkElementMix(ads),
    topAds: { basedOn: ads.length, adIds: orderedAds(ads).slice(0, 12).map((a) => a.id) },
    exampleHooks: hookLines(ads),
  };
}

/* ── landing page ───────────────────────────────────────────────────────── */

export interface CreativeMix {
  hooks: MixBlock;
  angles: MixBlock;
  frameworks: MixBlock;
  concepts: MixBlock;
}

export interface LandingPageDetail {
  landingPage: LandingPage;
  basedOn: number;
  summary: AiSummary;
  kpis: Kpi[];
  isNew: boolean;
  capture: {
    url: string;
    finalUrl: string | null;
    title: string | null;
    httpStatus: number | null;
    wordCount: number | null;
    pageText: string | null;
    screenshotUrl: string | null;
    capturedAt: string | null;
  };
  funnel: {
    type: FunnelType | null;
    label: string | null;
    redirectPath: string[];
    /** Null → "Not traced". */
    offerDomain: string | null;
    offerUrl: string | null;
  };
  ads: AdListBlock;
  advertisers: { basedOn: number; pages: RankedItem[]; domains: RankedItem[] };
  creativeMix: CreativeMix;
  trend: TrendBlock;
}

function creativeMix(ads: Ad[], data: DataIndex): CreativeMix {
  return {
    hooks: elementMix(ads, "hook", data),
    angles: elementMix(ads, "angle", data),
    frameworks: elementMix(ads, "framework", data),
    concepts: elementMix(ads, "concept", data),
  };
}

export function landingPageDetail(id: string, baseAds: Ad[], scope: Scope, ctx: SelectorCtx): LandingPageDetail | null {
  const data = ctx.data ?? INDEX;
  const lp = data.landingPageById.get(id);
  if (!lp) return null;
  const ads = adsInScope(baseAds, scope, ctx).filter((a) => a.landingPageId === id);
  const base = adsInBaseScope(baseAds, scope, ctx).filter((a) => a.landingPageId === id);
  return {
    landingPage: lp,
    basedOn: ads.length,
    summary: aiSummary({ kind: "landing-page", landingPage: lp, ads }, data),
    kpis: statKpis(ads).filter((k) => k.key !== "landingPages"),
    isNew: isNew(lp, ctx.lastVisitAt),
    capture: {
      url: lp.url,
      finalUrl: lp.finalUrl,
      title: lp.title,
      httpStatus: lp.httpStatus,
      wordCount: lp.wordCount,
      pageText: lp.pageText,
      screenshotUrl: lp.screenshotUrl,
      capturedAt: lp.capturedAt,
    },
    funnel: {
      type: lp.funnelType,
      label: lp.funnelType ? FUNNEL_TYPE_LABEL[lp.funnelType] : null,
      redirectPath: lp.redirectPath,
      offerDomain: lp.offerDomain,
      offerUrl: lp.offerUrl,
    },
    ads: { basedOn: ads.length, adIds: orderedAds(ads).map((a) => a.id) },
    advertisers: {
      basedOn: ads.length,
      pages: rankBy(ads, (a) => [a.pageAdvertiserId], (x) => data.advertiserById.get(x)?.name ?? x),
      domains: rankBy(ads, (a) => [a.domainAdvertiserId], (x) => data.advertiserById.get(x)?.name ?? x),
    },
    creativeMix: creativeMix(ads, data),
    trend: { ...launchSeries(base, scope.period, ctx.now), basedOn: base.length },
  };
}

/* ── offer ──────────────────────────────────────────────────────────────── */

export interface OfferDetail {
  offer: OfferInfo;
  basedOn: number;
  summary: AiSummary;
  kpis: Kpi[];
  landingPages: { basedOn: number; rows: LandingPageRow[] };
  ads: AdListBlock;
  advertisers: { basedOn: number; pages: RankedItem[]; domains: RankedItem[] };
  creativeMix: CreativeMix;
  funnels: MixBlock;
  trend: TrendBlock;
}

/** `offerDomain` is the offer id (DetailTarget `{ kind: "offer", id }`). */
export function offerDetail(offerDomain: string, baseAds: Ad[], scope: Scope, ctx: SelectorCtx): OfferDetail | null {
  const data = ctx.data ?? INDEX;
  const offer = data.offerById.get(offerDomain);
  if (!offer) return null;
  const lpIds = new Set(offer.landingPageIds);
  const ads = adsInScope(baseAds, scope, ctx).filter((a) => a.landingPageId != null && lpIds.has(a.landingPageId));
  const base = adsInBaseScope(baseAds, scope, ctx).filter((a) => a.landingPageId != null && lpIds.has(a.landingPageId));
  const rows = landingPageRows(ads, { ...ctx, scope, baseAds: base }).sort((a, b) => b.adsTotal - a.adsTotal || (a.id < b.id ? -1 : 1));
  const lpsInScope = new Set(ads.map((a) => a.landingPageId));
  return {
    offer,
    basedOn: ads.length,
    summary: aiSummary({ kind: "offer", offerDomain, ads, landingPageCount: lpsInScope.size }, data),
    kpis: statKpis(ads),
    landingPages: { basedOn: ads.length, rows },
    ads: { basedOn: ads.length, adIds: orderedAds(ads).map((a) => a.id) },
    advertisers: {
      basedOn: ads.length,
      pages: rankBy(ads, (a) => [a.pageAdvertiserId], (x) => data.advertiserById.get(x)?.name ?? x),
      domains: rankBy(ads, (a) => [a.domainAdvertiserId], (x) => data.advertiserById.get(x)?.name ?? x),
    },
    creativeMix: creativeMix(ads, data),
    funnels: {
      basedOn: ads.filter((a) => a.landingPageId && data.landingPageById.get(a.landingPageId)?.funnelType).length,
      items: rankBy(
        ads,
        (a) => [a.landingPageId ? data.landingPageById.get(a.landingPageId)?.funnelType ?? null : null],
        (x) => FUNNEL_TYPE_LABEL[x as FunnelType] ?? x,
      ),
    },
    trend: { ...launchSeries(base, scope.period, ctx.now), basedOn: base.length },
  };
}

