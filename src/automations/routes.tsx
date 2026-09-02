/**
 * routes.tsx — the Automation Center's route tree.
 *
 * Same shape as `@/creative-report/routes` and `@/launchv2/routes`: a module
 * exports ONE `<Route>` element and App.tsx mounts it, so adding a screen never
 * touches App.tsx.
 *
 * PARENT + SUB-ROUTES (Maalik, 2026-08-12): the old 2-tab AutomationsHome is
 * retired in favour of real sub-routes — Overview (the consolidated
 * cross-module list) at the index, then one route per contributing module.
 * Sub-routes instead of local tab state means every section is deep-linkable,
 * which the "each module keeps entry points into the center" pattern needs
 * (the old tabs lived in useState and couldn't be linked to at all).
 *
 * The builder stays `React.lazy` — that is what keeps `@xyflow/react` (~50 kB
 * gz plus its stylesheet) out of the main bundle. Everything else is eager:
 * these are the nav destinations and must not flash a spinner.
 */
import { Suspense, lazy } from "react";
import { Route } from "react-router-dom";
import { AutomationsLayout } from "@/automations/AutomationsLayout";
import { OverviewScreen } from "@/automations/center/OverviewScreen";
import { WorkflowsScreen } from "@/automations/center/WorkflowsScreen";
import { CreativeReportScreen } from "@/automations/center/CreativeReportScreen";
import { ModulePreviewScreen } from "@/automations/center/ModulePreviewScreen";
import { SyncHistoryScreen } from "@/automations/center/SyncHistoryScreen";

const BuilderScreen = lazy(() =>
  import("@/automations/BuilderScreen").then((m) => ({ default: m.BuilderScreen })),
);

/** Matches the canvas's own chrome so the swap isn't a jarring blank flash. */
function BuilderFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-muted-foreground">Loading the canvas…</p>
    </div>
  );
}

export const automationsRoutes = (
  <Route path="automation" element={<AutomationsLayout />}>
    <Route index element={<OverviewScreen />} />
    <Route path="workflows" element={<WorkflowsScreen />} />
    <Route
      path="workflows/:id"
      element={
        <Suspense fallback={<BuilderFallback />}>
          <BuilderScreen />
        </Suspense>
      }
    />
    <Route path="creative-report" element={<CreativeReportScreen />} />
    {/* Sync history is a cross-module AUDIT view (which creative went where,
        fired by which automation) — not a "module" adapter like the four
        below, so it isn't in center/model.ts's CENTER_MODULES. Eager, same
        as every other sub-screen here: it touches neither @xyflow/react nor
        the canvas graph store. */}
    <Route path="sync-history" element={<SyncHistoryScreen />} />
    <Route path="launch" element={<ModulePreviewScreen module="launch" />} />
    <Route path="rrm" element={<ModulePreviewScreen module="rrm" />} />
    <Route path="genie" element={<ModulePreviewScreen module="genie" />} />
  </Route>
);
