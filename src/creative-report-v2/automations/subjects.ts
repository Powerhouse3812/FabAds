/**
 * subjects.ts — the canonical subject set every automation rule evaluates against.
 *
 * WHY THIS FILE EXISTS AT ALL
 * ---------------------------
 * An automation must not fire differently depending on which filter chip the
 * user happens to have open. `useCreativeData().rollups` is the UI's *filtered*
 * rollup set: change the date chip, or type into search, and that array
 * changes. If rules evaluated against it, flipping a chip would silently
 * change which creatives get uploaded to a Meta ad account — a correctness bug
 * that only ever shows up as a live-demo embarrassment ("why did it upload
 * seven this time and three last time?").
 *
 * So auto-evaluation deliberately reads a fixed, filter-independent subject
 * set: the whole dataset, the module's default 30-day window, and the current
 * bucket thresholds. Nothing here touches React, the URL, or `useReportParams`
 * — the runner lives on a module-level clock and must work while the user is
 * on a completely different route.
 *
 * KNOWN, DELIBERATE INCONSISTENCY
 * -------------------------------
 * The manual "Run now" button (`components/RuleList.tsx` -> `engine.runRule`)
 * still evaluates against the UI's filtered rollups. That is left exactly as
 * it is: "Run now" is a v2-shared surface, and its filtered behaviour is
 * arguably what a user clicking a button *while looking at a filtered table*
 * expects. Auto-evaluation is the unattended path and gets the unfiltered,
 * reproducible subject set. Documented rather than "fixed" — changing
 * RuleList's semantics is a separate, explicit decision.
 */
import { getDataset } from "@/data/generator";
import { defaultDateRange } from "@/creative-report-v2/lib/paramSchema";
import { selectCreatives, type CreativeRollup, type FilterInput } from "@/creative-report-v2/lib/selectors";
import { getThresholds, type BucketThresholds } from "@/creative-report-v2/lib/thresholds";

/**
 * The zero-filter FilterInput: default window, every dimension unconstrained,
 * no search query, no Catalogue scoping, no compare.
 *
 * Not `fullRangeFilter()` — that is the audit's 90-day widest window. Rules
 * are authored while looking at the default 30-day view, so their thresholds
 * ("spend > 5000") only mean what the author intended over that same window.
 */
function unfilteredInput(from: string, to: string): FilterInput {
  return {
    from,
    to,
    compareEnabled: false,
    accounts: [],
    statuses: [],
    platforms: [],
    formats: [],
    geo: [],
    device: [],
    objective: [],
    age: [],
    gender: [],
    // `q`, `brands`, `categories`, `products` intentionally omitted — absent
    // means "no constraint" in selectCreatives.
  };
}

/**
 * Stable cache key. Covers everything `automationSubjects()` depends on:
 *
 *  - the window, which rolls over at local midnight (`defaultDateRange()`),
 *  - the bucket thresholds, which the user can edit at any time — an edited
 *    threshold must change which creatives are `winners`, and therefore what
 *    a bucket-based rule matches, on the very next pass rather than after a
 *    reload.
 *
 * `getDataset()` is itself memoised on the same day-stamp, so a day rollover
 * invalidates both in lockstep.
 *
 * Entries are sorted so the key never depends on object key order.
 */
function cacheKeyFor(from: string, to: string, thresholds: BucketThresholds): string {
  const t = Object.entries(thresholds as unknown as Record<string, unknown>)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${String(v)}`)
    .join(",");
  return `${from}..${to}|${t}`;
}

let cachedKey: string | null = null;
let cachedSubjects: CreativeRollup[] = [];

/**
 * The subject set every automation evaluates against: whole dataset, default
 * window, current bucket thresholds. Deliberately NOT the UI's filtered
 * rollups.
 *
 * Memoised per session on `cacheKeyFor(...)`. The dataset is deterministic, so
 * an unchanged key means an identical result — recomputing the full rollup fold
 * on every 10-second pass (let alone every 500ms tick) would be pure waste.
 *
 * The returned array is the SHARED cached instance. Callers must treat it as
 * read-only — filter it, never sort or splice it in place.
 */
export function automationSubjects(): CreativeRollup[] {
  const { from, to } = defaultDateRange();
  const thresholds = getThresholds();
  const key = cacheKeyFor(from, to, thresholds);

  if (key !== cachedKey) {
    cachedSubjects = selectCreatives(getDataset(), unfilteredInput(from, to), thresholds);
    cachedKey = key;
  }

  return cachedSubjects;
}
