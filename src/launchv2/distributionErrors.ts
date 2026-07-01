/**
 * Launch v2 · Step 3 — Distribution error engine (STEP3_ERROR_MODEL.md §5.1 + catalog §3).
 *
 * SINGLE SOURCE OF TRUTH for the page-split / creative-distribution / cap-meter
 * error families. Pure — consumed by inline slots (per-control), the cap-meter
 * mirror, `reviewModel.buildIssues`, and `preflight`. Every code emitted here maps
 * back to the handoff catalog (PS-* / CD-* / CC-* codes).
 *
 * All math is derived from the ACTUAL deriveV2 signatures — never re-implemented:
 *   placement()       → cap-respecting page demand vs free slots (§1.3)
 *   creativeFit()     → n_eff fit into structure slots (CD-01/02/03)
 *   combinationUnits()→ n_eff (§1.1)
 */
import {
  combinationUnits,
  creativeFit,
  placement,
  type PageDemand,
} from "./deriveV2";
import {
  MAX_ADS_PER_PAGE,
  type PageDistribution,
  type PlanV2,
  type SpreadMode,
} from "./types";
import { pageActiveAds } from "./data";

/* ------------------------------------------------------------------ *
 * §5.1 contract types
 * ------------------------------------------------------------------ */

export type DistTier = "error" | "warning" | "info";

export type DistAnchor =
  | "pageSplit"
  | "creativeDist"
  | "structure"
  | "combination"
  | "capMeter"
  | "accounts"
  | string /* fbPageId for page-scoped */;

export type DistFixKind =
  | "use_suggested"
  | "switch_distribution"
  | "switch_spread"
  | "auto_balance"
  | "auto_map"
  | "add_page"
  | "split_launch"
  | "reduce_structure"
  | "reduce_combos"
  | "change_page"
  | "acknowledge"
  | "retry"
  | "goto"
  | "none";

export interface DistFix {
  label: string;
  kind: DistFixKind;
  /** for switch_distribution / use_suggested */
  distribution?: PageDistribution;
  /** for switch_spread */
  spread?: SpreadMode;
  goto?: "accounts" | "step3" | "health";
}

export interface DistError {
  /** unique instance, e.g. `ps:equal-overflow:${fbPageId}` */
  id: string;
  /** catalog code: "PS-04", "CD-01", … (maps to deliverable) */
  code: string;
  tier: DistTier;
  /** where the inline slot renders */
  anchor: DistAnchor;
  title: string;
  /** interpolated, specific, no blame */
  message: string;
  fixes: DistFix[];
  /** [I] cross-account caveat (PS-10 / PS-13) */
  provisional?: boolean;
}

/* ------------------------------------------------------------------ *
 * Fix presets (Nielsen #9 — never a dead-end; specific labels)
 * ------------------------------------------------------------------ */

const FIX = {
  useSuggested: (): DistFix => ({ label: "Use suggested spread", kind: "use_suggested" }),
  switchDistribution: (to: PageDistribution, label: string): DistFix => ({
    label,
    kind: "switch_distribution",
    distribution: to,
  }),
  switchSpread: (to: SpreadMode, label: string): DistFix => ({
    label,
    kind: "switch_spread",
    spread: to,
  }),
  autoBalance: (): DistFix => ({ label: "Auto-balance", kind: "auto_balance" }),
  autoMap: (): DistFix => ({ label: "Auto-map creatives", kind: "auto_map" }),
  addPage: (): DistFix => ({ label: "Add a Page", kind: "add_page" }),
  splitLaunch: (): DistFix => ({ label: "Split into two launches", kind: "split_launch" }),
  reduceStructure: (): DistFix => ({ label: "Reduce structure", kind: "reduce_structure" }),
  reduceCombos: (): DistFix => ({ label: "Switch to paired", kind: "reduce_combos" }),
  changePage: (): DistFix => ({ label: "Change Page", kind: "change_page" }),
  acknowledge: (label = "Acknowledge"): DistFix => ({ label, kind: "acknowledge" }),
  retry: (): DistFix => ({ label: "Retry", kind: "retry" }),
  gotoAccounts: (): DistFix => ({ label: "Go to Accounts", kind: "goto", goto: "accounts" }),
  gotoHealth: (): DistFix => ({ label: "Open account health", kind: "goto", goto: "health" }),
  gotoStep3: (): DistFix => ({ label: "Re-balance in Step 3", kind: "goto", goto: "step3" }),
} as const;

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

