import { Navigate, Route } from "react-router-dom";
import { PlanningPrintPage } from "./PlanningPrintPage";

/**
 * Public, no-auth, no-shell route for the pricing page — mirrors
 * brand-book-print + onboarding-print + upsell-print so design-importer
 * tools (html.to.design, Anima, Locofy) can scrape each pricing
 * variant cleanly without hitting the FabAds auth gate.
 *
 * URL pattern: /planning-print/:slug
 *
 * Slug values (6 valid combinations):
 *   ai-direct-monthly  (default — AI tier, direct purchase, monthly)
 *   ai-direct-annual
 *   ai-trial-monthly
 *   ai-trial-annual
 *   growth-monthly     (growth has no direct view — always trial)
 *   growth-annual
 *
 * Visiting /planning-print without a slug redirects to
 * /planning-print/ai-direct-monthly.
 */
export const planningPrintRoutes = (
  <Route path="planning-print">
    <Route index element={<Navigate to="ai-direct-monthly" replace />} />
    <Route path=":slug" element={<PlanningPrintPage />} />
  </Route>
);
