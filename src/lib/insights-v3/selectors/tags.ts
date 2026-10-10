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
  advertiser: "Advertiser / domain",
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
export function tagLabel(key: TagGroupKey, id: string, data: DataIndex = INDEX): string {
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
  for (const ad of scopedAds) {
    for (let k = 0; k < keys.length; k++) {
      const ids = adTagIds(ad, keys[k], data);
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
    return { key, label: TAG_GROUP_LABEL[key], options: sortOptions(options) };
  });
}

/* ── union filter ───────────────────────────────────────────────────────── */

/** Drop empty groups. Returns null when nothing is selected. */
function activeSelection(selected: SelectedTags | undefined): [TagGroupKey, Set<string>][] | null {
  if (!selected) return null;
  const out: [TagGroupKey, Set<string>][] = [];
  for (const key of Object.keys(selected) as TagGroupKey[]) {
    const ids = selected[key];
    if (ids && ids.length) out.push([key, new Set(ids)]);
  }
  return out.length ? out : null;
}

export function hasSelection(selected: SelectedTags | undefined): boolean {
  return activeSelection(selected) != null;
}

export function countSelected(selected: SelectedTags | undefined): number {
  return (activeSelection(selected) ?? []).reduce((s, [, ids]) => s + ids.size, 0);
}

export function adMatchesTags(ad: Ad, selected: SelectedTags | undefined, data: DataIndex = INDEX): boolean {
  const sel = activeSelection(selected);
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
  const sel = activeSelection(selected);
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
  const sel = activeSelection(selected);
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
  const sel = activeSelection(selected);
  if (!sel) return [];
  const out: SelectedChip[] = [];
  for (const [key, ids] of sel) {
    for (const id of ids) out.push({ key, groupLabel: TAG_GROUP_LABEL[key], id, label: tagLabel(key, id, data) });
  }
  return out;
}
