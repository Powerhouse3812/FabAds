/**
 * Industry Insights Dashboard — dev-tool access.
 *
 * HISTORY, because this file used to do the opposite: the dashboard's nav row
 * was hidden behind a flag while the route stayed open, so the page was
 * reachable by link but never by browsing. That was deliberate — the page runs
 * on fabricated data and an ordinary user could have read those numbers as
 * their own market. Maalik has now asked for the "Home" row to be visible to
 * everyone, in the prototype and in the live app. The nav gate is gone.
 *
 * What has NOT changed, and must not:
 *
 *   · `shouldDiscloseSampleData()` still fires outside dev, and the disclosure
 *     it drives is still NOT dismissible. With the row now discoverable by
 *     browsing, that banner is the ONLY thing standing between a visitor and
 *     believing ~20,515 invented "live ads" are theirs. It matters more now,
 *     not less.
 *
 *   · The `?state=` switcher pill is a DEV TOOL and stays gated. It was gated
 *     on the same function as the nav row; unhiding the row by making that
 *     function return true would have shipped the pill to every production
 *     user. Hence the split below — one flag, two very different questions.
 *
 * Enable the dev tools in a browser console on any FabAds tab, then reload:
 *
 *   localStorage.setItem("genie6:insights:dashboard-enabled", "1")
 */
export const INSIGHTS_DASHBOARD_FLAG_KEY = "genie6:insights:dashboard-enabled";

/**
 * True in dev, or when the flag is set — gates the dashboard's DEV TOOLS (the
 * `?state=` switcher pill), never the nav row or the route.
 *
 * Storage access is wrapped: private mode and blocked-cookie contexts throw on
 * read, and a page that crashes because of a feature flag is worse than one
 * missing a debug affordance.
 */
export function areDashboardDevToolsEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  try {
    return window.localStorage.getItem(INSIGHTS_DASHBOARD_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * True when the page should tell the viewer its numbers are invented.
 *
 * Dev is exempt because the ?state= pill already frames the page as a lab.
 * Everywhere else the disclosure is NOT dismissible. This used to protect
 * people arriving from a shared link; now that "Home" sits in the nav for
 * everyone, it also protects people who simply clicked it. A prototype that
 * looks like a live dashboard is the one failure this module was built to
 * avoid.
 */
export function shouldDiscloseSampleData(): boolean {
  return !import.meta.env.DEV;
}
