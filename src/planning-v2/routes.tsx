import { Route } from "react-router-dom";
import { PlanModalV2Page } from "./PlanModalV2Page";

/**
 * V2 plan-selection — modal-based (not a full page like V1).
 *
 * URL: `/plans-v2` with same `?tier=…&view=…&bill=…` query state as V1.
 * Mounted inside ProtectedRoute + AppLayout — modal overlays the rail.
 * Closing the X navigates back via history.
 *
 * V1 (`/planning`) is preserved alongside this — both routes work.
 * Sidebar entry: "Plans V2" in TOOLS group.
 */
export const planningV2Routes = (
  <Route path="plans-v2" element={<PlanModalV2Page />} />
);
