/**
 * Industry Insights Dashboard — selector / hook layer.
 *
 * ── THE RULE THIS FILE EXISTS TO ENFORCE ──────────────────────────────────
 * Block components import from HERE and nowhere else for data. No component
 * may import `./fixtures`, `./types` values, or `@/lib/insights-dummy-data`
 * directly. One seam, one place to swap the corpus for a real API later, and
 * one place where "shaped for rendering" lives.
 *
 * Each hook reads `useDashboardState()`, pulls the memoised fixture for that
 * state via `getDashboardFixture`, and returns the slice its block needs with
 * every derived presentation value already computed — totals, percentages,
 * sort order, grouping, summary counts, ready-to-render sentences. Components
 * should never have to reduce, sort, or pluralise.
 *
 * ── INVARIANTS CARRIED THROUGH FROM THE DATA LAYER ────────────────────────
 *  1. Pure reads. No mutations of fixture objects, no network, no Supabase,
 *     no `Math.random()`, no `Date.now()`. The single clock read in the whole
 *     module lives in `fixtures.ts` as `NOW_MS`; every date label here is
 *     arithmetic off `isoDaysAgo` / `shortDateLabel`.
 *  2. Every hook is correct in all FIVE states. Empty collections come back
 *     as `[]`, never `undefined`. `myBrand` is the only nullable thing in the
 *     fixture and is null in `zero` and `loading` (it IS present in `thin`).
 *  3. Absence is never rendered as zero. Where a number genuinely does not
 *     exist we return `null` alongside a reason, exactly as `KpiTile` does.
 *  4. Every hook memoises on `state`, and `getDashboardFixture` is itself
 *     memoised per state, so calling any of these inside a render is free and
 *     the returned object identity is stable for the life of the state.
 *  5. Share of voice here is share of LIVE CREATIVE. Never spend. Every field
 *     is named `creativeSharePct` so a downstream reader cannot confuse them.
 *  6. The written brief is never labelled "AI".
 *  7. EMPTY IS NOT ONE THING. `loading` and `zero` both hand you `[]` and
 *     null values, and they mean opposite things — "not yet" versus "none".
 *     Every view carries `isLoading`; check it BEFORE any `isEmpty` branch
 *     and render a skeleton, never an empty state. `error` is the third
 *     shape: nothing is empty, but the figures fed by a failed source are
 *     null and carry an `naReason` naming that source. `useDashboardStatus()`
 *     is the one place to ask what answered and how old this all is.
 */

import { useMemo } from "react";

import { useDashboardState } from "@/insights-dashboard/state/DashboardState";

import {
  CADENCE_WEEKS,
  DATA_SOURCE_ORDER,
  ERROR_SCAN_AGE_DAYS,
  LONG_RUNNER_TIER_BOUNDS,
  QUIET_THRESHOLD_DAYS,
  SATURATION_CAVEAT_DAYS,
  SIGNAL_RECURRENCE_GATE,
  STALE_AFTER_DAYS,
  STORELEADS_NA_REASON,
  formatInt,
  getDashboardFixture,
  isoDaysAgo,
  shortDateLabel,
} from "./fixtures";

import type {
  AdjacentIndustry,
  AngleKey,
  AngleMixEntry,
  AngleSlice,
  AffiliateDomainRow,
  BoardHealth,
  BoardHealthItem,
  ChangeSignal,
  ChangeSignalKind,
  CoverageInfo,
  DailyBrief,
  DailyBriefFact,
  DashboardMeta,
  DashboardState,
  DataSourceKey,
  DataSourceState,
  DataSourceStatus,
  DomainRow,
  DomainType,
  DomainTypeCounts,
  EcomDomainRow,
  FollowedIndustry,
  FormatMixEntry,
  FunnelDomainRow,
  IndustryScanState,
  IndustryShareBrand,
  IndustryShareRow,
  KpiTile,
  LaunchCadenceWeek,
  LongRunnerAd,
  LongRunnerTier,
  Mover,
  MyBrand,
  NavSurfaceCount,
  NavSurfaceKey,
  PageRow,
  ProvenanceTier,
  SetupChecklistItem,
  ShareOfVoiceRow,
  StalenessInfo,
  StalenessLevel,
  WatchItem,
  WatchStatus,
  WatchlistHealth,
} from "./types";

// Re-exported so blocks can type their own locals without reaching past this
// seam into `./types`. Types only — no runtime coupling.
export type {
  AdjacentIndustry,
  AngleKey,
  AngleMixEntry,
  AffiliateDomainRow,
  BoardHealthItem,
  ChangeSignal,
  ChangeSignalKind,
  DailyBriefFact,
  DashboardMeta,
  DashboardState,
  DataSourceKey,
  DataSourceState,
  DataSourceStatus,
  DomainRow,
  DomainType,
  DomainTypeCounts,
  EcomDomainRow,
  FollowedIndustry,
  FormatMixEntry,
  FunnelDomainRow,
  IndustryShareBrand,
  IndustryShareRow,
  KpiTile,
  LaunchCadenceWeek,
  LongRunnerAd,
  LongRunnerTier,
  Mover,
  MyBrand,
  NavSurfaceCount,
  NavSurfaceKey,
  PageRow,
  ProvenanceTier,
  SetupChecklistItem,
  StalenessInfo,
  StalenessLevel,
  WatchItem,
  WatchStatus,
};

// Runtime constants worth re-exporting through the seam, so a block never has
// to import `./fixtures` to write an honest sentence about a missing figure.
export { DATA_SOURCE_ORDER, ERROR_SCAN_AGE_DAYS, STALE_AFTER_DAYS, STORELEADS_NA_REASON };

// ═════════════════════════════════════════════════════════════════════════
// §0  Local pure helpers (no clock reads, no randomness)
// ═════════════════════════════════════════════════════════════════════════

const WEEKDAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday",
] as const;

/**
 * "Tuesday" for a day-offset back from the fixture clock. Built off
 * `isoDaysAgo(n)` — that string is derived from the single `NOW_MS` constant,
 * so this never reads the wall clock and never drifts mid-session.
 */
function weekdayLabel(daysAgo: number): string {
  return WEEKDAY_NAMES[new Date(isoDaysAgo(daysAgo)).getDay()];
}

/**
 * "Tuesday" inside the last week, "Aug 12" beyond it. Used for the change
 * feed's "Since …" anchor, where a weekday reads more naturally than a date.
 */
function sinceLabelFor(daysAgo: number): string {
  if (daysAgo <= 0) return "today";
  if (daysAgo === 1) return "yesterday";
  if (daysAgo <= 6) return weekdayLabel(daysAgo);
  return shortDateLabel(daysAgo);
}

/** `count === 1 ? one : many`, with the count already interpolated by caller. */
function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

/** Median of a numeric list. `null` for an empty list — never 0. */
function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/** Sum, safe on empty. */
function sum(values: readonly number[]): number {
  return values.reduce((s, n) => s + n, 0);
}

/** Max, `fallback` on empty (avoids `Math.max()` returning -Infinity). */
function maxOf(values: readonly number[], fallback = 0): number {
  return values.length ? Math.max(...values) : fallback;
}

/** Min, `fallback` on empty. */
function minOf(values: readonly number[], fallback = 0): number {
  return values.length ? Math.min(...values) : fallback;
}

/** Round to `dp` decimal places. */
function round(n: number, dp = 0): number {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}

/**
 * Pull the leading number out of an already-formatted display string:
 * "44 days" → 44 · "20,515" → 20515 · "3.8%" → 3.8 · null → null.
 *
 * Used ONLY to reuse a number the KPI row already published, so the "You vs
 * your market" block cannot drift from the tile above it. We never re-derive
 * such a figure ourselves — two computations of the same stat that disagree is
 * worse than one we can point at.
 */
function parseLeadingNumber(value: string | null | undefined): number | null {
  if (value == null) return null;
  const m = /-?\d+(?:\.\d+)?/.exec(String(value).replace(/,/g, ""));
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}

// ═════════════════════════════════════════════════════════════════════════
// §1  Page meta
// ═════════════════════════════════════════════════════════════════════════

export interface DashboardMetaView {
  state: DashboardState;
  meta: DashboardMeta;
  isPopulated: boolean;
  isThin: boolean;
  isZero: boolean;
  /** True only when we have actually indexed something. */
  hasIndexedData: boolean;
  dataAsOfLabel: string;
  lastScanLabel: string;
  /** Freshness disclosure. Never says "updated daily" — no re-sync exists. */
  refreshNote: string;
  stateNote: string;
  cadenceScopeNote: string;
  followedIndustryCount: number;
  seededIndustryCount: number;
  liveAdsObserved: number | null;
  domainCount: number | null;
  domainTypeCounts: DomainTypeCounts | null;
  newSignalsThisWeek: number;
  generatedAtISO: string;

  // ── Fetch health (added with the `loading` / `error` states) ────────────

  /**
   * TRUE ONLY IN `loading`. Check this BEFORE any `isEmpty` branch: in
   * `loading` every collection is empty and that means "not yet", not "none".
   * Render skeletons, never an empty state.
   */
  isLoading: boolean;
  /** True only in `error` — at least one source did not answer. */
  isError: boolean;
  /** True in `populated` / `thin` / `zero`: the fetch finished and worked. */
  isSettled: boolean;
  /** All three upstreams, fixed order, in every state. */
  sources: DataSourceStatus[];
  /** Only the ones that failed. `[]` outside `error`. */
  failedSources: DataSourceStatus[];
  /** Provenance tiers whose source is down. `["estimated"]` in `error`. */
  degradedTiers: ProvenanceTier[];
  /** How old the data on screen is. Present in every state. */
  staleness: StalenessInfo;
  /** `staleness.isStale` — the data is `STALE_AFTER_DAYS`+ days old. */
  isStale: boolean;
}

/** Page-level scale, freshness and state framing. */
export function useDashboardMeta(): DashboardMetaView {
  const state = useDashboardState();
  return useMemo<DashboardMetaView>(() => {
    const { meta } = getDashboardFixture(state);
    return {
      state,
      meta,
      isPopulated: state === "populated",
      isThin: state === "thin",
      isZero: state === "zero",
      isLoading: meta.isLoading,
      isError: state === "error",
      isSettled: !meta.isLoading && state !== "error",
      sources: meta.sources,
      failedSources: meta.failedSources,
      degradedTiers: meta.degradedTiers,
      staleness: meta.staleness,
      isStale: meta.staleness.isStale,
      hasIndexedData: (meta.liveAdsObserved ?? 0) > 0,
      dataAsOfLabel: meta.dataAsOfLabel,
      lastScanLabel: meta.lastScanLabel,
      refreshNote: meta.refreshNote,
      stateNote: meta.stateNote,
      cadenceScopeNote: meta.cadenceScopeNote,
      followedIndustryCount: meta.followedIndustryCount,
      seededIndustryCount: meta.seededIndustryCount,
      liveAdsObserved: meta.liveAdsObserved,
      domainCount: meta.domainCount,
      domainTypeCounts: meta.domainTypeCounts,
      newSignalsThisWeek: meta.newSignalsThisWeek,
      generatedAtISO: meta.generatedAtISO,
    };
  }, [state]);
}

// ═════════════════════════════════════════════════════════════════════════
// §1b  Fetch status — which sources answered, and how old this all is
// ═════════════════════════════════════════════════════════════════════════

/**
 * What a status banner is about. A TONE, not a colour — the palette rule
 * stands: the distinction is carried by label, icon and weight.
 */
export type DashboardStatusTone = "loading" | "degraded" | "stale";

export interface DashboardStatusBanner {
  tone: DashboardStatusTone;
  /** Short headline, e.g. "StoreLeads didn't respond". */
  title: string;
  /** One or two written sentences. Render as-is; do not paraphrase. */
  body: string;
}

export interface DashboardStatusView {
  state: DashboardState;
  /** Nothing has resolved. Render skeletons, NOT empty states. */
  isLoading: boolean;
  /** At least one source was asked and did not answer. */
  isError: boolean;
  /** The fetch finished and every source answered. */
  isSettled: boolean;
  /** True when there is something to say at the top of the page. */
  needsDisclosure: boolean;

  /** All three upstreams, fixed order (observed → estimated → derived). */
  sources: DataSourceStatus[];
  sourcesByKey: Record<DataSourceKey, DataSourceStatus>;
  /** Asked and did not answer. `[]` outside `error`. */
  failedSources: DataSourceStatus[];
  failedSourceCount: number;
  /** Not asked yet, or asked and still running. Not a failure. */
  pendingSources: DataSourceStatus[];
  okSources: DataSourceStatus[];
  /** "StoreLeads" — display names joined. Null when nothing failed. */
  failedSourceLabel: string | null;

  /**
   * Tiers whose source FAILED. `["estimated"]` in `error`, `[]` everywhere
   * else — a pending source is not a degraded tier.
   */
  degradedTiers: ProvenanceTier[];
  /**
   * Why a tier has no numbers, for any tier whose source is failed OR
   * pending. Look your own figure's tier up here and print the string
   * verbatim — it is the same sentence the KPI tile and the table cell use.
   */
  naReasonByTier: Partial<Record<ProvenanceTier, string>>;
  /** Same, keyed by source. */
  naReasonBySource: Partial<Record<DataSourceKey, string>>;

  staleness: StalenessInfo;
  /** Data is `STALE_AFTER_DAYS`+ days old. Say so at the top, not in a tooltip. */
  isStale: boolean;
  /** "Last complete scan 3 days ago". */
  lastScanLabel: string;
  /** Freshness disclosure. Never says "updated daily" — no re-sync exists. */
  refreshNote: string;
  /** Ready-to-render banner, or null when there is nothing to disclose. */
  banner: DashboardStatusBanner | null;
}

/**
 * Fetch health for the whole page: what answered, what didn't, and how old
 * the data is.
 *
 * This is the hook the page shell and any block that needs to degrade should
 * call, so nobody re-derives "are we loading" or "is estimated data safe" from
 * `state` strings. It is the payoff of the provenance system: every figure
 * already knows its tier, so a block can ask one question —
 * `status.naReasonByTier[tier]` — and get either `undefined` (that tier is
 * fine) or the exact sentence to print instead of the number.
 *
 * The three tiers map 1:1 onto the three sources:
 *   observed → Meta Ad Library · estimated → StoreLeads · derived → FabAds scan.
 */
