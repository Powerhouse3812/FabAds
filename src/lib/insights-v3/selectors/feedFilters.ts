/**
 * My Feeds toolbar filters: Domain · Page · Status · Running days · Similar ads.
 * They behave like the text search: they narrow the SOURCE before scope and tags, so KPIs, groups and totals all follow.
 * Within one filter several picks mean "any of them" (OR); across filters they all have to hold (AND).
 * Option counts are computed on the ads BEFORE these filters, so a pick never makes its siblings vanish.
 */
import type { Ad } from "../types";
import { getAdvertiser } from "../data";

export type FeedStatus = "active" | "inactive";
export type FeedDaysBucket = "lt7" | "7-29" | "30-89" | "90plus" | "unknown";
export type FeedSimilarBucket = "0" | "1-2" | "3-5" | "6-9" | "10plus";

export interface FeedFilters {
  /** Domain advertiser ids, or `NO_DOMAIN` for ads with no landing domain. */
  domains: string[];
  /** Page advertiser ids. */
  pages: string[];
  status: FeedStatus[];
  days: FeedDaysBucket[];
  similar: FeedSimilarBucket[];
}

export const NO_DOMAIN = "none";
export const EMPTY_FEED_FILTERS: FeedFilters = { domains: [], pages: [], status: [], days: [], similar: [] };

/** URL params. Not `f_*`: that prefix belongs to the tag groups. */
export const FEED_FILTER_QP = {
  domains: "fdomain",
  pages: "fpage",
  status: "fstatus",
  days: "fdays",
  similar: "fsimilar",
} as const;

export const FEED_STATUS_LABEL: Record<FeedStatus, string> = { active: "Seen live", inactive: "Not seen recently" };
export const FEED_DAYS_BUCKETS: { id: FeedDaysBucket; label: string }[] = [
  { id: "lt7", label: "Under 7 days" },
  { id: "7-29", label: "7–29 days" },
  { id: "30-89", label: "30–89 days" },
  { id: "90plus", label: "90+ days" },
  { id: "unknown", label: "Start date unknown" },
];
export const FEED_SIMILAR_BUCKETS: { id: FeedSimilarBucket; label: string }[] = [
  { id: "0", label: "None (original only)" },
  { id: "1-2", label: "1–2 similar ads" },
  { id: "3-5", label: "3–5 similar ads" },
  { id: "6-9", label: "6–9 similar ads" },
  { id: "10plus", label: "10+ similar ads" },
];

const STATUS_IDS = Object.keys(FEED_STATUS_LABEL) as FeedStatus[];
const DAYS_IDS = FEED_DAYS_BUCKETS.map((b) => b.id);
const SIMILAR_IDS = FEED_SIMILAR_BUCKETS.map((b) => b.id);

export function daysBucket(ad: Ad): FeedDaysBucket {
  const d = ad.daysLive;
  if (d == null) return "unknown";
  if (d < 7) return "lt7";
  if (d < 30) return "7-29";
  if (d < 90) return "30-89";
  return "90plus";
}

export function similarBucket(ad: Ad): FeedSimilarBucket {
  const c = ad.clones;
  if (c <= 0) return "0";
  if (c <= 2) return "1-2";
  if (c <= 5) return "3-5";
  if (c <= 9) return "6-9";
  return "10plus";
}

function list(sp: URLSearchParams, key: string): string[] {
  const raw = sp.get(key);
  return raw ? Array.from(new Set(raw.split(",").map((v) => v.trim()).filter(Boolean))) : [];
}

