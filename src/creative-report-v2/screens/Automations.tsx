/**
 * Automations — iter-2 P4; v3 workflows + Sync activity tab added iter-3.
 * Sections sharing one rules engine (src/creative-report-v2/automations/engine.ts):
 * user-defined Rules (categorise → auto-file into a board or sync to an ad
 * account library, or launch → auto-pause/queue), Folders>Boards (Foreplay-
 * style, smart boards driven by a categorise rule), a simulated scheduled
 * Digest, and — v3 only — a Sync activity ledger. Tab choice is
 * presentational only (not shareable state), so it's local state — same call
 * already made for Compare's chart-view toggle.
 *
 * v2 (`/reports/creative-v2`) vs v3 (`/reports/creative-v3`,
 * `useReportWorkflowsEnabled()`): v2 keeps today's Run-now-only wording and
 * exactly three tabs, verbatim. v3 additionally tells the truth that rules
 * can self-fire unattended (evaluated roughly every 10 seconds, every action
 * simulated) and gets a 4th "Sync activity" tab. Never let this copy drift
 * out of sync with the two behaviours — see RuleList.tsx's header comment
 * for the same v2/v3 split applied per-rule.
 */
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RuleList } from "@/creative-report-v2/automations/components/RuleList";
import { BoardsPanel } from "@/creative-report-v2/automations/components/BoardsPanel";
import { DigestSettings } from "@/creative-report-v2/automations/components/DigestSettings";
import { DigestPreview } from "@/creative-report-v2/automations/components/DigestPreview";
import { useReportWorkflowsEnabled } from "@/creative-report-v2/state/ReportBasePathContext";
import { useSyncStore } from "@/creative-report-v2/automations/sync/syncStore";
import { SYNC_STATUS_LABELS } from "@/creative-report-v2/automations/sync/syncModel";
import { ACCOUNT_BY_ID } from "@/data/accounts";
import { getDataset } from "@/data/generator";
import { NAME_MAX, pluralize, truncate } from "@/creative-report-v2/lib/format";

const CORE_TABS = [
  { key: "rules", label: "Rules" },
  { key: "boards", label: "Boards" },
  { key: "digest", label: "Digest" },
] as const;
const ALL_TABS = [...CORE_TABS, { key: "sync", label: "Sync activity" } as const] as const;
type Tab = (typeof ALL_TABS)[number]["key"];

/** Cap the ledger's DOM so a heavily-used demo (hundreds of simulated
 *  uploads) doesn't render an unbounded table. */
const MAX_VISIBLE_SYNCS = 100;

function formatSyncWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** v3-only: a flat, newest-first ledger of every simulated sync-to-account
 *  record, regardless of which rule (or a person, by hand) caused it. */
function SyncActivityTab() {
  const syncState = useSyncStore();
  // Full, unfiltered creative directory — a synced creative may not be in
  // the current report filters, but its name must still resolve here.
  const dataset = useMemo(() => getDataset(), []);

  // Object.values(...) builds a new array every call — safe here because
  // this runs inside this component's own useMemo, not inside the sync
  // store's getSnapshot (useSyncStore() above is the only store hook call).
  const records = useMemo(
    () =>
      Object.values(syncState.records).sort(
        (a, b) => Date.parse(b.queuedAt) - Date.parse(a.queuedAt),
      ),
    [syncState],
  );

  if (records.length === 0) {
    return (
      <div className="flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-border text-[13px] text-muted-foreground">
        No syncs yet.
      </div>
    );
  }

  const visibleRecords = records.slice(0, MAX_VISIBLE_SYNCS);

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {pluralize(records.length, "sync", "syncs")} recorded — every row here is simulated, not a
        real Meta API call.
      </p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Creative</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rule</TableHead>
              <TableHead>When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRecords.map((record) => {
              const creative = dataset.creativeById[record.creativeId];
              const rawName = creative?.name ?? record.creativeId;
              const name = truncate(rawName, NAME_MAX);
              const accountName = ACCOUNT_BY_ID[record.accountId]?.name ?? "Unknown account";
              // Manual triggers are recorded with ruleId === null — never
              // invent a rule name for those, always say "Manual".
              const ruleLabel = record.ruleId === null ? "Manual" : record.ruleName;
              const when = record.finishedAt ?? record.startedAt ?? record.queuedAt;

              return (
                <TableRow key={record.id}>
                  <TableCell
                    className="max-w-[220px] truncate text-[13px] font-medium text-foreground"
                    title={name.truncated ? rawName : undefined}
                  >
                    {name.text}
                  </TableCell>
                  <TableCell className="text-[13px] text-muted-foreground">{accountName}</TableCell>
                  <TableCell className="text-[13px] text-muted-foreground">
                    {SYNC_STATUS_LABELS[record.status]}
                    {record.status === "failed" && record.failedReason
                      ? ` — ${record.failedReason}`
                      : ""}
                  </TableCell>
                  <TableCell className="text-[13px] text-muted-foreground">{ruleLabel}</TableCell>
                  <TableCell className="whitespace-nowrap text-[13px] text-muted-foreground">
                    {formatSyncWhen(when)} (simulated)
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {records.length > MAX_VISIBLE_SYNCS && (
        <p className="text-xs text-muted-foreground">
          Showing the most recent {MAX_VISIBLE_SYNCS} of {pluralize(records.length, "sync", "syncs")}.
        </p>
      )}
    </div>
  );
}

export function Automations() {
  const workflowsEnabled = useReportWorkflowsEnabled();
  const [tab, setTab] = useState<Tab>("rules");
  const tabs: readonly { key: Tab; label: string }[] = workflowsEnabled ? ALL_TABS : CORE_TABS;

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Automations</h1>
        <p className="text-sm text-muted-foreground">
          {workflowsEnabled ? (
            <>
              Rules that auto-file creatives into boards, auto-pause/queue them for relaunch, or
              sync them into ad account libraries — rules with auto-run turned on are evaluated
              automatically about every 10 seconds. Every automated match and sync action here is
              simulated, never a real Meta API call.
            </>
          ) : (
            <>
              Rules that auto-file creatives into boards or auto-pause/queue them for relaunch —
              one engine, "Run now" only (no real background schedule in this prototype).
            </>
          )}
        </p>
      </div>

      <div className="inline-flex items-center rounded-md border border-border bg-muted p-0.5">
        {tabs.map((t) => (
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
      {tab === "boards" && <BoardsPanel />}
      {tab === "digest" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <DigestSettings />
          <DigestPreview />
        </div>
      )}
      {tab === "sync" && workflowsEnabled && <SyncActivityTab />}
    </div>
  );
}
