/**
 * Creative Report 2.0 — the fatigue signal's trust meter (iter-2 W2 "predicted
 * vs actual"). A genuine backtest, not a random confidence number: for every
 * creative with enough history, we re-evaluate the SAME fatigue rule as of a
 * cutoff 14 days before its most recent data (using only the data that would
 * have been available then), then check whether CTR kept declining in the
 * 14 days that followed. The result is an honest hit-rate for "when this
 * signal fires, how often is it right" — computed from the data, not asserted.
 */
import { computeFatigue, foldRows, type FoldedMetrics } from "@/creative-report-v2/lib/selectors";
import { DEFAULT_THRESHOLDS, type BucketThresholds } from "@/creative-report-v2/lib/thresholds";
import type { AdInstance, DailyRow, Dataset } from "@/data/model";

export interface TrustMeterResult {
  /** Creatives with enough history to backtest at all. */
  evaluated: number;
  /** Of those, how many the rule would have flagged as fatiguing at the cutoff. */
  flagged: number;
  /** Of the flagged, how many kept declining afterward (the rule was right). */
  hits: number;
  /** hits / flagged, or null if nothing was flagged. */
  precisionPct: number | null;
}

const BACKTEST_WINDOW = 14;
const MIN_HISTORY_DAYS = BACKTEST_WINDOW * 2; // need a full window before AND after the cutoff

function rowsInRange(instances: AdInstance[], from: string, to: string): DailyRow[] {
  const out: DailyRow[] = [];
  for (const inst of instances) {
    for (const r of inst.daily) {
      if (r.date >= from && r.date <= to) out.push(r);
    }
  }
  return out;
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Runs the backtest across every creative in the dataset. Pure + deterministic.
 * Backtests the SAME rule the buyer is currently using — if they've edited
 * fatigue thresholds via ThresholdSettings, this re-evaluates against those,
 * not the shipped defaults, so the chip never grades a rule nobody is running.
 */
export function computeTrustMeter(
  dataset: Dataset,
  thresholds: BucketThresholds = DEFAULT_THRESHOLDS,
): TrustMeterResult {
  let evaluated = 0;
  let flagged = 0;
  let hits = 0;

  for (const creative of dataset.creatives) {
    const instances = dataset.instancesByCreative[creative.id] ?? [];
    if (instances.length === 0) continue;

    let earliest: string | null = null;
    let latest: string | null = null;
    for (const inst of instances) {
      for (const r of inst.daily) {
        if (earliest === null || r.date < earliest) earliest = r.date;
        if (latest === null || r.date > latest) latest = r.date;
      }
    }
    if (!earliest || !latest) continue;
    const spanDays = Math.round(
      (new Date(`${latest}T00:00:00`).getTime() - new Date(`${earliest}T00:00:00`).getTime()) / 86400000,
    );
    if (spanDays < MIN_HISTORY_DAYS) continue;

    const cutoff = addDaysIso(latest, -BACKTEST_WINDOW);
    if (cutoff < earliest) continue;
    evaluated++;

    const spendAsOfCutoff = rowsInRange(instances, earliest, cutoff).reduce((s, r) => s + r.spend, 0);
    const predicted = computeFatigue(instances, cutoff, spendAsOfCutoff, thresholds);
    if (!predicted.isFatiguing) continue;
    flagged++;

    const duringFrom = addDaysIso(cutoff, -(BACKTEST_WINDOW - 1));
    const during: FoldedMetrics = foldRows(rowsInRange(instances, duringFrom, cutoff), false);
    const afterFrom = addDaysIso(cutoff, 1);
    const after: FoldedMetrics = foldRows(rowsInRange(instances, afterFrom, latest), false);

    // "Kept declining" — the after-window CTR is materially below the
    // window the prediction was based on (a lenient 5% further relative drop).
    const continuedDecline = during.ctr > 0 && after.ctr < during.ctr * 0.95;
    if (continuedDecline) hits++;
  }

  return {
    evaluated,
    flagged,
    hits,
    precisionPct: flagged > 0 ? (hits / flagged) * 100 : null,
  };
}
