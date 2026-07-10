/**
 * Static plan-catalogue data for the redesigned Step 1 "Plan selection"
 * screen (Figma 10990:44968). Pure display data — no pricing/billing API
 * involved, nothing here talks to Supabase or any UMS endpoint.
 *
 * The source frames don't fully agree with each other (they're independent
 * Figma exports), so every figure below cites the node it came from, and any
 * reconciliation choice is called out inline. Short version: monthly prices
 * come from the canonical frame (10990:44968); annual prices + the "Most
 * Popular" badge + the trial row come from the two "You're one step away"
 * variant frames (10421:46713 / 10597:46882), because their numbers are
 * internally consistent (unlike 11240:44564's annual figures, which
 * conflict with the canonical frame's own monthly prices — see below).
 */

export type PaidPlanId = "starter" | "growth" | "pro";
export type SelectablePlanId = "trial" | PaidPlanId;
export type BillingCycle = "monthly" | "annual";

export interface PaidPlan {
  id: PaidPlanId;
  name: string;
  subtitle: string;
  /** Figma 10990:44968 — nodes 11207:44570 / 44609 / 44617 ("Starter -
   *  $99" / "Growth - $249" / "Pro / Agency - $499"). */
  monthlyPrice: number;
  /** Figma 10421:46713 & 10597:46882 (identical "Premium" group data in
   *  both trial-row variants) — e.g. node 10427:47522 "$79" / "/ month
   *  ($900 billed yearly)". Used INSTEAD OF 11240:44564's annual figures
   *  (Starter "$249 → $99", "Save $679") because those conflict with the
   *  $99 *monthly* Starter price already established by the canonical
   *  frame — 11240:44564 is only borrowed for its visual PATTERN
   *  (strikethrough original + discounted price + "billed yearly" chip),
   *  not its numbers. */
  annualMonthlyPrice: number;
  /** Total charged per year when billing = annual — same nodes as above,
   *  the "($X billed yearly)" caption. */
  annualBilledTotal: number;
  /** Node 10605:47089 "*Badge* / Ribbon — Most Popular", attached to the
   *  Growth row in the trial-variant frames. Rendered regardless of
   *  billing cycle here — it's a merchandising label, not a pricing fact,
   *  so there's no reason it should disappear when the toggle flips. */
  mostPopular?: boolean;
  /** Figma 10990:44968 node 11207:44574 — the two-column checklist is only
   *  exported for the Starter card, since it's the one shown expanded in
   *  the static file. Growth/Pro have no checklist data anywhere in the
   *  source frames, so their expanded state shows only the subtitle (see
   *  "Figma details not reproduced" in the handoff notes). */
  features?: string[];
}

export const PAID_PLANS: PaidPlan[] = [
  {
    id: "starter",
    name: "Starter",
    subtitle: "Perfect for users exploring performance marketing",
    monthlyPrice: 99,
    annualMonthlyPrice: 79,
    annualBilledTotal: 900,
    features: [
      "2 Ad accounts",
      "500 Ad launches",
      "Automation unlocked during trial",
      "$50k spend limit (overage 0.3%)",
      "Industry Insights: 1 Competitor",
      "500 AI credits",
      "1 User",
      "1000 Creative uploads",
      "Community Support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    subtitle: "Perfect for growing teams and scaling operations",
    monthlyPrice: 249,
    annualMonthlyPrice: 199,
    annualBilledTotal: 1999,
    mostPopular: true,
  },
  {
    id: "pro",
    name: "Pro / Agency",
    subtitle: "Made for power users and agencies with all features",
    monthlyPrice: 499,
    // No monthly-rate discount at this tier — Figma shows the same $499
    // rate for both cycles; only the yearly lump total differs.
    annualMonthlyPrice: 499,
    annualBilledTotal: 3999,
  },
];

/** Figma 10421:46713/10597:46882 node 10421:47323 "Free 90 days Trial" +
 *  node 10427:47553 black chip "No credit card required" — rendered as a
 *  4th, non-expanding radio row above the paid plans per the task brief. */
export const TRIAL_PLAN = {
  id: "trial" as const,
  name: "Free 90 days Trial",
  chip: "No credit card required",
};

/** Figma 10990:44968's own "Save 30%" scribble (node 10990:45355) doesn't
 *  match the reconciled numbers above (Starter/Growth annual pricing is a
 *  ~20% discount; Pro has none), so the displayed figure follows the
 *  trial-variant frames' scribble text ("Save 20%", exported from node
 *  10608:47196 as src/assets/auth/signup-save20-scribble.svg) instead —
 *  that IS consistent with the annualMonthlyPrice figures used here. */
export const ANNUAL_SAVINGS_LABEL = "Save 20%";

export function priceForBilling(plan: PaidPlan, billing: BillingCycle): number {
  return billing === "monthly" ? plan.monthlyPrice : plan.annualMonthlyPrice;
}

/** Dollar amount saved per year vs. paying the monthly rate x12 — powers
 *  the "Save $X / billed yearly" chip (visual pattern borrowed from Figma
 *  11240:44564; the number itself is computed from this file's own data so
 *  it can never drift out of sync with what's displayed). */
export function annualSavings(plan: PaidPlan): number {
  return plan.monthlyPrice * 12 - plan.annualBilledTotal;
}
