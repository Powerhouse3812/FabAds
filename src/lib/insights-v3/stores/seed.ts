/**
 * Demo state seeded on first run (only when a key is absent):
 * 4 followed pages, 1 followed industry, 2 competitor domains + 1 competitor page,
 * 3 boards with mixed item types (2 pinned), 6 saved ads.
 * Picks are deterministic from the universe, so every demo looks the same.
 */
import type { Ad, Board, BoardItem, IndustryId, SavedItemRef } from "../types";
import { INDEX } from "../data";
import type { DataIndex } from "../data";
import { isWinner, snapshotFor } from "../selectors";

const DAY = 86_400_000;

export interface FollowsState {
  pages: string[];
  industries: IndustryId[];
}

export interface CompetitorsState {
  domains: string[];
  pages: string[];
}

export interface SavedAdEntry {
  adId: string;
  savedAt: string;
}

function byAdCount(m: Map<string, Ad[]>): [string, Ad[]][] {
  return Array.from(m).sort((a, b) => b[1].length - a[1].length || (a[0] < b[0] ? -1 : 1));
}

function topPageIn(industry: IndustryId, exclude: Set<string>, data: DataIndex): string | null {
  for (const [id, ads] of byAdCount(data.adsByPage)) {
    if (exclude.has(id)) continue;
    if (ads.filter((a) => a.industryId === industry).length >= ads.length / 2) return id;
  }
  return null;
}

export function seedFollows(data: DataIndex = INDEX): FollowsState {
  const picked = new Set<string>();
  for (const ind of ["lead-gen", "vsl", "e-commerce", "lead-gen"] as IndustryId[]) {
    const id = topPageIn(ind, picked, data);
    if (id) picked.add(id);
  }
  return { pages: Array.from(picked), industries: ["telehealth"] };
}

export function seedCompetitors(data: DataIndex = INDEX, follows: FollowsState = seedFollows(data)): CompetitorsState {
  const followed = new Set(follows.pages);
  const followedDomains = new Set<string>();
  for (const p of follows.pages) for (const a of data.adsByPage.get(p) ?? []) if (a.domainAdvertiserId) followedDomains.add(a.domainAdvertiserId);
  const domains: string[] = [];
  for (const ind of ["vsl", "lead-gen"] as IndustryId[]) {
    const hit = byAdCount(data.adsByDomain).find(
      ([id, ads]) => !followedDomains.has(id) && !domains.includes(id) && ads[0]?.industryId === ind,
    );
    if (hit) domains.push(hit[0]);
  }
  const page = topPageIn("lead-gen", new Set([...followed]), data);
  return { domains, pages: page ? [page] : [] };
}

function winnersBy(data: DataIndex, filter: (a: Ad) => boolean, n: number): Ad[] {
  return data.ads
    .filter((a) => filter(a) && isWinner(a))
    .sort((a, b) => b.aiScore.total - a.aiScore.total || (a.id < b.id ? -1 : 1))
    .slice(0, n);
}

function item(ref: SavedItemRef, addedAt: number, data: DataIndex, note?: string): BoardItem | null {
  const snapshot = snapshotFor(ref, data);
  if (!snapshot) return null;
  return { ref, addedAt: new Date(addedAt).toISOString(), snapshot, ...(note ? { note } : {}) };
}

export function seedBoards(data: DataIndex = INDEX): Board[] {
  const now = data.now;
  const at = (days: number) => now - days * DAY;
  const medicareAds = winnersBy(data, (a) => a.categoryId === "medicare" || a.categoryId === "auto-insurance", 2);
  const vslAds = winnersBy(data, (a) => a.industryId === "vsl", 2);
  const ecomAd = winnersBy(data, (a) => a.industryId === "e-commerce", 1);
  const vslLp = data.landingPages.find((l) => l.funnelType === "direct-vsl" && (data.adsByLandingPage.get(l.id)?.length ?? 0) >= 2);
  const topOffer = data.offers.slice().sort((a, b) => (data.adsByOffer.get(b.id)?.length ?? 0) - (data.adsByOffer.get(a.id)?.length ?? 0) || (a.id < b.id ? -1 : 1))[0];
  const offerLp = topOffer ? topOffer.landingPageIds[0] : undefined;
  const ecomPage = ecomAd[0]?.pageAdvertiserId;

  const build = (items: (BoardItem | null)[]) => items.filter((x): x is BoardItem => x != null);

  return [
    {
      id: "board-seed-hooks",
      name: "Winning hooks — insurance",
      description: "Hook styles and ads to brief the next insurance batch.",
      pinned: true,
      createdAt: new Date(at(21)).toISOString(),
      updatedAt: new Date(at(2)).toISOString(),
      items: build([
        item({ type: "hook", id: "callout" }, at(20), data, "Works with zip-code callouts"),
        item({ type: "hook", id: "shock-stat" }, at(18), data),
        item({ type: "hook", id: "curiosity-question" }, at(9), data),
        ...medicareAds.map((a, i) => item({ type: "ad", id: a.id }, at(6 - i), data)),
      ]),
    },
    {
      id: "board-seed-vsl",
      name: "VSL teardown",
      description: "Frameworks, angles and the landing page behind long-running VSL ads.",
      pinned: true,
      createdAt: new Date(at(14)).toISOString(),
      updatedAt: new Date(at(1)).toISOString(),
      items: build([
        item({ type: "framework", id: "pas" }, at(14), data),
        item({ type: "framework", id: "star-story-solution" }, at(13), data),
        item({ type: "angle", id: "relieve-joint-pain-naturally" }, at(11), data),
        ...vslAds.map((a, i) => item({ type: "ad", id: a.id }, at(8 - i), data)),
        vslLp ? item({ type: "landing-page", id: vslLp.id }, at(3), data) : null,
      ]),
    },
    {
      id: "board-seed-offers",
      name: "Offers to watch",
      description: "Offer pages and brands to check every week.",
      pinned: false,
      createdAt: new Date(at(7)).toISOString(),
      updatedAt: new Date(at(1)).toISOString(),
      items: build([
        topOffer ? item({ type: "offer", id: topOffer.id }, at(7), data) : null,
        offerLp ? item({ type: "landing-page", id: offerLp }, at(6), data) : null,
        item({ type: "concept", id: "news-editorial" }, at(5), data),
        ...ecomAd.map((a) => item({ type: "ad", id: a.id }, at(4), data)),
        ecomPage ? item({ type: "page", id: ecomPage }, at(2), data) : null,
      ]),
    },
  ];
}

export function seedSavedAds(data: DataIndex = INDEX): SavedAdEntry[] {
  const picks: Ad[] = [];
  for (const ind of ["lead-gen", "vsl", "e-commerce", "telehealth", "others", "lead-gen"] as IndustryId[]) {
    const next = data.ads
      .filter((a) => a.industryId === ind && isWinner(a) && !picks.includes(a))
      .sort((a, b) => b.aiScore.total - a.aiScore.total || (a.id < b.id ? -1 : 1))[0];
    if (next) picks.push(next);
  }
  return picks.map((a, i) => ({ adId: a.id, savedAt: new Date(data.now - (i + 1) * 2 * DAY).toISOString() }));
}
