/**
 * Creative Report 2.0 — module shell.
 * The app shell's secondary nav (driven by modules.ts) already provides the
 * module's left sub-nav (Overview / Creatives / Components / Compare / Saved
 * views) — same convention as Genie 6.0 and Launch v2 — so this layout does
 * NOT render a second internal rail. It owns its own scroll region inside
 * AppLayout's full-height area: FilterBar (sticky) + Outlet (scrollable) +
 * a DEV-only footer.
 */
import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { FilterBar } from "@/creative-report/components/FilterBar";
import { ForcedStateProvider } from "@/creative-report/state/ForcedStateContext";
import { CreativeActionsProvider } from "@/creative-report/actions/useCreativeActions";
import { StatesSwitcher } from "@/creative-report/components/StatesSwitcher";
import { runDataAudit } from "@/data/audit";

// Run the §4 data audit once per session in dev so the console proves the
// generated dataset is honest (no averaged ratios, no unit bugs, image ads
// N/A). Module-level guard avoids re-running on every mount/HMR.
let audited = false;

export function CreativeReportLayout() {
  useEffect(() => {
    if (import.meta.env.DEV && !audited) {
      audited = true;
      runDataAudit({ log: true });
    }
  }, []);

  return (
    <ForcedStateProvider>
      <CreativeActionsProvider>
        <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
          <FilterBar />
          <main className="min-h-0 flex-1 overflow-y-auto">
            <Outlet />
          </main>
          {import.meta.env.DEV && (
            <footer className="flex items-center justify-between border-t border-border px-4 py-1.5">
              <span className="text-xs text-muted-foreground">Prototype — simulated data</span>
              <StatesSwitcher />
            </footer>
          )}
        </div>
      </CreativeActionsProvider>
    </ForcedStateProvider>
  );
}