export function useDashboardStatus(): DashboardStatusView {
  const state = useDashboardState();
  return useMemo<DashboardStatusView>(() => {
    const { meta } = getDashboardFixture(state);
    const sources = meta.sources;

    const sourcesByKey = {} as Record<DataSourceKey, DataSourceStatus>;
    for (const s of sources) sourcesByKey[s.key] = s;

    const failedSources = sources.filter((s) => s.state === "failed");
    const pendingSources = sources.filter((s) => s.state === "pending");
    const okSources = sources.filter((s) => s.state === "ok");

    // Pending counts here as well as failed: a block asking "why is my
    // estimated number missing?" deserves an answer on day 1 too, and the
    // fixture gives every non-ok source a reason.
    const naReasonByTier: Partial<Record<ProvenanceTier, string>> = {};
    const naReasonBySource: Partial<Record<DataSourceKey, string>> = {};
    for (const s of sources) {
      if (s.state === "ok" || !s.naReason) continue;
      naReasonByTier[s.tier] = s.naReason;
      naReasonBySource[s.key] = s.naReason;
    }

    const failedSourceLabel = failedSources.length
      ? failedSources.map((s) => s.name).join(" and ")
      : null;

    const isLoading = meta.isLoading;
    const isError = failedSources.length > 0;
    const { staleness } = meta;

    const banner: DashboardStatusBanner | null = isLoading
      ? {
          tone: "loading",
          title: "Loading",
          body: meta.refreshNote,
        }
      : isError
        ? {
            tone: "degraded",
            title: `${failedSourceLabel} didn't respond`,
            body: [
              ...failedSources.map((s) => s.failureNote).filter(Boolean),
              staleness.note,
            ].join(" "),
          }
        : staleness.isStale
          ? { tone: "stale", title: staleness.label, body: staleness.note }
          : null;

    return {
      state,
      isLoading,
      isError,
      isSettled: !isLoading && !isError,
      needsDisclosure: banner !== null,
      sources,
      sourcesByKey,
      failedSources,
      failedSourceCount: failedSources.length,
      pendingSources,
      okSources,
      failedSourceLabel,
      degradedTiers: failedSources.map((s) => s.tier),
      naReasonByTier,
      naReasonBySource,
      staleness,
      isStale: staleness.isStale,
      lastScanLabel: meta.lastScanLabel,
      refreshNote: meta.refreshNote,
      banner,
    };
  }, [state]);
}

// ═════════════════════════════════════════════════════════════════════════
// §2  KPI row
// ═════════════════════════════════════════════════════════════════════════

/**
 * The five tiles the KPI row renders, in render order.
 *
 * ── WHY THESE FIVE, AND WHY THE OLD FIVE ARE GONE ─────────────────────────
 * The row used to say LIVE ADS OBSERVED · ADVERTISERS INDEXED · MEDIAN
 * CREATIVE LIFESPAN · YOUR SHARE OF LIVE CREATIVE. Three of those phrases were
 * invented for this page — that vocabulary appears nowhere else in FabAds. If
 * the person who asked for a metric cannot find it, no user will either.
 *
 * These five use FabAds' own words, taken off the product's Dashboard:
 * Total saved ads · Industries followed · Brands followed ·
 * Competitors followed · Total competitor ads. Every one is a figure another
 * block on this page already shows, so the row cannot contradict what is under
 * it:
 *
 *   Total saved ads        Σ board item counts (`useBoardHealth().boards`)
 *   Industries followed    `useCoverage().followedCount`
 *   Brands followed        `useWatchlistHealth().followCount`, and its
 *                          `subNote` is `useWatchlistHealth().inactiveNote`
 *   Competitors followed   `useWatchlistHealth().trackedCompetitorCount` ===
 *                          `useTopCompetitors().followedCompetitorCount` — the
 *                          same set every `followed` / `tracked` pill on the
 *                          domain and pages lists is lit from
 *   Total competitor ads   `useWatchlistHealth().trackedCompetitorLiveAds` ===
 *                          `useTopCompetitors().followedCompetitorLiveAds` — Σ
 *                          `liveAds` of those competitors, each the same
 *                          `liveAds` `usePagesAndDomains()` prints for the
 *                          same domain
 *
 * BRANDS AND COMPETITORS ARE TWO LISTS, as they are in FabAds itself
 * (`insight_follows` and `insight_competitors`). Competitors followed is the
 * short list; that it is a small number is the point, not a bug. "Total
 * competitor ads" counts ONLY those competitors' ads — never the whole indexed
 * market, which is what made the old row contradict the competitors block.
 *
 * The retired tiles (`live-ads`, `advertisers`, `creative-lifespan`,
 * `your-share-of-creative`) still exist in the fixture and still come back in
 * `secondary` — `useMyBrandVsMarket` reads `creative-lifespan` off the tile so
 * the two can never disagree — they are simply no longer the headline.
 *
 * Exported so a block can re-slice deliberately instead of hardcoding an
 * index range that silently breaks when a tile is added.
 */
export const KPI_PRIMARY_KEYS: readonly string[] = [
  "total-saved-ads",
  "industries-followed",
  "brands-followed",
  "competitors",
  "total-competitor-ads",
];

/**
 * The exact labels the five tiles carry, keyed by tile key. Mirrors the
 * fixture; exported only so a test or a design review can assert the wording
 * without reaching into `./fixtures`.
 */
export const KPI_PRIMARY_LABELS: Readonly<Record<string, string>> = {
  "total-saved-ads": "Total saved ads",
  "industries-followed": "Industries followed",
  "brands-followed": "Brands followed",
  competitors: "Competitors followed",
  "total-competitor-ads": "Total competitor ads",
};

/** How many tiles the KPI row renders. */
export const KPI_PRIMARY_COUNT = 5;

export interface KpiRowView {
  /** Every tile the fixture carries, display order (headline five first). */
  tiles: KpiTile[];
  /** Exactly the five the row renders, in render order. */
  primary: KpiTile[];
  /** The remaining tiles, fixture order. Never overlaps `primary`. */
  secondary: KpiTile[];
  primaryKeys: readonly string[];
  byKey: Record<string, KpiTile>;
  /** Tiles with a real value (a real "0" counts as available — it is a fact). */
  availableCount: number;
  /** Tiles with `value === null`; each carries a non-empty `naReason`. */
  unavailableCount: number;
  /** True when nothing on the row has a number — the thin state. */
  allUnavailable: boolean;
  /** True when at least one tile carries a 12-point sparkline series. */
  hasHistory: boolean;
  /** True when at least one tile carries a week-over-week delta. */
  hasDeltas: boolean;
  /**
   * Nothing has resolved yet — render tile skeletons. Check this BEFORE
   * `allUnavailable`: in `loading` every tile is null and it means "not yet",
   * in `thin` it means "we looked and found nothing".
   */
  isLoading: boolean;
}

/**
 * KPI tiles, whole set plus the five the row renders (`KPI_PRIMARY_KEYS`).
 *
 * Tiles are passed through by reference, untouched, so the data layer's
 * invariant survives: `value === null` always arrives with an `naReason`, and
 * a real zero is `value: "0"` with no reason. Never substitute a dash here.
 */
export function useKpis(): KpiRowView {
  const state = useDashboardState();
  return useMemo<KpiRowView>(() => {
    const { kpis, meta } = getDashboardFixture(state);
    const tiles = kpis;

    const byKey: Record<string, KpiTile> = {};
    for (const tile of tiles) byKey[tile.key] = tile;

    // Build in the declared order, skipping keys the fixture doesn't carry.
    const primary = KPI_PRIMARY_KEYS
      .map((key) => byKey[key])
      .filter((t): t is KpiTile => Boolean(t))
      .slice(0, KPI_PRIMARY_COUNT);

    // Defensive: if the fixture ever renames a key, still hand the row five
    // tiles rather than a short row.
    if (primary.length < KPI_PRIMARY_COUNT) {
      for (const tile of tiles) {
        if (primary.length >= KPI_PRIMARY_COUNT) break;
        if (!primary.includes(tile)) primary.push(tile);
      }
    }

    const primarySet = new Set(primary.map((t) => t.key));
    const secondary = tiles.filter((t) => !primarySet.has(t.key));

    const availableCount = tiles.filter((t) => t.value !== null).length;

    return {
      tiles,
      primary,
      secondary,
      primaryKeys: KPI_PRIMARY_KEYS,
      byKey,
      availableCount,
      unavailableCount: tiles.length - availableCount,
      allUnavailable: tiles.length > 0 && availableCount === 0,
      hasHistory: tiles.some((t) => Array.isArray(t.series) && t.series.length > 0),
      hasDeltas: tiles.some((t) => typeof t.deltaPct === "number"),
      isLoading: meta.isLoading,
    };
  }, [state]);
}

// ═════════════════════════════════════════════════════════════════════════
// §3  Written brief
// ═════════════════════════════════════════════════════════════════════════

export interface BriefView {
  brief: DailyBrief;
  available: boolean;
  paragraph: string;
  facts: DailyBriefFact[];
  factCount: number;
  factsByProvenance: Record<ProvenanceTier, DailyBriefFact[]>;
  /** Attribution + freshness. NEVER label this block "AI". */
  generatedLabel: string;
  /** Normalised: `null` whenever the brief IS available. */
  unavailableReason: string | null;
  /** Nothing has resolved yet — render a paragraph skeleton, not the reason. */
  isLoading: boolean;
}

/**
 * The week in words, plus the exact set of facts it was assembled from so the
 * UI can show its working.
 *
 * COPY RULE: this is written from numbers we can point at. It is not "AI", not
 * an "AI summary", not "generated by AI". Do not label it so.
 */
export function useBrief(): BriefView {
  const state = useDashboardState();
  return useMemo<BriefView>(() => {
    const { brief, meta } = getDashboardFixture(state);

    const factsByProvenance: Record<ProvenanceTier, DailyBriefFact[]> = {
      observed: [],
      estimated: [],
      derived: [],
    };
    for (const fact of brief.facts) factsByProvenance[fact.provenance].push(fact);

    return {
      brief,
      available: brief.available,
      paragraph: brief.paragraph,
      facts: brief.facts,
      factCount: brief.facts.length,
      factsByProvenance,
      generatedLabel: brief.generatedLabel,
      unavailableReason: brief.available ? null : brief.unavailableReason ?? null,
      isLoading: meta.isLoading,
    };
  }, [state]);
}

// ═════════════════════════════════════════════════════════════════════════
// §4  Long-runner gallery
// ═════════════════════════════════════════════════════════════════════════

/** Display labels for the three maturity tiers. */
export const LONG_RUNNER_TIER_LABELS: Readonly<Record<LongRunnerTier, string>> = {
  testing: "Testing",
  working: "Working",
  proven: "Proven",
};

/** Human ranges, derived from `LONG_RUNNER_TIER_BOUNDS` so they cannot drift. */
export const LONG_RUNNER_TIER_RANGE_LABELS: Readonly<Record<LongRunnerTier, string>> = {
  testing: `Under ${LONG_RUNNER_TIER_BOUNDS.testingMax + 1} days`,
  working: `${LONG_RUNNER_TIER_BOUNDS.testingMax + 1}–${LONG_RUNNER_TIER_BOUNDS.workingMax} days`,
  proven: `Over ${LONG_RUNNER_TIER_BOUNDS.workingMax} days`,
};

/** Most-mature first, matching the gallery's `daysRunning` descending sort. */
export const LONG_RUNNER_TIER_ORDER: readonly LongRunnerTier[] = [
  "proven",
  "working",
  "testing",
];

export interface LongRunnerTierGroup {
  tier: LongRunnerTier;
  /** "Proven" */
  label: string;
  /** "Over 45 days" */
  rangeLabel: string;
  /** Sorted `daysRunning` descending. */
  ads: LongRunnerAd[];
  count: number;
  /** How many ads in this tier carry the 90+ day saturation caveat. */
  caveatCount: number;
}

export interface LongRunnersView {
  /** Every card, `daysRunning` descending. */
  all: LongRunnerAd[];
  /** All three tiers, always, in `LONG_RUNNER_TIER_ORDER`. May be empty. */
  groups: LongRunnerTierGroup[];
  /** Same groups, empty ones dropped — use when rendering headers. */
  nonEmptyGroups: LongRunnerTierGroup[];
  byTier: Record<LongRunnerTier, LongRunnerAd[]>;
  tierCounts: Record<LongRunnerTier, number>;
  /** Cards running 90+ days, longest first. Each carries a ready `caveatNote`. */
  caveated: LongRunnerAd[];
  caveatCount: number;
  /**
   * Block-level caveat sentence, or null when nothing is caveated. Surface it:
   * longevity is a weak proxy, and the gallery must never imply longest = best.
   */
  caveatNote: string | null;
  saturationThresholdDays: number;
  longestDays: number;
  shortestDays: number;
  totalCount: number;
  isEmpty: boolean;
  /** Nothing resolved yet — render card skeletons, not the empty state. */
  isLoading: boolean;
}

/**
 * Long-running creative, grouped by maturity tier.
 *
 * `saturationCaveat` is true at 90+ days and carries its own ready-to-render
 * `caveatNote` on the ad. This hook additionally rolls a block-level sentence
 * so the gallery header can carry the honesty rather than relying on the
 * reader hovering one card.
 */
