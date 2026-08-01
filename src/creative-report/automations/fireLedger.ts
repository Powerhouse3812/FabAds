/**
 * Creative Report 2.0 — generic edge-trigger fire ledger.
 *
 * Extracted from `automations/sync/syncStore.ts` (which is being deleted
 * along with the rest of the upload-queue mechanism — sync moves out of
 * Creative Report). The edge-trigger bookkeeping itself — "which creatives
 * has this rule already acted on, so a still-matching creative doesn't
 * re-fire every tick" — is generic to ANY auto-firing rule, not sync-
 * specific, so it gets its own module-scoped store here.
 *
 * Same localStorage-backed useSyncExternalStore discipline as
 * boards.ts/rulesStore.ts: module-cached `state`, `snapshot()` returns it
 * directly with no construction, `persist()` builds the new reference then
 * writes localStorage then emits, `sanitize()` never throws on corrupt JSON.
 */
import { useSyncExternalStore } from "react";

export interface FireLedgerState {
  /** ruleId → creativeIds the rule has currently acted on. */
  firedByRule: Record<string, string[]>;
}

const KEY = "creative-report-fire-ledger";

const DEFAULT_STATE: FireLedgerState = { firedByRule: {} };

function sanitize(raw: unknown): FireLedgerState {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return DEFAULT_STATE;
  const { firedByRule } = raw as Partial<FireLedgerState>;
  const valid: Record<string, string[]> = {};
  if (firedByRule && typeof firedByRule === "object" && !Array.isArray(firedByRule)) {
    for (const [ruleId, ids] of Object.entries(firedByRule)) {
      if (Array.isArray(ids) && ids.every((id) => typeof id === "string")) {
        valid[ruleId] = ids;
      }
    }
  }
  return { firedByRule: valid };
}

function readInitial(): FireLedgerState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? sanitize(JSON.parse(raw)) : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

let state: FireLedgerState = readInitial();
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

function snapshot(): FireLedgerState {
  return state;
}

/** THE ONLY HOOK — if you ever add a second, you've reintroduced the
 *  getSnapshot-constructs-a-new-object bug that already white-screened this
 *  repo once (see boards.ts's own comment on it). */
export function useFireLedger(): FireLedgerState {
  return useSyncExternalStore(subscribe, snapshot, () => DEFAULT_STATE);
}

/** Non-hook accessor for the runner, which ticks off a module-level clock
 *  with no render attached. */
export function firedFor(ruleId: string): string[] {
  return state.firedByRule[ruleId] ?? [];
}

export function markFired(ruleId: string, creativeIds: string[]): void {
  if (creativeIds.length === 0) return;
  const existing = state.firedByRule[ruleId] ?? [];
  const merged = Array.from(new Set([...existing, ...creativeIds]));
  state = { ...state, firedByRule: { ...state.firedByRule, [ruleId]: merged } };
  persist();
}

/** Re-arm a rule for creatives that no longer match its condition, so a
 *  future edge-trigger can fire for them again. */
export function unmarkFired(ruleId: string, creativeIds: string[]): void {
  const existing = state.firedByRule[ruleId];
  if (!existing || existing.length === 0) return;
  const toRemove = new Set(creativeIds);
  const next = existing.filter((id) => !toRemove.has(id));
  if (next.length === existing.length) return;
  state = { ...state, firedByRule: { ...state.firedByRule, [ruleId]: next } };
  persist();
}

export function clearFiredForRule(ruleId: string): void {
  if (!(ruleId in state.firedByRule)) return;
  const next = { ...state.firedByRule };
  delete next[ruleId];
  state = { ...state, firedByRule: next };
  persist();
}
