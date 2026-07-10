/**
 * reviewModel — pure derivations for Step 4's Meta two-pane review surface.
 *
 * Builds a *representative* Account → Campaign → AdSet → Ad tree from
 * plan.targets + plan.structure + spread (we summarise counts and show a few
 * leaves per ad set, not every leaf — exactly like Meta's review tree). Also
 * derives the 3-tier issue list (hard cap-check offenders + soft warnings) each
 * with a 1-click recommended fix, and the launch-readiness score.
 *
 * Everything here reads the FROZEN contract (deriveV2 / reducer) — no mutation.
 */
import type { BidStrategy, BudgetMode, PageDistribution, PlanV2 } from "../../types";
import {
  accountsWithZeroPostAds,
  adSetCount,
  adsPerDestination,
  budgetPerDay,
  capCheck,
  estimateAds,
  perTargetCounts,
  postModeActive,
  type PageDemand,
} from "../../deriveV2";
import { pageActiveAds, CREATIVES } from "../../data";
import { MAX_ADS_PER_PAGE } from "../../types";
import { planReady, requiresPixel, softWarnings, type SoftWarning } from "../../reducer";
import { buildPlanUnits, type CanonicalUnit } from "../../planUnits";
import { resolveNodeValue, CREATIVE_ID_KEY } from "../../nodeOverrides";

/* ------------------------------------------------------------------ */
/*  Representative tree                                                */
/* ------------------------------------------------------------------ */

export type NodeKind = "account" | "campaign" | "adset" | "ad";

export interface TreeNode {
  id: string;
  kind: NodeKind;
  label: string;
  /** secondary line (creative / page / budget context). */
  sub?: string;
  /** count badge (ads under this node). */
  count?: number;
  /** the target this branch belongs to (account/page). */
  targetIndex?: number;
  /** creative id for ad leaves (for preview). */
  creativeId?: string;
  children?: TreeNode[];
  /** true when this node is a summarised "+N more" placeholder, not real. */
  summary?: boolean;
  /** Node-specific field values (populated for multi-select mixed-state UI). */
  fields?: Partial<NodeFields>;
}

/** Per-node field values exposed for the Edit pane multi-select mixed-state UI. */
export interface NodeFields {
  // Campaign
  budgetMode?: BudgetMode;
  budgetAmount?: number;
  bidStrategy?: BidStrategy;
  advantagePlus?: boolean;
  abTest?: boolean;
  // Ad set
  optimizationGoal?: string;
  audienceName?: string;
  placements?: string;
  // Ad
  primaryText?: string;
  headline?: string;
  description?: string;
  cta?: string;
  destinationUrl?: string;
}

/** How many real ad leaves we render per ad set before summarising "+N more". */
const MAX_LEAVES = 4;

/** Demo audience names — rotate per ad set index to show mixed-state variance in Edit pane. */
const DEMO_AUDIENCES = [
  "Saved — India 25–45",
  "Lookalike 1% — Purchasers",
  "Broad — all ages",
];

/* ------------------------------------------------------------------ */
/*  Helpers exported for the tree UI (lazy expand + edit pane)         */
/* ------------------------------------------------------------------ */

/**
 * Recompute the SAME baseline ad-slot count that `buildPlanUnits` uses for a
 * given ad-set node id (`t{ti}:{fbPageId}:c{ci}:s{si}`).
 *
 * This is the value `adsPerAdSet` inherits from when no per-node override
 * exists — i.e. the "plan default" for this specific slot (NOT the flat
 * `plan.structure.adsPerAdSet`).
 *
 * Falls back to `plan.structure.adsPerAdSet` when the id doesn't match.
 */
export function baselineAdCountForAdSet(plan: PlanV2, adSetNodeId: string): number {
  const m = /^t(\d+):.*:c(\d+):s(\d+)$/.exec(adSetNodeId);
  if (!m) return plan.structure.adsPerAdSet;
  const ti = parseInt(m[1], 10);
  const ci = parseInt(m[2], 10);
  const si = parseInt(m[3], 10);
  const total = perTargetCounts(plan)[ti] ?? 0;
  const adSetsPer = Math.max(plan.structure.adSetsPerCampaign, 1);
  const campaignsN = Math.max(plan.structure.campaigns, 1);
  const slots = campaignsN * adSetsPer;
  const slot = ci * adSetsPer + si;
  const base = Math.floor(total / slots);
  const extra = slot < total % slots ? 1 : 0;
  return base + extra;
}

