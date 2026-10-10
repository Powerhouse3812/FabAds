/**
 * BoardItemCard: one saved item inside a board.
 *  - ads render as the shared AdCard (opens the ad drawer),
 *  - every other type renders as an element card: type chip + snapshot + note
 *    + Download + Remove, and opens the overlay it was saved from.
 * Notes are editable on every type. Remove offers an Undo toast.
 */
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { getAd } from "@/lib/insights-v3/data";
import { buildDownloads, detailTargetFor, snapshotFor } from "@/lib/insights-v3/selectors";
import { addToBoard, removeFromBoard, updateBoardItemNote } from "@/lib/insights-v3/stores";
import type { BoardItem } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";
import { AdCard } from "@/components/insights-v3/ad-card/AdCard";
import {
  DownloadButton,
  Hint,
  TruncatedText,
  TypeChip,
  useAdDrawer,
  useDetailStack,
} from "@/components/insights-v3/shared";
import { relativeTime } from "./boardUtils";

const NOTE_MAX = 280;

function NoteRow({ boardId, item }: { boardId: string; item: BoardItem }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.note ?? "");

  const start = () => {
    setDraft(item.note ?? "");
    setEditing(true);
  };
  const save = () => {
    updateBoardItemNote(boardId, item.ref, draft.trim());
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="space-y-1.5">
        <label className="sr-only" htmlFor={`note-${item.ref.type}-${item.ref.id}`}>
          Note
        </label>
        <Textarea
          id={`note-${item.ref.type}-${item.ref.id}`}
          autoFocus
          value={draft}
          rows={2}
          maxLength={NOTE_MAX}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              setEditing(false);
            } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              save();
            }
          }}
          placeholder="Why did you save this?"
          className="min-h-0 text-xs"
        />
        <div className="flex items-center justify-end gap-1.5">
          <span className="mr-auto font-mono text-[10px] tabular-nums text-muted-foreground">
            {draft.length}/{NOTE_MAX}
          </span>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="h-7 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            className="h-7 rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Save note
          </button>
        </div>
      </div>
    );
  }

  if (!item.note) {
    return (
      <button
        type="button"
        onClick={start}
        className="inline-flex items-center gap-1 self-start rounded-md px-1 py-0.5 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Pencil className="h-3 w-3" aria-hidden="true" />
        Add a note
      </button>
    );
  }

  return (
    <div className="flex items-start gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-2 py-1.5">
      <p className="min-w-0 flex-1 break-words text-xs leading-4 text-foreground">{item.note}</p>
      <Hint content="Edit note">
        <button
          type="button"
          onClick={start}
          aria-label="Edit note"
          className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Pencil className="h-3 w-3" aria-hidden="true" />
        </button>
      </Hint>
    </div>
  );
}

function RemoveButton({ boardId, item }: { boardId: string; item: BoardItem }) {
  const onRemove = () => {
    removeFromBoard(boardId, item.ref);
    toast(`Removed “${item.snapshot.title}” from this board`, {
      action: { label: "Undo", onClick: () => addToBoard(boardId, item.ref, item.snapshot, item.note) },
    });
  };
  return (
    <Hint content="Remove from this board">
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${item.snapshot.title} from this board`}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-error-text/40 hover:bg-error-text/10 hover:text-error-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        Remove
      </button>
    </Hint>
  );
}

export function BoardItemCard({ boardId, item }: { boardId: string; item: BoardItem }) {
  const drawer = useAdDrawer();
  const detail = useDetailStack();
  const { ref } = item;

  const live = snapshotFor(ref) !== null;
  const ad = ref.type === "ad" ? getAd(ref.id) : undefined;

  const open = () => {
    const t = detailTargetFor(ref);
    if (t.kind === "ad") drawer.open(t.id);
    else detail.push(t);
  };

  if (ad) {
    return (
      <div className="flex min-w-0 flex-col gap-2">
        <AdCard ad={ad} onOpen={drawer.open} />
        <NoteRow boardId={boardId} item={item} />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground">Saved {relativeTime(item.addedAt)}</span>
          <RemoveButton boardId={boardId} item={item} />
        </div>
      </div>
    );
  }

  const snap = live ? snapshotFor(ref)! : item.snapshot;

  return (
    <article className="flex min-w-0 flex-col gap-2.5 rounded-xl border border-border bg-card p-3 shadow-sm transition-colors hover:border-primary/40">
      <div className="flex items-start gap-3">
        {snap.thumbnailUrl && (
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
            <img src={snap.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <TypeChip type={ref.type} />
          <button
            type="button"
            onClick={open}
            disabled={!live}
            aria-label={live ? `Open ${snap.title}` : `${snap.title} is no longer available`}
            className={cn(
              "block w-full rounded-sm text-left text-sm font-semibold leading-5 text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              live ? "hover:text-primary-text" : "cursor-not-allowed opacity-70",
            )}
          >
            <TruncatedText text={snap.title} lines={2} focusable={false} />
          </button>
          {snap.subtitle && <TruncatedText text={snap.subtitle} className="text-xs text-muted-foreground" />}
          {!live && (
            <p className="text-[11px] italic text-muted-foreground">No longer in the data set. You can still remove it.</p>
          )}
        </div>
      </div>

      <NoteRow boardId={boardId} item={item} />

      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">Saved {relativeTime(item.addedAt)}</span>
        <div className="flex items-center gap-1.5">
          <DownloadButton
            build={() => buildDownloads(ref)}
            disabled={!live}
            disabledReason="This item is no longer available to download."
            ariaLabel={`Download ${snap.title}`}
            variant="icon"
          />
          <RemoveButton boardId={boardId} item={item} />
        </div>
      </div>
    </article>
  );
}
