/**
 * The three real ad statuses. `splitByStatus` in launch-distribution.ts already
 * routes "scheduled"; this module is just the shared UI vocabulary (labels +
 * Badge variants) so the per-ad control and any status display stay in sync.
 */

import type { BadgeProps } from "@/components/ui/badge";

export type AdStatus = "active" | "scheduled" | "paused";

export const AD_STATUSES: AdStatus[] = ["active", "scheduled", "paused"];

export const AD_STATUS_LABEL: Record<AdStatus, string> = {
  active: "Active",
  scheduled: "Scheduled",
  paused: "Paused",
};

/**
 * Badge variant per status, using main-app shadcn tokens only:
 *  - active  → default (primary)
 *  - scheduled → secondary (the "blue-ish"/neutral accent slot)
 *  - paused  → outline (muted)
 */
export const AD_STATUS_BADGE_VARIANT: Record<AdStatus, BadgeProps["variant"]> = {
  active: "default",
  scheduled: "secondary",
  paused: "outline",
};

/** Normalize an arbitrary status string to a known AdStatus (defaults to paused). */
export function toAdStatus(status: string | null | undefined): AdStatus {
  return status === "active" || status === "scheduled" || status === "paused" ? status : "paused";
}