/**
 * Return ALL ad-leaf `TreeNode`s for one ad set.  Used by the tree UI to lazily
 * expand the "+N more" placeholder without re-running the whole `buildReviewTree`.
 *
 * Filters `buildPlanUnits` output to units whose `adSetNodeId` matches, then maps
 * each to the same ad-leaf shape `buildReviewTree` produces.
 */
export function expandAdSetLeaves(plan: PlanV2, adSetNodeId: string): TreeNode[] {
  const units = buildPlanUnits(plan).filter((u) => u.adSetNodeId === adSetNodeId);
  return units.map((u) => {
    const swappedId = resolveNodeValue(plan, u.adNodeId, CREATIVE_ID_KEY, u.creativeId) as string;
    const swapped =
      swappedId !== u.creativeId
        ? [...plan.creatives, ...CREATIVES].find((c) => c.id === swappedId)
        : undefined;
    return {
    id: u.adNodeId,
    kind: "ad" as const,
    label: swapped?.name ?? u.creativeName,
    sub: u.target.pageName,
    targetIndex: u.targetIndex,
    creativeId: swappedId,
    fields: {
      primaryText: u.resolved.primaryText || "Discover the difference quality makes.",
      headline: u.resolved.headline,
      description: plan.adCopy.description,
      cta: u.resolved.cta,
      destinationUrl: u.resolved.destinationUrl,
    },
    };
  });
}

/**
 * Build the review tree by GROUPING the canonical launch units
 * (`buildPlanUnits`) into Account → Campaign(s) → AdSet(s) → Ad leaves. Because
 * the tree summarises the exact same units the launch engine consumes, the tree
 * count == what actually launches, and every node ID matches a launch unit (so
 * per-node overrides map cleanly). We still render only `MAX_LEAVES` real ad
 * leaves per ad set and collapse the rest into a "+N more" placeholder — purely
 * a display affordance over the real units.
 *
 * All campaigns are real and identical in treatment (no synthetic "variant").
 */
