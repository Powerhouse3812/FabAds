import { Navigate, Route } from "react-router-dom";
import { PaymentVibesPreview } from "./payment-preview/PaymentVibesPreview";

/**
 * Demo first-login onboarding flow.
 *
 * Ported from the ff.ai marketing site (wf-onboarding.jsx + affiliate
 * variant). The actual flow renders as a forced-flow modal over
 * /insights-v2/feed — see `FirstLoginOnboardingModal` wired into
 * `InsightsV2Feed`. This route exists only as a redirect target so old
 * bookmarks / docs that point to /onboarding-demo still work.
 *
 * `/onboarding-demo/payment-preview` — temporary comparison page showing
 * three visual vibes for the payment-verification screen. Maalik picks
 * one, then the production version (3 states: waiting / success / failed)
 * gets built on the chosen vibe.
 */
export const onboardingDemoRoutes = (
  <>
    <Route
      path="onboarding-demo"
      element={<Navigate to="/insights-v2/feed?onboarding=true" replace />}
    />
    <Route
      path="onboarding-demo/payment-preview"
      element={<PaymentVibesPreview />}
    />
  </>
);
