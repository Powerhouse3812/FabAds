/**
 * AdsMarketView: the ONE Discover pattern, used by Discover and My Feeds
 * (spec decision 1: My Feeds = Discover as-is with a narrower source).
 *
 *   scope bar → collapsible overview (KPIs, AI summary, launch frequency,
 *   trending tags, rising + scaling, 11 top-10 groups) → selected chips +
 *   total + sort → masonry of AdCard → (ad drawer via the page's overlay host)
 *
 * All numbers come from the F1 selectors; nothing here re-implements scope,
 * tag-union or trend logic. Tag counts never depend on what is selected: the
 * groups are built from the scoped ads, the union is applied only to the list.
 */
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { MODULE_NOW } from "@/lib/insights-v3/data";
import {
  DISCOVER_GROUP_KEYS,
  adsInBaseScope,
  adsInScope,
  aiSummary,
  categoryOptions,
  discoverKpis,
  filterByTagUnion,
  groupKeysForScope,
  industryOptions,
  launchFrequency,
  scopeLabel,
  sortAds,
  tagGroups,
  trendingTags,
  type SelectorCtx,
} from "@/lib/insights-v3/selectors";
import { useLastVisitAt, useUserPrefs } from "@/lib/insights-v3/stores";
import { AD_SORT_LABEL, DEFAULT_SCOPE, PERIOD_OPTIONS, QP, type Ad, type AdSort, type PeriodKey, type Scope } from "@/lib/insights-v3/types";
import {
  EmptyResults,
  EmptyState,
  GridSkeleton,
  InsightsPageLayout,
  OverviewShell,
  ScopeBar,
  SelectedChips,
  SortControl,
  TopTenGroups,
  TrendBars,
  ViewMoreModal,
  useInsightsScope,
  useListSort,
  useSelectedTags,
} from "@/components/insights-v3/shared";
import { AdGrid } from "./AdGrid";
import { RisingScaling } from "./RisingScaling";
import { TrendingTags } from "./TrendingTags";

export const PAGE_SIZE = 24;
const AD_SORTS = Object.keys(AD_SORT_LABEL) as AdSort[];

export interface AdsMarketViewProps {
  title: string;
  /** Overview collapse persistence key, e.g. "discover" / "my-feeds". */
  pageKey: string;
  /** The page's source ads BEFORE scope: all ads (Discover) or the My Feeds sources. */
  sourceAds: Ad[];
  /** Which AI summary to write. */
  summaryKind: "scope" | "my-feeds";
  /** Discover only: the "My preferences only" switch (off by default). */
  showPrefsToggle?: boolean;
  /** Replaces the overview and list when the source itself is empty (or `?state=empty`). */
  emptyState?: ReactNode;
  /** The source is known empty regardless of `sourceAds` (My Feeds with nothing followed or marked). */
  sourceEmpty?: boolean;
  /** Under the page title, collapses with it on scroll (My Feeds identity row). */
  headerSlot?: ReactNode;
  /** Page-level actions at the right of the title row. Left free for the orchestrator (search). */
  headerActions?: ReactNode;
}

