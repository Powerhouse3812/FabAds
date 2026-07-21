/**
 * Creative Report 2.0 — the 3-source benchmark layer (iter-2 W2).
 *
 * Every "how does this compare" signal grades a creative/component against
 * THREE explicit, inspectable sources — never a single opaque score:
 *   1. Your own Winners  (WinnersBank — curated or bootstrap)
 *   2. Category norm      (median across all creatives sharing categoryId)
 *   3. Platform best-practice (a static, deterministic checklist — no ML)
 */
import { fullRangeFilter, rollupCreative, type CreativeRollup } from "@/creative-report/lib/selectors";
import type { Creative, Dataset } from "@/data/model";
import type { Platform } from "@/creative-report/lib/paramSchema";
import { findBankEntry, type BankDimension, type WinnersBankEntry } from "@/creative-report/lib/winnersBank";

/* ------------------------------------------------------------------ */
/*  1. Own-Winners comparison (thin wrapper — WinnersBank does the work) */
/* ------------------------------------------------------------------ */

export interface WinnerComparison {
  /** null when the bank has no entry for this exact value yet. */
  bankAvgRoas: number | null;
  creativeRoas: number;
  /** creativeRoas - bankAvgRoas, null if no bank entry. */
  deltaRoas: number | null;
}

export function compareToWinners(
  creativeRoas: number,
  bankAvgRoas: number | null,
): WinnerComparison {
  return {
    bankAvgRoas,
    creativeRoas,
    deltaRoas: bankAvgRoas !== null ? creativeRoas - bankAvgRoas : null,
  };
}

/* ------------------------------------------------------------------ */
/*  2. Category norm — median ROAS/CTR across ALL creatives in category */
/* ------------------------------------------------------------------ */

