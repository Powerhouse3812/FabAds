/**
 * Top-10 tag groups + the union filter (non-negotiable #3).
 *
 * - Counts are computed on the scoped ads and NEVER depend on what is selected.
 * - Closed vocabularies (frameworks, concepts, hook styles, framework elements,
 *   funnel types, categories) list 0-count options too; the UI disables them.
 * - Union: an ad passes when it matches ANY selected tag in ANY group. Each ad
 *   is counted once. No selection = all ads.
 */
import { ALL, FUNNEL_TYPE_LABEL } from "../types";
import type { Ad, ElementType, Scope, SelectedTags, TagGroupKey, TagOption, TopTenGroup } from "../types";
import { COUNTRY_NAME, FRAMEWORK_ELEMENTS, FUNNEL_TYPES, INDEX, slugify } from "../data";
import type { DataIndex } from "../data";

export const TAG_GROUP_LABEL: Record<TagGroupKey, string> = {
  hookStyle: "Hook style",
  angle: "Angle",
  framework: "Framework",
  frameworkElement: "Framework element",
  concept: "Concept",
  keyword: "Keyword / topic",
  cta: "CTA",
  advertiser: "Competitor / domain",
  landingPage: "Landing pages",
  country: "Country",
  category: "Category",
  funnelType: "Funnel type",
  offerDomain: "Offer domain",
};

/** Discover + My Feeds groups, in spec order. */
export const DISCOVER_GROUP_KEYS: TagGroupKey[] = [
  "hookStyle", "angle", "framework", "frameworkElement", "concept", "keyword", "cta", "advertiser", "landingPage", "country", "category",
];
/** Advertiser › Domain / Page tabs. */
export const ADVERTISER_GROUP_KEYS: TagGroupKey[] = ["hookStyle", "angle", "framework", "concept", "cta", "country", "category"];
/** Advertiser › LP & Offers tab. */
export const LANDING_PAGE_GROUP_KEYS: TagGroupKey[] = ["funnelType", "offerDomain", "hookStyle", "framework", "concept", "country", "cta"];

/** The tag group that IS each element tab (so that tab drops it). */
export const ELEMENT_GROUP_KEY: Record<ElementType, TagGroupKey> = {
  framework: "framework",
  hook: "hookStyle",
  angle: "angle",
  concept: "concept",
};

/** Creative Element Insights tab groups = Discover's minus the tab's own element. */
export function elementGroupKeys(type: ElementType): TagGroupKey[] {
  return DISCOVER_GROUP_KEYS.filter((k) => k !== ELEMENT_GROUP_KEY[type]);
}

/** Category group shows only when no category is picked in the scope bar. */
export function groupKeysForScope(keys: TagGroupKey[], scope: Scope): TagGroupKey[] {
  return scope.category === ALL ? keys : keys.filter((k) => k !== "category");
}

/* ── per-ad tag ids ─────────────────────────────────────────────────────── */

type AdTags = Partial<Record<TagGroupKey, string[]>>;
const tagCache = new WeakMap<DataIndex, WeakMap<Ad, AdTags>>();

function computeTags(ad: Ad, data: DataIndex): AdTags {
  const a = ad.analysis;
  const lp = ad.landingPageId ? data.landingPageById.get(ad.landingPageId) : undefined;
  const one = (v: string | null | undefined) => (v ? [v] : []);
  return {
    hookStyle: one(a.hookStyle),
    angle: one(a.angle),
    framework: one(a.framework),
    frameworkElement: Array.from(new Set(a.frameworkElements)),
    concept: one(a.concept),
    keyword: Array.from(new Set(a.keywords.map(slugify))),
    cta: one(ad.ctaLabel ? slugify(ad.ctaLabel) : null),
    advertiser: one(ad.domainAdvertiserId),
    landingPage: one(ad.landingPageId),
    country: ad.countries.slice(),
    category: [ad.categoryId],
    funnelType: one(lp?.funnelType ?? null),
    offerDomain: one(lp?.offerDomain ?? null),
  };
}

