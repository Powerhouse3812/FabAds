/**
 * KPI rows. KPIs follow the SCOPE only (never the tag selection).
 * Each takes the source ads (universe or My Feeds source) + scope and applies
 * the scope itself, so trend % can see the previous period.
 */
import { ACTIVE_WINDOW_DAYS, WINNER_RULE } from "../types";
import type { Ad, AdvertiserKind, ElementType, Kpi, Scope } from "../types";
import { ELEMENT_TYPE_PLURAL, INDEX } from "../data";
import type { DataIndex } from "../data";
import { comparisonLabel, formatChange, formatCompact, formatDays, pct, plural } from "./context";
import type { SelectorCtx } from "./context";
import { adsInBaseScope, adsInScope } from "./scope";
import { compareEntity, groupByEntity, isRisingComparison, isScalingComparison, launchCompare, rising } from "./trends";
import { countActive, countWinners, isNew } from "./winner";

function kpi(k: Kpi): Kpi {
  return k;
}

function lastVisitKnown(ctx: SelectorCtx): boolean {
  return ctx.lastVisitAt != null;
}

/** Average days live over ads with a known start. */
export function avgDaysLive(ads: Ad[]): { value: number | null; basedOn: number } {
  let sum = 0;
  let n = 0;
  for (const a of ads) {
    if (a.daysLive != null) {
      sum += a.daysLive;
      n++;
    }
  }
  return { value: n ? Math.round(sum / n) : null, basedOn: n };
}

/** Distinct landing pages + offer domains used by these ads. */
export function landingPageAndOfferCounts(ads: Ad[], data: DataIndex = INDEX): { landingPages: number; offers: number } {
  const lps = new Set<string>();
  const offers = new Set<string>();
  for (const a of ads) {
    if (!a.landingPageId) continue;
    lps.add(a.landingPageId);
    const o = data.landingPageById.get(a.landingPageId)?.offerDomain;
    if (o) offers.add(o);
  }
  return { landingPages: lps.size, offers: offers.size };
}

/** Discover / My Feeds KPI row: Total, Active, Winning, Advertisers, New, Avg days live, Landing pages & offers. */
export function discoverKpis(baseAds: Ad[], scope: Scope, ctx: SelectorCtx): Kpi[] {
  const data = ctx.data ?? INDEX;
  const scoped = adsInScope(baseAds, scope, ctx);
  const base = adsInBaseScope(baseAds, scope, ctx);
  const n = scoped.length;
  const cmp = launchCompare(base, scope.period, ctx.now);
  const active = countActive(scoped);
  const winners = countWinners(scoped);
  const pages = new Set(scoped.map((a) => a.pageAdvertiserId)).size;
  const domains = new Set(scoped.map((a) => a.domainAdvertiserId).filter(Boolean)).size;
  const newCount = lastVisitKnown(ctx) ? scoped.filter((a) => isNew(a, ctx.lastVisitAt)).length : null;
  const avg = avgDaysLive(scoped);
  const lp = landingPageAndOfferCounts(scoped, data);

  return [
    kpi({
      key: "total",
      label: "Total ads",
      value: n,
      display: formatCompact(n),
      sub: `${formatChange(cmp.changePct, cmp.cur)} launches vs ${comparisonLabel(scope.period)}`,
      tooltip: "All ads in the current scope (industry, category and period).",
    }),
    kpi({
      key: "active",
      label: "Active ads",
      value: active,
      display: formatCompact(active),
      sub: `${pct(active, n)}% of total`,
      tooltip: `Seen live in the last ${ACTIVE_WINDOW_DAYS} days. This is when we last saw the ad running, not a platform status.`,
    }),
    kpi({
      key: "winning",
      label: "Winning ads",
      value: winners,
      display: formatCompact(winners),
      sub: `${pct(winners, n)}% of total`,
      tooltip: `Winner = seen live, at least ${WINNER_RULE.minDaysLive} days live and ${WINNER_RULE.minClones}+ clones. Never based on likes.`,
    }),
    kpi({
      key: "advertisers",
      label: "Advertisers",
      value: pages,
      display: formatCompact(pages),
      sub: `${plural(domains, "domain")}`,
      tooltip: "Pages (brands) with at least one ad in scope. The sub-line counts their domains.",
    }),
    kpi({
      key: "new",
      label: "New ads",
      value: newCount,
      display: newCount == null ? "—" : formatCompact(newCount),
      sub: newCount == null ? undefined : newCount > 0 ? "since your last visit" : "Nothing new since your last visit",
      tooltip: "Ads added to Industry Insights since your last visit.",
      disabledReason: newCount == null ? "Your last visit isn't known yet." : undefined,
    }),
    kpi({
      key: "avgDaysLive",
      label: "Avg days live",
      value: avg.value,
      display: avg.value == null ? "—" : formatDays(avg.value),
      sub: `based on ${plural(avg.basedOn, "ad")} with a known start`,
      tooltip: "Average days from start date to last seen. Ads with an unknown start date are left out, never estimated.",
      disabledReason: avg.basedOn === 0 ? "No ad in this scope has a known start date." : undefined,
    }),
    kpi({
      key: "landingPages",
      label: "Landing pages & offers",
      value: lp.landingPages,
      display: formatCompact(lp.landingPages),
      sub: plural(lp.offers, "offer"),
      tooltip: "Landing pages used by ads in scope, and the distinct offer domains they send to (where traced).",
    }),
  ];
}

