import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";
import { Compass, SearchX } from "lucide-react";
import { toast } from "sonner";
import type { DateRange } from "react-day-picker";

import { DUMMY_ADS, BRANDS, type InsightAd } from "@/lib/insights-dummy-data";
import { useInsightPreferences } from "@/hooks/use-insight-preferences";
import { useSavedAdIds } from "@/hooks/use-insight-boards";
import { useInsightCompetitors } from "@/hooks/use-insight-competitors";
import { useInsightQueue } from "@/hooks/use-insight-queue";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useMobileSelection } from "@/components/shell/MobileSelectionContext";

import { InsightAdDetailDrawer } from "@/components/insights/InsightAdDetailDrawer";
import { SaveToBoardModal } from "@/components/insights/SaveToBoardModal";
import { OnboardingModal } from "@/components/insights/OnboardingModal";
import { FirstLoginOnboardingModal } from "@/onboarding-demo/FirstLoginOnboardingModal";

import { IndustryInsightsAdsCard } from "@/components/insights-v2/IndustryInsightsAdsCard";
import {
  IndustryInsightsAdsCardGridSkeleton,
  IndustryInsightsAdsCardSkeleton,
} from "@/components/insights-v2/IndustryInsightsAdsCardSkeleton";
import { MasonryGrid } from "@/components/insights-v2/MasonryGrid";
import {
  InsightsV2Toolbar,
  DEFAULT_INSIGHTS_V2_FILTERS,
  DEFAULT_INSIGHTS_V2_DISPLAY_PREFS,
  type InsightsV2Filters,
  type InsightsV2DisplayPrefs,
} from "@/components/insights-v2/InsightsV2Toolbar";
import { MobileInsightsTabs } from "@/components/insights/MobileInsightsTabs";
import { InsightsV2IdentityRow } from "@/components/insights-v2/InsightsV2IdentityRow";
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
  const sortRaw = sp.get("sort");
  const sort: InsightsV2Filters["sort"] =
    sortRaw === "oldest" || sortRaw === "most-active" || sortRaw === "popular"
      ? sortRaw
      : "newest";
  const filters: InsightsV2Filters = {
    search: sp.get("search") ?? "",
    industry: sp.get("industry") ?? "",
    status: sp.get("status") ?? "all",
    adType: sp.get("adType") ?? "",
    runningDays: sp.get("running") ?? "",
    // A-12.180: default is "All time" (undefined) per Maalik. Date range is
    // serialised as ?from=YYYY-MM-DD&to=YYYY-MM-DD so copying the URL
    // captures the user's exact window; reload reconstructs it.
    dateRange: parseDateRange(sp.get("from"), sp.get("to")),
    sort,
  };
  return { filters, selectedTag: sp.get("tag") ?? undefined };
}

function parseDateRange(
  from: string | null,
  to: string | null,
): DateRange | undefined {
  if (!from) return undefined;
  const fromDate = new Date(from);
  if (Number.isNaN(fromDate.getTime())) return undefined;
  if (!to) return { from: fromDate };
  const toDate = new Date(to);
  if (Number.isNaN(toDate.getTime())) return { from: fromDate };
  return { from: fromDate, to: toDate };
}

function formatDateForUrl(d: Date): string {
  // ISO date (YYYY-MM-DD) — URL-safe, sortable, locale-independent.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
  // Date range — serialise as ISO from/to. Omit when undefined (All time).
  if (filters.dateRange?.from) {
    next.set("from", formatDateForUrl(filters.dateRange.from));
    if (filters.dateRange.to) {
      next.set("to", formatDateForUrl(filters.dateRange.to));
    } else {
      next.delete("to");
    }
  } else {
    next.delete("from");
    next.delete("to");
  }
  // sort defaults to "newest" — only serialise when not the default
  if (filters.sort && filters.sort !== "newest") next.set("sort", filters.sort);
  else next.delete("sort");
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

  // Sort — applied last so all filtered results respect the order.
  const sort = filters.sort ?? "newest";
  if (sort === "newest") {
    out = [...out].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  } else if (sort === "oldest") {
    out = [...out].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  } else if (sort === "most-active") {
    out = [...out].sort((a, b) => {
      const ad = parseDurationDays(a.activeDuration) ?? 0;
      const bd = parseDurationDays(b.activeDuration) ?? 0;
      return bd - ad;
    });
  } else if (sort === "popular") {
    out = [...out].sort((a, b) => (b.similarAdsCount ?? 0) - (a.similarAdsCount ?? 0));
  }

  return out;
}

