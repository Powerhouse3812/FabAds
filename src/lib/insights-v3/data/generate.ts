/**
 * Deterministic dummy universe for Industry Insights V2.
 *
 * `generateUniverse({ seed, now })` is pure: same seed + now → identical data.
 * Dates are relative to `now`, so "New since last visit" works in a live demo.
 */
import { ACTIVE_WINDOW_DAYS } from "../types";
import type {
  Ad, AdAnalysis, AdDemographic, AdDeliveryStats, AdLocation, Advertiser, Category, CategoryId,
  CreativeElement, ElementType, Engagement, FrameworkElementKey, FunnelType, Industry, IndustryId,
  LandingPage, MediaKind, Platform, ScriptBeat,
} from "../types";
import {
  BEAT_TEXT, BEAT_VISUAL_IMAGE, BEAT_VISUAL_VIDEO, FIRST_NAMES, FRAMEWORK_BEATS, HOOK_TEMPLATES,
  LONG_DOMAIN, LONG_PAGE_NAMES, LP_PATHS, LP_TEXT, LP_TITLES, MONTHS, RELATIONS, STATES, THEMES,
  descFor, themeFor,
} from "./copy";
import type { CatDesc, ThemeId, ThemePack } from "./copy";
import { CAROUSEL_ASPECTS, IMAGE_ASPECTS, VIDEO_ASPECTS, VIDEO_URLS, avatarUrl, logoUrl, screenshotUrl, thumbnailUrl } from "./media";
import { chance, childRng, int, logNormal, pick, sample, shuffle, weighted, weightedKey, zipfWeights } from "./prng";
import type { Rng } from "./prng";
import { scoreAd } from "./score";
import { CATEGORIES, FEATURED_CATEGORIES, INDUSTRIES, INDUSTRY_CATEGORIES, INDUSTRY_WEIGHTS, slugify } from "./taxonomy";
import {
  ANGLES, ANGLE_AFFINITY, COUNTRY_NAME, ELEMENTS_BY_TYPE, FRAMEWORKS, FRAMEWORK_ELEMENTS, HOOK_STYLES,
  IMAGE_CONCEPT_IDS, TRANSPARENCY_REGION_POOL, VIDEO_CONCEPT_IDS,
} from "./vocab";
import type { FrameworkElementInfo } from "./vocab";

export const DEFAULT_SEED = 20261010;
export const DEFAULT_AD_COUNT = 800;
export const TARGET_PAGE_COUNT = 130;
export const TARGET_DOMAIN_COUNT = 100;
/** Ads whose firstSeenAt falls inside the last 48h ("New" in a demo). */
export const RECENT_AD_COUNT = 25;
/** Of those, how many fall inside the last hour. */
export const LAST_HOUR_AD_COUNT = 5;

const DAY = 86_400_000;
const HOUR = 3_600_000;
const MINUTE = 60_000;

export interface Universe {
  seed: number;
  now: number;
  generatedAt: string;
  industries: Industry[];
  categories: Category[];
  industryCategories: Record<IndustryId, CategoryId[]>;
  elements: Record<ElementType, CreativeElement[]>;
  frameworkElements: FrameworkElementInfo[];
  advertisers: Advertiser[];
  landingPages: LandingPage[];
  ads: Ad[];
}

export interface GenerateOptions {
  seed?: number;
  now: number;
  adCount?: number;
}

/* ── text helpers ───────────────────────────────────────────────────────── */

const SMALL_WORDS = new Set(["a", "an", "the", "and", "or", "for", "of", "to", "in", "on", "at", "by", "with", "from", "vs", "your"]);

function capFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function titleCase(s: string): string {
  return s
    .split(" ")
    .map((w, i) => (i > 0 && SMALL_WORDS.has(w.toLowerCase()) ? w.toLowerCase() : capFirst(w)))
    .join(" ");
}

interface FillCtx {
  d: CatDesc;
  t: ThemePack;
  rng: Rng;
  year: number;
  month: string;
  hook?: string;
  ctaText?: string;
  offer?: string;
}

function fill(tpl: string, c: FillCtx): string {
  return tpl.replace(/\{(\w+)\}/g, (_, key: string) => {
    switch (key) {
      case "a": return c.d.a;
      case "A": return titleCase(c.d.a);
      case "p": return c.d.p;
      case "P": return capFirst(c.d.p);
      case "o": return c.d.o;
      case "O": return titleCase(c.d.o);
      case "pr": return c.d.pr;
      case "PR": return titleCase(c.d.pr);
      case "expert": return pick(c.rng, c.t.experts);
      case "Expert": return capFirst(pick(c.rng, c.t.experts));
      case "offer": return c.offer ?? pick(c.rng, c.t.offers);
      case "Offer": return capFirst(c.offer ?? pick(c.rng, c.t.offers));
      case "n": return String(pick(c.rng, [3, 5, 7, 9]));
      case "pct": return String(int(c.rng, 54, 89));
      case "big": return pick(c.rng, ["12,000", "48,000", "120,000", "250,000", "1.2 million"]);
      case "name": return pick(c.rng, FIRST_NAMES);
      case "st": return pick(c.rng, STATES)[0];
      case "stName": return pick(c.rng, STATES)[1];
      case "age": return String(int(c.rng, 41, 72));
      case "year": return String(c.year);
      case "month": return c.month;
      case "days": return String(pick(c.rng, [14, 21, 30, 60, 90]));
      case "rel": return pick(c.rng, RELATIONS);
      case "price": return pick(c.rng, ["$29/month", "$39", "$49", "$1.30 a day"]);
      case "slug": return slugify(c.d.o).slice(0, 40);
      case "hook": return c.hook ?? "";
      case "ctaText": return c.ctaText ?? "";
      default: return "";
    }
  });
}

function truncateWords(s: string, maxWords: number): string {
  const w = s.split(/\s+/);
  return w.length <= maxWords ? s : w.slice(0, maxWords).join(" ");
}

function digits(rng: Rng, n: number): string {
  let s = String(int(rng, 1, 9));
  while (s.length < n) s += String(int(rng, 0, 9));
  return s;
}