export function buildReviewTree(plan: PlanV2): TreeNode[] {
  if (plan.targets.length === 0) return [];
  const units = buildPlanUnits(plan);
  const objLabel = (plan.objective ?? "").replace("OUTCOME_", "");
  const adSetsPer = Math.max(plan.structure.adSetsPerCampaign, 1);
  const campaignsN = Math.max(plan.structure.campaigns, 1);

  // Index units per target by "ci:si" slot for O(1) lookup; count per campaign.
  const byTarget = new Map<number, Map<string, CanonicalUnit[]>>();
  const campCountByTarget = new Map<number, Map<number, number>>();
  for (const u of units) {
    let slots = byTarget.get(u.targetIndex);
    if (!slots) { slots = new Map(); byTarget.set(u.targetIndex, slots); }
    const key = `${u.campaignIndex}:${u.adSetIndex}`;
    const arr = slots.get(key);
    if (arr) arr.push(u); else slots.set(key, [u]);
    let cc = campCountByTarget.get(u.targetIndex);
    if (!cc) { cc = new Map(); campCountByTarget.set(u.targetIndex, cc); }
    cc.set(u.campaignIndex, (cc.get(u.campaignIndex) ?? 0) + 1);
  }

  return plan.targets.map((target, ti) => {
    const slots = byTarget.get(ti);
    const campCount = campCountByTarget.get(ti);
    let total = 0;

    const campaigns: TreeNode[] = Array.from({ length: campaignsN }, (_, ci) => {
      const campaignNodeId = `t${ti}:${target.fbPageId}:c${ci}`;
      const campaignName = resolveNodeValue(
        plan,
        campaignNodeId,
        "campaignName",
        `${objLabel} · C${ci + 1}`,
      );
      const budgetMode = resolveNodeValue(plan, campaignNodeId, "budgetMode", plan.budgetMode);
      const budgetAmount = resolveNodeValue(plan, campaignNodeId, "budgetAmount", plan.budgetAmount);
      const cCount = campCount?.get(ci) ?? 0;
      total += cCount;

      const adSets: TreeNode[] = Array.from({ length: adSetsPer }, (_, si) => {
        const adSetNodeId = `t${ti}:${target.fbPageId}:c${ci}:s${si}`;
        const sUnits = slots?.get(`${ci}:${si}`) ?? [];
        const adsHere = sUnits.length;
        const shown = sUnits.slice(0, MAX_LEAVES);

        const leaves: TreeNode[] = shown.map((u) => {
          // Honor a per-ad creative swap (__creativeId override) for the node's
          // creative + label, so the tree stays truthful to what's been edited.
          const swappedId = resolveNodeValue(plan, u.adNodeId, CREATIVE_ID_KEY, u.creativeId) as string;
          const swapped =
            swappedId !== u.creativeId
              ? [...plan.creatives, ...CREATIVES].find((c) => c.id === swappedId)
              : undefined;
          return {
          id: u.adNodeId,
          kind: "ad" as const,
          label: swapped?.name ?? u.creativeName,
          sub: target.pageName,
          targetIndex: ti,
          creativeId: swappedId,
          fields: {
            primaryText: u.resolved.primaryText || "Discover the difference quality makes.",
            headline: u.resolved.headline,
            description: plan.adCopy.description,
            cta: u.resolved.cta,
            destinationUrl: u.resolved.destinationUrl,
          },
          };
        });
        if (adsHere > shown.length) {
          leaves.push({
            id: `t${ti}:${target.fbPageId}:c${ci}:s${si}:more`,
            kind: "ad",
            label: `+${adsHere - shown.length} more ads`,
            targetIndex: ti,
            summary: true,
          });
        }
        return {
          id: adSetNodeId,
          kind: "adset" as const,
          label: resolveNodeValue(
            plan,
            adSetNodeId,
            "adSetName",
            `Ad set ${String(si + 1).padStart(2, "0")}`,
          ),
          sub: plan.targetingTemplateId ? "Saved audience" : "Audience",
          count: adsHere,
          targetIndex: ti,
          children: leaves,
          fields: {
            optimizationGoal: plan.optimizationGoal ?? "",
            audienceName: DEMO_AUDIENCES[si % DEMO_AUDIENCES.length],
            placements: si % 2 === 0 ? "Automatic" : "Manual — Feed + Stories",
          },
        };
      });

      return {
        id: campaignNodeId,
        kind: "campaign" as const,
        label: campaignName,
        sub: budgetMode === "CBO" ? "CBO" : "ABO",
        count: cCount,
        targetIndex: ti,
        children: adSets,
        fields: {
          budgetMode,
          budgetAmount,
          bidStrategy: plan.bidStrategy,
          advantagePlus: plan.advantagePlus,
          abTest: plan.abTest,
        },
      };
    });
    return {
      id: `acct:t${ti}:${target.fbPageId}`,
      kind: "account" as const,
      label: target.accountName,
      sub: target.pageName,
      count: total,
      targetIndex: ti,
      children: campaigns,
    };
  });
}

/** Flatten the tree to one row per node (for the table view). */
export interface FlatRow {
  id: string;
  campaign: string;
  adSet: string;
  ad: string;
  page: string;
  account: string;
  targetIndex: number;
}
export function flattenTree(tree: TreeNode[]): FlatRow[] {
  const rows: FlatRow[] = [];
  for (const acct of tree) {
    for (const camp of acct.children ?? []) {
      for (const set of camp.children ?? []) {
        for (const ad of set.children ?? []) {
          rows.push({
            id: ad.id,
            campaign: camp.label,
            adSet: set.label,
            ad: ad.label,
            page: acct.sub ?? "",
            account: acct.label,
            targetIndex: acct.targetIndex ?? 0,
          });
        }
      }
    }
  }
  return rows;
}

/** Flatten ALL nodes at every depth — used by EditPane for multi-select field lookup. */
export function flattenAllNodes(tree: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];
  function visit(node: TreeNode) {
    result.push(node);
    if (node.children) node.children.forEach(visit);
  }
  tree.forEach(visit);
  return result;
}

/* ------------------------------------------------------------------ */
/*  Override-aware per-page demand + cap check (A3)                   */
/* ------------------------------------------------------------------ */

/**
 * Counts ACTUAL `buildPlanUnits` units per `fbPageId`, reflecting any
 * per-adset `adsPerAdSet` overrides. Returns the same PageDemand[] shape as
 * deriveV2's `perPageDemand` so callers can swap them transparently.
 *
 * Lives here (not in deriveV2) to avoid a circular import: deriveV2 ← planUnits
 * would be circular since planUnits already imports deriveV2.
 */
