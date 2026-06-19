/**
 * planUnits — THE single source of truth for what a plan launches.
 *
 * `buildPlanUnits(plan)` expands a PlanV2 into the flat list of canonical ad
 * units (one entry per ad), each tagged with stable hierarchy node IDs that
 * MATCH the review tree and the `plan.nodeOverrides` keys. Both the Review tree
 * (`reviewModel.buildReviewTree`) and the launch engine
 * (`mockLaunchV2.buildUnitsV2`) derive from this — so what the user reviews is
 * exactly what launches ("show = launch").
 *
 * Node ID encoding (shared contract — keep in sync with `nodeKindFromId`):
 *   account:  acct:t{ti}:{fbPageId}
 *   campaign: t{ti}:{fbPageId}:c{ci}
 *   adset:    t{ti}:{fbPageId}:c{ci}:s{si}
 *   ad:       t{ti}:{fbPageId}:c{ci}:s{si}:a{k}
 *
 * The target index `ti` is included in every ID so two accounts that share the
 * same Facebook page never produce colliding node IDs (fixes shared-fbPageId
 * collision where overrides would bleed across accounts).
 *
 * Per-node overrides are resolved here, so the `resolved` snapshot each unit
 * carries is exactly what a real Graph API payload would send. Adding a node
 * override therefore changes BOTH the review surface and the launch output —
 * there is no separate path that can drift.
 */
import type { BudgetMode, CreativeRef, PlanV2, TargetPair } from "./types";
import { perTargetCounts } from "./deriveV2";
import { resolveNodeValue } from "./nodeOverrides";

/** Resolve a naming pattern for a unit (was private to mockLaunchV2). */
export function resolveName(
  plan: PlanV2,
  ctx: { brand: string; adset: string; n: number },
): string {
  const map: Record<string, string> = {
    "{brand}": ctx.brand,
    "{intent}": plan.intent,
    "{objective}": (plan.objective ?? "").replace("OUTCOME_", "").toLowerCase(),
    "{date}": (plan.createdAt || "").slice(0, 10),
    "{adset}": ctx.adset,
    "{n}": String(ctx.n),
  };
  let out = plan.namingPattern || "{brand}_{intent}_{date}";
  for (const [k, v] of Object.entries(map)) out = out.split(k).join(v);
  return out.replace(/_{2,}/g, "_").replace(/^_+|_+$/g, "") || "Launch";
}

/** Override-aware resolved snapshot — what actually launches for one ad. */
export interface ResolvedUnitFields {
  campaignName: string;
  budgetMode: BudgetMode;
  budgetAmount: number;
  adSetName: string;
  optimizationGoal: string;
  adName: string;
  primaryText: string;
  headline: string;
  cta: string;
  destinationUrl: string;
}

export interface CanonicalUnit {
  /** zero-based hierarchy indices */
  targetIndex: number;
  campaignIndex: number;
  adSetIndex: number;
  adIndex: number; // k within the ad set
  /** stable node IDs (match review tree + nodeOverrides keys) */
  accountNodeId: string;
  campaignNodeId: string;
  adSetNodeId: string;
  adNodeId: string;
  /** context */
  target: TargetPair;
  creativeId: string;
  creativeName: string;
  /** brand prefix derived from the account name (for naming) */
  brand: string;
  /** override-aware values — exactly what a real Graph API payload would carry */
  resolved: ResolvedUnitFields;
}

const FALLBACK_CREATIVE: CreativeRef = {
  id: "default",
  name: "Creative",
  format: "single_image",
  source: "library",
};

/**
 * Expand a plan into its canonical ad units across
 * targets × campaigns × ad sets × ads, honoring `structure.campaigns` (all
 * campaigns are real) and the active page distribution. Overrides are resolved
 * per node.
 */
export function buildPlanUnits(plan: PlanV2): CanonicalUnit[] {
  if (plan.targets.length === 0) return [];

  const creatives: CreativeRef[] = plan.creatives.length ? plan.creatives : [FALLBACK_CREATIVE];
  const objLabel = (plan.objective ?? "").replace("OUTCOME_", "");
  const adSetsPer = Math.max(plan.structure.adSetsPerCampaign, 1);
  const campaignsN = Math.max(plan.structure.campaigns, 1);
  const slots = campaignsN * adSetsPer;

  const counts = perTargetCounts(plan);
  const units: CanonicalUnit[] = [];
  let globalN = 0;

  plan.targets.forEach((target: TargetPair, ti) => {
    const total = counts[ti] ?? 0;
    const brand = target.accountName.split("—")[0].trim();
    const accountNodeId = `acct:t${ti}:${target.fbPageId}`;
    let leafIdx = 0;

    for (let ci = 0; ci < campaignsN; ci++) {
      const campaignNodeId = `t${ti}:${target.fbPageId}:c${ci}`;
      const campaignName = resolveNodeValue(
        plan,
        campaignNodeId,
        "campaignName",
        `${objLabel} · C${ci + 1}`,
      );
      const budgetMode = resolveNodeValue(plan, campaignNodeId, "budgetMode", plan.budgetMode);
      const budgetAmount = resolveNodeValue(
        plan,
        campaignNodeId,
        "budgetAmount",
        plan.budgetAmount,
      );

      for (let si = 0; si < adSetsPer; si++) {
        const slot = ci * adSetsPer + si;
        const base = Math.floor(total / slots);
        const extra = slot < total % slots ? 1 : 0;
        const baselineSlotCount = base + extra;

        const adSetNodeId = `t${ti}:${target.fbPageId}:c${ci}:s${si}`;
        const adSetLabelDefault = `Ad set ${String(si + 1).padStart(2, "0")}`;
        const adSetName = resolveNodeValue(plan, adSetNodeId, "adSetName", adSetLabelDefault);
        const optimizationGoal = resolveNodeValue(
          plan,
          adSetNodeId,
          "optimizationGoal",
          plan.optimizationGoal ?? "",
        );

        // A3: per-adset ad-count override — user can set adsPerAdSet on a specific ad set node.
        const adsHere = resolveNodeValue(plan, adSetNodeId, "adsPerAdSet", baselineSlotCount);

        for (let k = 0; k < adsHere; k++) {
          const creative = creatives[leafIdx % creatives.length];
          leafIdx++;
          globalN++;
          const adNodeId = `t${ti}:${target.fbPageId}:c${ci}:s${si}:a${k}`;
          const adNameDefault = resolveName(plan, {
            brand,
            adset: String(si + 1).padStart(2, "0"),
            n: globalN,
          });

          units.push({
            targetIndex: ti,
            campaignIndex: ci,
            adSetIndex: si,
            adIndex: k,
            accountNodeId,
            campaignNodeId,
            adSetNodeId,
            adNodeId,
            target,
            creativeId: creative.id,
            creativeName: creative.name,
            brand,
            resolved: {
              campaignName,
              budgetMode,
              budgetAmount,
              adSetName,
              optimizationGoal,
              adName: resolveNodeValue(plan, adNodeId, "name", adNameDefault),
              primaryText: resolveNodeValue(
                plan,
                adNodeId,
                "primaryText",
                plan.adCopy.primaryText,
              ),
              headline: resolveNodeValue(plan, adNodeId, "headline", creative.name),
              cta: resolveNodeValue(plan, adNodeId, "cta", plan.adCopy.cta),
              destinationUrl: resolveNodeValue(
                plan,
                adNodeId,
                "destinationUrl",
                plan.adCopy.destinationUrl,
              ),
            },
          });
        }
      }
    }
  });

  return units;
}