/** free = 250 − activeAds, pre-demand (one canonical value; §4.4). */
function freeOf(fbPageId: string): number {
  return Math.max(0, MAX_ADS_PER_PAGE - pageActiveAds(fbPageId));
}

/** unique pages (shared fbPageIds summed) — the placement() page list. */
function uniquePages(plan: PlanV2): PageDemand[] {
  return placement(plan).perPage;
}

/** how many selected accounts sit on each fbPageId (for PS-14). */
function accountsPerPage(plan: PlanV2): Map<string, Set<string>> {
  const m = new Map<string, Set<string>>();
  for (const t of plan.targets) {
    const s = m.get(t.fbPageId) ?? new Set<string>();
    s.add(t.accountId);
    m.set(t.fbPageId, s);
  }
  return m;
}

/** number of ad sets per destination (for CD-03 pass-through in messages). */
function texts(plan: PlanV2): number {
  return 1 + (plan.adCopy.textVariations?.filter((t) => t.trim().length > 0).length ?? 0);
}

function media(plan: PlanV2): number {
  return Math.max(plan.creatives.length, 1);
}

const CATALOGUE_MODE = (plan: PlanV2): boolean =>
  plan.catalogueToggle || plan.format === "dpa";

/* ------------------------------------------------------------------ *
 * §3A — Page-split family
 * ------------------------------------------------------------------ */

