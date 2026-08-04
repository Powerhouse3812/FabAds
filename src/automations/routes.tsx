/**
 * routes.tsx — the Automations module's route tree.
 *
 * Same shape as `@/creative-report/routes` and `@/launchv2/routes`: a module
 * exports ONE `<Route>` element and App.tsx mounts it, so adding a screen never
 * touches App.tsx.
 *
 * The builder is `React.lazy` — that is what keeps `@xyflow/react` (~50 kB gz
 * plus its stylesheet) out of the main bundle. The home screen is eager because
 * it is the nav destination and must not flash a spinner.
 */
import { Suspense, lazy } from "react";
import { Route } from "react-router-dom";
import { AutomationsLayout } from "@/automations/AutomationsLayout";
import { AutomationsHome } from "@/automations/AutomationsHome";

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
    <Route index element={<AutomationsHome />} />
    <Route
      path="workflows/:id"
      element={
        <Suspense fallback={<BuilderFallback />}>
          <BuilderScreen />
        </Suspense>
      }
    />
  </Route>
);
