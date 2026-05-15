/**
 * Planning V2 — minimal modal data.
 *
 * Re-exports V1's pricing logic + adds a CURATED 4-feature list per plan.
 * V1 ships full bucket lists (6 sections × multiple items each) for the
 * full-page experience. V2 is a no-scroll modal — so we hand-pick the 4
 * most decision-relevant features per plan for the new-user funnel.
 *
 * Rule of thumb on which 4 features make the cut:
 *   1. Seats / accounts (scope)
 *   2. Credits or core volume (what they get to do)
 *   3. The one capability that differentiates this plan from cheaper ones
 *   4. Support / storage (trust signal)
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

/**
 * 4-feature highlight list per plan. Keep tight — these are the ONLY
 * features rendered in the V2 modal card body. No buckets, no headings.
 */
export const HIGHLIGHTS_V2: Record<string, string[]> = {
  "ai-individual": [
    "1 user · unlimited brands",
    "100 AI credits / month",
    "Video Sage + 5 competitor tracking",
    "Email support · 20 GB storage",
  ],
  "ai-team": [
    "3–15 user bundle · shared workspace",
    "450 AI credits / month, pooled",
    "Video Sage + 15 competitor tracking",
    "Priority support · 100 GB storage",
  ],
  "growth-starter": [
    "Unlimited team · 5 ad accounts",
    "Bulk Launcher (manual) + Basic rules",
    "Meta · TikTok · NewsBreak",
    "Multi-account reporting + AI Co-pilot",
  ],
  "growth-pro": [
    "Unlimited team · 15 ad accounts",
    "Bulk Launcher (automated) + Cloning",
    "Advanced automation + Co-pilot",
    "Cross-platform reporting · Priority support",
  ],
  "growth-enterprise": [
    "Everything in Pro",
    "Unlimited ad accounts + API access",
    "Custom dashboards + integrations",
    "Dedicated CSM + SLA-backed support",
  ],
};

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