function pageSplitErrors(plan: PlanV2): DistError[] {
  const out: DistError[] = [];

  // PS-01 — no page selected.
  if (plan.targets.length === 0) {
    out.push({
      id: "ps:no-page",
      code: "PS-01",
      tier: "error",
      anchor: "accounts",
      title: "No Page selected",
      message: "Select at least one Page to continue.",
      fixes: [FIX.gotoAccounts()],
    });
    // Nothing else can be computed without targets.
    return out;
  }

  const pl = placement(plan);
  const pages = pl.perPage;
  const method = plan.pageDistribution;
  // perDest = per-destination demand (before page split); used for one_page/PS-03
  // and PS-08/PS-12 totals. Per-page landed counts come from placement().perPage.
  const perDest = adsPerDest(plan);

  // PS-02 — a selected page is fully saturated (0 free).
  for (const p of pages) {
    if (p.available === 0) {
      out.push({
        id: `ps:full:${p.fbPageId}`,
        code: "PS-02",
        tier: "error",
        anchor: p.fbPageId,
        title: "Page at its ad limit",
        message: `Page ${p.pageName} is at its 250-ad limit — 0 slots left.`,
        fixes: [FIX.changePage(), FIX.addPage()],
      });
    }
  }

  // PS-14 — same fbPageId under ≥2 selected accounts (shared 250 cap).
  const apk = accountsPerPage(plan);
  for (const p of pages) {
    const k = apk.get(p.fbPageId)?.size ?? 1;
    if (k >= 2) {
      out.push({
        id: `ps:shared-page:${p.fbPageId}`,
        code: "PS-14",
        tier: "warning",
        anchor: p.fbPageId,
        title: "Page shared across accounts",
        message: `Page ${p.pageName} is selected under ${k} accounts — their ads share the same 250 cap.`,
        fixes: [FIX.acknowledge("Dedupe / keep"), FIX.acknowledge()],
      });
    }
  }

  // Method-specific placement breaches.
  if (method === "one_page") {
    // PS-03 — one_page & D > free₁. Demand is all on targets[0]'s page.
    const first = pages[0];
    if (first && perDest > first.available) {
      out.push({
        id: `ps:one-page-overflow:${first.fbPageId}`,
        code: "PS-03",
        tier: "error",
        anchor: "pageSplit",
        title: "Single Page can't hold this launch",
        message: `Page ${first.pageName} has ${first.available} slots; this launch needs ${perDest} ads.`,
        fixes: [FIX.useSuggested(), FIX.addPage(), FIX.reduceStructure()],
      });
    }
  } else if (method === "equal") {
    // PS-04 — equal & ∃ share_i > free_i (per-page breach).
    for (const p of pages) {
      if (p.demand > p.available) {
        out.push({
          id: `ps:equal-overflow:${p.fbPageId}`,
          code: "PS-04",
          tier: "error",
          anchor: p.fbPageId,
          title: "Equal split overflows a Page",
          message: `Split Equally puts ${p.demand} ads on ${p.pageName}, but it has only ${p.available} slots.`,
          fixes: [FIX.useSuggested(), FIX.changePage(), FIX.autoBalance()],
        });
      }
    }
    // PS-12 — equal & D % p ≠ 0 (info: remainder placement).
    const p = pages.length;
    if (p > 1 && perDest % p !== 0) {
      const q = Math.floor(perDest / p);
      const splitStr = `${q}–${q + 1} per Page`;
      out.push({
        id: "ps:equal-remainder",
        code: "PS-12",
        tier: "info",
        anchor: "pageSplit",
        title: "Uneven equal split",
        message: `${perDest} ads / ${p} Pages → ${splitStr}. Remainder goes to the Page with most room.`,
        fixes: [],
      });
    }
  } else if (method === "custom") {
    // PS-07 — custom & weight_i > free_i (field-level).
    for (const p of pages) {
      if (p.demand > p.available) {
        out.push({
          id: `ps:custom-over:${p.fbPageId}`,
          code: "PS-07",
          tier: "error",
          anchor: p.fbPageId,
          title: "Custom weight exceeds free slots",
          message: `Max ${p.available} for ${p.pageName} — that's its free slots.`,
          fixes: [FIX.autoBalance()],
        });
      }
    }
    // PS-08 — custom & Σweights ≠ D.
    const assigned = pages.reduce((s, p) => s + p.demand, 0);
    if (assigned !== perDest) {
      const diff = Math.abs(perDest - assigned);
      const dir = assigned > perDest ? "over" : "under";
      out.push({
        id: "ps:custom-sum",
        code: "PS-08",
        tier: "error",
        anchor: "pageSplit",
        title: "Custom weights don't add up",
        message: `You've assigned ${assigned} of ${perDest} ads — ${diff} ${dir}.`,
        fixes: [FIX.autoBalance()],
      });
    }
  } else if (method === "fill_first") {
    // PS-05 — aggregate short across all pages (fill_first).
    if (pl.unplaceable > 0) {
      const totalFree = pages.reduce((s, p) => s + p.available, 0);
      out.push({
        id: "ps:fill-first-short",
        code: "PS-05",
        tier: "error",
        anchor: "pageSplit",
        title: "Not enough free slots",
        message: `Selected pages have ${totalFree} free slots; launch needs ${pl.requested}. ${pl.unplaceable} won't fit.`,
        fixes: [FIX.addPage(), FIX.reduceStructure(), FIX.splitLaunch()],
      });
    }
  } else if (method === "duplicate") {
    // PS-DUP — duplicate & p > 1: full D on every page, count + spend ×p.
    const p = pages.length;
    if (p > 1) {
      out.push({
        id: "ps:duplicate",
        code: "PS-DUP",
        tier: "warning",
        anchor: "pageSplit",
        title: "Duplicate multiplies count and spend",
        message: `Duplicate runs the full ${perDest} ads on each of ${p} Pages — ad count and spend ×${p}.`,
        fixes: [FIX.acknowledge(), FIX.switchDistribution("equal", "Switch to Equal")],
      });
    }
    // duplicate per-page breaches surface via PS-06 / CC-01 (cross-cutting).
  }

  // PS-06 — even optimally spread, still unplaceable. Independent of the current
  // method: if the SMART suggested spread still cannot seat everything, the pages
  // simply don't have room. Only meaningful for non-fill_first breaches or when
  // fill_first is already short (PS-05 covers the fill_first sum, PS-06 is the
  // "no method helps" escalation).
  const bestUnplaceable = unplaceableUnder(plan, suggestedDistribution(plan));
  if (bestUnplaceable > 0) {
    const totalFree = pages.reduce((s, p) => s + p.available, 0);
    out.push({
      id: "ps:best-fit-short",
      code: "PS-06",
      tier: "error",
      anchor: "capMeter",
      title: "Pages are out of room",
      message: `Even optimally spread, ${bestUnplaceable} ads exceed your pages' ${totalFree} free slots.`,
      fixes: [FIX.addPage(), FIX.reduceStructure()],
    });
  }

  // PS-10 — provisional: free-slot read unavailable for a page. (Mock always
  // returns a number, so this never fires today, but the branch is wired so
  // real API integration only has to flip the predicate.)
  for (const p of pages) {
    if (slotReadUnavailable(p.fbPageId)) {
      out.push({
        id: `ps:slot-unknown:${p.fbPageId}`,
        code: "PS-10",
        tier: "warning",
        anchor: p.fbPageId,
        title: "Couldn't read remaining slots",
        message: `Couldn't check ${p.pageName}'s remaining slots right now.`,
        fixes: [FIX.retry(), FIX.acknowledge("Re-check at Review")],
        provisional: true,
      });
    }
  }

  // PS-11 — page on restricted / disabled account.
  for (const p of pages) {
    if (accountRestricted(plan, p.fbPageId)) {
      out.push({
        id: `ps:restricted:${p.fbPageId}`,
        code: "PS-11",
        tier: "error",
        anchor: p.fbPageId,
        title: "Page on a restricted account",
        message: `Page ${p.pageName} is on a restricted account — can't launch now.`,
        fixes: [FIX.gotoHealth(), FIX.changePage()],
      });
    }
  }

  // PS-13 — provisional: multi-account / shared, aggregation unverified.
  const multiAccount = new Set(plan.targets.map((t) => t.accountId)).size > 1;
  const anyShared = [...apk.values()].some((s) => s.size >= 2);
  if (multiAccount || anyShared) {
    out.push({
      id: "ps:cross-account-caveat",
      code: "PS-13",
      tier: "warning",
      anchor: "capMeter",
      title: "Slots are per-Page only",
      message:
        "Slots shown are per Page; other accounts on this Page may lower real headroom.",
      fixes: [],
      provisional: true,
    });
  }

  return out;
}

