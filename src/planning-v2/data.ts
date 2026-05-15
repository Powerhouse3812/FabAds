/**
 * Planning V2 — modal data.
 *
 * Re-exports V1's pricing + content. Cards render the bucket list
 * collapsed to 1 bullet per bucket (items joined with `·`). For
 * upgrade plans (Growth Pro, Growth Enterprise) the card shows an
 * "Everything in {base}, plus:" intro and ONLY the delta items above
 * the previous tier — Stripe / Linear-style cumulative pricing.
 *
 * History:
 *   - First v2 cut hid buckets behind 4 curated highlights. Maalik shot
 *     it down — pricing decisions need every pointer visible. The
 *     HIGHLIGHTS_V2 map was dropped; cards now use plan.buckets directly.
 *   - Second cut: summarise buckets to 1-bullet-per-bucket inline.
 *   - Third cut (this): cumulative pattern — upgrade tiers show only
 *     their delta over the previous tier.
 *
 * Editing this file changes ONLY V2. V1 page stays untouched.
 */

import type { PlanFeatureBucket } from "@/planning/data";
import {
  AI_INDIVIDUAL as V1_AI_INDIVIDUAL,
  AI_TEAM as V1_AI_TEAM,
  GROWTH_STARTER as V1_GROWTH_STARTER,
  GROWTH_PRO as V1_GROWTH_PRO,
  GROWTH_ENTERPRISE as V1_GROWTH_ENTERPRISE,
  type PlanDef,
  type Tier,
  type View,
  type Billing,
} from "@/planning/data";

export { priceFor, formatMoney } from "@/planning/data";
export type {
  PlanDef,
  PlanFeatureBucket,
  Tier,
  View,
  Billing,
} from "@/planning/data";

/* Re-export the V1 plan defs so V2 doesn't fork pricing. */
export const AI_INDIVIDUAL = V1_AI_INDIVIDUAL;
export const AI_TEAM = V1_AI_TEAM;
export const GROWTH_STARTER = V1_GROWTH_STARTER;
export const GROWTH_PRO = V1_GROWTH_PRO;
export const GROWTH_ENTERPRISE = V1_GROWTH_ENTERPRISE;

export const AI_PLANS_V2: PlanDef[] = [AI_INDIVIDUAL, AI_TEAM];
export const GROWTH_PLANS_V2: PlanDef[] = [
  GROWTH_STARTER,
  GROWTH_PRO,
  GROWTH_ENTERPRISE,
];

/* ── Cumulative / delta helpers ─────────────────────────────────────
 * Growth Pro = "Everything in Starter, plus:" + delta items.
 * Growth Enterprise = "Everything in Pro, plus:" + delta items.
 *
 * AI tier (only 2 plans) stays as standalone — Maalik scoped this to
 * Growth tier only. If we want cumulative for AI Team later, just add
 * an entry to BASE_PLAN below.
 * ─────────────────────────────────────────────────────────────────── */

/** Maps an upgrade plan's id → its base plan (the one it inherits from). */
export const BASE_PLAN: Record<string, { id: string; label: string }> = {
  "growth-pro": { id: "growth-starter", label: "Starter" },
  "growth-enterprise": { id: "growth-pro", label: "Pro" },
};

const ALL_PLANS_INDEX: Record<string, PlanDef> = {
  [AI_INDIVIDUAL.id]: AI_INDIVIDUAL,
  [AI_TEAM.id]: AI_TEAM,
  [GROWTH_STARTER.id]: GROWTH_STARTER,
  [GROWTH_PRO.id]: GROWTH_PRO,
  [GROWTH_ENTERPRISE.id]: GROWTH_ENTERPRISE,
};

/**
 * Compute the per-bucket delta of `plan` over its base plan.
 *
 * - Items in `plan` that already appear (same string) in the same-named
 *   base bucket are dropped.
 *   e.g. "Unlimited team members" exists in both Starter and Pro Account
 *   bucket → dropped from Pro's delta.
 * - Items matching `/^Everything in /` are dropped (we render that as a
 *   separate intro line, not as a bullet).
 *   e.g. Enterprise Campaign ops literally has "Everything in Pro" — we
 *   skip it so the card doesn't show it twice.
 * - New buckets (heading not in base) keep all their items.
 *   e.g. Enterprise Integrations bucket doesn't exist in Pro → all kept.
 * - Empty buckets after filter are dropped from the result.
 *
 * Falls back to the full bucket list if the plan has no base (i.e. it's
 * Starter or an AI plan). Caller can also check `BASE_PLAN[plan.id]` to
 * decide whether to render the "Everything in X" intro.
 */
export function getDeltaBuckets(plan: PlanDef): PlanFeatureBucket[] {
  const base = BASE_PLAN[plan.id];
  if (!base) return plan.buckets;
  const basePlan = ALL_PLANS_INDEX[base.id];
  if (!basePlan) return plan.buckets;

  const baseByHeading: Record<string, Set<string>> = {};
  basePlan.buckets.forEach((b) => {
    baseByHeading[b.heading] = new Set(b.items.map((i) => i.trim()));
  });

  return plan.buckets
    .map((b) => {
      const baseSet = baseByHeading[b.heading];
      const filtered = b.items.filter(
        (i) => !/^Everything in /i.test(i.trim()),
      );
      const newItems = baseSet
        ? filtered.filter((i) => !baseSet.has(i.trim()))
        : filtered;
      return { heading: b.heading, items: newItems };
    })
    .filter((b) => b.items.length > 0);
}
