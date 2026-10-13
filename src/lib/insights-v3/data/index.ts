/**
 * Industry Insights V2 — data entry point.
 *
 * The module-level singleton is generated once at import with `Date.now()`
 * captured at module load, so every date is relative to "now".
 * Index maps are built once. Selectors accept a `DataIndex` (default: this one),
 * so tests can build their own with `buildIndex(generateUniverse({ seed, now }))`.
 */
import type {
  Ad, Advertiser, AdvertiserKind, Category, CategoryId, CreativeElement, ElementType, FrameworkElementKey,
  Industry, IndustryId, LandingPage,
} from "../types";
import { applyDemoCoverage } from "./demoCoverage";
import { DEFAULT_SEED, generateUniverse } from "./generate";
import type { Universe } from "./generate";
import { COUNTRY_NAME, FRAMEWORK_ELEMENTS } from "./vocab";
import type { FrameworkElementInfo } from "./vocab";

export interface OfferInfo {
  /** Offer id = the offer domain. */
  id: string;
  domain: string;
  /** First traced offer URL seen for this domain. */
  url: string | null;
  landingPageIds: string[];
}

export interface DataIndex {
  universe: Universe;
  now: number;
  ads: Ad[];
  advertisers: Advertiser[];
  landingPages: LandingPage[];
  offers: OfferInfo[];
  adById: Map<string, Ad>;
  advertiserById: Map<string, Advertiser>;
  landingPageById: Map<string, LandingPage>;
  offerById: Map<string, OfferInfo>;
  industryById: Map<IndustryId, Industry>;
  categoryById: Map<CategoryId, Category>;
  elementById: Record<ElementType, Map<string, CreativeElement>>;
  frameworkElementByKey: Map<FrameworkElementKey, FrameworkElementInfo>;
  adsByPage: Map<string, Ad[]>;
  adsByDomain: Map<string, Ad[]>;
  adsByLandingPage: Map<string, Ad[]>;
  adsByOffer: Map<string, Ad[]>;
  landingPagesByDomainName: Map<string, LandingPage[]>;
  /** Domain name → domain advertiser. */
  domainAdvertiserByName: Map<string, Advertiser>;
}

function push<K, V>(m: Map<K, V[]>, k: K, v: V) {
  const list = m.get(k);
  if (list) list.push(v);
  else m.set(k, [v]);
}

export function buildIndex(universe: Universe): DataIndex {
  const { ads, advertisers, landingPages } = universe;
  const landingPageById = new Map(landingPages.map((l) => [l.id, l]));
  const adsByPage = new Map<string, Ad[]>();
  const adsByDomain = new Map<string, Ad[]>();
  const adsByLandingPage = new Map<string, Ad[]>();
  const adsByOffer = new Map<string, Ad[]>();
  for (const a of ads) {
    push(adsByPage, a.pageAdvertiserId, a);
    if (a.domainAdvertiserId) push(adsByDomain, a.domainAdvertiserId, a);
    if (a.landingPageId) {
      push(adsByLandingPage, a.landingPageId, a);
      const lp = landingPageById.get(a.landingPageId);
      if (lp?.offerDomain) push(adsByOffer, lp.offerDomain, a);
    }
  }
  const landingPagesByDomainName = new Map<string, LandingPage[]>();
  const offerById = new Map<string, OfferInfo>();
  for (const l of landingPages) {
    push(landingPagesByDomainName, l.domain, l);
    if (l.offerDomain) {
      const o = offerById.get(l.offerDomain);
      if (o) o.landingPageIds.push(l.id);
      else offerById.set(l.offerDomain, { id: l.offerDomain, domain: l.offerDomain, url: l.offerUrl, landingPageIds: [l.id] });
    }
  }
  const elementById = {
    framework: new Map(universe.elements.framework.map((e) => [e.id, e])),
    hook: new Map(universe.elements.hook.map((e) => [e.id, e])),
    angle: new Map(universe.elements.angle.map((e) => [e.id, e])),
    concept: new Map(universe.elements.concept.map((e) => [e.id, e])),
  } as Record<ElementType, Map<string, CreativeElement>>;

  return {
    universe,
    now: universe.now,
    ads,
    advertisers,
    landingPages,
    offers: Array.from(offerById.values()).sort((a, b) => a.id.localeCompare(b.id)),
    adById: new Map(ads.map((a) => [a.id, a])),
    advertiserById: new Map(advertisers.map((a) => [a.id, a])),
    landingPageById,
    offerById,
    industryById: new Map(universe.industries.map((i) => [i.id, i])),
    categoryById: new Map(universe.categories.map((c) => [c.id, c])),
    elementById,
    frameworkElementByKey: new Map(universe.frameworkElements.map((f) => [f.key, f])),
    adsByPage,
    adsByDomain,
    adsByLandingPage,
    adsByOffer,
    landingPagesByDomainName,
    domainAdvertiserByName: new Map(advertisers.filter((a) => a.kind === "domain").map((a) => [a.name, a])),
  };
}