/** Tag ids an ad carries in one group. */
export function adTagIds(ad: Ad, key: TagGroupKey, data: DataIndex = INDEX): string[] {
  let perData = tagCache.get(data);
  if (!perData) {
    perData = new WeakMap();
    tagCache.set(data, perData);
  }
  let tags = perData.get(ad);
  if (!tags) {
    tags = computeTags(ad, data);
    perData.set(ad, tags);
  }
  return tags[key] ?? [];
}

/* ── labels ─────────────────────────────────────────────────────────────── */

const keywordLabelCache = new WeakMap<DataIndex, Map<string, string>>();

/** Keyword tag id (slug) → the keyword as written ("glp-1", "nad+"). */
function keywordLabel(id: string, data: DataIndex): string {
  let m = keywordLabelCache.get(data);
  if (!m) {
    m = new Map();
    for (const ad of data.ads) for (const k of ad.analysis.keywords) if (!m.has(slugify(k))) m.set(slugify(k), k);
    keywordLabelCache.set(data, m);
  }
  return m.get(id) ?? id.replace(/-/g, " ");
}

function lpLabel(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\?.*$/, "");
}

/** Display label for one tag id. Falls back to the id. */
export function tagLabel(key: TagGroupKey, rawId: string, data: DataIndex = INDEX): string {
  const id = normalizeTagId(key, rawId, data) ?? rawId;
  switch (key) {
    case "hookStyle": return data.elementById.hook.get(id)?.label ?? id;
    case "angle": return data.elementById.angle.get(id)?.label ?? id;
    case "framework": return data.elementById.framework.get(id)?.label ?? id;
    case "concept": return data.elementById.concept.get(id)?.label ?? id;
    case "frameworkElement": return data.frameworkElementByKey.get(id as never)?.label ?? id;
    case "keyword": return keywordLabel(id, data);
    case "cta": return id.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    case "advertiser": return data.advertiserById.get(id)?.name ?? id;
    case "landingPage": {
      const lp = data.landingPageById.get(id);
      return lp ? lpLabel(lp.url) : id;
    }
    case "country": return COUNTRY_NAME[id] ?? id;
    case "category": return data.categoryById.get(id)?.label ?? id;
    case "funnelType": return FUNNEL_TYPE_LABEL[id as keyof typeof FUNNEL_TYPE_LABEL] ?? id;
    case "offerDomain": return id;
    default: return id;
  }
}

/** Closed vocabularies: every option listed, 0-count included. */
function closedVocabulary(key: TagGroupKey, data: DataIndex): { id: string; label: string }[] | null {
  switch (key) {
    case "framework": return data.universe.elements.framework.map((e) => ({ id: e.id, label: e.label }));
    case "concept": return data.universe.elements.concept.map((e) => ({ id: e.id, label: e.label }));
    case "hookStyle": return data.universe.elements.hook.map((e) => ({ id: e.id, label: e.label }));
    case "frameworkElement": return FRAMEWORK_ELEMENTS.map((e) => ({ id: e.key, label: e.label }));
    case "funnelType": return FUNNEL_TYPES.map((f) => ({ id: f, label: FUNNEL_TYPE_LABEL[f] }));
    case "category": return data.universe.categories.map((c) => ({ id: c.id, label: c.label }));
    default: return null;
  }
}

/* ── groups ─────────────────────────────────────────────────────────────── */

function sortOptions(options: TagOption[]): TagOption[] {
  return options.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label) || (a.id < b.id ? -1 : 1));
}

