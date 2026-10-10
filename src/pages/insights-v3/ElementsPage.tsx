/**
 * Industry Insights V2 · Creative Element Insights (agent C).
 *
 * Element-first view: pick a creative building block (Framework · Hook · Angle ·
 * Concept), see where it runs, open its overlay, take it to Genie or a board.
 * Shared page pattern: scope bar → tabs → collapsible overview (KPIs, AI summary,
 * launch frequency, Rising + Scaling, top-10 groups) → chips + sort → list.
 *
 * URL-backed: scope, tab, f_* tags, sort, ?more=, ?detail=, ?ad=, ?modal=save.
 * `?state=loading|empty` forces the loading / empty states for review.
 */
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ALL,
  ELEMENT_SORT_LABEL,
  QP,
  type ElementSort,
  type ElementType,
  type Scope,
} from "@/lib/insights-v3/types";
import { ELEMENT_TYPE_LABEL, getAd } from "@/lib/insights-v3/data";
import { filterListByTagUnion, hasSelection, sortElementRows, type ElementRow } from "@/lib/insights-v3/selectors";
import { useLastVisitAt } from "@/lib/insights-v3/stores";
import { InsightsOverlayHost } from "@/components/insights-v3/InsightsOverlayHost";
import {
  EmptyResults,
  EmptyState,
  InsightsPageLayout,
  ListSkeleton,
  OverviewShell,
  PageTabs,
  ScopeBar,
  SelectedChips,
  SortControl,
  TopTenGroups,
  TrendBars,
  ViewMoreModal,
  useInsightsScope,
  useListSort,
  usePageTab,
  useSelectedTags,
} from "@/components/insights-v3/shared";
import { ELEMENT_NOUN, ELEMENT_NOUN_SINGULAR, ELEMENT_TAB_KEYS } from "@/components/insights-v3/elements/constants";
import { ElementTable } from "@/components/insights-v3/elements/ElementTable";
import { RisingScaling } from "@/components/insights-v3/elements/RisingScaling";
import { isElementNew } from "@/components/insights-v3/elements/useElementNovelty";
import { useElementsData } from "@/components/insights-v3/elements/useElementsData";
import { InsightsSearch } from "@/components/insights-v3/search/InsightsSearch";

/** The ads behind a row, for the union tag filter (a row stays when any of its ads matches). */
const adsOfRow = (row: ElementRow) => row.adIds.map((id) => getAd(id)).filter((a): a is NonNullable<typeof a> => !!a);

const SORT_KEYS = Object.keys(ELEMENT_SORT_LABEL) as ElementSort[];

export default function ElementsPage() {
  const [rawScope, setScope] = useInsightsScope();
  // "My preferences only" belongs to Discover. A stray `mine=1` must not silently empty this page.
  const scope = useMemo<Scope>(
    () => ({ industry: rawScope.industry, category: rawScope.category, period: rawScope.period, myPrefsOnly: false }),
    [rawScope.industry, rawScope.category, rawScope.period],
  );
  const [tab, setTab] = usePageTab<ElementType>(ELEMENT_TAB_KEYS, "framework");
  const tags = useSelectedTags();
  const [sort, setSort] = useListSort<ElementSort>(SORT_KEYS, "most-used");
  const [sp] = useSearchParams();
  const pageState = sp.get(QP.state);
  const loading = pageState === "loading";
  const lastVisitAt = useLastVisitAt();

  const data = useElementsData(tab, scope, lastVisitAt, pageState === "empty");
  const noun = ELEMENT_NOUN[tab];

  const filtered = useMemo(
    () =>
      sortElementRows(
        filterListByTagUnion(data.rows, adsOfRow, tags.selected),
        sort,
      ),
    [data.rows, tags.selected, sort],
  );
  const newIds = useMemo(
    () => new Set(data.rows.filter((r) => isElementNew(tab, r.id, lastVisitAt)).map((r) => r.id)),
    [data.rows, tab, lastVisitAt],
  );

  const total = data.scoped.length;

  const overview = (
    <OverviewShell
      pageKey={`elements-${tab}`}
      basedOn={total}
      kpis={data.kpis}
      summary={data.summary.ads > 0 ? data.summary : null}
      summaryDisabledReason={`No ad in this scope has a ${tab} identified, so there is nothing to summarise.`}
      charts={
        <TrendBars
          series={data.launch}
          title="Launch frequency"
          basedOn={total}
          emptyReason="No ads launched in this scope, so there is nothing to chart."
        />
      }
      expandedOnly={<RisingScaling type={tab} rising={data.rising} scaling={data.scaling} basedOn={data.baseAdCount} />}
      groups={<TopTenGroups groups={data.groups} selected={tags.selected} onToggle={tags.toggle} noun="ads" />}
    />
  );

  const chips = (
    <SelectedChips
      selected={tags.selected}
      groups={data.groups}
      onRemove={tags.toggle}
      onClearAll={tags.clearAll}
      total={filtered.length}
      noun={noun}
      nounSingular={ELEMENT_NOUN_SINGULAR[tab]}
      rightSlot={<SortControl value={sort} options={ELEMENT_SORT_LABEL} onChange={setSort} />}
    />
  );

  let list;
  if (loading) {
    list = <ListSkeleton rows={8} />;
  } else if (total === 0) {
    list = (
      <EmptyState
        title="No ads in this scope"
        body="Nothing matches the industry, category and period you picked. Widen the scope to see creative elements."
        action={
          <button
            type="button"
            onClick={() => setScope({ industry: ALL, category: ALL, period: "all" })}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Reset scope
          </button>
        }
      />
    );
  } else if (data.rows.length === 0) {
    list = (
      <EmptyState
        title={`No ${noun} identified`}
        body={`Ads in this scope don't have a ${tab} we could read. Try another tab or widen the scope.`}
      />
    );
  } else if (filtered.length === 0 && hasSelection(tags.selected)) {
    list = <EmptyResults noun={noun} onClear={tags.clearAll} />;
  } else {
    list = <ElementTable key={tab} rows={filtered} type={tab} scope={scope} newIds={newIds} />;
  }

  return (
    <>
      <InsightsPageLayout
        title="Creative Element Insights"
        headerActions={<InsightsSearch />}
        count={loading ? null : filtered.length}
        countNoun={noun}
        scopeBar={(compact) => (
          <ScopeBar
            scope={scope}
            onChange={setScope}
            industries={data.industries}
            categories={data.categories}
            totalCount={total}
            periodCounts={data.periodCounts}
            compact={compact}
          />
        )}
        tabs={
          <PageTabs<ElementType>
            aria-label="Creative element type"
            value={tab}
            onChange={(next) => setTab(next)}
            tabs={ELEMENT_TAB_KEYS.map((k) => ({
              key: k,
              label: ELEMENT_TYPE_LABEL[k],
              count: loading ? undefined : data.tabCounts[k],
            }))}
          />
        }
        overview={loading ? undefined : overview}
        chips={loading ? undefined : chips}
        list={list}
      />

      <ViewMoreModal
        groups={data.groups}
        selected={tags.selected}
        onToggle={tags.toggle}
        onClearGroup={tags.clearGroup}
        noun="ads"
      />
      <InsightsOverlayHost />
    </>
  );
}
