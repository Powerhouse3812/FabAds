/**
 * Creative Report 3.0 routes.
 *
 *   /reports/creative-v3  "Creative Report 3.0"  index → Overview
 *                         The redesigned Overview (bucket tabs, Catalogue
 *                         breakdown, recommendations, automations preview).
 *
 * FORK NOTE — Creative Report 2.0 no longer lives here. It used to mount out
 * of this file and share every screen except Overview with 3.0, which meant
 * every 3.0 change silently rewrote 2.0. 2.0 is now a frozen snapshot of
 * commit b5f1cda at `src/creative-report-v2/`, with its own routes.tsx and its
 * own copy of every screen. `App.tsx` mounts the two trees side by side.
 *
 * This directory is the ONLY place 3.0 work happens. It must never import
 * from the frozen 2.0 fork — the freeze only holds while the dependency
 * runs one way (app shell → each version), never version → version.
 *
 * The only per-version input is the `basePath` handed to
 * CreativeReportLayout, which publishes it via ReportBasePathContext so every
 * internal link (sub-nav handoffs, "View all in grid", recommendation
 * actions, the Genie/Launch exits, the dev StatesSwitcher) stays inside the
 * version the user is on.
 *
 * The tree is full-height (ownsLayout via AppLayout prefix); the app shell's
 * secondary nav (modules.ts) provides the sub-nav and CreativeReportLayout
 * renders FilterBar + Outlet.
 *
 *   <base>             → Overview (morning triage)
 *   <base>/creatives   → Creatives grid
 *   <base>/components  → Components report (hooks/headlines/CTAs)
 *   <base>/compare     → Compare (creatives or contexts)
 *   <base>/automations → Automations (rules, boards, digest)
 */
import { Route } from "react-router-dom";
import { CreativeReportLayout } from "./CreativeReportLayout";
import { Overview } from "./screens/Overview";
import { Creatives } from "./screens/Creatives";
import { ComponentsReport } from "./screens/Components";
import { Compare } from "./screens/Compare";
import { Automations } from "./screens/Automations";
import { CREATIVE_REPORT_V3_BASE } from "./state/ReportBasePathContext";

/** Creative Report 3.0 — redesigned Overview. */
export const creativeReportV3Routes = (
  <Route
    path="reports/creative-v3"
    element={<CreativeReportLayout basePath={CREATIVE_REPORT_V3_BASE} />}
  >
    <Route index element={<Overview />} />
    <Route path="creatives" element={<Creatives />} />
    <Route path="components" element={<ComponentsReport />} />
    <Route path="compare" element={<Compare />} />
    <Route path="automations" element={<Automations />} />
  </Route>
);
