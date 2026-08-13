/**
 * CreativeReportScreen — Automation Center's Creative Report page.
 *
 * `/automation/creative-report`. The "Reporting automations" tab used to live
 * inside AutomationsHome's two-tab layout; this promotes it to a full page in
 * the new Automation Center parent module. `ReportingAutomationsTab` already
 * does the heavy lifting (recommendation strip, rule list with toggle, links
 * back to the Creative Report's own rule builder) and stays untouched — this
 * page only wraps it with page chrome and adds a compact activity strip below
 * so a visitor can see rules actually firing, not just that they exist.
 *
 * The subtitle states the runner's real mechanics plainly: rules evaluate on
 * an interval while the Creative Report is open, and every match is
 * simulated. Softening either half would misrepresent what the engine does.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ReportingAutomationsTab } from "@/automations/ReportingAutomationsTab";
import { useActivityLog, type ActivityEntry } from "@/creative-report/automations/activityStore";
import { CREATIVE_REPORT_V3_BASE } from "@/creative-report/state/ReportBasePathContext";

const ACTIVITY_LOG_HOME = `${CREATIVE_REPORT_V3_BASE}/automations`;
const VISIBLE_COUNT = 10;

/** HH:mm from a stored ISO string — parsing a recorded timestamp, not
 *  reading the current clock, so this is fine inside render. */
function formatTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function OutcomeChip({ outcome }: { outcome: ActivityEntry["outcome"] }) {
  return (
    <span
      className={
        outcome === "applied"
          ? "shrink-0 rounded border border-primary-text px-1 font-mono text-[10px] uppercase tracking-wider text-primary-text"
          : "shrink-0 rounded border border-border px-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
      }
    >
      {outcome}
    </span>
  );
}

export function CreativeReportScreen() {
  const { entries } = useActivityLog();

  // Newest first is already the store's write order (appendEntries prepends),
  // so this only needs a slice — no re-sort that would fight the store.
  const recent = useMemo(() => entries.slice(0, VISIBLE_COUNT), [entries]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 p-6">
      <header>
        <h1 className="text-lg font-semibold text-foreground">Creative Report</h1>
        <p className="text-sm text-muted-foreground">
          Reporting automations — one condition set, one action, evaluated about every 10
          seconds while the report is open. Every match is simulated, never a real write.
        </p>
      </header>

      <ReportingAutomationsTab />

      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <h2 className="text-sm font-medium text-foreground">Recent activity</h2>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            simulated
          </span>
        </div>

        {recent.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No rule activity yet — rules log here when they run.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 px-4 py-2">
                <span className="w-10 shrink-0 font-mono text-[11px] text-muted-foreground">
                  {formatTime(entry.at)}
                </span>
                <span
                  className="min-w-0 flex-1 truncate text-xs font-medium text-foreground"
                  title={entry.ruleName}
                >
                  {entry.ruleName}
                </span>
                <span
                  className="min-w-0 flex-1 truncate text-xs text-muted-foreground"
                  title={entry.creativeName}
                >
                  {entry.creativeName}
                </span>
                <OutcomeChip outcome={entry.outcome} />
                <span
                  className="hidden shrink-0 truncate text-[11px] text-muted-foreground sm:block sm:max-w-[16rem]"
                  title={entry.detail}
                >
                  {entry.detail}
                </span>
              </li>
            ))}
          </ul>
        )}

        {entries.length > VISIBLE_COUNT && (
          <div className="border-t border-border px-4 py-2">
            <p className="text-[11px] text-muted-foreground">
              Showing the {VISIBLE_COUNT} most recent of {entries.length} —{" "}
              <Link to={ACTIVITY_LOG_HOME} className="text-primary-text hover:underline">
                full log in the Creative Report
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