export interface CategoryNorm {
  categoryId: string;
  sampleSize: number;
  medianRoas: number;
  medianCtr: number;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

interface CategoryEntry {
  creativeId: string;
  roas: number;
  ctr: number;
}

// Cached WITHOUT exclusion applied — every creative in the category, tagged
// by id — so exclusion can be filtered per-call without recomputing rollups.
const _categoryEntriesCache = new Map<string, CategoryEntry[]>();

function allCategoryEntries(dataset: Dataset, categoryId: string): CategoryEntry[] {
  const cached = _categoryEntriesCache.get(categoryId);
  if (cached) return cached;

  const filter = fullRangeFilter();
  const entries: CategoryEntry[] = [];
  for (const creative of dataset.creatives) {
    if (creative.categoryId !== categoryId) continue;
    const rollup = rollupCreative(dataset, creative, filter);
    if (!rollup || rollup.metrics.spend <= 0) continue;
    entries.push({ creativeId: creative.id, roas: rollup.metrics.roas, ctr: rollup.metrics.ctr });
  }
  _categoryEntriesCache.set(categoryId, entries);
  return entries;
}

/**
 * Median ROAS/CTR across every OTHER creative sharing this categoryId — a
 * cheap, transparent stand-in for a real cross-account category benchmark.
 * `excludeCreativeId` (normally the creative being graded) is genuinely left
 * out of its own norm — comparing a creative to a median that quietly
 * includes itself would be a small dishonesty this module explicitly avoids.
 */
export function categoryNorm(
  dataset: Dataset,
  categoryId: string | undefined,
  excludeCreativeId?: string,
): CategoryNorm | null {
  if (!categoryId) return null;
  const all = allCategoryEntries(dataset, categoryId);
  const peers = excludeCreativeId ? all.filter((e) => e.creativeId !== excludeCreativeId) : all;
  if (peers.length === 0) return null;

  return {
    categoryId,
    sampleSize: peers.length,
    medianRoas: median(peers.map((e) => e.roas)),
    medianCtr: median(peers.map((e) => e.ctr)),
  };
}

/* ------------------------------------------------------------------ */
/*  3. Platform best-practice — static, deterministic, no ML             */
/* ------------------------------------------------------------------ */

export interface BestPracticeCheck {
  label: string;
  pass: boolean;
  detail: string;
}

/** Video-length norms are the one thing we can check from generated data
 *  (run duration in days is not the same as clip length, so this checks what
 *  the mock dataset actually models: format fit + frequency-based fatigue
 *  ceiling per platform, which the platform's own best-practice docs name). */
const PLATFORM_FREQ_CEILING: Record<Platform, number> = {
  meta: 4,
  tiktok: 3,
  newsbreak: 5,
};

const PLATFORM_PREFERRED_FORMAT: Record<Platform, Creative["format"]> = {
  meta: "video",
  tiktok: "video",
  newsbreak: "static",
};

export function platformBestPractice(rollup: CreativeRollup): BestPracticeCheck[] {
  const { creative, fatigue, platforms } = rollup;
  const checks: BestPracticeCheck[] = [];

  for (const platform of platforms) {
    const ceiling = PLATFORM_FREQ_CEILING[platform];
    const withinFreq = fatigue.freq7 <= ceiling;
    checks.push({
      label: `${platform} frequency ceiling`,
      pass: withinFreq,
      detail: withinFreq
        ? `7d frequency ${fatigue.freq7.toFixed(1)} is within ${platform}'s recommended refresh ceiling (${ceiling}).`
        : `7d frequency ${fatigue.freq7.toFixed(1)} is above ${platform}'s recommended refresh ceiling (${ceiling}) — a refresh usually helps here.`,
    });

    const preferred = PLATFORM_PREFERRED_FORMAT[platform];
    const formatMatch = creative.format === preferred;
    checks.push({
      label: `${platform} preferred format`,
      pass: formatMatch,
      detail: formatMatch
        ? `${creative.format} matches ${platform}'s best-performing format for this account.`
        : `${platform} generally rewards ${preferred} more than ${creative.format} — worth testing a ${preferred} variant.`,
    });
  }

  return checks;
}

/* ------------------------------------------------------------------ */
/*  Ranked edit suggestions — transparent basis, no ROI prediction       */
/* ------------------------------------------------------------------ */

const RANKABLE_DIMENSIONS: { dimension: BankDimension; label: string; valueOf: (c: Creative) => string }[] = [
  { dimension: "hook", label: "Hook", valueOf: (c) => c.components.hook },
  { dimension: "headline", label: "Headline", valueOf: (c) => c.components.headline },
  { dimension: "primaryText", label: "Primary text", valueOf: (c) => c.components.primaryText },
  { dimension: "cta", label: "CTA", valueOf: (c) => c.components.cta },
  { dimension: "visualStyle", label: "Visual style", valueOf: (c) => c.components.visualStyle },
];

export interface RankedEdit {
  dimension: BankDimension;
  label: string;
  currentValue: string;
  /** Winners-bank avg ROAS for this exact value; the transparent basis. */
  bankAvgRoas: number;
  creativeRoas: number;
  /** creativeRoas - bankAvgRoas — always negative for a ranked (below-bar) entry. */
  gap: number;
}

/**
 * Rank this creative's components by how far each sits below the Winners
 * bank's average ROAS for that same value — the transparent alternative to
 * an ROI-lift prediction. Only returns entries where the bank has ≥2
 * creatives backing the number (avoids ranking off a single data point) and
 * the creative is genuinely below that bar. Sorted worst-gap first.
 */
export function rankComponentEdits(
  rollup: CreativeRollup,
  bank: WinnersBankEntry[],
): RankedEdit[] {
  const out: RankedEdit[] = [];
  for (const { dimension, label, valueOf } of RANKABLE_DIMENSIONS) {
    const value = valueOf(rollup.creative);
    const entry = findBankEntry(bank, dimension, value);
    if (!entry || entry.creativeCount < 2) continue;
    const gap = rollup.metrics.roas - entry.avgRoas;
    if (gap >= 0) continue; // already at/above the bank's bar — nothing to suggest
    out.push({
      dimension,
      label,
      currentValue: value,
      bankAvgRoas: entry.avgRoas,
      creativeRoas: rollup.metrics.roas,
      gap,
    });
  }
  return out.sort((a, b) => a.gap - b.gap);
}
