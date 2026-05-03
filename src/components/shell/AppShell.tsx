import { ParentNavigationRail } from "./ParentNavigationRail";
import { SecondaryNavigationPanel } from "./SecondaryNavigationPanel";

/**
 * AppShell — V7 (ClickUp Strict) wrapper.
 *
 * Composes:
 *   1. ParentNavigationRail (dark, 60px, far left)
 *   2. SecondaryNavigationPanel (light, 264px, immediately right) — only renders
 *      when active module has sub-items
 *   3. MainContentArea (children) — existing routed content
 *   4. RightUtilityPanel — handled by parent layout (CopilotPanel exists in AppLayout
 *      conditionally; we don't redefine it here per spec "only style if app already has one")
 *
 * Per spec:
 *   - All four columns are independent siblings; no column "owns" another
 *   - Each scrolls independently
 *   - 100vh, overflow-hidden at the parent
 *   - Existing nav data and active-state logic untouched (consumed via the
 *     leaf components)
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ParentNavigationRail />
      <SecondaryNavigationPanel />
      <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
        {children}
      </main>
    </>
  );
}
