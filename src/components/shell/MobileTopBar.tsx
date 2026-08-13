import { ChevronLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { derivePageTitle } from "@/components/shell/routeTitle";
import { useMobilePolicy } from "@/components/shell/mobileRoutePolicy";
import { MODULES, deriveActiveModule } from "@/components/sidebar/modules";

/**
 * MobileTopBar — the mobile-viewport replacement for the desktop breadcrumb
 * row (`HeaderBreadcrumbs` in AppLayout.tsx).
 *
 * Unlike the breadcrumb, which AppLayout suppresses on `ownsLayout` routes
 * (genie6, insights-v2, launchv2, creative-library, dashboard-variants,
 * creative-v2/v3 report shells — each owns its own header chrome on desktop),
 * this bar renders on ALL routes, including those. A mobile viewport has no
 * room for a per-route custom header, so every route gets this one instead —
 * either showing the real page (readonly/full support) or the BestOnDesktop
 * gate screen (blocked support), both of which need a title and, for the
 * gate/detail cases, a way back.
 *
 * Title and breadcrumb share ONE label source (`derivePageTitle` /
 * `labelableSegments` in routeTitle.ts) specifically so this title can never
 * drift from what the desktop breadcrumb would have shown for the same path.
 * Do not re-derive labels here.
 *
 * Rendered by AppShell as the first child of the merged shell; the caller
 * supplies `md:hidden` via `className` so this only paints below the `md`
 * breakpoint. No explicit z-index is set — the bar lives in normal flow, not
 * fixed/sticky, so it never needs to compete with portal-rendered overlays
 * (Radix dialogs/popovers/dropdowns render to document.body and stack above
 * it regardless).
 */
export function MobileTopBar({ className }: { className?: string }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const policy = useMobilePolicy();

  // Title resolution, in order: the shared breadcrumb-label derivation, then
  // the mobile policy's human name for the surface, then the active nav
  // module's label, then a last-resort constant. `policy.label` is a
  // required field on every resolved policy (including the CATCH_ALL
  // fallback), so in practice branch 2 almost always resolves — branches 3
  // and 4 exist purely so this bar can never render empty even if that
  // invariant ever changes.
  const activeModuleKey = deriveActiveModule(pathname);
  const activeModuleLabel = activeModuleKey
    ? MODULES.find((m) => m.key === activeModuleKey)?.label
    : undefined;
  const title = derivePageTitle(pathname) ?? policy.label ?? activeModuleLabel ?? "FabAds";

  // Back affordance only where it's honest: a detail/param route with no nav
  // entry of its own (`notInNav`, e.g. /insights/boards/:id, /launchv2/:id),
  // or a blocked gate screen (which otherwise has no other exit). Top-level
  // tab destinations get nothing — there's no "back" from a tab, and a fake
  // Back control is worse than none.
  const showBack =
    (policy.notInNav === true || policy.support === "blocked") &&
    !policy.ownsBackNavigation;

  const handleBack = () => {
    let historyIndex: number | undefined;
    try {
      const state = window.history.state as { idx?: number } | null;
      historyIndex = state?.idx;
    } catch {
      historyIndex = undefined;
    }
    if (typeof historyIndex === "number" && historyIndex > 0) {
      navigate(-1);
    } else {
      // No history to pop — e.g. a Slack deep link straight into a detail
      // route. Fall back to the policy's named escape hatch, or Dashboard.
      navigate(policy.fallback?.to ?? "/dashboard");
    }
  };

  return (
    <header
      aria-label={title}
      className={cn(
        "flex h-12 shrink-0 items-center border-b border-border bg-background",
        className,
      )}
    >
      {/* Left slot — fixed 44px whether or not Back renders, so the centered
          title never shifts width between routes. */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center">
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            aria-label="Back"
            className="flex h-11 w-11 min-h-11 min-w-11 items-center justify-center rounded-md text-foreground/80 transition-colors hover:bg-accent/40 hover:text-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Center — the page title. `role="heading" aria-level={1}` rather than
          a literal <h1>: several routed pages already render their own
          <h1>, and this bar must not create a second top-level heading on
          top of it. The `<header aria-label>` above is the bar's own
          accessible name for AT that only care about landmarks. */}
      <div className="min-w-0 flex-1 px-1 text-center">
        <span
          role="heading"
          aria-level={1}
          className="block truncate text-sm font-semibold text-foreground"
        >
          {title}
        </span>
      </div>

      {/* Right slot is deliberately EMPTY (Maalik, 2026-08-11).
          The profile moved out of the header — UserMenu already lives in the
          More sheet's footer, so keeping it here only duplicated it. The bell
          moved DOWN into the bottom tab bar, because notifications are growing
          into a full surface (all notifications + filtered activity logs), and
          a destination that big belongs in the nav, not behind a header icon.
          The spacer keeps the title optically centred against the back slot. */}
      <div className="h-11 w-11 shrink-0" aria-hidden="true" />
    </header>
  );
}
