/**
 * Automations — iter-2 P4; scoped down to a single automation iter-7.
 * One rules engine (src/creative-report/automations/engine.ts) driving one
 * user-defined action: categorise → file matching creatives into a real
 * Creative Library folder. Plus a simulated scheduled Digest. Tab choice is
 * presentational only (not shareable state), so it's local state — same call
 * already made for Compare's chart-view toggle.
 *
 * Boards (synthetic Board/Folder model) and Sync activity (sync-to-ad-account
 * ledger) have been removed from this screen — boards is superseded by rules
 * pointing at real Creative Library folders, and ad-account sync is moving to
 * Genie/Creative Library. `BoardsPanel` still exists as a file for its
 * separate manual-organisation use elsewhere (see ActionMenu.tsx's per-card
 * "Add to board" option) — it's just no longer rendered here.
 *
 * v2 (`/reports/creative-v2`) vs v3 (`/reports/creative-v3`,
 * `useReportWorkflowsEnabled()`) now share the same two tabs below; only the
 * header blurb and the Rules content (schedule/autoRun, handled inside
 * RuleBuilder/RuleList) still differ by version. Never let this copy drift
 * out of sync with the two behaviours — see RuleList.tsx's header comment
 * for the same v2/v3 split applied per-rule.
 */
import { useState } from "react";
import { cn } from "@/lib/utils";
import { RuleList } from "@/creative-report/automations/components/RuleList";
import { DigestSettings } from "@/creative-report/automations/components/DigestSettings";
import { DigestPreview } from "@/creative-report/automations/components/DigestPreview";
import { useReportWorkflowsEnabled } from "@/creative-report/state/ReportBasePathContext";

const TABS = [
  { key: "rules", label: "Rules" },
  { key: "digest", label: "Digest" },
] as const;
type Tab = (typeof TABS)[number]["key"];

export function Automations() {
  const workflowsEnabled = useReportWorkflowsEnabled();
  const [tab, setTab] = useState<Tab>("rules");

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Automations</h1>
        <p className="text-sm text-muted-foreground">
          {workflowsEnabled ? (
            <>
              Rules that file matching creatives into a Creative Library folder — rules with
              auto-run turned on are evaluated automatically about every 10 seconds. Every match
              here is simulated, never a real write.
            </>
          ) : (
            <>
              Rules that file matching creatives into a Creative Library folder — "Run now" only,
              no background schedule in this prototype.
            </>
          )}
        </p>
      </div>

      <div className="inline-flex items-center rounded-md border border-border bg-muted p-0.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-[5px] px-3 py-1.5 text-[13px] font-medium transition-colors",
              tab === t.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "rules" && <RuleList />}
      {tab === "digest" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <DigestSettings />
          <DigestPreview />
        </div>
      )}
    </div>
  );
}
