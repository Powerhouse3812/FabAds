/**
 * Creative Report 2.0 — saved filters (localStorage-backed).
 *
 * A saved filter set is a named snapshot of the current query string, so a
 * buyer can re-apply "Fatiguing on Meta, last 14 days" each morning without
 * rebuilding it. Surfaced from the filter icon in FilterBar via
 * SavedFiltersModal — apply patches the current route's search params in
 * place, it never navigates.
 *
 * External-store pattern (mirrors genie6/hooks/useDemoData) with cross-tab
 * `storage` sync. No draft/autosave concept — that existed only to protect
 * an unsaved config on a now-removed dedicated page, and was never actually
 * wired up (nothing ever called it). A modal has no page to navigate away
 * from, so there's nothing to protect.
 *
 * Storage key kept as "creative-report-saved-views" for backward
 * compatibility with anything already saved in a user's browser.
 */
import { useCallback, useSyncExternalStore } from "react";

const KEY = "creative-report-saved-views";

export interface SavedFilterSet {
  id: string;
  name: string;
  /** The query string (without leading "?"). */
  query: string;
  createdAt: string;
}

function read(): SavedFilterSet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Snapshot-stability note (see automations/boards.ts header comment for the
// bug this avoids): getSnapshot() must NEVER construct a new array on every
// call — it caches at module scope and only replaces inside persist(),
// after a real mutation. A fresh array each call white-screens this repo.
let cache: SavedFilterSet[] = read();
const listeners = new Set<() => void>();

function persist(next: SavedFilterSet[]) {
  cache = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = read();
      cb();
    }
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): SavedFilterSet[] {
  return cache;
}

/** A stable-ish id without Math.random / Date.now in the data layer proper. */
function makeId(existing: SavedFilterSet[]): string {
  let n = existing.length + 1;
  while (existing.some((v) => v.id === `filter-${n}`)) n++;
  return `filter-${n}`;
}

export function useSavedFilters() {
  const filterSets = useSyncExternalStore(subscribe, getSnapshot, () => [] as SavedFilterSet[]);

  const save = useCallback((name: string, query: string) => {
    const list = read();
    const set: SavedFilterSet = {
      id: makeId(list),
      name: name.trim() || "Untitled filter",
      query,
      createdAt: new Date().toISOString(),
    };
    persist([...list, set]);
  }, []);

  const rename = useCallback((id: string, name: string) => {
    persist(read().map((v) => (v.id === id ? { ...v, name: name.trim() || v.name } : v)));
  }, []);

  const remove = useCallback((id: string) => {
    persist(read().filter((v) => v.id !== id));
  }, []);

  return { filterSets, save, rename, remove };
}
