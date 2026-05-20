import { useCallback, useSyncExternalStore } from "react";

/**
 * use-pinned-insight-boards — localStorage-backed pin state for the Industry
 * Insights left sub-nav.
 *
 * Behaviour:
 *   - Stores an ordered array of board IDs under a single key.
 *   - Cap = 5. Trying to pin a 6th must be rejected by the caller (this hook
 *     returns the cap result; the toast is the caller's responsibility — keeps
 *     the hook UI-agnostic).
 *   - Pin order is INSERTION order (most recently pinned at the end). v1 has
 *     no drag-to-reorder — see PinnedBoardsSection.tsx for the deferred note.
 *   - SAME-TAB sync (A-12.175 fix): all hook instances share a single
 *     module-level store via `useSyncExternalStore`. When the boards-page
 *     kebab fires a togglePin, the sub-nav addon's instance sees the change
 *     in the same tick — no `storage` event needed (that one only fires for
 *     OTHER tabs). Prior version used independent `useState` per consumer,
 *     so a pin from the boards page never made it to the sub-nav until
 *     refresh.
 *   - CROSS-TAB sync via the `storage` event piggybacks on the same
 *     subscriber set so behavior is identical inside and across tabs.
 *   - No backend: this is per-browser, per-user preference. Survives refresh
 *     only on the same machine. Acceptable for an MVP frequent-access shortcut.
 *
 * Colocated under src/components/insights/ to keep the pin feature self-
 * contained — there is no other consumer outside the Insights left rail.
 */

export const PINNED_BOARDS_STORAGE_KEY = "genie6:insights:pinned-boards";
export const PINNED_BOARDS_SEEDED_KEY = "genie6:insights:pinned-boards-seeded";
export const MAX_PINNED_BOARDS = 5;
export const DEFAULT_SEED_COUNT = 4;

/* ── External store ────────────────────────────────────────────────── */

const subscribers = new Set<() => void>();

function readPinsFromStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PINNED_BOARDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

// Module-level cache. The first read hydrates from localStorage; subsequent
// reads return the SAME reference until a write happens, so React's
// useSyncExternalStore doesn't fire false-positive change detections.
let cache: string[] = readPinsFromStorage();
let cacheRaw: string | null =
  typeof window !== "undefined"
    ? window.localStorage.getItem(PINNED_BOARDS_STORAGE_KEY)
    : null;

function commit(next: string[]) {
  cache = next;
  cacheRaw = JSON.stringify(next);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(PINNED_BOARDS_STORAGE_KEY, cacheRaw);
    } catch {
      // localStorage can fail (private browsing quota, disabled storage).
      // Silent fail — in-memory cache still updates so the UI reflects the
      // click; persistence simply skips for this session.
    }
  }
  // Notify all in-tab consumers AFTER cache + storage are written so any
  // re-read during the callback sees the new value.
  subscribers.forEach((cb) => cb());
}

function getSnapshot(): string[] {
  // On every read, check whether another tab has updated localStorage out
  // from under us. If so, refresh the cache before handing back a snapshot
  // — otherwise React would render the stale in-memory list. The string
  // comparison is cheap; only on mismatch do we re-parse.
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(PINNED_BOARDS_STORAGE_KEY);
      if (raw !== cacheRaw) {
        cacheRaw = raw;
        cache = readPinsFromStorage();
      }
    } catch {
      // Read error — keep the existing cache.
    }
  }
  return cache;
}

// Server snapshot for SSR — stable empty list (same reference every call).
const EMPTY: string[] = [];
const getServerSnapshot = () => EMPTY;

