/**
 * Launch v2 — Creative bundles service (localStorage-backed mock).
 *
 * A "creative bundle" = a Creative Library folder (already wired today for
 * media) PLUS an optional `defaultCopy: AdCopyBundle`. The canonical folder
 * type (`ClFolder` in `src/hooks/use-cl-folders.ts`) is Supabase-backed and
 * not editable in v1, so `defaultCopy` is stored separately here, keyed by
 * folder id. When this graduates to Supabase, the API surface stays the same.
 *
 * Storage key: `fabads:launchv2:bundles:v1`
 * Shape: { [folderId]: AdCopyBundle }
 */

import type {
  AdCopyBundle,
  CreativeBundleFolder,
  CreativeBundleStatus,
} from "./types";

const STORAGE_KEY = "fabads:launchv2:bundles:v1";

type BundleStore = Record<string, AdCopyBundle>;

function readStore(): BundleStore {
  try {
    const raw =
      typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as BundleStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: BundleStore): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore quota / privacy errors */
  }
}

/** Derive status from media count + presence of defaultCopy. Pure / read-only. */
export function deriveBundleStatus(
  mediaCount: number,
  defaultCopy: AdCopyBundle | null | undefined,
): CreativeBundleStatus {
  const hasCopy = !!defaultCopy && defaultCopy.primaryText.trim().length > 0;
  if (mediaCount === 0 && !hasCopy) return "empty";
  if (mediaCount > 0 && hasCopy) return "bundle_ready";
  return "media_only";
}

export const bundlesService = {
  /** Read the bundle copy for one folder (null if not graduated). */
  getDefaultCopy(folderId: string): AdCopyBundle | null {
    const store = readStore();
    return store[folderId] ?? null;
  },

  /** Save copy as this folder's bundle (graduates media_only → bundle_ready). */
  setDefaultCopy(folderId: string, copy: AdCopyBundle): void {
    const store = readStore();
    store[folderId] = { ...copy };
    writeStore(store);
  },

  /** Strip the bundle copy from a folder (downgrades bundle_ready → media_only). */
  removeDefaultCopy(folderId: string): void {
    const store = readStore();
    if (folderId in store) {
      delete store[folderId];
      writeStore(store);
    }
  },

  /** Convenience: derive status for one folder given its media count. */
  getStatus(folderId: string, mediaCount: number): CreativeBundleStatus {
    return deriveBundleStatus(mediaCount, this.getDefaultCopy(folderId));
  },

  /**
   * Build a `CreativeBundleFolder` view-model from inputs the picker already has.
   * Pass folder id, name, and current media count; bundle data is read from store.
   */
  toBundleFolder(input: {
    id: string;
    name: string;
    mediaCount: number;
  }): CreativeBundleFolder {
    const defaultCopy = this.getDefaultCopy(input.id);
    return {
      id: input.id,
      name: input.name,
      mediaCount: input.mediaCount,
      defaultCopy,
      status: deriveBundleStatus(input.mediaCount, defaultCopy),
    };
  },

  /** Test hook — wipe the store (no production caller). */
  _reset(): void {
    writeStore({});
  },
};
