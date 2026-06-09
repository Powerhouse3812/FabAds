/**
 * Launch v2 routes — fresh namespace `/launchv2` (v1 /launch + current /launch2
 * untouched). Full-height (ownsLayout via AppLayout prefix).
 *   /launchv2           → New launch (the 4-step flow)
 *   /launchv2/settings  → Launch v2 settings (Templates management)
 *   /launchv2/:id       → Launch detail / live progress
 */
import { Navigate, Route } from "react-router-dom";
import LaunchV2Layout from "./LaunchV2Layout";
import LaunchV2Flow from "./screens/LaunchV2Flow";
import LaunchV2Detail from "./screens/LaunchV2Detail";
import LaunchV2Settings from "./screens/LaunchV2Settings";

export const launchV2Routes = (
  <Route path="launchv2" element={<LaunchV2Layout />}>
    <Route index element={<LaunchV2Flow />} />
    <Route path="new" element={<Navigate to="/launchv2" replace />} />
    <Route path="settings" element={<LaunchV2Settings />} />
    <Route path=":id" element={<LaunchV2Detail />} />
  </Route>
);