export function useLongRunners(): LongRunnersView {
  const state = useDashboardState();
  return useMemo<LongRunnersView>(() => {
    const { longRunners, meta } = getDashboardFixture(state);
    const all = [...longRunners].sort((a, b) => b.daysRunning - a.daysRunning);

    const byTier: Record<LongRunnerTier, LongRunnerAd[]> = {
      testing: [],
      working: [],
      proven: [],
    };
    for (const ad of all) byTier[ad.tier].push(ad);

    const groups: LongRunnerTierGroup[] = LONG_RUNNER_TIER_ORDER.map((tier) => ({
      tier,
      label: LONG_RUNNER_TIER_LABELS[tier],
      rangeLabel: LONG_RUNNER_TIER_RANGE_LABELS[tier],
      ads: byTier[tier],
      count: byTier[tier].length,
      caveatCount: byTier[tier].filter((a) => a.saturationCaveat).length,
    }));

    const caveated = all.filter((a) => a.saturationCaveat);
    const days = all.map((a) => a.daysRunning);

    return {
      all,
      groups,
      nonEmptyGroups: groups.filter((g) => g.count > 0),
      byTier,
      tierCounts: {
        testing: byTier.testing.length,
        working: byTier.working.length,
        proven: byTier.proven.length,
      },
      caveated,
      caveatCount: caveated.length,
      caveatNote: caveated.length
        ? `${caveated.length} of these ${plural(caveated.length, "has", "have")} run ${SATURATION_CAVEAT_DAYS}+ days. Past that, longevity is a weak proxy — a saturated ad looks identical to a winner from the outside.`
        : null,
      saturationThresholdDays: SATURATION_CAVEAT_DAYS,
      longestDays: maxOf(days),
      shortestDays: minOf(days),
      totalCount: all.length,
      isEmpty: all.length === 0,
      isLoading: meta.isLoading,
    };
  }, [state]);
}

// ═════════════════════════════════════════════════════════════════════════
// §5  Change feed
// ═════════════════════════════════════════════════════════════════════════

/** Chip labels for the six change kinds. */
export const CHANGE_KIND_LABELS: Readonly<Record<ChangeSignalKind, string>> = {
  "new-angle": "New angle",
  "offer-shift": "Offer shift",
  "format-expansion": "Format expansion",
  "velocity-change": "Shipping faster",
  "landing-page-change": "Page swap",
  withdrawal: "Went quiet",
};

/** Fixed chip order. Stable regardless of what a given state contains. */
export const CHANGE_KIND_ORDER: readonly ChangeSignalKind[] = [
  "new-angle",
  "offer-shift",
  "format-expansion",
  "velocity-change",
  "landing-page-change",
  "withdrawal",
];

/** Summary-strip phrasing, plural-aware. "6 new angles" / "1 new angle". */
const CHANGE_KIND_PHRASE: Readonly<Record<ChangeSignalKind, [string, string]>> = {
  "new-angle": ["new angle", "new angles"],
  "offer-shift": ["offer changed", "offers changed"],
  "format-expansion": ["new format", "new formats"],
  "velocity-change": ["shipping faster", "shipping faster"],
  "landing-page-change": ["page swapped", "pages swapped"],
  withdrawal: ["went quiet", "went quiet"],
};

export interface ChangeFeedKindCount {
  kind: ChangeSignalKind;
  /** "New angle" */
  label: string;
  count: number;
}

export interface ChangeFeedSummaryPart {
  kind: ChangeSignalKind;
  count: number;
  /** "6 new angles" — count already interpolated. */
  phrase: string;
}

export interface ChangeFeedView {
  /** Every signal the fixture carries, untouched, source order. */
  all: ChangeSignal[];
  /**
   * Signals that CLEAR the recurrence gate (`observationCount >= 2`), most
   * recently seen first. These are the findings.
   */
  trends: ChangeSignal[];
  /**
   * Signals seen only ONCE. Not dropped — a single observation is not a trend,
   * but hiding it loses the teaching moment. Render these separately, visually
   * de-emphasised, as "watching, not yet a trend".
   */
  gated: ChangeSignal[];
  /** Ready-to-render explainer for the gated group. Null when there are none. */
  gatedNote: string | null;
  /** 2. A signal needs this many observations before it counts as a trend. */
  recurrenceGate: number;
  /** One entry per kind PRESENT in `trends`, in `CHANGE_KIND_ORDER`. */
  counts: ChangeFeedKindCount[];
  /** All six kinds, zeros included — for a fixed-width chip row. */
  countsByKind: Record<ChangeSignalKind, number>;
  trendCount: number;
  gatedCount: number;
  /** Window anchor in days back from the fixture clock. */
  sinceDaysAgo: number;
  /** "Tuesday" — or a short date when the window is older than a week. */
  sinceLabel: string;
  /** Segments of the summary strip, so it can render as chips not a blob. */
  summaryParts: ChangeFeedSummaryPart[];
  /** "Since Tuesday: 6 new angles · 3 offers changed · 2 went quiet". */
  summaryLine: string;
  isEmpty: boolean;
  /** Nothing resolved yet — render row skeletons, not the empty state. */
  isLoading: boolean;
}

/**
 * The change feed, split by the recurrence gate.
 *
 * `SIGNAL_RECURRENCE_GATE` is 2. Signal index 6 in the populated fixture is
 * deliberately a single observation — it lands in `gated`, not in the bin.
 * The summary strip counts `trends` only, because the strip is a claim.
 */
export function useChangeFeed(): ChangeFeedView {
  const state = useDashboardState();
  return useMemo<ChangeFeedView>(() => {
    const { signals, meta } = getDashboardFixture(state);

    const trends = signals
      .filter((s) => s.meetsRecurrenceGate)
      .sort(
        (a, b) =>
          a.lastSeenDaysAgo - b.lastSeenDaysAgo ||
          b.observationCount - a.observationCount ||
          a.id.localeCompare(b.id),
      );

    const gated = signals
      .filter((s) => !s.meetsRecurrenceGate)
      .sort((a, b) => a.lastSeenDaysAgo - b.lastSeenDaysAgo || a.id.localeCompare(b.id));

    const countsByKind = CHANGE_KIND_ORDER.reduce((acc, kind) => {
      acc[kind] = 0;
      return acc;
    }, {} as Record<ChangeSignalKind, number>);
    for (const s of trends) countsByKind[s.kind] += 1;

    const counts: ChangeFeedKindCount[] = CHANGE_KIND_ORDER
      .filter((kind) => countsByKind[kind] > 0)
      .map((kind) => ({
        kind,
        label: CHANGE_KIND_LABELS[kind],
        count: countsByKind[kind],
      }));

    // Anchor the strip on the OLDEST last-sighting in the feed: every change
    // shown has been seen at some point between then and now. Clamped to 1 so
    // the strip never reads "Since today".
    const sinceDaysAgo = Math.max(1, maxOf(trends.map((s) => s.lastSeenDaysAgo), 1));
    const sinceLabel = sinceLabelFor(sinceDaysAgo);

    const summaryParts: ChangeFeedSummaryPart[] = counts.map(({ kind, count }) => {
      const [one, many] = CHANGE_KIND_PHRASE[kind];
      return { kind, count, phrase: `${count} ${plural(count, one, many)}` };
    });

    const summaryLine = summaryParts.length
      ? `Since ${sinceLabel}: ${summaryParts.map((p) => p.phrase).join(" · ")}`
      : "";

    return {
      all: signals,
      trends,
      gated,
      gatedNote: gated.length
        ? `${gated.length} ${plural(gated.length, "change has", "changes have")} only been seen once. We're watching ${plural(gated.length, "it", "them")} — one sighting isn't a trend yet.`
        : null,
      recurrenceGate: SIGNAL_RECURRENCE_GATE,
      counts,
      countsByKind,
      trendCount: trends.length,
      gatedCount: gated.length,
      sinceDaysAgo,
      sinceLabel,
      summaryParts,
      summaryLine,
      isEmpty: signals.length === 0,
      isLoading: meta.isLoading,
    };
  }, [state]);
}

// ═════════════════════════════════════════════════════════════════════════
// §6  Launch cadence
// ═════════════════════════════════════════════════════════════════════════

export interface LaunchCadenceView {
  /** 12 weeks, oldest first. `[]` in thin and zero. */
  weeks: LaunchCadenceWeek[];
  weekCount: number;
  /** Intended length of the series — 12 — even when `weeks` is empty. */
  windowWeeks: number;
  /** What the chart is scoped to. Renders under it. */
  scopeNote: string;
  totalLaunched: number;
  max: number;
  min: number;
  /** Mean ads/week to one decimal. 0 when empty. */
  average: number;
  /** "12-week average 41/wk". Empty string when there is nothing to average. */
  averageLabel: string;
  /** The single annotated spike week, or null. */
  spike: LaunchCadenceWeek | null;
  /** The spike's ready-to-render explanation. Null when there is no spike. */
  spikeNote: string | null;
  /** Most recent week. */
  latest: LaunchCadenceWeek | null;
  /** Week before the most recent. */
  previous: LaunchCadenceWeek | null;
  /** Latest vs previous, rounded. Null when there aren't two weeks. */
  latestDeltaPct: number | null;
  /** "Jun 9 – Aug 31". Empty string when there are no weeks. */
  rangeLabel: string;
  isEmpty: boolean;
  /** Nothing resolved yet — render a chart skeleton, not the empty state. */
  isLoading: boolean;
}

/**
 * The cadence view, as a PURE function of the fixture slice.
 *
 * Factored out of `useLaunchCadence` so `useTopCompetitors` can hand the same
 * object back inside its combined view. One implementation means the standalone
 * chart and the merged competitors-plus-cadence card can never disagree about
 * the average, the spike, or the range.
 */
function buildCadenceView(
  weeks: readonly LaunchCadenceWeek[],
  scopeNote: string,
  isLoading: boolean,
): LaunchCadenceView {
  const values = weeks.map((w) => w.adsLaunched);

  const total = sum(values);
  const average = weeks.length ? round(total / weeks.length, 1) : 0;

  const spike = weeks.find((w) => w.isSpike) ?? null;
  const latest = weeks.length ? weeks[weeks.length - 1] : null;
  const previous = weeks.length > 1 ? weeks[weeks.length - 2] : null;

  const latestDeltaPct =
    latest && previous && previous.adsLaunched > 0
      ? Math.round(
          ((latest.adsLaunched - previous.adsLaunched) / previous.adsLaunched) * 100,
        )
      : null;

  return {
    weeks: [...weeks],
    weekCount: weeks.length,
    windowWeeks: CADENCE_WEEKS,
    scopeNote,
    totalLaunched: total,
    max: maxOf(values),
    min: minOf(values),
    average,
    averageLabel: weeks.length
      ? `${weeks.length}-week average ${Math.round(average)}/wk`
      : "",
    spike,
    spikeNote: spike?.spikeNote ?? null,
    latest,
    previous,
    latestDeltaPct,
    rangeLabel: weeks.length
      ? `${weeks[0].weekStartLabel} – ${weeks[weeks.length - 1].weekStartLabel}`
      : "",
    isEmpty: weeks.length === 0,
    isLoading,
  };
}

/**
 * 12 weeks of new-creative volume, with the one annotated spike surfaced.
 *
 * NOT A STANDALONE BLOCK any more: the same view arrives as
 * `useTopCompetitors().cadence`, built by the same function, and that merged
 * card is where the chart renders. This hook stays exported for anything that
 * already reads it — expect nothing to mount it on its own.
 */
export function useLaunchCadence(): LaunchCadenceView {
  const state = useDashboardState();
  return useMemo<LaunchCadenceView>(() => {
    const { cadence, meta } = getDashboardFixture(state);
    return buildCadenceView(cadence, meta.cadenceScopeNote, meta.isLoading);
  }, [state]);
}

// ═════════════════════════════════════════════════════════════════════════
// §6b  Top competitors, merged with launch cadence
// ═════════════════════════════════════════════════════════════════════════

/** How many competitors the merged block ranks. */
export const TOP_COMPETITOR_COUNT = 5;

export interface TopCompetitorRow {
  /** 1-based position in the ranked list. */
  rank: number;
  domain: string;
  industry: string;
  /** New ads in the last 30 days — the volume the ranking is by. */
  adCount30d: number;
  /** The 30 days before that, so the change is checkable. */
  adCountPrev30d: number;
  /** Change on the prior 30 days. Can be negative. */
  deltaPct: number;
  /** Already on your watchlist. */
  tracked: boolean;
  /** `/insights/discover?domain=…` — every ad we have for this competitor. */
  discoverHref: string;
  /** The underlying mover row, if a block needs anything else off it. */
  mover: Mover;
}

export interface TopCompetitorsView {
  /** Top 5 by 30-day ad volume. Fewer when fewer exist; never padded. */
  competitors: TopCompetitorRow[];
  competitorCount: number;
  /**
   * THE COMPETITORS YOU FOLLOW (`insight_competitors`) — the tracked set, not
   * the ranked five above. `followedCompetitorCount` is the "Competitors
   * followed" KPI value and `followedCompetitorLiveAds` is "Total competitor
   * ads", so this block can print the rows those two tiles add up from.
   *
   * Each row's `liveAds` is ads RUNNING NOW — the same figure
   * `usePagesAndDomains()` prints for the same domain. Do not sum `adCount30d`
   * against it; that is ads launched in 30 days, a different question.
   */
  followedCompetitors: WatchItem[];
  followedCompetitorCount: number;
  /** Σ `followedCompetitors[].liveAds`. Equals the "Total competitor ads" KPI. */
  followedCompetitorLiveAds: number;
  /** Plain-words basis for the two totals above. */
  followedBasisNote: string;
  /** How many of the ranked five you already follow. */
  trackedCount: number;
  /** How many you do NOT follow — the reason the row needs a follow action. */
  untrackedCount: number;
  /** Largest `adCount30d` in the list — bar scaling. 0 when empty. */
  maxAdCount: number;
  /** Largest absolute `deltaPct` — bar scaling. 0 when empty. */
  maxAbsDeltaPct: number;
  /** Fixed window disclosure, same wording the movers block uses. */
  windowLabel: string;
  /**
   * The 12-week launch cadence, IDENTICAL to `useLaunchCadence()` — same
   * object shape, built by the same function. The merged card renders the
   * ranked list beside/above this chart.
   */
  cadence: LaunchCadenceView;
  isEmpty: boolean;
  /** Nothing resolved yet — render skeletons for BOTH halves. */
  isLoading: boolean;
}

