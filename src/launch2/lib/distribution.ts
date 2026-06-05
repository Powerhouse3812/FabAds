import type { DistributionEntry, Page } from "../types";

/**
 * Smart auto-spread. Distributes a total number of ad sets as evenly as
 * possible across the selected account/page pairs (remainder front-loaded).
 */
export function autoDistribute(
  totalAdsets: number,
  pairs: { accountId: string; pageId: string; pixelId: string | null }[]
): DistributionEntry[] {
  const n = pairs.length;
  if (n === 0) return [];
  const base = Math.floor(totalAdsets / n);
  const remainder = totalAdsets % n;
  return pairs.map((p, i) => ({
    accountId: p.accountId,
    pageId: p.pageId,
    pixelId: p.pixelId,
    adsets: base + (i < remainder ? 1 : 0),
  }));
}

export interface PairKey {
  accountId: string;
  pageId: string;
  pixelId: string | null;
}

/** Build the account×page pairs from selected ids (one pixel applied to all). */
export function buildPairs(
  accountIds: string[],
  pageIds: string[],
  pages: Page[],
  pixelId: string | null
): PairKey[] {
  const pairs: PairKey[] = [];
  for (const pageId of pageIds) {
    const page = pages.find((p) => p.id === pageId);
    if (!page) continue;
    // Only pair a page with its own account, and only if that account is selected.
    if (accountIds.includes(page.accountId)) {
      pairs.push({ accountId: page.accountId, pageId, pixelId });
    }
  }
  return pairs;
}
