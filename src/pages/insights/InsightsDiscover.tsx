import { useState } from "react";
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
 * Phase C P1-I1: `?loading=1` URL flag forces the InsightAdGridSkeleton so
 * stakeholder demos can preview the loading state. When DUMMY_ADS is replaced
 * by an async fetch, this same skeleton becomes the natural loading state.
 */
export default function InsightsDiscover() {
  const [searchParams] = useSearchParams();
  const isLoading = searchParams.get("loading") === "1";
  const { data: savedAdIds } = useSavedAdIds();
  const { addBrandToCompetitors, addPageToCompetitors } = useInsightCompetitors();
  const [filters, setFilters] = useState<InsightsFilters>(DEFAULT_FILTERS);
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [detailAd, setDetailAd] = useState<InsightAd | null>(null);
  const [saveBoardAd, setSaveBoardAd] = useState<InsightAd | null>(null);

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
    <div className="space-y-6 h-full flex flex-col overflow-x-hidden w-full max-w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Discover</h1>
      </div>
      <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1); }}>
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
              <InsightAdCard key={ad.id} ad={ad} savedCount={(savedAdIds instanceof Map ? savedAdIds.get(ad.id) : 0) ?? 0} onViewDetail={setDetailAd} onSaveToBoard={setSaveBoardAd} onAddBrandToCompetitors={(a) => addBrandToCompetitors.mutate({ name: a.brand, identifier: a.domain })} onAddPageToCompetitors={(a) => addPageToCompetitors.mutate({ name: a.pageName, pageId: a.pageId })} />
            ))}
          </div>
        )}
      </div>
      <InsightsPagination total={total} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} activeCount={activeCount} inactiveCount={inactiveCount} />
      <InsightAdDetailDrawer ad={detailAd} open={!!detailAd} onClose={() => setDetailAd(null)} onSaveToBoard={setSaveBoardAd} />
      <SaveToBoardModal open={!!saveBoardAd} onClose={() => setSaveBoardAd(null)} ad={saveBoardAd} />
    </div>
  );
}
