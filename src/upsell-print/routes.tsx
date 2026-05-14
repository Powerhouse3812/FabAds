import { Navigate, Route } from "react-router-dom";
import { UpsellPrintPage } from "./UpsellPrintPage";

/**
 * Public, no-auth, no-shell route for the PRO upsell tooltip — exists so
 * design-importer tools (html.to.design, Anima, Locofy, screenshot
 * services) can scrape the tooltip at native dimensions without an auth
 * spinner blocking them.
 *
 * Mounted at App root OUTSIDE ProtectedRoute. URL pattern:
 *   /upsell-print/reports
 *   /upsell-print/launch
 *   /upsell-print/automation
 *
 * Visiting /upsell-print without a slug redirects to /upsell-print/reports
 * as the canonical default.
 */
export const upsellPrintRoutes = (
  <Route path="upsell-print">
    <Route index element={<Navigate to="reports" replace />} />
    <Route path=":moduleKey" element={<UpsellPrintPage />} />
  </Route>
);
