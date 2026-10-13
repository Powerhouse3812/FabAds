/** My Feeds grid: equal-width columns (min 262px) of FeedCard, with the same "Load more" fallback under the infinite scroll. */
import type { Ad } from "@/lib/insights-v3/types";
import { fmtInt } from "@/components/insights-v3/shared";
import { FeedCard } from "./FeedCard";

export interface FeedGridProps {
  ads: Ad[];
  /** Pool for the Winner badge's engagement mark: the page's scoped ads. */
  scopedAds: Ad[];
  total: number;
  onLoadMore: () => void;
}

export function FeedGrid({ ads, scopedAds, total, onLoadMore }: FeedGridProps) {
  const more = total > ads.length;
  return (
    <div className="space-y-3">
      <ul aria-label="Ads" className="grid grid-cols-[repeat(auto-fill,minmax(262px,1fr))] items-start gap-3">
        {ads.map((ad) => (
          <li key={ad.id} className="min-w-0">
            <FeedCard ad={ad} scopedAds={scopedAds} />
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
