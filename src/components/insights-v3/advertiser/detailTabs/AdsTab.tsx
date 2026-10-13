/**
 * Competitor detail · Ads tab. The FULL list of this competitor's ads (in the current scope), sortable,
 * longest running first. 12 cards at a time so a competitor with 1000+ ads stays cheap.
 * Sort is local state on purpose: the page behind the overlay owns the `sort` URL param.
 */
import { useMemo, useState } from "react";
import { AD_SORT_LABEL, type AdSort } from "@/lib/insights-v3/types";
import { countActive, countWinners, sortAds } from "@/lib/insights-v3/selectors";
import { BasedOnNote, DisabledSection, SortControl, fmtInt, pluralize, useAdDrawer } from "../../shared";
import { AdCard } from "../../ad-card/AdCard";
import { useShowMore } from "../helpers";
import { ShowMore } from "../tableParts";
import type { DetailTabProps } from "./types";

const PAGE = 12;
const DEFAULT_SORT: AdSort = "longest-running";

export function AdsTab({ kind, id, ads }: DetailTabProps) {
  const drawer = useAdDrawer();
  const [sort, setSort] = useState<AdSort>(DEFAULT_SORT);
  const sorted = useMemo(() => sortAds(ads, sort), [ads, sort]);
  const active = useMemo(() => countActive(ads), [ads]);
  const winners = useMemo(() => countWinners(ads), [ads]);
  // Back to the first 12 whenever the order (or the competitor) changes.
  const { visible, remaining, more } = useShowMore(sorted.length, `${kind}:${id}:${sort}`, PAGE);

  if (ads.length === 0) {
    return (
      <DisabledSection
        title="No ads in this scope"
        reason="This competitor has no ads in the current industry, category and period. Widen the scope to see them."
        minHeight={140}
      />
    );
  }

  return (
    <section aria-label="Ads" className="min-w-0">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="text-sm font-semibold text-foreground">
            <span className="font-mono tabular-nums">{fmtInt(ads.length)}</span> {pluralize(ads.length, "ads")}
          </h3>
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-primary" />
            <span>
              <span className="font-mono font-medium tabular-nums text-foreground">{fmtInt(active)}</span> active
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <span className="font-mono font-medium tabular-nums text-primary-text">{fmtInt(winners)}</span>{" "}
              {winners === 1 ? "winner" : "winners"}
            </span>
          </p>
        </div>
        <SortControl value={sort} options={AD_SORT_LABEL} onChange={setSort} />
      </header>
      <BasedOnNote ads={ads.length} className="mt-1" />

      <ul
        aria-label={`Ads, sorted by ${AD_SORT_LABEL[sort].toLowerCase()}`}
        className="mt-3 grid list-none grid-cols-[repeat(auto-fill,minmax(250px,1fr))] items-start gap-3 p-0"
      >
        {sorted.slice(0, visible).map((ad) => (
          <li key={ad.id} className="min-w-0">
            <AdCard ad={ad} onOpen={drawer.open} scopedAds={ads} />
          </li>
        ))}
      </ul>

      <p className="mt-3 text-center text-xs text-muted-foreground" aria-live="polite">
        Showing <span className="font-mono font-medium tabular-nums text-foreground">{fmtInt(visible)}</span> of{" "}
        <span className="font-mono font-medium tabular-nums text-foreground">{fmtInt(sorted.length)}</span>
      </p>
      <ShowMore remaining={remaining} onMore={more} noun="ads" />
    </section>
  );
}
