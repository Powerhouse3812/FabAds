import type { AdvertiserDetail, SelectorCtx } from "@/lib/insights-v3/selectors";
import type { Ad, AdvertiserKind, Scope } from "@/lib/insights-v3/types";

/** Everything one tab of the Competitor detail overlay needs. Built once by AdvertiserDetail (the shell). */
export interface DetailTabProps {
  kind: AdvertiserKind;
  id: string;
  /** The `advertiserDetail()` result (already known to be non-empty: `detail.basedOn > 0`). */
  detail: AdvertiserDetail;
  /** This competitor's ads inside the current scope (industry, category AND period). */
  ads: Ad[];
  /** Industry/category-scoped ads of the whole universe, no period: feed trend/selectors that compare periods. */
  baseAds: Ad[];
  scope: Scope;
  ctx: SelectorCtx;
}
