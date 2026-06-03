/**
 * Deterministic mock Page directory for Bulk Launch Distribution (Step 1).
 *
 * Maps an ad-account id -> the Facebook Pages linked under it. Each page carries
 * the three fields a `TargetPair` needs: `page_id` (internal account->page link
 * id), `fb_page_id` (the Facebook Page identity that capacity is keyed on), and
 * `page_name`.
 *
 * IMPORTANT (shared-page demo): a SINGLE `fb_page_id` ("fbpage_shared_brand") is
 * intentionally linked under TWO different accounts. Under each account it gets a
 * distinct internal `page_id`, but the SAME `fb_page_id` — so the shared 250-slot
 * bucket case is always demoable. Capacity in `mock-page-capacity.ts` is seeded
 * off `fb_page_id`, so that shared page returns ONE stable bucket for both.
 *
 * Pure: no React / no Supabase. Safe to import from UI and tests.
 */

export interface MockPage {
  page_id: string; // internal (account, page) link id — unique per account
  fb_page_id: string; // Facebook Page identity — capacity is keyed on THIS
  page_name: string;
}

/** The fb_page_id that is shared across two accounts (the demoable shared case). */
export const SHARED_FB_PAGE_ID = "fbpage_shared_brand";

/** Stable 32-bit FNV-1a hash — deterministic across runs. */
function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Deterministic page list for an account. Every account exposes:
 *  - a "Main" page  (account-unique fb_page_id)
 *  - a "Promo" page (account-unique fb_page_id)
 *  - the SHARED "House Brand" page (same fb_page_id across all accounts) so the
 *    shared-bucket case is always reachable in a multi-account launch.
 *
 * The internal `page_id` is namespaced by the account, so the shared page has a
 * different link id per account while keeping ONE fb_page_id.
 */
export function getMockPagesForAccount(accountId: string, accountName: string): MockPage[] {
  const h = hashString(accountId);
  // A short stable suffix so two accounts never collide on Main/Promo fb ids.
  const suffix = (h % 100000).toString(36);
  return [
    {
      page_id: `${accountId}__page_main`,
      fb_page_id: `fbpage_main_${suffix}`,
      page_name: `${accountName} — Main Page`,
    },
    {
      page_id: `${accountId}__page_promo`,
      fb_page_id: `fbpage_promo_${suffix}`,
      page_name: `${accountName} — Promo Page`,
    },
    {
      page_id: `${accountId}__page_shared`,
      fb_page_id: SHARED_FB_PAGE_ID,
      page_name: "House Brand Page (shared)",
    },
  ];
}

/** Look up a single mock page under an account by its internal page_id. */
export function findMockPage(
  accountId: string,
  accountName: string,
  pageId: string
): MockPage | undefined {
  return getMockPagesForAccount(accountId, accountName).find((p) => p.page_id === pageId);
}
