/**
 * Creative Report 3.0 — floating compare tray store.
 *
 * Clicking "Compare" on a creative used to navigate straight to the Compare
 * screen — one creative at a time, and you lost your place in the grid.
 * Instead, Compare now ADDS to a running selection (max `MAX_COMPARE`) held
 * here, and a floating tray (see `components/CompareTray.tsx`) surfaces it
 * across the whole module. Dismissing the tray only hides the floating UI —
 * the selection survives — and adding another creative brings it back.
 *
 * localStorage-backed useSyncExternalStore, same discipline as
 * `automations/fireLedger.ts` / `automations/boards.ts`: module-cached
 * `state`, `snapshot()` returns it directly with no construction,
 * `persist()` builds the new reference then writes localStorage then emits,
 * `sanitize()` never throws on corrupt JSON, `setItem` wrapped in try/catch.
 *
 * THE ONLY HOOK is `useCompareTray` — a second `useSyncExternalStore` hook
 * whose `getSnapshot` builds a new object re-renders forever and blanks the
 * page (see the comment at `automations/boards.ts:11-16`; already happened
 * once in this repo).
 */
import { useSyncExternalStore } from "react";

/** Maalik raised this from 4 to 5. */
export const MAX_COMPARE = 5;

export interface CompareTrayState {
  /** Ordered, deduped, capped at MAX_COMPARE. */
  ids: string[];
  /** True = floating UI hidden. Selection is NOT cleared. */
  dismissed: boolean;
}

const KEY = "creative-report-compare-tray";

const DEFAULT_STATE: CompareTrayState = { ids: [], dismissed: false };

/** Dedupe (first occurrence wins) and cap at MAX_COMPARE, preserving order. */
function dedupeAndCap(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (typeof id !== "string" || id.length === 0) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= MAX_COMPARE) break;
  }
  return out;
}

/** Validate localStorage payloads defensively — corrupt/hand-edited JSON
 *  must degrade to the default state, never crash the module. */
function sanitize(raw: unknown): CompareTrayState {
  if (!raw || typeof raw !== "object") return DEFAULT_STATE;
  const { ids, dismissed } = raw as Partial<CompareTrayState>;
  return {
    ids: Array.isArray(ids) ? dedupeAndCap(ids) : [],
    dismissed: dismissed === true,
  };
}

function readInitial(): CompareTrayState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? sanitize(JSON.parse(raw)) : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

let state: CompareTrayState = readInitial();
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

function snapshot(): CompareTrayState {
  return state;
}

/** THE ONLY HOOK — if you ever add a second, you've reintroduced the
 *  getSnapshot-constructs-a-new-object bug that already white-screened this
 *  repo once (see boards.ts's own comment on it). */
export function useCompareTray(): CompareTrayState {
  return useSyncExternalStore(subscribe, snapshot, () => DEFAULT_STATE);
}

/** Non-hook accessor for callers outside React (e.g. imperative click
 *  handlers that just need to check capacity before showing a toast). */
export function getCompareTray(): CompareTrayState {
  return state;
}

/**
 * Adds a creative to the compare selection.
 *  - "added"     the id is now in the list (it wasn't before).
 *  - "already-in" the id was already selected — no-op on `ids`.
 *  - "full"      the id isn't selected and the list is already at MAX_COMPARE.
 *
 * Except for "full", this always clears `dismissed` — that's the "add
 * another creative and the tray comes back" behaviour. A no-op click on an
 * already-selected creative still surfaces the tray if it was hidden, same
 * as a fresh add would.
 */
export function addToCompare(id: string): "added" | "already-in" | "full" {
  if (state.ids.includes(id)) {
    if (state.dismissed) {
      state = { ...state, dismissed: false };
      persist();
    }
    return "already-in";
  }
  if (state.ids.length >= MAX_COMPARE) {
    return "full";
  }
  state = { ids: [...state.ids, id], dismissed: false };
  persist();
  return "added";
}

export function removeFromCompare(id: string): void {
  if (!state.ids.includes(id)) return;
  state = { ...state, ids: state.ids.filter((existing) => existing !== id) };
  persist();
}

export function clearCompare(): void {
  if (state.ids.length === 0 && !state.dismissed) return;
  state = { ids: [], dismissed: false };
  persist();
}

/** Hides the floating UI. Selection is NOT cleared. */
export function dismissTray(): void {
  if (state.dismissed) return;
  state = { ...state, dismissed: true };
  persist();
}

/** The Compare screen owns a shareable `?ids=` URL param; this lets it push
 *  that back into the tray so the two stay in sync (e.g. removing a column
 *  on the Compare screen also drops it from the floating tray). Does NOT
 *  touch `dismissed` — syncing isn't the same signal as actively adding. */
export function setCompareIds(ids: string[]): void {
  const next = dedupeAndCap(ids);
  const same =
    next.length === state.ids.length && next.every((id, i) => id === state.ids[i]);
  if (same) return;
  state = { ...state, ids: next };
  persist();
}
