/** Pure derivations for Launch v2 — ad counts (spread-aware), budget, 250-cap. */
import { MAX_ADS_PER_PAGE, type PlanV2, type ProductV2, type RunningAdV2, type TargetPair } from "./types";
import { pageActiveAds, getCatalog, RUNNING_ADS } from "./data";

/** Ad sets produced (spread-aware). */
export function adSetCount(plan: PlanV2): number {
  const n = Math.max(plan.creatives.length, 1);
  const base = plan.structure.campaigns * plan.structure.adSetsPerCampaign;
  switch (plan.spread) {
    case "one_per_adset":
      return n;
    case "multiply":
      return base * n;
    case "custom":
      // custom: trust the structure as authored by user
      return plan.structure.campaigns * plan.structure.adSetsPerCampaign;
    default:
      return base; // stacked / round_robin / manual
  }
}

/** Ads produced per destination (spread-aware). */
export function adsPerDestination(plan: PlanV2): number {
  const n = Math.max(plan.creatives.length, 1);
  const base = plan.structure.campaigns * plan.structure.adSetsPerCampaign * plan.structure.adsPerAdSet;
  switch (plan.spread) {
    case "one_per_adset":
      return n; // n ad sets × 1 ad
    case "stacked":
      return plan.structure.campaigns * plan.structure.adSetsPerCampaign * n; // ad sets × n ads
    case "multiply":
      return base * n;
    case "custom":
      // custom: trust the structure as authored by user
      return plan.structure.campaigns * plan.structure.adSetsPerCampaign * plan.structure.adsPerAdSet;
    default:
      return base; // round_robin / manual fill existing slots
  }
}

/**
 * Total ads requested (× targets if duplicating across pages).
 * Post mode ("show = launch") overrides page-split math entirely for
 * toggle-ON accounts, so the duplicate multiplier no longer applies — sum
 * the real per-target counts instead.
 */
export function estimateAds(plan: PlanV2): number {
  if (postModeActive(plan)) {
    return perTargetCounts(plan).reduce((sum, c) => sum + c, 0);
  }
  const per = adsPerDestination(plan);
  const t = Math.max(plan.targets.length, 1);
  return plan.pageDistribution === "duplicate" ? per * t : per;
}

/**
 * Daily budget. CBO = campaign budget; ABO = per ad set × ad sets.
 * The "duplicate" multiplier is ignored while post mode is active — page
 * split is locked/overridden in that state, so it must not multiply spend.
 */
export function budgetPerDay(plan: PlanV2): number {
  const duplicating = !postModeActive(plan) && plan.pageDistribution === "duplicate";
  const mult = duplicating ? Math.max(plan.targets.length, 1) : 1;
  if (plan.budgetMode === "CBO") return plan.budgetAmount * mult;
  return plan.budgetAmount * adSetCount(plan) * mult;
}

/**
 * Daily total to display in the launch confirm modal + Step 4 footer.
 * Mirrors `budgetPerDay` but written from scratch per the modal spec so any
 * future divergence stays explicit. CBO = campaign amount; ABO = amount × ad
 * sets; `duplicate` page distribution multiplies by the number of targets —
 * unless post mode is active, in which case page split is overridden and the
 * multiplier must not apply.
 */
export function dailyTotalBudget(plan: PlanV2): number {
  let base = plan.budgetAmount || 0;
  if (plan.budgetMode === "ABO") base *= adSetCount(plan);
  if (!postModeActive(plan) && plan.pageDistribution === "duplicate") {
    base *= Math.max(plan.targets.length, 1);
  }
  return base;
}

export interface PageDemand {
  fbPageId: string;
  pageName: string;
  accountName: string;
  current: number;
  demand: number;
  available: number;
  over: boolean;
}

/**
 * True when at least one account has "use existing posts" switched on for
 * this launch. Post mode ("show = launch") overrides page-split math for the
 * accounts it's on for — see `perTargetCounts`.
 */
export function postModeActive(plan: PlanV2): boolean {
  return Object.values(plan.useExistingPostByAccount ?? {}).some(Boolean);
}

/** Selected post_id creatives resolved to their RUNNING_ADS record (misses dropped). */
export function selectedPostAds(plan: PlanV2): RunningAdV2[] {
  return plan.creatives
    .filter((c) => c.source === "post_id")
    .map((c) => RUNNING_ADS.find((ad) => ad.id === c.id))
    .filter((ad): ad is RunningAdV2 => ad !== undefined);
}

/**
 * The pre-post-mode page-distribution algorithm, runnable over an arbitrary
 * subset of targets. Used both for the default (non-post) path and for the
 * toggle-OFF targets of a mixed post-mode launch, so those targets compute
 * their fill-first/equal/duplicate/custom share among themselves only —
 * never inheriting slots reserved for toggle-ON targets.
 */
