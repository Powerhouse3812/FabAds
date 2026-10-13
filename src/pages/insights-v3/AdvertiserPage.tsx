/**
 * Industry Insights V2 · Advertiser (Domain · Page · LP & Offers).
 *
 * Shared page pattern: scope bar → tabs → collapsible overview (KPIs, AI
 * summary, launch frequency, rising + scaling, top-10 groups) → chips + sort →
 * list. Row click opens the advertiser / landing-page overlay through the URL
 * (`detail=`), rendered by <InsightsOverlayHost />.
 * Spec: docs/industry-insights/02-page-specs.md › Advertiser.
 */
import { useMemo } from "react";
import { Info } from "lucide-react";
import {
  ADVERTISER_SORT_LABEL,
  ALL,
  LANDING_PAGE_SORT_LABEL,
  PERIOD_OPTIONS,
  type Ad,
  type AdvertiserKind,
  type AdvertiserSort,
  type LandingPageSort,
  type SelectedTags,
  type TagGroupKey,
} from "@/lib/insights-v3/types";
import {
  ADVERTISER_GROUP_KEYS,
  LANDING_PAGE_GROUP_KEYS,
  adsInScope,
  advertiserKpis,
  advertiserRows,
  aiSummary,
  categoryOptions,
  filterListByTagUnion,
  groupKeysForScope,
  industryOptions,
  landingPageKpis,
  landingPageRows,
  launchFrequency,
  rising,
  scaling,
  sortAdvertiserRows,
  sortLandingPageRows,
  tagGroups,
  type AdvertiserRow,
  type LandingPageRow,
} from "@/lib/insights-v3/selectors";
import {
  EmptyResults,
  EmptyState,
  InsightsPageLayout,
  ListSkeleton,
  OverviewSkeleton,
  OverviewShell,
  PageTabs,
  ScopeBar,
  SelectedChips,
  SortControl,
  TrendBars,
  ViewMoreModal,
  TopTenGroups,
  useListSort,
  usePageTab,
  useSelectedTags,
  type ScopeOption,
} from "@/components/insights-v3/shared";
import { InsightsOverlayHost } from "@/components/insights-v3/InsightsOverlayHost";
import { InsightsSearch } from "@/components/insights-v3/search/InsightsSearch";
import { AdvertiserTable } from "@/components/insights-v3/advertiser/AdvertiserTable";
import { LandingPageTable } from "@/components/insights-v3/advertiser/LandingPageTable";
import { useShowMore } from "@/components/insights-v3/advertiser/helpers";
import { ShowMore } from "@/components/insights-v3/advertiser/tableParts";
import { TrendList } from "@/components/insights-v3/advertiser/TrendLists";
import { useAdvertiserCtx } from "@/components/insights-v3/advertiser/useAdvertiserCtx";

type TabKey = "domain" | "page" | "lp";
const TAB_KEYS: TabKey[] = ["domain", "page", "lp"];
const ADV_SORTS = Object.keys(ADVERTISER_SORT_LABEL) as AdvertiserSort[];
const LP_SORTS = Object.keys(LANDING_PAGE_SORT_LABEL) as LandingPageSort[];

const NOUN: Record<TabKey, { plural: string; singular: string }> = {
  domain: { plural: "domains", singular: "domain" },
  page: { plural: "pages", singular: "page" },
  lp: { plural: "landing pages", singular: "landing page" },
};

/** Keep only the selected tags whose group is shown on this tab/scope. */
function restrict(selected: SelectedTags, keys: TagGroupKey[]): SelectedTags {
  const out: SelectedTags = {};
  for (const k of keys) if (selected[k]?.length) out[k] = selected[k];
  return out;
}

