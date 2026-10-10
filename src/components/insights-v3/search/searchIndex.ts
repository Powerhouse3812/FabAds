/**
 * Industry Insights V2 search — pure matching over the V2 universe.
 *
 * Scopes follow the V2 menu: My Feeds · Discover (ads) · Advertisers (domains
 * + pages) · Creative elements (frameworks/hooks/angles/concepts) · Landing
 * pages & offers · Boards. Every count is "matches for this query in the
 * current scope bar scope" — boards are the one exception (a board isn't
 * scoped by industry/category/period), and the UI says so.
 */
import type { Ad, Board, DetailTarget, ElementType, Scope } from "@/lib/insights-v3/types";
import { FUNNEL_TYPE_LABEL, SAVABLE_LABEL } from "@/lib/insights-v3/types";
import { ELEMENT_TYPE_LABEL, INDEX, MODULE_NOW, type DataIndex } from "@/lib/insights-v3/data";
import { adsInScope, type UserPrefs } from "@/lib/insights-v3/selectors";

export type SearchScopeKey = "feeds" | "discover" | "advertisers" | "elements" | "lp-offers" | "boards";

export const SEARCH_SCOPE_LABEL: Record<SearchScopeKey, string> = {
  feeds: "My Feeds",
  discover: "Discover",
  advertisers: "Advertisers",
  elements: "Creative elements",
  "lp-offers": "Landing pages & offers",
  boards: "Boards",
};

export const SEARCH_SCOPE_ORDER: SearchScopeKey[] = ["feeds", "discover", "advertisers", "elements", "lp-offers", "boards"];

export const RESULTS_PER_SCOPE = 5;

/** What picking a result opens. */
export type SearchOpen = { kind: "ad"; id: string } | { kind: "detail"; target: DetailTarget } | { kind: "board"; id: string };

export interface SearchResult {
  key: string;
  title: string;
  /** Type label shown as a chip ("Ad", "Hook", "Domain"…). */
  typeLabel: string;
  meta: string;
  thumbnail: string | null;
  open: SearchOpen;
}

export interface ScopeResults {
  key: SearchScopeKey;
  count: number;
  results: SearchResult[];
}

export interface SearchOutput {
  query: string;
  scopes: ScopeResults[];
  total: number;
}

const norm = (s: string) => s.toLowerCase().trim();

const adText = new WeakMap<Ad, string>();
function adHaystack(ad: Ad): string {
  let s = adText.get(ad);
  if (s == null) {
    s = [
      ad.headline,
      ad.primaryText,
      ad.pageName,
      ad.ctaLabel ?? "",
      ad.analysis.hookText ?? "",
      ad.analysis.angleText ?? "",
      ad.analysis.keywords.join(" "),
    ]
      .join(" \u0001 ")
      .toLowerCase();
    adText.set(ad, s);
  }
  return s;
}

/** Headline / page-name hits first, then newest first. */
function rankAds(ads: Ad[], q: string): Ad[] {
  const strong = (a: Ad) => (a.headline.toLowerCase().includes(q) || a.pageName.toLowerCase().includes(q) ? 1 : 0);
  return [...ads].sort((a, b) => strong(b) - strong(a) || b.firstSeenAt.localeCompare(a.firstSeenAt) || a.id.localeCompare(b.id));
}

function adResult(ad: Ad, prefix: string): SearchResult {
  return {
    key: `${prefix}:ad:${ad.id}`,
    title: ad.headline,
    typeLabel: SAVABLE_LABEL.ad,
    meta: ad.pageName,
    thumbnail: ad.thumbnailUrl,
    open: { kind: "ad", id: ad.id },
  };
}

