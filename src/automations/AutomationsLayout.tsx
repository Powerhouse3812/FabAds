/**
 * AutomationsLayout — the module shell for /automation.
 *
 * Two jobs, both of which have to happen ABOVE the screens:
 *
 * 1. It mounts BOTH workflow runners once for the whole module — the run engine
 *    that advances in-flight runs, and the auto-runner that decides which armed
 *    workflow starts one. Two registrations on the one shared 500ms clock
 *    (`registerWorkflowRunner` is a keyed map), split because they answer
 *    different questions: `useCanvasWorkflowRunner` = "move the running run
 *    forward", `useCanvasAutoRunner` = "should anything start?". Mounting them
 *    here (not in BuilderScreen) means a run keeps advancing — and an armed
 *    workflow keeps being evaluated — while the user navigates back to the list,
 *    which is exactly what a demo does. Same reasoning as
 *    `CreativeReportLayout` mounting v3's runner.
 *
 * 2. It owns full-height layout. `AppLayout` gives modules in its `ownsLayout`
 *    set `h-full min-h-0 overflow-hidden` with no page padding — a node canvas
 *    needs a fixed-height viewport, not a page that grows and scrolls.
 */
import { Outlet } from "react-router-dom";
import { useCanvasWorkflowRunner } from "@/automations/runEngine";
import { useCanvasAutoRunner } from "@/automations/autoRunner";

export function AutomationsLayout() {
  // Both refcounted internally, so StrictMode's double-mount can't register
  // twice. Unconditionally `true` — unlike `CreativeReportLayout`, which gates
  // its runner on the v3 base path because two report variants share one
  // component tree; /automation has no such fork.
  useCanvasWorkflowRunner(true);
  // Order matters only for the first tick: the auto-runner's `start()` fires an
  // immediate pass, and the run engine must already be registered so the run it
  // starts advances on the very next tick instead of sitting at step one.
  useCanvasAutoRunner(true);

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
