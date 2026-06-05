import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_KPI_KEYS,
  KPI_COLUMN_BY_KEY,
  MAX_KPI_COLUMNS,
} from "./kpi-catalogue";

/**
 * useDashboardKpiPrefs — localStorage-backed preference for which Reports
 * columns the user has pinned to the Performance Overview band, and in
 * what order (A-12.200).
 *
 * Contract:
 *   - Ordered array of column keys, length 1..MAX_KPI_COLUMNS (5).
 *   - Persisted per-browser; cross-tab synced via the `storage` event.
 *   - Invalid / unknown keys are pruned on read (catalogue may change).
 *   - Falls back to DEFAULT_KPI_KEYS when empty or unreadable.
 */

const STORAGE_KEY = "fabads:dashboard:kpi-cols";

function sanitize(keys: unknown): string[] {
  if (!Array.isArray(keys)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const k of keys) {
    if (typeof k !== "string") continue;
    if (!KPI_COLUMN_BY_KEY[k]) continue; // unknown column — drop
    if (seen.has(k)) continue; // dedupe
    seen.add(k);
    out.push(k);
    if (out.length >= MAX_KPI_COLUMNS) break;
  }
  return out;
}

function read(): string[] {
  if (typeof window === "undefined") return DEFAULT_KPI_KEYS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_KPI_KEYS;
    const parsed = sanitize(JSON.parse(raw));
    return parsed.length > 0 ? parsed : DEFAULT_KPI_KEYS;
  } catch {
    return DEFAULT_KPI_KEYS;
  }
}

function write(keys: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch {
    // Silent — band still updates in-memory for the session.
  }
}

export interface DashboardKpiPrefs {
  selected: string[];
  /** True when at the 5-column cap (used to disable "add" affordances). */
  isAtMax: boolean;
  /** Add a column (no-op if already present or at cap). */
  add: (key: string) => void;
  /** Remove a column (no-op if it's the last remaining — band never empties). */
  remove: (key: string) => void;
  /** Toggle membership. */
  toggle: (key: string) => void;
  /** Replace the whole ordered list (used by drag-reorder). */
  reorder: (keys: string[]) => void;
  /** Restore the default 5. */
  reset: () => void;
}

export function useDashboardKpiPrefs(): DashboardKpiPrefs {
  const [selected, setSelected] = useState<string[]>(() => read());

  // Cross-tab sync.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setSelected(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commit = useCallback((next: string[]) => {
    setSelected(next);
    write(next);
  }, []);

  const add = useCallback(
    (key: string) => {
      setSelected((prev) => {
        if (prev.includes(key) || prev.length >= MAX_KPI_COLUMNS) return prev;
        if (!KPI_COLUMN_BY_KEY[key]) return prev;
        const next = [...prev, key];
        write(next);
        return next;
      });
    },
    [],
  );

  const remove = useCallback((key: string) => {
    setSelected((prev) => {
      if (!prev.includes(key) || prev.length <= 1) return prev; // never empty
      const next = prev.filter((k) => k !== key);
      write(next);
      return next;
    });
  }, []);

  const toggle = useCallback(
    (key: string) => {
      setSelected((prev) => {
        if (prev.includes(key)) {
          if (prev.length <= 1) return prev;
          const next = prev.filter((k) => k !== key);
          write(next);
          return next;
        }
        if (prev.length >= MAX_KPI_COLUMNS) return prev;
        if (!KPI_COLUMN_BY_KEY[key]) return prev;
        const next = [...prev, key];
        write(next);
        return next;
      });
    },
    [],
  );

  const reorder = useCallback((keys: string[]) => commit(sanitize(keys)), [commit]);
  const reset = useCallback(() => commit([...DEFAULT_KPI_KEYS]), [commit]);

  return {
    selected,
    isAtMax: selected.length >= MAX_KPI_COLUMNS,
    add,
    remove,
    toggle,
    reorder,
    reset,
  };
}
