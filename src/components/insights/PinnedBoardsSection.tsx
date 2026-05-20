import { useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, MoreHorizontal, PinOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { usePinnedInsightBoards } from "./use-pinned-insight-boards";

/**
 * PinnedBoardsSection — quick-access row of up to 5 pinned boards.
 *
 * Lives directly below the Boards sub-menu in the Industry Insights left rail.
 * Sources its IDs from the `usePinnedInsightBoards` localStorage-backed hook
 * and looks up the live board data from the caller's `boards` prop (so we
 * inherit fresh names/counts without a second Supabase query).
 *
 * Empty-state policy: when there are zero pins (or all pinned IDs are stale
 * because the boards were deleted), the entire section — header included —
 * is hidden. A "Pin your first board" CTA would have wasted vertical space
 * in an already-dense sub-nav.
 *
 * v1 deferred: drag-to-reorder. The current order is insertion order. Users
 * can unpin/repin to nudge things to the end of the list. A future iteration
 * could wire @dnd-kit here, but that pulls a new dependency for what is, in
 * practice, a 5-item list — easier to revisit after seeing usage.
 */

interface BoardLike {
  id: string;
  name: string;
  insight_board_items?: Array<{ count: number }>;
}

interface PinnedBoardsSectionProps {
  /** All boards available — used to resolve pinned IDs to live data. */
  boards: BoardLike[];
}

export function PinnedBoardsSection({ boards }: PinnedBoardsSectionProps) {
  const { pinnedIds, unpin } = usePinnedInsightBoards();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Resolve in pin order. Drop any pinned IDs whose board has since been
  // deleted — silent prune, no toast needed (the user didn't trigger this).
  const resolved = pinnedIds
    .map((id) => boards.find((b) => b.id === id))
    .filter((b): b is BoardLike => Boolean(b));

  // Empty state: hide the whole section. See policy note above.
  if (resolved.length === 0) return null;

  const activeBoardId = pathname.match(/^\/insights\/boards\/(.+)/)?.[1];

  return (
    <div className="flex flex-col">
      {/* Section header — mono uppercase caps + count badge, matches the
          sub-nav's "Boards" header tone so the two read as a pair. The
          Boards header above uses `text-muted-foreground` at 11px; we mirror
          that to avoid an accidental new visual style. */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Pinned boards
        </span>
        <span className="inline-flex items-center justify-center rounded-full bg-foreground/[0.08] px-1.5 font-mono text-[9px] font-bold text-foreground/70">
          {resolved.length}
        </span>
      </div>

      <div className="flex flex-col gap-0.5 px-2 pb-2">
        {resolved.map((board) => {
          const count = board.insight_board_items?.[0]?.count ?? 0;
          const isActive = activeBoardId === board.id;
          return (
            <div
              key={board.id}
              className={cn(
                "group/pinned relative flex items-center gap-2 rounded-md text-xs transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <button
                type="button"
                onClick={() => navigate(`/insights/boards/${board.id}`)}
                className="flex flex-1 items-center gap-2 px-2 py-1.5 text-left min-w-0"
              >
                <LayoutGrid
                  className="h-3 w-3 shrink-0 opacity-60"
                  aria-hidden
                />
                <span className="truncate flex-1">{board.name}</span>
                {count > 0 && (
                  <span className="shrink-0 inline-flex items-center justify-center rounded-full bg-foreground/[0.06] px-1.5 font-mono text-[9px] font-bold text-foreground/70">
                    {count}
                  </span>
                )}
              </button>

              {/* Ellipsis menu — visible only on hover/focus to keep rows
                  visually quiet at rest. Always reachable by keyboard via
                  Tab into the row (the DropdownMenuTrigger button is in the
                  tab order regardless of opacity). */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Actions for pinned board ${board.name}`}
                    className={cn(
                      "mr-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-opacity",
                      "opacity-0 group-hover/pinned:opacity-100 focus-visible:opacity-100 hover:bg-foreground/[0.06] hover:text-foreground",
                    )}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[120px]">
                  <DropdownMenuItem
                    onClick={() => unpin(board.id)}
                    className="text-xs"
                  >
                    <PinOff className="mr-2 h-3 w-3" aria-hidden />
                    Unpin
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>
    </div>
  );
}
