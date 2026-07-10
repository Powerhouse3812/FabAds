/**
 * Dashboard variants — showcase namespace `/dashboard-variants`.
 * 4 independent visual explorations of the AI-plan dashboard, all fed by the
 * same static snapshot (variantData.ts). Full-bleed (ownsLayout via AppLayout
 * prefix) — see src/components/AppLayout.tsx.
 *
 *   /dashboard-variants            → redirects to /dashboard-variants/editorial
 *   /dashboard-variants/editorial  → EditorialDashboard
 *   /dashboard-variants/terminal   → TerminalDashboard
 *   /dashboard-variants/tonal      → TonalDashboard
 *   /dashboard-variants/classic    → ClassicDarkDashboard
 */
import { Route, Navigate } from "react-router-dom";
import EditorialDashboard from "./EditorialDashboard";
import TerminalDashboard from "./TerminalDashboard";
import TonalDashboard from "./TonalDashboard";
import ClassicDarkDashboard from "./ClassicDarkDashboard";

export const dashboardVariantRoutes = (
  <Route path="dashboard-variants">
    <Route index element={<Navigate to="editorial" replace />} />
    <Route path="editorial" element={<EditorialDashboard />} />
    <Route path="terminal" element={<TerminalDashboard />} />
    <Route path="tonal" element={<TonalDashboard />} />
    <Route path="classic" element={<ClassicDarkDashboard />} />
  </Route>
);
