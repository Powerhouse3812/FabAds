/**
 * Scope filtering: Industry › Category › Period (+ "My preferences only").
 * inPeriod follows reference A §2: the ad passes when it was first seen inside
 * the window OR it was live during the window (started on/before now and last
 * seen inside the window).
 */
import { ALL } from "../types";
import type { Ad, PeriodKey, Scope, TagOption } from "../types";
import { INDEX } from "../data";
import type { DataIndex } from "../data";
import { DAY_MS, EMPTY_PREFS, periodDays, toMs } from "./context";
import type { UserPrefs } from "./context";

export function inPeriod(ad: Ad, period: PeriodKey, now: number): boolean {
  const days = periodDays(period);
  if (days == null) return true;
  const start = now - days * DAY_MS;
  const first = toMs(ad.firstSeenAt) ?? 0;
  if (first >= start) return true;
  const started = toMs(ad.startedAt);
  const last = toMs(ad.lastSeenAt) ?? 0;
  return started != null && started <= now && last >= start;
}

/** Ad belongs to the user's preferences: followed page/industry or a competitor-marked page/domain. */
export function matchesPrefs(ad: Ad, prefs: UserPrefs): boolean {
  return (
    prefs.followedPageIds.includes(ad.pageAdvertiserId) ||
    prefs.followedIndustryIds.includes(ad.industryId) ||
    prefs.competitorPageIds.includes(ad.pageAdvertiserId) ||
    (ad.domainAdvertiserId != null && prefs.competitorDomainIds.includes(ad.domainAdvertiserId))
  );
}

export function hasAnyPrefs(prefs: UserPrefs | undefined): boolean {
  if (!prefs) return false;
  return (
    prefs.followedPageIds.length + prefs.followedIndustryIds.length + prefs.competitorPageIds.length + prefs.competitorDomainIds.length > 0
  );
}

/** Ads from preference sources (My Feeds). Pure: prefs are passed in. */
export function adsForPrefs(ads: Ad[], prefs: UserPrefs): Ad[] {
  if (!hasAnyPrefs(prefs)) return [];
  const pages = new Set([...prefs.followedPageIds, ...prefs.competitorPageIds]);
  const industries = new Set(prefs.followedIndustryIds);
  const domains = new Set(prefs.competitorDomainIds);
  return ads.filter(
    (a) => pages.has(a.pageAdvertiserId) || industries.has(a.industryId) || (a.domainAdvertiserId != null && domains.has(a.domainAdvertiserId)),
  );
}

export interface ScopeOpts {
  now: number;
  /** Used only when scope.myPrefsOnly is on. Missing prefs = empty prefs = no ads. */
  prefs?: UserPrefs;
}

/**
 * Industry + category + prefs, WITHOUT the period. Trend %, rising and scaling
 * compare periods, so they need ads from outside the current window.
 */
export function adsInBaseScope(ads: Ad[], scope: Scope, opts?: Partial<ScopeOpts>): Ad[] {
  let out = ads;
  if (scope.myPrefsOnly) out = adsForPrefs(out, opts?.prefs ?? EMPTY_PREFS);
  if (scope.industry !== ALL) out = out.filter((a) => a.industryId === scope.industry);
  if (scope.category !== ALL) out = out.filter((a) => a.categoryId === scope.category);
  return out;
}

/** Everything the scope bar says: industry, category, period, and prefs when toggled. */
export function adsInScope(ads: Ad[], scope: Scope, opts: ScopeOpts): Ad[] {
  const base = adsInBaseScope(ads, scope, opts);
  if (scope.period === "all") return base;
  return base.filter((a) => inPeriod(a, scope.period, opts.now));
}

/**
 * Industry dropdown options with counts (period + prefs applied, industry and
 * category selection ignored). First option is "All industries".
 */
export function industryOptions(ads: Ad[], scope: Scope, opts: ScopeOpts, data: DataIndex = INDEX): TagOption[] {
  const pool = adsInScope(ads, { ...scope, industry: ALL, category: ALL }, opts);
  const counts = new Map<string, number>();
  for (const a of pool) counts.set(a.industryId, (counts.get(a.industryId) ?? 0) + 1);
  return [
    { id: ALL, label: "All industries", count: pool.length },
    ...data.universe.industries.map((i) => ({ id: i.id, label: i.label, count: counts.get(i.id) ?? 0 })),
  ];
}

/**
 * Category dropdown options: the full A–Z list in every industry (Q2), counted
 * inside the chosen industry + period. 0-count options stay (UI disables them).
 * First option is "All categories".
 */
export function categoryOptions(ads: Ad[], scope: Scope, opts: ScopeOpts, data: DataIndex = INDEX): TagOption[] {
  const pool = adsInScope(ads, { ...scope, category: ALL }, opts);
  const counts = new Map<string, number>();
  for (const a of pool) counts.set(a.categoryId, (counts.get(a.categoryId) ?? 0) + 1);
  return [
    { id: ALL, label: "All categories", count: pool.length },
    ...data.universe.categories.map((c) => ({ id: c.id, label: c.label, count: counts.get(c.id) ?? 0 })),
  ];
}

/** Human label for the current scope, e.g. "Lead Gen › Auto Insurance · Last 30 days". */
export function scopeLabel(scope: Scope, data: DataIndex = INDEX): string {
  const ind = scope.industry === ALL ? "All industries" : data.industryById.get(scope.industry)?.label ?? scope.industry;
  const cat = scope.category === ALL ? "All categories" : data.categoryById.get(scope.category)?.label ?? scope.category;
  const period = scope.period === "all" ? "All time" : `Last ${periodDays(scope.period)} days`;
  return `${ind} › ${cat} · ${period}${scope.myPrefsOnly ? " · My preferences" : ""}`;
}