const iso = (ms: number) => new Date(ms).toISOString();

/* ── internal specs ─────────────────────────────────────────────────────── */

interface PageSpec {
  id: string;
  name: string;
  industry: IndustryId;
  second: IndustryId | null;
  categories: CategoryId[];
  secondCategories: CategoryId[];
  weight: number;
  newEntrant: boolean;
  fixedAds: number | null;
  domainIds: string[];
  displayId: string;
  avatar: string | null;
}

interface DomainSpec {
  id: string;
  name: string;
  industry: IndustryId;
  theme: ThemeId;
  category: CategoryId;
  pageIds: string[];
  newEntrant: boolean;
  avatar: string | null;
}

/* ── main ───────────────────────────────────────────────────────────────── */

export function generateUniverse(opts: GenerateOptions): Universe {
  const seed = opts.seed ?? DEFAULT_SEED;
  const now = opts.now;
  const adCount = opts.adCount ?? DEFAULT_AD_COUNT;
  const nowDate = new Date(now);
  const year = nowDate.getUTCFullYear();
  const month = MONTHS[nowDate.getUTCMonth()];

  const rPages = childRng(seed, "pages");
  const rDomains = childRng(seed, "domains");
  const rLps = childRng(seed, "landing-pages");
  const rAds = childRng(seed, "ads");
  const rText = childRng(seed, "text");
  const rDates = childRng(seed, "dates");
  const rExtra = childRng(seed, "extras");

  const categoryLabel = new Map(CATEGORIES.map((c) => [c.id, c.label]));
  const labelOf = (id: CategoryId) => categoryLabel.get(id) ?? id;

  /* 1. Pages ─────────────────────────────────────────────────────────── */

  const industryIds = INDUSTRIES.map((i) => i.id);
  const pageCountByIndustry = allocate(TARGET_PAGE_COUNT, industryIds.map((i) => INDUSTRY_WEIGHTS[i]), 6);
  const usedNames = new Set<string>();
  const pages: PageSpec[] = [];
  let pageSeq = 0;

  const pickCategories = (rng: Rng, industry: IndustryId, n: number): CategoryId[] => {
    const canon = INDUSTRY_CATEGORIES[industry];
    const featured = FEATURED_CATEGORIES[industry];
    const rest = canon.filter((c) => !featured.includes(c));
    const pool = [...featured, ...shuffle(rng, rest)];
    const w = zipfWeights(pool.length, 1.05);
    const out: CategoryId[] = [];
    let guard = 0;
    while (out.length < n && guard++ < 50) {
      const c = weighted(rng, pool, w);
      if (!out.includes(c)) out.push(c);
    }
    return out;
  };

  const SECOND_INDUSTRY: Partial<Record<IndustryId, IndustryId>> = {
    vsl: "telehealth",
    telehealth: "vsl",
    "lead-gen": "others",
    "e-commerce": "others",
    others: "lead-gen",
  };

  industryIds.forEach((industry, idx) => {
    for (let i = 0; i < pageCountByIndustry[idx]; i++) {
      const cats = pickCategories(rPages, industry, int(rPages, 1, 3));
      const theme = themeFor(industry, cats[0], labelOf(cats[0]));
      const t = THEMES[theme];
      let name = "";
      for (let tries = 0; tries < 40; tries++) {
        const candidate = `${pick(rPages, t.pagePrefixes)} ${pick(rPages, t.pageSuffixes)}`;
        if (!usedNames.has(candidate)) {
          name = candidate;
          break;
        }
      }
      if (!name) name = `${pick(rPages, t.pagePrefixes)} ${pick(rPages, t.pageSuffixes)} ${++pageSeq}`;
      usedNames.add(name);
      const second = SECOND_INDUSTRY[industry] && chance(rPages, 0.08) ? (SECOND_INDUSTRY[industry] as IndustryId) : null;
      pages.push({
        id: "",
        name,
        industry,
        second,
        categories: cats,
        secondCategories: second ? pickCategories(rPages, second, 1) : [],
        weight: 0,
        newEntrant: false,
        fixedAds: null,
        domainIds: [],
        displayId: digits(rPages, 15),
        avatar: null,
      });
    }
  });

  // Long names (60+ chars) replace three regular pages of the right industry.
  for (const ln of LONG_PAGE_NAMES) {
    const target = pages.find((p) => p.industry === ln.industry && !LONG_PAGE_NAMES.some((x) => x.name === p.name));
    if (target) {
      target.name = ln.name;
      target.categories = [ln.category];
    }
  }

  // Zipf ad weights inside each industry, shuffled so big pages are spread.
  for (const industry of industryIds) {
    const list = shuffle(rPages, pages.filter((p) => p.industry === industry));
    const w = zipfWeights(list.length, 0.95);
    list.forEach((p, i) => (p.weight = w[i]));
  }
  // Long-name pages get a healthy weight so they show up in lists.
  for (const p of pages) if (LONG_PAGE_NAMES.some((x) => x.name === p.name)) p.weight = Math.max(p.weight, 0.25);

  // Three brand-new pages (all their ads land in the last 48h).
  const newEntrantCandidates = pages.filter((p) => !LONG_PAGE_NAMES.some((x) => x.name === p.name) && !p.second);
  const newEntrants = [
    newEntrantCandidates.find((p) => p.industry === "telehealth"),
    newEntrantCandidates.find((p) => p.industry === "e-commerce"),
    newEntrantCandidates.find((p) => p.industry === "lead-gen" && p.weight < 0.2),
  ].filter(Boolean) as PageSpec[];
  newEntrants.forEach((p, i) => {
    p.newEntrant = true;
    p.fixedAds = [3, 2, 4][i];
  });

  pages.forEach((p, i) => {
    p.id = `pg-${String(i + 1).padStart(3, "0")}`;
    p.avatar = chance(rPages, 0.85) ? avatarUrl(p.id) : null;
  });

  /* 2. Domains ───────────────────────────────────────────────────────── */

  const domainCountByIndustry = allocate(TARGET_DOMAIN_COUNT, industryIds.map((i) => INDUSTRY_WEIGHTS[i]), 5);
  const domains: DomainSpec[] = [];
  const usedDomainNames = new Set<string>();
  const MODS = ["", "now", "hq", "direct", "online", "today", "plus", "pro"];

  const makeDomainName = (rng: Rng, t: ThemePack, brandName: string | null): string => {
    for (let tries = 0; tries < 60; tries++) {
      const base = brandName && tries < 3
        ? brandName.toLowerCase().replace(/[^a-z0-9]+/g, "")
        : `${pick(rng, t.domainStems)}${pick(rng, MODS)}`;
      const name = `${base}${pick(rng, t.tlds)}`;
      if (!usedDomainNames.has(name)) {
        usedDomainNames.add(name);
        return name;
      }
    }
    const fallback = `${pick(rng, t.domainStems)}${int(rng, 2, 99)}${pick(rng, t.tlds)}`;
    usedDomainNames.add(fallback);
    return fallback;
  };

  industryIds.forEach((industry, idx) => {
    const indPages = pages.filter((p) => p.industry === industry && !p.newEntrant);
    const brandFirst = industry === "e-commerce" || industry === "telehealth" || industry === "others";
    for (let i = 0; i < domainCountByIndustry[idx]; i++) {
      const page = indPages[i % Math.max(1, indPages.length)];
      const category = page ? page.categories[0] : INDUSTRY_CATEGORIES[industry][0];
      const theme = themeFor(industry, category, labelOf(category));
      const useBrand = !!page && (brandFirst ? chance(rDomains, 0.75) : chance(rDomains, 0.3));
      domains.push({
        id: "",
        name: makeDomainName(rDomains, THEMES[theme], useBrand ? page.name : null),
        industry,
        theme,
        category,
        pageIds: [],
        newEntrant: false,
        avatar: null,
      });
    }
  });

  // One 60+ char domain for truncation tests.
  const longDomainTarget = domains.find((d) => d.industry === "lead-gen" && d.theme === "insurance");
  if (longDomainTarget) longDomainTarget.name = LONG_DOMAIN;

  // Two brand-new domains for two of the new pages.
  for (const p of newEntrants.slice(0, 2)) {
    const theme = themeFor(p.industry, p.categories[0], labelOf(p.categories[0]));
    domains.push({
      id: "",
      name: makeDomainName(rDomains, THEMES[theme], p.name),
      industry: p.industry,
      theme,
      category: p.categories[0],
      pageIds: [],
      newEntrant: true,
      avatar: null,
    });
  }

  domains.forEach((d, i) => {
    d.id = `dm-${String(i + 1).padStart(3, "0")}`;
    d.avatar = chance(rDomains, 0.8) ? logoUrl(d.id) : null;
  });

  // Attach domains to pages: brand domains to their own page first; 1–3 per page.
  const domainsByIndustry = new Map<IndustryId, DomainSpec[]>();
  for (const d of domains) {
    if (d.newEntrant) continue;
    const list = domainsByIndustry.get(d.industry) ?? [];
    list.push(d);
    domainsByIndustry.set(d.industry, list);
  }
  const attach = (p: PageSpec, d: DomainSpec) => {
    if (!p.domainIds.includes(d.id)) p.domainIds.push(d.id);
    if (!d.pageIds.includes(p.id)) d.pageIds.push(p.id);
  };
  for (const p of pages) {
    if (p.newEntrant) continue;
    const pool = domainsByIndustry.get(p.industry) ?? [];
    const own = pool.find((d) => d.name.startsWith(p.name.toLowerCase().replace(/[^a-z0-9]+/g, "")) && d.pageIds.length === 0);
    const n = weighted(rDomains, [1, 2, 3], [78, 15, 7]);
    if (own) attach(p, own);
    // Prefer domains whose theme matches the page's first category.
    const theme = themeFor(p.industry, p.categories[0], labelOf(p.categories[0]));
    const themed = pool.filter((d) => d.theme === theme);
    const candidates = themed.length ? themed : pool;
    let guard = 0;
    while (p.domainIds.length < n && guard++ < 20 && candidates.length) attach(p, pick(rDomains, candidates));
    if (p.second && chance(rDomains, 0.5)) {
      const secondPool = domainsByIndustry.get(p.second) ?? [];
      if (secondPool.length) attach(p, pick(rDomains, secondPool));
    }
  }
  // Every non-new domain gets at least one page.
  for (const d of domains) {
    if (d.newEntrant || d.pageIds.length) continue;
    const candidates = pages.filter((p) => p.industry === d.industry && !p.newEntrant);
    if (candidates.length) attach(pick(rDomains, candidates), d);
  }
  newEntrants.slice(0, 2).forEach((p, i) => {
    const d = domains.filter((x) => x.newEntrant)[i];
    if (d) attach(p, d);
  });
  // The third new page reuses an existing domain of its industry (a new page on an old site).
  if (newEntrants[2]) {
    const pool = domainsByIndustry.get(newEntrants[2].industry) ?? [];
    if (pool.length) attach(newEntrants[2], pick(rDomains, pool));
  }

  /* 3. Ad plan: page → industry → category → domain ──────────────────── */

  const domainById = new Map(domains.map((d) => [d.id, d]));

  // New-entrant pages get fixed counts; every other page gets ≥1 ad.
  const fixedTotal = newEntrants.reduce((s, p) => s + (p.fixedAds ?? 0), 0);
  const regularPages = pages.filter((p) => !p.newEntrant);
  const adCountByIndustry = allocate(adCount - fixedTotal - regularPages.length, industryIds.map((i) => INDUSTRY_WEIGHTS[i]), 0);
  const assignments: { page: PageSpec; industry: IndustryId }[] = [];
  for (const p of newEntrants) for (let i = 0; i < (p.fixedAds ?? 0); i++) assignments.push({ page: p, industry: p.industry });
  for (const p of regularPages) assignments.push({ page: p, industry: p.industry });
  industryIds.forEach((industry, idx) => {
    const primary = regularPages.filter((p) => p.industry === industry);
    const secondary = regularPages.filter((p) => p.second === industry);
    const pool = [...primary, ...secondary];
    const w = [...primary.map((p) => p.weight), ...secondary.map((p) => p.weight * 0.35)];
    for (let i = 0; i < adCountByIndustry[idx]; i++) assignments.push({ page: weighted(rAds, pool, w), industry });
  });
  const order = shuffle(rAds, assignments.map((_, i) => i));

  // Recent slots: all new-entrant ads + random others up to RECENT_AD_COUNT.
  const newEntrantIdx = order.filter((i) => assignments[i].page.newEntrant);
  const others = order.filter((i) => !assignments[i].page.newEntrant);
  const recentSet = new Set<number>([...newEntrantIdx, ...sample(rDates, others, RECENT_AD_COUNT - newEntrantIdx.length)]);
  const lastHourSet = new Set<number>(sample(rDates, Array.from(recentSet), LAST_HOUR_AD_COUNT));

  interface AdPlan {
    assignIdx: number;
    page: PageSpec;
    industry: IndustryId;
    categoryId: CategoryId;
    theme: ThemeId;
    domain: DomainSpec | null;
    wantsLp: boolean;
    lp: LandingPage | null;
  }

  const plans: AdPlan[] = order.map((assignIdx) => {
    const { page, industry } = assignments[assignIdx];
    const categories =
      industry === page.industry ? page.categories : page.secondCategories.length ? page.secondCategories : pickCategories(rAds, industry, 1);
    const categoryId = weighted(rAds, categories, zipfWeights(categories.length, 1.2));
    const theme = themeFor(industry, categoryId, labelOf(categoryId));
    let domain: DomainSpec | null = null;
    let wantsLp = false;
    if (page.domainIds.length && !chance(rAds, 0.05)) {
      const all = page.domainIds.map((d) => domainById.get(d) as DomainSpec);
      const sameIndustry = all.filter((d) => d.industry === industry);
      const pool = sameIndustry.length ? sameIndustry : all;
      domain = weighted(rAds, pool, zipfWeights(pool.length, 1.3));
      wantsLp = chance(rAds, 0.74);
    }
    return { assignIdx, page, industry, categoryId, theme, domain, wantsLp, lp: null };
  });

  // Repair: every domain is used by at least one ad (moved from a busier domain of an attached page).
  const domainUse = new Map<string, number>();
  for (const p of plans) if (p.domain) domainUse.set(p.domain.id, (domainUse.get(p.domain.id) ?? 0) + 1);
  for (const d of domains) {
    if (domainUse.get(d.id)) continue;
    const donor = plans.find(
      (p) => d.pageIds.includes(p.page.id) && p.domain && (domainUse.get(p.domain.id) ?? 0) > 1,
    );
    if (!donor || !donor.domain) continue;
    domainUse.set(donor.domain.id, (domainUse.get(donor.domain.id) ?? 0) - 1);
    donor.domain = d;
    domainUse.set(d.id, 1);
  }

  /* 4. Landing pages, sized to the ads that land on them ─────────────── */

  const offerPools = new Map<ThemeId, string[]>();
  const offerPoolFor = (theme: ThemeId): string[] => {
    const existing = offerPools.get(theme);
    if (existing) return existing;
    const t = THEMES[theme];
    const stems = t.offerStems.length ? t.offerStems : t.domainStems.map((s) => `${s}-checkout`);
    const pool = stems.flatMap((s, i) => (i % 2 === 0 ? [`${s}.com`, `get${s.replace(/-/g, "")}.com`] : [`${s}.com`]));
    offerPools.set(theme, pool);
    return pool;
  };
  const WORDS: Record<FunnelType, [number, number]> = {
    quiz: [150, 400],
    advertorial: [1200, 2800],
    "direct-vsl": [300, 900],
    "lead-form": [200, 600],
    "product-page": [500, 1500],
  };

  const landingPages: LandingPage[] = [];
  const lpCategory = new Map<string, CategoryId>();

  const makeLandingPage = (d: DomainSpec, industry: IndustryId, cat: CategoryId): LandingPage => {
    const id = `lp-${String(landingPages.length + 1).padStart(3, "0")}`;
    const theme = themeFor(industry, cat, labelOf(cat));
    const t = THEMES[theme];
    const desc = descFor(cat, labelOf(cat));
    const funnelWeights = (industry === "vsl" ? { "direct-vsl": 6, advertorial: 4, quiz: 1 } : t.funnels) as Record<FunnelType, number>;
    const funnel: FunnelType | null = chance(rLps, 0.04) ? null : weightedKey(rLps, funnelWeights);
    const ctx: FillCtx = { d: desc, t, rng: rLps, year, month };
    const path = fill(pick(rLps, LP_PATHS[funnel ?? "lead-form"]), ctx);
    const withParams = (theme === "arb" || theme === "nutra") && chance(rLps, 0.3);
    const url = `https://${d.name}${path}${withParams ? `?sub_id=${int(rLps, 100, 999)}` : ""}`;
    const finalUrl = chance(rLps, 0.08) ? null : chance(rLps, 0.12) ? `https://www.${d.name}${path}` : `https://${d.name}${path}`;
    const traced = chance(rLps, theme === "ecom" ? 0.3 : theme === "lifestyle" ? 0.4 : 0.68);
    const offerDomain = traced ? pick(rLps, offerPoolFor(theme)) : null;
    const offerUrl = offerDomain ? `https://${offerDomain}/${pick(rLps, ["order", "checkout", "start", "apply", "signup"])}` : null;
    const hops = int(rLps, 1, 4);
    const redirectPath: string[] = [url];
    if (hops >= 3) redirectPath.push(`https://${d.name}/next/${int(rLps, 10, 99)}`);
    if (hops >= 2) redirectPath.push(finalUrl && finalUrl !== url ? finalUrl : `https://${d.name}/continue`);
    if (hops >= 4 && offerUrl) redirectPath.push(offerUrl);
    const title = chance(rLps, 0.04) ? null : fill(pick(rLps, LP_TITLES[funnel ?? "lead-form"]), ctx);
    const pageText = chance(rLps, 0.12) ? null : LP_TEXT[funnel ?? "lead-form"].map((line) => fill(line, ctx)).join(" ");
    const [wMin, wMax] = WORDS[funnel ?? "lead-form"];
    const lp: LandingPage = {
      id,
      url,
      domain: d.name,
      finalUrl,
      title,
      httpStatus: chance(rLps, 0.05) ? null : chance(rLps, 0.04) ? 404 : 200,
      wordCount: pageText ? int(rLps, wMin, wMax) : null,
      pageText,
      screenshotUrl: chance(rLps, 0.15) ? null : screenshotUrl(id),
      offerDomain,
      offerUrl,
      funnelType: funnel,
      redirectPath,
      capturedAt: null, // set from its ads below
      firstSeenAt: iso(now), // set from its ads below
    };
    landingPages.push(lp);
    lpCategory.set(id, cat);
    return lp;
  };

  const LP_RATIO = 0.53;
  for (const d of domains) {
    const list = plans.filter((p) => p.domain === d && p.wantsLp);
    if (!list.length) continue;
    const k = Math.max(1, Math.min(list.length, 8, Math.round(list.length * LP_RATIO * (0.7 + rLps() * 0.6))));
    const shuffled = shuffle(rLps, list);
    const seeds: AdPlan[] = [];
    const seenCats = new Set<CategoryId>();
    for (const p of shuffled) if (seeds.length < k && !seenCats.has(p.categoryId)) { seeds.push(p); seenCats.add(p.categoryId); }
    for (const p of shuffled) if (seeds.length < k && !seeds.includes(p)) seeds.push(p);
    const domainLps = seeds.map((p) => {
      p.lp = makeLandingPage(d, p.industry, p.categoryId);
      return p.lp;
    });
    for (const p of shuffled) {
      if (p.lp) continue;
      const same = domainLps.filter((l) => lpCategory.get(l.id) === p.categoryId);
      const pool = same.length && chance(rLps, 0.75) ? same : domainLps;
      p.lp = weighted(rLps, pool, zipfWeights(pool.length, 0.9));
    }
  }

  /* 5. Ads ───────────────────────────────────────────────────────────── */

  const ads: Ad[] = [];
  plans.forEach((plan, n) => {
    const { page, industry, categoryId, theme, domain, lp, assignIdx } = plan;
    const id = `ad-${String(n + 1).padStart(4, "0")}`;
    const t = THEMES[theme];
    const desc = descFor(categoryId, labelOf(categoryId));

    // Media
    const mediaKind: MediaKind = chance(rAds, 0.1) ? "carousel" : chance(rAds, Math.min(0.85, t.videoShare * 1.12)) ? "video" : "image";
    const aspectRatio = pick(rAds, mediaKind === "video" ? VIDEO_ASPECTS : mediaKind === "carousel" ? CAROUSEL_ASPECTS : IMAGE_ASPECTS);
    const thumbnail = chance(rAds, 0.1) ? null : thumbnailUrl(id, aspectRatio);
    const videoUrl = mediaKind === "video" ? pick(rAds, VIDEO_URLS) : null;

    // Copy style: brand-led (no DR signals) on some e-com / lifestyle ads; else short / medium / long DR copy.
    const brandLed = chance(rText, theme === "ecom" || theme === "lifestyle" ? 0.16 : theme === "career" ? 0.08 : 0.03);
    const density = rText();

    // Elements
    const framework = chance(rAds, 0.1) ? pick(rAds, FRAMEWORKS).id : weightedKey(rAds, t.frameworks);
    let hookStyle = chance(rAds, 0.08) ? pick(rAds, HOOK_STYLES).id : weightedKey(rAds, t.hooks);
    if (brandLed) hookStyle = "callout";
    const concept =
      mediaKind === "video"
        ? chance(rAds, 0.1) ? pick(rAds, VIDEO_CONCEPT_IDS) : weightedKey(rAds, t.videoConcepts)
        : chance(rAds, 0.1) ? pick(rAds, IMAGE_CONCEPT_IDS) : weightedKey(rAds, t.imageConcepts);
    const angleCandidates = ANGLES.filter((a) => ANGLE_AFFINITY[a.id].includes(categoryId));
    const angle = angleCandidates.length
      ? weighted(rAds, angleCandidates, zipfWeights(angleCandidates.length, 0.8)).id
      : FALLBACK_ANGLE[theme];

    // Copy
    const offer = pick(rText, t.offers);
    const ctaText = pick(rText, t.ctaTexts);
    const ctx: FillCtx = { d: desc, t, rng: rText, year, month, offer, ctaText };
    const hookText = brandLed
      ? `${capFirst(desc.pr)}, made for ${desc.a}.`
      : fill(pick(rText, HOOK_TEMPLATES[hookStyle] ?? HOOK_TEMPLATES["curiosity-question"]), ctx).slice(0, 220);
    ctx.hook = hookText;
    const headline = brandLed ? `${titleCase(desc.pr)} by ${page.name}` : fill(pick(rText, t.headlines), ctx);
    const offerLine = hookStyle === "offer-led" ? null : `${capFirst(offer)}.`;
    const bodies = sample(rText, t.bodies, 2).map((b) => fill(b, ctx));
    let parts: (string | null)[];
    if (brandLed) parts = [hookText, `Designed in-house and made to last.`];
    else if (density < 0.22) parts = [hookText, ctaText];
    else if (density < 0.7) parts = [hookText, bodies[0], offerLine];
    else parts = [hookText, ...bodies, offerLine, ctaText];
    const primaryText = parts.filter(Boolean).join(" ");
    const ctaLabel = chance(rAds, brandLed ? 0.5 : 0.05) ? null : weightedKey(rAds, t.ctaLabels);

    // Beats (4–9, ordered framework elements)
    const skeleton = FRAMEWORK_BEATS[framework] ?? FRAMEWORK_BEATS.other;
    const target = int(rText, 4, 9);
    let keys = skeleton.slice();
    while (keys.length > target) keys.splice(int(rText, 1, keys.length - 2), 1);
    const extras: FrameworkElementKey[] = ["social_proof", "guarantee", "objection", "urgency", "disclaimer", "authority"];
    while (keys.length < target) {
      const options = extras.filter((e) => !keys.includes(e));
      if (!options.length) break;
      keys.splice(keys.length - 1, 0, pick(rText, options));
    }
    keys = keys.filter((k, i) => keys.indexOf(k) === i);
    let clock = 0;
    const beats: ScriptBeat[] = keys.map((key) => {
      const text = fill(pick(rText, BEAT_TEXT[key]), ctx);
      const dur = key === "hook" ? int(rText, 2, 4) : int(rText, 3, 9);
      const beat: ScriptBeat = {
        element: key,
        text,
        visual: mediaKind === "video" ? BEAT_VISUAL_VIDEO[key] : BEAT_VISUAL_IMAGE[key] ?? null,
        start: mediaKind === "video" ? clock : null,
        end: mediaKind === "video" ? clock + dur : null,
      };
      clock += dur;
      return beat;
    });
    const transcript = mediaKind === "video" ? beats.map((b) => b.text).join(" ") : null;

    const keywords = dedupe(
      [...desc.k, ...sample(rText, t.extraTags, int(rText, 1, 3))].map((k) => k.toLowerCase().trim()).filter((k) => k.length >= 2 && k.length <= 40),
    ).slice(0, int(rText, 4, 8));
    for (const filler of ["save money", "online offer", "new customers", "limited time"]) {
      if (keywords.length >= 4) break;
      if (!keywords.includes(filler)) keywords.push(filler);
    }

    const fwLabel = FRAMEWORKS.find((f) => f.id === framework)?.label ?? framework;
    const hookLabel = HOOK_STYLES.find((h) => h.id === hookStyle)?.label.toLowerCase() ?? hookStyle;
    const summary =
      `Opens with a ${hookLabel} hook aimed at ${desc.a}, then uses a ${fwLabel} structure to move from ${desc.p} to ${desc.pr}. ` +
      (brandLed
        ? "It sells on the product itself, with no explicit offer or deadline."
        : `It closes on “${offer}” with ${ctaLabel ? `a “${ctaLabel}” button` : "a spoken call to action"}.`);

    // Coverage: ~70% full, ~20% partial, ~10% minimal (keywords + CTA only).
    const cov = rAds();
    let analysis: AdAnalysis = {
      framework,
      frameworkConfidence: Math.round((0.55 + rAds() * 0.43) * 100) / 100,
      hookStyle,
      hookText,
      angle,
      angleText: truncateWords(`${capFirst(desc.o)} with ${desc.pr}`, 11),
      concept,
      frameworkElements: beats.map((b) => b.element),
      keywords,
      ctaText,
      summary,
      beats,
      transcript,
    };
    if (cov >= 0.9) {
      analysis = {
        framework: null, frameworkConfidence: null, hookStyle: null, hookText: null, angle: null, angleText: null,
        concept: null, frameworkElements: [], keywords, ctaText, summary: null, beats: null, transcript: null,
      };
    } else if (cov >= 0.7) {
      analysis.transcript = null;
      const holes = sample(rAds, ["framework", "beats", "hookStyle", "concept", "summary", "angle"], int(rAds, 1, 3));
      if (holes.includes("framework")) {
        analysis.framework = null;
        analysis.frameworkConfidence = null;
      }
      if (holes.includes("beats")) analysis.beats = null;
      if (holes.includes("hookStyle")) analysis.hookStyle = null;
      if (holes.includes("concept")) analysis.concept = null;
      if (holes.includes("summary")) analysis.summary = null;
      if (holes.includes("angle")) {
        analysis.angle = null;
        analysis.angleText = null;
      }
    }

    // Dates
    let firstSeenMs: number;
    if (lastHourSet.has(assignIdx)) firstSeenMs = now - int(rDates, 2, 55) * MINUTE;
    else if (recentSet.has(assignIdx)) firstSeenMs = now - int(rDates, 61, 47 * 60) * MINUTE;
    else firstSeenMs = now - (2.2 + 362 * Math.pow(rDates(), 1.7)) * DAY;
    const firstSeenAgoDays = (now - firstSeenMs) / DAY;

    let startedMs: number | null = null;
    if (!chance(rDates, 0.08)) {
      const lagRoll = rDates();
      const lag = lagRoll < 0.6 ? rDates() * 3 : lagRoll < 0.9 ? 3 + rDates() * 27 : 30 + rDates() * 90;
      startedMs = firstSeenMs - lag * DAY;
    }

    let lastSeenMs: number;
    if (firstSeenAgoDays < ACTIVE_WINDOW_DAYS) {
      lastSeenMs = Math.max(firstSeenMs, now - rDates() * Math.min(firstSeenAgoDays, 2) * DAY);
    } else {
      const pActive = firstSeenAgoDays < 60 ? 0.55 : firstSeenAgoDays < 180 ? 0.4 : 0.3;
      if (chance(rDates, pActive)) {
        const ago = rDates() < 0.8 ? rDates() * 3 : 3 + rDates() * (ACTIVE_WINDOW_DAYS - 4);
        lastSeenMs = now - ago * DAY;
      } else {
        const minAgo = ACTIVE_WINDOW_DAYS + 1;
        lastSeenMs = now - (minAgo + rDates() * Math.max(0, firstSeenAgoDays - minAgo)) * DAY;
      }
    }
    const status = now - lastSeenMs <= ACTIVE_WINDOW_DAYS * DAY ? "active" : "inactive";
    const daysLive = startedMs == null ? null : Math.max(0, Math.round((lastSeenMs - startedMs) / DAY));

    // Clones: long tail, longer runners copied more.
    let roll = rAds();
    if (daysLive != null && daysLive >= 60) roll = Math.pow(roll, 0.6);
    else if (daysLive != null && daysLive >= 21) roll = Math.pow(roll, 0.85);
    const clones = roll < 0.56 ? 0 : roll < 0.86 ? int(rAds, 1, 4) : roll < 0.97 ? int(rAds, 5, 9) : int(rAds, 10, 60);

    // Countries (~12% missing on purpose)
    const countries = chance(rExtra, 0.12) ? [] : pickCountries(rExtra, t.countries, int(rExtra, 1, 3));

    // Engagement (~20% reported)
    const engagement: Engagement = chance(rExtra, 0.2)
      ? {
          likes: Math.round(logNormal(rExtra, 420, 1.3)),
          comments: Math.round(logNormal(rExtra, 38, 1.2)),
          shares: chance(rExtra, 0.85) ? Math.round(logNormal(rExtra, 18, 1.4)) : null,
        }
      : { likes: null, comments: null, shares: null };

    const aiScore = scoreAd({
      daysLive,
      likes: engagement.likes,
      comments: engagement.comments,
      shares: engagement.shares,
      clones,
      mediaKind,
      hasVideo: !!videoUrl,
      headline,
      primaryText,
      transcript: analysis.transcript,
      ctaLabel,
      frameworkElements: analysis.frameworkElements,
      hookText: analysis.hookText,
      landing: lp
        ? {
            url: lp.url,
            domain: lp.domain,
            finalUrl: lp.finalUrl,
            offerDomain: lp.offerDomain,
            offerUrl: lp.offerUrl,
            redirectHops: lp.redirectPath.length,
            pageText: lp.pageText,
          }
        : null,
    });

    ads.push({
      id,
      externalId: digits(rExtra, 16),
      pageAdvertiserId: page.id,
      domainAdvertiserId: domain ? domain.id : null,
      pageName: page.name,
      pageDisplayId: page.displayId,
      pageAvatarUrl: page.avatar,
      industryId: industry,
      categoryId,
      mediaKind,
      thumbnailUrl: thumbnail,
      videoUrl,
      aspectRatio,
      headline,
      primaryText,
      ctaLabel,
      platforms: pickPlatforms(rExtra, t.platforms, mediaKind),
      languages: languagesFor(rExtra, countries),
      startedAt: startedMs == null ? null : iso(startedMs),
      firstSeenAt: iso(firstSeenMs),
      lastSeenAt: iso(lastSeenMs),
      daysLive,
      status,
      clones,
      similarAdIds: [],
      countries,
      engagement,
      aiScore,
      analysis,
      landingPageId: lp ? lp.id : null,
      delivery: deliveryStats(rExtra, countries),
      demographics: demographicsFor(rExtra, theme),
      locations: locationsFor(rExtra, countries),
      transparencyRegions: chance(rExtra, 0.5) ? [] : sample(rExtra, TRANSPARENCY_REGION_POOL, int(rExtra, 1, 2)),
      lastSyncedAt: chance(rExtra, 0.1) ? null : iso(now - int(rExtra, 5, 72 * 60) * MINUTE),
    });
  });

  const usedDomainIds = new Set(ads.map((a) => a.domainAdvertiserId).filter(Boolean) as string[]);

  /* 6. Similar ads (same angle, then same concept) ───────────────────── */

  const byAngle = groupBy(ads, (a) => a.analysis.angle);
  const byConcept = groupBy(ads, (a) => a.analysis.concept);
  const rSim = childRng(seed, "similar");
  for (const ad of ads) {
    const pool = (ad.analysis.angle ? byAngle.get(ad.analysis.angle) : ad.analysis.concept ? byConcept.get(ad.analysis.concept) : undefined) ?? [];
    const candidates = pool.filter((o) => o.id !== ad.id);
    if (!candidates.length) continue;
    const sameConcept = candidates.filter((o) => o.analysis.concept && o.analysis.concept === ad.analysis.concept);
    const want = ad.clones > 0 ? int(rSim, 2, 6) : int(rSim, 0, 3);
    const ordered = [...shuffle(rSim, sameConcept), ...shuffle(rSim, candidates.filter((o) => !sameConcept.includes(o)))];
    ad.similarAdIds = ordered.slice(0, want).map((o) => o.id);
  }

  /* 7. Advertisers + LP dates from their ads ─────────────────────────── */

  const minFirstSeen = (list: Ad[] | undefined): string | null => {
    if (!list || !list.length) return null;
    let min = list[0].firstSeenAt;
    for (const a of list) if (a.firstSeenAt < min) min = a.firstSeenAt;
    return min;
  };
  const adsByPage = groupBy(ads, (a) => a.pageAdvertiserId);
  const adsByDomainFinal = groupBy(ads, (a) => a.domainAdvertiserId);

  const advertisers: Advertiser[] = [];
  for (const p of pages) {
    const first = minFirstSeen(adsByPage.get(p.id));
    if (!first) continue;
    advertisers.push({ id: p.id, kind: "page", name: p.name, avatarUrl: p.avatar, firstSeenAt: first });
  }
  for (const d of domains) {
    if (!usedDomainIds.has(d.id)) continue;
    const first = minFirstSeen(adsByDomainFinal.get(d.id));
    if (!first) continue;
    advertisers.push({ id: d.id, kind: "domain", name: d.name, avatarUrl: d.avatar, firstSeenAt: first });
  }

  const adsByLpFinal = groupBy(ads, (a) => a.landingPageId);
  const rCap = childRng(seed, "captured");
  const finalLps = landingPages;
  for (const l of finalLps) {
    const first = minFirstSeen(adsByLpFinal.get(l.id)) as string;
    l.firstSeenAt = first;
    const firstMs = Date.parse(first);
    l.capturedAt = l.pageText == null && l.screenshotUrl == null ? null : iso(Math.min(now, firstMs + rCap() * 2 * DAY));
  }

  return {
    seed,
    now,
    generatedAt: iso(now),
    industries: INDUSTRIES,
    categories: CATEGORIES,
    industryCategories: INDUSTRY_CATEGORIES,
    elements: ELEMENTS_BY_TYPE,
    frameworkElements: FRAMEWORK_ELEMENTS,
    advertisers,
    landingPages: finalLps,
    ads,
  };
}

