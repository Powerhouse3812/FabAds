/** Shared fixtures for selector tests (not a test file itself). */
import type { Ad } from "../types";
import { buildIndex, generateUniverse } from "../data";

export const NOW = Date.UTC(2026, 9, 10, 12, 0, 0);
export const DAY = 86_400_000;
export const U = generateUniverse({ now: NOW });
export const D = buildIndex(U);

/** Clone a real ad with overrides (deep enough for analysis/engagement). */
export function makeAd(overrides: Partial<Ad> = {}, from: Ad = U.ads[0]): Ad {
  return {
    ...from,
    analysis: { ...from.analysis },
    engagement: { ...from.engagement },
    ...overrides,
  };
}

export const iso = (ms: number) => new Date(ms).toISOString();
