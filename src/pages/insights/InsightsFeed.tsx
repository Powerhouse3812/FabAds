import { useState, useRef } from "react";
import { DUMMY_ADS } from "@/lib/insights-dummy-data";
import { InsightAdCard } from "@/components/insights/InsightAdCard";
import { InsightsFilterBar, DEFAULT_FILTERS, type InsightsFilters } from "@/components/insights/InsightsFilterBar";
import { InsightsPagination } from "@/components/insights/InsightsPagination";
import { InsightAdDetailDrawer } from "@/components/insights/InsightAdDetailDrawer";
import { SaveToBoardModal } from "@/components/insights/SaveToBoardModal";
import { OnboardingModal } from "@/components/insights/OnboardingModal";
import { useInsightPreferences } from "@/hooks/use-insight-preferences";
import { useSavedAdIds } from "@/hooks/use-insight-boards";
import { useInsightCompetitors } from "@/hooks/use-insight-competitors";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { toast } from "sonner";
import type { InsightAd } from "@/lib/insights-dummy-data";

interface InsightsFeedProps {
  prefsOpen?: boolean;
  onPrefsClose?: () => void;
}

export default function InsightsFeed({ prefsOpen, onPrefsClose }: InsightsFeedProps) {
  const { preferences, isLoading, followedBrands, toggleFollowBrand } = useInsightPreferences();
  const { data: savedAdIds } = useSavedAdIds();
  const { addBrandToCompetitors, addPageToCompetitors } = useInsightCompetitors();
  const [filters, setFilters] = useState<InsightsFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [detailAd, setDetailAd] = useState<InsightAd | null>(null);
  const [saveBoardAd, setSaveBoardAd] = useState<InsightAd | null>(null);
  const dismissedAutoModal = useRef(false);

  const showOnboarding = !isLoading && !preferences?.onboarded && !dismissedAutoModal.current;

  let ads = DUMMY_ADS;
  // Filter by industries OR followed brands
  if (preferences?.industries?.length || followedBrands.length) {
    ads = ads.filter((a) => {
      const matchesIndustry = preferences?.industries?.length ? preferences.industries.includes(a.industry) : false;
      const matchesBrand = followedBrands.includes(a.brand);
      return matchesIndustry || matchesBrand;
    });
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    ads = ads.filter((a) => a.pageName.toLowerCase().includes(q) || a.headline.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q)));
  }
  if (filters.industry) ads = ads.filter((a) => a.industry === filters.industry);
  if (filters.platform) ads = ads.filter((a) => a.platforms.includes(filters.platform as any));
  if (filters.status) ads = ads.filter((a) => a.status === filters.status);

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

  return (
    <div className="space-y-3 h-full flex flex-col overflow-x-hidden w-full max-w-full">
      <InsightsFilterBar filters={filters} onChange={setFilters} showTrending />
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Search className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">{showOnboarding ? "Set up your preferences to see personalized ads." : "No ads match your filters."}</p>
            {!showOnboarding && (
              <Button variant="outline" size="sm" onClick={() => setFilters(DEFAULT_FILTERS)}>Clear filters</Button>
            )}
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
      <OnboardingModal
        open={showOnboarding || !!prefsOpen}
        onClose={() => { dismissedAutoModal.current = true; onPrefsClose?.(); }}
        initialIndustries={prefsOpen ? preferences?.industries ?? undefined : undefined}
        initialInterests={prefsOpen ? preferences?.interests ?? undefined : undefined}
        initialBrands={prefsOpen ? followedBrands : undefined}
      />
    </div>
  );
}
