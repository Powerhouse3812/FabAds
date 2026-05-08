import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Auth from "@/pages/Auth";
import NoAccess from "@/pages/NoAccess";
import LaunchHistory from "@/pages/LaunchHistory";
import TargetingTemplates from "@/pages/TargetingTemplates";
import LaunchFlow from "@/pages/LaunchFlow";
import AutoPilotLaunch from "@/pages/AutoPilotLaunch";
import Genie from "@/pages/iq/Genie";
import Genie2 from "@/pages/iq/Genie2";
import Genie3 from "@/pages/iq/Genie3";
import Genie4 from "@/pages/iq/Genie4";
import VideoSage from "@/pages/iq/VideoSage";
import Copilot from "@/pages/iq/Copilot";
import CreativeLibrary from "@/pages/iq/CreativeLibrary";
import Genie5 from "@/pages/iq/Genie5";
import Genie5QuickStartPage from "@/pages/iq/Genie5QuickStartPage";
import Genie5AISetupPage from "@/pages/iq/Genie5AISetupPage";
import { genie6Routes } from "@/genie6/routes";

import InsightsIntelligence from "@/pages/insights/InsightsIntelligence";
import InsightsDiscover from "@/pages/insights/InsightsDiscover";
import InsightsBoards from "@/pages/insights/InsightsBoards";
import InsightsBoardDetail from "@/pages/insights/InsightsBoardDetail";
import InsightsCompetitors from "@/pages/insights/InsightsCompetitors";
import ActivityLogs from "@/pages/ActivityLogs";
import Integrations from "@/pages/Integrations";
import UMS from "@/pages/UMS";
import Dashboard from "@/pages/Dashboard";
import Offers from "@/pages/Offers";
import RRM from "@/pages/RRM";
import RRMSettings from "@/pages/RRMSettings";
import NotFound from "@/pages/NotFound";
import ResetPassword from "@/pages/ResetPassword";
import ClientManagement from "@/pages/ClientManagement";
import AdAccountsReport from "@/pages/reports/AdAccountsReport";
import CampaignsReport from "@/pages/reports/CampaignsReport";
import AdSetsReport from "@/pages/reports/AdSetsReport";
import AdsReport from "@/pages/reports/AdsReport";
import ImageReport from "@/pages/reports/ImageReport";
import VideoReport from "@/pages/reports/VideoReport";
import AdGroupsReport from "@/pages/reports/AdGroupsReport";
import { CatalogueListPage } from "@/catalogue/CatalogueListPage";
import { CatalogueDetailPage } from "@/catalogue/CatalogueDetailPage";
import { CatalogueFinder } from "@/catalogue/CatalogueFinder";
import { ComingSoonPage } from "@/components/ComingSoonPage";

