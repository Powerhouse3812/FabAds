/**
 * Creative Report 2.0 — "launched before" cross-module recommendation
 * (iter-2 P5). Read-only: surfaces past Creative Report performance at the
 * decision point in OTHER modules (Launch v2's brand/goal step, Genie 6's
 * concept-generation step) rather than duplicating this intelligence inside
 * Creative Report itself — per the earlier product decision that this
 * belongs where the buyer is about to make a new creative/launch decision.
 *
 * Pure read of the existing dataset + selector layer — never mutates
 * anything, and returns [] rather than guessing when there's nothing to
 * honestly recommend (no brand/category match, or the match has no spend
 * in the full 90-day window).
 */
import { getDataset } from "@/data/generator";
import { fullRangeFilter, rollupCreative, type CreativeRollup } from "@/creative-report/lib/selectors";

export function findLaunchedBefore(
  opts: {
    brandId?: string | null;
    categoryId?: string | null;
    /** The creative the buyer is currently acting on — recommending it back
     *  to them inside its own relaunch modal is noise, not intelligence. */
    excludeCreativeId?: string;
  },
  limit = 3,
): CreativeRollup[] {
  if (!opts.brandId && !opts.categoryId) return [];

  const dataset = getDataset();
  const filter = fullRangeFilter();

  const matches = dataset.creatives.filter((c) => {
    if (opts.excludeCreativeId && c.id === opts.excludeCreativeId) return false;
    if (opts.brandId && c.brandId !== opts.brandId) return false;
    if (opts.categoryId && c.categoryId !== opts.categoryId) return false;
    return true;
  });

  const rollups: CreativeRollup[] = [];
  for (const c of matches) {
    const r = rollupCreative(dataset, c, filter);
    if (r) rollups.push(r);
  }

  return rollups.sort((a, b) => b.metrics.roas - a.metrics.roas).slice(0, limit);
}
