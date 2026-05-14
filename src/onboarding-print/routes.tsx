import { Navigate, Route } from "react-router-dom";
import { OnboardingPrintPage } from "./OnboardingPrintPage";

/**
 * Public, no-auth, no-shell routes for the first-login onboarding flow —
 * mirrors brand-book-print + upsell-print. Mounted OUTSIDE ProtectedRoute
 * so design-importer tools (html.to.design, Anima, Locofy) can scrape
 * each step at native dimensions without hitting the auth gate.
 *
 * URL pattern: /onboarding-print/:step
 *
 * Step values:
 *   welcome                 (default — pre-wizard celebration screen,
 *                            final phase rendered for design export)
 *   choose-mode             (Step 1 mode picker)
 *   ecom-input              (Step 2 e-commerce — Brand URL form)
 *   ecom-processing         (Step 3 e-commerce — animated stages)
 *   ecom-done               (Step 4 e-commerce — Brand Ready)
 *   affiliate-input         (Step 2 affiliate — Category + ref URLs)
 *   affiliate-processing    (Step 3 affiliate — animated stages)
 *   affiliate-done          (Step 4 affiliate — Category Ready)
 *
 * Visiting /onboarding-print without a slug redirects to welcome.
 */
export const onboardingPrintRoutes = (
  <Route path="onboarding-print">
    <Route index element={<Navigate to="welcome" replace />} />
    <Route path=":step" element={<OnboardingPrintPage />} />
  </Route>
);
