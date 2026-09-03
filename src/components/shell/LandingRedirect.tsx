import { Navigate } from "react-router-dom";

import { useIsMobile } from "@/hooks/use-mobile";
import { MOBILE_HOME_PATH } from "./mobileNavConstants";

/**
 * LandingRedirect — resolves what `/` means, per viewport.
 *
 * WHY THIS EXISTS
 * The root index route used to be a bare `<Navigate to="/dashboard" replace />`.
 * That was correct while Dashboard was the mobile landing, but the mobile scope
 * shrank to Industry Insights + Genie's library (see `mobileRoutePolicy.ts`),
 * which made `/dashboard` a blocked route. The redirect then dropped a phone
 * user straight onto a "Best on desktop" gate — and worse, onto the *anonymous*
 * CATCH_ALL gate rather than the named Dashboard one, because `MobileRouteGate`
 * blocks before the `<Navigate>` element ever mounts. The product's stated goal
 * for mobile is "users should be able to onboard and have a bare minimum
 * experience", so the single most important URL in the app was landing on a
 * dead end.
 *
 * WHY A JS BRANCH IS CORRECT HERE
 * The mobile shell's standing rule is that layout branches in Tailwind, never in
 * JS, with a short allowlist of exceptions for cases where the *wrong thing must
 * not mount at all* (`MobileRouteGate`, `NotificationBell`, `CopilotPanel`). A
 * redirect target is exactly that class of decision: `display:none` cannot
 * un-navigate you, and rendering both `<Navigate>` elements would fire two
 * redirects. So this joins that allowlist rather than violating it.
 *
 * `useIsMobile` seeds synchronously from `matchMedia`, so there is no
 * first-frame flash where a phone is treated as a desktop and redirected to a
 * gate screen before the effect corrects it.
 *
 * KEEP IN SYNC: the mobile target is `MOBILE_HOME_PATH`, not a literal. That
 * constant is the one place the mobile landing is declared, and
 * `mobileRoutePolicy.ts` documents it as such — a second literal here would let
 * the two silently disagree the next time the scope moves.
 */

/** Desktop landing. Unchanged from the original index route. */
export const DESKTOP_HOME_PATH = "/dashboard";

/**
 * The landing path for the current viewport. Exported for the handful of
 * imperative navigations that also mean "go home" (see `MobileTopBar`'s
 * no-history fallback) and must not hardcode `/dashboard` either.
 */
export function useLandingPath(): string {
  const isMobile = useIsMobile();
  return isMobile ? MOBILE_HOME_PATH : DESKTOP_HOME_PATH;
}

export function LandingRedirect() {
  const to = useLandingPath();
  return <Navigate to={to} replace />;
}

export default LandingRedirect;
