/**
 * Creative Report 2.0 routes — fresh namespace `/reports/creative-v2`
 * (existing /reports untouched). Full-height (ownsLayout via AppLayout
 * prefix); the app shell's secondary nav provides the sub-nav, and
 * CreativeReportLayout renders FilterBar + Outlet.
 *   /reports/creative-v2             → Overview (morning triage)
 *   /reports/creative-v2/creatives   → Creatives grid
 *   /reports/creative-v2/components  → Components report (hooks/headlines/CTAs)
 *   /reports/creative-v2/compare     → Compare (creatives or contexts)
 *   /reports/creative-v2/automations → Automations (rules, boards, digest)
 *   /reports/creative-v2/owner-report → Owner report (spend/revenue rollups)
 *   /reports/creative-v2/brief-builder → Brief builder (reference-first blocks)
 *   /reports/creative-v2/views       → Saved views
 */
import { Route } from "react-router-dom";
import { CreativeReportLayout } from "./CreativeReportLayout";
import { Overview } from "./screens/Overview";
import { Creatives } from "./screens/Creatives";
import { ComponentsReport } from "./screens/Components";
import { Compare } from "./screens/Compare";
import { Automations } from "./screens/Automations";
import { OwnerReport } from "./screens/OwnerReport";
import { BriefBuilder } from "./screens/BriefBuilder";
import { SavedViews } from "./screens/SavedViews";

export const creativeReportRoutes = (
  <Route path="reports/creative-v2" element={<CreativeReportLayout />}>
    <Route index element={<Overview />} />
    <Route path="creatives" element={<Creatives />} />
    <Route path="components" element={<ComponentsReport />} />
    <Route path="compare" element={<Compare />} />
    <Route path="automations" element={<Automations />} />
    <Route path="owner-report" element={<OwnerReport />} />
    <Route path="brief-builder" element={<BriefBuilder />} />
    <Route path="views" element={<SavedViews />} />
  </Route>
);