/** Full option lists (count desc) for each requested group, counted on `scopedAds`. */
export function tagGroups(scopedAds: Ad[], keys: TagGroupKey[], data: DataIndex = INDEX): TopTenGroup[] {
  const counts = keys.map(() => new Map<string, number>());
  const missing = keys.map(() => 0);
  for (const ad of scopedAds) {
    for (let k = 0; k < keys.length; k++) {
      const ids = adTagIds(ad, keys[k], data);
      if (ids.length === 0) missing[k]++;
      const m = counts[k];
      for (const id of ids) m.set(id, (m.get(id) ?? 0) + 1);
    }
  }
  return keys.map((key, k) => {
    const m = counts[k];
    const vocab = closedVocabulary(key, data);
    let options: TagOption[];
    if (vocab) {
      options = vocab.map((v) => ({ id: v.id, label: v.label, count: m.get(v.id) ?? 0 }));
      for (const [id, count] of m) if (!vocab.some((v) => v.id === id)) options.push({ id, label: tagLabel(key, id, data), count });
    } else {
      options = Array.from(m, ([id, count]) => ({ id, label: tagLabel(key, id, data), count }));
    }
    // `missing` = scoped ads with no value in this group (e.g. no country), so the UI can say why counts don't add up.
    return { key, label: TAG_GROUP_LABEL[key], options: sortOptions(options), missing: missing[k] };
  });
}

/* ── union filter ───────────────────────────────────────────────────────── */

/* ── validating selected ids (hand-edited URLs) ─────────────────────────── */

const validIdCache = new WeakMap<DataIndex, Partial<Record<TagGroupKey, Set<string>>>>();

/** Every id that can exist in a group for this data (independent of scope). */
function validIds(key: TagGroupKey, data: DataIndex): Set<string> {
  let perData = validIdCache.get(data);
  if (!perData) {
    perData = {};
    validIdCache.set(data, perData);
  }
  const cached = perData[key];
  if (cached) return cached;
  let ids: string[];
  const vocab = closedVocabulary(key, data);
  if (vocab) ids = vocab.map((v) => v.id);
  else {
    switch (key) {
      case "angle": ids = data.universe.elements.angle.map((e) => e.id); break;
      case "country": ids = Object.keys(COUNTRY_NAME); break;
      case "advertiser": ids = data.advertisers.filter((a) => a.kind === "domain").map((a) => a.id); break;
      case "landingPage": ids = data.landingPages.map((l) => l.id); break;
      case "offerDomain": ids = data.offers.map((o) => o.id); break;
      default: {
        const found = new Set<string>();
        for (const ad of data.ads) for (const id of adTagIds(ad, key, data)) found.add(id);
        ids = Array.from(found);
      }
    }
  }
  const set = new Set(ids);
  perData[key] = set;
  return set;
}

/**
 * Canonical id for a (possibly hand-edited) tag id, or null when it isn't a
 * valid option. Country ISO-2 is case-insensitive ("fr" → "FR"); every other
 * group's ids are lowercase slugs / ids, so they are lower-cased.
 */
export function normalizeTagId(key: TagGroupKey, id: string, data: DataIndex = INDEX): string | null {
  if (typeof id !== "string") return null;
  const trimmed = id.trim();
  if (!trimmed) return null;
  const valid = validIds(key, data);
  if (valid.has(trimmed)) return trimmed;
  const cased = key === "country" ? trimmed.toUpperCase() : trimmed.toLowerCase();
  return valid.has(cased) ? cased : null;
}

/**
 * Drop unknown groups / ids and normalise case. Pass `groups` (the page's
 * TopTenGroup list, or its group keys) to also keep only the groups on the
 * page; with TopTenGroup[] an id must also exist as an option there.
 */
