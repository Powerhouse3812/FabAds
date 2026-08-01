/**
 * analysisStore — mock credit-gated "Analysis" reveal, one state machine per
 * creative (Video Sage-style Framework + Cognitive Insights). Fully
 * self-contained mock, INCLUDING the credit balance — deliberately not wired
 * to `useCredits()` (Maalik: keep this mock self-contained so it can never
 * disagree with the real balance shown elsewhere in the app).
 *
 * Per-creative state machine: idle → analysing → analysed. Revealing debits
 * REVEAL_COST credits immediately (optimistic, matches the Figma "Reveal
 * Insights (4 credits)" button), then the creative flips to "analysed" after
 * a delay driven by `fakeSleep` (src/lib/demo-mode.ts) — the exact helper
 * Video Sage's own analysis flow uses (`fakeSleep(2500, 4500)`). The delay is
 * kicked off from THIS module, not a component effect: the drawer sheet can
 * close (and its subtree unmount) well before analysis finishes, and a
 * component-local timer would die with it, leaving the creative stuck in
 * "analysing" forever.
 *
 * Store discipline copied verbatim from automations/boards.ts: module-cached
 * `state`, `snapshot()` returns the cached ref and constructs nothing new,
 * `persist()` builds the next ref then emits, `sanitize()` degrades any
 * corrupt/hand-edited localStorage payload to the default state instead of
 * throwing. Exactly ONE `useSyncExternalStore` hook is exposed
 * (`useAnalysisStore`) — every other export is either a plain pure function
 * over a snapshot (callers wrap the call in `useMemo`) or an imperative
 * action that mutates the module-scoped state.
 */
import { useSyncExternalStore } from "react";
import { fakeSleep } from "@/lib/demo-mode";

export type AnalysisStatus = "idle" | "analysing" | "analysed";

/** Credits debited per reveal — mirrors the Figma "Reveal Insights (4 credits)" button. */
export const REVEAL_COST = 4;
/** Mock starting balance — mirrors the Figma header's "73/100 CREDITS". */
const STARTING_BALANCE = 73;
export const BALANCE_CEILING = 100;

interface StoreShape {
  balance: number;
  /** creativeId → status. An absent id reads as "idle". */
  statuses: Record<string, AnalysisStatus>;
}

const KEY = "creative-report-analysis";
const DEFAULT_STATE: StoreShape = { balance: STARTING_BALANCE, statuses: {} };

function isValidStatus(v: unknown): v is AnalysisStatus {
  return v === "idle" || v === "analysing" || v === "analysed";
}

/** Validate localStorage payloads defensively — corrupt/hand-edited JSON must
 *  degrade to the default state, never crash the drawer. */
function sanitize(raw: unknown): StoreShape {
  if (!raw || typeof raw !== "object") return DEFAULT_STATE;
  const { balance, statuses } = raw as Partial<StoreShape>;
  const validBalance =
    typeof balance === "number" && Number.isFinite(balance)
      ? Math.max(0, Math.min(BALANCE_CEILING, balance))
      : STARTING_BALANCE;
  const validStatuses: Record<string, AnalysisStatus> = {};
  if (statuses && typeof statuses === "object") {
    for (const [id, status] of Object.entries(statuses)) {
      if (!isValidStatus(status)) continue;
      // A reload can never resume an in-flight timer from a previous tab
      // session — degrade a stale "analysing" back to "idle" so the reveal
      // button reappears instead of hanging forever.
      validStatuses[id] = status === "analysing" ? "idle" : status;
    }
  }
  return { balance: validBalance, statuses: validStatuses };
}

function readInitial(): StoreShape {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? sanitize(JSON.parse(raw)) : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

let state: StoreShape = readInitial();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(state));
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function snapshot(): StoreShape {
  return state;
}

/* ------------------------------------------------------------------ */
/*  Pure derivations over a snapshot — callers wrap these in useMemo    */
/* ------------------------------------------------------------------ */

export function getStatus(store: StoreShape, creativeId: string): AnalysisStatus {
  return store.statuses[creativeId] ?? "idle";
}

export function canAffordReveal(store: StoreShape): boolean {
  return store.balance >= REVEAL_COST;
}

/* ------------------------------------------------------------------ */
/*  Actions — mutate the module-scoped state directly                  */
/* ------------------------------------------------------------------ */

/** Starts the credit-gated reveal for one creative. No-ops if already
 *  analysing/analysed, or if the balance can't cover REVEAL_COST. */
export function startAnalysis(creativeId: string): void {
  const current = state.statuses[creativeId] ?? "idle";
  if (current !== "idle" || !canAffordReveal(state)) return;

  state = {
    balance: state.balance - REVEAL_COST,
    statuses: { ...state.statuses, [creativeId]: "analysing" },
  };
  persist();

  fakeSleep(2500, 4500).then(() => {
    // Guard against a future cancel/reset action landing while this timer
    // was in flight — only resolve if still mid-flight for this id.
    if (state.statuses[creativeId] !== "analysing") return;
    state = { ...state, statuses: { ...state.statuses, [creativeId]: "analysed" } };
    persist();
  });
}

/** Re-runs the reveal for an already-analysed creative (the Figma
 *  "Regenerate" control) — debits credits again via startAnalysis. */
export function regenerateAnalysis(creativeId: string): void {
  if (state.statuses[creativeId] !== "analysed") return;
  state = { ...state, statuses: { ...state.statuses, [creativeId]: "idle" } };
  persist();
  startAnalysis(creativeId);
}

export function useAnalysisStore(): StoreShape {
  return useSyncExternalStore(subscribe, snapshot, () => DEFAULT_STATE);
}