/* ── generator helpers ──────────────────────────────────────────────────── */

const FALLBACK_ANGLE: Record<ThemeId, string> = {
  insurance: "compare-quotes-in-minutes",
  home: "local-pros-at-fair-prices",
  finance: "lower-your-monthly-payments",
  legal: "compensation-for-injury-victims",
  benefits: "win-a-gift-card-today",
  career: "earn-from-home-online",
  nutra: "doctor-formulated-daily-support",
  telehealth: "at-home-lab-testing",
  ecom: "viral-gadget-everyone-wants",
  arb: "compare-current-offers",
  lifestyle: "play-free-and-win-prizes",
};

/** Integer split of `total` by weights, each ≥ `min`. */
function allocate(total: number, weights: number[], min: number): number[] {
  const sum = weights.reduce((s, w) => s + w, 0);
  const raw = weights.map((w) => Math.max(min, (w / sum) * total));
  const out = raw.map((r) => Math.floor(r));
  let rest = total - out.reduce((s, n) => s + n, 0);
  const order = raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0]);
  for (let k = 0; rest > 0 && k < order.length * 4; k++) {
    out[order[k % order.length][1]]++;
    rest--;
  }
  return out;
}

function groupBy<K>(ads: Ad[], key: (a: Ad) => K | null | undefined): Map<K, Ad[]> {
  const m = new Map<K, Ad[]>();
  for (const a of ads) {
    const k = key(a);
    if (k == null) continue;
    const list = m.get(k);
    if (list) list.push(a);
    else m.set(k, [a]);
  }
  return m;
}

