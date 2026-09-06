import { useSyncExternalStore } from "react";
import type { OutputData } from "../types/output";

/**
 * Library actions store — client-side state for the ellipsis/footer actions
 * that have no backend to write to (this is a demo prototype, per project
 * memory "prototype minimum": mock/local stores, no real DB).
 *
 * Same `useSyncExternalStore` module-store pattern as
 * `src/lib/ad-entity-write-store.ts` — optimistic, synchronous (a write can't
 * fail), NOT persisted (resets on reload). That reset is an accepted,
 * disclosed property of every prototype store in this codebase, not unique
 * to this file.
 *
 * Two kinds of state:
 *  1. `saved` — per-output toggle flags (bookmark / concept / template / KB).
 *     Real, visible, working: the card and the ellipsis menu both reflect it
 *     immediately. It does not fabricate a destination screen this agent
 *     doesn't own (Concepts / Templates / Knowledge Base asset lists) — it
 *     marks the SOURCE record, which is exactly what "Save as concept" etc.
 *     can honestly promise from the Library side.
 *  2. `localOutputs` — session-created derived cards (from "Save text-only
 *     to Library" / "Save media-only to Library"). Unlike the toggle flags,
 *     these actions' whole point is a NEW library item appearing, so they
 *     really do add one, merged into the Library's list at render time
 *     (see GeneratedOutputsTab). `sample-outputs.ts` itself is never
 *     mutated — a fresh array is held here instead.
 */

export type SavedKind = "bookmark" | "concept" | "template" | "kb";

const KINDS: SavedKind[] = ["bookmark", "concept", "template", "kb"];

interface State {
  saved: Record<SavedKind, Set<string>>;
  localOutputs: OutputData[];
}

const state: State = {
  saved: {
    bookmark: new Set(),
    concept: new Set(),
    template: new Set(),
    kb: new Set(),
  },
  localOutputs: [],
};

const listeners = new Set<() => void>();
function emit() {
  for (const l of listeners) l();
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

// Snapshot identity must change on every write so useSyncExternalStore
// re-renders — each mutation below replaces the relevant Set/array.
let snapshot: State = state;
function commit() {
  snapshot = {
    saved: { ...state.saved },
    localOutputs: state.localOutputs,
  };
  emit();
}

export function isSaved(kind: SavedKind, outputId: string): boolean {
  return state.saved[kind].has(outputId);
}

/** Flips the flag, returns the NEW state (true = now saved). */
export function toggleSaved(kind: SavedKind, outputId: string): boolean {
  const set = state.saved[kind];
  const next = new Set(set);
  let nowSaved: boolean;
  if (next.has(outputId)) {
    next.delete(outputId);
    nowSaved = false;
  } else {
    next.add(outputId);
    nowSaved = true;
  }
  state.saved[kind] = next;
  commit();
  return nowSaved;
}

export function addLocalOutput(o: OutputData) {
  state.localOutputs = [o, ...state.localOutputs];
  commit();
}

function getSnapshot(): State {
  return snapshot;
}

/** Reactive read of the whole store. Re-renders on any toggle or add. */
export function useLibraryActionsState(): State {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Reactive read of just one flag — narrower re-render surface for cards. */
export function useIsSaved(kind: SavedKind, outputId: string): boolean {
  const s = useLibraryActionsState();
  return s.saved[kind].has(outputId);
}

export function useLocalOutputs(): OutputData[] {
  return useLibraryActionsState().localOutputs;
}

export { KINDS as SAVED_KINDS };
