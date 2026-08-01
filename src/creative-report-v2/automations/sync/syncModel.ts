/**
 * sync/syncModel.ts — pure types + helpers for the "sync to Meta ad account
 * library" automation action (v3-only; /reports/creative-v2 is unaffected).
 *
 * No store, no React. Simulated background upload only — this prototype
 * never talks to a real Meta API. `simulated: true` on every SyncRecord is
 * how every surface knows to print "(simulated)" rather than imply a real
 * upload happened.
 */
import { hashString } from "@/data/rng";
import { AD_ACCOUNTS, type AdAccount } from "@/data/accounts";
import { WORKFLOW_JOB_STATUSES, type WorkflowJobStatus } from "@/workflows/core";

/** Persisted status keys are the GENERIC four so the later lift to
 *  /automation needs no migration. Creative-Report-facing labels live here,
 *  not in the stored data. */
export const SYNC_STATUS_LABELS: Record<WorkflowJobStatus, string> = {
  queued: "Queued",
  running: "Uploading",
  done: "Synced",
  failed: "Failed",
};

export interface SyncRecord {
  /** `${creativeId}::${accountId}` — the idempotency key AND the record id. */
  id: string;
  creativeId: string;
  accountId: string;
  status: WorkflowJobStatus;
  /** null = user-triggered from the bulk bar or drawer, not by a rule. */
  ruleId: string | null;
  /** Snapshot of the rule's name at run time — the audit trail must survive rule deletion. */
  ruleName: string;
  queuedAt: string;
  startedAt?: string;
  finishedAt?: string;
  /** Honest copy only — never a fabricated API error string. */
  failedReason?: string;
  /** 0–100, quantized to steps of 10. Only meaningful while running. */
  progress: number;
  resumedAfterReload?: boolean;
  /** Always true in this prototype. Every surface reads this to print "(simulated)". */
  simulated: true;
}

export interface CreativeSyncSummary {
  syncedAccountIds: string[];
  inFlightAccountIds: string[];
  failedAccountIds: string[];
  records: SyncRecord[]; // newest first
}

export interface SelectionSyncSummary {
  /** accountId → creativeIds in the selection already synced there. */
  alreadyByAccount: Record<string, string[]>;
  totalSelected: number;
}

/** Builds the deterministic idempotency key / record id for a creative+account pair. */
export function pairKey(creativeId: string, accountId: string): string {
  return `${creativeId}::${accountId}`;
}

/** Inverse of `pairKey`. Returns undefined for malformed input rather than throwing. */
export function parsePairKey(id: string): { creativeId: string; accountId: string } | null {
  const sepIndex = id.indexOf("::");
  if (sepIndex === -1) return null;
  const creativeId = id.slice(0, sepIndex);
  const accountId = id.slice(sepIndex + 2);
  if (!creativeId || !accountId) return null;
  return { creativeId, accountId };
}

/**
 * Deterministic 2–5s "upload" duration for a given creative+account pair key.
 * Uses `hashString` (never `Math.random`) so runDataAudit stays ALL PASS —
 * the same pair always takes the same simulated time across reloads.
 */
export function syncDurationMs(key: string): number {
  return 2000 + (hashString(key) % 4) * 1000;
}

/** Meta-only sync targets — Maalik's decision (TikTok/Newsbreak accounts are excluded). */
export function metaAccounts(): AdAccount[] {
  return AD_ACCOUNTS.filter((account) => account.platform === "meta");
}

// Re-exported so callers of this module don't also need a direct
// `@/workflows/core` import just to reference the underlying status union.
export { WORKFLOW_JOB_STATUSES };
export type { WorkflowJobStatus };
