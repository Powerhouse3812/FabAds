/**
 * Industry Insights V2 · Board detail (/industry-insights/boards/:id).
 * Header (name, rename, pin, delete), type filter chips with counts (0 =
 * disabled, never hidden), and the item grid. Opening an item opens the same
 * drawer / overlay it was saved from.
 *
 * Deviation: no scope bar. A board is the user's own collection, not market
 * data, so the sticky slot holds the type filter instead.
 */
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, LayoutGrid, Pencil, Pin, PinOff, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteBoard, renameBoard, useBoard } from "@/lib/insights-v3/stores";
import { INSIGHTS_ROUTES, QP, type SavableType } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";
import { InsightsOverlayHost } from "@/components/insights-v3/InsightsOverlayHost";
import { BoardFormDialog, type BoardFormValues } from "@/components/insights-v3/boards/BoardFormDialog";
import { BoardItemCard } from "@/components/insights-v3/boards/BoardItemCard";
import { DeleteBoardDialog } from "@/components/insights-v3/boards/DeleteBoardDialog";
import {
  BOARD_TYPE_ORDER,
  BOARD_TYPE_PLURAL,
  relativeTime,
  togglePinWithToast,
  typeCounts,
} from "@/components/insights-v3/boards/boardUtils";
import {
  EmptyState,
  GridSkeleton,
  Hint,
  InsightsPageLayout,
  fmtInt,
  usePageTab,
} from "@/components/insights-v3/shared";

type TypeFilter = "all" | SavableType;
const FILTER_KEYS: TypeFilter[] = ["all", ...BOARD_TYPE_ORDER];

const GRID = "grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] items-start gap-3";

const btn =
  "inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function BoardDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const forced = searchParams.get(QP.state);
  const board = useBoard(id);

  const [filter, setFilter] = usePageTab<TypeFilter>(FILTER_KEYS, "all");
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const items = useMemo(() => (board && forced !== "empty" ? board.items : []), [board, forced]);
  const counts = useMemo(() => typeCounts({ items }), [items]);
  const shown = filter === "all" ? items : items.filter((i) => i.ref.type === filter);

  /* ── unknown board ─────────────────────────────────────────────────── */
  if (!board) {
    return (
      <>
        <InsightsPageLayout
          title="Board not found"
          scopeBar={null}
          list={
            <EmptyState
              icon={<LayoutGrid className="h-5 w-5" aria-hidden="true" />}
              title="This board doesn't exist"
              body="It may have been deleted, or the link is wrong. Your other boards are all on the Boards page."
              action={
                <Link
                  to={INSIGHTS_ROUTES.boards}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back to Boards
                </Link>
              }
            />
          }
        />
        <InsightsOverlayHost />
      </>
    );
  }

  const onRename = (v: BoardFormValues) => {
    renameBoard(board.id, v.name, v.description);
    setRenaming(false);
    toast.success("Board updated");
  };
  const onDelete = () => {
    const name = board.name;
    deleteBoard(board.id);
    setDeleting(false);
    toast.success(`Deleted “${name}”`);
    navigate(INSIGHTS_ROUTES.boards, { replace: true });
  };

  const chips = (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <Link
          to={INSIGHTS_ROUTES.boards}
          className="inline-flex items-center gap-1 rounded-sm font-medium text-foreground hover:text-primary-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          All boards
        </Link>
        {board.pinned && (
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 font-medium text-primary-text">
            <Pin className="h-3 w-3 fill-current" aria-hidden="true" />
            Pinned
          </span>
        )}
        {relativeTime(board.updatedAt) && <span>Updated {relativeTime(board.updatedAt)}</span>}
        {board.description && <span className="min-w-0 max-w-[640px] truncate" title={board.description}>{board.description}</span>}
      </div>
      <div role="group" aria-label="Filter by type" className="flex flex-wrap items-center gap-1.5">
        {FILTER_KEYS.map((k) => {
          const n = k === "all" ? items.length : counts[k];
          const label = k === "all" ? "All" : BOARD_TYPE_PLURAL[k];
          const on = filter === k;
          const disabled = n === 0 && k !== "all";
          const chip = (
            <button
              key={k}
              type="button"
              aria-pressed={on}
              aria-disabled={disabled || undefined}
              disabled={disabled}
              onClick={() => setFilter(k)}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                on
                  ? "border-primary bg-primary text-primary-foreground"
                  : disabled
                    ? "cursor-not-allowed border-border bg-muted/50 text-muted-foreground opacity-60"
                    : "border-primary/30 bg-primary/10 text-primary-text hover:bg-primary/20",
              )}
            >
              {label}
              <span className={cn("font-mono tabular-nums", on ? "text-primary-foreground" : "")}>{fmtInt(n)}</span>
            </button>
          );
          return disabled ? (
            <Hint key={k} content={`Nothing of this type is saved on this board yet`}>
              <span tabIndex={0} className="inline-flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {chip}
              </span>
            </Hint>
          ) : (
            chip
          );
        })}
      </div>
    </div>
  );

  let list;
  if (forced === "loading") {
    list = <GridSkeleton count={6} />;
  } else if (items.length === 0) {
    list = (
      <EmptyState
        icon={<LayoutGrid className="h-5 w-5" aria-hidden="true" />}
        title="This board is empty"
        body="Tap Save on any ad, hook, framework, angle, concept, domain, page, landing page or offer and pick this board. Everything saved here opens in the same view you saved it from."
        action={
          <Link
            to={INSIGHTS_ROUTES.discover}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Find something to save
          </Link>
        }
      />
    );
  } else if (shown.length === 0) {
    list = (
      <EmptyState
        title={`No ${filter === "all" ? "items" : BOARD_TYPE_PLURAL[filter].toLowerCase()} on this board`}
        body="This filter has nothing in it. Show everything to see what is on the board."
        action={
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Show all items
          </button>
        }
      />
    );
  } else {
    list = (
      <div className={GRID}>
        {shown.map((item) => (
          <BoardItemCard key={`${item.ref.type}:${item.ref.id}`} boardId={board.id} item={item} />
        ))}
      </div>
    );
  }

  return (
    <>
      <InsightsPageLayout
        title={board.name}
        count={forced === "loading" ? null : shown.length}
        countNoun={shown.length === 1 ? "item" : "items"}
        headerActions={
          <>
            <button type="button" onClick={() => togglePinWithToast(board)} aria-pressed={board.pinned} className={btn}>
              {board.pinned ? <PinOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Pin className="h-3.5 w-3.5" aria-hidden="true" />}
              {board.pinned ? "Unpin" : "Pin"}
            </button>
            <button type="button" onClick={() => setRenaming(true)} className={btn}>
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              Rename
            </button>
            <button
              type="button"
              onClick={() => setDeleting(true)}
              className={cn(btn, "hover:border-error-text/40 hover:bg-error-text/10 hover:text-error-text")}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Delete
            </button>
          </>
        }
        scopeBar={chips}
        list={list}
      />

      <BoardFormDialog
        open={renaming}
        mode="rename"
        initial={{ name: board.name, description: board.description }}
        onSubmit={onRename}
        onClose={() => setRenaming(false)}
      />
      <DeleteBoardDialog board={deleting ? board : null} onConfirm={onDelete} onClose={() => setDeleting(false)} />
      <InsightsOverlayHost />
    </>
  );
}