/**
 * Top competitors and launch cadence in ONE view, because they answer one
 * question: who is shipping, and how much.
 *
 * `useMovers()` and `useLaunchCadence()` are untouched and still work — this is
 * the combined view, not a replacement.
 *
 * The ranking is by `adCount30d`, the same field the movers list prints, and
 * the window label is the same string, so the two blocks cannot appear to
 * measure different things. NOTE the distinction a component must respect:
 * `adCount30d` is ads LAUNCHED in the last 30 days, while the domain table's
 * `liveAds` is ads RUNNING right now. Different questions, different numbers —
 * label the column "New ads (30d)", never "Live ads".
 */
const FOLLOWED_COMPETITOR_BASIS_NOTE =
  "Ads running right now from the competitors you follow. Not the whole market — only the brands on your competitor list.";

export function useTopCompetitors(): TopCompetitorsView {
  const state = useDashboardState();
  return useMemo<TopCompetitorsView>(() => {
    const { movers, cadence, meta, watchlist } = getDashboardFixture(state);

    const competitors = [...movers]
      .sort((a, b) => b.adCount30d - a.adCount30d || a.domain.localeCompare(b.domain))
      .slice(0, TOP_COMPETITOR_COUNT)
      .map<TopCompetitorRow>((mover, i) => ({
        rank: i + 1,
        domain: mover.domain,
        industry: mover.industry,
        adCount30d: mover.adCount30d,
        adCountPrev30d: mover.adCountPrev30d,
        deltaPct: mover.deltaPct,
        tracked: mover.tracked,
        discoverHref: `/insights/discover?domain=${encodeURIComponent(mover.domain)}`,
        mover,
      }));

    const trackedCount = competitors.filter((c) => c.tracked).length;

    return {
      competitors,
      competitorCount: competitors.length,
      followedCompetitors: watchlist.trackedCompetitors,
      followedCompetitorCount: watchlist.trackedCompetitorCount,
      followedCompetitorLiveAds: watchlist.trackedCompetitorLiveAds,
      followedBasisNote: FOLLOWED_COMPETITOR_BASIS_NOTE,
      trackedCount,
      untrackedCount: competitors.length - trackedCount,
      maxAdCount: maxOf(competitors.map((c) => c.adCount30d)),
      maxAbsDeltaPct: maxOf(competitors.map((c) => Math.abs(c.deltaPct))),
      windowLabel: MOVERS_WINDOW_LABEL,
      cadence: buildCadenceView(cadence, meta.cadenceScopeNote, meta.isLoading),
      isEmpty: competitors.length === 0 && cadence.length === 0,
      isLoading: meta.isLoading,
    };
  }, [state]);
}

// ═════════════════════════════════════════════════════════════════════════
// §7  Angle mix
// ═════════════════════════════════════════════════════════════════════════

export interface AngleMixRow {
  angleKey: AngleKey;
  /** "Question-led" */
  angle: string;
  /** Share of live creative in your followed industries. */
  marketPct: number;
  /** Ads behind `marketPct` — the number `discoverHref` would return. */
  adCount: number;
  discoverHref: string;
  /**
   * Share of YOUR live creative on this angle.
   *
   * `null` means ABSENT, not zero: we have no brand configured (zero state).
   * A genuine `0` means the brand runs no creative on this angle. Render the
   * two differently.
   */
  yourPct: number | null;
  /** `marketPct - yourPct`. Positive = the market leans on it more than you. */
  gapPct: number | null;
  /** "Question-led 32% (you: 8%)" — or without the suffix when absent. */
  comparisonLabel: string;
}

/** Reserved key for the roll-up bucket. Not a real `AngleKey`. */
export const ANGLE_OTHERS_KEY = "others";

/** How many angles are named before the rest fold into Others. */
export const ANGLE_TOP_COUNT = 5;

/** "Others" — the label to print. Plain word, no invention. */
export const ANGLE_OTHERS_LABEL = "Others";

/**
 * One row of the DISPLAY breakdown: the top five angles plus an explicit
 * `Others` bucket, so the percentages add to the whole and nothing is silently
 * dropped off the end of the list.
 *
 * `isOthers` rows are structurally different and must render differently:
 *  - `key` is the reserved string `"others"`, not an `AngleKey`;
 *  - `discoverHref` is `null`, because there is no single `?angle=` value that
 *    means "everything else". A link that lies is worse than no link — so the
 *    Others row gets no link at all;
 *  - `rolledUp` names the angles folded into it, for a tooltip.
 */
export interface AngleMixDisplayRow {
  /** An `AngleKey`, or `"others"` for the bucket. */
  key: string;
  /** "Question-led" / "Others". */
  angle: string;
  marketPct: number;
  adCount: number;
  /** `null` on the Others row — no honest single destination exists. */
  discoverHref: string | null;
  /** Share of YOUR live creative. `null` = no brand configured, not zero. */
  yourPct: number | null;
  gapPct: number | null;
  /** True for the roll-up bucket only. Style it apart. */
  isOthers: boolean;
  /** Labels of the angles folded into Others. `[]` on a named angle. */
  rolledUp: string[];
  /** "Question-led 32% (you: 8%)". */
  comparisonLabel: string;
}

export interface AngleMixView {
  /**
   * EVERY angle, market share descending — the full breakdown, unchanged.
   * Use `displayRows` for the block; this stays for anything that needs the
   * complete list (a drilldown, a tooltip, an export).
   */
  rows: AngleMixRow[];
  /**
   * WHAT THE BLOCK SHOULD RENDER: the top 5 angles plus a 6th `Others` row
   * summing every remaining angle, so the percentages total the whole. At most
   * 6 rows. When there are 5 or fewer angles there is no Others row and no
   * empty bucket is fabricated.
   */
  displayRows: AngleMixDisplayRow[];
  /** The five named angles of `displayRows`. */
  topRows: AngleMixDisplayRow[];
  /** The Others bucket, or null when every angle is named. */
  othersRow: AngleMixDisplayRow | null;
  /** How many angles folded into Others. 0 when there is no bucket. */
  othersAngleCount: number;
  /** Sums `displayRows[].marketPct` — the whole, ~100 when populated. */
  displayTotalPct: number;
  /** False when there is no brand to compare against — the your-side is absent. */
  hasYourSide: boolean;
  yourBrandName: string | null;
  /** Sums `marketPct`; ~100 when populated. */
  marketTotalPct: number;
  /** Sums `adCount` — the live creative the donut is a breakdown of. */
  totalAdCount: number;
  topMarket: AngleMixRow | null;
  /** Largest positive `gapPct` — the angle the market uses and you don't. */
  biggestGap: AngleMixRow | null;
  /** Angles where you out-index the market, biggest lead first. */
  overIndexed: AngleMixRow[];
  /** Angles where the market out-indexes you, biggest gap first. */
  underIndexed: AngleMixRow[];
  isEmpty: boolean;
  /** Fixed scope disclosure for the block footer. */
  basisNote: string;
  /** Nothing resolved yet — render a donut skeleton, not the empty state. */
  isLoading: boolean;
}

const ANGLE_BASIS_NOTE =
  "Share of live creative by opening angle, resolved from ad headlines — not a share of spend.";

/**
 * Market angle mix paired with your own, so a slice can render
 * "Question-led 32% (you: 8%)".
 *
 * When there is no `myBrand` the your-side is ABSENT (`yourPct: null`), never
 * zero. `hasYourSide` is the flag to branch the whole block on.
 */
export function useAngleMix(): AngleMixView {
  const state = useDashboardState();
  return useMemo<AngleMixView>(() => {
    const { angles, myBrand, meta } = getDashboardFixture(state);

    // Read the your-side from `myBrand` rather than from `AngleSlice.yourPct`:
    // the slice coalesces a missing entry to 0, which erases the distinction
    // between "runs none of this angle" and "we have no brand at all".
    const yourByKey = myBrand
      ? new Map<AngleKey, number>(myBrand.angleMix.map((m) => [m.angleKey, m.pct]))
      : null;

    const rows: AngleMixRow[] = angles
      .map<AngleMixRow>((slice: AngleSlice) => {
        const yourPct =
          yourByKey && yourByKey.has(slice.angleKey)
            ? (yourByKey.get(slice.angleKey) as number)
            : null;
        return {
          angleKey: slice.angleKey,
          angle: slice.angle,
          marketPct: slice.marketPct,
          adCount: slice.adCount,
          discoverHref: slice.discoverHref,
          yourPct,
          gapPct: yourPct === null ? null : round(slice.marketPct - yourPct, 1),
          comparisonLabel:
            yourPct === null
              ? `${slice.angle} ${slice.marketPct}%`
              : `${slice.angle} ${slice.marketPct}% (you: ${yourPct}%)`,
        };
      })
      .sort((a, b) => b.marketPct - a.marketPct);

    const withGap = rows.filter(
      (r): r is AngleMixRow & { gapPct: number } => r.gapPct !== null,
    );

    // ── Top 5 + Others ───────────────────────────────────────────────────
    // `rows` is already market-share descending, so the head is the top five
    // and the tail is everything else. The tail is SUMMED, never dropped: a
    // breakdown whose slices don't add to the whole invites the reader to
    // wonder what is missing.
    const named = rows.slice(0, ANGLE_TOP_COUNT);
    const tail = rows.slice(ANGLE_TOP_COUNT);

    const toDisplay = (r: AngleMixRow): AngleMixDisplayRow => ({
      key: r.angleKey,
      angle: r.angle,
      marketPct: r.marketPct,
      adCount: r.adCount,
      discoverHref: r.discoverHref,
      yourPct: r.yourPct,
      gapPct: r.gapPct,
      isOthers: false,
      rolledUp: [],
      comparisonLabel: r.comparisonLabel,
    });

    const topRows = named.map(toDisplay);

    // The your-side of Others is only knowable when we have a brand at all.
    // `null` there means absent, exactly as it does on a named angle.
    const tailYourPcts = tail.map((r) => r.yourPct).filter((p): p is number => p !== null);
    const othersYourPct =
      tail.length && tailYourPcts.length === tail.length
        ? round(sum(tailYourPcts), 1)
        : null;
    const othersMarketPct = round(sum(tail.map((r) => r.marketPct)), 1);

    const othersRow: AngleMixDisplayRow | null = tail.length
      ? {
          key: ANGLE_OTHERS_KEY,
          angle: ANGLE_OTHERS_LABEL,
          marketPct: othersMarketPct,
          adCount: sum(tail.map((r) => r.adCount)),
          // No single `?angle=` means "everything else".
          discoverHref: null,
          yourPct: othersYourPct,
          gapPct:
            othersYourPct === null ? null : round(othersMarketPct - othersYourPct, 1),
          isOthers: true,
          rolledUp: tail.map((r) => r.angle),
          comparisonLabel:
            othersYourPct === null
              ? `${ANGLE_OTHERS_LABEL} ${othersMarketPct}%`
              : `${ANGLE_OTHERS_LABEL} ${othersMarketPct}% (you: ${othersYourPct}%)`,
        }
      : null;

    const displayRows = othersRow ? [...topRows, othersRow] : topRows;

    return {
      rows,
      displayRows,
      topRows,
      othersRow,
      othersAngleCount: tail.length,
      displayTotalPct: round(sum(displayRows.map((r) => r.marketPct)), 1),
      hasYourSide: Boolean(yourByKey) && rows.some((r) => r.yourPct !== null),
      yourBrandName: myBrand?.name ?? null,
      marketTotalPct: round(sum(rows.map((r) => r.marketPct)), 1),
      totalAdCount: sum(rows.map((r) => r.adCount)),
      topMarket: rows.length ? rows[0] : null,
      biggestGap: withGap.length
        ? [...withGap].sort((a, b) => b.gapPct - a.gapPct)[0]
        : null,
      overIndexed: withGap.filter((r) => r.gapPct < 0).sort((a, b) => a.gapPct - b.gapPct),
      underIndexed: withGap.filter((r) => r.gapPct > 0).sort((a, b) => b.gapPct - a.gapPct),
      isEmpty: rows.length === 0,
      basisNote: ANGLE_BASIS_NOTE,
      isLoading: meta.isLoading,
    };
  }, [state]);
}

// ═════════════════════════════════════════════════════════════════════════
// §8  You vs your market
// ═════════════════════════════════════════════════════════════════════════

export type BrandComparisonKey = "live-ads" | "ads-per-week" | "creative-lifespan";

export type BrandComparisonVerdict = "above" | "below" | "similar" | "unknown";

export interface BrandComparisonRow {
  key: BrandComparisonKey;
  label: string;
  /** Display-ready. Always present — your own side is always knowable. */
  yourValue: string;
  yourNumber: number;
  /** `null` when we have no market baseline. Paired with `marketNaReason`. */
  marketValue: string | null;
  marketNumber: number | null;
  /** Required whenever `marketValue` is null. Never render a bare dash. */
  marketNaReason?: string;
  /** What the market number is a baseline OF. Renders as the column caption. */
  marketLabel: string;
  verdict: BrandComparisonVerdict;
}

export interface MyBrandVsMarketView {
  hasBrand: boolean;
  brand: MyBrand | null;
  brandName: string | null;
  /** Creative behaviour only. Never spend, never results. */
  scopeNote: string;
  /** `[]` when there is no brand configured. */
  rows: BrandComparisonRow[];
  formatMix: FormatMixEntry[];
  /**
   * @deprecated READ ANGLES FROM `useAngleMix()` INSTEAD.
   *
   * Angle data belongs to the angle block and nowhere else — two blocks each
   * printing their own angle split is how the page ends up contradicting
   * itself. Kept only so existing readers compile; `YouVsMarket` drops it.
   * `useAngleMix().displayRows` carries YOUR share and the market's side by
   * side, which is the comparison this field was reaching for anyway.
   */
  angleMix: AngleMixEntry[];
  /** "new creative every 9 days". Null when there is no brand. */
  refreshCadenceLabel: string | null;
  /** False in thin and zero — the market column has no numbers to show. */
  hasMarketBaseline: boolean;
  /** Why the market column is empty, when it is. Null when it isn't. */
  marketBaselineNote: string | null;
  isEmpty: boolean;
  /** Nothing resolved yet — render a skeleton, not "no brand configured". */
  isLoading: boolean;
}

