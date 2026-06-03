/**
 * Bulk Launch Distribution — pure core (no React / no Supabase).
 *
 * Distribution targets are (Ad Account -> Page) PAIRS. The capacity cap of
 * MAX_ADS_PER_PAGE (250) active ads is keyed on the UNIQUE Facebook Page
 * identity (`fb_page_id`). The SAME `fb_page_id` linked under two different ad
 * accounts is ONE 250-slot bucket shared across those pairs — never two.
 *
 * ─── Axis distinction (IMPORTANT) ───────────────────────────────────────────
 * "Equal Distribution" in THIS file is the *ad -> page distribution* axis:
 * how a fixed set of selected ads is spread across (account, page) target
 * pairs. This is DIFFERENT from the existing "Round Robin" in
 * `src/hooks/use-adgroup-launch.ts`, which is the *item -> adset structure*
 * axis (how creative items rotate into adset rows within a launch hierarchy).
 * They are orthogonal and coexist — neither replaces the other.
 */

export type LaunchStrategy = "fill_first" | "equal" | "duplicate";

export const MAX_ADS_PER_PAGE = 250;

export interface TargetPair {
  ad_account_id: string;
  account_name: string;
  page_id: string; // internal id of the (account,page) link
  fb_page_id: string; // the Facebook Page identity — capacity is keyed on THIS
  page_name: string;
}

// A minimal ad shape the lib needs (callers map their LaunchAd -> this)
export interface DistAd {
  id: string;
  status: string;
  adset_id: string;
}

export interface DistAdset {
  id: string;
  budget_value: number | null;
  currency: string;
}

export interface StatusSplit {
  active: DistAd[];
  paused: DistAd[];
  unknown: DistAd[];
}

export interface PageCapacity {
  fb_page_id: string;
  currentActive: number;
} // available = 250 - currentActive

export interface PerPairAllocation {
  pair: TargetPair;
  activeToLaunch: number;
  pausedToAdd: number;
  status: "ok" | "partial" | "full";
}

export interface PerPageDemand {
  fb_page_id: string;
  page_name: string;
  currentActive: number;
  availableSlots: number;
  activeDemand: number; // total active ads targeted at this unique page
  status: "ok" | "over"; // over = demand > available
}

export interface StrategyValidation {
  available: boolean;
  reason?: string; // human-readable, names the offending page(s)
  perPair: PerPairAllocation[];
  perPageDemand: PerPageDemand[];
  excludedUnknown: number; // count of unknown-status ads dropped
}

export interface CurrencyBudget {
  currency: string;
  base: number;
  final: number;
  multiplier: number;
  unavailableAdsets: number;
}

// ─── Status split ────────────────────────────────────────────────────────────

/**
 * "active" -> active, "paused" -> paused, ANYTHING ELSE -> unknown.
 * Unknown-status ads are excluded from launch and are NEVER treated as paused.
 * Matching is case-insensitive / trimmed to tolerate upstream casing drift.
 */
export function splitByStatus(ads: DistAd[]): StatusSplit {
  const active: DistAd[] = [];
  const paused: DistAd[] = [];
  const unknown: DistAd[] = [];
  for (const ad of ads) {
    const s = (ad.status ?? "").trim().toLowerCase();
    if (s === "active") active.push(ad);
    else if (s === "paused") paused.push(ad);
    else unknown.push(ad);
  }
  return { active, paused, unknown };
}

// ─── Capacity aggregation ──────────────────────────────────────────────────────

/**
 * Collapse duplicate `fb_page_id`s to ONE bucket. Only pages referenced by a
 * target pair are included. If a capacity row is missing for a referenced
 * page, that page is treated as empty (currentActive = 0, full 250 available).
 * Duplicate capacity rows for the same fb_page_id resolve to the first seen.
 */
export function aggregateCapacityByPage(
  targetPairs: TargetPair[],
  capacities: PageCapacity[]
): Map<string, PageCapacity> {
  const capByPage = new Map<string, PageCapacity>();
  for (const cap of capacities) {
    if (!capByPage.has(cap.fb_page_id)) {
      capByPage.set(cap.fb_page_id, { fb_page_id: cap.fb_page_id, currentActive: cap.currentActive });
    }
  }
  const result = new Map<string, PageCapacity>();
  for (const pair of targetPairs) {
    if (result.has(pair.fb_page_id)) continue;
    const existing = capByPage.get(pair.fb_page_id);
    result.set(pair.fb_page_id, {
      fb_page_id: pair.fb_page_id,
      currentActive: existing ? existing.currentActive : 0,
    });
  }
  return result;
}