function subscribe(cb: () => void): () => void {
  subscribers.add(cb);
  // Piggyback cross-tab `storage` events on the same subscriber so any
  // hook instance reacts to other-tab writes too.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== PINNED_BOARDS_STORAGE_KEY) return;
    // Other tab changed our key — invalidate cacheRaw so the next
    // getSnapshot picks up the new value, then notify.
    cacheRaw = null;
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

/* ── Seeded flag (separate, doesn't need the subscription) ─────────── */

/**
 * Has the default-pin seed already run on this browser? Used by the
 * shell-layer addon to avoid re-seeding after the user has explicitly
 * unpinned the defaults — once seeded, the user is in control.
 */
export function hasSeeded(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(PINNED_BOARDS_SEEDED_KEY) === "1";
  } catch {
    // If localStorage is unreadable we conservatively report "already
    // seeded" so the caller doesn't churn trying to write a flag that
    // will never persist.
    return true;
  }
}

function writeSeededFlag() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PINNED_BOARDS_SEEDED_KEY, "1");
  } catch {
    // Silent fail — same rationale as commit().
  }
}

/* ── Hook ──────────────────────────────────────────────────────────── */

export interface UsePinnedInsightBoards {
  /** Ordered list of pinned board IDs. */
  pinnedIds: string[];
  /** Quick membership check for a single board. */
  isPinned: (boardId: string) => boolean;
  /**
   * Toggle pin state. Returns:
   *   - "pinned"   — newly pinned
   *   - "unpinned" — newly unpinned
   *   - "cap"      — pin rejected, already at MAX_PINNED_BOARDS
   */
  togglePin: (boardId: string) => "pinned" | "unpinned" | "cap";
  /** Explicit unpin, no-ops if not pinned. */
  unpin: (boardId: string) => void;
  /** Total pinned count. */
  count: number;
  /** True when at cap (used to disable pin buttons proactively). */
  isAtCap: boolean;
  /**
   * Seed the pinned list with the given board IDs (first-time only).
   *
   * No-ops if the seeded flag is already set, so re-seeding never stomps
   * on a user who explicitly unpinned the defaults. Caller is responsible
   * for trimming the input to <= MAX_PINNED_BOARDS; we defensively slice
   * anyway. Writes both the pin list and the seeded flag atomically so we
   * never end up with a flag-without-pins or pins-without-flag mismatch.
   */
  seedDefaultPins: (boardIds: string[]) => void;
}

export function usePinnedInsightBoards(): UsePinnedInsightBoards {
  // useSyncExternalStore: every hook instance subscribes to the same
  // module-level subscriber set, so a write from ANY consumer (boards-page
  // kebab, pinned-section ellipsis, addon seed, future bulk action) re-
  // renders ALL consumers in the same tick. This is the core fix for the
  // sibling-out-of-sync bug Maalik flagged in A-12.175.
  const pinnedIds = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const isPinned = useCallback(
    (boardId: string) => pinnedIds.includes(boardId),
    [pinnedIds],
  );

  const togglePin = useCallback(
    (boardId: string): "pinned" | "unpinned" | "cap" => {
      // Read the latest snapshot rather than relying on the closure value,
      // which can be stale across rapid clicks.
      const prev = getSnapshot();
      if (prev.includes(boardId)) {
        commit(prev.filter((id) => id !== boardId));
        return "unpinned";
      }
      if (prev.length >= MAX_PINNED_BOARDS) {
        return "cap";
      }
      commit([...prev, boardId]);
      return "pinned";
    },
    [],
  );

  const unpin = useCallback((boardId: string) => {
    const prev = getSnapshot();
    if (!prev.includes(boardId)) return;
    commit(prev.filter((id) => id !== boardId));
  }, []);

  const seedDefaultPins = useCallback((boardIds: string[]) => {
    // Hard guard: if the seeded flag is already written, never run again.
    // This is the contract that lets the user unpin defaults without
    // them springing back on the next refresh.
    if (hasSeeded()) return;
    if (boardIds.length === 0) return;
    const next = boardIds.slice(0, MAX_PINNED_BOARDS);
    commit(next);
    writeSeededFlag();
  }, []);

  return {
    pinnedIds,
    isPinned,
    togglePin,
    unpin,
    count: pinnedIds.length,
    isAtCap: pinnedIds.length >= MAX_PINNED_BOARDS,
    seedDefaultPins,
  };
}
