/**
 * fieldGating — pure field-visibility / editability rules for the Review
 * master-detail editor.
 *
 * WHY THIS EXISTS
 * ───────────────
 * Several fields are only meaningful at one budget-mode level and must be
 * hidden or locked at sibling levels to avoid contradictory inputs:
 *   • Campaign "budgetAmount"  → only editable in CBO; locked (ABO) otherwise.
 *   • Ad-set   "dailyBudget"   → only editable in ABO; locked (CBO) otherwise.
 *
 * Additional conditional fields depend on ad-set-level resolved values:
 *   • Ad-set "conversionEvent" → only relevant when optimizationGoal is
 *     OFFSITE_CONVERSIONS or VALUE.
 *   • Ad-set "placements"      → only relevant when placementMode is "manual".
 *
 * Post-import guardrail (mirrors the Page Split lock in Step3AdDistributionV3):
 *   • Ad "__assetCustomization" → locked while ANY account has post import on
 *     (postModeActive). An existing-post ad IS the original post, so it can't
 *     be given a different crop/asset per placement the way a normal ad can.
 *     Note this is placement ASSET customization, not placement SELECTION —
 *     which placements an ad set runs on (ad-set "placements", above) is
 *     unaffected and stays editable under post import.
 *
 * PARENT RESOLUTION
 * ─────────────────
 * An ad-set's effective budget mode is that of its PARENT campaign (not the
 * global plan default), because a campaign can override the plan-level
 * budgetMode. The parent campaign id is derived by stripping the trailing
 * ":s{si}" segment from the ad-set node id.  This file encodes that
 * parent-lookup once so every caller gets consistent behaviour.
 */

import type { PlanV2, BudgetMode } from "../../types";
import type { NodeKind } from "./reviewModel";
import { resolveNodeValue } from "../../nodeOverrides";
import { postModeActive } from "../../deriveV2";

/* ── Public interface ─────────────────────────────────────────────────────── */

export interface FieldGate {
  /** Field is irrelevant at this node and should not render at all. */
  hidden?: boolean;
  /** Field is shown but read-only because a parent/sibling decision owns it. */
  locked?: boolean;
  /** Short human reason shown next to a locked field, e.g. "Set on the campaign". */
  reason?: string;
  /** Optional badge chip text, e.g. "CBO" / "ABO". */
  badge?: string;
}

/* ── Internal helpers ─────────────────────────────────────────────────────── */

/**
 * Derive the parent campaign node id from an ad-set node id.
 * e.g. "t0:fb_2001:c0:s1" → "t0:fb_2001:c0"
 */
function parentCampaignId(adsetNodeId: string): string {
  // Strip the last segment (":s{number}") from the adset id.
  return adsetNodeId.replace(/:s\d+$/, "");
}

/* ── Exports ──────────────────────────────────────────────────────────────── */

/**
 * Resolve the budget mode in force for a given node.
 *
 * • campaign → its own resolved budgetMode (may be overridden from plan default).
 * • adset    → its parent campaign's resolved budgetMode.
 * • anything else → the plan-level default (accounts / ads don't own budgets).
 */
export function resolvedBudgetMode(
  plan: PlanV2,
  kind: NodeKind,
  nodeId: string,
): BudgetMode {
  if (kind === "campaign") {
    return resolveNodeValue<BudgetMode>(plan, nodeId, "budgetMode", plan.budgetMode);
  }
  if (kind === "adset") {
    const campaignId = parentCampaignId(nodeId);
    return resolveNodeValue<BudgetMode>(plan, campaignId, "budgetMode", plan.budgetMode);
  }
  return plan.budgetMode;
}

/**
 * Compute the display gate for a single field on a single node.
 *
 * Returns {} (empty object) when the field is fully editable — callers should
 * treat an empty gate as "no restrictions".
 */
export function fieldGate(
  plan: PlanV2,
  kind: NodeKind,
  nodeId: string,
  fieldId: string,
): FieldGate {
  // ── Campaign-level gates ────────────────────────────────────────────────
  if (kind === "campaign" && fieldId === "budgetAmount") {
    const mode = resolvedBudgetMode(plan, kind, nodeId);
    if (mode === "ABO") {
      return { locked: true, reason: "Set on ad sets", badge: "ABO" };
    }
    return {};
  }

  // ── Ad-set-level gates ──────────────────────────────────────────────────
  if (kind === "adset") {
    if (fieldId === "dailyBudget") {
      const mode = resolvedBudgetMode(plan, kind, nodeId);
      if (mode === "CBO") {
        return { locked: true, reason: "Set on the campaign", badge: "CBO" };
      }
      return {};
    }

    if (fieldId === "conversionEvent") {
      const goal = resolveNodeValue<string>(
        plan,
        nodeId,
        "optimizationGoal",
        plan.optimizationGoal ?? "",
      );
      if (goal !== "OFFSITE_CONVERSIONS" && goal !== "VALUE") {
        return { hidden: true };
      }
      return {};
    }

    if (fieldId === "placements") {
      const mode = resolveNodeValue<string>(
        plan,
        nodeId,
        "placementMode",
        plan.placementMode,
      );
      if (mode !== "manual") {
        return { hidden: true };
      }
      return {};
    }
  }

  // ── Ad-level gates ───────────────────────────────────────────────────────
  if (kind === "ad" && fieldId === "__assetCustomization") {
    if (postModeActive(plan)) {
      return {
        locked: true,
        reason:
          "Locked while post import is on — existing-post ads run their original asset on every placement",
      };
    }
    return {};
  }

  // ── Default: no gate ────────────────────────────────────────────────────
  return {};
}

/**
 * Combine the gate across many selected nodes for bulk-edit scenarios.
 *
 * Rules:
 * • hidden — only when EVERY node has hidden:true.
 * • locked — only when EVERY node has locked:true; reason/badge taken from the
 *   first locked gate encountered.
 * • Otherwise the field is editable ({}).
 *
 * If any single node is plainly editable the field is treated as editable so
 * the user can still act on the nodes that allow it.
 */
export function fieldGateAcross(
  plan: PlanV2,
  kind: NodeKind,
  nodeIds: string[],
  fieldId: string,
): FieldGate {
  if (nodeIds.length === 0) return {};

  const gates = nodeIds.map((id) => fieldGate(plan, kind, id, fieldId));

  const allHidden = gates.every((g) => g.hidden === true);
  if (allHidden) return { hidden: true };

  const allLocked = gates.every((g) => g.locked === true);
  if (allLocked) {
    const first = gates.find((g) => g.locked === true)!;
    return { locked: true, reason: first.reason, badge: first.badge };
  }

  return {};
}
