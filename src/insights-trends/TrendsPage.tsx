/**
 * Industry Insights → Trends — the module page (doc §6/§7).
 *
 * Composition only: page header, the four-tab bar (Overview / News &
 * Intelligence / Social & Creative / Search & Demand), TrendsToolbar, the
 * active tab's view, and the shared TrendStoryOverlay. All filtering,
 * facet logic, and per-tab content live in useTrendsFilters and the
 * view/toolbar/overlay files this composes — nothing is re-implemented here.
 *
 * URL-backed state, one owner per concern, no normalising effect:
 *  - `tab` + `filters` come from useTrendsFilters(), which already derives
 *    everything from the URL at read time (?tab=, ?q=, ?scope=, ?fa=, ?fb=).
 *  - `story` (the open TrendStoryOverlay item) is this file's own concern —
 *    read directly off useSearchParams() on every render, exactly like
 *    InsightsV2Feed's `?ad=<id>` drawer state (src/pages/insights-v2/
 *    InsightsV2Feed.tsx). That file's own lesson is the one this
 *    deliberately avoids: it once had a *second* effect normalising a URL
 *    alias, which raced the filter->URL sync effect on the same commit —
 *    whichever ran last won, silently dropping the other's write. There is
 *    no such second effect here. `storyId` is derived straight from
 *    `searchParams` with no local mirror to fall out of sync with it, and
 *    `openStory`/`closeStory` write directly into the URL with
 *    `{ replace: false }` so the browser back button closes the overlay,
 *    matching the drawer/modal convention `InsightsV2Feed` already
 *    establishes for this app.
 *
 * Tabs use the shared Radix-backed primitive (src/components/ui/tabs.tsx)
 * rather than hand-rolled buttons — it already wires the correct
 * tablist/tab/tabpanel roles, aria-controls, and roving tabindex, and its
 * TabsContent only mounts the active panel, which is exactly the behaviour
 * TrendsSocial/TrendsNews/TrendsSearch's own header comments assume ("resets
 * whenever this tab is (re)mounted... matching what a real fetch-on-tab-open
 * would look like").
 *
 * Token vocabulary matches every sibling insights page (src/pages/insights/
 * InsightsBoards.tsx, InsightsOverview.tsx): `v3-page-mesh space-y-4 p-3`
 * wrapper, plain `text-xl font-semibold` h1 + `text-sm text-muted-foreground`
 * subhead. No new colour tokens, no platform-brand tinting.
 */
import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTrendsFilters } from "@/insights-trends/hooks/useTrendsFilters";
import { TrendsToolbar } from "@/insights-trends/components/TrendsToolbar";
import { TrendStoryOverlay } from "@/insights-trends/components/TrendStoryOverlay";
import TrendsOverview from "@/insights-trends/views/TrendsOverview";
import TrendsNews from "@/insights-trends/views/TrendsNews";
import TrendsSocial from "@/insights-trends/views/TrendsSocial";
import TrendsSearch from "@/insights-trends/views/TrendsSearch";
import {
  BREAKING_STORIES,
  META_ADS,
  TIKTOK_HOOKS,
  NEWS_ITEMS,
  SEARCH_DEMAND,
  OTHER_SOCIAL,
} from "@/insights-trends/mocks/trendsData";
import type { TrendsTabKey } from "@/insights-trends/types";

/* ------------------------------------------------------------------ */
/*  Tab bar definition — order + labels are the doc-fixed vocabulary.   */
/*  Same label strings TrendsToolbar's own TAB_SCOPE_LABEL uses for the  */
/*  "N results in {tabScopeName}" summary, so the tab bar and the toolbar */
/*  never disagree about what to call the current tab.                   */
/* ------------------------------------------------------------------ */
const TAB_DEFS: Array<{ key: TrendsTabKey; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "news", label: "News & Intelligence" },
  { key: "social", label: "Social & Creative" },
  { key: "search", label: "Search & Demand" },
];

export default function TrendsPage(): JSX.Element {
  const { tab, setTab, filters, setFilters, clearFilters, activeCount, applyFilters } =
    useTrendsFilters();

  // Story overlay — this page's own URL concern, read at render time, no
  // shadow state. See file header for why there's no normalising effect.
  const [searchParams, setSearchParams] = useSearchParams();
  const storyId = searchParams.get("story");

  const openStory = useCallback(
    (id: string) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          sp.set("story", id);
          return sp;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  const closeStory = useCallback(() => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.delete("story");
        return sp;
      },
      { replace: false },
    );
  }, [setSearchParams]);

  // Result count for the toolbar's live "N results in {tab} · {scope}"
  // summary — scoped to whichever tab's own dataset is actually active,
  // matching each view's own filtered count exactly (Overview sums all six
  // sections the same way TrendsOverview's `totalVisible` does).
  const resultCount = useMemo(() => {
    switch (tab) {
      case "news":
        return applyFilters(NEWS_ITEMS).length;
      case "social":
        return applyFilters([...META_ADS, ...TIKTOK_HOOKS, ...OTHER_SOCIAL]).length;
      case "search":
        return applyFilters(SEARCH_DEMAND).length;
      case "overview":
      default:
        return (
          applyFilters(BREAKING_STORIES).length +
          applyFilters(NEWS_ITEMS).length +
          applyFilters(META_ADS).length +
          applyFilters(TIKTOK_HOOKS).length +
          applyFilters(SEARCH_DEMAND).length +
          applyFilters(OTHER_SOCIAL).length
        );
    }
  }, [tab, applyFilters]);

  return (
    <div className="v3-page-mesh space-y-4 p-3">
      <div>
        <h1 className="text-xl font-semibold">Trends</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          The Industry Insights newsroom — breaking stories, Meta ads, TikTok hooks, and search
          demand in one place, each with its own confidence, adaptation risk, and recommended test
          window.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(next) => setTab(next as TrendsTabKey)}>
        <TabsList>
          {TAB_DEFS.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-3">
          <TrendsToolbar
            tab={tab}
            filters={filters}
            setFilters={setFilters}
            clearFilters={clearFilters}
            activeCount={activeCount}
            resultCount={resultCount}
          />
        </div>

        <TabsContent value="overview" className="mt-4">
          <TrendsOverview filters={filters} onOpen={openStory} />
        </TabsContent>
        <TabsContent value="news" className="mt-4">
          <TrendsNews filters={filters} onOpen={openStory} />
        </TabsContent>
        <TabsContent value="social" className="mt-4">
          <TrendsSocial filters={filters} onOpen={openStory} />
        </TabsContent>
        <TabsContent value="search" className="mt-4">
          <TrendsSearch filters={filters} onOpen={openStory} />
        </TabsContent>
      </Tabs>

      <TrendStoryOverlay itemId={storyId} onClose={closeStory} />
    </div>
  );
}
