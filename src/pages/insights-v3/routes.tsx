/**
 * Industry Insights V2 routes — fresh namespace `/industry-insights` beside the
 * old module (/insights/*, /insights-v2/*), which stays untouched.
 * Spec: docs/industry-insights/. Route table mirrors INSIGHTS_ROUTES in
 * src/lib/insights-v3/types.ts.
 *
 * Detail overlays, the ad drawer and modals are NOT routes: they are URL
 * params on whichever page is open (see QP in types.ts), so every page can
 * open every overlay and a shared link reproduces the exact view.
 */
import { Navigate, Route } from "react-router-dom";
import MyFeedsPage from "./MyFeedsPage";
import DiscoverPage from "./DiscoverPage";
import AdvertiserPage from "./AdvertiserPage";
import ElementsPage from "./ElementsPage";
import SavedAdsPage from "./SavedAdsPage";
import BoardsPage from "./BoardsPage";
import BoardDetailPage from "./BoardDetailPage";
// Dev-only: shared UI kit preview (all states). Not in nav.
import KitPreview from "@/components/insights-v3/shared/__preview__/KitPreview";

export const insightsV3Routes = (
  <Route path="industry-insights">
    {/* Discover is the market view the spec says users land on. */}
    <Route index element={<Navigate to="/industry-insights/discover" replace />} />
    <Route path="feeds" element={<MyFeedsPage />} />
    <Route path="discover" element={<DiscoverPage />} />
    <Route path="advertisers" element={<AdvertiserPage />} />
    <Route path="elements" element={<ElementsPage />} />
    <Route path="saved" element={<SavedAdsPage />} />
    <Route path="boards" element={<BoardsPage />} />
    <Route path="boards/:id" element={<BoardDetailPage />} />
    <Route path="_kit" element={<KitPreview />} />
  </Route>
);