/* ------------------------------------------------------------------ *
 * §3B — Creative-distribution family
 * ------------------------------------------------------------------ */

function creativeDistErrors(plan: PlanV2): DistError[] {
  const out: DistError[] = [];

  // CD-07 (info) — catalogue/DPA: count comes from product set, bypass creative
  // checks entirely.
  if (CATALOGUE_MODE(plan)) {
    out.push({
      id: "cd:catalogue",
      code: "CD-07",
      tier: "info",
      anchor: "creativeDist",
      title: "Catalogue ads are dynamic",
      message:
        "Catalogue ads are dynamic — ad count comes from the product set, not creatives.",
      fixes: [],
    });
    return out; // creative-slot checks don't apply in catalogue mode.
  }

  const fit = creativeFit(plan);
  const spread: SpreadMode = plan.spread;
  const D = fit.slots;
  const nEff = fit.nEff;

  // CD-01 — manual mapping short of D slots → empty slots.
  if (spread === "manual" && fit.empty > 0) {
    out.push({
      id: "cd:manual-empty",
      code: "CD-01",
      tier: "error",
      anchor: "creativeDist",
      title: "Structure has empty slots",
      message: `Structure needs ${D} ads but only ${nEff} slots are mapped — ${fit.empty} empty.`,
      fixes: [FIX.autoMap(), FIX.reduceStructure()],
    });
  }

  // CD-02 — round_robin & n_eff > D → some creatives never placed.
  if (spread === "round_robin" && fit.unused > 0) {
    out.push({
      id: "cd:round-robin-unused",
      code: "CD-02",
      tier: "warning",
      anchor: "creativeDist",
      title: "Some creatives won't be used",
      message: `You added ${nEff} creatives but structure has ${D} slots — ${fit.unused} unused.`,
      fixes: [
        FIX.switchSpread("multiply", "Switch spread to Multiply"),
        FIX.reduceStructure(),
      ],
    });
  }

  // CD-03 — round_robin & n_eff % adSets ≠ 0 → uneven per ad set.
  if (spread === "round_robin" && fit.uneven) {
    out.push({
      id: "cd:round-robin-uneven",
      code: "CD-03",
      tier: "warning",
      anchor: "creativeDist",
      title: "Uneven creative spread",
      message: `${nEff} creatives across ad sets isn't even — some get ${fit.uneven.max}, others ${fit.uneven.min}.`,
      fixes: [FIX.autoBalance(), FIX.acknowledge()],
    });
  }

  // CD-04 / CD-05 — carousel card bounds (2–10).
  if (plan.format === "carousel") {
    const cards = plan.carouselCards.length;
    if (cards < 2) {
      out.push({
        id: "cd:carousel-min",
        code: "CD-04",
        tier: "error",
        anchor: "creativeDist",
        title: "Carousel needs more cards",
        message: `Carousel needs at least 2 cards; this ad has ${cards}.`,
        fixes: [FIX.acknowledge("Add cards"), FIX.acknowledge("Switch format")],
      });
    } else if (cards > 10) {
      out.push({
        id: "cd:carousel-max",
        code: "CD-05",
        tier: "error",
        anchor: "creativeDist",
        title: "Too many carousel cards",
        message: `Carousel allows max 10 cards; you have ${cards}.`,
        fixes: [FIX.acknowledge("Remove cards")],
      });
    }
  }

  // CD-06 — flexible assets outside 1–10.
  if (plan.format === "flexible") {
    const assets = plan.creatives.length;
    if (assets < 1 || assets > 10) {
      out.push({
        id: "cd:flexible-bounds",
        code: "CD-06",
        tier: "error",
        anchor: "creativeDist",
        title: "Flexible asset count out of range",
        message: `Flexible ads take 1–10 assets; you added ${assets}.`,
        fixes: [FIX.acknowledge("Add / remove assets"), FIX.acknowledge("Switch format")],
      });
    }
  }

  // CD-08 — post-ID: selected posts < D slots.
  const postCounts = Object.values(plan.postIdsByAccount ?? {});
  const anyPostAccount = Object.values(plan.useExistingPostByAccount ?? {}).some(Boolean);
  if (anyPostAccount) {
    for (const [accountId, useIt] of Object.entries(plan.useExistingPostByAccount ?? {})) {
      if (!useIt) continue;
      const posts = plan.postIdsByAccount?.[accountId]?.length ?? 0;
      if (posts < D) {
        out.push({
          id: `cd:post-short:${accountId}`,
          code: "CD-08",
          tier: "error",
          anchor: "creativeDist",
          title: "Not enough posts selected",
          message: `Structure expects ${D} ads but you picked ${posts} posts.`,
          fixes: [FIX.acknowledge("Pick more posts"), FIX.reduceStructure()],
        });
      }
    }
  }
  void postCounts;

  // CD-11 — combination "all": n_eff = media × texts spikes count / budget.
  // Use combinationUnits() as the authoritative n_eff so the shown count equals
  // the downstream cap-meter / budget count exactly (§1.1).
  const m = media(plan);
  const t = texts(plan);
  if (plan.combination === "all" && m > 1 && t > 1) {
    const nAll = combinationUnits(plan); // = m * t when "all" is active
    out.push({
      id: "cd:combination-all",
      code: "CD-11",
      tier: "warning",
      anchor: "combination",
      title: "Combination expands the ad count",
      message: `${t} texts × ${m} creatives = ${nAll} ads. That may exceed slots or budget.`,
      fixes: [FIX.reduceCombos(), FIX.acknowledge("Confirm")],
    });
  }

  // CD-12 — launch mixes distinct ad formats.
  const formats = new Set(plan.creatives.map((c) => c.format).filter(Boolean));
  if (formats.size >= 2) {
    const types = [...formats].join(", ");
    out.push({
      id: "cd:mixed-formats",
      code: "CD-12",
      tier: "warning",
      anchor: "creativeDist",
      title: "Launch mixes ad formats",
      message: `This launch mixes ${types} — some may need separate launches.`,
      fixes: [FIX.splitLaunch(), FIX.acknowledge()],
    });
  }

  return out;
}