export function perPageDemandResolved(plan: PlanV2): PageDemand[] {
  const units = buildPlanUnits(plan);
  const byPage = new Map<string, PageDemand>();
  for (const u of units) {
    const { fbPageId, pageName, accountName } = u.target;
    const ex = byPage.get(fbPageId);
    if (ex) {
      ex.demand += 1;
    } else {
      const current = pageActiveAds(fbPageId);
      byPage.set(fbPageId, {
        fbPageId,
        pageName,
        accountName,
        current,
        demand: 1,
        available: Math.max(0, MAX_ADS_PER_PAGE - current),
        over: false,
      });
    }
  }
  const out = [...byPage.values()];
  out.forEach((p) => (p.over = p.current + p.demand > MAX_ADS_PER_PAGE));
  return out;
}

/** Override-aware cap check — use in Review; deriveV2's capCheck stays for Step 3. */
export function capCheckResolved(plan: PlanV2): { ok: boolean; offenders: PageDemand[] } {
  const offenders = perPageDemandResolved(plan).filter((p) => p.over);
  return { ok: offenders.length === 0, offenders };
}

/* ------------------------------------------------------------------ */
/*  3-tier issues + recommended fixes                                  */
/* ------------------------------------------------------------------ */

export type IssueTier = "error" | "warning" | "info";
/** A 1-click fix the user can apply. distribution = switch pageDistribution. */
export type IssueFixKind =
  | "switch_distribution"
  | "reduce_ads"
  | "add_page"
  | "none";

export interface ReviewIssue {
  id: string;
  tier: IssueTier;
  title: string;
  detail: string;
  /** The recommended 1-click fix (label + kind + payload). */
  fix?: {
    label: string;
    kind: IssueFixKind;
    /** for switch_distribution */
    distribution?: PageDistribution;
  };
}

/**
 * Decide the best distribution to recommend given cap offenders.
 * fill-first usually frees the most headroom; if already fill-first and still
 * over, equal spreads load; duplicate is never a fix (it multiplies).
 */
function recommendedDistribution(plan: PlanV2): PageDistribution | null {
  const order: PageDistribution[] = ["fill_first", "equal"];
  for (const d of order) {
    if (d === plan.pageDistribution) continue;
    const probe = { ...plan, pageDistribution: d };
    if (capCheckResolved(probe).ok) return d;
  }
  return null;
}

const DIST_LABEL: Record<PageDistribution, string> = {
  one_page: "One page",
  fill_first: "Fill-first",
  equal: "Equal split",
  duplicate: "Duplicate to all",
  custom: "Custom",
};

