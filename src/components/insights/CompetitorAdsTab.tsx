import { useState } from "react";
import { DUMMY_ADS } from "@/lib/insights-dummy-data";
import { InsightAdCard } from "@/components/insights/InsightAdCard";
import { InsightsPagination } from "@/components/insights/InsightsPagination";
import { InsightAdDetailDrawer } from "@/components/insights/InsightAdDetailDrawer";
import { SaveToBoardModal } from "@/components/insights/SaveToBoardModal";
import { useInsightCompetitors } from "@/hooks/use-insight-competitors";
import { useInsightPreferences } from "@/hooks/use-insight-preferences";
import { useSavedAdIds } from "@/hooks/use-insight-boards";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Radar, Search } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { InsightAd } from "@/lib/insights-dummy-data";

export function CompetitorAdsTab() {
  const navigate = useNavigate();
  const { competitors, isLoading, addBrandToCompetitors, addPageToCompetitors } = useInsightCompetitors();
  const { followedBrands, toggleFollowBrand } = useInsightPreferences();
  const { data: savedAdIds } = useSavedAdIds();

  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [pageFilter, setPageFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [detailAd, setDetailAd] = useState<InsightAd | null>(null);
  const [saveBoardAd, setSaveBoardAd] = useState<InsightAd | null>(null);

  const domainCompetitors = competitors.filter((c) => c.competitor_type === "domain");
  const pageCompetitors = competitors.filter((c) => c.competitor_type === "page");

  // Match ads by competitor name (case-insensitive)
  const competitorNames = competitors.map((c) => c.name.toLowerCase());
  let ads = DUMMY_ADS.filter((a) => competitorNames.includes(a.brand.toLowerCase()));

  // Apply domain filter
  if (domainFilter !== "all") {
    const selectedComp = domainCompetitors.find((c) => c.id === domainFilter);
    if (selectedComp) {
      ads = ads.filter((a) => a.domain.toLowerCase() === selectedComp.identifier.toLowerCase());
    }
  }

  // Apply page filter
  if (pageFilter !== "all") {
    const selectedComp = pageCompetitors.find((c) => c.id === pageFilter);
    if (selectedComp) {
      ads = ads.filter((a) => a.pageId === selectedComp.identifier);
    }
  }

  const total = ads.length;
  const activeCount = ads.filter((a) => a.status === "active").length;
  const inactiveCount = total - activeCount;
  const paginated = ads.slice((page - 1) * perPage, page * perPage);

  const handleFollowBrand = (ad: InsightAd) => {
    toggleFollowBrand.mutate(ad.brand, {
      onSuccess: () => {
        const wasFollowing = followedBrands.includes(ad.brand);
        toast.success(wasFollowing ? `Unfollowed ${ad.brand}` : `Following ${ad.brand}`);
      },
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>;
  }

  if (competitors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Radar className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-muted-foreground">No competitors tracked yet.</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/insights/competitors")}>
          Manage Competitors
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 h-full flex flex-col overflow-x-hidden w-full max-w-full">
      {/* Filter bar */}
      <div className="flex items-center justify-end gap-2">
        <Select value={domainFilter} onValueChange={(v) => { setDomainFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px] h-9 text-sm">
            <SelectValue placeholder="All Domains" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Domains</SelectItem>
            {domainCompetitors.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={pageFilter} onValueChange={(v) => { setPageFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px] h-9 text-sm">
            <SelectValue placeholder="All Pages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pages</SelectItem>
            {pageCompetitors.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ads grid */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Search className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">No ads match your tracked competitors.</p>
            <Button variant="outline" size="sm" onClick={() => { setDomainFilter("all"); setPageFilter("all"); }}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
            {paginated.map((ad) => (
              <InsightAdCard
                key={ad.id}
                ad={ad}
                savedCount={(savedAdIds instanceof Map ? savedAdIds.get(ad.id) : 0) ?? 0}
                isFollowedBrand={followedBrands.includes(ad.brand)}
                onViewDetail={setDetailAd}
                onSaveToBoard={setSaveBoardAd}
                onAddBrandToCompetitors={(a) => addBrandToCompetitors.mutate({ name: a.brand, identifier: a.domain })}
                onAddPageToCompetitors={(a) => addPageToCompetitors.mutate({ name: a.pageName, pageId: a.pageId })}
                onFollowBrand={handleFollowBrand}
              />
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
