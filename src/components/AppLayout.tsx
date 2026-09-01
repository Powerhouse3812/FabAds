import { Fragment } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { CommandPalette } from "@/components/sidebar/CommandPalette";
import { AppShell } from "@/components/shell/AppShell";
import { MobileRouteGate } from "@/components/shell/MobileRouteGate";
import { MobileTabBar } from "@/components/shell/MobileTabBar";
import { labelableSegments } from "@/components/shell/routeTitle";
import { CopilotProvider, useCopilot } from "@/contexts/CopilotContext";
import { CopilotPanel } from "@/components/copilot/CopilotPanel";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { NewGenerationOverlayProvider } from "@/genie6/shell/NewGenerationOverlay";
import { WelcomeCarouselProvider } from "@/genie6/shell/WelcomeCarousel";

/**
 * AppLayout — V7 ClickUp Strict shell (post iter-6 A-10.13).
 *
 * History note: iter-6 A-1 to A-10.12 supported 7 nav variants (V1-V7).
 * V1-V6 (sections / darkAlways / glass / workbench / glassDark / glassLight)
 * were dev-tool A/B comparison variants. A-10.13 locked V7 (ClickUp Strict)
 * as THE shell and ripped out the V1-V6 fork (~1918 LOC of dead scaffolding:
 * AppSidebar.tsx + NavVariantPicker.tsx + useFabAdsNavVariant.ts deleted).
 *
 * Layout:
 *   ParentNavigationRail (dark icon rail) | merged shell {sub-nav | main}
 *   + Copilot floating right when open
 *   + Cmd+K palette
 *
 * Mobile (< md, see hooks/use-mobile MOBILE_BREAKPOINT): the rail and sub-nav
 * are display:none; MobileTopBar (in AppShell) + MobileTabBar (here) are the
 * chrome, and MobileRouteGate decides whether the routed page may render at all.
 * The old floating hamburger + left drawer are gone — the drawer content now
 * lives behind the tab bar's "More" slot.
 *
 * V7 shape sub-variant (floating ↔ edge-to-edge) lives in `useV7Shape` and
 * is wired through AppShell + ParentNavigationRail. That's separate from the
 * dropped FabAdsNavVariant system.
 */

// LABEL_MAP / KNOWN_SUB_NAV_PATHS / isIdLike now live in
// src/components/shell/routeTitle.ts — single source of truth for route
// labels, consumed by both HeaderBreadcrumbs (below) and MobileTopBar.

