/**
 * BoardCard: one board in the Boards grid. Name, description, item count by
 * type (chips with counts), up to 4 thumbnails, pinned state, pin + menu.
 * The whole card opens the board (stretched link); the actions sit above it.
 */
import { Link } from "react-router-dom";
import { MoreHorizontal, Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { INSIGHTS_ROUTES, SAVABLE_LABEL, type Board } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";
import { Hint, TruncatedText, fmtInt } from "@/components/insights-v3/shared";
import { TYPE_ICON } from "@/components/insights-v3/shared/typeMeta";
import { BOARD_TYPE_ORDER, BOARD_TYPE_PLURAL, relativeTime, togglePinWithToast, typeCounts } from "./boardUtils";

export interface BoardCardProps {
  board: Board;
  onRename: (board: Board) => void;
  onDelete: (board: Board) => void;
}

function Thumbs({ board }: { board: Board }) {
  const shown = board.items.slice(0, 4);
  if (shown.length === 0) {
    return (
      <div className="flex h-14 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-xs text-muted-foreground">
        Nothing saved yet
      </div>
    );
  }
  return (
    <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => {
        const item = shown[i];
        if (!item) return <div key={i} className="h-14 rounded-md border border-dashed border-border bg-muted/30" />;
        const Icon = TYPE_ICON[item.ref.type];
        return item.snapshot.thumbnailUrl ? (
          <img
            key={i}
            src={item.snapshot.thumbnailUrl}
            alt=""
            loading="lazy"
            className="h-14 w-full rounded-md border border-border bg-muted object-cover"
          />
        ) : (
          <div key={i} className="flex h-14 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary-text">
            <Icon className="h-5 w-5" />
          </div>
        );
      })}
    </div>
  );
}

export function BoardCard({ board, onRename, onDelete }: BoardCardProps) {
  const counts = typeCounts(board);
  const total = board.items.length;

  return (
    <article
      className={cn(
        "group relative flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm transition-colors",
        "hover:border-primary/40 focus-within:border-primary/40",
        board.pinned ? "border-primary/40" : "border-border",
      )}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="min-w-0 text-sm font-semibold leading-5 text-foreground">
            <Link
              to={`${INSIGHTS_ROUTES.boards}/${encodeURIComponent(board.id)}`}
              className="block rounded-sm after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <TruncatedText text={board.name} focusable={false} />
            </Link>
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <span className="font-mono font-medium tabular-nums text-foreground">{fmtInt(total)}</span>{" "}
            {total === 1 ? "item" : "items"}
            {relativeTime(board.updatedAt) && <span> · updated {relativeTime(board.updatedAt)}</span>}
          </p>
        </div>

        <div className="relative z-10 flex shrink-0 items-center gap-1">
          <Hint content={board.pinned ? "Unpin from the sub-menu" : "Pin to the sub-menu"}>
            <button
              type="button"
              aria-pressed={board.pinned}
              aria-label={board.pinned ? `Unpin ${board.name}` : `Pin ${board.name}`}
              onClick={() => togglePinWithToast(board)}
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                board.pinned
                  ? "border-primary/40 bg-primary/15 text-primary-text hover:bg-primary/25"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground",
              )}
            >
              <Pin className={cn("h-3.5 w-3.5", board.pinned && "fill-current")} aria-hidden="true" />
            </button>
          </Hint>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`More actions for ${board.name}`}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[150px]">
              <DropdownMenuItem onClick={() => togglePinWithToast(board)} className="text-xs">
                {board.pinned ? <PinOff className="mr-2 h-3.5 w-3.5" aria-hidden="true" /> : <Pin className="mr-2 h-3.5 w-3.5" aria-hidden="true" />}
                {board.pinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRename(board)} className="text-xs">
                <Pencil className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(board)} className="text-xs text-error-text focus:text-error-text">
                <Trash2 className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {board.description ? (
        <p className="line-clamp-2 text-xs leading-4 text-muted-foreground">{board.description}</p>
      ) : (
        <p className="text-xs italic leading-4 text-muted-foreground">No description</p>
      )}

      <Thumbs board={board} />

      <ul className="flex flex-wrap gap-1.5" aria-label="Items by type">
        {total === 0 ? (
          <li className="text-[11px] text-muted-foreground">Save ads, hooks, frameworks and more from anywhere in Industry Insights.</li>
        ) : (
          BOARD_TYPE_ORDER.filter((t) => counts[t] > 0).map((t) => {
            const Icon = TYPE_ICON[t];
            return (
              <li
                key={t}
                aria-label={`${counts[t]} ${BOARD_TYPE_PLURAL[t].toLowerCase()}`}
                className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary-text"
              >
                <Icon className="h-3 w-3" aria-hidden="true" />
                <span className="font-mono tabular-nums">{fmtInt(counts[t])}</span>
                <span>{counts[t] === 1 ? SAVABLE_LABEL[t] : BOARD_TYPE_PLURAL[t]}</span>
              </li>
            );
          })
        )}
      </ul>

      {board.pinned && (
        <span className="absolute -top-2 left-4 inline-flex items-center gap-1 rounded-full border border-primary bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
          <Pin className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
          Pinned
        </span>
      )}
    </article>
  );
}
