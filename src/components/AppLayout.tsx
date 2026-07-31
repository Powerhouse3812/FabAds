import { useState } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { MobileNavContent } from "@/components/sidebar/MobileNavContent";
import { CommandPalette } from "@/components/sidebar/CommandPalette";
import { AppShell } from "@/components/shell/AppShell";
import { CopilotProvider, useCopilot } from "@/contexts/CopilotContext";
import { CopilotPanel } from "@/components/copilot/CopilotPanel";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
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
 *   + Mobile sheet via hamburger
 *   + Cmd+K palette
 *
 * V7 shape sub-variant (floating ↔ edge-to-edge) lives in `useV7Shape` and
 * is wired through AppShell + ParentNavigationRail. That's separate from the
 * dropped FabAdsNavVariant system.
 */

const LABEL_MAP: Record<string, string> = {
  iq: "IQ",
  "creative-library": "Creative Library",
  copilot: "Copilot",
  genie: "Genie",
  genie6: "Genie 6.0",
  workspace: "Assets",
  generate: "Studio",
  "generate-legacy": "Old Studio",
  "generate-v3": "Studio v3",
  "brand-ad": "Brand Ad",
  "product-ad": "Product Ad",
  "affiliate-ad": "Affiliate Ad",
  "performance-ad": "Performance Ad",
  variation: "Variations",
  brand: "Brand",
  ad: "Ad",
  social: "Social",
  "product-shoot": "Product Shoot",
  "brand-focused": "Brand-focused",
  "product-focused": "Product-focused",
  "ugc-video": "UGC Video",
  variations: "Variations",
  "image-to-ad": "Image-to-Ad",
  quick: "Quick mode",
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
  "creative-v2": "Creative Report 2.0",
  "creative-v3": "Creative Report 3.0",
  creatives: "Creatives",
  compare: "Compare",
  automations: "Automations",
  "owner-report": "Owner report",
  "brief-builder": "Brief builder",
  views: "Saved views",
  components: "Components",
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
  "/iq/genie6/generate-legacy",
  "/iq/genie6/generate-v3",
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
  "/reports/creative-v2",
  "/reports/creative-v2/creatives",
  "/reports/creative-v2/components",
  "/reports/creative-v2/compare",
  "/reports/creative-v2/automations",
  "/reports/creative-v2/owner-report",
  "/reports/creative-v2/brief-builder",
  "/reports/creative-v2/views",
  "/reports/creative-v3",
  "/reports/creative-v3/creatives",
  "/reports/creative-v3/components",
  "/reports/creative-v3/compare",
  "/reports/creative-v3/automations",
  "/reports/creative-v3/owner-report",
  "/reports/creative-v3/brief-builder",
  "/reports/creative-v3/views",
]);

/**
 * Phase D P1-10: breadcrumbs used to capitalize ANY raw URL segment that
 * wasn't in LABEL_MAP — so UUIDs, numeric IDs, slugs etc. rendered as
 * gibberish ("Iq", "Abc-123-def" → "Abc 123 Def", or worse for raw UUIDs).
 *
 * Now: only segments we explicitly know how to label render. Any segment
 * that looks like an ID (UUID, numeric, or just unrecognized) is skipped
 * for breadcrumb purposes — the breadcrumb stops at the last KNOWN segment.
 * If nothing is known, breadcrumbs hide entirely.
 */
const ID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMERIC = /^\d+$/;
function isIdLike(seg: string): boolean {
  return ID_LIKE.test(seg) || NUMERIC.test(seg);
}

function HeaderBreadcrumbs() {
  const { pathname } = useLocation();

  if (KNOWN_SUB_NAV_PATHS.has(pathname)) return null;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  // Build a list of segments we can confidently label. Stop at the first
  // ID-like segment (or hide breadcrumbs entirely if no segment is in
  // LABEL_MAP). Avoids "Iq" → "Iq" and UUID gibberish.
  const labelable: { label: string; path: string }[] = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (isIdLike(seg)) break;
    const known = LABEL_MAP[seg];
    if (!known) break;
    labelable.push({ label: known, path: "/" + segments.slice(0, i + 1).join("/") });
  }

  if (labelable.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {labelable.map((item, i) => {
          const isLast = i === labelable.length - 1;
          return (
            <BreadcrumbItem key={item.path}>
              {i > 0 && <BreadcrumbSeparator />}
              {isLast ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={item.path}>{item.label}</Link>
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
  const isInsightsV2Route = pathname.startsWith("/insights-v2");
  const isLaunchV2Route = pathname.startsWith("/launchv2");
  const isCreativeLibraryRoute = pathname.startsWith("/iq/creative-library");
  const isDashboardVariantsRoute = pathname.startsWith("/dashboard-variants");
  // Both live Creative Report versions own their layout — same shell, only
  // the Overview differs.
  const isCreativeReportRoute =
    pathname.startsWith("/reports/creative-v2") ||
    pathname.startsWith("/reports/creative-v3");
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
    isCreativeReportRoute;
  const { isPinned, isOpen } = useCopilot();

  return (
    <div className="h-screen flex w-full overflow-hidden bg-zinc-100">
      {/* AppShell renders ParentRail + merged shell containing sub-nav + main */}
      <AppShell>
        {!ownsLayout && (
          <div className="border-b border-zinc-900/[0.06] px-4 py-2 flex-shrink-0">
            <HeaderBreadcrumbs />
          </div>
        )}
        <div
          className={cn(
            "flex flex-col relative",
            ownsLayout
              ? "h-full min-h-0 overflow-hidden"
              : "flex-1 overflow-y-auto p-4 2xl:p-5",
          )}
        >
          <Outlet />
        </div>
      </AppShell>

      {/* Pinned/overlay Copilot stays SEPARATE (per A-10.8 Interpretation A:
          "Copilot stays separate floating right") */}
      {isPinned && isOpen && <CopilotPanel />}
      {!isPinned && isOpen && <CopilotPanel />}

      {/* Mobile sheet + Cmd+K palette */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-[280px]">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <MobileNavContent onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      {isMobile && !mobileOpen && (
        /* Phase D P1-7: aria-expanded so screen readers announce open/close
           state. min-h-11/min-w-11 for WCAG 2.5.5 touch target (was p-1.5 on
           h-5 icon = ~32px tap area). */
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-3 left-3 z-50 inline-flex items-center justify-center min-h-11 min-w-11 p-2 rounded-md bg-background border border-border text-foreground hover:bg-accent/10"
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-sheet"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}
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
