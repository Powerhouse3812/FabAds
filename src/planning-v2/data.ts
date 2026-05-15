/**
 * Planning V2 — modal data.
 *
 * Re-exports V1's pricing + content so the modal renders the FULL bucket
 * list for each plan (every heading, every item). Card layout in
 * PlanCardV2 handles density — 2-column inner grid for AI tier, single
 * column for Growth — to keep the modal scroll-free at common viewports.
 *
 * History:
 *   - First v2 cut hid buckets behind 4 curated highlights. Maalik shot
 *     it down — pricing decisions need every pointer visible. The
 *     HIGHLIGHTS_V2 map was dropped; cards now use plan.buckets directly.
 *
 * Editing this file changes ONLY V2. V1 page stays untouched.
 */

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
export type { PlanDef, Tier, View, Billing } from "@/planning/data";

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
