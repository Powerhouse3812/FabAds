/**
 * Scope + selector context for the Advertiser page and its overlays.
 * One place so the page and the overlays can never disagree on "now",
 * last visit or prefs.
 */
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { QP, type Ad, type Scope } from "@/lib/insights-v3/types";
import { MODULE_NOW, getAds } from "@/lib/insights-v3/data";
import { adsInBaseScope, type SelectorCtx } from "@/lib/insights-v3/selectors";
import { useLastVisitAt, useUserPrefs } from "@/lib/insights-v3/stores";
import { useInsightsScope } from "../shared";

export interface AdvertiserCtx {
  /** The scope bar value. `myPrefsOnly` is forced off: that toggle is Discover-only. */
  scope: Scope;
  setScope: ReturnType<typeof useInsightsScope>[1];
  ctx: SelectorCtx;
  /** Every ad in the universe. */
  allAds: Ad[];
  /** Industry/category scoped, no period (feed this to trend functions and detail selectors). */
  baseAds: Ad[];
  /** Dev state switch: `?state=loading|empty`. */
  forcedState: "loading" | "empty" | null;
}

export function useAdvertiserCtx(): AdvertiserCtx {
  const [rawScope, setScope] = useInsightsScope();
  const [sp] = useSearchParams();
  const lastVisitAt = useLastVisitAt();
  const prefs = useUserPrefs();
  const scope = useMemo<Scope>(
    () => ({ ...rawScope, myPrefsOnly: false }),
    [rawScope.industry, rawScope.category, rawScope.period], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const ctx = useMemo<SelectorCtx>(() => ({ now: MODULE_NOW, lastVisitAt, prefs }), [lastVisitAt, prefs]);
  const allAds = getAds();
  const baseAds = useMemo(() => adsInBaseScope(allAds, scope, ctx), [allAds, scope, ctx]);
  const raw = sp.get(QP.state);
  const forcedState = raw === "loading" || raw === "empty" ? raw : null;
  return { scope, setScope, ctx, allAds, baseAds, forcedState };
}