/* ── module singleton ───────────────────────────────────────────────────── */

/** `Date.now()` captured once at module load. */
export const MODULE_NOW = Date.now();
/** The raw generator output plus the deterministic demo-coverage overrides (see ./demoCoverage). */
export const UNIVERSE: Universe = applyDemoCoverage(generateUniverse({ seed: DEFAULT_SEED, now: MODULE_NOW }));
export const INDEX: DataIndex = buildIndex(UNIVERSE);

/* ── lookups ────────────────────────────────────────────────────────────── */

export const getAds = (data: DataIndex = INDEX): Ad[] => data.ads;
export const getAd = (id: string, data: DataIndex = INDEX): Ad | undefined => data.adById.get(id);
export const getAdvertisers = (kind?: AdvertiserKind, data: DataIndex = INDEX): Advertiser[] =>
  kind ? data.advertisers.filter((a) => a.kind === kind) : data.advertisers;
export const getAdvertiser = (id: string, data: DataIndex = INDEX): Advertiser | undefined => data.advertiserById.get(id);
export const getLandingPages = (data: DataIndex = INDEX): LandingPage[] => data.landingPages;
export const getLandingPage = (id: string, data: DataIndex = INDEX): LandingPage | undefined => data.landingPageById.get(id);
export const getOffers = (data: DataIndex = INDEX): OfferInfo[] => data.offers;
export const getOffer = (domain: string, data: DataIndex = INDEX): OfferInfo | undefined => data.offerById.get(domain);
export const getElements = (type: ElementType, data: DataIndex = INDEX): CreativeElement[] => data.universe.elements[type];
export const getElement = (type: ElementType, id: string, data: DataIndex = INDEX): CreativeElement | undefined =>
  data.elementById[type].get(id);
export const getFrameworkElements = (): FrameworkElementInfo[] => FRAMEWORK_ELEMENTS;
export const getFrameworkElement = (key: FrameworkElementKey, data: DataIndex = INDEX): FrameworkElementInfo | undefined =>
  data.frameworkElementByKey.get(key);
export const getIndustries = (data: DataIndex = INDEX): Industry[] => data.universe.industries;
export const getIndustry = (id: IndustryId, data: DataIndex = INDEX): Industry | undefined => data.industryById.get(id);
export const getCategories = (data: DataIndex = INDEX): Category[] => data.universe.categories;
export const getCategory = (id: CategoryId, data: DataIndex = INDEX): Category | undefined => data.categoryById.get(id);
/** ISO-2 → country name ("US" → "United States"). Unknown codes come back as-is. */
export const countryName = (code: string): string => COUNTRY_NAME[code] ?? code;
/** Ads of one advertiser (page or domain). */
export const getAdsForAdvertiser = (id: string, data: DataIndex = INDEX): Ad[] =>
  data.adsByPage.get(id) ?? data.adsByDomain.get(id) ?? [];

export { generateUniverse, DEFAULT_SEED } from "./generate";
export type { Universe, GenerateOptions } from "./generate";
export {
  FRAMEWORKS, HOOK_STYLES, ANGLES, CONCEPTS, FRAMEWORK_ELEMENTS, FRAMEWORK_ELEMENT_LABEL, CONCEPT_MEDIA,
  ELEMENTS_BY_TYPE, ELEMENT_TYPE_LABEL, ELEMENT_TYPE_PLURAL, FUNNEL_TYPES, COUNTRY_NAME, ANGLE_BANNED_WORDS,
} from "./vocab";
export type { FrameworkElementInfo, ConceptMedia } from "./vocab";
export { INDUSTRIES, CATEGORIES, INDUSTRY_CATEGORIES, slugify } from "./taxonomy";
export { scoreAd, scoreTier, curve, redistributionFactor, TIER_LABEL, RECOVERED_SHARE, SCORE_WEIGHTS } from "./score";
export type { ScoreInput, ScoreLanding } from "./score";
