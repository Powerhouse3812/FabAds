/**
 * AutomationsLayout — the module shell for /automation.
 *
 * Two jobs, both of which have to happen ABOVE the screens:
 *
 * 1. It mounts the workflow runner once for the whole module. The runner drives
 *    simulated runs off the shared 500ms clock; mounting it here (not in
 *    BuilderScreen) means a run keeps advancing while the user navigates back to
 *    the list, which is exactly what a demo does. Same reasoning as
 *    `CreativeReportLayout` mounting v3's runner.
 *
 * 2. It owns full-height layout. `AppLayout` gives modules in its `ownsLayout`
 *    set `h-full min-h-0 overflow-hidden` with no page padding — a node canvas
 *    needs a fixed-height viewport, not a page that grows and scrolls.
 */
import { Outlet } from "react-router-dom";
import { useCanvasWorkflowRunner } from "@/automations/runEngine";

export function AutomationsLayout() {
  // Refcounted internally, so StrictMode's double-mount can't register twice.
  useCanvasWorkflowRunner(true);

  return (
    // `bg-background text-foreground` is load-bearing, not decoration: modules
    // in AppLayout's `ownsLayout` set get no themed wrapper from the shell, so
    // without these the builder's header and run log render on the browser's
    // default white in dark mode while the canvas itself goes dark.
    // CreativeReportLayout sets the same pair for the same reason.
    <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
      <main className="min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
