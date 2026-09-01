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
 * only totals that exist (`staleTotal`, `neverBriefedTotal`, folded into
 * `summaryLine`) are ones that imply an action, not a number to feel good
 * about. Per-board `itemCount` is shown for orientation only, never summed
 * into a headline.
 *
 * Tone: a maintenance nudge, not a scolding and not a celebration. The
 * practitioner ritual this models is "delete what no longer represents a
 * live pattern, archive a long-runner that still demonstrates a mechanism" —
 * so the CTA on a stale board is "Review", never "Delete". Any action here is
 * local optimistic state only (`useState` + `sonner` toast); nothing is
 * written to a shared store and nothing survives a reload.
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Folder } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { InsightsV2EmptyState } from "@/components/insights-v2/InsightsV2EmptyState";
import { useBoardHealth } from "@/insights-dashboard/lib/selectors";
import type { BoardHealthItem } from "@/insights-dashboard/lib/selectors";

function formatTouched(daysAgo: number): string {
  if (daysAgo <= 0) return "touched today";
  if (daysAgo === 1) return "touched 1 day ago";
  return `touched ${daysAgo} days ago`;
}

function BoardRow({
  board,
  isDormant,
  needsReview,
  reviewed,
  onMarkReviewed,
}: {
  board: BoardHealthItem;
  isDormant: boolean;
  needsReview: boolean;
  reviewed: boolean;
  onMarkReviewed: (board: BoardHealthItem) => void;
}) {
  const showAction = needsReview && !reviewed;

  return (
    // TWO ROWS, not two columns. This card lives in the 4-of-12 rail (~336px
    // of usable width). Two stacked stat columns plus the action cluster ate
    // ~280px of that as `shrink-0`, leaving the board name 54px — every board
    // rendered as "Comp…", "Hook t…", "Winter…". Name and action share the
    // first row; the counts move to the metadata line, where the mono-caps
    // label sits inline before its number instead of above it.
    <div className="py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
          {/* `min-w-0` on the Link itself, not just its parent: a flex item's
              default `min-width: auto` otherwise refuses to shrink below the
              board name's intrinsic width, so a long single-token name
              (60-char brand, no spaces to wrap on) would overflow the card
              instead of truncating. `title` restores the full name on hover
              once the text is cut. */}
          <Link
            to={board.href}
            title={board.name}
            className="block min-w-0 max-w-full truncate text-sm font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
          >
            {board.name}
          </Link>
          {isDormant && (
            <Badge
              variant="outline"
              className="shrink-0 rounded-full px-1.5 py-0 text-[10px] font-normal leading-4 text-muted-foreground"
            >
              Dormant
            </Badge>
          )}
          {reviewed && (
            <span className="shrink-0 text-[11px] italic text-muted-foreground">
              Marked reviewed
            </span>
          )}
        </div>

        {showAction && (
          <div className="flex shrink-0 items-center gap-1">
            <Button asChild size="sm" variant="outline" className="h-7 px-2.5 text-xs">
              <Link to={board.href}>Review</Link>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground"
              aria-label={`Mark ${board.name} reviewed`}
              onClick={() => onMarkReviewed(board)}
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>

      <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
        <span>
          {board.itemCount.toLocaleString()} saved · {formatTouched(board.lastTouchedDaysAgo)}
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className="font-mono text-[9px] font-medium uppercase tracking-[0.14em]">
            Stale
          </span>
          <span className="font-medium tabular-nums text-foreground">
            {board.staleItemCount.toLocaleString()}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-[9px] font-medium uppercase tracking-[0.14em]">
            Never briefed
          </span>
          <span className="font-medium tabular-nums text-foreground">
            {board.neverBriefedCount.toLocaleString()}
          </span>
        </span>
      </div>
    </div>
  );
}

export function BoardHygiene({ className }: { className?: string }): JSX.Element {
  const { boards, boardCount, isEmpty, isLoading, needsAttention, dormant, summaryLine, note } =
    useBoardHealth();
  const [reviewedIds, setReviewedIds] = useState<ReadonlySet<string>>(new Set());
  const navigate = useNavigate();

  // CHECK isLoading BEFORE `isEmpty`. `boards` is `[]` in both `loading` and a
  // genuinely empty board set — a skeleton keeps first paint from claiming
  // "nothing saved yet" while boards simply haven't loaded.
  if (isLoading) {
    return (
      <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <header className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Board hygiene</h2>
        </header>
        <Skeleton className="h-3.5 w-56" />
        <Skeleton className="mt-1.5 h-3 w-40" />
        <div className="mt-3 divide-y divide-border/60">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="py-2.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-1.5 h-3 w-56" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const attentionIds = new Set(needsAttention.map((b) => b.id));
  const dormantIds = new Set(dormant.map((b) => b.id));

  const handleMarkReviewed = (board: BoardHealthItem) => {
    setReviewedIds((prev) => new Set(prev).add(board.id));
    toast.success(`Marked "${board.name}" reviewed`, {
      description: "Cleared for now — it'll flag again if it goes stale.",
    });
  };

  return (
    <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <header className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Board hygiene</h2>
        {!isEmpty && (
          <span className="shrink-0 font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {boardCount} {boardCount === 1 ? "board" : "boards"}
          </span>
        )}
      </header>

      {isEmpty ? (
        <InsightsV2EmptyState
          icon={Folder}
          title="Nothing saved yet"
          description="Save ads from the feed to start a board — hygiene checks like stale creative and never-briefed saves show up here once you do."
          cta={{ label: "Go to feed", onClick: () => navigate("/insights-v2/feed") }}
        />
      ) : (
        <div>
          <p className="text-xs leading-snug text-foreground">
            {summaryLine ?? "No boards need attention right now."}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{note}</p>

          <div className="mt-3 divide-y divide-border/60">
            {boards.map((board) => (
              <BoardRow
                key={board.id}
                board={board}
                isDormant={dormantIds.has(board.id)}
                needsReview={attentionIds.has(board.id)}
                reviewed={reviewedIds.has(board.id)}
                onMarkReviewed={handleMarkReviewed}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