/** Reads the filters from the URL. Unknown bucket ids are dropped (a hand-edited link must not filter to nothing). */
export function readFeedFilters(sp: URLSearchParams): FeedFilters {
  return {
    domains: list(sp, FEED_FILTER_QP.domains),
    pages: list(sp, FEED_FILTER_QP.pages),
    status: list(sp, FEED_FILTER_QP.status).filter((v): v is FeedStatus => (STATUS_IDS as string[]).includes(v)),
    days: list(sp, FEED_FILTER_QP.days).filter((v): v is FeedDaysBucket => (DAYS_IDS as string[]).includes(v)),
    similar: list(sp, FEED_FILTER_QP.similar).filter((v): v is FeedSimilarBucket => (SIMILAR_IDS as string[]).includes(v)),
  };
}

export function countFeedFilters(f: FeedFilters): number {
  return (f.domains.length ? 1 : 0) + (f.pages.length ? 1 : 0) + (f.status.length ? 1 : 0) + (f.days.length ? 1 : 0) + (f.similar.length ? 1 : 0);
}

export function hasFeedFilters(f: FeedFilters): boolean {
  return countFeedFilters(f) > 0;
}

/** AND across filters, OR within one. Returns the SAME array when nothing is active (keeps downstream memos stable). */
export function applyFeedFilters(ads: Ad[], f: FeedFilters): Ad[] {
  if (!hasFeedFilters(f)) return ads;
  const domains = new Set(f.domains);
  const pages = new Set(f.pages);
  const status = new Set<string>(f.status);
  const days = new Set<string>(f.days);
  const similar = new Set<string>(f.similar);
  return ads.filter(
    (a) =>
      (!domains.size || domains.has(a.domainAdvertiserId ?? NO_DOMAIN)) &&
      (!pages.size || pages.has(a.pageAdvertiserId)) &&
      (!status.size || status.has(a.status)) &&
      (!days.size || days.has(daysBucket(a))) &&
      (!similar.size || similar.has(similarBucket(a))),
  );
}

export interface FeedFilterOption {
  id: string;
  label: string;
  count: number;
}

export interface FeedFilterOptions {
  domains: FeedFilterOption[];
  pages: FeedFilterOption[];
  status: FeedFilterOption[];
  days: FeedFilterOption[];
  similar: FeedFilterOption[];
}

function tally<K extends string>(ads: Ad[], key: (a: Ad) => K): Map<K, number> {
  const m = new Map<K, number>();
  for (const a of ads) m.set(key(a), (m.get(key(a)) ?? 0) + 1);
  return m;
}

const byCountThenLabel = (a: FeedFilterOption, b: FeedFilterOption) => b.count - a.count || a.label.localeCompare(b.label);

/** Options + counts over `ads` (the page's ads BEFORE these filters, after scope and search). Domain / page lists are most-used first. */
export function feedFilterOptions(ads: Ad[]): FeedFilterOptions {
  const domainCounts = tally(ads, (a) => a.domainAdvertiserId ?? NO_DOMAIN);
  const pageCounts = tally(ads, (a) => a.pageAdvertiserId);
  const pageNames = new Map<string, string>();
  for (const a of ads) pageNames.set(a.pageAdvertiserId, a.pageName);
  const statusCounts = tally(ads, (a) => a.status);
  const daysCounts = tally(ads, daysBucket);
  const similarCounts = tally(ads, similarBucket);
  return {
    domains: Array.from(domainCounts, ([id, count]) => ({
      id,
      count,
      label: id === NO_DOMAIN ? "No landing domain" : getAdvertiser(id)?.name ?? id,
    })).sort(byCountThenLabel),
    pages: Array.from(pageCounts, ([id, count]) => ({ id, count, label: pageNames.get(id) ?? getAdvertiser(id)?.name ?? id })).sort(byCountThenLabel),
    status: STATUS_IDS.map((id) => ({ id, label: FEED_STATUS_LABEL[id], count: statusCounts.get(id) ?? 0 })),
    days: FEED_DAYS_BUCKETS.map((b) => ({ ...b, count: daysCounts.get(b.id) ?? 0 })),
    similar: FEED_SIMILAR_BUCKETS.map((b) => ({ ...b, count: similarCounts.get(b.id) ?? 0 })),
  };
}
