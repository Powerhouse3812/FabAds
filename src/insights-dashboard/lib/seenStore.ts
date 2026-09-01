/**
 * seenStore — the read-marker behind "what changed since you last looked".
 *
 * The change feed's entire premise is a diff against the last time YOU were
 * here. Across the 12 ad-intelligence products surveyed for this module, none
 * of them keeps that baseline: Meta Ad Library stores nothing to diff against,
 * Foreplay diffs only inside a single brand. But a diff with no read-marker is
 * just a list — every visit re-serves signals the user already triaged, and the
 * premise quietly stops being true. This module is the marker.
 *
 * Two facts, one key:
 *   - `ids`             which signals this browser has looked at
 *   - `previousVisitAt` when the visit BEFORE this one started
 *
 * `previousVisitAt` is what makes "since your last visit" honest. `startVisit()`
 * rotates the current stamp into the previous slot and writes a fresh one, so
 * the value the UI reads is always the prior session — never "now". Until a
 * second visit exists it is `null`, and the UI must fall back to describing the
 * scan window instead of inventing a visit that never happened.
 *
 * ── Shape of the module ───────────────────────────────────────────────────
 * Same external-store shape as `src/components/insights/use-pinned-insight-boards.ts`:
 * a module-level subscriber set driving `useSyncExternalStore`, so every
 * consumer re-renders in the same tick as a write from any other, plus a
 * `storage` listener piggybacked on the same subscription for cross-tab sync.
 *
 * ── Failure posture ───────────────────────────────────────────────────────
 * Every localStorage touch is wrapped. Private browsing throws on write and can
 * throw on read; a dashboard that white-screens because storage is unavailable
 * is strictly worse than one that forgets what you'd seen. On failure the
 * in-memory cache still updates, so the click is honoured for this session and
 * only persistence is skipped.
 *
 * ── Not a backend ─────────────────────────────────────────────────────────
 * Per-browser, per-machine, no network, no Supabase — this module is a
 * prototype and the seen-set is a prototype's memory. Import is a read only:
 * nothing here writes, stamps a visit, or reads a clock until you call it.
 */
import { useCallback, useSyncExternalStore } from "react";

/** Namespaced alongside `genie6:insights:pinned-boards`. */
export const CHANGE_FEED_SEEN_STORAGE_KEY = "genie6:insights:change-feed-seen";

/**
 * Hard cap on the persisted id list. `markAllSeen` replaces rather than
 * appends, so in practice the set tracks the live feed — but a long-lived
 * browser calling `markSeen` row-by-row across many corpora shouldn't grow
 * this key without bound. Oldest ids fall off first.
 */
export const MAX_SEEN_IDS = 500;

/** Bumped only on a breaking shape change; a mismatch resets rather than guesses. */
const SCHEMA_VERSION = 1;

/* ── Snapshot ──────────────────────────────────────────────────────────── */

export interface ChangeFeedSeenSnapshot {
  /** Seen signal ids, oldest first. Persisted. */
  ids: readonly string[];
  /** Same ids as a set — derived at commit time so lookups are O(1) and the
   *  reference is stable for the life of the snapshot. Not persisted. */
  seen: ReadonlySet<string>;
  /** ms epoch of the visit BEFORE this one. `null` on a first-ever visit. */
  previousVisitAt: number | null;
  /** ms epoch of the current visit. `null` until `startVisit()` runs. */
  visitAt: number | null;
}

/** JSON actually written to localStorage. */
interface PersistedSeen {
  v: number;
  ids: string[];
  previousVisitAt: number | null;
  visitAt: number | null;
}

function makeSnapshot(
  ids: readonly string[],
  previousVisitAt: number | null,
  visitAt: number | null,
): ChangeFeedSeenSnapshot {
  return { ids, seen: new Set(ids), previousVisitAt, visitAt };
}

/** Stable empty reference — reused for SSR and every parse failure. */
const EMPTY_SNAPSHOT: ChangeFeedSeenSnapshot = makeSnapshot([], null, null);

/* ── Storage I/O ───────────────────────────────────────────────────────── */

function readRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(CHANGE_FEED_SEEN_STORAGE_KEY);
  } catch {
    // Storage can be disabled outright, not just full.
    return null;
  }
}

function parse(raw: string | null): ChangeFeedSeenSnapshot {
  if (!raw) return EMPTY_SNAPSHOT;
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedSeen> | null;
    if (!parsed || typeof parsed !== "object") return EMPTY_SNAPSHOT;
    if (parsed.v !== SCHEMA_VERSION) return EMPTY_SNAPSHOT;

    const ids = Array.isArray(parsed.ids)
      ? parsed.ids.filter((id): id is string => typeof id === "string" && id.length > 0)
      : [];
    const previousVisitAt = finiteOrNull(parsed.previousVisitAt);
    const visitAt = finiteOrNull(parsed.visitAt);

    return makeSnapshot(ids.slice(-MAX_SEEN_IDS), previousVisitAt, visitAt);
  } catch {
    // Corrupt JSON from a hand-edited key or an older shape — start clean
    // rather than throwing inside a render.
    return EMPTY_SNAPSHOT;
  }
}

function finiteOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/* ── External store ────────────────────────────────────────────────────── */

const subscribers = new Set<() => void>();

// First read hydrates from localStorage; every subsequent read hands back the
// SAME reference until a write happens, so useSyncExternalStore never sees a
// false-positive change.
let cacheRaw: string | null = readRaw();
let cache: ChangeFeedSeenSnapshot = parse(cacheRaw);