const MY_BRAND_ZERO_SCOPE_NOTE =
  "Creative behaviour only — what's live, how often it changes, how long it lasts. Insights can't see spend or results, yours or anyone's.";

function verdictFor(yours: number, market: number | null): BrandComparisonVerdict {
  if (market === null || market === 0) return "unknown";
  const ratio = Math.abs(yours - market) / market;
  if (ratio < 0.1) return "similar";
  return yours > market ? "above" : "below";
}

/**
 * Your creative behaviour against the market's, on the three axes where a
 * defensible baseline exists.
 *
 * SCOPE RULE, inherited from `MyBrand`: creative behaviour only. How much is
 * live, how fast it ships, how long it lasts. Never ROAS, never spend, never
 * performance — Insights does not see the user's results.
 *
 * Refresh cadence is deliberately NOT a comparison row: we can see when
 * creative appears in the market, not the gap between one advertiser's own
 * launches, so there is no honest market number to put beside it. It comes
 * back as a your-side-only fact (`refreshCadenceLabel`).
 */
export function useMyBrandVsMarket(): MyBrandVsMarketView {
  const state = useDashboardState();
  return useMemo<MyBrandVsMarketView>(() => {
    const fixture = getDashboardFixture(state);
    const { myBrand, watchlist, domains, kpis, meta } = fixture;

    if (!myBrand) {
      return {
        hasBrand: false,
        brand: null,
        brandName: null,
        scopeNote: MY_BRAND_ZERO_SCOPE_NOTE,
        rows: [],
        formatMix: [],
        angleMix: [],
        refreshCadenceLabel: null,
        hasMarketBaseline: false,
        marketBaselineNote: meta.isLoading
          ? "Still loading your brand and the market to compare it against."
          : "Nothing followed yet, so there's no market to compare against.",
        isEmpty: true,
        isLoading: meta.isLoading,
      };
    }

    // Baseline 1 — typical live-ad count. Taken from the advertisers the user
    // actually follows; falls back to the domain table when the watchlist is
    // empty. Both are counts we show elsewhere on the page.
    const watchLiveAds = watchlist.items.map((i) => i.liveAds);
    const domainLiveAds = domains.map((d) => d.liveAds);
    const liveAdsBaseline = median(watchLiveAds) ?? median(domainLiveAds);
    const liveAdsBaselineLabel = watchLiveAds.length
      ? `Median across the ${watchLiveAds.length} brands you follow`
      : domainLiveAds.length
        ? `Median across the ${domainLiveAds.length} domains in your domain table`
        : "No indexed advertisers to compare against";

    // Baseline 2 — new ads per week per advertiser. The cadence chart is the
    // total across the advertisers followed, so divide by that follow count.
    const cadenceValues = fixture.cadence.map((w) => w.adsLaunched);
    const followCount = watchlist.followCount;
    const perWeekBaseline =
      cadenceValues.length && followCount > 0
        ? round(sum(cadenceValues) / cadenceValues.length / followCount, 1)
        : null;

    // Baseline 3 — median creative lifespan. Read straight back off the KPI
    // tile so this block and the tile above it can never disagree.
    const lifespanTile = kpis.find((t) => t.key === "creative-lifespan");
    const lifespanBaseline = parseLeadingNumber(lifespanTile?.value ?? null);

    const rows: BrandComparisonRow[] = [
      {
        key: "live-ads",
        label: "Live ads",
        yourValue: formatInt(myBrand.liveAds),
        yourNumber: myBrand.liveAds,
        marketValue: liveAdsBaseline === null ? null : formatInt(liveAdsBaseline),
        marketNumber: liveAdsBaseline,
        ...(liveAdsBaseline === null
          ? { marketNaReason: "no indexed advertisers to compare against yet" }
          : {}),
        marketLabel: liveAdsBaselineLabel,
        verdict: verdictFor(myBrand.liveAds, liveAdsBaseline),
      },
      {
        key: "ads-per-week",
        label: "New ads per week",
        yourValue: `${myBrand.adsLaunchedPerWeek}`,
        yourNumber: myBrand.adsLaunchedPerWeek,
        marketValue: perWeekBaseline === null ? null : `${perWeekBaseline}`,
        marketNumber: perWeekBaseline,
        ...(perWeekBaseline === null
          ? { marketNaReason: "nothing indexed to measure launch volume against" }
          : {}),
        marketLabel: "Per advertiser, averaged over the 12-week cadence window",
        verdict: verdictFor(myBrand.adsLaunchedPerWeek, perWeekBaseline),
      },
      {
        key: "creative-lifespan",
        label: "Average creative lifespan",
        yourValue: `${myBrand.avgCreativeLifespanDays} days`,
        yourNumber: myBrand.avgCreativeLifespanDays,
        marketValue: lifespanBaseline === null ? null : `${lifespanBaseline} days`,
        marketNumber: lifespanBaseline,
        ...(lifespanBaseline === null
          ? {
              marketNaReason:
                lifespanTile?.naReason ?? "no indexed ads to compute a median from",
            }
          : {}),
        marketLabel: "Median across live ads in your followed industries",
        verdict: verdictFor(myBrand.avgCreativeLifespanDays, lifespanBaseline),
      },
    ];

    const hasMarketBaseline = rows.some((r) => r.marketNumber !== null);

    return {
      hasBrand: true,
      brand: myBrand,
      brandName: myBrand.name,
      scopeNote: myBrand.scopeNote,
      rows,
      formatMix: myBrand.formatMix,
      angleMix: myBrand.angleMix,
      refreshCadenceLabel: myBrand.refreshCadenceLabel,
      hasMarketBaseline,
      marketBaselineNote: hasMarketBaseline
        ? null
        : `Your side is known — it comes from your own account. The market side needs an indexed industry, and ${myBrand.industry} isn't indexed yet.`,
      isEmpty: false,
      isLoading: meta.isLoading,
    };
  }, [state]);
}

// ═════════════════════════════════════════════════════════════════════════
// §9  Creative share of voice
// ═════════════════════════════════════════════════════════════════════════

/**
 * NAMING NOTE, read before touching this section.
 *
 * This is share of LIVE CREATIVE — what fraction of the ads currently running
 * in an industry are yours. It is NOT share of spend, share of budget, share
 * of impressions, or share of anything Meta bills for. We cannot see spend and
 * must not imply we can. Every percentage field below is therefore named
 * `creativeSharePct`, never `pct` or `share`.
 */

export interface CreativeShareSegment {
  /** Stable key for the segment — "you", a domain, or "long-tail". */
  key: string;
  /** Display label: your brand name, a competitor domain, or "Everyone else". */
  label: string;
  /** Share of LIVE CREATIVE. Not spend. */
  creativeSharePct: number;
  adCount: number;
  isYou: boolean;
  isLongTail: boolean;
}

export interface CreativeShareRow {
  industry: string;
  /** Fixed disclosure: share of live creative, not spend. */
  basis: string;
  /** All live ads indexed in this industry — the denominator. */
  totalLiveAds: number;
  you: { name: string; creativeSharePct: number; adCount: number };
  leaders: Array<{ domain: string; creativeSharePct: number; adCount: number; rank: number }>;
  /** Everything outside you + the named leaders. Always >= 0. */
  longTailPct: number;
  longTailAdCount: number;
  /** Ordered you → leaders → long tail. Ready for a stacked bar. */
  segments: CreativeShareSegment[];
  /** Your 1-based position among you + the named leaders. */
  yourRank: number;
  /** Top leader's share minus yours. 0 when you already lead. */
  gapToLeaderPct: number;
  provenance: ProvenanceTier;
}

export interface CreativeShareOfVoiceView {
  rows: CreativeShareRow[];
  isEmpty: boolean;
  /** "Share of live creative" — the metric name to put on the block. */
  metricLabel: string;
  /** Fixed disclosure line. Render it; the distinction is the point. */
  basisNote: string;
  /** Industry where your creative share is highest. */
  strongest: CreativeShareRow | null;
  /** Industry where your creative share is lowest. */
  weakest: CreativeShareRow | null;
  /** Nothing resolved yet — render bar skeletons, not the empty state. */
  isLoading: boolean;
}

const CREATIVE_SOV_METRIC_LABEL = "Share of live creative";
const CREATIVE_SOV_BASIS_NOTE =
  "Share of live creative in each industry — the ads running, not the money behind them. Insights cannot see spend.";

/**
 * Creative share of voice, per industry you advertise in.
 *
 * See the naming note above: nothing in this hook is about spend.
 */
export function useShareOfVoice(): CreativeShareOfVoiceView {
  const state = useDashboardState();
  return useMemo<CreativeShareOfVoiceView>(() => {
    const { shareOfVoice, meta } = getDashboardFixture(state);

    const rows: CreativeShareRow[] = shareOfVoice.map((row: ShareOfVoiceRow) => {
      const leaders = row.leaders.map((l, i) => ({
        domain: l.domain,
        creativeSharePct: l.pct,
        adCount: l.adCount,
        rank: i + 1,
      }));

      const namedPct = row.you.pct + sum(leaders.map((l) => l.creativeSharePct));
      const namedAds = row.you.adCount + sum(leaders.map((l) => l.adCount));
      const longTailPct = Math.max(0, round(100 - namedPct, 1));
      const longTailAdCount = Math.max(0, row.totalLiveAds - namedAds);

      const segments: CreativeShareSegment[] = [
        {
          key: "you",
          label: row.you.name,
          creativeSharePct: row.you.pct,
          adCount: row.you.adCount,
          isYou: true,
          isLongTail: false,
        },
        ...leaders.map<CreativeShareSegment>((l) => ({
          key: l.domain,
          label: l.domain,
          creativeSharePct: l.creativeSharePct,
          adCount: l.adCount,
          isYou: false,
          isLongTail: false,
        })),
        {
          key: "long-tail",
          label: "Everyone else",
          creativeSharePct: longTailPct,
          adCount: longTailAdCount,
          isYou: false,
          isLongTail: true,
        },
      ];

      const topLeaderPct = maxOf(leaders.map((l) => l.creativeSharePct));

      return {
        industry: row.industry,
        basis: row.basis,
        totalLiveAds: row.totalLiveAds,
        you: {
          name: row.you.name,
          creativeSharePct: row.you.pct,
          adCount: row.you.adCount,
        },
        leaders,
        longTailPct,
        longTailAdCount,
        segments,
        yourRank:
          leaders.filter((l) => l.creativeSharePct > row.you.pct).length + 1,
        gapToLeaderPct: Math.max(0, round(topLeaderPct - row.you.pct, 1)),
        provenance: row.provenance,
      };
    });

    const ranked = [...rows].sort(
      (a, b) => b.you.creativeSharePct - a.you.creativeSharePct,
    );

    return {
      rows,
      isEmpty: rows.length === 0,
      metricLabel: CREATIVE_SOV_METRIC_LABEL,
      basisNote: CREATIVE_SOV_BASIS_NOTE,
      strongest: ranked.length ? ranked[0] : null,
      weakest: ranked.length ? ranked[ranked.length - 1] : null,
      isLoading: meta.isLoading,
    };
  }, [state]);
}

// ═════════════════════════════════════════════════════════════════════════
// §10  Domain table
// ═════════════════════════════════════════════════════════════════════════

/**
 * The three genuinely different column sets. `leadgen` / `ppc` / `telehealth`
 * share one identical set, so they collapse into `funnel`.
 */
export type DomainVariant = "ecom" | "affiliate" | "funnel";

/** How a cell should be rendered. Keys map 1:1 onto `DomainRow` fields. */
export type DomainCellFormat =
  | "domain"
  | "text"
  | "int"
  | "usd"
  | "days-ago"
  | "days"
  | "rotation"
  | "list"
  | "tracker"
  | "bool";

export interface DomainColumn {
  /** Matches the field name on the narrowed `DomainRow` exactly. */
  key: string;
  label: string;
  format: DomainCellFormat;
  align: "left" | "right";
  /** True when the figure is third-party MODELLED, not observed. Label it. */
  estimated?: boolean;
  /** Short help text for a header tooltip. */
  hint?: string;
  /**
   * Which upstream fills this column. Present only where the answer is a
   * NAMED third party — i.e. the two StoreLeads columns. Everything else
   * comes from our own scan of the Meta Ad Library and needs no attribution
   * beyond the block's existing provenance chip.
   *
   * Cross-reference it with `useDashboardStatus().naReasonBySource[source]`:
   * `undefined` means the column is fine, a string is the sentence to print in
   * every cell of it.
   */
  source?: DataSourceKey;
}

const COL_DOMAIN: DomainColumn = { key: "domain", label: "Domain", format: "domain", align: "left" };
const COL_INDUSTRY: DomainColumn = { key: "industry", label: "Industry", format: "text", align: "left" };
const COL_LIVE_ADS: DomainColumn = { key: "liveAds", label: "Live ads", format: "int", align: "right", hint: "Ads observed running right now." };
const COL_LAST_NEW: DomainColumn = { key: "lastNewCreativeDaysAgo", label: "Last new creative", format: "days-ago", align: "right" };
const COL_FIRST_SEEN: DomainColumn = { key: "firstSeenDaysAgo", label: "First seen", format: "days-ago", align: "right" };
const COL_TRACKED: DomainColumn = { key: "tracked", label: "Tracked", format: "bool", align: "left" };

const COL_TRACKER: DomainColumn = {
  key: "tracker",
  label: "Tracker",
  format: "tracker",
  align: "left",
  hint: 'Click tracker fingerprinted on the landing page. "not detected" means we could not fingerprint one — not that there is none.',
};

/**
 * Column sets per variant, in render order.
 *
 * The columns genuinely SWAP — they are not greyed out. Affiliate and funnel
 * rows have no `estSalesPerMonth` / `estVisits` keys at all, because StoreLeads
 * models storefronts and nothing else. Rendering an empty sales cell for an
 * affiliate domain would read as "zero sales", which is a lie.
 */
