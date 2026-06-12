/**
 * Launch v2 routes — fresh namespace `/launchv2` (v1 /launch + current /launch2
 * untouched). Full-height (ownsLayout via AppLayout prefix).
 *   /launchv2              → Hub (history + quick actions)
 *   /launchv2/new          → New launch (the 4-step flow)
 *   /launchv2/settings     → Launch v2 settings (Templates management)
 *   /launchv2/settings/*   → Templates sub-tabs (rendered by same component)
 *   /launchv2/auto         → Auto launch placeholder
 *   /launchv2/:id          → Launch detail / live progress
 */
import { Route } from "react-router-dom";
import LaunchV2Layout from "./LaunchV2Layout";
import LaunchV2Flow from "./screens/LaunchV2Flow";
import LaunchV2Detail from "./screens/LaunchV2Detail";
import LaunchV2Settings from "./screens/LaunchV2Settings";
import LaunchV2Hub from "./screens/LaunchV2Hub";
import LaunchV2Auto from "./screens/LaunchV2Auto";
import FeedbackPanel from "./feedback/FeedbackPanel";

export const launchV2Routes = (
  <Route path="launchv2" element={<LaunchV2Layout />}>
    <Route index element={<LaunchV2Hub />} />
    <Route path="new" element={<LaunchV2Flow />} />
    {/* Internal-only feedback dashboard — reached via long-press on the avatar. */}
    <Route path="feedback-panel" element={<FeedbackPanel />} />
    <Route path="settings" element={<LaunchV2Settings />} />
    <Route path="settings/audience" element={<LaunchV2Settings />} />
    <Route path="settings/setup" element={<LaunchV2Settings />} />
    <Route path="settings/distribution" element={<LaunchV2Settings />} />
    <Route path="settings/strategy" element={<LaunchV2Settings />} />
    <Route path="settings/launch" element={<LaunchV2Settings />} />
    <Route path="auto" element={<LaunchV2Auto />} />
    <Route path=":id" element={<LaunchV2Detail />} />
  </Route>
);
