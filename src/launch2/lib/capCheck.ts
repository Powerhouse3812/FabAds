import type { DistributionEntry, Page } from "../types";

export interface PageCapInfo {
  pageId: string;
  pageName: string;
  current: number;
  added: number;
  limit: number;
  headroom: number; // limit - current - added
  breach: boolean;
}

export interface CapCheckResult {
  anyBreach: boolean;
  pages: PageCapInfo[];
}

/**
 * Meta per-Page 250-ad cap pre-check.
 *
 * NOTE [I]: whether the cap aggregates across ad accounts is UNVERIFIED — this
 * checks per-Page only (the conservative, documented behaviour). Confirm vs
 * Meta primary before relying on cross-account aggregation.
 */
export function checkCaps(
  distribution: DistributionEntry[],
  creativesPerAdset: number,
  pages: Page[]
): CapCheckResult {
  const addedByPage = new Map<string, number>();
  for (const d of distribution) {
    const ads = d.adsets * creativesPerAdset;
    addedByPage.set(d.pageId, (addedByPage.get(d.pageId) ?? 0) + ads);
  }

  const result: PageCapInfo[] = [];
  for (const [pageId, added] of addedByPage) {
    const page = pages.find((p) => p.id === pageId);
    if (!page) continue;
    const headroom = page.capLimit - page.adCount - added;
    result.push({
      pageId,
      pageName: page.name,
      current: page.adCount,
      added,
      limit: page.capLimit,
      headroom,
      breach: headroom < 0,
    });
  }

  return { anyBreach: result.some((p) => p.breach), pages: result };
}