/* ------------------------------------------------------------------ *
 * §3C — Cross-cutting family (cap-meter / Review)
 * ------------------------------------------------------------------ */

function crossCuttingErrors(plan: PlanV2): DistError[] {
  const out: DistError[] = [];
  if (plan.targets.length === 0) return out;

  const pl = placement(plan);
  const totalFree = pl.perPage.reduce((s, p) => s + p.available, 0);

  // CC-01 — final count (after n_eff + page dist) > Σfree.
  if (pl.requested > totalFree) {
    out.push({
      id: "cc:final-over",
      code: "CC-01",
      tier: "error",
      anchor: "capMeter",
      title: "Final count exceeds free slots",
      message: `Final count ${pl.requested} exceeds free slots ${totalFree} once creatives expand.`,
      fixes: [FIX.reduceStructure(), FIX.addPage()],
    });
  }

  // CC-02 — total × per-unit budget crosses a spend-attention threshold.
  const dailyEst = estDailyBudget(plan);
  if (dailyEst > CC02_BUDGET_THRESHOLD) {
    out.push({
      id: "cc:budget-attention",
      code: "CC-02",
      tier: "warning",
      anchor: "capMeter",
      title: "High estimated spend",
      message: `Count is now ${pl.requested} ads → est. daily ₹${dailyEst.toLocaleString("en-IN")}. Confirm or reduce.`,
      fixes: [FIX.acknowledge("Confirm"), FIX.reduceStructure()],
    });
  }

  // CC-03 / CC-04 are Review/retry-time only. CC-03 needs a fresh-vs-snapshot
  // comparison (Review owns the snapshot); CC-04 is a retry-dispatch info. They
  // are intentionally NOT emitted from the Step-3 pure pass — reviewModel/preflight
  // add them with their own snapshot context. Documented here so the catalog is
  // complete and the deliverable maps 1:1.

  return out;
}

