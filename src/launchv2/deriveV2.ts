/** Pure derivations for Launch v2 — ad counts (spread-aware), budget, 250-cap. */
import {
  MAX_ADS_PER_PAGE,
  type PageDistribution,
  type PlanV2,
  type ProductV2,
  type SpreadMode,
} from "./types";
import { pageActiveAds, getCatalog } from "./data";

/**
 * Effective creative units — `n_eff` (§1.1, fixes CD-11).
 *
 * Folds mix-match (`plan.combination` × loose multi-media + multi-text) into a
 * single creative-count so the number shown in `CombinationChooser` equals the
 * downstream cap-meter / budget / Review count.
 *
 *   media = max(plan.creatives.length, 1)
 *   texts = 1 + (non-empty textVariations)
 *   combinationActive = media > 1 && texts > 1
 *   n_eff = !combinationActive        → media
 *           combination === "all"     → media * texts
 *           else ("paired", default)  → max(media, texts)
 */
export function combinationUnits(plan: PlanV2): number {
  const media = Math.max(plan.creatives.length, 1);
  const texts = 1 + (plan.adCopy.textVariations?.filter((t) => t.trim().length > 0).length ?? 0);
  const combinationActive = media > 1 && texts > 1;
  if (!combinationActive) return media;
  if (plan.combination === "all") return media * texts;
  return Math.max(media, texts); // "paired" (default)
}

