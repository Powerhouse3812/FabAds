import type { BidStrategy } from "../types";

// The shape of persisted defaults
export interface LaunchDefaults {
  budgetAmount: number;
  budgetMode: "ABO" | "CBO";
  bidStrategy: BidStrategy;
  intent: "test" | "scale" | "custom";
  advantagePlus: boolean;
  advantageAudience: boolean;
  advantageCreative: boolean;
  attribution: { clickWindow: number; viewWindow: number };
  utmSource: string;
  utmMedium: string;
  // Naming patterns for all 3 levels
  campaignNamePattern: string;
  adSetNamePattern: string;
  adNamePattern: string; // was: plan.namingPattern (ad-level only, now promoted to defaults)
}

// Factory defaults (returned when nothing is saved)
const FACTORY: LaunchDefaults = {
  budgetAmount: 1000,
  budgetMode: "ABO",
  bidStrategy: "LOWEST_COST_WITHOUT_CAP",
  intent: "custom",
  advantagePlus: false,
  advantageAudience: true,
  advantageCreative: true,
  attribution: { clickWindow: 7, viewWindow: 1 },
  utmSource: "",
  utmMedium: "paid-social",
  campaignNamePattern: "{brand}_{objective}_{date}",
  adSetNamePattern: "{brand}_{objective}",
  adNamePattern: "{brand}_{intent}_{date}",
};

const KEY = "fabads:launchv2:defaults:v1";

/** Load persisted defaults, falling back to FACTORY for any missing fields. */
export function loadDefaults(): LaunchDefaults {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...FACTORY };
    const parsed = JSON.parse(raw) as Partial<LaunchDefaults>;
    return {
      ...FACTORY,
      ...parsed,
      // Deep-merge nested attribution object so partial overrides don't wipe sub-fields
      attribution: {
        ...FACTORY.attribution,
        ...(parsed.attribution ?? {}),
      },
    };
  } catch {
    return { ...FACTORY };
  }
}

/** Save the full defaults profile. */
export function saveDefaults(d: LaunchDefaults): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    // Silently swallow storage errors (quota exceeded, private browsing, etc.)
  }
}

/** Reset to factory defaults. */
export function resetDefaults(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Silently swallow storage errors
  }
}
