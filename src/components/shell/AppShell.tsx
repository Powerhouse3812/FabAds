import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  deriveActiveModule,
  hasSubItems,
  MODULES,
  SYSTEM_MODULES,
} from "@/components/sidebar/modules";
import { ParentNavigationRail } from "./ParentNavigationRail";
import { SecondaryNavigationPanel } from "./SecondaryNavigationPanel";

/**
 * AppShell — V7 ClickUp Strict (iter-6 A-10.8).
 *
 * NEW LAYOUT MODEL per Maalik's reference screenshot:
 *
 *   [ParentRail (separate dark floating card)]
 *   [Merged shell — ONE floating cream card containing:
 *       sub-nav (left zone) | thin divider | main content (right zone)
 *   ]
 *   [Copilot (separate floating card on right when invoked) — handled by AppLayout]
 *
 * Sub-nav is NO LONGER its own floating card — it's a flush left zone inside
 * the merged shell. Main content (the routed Outlet) renders as the right zone
 * inside the same shell.
 *
 * When the active module has NO sub-items (e.g. Dashboard), the sub-nav zone
 * collapses (returns null inside the panel) and main content fills the whole
 * merged shell width.
 *
 * BG: shared cream/off-white token #faf8f3 across the whole merged shell —
 * single visual surface, only the divider separates the two zones.
 *
 * AppShell consumes `children` for the main content area so AppLayout can pass
 * the routed `<Outlet />` directly.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const activeKey = deriveActiveModule(pathname);
  const activeMod = activeKey
    ? [...MODULES, ...SYSTEM_MODULES].find((m) => m.key === activeKey)
    : undefined;
  const showSubNav = !!activeMod && hasSubItems(activeMod);

  return (
    <>
      {/* Parent rail — separate dark floating card (untouched) */}
      <ParentNavigationRail />

      {/* Merged shell — ONE floating cream card containing sub-nav + main */}
      <div
        data-fabads-merged-shell="v7"
        className={cn(
          "relative hidden md:flex flex-1 min-w-0 overflow-hidden",
          "my-2 ml-1 mr-2 rounded-2xl shadow-lg ring-1 ring-zinc-200/70",
          "h-[calc(100vh-1rem)]",
          "bg-[#faf8f3]"
        )}
      >
        {/* Sub-nav zone — flush, no self-floating chrome */}
        {showSubNav && (
          <>
            <SecondaryNavigationPanel />
            {/* Thin vertical divider between sub-nav and main content */}
            <span
              aria-hidden
              className="w-px shrink-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.04)_0%,rgba(0,0,0,0.10)_50%,rgba(0,0,0,0.04)_100%)]"
            />
          </>
        )}

        {/* Main content zone — children = routed <Outlet /> */}
        <main className="flex-1 min-w-0 overflow-auto">
          {children}
        </main>
      </div>
    </>
  );
}
