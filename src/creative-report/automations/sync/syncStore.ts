/**
 * Creative Report 3.0 — sync-history store for the "sync to Meta ad account
 * library" rule action.
 *
 * RESTORED (Maalik, 2026-08-01) — scoped down from the four-surface version
 * this store originally powered (card badge, table column, bulk-bar warning,
 * drawer band) to the ONE surface Maalik kept: `SyncStatusPanel` in the
 * creative drawer. This store itself is unchanged in shape from that
 * original — it's still the single source of truth for sync history and the
 * duplicate-upload guard in `enqueueSync`/`enqueueSyncMany` — only the
 * consumer surfaces were cut, not this module.
 *
 * EDGE-TRIGGER MARKS LIVE ELSEWHERE NOW: the original version of this file
 * also owned `firedByRule`/`markFired`/`firedFor`/`unmarkFired`/
 * `clearFiredForRule` — generic "which creatives has this rule already acted
 * on" bookkeeping that has since been extracted to `fireLedger.ts` (used by
 * every rule/action generically, not just sync). Do NOT reintroduce a second
 * copy of that bookkeeping here — `rulesStore.ts` and `runner.ts` already
 * import it from `fireLedger.ts`.
 *
 * SNAPSHOT-STABILITY WARNING (the exact bug this file is designed to make
 * impossible — see boards.ts:11-16 for the original occurrence): a
 * `getSnapshot` that builds a fresh object/array on every call breaks
 * `useSyncExternalStore`'s identity check, so React re-renders forever and
 * the page goes white. This file exposes exactly ONE hook — `useSyncStore()`
 * — whose `snapshot()` returns the module-cached `state` reference and
 * constructs nothing. There is no per-creative hook here, convenient or
 * otherwise. Per-creative/per-selection views are PURE FUNCTIONS in
 * `selectors.ts` (`summariseCreative` / `summariseSelection`) — never
 * hooks — each returns a new object and must be called inside the
 * consumer's own `useMemo`.
 *
 * Same localStorage-backed useSyncExternalStore discipline as
 * boards.ts/rulesStore.ts/digestStore.ts: module-level `state`, `snapshot()`
 * returns it directly, `persist()` builds the new reference then writes
 * localStorage then emits, a module-constant DEFAULT_STATE doubles as the
 * server snapshot, `sanitize()` defends every field on load.
 */
import { useSyncExternalStore } from "react";
import type { WorkflowJobStatus } from "@/workflows/core";
import { pairKey, syncDurationMs, type SyncRecord } from "@/creative-report/automations/sync/syncModel";
import { ACCOUNT_BY_ID } from "@/data/accounts";

export interface SyncStoreState {
  records: Record<string, SyncRecord>;
  lastPassAt: string | null;
}

const KEY = "creative-report-sync-history";

/** Cap on simultaneous `running` records so per-record progress stays
 *  watchable instead of every queued item finishing in one indistinguishable
 *  blob. */
const MAX_CONCURRENT_RUNNING = 3;

const DEFAULT_STATE: SyncStoreState = { records: {}, lastPassAt: null };

/** Statuses that block a fresh `enqueueSync` for the same creative::account
 *  pair — a creative may already have been queued/synced by a *different*
 *  rule, and that still counts. Only `retrySync` may re-enqueue a `failed`
 *  pair; it is deliberately excluded here so a permanently-failing pair
 *  can't auto-loop. */
const BLOCKING_STATUSES = new Set<WorkflowJobStatus>(["queued", "running", "done"]);

function isValidRecord(r: unknown): r is SyncRecord {
  if (!r || typeof r !== "object") return false;
  const rec = r as SyncRecord;
  return (
    typeof rec.id === "string" &&
    typeof rec.creativeId === "string" &&
    typeof rec.accountId === "string" &&
    (rec.status === "queued" || rec.status === "running" || rec.status === "done" || rec.status === "failed") &&
    (rec.ruleId === null || typeof rec.ruleId === "string") &&
    typeof rec.ruleName === "string" &&
    typeof rec.queuedAt === "string" &&
    (rec.startedAt === undefined || typeof rec.startedAt === "string") &&
    (rec.finishedAt === undefined || typeof rec.finishedAt === "string") &&
    (rec.failedReason === undefined || typeof rec.failedReason === "string") &&
    typeof rec.progress === "number" &&
    (rec.resumedAfterReload === undefined || typeof rec.resumedAfterReload === "boolean") &&
    rec.simulated === true
  );
}