export const DOMAIN_COLUMNS: Readonly<Record<DomainVariant, readonly DomainColumn[]>> = {
  ecom: [
    COL_DOMAIN,
    COL_INDUSTRY,
    COL_LIVE_ADS,
    { key: "estSalesPerMonth", label: "Est. monthly sales", format: "usd", align: "right", estimated: true, source: "storeleads", hint: "StoreLeads modelled, not measured." },
    { key: "estVisits", label: "Est. monthly visits", format: "int", align: "right", estimated: true, source: "storeleads", hint: "StoreLeads modelled sessions, not measured." },
    { key: "productCount", label: "Products", format: "int", align: "right" },
    { key: "platform", label: "Platform", format: "text", align: "left" },
    COL_LAST_NEW,
    COL_FIRST_SEEN,
    COL_TRACKED,
  ],
  affiliate: [
    COL_DOMAIN,
    COL_INDUSTRY,
    COL_LIVE_ADS,
    COL_TRACKER,
    { key: "offers", label: "Offers", format: "int", align: "right", hint: "Distinct offers seen running behind this domain." },
    { key: "avgCreativeLifeDays", label: "Avg creative life", format: "days", align: "right" },
    { key: "rotation7d", label: "Rotation (7d)", format: "rotation", align: "right", hint: "Creative added and paused in the last 7 days." },
    COL_LAST_NEW,
    COL_FIRST_SEEN,
    COL_TRACKED,
  ],
  funnel: [
    COL_DOMAIN,
    COL_INDUSTRY,
    COL_LIVE_ADS,
    COL_TRACKER,
    { key: "landers", label: "Landers", format: "int", align: "right", hint: "Distinct landing pages behind the ads." },
    { key: "topAngle", label: "Top angle", format: "text", align: "left" },
    { key: "markets", label: "Markets", format: "list", align: "left" },
    COL_LAST_NEW,
    COL_FIRST_SEEN,
    COL_TRACKED,
  ],
};

/** Which variant a business model belongs to. */
export function domainVariantFor(type: DomainType): DomainVariant {
  if (type === "ecom") return "ecom";
  if (type === "affiliate") return "affiliate";
  return "funnel";
}

/** Narrowing helpers, so blocks reach type-specific fields safely. */
export function isEcomRow(row: DomainRow): row is EcomDomainRow {
  return row.type === "ecom";
}
export function isAffiliateRow(row: DomainRow): row is AffiliateDomainRow {
  return row.type === "affiliate";
}
export function isFunnelRow(row: DomainRow): row is FunnelDomainRow {
  return row.type !== "ecom" && row.type !== "affiliate";
}

/**
 * Why one CELL has no value, or `null` when it does.
 *
 * CALL THIS BEFORE FORMATTING ANY DOMAIN CELL. In the `error` state an ecom
 * row's `estSalesPerMonth` and `estVisits` are `null`, and a generic
 * `format: "usd"` renderer would happily print `$0` — which reads as "this
 * store sells nothing" when the truth is "StoreLeads never answered". A
 * non-null return is the sentence to render in place of the number:
 *
 *   const na = domainCellNaReason(row, col.key);
 *   return na
 *     ? <span className="text-xs italic text-muted-foreground">{na}</span>
 *     : formatCell(row[col.key], col.format);
 *
 * Returns null in every state but `error`, so the healthy path is unchanged.
 */
export function domainCellNaReason(row: DomainRow, columnKey: string): string | null {
  return row.unavailable?.[columnKey] ?? null;
}

/** True when any cell in this row is missing because a source failed. */
export function domainRowHasUnavailable(row: DomainRow): boolean {
  return Boolean(row.unavailable && Object.keys(row.unavailable).length > 0);
}

export const DOMAIN_VARIANT_LABELS: Readonly<Record<DomainVariant, string>> = {
  ecom: "Ecom stores",
  affiliate: "Affiliate & media buying",
  funnel: "Lead-gen, PPC & telehealth",
};

export const DOMAIN_VARIANT_ORDER: readonly DomainVariant[] = ["ecom", "affiliate", "funnel"];

export const DOMAIN_TYPE_LABELS: Readonly<Record<DomainType, string>> = {
  ecom: "Ecom",
  affiliate: "Affiliate",
  leadgen: "Lead-gen",
  ppc: "PPC",
  telehealth: "Telehealth",
};

export interface DomainGroup {
  variant: DomainVariant;
  /** "Ecom stores" */
  label: string;
  /** Which `DomainType` values land in this variant. */
  types: DomainType[];
  /** The column set for this variant, in render order. */
  columns: readonly DomainColumn[];
  /** Rows of this variant, live-ad count descending. Narrow via `isEcomRow` etc. */
  rows: DomainRow[];
  count: number;
}

export interface DomainFilterChip {
  variant: DomainVariant;
  label: string;
  /** Rows of this variant among the returned rows. */
  count: number;
}

export interface DomainRowsView {
  /** Every row, fixture order (grouped by type, live ads descending within). */
  rows: DomainRow[];
  /** All three variants, always present. May be empty. */
  groups: DomainGroup[];
  /** Same, empty variants dropped. */
  nonEmptyGroups: DomainGroup[];
  /** Column set per variant — the columns SWAP, they do not grey out. */
  columnsByVariant: Readonly<Record<DomainVariant, readonly DomainColumn[]>>;
  /** Filter chips for the variant switcher. */
  filters: DomainFilterChip[];
  /** The whole indexed domain universe, from the fixture. Not the row count. */
  typeCounts: DomainTypeCounts;
  /** Counts across the rows actually returned. */
  visibleTypeCounts: Record<DomainType, number>;
  visibleVariantCounts: Record<DomainVariant, number>;
  trackedCount: number;
  rowCount: number;
  isEmpty: boolean;
  /** "812 ecom · 174 affiliate · 52 lead-gen · 18 PPC · 7 telehealth". */
  universeNote: string;
  /** "Showing 14 of 1,063 indexed domains…". Empty string when there are none. */
  sampleNote: string;
  /** Nothing resolved yet — render row skeletons, not the empty state. */
  isLoading: boolean;
  /**
   * Column key → why every cell of that column is blank, for columns whose
   * source failed. `{}` in every state but `error`, where it is
   * `{ estSalesPerMonth: "StoreLeads did not respond to the last scan",
   *    estVisits: "…" }`.
   *
   * Use it for the HEADER treatment (mark the column as unavailable once,
   * at the top) and `domainCellNaReason(row, key)` for the cells.
   */
  unavailableColumns: Record<string, string>;
  /** `Object.keys(unavailableColumns)` — handy for a quick `includes` check. */
  unavailableColumnKeys: string[];
  /** True when at least one column lost its source. */
  hasUnavailableColumns: boolean;
  /**
   * One-line disclosure for the table footer, naming the source and the
   * columns it took down. Null when every column is filled.
   */
  degradedNote: string | null;
}

/**
 * The domain table, grouped by business model with the right column set
 * attached to each group as DATA.
 *
 * `DomainRow` is a discriminated union on `type`, and the union is load-bearing
 * here: affiliate and funnel rows do not carry `estSalesPerMonth` / `estVisits`
 * at all. Use `isEcomRow` / `isAffiliateRow` / `isFunnelRow` to narrow before
 * reading a type-specific field.
 */
export function useDomainRows(): DomainRowsView {
  const state = useDashboardState();
  return useMemo<DomainRowsView>(() => {
    const { domains, domainTypeCounts, meta } = getDashboardFixture(state);
    const rows = domains;

    // Column-level unavailability is a rollup of the cell-level `unavailable`
    // maps the fixture puts on each row — derived, never declared twice, so
    // the header and the cells cannot disagree about which column is down.
    const unavailableColumns: Record<string, string> = {};
    for (const row of rows) {
      if (!row.unavailable) continue;
      for (const [key, reason] of Object.entries(row.unavailable)) {
        unavailableColumns[key] = reason;
      }
    }
    const unavailableColumnKeys = Object.keys(unavailableColumns);

    const visibleTypeCounts: Record<DomainType, number> = {
      ecom: 0,
      affiliate: 0,
      leadgen: 0,
      ppc: 0,
      telehealth: 0,
    };
    const visibleVariantCounts: Record<DomainVariant, number> = {
      ecom: 0,
      affiliate: 0,
      funnel: 0,
    };
    for (const row of rows) {
      visibleTypeCounts[row.type] += 1;
      visibleVariantCounts[domainVariantFor(row.type)] += 1;
    }

    const groups: DomainGroup[] = DOMAIN_VARIANT_ORDER.map((variant) => {
      const groupRows = rows
        .filter((r) => domainVariantFor(r.type) === variant)
        .sort((a, b) => b.liveAds - a.liveAds);
      const types = Array.from(new Set(groupRows.map((r) => r.type)));
      return {
        variant,
        label: DOMAIN_VARIANT_LABELS[variant],
        types,
        columns: DOMAIN_COLUMNS[variant],
        rows: groupRows,
        count: groupRows.length,
      };
    });

    const universeParts = (Object.keys(DOMAIN_TYPE_LABELS) as DomainType[])
      .filter((t) => domainTypeCounts[t] > 0)
      .map((t) => `${formatInt(domainTypeCounts[t])} ${DOMAIN_TYPE_LABELS[t].toLowerCase()}`);

    return {
      rows,
      groups,
      nonEmptyGroups: groups.filter((g) => g.count > 0),
      columnsByVariant: DOMAIN_COLUMNS,
      filters: groups.map<DomainFilterChip>((g) => ({
        variant: g.variant,
        label: g.label,
        count: g.count,
      })),
      typeCounts: domainTypeCounts,
      visibleTypeCounts,
      visibleVariantCounts,
      trackedCount: rows.filter((r) => r.tracked).length,
      rowCount: rows.length,
      isEmpty: rows.length === 0,
      universeNote: universeParts.join(" · "),
      sampleNote: rows.length
        ? `Showing ${rows.length} of ${formatInt(domainTypeCounts.total)} indexed domains, ordered by live ads within each business model.`
        : "",
      isLoading: meta.isLoading,
      unavailableColumns,
      unavailableColumnKeys,
      hasUnavailableColumns: unavailableColumnKeys.length > 0,
      degradedNote: unavailableColumnKeys.length
        ? `${unavailableColumnKeys
            .map(
              (key) =>
                DOMAIN_COLUMNS.ecom.find((c) => c.key === key)?.label ?? key,
            )
            .join(" and ")} ${plural(
            unavailableColumnKeys.length,
            "is",
            "are",
          )} blank on every row: ${unavailableColumns[unavailableColumnKeys[0]]}. Everything else in this table is observed and unaffected.`
        : null,
    };
  }, [state]);
}

// ═════════════════════════════════════════════════════════════════════════
// §10b  Domains AND pages — one block, two entities
// ═════════════════════════════════════════════════════════════════════════

/** Which entity the block is currently ranking. */
export type AdvertiserEntity = "domain" | "page";

/** FabAds' own words for the two entities. Use these on the toggle. */
export const ADVERTISER_ENTITY_LABELS: Readonly<Record<AdvertiserEntity, string>> = {
  domain: "Domains",
  page: "Pages",
};

export const ADVERTISER_ENTITY_ORDER: readonly AdvertiserEntity[] = ["domain", "page"];

/** How many rows the "top" list shows. */
export const TOP_ADVERTISER_COUNT = 5;

/**
 * One row of the Domains-or-Pages list. ONE shape for both entities, so the
 * component renders a single row type and only the toggle changes.
 *
 * A page is the Meta identity that runs the ads; a domain is where those ads
 * point. One advertiser can run two pages against one domain — which is why
 * the two rankings differ. The pages of a domain sum to that domain's
 * `liveAds` exactly, so neither view can contradict the other.
 */
export interface TopAdvertiserRow {
  /** Stable React key. Unique across both lists. */
  key: string;
  entity: AdvertiserEntity;
  /** What to print: the page name, or the domain. */
  label: string;
  /** Always the domain behind the ads — a page row carries it too. */
  domain: string;
  /** Page avatar. `null` on a domain row: we have no logo for a domain. */
  avatarUrl: string | null;
  /** Industry / category. Same vocabulary as the rest of the page. */
  industry: string;
  /** Ads running right now. */
  liveAds: number;
  /**
   * Ads LAUNCHED in the last 30 days. THIS IS NOT `liveAds` — label the column
   * `NEW_ADS_30D_COLUMN_LABEL` ("New ads (30d)") and never "live ads".
   *
   * This is where the deleted "Market movers" block went: the 30-day change now
   * rides on the row it was always describing. Where a domain also appears in
   * `useMovers()` / `useTopCompetitors()`, the counts are identical — one
   * derivation feeds all three.
   */
  newAds30d: number;
  /** The 30 days before that, so the change is checkable against its inputs. */
  newAdsPrev30d: number;
  /** Change on the prior 30 days, whole percent. Negative when they slowed. */
  newAds30dDeltaPct: number;
  /** Already followed / tracked. The follow action toggles this. */
  followed: boolean;
  /** Days since new creative. */
  lastNewCreativeDaysAgo: number;
  /**
   * `/insights/discover?domain=…`. Domain-scoped for BOTH entities: Discover
   * filters by domain, and a page-scoped filter does not exist — so a page row
   * links to its domain's ads rather than to a URL that would 404.
   */
  discoverHref: string;
  provenance: ProvenanceTier;
}

export interface AdvertiserIndustryFilter {
  /** `null` is the "All industries" option. */
  industry: string | null;
  label: string;
  domainCount: number;
  pageCount: number;
}

