/**
 * BoardHygiene — the maintenance nudge for saved-ads boards.
 *
 * The most consistent finding behind this block: swipe files die. Someone
 * screenshots forty ads into a board in one sitting and never opens it again.
 * No product in this category surfaces that rot — this block does, and it is
 * deliberately unflattering rather than congratulatory about it.
 *
 * THE RULE THIS FILE MUST NOT BREAK: no vanity total. `useBoardHealth()` does
 * not expose a "N ads saved" figure and one must not be invented here. The
 * only totals that exist — `staleTotal` and `neverBriefedTotal` — are the
 * marks on the surface, because both imply an action, not a number to feel
 * good about.
 *
 * Scannable pass (2026-08): the surface is now those two counts and nothing
 * else. Per-board rows and the explainer sentence (`summaryLine` / `note`)
 * moved behind a click-to-expand disclosure — nothing deleted, one level
 * down. "Review" still routes straight to `board.href`; marking a board
 * reviewed is local-optimistic only (`useState` + a `sonner` toast), no
 * shared-store write.
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoTip } from "@/insights-dashboard/components/InfoTip";
import { useBoardHealth } from "@/insights-dashboard/lib/selectors";
import type { BoardHealthItem } from "@/insights-dashboard/lib/selectors";

const SECTION_LABEL = "font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70";

/** Condensed row inside the expander — one line, orientation only. */
function BoardRow({
  board,
  reviewed,
  onMarkReviewed,
}: {
  board: BoardHealthItem;
  reviewed: boolean;
  onMarkReviewed: (board: BoardHealthItem) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <Link
        to={board.href}
        title={board.name}
        className="block min-w-0 max-w-full truncate text-xs font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
      >
        {board.name}
      </Link>
      <div className="flex shrink-0 items-center gap-2.5">
        <span className="whitespace-nowrap text-[11px] text-foreground/70">
          {board.staleItemCount > 0 && `${board.staleItemCount} stale`}
          {board.staleItemCount > 0 && board.neverBriefedCount > 0 && " · "}
          {board.neverBriefedCount > 0 && `${board.neverBriefedCount} never briefed`}
        </span>
        <InfoTip tip="action.review-board" asChild>
          <Link
            to={board.href}
            className={cn(buttonVariants({ size: "sm", variant: "ghost" }), "h-6 px-2 text-[11px]")}
          >
            Review
          </Link>
        </InfoTip>
        {!reviewed && (
          <InfoTip tip="action.mark-reviewed" asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 shrink-0 text-muted-foreground"
              aria-label={`Mark ${board.name} reviewed`}
              onClick={() => onMarkReviewed(board)}
            >
              <Check className="h-3 w-3" aria-hidden="true" />
            </Button>
          </InfoTip>
        )}
      </div>
    </div>
  );
}

