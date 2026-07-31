/**
 * Creative Report 2.0 — module shell.
 * The app shell's secondary nav (driven by modules.ts) already provides the
 * module's left sub-nav (Overview / Creatives / Components / Compare / Saved
 * views) — same convention as Genie 6.0 and Launch v2 — so this layout does
 * NOT render a second internal rail. It owns its own scroll region inside
 * AppLayout's full-height area: FilterBar (sticky) + Outlet (scrollable) +
 * a DEV-only footer.
 *
 * Mounted twice — once per live version (`/reports/creative-v2` = 2.0 legacy
 * Overview, `/reports/creative-v3` = 3.0 redesigned Overview). The `basePath`
 * prop is the ONLY thing that differs; it is published through
 * ReportBasePathProvider so every internal link inside the module resolves
 * against the version the user is actually on.
 */
import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { FilterBar } from "@/creative-report/components/FilterBar";
import { ForcedStateProvider } from "@/creative-report/state/ForcedStateContext";
import {
  ReportBasePathProvider,
  DEFAULT_REPORT_BASE_PATH,
} from "@/creative-report/state/ReportBasePathContext";
import { CreativeActionsProvider } from "@/creative-report/actions/useCreativeActions";
import { StatesSwitcher } from "@/creative-report/components/StatesSwitcher";
import { AnnotateToggle } from "@/creative-report/components/AnnotateToggle";
import { runDataAudit } from "@/data/audit";
import { useWorkflowRunner } from "@/creative-report/automations/runner";
import { CREATIVE_REPORT_V3_BASE } from "@/creative-report/state/ReportBasePathContext";

// Run the §4 data audit once per session in dev so the console proves the
// generated dataset is honest (no averaged ratios, no unit bugs, image ads
// N/A). Module-level guard avoids re-running on every mount/HMR.
let audited = false;

export function CreativeReportLayout({
  basePath = DEFAULT_REPORT_BASE_PATH,
}: {
  basePath?: string;
} = {}) {
  // Auto-evaluation is v3-only. Gated on the basePath PROP rather than the
  // context hook so there's no provider-timing question: the runner registers
  // with the module-level clock, which outlives this component, so a background
  // sync keeps progressing while the user navigates elsewhere in the app.
  useWorkflowRunner(basePath === CREATIVE_REPORT_V3_BASE);

  useEffect(() => {
    if (import.meta.env.DEV && !audited) {
      audited = true;
      runDataAudit({ log: true });
    }
  }, []);

  return (
    <ReportBasePathProvider basePath={basePath}>
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
              <div className="flex items-center gap-3">
                <AnnotateToggle />
                <StatesSwitcher />
              </div>
            </footer>
          )}
        </div>
      </CreativeActionsProvider>
      </ForcedStateProvider>
    </ReportBasePathProvider>
  );
}