export function buildIssues(plan: PlanV2): ReviewIssue[] {
  const issues: ReviewIssue[] = [];
  const sets = adSetCount(plan);

  // ---- Tier 1: hard cap-check offenders (block launch) ----
  // Use capCheckResolved so per-adset adsPerAdSet overrides are reflected.
  const cap = capCheckResolved(plan);
  for (const off of cap.offenders) {
    const overBy = off.current + off.demand - 250;
    const recDist = recommendedDistribution(plan);
    issues.push({
      id: `cap:${off.fbPageId}`,
      tier: "error",
      title: `${off.pageName} exceeds the 250-ad Page cap`,
      detail: `${off.current} live + ${off.demand} new = ${off.current + off.demand}, over by ${overBy}. Meta will reject the overflow.`,
      fix: recDist
        ? { label: `Switch to ${DIST_LABEL[recDist]}`, kind: "switch_distribution", distribution: recDist }
        : plan.pageDistribution === "duplicate"
          ? { label: "Switch to Fill-first", kind: "switch_distribution", distribution: "fill_first" }
          : { label: "Reduce ad count", kind: "reduce_ads" },
    });
  }

  // ---- Tier 1b: pixel required but missing on one or more accounts ----
  if (requiresPixel(plan)) {
    const missing = plan.targets.filter((t) => !t.pixelId);
    if (missing.length > 0) {
      issues.push({
        id: "err:pixel-attached",
        tier: "error",
        title: "Pixel required",
        detail: "Connect a Meta pixel to selected accounts before launch.",
      });
    }
  }

  // ---- Tier 1c: no destinations selected ----
  if (plan.targets.length === 0) {
    issues.push({
      id: "err:no-targets",
      tier: "error",
      title: "No destinations selected",
      detail: "Pick at least one ad account and Page in Setup.",
    });
  }

  // ---- Tier 1c2: mixed account currencies (USD-only / single-currency) ----
  if (plan.targets.length > 0) {
    const currencies = new Set(plan.targets.map((t) => t.currency));
    if (currencies.size > 1) {
      issues.push({
        id: "err:mixed-currency",
        tier: "error",
        title: "Mixed account currencies",
        detail: `Selected accounts span ${[...currencies].join(", ")}. Launch is single-currency (USD) — budget totals and the spend safeguard assume one currency. Use accounts of a single currency.`,
      });
    }
  }

  // ---- Tier 1d: no creatives selected ----
  if (plan.creatives.length === 0) {
    issues.push({
      id: "err:no-creatives",
      tier: "error",
      title: "No creatives selected",
      detail: "Pick at least one creative (or whole ad) in the Ad step.",
    });
  }

  // ---- Tier 1d2: post-mode account(s) with 0 resulting ads ----
  // Hard block, mirrors the Step 3 on-page banner (defense-in-depth) — a
  // launch can never have an ad account that produces zero ads.
  {
    const zeroAdAccounts = accountsWithZeroPostAds(plan);
    if (zeroAdAccounts.length > 0) {
      const names = zeroAdAccounts.map((a) => a.accountName).join(", ");
      issues.push({
        id: "err:zero-post-ads",
        tier: "error",
        title:
          zeroAdAccounts.length === 1
            ? `${zeroAdAccounts[0].accountName} will get 0 ads`
            : `${zeroAdAccounts.length} accounts will get 0 ads`,
        detail: `${names} — no selected post belongs to this account's page(s). Select at least one post for its page, or turn off post import for this account.`,
      });
    }
  }

  // ---- Tier 1e: DPA / catalogue on but no product set picked ----
  if (plan.catalogueToggle) {
    const accountIds = new Set(plan.targets.map((t) => t.accountId));
    const hasSet = [...accountIds].some(
      (aid) => (plan.productSetByAccount?.[aid]?.productSetIds?.length ?? 0) > 0,
    );
    if (!hasSet) {
      issues.push({
        id: "err:dpa-no-set",
        tier: "error",
        title: "Catalogue on, but no product set picked",
        detail: "Pick at least one product set per ad account, else Meta has nothing to serve.",
      });
    }
  }

  // ---- Tier 1i: DPA / catalogue is not supported on APP destination ----
  if (plan.catalogueToggle && plan.destinationType === "APP") {
    issues.push({
      id: "err:dpa-app-dest",
      tier: "error",
      title: "Catalogue ads can't run to App destinations",
      detail: "Meta does not support DPA / catalogue ads for app-install or app-event objectives. Switch destination type to Website or remove catalogue.",
    });
  }

  // ---- Tier 1f: A/B test enabled but only one creative ----
  if (plan.abTest && plan.creatives.length < 2) {
    issues.push({
      id: "err:abtest-one-creative",
      tier: "error",
      title: "A/B test needs 2+ creatives",
      detail: "Add at least one more creative — Meta needs two variants to run the test.",
    });
  }

  // ---- Tier 1g: custom audience toggled but no audience picked (select mode) ----
  if (
    plan.useCustomAudience &&
    plan.customAudienceMode === "select" &&
    !plan.customAudienceId
  ) {
    issues.push({
      id: "err:custom-audience-empty",
      tier: "error",
      title: "Custom Audience on, none selected",
      detail: "Pick a custom audience from the dropdown, switch to Upload, or turn off Custom Audience.",
    });
  }

  // ---- Tier 2: soft warnings (warn, don't block) ----
  const warns: SoftWarning[] = softWarnings(plan, sets);
  for (const w of warns) {
    issues.push({
      id: `warn:${w.code}`,
      tier: "warning",
      title: warnTitle(w.code),
      detail: w.message,
      fix: warnFix(w.code, plan),
    });
  }

  // ---- Tier 2b: destination URL missing when format expects one ----
  if (urlRequired(plan) && !plan.adCopy.destinationUrl.trim()) {
    issues.push({
      id: "warn:destination-url",
      tier: "warning",
      title: "Destination URL missing",
      detail: "This ad format opens an external URL on click — add one in the Override tab.",
    });
  }

  // ---- Tier 2c: budget sanity — high daily spend per ad set ----
  {
    const perAdSetDaily = plan.budgetAmount * sets;
    if (perAdSetDaily > 100_000) {
      const currency = plan.targets[0]?.currency ?? "USD";
      issues.push({
        id: "warn:budget-sanity",
        tier: "warning",
        title: "High daily spend",
        detail: `${currency} ${Math.round(perAdSetDaily).toLocaleString("en-IN")}/day across ${sets} ad ${sets === 1 ? "set" : "sets"} — confirm this is intended.`,
      });
    }
  }

  // ---- Tier 2d: duplicate distribution multiplier (upgraded from info) ----
  // Post-import mode ignores pageDistribution entirely (deriveV2.perTargetCounts),
  // so a stale "duplicate" choice from before toggling post mode on must not warn here.
  if (plan.pageDistribution === "duplicate" && plan.targets.length > 1 && !postModeActive(plan)) {
    issues.push({
      id: "warn:duplicate-multiplier",
      tier: "warning",
      title: `Duplicate distribution multiplies spend ${plan.targets.length}×`,
      detail: `Each of your ${plan.targets.length} Pages gets the full ${adsPerDestination(plan)} ads, so spend and ad count multiply by ${plan.targets.length}.`,
    });
  }

  // ---- Tier 2e: Leads via Instant Form without CRM integration note ----
  if (
    plan.objective === "OUTCOME_LEADS" &&
    plan.destinationType === "ON_AD"
  ) {
    issues.push({
      id: "warn:leads-no-crm",
      tier: "warning",
      title: "Instant Form leads — connect a CRM",
      detail: "Leads collected via Instant Form are stored in Meta. Connect a CRM (HubSpot, Salesforce, Zapier) or download leads manually to action them.",
      fix: { label: "Use website destination instead", kind: "none" },
    });
  }

  // ---- Tier 1j: Creative format vs. placement incompatibility ----
  if (plan.format === "single_video" && plan.placementMode === "manual") {
    // Manual placements that only support static images (e.g. Marketplace, Right Column)
    // are incompatible with video-only format. Warn the buyer.
    issues.push({
      id: "warn:format-placement",
      tier: "warning",
      title: "Video format with manual placements",
      detail: "Some manual placements (Marketplace, Right Column) don't support video. Switch to Automatic placements or use a static image format.",
      fix: { label: "Switch to Automatic placements", kind: "none" },
    });
  }

  // ---- Meta guardrail 1: Collection requires a catalogue + product set ----
  if (plan.format === "collection") {
    const anyCatalogue =
      plan.catalogueToggle || Object.values(plan.catalogueByAccount ?? {}).some(Boolean);
    const anyProductSet = Object.values(plan.productSetByAccount ?? {}).some(
      (s) => s?.catalogId && (s.productSetIds?.length ?? 0) > 0,
    );
    if (!anyCatalogue || !anyProductSet) {
      issues.push({
        id: "err:collection-needs-catalogue",
        tier: "error",
        title: "Collection needs a catalogue",
        detail:
          "Collection ads show a product grid from a catalogue. Turn on Advantage+ Catalogue and pick a product set in Setup → Ad features.",
      });
    }
  }

  // ---- Meta guardrail 3: Carousel card count + per-card completeness ----
  if (plan.format === "carousel") {
    const cards = plan.carouselCards ?? [];
    if (cards.length < 2) {
      issues.push({
        id: "err:carousel-min",
        tier: "error",
        title: "Carousel needs 2+ cards",
        detail: "Meta carousels run 2–10 cards. Add at least 2 cards in the Creative step.",
      });
    } else if (cards.length > 10) {
      issues.push({
        id: "err:carousel-max",
        tier: "error",
        title: "Carousel over the 10-card limit",
        detail: `Meta allows max 10 carousel cards — you have ${cards.length}. Remove ${cards.length - 10}.`,
      });
    }
    const incomplete = cards.filter(
      (c) => !c.creativeId || !c.headline?.trim() || !c.link?.trim(),
    ).length;
    if (cards.length >= 2 && incomplete > 0) {
      issues.push({
        id: "err:carousel-incomplete",
        tier: "error",
        title: `${incomplete} carousel card${incomplete === 1 ? "" : "s"} incomplete`,
        detail: "Every card needs media, a headline, and a link before launch.",
      });
    }
  }

  // ---- Meta guardrail 4: Collection only renders in Feeds/Stories/Reels ----
  if (plan.format === "collection" && plan.placementMode === "manual") {
    issues.push({
      id: "warn:collection-placement",
      tier: "warning",
      title: "Collection with manual placements",
      detail:
        "Collection ads only render in Feeds, Stories and Reels. Right Column, Search and Audience Network will be skipped. Automatic placements is recommended.",
      fix: { label: "Switch to Automatic placements", kind: "none" },
    });
  }

  // ---- Tier 3: info / readiness nudges ----
  if (!plan.adCopy.primaryText.trim() && plan.creatives.some((c) => !c.savedAd)) {
    issues.push({
      id: "info:copy",
      tier: "info",
      title: "Primary text is empty",
      detail: "Ads without primary text can still launch, but tend to underperform. Add a hook in the Override tab.",
    });
  }

  // ---- Tier 1h: per-node override blanked required fields ----
  {
    let blankDestinationUrl = 0;
    let blankPrimaryText = 0;
    for (const unit of buildPlanUnits(plan)) {
      if (unit.resolved.destinationUrl === "") blankDestinationUrl++;
      if (unit.resolved.primaryText === "") blankPrimaryText++;
    }
    if (blankDestinationUrl > 0) {
      issues.push({
        id: "err:blank-destinationurl-override",
        tier: "error",
        title: "Destination URL blanked via override",
        detail: `${blankDestinationUrl} ${blankDestinationUrl === 1 ? "ad has" : "ads have"} destinationUrl blanked via an override. Restore a value or remove the override before launching.`,
      });
    }
    if (blankPrimaryText > 0) {
      issues.push({
        id: "err:blank-primarytext-override",
        tier: "error",
        title: "Primary text blanked via override",
        detail: `${blankPrimaryText} ${blankPrimaryText === 1 ? "ad has" : "ads have"} primaryText blanked via an override. Restore a value or remove the override before launching.`,
      });
    }
  }

  return issues;
}

