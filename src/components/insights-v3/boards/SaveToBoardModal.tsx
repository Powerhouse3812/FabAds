/**
 * SaveToBoardModal: reads `useSaveModal()` (`?modal=save&target=<type>:<id>`) and
 * saves ANY SavableType to boards. Ads also get a "Saved Ads" toggle, because the
 * Saved Ads page lists ads only.
 *
 * Mounted once by InsightsOverlayHost. Explicit Done / X / Esc only: outside
 * clicks never close it. Stacks above the ad drawer because it portals later (same z-50, later in the DOM).
 */
import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, Plus, X } from "lucide-react";
import { TYPE_ICON } from "@/components/insights-v3/shared/typeMeta";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { snapshotFor } from "@/lib/insights-v3/selectors";
import {
  addToBoard,
  createBoard,
  toggleInBoard,
  toggleSavedAd,
  useBoards,
  useIsAdSaved,
} from "@/lib/insights-v3/stores";
import { SAVABLE_LABEL, type SavedItemRef } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";
import { TruncatedText, TypeChip, fmtInt, useSaveModal } from "@/components/insights-v3/shared";
import { BOARD_NAME_MAX } from "./BoardFormDialog";

function Row({
  checked,
  onToggle,
  title,
  meta,
  badge,
}: {
  checked: boolean;
  onToggle: () => void;
  title: string;
  meta: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        checked ? "border-primary/40 bg-primary/10" : "border-border bg-card hover:border-primary/30 hover:bg-primary/5",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-transparent",
        )}
      >
        <Check className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <TruncatedText text={title} className="text-sm font-medium text-foreground" focusable={false} />
        <span className="block text-xs text-muted-foreground">{meta}</span>
      </span>
      {badge && (
        <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary-text">
          {badge}
        </span>
      )}
    </button>
  );
}

function SaveDialog({ target, onClose }: { target: SavedItemRef; onClose: () => void }) {
  const boards = useBoards();
  const adSaved = useIsAdSaved(target.type === "ad" ? target.id : "");
  const snapshot = snapshotFor(target);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const label = SAVABLE_LABEL[target.type];

  const isIn = (boardId: string) =>
    !!boards.find((b) => b.id === boardId)?.items.some((i) => i.ref.type === target.type && i.ref.id === target.id);

  const onToggleBoard = (boardId: string, name: string) => {
    const nowIn = toggleInBoard(boardId, target, snapshot ?? undefined);
    toast.success(nowIn ? `Saved to “${name}”` : `Removed from “${name}”`);
  };

  const onToggleSavedAds = () => {
    const nowSaved = toggleSavedAd(target.id);
    toast.success(nowSaved ? "Saved to Saved Ads" : "Removed from Saved Ads");
  };

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const board = createBoard(name);
    addToBoard(board.id, target, snapshot ?? undefined);
    toast.success(`Created “${board.name}” and saved this ${label.toLowerCase()} to it`);
    setNewName("");
    setCreating(false);
  };

  const savedCount = boards.filter((b) => b.items.some((i) => i.ref.type === target.type && i.ref.id === target.id)).length;

  return (
    <DialogPrimitive.Root open onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          // Standing rule: never dismiss on outside click.
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[min(640px,calc(100dvh-32px))] w-[calc(100vw-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-border bg-background shadow-2xl outline-none"
        >
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div className="min-w-0">
              <DialogPrimitive.Title className="text-base font-semibold text-foreground">Save to board</DialogPrimitive.Title>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {savedCount > 0
                  ? `On ${fmtInt(savedCount)} ${savedCount === 1 ? "board" : "boards"}. Tick or untick to change.`
                  : `Pick the boards that should hold this ${label.toLowerCase()}.`}
              </p>
            </div>
            <DialogPrimitive.Close
              aria-label="Close"
              className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </DialogPrimitive.Close>
          </header>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {/* What is being saved */}
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-2.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground">
                {snapshot?.thumbnailUrl ? (
                  <img src={snapshot.thumbnailUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  (() => {
                    const Icon = TYPE_ICON[target.type];
                    return <Icon className="h-5 w-5 text-primary-text" aria-hidden="true" />;
                  })()
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <TypeChip type={target.type} />
                <TruncatedText text={snapshot?.title ?? target.id} className="text-sm font-medium text-foreground" />
                {snapshot?.subtitle ? (
                  <TruncatedText text={snapshot.subtitle} className="text-xs text-muted-foreground" />
                ) : (
                  <p className="text-xs italic text-muted-foreground">No preview available for this {label.toLowerCase()}.</p>
                )}
              </div>
            </div>

            {target.type === "ad" && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold text-foreground">Saved Ads</h3>
                <Row
                  checked={adSaved}
                  onToggle={onToggleSavedAds}
                  title="Saved Ads"
                  meta="Quick list of ads only, no board needed"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold text-foreground">
                Boards <span className="font-mono font-normal tabular-nums text-muted-foreground">{fmtInt(boards.length)}</span>
              </h3>
              {boards.length === 0 && (
                <p className="rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-3 text-xs text-muted-foreground">
                  No boards yet. Create one below and this {label.toLowerCase()} goes straight into it.
                </p>
              )}
              <div className="space-y-1.5">
                {boards.map((b) => (
                  <Row
                    key={b.id}
                    checked={isIn(b.id)}
                    onToggle={() => onToggleBoard(b.id, b.name)}
                    title={b.name}
                    meta={`${fmtInt(b.items.length)} ${b.items.length === 1 ? "item" : "items"}`}
                    badge={b.pinned ? "Pinned" : undefined}
                  />
                ))}
              </div>
            </div>

            {creating ? (
              <form onSubmit={onCreate} className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <label htmlFor="save-new-board" className="text-xs font-medium text-foreground">
                  New board name
                </label>
                <Input
                  id="save-new-board"
                  autoFocus
                  value={newName}
                  maxLength={BOARD_NAME_MAX}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Hooks to test next week"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCreating(false);
                      setNewName("");
                    }}
                    className="h-8 rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newName.trim()}
                    className="h-8 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Create and save
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-primary/40 bg-primary/5 text-sm font-medium text-primary-text hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                New board
              </button>
            )}
          </div>

          <footer className="flex shrink-0 justify-end border-t border-border px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Done
            </button>
          </footer>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function SaveToBoardModal() {
  const { target, close } = useSaveModal();
  if (!target) return null;
  return <SaveDialog key={`${target.type}:${target.id}`} target={target} onClose={close} />;
}
