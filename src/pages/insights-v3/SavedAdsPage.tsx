/**
 * Industry Insights V2 · Saved Ads. Ads only (saved elements live in boards).
 * Scope bar filters the saved set and every count comes from it. Opening an ad
 * opens the same drawer as everywhere else.
 */
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Bookmark, BookmarkX, SearchX } from "lucide-react";
import { toast } from "sonner";
import { MODULE_NOW, getAd } from "@/lib/insights-v3/data";
import { adsInScope, categoryOptions, industryOptions, sortAds } from "@/lib/insights-v3/selectors";
import { saveAd, unsaveAd, useSavedAds } from "@/lib/insights-v3/stores";
import {
  ALL,
  AD_SORT_LABEL,
  DEFAULT_SCOPE,
  INSIGHTS_ROUTES,
  PERIOD_OPTIONS,
  QP,
  type Ad,
  type AdSort,
  type PeriodKey,
  type Scope,
} from "@/lib/insights-v3/types";
import { InsightsOverlayHost } from "@/components/insights-v3/InsightsOverlayHost";
import { AdCard } from "@/components/insights-v3/ad-card/AdCard";
import { relativeTime } from "@/components/insights-v3/boards/boardUtils";
import {
  EmptyState,
  GridSkeleton,
  Hint,
  InsightsPageLayout,
  ScopeBar,
  SortControl,
  fmtInt,
  useAdDrawer,
  useInsightsScope,
  useListSort,
} from "@/components/insights-v3/shared";
import { InsightsSearch } from "@/components/insights-v3/search/InsightsSearch";

const AD_SORTS = Object.keys(AD_SORT_LABEL) as AdSort[];
const GRID = "grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] items-start gap-3";

export default function SavedAdsPage() {
  const [searchParams] = useSearchParams();
  const forced = searchParams.get(QP.state);
  const entries = useSavedAds();
  const [scope, setScope] = useInsightsScope();
  const [sort, setSort] = useListSort<AdSort>(AD_SORTS, "newest");
  const drawer = useAdDrawer();

  // "My preferences only" is Discover-only; never applies to saved ads.
  const effective: Scope = useMemo(() => ({ ...scope, myPrefsOnly: false }), [scope]);

  // The saved set. Entries whose ad no longer exists are dropped silently.
  const saved = useMemo(() => {
    if (forced === "empty") return [] as Ad[];
    return entries.map((e) => getAd(e.adId)).filter((a): a is Ad => !!a);
  }, [entries, forced]);
  const savedAtById = useMemo(() => new Map(entries.map((e) => [e.adId, e.savedAt])), [entries]);

  const opts = { now: MODULE_NOW };
  const scoped = useMemo(() => adsInScope(saved, effective, opts), [saved, effective]); // eslint-disable-line react-hooks/exhaustive-deps
  const sorted = useMemo(() => sortAds(scoped, sort), [scoped, sort]);

  const industries = useMemo(
    () => industryOptions(saved, effective, opts).filter((o) => o.id !== ALL),
    [saved, effective], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const categories = useMemo(
    () => categoryOptions(saved, effective, opts).filter((o) => o.id !== ALL),
    [saved, effective], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const periodCounts = useMemo(() => {
    const out: Partial<Record<PeriodKey, number>> = {};
    for (const p of PERIOD_OPTIONS) out[p.key] = adsInScope(saved, { ...effective, period: p.key }, opts).length;
    return out;
  }, [saved, effective]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalInScope = useMemo(
    () => adsInScope(saved, { ...effective, industry: ALL, category: ALL }, opts).length,
    [saved, effective], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const onUnsave = (ad: Ad) => {
    unsaveAd(ad.id);
    toast("Removed from Saved Ads", {
      description: ad.headline,
      action: { label: "Undo", onClick: () => saveAd(ad.id) },
    });
  };

  let list;
  if (forced === "loading") {
    list = <GridSkeleton count={8} />;
  } else if (saved.length === 0) {
    list = (
      <EmptyState
        icon={<Bookmark className="h-5 w-5" aria-hidden="true" />}
        title="No saved ads yet"
        body="Open any ad and choose Save, then switch on Saved Ads to keep it here for quick access. Hooks, frameworks and other elements go to Boards instead."
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              to={INSIGHTS_ROUTES.discover}
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Browse Discover
            </Link>
            <Link
              to={INSIGHTS_ROUTES.boards}
              className="inline-flex h-9 items-center rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Go to Boards
            </Link>
          </div>
        }
      />
    );
  } else if (sorted.length === 0) {
    list = (
      <EmptyState
        icon={<SearchX className="h-5 w-5" aria-hidden="true" />}
        title="No saved ads in this scope"
        body={`You have ${fmtInt(saved.length)} saved ${saved.length === 1 ? "ad" : "ads"}, but none match the industry, category and period picked above.`}
        action={
          <button
            type="button"
            onClick={() => setScope({ ...DEFAULT_SCOPE })}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Show all saved ads
          </button>
        }
      />
    );
  } else {
    list = (
      <div className={GRID}>
        {sorted.map((ad) => (
          <div key={ad.id} className="flex min-w-0 flex-col gap-1.5">
            <AdCard ad={ad} onOpen={drawer.open} />
            <div className="flex items-center justify-between gap-2 px-0.5">
              <span className="text-[11px] text-muted-foreground">Saved {relativeTime(savedAtById.get(ad.id))}</span>
              <Hint content="Remove from Saved Ads. Boards are not affected.">
                <button
                  type="button"
                  onClick={() => onUnsave(ad)}
                  aria-label={`Remove “${ad.headline}” from Saved Ads`}
                  className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2 text-xs font-medium text-muted-foreground transition-colors hover:border-error-text/40 hover:bg-error-text/10 hover:text-error-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <BookmarkX className="h-3.5 w-3.5" aria-hidden="true" />
                  Unsave
                </button>
              </Hint>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const chips =
    forced !== "loading" && saved.length > 0 ? (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-mono font-medium tabular-nums text-foreground">{fmtInt(sorted.length)}</span> of{" "}
          <span className="font-mono font-medium tabular-nums text-foreground">{fmtInt(saved.length)}</span> saved{" "}
          {saved.length === 1 ? "ad" : "ads"} for the scope above.{" "}
          <span className="text-muted-foreground">
            The bookmark on a card adds that ad to a board; Unsave only removes it from this list.
          </span>
        </p>
        <SortControl value={sort} options={AD_SORT_LABEL} onChange={setSort} />
      </div>
    ) : null;

  return (
    <>
      <InsightsPageLayout
        title="Saved Ads"
        headerActions={<InsightsSearch />}
        count={forced === "loading" ? null : sorted.length}
        countNoun={sorted.length === 1 ? "ad" : "ads"}
        scopeBar={(compact) => (
          <ScopeBar
            scope={effective}
            onChange={setScope}
            industries={industries}
            categories={categories}
            totalCount={totalInScope}
            periodCounts={periodCounts}
            compact={compact}
          />
        )}
        chips={chips}
        list={list}
      />
      <InsightsOverlayHost />
    </>
  );
}