function commit(next: ChangeFeedSeenSnapshot): void {
  cache = next;
  const payload: PersistedSeen = {
    v: SCHEMA_VERSION,
    ids: [...next.ids],
    previousVisitAt: next.previousVisitAt,
    visitAt: next.visitAt,
  };
  cacheRaw = JSON.stringify(payload);

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(CHANGE_FEED_SEEN_STORAGE_KEY, cacheRaw);
    } catch {
      // Quota / private mode / storage disabled. The in-memory cache is
      // already updated, so the UI reflects the click; only persistence is
      // skipped for this session.
    }
  }

  // Notify AFTER cache + storage are written, so anything re-reading inside a
  // callback sees the new value.
  subscribers.forEach((cb) => cb());
}

function getSnapshot(): ChangeFeedSeenSnapshot {
  // Another tab may have written our key out from under us. String-compare
  // first (cheap); only re-parse on a genuine mismatch.
  const raw = readRaw();
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    cache = parse(raw);
  }
  return cache;
}

const getServerSnapshot = (): ChangeFeedSeenSnapshot => EMPTY_SNAPSHOT;

function subscribe(cb: () => void): () => void {
  subscribers.add(cb);

  // `storage` fires for OTHER tabs only; same-tab sync comes from the
  // subscriber set above. Both routes land on the same callback.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== CHANGE_FEED_SEEN_STORAGE_KEY) return;
    cacheRaw = null; // force the next getSnapshot to re-read
    cb();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }

  return () => {
    subscribers.delete(cb);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

/* ── Actions (module-level ⇒ stable identity, no useCallback needed) ────── */

/**
 * Add ids to the seen set. Additive and idempotent — re-marking is a no-op and
 * does not notify, so a row action can call this unconditionally.
 */
export function markSeen(ids: readonly string[] | string): void {
  const list = typeof ids === "string" ? [ids] : ids;
  if (list.length === 0) return;

  const prev = getSnapshot();
  const nextSet = new Set(prev.ids);
  const next = [...prev.ids];
  let changed = false;

  for (const id of list) {
    if (typeof id !== "string" || id.length === 0) continue;
    if (nextSet.has(id)) continue;
    nextSet.add(id);
    next.push(id);
    changed = true;
  }

  if (!changed) return;
  commit(makeSnapshot(next.slice(-MAX_SEEN_IDS), prev.previousVisitAt, prev.visitAt));
}

/**
 * "I've caught up." REPLACES the seen set with exactly `ids` rather than
 * appending to it — the caller passes everything currently in the feed, so
 * this doubles as housekeeping that drops ids for signals that no longer
 * exist. Visit stamps are untouched: catching up is not a new visit.
 */
export function markAllSeen(ids: readonly string[]): void {
  const prev = getSnapshot();
  const unique = Array.from(
    new Set(ids.filter((id): id is string => typeof id === "string" && id.length > 0)),
  ).slice(-MAX_SEEN_IDS);

  const identical =
    unique.length === prev.ids.length && unique.every((id, i) => id === prev.ids[i]);
  if (identical) return;

  commit(makeSnapshot(unique, prev.previousVisitAt, prev.visitAt));
}

/**
 * Back to a genuine first-ever visit: nothing seen, no prior visit to diff
 * against. The current visit stamp is refreshed rather than cleared, so the
 * NEXT reload still gets a usable baseline.
 *
 * This exists because the feed is reviewed by flipping between its states. A
 * one-way "mark all as seen" would burn that review on the first click.
 */
export function resetSeen(): void {
  commit(makeSnapshot([], null, Date.now()));
}

/**
 * Record that a visit is under way, rotating the old stamp into
 * `previousVisitAt`. Idempotent for the life of the page — StrictMode's double
 * effect, a remount, or two mounted consumers all stamp once between them, so
 * "your last visit" can never collapse to "a second ago".
 *
 * Call from an effect, never during render.
 */
let visitStamped = false;
export function startVisit(): void {
  if (visitStamped) return;
  visitStamped = true;
  const prev = getSnapshot();
  commit(makeSnapshot(prev.ids, prev.visitAt, Date.now()));
}

/* ── Hook ──────────────────────────────────────────────────────────────── */

export interface UseChangeFeedSeen {
  /** Seen ids. Stable reference until a write. */
  seenIds: ReadonlySet<string>;
  seenCount: number;
  isSeen: (id: string) => boolean;
  /** Additive mark. */
  markSeen: typeof markSeen;
  /** Replacing "caught up" mark. */
  markAllSeen: typeof markAllSeen;
  /** Back to first-ever-visit. */
  resetSeen: typeof resetSeen;
  /** Stamp this visit. Effect-only, idempotent per page load. */
  startVisit: typeof startVisit;
  /**
   * ms epoch of the visit before this one, or `null` when there isn't one.
   * `null` is not "long ago" — it means the store has no baseline and the UI
   * must not claim one.
   */
  lastVisitAt: number | null;
  /** True once a real prior visit exists to diff against. */
  hasVisitBaseline: boolean;
  /** True when there is anything for `resetSeen` to undo. */
  hasSeenState: boolean;
}

export function useChangeFeedSeen(): UseChangeFeedSeen {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const isSeen = useCallback((id: string) => snapshot.seen.has(id), [snapshot]);

  return {
    seenIds: snapshot.seen,
    seenCount: snapshot.ids.length,
    isSeen,
    markSeen,
    markAllSeen,
    resetSeen,
    startVisit,
    lastVisitAt: snapshot.previousVisitAt,
    hasVisitBaseline: snapshot.previousVisitAt !== null,
    hasSeenState: snapshot.ids.length > 0 || snapshot.previousVisitAt !== null,
  };
}
