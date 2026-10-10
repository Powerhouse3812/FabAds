/**
 * Last visit (Q8). Read once per browser session:
 *  - this session's `lastVisitAt` = the stored previous visit,
 *  - then the stored value is set to now (so the NEXT session compares to this one),
 *  - first-ever visit seeds it to FIRST_VISIT_SEED_DAYS ago.
 * The session's value is kept in sessionStorage so reloads inside the same
 * session keep the same "New" set. Blocked storage → now − 2 days, in memory.
 */
import { useSyncExternalStore } from "react";
import { FIRST_VISIT_SEED_DAYS } from "../types";
import { STORAGE_KEYS, readRaw, removeRaw, writeRaw } from "./storage";

const DAY = 86_400_000;
let resolved: string | null = null;
const listeners = new Set<() => void>();

function validIso(v: string | null): v is string {
  return v != null && Number.isFinite(Date.parse(v));
}

/** This session's last-visit timestamp (ISO). Stable for the whole session. */
export function getLastVisitAt(now: number = Date.now()): string {
  if (resolved) return resolved;
  const sessionValue = readRaw(STORAGE_KEYS.sessionLastVisit, "session");
  if (validIso(sessionValue)) {
    resolved = sessionValue;
    return resolved;
  }
  const previous = readRaw(STORAGE_KEYS.lastVisit, "local");
  const value = validIso(previous) ? previous : new Date(now - FIRST_VISIT_SEED_DAYS * DAY).toISOString();
  writeRaw(STORAGE_KEYS.sessionLastVisit, value, "session");
  writeRaw(STORAGE_KEYS.lastVisit, new Date(now).toISOString(), "local");
  resolved = value;
  return resolved;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const snapshot = () => getLastVisitAt();

/** React hook: this session's last visit (ISO). */
export function useLastVisitAt(): string {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

/**
 * Forget the in-memory value and the session flag (tests / demo "start a new
 * visit"). The stored previous visit is kept unless `clearStored` is set.
 */
export function resetLastVisit(opts: { clearStored?: boolean } = {}): void {
  resolved = null;
  removeRaw(STORAGE_KEYS.sessionLastVisit, "session");
  if (opts.clearStored) removeRaw(STORAGE_KEYS.lastVisit, "local");
  listeners.forEach((l) => l());
}
