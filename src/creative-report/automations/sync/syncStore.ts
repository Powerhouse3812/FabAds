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
import { pairKey, syncDurationMs, metaAccounts, type SyncRecord } from "@/creative-report/automations/sync/syncModel";
import { ACCOUNT_BY_ID } from "@/data/accounts";
import { getDataset } from "@/data/generator";
import { hashString } from "@/data/rng";

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
    // Folder provenance is OPTIONAL and must stay optional: every record
    // written before the 2026-08-13 granularity ruling lacks both fields, and
    // demanding them here would silently discard the entire existing history
    // on first load. A non-string present value is the only rejectable case.
    (rec.folderId === undefined || typeof rec.folderId === "string") &&
    (rec.folderName === undefined || typeof rec.folderName === "string") &&
    typeof rec.queuedAt === "string" &&
    (rec.startedAt === undefined || typeof rec.startedAt === "string") &&
    (rec.finishedAt === undefined || typeof rec.finishedAt === "string") &&
    (rec.failedReason === undefined || typeof rec.failedReason === "string") &&
    typeof rec.progress === "number" &&
    (rec.resumedAfterReload === undefined || typeof rec.resumedAfterReload === "boolean") &&
    rec.simulated === true
  );
}

/**
 * FOLDER-PROVENANCE CONTRADICTION RULE (Finding S12, 2026-08-13): a record may
 * carry folder attribution (`folderId` and/or `folderName`) ONLY when a
 * canvas workflow queued it. Tracing every writer of a `SyncSource` in this
 * codebase: the ONE call site that ever threads folder fields through is
 * `syncFolderToAccounts` in `src/automations/executors.ts`, and it stamps
 * `ruleId: ctx.workflowId` — always a graph id minted by `makeGraphId()`
 * (`automations/graphStore.ts`), which is unconditionally shaped
 * `wf-<timestamp>-<counter>`. Every OTHER writer — the manual bulk-sync
 * action (`ruleId: null`), the Creative Report v3 rule action in
 * `actions/registry.ts` (`ruleId` = a `rule-<ts>-<n>` id from
 * `rulesStore.ts`'s `makeId()`), and this store's own seed data — never
 * passes a folder field at all. So a record is CONTRADICTORY, and the folder
 * claim is fabricated, whenever it carries a folder field but `ruleId` is
 * `null` or does not start with `"wf-"`. This mirrors (without importing, to
 * avoid coupling this store to a UI component) the same id-prefix heuristic
 * `SyncStatusPanel.tsx`'s `sourceKind()` already uses to tell a workflow from
 * a rule — both readings agree a folder can only ride along with a workflow.
 *
 * Hand-edited/tampered `localStorage` is the only realistic way to reach this
 * (e.g. injecting `folderName` onto a `ruleId: null` record) — no code path in
 * this repo produces it — so the fix is proportionate: strip the two folder
 * fields, keep the rest of the record. A record's provenance is exactly its
 * `ruleId`/`ruleName`, which stay untouched.
 */
function contradictsFolderProvenance(rec: SyncRecord): boolean {
  const hasFolder = rec.folderId !== undefined || rec.folderName !== undefined;
  if (!hasFolder) return false;
  const carriedByWorkflow = rec.ruleId !== null && rec.ruleId.startsWith("wf-");
  return !carriedByWorkflow;
}

/**
 * SECOND HALF of the same cross-check: `folderId` and `folderName` must
 * travel together. The only writer of either (`syncFolderToAccounts` in
 * `executors.ts`) always sets both from the same node data in one spread, so
 * a record with exactly one of the two is never legitimate — either a corrupt
 * write or, same as above, a hand-edit. `SyncStatusPanel.tsx`'s `folderLine()`
 * renders off `folderName` alone, so an orphaned `folderId` with no name
 * would just silently not render — but leaving it in the persisted record
 * makes that store state a lie (a folder id with nothing backing it), so it
 * gets stripped here rather than left to rot.
 */
function hasAsymmetricFolderFields(rec: SyncRecord): boolean {
  return (rec.folderId !== undefined) !== (rec.folderName !== undefined);
}

