import type { StrategyKey, StrategyPreset } from "../types";

/**
 * The 7 named playbooks — the differentiator. Picking a strategy
 * auto-configures structure + budget; everything is editable downstream.
 *
 * Only **Bruno** is verified [V] (IdeaClan Slack 2026-05-06: 50×1×$1).
 * The other six are inferred defaults [I] — flagged `verified: false` so the
 * UI can surface an "[I] default — confirm" cue. Tune the numbers freely;
 * they are realistic placeholders, not Meta-mandated.
 */
export const STRATEGY_PRESETS: Record<StrategyKey, StrategyPreset> = {
  bruno: {
    key: "bruno",
    label: "Bruno",
    tagline: "50 ad sets × 1 creative × $1 — broad winner-hunt",
    verified: true,
    budgetLevel: "adset",
    adsetCount: 50,
    creativesPerAdset: 1,
    perUnitBudget: 1,
    bidStrategy: "lowest_cost",
    defaultObjective: "sales",
    audienceHint: "Broad — no detailed targeting",
    notes: "The volume play. 50 broad $1 ad sets to surface a winner fast.",
  },
  bidcap: {
    key: "bidcap",
    label: "Bid-cap",
    tagline: "Bid-cap campaigns for CPA control",
    verified: false,
    budgetLevel: "campaign",
    adsetCount: 5,
    creativesPerAdset: 2,
    perUnitBudget: 50,
    bidStrategy: "bid_cap",
    defaultObjective: "sales",
    audienceHint: "Prospecting — broad + 1–2 interest stacks",
    notes: "CPA-controlled scaling. Requires a bid cap per ad set.",
  },
  phasewise: {
    key: "phasewise",
    label: "Phase-wise Audience",
    tagline: "Staged audience testing — broad → narrowed",
    verified: false,
    budgetLevel: "adset",
    adsetCount: 4,
    creativesPerAdset: 2,
    perUnitBudget: 20,
    bidStrategy: "lowest_cost",
    defaultObjective: "sales",
    audienceHint: "Phase 1 broad → Phase 2 narrowed winners",
    notes: "Two phases: broad discovery, then concentrate budget on winners.",
  },
  tg: {
    key: "tg",
    label: "TG (Target Group)",
    tagline: "CCC / PCC / SMKD prospecting",
    verified: false,
    budgetLevel: "adset",
    adsetCount: 3,
    creativesPerAdset: 1,
    perUnitBudget: 15,
    bidStrategy: "lowest_cost",
    defaultObjective: "leads",
    audienceHint: "3 target groups: CCC, PCC, SMKD",
    notes: "One ad set per target group for clean read on prospecting.",
  },
  asc: {
    key: "asc",
    label: "ASC / High-Budget Scaling",
    tagline: "Advantage+ Shopping, high-budget scale",
    verified: false,
    budgetLevel: "campaign",
    adsetCount: 1,
    creativesPerAdset: 6,
    perUnitBudget: 200,
    bidStrategy: "lowest_cost",
    defaultObjective: "sales",
    audienceHint: "Advantage+ audience (algorithmic)",
    notes: "Single ASC campaign, high daily budget, many creatives in one pool.",
  },
  duplication: {
    key: "duplication",
    label: "Duplication",
    tagline: "Duplicate winners across pages/accounts",
    verified: false,
    budgetLevel: "adset",
    adsetCount: 6,
    creativesPerAdset: 1,
    perUnitBudget: 10,
    bidStrategy: "lowest_cost",
    defaultObjective: "sales",
    audienceHint: "Inherit winner's audience",
    notes: "Clone a proven winner across selected pages/accounts.",
  },
  socialproof: {
    key: "socialproof",
    label: "Social Proofing",
    tagline: "Relaunch winner via Post-ID",
    verified: false,
    budgetLevel: "adset",
    adsetCount: 1,
    creativesPerAdset: 1,
    perUnitBudget: 30,
    bidStrategy: "lowest_cost",
    defaultObjective: "engagement",
    audienceHint: "Inherit winner's audience",
    notes: "Reuse an existing post (Post-ID) to carry social proof forward.",
  },
};

export const STRATEGY_ORDER: StrategyKey[] = [
  "bruno",
  "bidcap",
  "phasewise",
  "tg",
  "asc",
  "duplication",
  "socialproof",
];

export function getPreset(key: StrategyKey | null): StrategyPreset | null {
  return key ? STRATEGY_PRESETS[key] : null;
}