function dedupe(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of list) {
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}

function pickCountries(rng: Rng, table: Record<string, number>, n: number): string[] {
  const out: string[] = [];
  let guard = 0;
  while (out.length < n && guard++ < 20) {
    const c = weightedKey(rng, table);
    if (!out.includes(c) && COUNTRY_NAME[c]) out.push(c);
  }
  // US first when present (reference §4.3 ordering).
  out.sort((a, b) => (a === "US" ? -1 : b === "US" ? 1 : 0));
  return out;
}

function pickPlatforms(rng: Rng, table: Partial<Record<Platform, number>>, kind: MediaKind): Platform[] {
  const out: Platform[] = [];
  const n = weighted(rng, [1, 2, 3], [60, 30, 10]);
  let guard = 0;
  while (out.length < n && guard++ < 20) {
    const p = weightedKey(rng, table as Record<Platform, number>);
    if (kind !== "video" && (p === "YouTube" || p === "TikTok") && out.length > 0) continue;
    if (!out.includes(p)) out.push(p);
  }
  return out.length ? out : ["Facebook & Instagram"];
}

function languagesFor(rng: Rng, countries: string[]): string[] {
  const langs = ["English"];
  if (countries.includes("DE") || countries.includes("AT") || countries.includes("CH")) langs.push("German");
  if (countries.includes("FR") || countries.includes("BE")) langs.push("French");
  if (countries.includes("MX") || countries.includes("ES") || (countries.includes("US") && chance(rng, 0.1))) langs.push("Spanish");
  if (countries.includes("AE") || countries.includes("SA")) langs.push("Arabic");
  return langs;
}

function compactNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

function deliveryStats(rng: Rng, countries: string[]): AdDeliveryStats {
  const impressions = Math.round(logNormal(rng, 85_000, 1.1));
  const reach = Math.round(impressions * (0.55 + rng() * 0.3));
  const audLow = int(rng, 1, 40) * 100_000;
  const hasEu = countries.some((c) => ["DE", "FR", "ES", "IT", "NL", "SE", "NO", "DK", "AT", "BE", "PL", "PT", "IE"].includes(c));
  return {
    spendTillNow: chance(rng, 0.3) ? null : `$${Math.round(logNormal(rng, 6_500, 1.1)).toLocaleString("en-US")}`,
    estAudienceSize: chance(rng, 0.15) ? null : `${compactNum(audLow)} - ${compactNum(audLow * int(rng, 2, 5))}`,
    impressions: chance(rng, 0.1) ? null : compactNum(impressions),
    totalReach: chance(rng, 0.1) ? null : compactNum(reach),
    brReach: chance(rng, 0.45) ? null : `${(reach / 1000 * (0.01 + rng() * 0.05)).toFixed(1)}k (${int(rng, 40, 80)}%)`,
    euReach: hasEu ? `${(reach / 1000 * (0.05 + rng() * 0.2)).toFixed(1)}k (${int(rng, 30, 70)}%)` : chance(rng, 0.7) ? null : `${(reach / 1000 * 0.02).toFixed(1)}k (${int(rng, 5, 20)}%)`,
  };
}

