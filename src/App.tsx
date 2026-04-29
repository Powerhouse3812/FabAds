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
                <Route path="reports" element={<Navigate to="/reports/performance/ad-accounts" replace />} />
                <Route path="reports/performance/ad-accounts" element={<AdAccountsReport />} />
                <Route path="reports/performance/campaigns" element={<CampaignsReport />} />
                <Route path="reports/performance/ad-sets" element={<AdSetsReport />} />
                <Route path="reports/performance/ads" element={<AdsReport />} />
                <Route path="reports/creative/image" element={<ImageReport />} />
                <Route path="reports/creative/video" element={<VideoReport />} />
                <Route path="reports/creative/ad-groups" element={<AdGroupsReport />} />
                <Route path="launch" element={<LaunchHistory />} />
                <Route path="launch/autopilot" element={<AutoPilotLaunch />} />
                <Route path="launch/new" element={<LaunchFlow />} />
                <Route path="launch/templates" element={<TargetingTemplates />} />
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

                <Route path="insights" element={<Navigate to="/insights/intelligence" replace />} />
                <Route path="insights/intelligence" element={<InsightsIntelligence />} />
                <Route path="insights/discover" element={<InsightsDiscover />} />
                <Route path="insights/boards" element={<InsightsBoards />} />
                <Route path="insights/boards/:id" element={<InsightsBoardDetail />} />
                <Route path="insights/competitors" element={<InsightsCompetitors />} />
                <Route path="activity-logs" element={<ActivityLogs />} />
                <Route path="integrations" element={<Integrations />} />
                <Route path="rrm" element={<RRM />} />
                <Route path="rrm/settings" element={<RRMSettings />} />
                <Route path="ums" element={<UMS />} />
                <Route path="settings/clients" element={<ClientManagement />} />
                <Route path="dashboard" element={<Dashboard />} />
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
