/**
 * Creative Report 2.0 — pure selectors over SyncStoreState.
 *
 * No React, no hooks. Every function here reads a `SyncStoreState` snapshot
 * (from `useSyncStore()` at the call site) and derives a view over it.
 * `summariseCreative` / `summariseSelection` each build a NEW object per
 * call — see the header comment on each. Never call them from inside the
 * sync store's getSnapshot; that is the exact bug documented at
 * boards.ts:11-16 and syncStore.ts's file header. Call them inside the
 * consumer's own `useMemo`, keyed on the pieces of state they actually read.
 */
import type { SyncStoreState } from "@/creative-report/automations/sync/syncStore";
import type { CreativeSyncSummary, SelectionSyncSummary, SyncRecord } from "@/creative-report/automations/sync/syncModel";

/** Both "in the queue" and "actively uploading" read as one bucket for the
 *  duplicate-upload guard and the in-flight badge — only the record's own
 *  `status`/`progress` distinguish them for detail views. */
const IN_FLIGHT_STATUSES = new Set(["queued", "running"]);

/** "Already spoken for" for the purposes of the bulk-sync duplicate guard:
 *  a pair that is queued, running, or done should not be silently
 *  re-enqueued — this must mirror `BLOCKING_STATUSES` in syncStore.ts. */
const ALREADY_STATUSES = new Set(["queued", "running", "done"]);

/** Returns a new object — call inside useMemo. */
export function summariseCreative(state: SyncStoreState, creativeId: string): CreativeSyncSummary {
  const records: SyncRecord[] = [];
  for (const record of Object.values(state.records)) {
    if (record.creativeId === creativeId) records.push(record);
  }
  records.sort((a, b) => Date.parse(b.queuedAt) - Date.parse(a.queuedAt)); // newest-first

  const syncedAccountIds: string[] = [];
  const inFlightAccountIds: string[] = [];
  const failedAccountIds: string[] = [];

  for (const record of records) {
    if (record.status === "done") syncedAccountIds.push(record.accountId);
    else if (IN_FLIGHT_STATUSES.has(record.status)) inFlightAccountIds.push(record.accountId);
    else if (record.status === "failed") failedAccountIds.push(record.accountId);
  }

  return { syncedAccountIds, inFlightAccountIds, failedAccountIds, records };
}

/** Returns a new object — call inside useMemo. */
export function summariseSelection(state: SyncStoreState, creativeIds: string[]): SelectionSyncSummary {
  const idSet = new Set(creativeIds);
  const alreadyByAccount: Record<string, string[]> = {};

  for (const record of Object.values(state.records)) {
    if (!idSet.has(record.creativeId)) continue;
    if (!ALREADY_STATUSES.has(record.status)) continue;
    const list = alreadyByAccount[record.accountId] ?? (alreadyByAccount[record.accountId] = []);
    if (!list.includes(record.creativeId)) list.push(record.creativeId);
  }

  return { alreadyByAccount, totalSelected: creativeIds.length };
}

/** Newest-first records attributed to a given rule (survives rule deletion
 *  since `ruleName` is snapshotted onto the record at enqueue time). */
export function recordsForRule(state: SyncStoreState, ruleId: string): SyncRecord[] {
  return Object.values(state.records)
    .filter((record) => record.ruleId === ruleId)
    .sort((a, b) => Date.parse(b.queuedAt) - Date.parse(a.queuedAt));
}
