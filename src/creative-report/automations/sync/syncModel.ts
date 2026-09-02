/**
 * sync/syncModel.ts — pure types + helpers for the "sync to Meta ad account
 * library" automation action (v3-only; /reports/creative-v2 is unaffected).
 *
 * No store, no React. Simulated background upload only — this prototype
 * never talks to a real Meta API. `simulated: true` on every SyncRecord is
 * how every surface knows to print "(simulated)" rather than imply a real
 * upload happened.
 *
 * ------------------------------------------------------------------------
 * PAIR-KEY DECISION (Maalik's sync-granularity ruling, 2026-08-13)
 * ------------------------------------------------------------------------
 * The Automations sync node now has two granularities (`SyncGranularity` in
 * `@/automations/model`): push a whole Creative Library FOLDER, or push only
 * the CREATIVES a run matched. The obvious follow-on question is whether the
 * record id — which is also the idempotency key — should gain a folder
 * segment (`creative::account::folder`).
 *
 * DECIDED: NO. The key stays `creative::account`.
 *
 * Why: idempotency here is about the DESTINATION, and the destination is an ad
 * account's creative library, where an asset exists exactly once. A folder is
 * FabAds-side provenance — how we grouped the asset before pushing — not part
 * of its address in Meta. Keying on the folder too would weaken the guard in
 * precisely the way it was built to prevent: three folders that each contain
 * the same winner would push that one asset to the same ad account three
 * times, and every one of those uploads would report success.
 *
 * REJECTED ALTERNATIVE, and its real cost: a three-segment key would let
 * folder-mode and creatives-mode pushes of the same pair coexist as separate
 * rows, which reads nicer in a history list. It loses on two counts. (1) It
 * makes duplicate uploads representable and therefore eventually real.
 * (2) Migration: every record already in localStorage — including the ~3-in-4
 * seeded ones — carries a two-segment key, so a same-pair folder push would
 * land beside them under a different id instead of deduping against them, and
 * the drawer would show the same creative synced to the same account twice.
 * That is indistinguishable from the bug the guard exists to prevent.
 *
 * MIGRATION CONSEQUENCE OF THE CHOICE WE MADE (none structural, one
 * behavioural): no existing record changes id, moves, or needs rewriting, and
 * `parsePairKey` keeps parsing every historical id exactly. What DOES follow is
 * that folder attribution is FIRST-WRITER-WINS. A pair already queued/running/
 * done — manually, by a v3 rule, or by the seed — is skipped by
 * `BLOCKING_STATUSES` when a later folder push touches it, and keeps its
 * ORIGINAL provenance; the skipped push does not retro-tag it with its folder,
 * because rewriting the folder onto a finished record would rewrite history to
 * claim an upload we didn't perform. Records written before this ruling carry
 * no `folderId` at all, so every read path must treat a missing folder as "no
 * folder recorded" and never as a folder whose name is the empty string.
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
  /** `${creativeId}::${accountId}` — the idempotency key AND the record id.
   *  Deliberately carries NO folder segment; see the file header. */
  id: string;
  creativeId: string;
  accountId: string;
  status: WorkflowJobStatus;
  /** null = user-triggered from the bulk bar or drawer, not by a rule. */
  ruleId: string | null;
  /** Snapshot of the rule's name at run time — the audit trail must survive rule deletion. */
  ruleName: string;
  /**
   * The Creative Library folder this upload was pushed AS PART OF.
   *
   * Absent, not empty-string, whenever there is no folder to name: every
   * record written before the 2026-08-13 granularity ruling, every manual or
   * v3-rule sync, and every `mode: "creatives"` workflow push. It is NOT part
   * of the id — see the pair-key decision in the file header — so it is
   * provenance only, never a dedupe dimension.
   */
  folderId?: string;
  /**
   * SNAPSHOT of the folder's name at fire time, for exactly the reason
   * `ruleName` is a snapshot: the audit trail has to survive the folder being
   * renamed or deleted, and the queue runner has no Supabase client in scope
   * to re-resolve an id with.
   */
  folderName?: string;
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

/** Builds the deterministic idempotency key / record id for a creative+account
 *  pair. Two segments, permanently — a folder segment was considered and
 *  rejected on 2026-08-13 (file header). */
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