function defaultPageSplitCounts(plan: PlanV2, targets: TargetPair[]): number[] {
  const per = adsPerDestination(plan);
  const n = targets.length;
  if (n === 0) return [];
  if (plan.pageDistribution === "duplicate") return targets.map(() => per);
  if (plan.pageDistribution === "equal") {
    const q = Math.floor(per / n);
    const r = per % n;
    return targets.map((_, i) => q + (i < r ? 1 : 0));
  }
  if (plan.pageDistribution === "custom") {
    // custom: trust pageWeights authored by user (pageId → ad count); default 0 if unset
    return targets.map((t) => plan.pageWeights[t.pageId] ?? 0);
  }
  // fill-first
  const caps = targets.map((t) => Math.max(0, MAX_ADS_PER_PAGE - pageActiveAds(t.fbPageId)));
  let left = per;
  const out = targets.map(() => 0);
  for (let i = 0; i < n && left > 0; i++) {
    const take = Math.min(caps[i], left);
    out[i] = take;
    left -= take;
  }
  if (left > 0) out[n - 1] += left;
  return out;
}

/**
 * Ads each target receives, given page distribution.
 *
 * Post mode ("show = launch") overrides this entirely for toggle-ON
 * accounts: count = however many of the selected posts actually belong to
 * that target's Facebook Page (posts only ever run from their owner page,
 * so pageDistribution is meaningless for them). Toggle-OFF accounts in a
 * mixed launch fall through to the default fill-first/equal/duplicate/custom
 * logic, computed only across the OFF subset.
 */
export function perTargetCounts(plan: PlanV2): number[] {
  const n = plan.targets.length;
  if (n === 0) return [];

  if (postModeActive(plan)) {
    const posts = selectedPostAds(plan);
    const out = new Array<number>(n).fill(0);
    const offTargets: TargetPair[] = [];
    const offIndices: number[] = [];

    plan.targets.forEach((t, i) => {
      if (plan.useExistingPostByAccount?.[t.accountId]) {
        out[i] = posts.filter((ad) => ad.fbPageId === t.fbPageId).length;
      } else {
        offTargets.push(t);
        offIndices.push(i);
      }
    });

    if (offTargets.length > 0) {
      const offCounts = defaultPageSplitCounts(plan, offTargets);
      offIndices.forEach((i, k) => {
        out[i] = offCounts[k];
      });
    }
    return out;
  }

  return defaultPageSplitCounts(plan, plan.targets);
}

export interface ZeroAdAccount {
  accountId: string;
  accountName: string;
}

/**
 * Post-mode ("show = launch") toggle-ON accounts that end up producing ZERO
 * ads because no selected post belongs to any of that account's Page(s).
 * Hard-block condition: every ad account in the launch must produce at least
 * one ad. Toggle-OFF accounts are never included — their fill-first/equal/
 * duplicate/custom math always produces something from the structure, so a
 * zero-ad outcome can only happen via post mode. Sums `perTargetCounts`
 * across every target belonging to the account rather than re-deriving the
 * per-page post match, so this stays consistent with `estimateAds` /
 * `perPageDemand` by construction.
 */
export function accountsWithZeroPostAds(plan: PlanV2): ZeroAdAccount[] {
  if (!postModeActive(plan)) return [];
  const counts = perTargetCounts(plan);
  const seen = new Set<string>();
  const out: ZeroAdAccount[] = [];
  for (const t of plan.targets) {
    if (seen.has(t.accountId)) continue;
    if (!plan.useExistingPostByAccount?.[t.accountId]) continue;
    seen.add(t.accountId);
    const sum = plan.targets.reduce(
      (acc, t2, j) => (t2.accountId === t.accountId ? acc + (counts[j] ?? 0) : acc),
      0,
    );
    if (sum === 0) out.push({ accountId: t.accountId, accountName: t.accountName });
  }
  return out;
}

/** Per-unique-Page demand vs the 250 cap (shared pages summed). */
export function perPageDemand(plan: PlanV2): PageDemand[] {
  const counts = perTargetCounts(plan);
  const byPage = new Map<string, PageDemand>();
  plan.targets.forEach((t, i) => {
    const ex = byPage.get(t.fbPageId);
    if (ex) ex.demand += counts[i] ?? 0;
    else {
      const current = pageActiveAds(t.fbPageId);
      byPage.set(t.fbPageId, {
        fbPageId: t.fbPageId,
        pageName: t.pageName,
        accountName: t.accountName,
        current,
        demand: counts[i] ?? 0,
        available: Math.max(0, MAX_ADS_PER_PAGE - current),
        over: false,
      });
    }
  });
  const out = [...byPage.values()];
  out.forEach((p) => (p.over = p.current + p.demand > MAX_ADS_PER_PAGE));
  return out;
}

