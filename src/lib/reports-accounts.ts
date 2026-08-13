/**
 * Reports module — ad-account + Facebook-page + currency universe.
 *
 * Derives the "which ad accounts / pages / currencies exist" picture that
 * anything needing an account/page picker (or per-row currency) reads from.
 * Nothing here is new mock data: accounts come from the account-level rows
 * already produced by `getByLevel("account")` in `reports-dummy-data.ts`, and
 * pages come from that file's `DESTINATION_PAGES` pool (the same pool the
 * bulk-launch provenance fields are seeded from).
 *
 * NOTE — the mobile Reports "scope bar" (`MobileScopeBar` + `MobileScopeSheet`)
 * that used to be this module's main consumer was cut as a product decision
 * (see `MobileReportsShell.tsx`). Do NOT delete this file for that — its
 * `currencyForCountry` export is still load-bearing for row/table/budget
 * currency elsewhere (see the "dead exports" note below for what actually
 * went unused).
 *
 * ⚠️ DISJOINT UNIVERSE WARNING — do not cross-wire with Launch.
 * The Reports account universe (Acme Corp US / Acme Corp EU / BrandX Global /
 * ShopMax Direct / TrendWave Media, ids `acc_0`..`acc_4`) is a completely
 * separate mock universe from the Launch v2 `ACCOUNTS` list in
 * `src/launch2/data/mockData.ts` / `src/launchv2/data.ts` (Mamaearth, boAt,
 * Noise, …). They are not the same accounts under different names — mixing
 * them would, e.g., print a Launch account name above a list of Acme/BrandX
 * report rows. Never import Launch's `ACCOUNTS` here, and never import this
 * module's accounts into a Launch surface.
 *
 * REQUIRED UPSTREAM CHANGE — see final report / commit note:
 * `DESTINATION_PAGES` in `src/lib/reports-dummy-data.ts` is currently a
 * module-private `const` (not exported). This file imports it as if it were
 * exported, per the task brief. Until that one-line `export` is added to
 * `reports-dummy-data.ts`, this module will not type-check.
 */

import { getByLevel, DESTINATION_PAGES } from "./reports-dummy-data";

// ── Country → currency (demo mapping) ──────────────────────────────
// These are deliberately simplified demo mappings, not a real ISO
// country→currency table. They only need to cover the values that actually
// appear in `COUNTRIES` inside reports-dummy-data.ts: US, UK, DE, FR, BR, AU,
// CA, JP. Anything outside that set falls back to the default below.
const COUNTRY_CURRENCY: Record<string, string> = {
  US: "USD",
  UK: "GBP",
  DE: "EUR",
  FR: "EUR",
  BR: "BRL",
  AU: "AUD",
  CA: "CAD",
  JP: "JPY",
};

const DEFAULT_CURRENCY = "USD";

// Local, minimal symbol table so this module has no dependency direction
// into launch2. Mirrors the mapping shape of `currencySymbol()` in
// `src/launch2/utils/time.ts` (reused where possible; extended here for the
// non-launch currencies this module's country map can produce).
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  GBP: "£",
  EUR: "€",
  BRL: "R$",
  AUD: "A$",
  CAD: "C$",
  JPY: "¥",
  INR: "₹",
  AED: "AED ",
};

/** Currency for any entity at any level — children inherit their account's. */
export function currencyForCountry(country: string): { code: string; symbol: string } {
  const code = COUNTRY_CURRENCY[country] ?? DEFAULT_CURRENCY;
  const symbol = CURRENCY_SYMBOLS[code] ?? `${code} `;
  return { code, symbol };
}

// ── Types ───────────────────────────────────────────────────────────

export interface ReportPage {
  fbPageId: string;
  pageName: string;
}

export interface ReportAccount {
  id: string; // "acc_0"
  name: string;
  country: string;
  currency: string; // ISO code, e.g. "USD"
  currencySymbol: string;
  pages: ReportPage[];
}

// ── Derivation (memoized — source data is static) ──────────────────

let _accountsCache: ReportAccount[] | null = null;

