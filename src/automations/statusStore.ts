/**
 * Automations "Set status" simulated tag store.
 *
 * A workflow's `markStatus` action node tags creatives as winner / loser /
 * fatigue / scaling. In the Creative Report those same four words are
 * BUCKETS DERIVED from spend/ROAS thresholds by a private `assignBucket` in
 * `@/creative-report/lib/selectors` — there is no override mechanism, and
 * adding one would make every bucket-derived surface in the report disagree
 * with itself (see the HONESTY BOUNDARY comment above `WORKFLOW_STATUS_TAGS`
 * in `model.ts`).
 *
 * So this store holds a DISPLAY-ONLY SIMULATED tag, parallel to — never
 * overwriting — the real bucket. `SIMULATED_STATUS_NOTE` is the one string
 * every consumer surface uses to say so, rather than three call sites
 * re-wording the same disclaimer.
 *
 * No clock lives in this file. `at` is always passed IN by the caller (the
 * run engine stamps a single timestamp per step) — this store never calls
 * `Date.now()`/`new Date()` itself, so there is nothing here that could run
 * in a render path or drift from the engine's own step timestamp.
 *
 * Same localStorage-backed useSyncExternalStore discipline as
 * `fireLedger.ts`/`boards.ts`: module-cached `state`, `snapshot()` returns it
 * directly with no construction, `persist()` builds the new reference then
 * writes localStorage then emits, `sanitize()` never throws on corrupt JSON.
 */
import { useSyncExternalStore } from "react";
import { WORKFLOW_STATUS_TAGS, type WorkflowStatusTag } from "./model";

export interface StatusTagRecord {
  creativeId: string;
  status: WorkflowStatusTag;
  /** Denormalised so the tag still explains itself after the workflow is
   *  renamed or deleted. */
  workflowName: string;
  workflowId: string;
  at: string; // ISO
  simulated: true;
}

export interface StatusStoreState {
  byCreative: Record<string, StatusTagRecord>; // one current tag per creative; a later tag replaces an earlier one
}

export const SIMULATED_STATUS_NOTE = "simulated status tag — does not change report buckets";

const KEY = "workflows-status";

const DEFAULT_STATE: StatusStoreState = { byCreative: {} };

function sanitizeRecord(raw: unknown): StatusTagRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const { creativeId, status, workflowName, workflowId, at, simulated } = raw as Partial<StatusTagRecord>;
  if (typeof creativeId !== "string") return null;
  if (typeof workflowName !== "string") return null;
  if (typeof workflowId !== "string") return null;
  if (typeof at !== "string") return null;
  if (simulated !== true) return null;
  if (typeof status !== "string" || !WORKFLOW_STATUS_TAGS.includes(status as WorkflowStatusTag)) return null;
  return { creativeId, status: status as WorkflowStatusTag, workflowName, workflowId, at, simulated: true };
}

function sanitize(raw: unknown): StatusStoreState {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return DEFAULT_STATE;
  const { byCreative } = raw as Partial<StatusStoreState>;
  const valid: Record<string, StatusTagRecord> = {};
  if (byCreative && typeof byCreative === "object" && !Array.isArray(byCreative)) {
    for (const [creativeId, record] of Object.entries(byCreative)) {
      const clean = sanitizeRecord(record);
      // Keyed record must also agree with its own creativeId, else a hand-
      // edited/corrupt payload could serve a tag under the wrong key.
      if (clean && clean.creativeId === creativeId) {
        valid[creativeId] = clean;
      }
    }
  }
  return { byCreative: valid };
}

function readInitial(): StatusStoreState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? sanitize(JSON.parse(raw)) : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

let state: StatusStoreState = readInitial();
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

function snapshot(): StatusStoreState {
  return state;
}

/** THE ONLY HOOK — no per-creative convenience hook. Consumers index
 *  `byCreative` themselves. A second hook here risks reintroducing the
 *  getSnapshot-constructs-a-new-object bug that already white-screened this
 *  repo once (see fireLedger.ts's own comment on it). */
export function useWorkflowStatusTags(): StatusStoreState {
  return useSyncExternalStore(subscribe, snapshot, () => DEFAULT_STATE);
}

/** Non-hook accessor for the clock-driven run engine, which ticks off a
 *  module-level clock with no render attached. */
export function getWorkflowStatusTags(): StatusStoreState {
  return state;
}

export function setStatusTag(input: {
  creativeId: string;
  status: WorkflowStatusTag;
  workflowId: string;
  workflowName: string;
  at: string;
}): void {
  const record: StatusTagRecord = {
    creativeId: input.creativeId,
    status: input.status,
    workflowName: input.workflowName,
    workflowId: input.workflowId,
    at: input.at,
    simulated: true,
  };
  state = { ...state, byCreative: { ...state.byCreative, [record.creativeId]: record } };
  persist();
}

/** Tags a whole matched set at once — ONE persist for the batch, not one per
 *  creative, so the run engine doesn't fan out a localStorage write (and a
 *  listener notification) per matched creative. Returns how many were
 *  written. */
export function setStatusTagMany(
  creativeIds: string[],
  input: { status: WorkflowStatusTag; workflowId: string; workflowName: string; at: string },
): number {
  if (creativeIds.length === 0) return 0;
  const nextByCreative = { ...state.byCreative };
  for (const creativeId of creativeIds) {
    nextByCreative[creativeId] = {
      creativeId,
      status: input.status,
      workflowName: input.workflowName,
      workflowId: input.workflowId,
      at: input.at,
      simulated: true,
    };
  }
  state = { ...state, byCreative: nextByCreative };
  persist();
  return creativeIds.length;
}

/** Local demo reset — clears every simulated status tag. */
export function clearStatusTags(): void {
  if (Object.keys(state.byCreative).length === 0) return;
  state = DEFAULT_STATE;
  persist();
}
