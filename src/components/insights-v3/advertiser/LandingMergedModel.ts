/**
 * Pure model for the merged "Landing pages" tab: one row per landing page, each with the other side
 * (pages behind a domain / domains a page sends to), plus the other-side competitors whose ads here have
 * no captured landing page. Replaces the two old lists (`landingPages.rows` and `related`).
 */
import { getAdvertiser } from "@/lib/insights-v3/data";
import type { LandingPageRow } from "@/lib/insights-v3/selectors";
import type { Ad, AdvertiserKind } from "@/lib/insights-v3/types";

export interface Connected {
  id: string;
  name: string;
  /** Ads from / to this competitor on that landing page (or without one, in `uncaptured`). */
  count: number;
}

export interface MergedRow {
  row: LandingPageRow;
  connected: Connected[];
}

export interface MergedLanding {
  rows: MergedRow[];
  /** Other-side competitors with at least one ad here that has no captured landing page. */
  uncaptured: Connected[];
  /** Ads here with no captured landing page (a page's ads can have no domain to list at all). */
  uncapturedAds: number;
  /** Distinct other-side competitors across the whole tab (same set the old `related` list showed). */
  otherCount: number;
}

const byCountThenName = (a: Connected, b: Connected) => b.count - a.count || a.name.localeCompare(b.name) || (a.id < b.id ? -1 : 1);

function tally(ads: Ad[], otherOf: (a: Ad) => string | null): Connected[] {
  const m = new Map<string, number>();
  for (const a of ads) {
    const id = otherOf(a);
    if (id) m.set(id, (m.get(id) ?? 0) + 1);
  }
  return Array.from(m, ([id, count]) => ({ id, name: getAdvertiser(id)?.name ?? id, count })).sort(byCountThenName);
}

export function mergeLandingPages(kind: AdvertiserKind, ads: Ad[], rows: LandingPageRow[]): MergedLanding {
  const otherOf = (a: Ad) => (kind === "domain" ? a.pageAdvertiserId : a.domainAdvertiserId);
  const rowIds = new Set(rows.map((r) => r.id));
  const byLp = new Map<string, Ad[]>();
  const loose: Ad[] = [];
  for (const a of ads) {
    if (a.landingPageId && rowIds.has(a.landingPageId)) {
      const list = byLp.get(a.landingPageId);
      if (list) list.push(a);
      else byLp.set(a.landingPageId, [a]);
    } else loose.push(a);
  }
  const merged = rows.map((row) => ({ row, connected: tally(byLp.get(row.id) ?? [], otherOf) }));
  const uncaptured = tally(loose, otherOf);
  const others = new Set<string>(uncaptured.map((c) => c.id));
  for (const m of merged) for (const c of m.connected) others.add(c.id);
  return { rows: merged, uncaptured, uncapturedAds: loose.length, otherCount: others.size };
}
