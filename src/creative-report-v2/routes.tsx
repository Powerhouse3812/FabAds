/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  FROZEN SNAPSHOT — Creative Report 2.0                               │
 * │                                                                      │
 * │  This whole directory (`src/creative-report-v2/`) is a verbatim copy  │
 * │  of `src/creative-report/` as it existed at commit b5f1cda.          │
 * │  It is DELIBERATELY forked so that Creative Report 3.0 work can      │
 * │  never change what 2.0 looks like again.                             │
 * │                                                                      │
 * │  DO NOT MODIFY ANYTHING IN THIS DIRECTORY as part of 3.0 work.       │
 * │  All ongoing changes belong in `src/creative-report/`.               │
 * │  Nothing here may import from the 3.0 module.                        │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * Creative Report 2.0 routes — the frozen version's own route tree.
 *
 *   /reports/creative-v2  index → OverviewLegacy
 *                         (bucket row, KPI card row, Fatiguing-now list,
 *                          Top movers)
 *
 * Every screen below is 2.0's own copy. There is no longer any shared
 * component instance with 3.0 — that sharing is exactly what caused 2.0 to
 * drift, and ending it is the point of this fork.
 *
 * The tree is full-height (ownsLayout via AppLayout prefix); the app shell's
 * secondary nav (modules.ts) provides the sub-nav and CreativeReportLayout
 * renders FilterBar + Outlet.
 *
 *   <base>               → Overview (morning triage, legacy)
 *   <base>/creatives     → Creatives grid
 *   <base>/components    → Components report (hooks/headlines/CTAs)
 *   <base>/compare       → Compare (creatives or contexts)
 *   <base>/automations   → Automations (rules, boards, digest)
 *   <base>/owner-report  → Owner report (spend/revenue rollups)
 *   <base>/brief-builder → Brief builder (reference-first blocks)
 *   <base>/views         → Saved views
 */
import { Route } from "react-router-dom";
import { CreativeReportLayout } from "./CreativeReportLayout";
import { OverviewLegacy } from "./screens/OverviewLegacy";
import { Creatives } from "./screens/Creatives";
import { ComponentsReport } from "./screens/Components";
import { Compare } from "./screens/Compare";
import { Automations } from "./screens/Automations";
import { OwnerReport } from "./screens/OwnerReport";
import { BriefBuilder } from "./screens/BriefBuilder";
import { SavedViews } from "./screens/SavedViews";
import { CREATIVE_REPORT_V2_BASE } from "./state/ReportBasePathContext";

/** Creative Report 2.0 — frozen at b5f1cda. */
export const creativeReportRoutes = (
  <Route
    path="reports/creative-v2"
    element={<CreativeReportLayout basePath={CREATIVE_REPORT_V2_BASE} />}
  >
    <Route index element={<OverviewLegacy />} />
    <Route path="creatives" element={<Creatives />} />
    <Route path="components" element={<ComponentsReport />} />
    <Route path="compare" element={<Compare />} />
    <Route path="automations" element={<Automations />} />
    <Route path="owner-report" element={<OwnerReport />} />
    <Route path="brief-builder" element={<BriefBuilder />} />
    <Route path="views" element={<SavedViews />} />
  </Route>
);
