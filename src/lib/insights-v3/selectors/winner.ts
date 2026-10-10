/**
 * Winner (Q4), engagement standout, New (Q8).
 * Winner = active AND daysLive ≥ 14 AND clones ≥ 2. Never likes.
 */
import { WINNER_RULE } from "../types";
import type { Ad } from "../types";
import { toMs } from "./context";

export function isActive(ad: Ad): boolean {
  return ad.status === "active";
}

export function isWinner(ad: Ad): boolean {
  return (
    ad.status === "active" &&
    ad.daysLive != null &&
    ad.daysLive >= WINNER_RULE.minDaysLive &&
    ad.clones >= WINNER_RULE.minClones
  );
}

/** likes + comments + shares, or null when nothing is reported. */
export function engagementTotal(ad: Ad): number | null {
  const { likes, comments, shares } = ad.engagement;
  if (likes == null && comments == null && shares == null) return null;
  return (likes ?? 0) + (comments ?? 0) + (shares ?? 0);
}

export function hasEngagement(ad: Ad): boolean {
  return engagementTotal(ad) != null;
}

const thresholdCache = new WeakMap<Ad[], number | null>();

/** Engagement total at the top `engagementTopShare` cut among ads WITH engagement in this scope. Null when none report. */
export function engagementThreshold(scopedAds: Ad[]): number | null {
  if (thresholdCache.has(scopedAds)) return thresholdCache.get(scopedAds) ?? null;
  const totals = scopedAds.map(engagementTotal).filter((v): v is number => v != null).sort((a, b) => b - a);
  const value = totals.length ? totals[Math.max(0, Math.ceil(totals.length * WINNER_RULE.engagementTopShare) - 1)] : null;
  thresholdCache.set(scopedAds, value);
  return value;
}

/** Winner + engagement reported + in the top 10% of reported engagement in scope (the extra mark on the Winner badge). */
export function isEngagementStandout(ad: Ad, scopedAds: Ad[]): boolean {
  if (!isWinner(ad)) return false;
  const total = engagementTotal(ad);
  if (total == null) return false;
  const threshold = engagementThreshold(scopedAds);
  return threshold != null && total >= threshold;
}

/** New = first seen after the user's last visit. Works for ads, advertisers and landing pages. */
export function isNew(item: { firstSeenAt: string }, lastVisitAt: string | number | null | undefined): boolean {
  const last = toMs(lastVisitAt);
  if (last == null) return false;
  const first = toMs(item.firstSeenAt);
  return first != null && first > last;
}

export function countWinners(ads: Ad[]): number {
  let n = 0;
  for (const a of ads) if (isWinner(a)) n++;
  return n;
}

export function countActive(ads: Ad[]): number {
  let n = 0;
  for (const a of ads) if (a.status === "active") n++;
  return n;
}