export function capCheck(plan: PlanV2): { ok: boolean; offenders: PageDemand[] } {
  const offenders = perPageDemand(plan).filter((p) => p.over);
  return { ok: offenders.length === 0, offenders };
}

/** Spread preview for Step 3's live mini-tree. */
export function spreadPreview(plan: PlanV2): { creatives: number; adSets: number; adsPerDest: number; total: number } {
  return {
    creatives: plan.creatives.length,
    adSets: adSetCount(plan),
    adsPerDest: adsPerDestination(plan),
    total: estimateAds(plan),
  };
}

/* ---- Catalogue ads derivation ----
 * 1 campaign per account (with catalog + >=1 set), 1 ad set per product set,
 * 1 dynamic carousel ad per ad set whose cards = the set's products.
 */
export interface CatalogueAdSetDerived {
  productSetId: string;
  productSetName: string;
  cardCount: number;          // = number of products in the set
  products: ProductV2[];
}
export interface CatalogueAccountGroup {
  accountId: string;
  accountName: string;
  catalogId: string | null;
  catalogName: string;
  campaigns: number;          // always 1 per account that has a catalog + >=1 set
  adSets: CatalogueAdSetDerived[];
}
export interface CatalogueDerivation {
  accounts: CatalogueAccountGroup[];
  totalCampaigns: number;
  totalAdSets: number;
  totalAds: number;           // 1 carousel ad per ad set
}

export function catalogueDerivation(plan: PlanV2): CatalogueDerivation {
  // unique accounts from targets, preserving first-seen order
  const seen = new Set<string>();
  const accountsOrder: { accountId: string; accountName: string }[] = [];
  for (const t of plan.targets) {
    if (!seen.has(t.accountId)) {
      seen.add(t.accountId);
      accountsOrder.push({ accountId: t.accountId, accountName: t.accountName });
    }
  }

  const accounts: CatalogueAccountGroup[] = [];
  for (const a of accountsOrder) {
    // Try new model first
    const campaignConfigs = plan.catalogueAccountConfigs?.[a.accountId];
    if (campaignConfigs && campaignConfigs.length > 0) {
      const activeCampaigns = campaignConfigs.filter(
        (c) => c.catalogId && c.productSetIds.length > 0
      );
      if (activeCampaigns.length === 0) continue;

      const firstCampaign = activeCampaigns[0];
      const catalog = getCatalog(firstCampaign.catalogId!);

      const adSets: CatalogueAdSetDerived[] = activeCampaigns.flatMap((c) => {
        const cat = getCatalog(c.catalogId!);
        return c.productSetIds.flatMap((psId) => {
          const ps = cat?.productSets.find((p) => p.id === psId);
          const base: CatalogueAdSetDerived = {
            productSetId: psId,
            productSetName: ps?.name ?? psId,
            cardCount: ps?.products.length ?? ps?.productCount ?? 0,
            products: ps?.products ?? [],
          };
          return Array.from({ length: c.adSetDuplicates || 1 }, () => base);
        });
      });

      if (adSets.length === 0) continue;

      accounts.push({
        accountId: a.accountId,
        accountName: a.accountName,
        catalogId: firstCampaign.catalogId!,
        catalogName: catalog?.name ?? "Catalog",
        campaigns: activeCampaigns.length,
        adSets,
      });
      continue;
    }

    // Fallback: old model (catalogSelections)
    const sel = plan.catalogSelections[a.accountId];
    if (!sel || !sel.catalogId || sel.productSetIds.length === 0) continue;
    const catalog = getCatalog(sel.catalogId);
    const adSets: CatalogueAdSetDerived[] = sel.productSetIds.map((psId) => {
      const ps = catalog?.productSets.find((p) => p.id === psId);
      return {
        productSetId: psId,
        productSetName: ps?.name ?? psId,
        cardCount: ps?.products.length ?? ps?.productCount ?? 0,
        products: ps?.products ?? [],
      };
    });
    accounts.push({
      accountId: a.accountId,
      accountName: a.accountName,
      catalogId: sel.catalogId,
      catalogName: catalog?.name ?? "Catalog",
      campaigns: 1,
      adSets,
    });
  }

  const totalAdSets = accounts.reduce((n, g) => n + g.adSets.length, 0);
  return {
    accounts,
    totalCampaigns: accounts.length,
    totalAdSets,
    totalAds: totalAdSets,
  };
}
