import { useState } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { AppSidebar, MobileNavContent } from "@/components/AppSidebar";
import { UserMenu } from "@/components/UserMenu";
import { ClientSwitcher } from "@/components/ClientSwitcher";
import { HeaderDatePicker } from "@/components/HeaderDatePicker";
import { CopilotProvider, useCopilot } from "@/contexts/CopilotContext";
import { CopilotTrigger } from "@/components/copilot/CopilotTrigger";
import { CopilotPanel } from "@/components/copilot/CopilotPanel";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { NewGenerationOverlayProvider } from "@/genie6/shell/NewGenerationOverlay";
import { NewGenerationCTA } from "@/genie6/shell/NewGenerationCTA";
import { HelpIcon } from "@/genie6/shell/HelpIcon";
import { WelcomeCarouselProvider } from "@/genie6/shell/WelcomeCarousel";
import { ThemeVariantSwitcher } from "@/genie6/shell/ThemeVariantSwitcher";

const LABEL_MAP: Record<string, string> = {
  iq: "IQ",
  "creative-library": "Creative Library",
  copilot: "Copilot",
  genie: "Genie",
  genie6: "Genie 6.0",
  workspace: "Workspace",
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
  const isReportsRoute = pathname.startsWith("/reports") || pathname === "/dashboard";
  const isGenie6Route = pathname.startsWith("/iq/genie6");
  const { isPinned, isOpen } = useCopilot();

  return (
    <div className="h-screen flex w-full overflow-hidden">
      {/* Desktop sidebar */}
      <AppSidebar />

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 flex items-center border-b border-border px-4 gap-4 flex-shrink-0">
          {/* Mobile hamburger */}
          {isMobile && (
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 rounded-md text-foreground hover:bg-accent/10"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <HeaderBreadcrumbs />
          <div className="ml-auto flex items-center gap-3">
            {/* Genie 6.0 affordances — only on /iq/genie6/* */}
            {isGenie6Route && (
              <>
                <ThemeVariantSwitcher />
                <HelpIcon />
                <NewGenerationCTA />
                <span className="h-5 w-px bg-border" aria-hidden />
              </>
            )}
            <ClientSwitcher />
            {isReportsRoute && <HeaderDatePicker />}
            <CopilotTrigger />
            <UserMenu />
          </div>
        </header>
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 2xl:p-5 flex flex-col relative">
              <Outlet />
            </div>
          </main>
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
          <AppLayoutInner />
        </WelcomeCarouselProvider>
      </NewGenerationOverlayProvider>
    </CopilotProvider>
  );
}
