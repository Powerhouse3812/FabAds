/**
 * Boards (any SavableType, Q9/Q10) + Saved Ads (ads only).
 * localStorage-backed; swappable for a remote adapter later.
 */
import { useSyncExternalStore } from "react";
import type { Board, BoardItem, BoardItemSnapshot, SavedItemRef } from "../types";
import { snapshotFor } from "../selectors";
import { seedBoards, seedSavedAds } from "./seed";
import type { SavedAdEntry } from "./seed";
import { STORAGE_KEYS, createPersistentStore, memoOn } from "./storage";

export const MAX_PINNED_BOARDS = 5;

const isRef = (v: unknown): v is SavedItemRef =>
  !!v && typeof v === "object" && typeof (v as SavedItemRef).type === "string" && typeof (v as SavedItemRef).id === "string";

const isBoards = (v: unknown): v is Board[] =>
  Array.isArray(v) &&
  v.every(
    (b) =>
      b && typeof b === "object" && typeof b.id === "string" && typeof b.name === "string" && Array.isArray(b.items) &&
      (b.items as unknown[]).every((i) => !!i && typeof i === "object" && isRef((i as BoardItem).ref)),
  );

const isSavedAds = (v: unknown): v is SavedAdEntry[] =>
  Array.isArray(v) && v.every((e) => e && typeof e === "object" && typeof e.adId === "string" && typeof e.savedAt === "string");

export const boardsStore = createPersistentStore<Board[]>(STORAGE_KEYS.boards, () => seedBoards(), isBoards);
export const savedAdsStore = createPersistentStore<SavedAdEntry[]>(STORAGE_KEYS.savedAds, () => seedSavedAds(), isSavedAds);

const sameRef = (a: SavedItemRef, b: SavedItemRef) => a.type === b.type && a.id === b.id;
const nowIso = () => new Date().toISOString();

