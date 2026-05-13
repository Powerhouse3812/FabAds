import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Compass, SearchX } from "lucide-react";
import { toast } from "sonner";
import type { DateRange } from "react-day-picker";

import { DUMMY_ADS, type InsightAd } from "@/lib/insights-dummy-data";
import { useInsightPreferences } from "@/hooks/use-insight-preferences";
import { useSavedAdIds } from "@/hooks/use-insight-boards";
import { useInsightCompetitors } from "@/hooks/use-insight-competitors";
import { useInsightQueue } from "@/hooks/use-insight-queue";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";

import { InsightAdDetailDrawer } from "@/components/insights/InsightAdDetailDrawer";
import { SaveToBoardModal } from "@/components/insights/SaveToBoardModal";
import { OnboardingModal } from "@/components/insights/OnboardingModal";

import { IndustryInsightsAdsCard } from "@/components/insights-v2/IndustryInsightsAdsCard";
import { IndustryInsightsAdsCardGridSkeleton } from "@/components/insights-v2/IndustryInsightsAdsCardSkeleton";
import { MasonryGrid } from "@/components/insights-v2/MasonryGrid";
import {
  InsightsV2Toolbar,
  DEFAULT_INSIGHTS_V2_FILTERS,
  type InsightsV2Filters,
} from "@/components/insights-v2/InsightsV2Toolbar";
import { InsightsV2PageHeader } from "@/components/insights-v2/InsightsV2PageHeader";
import { TrendingTagsStrip } from "@/components/insights-v2/TrendingTagsStrip";
import { InsightsV2EmptyState } from "@/components/insights-v2/InsightsV2EmptyState";
import { InsightsV2ErrorBoundary } from "@/components/insights-v2/InsightsV2ErrorBoundary";

const PAGE_SIZE = 20;

interface InsightsV2FeedProps {
  prefsOpen?: boolean;
  onPrefsClose?: () => void;
}

/* ------------------------------------------------------------------ */
/*  URL <-> filter helpers                                             */
/* ------------------------------------------------------------------ */
function readFiltersFromSearch(sp: URLSearchParams): {
  filters: InsightsV2Filters;
  selectedTag: string | undefined;
} {
  const filters: InsightsV2Filters = {
    search: sp.get("search") ?? "",
    industry: sp.get("industry") ?? "",
    status: sp.get("status") ?? "all",
    adType: sp.get("adType") ?? "",
    runningDays: sp.get("running") ?? "",
    metaOnly: sp.get("metaOnly") === "1" ? true : sp.get("metaOnly") === "0" ? false : DEFAULT_INSIGHTS_V2_FILTERS.metaOnly,
  };
  return { filters, selectedTag: sp.get("tag") ?? undefined };
}

function writeFiltersToSearch(
  filters: InsightsV2Filters,
  selectedTag: string | undefined,
  existing: URLSearchParams,
): URLSearchParams {
  const next = new URLSearchParams(existing);
  const setOrDel = (k: string, v: string | undefined | null) => {
    if (v === undefined || v === null || v === "") next.delete(k);
    else next.set(k, v);
  };
  setOrDel("search", filters.search);
  setOrDel("industry", filters.industry);
  setOrDel("status", filters.status === "all" ? "" : filters.status);
  setOrDel("adType", filters.adType);
  setOrDel("running", filters.runningDays);
  setOrDel("tag", selectedTag);
  // metaOnly defaults true — only serialise when off, so URL stays clean
  if (filters.metaOnly === false) next.set("metaOnly", "0");
  else next.delete("metaOnly");
  return next;
}