/** Validate localStorage payloads defensively — corrupt/hand-edited JSON
 *  must degrade to the default state, never crash the Automations screen.
 *
 *  Reload recovery is folded in here as a design property, not a special
 *  case: a persisted `running` record's elapsed-time base is meaningless on
 *  load (the tick that would have completed it never ran), so it's rewound
 *  to `queued` with `resumedAfterReload: true` and the next `advanceQueue`
 *  tick re-drives it naturally. */
function sanitize(raw: unknown): SyncStoreState {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return DEFAULT_STATE;
  const { records, lastPassAt } = raw as Partial<SyncStoreState>;

  const validRecords: Record<string, SyncRecord> = {};
  if (records && typeof records === "object" && !Array.isArray(records)) {
    for (const [key, value] of Object.entries(records)) {
      if (!isValidRecord(value)) continue;
      if (!ACCOUNT_BY_ID[value.accountId]) continue;
      validRecords[key] =
        value.status === "running"
          ? { ...value, status: "queued", progress: 0, startedAt: undefined, resumedAfterReload: true }
          : value;
    }
  }

  return {
    records: validRecords,
    lastPassAt: typeof lastPassAt === "string" ? lastPassAt : null,
  };
}

function readInitial(): SyncStoreState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? sanitize(JSON.parse(raw)) : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

let state: SyncStoreState = readInitial();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Quota exceeded or storage unavailable — keep the in-memory state and
      // don't let a write failure wedge the store.
    }
  }
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function snapshot(): SyncStoreState {
  return state;
}

/** THE ONLY HOOK. `snapshot()` above returns the cached module-level `state`
 *  reference and constructs nothing — see the file header. */
export function useSyncStore(): SyncStoreState {
  return useSyncExternalStore(subscribe, snapshot, () => DEFAULT_STATE);
}

/** Non-hook accessor for the queue runner and the rule engine — both tick
 *  outside React's render cycle. */
export function getSyncState(): SyncStoreState {
  return state;
}

function buildQueuedRecord(creativeId: string, accountId: string, ruleId: string | null, ruleName: string): SyncRecord {
  return {
    id: pairKey(creativeId, accountId),
    creativeId,
    accountId,
    status: "queued",
    ruleId,
    ruleName,
    queuedAt: new Date().toISOString(),
    progress: 0,
    simulated: true,
  };
}

/** Guard 1 — pair uniqueness. Returns "skipped-existing" and does nothing if
 *  a queued/running/done record already exists for this creative::account
 *  pair, regardless of which rule (or user action) put it there. */
export function enqueueSync(i: {
  creativeId: string;
  accountId: string;
  ruleId: string | null;
  ruleName: string;
}): "queued" | "skipped-existing" {
  const id = pairKey(i.creativeId, i.accountId);
  const existing = state.records[id];
  if (existing && BLOCKING_STATUSES.has(existing.status)) return "skipped-existing";

  const record = buildQueuedRecord(i.creativeId, i.accountId, i.ruleId, i.ruleName);
  state = { ...state, records: { ...state.records, [id]: record } };
  persist();
  return "queued";
}

export function enqueueSyncMany(
  creativeIds: string[],
  accountIds: string[],
  src: { ruleId: string | null; ruleName: string },
): { queued: number; skipped: number } {
  let queued = 0;
  let skipped = 0;
  const nextRecords = { ...state.records };

  for (const creativeId of creativeIds) {
    for (const accountId of accountIds) {
      const id = pairKey(creativeId, accountId);
      const existing = nextRecords[id];
      if (existing && BLOCKING_STATUSES.has(existing.status)) {
        skipped += 1;
        continue;
      }
      nextRecords[id] = buildQueuedRecord(creativeId, accountId, src.ruleId, src.ruleName);
      queued += 1;
    }
  }

  if (queued > 0) {
    state = { ...state, records: nextRecords };
    persist();
  }
  return { queued, skipped };
}