function newId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return `board-${crypto.randomUUID()}`;
  } catch {
    /* fall through */
  }
  return `board-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ── boards: reads ──────────────────────────────────────────────────────── */

export const listBoards = (): Board[] => boardsStore.get();
export const getBoard = (id: string): Board | undefined => boardsStore.get().find((b) => b.id === id);
export const boardsContaining = (ref: SavedItemRef): Board[] => boardsStore.get().filter((b) => b.items.some((i) => sameRef(i.ref, ref)));
export const boardCountForItem = (ref: SavedItemRef): number => boardsContaining(ref).length;
export const isSavedAnywhere = (ref: SavedItemRef): boolean => boardCountForItem(ref) > 0;
export const isInBoard = (boardId: string, ref: SavedItemRef): boolean => !!getBoard(boardId)?.items.some((i) => sameRef(i.ref, ref));

/* ── boards: writes ─────────────────────────────────────────────────────── */

export function createBoard(name: string, opts: { description?: string; pinned?: boolean } = {}): Board {
  const pinnedCount = boardsStore.get().filter((b) => b.pinned).length;
  const ts = nowIso();
  const board: Board = {
    id: newId(),
    name: name.trim() || "Untitled board",
    ...(opts.description ? { description: opts.description } : {}),
    pinned: !!opts.pinned && pinnedCount < MAX_PINNED_BOARDS,
    createdAt: ts,
    updatedAt: ts,
    items: [],
  };
  boardsStore.set((list) => [board, ...list]);
  return board;
}

export function renameBoard(id: string, name: string, description?: string): void {
  boardsStore.set((list) =>
    list.map((b) =>
      b.id === id
        ? { ...b, name: name.trim() || b.name, ...(description !== undefined ? { description } : {}), updatedAt: nowIso() }
        : b,
    ),
  );
}

export function deleteBoard(id: string): void {
  boardsStore.set((list) => list.filter((b) => b.id !== id));
}

/**
 * Add any savable item. Snapshot defaults to one built from the data layer.
 * Returns false when the board doesn't exist or already holds the item.
 */
export function addToBoard(boardId: string, ref: SavedItemRef, snapshot?: BoardItemSnapshot, note?: string): boolean {
  const board = getBoard(boardId);
  if (!board || board.items.some((i) => sameRef(i.ref, ref))) return false;
  const item: BoardItem = {
    ref: { type: ref.type, id: ref.id },
    addedAt: nowIso(),
    snapshot: snapshot ?? snapshotFor(ref) ?? { title: ref.id },
    ...(note ? { note } : {}),
  };
  boardsStore.set((list) => list.map((b) => (b.id === boardId ? { ...b, items: [item, ...b.items], updatedAt: item.addedAt } : b)));
  return true;
}

export function removeFromBoard(boardId: string, ref: SavedItemRef): void {
  boardsStore.set((list) =>
    list.map((b) => (b.id === boardId ? { ...b, items: b.items.filter((i) => !sameRef(i.ref, ref)), updatedAt: nowIso() } : b)),
  );
}

/** Toggle an item in a board (the save modal's checkbox). Returns true when now in the board. */
export function toggleInBoard(boardId: string, ref: SavedItemRef, snapshot?: BoardItemSnapshot): boolean {
  if (isInBoard(boardId, ref)) {
    removeFromBoard(boardId, ref);
    return false;
  }
  return addToBoard(boardId, ref, snapshot);
}

export function updateBoardItemNote(boardId: string, ref: SavedItemRef, note: string): void {
  boardsStore.set((list) =>
    list.map((b) =>
      b.id === boardId
        ? { ...b, items: b.items.map((i) => (sameRef(i.ref, ref) ? { ...i, note: note || undefined } : i)), updatedAt: nowIso() }
        : b,
    ),
  );
}

export type TogglePinResult = { ok: true; pinned: boolean } | { ok: false; reason: "limit" | "not-found" };

/** Pin / unpin. Pinning past MAX_PINNED_BOARDS is refused with reason "limit". */
export function togglePin(boardId: string): TogglePinResult {
  const board = getBoard(boardId);
  if (!board) return { ok: false, reason: "not-found" };
  if (!board.pinned && boardsStore.get().filter((b) => b.pinned).length >= MAX_PINNED_BOARDS) return { ok: false, reason: "limit" };
  boardsStore.set((list) => list.map((b) => (b.id === boardId ? { ...b, pinned: !b.pinned, updatedAt: nowIso() } : b)));
  return { ok: true, pinned: !board.pinned };
}

/* ── boards: hooks ──────────────────────────────────────────────────────── */

export function useBoards(): Board[] {
  return useSyncExternalStore(boardsStore.subscribe, boardsStore.get, boardsStore.get);
}

const pinnedOf = memoOn((list: Board[]) => list.filter((b) => b.pinned));
export function usePinnedBoards(): Board[] {
  const get = () => pinnedOf(boardsStore.get());
  return useSyncExternalStore(boardsStore.subscribe, get, get);
}

export function useBoard(id: string): Board | undefined {
  const get = () => boardsStore.get().find((b) => b.id === id);
  return useSyncExternalStore(boardsStore.subscribe, get, get);
}

export function useBoardCountForItem(ref: SavedItemRef): number {
  const get = () => boardCountForItem(ref);
  return useSyncExternalStore(boardsStore.subscribe, get, get);
}

export function useIsSavedAnywhere(ref: SavedItemRef): boolean {
  const get = () => isSavedAnywhere(ref);
  return useSyncExternalStore(boardsStore.subscribe, get, get);
}

/* ── saved ads (ads only) ───────────────────────────────────────────────── */

export const getSavedAds = (): SavedAdEntry[] => savedAdsStore.get();
export const isAdSaved = (adId: string): boolean => savedAdsStore.get().some((e) => e.adId === adId);

export function saveAd(adId: string): void {
  if (isAdSaved(adId)) return;
  savedAdsStore.set((list) => [{ adId, savedAt: nowIso() }, ...list]);
}
export function unsaveAd(adId: string): void {
  savedAdsStore.set((list) => list.filter((e) => e.adId !== adId));
}
/** Returns true when the ad is now saved. */
export function toggleSavedAd(adId: string): boolean {
  if (isAdSaved(adId)) {
    unsaveAd(adId);
    return false;
  }
  saveAd(adId);
  return true;
}

export function useSavedAds(): SavedAdEntry[] {
  return useSyncExternalStore(savedAdsStore.subscribe, savedAdsStore.get, savedAdsStore.get);
}

const idsOf = memoOn((list: SavedAdEntry[]) => list.map((e) => e.adId));
export function useSavedAdIds(): string[] {
  const get = () => idsOf(savedAdsStore.get());
  return useSyncExternalStore(savedAdsStore.subscribe, get, get);
}
export function useIsAdSaved(adId: string): boolean {
  const get = () => isAdSaved(adId);
  return useSyncExternalStore(savedAdsStore.subscribe, get, get);
}