export interface PagesAndDomainsView {
  /** Every domain row, live ads descending. */
  domains: TopAdvertiserRow[];
  /** Every page row, live ads descending. */
  pages: TopAdvertiserRow[];
  byEntity: Record<AdvertiserEntity, TopAdvertiserRow[]>;
  /** Top 5 domains, no filter. */
  topDomains: TopAdvertiserRow[];
  /** Top 5 pages, no filter. */
  topPages: TopAdvertiserRow[];
  /**
   * Top N of one entity within one industry. `industry: null` = all.
   * Stable for the life of the state, so it is safe in a render.
   */
  topFor: (
    entity: AdvertiserEntity,
    industry?: string | null,
    limit?: number,
  ) => TopAdvertiserRow[];
  /** Filter options, "All industries" first, then industries by domain count. */
  industryFilters: AdvertiserIndustryFilter[];
  /** Just the industry names, in the same order as `industryFilters`. */
  industries: string[];
  entityLabels: Readonly<Record<AdvertiserEntity, string>>;
  followedDomainCount: number;
  followedPageCount: number;
  domainCount: number;
  pageCount: number;
  /** Plain-words basis for the block footer. */
  basisNote: string;
  /** Column heading for the 30-day launch count: "New ads (30d)". */
  newAdsColumnLabel: string;
  /** Sub-heading / delta caption for that column: "vs prior 30 days". */
  newAdsDeltaLabel: string;
  /** One line saying what that column is, and what it is not. */
  newAdsNote: string;
  /** Biggest `newAds30d` in the domain list — bar scaling. 0 when empty. */
  maxNewAds30d: number;
  /** Biggest absolute `newAds30dDeltaPct` across both lists. 0 when empty. */
  maxAbsNewAdsDeltaPct: number;
  isEmpty: boolean;
  /** Nothing resolved yet — render row skeletons, not the empty state. */
  isLoading: boolean;
}

/**
 * The exact heading for the folded-in movers column. "New ads (30d)" — ads
 * LAUNCHED in the window. It is a different question from `liveAds` (ads
 * running now) and must never be labelled as one.
 */
export const NEW_ADS_30D_COLUMN_LABEL = "New ads (30d)";

/** The comparison the delta is against. Print it beside the delta. */
export const NEW_ADS_30D_DELTA_LABEL = "vs prior 30 days";

/** What the column is, and what it is not, in one line. */
export const NEW_ADS_30D_NOTE =
  "New ads (30d) is what they launched in the last 30 days, against the 30 days before. Live ads is what is running right now — the two move independently.";

const ADVERTISER_BASIS_NOTE =
  "Ranked by ads running right now. A page is the account that runs the ads; a domain is where they point — one advertiser can run more than one page.";

/**
 * The Domains ↔ Pages block: top 5 of either entity, filterable by industry,
 * with a follow target on every row — and the 30-day launch change on every row
 * as well, which is where the deleted "Market movers" block went.
 *
 * TWO NUMBERS PER ROW, AND THEY ANSWER DIFFERENT QUESTIONS:
 *   `liveAds`    ads RUNNING right now
 *   `newAds30d`  ads LAUNCHED in the last 30 days, with
 *                `newAds30dDeltaPct` against the 30 days before
 * Label the second one `newAdsColumnLabel` ("New ads (30d)") with
 * `newAdsDeltaLabel` ("vs prior 30 days") on the delta. Never call it live ads.
 * `newAdsNote` is the one-line disclosure for the block footer.
 *
 * The follow action matters because the top advertisers are NOT necessarily the
 * ones you already follow — `followed` is false on plenty of these rows, and
 * the block is the natural place to fix that. Writes stay local (`useState` +
 * a toast); nothing here persists.
 */
export function usePagesAndDomains(): PagesAndDomainsView {
  const state = useDashboardState();
  return useMemo<PagesAndDomainsView>(() => {
    const { domains, pages, meta } = getDashboardFixture(state);

    const domainRows: TopAdvertiserRow[] = domains
      .map<TopAdvertiserRow>((row) => ({
        key: `domain-${row.domain}`,
        entity: "domain",
        label: row.domain,
        domain: row.domain,
        avatarUrl: null,
        industry: row.industry,
        liveAds: row.liveAds,
        newAds30d: row.newAds30d,
        newAdsPrev30d: row.newAdsPrev30d,
        newAds30dDeltaPct: row.newAds30dDeltaPct,
        followed: row.tracked,
        lastNewCreativeDaysAgo: row.lastNewCreativeDaysAgo,
        discoverHref: `/insights/discover?domain=${encodeURIComponent(row.domain)}`,
        provenance: row.provenance,
      }))
      .sort((a, b) => b.liveAds - a.liveAds || a.label.localeCompare(b.label));

    const pageRows: TopAdvertiserRow[] = pages
      .map<TopAdvertiserRow>((page) => ({
        key: page.pageId,
        entity: "page",
        label: page.pageName,
        domain: page.domain,
        avatarUrl: page.avatarUrl,
        industry: page.industry,
        liveAds: page.liveAds,
        newAds30d: page.newAds30d,
        newAdsPrev30d: page.newAdsPrev30d,
        newAds30dDeltaPct: page.newAds30dDeltaPct,
        followed: page.followed,
        lastNewCreativeDaysAgo: page.lastNewCreativeDaysAgo,
        discoverHref: `/insights/discover?domain=${encodeURIComponent(page.domain)}`,
        provenance: page.provenance,
      }))
      .sort((a, b) => b.liveAds - a.liveAds || a.label.localeCompare(b.label));

    const byEntity: Record<AdvertiserEntity, TopAdvertiserRow[]> = {
      domain: domainRows,
      page: pageRows,
    };

    const topFor = (
      entity: AdvertiserEntity,
      industry: string | null = null,
      limit: number = TOP_ADVERTISER_COUNT,
    ): TopAdvertiserRow[] => {
      const pool = byEntity[entity];
      const scoped = industry ? pool.filter((r) => r.industry === industry) : pool;
      return scoped.slice(0, limit);
    };

    // Industry options ordered by how much there is to look at, so the most
    // useful filter is nearest the "All" chip.
    const industryNames = Array.from(
      new Set([...domainRows, ...pageRows].map((r) => r.industry)),
    ).sort((a, b) => {
      const an = domainRows.filter((r) => r.industry === a).length;
      const bn = domainRows.filter((r) => r.industry === b).length;
      return bn - an || a.localeCompare(b);
    });

    const industryFilters: AdvertiserIndustryFilter[] = [
      {
        industry: null,
        label: "All industries",
        domainCount: domainRows.length,
        pageCount: pageRows.length,
      },
      ...industryNames.map<AdvertiserIndustryFilter>((industry) => ({
        industry,
        label: industry,
        domainCount: domainRows.filter((r) => r.industry === industry).length,
        pageCount: pageRows.filter((r) => r.industry === industry).length,
      })),
    ];

    return {
      domains: domainRows,
      pages: pageRows,
      byEntity,
      topDomains: topFor("domain"),
      topPages: topFor("page"),
      topFor,
      industryFilters,
      industries: industryNames,
      entityLabels: ADVERTISER_ENTITY_LABELS,
      followedDomainCount: domainRows.filter((r) => r.followed).length,
      followedPageCount: pageRows.filter((r) => r.followed).length,
      domainCount: domainRows.length,
      pageCount: pageRows.length,
      basisNote: ADVERTISER_BASIS_NOTE,
      newAdsColumnLabel: NEW_ADS_30D_COLUMN_LABEL,
      newAdsDeltaLabel: NEW_ADS_30D_DELTA_LABEL,
      newAdsNote: NEW_ADS_30D_NOTE,
      maxNewAds30d: maxOf(domainRows.map((r) => r.newAds30d)),
      maxAbsNewAdsDeltaPct: maxOf(
        [...domainRows, ...pageRows].map((r) => Math.abs(r.newAds30dDeltaPct)),
      ),
      isEmpty: domainRows.length === 0 && pageRows.length === 0,
      isLoading: meta.isLoading,
    };
  }, [state]);
}

// ═════════════════════════════════════════════════════════════════════════
// §10c  Top industries, and which brands hold what share of them
// ═════════════════════════════════════════════════════════════════════════

export interface IndustryBrandShareView {
  /** Industries by live-ad volume, biggest first. `[]` in thin / zero. */
  industries: IndustryShareRow[];
  industryCount: number;
  /** The biggest industry, or null. */
  top: IndustryShareRow | null;
  /**
   * The metric name to put on the block, in plain words. "Live ads" — not
   * "share of voice", not "impression share".
   */
  metricLabel: string;
  /** One-line basis. Says out loud that we see ads, not spend. */
  basisNote: string;
  isEmpty: boolean;
  /** Nothing resolved yet — render bar skeletons, not the empty state. */
  isLoading: boolean;
}

const INDUSTRY_SHARE_METRIC_LABEL = "Live ads";
const INDUSTRY_SHARE_BASIS_NOTE =
  "Share of the ads running in each industry right now. We can see ads, not spend.";

/**
 * Top industries / categories, and inside each, which brands hold what share.
 *
 * This is the plain-language reframe of `useShareOfVoice()`. That hook asks
 * "what is MY share" and names it in invented vocabulary; this one asks the
 * question Maalik actually wants answered — which industry is biggest, and who
 * holds it — and names everything in words that already exist in FabAds.
 * `useShareOfVoice()` is untouched and still works.
 *
 * Both read the same underlying counts (`MY_BRAND_INDUSTRY_AD_COUNTS` for your
 * side, the same per-domain derivation for the leaders), so they agree
 * number-for-number on every brand they both mention.
 *
 * Each row ends with an `Others` bucket (`isOthers`), so the shares add up to
 * the industry's whole and no reader has to wonder what the remainder is. That
 * bucket has no `discoverHref` — there is no single destination for "everyone
 * else".
 */
export function useIndustryBrandShare(): IndustryBrandShareView {
  const state = useDashboardState();
  return useMemo<IndustryBrandShareView>(() => {
    const { industryShare, meta } = getDashboardFixture(state);

    return {
      industries: industryShare,
      industryCount: industryShare.length,
      top: industryShare.length ? industryShare[0] : null,
      metricLabel: INDUSTRY_SHARE_METRIC_LABEL,
      basisNote: INDUSTRY_SHARE_BASIS_NOTE,
      isEmpty: industryShare.length === 0,
      isLoading: meta.isLoading,
    };
  }, [state]);
}

// ═════════════════════════════════════════════════════════════════════════
// §10d  Nav overview — the module's surfaces, with a count each
// ═════════════════════════════════════════════════════════════════════════

export interface NavOverviewView {
  /** All six surfaces, always, in nav order. */
  surfaces: NavSurfaceCount[];
  byKey: Record<NavSurfaceKey, NavSurfaceCount>;
  /** Surfaces with a real count (a real 0 counts — it is a fact). */
  counted: NavSurfaceCount[];
  /** Surfaces whose count we cannot state; each carries an `naReason`. */
  uncounted: NavSurfaceCount[];
  countedCount: number;
  uncountedCount: number;
  /** True when not one surface has a number — the loading case. */
  allUncounted: boolean;
  isEmpty: boolean;
  /** Nothing resolved yet — render skeletons, not "0" everywhere. */
  isLoading: boolean;
}

/**
 * The module's own surfaces — My Feeds · Discover · Saved Ads · Competitor ·
 * Domain · Trends — each with a description and a live count.
 *
 * Every count is a figure another block on this page already shows, so this
 * block is a table of contents, not a second set of numbers. Where a count is
 * not honestly knowable it is `null` with a reason (`naReason`, printed as
 * `countLabel`) rather than a zero — "we haven't scanned yet" and "there are
 * none" are different facts and must not look the same.
 */
export function useNavOverview(): NavOverviewView {
  const state = useDashboardState();
  return useMemo<NavOverviewView>(() => {
    const { navSurfaces, meta } = getDashboardFixture(state);

    const byKey = {} as Record<NavSurfaceKey, NavSurfaceCount>;
    for (const s of navSurfaces) byKey[s.key] = s;

    const counted = navSurfaces.filter((s) => s.count !== null);
    const uncounted = navSurfaces.filter((s) => s.count === null);

    return {
      surfaces: navSurfaces,
      byKey,
      counted,
      uncounted,
      countedCount: counted.length,
      uncountedCount: uncounted.length,
      allUncounted: navSurfaces.length > 0 && counted.length === 0,
      isEmpty: navSurfaces.length === 0,
      isLoading: meta.isLoading,
    };
  }, [state]);
}

// ═════════════════════════════════════════════════════════════════════════
// §11  Movers
//
// NOT A STANDALONE BLOCK any more. The 30-day change data these rows carry now
// rides on the rows it describes: every domain and page from
// `usePagesAndDomains()` carries `newAds30d` / `newAdsPrev30d` /
// `newAds30dDeltaPct`, derived by the SAME function these movers are, so the
// two can never disagree. This hook stays exported for anything that already
// reads it.
//
// The distinction that matters wherever these numbers land: `adCount30d` /
// `newAds30d` is ads LAUNCHED in the window; `liveAds` is ads RUNNING NOW.
// Different questions. Never label a 30-day count "live ads".
// ═════════════════════════════════════════════════════════════════════════

export interface MoversView {
  /** All movers, `deltaPct` descending. */
  all: Mover[];
  /** `deltaPct > 0`, steepest first. */
  climbers: Mover[];
  /** `deltaPct < 0`, steepest fall first. */
  fallers: Mover[];
  /** `deltaPct === 0`. */
  flat: Mover[];
  top: Mover | null;
  bottom: Mover | null;
  trackedCount: number;
  untrackedCount: number;
  /** Largest absolute delta — bar scaling. 0 when empty. */
  maxAbsDeltaPct: number;
  /** Largest 30-day ad count — bar scaling. 0 when empty. */
  maxAdCount: number;
  rowCount: number;
  isEmpty: boolean;
  /** "5 domains up · 3 down". Empty string when there is nothing. */
  summaryLine: string;
  /** Fixed window disclosure. */
  windowLabel: string;
  /** Nothing resolved yet — render row skeletons, not the empty state. */
  isLoading: boolean;
}

const MOVERS_WINDOW_LABEL = "Last 30 days against the 30 before";

