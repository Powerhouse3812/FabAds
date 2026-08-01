/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  FROZEN SNAPSHOT — Creative Report 2.0                               │
 * │  `src/creative-report-v2/` is a verbatim copy of `src/creative-report`│
 * │  at commit b5f1cda. DO NOT MODIFY IT as part of 3.0 work — all        │
 * │  ongoing changes belong in `src/creative-report/`. Nothing here may   │
 * │  import from the 3.0 module.                                          │
 * │                                                                       │
 * │  This copy only ever mounts under CREATIVE_REPORT_V2_BASE, so         │
 * │  useReportWorkflowsEnabled() is permanently false here — which is     │
 * │  exactly 2.0's baseline behaviour (manual Run-now, no scheduler).     │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ReportBasePathContext — the module's version-aware route prefix.
 *
 * Creative Report ships as TWO live versions that share every screen except
 * Overview:
 *   /reports/creative-v2  → 2.0, the currently-deployed Overview (legacy)
 *   /reports/creative-v3  → 3.0, the redesigned Overview
 *
 * Because the two trees mount the SAME components, nothing inside the module
 * may hardcode `/reports/creative-v2`. Any component that builds an internal
 * link or calls navigate() reads its prefix from here instead, so a click on
 * v3 stays on v3. This file holds the two path literals; `routes.tsx` mounts
 * them and `CreativeReportLayout` provides the active one.
 *
 * Kept as a plain string (not an object) so there is no snapshot/identity
 * churn — the value is a route-level constant and never changes per render.
 *
 * Capabilities tied to v2 vs v3 (e.g. automated workflows) derive from the
 * active base path, not a separate provider. Because the two trees differ
 * only in their route prefix, the base path is the single source of truth —
 * deriving from it avoids another configurable that could disagree with it.
 */
import { createContext, useContext } from "react";

/** The two live versions' route prefixes — the single source of truth. Both
 *  routes.tsx (which mounts them) and the app-level /genie/new handoff stub
 *  (which validates `?from=` against them) read from here, so the literals
 *  exist in exactly one place. */
export const CREATIVE_REPORT_V2_BASE = "/reports/creative-v2";
export const CREATIVE_REPORT_V3_BASE = "/reports/creative-v3";
export const CREATIVE_REPORT_BASES: readonly string[] = [
  CREATIVE_REPORT_V2_BASE,
  CREATIVE_REPORT_V3_BASE,
];

/** The deployed default. Also the fallback for anything rendered outside the
 *  module's layout (e.g. the /genie/new handoff stub lives at app level). */
export const DEFAULT_REPORT_BASE_PATH = CREATIVE_REPORT_V2_BASE;

const ReportBasePathContext = createContext<string>(DEFAULT_REPORT_BASE_PATH);

export function ReportBasePathProvider({
  basePath,
  children,
}: {
  basePath: string;
  children: React.ReactNode;
}) {
  return (
    <ReportBasePathContext.Provider value={basePath}>
      {children}
    </ReportBasePathContext.Provider>
  );
}

/** The active version's route prefix, e.g. "/reports/creative-v2". Never has
 *  a trailing slash, so callers can template `${base}/creatives` directly. */
export function useReportBasePath(): string {
  return useContext(ReportBasePathContext);
}

/** v3 only: rules self-fire on a schedule, the sync-to-ad-account action, and the sync
 *  surfaces in the grid/table/drawer/bulk bar. v2 keeps today's manual Run-now behaviour. */
export function useReportWorkflowsEnabled(): boolean {
  return useReportBasePath() === CREATIVE_REPORT_V3_BASE;
}