export function AdsMarketView({
  title,
  pageKey,
  sourceAds,
  summaryKind,
  showPrefsToggle = false,
  emptyState,
  sourceEmpty = false,
  headerSlot,
  headerActions,
}: AdsMarketViewProps) {
  const [searchParams] = useSearchParams();
  const stateParam = searchParams.get(QP.state);
  const loading = stateParam === "loading";
  const forcedEmpty = stateParam === "empty";

  const [urlScope, setScope] = useInsightsScope();
  const tags = useSelectedTags();
  const [sort, setSort] = useListSort<AdSort>(AD_SORTS, "newest");
  const lastVisitAt = useLastVisitAt();
  const prefs = useUserPrefs();

  // My Feeds has no prefs toggle: its source is already the preferences.
  const scope = useMemo<Scope>(
    () => (showPrefsToggle ? urlScope : { ...urlScope, myPrefsOnly: false }),
    [urlScope, showPrefsToggle],
  );
  const source = useMemo(() => (forcedEmpty ? [] : sourceAds), [forcedEmpty, sourceAds]);
  const ctx = useMemo<SelectorCtx>(() => ({ now: MODULE_NOW, lastVisitAt, prefs }), [lastVisitAt, prefs]);

  /* scope-derived data (none of it depends on the selected tags) */
  const base = useMemo(() => adsInBaseScope(source, scope, ctx), [source, scope, ctx]);
  const scoped = useMemo(() => adsInScope(source, scope, ctx), [source, scope, ctx]);
  const industries = useMemo(() => industryOptions(source, scope, ctx).slice(1), [source, scope, ctx]);
  const categoryRows = useMemo(() => categoryOptions(source, scope, ctx), [source, scope, ctx]);
  const periodCounts = useMemo(() => {
    const out: Partial<Record<PeriodKey, number>> = {};
    for (const p of PERIOD_OPTIONS) out[p.key] = adsInScope(source, { ...scope, period: p.key }, ctx).length;
    return out;
  }, [source, scope.industry, scope.category, scope.myPrefsOnly, ctx]); // eslint-disable-line react-hooks/exhaustive-deps
  const prefsCount = useMemo(
    () => (showPrefsToggle ? adsInScope(source, { ...scope, myPrefsOnly: true }, ctx).length : undefined),
    [showPrefsToggle, source, scope, ctx],
  );

  const kpis = useMemo(() => discoverKpis(source, scope, ctx), [source, scope, ctx]);
  const summary = useMemo(
    () =>
      scoped.length === 0
        ? null
        : summaryKind === "my-feeds"
          ? aiSummary({ kind: "my-feeds", ads: scoped })
          : aiSummary({ kind: "scope", ads: scoped, scopeLabel: scopeLabel(scope) }),
    [scoped, scope, summaryKind],
  );
  const series = useMemo(() => launchFrequency(source, scope, MODULE_NOW, { prefs }), [source, scope, prefs]);
  const trending = useMemo(() => trendingTags(base, scope.period, MODULE_NOW, { limit: 12 }), [base, scope.period]);
  const groups = useMemo(() => tagGroups(scoped, groupKeysForScope(DISCOVER_GROUP_KEYS, scope)), [scoped, scope]);

  /* list: union filter, then sort */
  const filtered = useMemo(() => filterByTagUnion(scoped, tags.selected), [scoped, tags.selected]);
  const sorted = useMemo(() => sortAds(filtered, sort), [filtered, sort]);

  /* paging: 24 at a time, reset whenever the result set changes */
  const resetKey = `${scope.industry}|${scope.category}|${scope.period}|${scope.myPrefsOnly}|${JSON.stringify(tags.selected)}|${sort}`;
  const [pager, setPager] = useState({ key: resetKey, n: PAGE_SIZE });
  const shown = pager.key === resetKey ? pager.n : PAGE_SIZE;
  const total = sorted.length;
  const loadMore = useCallback(() => {
    setPager((p) => ({ key: resetKey, n: (p.key === resetKey ? p.n : PAGE_SIZE) + PAGE_SIZE }));
  }, [resetKey]);
  // New identity per page so the observer re-checks the sentinel after each load.
  const onReachEnd = useCallback(() => {
    if (shown < total) loadMore();
  }, [shown, total, loadMore]);

  const noSource = !loading && (sourceEmpty || forcedEmpty) && !!emptyState;
  const noAdsInScope = !loading && !noSource && scoped.length === 0;
  const noMatches = !loading && !noSource && scoped.length > 0 && total === 0;

  const scopeBar = (compact: boolean) => (
    <>
      {headerSlot && !compact && <div className="pb-2">{headerSlot}</div>}
      <ScopeBar
        scope={scope}
        onChange={setScope}
        industries={industries}
        categories={categoryRows.slice(1)}
        totalCount={categoryRows[0]?.count ?? 0}
        periodCounts={periodCounts}
        compact={compact}
        myPrefsToggle={
          showPrefsToggle
            ? { checked: scope.myPrefsOnly, onChange: (checked) => setScope({ myPrefsOnly: checked }), count: prefsCount }
            : undefined
        }
      />
    </>
  );

  const overview =
    loading || noSource ? undefined : (
      <OverviewShell
        pageKey={pageKey}
        basedOn={scoped.length}
        kpis={kpis}
        summary={summary}
        summaryDisabledReason="No ads in this scope, so there is nothing to summarise."
        charts={
          <div className="space-y-3">
            <TrendBars
              series={series}
              title="Launch frequency"
              basedOn={base.length}
              emptyReason="No ads launched in this period, so there is nothing to chart."
            />
            <TrendingTags tags={trending} selected={tags.selected} onToggle={tags.toggle} basedOn={base.length} />
          </div>
        }
        expandedOnly={<RisingScaling baseAds={base} period={scope.period} now={MODULE_NOW} basedOn={base.length} />}
        groups={<TopTenGroups groups={groups} selected={tags.selected} onToggle={tags.toggle} />}
      />
    );

  const chips =
    loading || noSource || noAdsInScope ? undefined : (
      <SelectedChips
        selected={tags.selected}
        groups={groups}
        onRemove={tags.toggle}
        onClearAll={tags.clearAll}
        total={total}
        noun="ads"
        rightSlot={<SortControl value={sort} options={AD_SORT_LABEL} onChange={setSort} />}
      />
    );

  let list: ReactNode;
  if (loading) list = <GridSkeleton count={8} />;
  else if (noSource) list = emptyState;
  else if (noAdsInScope)
    list = (
      <EmptyState
        title="No ads in this scope"
        body={
          scope.myPrefsOnly
            ? "My preferences only is on and nothing you follow or marked has ads in this industry, category and period. Turn it off to see the whole market."
            : "Nothing matches this industry, category and period. Widen the scope to see more ads."
        }
        action={
          <button
            type="button"
            onClick={() => (scope.myPrefsOnly ? setScope({ myPrefsOnly: false }) : setScope(DEFAULT_SCOPE))}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {scope.myPrefsOnly ? "Show all ads" : "Reset scope"}
          </button>
        }
      />
    );
  else if (noMatches) list = <EmptyResults noun="ads" onClear={tags.clearAll} />;
  else list = <AdGrid ads={sorted.slice(0, shown)} scopedAds={scoped} total={total} onLoadMore={loadMore} />;

  return (
    <>
      <InsightsPageLayout
        title={title}
        count={loading || noSource ? undefined : total}
        countNoun="ads"
        headerActions={headerActions}
        scopeBar={scopeBar}
        overview={overview}
        chips={chips}
        list={list}
        onReachEnd={!loading && !noSource && shown < total ? onReachEnd : undefined}
      />
      <ViewMoreModal groups={groups} selected={tags.selected} onToggle={tags.toggle} onClearGroup={tags.clearGroup} />
    </>
  );
}