/** Quantize elapsed/duration to a 0-90 step-of-10 ladder — 100 is reserved
 *  for the moment a record actually flips to `done`, never interpolated. */
function quantizeProgress(elapsedMs: number, durationMs: number): number {
  if (durationMs <= 0) return 90;
  const raw = (elapsedMs / durationMs) * 100;
  const clamped = Math.max(0, Math.min(99, raw));
  return Math.floor(clamped / 10) * 10;
}

/** Elapsed-time reconciler — NOT a timer chain. Called on a tick by the
 *  runner with the current clock reading; derives every record's state from
 *  `nowMs` vs its stamped timestamps, so it's correct even if ticks are
 *  missed, delayed, or the tab was backgrounded.
 *
 *  Returns `false` when nothing crossed a 10% boundary and no status
 *  changed, so the runner skips emit() — without this a 500ms tick would
 *  re-render every mounted card twice a second and the grid would visibly
 *  jank. This is a correctness-of-feel requirement, not an optimisation. */
export function advanceQueue(nowMs: number): boolean {
  const ids = Object.keys(state.records);
  if (ids.length === 0) return false;

  let runningCount = 0;
  for (const id of ids) {
    if (state.records[id].status === "running") runningCount += 1;
  }

  let changed = false;
  const nextRecords: Record<string, SyncRecord> = { ...state.records };

  const queuedIds = ids
    .filter((id) => state.records[id].status === "queued")
    .sort((a, b) => Date.parse(state.records[a].queuedAt) - Date.parse(state.records[b].queuedAt));

  let capacity = MAX_CONCURRENT_RUNNING - runningCount;
  for (const id of queuedIds) {
    if (capacity <= 0) break;
    nextRecords[id] = {
      ...nextRecords[id],
      status: "running",
      startedAt: new Date(nowMs).toISOString(),
      progress: 0,
    };
    capacity -= 1;
    changed = true;
  }

  for (const id of ids) {
    const rec = nextRecords[id];
    if (rec.status !== "running") continue;

    const startedAtMs = rec.startedAt ? Date.parse(rec.startedAt) : nowMs;
    const elapsed = Math.max(0, nowMs - startedAtMs);
    const duration = syncDurationMs(id);

    if (elapsed >= duration) {
      nextRecords[id] = { ...rec, status: "done", progress: 100, finishedAt: new Date(nowMs).toISOString() };
      changed = true;
    } else {
      const nextProgress = quantizeProgress(elapsed, duration);
      if (nextProgress !== rec.progress) {
        nextRecords[id] = { ...rec, progress: nextProgress };
        changed = true;
      }
    }
  }

  if (!changed) return false;

  state = { ...state, records: nextRecords, lastPassAt: new Date(nowMs).toISOString() };
  persist();
  return true;
}

/** The only way a `failed` pair may re-enqueue — never automatic, so a
 *  permanently-failing pair can't loop. */
export function retrySync(pairKey: string): void {
  const existing = state.records[pairKey];
  if (!existing || existing.status !== "failed") return;
  const next: SyncRecord = {
    ...existing,
    status: "queued",
    progress: 0,
    startedAt: undefined,
    finishedAt: undefined,
    failedReason: undefined,
    resumedAfterReload: undefined,
    queuedAt: new Date().toISOString(),
  };
  state = { ...state, records: { ...state.records, [pairKey]: next } };
  persist();
}

/** Dev/demo affordance — wipes all sync history. Fire-ledger marks (which
 *  creatives a rule has already acted on) live in `fireLedger.ts` now and
 *  are untouched by this reset. */
export function resetSyncHistory(): void {
  state = DEFAULT_STATE;
  persist();
}

/** Dev-only simulated failure trigger for a queued/running pair — lets demo
 *  flows exercise the failed state without any Math.random anywhere in this
 *  file (that would break runDataAudit()'s determinism guarantee). */
export function failSyncForDev(pairKey: string): void {
  const existing = state.records[pairKey];
  if (!existing || existing.status === "done" || existing.status === "failed") return;
  const next: SyncRecord = {
    ...existing,
    status: "failed",
    finishedAt: new Date().toISOString(),
    failedReason: "Simulated failure (dev trigger)",
  };
  state = { ...state, records: { ...state.records, [pairKey]: next } };
  persist();
}