/* ------------------------------------------------------------------ */
/*  Feed page                                                          */
/* ------------------------------------------------------------------ */
function InsightsV2FeedInner({ prefsOpen, onPrefsClose }: InsightsV2FeedProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const forceLoading = searchParams.get("loading") === "1";
  // First-login onboarding wizard. Modal pops over the feed when the URL
  // carries ?onboarding=true (nav-rail Onboarding entry sets this).
  // Closing clears the param so refresh doesn't reopen.
  const showFirstLoginOnboarding = searchParams.get("onboarding") === "true";
  const closeFirstLoginOnboarding = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("onboarding");
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  // Hydrate filters/tag from URL on first render
  const initial = useMemo(() => readFiltersFromSearch(searchParams), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [filters, setFilters] = useState<InsightsV2Filters>(initial.filters);
  const [selectedTag, setSelectedTag] = useState<string | undefined>(initial.selectedTag);
  const [displayPrefs, setDisplayPrefs] = useState<InsightsV2DisplayPrefs>(
    DEFAULT_INSIGHTS_V2_DISPLAY_PREFS,
  );
  const [gridSize, setGridSize] = useState<2 | 3 | 4 | 5>(4);
  // Scroll-driven compact header. When scrollTop > threshold, the toolbar
  // collapses to: Search + applied-filter chips + Date. Everything else
  // (Industry, Sort, Settings, More filters, Trending strip) animates out.
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  // Search input lives in the Identity row (Row 1). State is hoisted here so
  // it stays unchanged across compact-mode toolbar transitions and so the
  // popover anchors against the row's input ref.
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [searchPopoverOpen, setSearchPopoverOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [optimisticBookmarked, setOptimisticBookmarked] = useState<Set<string>>(
    () => new Set(),
  );

  // A-12.179: URL-backed drawer / modal state so deep-link / refresh / back-
  // forward reconstruct the exact open view. `?ad=<id>` for the detail
  // drawer, `?modal=save-to-board&modal-target=<id>` for the SaveToBoard
  // modal, `?modal=settings` for the preferences modal. Drawer/modal
  // writes use { replace: false } so the browser back-button naturally
  // closes them.
  const urlAdId = searchParams.get("ad");
  const urlModal = searchParams.get("modal");
  const urlModalTarget = searchParams.get("modal-target");

  const drawerAd = useMemo<InsightAd | null>(() => {
    if (!urlAdId) return null;
    return DUMMY_ADS.find((a) => a.id === urlAdId) ?? null;
  }, [urlAdId]);

  const saveModalAd = useMemo<InsightAd | null>(() => {
    if (urlModal !== "save-to-board" || !urlModalTarget) return null;
    return DUMMY_ADS.find((a) => a.id === urlModalTarget) ?? null;
  }, [urlModal, urlModalTarget]);

  // `settings` is the toolbar's own value; `prefs` is the alias the Dashboard
  // checklist / sub-nav setup card deep-link with. Treated as an alias at read
  // time rather than rewritten in an effect — a normalising effect loses a
  // same-commit race with the filter->URL sync below, which recomputes from
  // the same stale searchParams closure and puts `prefs` straight back.
  const prefsModalOpen = urlModal === "settings" || urlModal === "prefs";

  // A-12.180: Calendar popover open/close is URL-backed too. Copying a URL
  // while the date picker is open reconstructs that exact view on paste.
  // Shared between the IdentityRow date picker and the Toolbar date picker
  // (only one is mounted at a time depending on scroll state, so no
  // conflict). `?calendar=open` is the contract.
  const calendarOpen = searchParams.get("calendar") === "open";
  const setCalendarOpen = useCallback(
    (open: boolean) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (open) sp.set("calendar", "open");
          else sp.delete("calendar");
          return sp;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  // Deep-link safety: if `?ad=<id>` or save-to-board's modal-target points
  // at a missing ad, silently strip the param. DUMMY_ADS is sync; once
  // this hits a real fetch, gate on a loading flag.
  useEffect(() => {
    if (urlAdId && !DUMMY_ADS.some((a) => a.id === urlAdId)) {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          sp.delete("ad");
          return sp;
        },
        { replace: true },
      );
    }
  }, [urlAdId, setSearchParams]);

  useEffect(() => {
    if (
      urlModal === "save-to-board" &&
      urlModalTarget &&
      !DUMMY_ADS.some((a) => a.id === urlModalTarget)
    ) {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          sp.delete("modal");
          sp.delete("modal-target");
          return sp;
        },
        { replace: true },
      );
    }
  }, [urlModal, urlModalTarget, setSearchParams]);

  const setDrawerAd = useCallback(
    (ad: InsightAd | null) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (ad) sp.set("ad", ad.id);
          else sp.delete("ad");
          return sp;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  const setSaveModalAd = useCallback(
    (ad: InsightAd | null) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (ad) {
            sp.set("modal", "save-to-board");
            sp.set("modal-target", ad.id);
          } else if (sp.get("modal") === "save-to-board") {
            sp.delete("modal");
            sp.delete("modal-target");
          }
          return sp;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  const setPrefsModalOpen = useCallback(
    (open: boolean) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (open) sp.set("modal", "settings");
          else if (sp.get("modal") === "settings" || sp.get("modal") === "prefs")
            sp.delete("modal");
          return sp;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

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

  // Mobile bulk select (spec B §1.1 item 6 / §2.2). The feed OWNS the
  // selection — it's the only surface with checkboxes to toggle — and feeds
  // it into the shared context so the shell's MobileTabBar (a sibling, not
  // an ancestor/descendant of this page — see MobileSelectionContext.tsx's
  // header comment) can swap its tab row for a bulk action row. Reading the
  // context here does not add or move the page's `<Outlet/>` and cannot
  // remount this component (INV-1) — it's a plain `useContext` read.
  const {
    selectedIds: mobileSelectedIds,
    toggleSelected: toggleMobileSelected,
    clearSelection: clearMobileSelection,
    registerBulkHandlers,
  } = useMobileSelection();
  const selectedAdIdSet = useMemo(
    () => new Set(mobileSelectedIds),
    [mobileSelectedIds],
  );
  const handleSelectToggle = useCallback(
    (ad: InsightAd) => toggleMobileSelected(ad.id),
    [toggleMobileSelected],
  );

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

  const handleOpenSaveModal = useCallback((ad: InsightAd) => {
    setOptimisticBookmarked((prev) => {
      if (prev.has(ad.id)) return prev;
      const next = new Set(prev);
      next.add(ad.id);
      return next;
    });
    setSaveModalAd(ad);
  }, []);

  /* ----- mobile bulk ops (spec B §2.2) -----
   * Exactly two, registered below: "Add to board" and "Save ads". Both are
   * wired to the SAME single-ad handlers/mutations the card already uses —
   * per the assignment, this file doesn't invent a second save pathway, it
   * applies the existing one across `selectedIds`.
   *
   * "Add to board" has no bulk-capable UI to call into: SaveToBoardModal's
   * `ad` prop is a single `InsightAd`, and teaching it a multi-ad shape is
   * that file's change, not this one's. Instead this replays the exact
   * single-ad flow (`handleOpenSaveModal`) once per selected ad — a small
   * queue that opens the next ad the moment the current one's modal closes,
   * whether that close was a Save or a Cancel. Cancelling a step just skips
   * that ad; it does not abort the run. `handleSaveModalClose` below is
   * where the queue actually advances.
   */
  const [bulkBoardQueue, setBulkBoardQueue] = useState<string[]>([]);
  const [bulkBoardActive, setBulkBoardActive] = useState(false);

  const openNextBulkBoardAd = useCallback(
    (queue: string[]) => {
      const nextId = queue.find((id) => DUMMY_ADS.some((a) => a.id === id));
      if (!nextId) {
        // Queue exhausted (or every id left in it was stale) — the run is
        // over: close the modal for good and drop out of selection mode so
        // the tab bar swaps back to its normal tabs.
        setBulkBoardQueue([]);
        setBulkBoardActive(false);
        setSaveModalAd(null);
        clearMobileSelection();
        return;
      }
      const nextAd = DUMMY_ADS.find((a) => a.id === nextId) as InsightAd;
      setBulkBoardQueue(queue.slice(queue.indexOf(nextId) + 1));
      handleOpenSaveModal(nextAd);
    },
    [clearMobileSelection, handleOpenSaveModal, setSaveModalAd],
  );

  const handleBulkAddToBoard = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      setBulkBoardActive(true);
      openNextBulkBoardAd(ids);
    },
    [openNextBulkBoardAd],
  );

  // "Save ads" — fires the same mutation `handleSaveAd` uses, once per
  // selected ad, but with ONE aggregate toast instead of N. Looping
  // `handleSaveAd` itself would fire one toast per ad, which is fine at
  // count=1 but is a real stress-test failure at count=1000 (CLAUDE.md
  // §"Stress test") — a wall of stacked toasts, not useful feedback.
  const handleBulkSaveAds = useCallback(
    async (ids: string[]) => {
      const ads = ids
        .map((id) => DUMMY_ADS.find((a) => a.id === id))
        .filter((a): a is InsightAd => !!a);
      // Selection clears immediately — the mutation is fire-and-forget from
      // the user's POV (matches the single-ad Save button, which never
      // blocks on the network either). The tab bar swaps back to its normal
      // tabs right away instead of sitting on a "3 selected" bar for the
      // duration of N in-flight requests.
      clearMobileSelection();
      if (ads.length === 0) return;
      const results = await Promise.allSettled(
        ads.map((ad) =>
          addToQueue.mutateAsync({ source_ad_id: ad.id, action_type: "save" }),
        ),
      );
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.length - succeeded;
      if (failed === 0) {
        toast.success(`Saved ${succeeded} ad${succeeded === 1 ? "" : "s"}`);
      } else if (succeeded === 0) {
        toast.error("Could not save ads");
      } else {
        toast.success(`Saved ${succeeded} of ${results.length} ads`);
      }
    },
    [addToQueue, clearMobileSelection],
  );

  // Registered once per identity change, not once ever — `registerBulkHandlers`
  // merges, so re-running this on every render (whenever the callbacks above
  // pick up a new dependency) is safe and keeps the bound `run()` closures in
  // MobileSelectionContext current.
  useEffect(() => {
    registerBulkHandlers({
      "add-to-board": handleBulkAddToBoard,
      "save-ads": handleBulkSaveAds,
    });
  }, [registerBulkHandlers, handleBulkAddToBoard, handleBulkSaveAds]);

  const handleSaveModalClose = useCallback(() => {
    const closingAd = saveModalAd;
    if (closingAd) {
      setOptimisticBookmarked((prev) => {
        if (!prev.has(closingAd.id)) return prev;
        const next = new Set(prev);
        next.delete(closingAd.id);
        return next;
      });
    }
    if (bulkBoardActive) {
      // This close is one step of the bulk "Add to board" run, not the end
      // of it — advance to the next selected ad. `openNextBulkBoardAd`
      // itself closes the modal and exits selection mode once the queue is
      // exhausted, so there is no `setSaveModalAd(null)` on this branch.
      openNextBulkBoardAd(bulkBoardQueue);
    } else {
      setSaveModalAd(null);
    }
  }, [saveModalAd, bulkBoardActive, bulkBoardQueue, openNextBulkBoardAd, setSaveModalAd]);

  // Safety net for the bulk "Add to board" queue: if the modal closes some
  // way other than its own Cancel/Save (e.g. a browser back-button pop
  // that clears `?modal=save-to-board` straight from the URL, bypassing
  // `handleSaveModalClose` entirely), `bulkBoardActive` would otherwise be
  // left stuck `true` — and the NEXT time any card opens the (single-ad)
  // save modal, closing it would wrongly try to resume a stale queue. This
  // only fires on that external-close path: on the queue's own natural
  // completion, `openNextBulkBoardAd` already sets `bulkBoardActive` false
  // in the same render as `setSaveModalAd(null)`, so the condition below is
  // already false by the time this effect re-runs.
  useEffect(() => {
    if (!saveModalAd && bulkBoardActive) {
      setBulkBoardActive(false);
      setBulkBoardQueue([]);
    }
  }, [saveModalAd, bulkBoardActive]);

  // Clear optimistic markers once the real savedAdIds query reflects the save,
  // so the fill state is now driven by the authoritative source.
  useEffect(() => {
    if (optimisticBookmarked.size === 0) return;
    setOptimisticBookmarked((prev) => {
      let changed = false;
      const next = new Set(prev);
      prev.forEach((id) => {
        if (savedAdIds.has(id)) {
          next.delete(id);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [savedAdIds, optimisticBookmarked.size]);

  const handleCopyLink = useCallback((ad: InsightAd) => {
    const url = `${window.location.origin}/insights/discover?ad=${ad.id}`;
    if (navigator.clipboard?.writeText) {
      // Awaited: a rejected write must not still toast success (observed
      // live — NotAllowedError with "Link copied" still on screen).
      navigator.clipboard.writeText(url).then(
        () => toast.success("Link copied"),
        () => toast.error("Could not copy link"),
      );
    } else {
      toast.error("Clipboard unavailable");
    }
  }, []);

  /* ----- loading state ----- */
  const isLoading = forceLoading || prefsLoading;
  // Used only to decide which "no ads" empty-state copy to show.
  // The actual modal NO LONGER auto-opens here — Maalik found it
  // intrusive on every navigation. Now opens only via the Settings
  // popover in the toolbar.
  const hasUnsetPreferences =
    !prefsLoading && !preferences?.onboarded;

  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_INSIGHTS_V2_FILTERS);
    setSelectedTag(undefined);
  }, []);

  const handleRefresh = useCallback(() => {
    setPage(1);
  }, []);

  // Scroll-driven compact header. When the scroll container passes ~80px,
  // we set isScrolled=true and the toolbar + trending strip collapse via
  // CSS transitions on their parent's data-attr / className.
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setIsScrolled(el.scrollTop > 80);
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const handleSearchChange = useCallback(
    (next: string) => {
      setFilters((prev) => ({ ...prev, search: next }));
      setSearchPopoverOpen(next.trim().length > 0);
    },
    [],
  );

  const handleSearchFocus = useCallback(() => {
    if (filters.search.trim().length > 0) {
      setSearchPopoverOpen(true);
    }
  }, [filters.search]);

  const handleApplySearchHere = useCallback((q: string) => {
    setFilters((prev) => ({ ...prev, search: q }));
  }, []);

  return (
    <div className="flex h-full flex-col bg-muted/30">
      {/* MOBILE ROW 0 — surface toggle (My feeds · Discover · Saved Ads).
           Above the collapsing identity row so it stays put while that
           collapses on scroll: it is navigation, and navigation must not
           disappear as you read. md:hidden — desktop has the sub-nav.
           F3/mobile-Figma-sync: with the identity row now `hidden` below md
           (see InsightsV2IdentityRow) and MobileTopBar suppressed on this
           allowlisted route, this is the first thing painted on the mobile
           screen — `pt-2` is deliberate breathing room under the status bar,
           not a leftover. Don't read the lack of extra top padding here as a
           bug; the identity-row wrapper below contributes 0px on mobile now
           (its child is `display:none`), so there's no dead gap to close. */}
      {/* `pb-1` + `relative z-30`: MobileInsightsTabs paints a 36px track but
           each segment's real hit box is 44px (INV-10), so the links overflow
           the track by 4px top and bottom. The toolbar row below is
           `sticky top-0 z-20`, which is a stacking context that was winning
           hit-testing over that overflow and clipping each segment's effective
           tap target to ~34px. `pb-1` moves the toolbar's box clear of the
           overflow and `z-30` puts the segments above it regardless, so the
           full 44px is tappable. The 4px the segments now overhang is the
           toolbar's own padding — nothing interactive lives there (the search
           input starts exactly where the segments end). This whole wrapper is
           `md:hidden`, so none of it can touch desktop. */}
      <div className="relative z-30 shrink-0 bg-background px-3 pt-2 pb-1 md:hidden">
        <MobileInsightsTabs />
      </div>
      {/* ROW 1 — Identity: section label + ad count chip + Date picker.
           Collapses entirely on scroll via grid-rows transition; the date
           picker re-appears in the Toolbar (Row 2). Below md, InsightsV2IdentityRow
           renders `hidden` regardless of scroll state (F3) — this grid-rows
           wrapper still animates on desktop only, on mobile it just carries
           zero-height content through in both scroll states. */}
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          isScrolled ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
        )}
        aria-hidden={isScrolled}
      >
        <div className="overflow-hidden">
          <InsightsV2IdentityRow
            sectionLabel="My feeds"
            adCount={filtered.length}
            brandsFollowed={Math.max(followedBrands.length, 28)}
            followedBrandNames={followedBrands}
            allBrands={[...BRANDS]}
            onToggleBrand={(brand) => toggleFollowBrand.mutate(brand)}
            dateRange={filters.dateRange}
            onDateRangeChange={(r) => setFilters((prev) => ({ ...prev, dateRange: r }))}
            dateRangeOpen={calendarOpen}
            onDateRangeOpenChange={setCalendarOpen}
          />
        </div>
      </div>
      {/* ROW 2 — Filter actions: Search + chips · (Date on scroll) · Filters + Sort + Settings */}
      <InsightsV2Toolbar
        filters={filters}
        onFiltersChange={setFilters}
        onRefresh={handleRefresh}
        displayPrefs={displayPrefs}
        onDisplayPrefsChange={setDisplayPrefs}
        compact={isScrolled}
        onClearTag={() => setSelectedTag(undefined)}
        selectedTag={selectedTag}
        searchInputRef={searchInputRef}
        searchPopoverOpen={searchPopoverOpen}
        onSearchPopoverOpenChange={setSearchPopoverOpen}
        onSearchChange={handleSearchChange}
        onSearchFocus={handleSearchFocus}
        onApplySearchHere={handleApplySearchHere}
        onDateRangeChange={(r) => setFilters((prev) => ({ ...prev, dateRange: r }))}
        dateRangeOpen={calendarOpen}
        onDateRangeOpenChange={setCalendarOpen}
        onEditPreferences={() => setPrefsModalOpen(true)}
      />
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          isScrolled ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
        )}
        aria-hidden={isScrolled}
      >
        <div className="overflow-hidden">
          <TrendingTagsStrip selectedTag={selectedTag} onSelectTag={setSelectedTag} />
        </div>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-3 bg-muted/30">
        {isLoading ? (
          <IndustryInsightsAdsCardGridSkeleton count={10} />
        ) : visibleAds.length === 0 ? (
          hasUnsetPreferences ? (
            <InsightsV2EmptyState
              icon={Compass}
              title="Set your preferences"
              description="Pick the industries and brands you care about to personalise this feed."
              cta={{
                label: "Set preferences",
                onClick: () => setPrefsModalOpen(true),
                variant: "default",
              }}
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
                  isSavedToBoard={
                    savedAdIds.has(ad.id) || optimisticBookmarked.has(ad.id)
                  }
                  isFollowedBrand={followedBrands.includes(ad.brand)}
                  display={displayPrefs}
                  onSaveToBoard={handleOpenSaveModal}
                  onUnsaveFromBoard={handleOpenSaveModal}
                  onViewDetail={setDrawerAd}
                  onAddBrandToCompetitors={handleAddBrandCompetitor}
                  onAddPageToCompetitors={handleAddPageCompetitor}
                  onFollowBrand={handleFollowBrand}
                  onSaveAd={handleSaveAd}
                  onCopyLink={handleCopyLink}
                  // Bulk select (spec B §1.1 item 6 / §2.2) — the checkbox
                  // itself and its breakpoint-specific chrome live in this
                  // card component (not owned by this file); this feed only
                  // supplies the real selection data and toggle so it works
                  // the moment that chrome allows it to render on mobile too.
                  selectable
                  isSelected={selectedAdIdSet.has(ad.id)}
                  onSelectToggle={handleSelectToggle}
                />
              ))}
            </MasonryGrid>
            {hasMore && (
              <div className="mt-3">
                <MasonryGrid gridSize={gridSize}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <IndustryInsightsAdsCardSkeleton key={`load-more-skeleton-${i}`} />
                  ))}
                </MasonryGrid>
              </div>
            )}
            <div
              ref={sentinelRef}
              className="h-12 flex items-center justify-center"
            >
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
        onSaveToBoard={handleOpenSaveModal}
        onSelectAd={setDrawerAd}
      />
      <SaveToBoardModal
        ad={saveModalAd}
        open={!!saveModalAd}
        onClose={handleSaveModalClose}
      />
      {/* Industries / interests / brands preference modal.
          Opens manually from the toolbar Settings popover via
          onEditPreferences (sets prefsModalOpen=true) OR via the
          prefsOpen prop passed in by a parent. Auto-open on first
          visit was removed — Maalik found the popup intrusive on
          every navigation to feed. */}
      <OnboardingModal
        open={prefsModalOpen || !!prefsOpen}
        onClose={() => {
          setPrefsModalOpen(false);
          onPrefsClose?.();
        }}
        initialIndustries={
          prefsModalOpen || prefsOpen
            ? preferences?.industries ?? undefined
            : undefined
        }
        initialInterests={
          prefsModalOpen || prefsOpen
            ? preferences?.interests ?? undefined
            : undefined
        }
        initialBrands={
          prefsModalOpen || prefsOpen ? followedBrands : undefined
        }
      />

      {/* First-login wizard demo — ported from ff.ai. Renders over the
          feed when ?onboarding=true is in the URL. Forced flow — can only
          be dismissed by completing or Skip / Sign in. */}
      <FirstLoginOnboardingModal
        open={showFirstLoginOnboarding}
        onComplete={closeFirstLoginOnboarding}
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
