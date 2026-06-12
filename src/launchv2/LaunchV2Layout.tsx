/** Wraps /launchv2 routes in the provider; runs full-height (ownsLayout). */
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Monitor } from "lucide-react";
import { LaunchV2Provider } from "./state/LaunchV2Context";
import FloatingFeedbackButton from "./feedback/FloatingFeedbackButton";
import IdentityGate from "./feedback/IdentityGate";
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

  // Mobile gate: Launch v2 is desktop-only for the prototype. Tailwind-only
  // (no JS viewport hook) so SSR/hydration is clean. Below md (768px) we show
  // a polite "open on desktop" card; md+ we show the real surface.
  const content = (
    <div className="h-full min-h-0">
      {/* Mobile gate — visible only under md (768px). Tailwind-only, no JS. */}
      <div className="flex h-full min-h-0 items-center justify-center px-6 md:hidden">
        <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center">
          <Monitor className="h-12 w-12 text-primary" />
          <div className="space-y-1.5">
            <h2 className="text-base font-semibold text-foreground">
              Open on desktop
            </h2>
            <p className="text-sm text-muted-foreground">
              Launch 2.0 prototype is desktop-only for now. Open this link on a
              laptop or larger screen.
            </p>
          </div>
        </div>
      </div>

      {/* Desktop surface — md and up */}
      <div className="hidden h-full min-h-0 flex-col md:flex">
        <Outlet />
        {!onPanel && !onFlow && <FloatingFeedbackButton />}
      </div>
    </div>
  );

  return (
    <LaunchV2Provider>
      {onPanel ? content : <IdentityGate>{content}</IdentityGate>}
    </LaunchV2Provider>
  );
}