/**
 * The real launch gate. Combines structural readiness (`planReady`) with the
 * blocking issues from `buildIssues`. Any `tier === "error"` issue blocks.
 *
 * This is what the Launch button + confirm modal MUST check — not `planReady`
 * alone, because planReady only checks 5 coarse conditions and misses things
 * like DPA-without-product-set, A/B-with-one-creative, etc.
 */
export function canLaunch(plan: PlanV2): { ok: boolean; blockingIssues: ReviewIssue[] } {
  if (!planReady(plan, 5)) {
    // structural failure — buildIssues will likely surface the same things,
    // but planReady gives the cleanest yes/no without iterating issues.
    return { ok: false, blockingIssues: buildIssues(plan).filter((i) => i.tier === "error") };
  }
  const blocking = buildIssues(plan).filter((i) => i.tier === "error");
  return { ok: blocking.length === 0, blockingIssues: blocking };
}

/** Does the current plan's ad format point to an external URL destination? */
function urlRequired(plan: PlanV2): boolean {
  // Catalog/DPA flows resolve URLs from the product feed — skip the check.
  if (plan.format === "dpa" || plan.destinationType === "PRODUCT_CATALOG_SALES") return false;
  // Lead forms / messaging destinations don't need a URL.
  if (plan.destinationType === "ON_AD" || plan.destinationType === "MESSENGER" ||
      plan.destinationType === "WHATSAPP" || plan.destinationType === "INSTAGRAM_DIRECT" ||
      plan.destinationType === "PHONE_CALL" || plan.destinationType === "APP") return false;
  return true;
}