/* ------------------------------------------------------------------ */
/*  Pure filter pipeline                                               */
/* ------------------------------------------------------------------ */
function parseDurationDays(raw: string | undefined): number | null {
  if (!raw) return null;
  const m = raw.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function inRunningRange(days: number, bucket: string): boolean {
  switch (bucket) {
    case "1-7":
      return days >= 1 && days <= 7;
    case "8-30":
      return days >= 8 && days <= 30;
    case "31-90":
      return days >= 31 && days <= 90;
    case "90+":
      return days > 90;
    case "all":
    case "":
      return true;
    default:
      return true;
  }
}

function dateInRange(iso: string, range: DateRange | undefined): boolean {
  if (!range?.from) return true;
  const t = new Date(iso).getTime();
  const from = range.from.getTime();
  const to = (range.to ?? range.from).getTime() + 24 * 60 * 60 * 1000 - 1;
  return t >= from && t <= to;
}

interface ApplyFiltersArgs {
  ads: InsightAd[];
  filters: InsightsV2Filters;
  selectedTag: string | undefined;
  preferenceIndustries: string[];
  followedBrands: string[];
}

function applyFilters({
  ads,
  filters,
  selectedTag,
  preferenceIndustries,
  followedBrands,
}: ApplyFiltersArgs): InsightAd[] {
  let out = ads;

  // Personalisation gate (matches existing InsightsFeed semantics)
  if (preferenceIndustries.length || followedBrands.length) {
    out = out.filter((a) => {
      const matchesIndustry = preferenceIndustries.length
        ? preferenceIndustries.includes(a.industry)
        : false;
      const matchesBrand = followedBrands.includes(a.brand);
      return matchesIndustry || matchesBrand;
    });
  }

  if (filters.industry) {
    out = out.filter((a) => a.industry === filters.industry);
  }
  if (filters.status && filters.status !== "all") {
    out = out.filter((a) => a.status === filters.status);
  }
  if (filters.adType && filters.adType !== "all") {
    const t = filters.adType.toLowerCase();
    out = out.filter((a) => a.adType.toLowerCase() === t);
  }
  if (filters.runningDays && filters.runningDays !== "all") {
    out = out.filter((a) => {
      const days = parseDurationDays(a.activeDuration);
      return days !== null && inRunningRange(days, filters.runningDays);
    });
  }
  if (filters.metaOnly) {
    out = out.filter((a) => a.platforms.includes("Meta"));
  }
  if (filters.dateRange?.from) {
    out = out.filter((a) => dateInRange(a.createdAt, filters.dateRange));
  }
  if (filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    out = out.filter((a) =>
      [a.brand, a.headline, a.description, a.primaryText, a.pageName]
        .filter(Boolean)
        .some((s) => s.toLowerCase().includes(q))
    );
  }
  if (selectedTag) {
    out = out.filter((a) => a.tags.includes(selectedTag));
  }

  return out;
}

/* ------------------------------------------------------------------ */
/*  Feed page                                                          */
/* ------------------------------------------------------------------ */
function InsightsV2FeedInner({ prefsOpen, onPrefsClose }: InsightsV2FeedProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const forceLoading = searchParams.get("loading") === "1";

  // Hydrate filters/tag from URL on first render
  const initial = useMemo(() => readFiltersFromSearch(searchParams), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [filters, setFilters] = useState<InsightsV2Filters>(initial.filters);
  const [selectedTag, setSelectedTag] = useState<string | undefined>(initial.selectedTag);
  const [gridSize, setGridSize] = useState<2 | 3 | 4 | 5>(4);
  const [page, setPage] = useState(1);
  const [drawerAd, setDrawerAd] = useState<InsightAd | null>(null);
  const [saveModalAd, setSaveModalAd] = useState<InsightAd | null>(null);
  const dismissedAutoModal = useRef(false);

  // Sync filter/tag state -> URL (replace so back-button isn't spammed)
  useEffect(() => {
    setSearchParams(
      (prev) => writeFiltersToSearch(filters, selectedTag, prev),
      { replace: true },
    );
  }, [filters, selectedTag, setSearchParams]);

  // Reset pagination whenever filter inputs change
  useEffect(() => {
    setPage(1);
  }, [filters, selectedTag]);

  // Data + actions
  const {
    preferences,
    isLoading: prefsLoading,
    followedBrands,
    toggleFollowBrand,
  } = useInsightPreferences();
  const { data: savedAdIdMap } = useSavedAdIds();
  const { addBrandToCompetitors, addPageToCompetitors } = useInsightCompetitors();
  const { addToQueue } = useInsightQueue();

  const savedAdIds = useMemo<Set<string>>(() => {
    if (!(savedAdIdMap instanceof Map)) return new Set();
    return new Set(Array.from(savedAdIdMap.keys()));
  }, [savedAdIdMap]);

  const preferenceIndustries = (preferences?.industries ?? []) as string[];

  // Filter + paginate
  const filtered = useMemo(
    () =>
      applyFilters({
        ads: DUMMY_ADS,
        filters,
        selectedTag,
        preferenceIndustries,
        followedBrands,
      }),
    [filters, selectedTag, preferenceIndustries, followedBrands],
  );
  const visibleAds = useMemo(
    () => filtered.slice(0, page * PAGE_SIZE),
    [filtered, page],
  );
  const hasMore = visibleAds.length < filtered.length;

  const handleLoadMore = useCallback(() => {
    setPage((p) => p + 1);
  }, []);
  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: false,
    onLoadMore: handleLoadMore,
  });

  /* ----- action wiring ----- */
  const handleFollowBrand = useCallback(
    (ad: InsightAd) => {
      toggleFollowBrand.mutate(ad.brand, {
        onSuccess: () => {
          const wasFollowing = followedBrands.includes(ad.brand);
          toast.success(wasFollowing ? `Unfollowed ${ad.brand}` : `Following ${ad.brand}`);
        },
      });
    },
    [toggleFollowBrand, followedBrands],
  );

  const handleAddBrandCompetitor = useCallback(
    (ad: InsightAd) => {
      addBrandToCompetitors.mutate({ name: ad.brand, identifier: ad.domain });
    },
    [addBrandToCompetitors],
  );

  const handleAddPageCompetitor = useCallback(
    (ad: InsightAd) => {
      addPageToCompetitors.mutate({ name: ad.pageName, pageId: ad.pageId });
    },
    [addPageToCompetitors],
  );

  const handleSaveAd = useCallback(
    (ad: InsightAd) => {
      addToQueue.mutate(
        { source_ad_id: ad.id, action_type: "save" },
        {
          onSuccess: () => toast.success(`Saved ${ad.brand}`),
          onError: () => toast.error("Could not save ad"),
        },
      );
    },
    [addToQueue],
  );

  const handleCopyLink = useCallback((ad: InsightAd) => {
    const url = `${window.location.origin}/insights/discover?ad=${ad.id}`;
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } else {
      toast.error("Clipboard unavailable");
    }
  }, []);

  /* ----- onboarding gate (mirrors InsightsFeed.tsx) ----- */
  const isLoading = forceLoading || prefsLoading;
  const showOnboarding =
    !prefsLoading && !preferences?.onboarded && !dismissedAutoModal.current;

  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_INSIGHTS_V2_FILTERS);
    setSelectedTag(undefined);
  }, []);

  const handleRefresh = useCallback(() => {
    setPage(1);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <InsightsV2PageHeader
        sectionLabel="Intelligence"
        metaOnly={filters.metaOnly}
        onMetaOnlyChange={(v) => setFilters({ ...filters, metaOnly: v })}
        dateRange={filters.dateRange}
        onDateRangeChange={(r) => setFilters({ ...filters, dateRange: r })}
      />
      <InsightsV2Toolbar
        filters={filters}
        onFiltersChange={setFilters}
        gridSize={gridSize}
        onGridSizeChange={setGridSize}
        onRefresh={handleRefresh}
      />
      <TrendingTagsStrip selectedTag={selectedTag} onSelectTag={setSelectedTag} />

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-2">
        {isLoading ? (
          <IndustryInsightsAdsCardGridSkeleton count={10} />
        ) : visibleAds.length === 0 ? (
          showOnboarding ? (
            <InsightsV2EmptyState
              icon={Compass}
              title="Set your preferences"
              description="Pick the industries and brands you care about — we'll surface the ads that matter."
            />
          ) : (
            <InsightsV2EmptyState
              icon={SearchX}
              title="No ads match these filters"
              description="Try clearing one or more filters to see more results."
              cta={{ label: "Clear filters", onClick: handleClearFilters }}
            />
          )
        ) : (
          <>
            <MasonryGrid gridSize={gridSize}>
              {visibleAds.map((ad) => (
                <IndustryInsightsAdsCard
                  key={ad.id}
                  ad={ad}
                  savedCount={savedAdIdMap instanceof Map ? savedAdIdMap.get(ad.id) ?? 0 : 0}
                  isSavedToBoard={savedAdIds.has(ad.id)}
                  isFollowedBrand={followedBrands.includes(ad.brand)}
                  onSaveToBoard={setSaveModalAd}
                  onUnsaveFromBoard={setSaveModalAd}
                  onViewDetail={setDrawerAd}
                  onAddBrandToCompetitors={handleAddBrandCompetitor}
                  onAddPageToCompetitors={handleAddPageCompetitor}
                  onFollowBrand={handleFollowBrand}
                  onSaveAd={handleSaveAd}
                  onCopyLink={handleCopyLink}
                />
              ))}
            </MasonryGrid>
            <div
              ref={sentinelRef}
              className="h-12 flex items-center justify-center"
            >
              {hasMore && (
                <span className="font-mono text-[11px] text-muted-foreground">
                  Loading more…
                </span>
              )}
              {!hasMore && visibleAds.length > 0 && (
                <span className="font-mono text-[11px] text-muted-foreground/60">
                  You've reached the end
                </span>
              )}
            </div>
          </>
        )}
      </div>

      <InsightAdDetailDrawer
        ad={drawerAd}
        open={!!drawerAd}
        onClose={() => setDrawerAd(null)}
        onSaveToBoard={setSaveModalAd}
      />
      <SaveToBoardModal
        ad={saveModalAd}
        open={!!saveModalAd}
        onClose={() => setSaveModalAd(null)}
      />
      <OnboardingModal
        open={showOnboarding || !!prefsOpen}
        onClose={() => {
          dismissedAutoModal.current = true;
          onPrefsClose?.();
        }}
        initialIndustries={prefsOpen ? preferences?.industries ?? undefined : undefined}
        initialInterests={prefsOpen ? preferences?.interests ?? undefined : undefined}
        initialBrands={prefsOpen ? followedBrands : undefined}
      />
    </div>
  );
}

export default function InsightsV2Feed(props: InsightsV2FeedProps) {
  return (
    <InsightsV2ErrorBoundary surfaceLabel="feed">
      <InsightsV2FeedInner {...props} />
    </InsightsV2ErrorBoundary>
  );
}
