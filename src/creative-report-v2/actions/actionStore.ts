/**
 * Creative Report 2.0 — optimistic action state.
 *
 * Module-level external store (useSyncExternalStore) mirroring the repo's
 * userBrandsStore pattern. Holds the client-side result of user actions that
 * the prototype simulates: pause, "queued in Launch", saved to Library, marked
 * winner, and dedup merge/split. Optimistic — flags flip immediately. Not
 * persisted (resets on reload); this is a prototype surface, not a real store.
 */
import { useSyncExternalStore } from "react";

export interface CreativeActionState {
  paused?: boolean;
  queuedInLaunch?: boolean;
  savedToLibrary?: boolean;
  markedWinner?: boolean;
  /** Simulated "Duplicate" (iter-2 P5) — an optimistic flag on the SAME
   *  creative rather than fabricating a second creative row, which would
   *  corrupt the audited dataset's creative count. */
  duplicated?: boolean;
}

/** Dedup group resolution chosen by the user in the drawer. */
export type DedupResolution = "merged" | "split";

interface StoreShape {
  byCreative: Record<string, CreativeActionState>;
  dedupByGroup: Record<string, DedupResolution>;
}

let state: StoreShape = { byCreative: {}, dedupByGroup: {} };
const listeners = new Set<() => void>();

function emit() {
  // New reference so useSyncExternalStore sees the change.
  state = { byCreative: { ...state.byCreative }, dedupByGroup: { ...state.dedupByGroup } };
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): StoreShape {
  return state;
}

/* ------------------------------------------------------------------ */
/*  Mutations (optimistic)                                             */
/* ------------------------------------------------------------------ */

function patch(creativeId: string, next: Partial<CreativeActionState>) {
  state.byCreative[creativeId] = { ...state.byCreative[creativeId], ...next };
  emit();
}

export function setPaused(creativeId: string, paused = true) {
  patch(creativeId, { paused });
}
export function setQueuedInLaunch(creativeId: string) {
  patch(creativeId, { queuedInLaunch: true });
}
export function setSavedToLibrary(creativeId: string, saved = true) {
  patch(creativeId, { savedToLibrary: saved });
}
export function setMarkedWinner(creativeId: string, marked = true) {
  patch(creativeId, { markedWinner: marked });
}
export function setDuplicated(creativeId: string, duplicated = true) {
  patch(creativeId, { duplicated });
}
export function setDedupResolution(groupId: string, resolution: DedupResolution) {
  state.dedupByGroup[groupId] = resolution;
  emit();
}

/** Bulk pause (used by the grid's bulk action bar). */
export function pauseMany(creativeIds: string[]) {
  for (const id of creativeIds) {
    state.byCreative[id] = { ...state.byCreative[id], paused: true };
  }
  emit();
}
export function queueManyInLaunch(creativeIds: string[]) {
  for (const id of creativeIds) {
    state.byCreative[id] = { ...state.byCreative[id], queuedInLaunch: true };
  }
  emit();
}

/* ------------------------------------------------------------------ */
/*  Hooks                                                              */
/* ------------------------------------------------------------------ */

const EMPTY: CreativeActionState = {};

export function useCreativeAction(creativeId: string): CreativeActionState {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return snap.byCreative[creativeId] ?? EMPTY;
}

export function useAllActions(): StoreShape {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useDedupResolution(groupId: string | undefined): DedupResolution | null {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return groupId ? snap.dedupByGroup[groupId] ?? null : null;
}
