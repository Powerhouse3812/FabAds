/**
 * Catalogue write store — session-only overlay for the 11 Creative asset
 * types (§9 "Actions on every asset": edit / delete / duplicate / Archive
 * §21.2 / manually add or upload).
 *
 * Same `useSyncExternalStore` module-level pattern as
 * `src/lib/ad-entity-write-store.ts` (Reports). In-memory, resets on
 * reload — deliberately: this is a prototype surface, not a real backend,
 * and the reset is DISCLOSED in the UI rather than left for the user to
 * discover (see `SessionScopeNote` in `AssetGrid.tsx`).
 *
 * Business assets (Brands / Products / Categories) are NOT written here —
 * they keep their existing `Add{Brand,Product,Category}Modal` flow
 * untouched (per Genie 2.0 build brief: "leave those types' behaviour
 * alone if wiring them is risky"). Everything below is generic across the
 * 11 Creative types; the type-specific shaping (what a "duplicate" or a
 * freshly "added" row looks like) lives in `assetTypes.ts`'s registry,
 * which calls into this store only through the generic `id`-keyed API.
 */
import { useSyncExternalStore } from "react";
import type { CatalogueType } from "./assetTypes";

export interface CatalogueOverride {
  archived?: boolean;
  bookmarked?: boolean;
  deleted?: boolean;
  /** Set by the generic Edit modal (name/tags-only rename — §9 "Edit"). */
  nameOverride?: string;
  tagsOverride?: string[];
  updatedAt?: number;
}

interface AddedRecord {
  id: string;
  type: CatalogueType;
  createdAt: number;
  data: unknown;
}

interface FabricatedRecord {
  id: string;
  type: CatalogueType;
  sourceId: string;
  createdAt: number;
  data: unknown;
}

interface CatalogueWriteState {
  version: number;
  overrides: Record<string, CatalogueOverride>;
  added: Record<string, AddedRecord>;
  fabricated: Record<string, FabricatedRecord>;
}

const EMPTY: CatalogueWriteState = {
  version: 0,
  overrides: {},
  added: {},
  fabricated: {},
};

let state: CatalogueWriteState = EMPTY;
const listeners = new Set<() => void>();

function commit(next: Omit<CatalogueWriteState, "version">) {
  state = { ...next, version: state.version + 1 };
  for (const l of listeners) l();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): CatalogueWriteState {
  return state;
}

/** Composite key — one override map shared across all 14 types. */
export function writeKey(type: CatalogueType, id: string): string {
  return `${type}:${id}`;
}

function overrideFor(type: CatalogueType, id: string): CatalogueOverride | undefined {
  return state.overrides[writeKey(type, id)];
}

function patchOverride(type: CatalogueType, id: string, patch: Partial<CatalogueOverride>) {
  const key = writeKey(type, id);
  commit({
    overrides: {
      ...state.overrides,
      [key]: { ...state.overrides[key], ...patch, updatedAt: Date.now() },
    },
    added: state.added,
    fabricated: state.fabricated,
  });
}

export function archiveAsset(type: CatalogueType, id: string, archived = true) {
  patchOverride(type, id, { archived });
}

export function deleteAsset(type: CatalogueType, id: string) {
  patchOverride(type, id, { deleted: true });
}

export function toggleBookmark(type: CatalogueType, id: string, next?: boolean) {
  const current = overrideFor(type, id)?.bookmarked ?? false;
  patchOverride(type, id, { bookmarked: next ?? !current });
}

export function renameAsset(type: CatalogueType, id: string, name: string, tags?: string[]) {
  patchOverride(type, id, {
    nameOverride: name,
    ...(tags ? { tagsOverride: tags } : {}),
  });
}

/** Appends a brand-new client-created row. `data` must already be a fully
 *  valid, typed asset (built by the registry's `buildAdded`), including id. */
export function addAsset<T extends { id: string }>(type: CatalogueType, data: T): void {
  const key = writeKey(type, data.id);
  commit({
    overrides: state.overrides,
    added: { ...state.added, [key]: { id: data.id, type, createdAt: Date.now(), data } },
    fabricated: state.fabricated,
  });
}

/** Appends a duplicate row. `data` is the already-cloned + renamed asset
 *  (built by the registry's generic duplicate helper), including its new id. */
export function duplicateAsset<T extends { id: string }>(
  type: CatalogueType,
  sourceId: string,
  data: T,
): void {
  const key = writeKey(type, data.id);
  commit({
    overrides: state.overrides,
    added: state.added,
    fabricated: {
      ...state.fabricated,
      [key]: { id: data.id, type, sourceId, createdAt: Date.now(), data },
    },
  });
}

export function resetCatalogueWrites(): void {
  commit({ overrides: {}, added: {}, fabricated: {} });
}

/* ─────────────────────────── hooks + read helpers ─────────────────────────── */

export function useCatalogueWrites(): CatalogueWriteState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useAssetOverride(type: CatalogueType, id: string): CatalogueOverride | undefined {
  const snap = useCatalogueWrites();
  return snap.overrides[writeKey(type, id)];
}

/** Non-hook read for use inside a registry `resolve()` call — safe because
 *  the calling component subscribes via `useCatalogueWrites()` itself and
 *  re-renders (which re-invokes `resolve()`) on every write. */
export function getWriteSnapshot(): CatalogueWriteState {
  return state;
}

export function addedForType<T>(type: CatalogueType): T[] {
  return Object.values(state.added)
    .filter((a) => a.type === type)
    .map((a) => a.data as T);
}

export function fabricatedForType<T>(type: CatalogueType): T[] {
  return Object.values(state.fabricated)
    .filter((f) => f.type === type)
    .map((f) => f.data as T);
}

export function hasAnyCatalogueWrites(): boolean {
  return (
    Object.keys(state.overrides).length > 0 ||
    Object.keys(state.added).length > 0 ||
    Object.keys(state.fabricated).length > 0
  );
}