function HeaderBreadcrumbs() {
  const { pathname } = useLocation();

  // Label logic lives in shell/routeTitle.ts, shared with MobileTopBar so the
  // mobile page title can never drift from the desktop breadcrumb.
  const labelable = labelableSegments(pathname);
  if (labelable.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {labelable.map((item, i) => {
          const isLast = i === labelable.length - 1;
          return (
            /* Separator is a SIBLING of the item, not a child: both
               BreadcrumbItem and BreadcrumbSeparator render <li>, so nesting
               the separator inside the item tripped React's
               validateDOMNesting ("<li> cannot appear as a descendant of
               <li>") on every page load. The Fragment keeps both as direct
               children of BreadcrumbList's <ol>. */
            <Fragment key={item.path}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={item.path}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function AppLayoutInner() {
  const { pathname } = useLocation();
  const isGenie6Route = pathname.startsWith("/iq/genie6");
  const isInsightsV2Route = pathname.startsWith("/insights-v2");
  const isLaunchV2Route = pathname.startsWith("/launchv2");
  const isCreativeLibraryRoute = pathname.startsWith("/iq/creative-library");
  const isDashboardVariantsRoute = pathname.startsWith("/dashboard-variants");
  // Both live Creative Report versions own their layout — same shell, only
  // the Overview differs.
  const isCreativeReportRoute =
    pathname.startsWith("/reports/creative-v2") ||
    pathname.startsWith("/reports/creative-v3");
  // Automations = full-height node canvas; inside the default
  // `flex-1 overflow-y-auto p-4` wrap it would have no fixed viewport to
  // size against and the canvas would collapse.
  const isAutomationsRoute = pathname.startsWith("/automation");
  // Routes that own their own scroll regions + chrome (no AppLayout
  // breadcrumb header, no outer padding). Genie6 set this pattern;
  // Industry Insights v2 follows it so the masonry page bg + sticky
  // toolbar both reach the top of the viewport. Launch v2 = full-height
  // wizard + Step-4 two-pane. Creative Library = absolute-positioned
  // folder rail + content split that collapses inside the default
  // overflow-y-auto wrap. Dashboard variants = 4 full-bleed visual
  // explorations that each own their own background/chrome.
  // Creative Report 2.0 / 3.0 = own sub-nav + persistent filter bar + footer.
  const ownsLayout =
    isGenie6Route ||
    isInsightsV2Route ||
    isLaunchV2Route ||
    isCreativeLibraryRoute ||
    isDashboardVariantsRoute ||
    isCreativeReportRoute ||
    isAutomationsRoute;
  // `isPinned` is deliberately not destructured: both former branches rendered
  // the SAME CopilotPanel, so they collapse to one render. On mobile it must
  // overlay — as a pinned column sibling it would sit below the tab bar.
  const { isOpen } = useCopilot();

  return (
    /* 100dvh (not 100vh) on mobile: with 100vh, iOS Safari reports the LARGE
       viewport, so the bottom tab bar renders below the fold until the URL bar
       collapses. dvh tracks the visible viewport. If the URL-bar transition
       jitter ever proves unacceptable, 100svh is a one-word swap HERE and
       nowhere else — the merged shell derives its height from flex.
       md:h-screen keeps desktop pixel-identical. */
    <div className="h-[100dvh] md:h-screen flex flex-col md:flex-row w-full overflow-hidden bg-zinc-100 pl-[env(safe-area-inset-left)]">
      {/* AppShell renders ParentRail + merged shell containing sub-nav + main */}
      <AppShell>
        {/* Desktop breadcrumb row. md:-only — MobileTopBar (inside AppShell)
            covers mobile, and unlike this row it renders on ownsLayout routes
            too. */}
        {!ownsLayout && (
          <div className="hidden md:block border-b border-zinc-900/[0.06] px-4 py-2 flex-shrink-0">
            <HeaderBreadcrumbs />
          </div>
        )}
        <div
          className={cn(
            "flex flex-col relative",
            ownsLayout
              ? "flex-1 min-h-0 overflow-hidden md:h-full"
              : // On mobile this div IS the scroller (main is overflow-hidden);
                // on desktop main scrolls and this stays as it was.
                //
                // The md: overrides are load-bearing, do not drop them. Above
                // 768px `main` becomes the scroller (`md:overflow-auto`) and
                // this div grows to full content height — so `overflow-y-auto`
                // leaves it a scroll container that can never scroll, and
                // `overscroll-contain` then refuses to chain the wheel up to
                // `main`. Net effect: no desktop page scrolls by wheel at all.
                // The two utilities are correct on mobile and must simply stop
                // applying at md, which is what the comment above always
                // assumed.
                "flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 md:overflow-visible md:overscroll-auto md:p-4 2xl:p-5",
          )}
        >
          <MobileRouteGate>
            <Outlet />
          </MobileRouteGate>
        </div>
      </AppShell>

      {/* Pinned/overlay Copilot stays SEPARATE (per A-10.8 Interpretation A:
          "Copilot stays separate floating right").
          Both former branches rendered the SAME component, so they collapse.
          On mobile it must overlay: as a pinned column sibling it would sit
          below the tab bar in the flex column. */}
      {isOpen && <CopilotPanel />}

      {/* Bottom tab bar — mobile's primary nav. In normal flow as the last flex
          child (not fixed), so no page needs a padding-bottom contract and the
          safe-area inset can't be double-counted. Owns the "More" sheet, which
          replaces the old floating hamburger + left drawer. */}
      <MobileTabBar className="md:hidden" />

      {/* Cmd+K palette — left mounted and deliberately NOT surfaced on mobile.
          It only opens via the global keydown listener, so it is inert on touch
          with zero extra code; discovery on mobile is the More sheet plus each
          surface's own search. */}
      <CommandPalette />
    </div>
  );
}

export function AppLayout() {
  return (
    <CopilotProvider>
      <NewGenerationOverlayProvider>
        <WelcomeCarouselProvider>
          <AppLayoutInner />
        </WelcomeCarouselProvider>
      </NewGenerationOverlayProvider>
    </CopilotProvider>
  );
}
