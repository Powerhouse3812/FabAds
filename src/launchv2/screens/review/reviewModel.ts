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
  adSetCount,
  adsPerDestination,
  budgetPerDay,
  capCheck,
  estimateAds,
  perPageDemand,
  type PageDemand,
} from "../../deriveV2";
import { planReady, requiresPixel, softWarnings, type SoftWarning } from "../../reducer";

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

/**
 * Per-target ad counts under the active page-distribution — mirrors the
 * service's buildUnitsV2 split so the tree count == what will actually launch.
 */
export function perTargetAdCounts(plan: PlanV2): number[] {
  const per = adsPerDestination(plan);
  const n = plan.targets.length;
  if (n === 0) return [];
  if (plan.pageDistribution === "duplicate") return plan.targets.map(() => per);
  if (plan.pageDistribution === "equal") {
    const q = Math.floor(per / n);
    const r = per % n;
    return plan.targets.map((_, i) => q + (i < r ? 1 : 0));
  }
  // fill-first — fill each page's headroom in order
  const demand = perPageDemand(plan);
  const headByPage = new Map(demand.map((d) => [d.fbPageId, d.available]));
  let left = per;
  return plan.targets.map((t) => {
    const cap = headByPage.get(t.fbPageId) ?? per;
    const take = Math.max(0, Math.min(cap, left));
    left -= take;
    return take;
  });
}

/** Demo audience names — rotate per ad set index to show mixed-state variance in Edit pane. */
const DEMO_AUDIENCES = [
  "Saved — India 25–45",
  "Lookalike 1% — Purchasers",
  "Broad — all ages",
];

/**
 * Build a representative tree. We model the structure as:
 *   Account (= target) → Campaign(s) → AdSet(s) → Ad leaves
 * The structure counts (campaigns / adSetsPerCampaign) drive grouping; the
 * spread-derived per-target ad count drives how many leaves we distribute.
 */
export function buildReviewTree(plan: PlanV2): TreeNode[] {
  if (plan.targets.length === 0) return [];
  const counts = perTargetAdCounts(plan);
  const creatives = plan.creatives.length
    ? plan.creatives
    : [{ id: "default", name: "Creative" } as { id: string; name: string }];
  const objLabel = (plan.objective ?? "").replace("OUTCOME_", "");
  const adSetsPer = Math.max(plan.structure.adSetsPerCampaign, 1);
  const campaignsN = Math.max(plan.structure.campaigns, 1);

  return plan.targets.map((target, ti) => {
    const total = counts[ti] ?? 0;
    let leafIdx = 0;
    const campaigns: TreeNode[] = Array.from({ length: campaignsN }, (_, ci) => {
      // distribute this target's ads across campaign → ad sets round-robin
      const adSets: TreeNode[] = Array.from({ length: adSetsPer }, (_, si) => {
        // how many ads land in this ad set (even-ish split of `total`)
        const slot = ci * adSetsPer + si;
        const slots = campaignsN * adSetsPer;
        const base = Math.floor(total / slots);
        const extra = slot < total % slots ? 1 : 0;
        const adsHere = base + extra;
        const shownLeaves = Math.min(adsHere, MAX_LEAVES);
        const leaves: TreeNode[] = Array.from({ length: shownLeaves }, (_, k) => {
          const creative = creatives[leafIdx % creatives.length];
          leafIdx++;
          return {
            id: `${target.fbPageId}:c${ci}:s${si}:a${k}`,
            kind: "ad" as const,
            label: creative.name,
            sub: target.pageName,
            targetIndex: ti,
            creativeId: creative.id,
            fields: {
              primaryText: plan.adCopy.primaryText || "Discover the difference quality makes.",
              headline: creative.name,
              description: plan.adCopy.description,
              cta: plan.adCopy.cta,
              destinationUrl: plan.adCopy.destinationUrl,
            },
          };
        });
        if (adsHere > shownLeaves) {
          leaves.push({
            id: `${target.fbPageId}:c${ci}:s${si}:more`,
            kind: "ad",
            label: `+${adsHere - shownLeaves} more ads`,
            targetIndex: ti,
            summary: true,
          });
        }
        return {
          id: `${target.fbPageId}:c${ci}:s${si}`,
          kind: "adset" as const,
          label: `Ad set ${String(si + 1).padStart(2, "0")}`,
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
      const isCampaignVariant = campaignsN > 1 && ci === 1;
      return {
        id: `${target.fbPageId}:c${ci}`,
        kind: "campaign" as const,
        label: campaignsN > 1 ? `${objLabel} · C${ci + 1}` : `${objLabel} · C1`,
        sub: plan.budgetMode === "CBO" ? "CBO" : "ABO",
        count: adSets.reduce((n, s) => n + (s.count ?? 0), 0),
        targetIndex: ti,
        children: adSets,
        fields: {
          budgetMode: isCampaignVariant
            ? (plan.budgetMode === "CBO" ? "ABO" : "CBO")
            : plan.budgetMode,
          budgetAmount: isCampaignVariant
            ? Math.round(plan.budgetAmount * 0.6)
            : plan.budgetAmount,
          bidStrategy: plan.bidStrategy,
          advantagePlus: isCampaignVariant ? !plan.advantagePlus : plan.advantagePlus,
          abTest: plan.abTest,
        },
      };
    });
    return {
      id: `acct:${target.fbPageId}:${ti}`,
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
    if (capCheck(probe).ok) return d;
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
  const cap = capCheck(plan);
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

  // ---- Tier 1d: no creatives selected ----
  if (plan.creatives.length === 0) {
    issues.push({
      id: "err:no-creatives",
      tier: "error",
      title: "No creatives selected",
      detail: "Pick at least one creative (or whole ad) in the Ad step.",
    });
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
  if (plan.pageDistribution === "duplicate" && plan.targets.length > 1) {
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

  // ---- Tier 3: info / readiness nudges ----
  if (!plan.adCopy.primaryText.trim() && plan.creatives.some((c) => !c.savedAd)) {
    issues.push({
      id: "info:copy",
      tier: "info",
      title: "Primary text is empty",
      detail: "Ads without primary text can still launch, but tend to underperform. Add a hook in the Override tab.",
    });
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
 * Formats mirror buildReviewTree:
 *   account:  "acct:{fbPageId}:{ti}"
 *   campaign: "{fbPageId}:c{ci}"
 *   adset:    "{fbPageId}:c{ci}:s{si}"
 *   ad:       "{fbPageId}:c{ci}:s{si}:a{k}" | "…:more"
 */
export function nodeKindFromId(id: string | undefined): NodeKind | null {
  if (!id) return null;
  if (id.startsWith("acct:")) return "account";
  if (/:c\d+$/.test(id)) return "campaign";
  if (/:c\d+:s\d+$/.test(id)) return "adset";
  return "ad";
}

export type { PageDemand };