/** Drop just the folder fields — never the record. Same "coerce the bad
 *  field, don't nuke the row" philosophy as the `running` -> `queued` rewind
 *  below. No-op (returns the same reference) when there is nothing to strip,
 *  so this is safe to call unconditionally. */
function stripFolderProvenance(rec: SyncRecord): SyncRecord {
  if (rec.folderId === undefined && rec.folderName === undefined) return rec;
  const next: SyncRecord = { ...rec };
  delete next.folderId;
  delete next.folderName;
  return next;
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

      // Finding S12: a folder claim that contradicts the record's own
      // provenance (e.g. a manual/`ruleId: null` record hand-edited to carry
      // a `folderName`), or that names only one of the two folder fields,
      // gets the folder stripped, not the record dropped.
      const clean =
        contradictsFolderProvenance(value) || hasAsymmetricFolderFields(value)
          ? stripFolderProvenance(value)
          : value;

      validRecords[key] =
        clean.status === "running"
          ? { ...clean, status: "queued", progress: 0, startedAt: undefined, resumedAfterReload: true }
          : clean;
    }
  }

  return {
    records: validRecords,
    lastPassAt: typeof lastPassAt === "string" ? lastPassAt : null,
  };
}

/**
 * Deterministic starting sync history for a brand-new browser (Maalik,
 * 2026-08-01): an unseeded store means almost every creative's drawer shows
 * "Not synced to any ad account yet", which reads as a broken/incomplete
 * demo rather than the true "nothing has run yet" state it actually is. This
 * seeds ~3 in 4 creatives with 1–2 Meta accounts already `done`, spread over
 * the last two weeks, so the panel opens looking lived-in — the rest are left
 * genuinely unsynced on purpose, so the empty state stays reachable and
 * correct rather than being eliminated.
 *
 * `ruleId: null` (manual) throughout — inventing a rule name for history that
 * predates any real rule the user created would be a fabrication `ruleName`
 * doesn't need to carry, since `provenanceLine()` already prints "Synced
 * manually" whenever `ruleId` is null and ignores `ruleName` entirely in that
 * case. Every record still carries `simulated: true` — same "(simulated)"
 * labelling as any other sync record, seeded or rule-fired.
 *
 * hashString-derived throughout (never `Math.random`), so this seed is
 * reproducible across reloads exactly like the rest of this dataset. Runs
 * once — only on a truly empty localStorage key (see readInitial below) —
 * and persists immediately, so real activity afterward accumulates on top of
 * it rather than this re-seeding on every visit.
 *
 * ─── LOAD-BEARING: `startedAt === queuedAt` IS A FINGERPRINT ───────────────
 * These records deliberately stamp `startedAt` at the SAME INSTANT as
 * `queuedAt`, because a fabricated pair is finished in one step. Nothing else
 * in this store does that, and `SyncHistoryScreen`'s `isFabricatedHistory()`
 * relies on it to label these rows "Seeded — no sync occurred" instead of
 * "Manual sync" — a seeded row claiming a person synced something is the lie
 * that check exists to remove. **Do not "normalise" these two timestamps.**
 *
 * A real record cannot collide with the fingerprint today, but that rests on
 * TWO invariants that no assertion enforces — an adversarial pass confirmed
 * both hold and flagged the fragility:
 *   1. TICK ORDERING. Every runner calls `advanceQueue(ms)` BEFORE the work
 *      that enqueues syncs (`runEngine.ts`'s `onTick`, and this module's own
 *      consumer in `creative-report/automations/runner.ts`), so a freshly
 *      queued pair is only promoted on a LATER tick — `startedAt` lands
 *      ≥500ms after `queuedAt`. Enqueue-then-`tickNow()` in one synchronous
 *      turn would break this.
 *   2. ROUTE EXCLUSIVITY. `AutomationsLayout` and `CreativeReportLayout` are
 *      sibling routes, so their runners are never registered at the same time.
 *      `tickNow()` fans one shared `now` out to every registered runner, so
 *      co-mounting them would let one runner's `advanceQueue` promote a pair
 *      the other just enqueued, within the same millisecond.
 * If either changes, make the seeded flag explicit on the record instead of
 * inferring it here.
 */
