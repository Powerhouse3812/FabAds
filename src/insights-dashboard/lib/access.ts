/**
 * Industry Insights Dashboard — production access gate.
 *
 * The dashboard is a PROTOTYPE running entirely on fabricated data: ~20,515
 * "live ads", 1,063 domains, named advertisers with invented ad counts. None
 * of it is real. Shipping that to main means it is one merge away from the
 * production bundle, so it must not be discoverable by an ordinary user who
 * would reasonably read those numbers as their own market.
 *
 * The gate is deliberately asymmetric:
 *
 *   · The ROUTE always resolves. A direct link to /insights/overview works for
 *     anyone who has the URL, which is what makes the thing demoable and
 *     shareable — including the ?state= links, which are the whole review
 *     mechanism. Blocking the route would defeat the reason we deployed it.
 *
 *   · The NAV ENTRY is hidden unless enabled. Nobody discovers the page by
 *     clicking around the product; you arrive only if someone sent you.
 *
 * That split is the same shape as the repo's other Maalik-only affordances
 * (the nav-variant cycler, the ?state= dev pill): reachable on purpose, never
 * by accident.
 *
 * Enable it in a browser console on any FabAds tab, then reload:
 *
 *   localStorage.setItem("genie6:insights:dashboard-enabled", "1")
 *
 * Read once at module load, matching the nav-variant hook — a flag that
 * changes mid-session would desync the rendered nav from the route table.
 */

export const INSIGHTS_DASHBOARD_FLAG_KEY = "genie6:insights:dashboard-enabled";

/**
 * True in dev, or when the flag is set. Storage access is wrapped: private
 * mode and blocked-cookie contexts throw on read, and a nav that crashes
 * because of a feature flag is worse than a nav missing one row.
 */
export function isInsightsDashboardEnabled(): boolean {
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
 * Everywhere else the disclosure is NOT dismissible: someone arriving from a
 * shared link has no other cue, and a prototype that looks like a live
 * dashboard is the one failure this module was built to avoid.
 */
export function shouldDiscloseSampleData(): boolean {
  return !import.meta.env.DEV;
}
