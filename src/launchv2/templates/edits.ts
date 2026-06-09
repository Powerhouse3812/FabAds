/**
 * Launch v2 — Templates edit-tracking + extraction helpers.
 *
 *  - diffSetupTemplate / diffDistributionTemplate: which sections diverge from
 *    the applied template (drives the "linked — Edited" badge on the bar).
 *  - extractSetupPayload / extractDistributionPayload: serialize the current
 *    plan slice into a template payload (drives "Save as new").
 *
 * Both diffs are section-granular booleans (not per-field) so the UI can show
 * "Audience edited" / "Distribution structure edited" pills cheaply.
 */

import { TARGETING_TEMPLATES } from "../data";
import type { PlanV2 } from "../types";
import type {
  DistributionTemplatePayload,
  SetupAudienceConfig,
  SetupDestination,
  SetupTemplatePayload,
} from "./types";

/* ── Extraction ────────────────────────────────────────────────────────── */

/**
 * Collapse plan.targets (which is [account, page] pairs) into the
 * SetupDestination shape (account → pageIds[] + pixelId).
 */
function destinationsFromPlan(plan: PlanV2): SetupDestination[] {
  const byAccount = new Map<string, SetupDestination>();
  for (const t of plan.targets) {
    const existing = byAccount.get(t.accountId);
    if (existing) {
      if (!existing.pageIds.includes(t.pageId)) existing.pageIds.push(t.pageId);
      if (!existing.pixelId && t.pixelId) existing.pixelId = t.pixelId;
    } else {
      byAccount.set(t.accountId, {
        accountId: t.accountId,
        pageIds: [t.pageId],
        pixelId: t.pixelId,
      });
    }
  }
  return [...byAccount.values()];
}

/**
 * Audience snapshot — pulls inline values from the plan. Falls back to the
 * currently-selected targeting template's settings for fields the plan doesn't
 * carry directly (locations / age / gender / detailed targeting / exclusions).
 *
 * Once the Step 2 §3 UI is rebuilt to store these inline on the plan, this
 * helper can be simplified to read straight from the plan.
 */
function audienceFromPlan(plan: PlanV2): SetupAudienceConfig {
  const tpl = plan.targetingTemplateId
    ? TARGETING_TEMPLATES.find((t) => t.id === plan.targetingTemplateId)
    : undefined;
  const s = tpl?.settings;
  return {
    locations: s?.locations ?? "",
    ageMin: s?.ageMin ?? 18,
    ageMax: s?.ageMax ?? 65,
    gender: s?.gender ?? "all",
    detailedTargeting: s?.detailedTargeting ? [...s.detailedTargeting] : [],
    exclusions: s?.exclusions ? [...s.exclusions] : [],
    advantageAudience: plan.advantageAudience,
    advantageCreative: plan.advantageCreative,
  };
}

export function extractSetupPayload(plan: PlanV2): SetupTemplatePayload {
  const isLifetime = false; // v1: plan.budgetAmount is daily; lifetime carried separately when present.
  return {
    destinations: destinationsFromPlan(plan),
    campaign: {
      objective: plan.objective,
      intent: plan.intent,
      budgetMode: plan.budgetMode,
      advantagePlus: plan.advantagePlus,
      bidStrategy: plan.bidStrategy,
      dailyBudget: isLifetime ? undefined : plan.budgetAmount,
      lifetimeBudget: isLifetime ? plan.budgetAmount : undefined,
      format: plan.format,
    },
    adset: {
      placements:
        TARGETING_TEMPLATES.find((t) => t.id === plan.targetingTemplateId)?.settings.placements ?? "advantage",
      optimizationGoal: plan.optimizationGoal,
      scheduleType: "standard",
      specialAdCategory: [...plan.specialAdCategories],
      attribution: plan.attribution,
      destinationType: plan.destinationType,
      conversionEvent: plan.conversionEvent,
    },
    audience: audienceFromPlan(plan),
  };
}

export function extractDistributionPayload(plan: PlanV2): DistributionTemplatePayload {
  return {
    structure: { ...plan.structure },
    spread: plan.spread,
    pageDistribution: plan.pageDistribution,
    utmTemplate: plan.adCopy?.utmTemplate ?? "",
  };
}

/* ── Diff ──────────────────────────────────────────────────────────────── */

/** Stable JSON for value comparison (object key order is normalized). */
function stable(v: unknown): string {
  return JSON.stringify(v, (_key, val) => {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const sorted: Record<string, unknown> = {};
      for (const k of Object.keys(val as Record<string, unknown>).sort()) {
        sorted[k] = (val as Record<string, unknown>)[k];
      }
      return sorted;
    }
    return val;
  });
}

function eq(a: unknown, b: unknown): boolean {
  return stable(a) === stable(b);
}

export interface SetupTemplateDiff {
  destinations: boolean;
  campaign: boolean;
  adset: boolean;
  audience: boolean;
}

export interface DistributionTemplateDiff {
  structure: boolean;
  spread: boolean;
  pageDistribution: boolean;
  utmTemplate: boolean;
}

export function diffSetupTemplate(plan: PlanV2, tpl: SetupTemplatePayload): SetupTemplateDiff {
  const current = extractSetupPayload(plan);
  return {
    destinations: !eq(current.destinations, tpl.destinations),
    campaign: !eq(current.campaign, tpl.campaign),
    adset: !eq(current.adset, tpl.adset),
    audience: !eq(current.audience, tpl.audience),
  };
}

export function diffDistributionTemplate(
  plan: PlanV2,
  tpl: DistributionTemplatePayload,
): DistributionTemplateDiff {
  const current = extractDistributionPayload(plan);
  return {
    structure: !eq(current.structure, tpl.structure),
    spread: !eq(current.spread, tpl.spread),
    pageDistribution: !eq(current.pageDistribution, tpl.pageDistribution),
    utmTemplate: !eq(current.utmTemplate, tpl.utmTemplate),
  };
}

/** True if any section differs from the applied template payload. */
export function isSetupEdited(diff: SetupTemplateDiff): boolean {
  return diff.destinations || diff.campaign || diff.adset || diff.audience;
}

export function isDistributionEdited(diff: DistributionTemplateDiff): boolean {
  return diff.structure || diff.spread || diff.pageDistribution || diff.utmTemplate;
}