const CC02_BUDGET_THRESHOLD = 50000; // ₹/day attention line (design placeholder).

/* ------------------------------------------------------------------ *
 * Local derivations bridging deriveV2 (kept private — no new exports there)
 * ------------------------------------------------------------------ */

/** ads per destination = placement's per-page demand basis. Mirrors deriveV2. */
function adsPerDest(plan: PlanV2): number {
  return creativeFit(plan).slots;
}

/** est daily budget for CC-02 (ABO × ad sets, ×p on duplicate). Cheap local mirror. */
function estDailyBudget(plan: PlanV2): number {
  const fit = creativeFit(plan);
  const base = plan.structure.campaigns * plan.structure.adSetsPerCampaign;
  let adSets: number;
  switch (plan.spread) {
    case "one_per_adset":
      adSets = fit.nEff;
      break;
    case "multiply":
      adSets = base * fit.nEff;
      break;
    default:
      adSets = base;
  }
  const dupMult =
    plan.pageDistribution === "duplicate" ? Math.max(plan.targets.length, 1) : 1;
  const amt = plan.budgetAmount || 0;
  return (plan.budgetMode === "CBO" ? amt : amt * adSets) * dupMult;
}

/** unplaceable count under a hypothetical page-distribution method. */
function unplaceableUnder(plan: PlanV2, method: PageDistribution): number {
  return placement({ ...plan, pageDistribution: method }).unplaceable;
}

/** Mock free-slot read always succeeds. Real API flips this. */
function slotReadUnavailable(_fbPageId: string): boolean {
  return false;
}

/** Restricted-account predicate. No status field in mock → always false today. */
function accountRestricted(_plan: PlanV2, _fbPageId: string): boolean {
  return false;
}

/* ------------------------------------------------------------------ *
 * §5.1 — SINGLE SOURCE OF TRUTH
 * ------------------------------------------------------------------ */

/** All distribution/creative/cap errors for a plan. Pure. */
export function distributionErrors(plan: PlanV2): DistError[] {
  return [
    ...pageSplitErrors(plan),
    ...creativeDistErrors(plan),
    ...crossCuttingErrors(plan),
  ];
}

/* ------------------------------------------------------------------ *
 * Suggested (smart) distribution — respects each page's free slots
 * ------------------------------------------------------------------ */

/**
 * Smart page-distribution: probe fill_first → equal → a custom balanced fill,
 * pick the first method with `unplaceable === 0` and no per-page breach.
 * Falls back to fill_first (greediest seat-use) when nothing seats everything.
 */
export function suggestedDistribution(plan: PlanV2): PageDistribution {
  if (plan.targets.length === 0) return "fill_first";

  const candidates: PageDistribution[] = ["fill_first", "equal"];
  for (const method of candidates) {
    const pl = placement({ ...plan, pageDistribution: method });
    const breach = pl.perPage.some((p) => p.demand > p.available);
    if (pl.unplaceable === 0 && !breach) return method;
  }

  // Custom-balanced probe: hand-fill pages in free-slot order and feed as weights.
  const balanced = balancedWeights(plan);
  const probe: PlanV2 = {
    ...plan,
    pageDistribution: "custom",
    pageWeights: balanced,
  };
  const plCustom = placement(probe);
  const customBreach = plCustom.perPage.some((p) => p.demand > p.available);
  if (plCustom.unplaceable === 0 && !customBreach) return "custom";

  // Nothing seats everything — fill_first uses the most seats (PS-05/06 will fire).
  return "fill_first";
}

