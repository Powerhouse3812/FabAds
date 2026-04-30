import { useState } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { AppSidebar, MobileNavContent } from "@/components/AppSidebar";
import { CopilotProvider, useCopilot } from "@/contexts/CopilotContext";
import { CopilotPanel } from "@/components/copilot/CopilotPanel";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { NewGenerationOverlayProvider } from "@/genie6/shell/NewGenerationOverlay";
import { WelcomeCarouselProvider } from "@/genie6/shell/WelcomeCarousel";
import { CommandPaletteProvider } from "@/genie6/shell/CommandPalette";
// NOTE: After iter-3 IA, the topbar is removed. Profile / Variant / Theme moved
// to the sidebar footer; ClientSwitcher / Help / Copilot / Activity / Sign-out
// live inside the UserMenu dropdown there. NewGenerationCTA moves to the right
// rail (Genie 6 routes only). HeaderDatePicker becomes inline on Reports pages.

const LABEL_MAP: Record<string, string> = {
  iq: "IQ",
  "creative-library": "Creative Library",
  copilot: "Copilot",
  genie: "Genie",
  genie6: "Genie 6.0",
  workspace: "Assets",
  generate: "Generate",
  library: "Library",
  brands: "Brands",
  categories: "Categories",
  avatars: "Avatars",
  voices: "Voices",
  outputs: "Outputs",
  hooks: "Hooks",
  angles: "Angles",
  concepts: "Concepts",
  audiences: "Audiences",
  "video-sage": "Video Sage",
  dashboard: "Dashboard",
  integrations: "Integrations",
  launch: "Launch",
  "launch-history": "Launch History",
  offers: "Campaign URLs",
  "campaign-urls": "Campaign URLs",
  rrm: "RRM",
  "rrm-settings": "RRM Settings",
  reports: "Reports",
  performance: "Performance",
  creative: "Creative",
  "ad-accounts": "Ad Accounts",
  "ad-sets": "Ad Sets",
  ads: "Ads",
  campaigns: "Campaigns",
  image: "Image Report",
  video: "Video Report",
  "ad-groups": "Ad Group Report",
  "targeting-templates": "Targeting Templates",
  templates: "Targeting Templates",
  ums: "Team",
  "activity-logs": "Activity Logs",
  insights: "Industry Insights",
  discover: "Discover",
  boards: "Boards",
  competitors: "Competitors",
  settings: "Settings",
  clients: "Clients",
  "quick-start": "Quick Start",
  "ai-setup": "AI Setup",
};

/** Known sub-nav leaf paths — breadcrumbs hidden when on these exactly */
const KNOWN_SUB_NAV_PATHS = new Set([
  "/dashboard",
  "/launch",
  "/launch/templates",
  "/launch/campaign-urls",
  "/insights",
  "/insights/discover",
  "/insights/boards",
  "/insights/competitors",
  "/iq/creative-library",
  "/iq/genie5",
  "/iq/genie5/studio",
  "/iq/genie5/templates",
  "/iq/genie5/brands",
  "/iq/genie5/categories",
  "/iq/genie5/quick-start",
  "/iq/genie5/ai-setup",
  "/iq/genie",
  "/iq/video-sage",
  "/iq/copilot",
  "/iq/genie6",
  "/iq/genie6/workspace",
  "/iq/genie6/generate",
  "/iq/genie6/library",
  "/iq/genie6/settings",
  "/rrm",
  "/rrm/settings",
  "/integrations",
  "/ums",
  "/activity-logs",
  "/reports/performance/ad-accounts",
  "/reports/performance/campaigns",
  "/reports/performance/ad-sets",
  "/reports/performance/ads",
  "/reports/creative/image",
  "/reports/creative/video",
  "/reports/creative/ad-groups",
]);

function HeaderBreadcrumbs() {
  const { pathname } = useLocation();

  if (KNOWN_SUB_NAV_PATHS.has(pathname)) return null;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((seg, i) => {
          const label = LABEL_MAP[seg] || seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
          const path = "/" + segments.slice(0, i + 1).join("/");
          const isLast = i === segments.length - 1;
          return (
            <BreadcrumbItem key={path}>
              {i > 0 && <BreadcrumbSeparator />}
              {isLast ? (
                <BreadcrumbPage>{label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={path}>{label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function AppLayoutInner() {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const isGenie6Route = pathname.startsWith("/iq/genie6");
  const { isPinned, isOpen } = useCopilot();

  return (
    <div className="h-screen flex w-full overflow-hidden">
      {/* Desktop sidebar */}
      <AppSidebar />

      {/* Content — topbar removed (iter 3 IA). Right cluster contents
           absorbed: profile/variant/theme into sidebar footer + UserMenu
           dropdown. ClientSwitcher / Help / Copilot / Activity Log live
           inside UserMenu dropdown. HeaderDatePicker for Reports moves to
           inline filter at top of Reports content area (handled per-page).
           Breadcrumbs become inline at top of main content (saves the
           48px h-14 strip globally).

           Mobile: hamburger floats top-left when sidebar collapsed; otherwise
           sidebar overlays in mobile drawer mode. */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile floating hamburger (only shown if mobile + sidebar closed) */}
        {isMobile && !mobileOpen && (
          <button
            onClick={() => setMobileOpen(true)}
            className="fixed top-3 left-3 z-50 p-1.5 rounded-md bg-background border border-border text-foreground hover:bg-accent/10"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Inline breadcrumbs strip (replaces the topbar breadcrumbs).
                 Sticky-light, sits above page content. Hidden on Genie 6
                 routes since those have their own page chrome. */}
            {!isGenie6Route && (
              <div className="border-b border-border px-4 py-2 flex-shrink-0">
                <HeaderBreadcrumbs />
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 2xl:p-5 flex flex-col relative">
              <Outlet />
            </div>
          </main>
          {/* Right rail removed (iter-5): + New gen + ⌘K both reachable from
              the sleek sub-nav search bar above Dashboard, plus the command
              palette via ⌘K + ⌘N keyboard shortcuts. No need to duplicate
              into a separate column. */}
          {/* Pinned copilot panel */}
          {isPinned && isOpen && <CopilotPanel />}
        </div>
      </div>

      {/* Overlay copilot panel (non-pinned) */}
      {!isPinned && isOpen && <CopilotPanel />}

      {/* Mobile Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-[280px]">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <MobileNavContent onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function AppLayout() {
  return (
    <CopilotProvider>
      <NewGenerationOverlayProvider>
        <WelcomeCarouselProvider>
          <CommandPaletteProvider>
            <AppLayoutInner />
          </CommandPaletteProvider>
        </WelcomeCarouselProvider>
      </NewGenerationOverlayProvider>
    </CopilotProvider>
  );
}