function seedInitialRecords(): Record<string, SyncRecord> {
  const accounts = metaAccounts();
  if (accounts.length === 0) return {};
  const dataset = getDataset();
  const records: Record<string, SyncRecord> = {};
  const dayMs = 24 * 60 * 60 * 1000;

  for (const creative of dataset.creatives) {
    const roll = hashString(creative.id);
    if (roll % 4 === 0) continue; // ~25% start genuinely unsynced

    const accountCount = 1 + (roll % 2); // 1 or 2 accounts
    for (let i = 0; i < accountCount && i < accounts.length; i++) {
      const account = accounts[(roll + i) % accounts.length];
      const key = pairKey(creative.id, account.id);
      const daysAgo = 1 + (hashString(key) % 14); // spread over the last ~2 weeks
      const queuedAtMs = Date.now() - daysAgo * dayMs;
      const finishedAtMs = queuedAtMs + syncDurationMs(key);

      records[key] = {
        id: key,
        creativeId: creative.id,
        accountId: account.id,
        status: "done",
        ruleId: null,
        ruleName: "Manual sync",
        queuedAt: new Date(queuedAtMs).toISOString(),
        startedAt: new Date(queuedAtMs).toISOString(),
        finishedAt: new Date(finishedAtMs).toISOString(),
        progress: 100,
        simulated: true,
      };
    }
  }
  return records;
}

function readInitial(): SyncStoreState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return sanitize(JSON.parse(raw));

    const seeded: SyncStoreState = { records: seedInitialRecords(), lastPassAt: null };
    try {
      window.localStorage.setItem(KEY, JSON.stringify(seeded));
    } catch {
      // Quota exceeded or storage unavailable — the seeded state still
      // returns for this session, it just won't survive a reload.
    }
    return seeded;
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

/**
 * Where a queued upload came from. `ruleId`/`ruleName` are required (a manual
 * sync passes `ruleId: null` and a human-readable `ruleName`); the folder pair
 * is optional because most syncs have no folder to name — see `SyncRecord`.
 */
export interface SyncSource {
  ruleId: string | null;
  ruleName: string;
  /** Creative Library folder id, when the push was folder-granular. */
  folderId?: string;
  /** Folder name SNAPSHOT at fire time — the store never re-resolves an id. */
  folderName?: string;
}

/**
 * Folder fields are attached only when they carry a value, never as explicit
 * `undefined`s. An absent key and a key holding `undefined` survive
 * `JSON.stringify` identically, so this is about the in-memory record too: a
 * read path that checks `"folderId" in record` must not be told yes for a
 * manual sync.
 */
function buildQueuedRecord(creativeId: string, accountId: string, src: SyncSource): SyncRecord {
  const folderId = src.folderId?.trim();
  const folderName = src.folderName?.trim();
  return {
    id: pairKey(creativeId, accountId),
    creativeId,
    accountId,
    status: "queued",
    ruleId: src.ruleId,
    ruleName: src.ruleName,
    ...(folderId ? { folderId } : {}),
    ...(folderName ? { folderName } : {}),
    queuedAt: new Date().toISOString(),
    progress: 0,
    simulated: true,
  };
}

/** Guard 1 — pair uniqueness. Returns "skipped-existing" and does nothing if
 *  a queued/running/done record already exists for this creative::account
 *  pair, regardless of which rule (or user action) put it there.
 *
 *  A folder-granular push is NOT exempt from this guard and does NOT re-tag the
 *  record it skipped: the folder is provenance, not part of the key, and
 *  overwriting a finished record's folder would claim an upload that didn't
 *  happen. See syncModel.ts's pair-key decision. */
export function enqueueSync(
  i: { creativeId: string; accountId: string } & SyncSource,
): "queued" | "skipped-existing" {
  const id = pairKey(i.creativeId, i.accountId);
  const existing = state.records[id];
  if (existing && BLOCKING_STATUSES.has(existing.status)) return "skipped-existing";

  const record = buildQueuedRecord(i.creativeId, i.accountId, i);
  state = { ...state, records: { ...state.records, [id]: record } };
  persist();
  return "queued";
}

export function enqueueSyncMany(
  creativeIds: string[],
  accountIds: string[],
  src: SyncSource,
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
      nextRecords[id] = buildQueuedRecord(creativeId, accountId, src);
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
