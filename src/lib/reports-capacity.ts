/**
 * Reports — active-ad capacity for one entity (its ad account + its page).
 *
 * WHY THIS IS A SIBLING MODULE, NOT PART OF reports-accounts.ts
 * `reports-accounts.ts` is the STATIC universe: which accounts, pages and
 * currencies exist. It memoizes its derivation in a module-level cache precisely
 * because that answer never changes. Capacity is the opposite kind of question —
 * it is a LIVE count that changes on every status write and every fabricated
 * copy, so it has to read the write-store snapshot and must never be cached.
 * Folding it into reports-accounts.ts would either poison that cache or force
 * the static module to depend on the write store. So: accounts module answers
 * "what exists", this module answers "how full is it right now".
 *
 * WHAT IT IS FOR
 * The duplicate flow (see DuplicateEntitySheet) lets the user create N copies
 * and choose whether they publish Active or Paused. Active copies consume real
 * Meta quota, so the sheet has to show the two ceilings that actually bite and
 * block Active — offering Paused instead — when the request would exceed the
 * tighter of them.
 */

import { projectLevel, type WriteStoreShape } from "./ad-entity-write-store";
import {
  getById,
  getByLevel,
  getDataset,
  type ReportEntity,
} from "./reports-dummy-data";
import {
  getReportAccount,
  type ReportAccount,
  type ReportPage,
} from "./reports-accounts";

/* ───────────────────────────── the ceilings ───────────────────────────── */

/**
 * REAL META LIMITS (not demo numbers).
 *
 * 5,000 active ads per ad account, 250 active ads per Facebook Page. Both are
 * modelled here as ACTIVE-only — paused and archived ads consume nothing, which
 * is exactly what makes "create them Paused instead" a real escape hatch and not
 * a fudge.
 *
 * ONE SIMPLIFICATION, NAMED: Meta's own account-level 5,000 is documented
 * against ads that are not deleted, which strictly speaking also counts Paused
 * ones. Both ceilings are treated as active-only here because that is the
 * locked product spec for this flow, and because the Page's 250 is the ceiling
 * that actually binds in practice — the account line is context, not the gate.
 * If the account line ever needs to be exact, count non-archived there and
 * narrow the sheet's Paused copy to "frees Page room" at the same time.
 *
 * They are separate ceilings because they are separate objects: an ad lives on
 * one ad account AND on one page.
 */
export const MAX_ACTIVE_ADS_PER_ACCOUNT = 5000;
export const MAX_ACTIVE_ADS_PER_PAGE = 250;

/* ────────────────────────────── resolution ────────────────────────────── */

/** A fabricated copy's id is `dup_<n>__<rootId>` — see the write store. */
const DUP_PREFIX = /^dup_\d+__/;

/**
 * The id of the row a fabricated copy was derived from, or the id itself.
 * Used so a copy resolves to the SAME derived page as its source instead of
 * drifting onto a different page just because its id differs.
 */
export function rootEntityId(id: string): string {
  return id.replace(DUP_PREFIX, "");
}

/**
 * Walks `parentId` up to the owning ad account, at any level.
 * Bounded: the tree is account → campaign → adset → ad, so 4 hops is the max.
 */
export function resolveEntityAccount(
  entity: ReportEntity,
  dateSeed = 0,
): ReportAccount | undefined {
  let cursor: ReportEntity | undefined = entity;
  for (let hops = 0; cursor && hops < 6; hops += 1) {
    if (cursor.level === "account") return getReportAccount(cursor.id);
    const parentId: string | null = cursor.parentId;
    cursor = parentId ? getById(rootEntityId(parentId), dateSeed) : undefined;
  }
  return undefined;
}

/** Small deterministic string hash (FNV-1a-ish). Same input → same output, always. */
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface ResolvedPage extends ReportPage {
  /**
   * FALSE when the page came from the entity's real `destinationFbPageId` /
   * `destinationPageName` (bulk-launch provenance), TRUE when this module
   * picked one deterministically from the account's linked pages.
   */
  derived: boolean;
}

/**
 * The page an entity publishes to.
 *
 * ⚠️ ONLY PARTLY REAL DATA. The seeded dataset in `reports-dummy-data.ts` tags a
 * page (`destinationFbPageId` / `destinationPageName`) on roughly 40% of
 * AD-LEVEL rows — the ones with bulk-launch provenance. Campaigns, ad sets and
 * the other ~60% of ads carry nothing. Real Meta objects always resolve to a
 * page, so rather than showing "unknown" on most rows we DERIVE one:
 *
 *   - real provenance wins whenever it is present;
 *   - otherwise pick from the owning account's linked pages by hashing the
 *     entity's ROOT id, so the same entity always lands on the same page (and a
 *     copy lands on its source's page). Never random, never re-rolled;
 *   - and the result is flagged `derived: true` so the UI can say so out loud.
 *
 * Returns null when the account genuinely has no page linked — `BrandX Global`
 * in this dataset has zero pages, and inventing one for it would be a lie. The
 * caller must then fall back to the account ceiling alone.
 */
export function resolveEntityPage(
  entity: ReportEntity,
  account: ReportAccount | undefined,
): ResolvedPage | null {
  if (entity.destinationFbPageId && entity.destinationPageName) {
    return {
      fbPageId: entity.destinationFbPageId,
      pageName: entity.destinationPageName,
      derived: false,
    };
  }

  const pages = account?.pages ?? [];
  if (pages.length === 0) return null;

  const picked = pages[hashString(rootEntityId(entity.id)) % pages.length];
  return { ...picked, derived: true };
}

/* ─────────────────────────────── counting ─────────────────────────────── */

