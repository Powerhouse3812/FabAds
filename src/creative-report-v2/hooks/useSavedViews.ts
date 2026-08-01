/**
 * Creative Report 2.0 — saved views (localStorage-backed).
 *
 * A saved view is a named snapshot of the filter/sort/group query string, so a
 * buyer can jump straight to "Fatiguing on Meta, last 14 days" each morning.
 * External-store pattern (mirrors genie6/hooks/useDemoData) with cross-tab
 * `storage` sync. Also autosaves the current filters as a `__draft__` so an
 * unsaved config is never silently lost (handoff §8 "unsaved view config").
 */
import { useCallback, useSyncExternalStore } from "react";

const KEY = "creative-report-v2-saved-views";

export interface SavedView {
  id: string;
  name: string;
  /** The query string (without leading "?"). */
  query: string;
  createdAt: string;
}

const DRAFT_ID = "__draft__";

function read(): SavedView[] {
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

let cache: SavedView[] = read();
const listeners = new Set<() => void>();

function persist(next: SavedView[]) {
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

function getSnapshot(): SavedView[] {
  return cache;
}

/** A stable-ish id without Math.random / Date.now in the data layer proper. */
function makeId(existing: SavedView[]): string {
  let n = existing.length + 1;
  while (existing.some((v) => v.id === `view-${n}`)) n++;
  return `view-${n}`;
}

export function useSavedViews() {
  const views = useSyncExternalStore(subscribe, getSnapshot, () => [] as SavedView[]);

  const saved = views.filter((v) => v.id !== DRAFT_ID);
  const draft = views.find((v) => v.id === DRAFT_ID) ?? null;

  const save = useCallback((name: string, query: string) => {
    const list = read();
    const view: SavedView = {
      id: makeId(list.filter((v) => v.id !== DRAFT_ID)),
      name: name.trim() || "Untitled view",
      query,
      createdAt: new Date().toISOString(),
    };
    // Saving promotes: drop any draft.
    persist([...list.filter((v) => v.id !== DRAFT_ID), view]);
  }, []);

  const rename = useCallback((id: string, name: string) => {
    persist(read().map((v) => (v.id === id ? { ...v, name: name.trim() || v.name } : v)));
  }, []);

  const remove = useCallback((id: string) => {
    persist(read().filter((v) => v.id !== id));
  }, []);

  /** Store the current query as the autosaved draft (unsaved-config safety). */
  const setDraft = useCallback((query: string) => {
    const list = read().filter((v) => v.id !== DRAFT_ID);
    if (!query) {
      persist(list);
      return;
    }
    persist([
      ...list,
      { id: DRAFT_ID, name: "Unsaved draft", query, createdAt: new Date().toISOString() },
    ]);
  }, []);

  const clearDraft = useCallback(() => {
    persist(read().filter((v) => v.id !== DRAFT_ID));
  }, []);

  return { views: saved, draft, save, rename, remove, setDraft, clearDraft };
}
