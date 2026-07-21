/**
 * Creative Report 2.0 — Folders > Boards (iter-2 P4, Foreplay-style).
 *
 * A Folder groups Boards. A Board is either:
 *  - manual: the user explicitly adds/removes creative ids, OR
 *  - smart (`ruleId` set): membership is a LIVE evaluation of the linked
 *    categorise-type automation rule against the current dataset — never
 *    stored, so it can't go stale. Manually-added ids still union in even
 *    on a smart board (Foreplay allows pinning alongside a saved query).
 *
 * localStorage-backed useSyncExternalStore, mirroring columns.ts/cardMetrics.ts.
 * Snapshot-stability note (a real bug found and fixed earlier in P3, see
 * columns.ts): getSnapshot() must NEVER construct a new array/object on every
 * call — this store caches its snapshot at module scope and only replaces it
 * inside persist(), after a real mutation.
 */
import { useSyncExternalStore } from "react";

export interface Folder {
  id: string;
  name: string;
}

export interface Board {
  id: string;
  folderId: string;
  name: string;
  /** Set when this board auto-files via a linked categorise rule. */
  ruleId?: string;
  /** Manually pinned creative ids — the only membership source for a
   *  non-smart board, and an "also include" underlay for a smart one. */
  manualCreativeIds: string[];
  createdAt: string;
}

interface StoreShape {
  folders: Folder[];
  boards: Board[];
}

const KEY = "creative-report-boards";

const DEFAULT_FOLDER: Folder = { id: "folder-general", name: "General" };
const DEFAULT_STATE: StoreShape = { folders: [DEFAULT_FOLDER], boards: [] };

function isValidFolder(f: unknown): f is Folder {
  return !!f && typeof f === "object" && typeof (f as Folder).id === "string" && typeof (f as Folder).name === "string";
}

function isValidBoard(b: unknown): b is Board {
  if (!b || typeof b !== "object") return false;
  const board = b as Board;
  return (
    typeof board.id === "string" &&
    typeof board.folderId === "string" &&
    typeof board.name === "string" &&
    Array.isArray(board.manualCreativeIds) &&
    board.manualCreativeIds.every((id) => typeof id === "string")
  );
}

/** Validate localStorage payloads defensively — corrupt/hand-edited JSON
 *  must degrade to the default state, never crash the Automations screen. */
function sanitize(raw: unknown): StoreShape {
  if (!raw || typeof raw !== "object") return DEFAULT_STATE;
  const { folders, boards } = raw as Partial<StoreShape>;
  const validFolders = Array.isArray(folders) ? folders.filter(isValidFolder) : [];
  const folderIds = new Set(validFolders.map((f) => f.id));
  const validBoards = Array.isArray(boards)
    ? boards.filter(isValidBoard).filter((b) => folderIds.has(b.folderId))
    : [];
  return {
    folders: validFolders.length > 0 ? validFolders : [DEFAULT_FOLDER],
    boards: validBoards,
  };
}

function readInitial(): StoreShape {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? sanitize(JSON.parse(raw)) : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

let state: StoreShape = readInitial();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(state));
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function snapshot(): StoreShape {
  return state;
}

let idCounter = 0;
function makeId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

export function createFolder(name: string): string {
  const id = makeId("folder");
  state = { ...state, folders: [...state.folders, { id, name: name.trim() || "Untitled folder" }] };
  persist();
  return id;
}

export function renameFolder(id: string, name: string) {
  state = {
    ...state,
    folders: state.folders.map((f) => (f.id === id ? { ...f, name: name.trim() || f.name } : f)),
  };
  persist();
}

/** Deletes the folder and every board inside it (boards don't outlive their folder). */
export function deleteFolder(id: string) {
  if (state.folders.length === 1) return; // always keep at least one folder
  state = {
    ...state,
    folders: state.folders.filter((f) => f.id !== id),
    boards: state.boards.filter((b) => b.folderId !== id),
  };
  persist();
}

export function createBoard(folderId: string, name: string, ruleId?: string): string {
  const id = makeId("board");
  const board: Board = {
    id,
    folderId,
    name: name.trim() || "Untitled board",
    ruleId,
    manualCreativeIds: [],
    createdAt: new Date().toISOString(),
  };
  state = { ...state, boards: [...state.boards, board] };
  persist();
  return id;
}

export function renameBoard(id: string, name: string) {
  state = { ...state, boards: state.boards.map((b) => (b.id === id ? { ...b, name: name.trim() || b.name } : b)) };
  persist();
}

export function deleteBoard(id: string) {
  state = { ...state, boards: state.boards.filter((b) => b.id !== id) };
  persist();
}

export function addCreativeToBoard(boardId: string, creativeId: string) {
  state = {
    ...state,
    boards: state.boards.map((b) =>
      b.id === boardId && !b.manualCreativeIds.includes(creativeId)
        ? { ...b, manualCreativeIds: [...b.manualCreativeIds, creativeId] }
        : b,
    ),
  };
  persist();
}

export function removeCreativeFromBoard(boardId: string, creativeId: string) {
  state = {
    ...state,
    boards: state.boards.map((b) =>
      b.id === boardId ? { ...b, manualCreativeIds: b.manualCreativeIds.filter((id) => id !== creativeId) } : b,
    ),
  };
  persist();
}

/** Non-hook lookup for imperative callers (the engine's runRule) — lets them
 *  verify a boardId still resolves instead of relying on addCreativeToBoard's
 *  silent no-op when the board was deleted. */
export function getBoardById(id: string): Board | undefined {
  return state.boards.find((b) => b.id === id);
}

export function useBoardsStore(): StoreShape {
  return useSyncExternalStore(subscribe, snapshot, () => DEFAULT_STATE);
}
