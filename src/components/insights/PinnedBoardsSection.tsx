import { useLocation, useNavigate } from "react-router-dom";
import { MoreHorizontal, Pin, PinOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { usePinnedInsightBoards } from "./use-pinned-insight-boards";

/**
 * PinnedBoardsSection — pinned boards rendered as INDENTED CHILDREN of the
 * "Board" sub-nav item, not as a separate labeled section.
 *
 * A-12.43 redesign: the old version had a "PINNED BOARDS" caps header +
 * count badge above the rows, which read as a second sibling category to
 * the main sub-items and ate vertical real estate. Maalik flagged the
 * weight — the rows should feel like a tree branch off "Board", same
 * grammar as how the rest of the sub-nav handles nested children.
 *
 * The depth-1 indent (`pl-[26px]`) + vertical guide line (`left: 20px`)
 * mirror `SecondaryNavigationItem` exactly:
 *   parent  paddingLeft = 12 + (0 × 14) = 12px
 *   child   paddingLeft = 12 + (1 × 14) = 26px
 *   guide   left        = parentPL + 8  = 20px
 * That keeps the visual rhythm identical to any other nested sub-nav row,
 * so users read the pinned items as "these belong to Board" without
 * needing a label to explain it.
 *
 * Empty state (A-12.176): when nothing is pinned — REGARDLESS of why —
 * render a minimal two-line hint at the same depth-1 indent so the tree
 * branch stays visible and the user always knows where pins live. Copy
 * spells out the cap ("up to 5") per Maalik's spec. Not interactive —
 * pinning happens from the boards-page kebab; the empty state just
 * reserves the slot. Previous version conditioned on seed state and
 * board count, which hid the hint on fresh workspaces and confused
 * users who hadn't pinned anything yet.
 *
 * v1 deferred: drag-to-reorder. Pin order = insertion order. A future
 * iteration could wire @dnd-kit for ≤5 items, but the cost of a new
 * dependency outweighs the upside until usage data justifies it.
 */

interface BoardLike {
  id: string;
  name: string;
  insight_board_items?: Array<{ count: number }>;
}

interface PinnedBoardsSectionProps {
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

  const activeBoardId = pathname.match(/^\/insights\/boards\/(.+)/)?.[1];

  // Empty state — render the hint row whenever nothing is pinned. The
  // tree branch stays visible so users always know this slot exists.
  if (resolved.length === 0) {
    return (
      <div className="relative">
        <span
          aria-hidden
          className="absolute bottom-0 top-0 w-px bg-foreground/[0.08]"
          style={{ left: "20px" }}
        />
        <div
          className="flex min-h-8 items-start gap-2 py-1.5 pr-2"
          style={{ paddingLeft: "26px" }}
        >
          <Pin
            className="mt-[3px] h-3 w-3 shrink-0 text-foreground/30"
            aria-hidden
          />
          <span className="text-[11.5px] italic leading-snug text-foreground/45">
            Pin up to 5 boards here for quick access
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical tree guide — mirrors SecondaryNavigationItem.tsx line 116-118.
          Sits at left:20px so it aligns directly under the parent "Board"
          row's icon. */}
      <span
        aria-hidden
        className="absolute bottom-0 top-0 w-px bg-foreground/[0.08]"
        style={{ left: "20px" }}
      />

      {resolved.map((board) => {
        const count = board.insight_board_items?.[0]?.count ?? 0;
        const isActive = activeBoardId === board.id;
        return (
          <div
            key={board.id}
            className={cn(
              // Match SecondaryNavigationItem chrome exactly: h-8, rounded-2xl,
              // pl-[26px] (depth-1 indent), pr-2, gap-2. Slightly muted at rest
              // so the row reads as a child of "Board" rather than competing
              // with the static sub-items above.
              "group/pinned relative flex h-8 items-center gap-2 rounded-2xl pr-2 transition-colors",
              isActive
                ? "bg-foreground/[0.04] text-foreground font-medium"
                : "text-foreground/65 hover:bg-foreground/[0.04] hover:text-foreground",
            )}
            style={{ paddingLeft: "26px" }}
          >
            <button
              type="button"
              onClick={() => navigate(`/insights/boards/${board.id}`)}
              className="flex flex-1 items-center gap-2 truncate text-left"
            >
              {/* Small pin glyph instead of LayoutGrid — same icon position
                  as parent rows, but the icon itself signals "this is a
                  pinned shortcut" without needing a category label. */}
              <Pin
                className={cn(
                  "h-3 w-3 shrink-0",
                  isActive ? "text-foreground/70" : "text-foreground/35",
                )}
                aria-hidden
              />
              <span className="flex-1 truncate text-[12.5px] leading-4">
                {board.name}
              </span>
              {count > 0 && (
                <span className="shrink-0 inline-flex items-center justify-center rounded-full bg-foreground/[0.06] px-1.5 font-mono text-[9px] text-foreground/55">
                  {count}
                </span>
              )}
            </button>

            {/* Ellipsis menu — hidden at rest, opacity-60 on group hover,
                100% on self-hover/focus-visible. Always tab-reachable. */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`Actions for pinned board ${board.name}`}
                  className={cn(
                    "ml-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-opacity",
                    "opacity-0 group-hover/pinned:opacity-60 focus-visible:opacity-100 hover:!opacity-100",
                    "hover:bg-foreground/[0.06] hover:text-foreground",
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
  );
}