function countBy<T>(items: T[], keyOf: (t: T) => string | null | undefined): Map<string, number> {
  const m = new Map<string, number>();
  for (const it of items) {
    const k = keyOf(it);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

const ELEMENT_TYPES: ElementType[] = ["framework", "hook", "angle", "concept"];
const elementOf = (a: Ad, t: ElementType) =>
  t === "framework" ? a.analysis.framework : t === "hook" ? a.analysis.hookStyle : t === "angle" ? a.analysis.angle : a.analysis.concept;

export interface SearchOptions {
  scope: Scope;
  prefs?: UserPrefs;
  /** My Feeds source ads (before scope). */
  feedAds: Ad[];
  boards: Board[];
  now?: number;
  data?: DataIndex;
  limit?: number;
}

export function searchInsights(rawQuery: string, opts: SearchOptions): SearchOutput {
  const q = norm(rawQuery);
  const data = opts.data ?? INDEX;
  const limit = opts.limit ?? RESULTS_PER_SCOPE;
  const now = opts.now ?? MODULE_NOW;
  if (!q) return { query: "", scopes: SEARCH_SCOPE_ORDER.map((key) => ({ key, count: 0, results: [] })), total: 0 };

  const scoped = adsInScope(data.ads, opts.scope, { now, prefs: opts.prefs });

  // My Feeds + Discover — ads.
  const feedScoped = adsInScope(opts.feedAds, { ...opts.scope, myPrefsOnly: false }, { now });
  const feedHits = rankAds(feedScoped.filter((a) => adHaystack(a).includes(q)), q);
  const adHits = rankAds(scoped.filter((a) => adHaystack(a).includes(q)), q);

  // Advertisers — pages + domains that run ads in scope.
  const pageCounts = countBy(scoped, (a) => a.pageAdvertiserId);
  const domainCounts = countBy(scoped, (a) => a.domainAdvertiserId);
  const advHits = [...pageCounts.entries(), ...domainCounts.entries()]
    .map(([id, n]) => ({ adv: data.advertiserById.get(id), n }))
    .filter((x): x is { adv: NonNullable<typeof x.adv>; n: number } => !!x.adv && x.adv.name.toLowerCase().includes(q))
    .sort((a, b) => b.n - a.n || a.adv.name.localeCompare(b.adv.name));

  // Creative elements — any of the four types used by ads in scope.
  const elHits: { type: ElementType; id: string; label: string; n: number }[] = [];
  for (const t of ELEMENT_TYPES) {
    for (const [id, n] of countBy(scoped, (a) => elementOf(a, t))) {
      const el = data.elementById[t].get(id);
      if (el && el.label.toLowerCase().includes(q)) elHits.push({ type: t, id, label: el.label, n });
    }
  }
  elHits.sort((a, b) => b.n - a.n || a.label.localeCompare(b.label));

  // Landing pages & offers reached by ads in scope.
  const lpCounts = countBy(scoped, (a) => a.landingPageId);
  const offerCounts = new Map<string, number>();
  const lpHits: SearchResult[] = [];
  const lpRanked = [...lpCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  for (const [id, n] of lpRanked) {
    const lp = data.landingPageById.get(id);
    if (!lp) continue;
    if (lp.offerDomain) offerCounts.set(lp.offerDomain, (offerCounts.get(lp.offerDomain) ?? 0) + n);
    const hay = `${lp.url} ${lp.domain} ${lp.title ?? ""}`.toLowerCase();
    if (!hay.includes(q)) continue;
    lpHits.push({
      key: `lp:${lp.id}`,
      title: lp.title ?? lp.url.replace(/^https?:\/\//, ""),
      typeLabel: SAVABLE_LABEL["landing-page"],
      meta: `${lp.domain}${lp.funnelType ? ` · ${FUNNEL_TYPE_LABEL[lp.funnelType]}` : ""} · ${n} ad${n === 1 ? "" : "s"}`,
      thumbnail: lp.screenshotUrl,
      open: { kind: "detail", target: { kind: "landing-page", id: lp.id } },
    });
  }
  const offerHits: SearchResult[] = [...offerCounts.entries()]
    .filter(([domain]) => domain.toLowerCase().includes(q))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([domain, n]) => ({
      key: `offer:${domain}`,
      title: domain,
      typeLabel: SAVABLE_LABEL.offer,
      meta: `${n} ad${n === 1 ? "" : "s"}`,
      thumbnail: null,
      open: { kind: "detail", target: { kind: "offer", id: domain } },
    }));
  // Interleave so both kinds surface in the top 5.
  const lpOfferHits: SearchResult[] = [];
  for (let i = 0; i < Math.max(lpHits.length, offerHits.length); i++) {
    if (lpHits[i]) lpOfferHits.push(lpHits[i]);
    if (offerHits[i]) lpOfferHits.push(offerHits[i]);
  }

  // Boards — by name, or by an item's title. Not scoped.
  const boardHits = opts.boards.filter(
    (b) => b.name.toLowerCase().includes(q) || b.items.some((i) => i.snapshot.title.toLowerCase().includes(q)),
  );

  const scopes: ScopeResults[] = [
    { key: "feeds", count: feedHits.length, results: feedHits.slice(0, limit).map((a) => adResult(a, "feeds")) },
    { key: "discover", count: adHits.length, results: adHits.slice(0, limit).map((a) => adResult(a, "discover")) },
    {
      key: "advertisers",
      count: advHits.length,
      results: advHits.slice(0, limit).map(({ adv, n }) => ({
        key: `adv:${adv.kind}:${adv.id}`,
        title: adv.name,
        typeLabel: SAVABLE_LABEL[adv.kind],
        meta: `${n} ad${n === 1 ? "" : "s"} in scope`,
        thumbnail: adv.avatarUrl,
        open: { kind: "detail", target: { kind: "advertiser", advertiserKind: adv.kind, id: adv.id } },
      })),
    },
    {
      key: "elements",
      count: elHits.length,
      results: elHits.slice(0, limit).map((e) => ({
        key: `el:${e.type}:${e.id}`,
        title: e.label,
        typeLabel: ELEMENT_TYPE_LABEL[e.type],
        meta: `${e.n} ad${e.n === 1 ? "" : "s"} in scope`,
        thumbnail: null,
        open: { kind: "detail", target: { kind: "element", elementType: e.type, id: e.id } },
      })),
    },
    { key: "lp-offers", count: lpHits.length + offerHits.length, results: lpOfferHits.slice(0, limit) },
    {
      key: "boards",
      count: boardHits.length,
      results: boardHits.slice(0, limit).map((b) => ({
        key: `board:${b.id}`,
        title: b.name,
        typeLabel: "Board",
        meta: `${b.items.length} item${b.items.length === 1 ? "" : "s"}`,
        thumbnail: null,
        open: { kind: "board", id: b.id },
      })),
    },
  ];
  return { query: q, scopes, total: scopes.reduce((s, x) => s + x.count, 0) };
}
