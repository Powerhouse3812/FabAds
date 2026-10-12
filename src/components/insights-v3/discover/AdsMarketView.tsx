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
import { useCallback, useId, useMemo, useState, type ReactNode } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { X } from "lucide-react";
import { MODULE_NOW } from "@/lib/insights-v3/data";
import {
  DISCOVER_GROUP_KEYS,
  adsInBaseScope,
  adsInScope,
  aiSummary,
  applyFeedFilters,
  categoryOptions,
  discoverKpis,
  feedFilterOptions,
  filterByTagUnion,
  groupKeysForScope,
  industryOptions,
  launchFrequency,
  scopeLabel,
  FEED_FILTER_QP,
  hasFeedFilters,
  sortAds,
  tagGroups,
  trendingTags,
  type SelectorCtx,
} from "@/lib/insights-v3/selectors";
import { useLastVisitAt, useUserPrefs } from "@/lib/insights-v3/stores";
import {
  AD_SORT_LABEL,
  DEFAULT_SCOPE,
  ENGAGEMENT_SORT_FIELD,
  FEED_AD_SORT_LABEL,
  PERIOD_OPTIONS,
  QP,
  type Ad,
  type AdSort,
  type FeedAdSort,
  type PeriodKey,
  type Scope,
} from "@/lib/insights-v3/types";
import {
  TruncatedText,
  EmptyResults,
  EmptyState,
  GridSkeleton,
  OverviewSkeleton,
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
import { SEARCH_QUERY_PARAM } from "@/components/insights-v3/search/InsightsSearch";
import {
  EngagementSortNotice,
  FEED_FILTERS_KEY,
  FEED_OVERVIEW_KEY,
  FeedGrid,
  FeedHeaderActions,
  FeedOverview,
  FeedToolbar,
  QuickFilters,
  useFeedFilters,
  usePersistedFlag,
} from "@/components/insights-v3/feeds";
import { AdGrid } from "./AdGrid";
import { RisingScaling } from "./RisingScaling";
import { TrendingTags } from "./TrendingTags";
import { filterAdsByQuery } from "./textQuery";

export const PAGE_SIZE = 24;
const AD_SORTS = Object.keys(AD_SORT_LABEL) as AdSort[];
const FEED_SORTS = Object.keys(FEED_AD_SORT_LABEL) as FeedAdSort[];

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
  /**
   * "market" (default) = the Discover layout. "feed" = My Feeds: toolbar, collapsed Quick filters and Overview bars,
   * and the My Feeds card. Same data, same URL state, same union rule: only the presentation differs.
   */
  layout?: "market" | "feed";
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
  layout = "market",
}: AdsMarketViewProps) {
  const feed = layout === "feed";
  const [filtersOpen, setFiltersOpen] = usePersistedFlag(FEED_FILTERS_KEY, false);
  const [overviewOpen, setOverviewOpen] = usePersistedFlag(FEED_OVERVIEW_KEY, false);
  const filtersPanelId = useId();
  const overviewPanelId = useId();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const query = (searchParams.get(SEARCH_QUERY_PARAM) ?? "").trim();
  const stateParam = searchParams.get(QP.state);
  const loading = stateParam === "loading";
  const forcedEmpty = stateParam === "empty";

  const [urlScope, setScope] = useInsightsScope();
  const tags = useSelectedTags();
  // My Feeds adds the three engagement sorts (with a warning); Discover keeps exactly the five spec sorts.
  const [sort, setSort] = useListSort<FeedAdSort>(feed ? FEED_SORTS : AD_SORTS, "newest");
  const feedFilters = useFeedFilters();
  const lastVisitAt = useLastVisitAt();
  const prefs = useUserPrefs();

  // My Feeds has no prefs toggle: its source is already the preferences.
  const scope = useMemo<Scope>(
    () => (showPrefsToggle ? urlScope : { ...urlScope, myPrefsOnly: false }),
    [urlScope, showPrefsToggle],
  );
  // The text search narrows the SOURCE, before scope and tags, so KPIs, groups and totals all follow it.
  const searchSource = useMemo(() => (forcedEmpty ? [] : filterAdsByQuery(sourceAds, query)), [forcedEmpty, sourceAds, query]);
  // My Feeds' toolbar filters (Domain, Page, Status, Running days, Similar ads) narrow the source the same way.
  const filtersActive = feed && hasFeedFilters(feedFilters.filters);
  const source = useMemo(
    () => (feed ? applyFeedFilters(searchSource, feedFilters.filters) : searchSource),
    [feed, searchSource, feedFilters.filters],
  );
  const ctx = useMemo<SelectorCtx>(() => ({ now: MODULE_NOW, lastVisitAt, prefs }), [lastVisitAt, prefs]);

  // Filter options count the ads BEFORE the filters (after scope + search), so a pick never hides its siblings.
  const filterOptions = useMemo(
    () => (feed ? feedFilterOptions(adsInScope(searchSource, scope, ctx)) : null),
    [feed, searchSource, scope, ctx],
  );

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
  const resetKey = `${query}|${scope.industry}|${scope.category}|${scope.period}|${scope.myPrefsOnly}|${JSON.stringify(tags.selected)}|${JSON.stringify(feedFilters.filters)}|${sort}`;
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

  /** One write for both, so the two clears can't clobber each other. */
  const clearSearch = useCallback(
    (alsoTags: boolean) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete(SEARCH_QUERY_PARAM);
          if (alsoTags) {
            Array.from(next.keys()).filter((k) => k.startsWith(QP.tagPrefix)).forEach((k) => next.delete(k));
            Object.values(FEED_FILTER_QP).forEach((k) => next.delete(k));
          }
          return next;
        },
        { replace: true, state: location.state },
      ),
    [setSearchParams, location.state],
  );

  const noSource = !loading && (sourceEmpty || forcedEmpty) && !!emptyState;
  const noAdsInScope = !loading && !noSource && scoped.length === 0;
  const noMatches = !loading && !noSource && scoped.length > 0 && total === 0;
  // Engagement sorts rank only the ads that report the metric; the page says so (see EngagementSortNotice).
  const engagementField = sort in ENGAGEMENT_SORT_FIELD ? ENGAGEMENT_SORT_FIELD[sort as keyof typeof ENGAGEMENT_SORT_FIELD] : null;
  const reportedCount = useMemo(
    () => (engagementField ? sorted.filter((a) => a.engagement[engagementField] != null).length : 0),
    [sorted, engagementField],
  );

  const scopePillProps = {
    scope,
    onChange: setScope,
    industries,
    categories: categoryRows.slice(1),
    totalCount: categoryRows[0]?.count ?? 0,
    periodCounts,
  };
  // Tags that exist in the groups (a hand-edited URL's unknown ids must not inflate the badge).
  // Memoised: it walks every option of every group, and this component re-renders on each page of infinite scroll.
  const appliedCount = useMemo(
    () =>
      groups.reduce((n, g) => {
        const ids = new Set(g.options.map((o) => o.id));
        return n + (tags.selected[g.key] ?? []).filter((id) => ids.has(id)).length;
      }, 0),
    [groups, tags.selected],
  );

  const scopeBar = (compact: boolean) =>
    feed ? (
      <FeedToolbar
        appliedCount={appliedCount}
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen(!filtersOpen)}
        filtersId={loading ? undefined : filtersPanelId}
        filterOptions={filterOptions!}
        filters={feedFilters.filters}
        onFilterChange={feedFilters.set}
        onClearFilters={feedFilters.clearAll}
        sort={sort}
        onSort={setSort}
        disabled={noSource}
      />
    ) : (
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

  const feedBarsSkeleton = (
    <div aria-hidden="true" className="flex flex-col gap-2">
      <div className="h-11 animate-pulse rounded-xl border border-border bg-card" />
      <div className="h-11 animate-pulse rounded-xl border border-border bg-card" />
    </div>
  );

  const feedOverview = noSource ? undefined : (
    <div className="flex flex-col gap-2">
      <QuickFilters
        groups={groups}
        trending={trending}
        selected={tags.selected}
        onToggle={tags.toggle}
        onClearAll={tags.clearAll}
        expanded={filtersOpen}
        onExpandedChange={setFiltersOpen}
        panelId={filtersPanelId}
      />
      <FeedOverview
        expanded={overviewOpen}
        onExpandedChange={setOverviewOpen}
        panelId={overviewPanelId}
        prefs={prefs}
        kpis={kpis}
        summary={summary}
        series={series}
        baseAds={base}
        period={scope.period}
        now={MODULE_NOW}
        basedOn={scoped.length}
        trendBasedOn={base.length}
        groups={groups}
        selected={tags.selected}
        onToggleTag={tags.toggle}
      />
    </div>
  );

  const overview = loading ? (
    feed ? feedBarsSkeleton : <OverviewSkeleton />
  ) : feed ? (
    feedOverview
  ) : noSource ? undefined : (
      <OverviewShell
        pageKey={pageKey}
        basedOn={scoped.length}
        kpis={kpis}
        summary={summary}
        summaryDisabledReason="No ads in this scope, so there is nothing to summarise."
        summaryBelow={<TrendingTags tags={trending} selected={tags.selected} onToggle={tags.toggle} basedOn={base.length} />}
        charts={
          <TrendBars
            series={series}
            title="Launch frequency"
            basedOn={base.length}
            emptyReason="No ads launched in this period, so there is nothing to chart."
          />
        }
        expandedOnly={<RisingScaling baseAds={base} period={scope.period} now={MODULE_NOW} basedOn={base.length} />}
        groups={<TopTenGroups groups={groups} selected={tags.selected} onToggle={tags.toggle} />}
      />
    );

  const searchChip = query ? (
    <button
      type="button"
      onClick={() => clearSearch(false)}
      aria-label={`Remove search: ${query}`}
      className="inline-flex h-7 max-w-full items-center gap-1 self-start rounded-full border border-primary/30 bg-primary/10 pl-2.5 pr-1.5 text-xs text-primary-text hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="shrink-0 text-muted-foreground">Search:</span>
      <TruncatedText text={`“${query}”`} className="max-w-[220px] font-medium" focusable={false} />
      <X className="h-3 w-3 shrink-0" aria-hidden="true" />
    </button>
  ) : null;

  const chips =
    loading || noSource ? undefined : (
      <div className="flex flex-col gap-2">
        {searchChip}
        {!noAdsInScope && (
          <SelectedChips
            selected={tags.selected}
            groups={groups}
            onRemove={tags.toggle}
            onClearAll={tags.clearAll}
            total={total}
            noun="ads"
            // My Feeds keeps Sort in its toolbar row; Discover keeps it here.
            rightSlot={feed ? undefined : <SortControl value={sort as AdSort} options={AD_SORT_LABEL} onChange={setSort} />}
          />
        )}
        {feed && engagementField && !noMatches && (
          <EngagementSortNotice
            field={engagementField}
            reported={reportedCount}
            total={total}
            onSwitch={() => setSort("newest")}
          />
        )}
      </div>
    );

  let list: ReactNode;
  if (loading) list = <GridSkeleton count={8} />;
  else if (noSource) list = emptyState;
  else if (noAdsInScope && query)
    list = (
      <EmptyState
        title={`No ads match “${query}” in this scope`}
        body="Search narrows the ads before the scope bar and tags apply. Clear the search, or widen the scope, to see more."
        action={
          <button
            type="button"
            onClick={() => clearSearch(true)}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Clear search
          </button>
        }
      />
    );
  else if (noAdsInScope && filtersActive)
    list = (
      <EmptyState
        title="No ads match these filters"
        body="Domain, Page, Status, Running days and Similar ads narrow the whole page. Remove a filter, or widen the scope, to see more ads."
        action={
          <button
            type="button"
            onClick={feedFilters.clearAll}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Clear filters
          </button>
        }
      />
    );
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
  else if (noMatches) list = <EmptyResults noun="ads" onClear={() => clearSearch(true)} />;
  else if (feed) list = <FeedGrid ads={sorted.slice(0, shown)} scopedAds={scoped} total={total} onLoadMore={loadMore} />;
  else list = <AdGrid ads={sorted.slice(0, shown)} scopedAds={scoped} total={total} onLoadMore={loadMore} />;

  return (
    <>
      <InsightsPageLayout
        title={title}
        count={loading || noSource ? undefined : total}
        countNoun="ads"
        headerActions={
          feed ? (
            // Industry · Category · Period (calendar) + the sources gear, top-right of the title row. They hide with it on scroll.
            <FeedHeaderActions scopeProps={scopePillProps} prefs={prefs} showScope={!noSource} />
          ) : (
            headerActions
          )
        }
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
