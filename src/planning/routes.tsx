import { Route } from "react-router-dom";
import { PlanningShell } from "./PlanningShell";

/**
 * Pricing / plan-picker page. Three orthogonal toggles encoded in URL
 * search params (`?tier=…&view=…&bill=…`). Mounted inside ProtectedRoute +
 * AppLayout — same pattern as Brand Book.
 *
 * Public print variants live at `/planning-print/:slug` (see
 * src/planning-print/) for html.to.design export.
 */
export const planningRoutes = (
  <Route path="planning" element={<PlanningShell />} />
);
