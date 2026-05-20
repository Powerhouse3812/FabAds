import { useCallback, useEffect, useState } from "react";

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
 *   - Cross-tab sync via the `storage` event so a pin in one tab updates the
 *     other without a refresh.
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

function readPins(): string[] {
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

function writePins(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      PINNED_BOARDS_STORAGE_KEY,
      JSON.stringify(ids),
    );
  } catch {
    // localStorage can fail (private browsing quota, disabled storage).
    // Silent fail — pin state simply won't persist. In-memory state still
    // updates so the UI doesn't appear stuck on the click.
  }
}

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
    // Silent fail — same rationale as writePins.
  }
}

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
   * No-ops if the seeded flag is already set, so re-seeding never
   * stomps on a user who explicitly unpinned the defaults. Caller is
   * responsible for trimming the input to <= MAX_PINNED_BOARDS; we
   * defensively slice anyway. Writes both the pin list and the seeded
   * flag in the same call so we never end up with a flag-without-pins
   * or pins-without-flag mismatch.
   */
  seedDefaultPins: (boardIds: string[]) => void;
}

export function usePinnedInsightBoards(): UsePinnedInsightBoards {
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => readPins());

  // Cross-tab sync: when another tab updates the key, mirror it locally.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== PINNED_BOARDS_STORAGE_KEY) return;
      setPinnedIds(readPins());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isPinned = useCallback(
    (boardId: string) => pinnedIds.includes(boardId),
    [pinnedIds],
  );

  const togglePin = useCallback(
    (boardId: string): "pinned" | "unpinned" | "cap" => {
      // Capture the result inside the functional update so we never read from
      // a stale closure when consumers call togglePin in rapid succession.
      let result: "pinned" | "unpinned" | "cap" = "pinned";
      setPinnedIds((prev) => {
        if (prev.includes(boardId)) {
          result = "unpinned";
          const next = prev.filter((id) => id !== boardId);
          writePins(next);
          return next;
        }
        if (prev.length >= MAX_PINNED_BOARDS) {
          result = "cap";
          return prev;
        }
        result = "pinned";
        const next = [...prev, boardId];
        writePins(next);
        return next;
      });
      return result;
    },
    [],
  );

  const unpin = useCallback((boardId: string) => {
    setPinnedIds((prev) => {
      if (!prev.includes(boardId)) return prev;
      const next = prev.filter((id) => id !== boardId);
      writePins(next);
      return next;
    });
  }, []);

  const seedDefaultPins = useCallback((boardIds: string[]) => {
    // Hard guard: if the seeded flag is already written, never run again.
    // This is the contract that lets the user unpin defaults without
    // them springing back on the next refresh.
    if (hasSeeded()) return;
    if (boardIds.length === 0) return;
    const next = boardIds.slice(0, MAX_PINNED_BOARDS);
    writePins(next);
    writeSeededFlag();
    setPinnedIds(next);
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
