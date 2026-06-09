/**
 * Launch v2 — Template payload summarizers.
 *
 * Pure functions that take a Setup or Distribution template payload and produce
 * a short, human-readable summary line for the templates management surface.
 *
 * Constraints:
 *   - No UI imports. Plain strings only.
 *   - No fabricated metrics — every value displayed must be a real field from
 *     the payload. If a field is empty, that part of the summary is skipped.
 *   - 2–3 key fields per template kind, joined with " · ".
 */

import type {
  DistributionTemplatePayload,
  SetupTemplatePayload,
} from "./types";

const SPREAD_LABELS: Record<string, string> = {
  one_per_adset: "One per ad-set",
  round_robin: "Round-robin",
  stacked: "Stacked",
  multiply: "Multiply",
  manual: "Manual",
};

/** Summarize a Setup template payload. Picks: destinations count, budget mode, format. */
export function summarizeSetup(payload: SetupTemplatePayload): string {
  const parts: string[] = [];

  const destCount = payload.destinations?.length ?? 0;
  if (destCount > 0) {
    parts.push(`${destCount} ${destCount === 1 ? "destination" : "destinations"}`);
  }

  const budget = payload.campaign?.budgetMode;
  if (budget) parts.push(budget);

  const format = payload.campaign?.format;
  if (format) parts.push(format);

  return parts.join(" · ");
}

/** Summarize a Distribution template payload. Picks: structure tuple, spread mode, page dist. */
export function summarizeDistribution(payload: DistributionTemplatePayload): string {
  const parts: string[] = [];

  const s = payload.structure;
  if (s) {
    parts.push(`${s.campaigns}×${s.adSetsPerCampaign}×${s.adsPerAdSet}`);
  }

  const spread = payload.spread;
  if (spread) parts.push(SPREAD_LABELS[spread] ?? spread);

  const page = payload.pageDistribution;
  if (page) {
    const label =
      page === "one_page"
        ? "One page"
        : page === "fill_first"
          ? "Fill first"
          : page === "equal"
            ? "Equal split"
            : page === "duplicate"
              ? "Duplicate"
              : page;
    parts.push(label);
  }

  return parts.join(" · ");
}
