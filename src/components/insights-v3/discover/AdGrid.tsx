/** Masonry ad grid (CSS columns, 1 column at 375px) with a "Load more" fallback under the infinite scroll. */
import type { Ad } from "@/lib/insights-v3/types";
import { AdCard } from "@/components/insights-v3/ad-card/AdCard";
import { fmtInt } from "@/components/insights-v3/shared";

export interface AdGridProps {
  ads: Ad[];
  /** Pool for the Winner badge's engagement mark: the page's scoped ads. */
  scopedAds: Ad[];
  total: number;
  onLoadMore: () => void;
}

export function AdGrid({ ads, scopedAds, total, onLoadMore }: AdGridProps) {
  const more = total > ads.length;
  return (
    <div className="space-y-3">
      <ul
        aria-label="Ads"
        className="columns-1 gap-3 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 [&>li]:mb-3 [&>li]:break-inside-avoid"
      >
        {ads.map((ad) => (
          <li key={ad.id}>
            <AdCard ad={ad} scopedAds={scopedAds} />
          </li>
        ))}
      </ul>
      <div className="flex flex-col items-center gap-2 pb-2 text-xs text-muted-foreground" aria-live="polite">
        <span>
          Showing <span className="font-mono tabular-nums text-foreground">{fmtInt(ads.length)}</span> of{" "}
          <span className="font-mono tabular-nums text-foreground">{fmtInt(total)}</span> ads
        </span>
        {more && (
          <button
            type="button"
            onClick={onLoadMore}
            className="inline-flex h-8 items-center rounded-md border border-primary/30 bg-primary/10 px-3 text-xs font-medium text-primary-text hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Load more
          </button>
        )}
      </div>
    </div>
  );
}