/** Ad sets produced (spread-aware, uses n_eff). */
export function adSetCount(plan: PlanV2): number {
  const n = combinationUnits(plan);
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

/** Ads produced per destination (spread-aware, uses n_eff). */
export function adsPerDestination(plan: PlanV2): number {
  const n = combinationUnits(plan);
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

/** Total ads requested (× targets if duplicating across pages). */
export function estimateAds(plan: PlanV2): number {
  const per = adsPerDestination(plan);
  const t = Math.max(plan.targets.length, 1);
  return plan.pageDistribution === "duplicate" ? per * t : per;
}

/** Daily budget. CBO = campaign budget; ABO = per ad set × ad sets. */
export function budgetPerDay(plan: PlanV2): number {
  const mult = plan.pageDistribution === "duplicate" ? Math.max(plan.targets.length, 1) : 1;
  if (plan.budgetMode === "CBO") return plan.budgetAmount * mult;
  return plan.budgetAmount * adSetCount(plan) * mult;
}

/**
 * Daily total to display in the launch confirm modal + Step 4 footer.
 * Mirrors `budgetPerDay` but written from scratch per the modal spec so any
 * future divergence stays explicit. CBO = campaign amount; ABO = amount × ad
 * sets; `duplicate` page distribution multiplies by the number of targets.
 */
export function dailyTotalBudget(plan: PlanV2): number {
  let base = plan.budgetAmount || 0;
  if (plan.budgetMode === "ABO") base *= adSetCount(plan);
  if (plan.pageDistribution === "duplicate") base *= Math.max(plan.targets.length, 1);
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

/** Ads each target receives, given page distribution (§1.3). */
export function perTargetCounts(plan: PlanV2): number[] {
  const per = adsPerDestination(plan);
  const n = plan.targets.length;
  if (n === 0) return [];
  if (plan.pageDistribution === "one_page") {
    // dedicated single-page branch: ALL D on the first target, 0 elsewhere.
    // breach (if D > free₁) surfaces via perPageDemand.over / placement.unplaceable —
    // never redistributed to other pages.
    return plan.targets.map((_, i) => (i === 0 ? per : 0));
  }
  if (plan.pageDistribution === "duplicate") return plan.targets.map(() => per);
  if (plan.pageDistribution === "equal") {
    const q = Math.floor(per / n);
    const r = per % n;
    return plan.targets.map((_, i) => q + (i < r ? 1 : 0));
  }
  if (plan.pageDistribution === "custom") {
    // custom: trust pageWeights authored by user (pageId → ad count); default 0 if unset
    return plan.targets.map((t) => plan.pageWeights[t.pageId] ?? 0);
  }
  // fill_first: greedily place D into pages in order, each capped at free(pg_i).
  // STOP at free — remainder is unplaceable, NOT dumped onto the last page (fixes CD cap-preventer bug).
  const caps = plan.targets.map((t) => Math.max(0, MAX_ADS_PER_PAGE - pageActiveAds(t.fbPageId)));
  let left = per;
  const out = plan.targets.map(() => 0);
  for (let i = 0; i < n && left > 0; i++) {
    const take = Math.min(caps[i], left);
    out[i] = take;
    left -= take;
  }
  // `left` (if > 0) is unplaceable — see placement().unplaceable. Do NOT redistribute.
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

/** Spread preview for Step 3's live mini-tree (creatives = n_eff, so tree matches cap-meter/budget). */
export function spreadPreview(plan: PlanV2): { creatives: number; adSets: number; adsPerDest: number; total: number } {
  return {
    creatives: combinationUnits(plan),
    adSets: adSetCount(plan),
    adsPerDest: adsPerDestination(plan),
    total: estimateAds(plan),
  };
}

/* ---- §5 Creative-fit (CD-01/02/03 source) ---- */

export interface CreativeFit {
  mode: SpreadMode;
  nEff: number;
  slots: number;
  empty: number;
  unused: number;
  uneven: { min: number; max: number } | null;
}

/**
 * How the effective creatives (`n_eff`) fit the structure's per-destination slots.
 * Feeds CD-01 (manual: empty slots), CD-02 (round_robin: unused creatives),
 * CD-03 (round_robin: uneven per ad set).
 *
 *   slots  = adsPerDestination(plan)  (D)
 *   empty  = manual      → max(0, D − n_eff)   (mapped creatives short of slots)
 *   unused = round_robin → max(0, n_eff − D)   (creatives that never place)
 *   uneven = round_robin & n_eff % adSets ≠ 0 → { min, max } per ad set, else null
 */
export function creativeFit(plan: PlanV2): CreativeFit {
  const nEff = combinationUnits(plan);
  const slots = adsPerDestination(plan);
  const mode = plan.spread;

  const empty = mode === "manual" ? Math.max(0, slots - nEff) : 0;
  const unused = mode === "round_robin" ? Math.max(0, nEff - slots) : 0;

  let uneven: { min: number; max: number } | null = null;
  if (mode === "round_robin") {
    const adSets = Math.max(adSetCount(plan), 1);
    if (nEff % adSets !== 0) {
      uneven = { min: Math.floor(nEff / adSets), max: Math.ceil(nEff / adSets) };
    }
  }

  return { mode, nEff, slots, empty, unused, uneven };
}

/* ---- §5 / §1.3 Placement (cap-respecting) ---- */

export interface Placement {
  method: PageDistribution;
  perPage: PageDemand[];
  requested: number; // = estimateAds
  placed: number;
  unplaceable: number; // cap-respecting remainder (PS-05/06/CC-01)
}

/**
 * Cap-respecting placement of demand onto unique pages (§1.3).
 *
 *   requested   = estimateAds(plan)
 *   placed      = Σ min(demand_i, free_i)      (what actually fits)
 *   unplaceable = fill_first → max(0, D − Σfree)
 *                 else       → Σ over breaches (demand_i − free_i)
 *
 * `fill_first` STOPs at each page's free slots — remainder is exposed as
 * `unplaceable`, never dumped onto the last page. `one_page` puts all D on the
 * first page; overflow there is unplaceable. Any `unplaceable > 0` is a launch
 * blocker, not a silent truncation.
 */
export function placement(plan: PlanV2): Placement {
  const method = plan.pageDistribution;
  const perPage = perPageDemand(plan); // unique pages, shared pages summed
  const requested = estimateAds(plan);

  let placed = 0;
  perPage.forEach((p) => {
    placed += Math.min(p.demand, p.available);
  });

  let unplaceable: number;
  if (method === "fill_first") {
    // aggregate-short: what the ordered greedy fill could not seat across all pages.
    const totalFree = perPage.reduce((s, p) => s + p.available, 0);
    unplaceable = Math.max(0, requested - totalFree);
  } else {
    // per-page breaches: each page's demand beyond its free slots.
    unplaceable = perPage.reduce((s, p) => s + Math.max(0, p.demand - p.available), 0);
  }

  return { method, perPage, requested, placed, unplaceable };
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