function warnTitle(code: string): string {
  switch (code) {
    case "CBO_70":
      return "Over 70 ad sets under CBO";
    case "ADSET_200":
      return "Exceeded the 200 ad-set limit";
    case "FRAGMENT":
      return "Learning-phase fragmentation risk";
    default:
      return "Heads up";
  }
}

function warnFix(code: string, plan: PlanV2): ReviewIssue["fix"] {
  if (code === "FRAGMENT") {
    return { label: "Reduce ad sets", kind: "reduce_ads" };
  }
  if (code === "ADSET_200" || code === "CBO_70") {
    // adding a page can split load when distribution is fill/equal
    if (plan.pageDistribution !== "duplicate") {
      return { label: "Add a destination Page", kind: "add_page" };
    }
  }
  return undefined;
}

/* ------------------------------------------------------------------ */
/*  Readiness score (Meta campaign-score style)                        */
/* ------------------------------------------------------------------ */

export type ReadinessLevel = "blocked" | "review" | "ready";
export interface Readiness {
  level: ReadinessLevel;
  /** 0–100, presented like Meta's campaign score. */
  score: number;
  errors: number;
  warnings: number;
  infos: number;
  label: string;
}

export function readiness(issues: ReviewIssue[]): Readiness {
  const errors = issues.filter((i) => i.tier === "error").length;
  const warnings = issues.filter((i) => i.tier === "warning").length;
  const infos = issues.filter((i) => i.tier === "info").length;
  let score = 100 - errors * 100 - warnings * 12 - infos * 4;
  score = Math.max(errors > 0 ? 0 : 1, Math.min(100, score));
  const level: ReadinessLevel = errors > 0 ? "blocked" : warnings > 0 ? "review" : "ready";
  const label = errors > 0 ? "Blocked" : warnings > 0 ? "Review advised" : "Ready to launch";
  return { level, score, errors, warnings, infos, label };
}