export function sanitizeSelectedTags(
  selected: SelectedTags | undefined,
  groups?: TopTenGroup[] | TagGroupKey[],
  data: DataIndex = INDEX,
): SelectedTags {
  const out: SelectedTags = {};
  if (!selected) return out;
  const groupList = groups as (TopTenGroup | TagGroupKey)[] | undefined;
  const allowedKeys = groupList ? new Set(groupList.map((g) => (typeof g === "string" ? g : g.key))) : null;
  const optionIds = new Map<TagGroupKey, Set<string>>();
  if (groupList) for (const g of groupList) if (typeof g !== "string") optionIds.set(g.key, new Set(g.options.map((o) => o.id)));
  for (const key of Object.keys(selected) as TagGroupKey[]) {
    if (!(key in TAG_GROUP_LABEL)) continue;
    if (allowedKeys && !allowedKeys.has(key)) continue;
    const ids = selected[key];
    if (!Array.isArray(ids)) continue;
    const kept: string[] = [];
    for (const raw of ids) {
      const id = normalizeTagId(key, raw, data);
      if (!id || kept.includes(id)) continue;
      const opts = optionIds.get(key);
      if (opts && !opts.has(id)) continue;
      kept.push(id);
    }
    if (kept.length) out[key] = kept;
  }
  return out;
}

/** Valid, non-empty groups only (invalid ids ignored). Null when nothing valid is selected. */
function activeSelection(selected: SelectedTags | undefined, data: DataIndex): [TagGroupKey, Set<string>][] | null {
  const clean = sanitizeSelectedTags(selected, undefined, data);
  const out: [TagGroupKey, Set<string>][] = [];
  for (const key of Object.keys(clean) as TagGroupKey[]) out.push([key, new Set(clean[key])]);
  return out.length ? out : null;
}

export function hasSelection(selected: SelectedTags | undefined, data: DataIndex = INDEX): boolean {
  return activeSelection(selected, data) != null;
}

export function countSelected(selected: SelectedTags | undefined, data: DataIndex = INDEX): number {
  return (activeSelection(selected, data) ?? []).reduce((s, [, ids]) => s + ids.size, 0);
}

export function adMatchesTags(ad: Ad, selected: SelectedTags | undefined, data: DataIndex = INDEX): boolean {
  const sel = activeSelection(selected, data);
  if (!sel) return true;
  return matchSel(ad, sel, data);
}

function matchSel(ad: Ad, sel: [TagGroupKey, Set<string>][], data: DataIndex): boolean {
  for (const [key, ids] of sel) {
    for (const id of adTagIds(ad, key, data)) if (ids.has(id)) return true;
  }
  return false;
}

/** Ads matching ANY selected tag in ANY group. No selection → the same array back. */
export function filterByTagUnion(ads: Ad[], selected: SelectedTags | undefined, data: DataIndex = INDEX): Ad[] {
  const sel = activeSelection(selected, data);
  if (!sel) return ads;
  return ads.filter((ad) => matchSel(ad, sel, data));
}

/** The combined total under the chips (each ad once). */
export function unionTotal(ads: Ad[], selected: SelectedTags | undefined, data: DataIndex = INDEX): number {
  return filterByTagUnion(ads, selected, data).length;
}

export function matchingAdIds(ads: Ad[], selected: SelectedTags | undefined, data: DataIndex = INDEX): Set<string> {
  return new Set(filterByTagUnion(ads, selected, data).map((a) => a.id));
}

/**
 * Same union applied to a list (advertisers, landing pages, elements): an item
 * stays when at least one of its ads matches. `adsOf` returns the item's ads
 * in the current scope.
 */
export function filterListByTagUnion<T>(
  items: T[],
  adsOf: (item: T) => Ad[],
  selected: SelectedTags | undefined,
  data: DataIndex = INDEX,
): T[] {
  const sel = activeSelection(selected, data);
  if (!sel) return items;
  return items.filter((item) => adsOf(item).some((ad) => matchSel(ad, sel, data)));
}

export interface SelectedChip {
  key: TagGroupKey;
  groupLabel: string;
  id: string;
  label: string;
}

/** Chips for the selected-tags row, in group order then selection order. */
export function selectedChips(selected: SelectedTags | undefined, data: DataIndex = INDEX): SelectedChip[] {
  const sel = activeSelection(selected, data);
  if (!sel) return [];
  const out: SelectedChip[] = [];
  for (const [key, ids] of sel) {
    for (const id of ids) out.push({ key, groupLabel: TAG_GROUP_LABEL[key], id, label: tagLabel(key, id, data) });
  }
  return out;
}