function deriveAccounts(): ReportAccount[] {
  // Account-level rows already carry id/name/country from the generator —
  // no need to re-hardcode the account list here.
  const accountEntities = getByLevel("account");

  return accountEntities.map((acc) => {
    const { code, symbol } = currencyForCountry(acc.country);

    // A page "belongs" to this account if DESTINATION_PAGES tags it with this
    // account's name. The same fbPageId can legitimately appear under more
    // than one account (see the Acme Corp US / Acme Corp EU shared-page
    // entry) — that is preserved as-is, not deduped away.
    const pages: ReportPage[] = DESTINATION_PAGES.filter(
      (p) => p.accountName === acc.name
    ).map((p) => ({ fbPageId: p.fbPageId, pageName: p.pageName }));

    return {
      id: acc.id,
      name: acc.name,
      country: acc.country,
      currency: code,
      currencySymbol: symbol,
      pages,
    };
  });
}

function getAccounts(): ReportAccount[] {
  if (!_accountsCache) _accountsCache = deriveAccounts();
  return _accountsCache;
}

// ── Public accessors ────────────────────────────────────────────────

// DEAD as of the mobile scope-bar removal (no remaining callers) — left in
// place rather than deleted, since a duplicate-related feature may need
// account listing again shortly.
export function listReportAccounts(): ReportAccount[] {
  return getAccounts();
}

// `getReportAccount` is still LIVE — used by BudgetEditSheet.tsx for the
// account name shown while editing budget.
export function getReportAccount(id: string): ReportAccount | undefined {
  return getAccounts().find((a) => a.id === id);
}

// DEAD — no callers even before the scope-bar removal; left in place.
export function pagesForAccount(accountId: string): ReportPage[] {
  return getReportAccount(accountId)?.pages ?? [];
}

// ── Mobile scope bar label helpers (pure strings, no JSX) ───────────
// DEAD as of the mobile scope-bar removal — `MobileScopeBar` /
// `MobileScopeSheet` were the only callers of everything below (NO_PAGE_LINKED,
// accountScopeLabel, pageScopeLabel) and both were deleted (see
// MobileReportsShell.tsx). Left in place rather than deleted: a
// duplicate-related feature may need account/page scope labels again shortly.

/** Sentinel string for "this account has no destination page linked".
 * Exported so callers can style it distinctly (e.g. muted/italic) via a
 * simple `=== NO_PAGE_LINKED` check rather than string-matching. */
export const NO_PAGE_LINKED = "No page linked";

/**
 * Label for the account-scope control.
 * - exactly one selected id → that account's name
 * - zero selected ids, or every account selected → "All N accounts"
 * - a partial multi-selection → "N accounts" (defensive fallback; the scope
 *   bar's current states are single-account and all-accounts, but this keeps
 *   the helper correct if a partial multi-select is ever wired up)
 */
export function accountScopeLabel(selectedAccountIds: string[]): string {
  const all = listReportAccounts();

  if (selectedAccountIds.length === 1) {
    const acc = getReportAccount(selectedAccountIds[0]);
    if (acc) return acc.name;
  }

  if (selectedAccountIds.length === 0 || selectedAccountIds.length >= all.length) {
    return `All ${all.length} accounts`;
  }

  return `${selectedAccountIds.length} accounts`;
}

/**
 * Label for the page-scope control, given the currently selected pages and
 * the total number of pages available in the current account scope.
 * - `totalPagesInScope === 0` → the "No page linked" sentinel
 * - exactly one selected page → that page's name
 * - every available page selected (and there's more than one) → "All pages"
 * - otherwise → "N pages"
 */
export function pageScopeLabel(
  selectedPages: ReportPage[],
  totalPagesInScope: number
): string {
  if (totalPagesInScope === 0) return NO_PAGE_LINKED;

  if (selectedPages.length === 1) return selectedPages[0].pageName;

  if (selectedPages.length === 0 || selectedPages.length >= totalPagesInScope) {
    return "All pages";
  }

  return `${selectedPages.length} pages`;
}