export function BoardHygiene({ className }: { className?: string }): JSX.Element {
  const { boards, isEmpty, isLoading } = useBoardHealth();
  const [reviewedIds, setReviewedIds] = useState<ReadonlySet<string>>(new Set());
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  // CHECK isLoading BEFORE `isEmpty`. `boards` is `[]` in both `loading` and a
  // genuinely empty board set — a skeleton keeps first paint from claiming
  // "nothing saved yet" while boards simply haven't loaded.
  if (isLoading) {
    // `self-start` here too, matching the resolved card — without it the
    // skeleton stretches to the row (~243px) and then snaps to ~101px the
    // moment data lands, which is the layout jump this file's skeletons
    // exist to avoid.
    return (
      <section className={cn("self-start rounded-lg border border-border bg-card p-4", className)}>
        <header className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <h2 className={SECTION_LABEL}>Board hygiene</h2>
            <InfoTip tip="block.board-hygiene" />
          </div>
        </header>
        <div className="flex items-center gap-5">
          <Skeleton className="h-8 w-12" />
          <Skeleton className="h-8 w-20" />
        </div>
      </section>
    );
  }

  const attentionBoards = boards
    .filter((b) => b.staleItemCount > 0 || b.neverBriefedCount > 0)
    .filter((b) => !reviewedIds.has(b.id))
    .sort((a, b) => b.staleItemCount - a.staleItemCount);

  const liveStaleTotal = attentionBoards.reduce((sum, b) => sum + b.staleItemCount, 0);
  const liveNeverBriefedTotal = attentionBoards.reduce((sum, b) => sum + b.neverBriefedCount, 0);

  const handleMarkReviewed = (board: BoardHealthItem) => {
    setReviewedIds((prev) => new Set(prev).add(board.id));
    toast.success(`Marked "${board.name}" reviewed`, {
      description: "Cleared for now — it'll flag again if it goes stale.",
    });
  };

  // `self-start` opts this card out of the grid row's default `stretch`.
  // Collapsed, its whole surface is two numbers — about 100px — while its row
  // siblings resolve near 280px, so stretching left roughly 180px of blank
  // card below the counts and the block read as having failed to load. Sized
  // to its content the same two numbers read as a deliberately small card,
  // and the leftover height becomes page background rather than a void inside
  // a border. No-op below `lg`, where every card is its own single-item row.
  return (
    <section className={cn("self-start rounded-lg border border-border bg-card p-4", className)}>
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <h2 className={SECTION_LABEL}>Board hygiene</h2>
          <InfoTip tip="block.board-hygiene" />
        </div>
        {!isEmpty && (
          <Link
            to="/insights/boards"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
          >
            View all →
          </Link>
        )}
      </header>

      {/* THE EMPTY BRANCH RENDERS THE SAME TWO NUMBERS AS THE POPULATED ONE.
          It used to swap in `InsightsV2EmptyState`, whose centred icon +
          title + description + button stack measured 377px against this
          card's own 106px collapsed form — a 271px jump for the user who has
          the LEAST, and enough on its own to stretch the whole row and leave
          ~120px of void inside `ShareOfVoice` beside it. Boards are one of
          the four genuinely user-scoped collections (per CONTRACT.md), so
          there is no market figure to substitute here and inventing one would
          be the fabricated-FOMO failure this module exists to avoid. What is
          honest is the structure: two real, measured zeros with their labels
          intact, and one line naming what fills them. A measured 0 is an
          ordinary number; the line beneath is what stops it reading as a
          blank. Do not reintroduce a `py-20`-style empty state inside a card
          that has a compact populated form. */}
      <div>
        <div className="flex items-center gap-5">
            <div>
              <p className="text-xl font-semibold leading-none tabular-nums text-foreground">
                {liveStaleTotal}
              </p>
              <div className={cn(SECTION_LABEL, "mt-1 inline-flex items-center gap-1")}>
                Stale
                <InfoTip tip="metric.board-stale-count" />
              </div>
            </div>
            <div>
              <p className="text-xl font-semibold leading-none tabular-nums text-foreground">
                {liveNeverBriefedTotal}
              </p>
              <div className={cn(SECTION_LABEL, "mt-1 inline-flex items-center gap-1")}>
                Never briefed
                <InfoTip tip="metric.board-never-briefed-count" />
              </div>
            </div>
          {attentionBoards.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              aria-label={expanded ? "Collapse boards needing attention" : "Expand boards needing attention"}
              className="shrink-0 self-center rounded-sm p-0.5 text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")}
                aria-hidden="true"
              />
            </button>
          )}
        </div>

        {isEmpty && (
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-2">
            <p className="min-w-0 text-[11px] leading-snug text-foreground/70">
              Nothing saved yet. Save ads from the feed and stale creative or
              never-briefed saves show up here.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="h-6 shrink-0 px-2 text-[11px]"
              onClick={() => navigate("/insights-v2/feed")}
            >
              Go to feed
            </Button>
          </div>
        )}

        {expanded && attentionBoards.length > 0 && (
          <div className="mt-2 divide-y divide-border/60 border-t border-border/60 pt-1">
            {attentionBoards.map((board) => (
              <BoardRow
                key={board.id}
                board={board}
                reviewed={reviewedIds.has(board.id)}
                onMarkReviewed={handleMarkReviewed}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
