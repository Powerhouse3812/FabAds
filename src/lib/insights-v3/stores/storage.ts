/**
 * Safe storage + a tiny external store for useSyncExternalStore.
 *
 * Every read and write is wrapped in try/catch: blocked storage (private mode,
 * disabled cookies, SSR, tests) falls back to in-memory state seeded with the
 * demo defaults. Keys are namespaced `fabads:insights-v3:*`.
 */

export const STORAGE_PREFIX = "fabads:insights-v3:";

export const STORAGE_KEYS = {
  lastVisit: `${STORAGE_PREFIX}last-visit`,
  sessionLastVisit: `${STORAGE_PREFIX}session-last-visit`,
  follows: `${STORAGE_PREFIX}follows`,
  competitors: `${STORAGE_PREFIX}competitors`,
  boards: `${STORAGE_PREFIX}boards`,
  savedAds: `${STORAGE_PREFIX}saved-ads`,
} as const;

export type StorageKind = "local" | "session";

export function getStorage(kind: StorageKind = "local"): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    const s = kind === "local" ? window.localStorage : window.sessionStorage;
    return s ?? null;
  } catch {
    return null;
  }
}

export function readRaw(key: string, kind: StorageKind = "local"): string | null {
  try {
    return getStorage(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeRaw(key: string, value: string, kind: StorageKind = "local"): boolean {
  try {
    const s = getStorage(kind);
    if (!s) return false;
    s.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeRaw(key: string, kind: StorageKind = "local"): void {
  try {
    getStorage(kind)?.removeItem(key);
  } catch {
    /* storage blocked: nothing to remove */
  }
}

/** Parsed JSON, or `undefined` when absent / unreadable / invalid. */
export function readJSON<T>(key: string, validate: (v: unknown) => v is T, kind: StorageKind = "local"): T | undefined {
  const raw = readRaw(key, kind);
  if (raw == null) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    return validate(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function writeJSON(key: string, value: unknown, kind: StorageKind = "local"): boolean {
  try {
    return writeRaw(key, JSON.stringify(value), kind);
  } catch {
    return false;
  }
}

/* ── persistent external store ──────────────────────────────────────────── */

export interface PersistentStore<T> {
  get(): T;
  set(next: T | ((prev: T) => T)): void;
  subscribe(listener: () => void): () => void;
  /** Re-seed (demo reset) and persist. */
  reset(): void;
}

/**
 * Lazily initialised on first read: stored value when present + valid, else
 * `seed()` (written back only when the key is absent, so a user's empty list
 * is never re-seeded). State is replaced immutably, so snapshots are stable.
 */
export function createPersistentStore<T>(key: string, seed: () => T, validate: (v: unknown) => v is T): PersistentStore<T> {
  let value: T | undefined;
  let initialised = false;
  const listeners = new Set<() => void>();
  let storageListenerAttached = false;

  const init = () => {
    if (initialised) return;
    initialised = true;
    const stored = readJSON(key, validate);
    if (stored !== undefined) {
      value = stored;
      return;
    }
    value = seed();
    if (readRaw(key) == null) writeJSON(key, value);
  };

  const emit = () => listeners.forEach((l) => l());

  const onStorage = (e: StorageEvent) => {
    if (e.key !== key) return;
    const next = readJSON(key, validate);
    value = next !== undefined ? next : seed();
    emit();
  };

  return {
    get() {
      init();
      return value as T;
    },
    set(next) {
      init();
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(value as T) : next;
      if (Object.is(resolved, value)) return;
      value = resolved;
      writeJSON(key, value);
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      if (!storageListenerAttached) {
        try {
          if (typeof window !== "undefined") {
            window.addEventListener("storage", onStorage);
            storageListenerAttached = true;
          }
        } catch {
          /* no window events: single-tab only */
        }
      }
      return () => {
        listeners.delete(listener);
      };
    },
    reset() {
      initialised = true;
      value = seed();
      writeJSON(key, value);
      emit();
    },
  };
}

/** Memoise a derived value on the identity of its inputs (keeps useSyncExternalStore snapshots stable). */
export function memoOn<I extends unknown[], R>(fn: (...inputs: I) => R): (...inputs: I) => R {
  let lastInputs: I | null = null;
  let lastResult: R;
  return (...inputs: I) => {
    if (lastInputs && lastInputs.length === inputs.length && lastInputs.every((v, i) => Object.is(v, inputs[i]))) return lastResult;
    lastInputs = inputs;
    lastResult = fn(...inputs);
    return lastResult;
  };
}

export const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string");