/** Advertiser › Domain / Page KPI row: Total, Active, New, Scaling, Rising. */
export function advertiserKpis(kind: AdvertiserKind, baseAds: Ad[], scope: Scope, ctx: SelectorCtx): Kpi[] {
  const data = ctx.data ?? INDEX;
  const scoped = adsInScope(baseAds, scope, ctx);
  const base = adsInBaseScope(baseAds, scope, ctx);
  const entityKind = kind === "page" ? "page" : "domain";
  const inScope = groupByEntity(scoped, entityKind, data);
  const inBase = groupByEntity(base, entityKind, data);
  let active = 0;
  let newCount = 0;
  let scalingCount = 0;
  let risingCount = 0;
  for (const [id, ads] of inScope) {
    if (ads.some((a) => a.status === "active")) active++;
    const adv = data.advertiserById.get(id);
    if (adv && isNew(adv, ctx.lastVisitAt)) newCount++;
    const cmp = compareEntity(inBase.get(id) ?? ads, scope.period, ctx.now);
    if (isScalingComparison(cmp)) scalingCount++;
    if (isRisingComparison(cmp)) risingCount++;
  }
  const total = inScope.size;
  const noun = kind === "page" ? "pages" : "domains";
  return [
    kpi({
      key: "total",
      label: kind === "page" ? "Total pages" : "Total domains",
      value: total,
      display: formatCompact(total),
      sub: `${plural(scoped.length, "ad")} in scope`,
      tooltip: `${kind === "page" ? "Pages (brands)" : "Domains"} with at least one ad in the current scope.`,
    }),
    kpi({
      key: "active",
      label: kind === "page" ? "Active pages" : "Active domains",
      value: active,
      display: formatCompact(active),
      sub: `${pct(active, total)}% of total`,
      tooltip: `${capital(noun)} with at least one ad seen live in the last ${ACTIVE_WINDOW_DAYS} days.`,
    }),
    kpi({
      key: "new",
      label: kind === "page" ? "New pages" : "New domains",
      value: lastVisitKnown(ctx) ? newCount : null,
      display: lastVisitKnown(ctx) ? formatCompact(newCount) : "—",
      sub: lastVisitKnown(ctx) ? (newCount > 0 ? "since your last visit" : "Nothing new since your last visit") : undefined,
      tooltip: `${capital(noun)} first seen since your last visit.`,
      disabledReason: lastVisitKnown(ctx) ? undefined : "Your last visit isn't known yet.",
    }),
    kpi({
      key: "scaling",
      label: kind === "page" ? "Scaling pages" : "Scaling domains",
      value: scalingCount,
      display: formatCompact(scalingCount),
      sub: `active ads up vs ${comparisonLabel(scope.period)}`,
      tooltip: `More active ads now than at the end of the previous period, and at least one winner.`,
    }),
    kpi({
      key: "rising",
      label: kind === "page" ? "Rising pages" : "Rising domains",
      value: risingCount,
      display: formatCompact(risingCount),
      sub: `launching more than ${comparisonLabel(scope.period)}`,
      tooltip: "Launched more new ads this period than in the previous equal period (or started launching this period). No minimum base.",
    }),
  ];
}

/** LP & Offers KPI row: LPs + offers · Active + New LPs · Rising LPs + avg ads per LP. */
export function landingPageKpis(baseAds: Ad[], scope: Scope, ctx: SelectorCtx): Kpi[] {
  const data = ctx.data ?? INDEX;
  const scoped = adsInScope(baseAds, scope, ctx);
  const base = adsInBaseScope(baseAds, scope, ctx);
  const inScope = groupByEntity(scoped, "landing-page", data);
  const inBase = groupByEntity(base, "landing-page", data);
  const { landingPages, offers } = landingPageAndOfferCounts(scoped, data);
  let active = 0;
  let newCount = 0;
  let risingCount = 0;
  let adsOnLps = 0;
  for (const [id, ads] of inScope) {
    adsOnLps += ads.length;
    if (ads.some((a) => a.status === "active")) active++;
    const lp = data.landingPageById.get(id);
    if (lp && isNew(lp, ctx.lastVisitAt)) newCount++;
    if (isRisingComparison(compareEntity(inBase.get(id) ?? ads, scope.period, ctx.now))) risingCount++;
  }
  const avgAds = landingPages ? Math.round((adsOnLps / landingPages) * 10) / 10 : 0;
  return [
    kpi({
      key: "landingPages",
      label: "Landing pages & offers",
      value: landingPages,
      display: formatCompact(landingPages),
      sub: plural(offers, "offer"),
      tooltip: "Landing pages used by ads in scope, plus the distinct offer domains they send to. Offers are counted only where traced.",
    }),
    kpi({
      key: "activeLandingPages",
      label: "Active landing pages",
      value: active,
      display: formatCompact(active),
      sub: lastVisitKnown(ctx) ? `${formatCompact(newCount)} new since your last visit` : undefined,
      tooltip: `Landing pages with at least one ad seen live in the last ${ACTIVE_WINDOW_DAYS} days. "New" = first seen since your last visit.`,
    }),
    kpi({
      key: "risingLandingPages",
      label: "Rising landing pages",
      value: risingCount,
      display: formatCompact(risingCount),
      sub: `avg ${avgAds} ads per landing page`,
      tooltip: "Landing pages getting more new ads this period than in the previous equal period. The sub-line is the average number of ads per landing page in scope.",
    }),
  ];
}

