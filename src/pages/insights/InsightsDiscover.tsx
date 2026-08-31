import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DUMMY_ADS } from "@/lib/insights-dummy-data";
import { InsightAdCard } from "@/components/insights/InsightAdCard";
import { InsightAdGridSkeleton } from "@/components/insights/InsightAdGridSkeleton";
import { InsightsFilterBar, DEFAULT_FILTERS, type InsightsFilters, type InsightsViewTab } from "@/components/insights/InsightsFilterBar";
import { MobileInsightsTabs } from "@/components/insights/MobileInsightsTabs";
import { InsightsPagination } from "@/components/insights/InsightsPagination";
import { InsightAdDetailDrawer } from "@/components/insights/InsightAdDetailDrawer";
import { SaveToBoardModal } from "@/components/insights/SaveToBoardModal";
import { useSavedAdIds } from "@/hooks/use-insight-boards";
import { useInsightCompetitors } from "@/hooks/use-insight-competitors";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { angleForAd } from "@/insights-home/lib/homeSelectors";
import type { InsightAd } from "@/lib/insights-dummy-data";

/** Mirrors the <TabsTrigger> set below — the fold source for the mobile
 *  Filters sheet's "View" group (Maalik, 2026-08-11): a surface toggle above
 *  plus a full-width view tab bar plus a filter row was three stacked nav
 *  layers at 375px. Desktop keeps the always-visible Tabs bar unchanged. */
const VIEW_TABS: InsightsViewTab[] = [
  { value: "all", label: "All" },
  { value: "trending", label: "Trending" },
  { value: "industry", label: "By Industry" },
  { value: "platform", label: "By Platform" },
];

/**
 * InsightsDiscover — paginated grid of all ads, filterable + searchable.
 *
 * A-12.179: all interactive state is URL-backed so deep-link / refresh /
 * back-forward all reconstruct the exact view.
 *
 *   ?tab=trending|industry|platform     (omit on "all")
 *   ?page=<n>                            (omit on 1)
 *   ?perPage=<n>                         (omit on 12)
 *   ?q=<text>                            (filter: search)
 *   ?angle=<bucket>                      (filter: creative angle — the Home
 *                                         page's AngleMixDonut links here;
 *                                         buckets come from angleForAd() in
 *                                         src/insights-home/lib/homeSelectors.ts
 *                                         so slice share and filtered count
 *                                         are the same partition)
 *   ?industry=<key>                      (filter: industry)
 *   ?platform=<key>                      (filter: platform)
 *   ?status=<key>                        (filter: status)
 *   ?country=<key>                       (filter: country)
 *   ?ad=<id>                             (opens InsightAdDetailDrawer)
 *   ?modal=save-to-board&modal-target=<id>  (opens SaveToBoardModal)
 *   ?loading=1                           (demo flag — forces skeleton)
 *
 * Filter / tab / pagination writes use { replace: true } so back-button
 * isn't polluted by rapid changes. Drawer / modal writes use { replace:
 * false } so back-button naturally closes them. Closing a drawer or
 * modal strips ONLY its own params and preserves all others. Deep-link
 * safety: if `?ad=<id>` references a missing ad, the drawer silently
 * doesn't open and the param is stripped.
 */
const DEFAULT_PER_PAGE = 12;