const queryClient = new QueryClient();
const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="auth" element={<Auth />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="no-access" element={<NoAccess />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                {/* Reports — new flat structure (FB/NB/TT/Creative Reporting) */}
                <Route path="reports" element={<Navigate to="/reports/fb" replace />} />
                <Route path="reports/fb" element={<AdAccountsReport />} />
                <Route path="reports/nb" element={<CampaignsReport />} />
                <Route path="reports/tt" element={<AdSetsReport />} />
                <Route path="reports/creative" element={<ImageReport />} />
                {/* Legacy report routes — keep alive so old bookmarks don't 404 */}
                <Route path="reports/performance/ad-accounts" element={<Navigate to="/reports/fb" replace />} />
                <Route path="reports/performance/campaigns" element={<Navigate to="/reports/nb" replace />} />
                <Route path="reports/performance/ad-sets" element={<Navigate to="/reports/nb" replace />} />
                <Route path="reports/performance/ads" element={<Navigate to="/reports/fb" replace />} />
                <Route path="reports/creative/image" element={<Navigate to="/reports/creative" replace />} />
                <Route path="reports/creative/video" element={<Navigate to="/reports/creative" replace />} />
                <Route path="reports/creative/ad-groups" element={<Navigate to="/reports/creative" replace />} />
                <Route path="launch" element={<LaunchHistory />} />
                <Route path="launch/autopilot" element={<AutoPilotLaunch />} />
                <Route path="launch/new" element={<LaunchFlow />} />
                <Route path="launch/templates" element={<TargetingTemplates />} />
                <Route path="launch/clones" element={<ComingSoonPage label="Clones" description="Clone and variant your best-performing launches." />} />
                <Route path="launch/settings" element={<ComingSoonPage label="Launch Settings" description="Default targeting, nomenclature, naming conventions, and launch presets — manage them once, apply them everywhere." />} />
                <Route path="launch/campaign-urls" element={<Offers />} />
                <Route path="launch/:id" element={<LaunchFlow />} />
                <Route path="iq/genie" element={<Genie />} />
                <Route path="iq/genie2" element={<Genie2 />} />
                <Route path="iq/genie3" element={<Genie3 />} />
                <Route path="iq/genie4" element={<Genie4 />} />
                <Route path="iq/video-sage" element={<VideoSage />} />
                <Route path="iq/video-sage/:id" element={<VideoSage />} />
                <Route path="iq/copilot" element={<Copilot />} />
                <Route path="iq/creative-library" element={<CreativeLibrary />} />
                <Route path="iq/genie5" element={<Genie5 />} />
                <Route path="iq/genie5/studio" element={<Genie5 />} />
                <Route path="iq/genie5/templates" element={<Genie5 />} />
                <Route path="iq/genie5/brands" element={<Genie5 />} />
                <Route path="iq/genie5/brands/:id" element={<Genie5 />} />
                <Route path="iq/genie5/categories" element={<Genie5 />} />
                <Route path="iq/genie5/categories/:id" element={<Genie5 />} />
                <Route path="iq/genie5/quick-start" element={<Genie5QuickStartPage />} />
                <Route path="iq/genie5/ai-setup" element={<Genie5AISetupPage />} />

                {/* Genie 6.0 — mounted inside FabAds shell, like Genie 5.0 */}
                {genie6Routes}

                <Route path="insights" element={<Navigate to="/insights/discover" replace />} />
                <Route path="insights/discover" element={<InsightsDiscover />} />
                <Route path="insights/intelligence" element={<InsightsIntelligence />} />
                <Route path="insights/boards" element={<InsightsBoards />} />
                <Route path="insights/boards/:id" element={<InsightsBoardDetail />} />
                <Route path="insights/competitors" element={<InsightsCompetitors />} />
                <Route path="insights/saved" element={<ComingSoonPage label="Saved Ads" description="Save and organise winning ads from across the web." />} />
                <Route path="activity-logs" element={<ActivityLogs />} />
                <Route path="integrations" element={<Integrations />} />
                <Route path="rrm" element={<RRM />} />
                <Route path="rrm/settings" element={<RRMSettings />} />
                <Route path="ums" element={<UMS />} />
                <Route path="settings/clients" element={<ClientManagement />} />
                <Route path="dashboard" element={<Dashboard />} />

                {/* Catalogue — new FabAds-wide module */}
                <Route path="catalogue" element={<Navigate to="/catalogue/categories" replace />} />
                {/* A-12.42 (Maalik, refined): Finder layout PRESERVED for brand/product/
                    category LISTING. On brand click → full-screen 6-tab Brand Detail page
                    (CatalogueDetailPage). Products + categories: Finder for both list and
                    detail until their tab redesigns ship. */}
                <Route path="catalogue/categories" element={<CatalogueFinder type="categories" />} />
                <Route path="catalogue/categories/:id" element={<CatalogueFinder type="categories" />} />
                <Route path="catalogue/brands" element={<CatalogueFinder type="brands" />} />
                <Route path="catalogue/brands/:id" element={<CatalogueDetailPage type="brands" />} />
                <Route path="catalogue/products" element={<CatalogueFinder type="products" />} />
                <Route path="catalogue/products/:id" element={<CatalogueFinder type="products" />} />
                {/* Iter-6 A-10: Audiences / Angles / Hooks / Concepts / Avatars / Voices —
                    deprioritized entities, still on the Finder UI. */}
                <Route path="catalogue/audiences" element={<CatalogueFinder type="audiences" />} />
                <Route path="catalogue/audiences/:id" element={<CatalogueFinder type="audiences" />} />
                <Route path="catalogue/angles" element={<CatalogueFinder type="angles" />} />
                <Route path="catalogue/angles/:id" element={<CatalogueFinder type="angles" />} />
                <Route path="catalogue/hooks" element={<CatalogueFinder type="hooks" />} />
                <Route path="catalogue/hooks/:id" element={<CatalogueFinder type="hooks" />} />
                <Route path="catalogue/concepts" element={<CatalogueFinder type="concepts" />} />
                <Route path="catalogue/concepts/:id" element={<CatalogueFinder type="concepts" />} />
                <Route path="catalogue/avatars" element={<CatalogueFinder type="avatars" />} />
                <Route path="catalogue/avatars/:id" element={<CatalogueFinder type="avatars" />} />
                <Route path="catalogue/voices" element={<CatalogueFinder type="voices" />} />
                <Route path="catalogue/voices/:id" element={<CatalogueFinder type="voices" />} />
                {/* Backward-compat redirects: old /grid URLs → bare URLs */}
                <Route path="catalogue/categories/grid" element={<Navigate to="/catalogue/categories" replace />} />
                <Route path="catalogue/categories/grid/:id" element={<CatalogueDetailPage type="categories" />} />
                <Route path="catalogue/brands/grid" element={<Navigate to="/catalogue/brands" replace />} />
                <Route path="catalogue/brands/grid/:id" element={<CatalogueDetailPage type="brands" />} />
                <Route path="catalogue/products/grid" element={<Navigate to="/catalogue/products" replace />} />
                <Route path="catalogue/products/grid/:id" element={<CatalogueDetailPage type="products" />} />
                {/* Legacy grid views for deprioritized entities — kept as fallback */}
                <Route path="catalogue/audiences/grid" element={<CatalogueListPage type="audiences" />} />
                <Route path="catalogue/angles/grid" element={<CatalogueListPage type="angles" />} />
                <Route path="catalogue/hooks/grid" element={<CatalogueListPage type="hooks" />} />
                <Route path="catalogue/concepts/grid" element={<CatalogueListPage type="concepts" />} />
                <Route path="catalogue/avatars/grid" element={<CatalogueListPage type="avatars" />} />
                <Route path="catalogue/voices/grid" element={<CatalogueListPage type="voices" />} />
                <Route path="catalogue/audiences/grid/:id" element={<CatalogueDetailPage type="audiences" />} />
                <Route path="catalogue/angles/grid/:id" element={<CatalogueDetailPage type="angles" />} />
                <Route path="catalogue/hooks/grid/:id" element={<CatalogueDetailPage type="hooks" />} />
                <Route path="catalogue/concepts/grid/:id" element={<CatalogueDetailPage type="concepts" />} />
                <Route path="catalogue/avatars/grid/:id" element={<CatalogueDetailPage type="avatars" />} />
                <Route path="catalogue/voices/grid/:id" element={<CatalogueDetailPage type="voices" />} />

                {/* Automation */}
                <Route path="automation" element={<ComingSoonPage label="Automation" description="Automate launch rules, budget pacing, and creative rotation." />} />

                {/* Tools */}
                <Route path="tools" element={<Navigate to="/iq/video-sage" replace />} />
                <Route path="tools/bg-remover" element={<ComingSoonPage label="Background Remover" description="Remove backgrounds from product images in one click." />} />
                <Route path="tools/obj-remover" element={<ComingSoonPage label="Object Remover" description="Erase unwanted objects from ad creatives." />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
