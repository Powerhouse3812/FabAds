import type { TagGroupKey } from "@/lib/insights-v3/types";
import { fmtInt, singular } from "./format";

/**
 * "108 ads have no country, so counts won't add up to the total." — data-driven off
 * `TopTenGroup.missing`. Returns null when nothing is missing.
 */
export function missingNote(missing: number | undefined, noun: string, groupLabel: string, key: TagGroupKey): string | null {
  if (!missing || missing <= 0) return null;
  const one = missing === 1;
  const base = `${fmtInt(missing)} ${one ? singular(noun) : noun} ${one ? "has" : "have"} no ${groupLabel.toLowerCase()}`;
  return key === "country" ? `${base}, so counts won't add up to the total` : base;
}