export default function InsightsDiscover() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isLoading = searchParams.get("loading") === "1";
  const { data: savedAdIds } = useSavedAdIds();
  const { addBrandToCompetitors, addPageToCompetitors } = useInsightCompetitors();

  // ── Derived URL state ──────────────────────────────────────────────
  const tab = searchParams.get("tab") ?? "all";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const perPage =
    Math.max(1, parseInt(searchParams.get("perPage") ?? `${DEFAULT_PER_PAGE}`, 10) || DEFAULT_PER_PAGE);

  const filters: InsightsFilters = useMemo(
    () => ({
      search: searchParams.get("q") ?? "",
      industry: searchParams.get("industry") ?? "",
      platform: searchParams.get("platform") ?? "",
      status: searchParams.get("status") ?? "",
      country: searchParams.get("country") ?? "",
    }),
    [searchParams],
  );

  // Creative-angle filter. Kept OUT of InsightsFilters (and so out of the
  // filter bar's own controls) because it isn't a field on InsightAd — it's a
  // derived bucket. It gets its own removable chip below instead, so the user
  // can always see why the grid is narrowed and get out of it in one click.
  const angle = searchParams.get("angle") ?? "";

  const clearAngle = useCallback(() => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.delete("angle");
        sp.delete("page");
        return sp;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const adId = searchParams.get("ad");
  const modal = searchParams.get("modal");
  const modalTarget = searchParams.get("modal-target");
  const saveTargetId = modal === "save-to-board" ? modalTarget : null;

  // ── Writers ────────────────────────────────────────────────────────
  const setTab = useCallback(
    (next: string) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (next === "all") sp.delete("tab");
          else sp.set("tab", next);
          // Tab change resets pagination — same behavior as before.
          sp.delete("page");
          return sp;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setPage = useCallback(
    (next: number) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (next <= 1) sp.delete("page");
          else sp.set("page", String(next));
          return sp;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setPerPage = useCallback(
    (next: number) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (next === DEFAULT_PER_PAGE) sp.delete("perPage");
          else sp.set("perPage", String(next));
          sp.delete("page"); // changing perPage resets to page 1
          return sp;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setFilters = useCallback(
    (next: InsightsFilters) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          // Map InsightsFilters fields → URL params, omitting empties.
          if (next.search) sp.set("q", next.search);
          else sp.delete("q");
          if (next.industry) sp.set("industry", next.industry);
          else sp.delete("industry");
          if (next.platform) sp.set("platform", next.platform);
          else sp.delete("platform");
          if (next.status) sp.set("status", next.status);
          else sp.delete("status");
          if (next.country) sp.set("country", next.country);
          else sp.delete("country");
          // Filter changes reset pagination.
          sp.delete("page");
          return sp;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const openAd = useCallback(
    (ad: InsightAd) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          sp.set("ad", ad.id);
          return sp;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  const closeAd = useCallback(() => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.delete("ad");
        return sp;
      },
      { replace: false },
    );
  }, [setSearchParams]);

  const openSaveModal = useCallback(
    (ad: InsightAd) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          sp.set("modal", "save-to-board");
          sp.set("modal-target", ad.id);
          return sp;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  const closeSaveModal = useCallback(() => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (sp.get("modal") === "save-to-board") {
          sp.delete("modal");
          sp.delete("modal-target");
        }
        return sp;
      },
      { replace: false },
    );
  }, [setSearchParams]);

  // ── Resolve current ad / save target from URL ──────────────────────
  const detailAd = useMemo<InsightAd | null>(() => {
    if (!adId) return null;
    return DUMMY_ADS.find((a) => a.id === adId) ?? null;
  }, [adId]);

  const saveBoardAd = useMemo<InsightAd | null>(() => {
    if (!saveTargetId) return null;
    return DUMMY_ADS.find((a) => a.id === saveTargetId) ?? null;
  }, [saveTargetId]);

  // Deep-link safety: if `?ad=` or `?modal-target=` references an
  // unknown ad, strip silently. DUMMY_ADS is sync so we can check
  // immediately — once this hits a real fetch, gate on `isLoading`.
  useEffect(() => {
    if (adId && !DUMMY_ADS.some((a) => a.id === adId)) {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          sp.delete("ad");
          return sp;
        },
        { replace: true },
      );
    }
  }, [adId, setSearchParams]);

  useEffect(() => {
    if (saveTargetId && !DUMMY_ADS.some((a) => a.id === saveTargetId)) {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (sp.get("modal") === "save-to-board") {
            sp.delete("modal");
            sp.delete("modal-target");
          }
          return sp;
        },
        { replace: true },
      );
    }
  }, [saveTargetId, setSearchParams]);

  // ── Filter pipeline (unchanged) ────────────────────────────────────
  let ads = DUMMY_ADS;
  if (tab === "trending") ads = ads.filter((_, i) => i % 3 === 0);
  if (tab === "industry" && filters.industry) ads = ads.filter((a) => a.industry === filters.industry);
  if (tab === "platform" && filters.platform) ads = ads.filter((a) => a.platforms.includes(filters.platform as any));
  if (filters.search) {
    const q = filters.search.toLowerCase();
    ads = ads.filter((a) => a.pageName.toLowerCase().includes(q) || a.headline.toLowerCase().includes(q));
  }
  if (angle) ads = ads.filter((a) => angleForAd(a) === angle);
  if (filters.industry && tab !== "industry") ads = ads.filter((a) => a.industry === filters.industry);
  if (filters.platform && tab !== "platform") ads = ads.filter((a) => a.platforms.includes(filters.platform as any));
  if (filters.status) ads = ads.filter((a) => a.status === filters.status);

  const total = ads.length;
  const activeCount = ads.filter((a) => a.status === "active").length;
  const inactiveCount = total - activeCount;
  const paginated = ads.slice((page - 1) * perPage, page * perPage);

  // ── Mobile: infinite scroll instead of pagination (Maalik, 2026-08-11) ──
  // "Show it like My feeds" — My feeds has no page control at all, pure
  // accumulate-on-scroll. Desktop's page/perPage (URL-backed, above) is
  // untouched; this is a second, independent slice over the same `ads`.
  const isMobile = useIsMobile();
  const [mobileLoadedCount, setMobileLoadedCount] = useState(DEFAULT_PER_PAGE);
  // Resets the accumulator whenever the FILTERED SET changes for a reason
  // other than "scrolled for more" — same rationale as setTab/setFilters
  // deleting `?page=` for the desktop pager above.
  const mobileFilterKey = useMemo(
    () => JSON.stringify({ tab, filters }),
    [tab, filters],
  );
  useEffect(() => {
    setMobileLoadedCount(DEFAULT_PER_PAGE);
  }, [mobileFilterKey]);
  const mobileVisibleAds = useMemo(
    () => ads.slice(0, mobileLoadedCount),
    [ads, mobileLoadedCount],
  );
  const mobileHasMore = mobileVisibleAds.length < total;
  const { sentinelRef } = useInfiniteScroll({
    hasMore: mobileHasMore,
    isLoading: false,
    onLoadMore: useCallback(
      () => setMobileLoadedCount((c) => c + DEFAULT_PER_PAGE),
      [],
    ),
  });

  const displayedAds = isMobile ? mobileVisibleAds : paginated;

  return (
    <div className="v3-page-mesh space-y-6 h-full flex flex-col overflow-x-hidden w-full max-w-full p-3">
      {/* Mobile surface toggle — see MobileInsightsTabs. md:hidden. */}
      <MobileInsightsTabs className="!mt-0" />
      {/* md:-only. On mobile MobileInsightsTabs directly above already names
          this surface — a heading repeating "Discover" spent a whole row
          saying nothing (same fix as InsightsV2IdentityRow). */}
      <div className="hidden md:flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Discover</h1>
      </div>
      {/* md:-only. On mobile this same tab set folds into the Filters sheet's
          "View" group via the viewTabs/viewValue/onViewChange props below —
          a full-width tab bar stacked under the surface toggle was a second
          nav layer at 375px. */}
      <Tabs value={tab} onValueChange={setTab} className="hidden md:block">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="industry">By Industry</TabsTrigger>
          <TabsTrigger value="platform">By Platform</TabsTrigger>
        </TabsList>
      </Tabs>
      <InsightsFilterBar
        filters={filters}
        onChange={setFilters}
        showTrending={tab === "all"}
        viewTabs={VIEW_TABS}
        viewValue={tab}
        onViewChange={setTab}
      />
      {angle && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Filtered by angle</span>
          <button
            type="button"
            onClick={clearAngle}
            aria-label={`Remove the ${angle} angle filter`}
            className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="min-w-0 truncate" title={angle}>{angle}</span>
            <X className="h-3 w-3 shrink-0" aria-hidden />
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {isLoading ? (
          <InsightAdGridSkeleton count={perPage} />
        ) : displayedAds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Search className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">No ads match your filters.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // The angle chip is a filter too — a "Clear filters" that left
                // it applied would be a dead end on an empty grid.
                clearAngle();
                setFilters(DEFAULT_FILTERS);
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
            {displayedAds.map((ad) => (
              <InsightAdCard key={ad.id} ad={ad} savedCount={(savedAdIds instanceof Map ? savedAdIds.get(ad.id) : 0) ?? 0} onViewDetail={openAd} onSaveToBoard={openSaveModal} onAddBrandToCompetitors={(a) => addBrandToCompetitors.mutate({ name: a.brand, identifier: a.domain })} onAddPageToCompetitors={(a) => addPageToCompetitors.mutate({ name: a.pageName, pageId: a.pageId })} />
            ))}
          </div>
        )}
        {/* Mobile-only infinite-scroll tail. Desktop keeps InsightsPagination
            below, unchanged. */}
        {isMobile && !isLoading && displayedAds.length > 0 && (
          <>
            {mobileHasMore && <div className="mt-4"><InsightAdGridSkeleton count={4} /></div>}
            <div ref={sentinelRef} className="h-12 flex items-center justify-center">
              {!mobileHasMore && (
                <span className="font-mono text-[11px] text-muted-foreground/60">
                  You've reached the end
                </span>
              )}
            </div>
          </>
        )}
      </div>
      {!isMobile && (
        <InsightsPagination total={total} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} activeCount={activeCount} inactiveCount={inactiveCount} />
      )}
      <InsightAdDetailDrawer ad={detailAd} open={!!detailAd} onClose={closeAd} onSaveToBoard={openSaveModal} />
      <SaveToBoardModal open={!!saveBoardAd} onClose={closeSaveModal} ad={saveBoardAd} />
    </div>
  );
}