/**
 * Every ad-level row as it stands RIGHT NOW: seeded rows with any status
 * override applied, plus the copies the user fabricated this session.
 * `projectLevel` is the same projection the tables render from, so the numbers
 * shown in the duplicate sheet cannot disagree with the list behind it.
 */
function liveAds(snap: WriteStoreShape, dateSeed: number): ReportEntity[] {
  return projectLevel(getByLevel("ad", dateSeed), { level: "ad" }, snap);
}

/**
 * parentId → accountId for the whole tree, built once per capacity call.
 * `getById` is a linear scan of the dataset, so resolving the account of every
 * ad row one at a time would be O(ads × dataset). This makes it O(dataset).
 */
function buildAccountIndex(dateSeed: number): Map<string, string> {
  const rows = getDataset(dateSeed);
  const parentOf = new Map<string, string | null>();
  for (const r of rows) parentOf.set(r.id, r.parentId);

  const accountOf = new Map<string, string>();
  for (const r of rows) {
    let cursor: string | undefined = r.id;
    let account: string | undefined;
    for (let hops = 0; cursor !== undefined && hops < 6; hops += 1) {
      const parent = parentOf.get(cursor);
      if (parent === null) {
        account = cursor; // reached a root — that is the ad account
        break;
      }
      cursor = parent ?? undefined;
    }
    if (account) accountOf.set(r.id, account);
  }
  return accountOf;
}

/** Account id for any row, fabricated copies included (they share a parent). */
function accountIdOf(
  entity: ReportEntity,
  index: Map<string, string>,
): string | undefined {
  return (
    index.get(entity.id) ??
    (entity.parentId ? index.get(rootEntityId(entity.parentId)) : undefined)
  );
}

export interface CapacityLine {
  /** "Acme Corp US" / "Acme Brand Page" — what the user sees. */
  name: string;
  active: number;
  limit: number;
  /** Never negative: an over-quota account has 0 room, not -12. */
  remaining: number;
}

export interface DuplicateCapacity {
  account: CapacityLine | null;
  page: CapacityLine | null;
  /**
   * The page's page name/id, plus whether it was derived rather than read from
   * real provenance — the sheet discloses that.
   */
  pageDerived: boolean;
  /** Non-null when the owning account has NO page linked at all. */
  noPageLinkedFor: string | null;
  /**
   * The binding constraint — the smaller of the two remainings (the account's
   * alone when no page is linked). `Infinity` only if neither could be
   * resolved, which the caller must treat as "cannot validate".
   */
  tighterRemaining: number;
  /** Which line is binding, for the message wording. */
  tighter: "page" | "account" | null;
}

/**
 * Live capacity for the account + page that `entity` lives on.
 *
 * ONE ASSUMPTION, STATED: each copy is counted as consuming ONE active-ad slot,
 * at every level. That is exactly right for an ad-level duplicate. For a
 * campaign or ad set it is conservative in this prototype — the write store
 * fabricates the single row without children, so a campaign copy adds no ads at
 * all, whereas real Meta would copy the whole subtree and consume far more. The
 * conservative direction is the safe one for a limit check.
 */
export function getDuplicateCapacity(
  entity: ReportEntity,
  snap: WriteStoreShape,
  dateSeed = 0,
): DuplicateCapacity {
  const account = resolveEntityAccount(entity, dateSeed);
  const page = resolveEntityPage(entity, account);
  const index = buildAccountIndex(dateSeed);

  let accountActive = 0;
  let pageActive = 0;

  for (const ad of liveAds(snap, dateSeed)) {
    if (ad.status !== "Active") continue;

    const adAccountId = accountIdOf(ad, index);
    const sameAccount = account !== undefined && adAccountId === account.id;
    if (sameAccount) accountActive += 1;

    if (page) {
      // Resolve each ad's page the same way — real provenance first, derived
      // otherwise — so the page total is consistent with the page we display.
      // A shared page (Acme Brand Page is linked under both Acme accounts) is
      // counted across BOTH accounts, which is how Meta's page cap works.
      const adAccount = sameAccount
        ? account
        : adAccountId
          ? getReportAccount(adAccountId)
          : undefined;
      const adPage = resolveEntityPage(ad, adAccount);
      if (adPage?.fbPageId === page.fbPageId) pageActive += 1;
    }
  }

  const accountLine: CapacityLine | null = account
    ? {
        name: account.name,
        active: accountActive,
        limit: MAX_ACTIVE_ADS_PER_ACCOUNT,
        remaining: Math.max(0, MAX_ACTIVE_ADS_PER_ACCOUNT - accountActive),
      }
    : null;

  const pageLine: CapacityLine | null = page
    ? {
        name: page.pageName,
        active: pageActive,
        limit: MAX_ACTIVE_ADS_PER_PAGE,
        remaining: Math.max(0, MAX_ACTIVE_ADS_PER_PAGE - pageActive),
      }
    : null;

  const candidates: { which: "page" | "account"; remaining: number }[] = [];
  if (pageLine) candidates.push({ which: "page", remaining: pageLine.remaining });
  if (accountLine)
    candidates.push({ which: "account", remaining: accountLine.remaining });

  // Page first on ties: 250 is the ceiling a buyer actually hits, so naming it
  // is more useful than naming the 5,000 when both happen to match.
  const binding = candidates.reduce<{ which: "page" | "account"; remaining: number } | null>(
    (best, c) => (best === null || c.remaining < best.remaining ? c : best),
    null,
  );

  return {
    account: accountLine,
    page: pageLine,
    pageDerived: page?.derived ?? false,
    noPageLinkedFor: page === null ? (account?.name ?? null) : null,
    tighterRemaining: binding?.remaining ?? Number.POSITIVE_INFINITY,
    tighter: binding?.which ?? null,
  };
}

/** `1,240` — one place, so the two capacity lines can never format differently. */
export function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}
