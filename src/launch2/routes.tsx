import { Route } from "react-router-dom";
import { Launch2Bridge } from "./shell/Launch2Bridge";
import { Launch2Home } from "./home/Launch2Home";
import { FlowShell } from "./flow/FlowShell";
import { Launch2Detail } from "./detail/Launch2Detail";
import { Launch2Activity } from "./activity/Launch2Activity";
import { Launch2Health } from "./health/Launch2Health";
import { Launch2Settings } from "./settings/Launch2Settings";

/**
 * Launch 2.0 — greenfield Meta bulk-launch module. Mounted inside FabAds
 * AppLayout at /launch2/* (parallel namespace; v1 Launch at /launch/* is
 * untouched). <Launch2Bridge> provides flow state + entry overlay + the
 * persistent topbar to every sub-route.
 *
 * 6 surfaces: Home · Guided Flow · Launch Detail · Activity · Account-Health · Settings.
 */
export const launch2Routes = (
  <Route path="launch2" element={<Launch2Bridge />}>
    <Route index element={<Launch2Home />} />
    <Route path="new" element={<FlowShell />} />
    <Route path="activity" element={<Launch2Activity />} />
    <Route path="health" element={<Launch2Health />} />
    <Route path="settings" element={<Launch2Settings />} />
    <Route path=":id" element={<Launch2Detail />} />
  </Route>
);
