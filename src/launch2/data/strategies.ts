/**
 * The 7 strategy playbooks.
 *
 * IMPORTANT data-provenance note:
 *   - Bruno is the only [V] VERIFIED playbook (50 ad sets × 1 creative × $1/day).
 *   - The other 6 are [I] INFERRED placeholders — realistic, plausible numbers
 *     invented so the module is fully demonstrable. Maalik will correct the
 *     specifics. Each carries `verified: false` + an `inferredNote` so the UI
 *     can surface the [I] tag and nobody mistakes them for locked truth.
 */
import type { StrategyPlaybook } from "../types";

export const STRATEGIES: StrategyPlaybook[] = [
  {
    id: "bruno",
    name: "Bruno",
    tagline: "50 ad sets · 1 creative each · $1/day",
    verified: true,
    objective: "sales",
    structure: { campaigns: 1, adSetsPerCampaign: 50, adsPerAdSet: 1 },
    budgetPerAdSet: 1,
    budgetType: "daily",
    bidStrategy: "Highest volume",
    description:
      "Broad low-budget spray — 50 ad sets, one creative each, $1/day. Let Meta find the pocket of demand fast, then scale the winners.",
    recommendedFor: "Fast, cheap signal on a new product or creative.",
  },
  {
    id: "bid-cap",
    name: "Bid Cap",
    tagline: "Cost-controlled scaling with a bid ceiling",
    verified: false,
    objective: "sales",
    structure: { campaigns: 1, adSetsPerCampaign: 8, adsPerAdSet: 2 },
    budgetPerAdSet: 25,
    budgetType: "daily",
    bidStrategy: "Bid cap",
    description:
      "Fewer ad sets at a higher budget, each with a bid cap to hold CPA in a known band while you push volume.",
    inferredNote:
      "[I] Placeholder structure + budgets — confirm bid-cap value, ad-set count and budgets.",
    recommendedFor: "Scaling a proven offer with strict cost control.",
  },
  {
    id: "phase-audience",
    name: "Phase-wise Audience Testing",
    tagline: "Staged audience rollout, phase by phase",
    verified: false,
    objective: "sales",
    structure: { campaigns: 1, adSetsPerCampaign: 12, adsPerAdSet: 1 },
    budgetPerAdSet: 10,
    budgetType: "daily",
    bidStrategy: "Highest volume",
    description:
      "Test audiences in deliberate phases — interests, then lookalikes, then broad — so learnings compound instead of competing.",
    inferredNote:
      "[I] Placeholder phases + budgets — confirm phase count, audiences per phase and budgets.",
    recommendedFor: "Mapping which audiences respond before scaling spend.",
  },
  {
    id: "tg-testing",
    name: "TG Testing (CCC / PCC / SMKD)",
    tagline: "Target-group testing across creative cohorts",
    verified: false,
    objective: "sales",
    structure: { campaigns: 1, adSetsPerCampaign: 9, adsPerAdSet: 3 },
    budgetPerAdSet: 15,
    budgetType: "daily",
    bidStrategy: "Highest volume",
    description:
      "Run distinct target-group cohorts (CCC / PCC / SMKD) against the same creative pool to isolate which group converts.",
    inferredNote:
      "[I] Placeholder cohorts + budgets — confirm what CCC/PCC/SMKD map to and their structure.",
    recommendedFor: "Isolating the highest-intent target group.",
  },
  {
    id: "asc-scaling",
    name: "ASC / High-Budget Scaling",
    tagline: "Advantage+ Shopping, consolidated high budget",
    verified: false,
    objective: "sales",
    structure: { campaigns: 1, adSetsPerCampaign: 1, adsPerAdSet: 10 },
    budgetPerAdSet: 500,
    budgetType: "daily",
    bidStrategy: "Highest volume",
    description:
      "One consolidated Advantage+ Shopping campaign with a high daily budget and a deep creative pool — let the algorithm allocate.",
    inferredNote:
      "[I] Placeholder budget + creative count — confirm ASC budget band and pool size.",
    recommendedFor: "Scaling spend on a validated catalogue / offer.",
  },
  {
    id: "duplication",
    name: "Duplication",
    tagline: "Clone a proven winner across destinations",
    verified: false,
    objective: "sales",
    structure: { campaigns: 1, adSetsPerCampaign: 5, adsPerAdSet: 2 },
    budgetPerAdSet: 20,
    budgetType: "daily",
    bidStrategy: "Highest volume",
    description:
      "Take a known winner and duplicate it across ad sets / pages to multiply reach without rebuilding from scratch.",
    inferredNote:
      "[I] Placeholder multiplier + budgets — confirm duplication count and budget handling.",
    recommendedFor: "Multiplying a winner you don't want to disturb.",
  },
  {
    id: "social-proofing",
    name: "Social Proofing",
    tagline: "Consolidate engagement onto one Post ID",
    verified: false,
    objective: "engagement",
    structure: { campaigns: 1, adSetsPerCampaign: 6, adsPerAdSet: 1 },
    budgetPerAdSet: 8,
    budgetType: "daily",
    bidStrategy: "Highest volume",
    description:
      "Point multiple ad sets at the same Post ID so likes / comments / shares accumulate on one post — building social proof before scaling.",
    inferredNote:
      "[I] Placeholder structure — confirm Post-ID handling and ad-set count.",
    recommendedFor: "Stacking social proof on a hero post pre-scale.",
  },
];

export function getStrategy(id: string | null | undefined): StrategyPlaybook | undefined {
  if (!id) return undefined;
  return STRATEGIES.find((s) => s.id === id);
}

/** Total ads a playbook's structure produces per destination. */
export function adsPerDestination(s: StrategyPlaybook): number {
  return s.structure.campaigns * s.structure.adSetsPerCampaign * s.structure.adsPerAdSet;
}
