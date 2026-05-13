import { Navigate, Route } from "react-router-dom";

/**
 * Demo first-login onboarding flow.
 *
 * Ported from the ff.ai marketing site (wf-onboarding.jsx + affiliate
 * variant). The actual flow renders as a forced-flow modal over
 * /insights-v2/feed — see `FirstLoginOnboardingModal` wired into
 * `InsightsV2Feed`. This route exists only as a redirect target so old
 * bookmarks / docs that point to /onboarding-demo still work.
 */
export const onboardingDemoRoutes = (
  <Route
    path="onboarding-demo"
    element={<Navigate to="/insights-v2/feed?onboarding=true" replace />}
  />
);