/**
 * Balanced custom weights: distribute the per-destination demand across unique
 * pages, never exceeding any page's free slots, filling most-free pages first.
 * Returns a pageWeights map keyed by pageId (the plan's custom-weight key).
 */
function balancedWeights(plan: PlanV2): Record<string, number> {
  const perDest = adsPerDest(plan);
  // Build unique-page rows with a representative pageId (custom weights key on pageId).
  const rows = plan.targets.map((t) => ({
    pageId: t.pageId,
    fbPageId: t.fbPageId,
    free: freeOf(t.fbPageId),
  }));
  // Dedupe by fbPageId (shared pages share the cap), keep first pageId seen.
  const byFb = new Map<string, { pageId: string; free: number }>();
  for (const r of rows) {
    if (!byFb.has(r.fbPageId)) byFb.set(r.fbPageId, { pageId: r.pageId, free: r.free });
  }
  const uniq = [...byFb.values()].sort((a, b) => b.free - a.free);

  const weights: Record<string, number> = {};
  let left = perDest;
  // Water-fill: even out toward a target level, capped at each page's free slots.
  // Simple greedy pass by most-free-first is enough for a "no breach" suggestion.
  const n = uniq.length;
  if (n > 0) {
    // Try an even share first, clamped per page; sweep remainder onto pages with room.
    const evenShare = Math.floor(perDest / n);
    for (const u of uniq) {
      const take = Math.min(u.free, evenShare);
      weights[u.pageId] = take;
      left -= take;
    }
    for (const u of uniq) {
      if (left <= 0) break;
      const room = u.free - (weights[u.pageId] ?? 0);
      if (room <= 0) continue;
      const take = Math.min(room, left);
      weights[u.pageId] = (weights[u.pageId] ?? 0) + take;
      left -= take;
    }
  }
  return weights;
}

/* ------------------------------------------------------------------ *
 * applyDistFix — one-tap fixes → plan patch
 * ------------------------------------------------------------------ */

/**
 * Apply a one-tap fix and return the plan patch (Partial<PlanV2>). Never a
 * dead-end (Nielsen #9). The caller merges the patch into the plan and re-runs
 * `distributionErrors`. Fixes that can't be resolved purely (add_page,
 * split_launch) return a no-op / flag patch — the UI opens the relevant surface.
 */
export function applyDistFix(plan: PlanV2, fix: DistFix): Partial<PlanV2> {
  switch (fix.kind) {
    case "use_suggested":
      return { pageDistribution: fix.distribution ?? suggestedDistribution(plan) };

    case "switch_distribution":
      return { pageDistribution: fix.distribution ?? suggestedDistribution(plan) };

    case "switch_spread":
      return fix.spread ? { spread: fix.spread } : {};

    case "auto_balance": {
      // Balance across pages under the current (or custom) method without breaching.
      return { pageDistribution: "custom", pageWeights: balancedWeights(plan) };
    }

    case "auto_map": {
      // Map available creatives 1:1 into the per-destination slots (fills empties).
      const slots = adsPerDest(plan);
      const map: Record<number, string> = {};
      const creatives = plan.creatives;
      for (let i = 0; i < slots; i++) {
        const c = creatives[i % Math.max(creatives.length, 1)];
        if (c) map[i] = c.id;
      }
      return { creativeSlotMap: map };
    }

    case "reduce_structure": {
      // Halve the heaviest structure lever (adsPerAdSet first, floor 1) to cut count.
      const s = plan.structure;
      const nextAds = Math.max(1, Math.floor(s.adsPerAdSet / 2));
      if (nextAds < s.adsPerAdSet) {
        return { structure: { ...s, adsPerAdSet: nextAds } };
      }
      const nextSets = Math.max(1, Math.floor(s.adSetsPerCampaign / 2));
      return { structure: { ...s, adSetsPerCampaign: nextSets } };
    }

    case "reduce_combos":
      // Switch from the count-spiking "all" to "paired".
      return { combination: "paired" };

    case "change_page":
      // Structural (open the page picker); no pure patch. Return empty flag.
      return {};

    case "add_page":
      // Adding a page is a Step-2 action; UI opens Accounts. No pure patch.
      return {};

    case "split_launch":
      // Splitting spawns a second draft; handled by the flow, not a field patch.
      return {};

    case "acknowledge":
    case "retry":
    case "goto":
    case "none":
    default:
      // Non-mutating: acknowledge dismisses the caveat; retry/goto are UI actions.
      return {};
  }
}
