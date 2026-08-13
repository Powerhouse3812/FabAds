/** Wraps /launchv2 routes in the provider; runs full-height (ownsLayout). */
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { LaunchV2Provider } from "./state/LaunchV2Context";
import FloatingFeedbackButton from "./feedback/FloatingFeedbackButton";
import { markAppLoad, markPageView } from "./feedback/telemetry";

export default function LaunchV2Layout() {
  const location = useLocation();

  // Telemetry timers: session starts once per tab; page timer resets per route.
  useEffect(() => {
    markAppLoad();
  }, []);
  useEffect(() => {
    markPageView();
  }, [location.pathname]);

  // The admin dashboard is exempt from both the identity gate and the button.
  // The flow screen (/launchv2/new) has its own inline feedback button in the
  // footer bar — don't also render the floating one on top of the Next button.
  const onPanel = location.pathname.includes("/launchv2/feedback-panel");
  const onFlow = location.pathname === "/launchv2/new";

  // The blanket "Launch v2 is desktop-only" gate that used to live here is GONE.
  // It hid the entire subtree including the Hub, so keeping it would leave
  // /launchv2 blank on mobile — the exact bug the mobile work exists to fix.
  // Per-path policy now lives in src/components/shell/mobileRoutePolicy.ts:
  // the Hub, history and run detail are readonly-allowed, /launchv2/new and the
  // remaining settings surfaces are blocked. Its card markup was generalized
  // into src/components/shell/BestOnDesktop.tsx.
  const content = (
    <div className="flex h-full min-h-0 flex-col">
      <Outlet />
      {/* Floating FAB is md:-only — on mobile it collides with the tab bar. */}
      {!onPanel && !onFlow && (
        <div className="hidden md:block">
          <FloatingFeedbackButton />
        </div>
      )}
    </div>
  );

  return (
    <LaunchV2Provider>
      {content}
    </LaunchV2Provider>
  );
}