/** Ads with this element type analysed (field not null). */
export function elementValue(ad: Ad, type: ElementType): string | null {
  switch (type) {
    case "framework": return ad.analysis.framework;
    case "hook": return ad.analysis.hookStyle;
    case "angle": return ad.analysis.angle;
    case "concept": return ad.analysis.concept;
    default: return null;
  }
}

/**
 * Creative Element Insights KPI row (every tab): items + ads analysed, most
 * used item + share, fastest rising, video vs image split, then every Discover KPI.
 */
export function elementKpis(type: ElementType, baseAds: Ad[], scope: Scope, ctx: SelectorCtx): Kpi[] {
  const data = ctx.data ?? INDEX;
  const scoped = adsInScope(baseAds, scope, ctx);
  const base = adsInBaseScope(baseAds, scope, ctx);
  const analysed = scoped.filter((a) => elementValue(a, type) != null);
  const counts = new Map<string, number>();
  for (const a of analysed) {
    const v = elementValue(a, type) as string;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let topId: string | null = null;
  let topCount = 0;
  for (const [id, c] of counts) {
    if (c > topCount || (c === topCount && topId != null && id < topId)) {
      topId = id;
      topCount = c;
    }
  }
  const topLabel = topId ? data.elementById[type].get(topId)?.label ?? topId : null;
  const fastest = rising(type, base, scope.period, ctx.now, { limit: 1, data })[0];
  const video = analysed.filter((a) => a.mediaKind === "video").length;
  const image = analysed.filter((a) => a.mediaKind === "image").length;
  const carousel = analysed.filter((a) => a.mediaKind === "carousel").length;
  const noun = ELEMENT_TYPE_PLURAL[type];

  const own: Kpi[] = [
    kpi({
      key: "items",
      label: `Total ${noun}`,
      value: counts.size,
      display: formatCompact(counts.size),
      sub: `across ${formatCompact(analysed.length)} ads analysed`,
      tooltip: `Distinct ${noun} found in ads in scope. Ads where the ${type} could not be read are left out.`,
      disabledReason: analysed.length === 0 ? `No ad in this scope has a ${type} identified.` : undefined,
    }),
    kpi({
      key: "topItem",
      label: `Most used ${type}`,
      value: topId ? pct(topCount, analysed.length) : null,
      display: topLabel ?? "—",
      sub: topId ? `${pct(topCount, analysed.length)}% of ${formatCompact(analysed.length)} analysed ads` : undefined,
      tooltip: `The ${type} that appears in the most ads in scope. This counts usage only; it says nothing about results.`,
      disabledReason: topId ? undefined : `No ad in this scope has a ${type} identified.`,
    }),
    kpi({
      key: "fastestRising",
      label: "Fastest rising",
      value: fastest ? fastest.changePct : null,
      display: fastest ? fastest.label : "—",
      sub: fastest ? `${formatChange(fastest.changePct, fastest.cur)} launches vs ${comparisonLabel(scope.period)}` : undefined,
      tooltip: `The ${type} whose new-ad count grew most against the previous equal period. No minimum base.`,
      disabledReason: fastest ? undefined : `No ${type} launched more ads than in the previous period.`,
    }),
    kpi({
      key: "videoVsImage",
      label: "Video vs image",
      value: pct(video, analysed.length),
      display: `${pct(video, analysed.length)}% / ${pct(image, analysed.length)}%`,
      sub: `video / image · carousel ${pct(carousel, analysed.length)}%`,
      tooltip: `Media split of the ${formatCompact(analysed.length)} ads with a ${type} identified. Carousels are shown separately.`,
      disabledReason: analysed.length === 0 ? `No ad in this scope has a ${type} identified.` : undefined,
    }),
  ];
  return [...own, ...discoverKpis(baseAds, scope, ctx)];
}

function capital(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