const AGE_GROUPS = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
const SENIOR_THEMES: ThemeId[] = ["nutra", "benefits", "insurance", "arb"];

function demographicsFor(rng: Rng, theme: ThemeId): AdDemographic[] {
  if (chance(rng, 0.15)) return [];
  const older = SENIOR_THEMES.includes(theme);
  const base = older ? [2, 6, 12, 22, 30, 28] : [18, 30, 24, 14, 9, 5];
  const weights = base.map((b) => b * (0.7 + rng() * 0.6));
  const sum = weights.reduce((s, w) => s + w, 0);
  const pct = weights.map((w) => Math.round((w / sum) * 100));
  pct[pct.length - 1] += 100 - pct.reduce((s, p) => s + p, 0);
  const gender = weighted(rng, ["All", "Female", "Male"], [6, 3, 2]);
  return AGE_GROUPS.map((ageGroup, i) => ({ ageGroup, gender, percentage: Math.max(0, pct[i]) })).filter((d) => d.percentage > 0);
}

function locationsFor(rng: Rng, countries: string[]): AdLocation[] {
  const out: AdLocation[] = countries.map((c) => ({ name: COUNTRY_NAME[c], type: "Country", includeExclude: "include" as const }));
  if (countries.includes("US") && chance(rng, 0.3)) {
    out.push({ name: pick(rng, STATES)[1], type: "Region", includeExclude: "include" });
  }
  if (countries.includes("US") && chance(rng, 0.15)) {
    out.push({ name: pick(rng, ["Alaska", "Hawaii", "Puerto Rico"]), type: "Region", includeExclude: "exclude" });
  }
  return out;
}