/** Remaining active slots for a page, clamped to >= 0. */
function availableFor(capByPage: Map<string, PageCapacity>, fbPageId: string): number {
  const cap = capByPage.get(fbPageId);
  const current = cap ? cap.currentActive : 0;
  return Math.max(0, MAX_ADS_PER_PAGE - current);
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

export function targetPairsCount(pairs: TargetPair[]): number {
  return pairs.length;
}

/** Distinct fb_page_id count across pairs. */
export function uniquePagesCount(pairs: TargetPair[]): number {
  return new Set(pairs.map((p) => p.fb_page_id)).size;
}

// ─── Fill First ──────────────────────────────────────────────────────────────

/**
 * Walk pairs in order; place active ads into each pair's page until that page's
 * REMAINING capacity (shared across pairs of the same fb_page_id) is exhausted,
 * overflowing to the next pair. Paused ads ride along in the same order (spread
 * evenly so a single pair does not hoard them) and never consume active slots.
 *
 * Per-pair status:
 *  - "full"    -> this pair wanted active ads (active still unplaced when we
 *                 arrived) but its page bucket had 0 slots, so it placed none.
 *  - "partial" -> this pair placed some active but not all that remained,
 *                 because its page bucket ran out mid-fill (overflow continues
 *                 to the next pair).
 *  - "ok"      -> placed everything it was asked for, or no active ads existed.
 */
export function fillFirst(
  statusSplit: StatusSplit,
  targetPairs: TargetPair[],
  capacities: PageCapacity[]
): PerPairAllocation[] {
  const capByPage = aggregateCapacityByPage(targetPairs, capacities);
  // Live remaining slots per unique page — shared across pairs.
  const remaining = new Map<string, number>();
  for (const [fbPageId] of capByPage) remaining.set(fbPageId, availableFor(capByPage, fbPageId));

  let activeLeft = statusSplit.active.length;
  const perPair: PerPairAllocation[] = [];

  for (const pair of targetPairs) {
    const slots = remaining.get(pair.fb_page_id) ?? 0;
    const wantedActive = activeLeft; // all remaining active "wants" this pair
    const take = Math.min(activeLeft, slots);
    remaining.set(pair.fb_page_id, slots - take);
    activeLeft -= take;

    let status: "ok" | "partial" | "full";
    if (wantedActive === 0) status = "ok"; // nothing left to place
    else if (take === 0) status = "full"; // wanted active but page bucket empty
    else if (take < wantedActive) status = "partial"; // placed some, overflow continues
    else status = "ok"; // placed all remaining active

    perPair.push({ pair, activeToLaunch: take, pausedToAdd: 0, status });
  }

  // Paused ride along: spread evenly across pairs in target order (tie ->
  // earliest) so they trail the active fill without ever consuming active slots.
  distributePausedAlong(perPair, statusSplit.paused.length);

  return perPair;
}

/** Evenly spread paused ads across pairs in target order (tie -> earliest). */
function distributePausedAlong(perPair: PerPairAllocation[], totalPaused: number): void {
  const n = perPair.length;
  if (n === 0) return;
  const base = Math.floor(totalPaused / n);
  const extra = totalPaused % n;
  for (let i = 0; i < n; i++) {
    perPair[i].pausedToAdd = base + (i < extra ? 1 : 0);
  }
}

// ─── Equal Distribute ──────────────────────────────────────────────────────────

/**
 * Split TOTAL ads (active + paused) as evenly as possible across pairs.
 * Tie-break: extra ad(s) go to the EARLIEST pairs in target order.
 * Active ads are placed first into each pair's quota, then paused fill the rest;
 * active demand is validated per unique page in validateStrategy.
 */
export function equalDistribute(
  statusSplit: StatusSplit,
  targetPairs: TargetPair[],
  _capacities: PageCapacity[]
): PerPairAllocation[] {
  const n = targetPairs.length;
  const perPair: PerPairAllocation[] = [];
  if (n === 0) return perPair;

  const totalActive = statusSplit.active.length;
  const totalPaused = statusSplit.paused.length;
  const total = totalActive + totalPaused;

  const base = Math.floor(total / n);
  const extra = total % n;

  let activeLeft = totalActive;
  let pausedLeft = totalPaused;

  for (let i = 0; i < n; i++) {
    const quota = base + (i < extra ? 1 : 0);
    // Active fills the quota first, paused takes the remainder of the quota.
    const activeTake = Math.min(activeLeft, quota);
    activeLeft -= activeTake;
    const pausedTake = Math.min(pausedLeft, quota - activeTake);
    pausedLeft -= pausedTake;
    perPair.push({
      pair: targetPairs[i],
      activeToLaunch: activeTake,
      pausedToAdd: pausedTake,
      status: "ok",
    });
  }

  return perPair;
}

// ─── Duplicate To Each ───────────────────────────────────────────────────────

/**
 * Every pair gets ALL active ads (+ all paused). A unique page appearing in N
 * pairs therefore needs activeCount x N slots on that one shared bucket.
 */
export function duplicateToEach(
  statusSplit: StatusSplit,
  targetPairs: TargetPair[],
  _capacities: PageCapacity[]
): PerPairAllocation[] {
  const activeCount = statusSplit.active.length;
  const pausedCount = statusSplit.paused.length;
  return targetPairs.map((pair) => ({
    pair,
    activeToLaunch: activeCount,
    pausedToAdd: pausedCount,
    status: "ok",
  }));
}

// ─── Dispatcher ────────────────────────────────────────────────────────────────

export function distribute(
  strategy: LaunchStrategy,
  statusSplit: StatusSplit,
  targetPairs: TargetPair[],
  capacities: PageCapacity[]
): PerPairAllocation[] {
  switch (strategy) {
    case "fill_first":
      return fillFirst(statusSplit, targetPairs, capacities);
    case "equal":
      return equalDistribute(statusSplit, targetPairs, capacities);
    case "duplicate":
      return duplicateToEach(statusSplit, targetPairs, capacities);
    default: {
      const _exhaustive: never = strategy;
      return _exhaustive;
    }
  }
}

// ─── Strategy validation ─────────────────────────────────────────────────────

/**
 * Runs the allocation, computes per-page demand, and decides availability.
 *
 *  - 0 pairs                      -> unavailable, "Select at least one Page".
 *  - 0 active ads                 -> available (paused never block).
 *  - Fill First                   -> Σ available across unique pages ≥ active count.
 *  - Equal (base/extra split)     -> every pair gets ≥ base, and active fits per
 *                                    unique page (requested active per page ≤ available).
 *  - Duplicate                    -> every unique page has available ≥ activeCount × (pairs sharing it).
 *
 * `reason` names the over-capacity page(s) when any page's active demand exceeds
 * its available slots.
 */
export function validateStrategy(
  strategy: LaunchStrategy,
  statusSplit: StatusSplit,
  targetPairs: TargetPair[],
  capacities: PageCapacity[]
): StrategyValidation {
  const excludedUnknown = statusSplit.unknown.length;

  if (targetPairs.length === 0) {
    return {
      available: false,
      reason: "Select at least one Page",
      perPair: [],
      perPageDemand: [],
      excludedUnknown,
    };
  }

  const capByPage = aggregateCapacityByPage(targetPairs, capacities);
  const perPair = distribute(strategy, statusSplit, targetPairs, capacities);

  // Per-page ACTIVE demand under the strategy. For equal/duplicate this is the
  // demand BEFORE capacity clamping (so per-page over-capacity is detectable).
  // For fill_first it is the placed (capacity-aware) active per page — fill_first
  // overflows across pages, so its binding constraint is the GLOBAL Σ check
  // below, never a single page's per-page demand.
  const requestedActiveByPage = computeRequestedActivePerPage(strategy, statusSplit, targetPairs, capacities);

  const perPageDemand: PerPageDemand[] = [];
  const overPages: string[] = [];
  for (const pair of dedupePairsByPage(targetPairs)) {
    const fbId = pair.fb_page_id;
    const cap = capByPage.get(fbId);
    const currentActive = cap ? cap.currentActive : 0;
    const availableSlots = Math.max(0, MAX_ADS_PER_PAGE - currentActive);
    const activeDemand = requestedActiveByPage.get(fbId) ?? 0;
    // fill_first never flags per-page over (placed <= available by construction);
    // its shortfall is caught by the global Σ-available check.
    const isOver = strategy !== "fill_first" && activeDemand > availableSlots;
    if (isOver) overPages.push(pair.page_name);
    perPageDemand.push({
      fb_page_id: fbId,
      page_name: pair.page_name,
      currentActive,
      availableSlots,
      activeDemand,
      status: isOver ? "over" : "ok",
    });
  }

  const totalActive = statusSplit.active.length;

  // 0 active -> always available regardless of capacity.
  if (totalActive === 0) {
    return { available: true, perPair, perPageDemand, excludedUnknown };
  }

  let available = true;
  let reason: string | undefined;

  if (overPages.length > 0) {
    available = false;
    reason = capacityReason(overPages);
  } else if (strategy === "fill_first") {
    // Σ available across unique pages ≥ active count. (Fill First overflows
    // across pages, so the binding constraint is the GLOBAL sum, not any single
    // page — but we still name the full page(s) that caused the shortfall.)
    let totalAvailable = 0;
    for (const [, cap] of capByPage) totalAvailable += Math.max(0, MAX_ADS_PER_PAGE - cap.currentActive);
    if (totalAvailable < totalActive) {
      available = false;
      const fullPageNames = dedupePairsByPage(targetPairs)
        .filter((p) => Math.max(0, MAX_ADS_PER_PAGE - (capByPage.get(p.fb_page_id)?.currentActive ?? 0)) === 0)
        .map((p) => p.page_name);
      const namePart = fullPageNames.length > 0 ? ` Full: ${Array.from(new Set(fullPageNames)).map((n) => `"${n}"`).join(", ")}.` : "";
      reason = `Not enough capacity: ${totalAvailable} active slot${totalAvailable === 1 ? "" : "s"} across selected Pages, but ${totalActive} active ad${totalActive === 1 ? "" : "s"} to launch.${namePart}`;
    }
  }
  // Equal & Duplicate per-page constraints are fully captured by overPages above:
  //  - Equal: requested active per unique page = its even share of active ads.
  //  - Duplicate: requested active per unique page = activeCount × pairs sharing it.

  return { available, reason, perPair, perPageDemand, excludedUnknown };
}

/** Build a human-readable reason naming over-capacity pages. */
function capacityReason(pageNames: string[]): string {
  const unique = Array.from(new Set(pageNames));
  if (unique.length === 1) {
    return `Page "${unique[0]}" is over capacity (needs more than its available 250-ad limit allows).`;
  }
  const list = unique.map((n) => `"${n}"`).join(", ");
  return `${unique.length} Pages are over capacity: ${list}. Each Facebook Page allows max ${MAX_ADS_PER_PAGE} active ads.`;
}

/** First pair seen per unique fb_page_id, preserving target order. */
function dedupePairsByPage(targetPairs: TargetPair[]): TargetPair[] {
  const seen = new Set<string>();
  const out: TargetPair[] = [];
  for (const pair of targetPairs) {
    if (seen.has(pair.fb_page_id)) continue;
    seen.add(pair.fb_page_id);
    out.push(pair);
  }
  return out;
}

/**
 * Requested ACTIVE ads per unique fb_page_id under a strategy, BEFORE capacity
 * clamping — this is what we validate against each page's available slots.
 *
 *  - fill_first: all active ads ultimately target the selected pages as one
 *    shared pool; per-page "requested" is the active that would land on that
 *    page if pages filled in order. For validation we instead check the GLOBAL
 *    sum (handled in validateStrategy) and per-page over only when a single
 *    page is asked to exceed its own slots — which for fill_first happens only
 *    if active > that page's slots AND it is the sole page. To keep per-page
 *    demand meaningful we report the placed active per page (post-fill).
 *  - equal: each unique page's requested active = sum over its pairs of the
 *    active share assigned to those pairs by the even split.
 *  - duplicate: each unique page's requested active = activeCount × (#pairs
 *    sharing that page).
 */
function computeRequestedActivePerPage(
  strategy: LaunchStrategy,
  statusSplit: StatusSplit,
  targetPairs: TargetPair[],
  capacities: PageCapacity[]
): Map<string, number> {
  const byPage = new Map<string, number>();
  const activeCount = statusSplit.active.length;

  if (strategy === "duplicate") {
    const pairsPerPage = new Map<string, number>();
    for (const pair of targetPairs) pairsPerPage.set(pair.fb_page_id, (pairsPerPage.get(pair.fb_page_id) ?? 0) + 1);
    for (const [fbId, count] of pairsPerPage) byPage.set(fbId, activeCount * count);
    return byPage;
  }

  if (strategy === "equal") {
    // Even split of TOTAL across pairs, but only the ACTIVE portion is what
    // each pair contributes to its page's active demand. Active fills the
    // earliest pairs' quotas first (same order equalDistribute uses), so we
    // replay that placement to get per-pair active, then sum per page.
    const perPair = equalDistribute(statusSplit, targetPairs, []);
    for (const alloc of perPair) {
      byPage.set(alloc.pair.fb_page_id, (byPage.get(alloc.pair.fb_page_id) ?? 0) + alloc.activeToLaunch);
    }
    return byPage;
  }

  // fill_first: report placed active per page (post-fill, capacity-aware, using
  // the REAL capacities). Placement never exceeds a page's slots, so per-page
  // "over" is never flagged for fill_first; the global Σ-available check in
  // validateStrategy is the authority for fill_first shortfalls.
  const perPair = fillFirst(statusSplit, targetPairs, capacities);
  for (const alloc of perPair) {
    byPage.set(alloc.pair.fb_page_id, (byPage.get(alloc.pair.fb_page_id) ?? 0) + alloc.activeToLaunch);
  }
  return byPage;
}

// ─── Output count ──────────────────────────────────────────────────────────────

/**
 * fill_first / equal -> selectedAdCount (the same ads are spread across pairs).
 * duplicate          -> selectedAdCount × targetPairsCount (copied into each pair).
 */
export function computeOutputCount(
  strategy: LaunchStrategy,
  selectedAdCount: number,
  targetPairsCount: number
): number {
  if (strategy === "duplicate") return selectedAdCount * targetPairsCount;
  return selectedAdCount;
}

// ─── Budget by currency ──────────────────────────────────────────────────────

/**
 * Sum DISTINCT parent adset budgets per currency.
 *  - Dedupe adsets by adset_id (an ad's parent adset is counted once even if
 *    multiple selected ads share it).
 *  - An adset with null or zero budget is counted in `unavailableAdsets` and
 *    excluded from `base`.
 *  - `final = base × multiplier`; multiplier = duplicate ? targetPairsCount : 1.
 *  - Never sum across currencies — exactly one entry per distinct currency.
 */
export function budgetByCurrency(
  selectedAds: DistAd[],
  adsets: DistAdset[],
  strategy: LaunchStrategy,
  targetPairsCount: number
): CurrencyBudget[] {
  const adsetById = new Map<string, DistAdset>();
  for (const a of adsets) adsetById.set(a.id, a);

  // Distinct parent adset ids referenced by the selected ads.
  const parentAdsetIds = new Set<string>();
  for (const ad of selectedAds) {
    if (ad.adset_id) parentAdsetIds.add(ad.adset_id);
  }

  const multiplier = strategy === "duplicate" ? targetPairsCount : 1;

  // currency -> { base, unavailableAdsets }
  const byCurrency = new Map<string, { base: number; unavailableAdsets: number }>();

  for (const adsetId of parentAdsetIds) {
    const adset = adsetById.get(adsetId);
    if (!adset) continue; // referenced adset not provided — skip silently
    const currency = adset.currency;
    if (!byCurrency.has(currency)) byCurrency.set(currency, { base: 0, unavailableAdsets: 0 });
    const bucket = byCurrency.get(currency)!;
    const budget = adset.budget_value;
    if (budget == null || budget <= 0) {
      bucket.unavailableAdsets += 1;
    } else {
      bucket.base += budget;
    }
  }

  const result: CurrencyBudget[] = [];
  for (const [currency, { base, unavailableAdsets }] of byCurrency) {
    result.push({
      currency,
      base,
      final: base * multiplier,
      multiplier,
      unavailableAdsets,
    });
  }
  return result;
}
