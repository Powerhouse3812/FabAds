import { useMemo, useState, useSyncExternalStore } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, FolderOpen, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { LIBRARY_FOLDERS, LIBRARY_BRANDS, LIBRARY_MEDIA } from "@/mocks/shared/library-items";
import type { OutputData } from "../types/output";

/**
 * GenieAddToFolderModal — §8.6: "Generated output also gets an 'Add to
 * folder' action with a folder picker. The folder-to-launch handoff belongs
 * to the Launch module, not Genie."
 *
 * WHY THIS FILE EXISTS INSTEAD OF REUSING AN EXISTING PICKER DIRECTLY:
 * Creative Library already has two real folder pickers —
 * `src/components/creative-library/MoveToFolderModal.tsx` (+ its
 * `useClFolders`/`useAddToFolder` hooks, writing to the real Supabase
 * `cl_folders`/`cl_folder_items` tables) and
 * `src/launchv2/screens/steps/spread/modals/FolderPicker.tsx` (a one-shot
 * "apply this folder's media+copy to a launch plan" picker, wrong shape for
 * "file this output away"). Neither can honestly take a Genie `OutputData`:
 *   - Wiring into `cl_folder_items` would look real but wouldn't actually
 *     show anywhere — `FolderContentsView.tsx` renders a folder's media by
 *     intersecting membership with `useCreativeAssets()`, which only knows
 *     about real Creative Library asset rows. A Genie output's id would
 *     never match, so the folder would silently look untouched when opened
 *     in Creative Library — exactly the silent no-op §8.6 wiring must not
 *     ship. Fixing that requires editing `FolderContentsView.tsx` /
 *     `use-creative-assets.ts`, which this agent does not own.
 *   - It would also be Genie's first real-Supabase dependency (everything
 *     else in `src/genie6/**` is mock/local-store, per project memory
 *     "prototype minimum" — no DB unless asked).
 *
 * WHAT THIS FILE ACTUALLY REUSES: the real folder *catalogue* —
 * `LIBRARY_FOLDERS` / `LIBRARY_BRANDS` from
 * `src/mocks/shared/library-items.ts`, the same "single source of truth for
 * Library items" the launchv2 `FolderPicker` already reads from, whose own
 * header comment invites exactly this: "when Genie / Insights / Reports
 * wire to mock data, they should pull from THIS module so the workspace
 * feels coherent." So the folders + brand names shown here are the SAME
 * real folders (Mamaearth, boAt, Sleepyhead, …) a user sees in Creative
 * Library — not invented ones.
 *
 * WHAT'S LOCAL: membership (which output is in which folder) lives in the
 * in-memory store below, same `useSyncExternalStore` pattern as
 * `src/lib/ad-entity-write-store.ts` and this directory's own
 * `libraryActionsStore.ts` — optimistic, resets on reload, disclosed in the
 * modal copy. This keeps the action honestly observable INSIDE Genie
 * (reopen the picker on the same output → its folder is checked, "Remove"
 * is offered) without pretending to write into Creative Library's real
 * folder system, which it structurally cannot do from these two files
 * alone.
 */

// ─── Membership store ───────────────────────────────────────────────────────

type MembershipState = Record<string /* outputId */, Set<string> /* folderIds */>;

const membershipState: MembershipState = {};
const listeners = new Set<() => void>();
function emit() {
  for (const l of listeners) l();
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

let snapshot: MembershipState = membershipState;
function commit() {
  snapshot = { ...membershipState };
  emit();
}

const EMPTY_SET: Set<string> = new Set();

function getSnapshot(): MembershipState {
  return snapshot;
}

export function addOutputToFolder(outputId: string, folderId: string) {
  const next = new Set(membershipState[outputId] ?? []);
  next.add(folderId);
  membershipState[outputId] = next;
  commit();
}

export function removeOutputFromFolder(outputId: string, folderId: string) {
  const next = new Set(membershipState[outputId] ?? []);
  next.delete(folderId);
  membershipState[outputId] = next;
  commit();
}

/** Reactive read of the folder ids one output currently belongs to (session-local). */
export function useOutputFolderIds(outputId: string | null): Set<string> {
  const s = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  if (!outputId) return EMPTY_SET;
  return s[outputId] ?? EMPTY_SET;
}

// ─── Folder catalogue (real names, shared mock pool) ────────────────────────

interface GenieFolderOption {
  id: string;
  name: string;
  brandId: string;
  brandName: string;
  itemCount: number;
}

const BRAND_NAME_BY_ID = new Map(LIBRARY_BRANDS.map((b) => [b.id, b.name]));

const ITEM_COUNT_BY_FOLDER = (() => {
  const counts = new Map<string, number>();
  for (const m of LIBRARY_MEDIA) {
    if (!m.folder_id) continue;
    counts.set(m.folder_id, (counts.get(m.folder_id) ?? 0) + 1);
  }
  return counts;
})();

const GENIE_FOLDER_OPTIONS: GenieFolderOption[] = LIBRARY_FOLDERS.map((f) => ({
  id: f.id,
  name: f.name.replace(/\b\w/g, (c) => c.toUpperCase()),
  brandId: f.brand_id,
  brandName: BRAND_NAME_BY_ID.get(f.brand_id) ?? f.brand_id,
  itemCount: ITEM_COUNT_BY_FOLDER.get(f.id) ?? 0,
}));

/** Best-effort match of an output's display brand name to the shared brand list. */
function matchBrandId(output: OutputData | null): string | null {
  const name = output?.brand?.name?.trim().toLowerCase();
  if (!name) return null;
  const hit = LIBRARY_BRANDS.find((b) => b.name.trim().toLowerCase() === name);
  return hit?.id ?? null;
}

// ─── Modal ───────────────────────────────────────────────────────────────────

export interface GenieAddToFolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  output: OutputData | null;
  /** Fired right before the dialog closes on a successful add/remove. */
  onChanged?: (action: "added" | "removed", folderLabel: string) => void;
}