/** Domains whose live-creative volume moved sharply, up and down. */
export function useMovers(): MoversView {
  const state = useDashboardState();
  return useMemo<MoversView>(() => {
    const { movers, meta } = getDashboardFixture(state);
    const all = [...movers].sort((a, b) => b.deltaPct - a.deltaPct);

    const climbers = all.filter((m) => m.deltaPct > 0);
    const fallers = all.filter((m) => m.deltaPct < 0).sort((a, b) => a.deltaPct - b.deltaPct);
    const flat = all.filter((m) => m.deltaPct === 0);
    const tracked = all.filter((m) => m.tracked).length;

    return {
      all,
      climbers,
      fallers,
      flat,
      top: all.length ? all[0] : null,
      bottom: all.length ? all[all.length - 1] : null,
      trackedCount: tracked,
      untrackedCount: all.length - tracked,
      maxAbsDeltaPct: maxOf(all.map((m) => Math.abs(m.deltaPct))),
      maxAdCount: maxOf(all.map((m) => m.adCount30d)),
      rowCount: all.length,
      isEmpty: all.length === 0,
      summaryLine: all.length
        ? `${climbers.length} ${plural(climbers.length, "domain", "domains")} up · ${fallers.length} down`
        : "",
      windowLabel: MOVERS_WINDOW_LABEL,
      isLoading: meta.isLoading,
    };
  }, [state]);
}

// ═════════════════════════════════════════════════════════════════════════
// §12  Watchlist health
// ═════════════════════════════════════════════════════════════════════════

export const WATCH_STATUS_LABELS: Readonly<Record<WatchStatus, string>> = {
  active: "Active",
  ramping: "Ramping",
  quiet: "Quiet",
};

/** Quiet first — it is the band that implies an action. */
export const WATCH_STATUS_ORDER: readonly WatchStatus[] = ["quiet", "ramping", "active"];

export interface WatchStatusGroup {
  status: WatchStatus;
  label: string;
  items: WatchItem[];
  count: number;
  /** One-line framing of what the band means. */
  note: string;
}

const WATCH_STATUS_NOTES: Readonly<Record<WatchStatus, string>> = {
  quiet: `No new creative in ${QUIET_THRESHOLD_DAYS}+ days — either they stopped, or the slot is wasted.`,
  ramping: "Shipping noticeably more creative than usual in the last week.",
  active: "Shipping at a steady rate.",
};

export interface WatchlistHealthView {
  health: WatchlistHealth;
  /** Fixture order — most new creative in the last 30 days first. */
  items: WatchItem[];
  /** Quiet advertisers, longest silence first. The actionable list. */
  actionable: WatchItem[];
  byStatus: Record<WatchStatus, WatchItem[]>;
  /** All three bands, quiet first. May be empty. */
  statusGroups: WatchStatusGroup[];
  counts: { active: number; ramping: number; quiet: number; total: number };
  /** Brands followed (`insight_follows`). Equals `items.length`. No cap exists. */
  followCount: number;
  /** Followed brands with no new creative in `inactiveThresholdDays`+ days. */
  inactiveCount: number;
  inactiveThresholdDays: number;
  /** "12 followed · 2 inactive" — the sub-note on the Brands-followed KPI. Null when none. */
  inactiveNote: string | null;
  /** Competitors followed (`insight_competitors`) — the tracked subset. */
  trackedCompetitors: WatchItem[];
  /** The "Competitors followed" KPI value. */
  trackedCompetitorCount: number;
  /** The "Total competitor ads" KPI value — Σ `trackedCompetitors[].liveAds`. */
  trackedCompetitorLiveAds: number;
  quietThresholdDays: number;
  /** "2 of 7 haven't shipped in 21+ days." Null when nothing is quiet. */
  quietNote: string | null;
  isEmpty: boolean;
  /** Nothing resolved yet — render row skeletons, not the empty state. */
  isLoading: boolean;
}

/**
 * Followed brands, banded by activity.
 *
 * NOT A STANDALONE BLOCK any more. Its one useful signal — followed brands that
 * stopped shipping — is now the `subNote` on the Brands-followed KPI tile
 * (`inactiveNote` here, `12 followed · 2 inactive`). Still exported because
 * other code may read it; expect nothing to render it.
 *
 * There is NO FOLLOW CAP. The deprecated cap-shaped fields (`followCap`,
 * `nearCap`, `capNote`, `capPct`) have been removed now that the only
 * consumer — the retired "Watchlist health" block — is gone.
 */
export function useWatchlistHealth(): WatchlistHealthView {
  const state = useDashboardState();
  return useMemo<WatchlistHealthView>(() => {
    const { watchlist, meta } = getDashboardFixture(state);
    const items = watchlist.items;

    const byStatus: Record<WatchStatus, WatchItem[]> = {
      active: [],
      ramping: [],
      quiet: [],
    };
    for (const item of items) byStatus[item.status].push(item);

    const actionable = [...byStatus.quiet].sort(
      (a, b) => b.lastNewCreativeDaysAgo - a.lastNewCreativeDaysAgo,
    );

    return {
      health: watchlist,
      items,
      actionable,
      byStatus,
      statusGroups: WATCH_STATUS_ORDER.map<WatchStatusGroup>((status) => ({
        status,
        label: WATCH_STATUS_LABELS[status],
        items: byStatus[status],
        count: byStatus[status].length,
        note: WATCH_STATUS_NOTES[status],
      })),
      counts: {
        active: watchlist.activeCount,
        ramping: watchlist.rampingCount,
        quiet: watchlist.quietCount,
        total: items.length,
      },
      followCount: watchlist.followCount,
      inactiveCount: watchlist.inactiveCount,
      inactiveThresholdDays: watchlist.inactiveThresholdDays,
      inactiveNote: watchlist.inactiveCount
        ? `${formatInt(watchlist.followCount)} followed · ${formatInt(watchlist.inactiveCount)} inactive`
        : null,
      trackedCompetitors: watchlist.trackedCompetitors,
      trackedCompetitorCount: watchlist.trackedCompetitorCount,
      trackedCompetitorLiveAds: watchlist.trackedCompetitorLiveAds,
      quietThresholdDays: QUIET_THRESHOLD_DAYS,
      quietNote: watchlist.quietCount
        ? `${watchlist.quietCount} of the ${items.length} brands here ${plural(watchlist.quietCount, "hasn't", "haven't")} shipped anything new in ${QUIET_THRESHOLD_DAYS}+ days.`
        : null,
      isEmpty: items.length === 0,
      isLoading: meta.isLoading,
    };
  }, [state]);
}

// ═════════════════════════════════════════════════════════════════════════
// §13  Board health
// ═════════════════════════════════════════════════════════════════════════

/** Days untouched before a board reads as dormant. */
export const BOARD_DORMANT_DAYS = 30;

export interface BoardHealthView {
  health: BoardHealth;
  /** Fixture order — most recently touched first. */
  boards: BoardHealthItem[];
  boardCount: number;
  /** Saved ads whose SOURCE ad has since gone inactive. */
  staleTotal: number;
  /** Saved but never turned into a brief. */
  neverBriefedTotal: number;
  /** What the two totals mean, in words. */
  note: string;
  /** Boards carrying stale items, most stale first. */
  needsAttention: BoardHealthItem[];
  /** Boards untouched for 30+ days, longest first. */
  dormant: BoardHealthItem[];
  dormantThresholdDays: number;
  /** "23 saved ads have gone inactive · 41 were never briefed". Null when clean. */
  summaryLine: string | null;
  isEmpty: boolean;
  /** Nothing resolved yet — render row skeletons, not the empty state. */
  isLoading: boolean;
}

/**
 * Saved-ads boards.
 *
 * DELIBERATELY EXPOSES NO VANITY TOTAL. There is no "412 ads saved!" field and
 * one must not be added — the only totals here are the two that imply an
 * action: creative that has rotted, and creative that was saved and never used.
 */
export function useBoardHealth(): BoardHealthView {
  const state = useDashboardState();
  return useMemo<BoardHealthView>(() => {
    const { boards, meta } = getDashboardFixture(state);
    const items = boards.boards;

    const hasIssues = boards.staleTotal > 0 || boards.neverBriefedTotal > 0;

    return {
      health: boards,
      boards: items,
      boardCount: items.length,
      staleTotal: boards.staleTotal,
      neverBriefedTotal: boards.neverBriefedTotal,
      note: boards.note,
      needsAttention: items
        .filter((b) => b.staleItemCount > 0)
        .sort((a, b) => b.staleItemCount - a.staleItemCount),
      dormant: items
        .filter((b) => b.lastTouchedDaysAgo >= BOARD_DORMANT_DAYS)
        .sort((a, b) => b.lastTouchedDaysAgo - a.lastTouchedDaysAgo),
      dormantThresholdDays: BOARD_DORMANT_DAYS,
      summaryLine:
        items.length && hasIssues
          ? `${formatInt(boards.staleTotal)} saved ${plural(boards.staleTotal, "ad has", "ads have")} gone inactive · ${formatInt(boards.neverBriefedTotal)} ${plural(boards.neverBriefedTotal, "was", "were")} never briefed`
          : null,
      isEmpty: items.length === 0,
      isLoading: meta.isLoading,
    };
  }, [state]);
}

// ═════════════════════════════════════════════════════════════════════════
// §14  Coverage
// ═════════════════════════════════════════════════════════════════════════

export const SCAN_STATE_LABELS: Readonly<Record<IndustryScanState, string>> = {
  indexed: "Indexed",
  scanning: "First scan running",
  "not-started": "Not scanned yet",
};

export interface CoverageView {
  coverage: CoverageInfo;
  followed: FollowedIndustry[];
  followedCount: number;
  seededIndustryCount: number;
  /** Sum of `followed[].indexedAds`. */
  indexedAdTotal: number;
  /** Sum of `followed[].advertisers`. */
  advertiserTotal: number;
  byScanState: Record<IndustryScanState, FollowedIndustry[]>;
  indexedCount: number;
  scanningCount: number;
  notStartedCount: number;
  /** Followed industries we have not finished indexing. */
  awaitingFirstScan: FollowedIndustry[];
  /**
   * Suggested neighbours, with REAL counts. Never empty in `populated`,
   * `thin`, `zero` or `error` — the counts are the whole reason a suggestion
   * is credible. It IS empty in `loading`, where we have no counts yet and a
   * suggestion without one would be invented. Gate on `isLoading`.
   */
  adjacent: AdjacentIndustry[];
  adjacentHeading: string;
  adjacentLiveAdTotal: number;
  /**
   * The page's most important sentence in thin/zero: 0 indexed ads is a gap on
   * OUR side, not proof the market is empty. Null when coverage is healthy.
   */
  gapNote: string | null;
  hasGap: boolean;
  /** Followed / catalogue as a percent, one decimal. */
  coveragePct: number;
  /** "6 of 105 industries followed". */
  coverageLabel: string;
  /** True when nothing is followed at all. */
  isEmpty: boolean;
  /** Nothing resolved yet — render skeletons, not "you follow nothing". */
  isLoading: boolean;
}

/** What we have scanned, what we haven't, and credible neighbours to add. */
export function useCoverage(): CoverageView {
  const state = useDashboardState();
  return useMemo<CoverageView>(() => {
    const { coverage, meta } = getDashboardFixture(state);

    const byScanState: Record<IndustryScanState, FollowedIndustry[]> = {
      indexed: [],
      scanning: [],
      "not-started": [],
    };
    for (const f of coverage.followed) byScanState[f.scanState].push(f);

    return {
      coverage,
      followed: coverage.followed,
      followedCount: coverage.followedCount,
      seededIndustryCount: coverage.seededIndustryCount,
      indexedAdTotal: coverage.indexedAdTotal,
      advertiserTotal: sum(coverage.followed.map((f) => f.advertisers)),
      byScanState,
      indexedCount: byScanState.indexed.length,
      scanningCount: byScanState.scanning.length,
      notStartedCount: byScanState["not-started"].length,
      awaitingFirstScan: coverage.followed.filter((f) => f.scanState !== "indexed"),
      adjacent: coverage.adjacent,
      adjacentHeading: coverage.adjacentHeading,
      adjacentLiveAdTotal: sum(coverage.adjacent.map((a) => a.liveAds)),
      gapNote: coverage.gapNote,
      hasGap: coverage.gapNote !== null,
      coveragePct: coverage.seededIndustryCount
        ? round((coverage.followedCount / coverage.seededIndustryCount) * 100, 1)
        : 0,
      coverageLabel: `${coverage.followedCount} of ${formatInt(coverage.seededIndustryCount)} ${plural(coverage.seededIndustryCount, "industry", "industries")} followed`,
      isEmpty: coverage.followed.length === 0,
      isLoading: meta.isLoading,
    };
  }, [state]);
}

// ═════════════════════════════════════════════════════════════════════════
// §15  Setup checklist
// ═════════════════════════════════════════════════════════════════════════

export interface SetupChecklistView {
  /** Exactly three, always, in every state. */
  items: SetupChecklistItem[];
  done: SetupChecklistItem[];
  remaining: SetupChecklistItem[];
  doneCount: number;
  remainingCount: number;
  totalCount: number;
  complete: boolean;
  /** Whole percent, 0–100. */
  progressPct: number;
  /** "2 of 3 done". */
  progressLabel: string;
  /** First incomplete step, in declared order. Null when complete. */
  nextStep: SetupChecklistItem | null;
  /**
   * Nothing resolved yet. The three items are still here (they always are)
   * but every `done` reads false because we haven't checked — so render a
   * skeleton rather than telling the user they've completed nothing.
   */
  isLoading: boolean;
}

/**
 * The three setup steps: follow your industries · track your first competitor
 * · install the Chrome extension.
 *
 * There is deliberately NO "turn on the weekly digest" item — that feature
 * does not exist and the page will not promise it. Do not add a fourth.
 */
export function useSetupChecklist(): SetupChecklistView {
  const state = useDashboardState();
  return useMemo<SetupChecklistView>(() => {
    const { checklist, meta } = getDashboardFixture(state);

    const done = checklist.filter((i) => i.done);
    const remaining = checklist.filter((i) => !i.done);

    return {
      items: checklist,
      done,
      remaining,
      doneCount: done.length,
      remainingCount: remaining.length,
      totalCount: checklist.length,
      complete: checklist.length > 0 && remaining.length === 0,
      progressPct: checklist.length
        ? Math.round((done.length / checklist.length) * 100)
        : 0,
      progressLabel: `${done.length} of ${checklist.length} done`,
      nextStep: remaining.length ? remaining[0] : null,
      isLoading: meta.isLoading,
    };
  }, [state]);
}
