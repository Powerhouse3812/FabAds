/**
 * Creative Report routes — TWO live versions of the same module.
 *
 *   /reports/creative-v2  "Creative Report 2.0"  index → OverviewLegacy
 *                         The currently-deployed Overview (bucket row, KPI
 *                         card row, Fatiguing-now list, Top movers).
 *   /reports/creative-v3  "Creative Report 3.0"  index → Overview
 *                         The redesigned Overview (bucket tabs, Catalogue
 *                         breakdown, recommendations, automations preview).
 *
 * Everything OUTSIDE Overview is IDENTICAL between the two — the same
 * component instances, the same data layer, the same URL-param contract. The
 * shared screens are deliberately not forked: a fix to Creatives/Compare/
 * Automations/Owner report/Brief builder/Saved views lands on both versions
 * at once. The only per-version input is the `basePath` handed to
 * CreativeReportLayout, which publishes it via ReportBasePathContext so every
 * internal link (sub-nav handoffs, "View all in grid", recommendation
 * actions, the Genie/Launch exits, the dev StatesSwitcher) stays inside the
 * version the user is on.
 *
 * These two string literals are the ONLY place `/reports/creative-vN` appears
 * inside the module. Keep it that way.
 *
 * Both trees are full-height (ownsLayout via AppLayout prefix); the app
 * shell's secondary nav (modules.ts) provides the sub-nav and
 * CreativeReportLayout renders FilterBar + Outlet.
 *
 *   <base>             → Overview (morning triage)
 *   <base>/creatives   → Creatives grid
 *   <base>/components  → Components report (hooks/headlines/CTAs)
 *   <base>/compare     → Compare (creatives or contexts)
 *   <base>/automations → Automations (rules, boards, digest)
 *   <base>/owner-report → Owner report (spend/revenue rollups)
 *   <base>/brief-builder → Brief builder (reference-first blocks)
 *   <base>/views       → Saved views
 */
import { Route } from "react-router-dom";
import { CreativeReportLayout } from "./CreativeReportLayout";
import { Overview } from "./screens/Overview";
import { OverviewLegacy } from "./screens/OverviewLegacy";
import { Creatives } from "./screens/Creatives";
import { ComponentsReport } from "./screens/Components";
import { Compare } from "./screens/Compare";
import { Automations } from "./screens/Automations";
import { OwnerReport } from "./screens/OwnerReport";
import { BriefBuilder } from "./screens/BriefBuilder";
import { SavedViews } from "./screens/SavedViews";
import {
  CREATIVE_REPORT_V2_BASE,
  CREATIVE_REPORT_V3_BASE,
} from "./state/ReportBasePathContext";

/** Every child route except the index — byte-identical across both versions.
 *  Rendered as a fragment inside each version's layout Route. */
const sharedChildren = (
  <>
    <Route path="creatives" element={<Creatives />} />
    <Route path="components" element={<ComponentsReport />} />
    <Route path="compare" element={<Compare />} />
    <Route path="automations" element={<Automations />} />
    <Route path="owner-report" element={<OwnerReport />} />
    <Route path="brief-builder" element={<BriefBuilder />} />
    <Route path="views" element={<SavedViews />} />
  </>
);

/** Creative Report 2.0 — deployed Overview. */
export const creativeReportRoutes = (
  <Route
    path="reports/creative-v2"
    element={<CreativeReportLayout basePath={CREATIVE_REPORT_V2_BASE} />}
  >
    <Route index element={<OverviewLegacy />} />
    {sharedChildren}
  </Route>
);

/** Creative Report 3.0 — redesigned Overview. */
export const creativeReportV3Routes = (
  <Route
    path="reports/creative-v3"
    element={<CreativeReportLayout basePath={CREATIVE_REPORT_V3_BASE} />}
  >
    <Route index element={<Overview />} />
    {sharedChildren}
  </Route>
);
