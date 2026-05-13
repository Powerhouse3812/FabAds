import { Route } from "react-router-dom";
import { OnboardingShell } from "./OnboardingShell";

/**
 * Demo first-login onboarding flow.
 *
 * Ported from the ff.ai marketing site (wf-onboarding.jsx + affiliate
 * variant). Sits inside ProtectedRoute + AppLayout — accessible from the
 * left nav rail as a "Tools" entry. NOT auto-launched on real first login —
 * this is presentational, to demo the wizard experience.
 *
 * URL: /onboarding-demo  (Mode picker → Input → Processing → Brand Ready)
 */
export const onboardingDemoRoutes = (
  <Route path="onboarding-demo" element={<OnboardingShell />} />
);
