/**
 * Launch v2 — Strategies service (localStorage-backed mock).
 *
 * Saves entire PlanV2 snapshots as reusable "launch strategies".
 * Storage key: `fabads:launchv2:strategies:v1`.
 * v1 uses a single hard-coded workspaceId — no per-workspace filtering yet.
 */

import type { PlanV2 } from "../types";

export const DEFAULT_WORKSPACE_ID = "ws_default";
const STORAGE_KEY = "fabads:launchv2:strategies:v1";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface LaunchStrategy {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  workspaceId: string;
  /** Snapshot of the full plan at save time. */
  plan: Partial<PlanV2>;
}

/** Human-readable summary of a strategy's key config for overview pills. */
export interface StrategySummary {
  objective: string;      // e.g. "Sales"
  intent: string;         // e.g. "Scale"
  budgetDisplay: string;  // e.g. "₹5,000/day · CBO"
  destinationsCount: number;
  format: string;         // e.g. "Video"
  spreadMode: string;     // e.g. "Round-robin"
  audienceSummary: string; // e.g. "India · 25–45"
}

/* ------------------------------------------------------------------ */
/*  Seed data (shown on first-ever empty load)                         */
/* ------------------------------------------------------------------ */

const NOW = new Date().toISOString();

const SEED_STRATEGIES: Array<{ name: string; plan: Partial<PlanV2> }> = [
  {
    name: "Scale — Sales INR",
    plan: {
      objective: "OUTCOME_SALES",
      intent: "scale",
      budgetAmount: 5000,
      budgetMode: "CBO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "single_video",
      spread: "round_robin",
      advantagePlus: true,
      targets: [
        {
          accountId: "act_001",
          accountName: "Idea Clan — IN01",
          currency: "INR",
          pageId: "page_001",
          fbPageId: "fb_001",
          pageName: "Brand Page IN",
          pixelId: "px_001",
        },
      ],
      structure: { campaigns: 1, adSetsPerCampaign: 3, adsPerAdSet: 5 },
      pageDistribution: "fill_first",
    },
  },
  {
    name: "Test — Awareness",
    plan: {
      objective: "OUTCOME_AWARENESS",
      intent: "test",
      budgetAmount: 1000,
      budgetMode: "ABO",
      bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      format: "single_image",
      spread: "one_per_adset",
      advantagePlus: false,
      targets: [
        {
          accountId: "act_002",
          accountName: "Idea Clan — IN02",
          currency: "INR",
          pageId: "page_002",
          fbPageId: "fb_002",
          pageName: "Brand Page Test",
          pixelId: undefined,
        },
      ],
      structure: { campaigns: 2, adSetsPerCampaign: 2, adsPerAdSet: 2 },
      pageDistribution: "equal",
    },
  },
];

/* ------------------------------------------------------------------ */
/*  Storage helpers                                                     */
/* ------------------------------------------------------------------ */

function readAll(): LaunchStrategy[] {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LaunchStrategy[]) : [];
  } catch {
    return [];
  }
}

function writeAll(list: LaunchStrategy[]): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore quota / privacy errors */
  }
}

function genId(): string {
  return `strat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/* ------------------------------------------------------------------ */
/*  Seed on first empty load                                           */
/* ------------------------------------------------------------------ */

let seeded = false;

function hydrate(): LaunchStrategy[] {
  let list = readAll();
  if (!seeded && list.length === 0) {
    list = SEED_STRATEGIES.map(({ name, plan }) => ({
      id: genId(),
      name,
      createdAt: NOW,
      updatedAt: NOW,
      workspaceId: DEFAULT_WORKSPACE_ID,
      plan,
    }));
    writeAll(list);
    seeded = true;
  } else {
    seeded = true;
  }
  return list;
}

/* ------------------------------------------------------------------ */
/*  Summarize helpers                                                   */
/* ------------------------------------------------------------------ */

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "AED ",
};

function currSym(code?: string): string {
  if (!code) return "";
  return CURRENCY_SYMBOLS[code] ?? `${code} `;
}

function formatBudget(plan: Partial<PlanV2>): string {
  const amount = plan.budgetAmount;
  const currency = plan.targets?.[0]?.currency;
  const mode = plan.budgetMode;
  if (!amount) return "—";
  const sym = currSym(currency);
  const formatted = `${sym}${Math.round(amount).toLocaleString("en-IN")}/day`;
  return mode ? `${formatted} · ${mode}` : formatted;
}

const SPREAD_LABELS: Record<string, string> = {
  round_robin: "Round-robin",
  one_per_adset: "One per ad set",
  stacked: "Stacked",
  multiply: "Multiply",
  manual: "Manual",
};

function prettifySpread(spread?: string): string {
  if (!spread) return "—";
  return SPREAD_LABELS[spread] ?? spread;
}

const FORMAT_LABELS: Record<string, string> = {
  single_image: "Image",
  single_video: "Video",
  carousel: "Carousel",
  collection: "Collection",
  flexible: "Flexible",
  dpa: "DPA",
};

function prettifyFormat(format?: string | null): string {
  if (!format) return "—";
  return FORMAT_LABELS[format] ?? format;
}

function prettifyObjective(objective?: string | null): string {
  if (!objective) return "—";
  // Strip "OUTCOME_" prefix and capitalize first letter, lowercase rest
  const raw = objective.replace(/^OUTCOME_/, "");
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function prettifyIntent(intent?: string | null): string {
  if (!intent) return "—";
  return intent.charAt(0).toUpperCase() + intent.slice(1);
}

/* ------------------------------------------------------------------ */
/*  Service                                                             */
/* ------------------------------------------------------------------ */

export const strategiesService = {
  /** Force re-hydration on next call (test hook). */
  _reset(): void {
    seeded = false;
  },

  list(): LaunchStrategy[] {
    return hydrate().sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  },

  get(id: string): LaunchStrategy | undefined {
    return hydrate().find((s) => s.id === id);
  },

  save(name: string, plan: Partial<PlanV2>): LaunchStrategy {
    const list = hydrate();
    const now = new Date().toISOString();
    const strategy: LaunchStrategy = {
      id: genId(),
      name: name.trim() || "Untitled strategy",
      createdAt: now,
      updatedAt: now,
      workspaceId: DEFAULT_WORKSPACE_ID,
      plan,
    };
    writeAll([...list, strategy]);
    return strategy;
  },

  rename(id: string, name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    const list = hydrate().map((s) =>
      s.id === id ? { ...s, name: trimmed, updatedAt: new Date().toISOString() } : s,
    );
    writeAll(list);
  },

  remove(id: string): void {
    writeAll(hydrate().filter((s) => s.id !== id));
  },

  summarize(strategy: LaunchStrategy): StrategySummary {
    const { plan } = strategy;

    // Audience summary: first location name + age range from targeting template
    // or from the first target name as fallback
    let audienceSummary = "—";
    const firstTarget = plan.targets?.[0];
    if (firstTarget) {
      const location = firstTarget.accountName.includes("IN") ? "India" : firstTarget.accountName;
      audienceSummary = location;
    }

    return {
      objective: prettifyObjective(plan.objective),
      intent: prettifyIntent(plan.intent),
      budgetDisplay: formatBudget(plan),
      destinationsCount: plan.targets?.length ?? 0,
      format: prettifyFormat(plan.format),
      spreadMode: prettifySpread(plan.spread),
      audienceSummary,
    };
  },
};
