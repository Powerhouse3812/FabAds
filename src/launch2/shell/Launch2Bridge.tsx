import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { LaunchFlowProvider } from "../store/launchFlowStore";
import { Launch2OverlayProvider, useLaunch2Overlay } from "./Launch2OverlayProvider";
import { useLaunch2Variant, setLaunch2Variant, VARIANT_CYCLE } from "./useLaunch2Variant";
import { Launch2Topbar } from "./Launch2Topbar";

/**
 * Lightweight wrapper for all /launch2/* routes (mirrors Genie6Bridge).
 *
 * Jobs:
 *   1. Provide flow state (LaunchFlowProvider) + entry overlay across the module.
 *   2. Render the persistent Launch 2.0 topbar (+ New Launch).
 *   3. Bind keyboard shortcuts: ⌘N new launch · ⌘1/2/3 dev variant switch.
 *   4. Apply Geist (font-g6-sans) + the active variant data-attr to page content.
 */
export function Launch2Bridge() {
  return (
    <LaunchFlowProvider>
      <Launch2OverlayProvider>
        <Launch2Shell />
      </Launch2OverlayProvider>
    </LaunchFlowProvider>
  );
}

function Launch2Shell() {
  const { variant } = useLaunch2Variant();
  useLaunch2KeyboardShortcuts();

  return (
    <div
      data-launch2-variant={variant}
      className="g6-root flex min-h-0 flex-1 flex-col bg-background font-g6-sans text-foreground"
    >
      <Launch2Topbar />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}

function useLaunch2KeyboardShortcuts() {
  const { open } = useLaunch2Overlay();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const inField = tag === "input" || tag === "textarea" || target?.isContentEditable;
      const meta = e.metaKey || e.ctrlKey;
      if (!meta || inField) return;

      if (e.key.toLowerCase() === "n" && !e.shiftKey) {
        e.preventDefault();
        open();
        return;
      }
      if (["1", "2", "3"].includes(e.key)) {
        const next = VARIANT_CYCLE[parseInt(e.key, 10) - 1];
        if (next) {
          e.preventDefault();
          setLaunch2Variant(next);
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
}