/* ------------------------------------------------------------------ */
/*  Top-line summary numbers (footer launch button reads estimateAds)  */
/* ------------------------------------------------------------------ */
export interface ReviewSummary {
  campaigns: number;
  adSets: number;
  adsPerDest: number;
  totalAds: number;
  budgetPerDay: number;
  currency: string;
  accounts: number;   // unique ad account count
  pages: number;      // total destination count (targets.length)
}
export function reviewSummary(plan: PlanV2): ReviewSummary {
  return {
    campaigns: Math.max(plan.structure.campaigns, 1) * Math.max(plan.targets.length, 1),
    adSets: adSetCount(plan) * (plan.pageDistribution === "duplicate" ? Math.max(plan.targets.length, 1) : 1),
    adsPerDest: adsPerDestination(plan),
    totalAds: estimateAds(plan),
    budgetPerDay: budgetPerDay(plan),
    currency: plan.targets[0]?.currency ?? "USD",
    accounts: new Set(plan.targets.map((t) => t.accountId)).size,
    pages: plan.targets.length,
  };
}

/* ------------------------------------------------------------------ */
/*  Per-account breakdown                                               */
/* ------------------------------------------------------------------ */
export interface AccountBreakdown {
  accountId: string;
  accountName: string;
  currency: string;
  pages: number;
  campaigns: number;
  adSets: number;
  ads: number;
  dailyBudget: number;
}

export function perAccountBreakdown(plan: PlanV2): AccountBreakdown[] {
  if (plan.targets.length === 0) return [];

  // Group targets by accountId
  const groups = new Map<string, typeof plan.targets[number][]>();
  for (const t of plan.targets) {
    if (!groups.has(t.accountId)) groups.set(t.accountId, []);
    groups.get(t.accountId)!.push(t);
  }

  const totalPages = plan.targets.length;
  const totalDaily = budgetPerDay(plan);
  const campaignsPerPage = Math.max(plan.structure.campaigns, 1);
  const adSetsPerPage = campaignsPerPage * Math.max(plan.structure.adSetsPerCampaign, 1);
  const adsPerPage = adsPerDestination(plan);

  return Array.from(groups.entries()).map(([accountId, targets]) => {
    const pages = targets.length;
    const proportion = totalPages > 0 ? pages / totalPages : 0;
    return {
      accountId,
      accountName: targets[0].accountName,
      currency: targets[0].currency,
      pages,
      campaigns: campaignsPerPage * pages,
      adSets: adSetsPerPage * pages,
      ads: adsPerPage * pages,
      dailyBudget: totalDaily * proportion,
    };
  });
}

/**
 * Derives the NodeKind from a tree node ID.
 * Formats mirror buildReviewTree / buildPlanUnits (new ti-inclusive encoding):
 *   account:  "acct:t{ti}:{fbPageId}"
 *   campaign: "t{ti}:{fbPageId}:c{ci}"
 *   adset:    "t{ti}:{fbPageId}:c{ci}:s{si}"
 *   ad:       "t{ti}:{fbPageId}:c{ci}:s{si}:a{k}" | "…:more"
 *
 * Mental test:
 *   "acct:t0:fb_1"          → "account"
 *   "t0:fb_1:c0"            → "campaign"
 *   "t0:fb_1:c0:s1"         → "adset"
 *   "t0:fb_1:c0:s1:a2"      → "ad"
 *   "t0:fb_1:c0:s1:more"    → "ad"
 */
export function nodeKindFromId(id: string | undefined): NodeKind | null {
  if (!id) return null;
  if (id.startsWith("acct:")) return "account";
  // campaign: ends with :c{digits} (no :s segment after)
  if (/^t\d+:[^:]+:c\d+$/.test(id)) return "campaign";
  // adset: ends with :s{digits} (no :a or :more after)
  if (/^t\d+:[^:]+:c\d+:s\d+$/.test(id)) return "adset";
  return "ad";
}

export type { PageDemand };
