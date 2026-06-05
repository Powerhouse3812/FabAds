/**
 * Launch 2.0 routes — parallel namespace `/launch2` (v1 Launch at `/launch`
 * is untouched). Mounted inside the FabAds AppLayout shell, wrapped by
 * Launch2Layout (which supplies the Launch2Provider).
 *
 *   /launch2            → Home (genie-style hub)
 *   /launch2/new        → 5-step guided flow
 *   /launch2/:id        → Launch Detail / live progress
 *   /launch2/activity   → Activity log
 *   /launch2/health     → Account Health / recovery
 *   /launch2/settings   → Settings
 */
import { Route } from "react-router-dom";
import Launch2Layout from "./Launch2Layout";
import Launch2Home from "./screens/Launch2Home";
import Launch2Flow from "./screens/flow/Launch2Flow";
import Launch2Detail from "./screens/Launch2Detail";
import Launch2Activity from "./screens/Launch2Activity";
import Launch2Health from "./screens/Launch2Health";
import Launch2Settings from "./screens/Launch2Settings";

export const launch2Routes = (
  <Route path="launch2" element={<Launch2Layout />}>
    <Route index element={<Launch2Home />} />
    <Route path="new" element={<Launch2Flow />} />
    <Route path="activity" element={<Launch2Activity />} />
    <Route path="health" element={<Launch2Health />} />
    <Route path="settings" element={<Launch2Settings />} />
    <Route path=":id" element={<Launch2Detail />} />
  </Route>
);
