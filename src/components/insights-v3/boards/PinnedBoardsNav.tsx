/**
 * PinnedBoardsNav: pinned V2 boards as indented children under the sub-nav
 * (mounted by SecondaryNavigationPanel for module "insights-v3"). Max 5,
 * hidden when none are pinned. The panel is 200px wide, so names truncate with
 * a tooltip and the count stays visible.
 *
 * Modelled on the old module's PinnedBoardsSection (copied, not imported).
 */
import { Link, useLocation } from "react-router-dom";
import { Pin } from "lucide-react";
import { usePinnedBoards, MAX_PINNED_BOARDS } from "@/lib/insights-v3/stores";
import { INSIGHTS_ROUTES } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";
import { TruncatedText, fmtInt } from "@/components/insights-v3/shared";

export default function PinnedBoardsNav() {
  const pinned = usePinnedBoards().slice(0, MAX_PINNED_BOARDS);
  const { pathname } = useLocation();
  if (pinned.length === 0) return null;

  const activeId = pathname.startsWith(`${INSIGHTS_ROUTES.boards}/`)
    ? decodeURIComponent(pathname.slice(INSIGHTS_ROUTES.boards.length + 1).split("/")[0])
    : null;

  return (
    <nav aria-label="Pinned boards" className="relative mt-0.5">
      <span aria-hidden="true" className="absolute bottom-0 top-0 w-px bg-foreground/[0.08]" style={{ left: "20px" }} />
      <ul className="flex flex-col gap-[2px]">
        {pinned.map((board) => {
          const active = activeId === board.id;
          const count = board.items.length;
          return (
            <li key={board.id}>
              <Link
                to={`${INSIGHTS_ROUTES.boards}/${encodeURIComponent(board.id)}`}
                aria-current={active ? "page" : undefined}
                aria-label={`${board.name}, ${count} ${count === 1 ? "item" : "items"}`}
                className={cn(
                  "flex h-8 items-center gap-2 rounded-2xl pr-2 transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-foreground/[0.04] font-medium text-foreground"
                    : "text-foreground/65 hover:bg-foreground/[0.04] hover:text-foreground",
                )}
                style={{ paddingLeft: "26px" }}
              >
                <Pin className="h-3 w-3 shrink-0 text-primary-text" aria-hidden="true" />
                <TruncatedText text={board.name} className="flex-1 text-[12.5px] leading-4" focusable={false} />
                <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary/15 px-1.5 font-mono text-[10px] leading-4 tabular-nums text-primary-text">
                  {fmtInt(count)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