export default function AdvertiserPage() {
  const { scope, setScope, ctx, allAds, baseAds: realBase, forcedState } = useAdvertiserCtx();
  const [tab, setTab] = usePageTab<TabKey>(TAB_KEYS, "domain");
  const tags = useSelectedTags();
  const [advSort, setAdvSort] = useListSort<AdvertiserSort>(ADV_SORTS, "most-ads");
  const [lpSort, setLpSort] = useListSort<LandingPageSort>(LP_SORTS, "most-ads");

  const forcedEmpty = forcedState === "empty";
  const loading = forcedState === "loading";
  const baseAds = useMemo(() => (forcedEmpty ? [] : realBase), [forcedEmpty, realBase]);
  const scoped = useMemo(() => (forcedEmpty ? [] : adsInScope(allAds, scope, ctx)), [forcedEmpty, allAds, scope, ctx]);

  /* ── scope bar + tab counts ─────────────────────────────────────────── */
  const scopeBarData = useMemo(() => {
    const zero = (o: { id: string; label: string }): ScopeOption => ({ id: o.id, label: o.label, count: 0 });
    const inds = industryOptions(allAds, scope, ctx).filter((o) => o.id !== ALL);
    const cats = categoryOptions(allAds, scope, ctx).filter((o) => o.id !== ALL);
    const periodCounts: Record<string, number> = {};
    for (const p of PERIOD_OPTIONS) periodCounts[p.key] = forcedEmpty ? 0 : adsInScope(allAds, { ...scope, period: p.key }, ctx).length;
    return {
      industries: forcedEmpty ? inds.map(zero) : inds,
      categories: forcedEmpty ? cats.map(zero) : cats,
      periodCounts,
    };
  }, [allAds, scope, ctx, forcedEmpty]);

  const tabCounts = useMemo(() => {
    const d = new Set<string>();
    const p = new Set<string>();
    const l = new Set<string>();
    for (const a of scoped) {
      if (a.domainAdvertiserId) d.add(a.domainAdvertiserId);
      p.add(a.pageAdvertiserId);
      if (a.landingPageId) l.add(a.landingPageId);
    }
    return { domain: d.size, page: p.size, lp: l.size };
  }, [scoped]);

  /* ── tab data ───────────────────────────────────────────────────────── */
  const isLp = tab === "lp";
  const kind: AdvertiserKind = tab === "page" ? "page" : "domain";

  const source = useMemo(() => {
    if (isLp) return scoped.filter((a) => a.landingPageId);
    return kind === "domain" ? scoped.filter((a) => a.domainAdvertiserId) : scoped;
  }, [scoped, isLp, kind]);

  const groupKeys = useMemo(
    () => groupKeysForScope(isLp ? LANDING_PAGE_GROUP_KEYS : ADVERTISER_GROUP_KEYS, scope),
    [isLp, scope],
  );
  const groups = useMemo(() => tagGroups(source, groupKeys), [source, groupKeys]);
  const selected = useMemo(() => restrict(tags.selected, groupKeys), [tags.selected, groupKeys]);
  const selectedCount = Object.values(selected).reduce((n, ids) => n + (ids?.length ?? 0), 0);

  const adById = useMemo(() => new Map(source.map((a) => [a.id, a])), [source]);
  const adsOf = (r: { adIds: string[] }): Ad[] => r.adIds.map((id) => adById.get(id)).filter((a): a is Ad => !!a);

  const advRows = useMemo(
    () => (isLp ? [] : advertiserRows(kind, source, { ...ctx, scope, baseAds })),
    [isLp, kind, source, ctx, scope, baseAds],
  );
  const lpRows = useMemo(() => (isLp ? landingPageRows(source, { ...ctx, scope, baseAds }) : []), [isLp, source, ctx, scope, baseAds]);

  const advShown = useMemo(
    () => sortAdvertiserRows(filterListByTagUnion<AdvertiserRow>(advRows, adsOf, selected), advSort),
    [advRows, selected, advSort], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const lpShown = useMemo(
    () => sortLandingPageRows(filterListByTagUnion<LandingPageRow>(lpRows, adsOf, selected), lpSort),
    [lpRows, selected, lpSort], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const totalRows = isLp ? lpRows.length : advRows.length;
  const shownCount = isLp ? lpShown.length : advShown.length;

  const resetKey = `${tab}|${scope.industry}|${scope.category}|${scope.period}|${isLp ? lpSort : advSort}|${JSON.stringify(selected)}`;
  const win = useShowMore(shownCount, resetKey);

  /* ── overview ───────────────────────────────────────────────────────── */
  const overview = useMemo(() => {
    const kpis = isLp ? landingPageKpis(baseAds, scope, ctx) : advertiserKpis(kind, baseAds, scope, ctx);
    const summary =
      source.length === 0
        ? null
        : isLp
          ? aiSummary({ kind: "landing-page-list", ads: source })
          : aiSummary({ kind: "advertiser-list", advertiserKind: kind, ads: source });
    const chartAds = forcedEmpty ? [] : allAds.filter((a) => (isLp ? a.landingPageId : kind === "domain" ? a.domainAdvertiserId : true));
    const series = launchFrequency(chartAds, scope, ctx.now, { prefs: ctx.prefs });
    const period = scope.period;
    const risingA = isLp ? rising("landing-page", baseAds, period, ctx.now, { limit: 8 }) : rising(kind, baseAds, period, ctx.now, { limit: 8 });
    const second = isLp ? rising("offer", baseAds, period, ctx.now, { limit: 8 }) : scaling(kind, baseAds, period, ctx.now, { limit: 8 });
    return { kpis, summary, series, risingA, second };
  }, [isLp, kind, baseAds, scope, ctx, source, allAds, forcedEmpty]);

  const noun = NOUN[tab];
  const sortControl = isLp ? (
    <SortControl value={lpSort} options={LANDING_PAGE_SORT_LABEL} onChange={setLpSort} />
  ) : (
    <SortControl value={advSort} options={ADVERTISER_SORT_LABEL} onChange={setAdvSort} />
  );

  const overviewNode = (
    <OverviewShell
      pageKey={`advertiser-${tab}`}
      basedOn={source.length}
      kpis={overview.kpis}
      summary={overview.summary}
      summaryDisabledReason="No ads in this scope, so there is nothing to summarise."
      charts={
        <TrendBars
          series={overview.series}
          title="Launch frequency"
          basedOn={source.length}
          emptyReason="No ads launched in this scope and period, so there is nothing to chart."
        />
      }
      expandedOnly={
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {isLp ? (
            <>
              <TrendList
                title="Rising landing pages"
                mode="rising"
                type="landing-page"
                items={overview.risingA}
                basedOn={source.length}
                unit="change in new ads vs the previous period"
                emptyReason="No landing page is launching more ads than in the previous period."
              />
              <TrendList
                title="Rising offers"
                mode="rising"
                type="offer"
                items={overview.second}
                basedOn={source.length}
                unit="change in new ads vs the previous period"
                emptyReason="No traced offer is getting more ads than in the previous period."
              />
            </>
          ) : (
            <>
              <TrendList
                title={`Rising ${noun.plural}`}
                mode="rising"
                type={kind}
                items={overview.risingA}
                basedOn={source.length}
                unit="change in new ads vs the previous period"
                emptyReason={`No ${noun.singular} is launching more ads than in the previous period.`}
              />
              <TrendList
                title={`Scaling ${noun.plural}`}
                mode="scaling"
                type={kind}
                items={overview.second}
                basedOn={source.length}
                unit="active ads added since the previous period"
                emptyReason={`No ${noun.singular} has grown its active ads and has a winner yet.`}
              />
            </>
          )}
        </div>
      }
      groups={
        <TopTenGroups
          groups={groups}
          selected={selected}
          onToggle={tags.toggle}
          noun="ads"
        />
      }
    />
  );

  const chipsNode = (
    <>
      <SelectedChips
        selected={selected}
        groups={groups}
        onRemove={tags.toggle}
        onClearAll={tags.clearAll}
        total={shownCount}
        noun={noun.plural}
        nounSingular={noun.singular}
        rightSlot={sortControl}
      />
      {!isLp && (
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            Mark as competitor sends a {noun.singular} to My Feeds. It changes where its data shows, not what shows.
            {kind === "page" && " Follow adds a page to your preferences, which also feeds My Feeds."}
          </span>
        </p>
      )}
    </>
  );

  let listNode;
  if (loading) {
    listNode = <ListSkeleton rows={8} />;
  } else if (shownCount === 0) {
    listNode =
      selectedCount > 0 && totalRows > 0 ? (
        <EmptyResults noun={noun.plural} onClear={tags.clearAll} />
      ) : (
        <EmptyState
          title={`No ${noun.plural} in this scope`}
          body={`There are no ${noun.plural} with ads for this industry, category and period. Widen the scope to see more.`}
          action={
            <button
              type="button"
              onClick={() => setScope({ industry: ALL, category: ALL, period: "all" })}
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Reset scope to all
            </button>
          }
        />
      );
  } else {
    const footer = <ShowMore remaining={win.remaining} onMore={win.more} noun={noun.plural} />;
    listNode = isLp ? (
      <LandingPageTable rows={lpShown.slice(0, win.visible)} scope={scope} footer={footer} />
    ) : (
      <AdvertiserTable kind={kind} rows={advShown.slice(0, win.visible)} scope={scope} footer={footer} onPickScope={setScope} />
    );
  }

  return (
    <>
      <InsightsPageLayout
        title="Competitors"
        count={loading ? undefined : shownCount}
        countNoun={noun.plural}
        headerActions={<InsightsSearch />}
        scopeBar={(compact) => (
          <ScopeBar
            scope={scope}
            onChange={setScope}
            industries={scopeBarData.industries}
            categories={scopeBarData.categories}
            totalCount={scoped.length}
            periodCounts={scopeBarData.periodCounts}
            compact={compact}
          />
        )}
        tabs={
          <PageTabs<TabKey>
            aria-label="Competitor sections"
            value={tab}
            onChange={setTab}
            tabs={[
              { key: "domain", label: "Domain", count: tabCounts.domain },
              { key: "page", label: "Page", count: tabCounts.page },
              { key: "lp", label: "LP & Offers", count: tabCounts.lp },
            ]}
          />
        }
        overview={loading ? <OverviewSkeleton /> : overviewNode}
        chips={loading ? undefined : chipsNode}
        list={listNode}
      />
      <ViewMoreModal
        groups={groups}
        selected={selected}
        onToggle={tags.toggle}
        onClearGroup={tags.clearGroup}
        noun="ads"
      />
      <InsightsOverlayHost />
    </>
  );
}
