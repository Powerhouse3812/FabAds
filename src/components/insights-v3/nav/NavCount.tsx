/**
 * Sub-nav count for an Industry Insights V2 menu item (rule: counts on every
 * menu and sub-menu item, for the current scope).
 *
 * Lazy-loaded by SecondaryNavigationItem, so the data universe is only built
 * when the V2 sub-nav renders. Read-only: it reads the scope from the URL on
 * V2 pages (falling back to the session scope), and never writes it.
 *
 * Each count matches what the page shows on arrival (its default tab), so
 * the number in the nav is the number the user lands on.
 */
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { ALL, DEFAULT_SCOPE, INSIGHTS_ROUTES, PERIOD_OPTIONS, type Scope } from "@/lib/insights-v3/types";
import { MODULE_NOW, getAds } from "@/lib/insights-v3/data";
import { adsInScope } from "@/lib/insights-v3/selectors";
import { myFeedsAds, useBoards, useSavedAdIds, useUserPrefs } from "@/lib/insights-v3/stores";
import { SCOPE_STORAGE_KEY, hasScopeParams, readScopeFromParams } from "@/components/insights-v3/shared";
import { fmtInt } from "@/components/insights-v3/shared";

export type NavCountKey = "feeds" | "discover" | "advertisers" | "elements" | "saved" | "boards";

function readCurrentScope(pathname: string, search: string): Scope {
  const sp = new URLSearchParams(search);
  if (pathname.startsWith(INSIGHTS_ROUTES.root) && hasScopeParams(sp)) return readScopeFromParams(sp);
  // Same JSON shape the shared url.ts writes (it doesn't export its reader).
  try {
    const raw = sessionStorage.getItem(SCOPE_STORAGE_KEY);
    if (raw) {
      const j = JSON.parse(raw) as Partial<Scope>;
      return {
        industry: typeof j.industry === "string" ? j.industry : ALL,
        category: typeof j.category === "string" ? j.category : ALL,
        period: PERIOD_OPTIONS.some((o) => o.key === j.period) ? (j.period as Scope["period"]) : DEFAULT_SCOPE.period,
        myPrefsOnly: false,
      };
    }
  } catch {
    /* storage blocked or bad JSON → defaults */
  }
  return DEFAULT_SCOPE;
}

export default function NavCount({ countKey }: { countKey: string }) {
  const { pathname, search } = useLocation();
  const prefs = useUserPrefs();
  const savedIds = useSavedAdIds();
  const boards = useBoards();
  const scope = readCurrentScope(pathname, search);
  const scopeKey = `${scope.industry}|${scope.category}|${scope.period}`;

  const value = useMemo(() => {
    const opts = { now: MODULE_NOW };
    const base = { ...scope, myPrefsOnly: false };
    switch (countKey as NavCountKey) {
      case "feeds":
        return adsInScope(myFeedsAds(prefs), base, opts).length;
      case "discover":
        return adsInScope(getAds(), base, opts).length;
      case "advertisers": {
        // Advertiser opens on the Domain tab.
        const ids = new Set<string>();
        for (const a of adsInScope(getAds(), base, opts)) if (a.domainAdvertiserId) ids.add(a.domainAdvertiserId);
        return ids.size;
      }
      case "elements": {
        // Creative Element Insights opens on the Framework tab.
        const ids = new Set<string>();
        for (const a of adsInScope(getAds(), base, opts)) if (a.analysis.framework) ids.add(a.analysis.framework);
        return ids.size;
      }
      case "saved":
        return savedIds.length;
      case "boards":
        return boards.length;
      default:
        return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scopeKey stands in for scope
  }, [countKey, scopeKey, prefs, savedIds, boards]);

  if (value === null) return null;
  return (
    <span className="shrink-0 rounded-full bg-primary/15 px-1.5 font-mono text-[10px] leading-4 tabular-nums text-primary-text">
      {fmtInt(value)}
    </span>
  );
}
