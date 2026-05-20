import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { DUMMY_ADS } from "@/lib/insights-dummy-data";
import { InsightAdCard } from "@/components/insights/InsightAdCard";
import { InsightAdGridSkeleton } from "@/components/insights/InsightAdGridSkeleton";
import { InsightsFilterBar, DEFAULT_FILTERS, type InsightsFilters } from "@/components/insights/InsightsFilterBar";
import { InsightsPagination } from "@/components/insights/InsightsPagination";
import { InsightAdDetailDrawer } from "@/components/insights/InsightAdDetailDrawer";
import { SaveToBoardModal } from "@/components/insights/SaveToBoardModal";
import { useSavedAdIds } from "@/hooks/use-insight-boards";
import { useInsightCompetitors } from "@/hooks/use-insight-competitors";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import type { InsightAd } from "@/lib/insights-dummy-data";

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
  if (filters.industry && tab !== "industry") ads = ads.filter((a) => a.industry === filters.industry);
  if (filters.platform && tab !== "platform") ads = ads.filter((a) => a.platforms.includes(filters.platform as any));
  if (filters.status) ads = ads.filter((a) => a.status === filters.status);

  const total = ads.length;
  const activeCount = ads.filter((a) => a.status === "active").length;
  const inactiveCount = total - activeCount;
  const paginated = ads.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="v3-page-mesh space-y-6 h-full flex flex-col overflow-x-hidden w-full max-w-full p-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Discover</h1>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="industry">By Industry</TabsTrigger>
          <TabsTrigger value="platform">By Platform</TabsTrigger>
        </TabsList>
      </Tabs>
      <InsightsFilterBar filters={filters} onChange={setFilters} showTrending={tab === "all"} />
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {isLoading ? (
          <InsightAdGridSkeleton count={perPage} />
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Search className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">No ads match your filters.</p>
            <Button variant="outline" size="sm" onClick={() => setFilters(DEFAULT_FILTERS)}>Clear filters</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
            {paginated.map((ad) => (
              <InsightAdCard key={ad.id} ad={ad} savedCount={(savedAdIds instanceof Map ? savedAdIds.get(ad.id) : 0) ?? 0} onViewDetail={openAd} onSaveToBoard={openSaveModal} onAddBrandToCompetitors={(a) => addBrandToCompetitors.mutate({ name: a.brand, identifier: a.domain })} onAddPageToCompetitors={(a) => addPageToCompetitors.mutate({ name: a.pageName, pageId: a.pageId })} />
            ))}
          </div>
        )}
      </div>
      <InsightsPagination total={total} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} activeCount={activeCount} inactiveCount={inactiveCount} />
      <InsightAdDetailDrawer ad={detailAd} open={!!detailAd} onClose={closeAd} onSaveToBoard={openSaveModal} />
      <SaveToBoardModal open={!!saveBoardAd} onClose={closeSaveModal} ad={saveBoardAd} />
    </div>
  );
}
