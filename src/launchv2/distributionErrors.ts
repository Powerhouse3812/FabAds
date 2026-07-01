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
import { pageActiveAds, ACCOUNTS, makeTargetV2 } from "./data";

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
  | "swap_page"
  | "remove_page"
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
  /** opens an inline page picker before mutating: "add_page" appends the chosen
   *  page; "swap_page" replaces `swapFrom` with the chosen page (§6 feature layer). */
  picker?: "add_page" | "swap_page";
  /** for swap_page — the fbPageId being replaced. */
  swapFrom?: string;
  /** the page the UI chose from the picker (its pageId); set at click time. */
  pageId?: string;
}

/* ------------------------------------------------------------------ *
 * Candidate pages — every (account,page) pair NOT already in the plan,
 * for the inline "Add / Change page" pickers (§6 feature layer).
 * ------------------------------------------------------------------ */

export interface CandidatePage {
  accountId: string;
  accountName: string;
  pageId: string;
  fbPageId: string;
  pageName: string;
  activeAds: number;
  /** free = max(0, 250 − activeAds), pre-demand (one canonical value; §4.4). */
  free: number;
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
  /** picker variant of add_page: UI opens the candidate-page dropdown, then sets
   *  `pageId` on the fix and re-applies (appends a target for the chosen page). */
  addPagePicker: (label = "Add a Page"): DistFix => ({
    label,
    kind: "add_page",
    picker: "add_page",
  }),
  /** swap the full/breaching page `swapFrom` for a chosen page via the dropdown. */
  swapPage: (swapFrom: string, label = "Change this Page"): DistFix => ({
    label,
    kind: "swap_page",
    picker: "swap_page",
    swapFrom,
  }),
  /** remove the page `fbPageId` from the plan entirely (drops its target(s)).
   *  Immediate (no picker) — the correct fix when adding a page can't help
   *  (at-cap / duplicate / one_page): the breaching page must go. */
  removePage: (fbPageId: string, label = "Remove this Page"): DistFix => ({
    label,
    kind: "remove_page",
    swapFrom: fbPageId,
  }),
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

/** account owning a given pageId (for add_page / swap_page target builds). */
function findAccountForPage(pageId: string) {
  return ACCOUNTS.find((a) => a.pages.some((p) => p.id === pageId));
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
        message: `${p.pageName} is full (250/250) — no room here. Swap it for another Page or remove it; adding Pages won't free this one.`,
        fixes: [
          FIX.swapPage(p.fbPageId, "Change this Page"),
          FIX.removePage(p.fbPageId, "Remove this Page"),
        ],
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
        message: `One-Page keeps all ${perDest} ads on ${first.pageName}, but it has only ${first.available} free. Spread across Pages, swap this Page, or trim the structure.`,
        fixes: [
          FIX.switchDistribution("fill_first", "Spread across Pages"),
          FIX.swapPage(first.fbPageId, "Change this Page"),
          FIX.reduceStructure(),
        ],
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
          message: `Equal split puts ${p.demand} ads on ${p.pageName} (only ${p.available} free). Switch to Suggested to pack by room, swap this Page, or add another.`,
          fixes: [
            FIX.switchDistribution(suggestedDistribution(plan), "Use suggested spread"),
            FIX.swapPage(p.fbPageId, "Change this Page"),
            FIX.addPagePicker("Add a Page"),
          ],
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
          message: `${p.pageName} is set to ${p.demand} ads but has only ${p.available} free. Auto-balance to fit the weights to each Page's room.`,
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
        message: `Weights total ${assigned} of ${perDest} ads — ${diff} ${dir}. Auto-balance to distribute all ${perDest} across your Pages by room.`,
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
        message: `Your Pages have ${totalFree} free slots but the launch needs ${pl.requested} — ${pl.unplaceable} won't fit. Add another Page to make room, or trim the structure.`,
        fixes: [FIX.addPagePicker("Add a Page"), FIX.reduceStructure()],
      });
    }
  } else if (method === "duplicate") {
    const p = pages.length;
    // PS-15 (duplicate BREACH) — a page can't hold the full duplicated set.
    // Duplicate runs ALL D on every page, so adding a Page can't help: the
    // breaching page must be swapped/removed, or Duplicate switched off.
    const breachedPages = pages.filter((pg) => pg.demand > pg.available);
    for (const pg of breachedPages) {
      out.push({
        id: `ps:duplicate-breach:${pg.fbPageId}`,
        code: "PS-15",
        tier: "error",
        anchor: pg.fbPageId,
        title: "Duplicate overflows a Page",
        message: `Duplicate runs all ${perDest} ads on ${pg.pageName}, but it has only ${pg.available} free. Adding Pages won't help — swap this Page, remove it, or switch off Duplicate.`,
        fixes: [
          FIX.swapPage(pg.fbPageId, "Change this Page"),
          FIX.removePage(pg.fbPageId, "Remove this Page"),
          FIX.switchDistribution("fill_first", "Switch off Duplicate"),
        ],
      });
    }
    // PS-DUP (duplicate FITS) — no breach, p > 1: budget-multiplier warning.
    if (p > 1 && breachedPages.length === 0) {
      out.push({
        id: "ps:duplicate",
        code: "PS-DUP",
        tier: "warning",
        anchor: "pageSplit",
        title: "Duplicate multiplies count and spend",
        message: `Duplicate runs the full ${perDest} ads on each of ${p} Pages — ad count and spend ×${p}. Switch to Fill-first to spread them instead, or keep it.`,
        fixes: [
          FIX.switchDistribution("fill_first", "Switch to Fill-first"),
          FIX.acknowledge(),
        ],
      });
    }
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
      message: `Even packed optimally, ${bestUnplaceable} ads still exceed your Pages' ${totalFree} free slots. Add another Page, or trim the structure.`,
      fixes: [FIX.addPagePicker("Add a Page"), FIX.reduceStructure()],
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
        message: `${p.pageName} is on a restricted account and can't launch now. Swap it for a Page on a healthy account, or open account health to resolve.`,
        fixes: [FIX.swapPage(p.fbPageId, "Change this Page"), FIX.gotoHealth()],
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
      message: `Once creatives expand, the launch needs ${pl.requested} ads but only ${totalFree} slots are free. Trim the structure${
        plan.pageDistribution === "fill_first" || plan.pageDistribution === "equal"
          ? ", or add another Page to make room"
          : ""
      }.`,
      fixes: [
        FIX.reduceStructure(),
        ...(plan.pageDistribution === "fill_first" || plan.pageDistribution === "equal"
          ? [FIX.addPagePicker("Add a Page")]
          : []),
      ],
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

/**
 * Every (account,page) pair from the mock accounts that is NOT already in
 * `plan.targets`, as pickable candidates for the add/swap-page fixes. `free`
 * is the canonical pre-demand headroom. Sorted most-room-first; 0-free pages
 * are still included but sort last (Nielsen #9 — never a dead-end).
 */
export function availablePages(plan: PlanV2): CandidatePage[] {
  const used = new Set(plan.targets.map((t) => `${t.accountId}:${t.pageId}`));
  const out: CandidatePage[] = [];
  for (const acc of ACCOUNTS) {
    for (const pg of acc.pages) {
      if (used.has(`${acc.id}:${pg.id}`)) continue;
      out.push({
        accountId: acc.id,
        accountName: acc.name,
        pageId: pg.id,
        fbPageId: pg.fbPageId,
        pageName: pg.name,
        activeAds: pg.activeAds,
        free: Math.max(0, MAX_ADS_PER_PAGE - pg.activeAds),
      });
    }
  }
  return out.sort((a, b) => b.free - a.free);
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
    case "switch_distribution": {
      const to = fix.distribution ?? suggestedDistribution(plan);
      // A "custom" resolution needs weights populated, else the plan lands in
      // custom with an empty pageWeights map → immediate PS-08 (weights don't
      // add up). Balance it in the same patch so the fix never makes it worse.
      return to === "custom"
        ? { pageDistribution: "custom", pageWeights: balancedWeights(plan) }
        : { pageDistribution: to };
    }

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

    case "add_page": {
      // With a chosen pageId: append a TargetPair for it. Without one, the UI
      // opens the candidate-page picker (no pure patch yet — never a dead-end).
      if (!fix.pageId) return {};
      const acc = findAccountForPage(fix.pageId);
      const added = acc ? makeTargetV2(acc.id, fix.pageId) : null;
      if (!added) return {};
      return { targets: [...plan.targets, added] };
    }

    case "swap_page": {
      // Remove the target(s) on `swapFrom`, append the chosen page. Without a
      // chosen pageId the UI opens the picker (no pure patch yet).
      if (!fix.swapFrom || !fix.pageId) return {};
      const acc = findAccountForPage(fix.pageId);
      const added = acc ? makeTargetV2(acc.id, fix.pageId) : null;
      if (!added) return {};
      const kept = plan.targets.filter((t) => t.fbPageId !== fix.swapFrom);
      return { targets: [...kept, added] };
    }

    case "remove_page": {
      // Drop the target(s) on `swapFrom` entirely — no replacement page. The
      // correct fix when adding a page can't help (at-cap / duplicate / one_page).
      if (!fix.swapFrom) return {};
      return { targets: plan.targets.filter((t) => t.fbPageId !== fix.swapFrom) };
    }

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