export function GenieAddToFolderModal({ open, onOpenChange, output, onChanged }: GenieAddToFolderModalProps) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const ownBrandId = useMemo(() => matchBrandId(output), [output]);
  const memberIds = useOutputFolderIds(output?.id ?? null);

  const options = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? GENIE_FOLDER_OPTIONS.filter(
          (f) => f.name.toLowerCase().includes(q) || f.brandName.toLowerCase().includes(q),
        )
      : GENIE_FOLDER_OPTIONS;
    return [...filtered].sort((a, b) => {
      if (a.brandId === ownBrandId && b.brandId !== ownBrandId) return -1;
      if (b.brandId === ownBrandId && a.brandId !== ownBrandId) return 1;
      return a.brandName.localeCompare(b.brandName) || a.name.localeCompare(b.name);
    });
  }, [search, ownBrandId]);

  const selected = options.find((f) => f.id === selectedId) ?? null;
  const alreadyMember = selected ? memberIds.has(selected.id) : false;

  const handleClose = (o: boolean) => {
    onOpenChange(o);
    if (!o) {
      setSearch("");
      setSelectedId(null);
    }
  };

  const handleConfirm = () => {
    if (!output || !selected) return;
    const label = `${selected.brandName} — ${selected.name}`;
    if (alreadyMember) {
      removeOutputFromFolder(output.id, selected.id);
      onChanged?.("removed", label);
    } else {
      addOutputToFolder(output.id, selected.id);
      onChanged?.("added", label);
    }
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="g6-root rounded-2xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add to folder</DialogTitle>
        </DialogHeader>

        <p className="-mt-2 font-g6-sans text-[11px] leading-relaxed text-g6-text-secondary">
          Folders from your Creative Library workspace. Adding here is tracked in
          Genie for this session — it doesn't yet write back into Creative
          Library's own folder view.
        </p>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-g6-text-secondary" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search folders…"
            className="h-8 rounded-[28px] pl-8 text-xs"
          />
        </div>

        <div className="max-h-[260px] space-y-0.5 overflow-y-auto pr-1">
          {options.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-8 text-center">
              <FolderOpen className="h-5 w-5 text-g6-text-secondary/50" />
              <p className="font-g6-mono text-[11px] uppercase tracking-wide text-g6-text-secondary">
                No folders match "{search}"
              </p>
            </div>
          ) : (
            options.map((f) => {
              const isMember = memberIds.has(f.id);
              const isSelected = selectedId === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedId(f.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-colors",
                    isSelected
                      ? "bg-primary/10 font-medium text-primary-text"
                      : "text-g6-text hover:bg-g6-bg-spotlight",
                  )}
                >
                  <FolderOpen className="h-3.5 w-3.5 shrink-0 text-g6-text-secondary" />
                  <span className="min-w-0 flex-1 truncate">
                    {f.brandName} <span className="text-g6-text-secondary">— {f.name}</span>
                  </span>
                  <span className="shrink-0 font-g6-mono text-[10px] tabular-nums text-g6-text-secondary">
                    {f.itemCount}
                  </span>
                  {isMember && <Check className="h-3.5 w-3.5 shrink-0 text-primary-text" />}
                </button>
              );
            })
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-full border border-border px-4 text-sm font-medium transition-colors hover:bg-muted/40"
            >
              Cancel
            </button>
          </DialogClose>
          <button
            type="button"
            disabled={!selected}
            onClick={handleConfirm}
            className={cn(
              "inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40",
              alreadyMember
                ? "bg-muted text-foreground hover:bg-muted/80"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            {alreadyMember ? "Remove from folder" : "Add to folder"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
