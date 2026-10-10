/**
 * Industry Insights V2 · Boards. Grid of boards (name, description, items by
 * type, up to 4 thumbnails, pinned state) with pin (cap 5), create, rename,
 * delete (confirm), search and sort.
 *
 * Deviation from the shared page pattern: NO scope bar. Boards are the user's
 * own collections, not market data, so Industry / Category / Period would
 * filter nothing meaningful. The sticky header slot holds search + sort.
 */
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { LayoutGrid, Plus, Search, SearchX, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { createBoard, deleteBoard, renameBoard, useBoards, MAX_PINNED_BOARDS } from "@/lib/insights-v3/stores";
import { INSIGHTS_ROUTES, QP, type Board } from "@/lib/insights-v3/types";
import { InsightsOverlayHost } from "@/components/insights-v3/InsightsOverlayHost";
import { BoardCard } from "@/components/insights-v3/boards/BoardCard";
import { BoardFormDialog, type BoardFormValues } from "@/components/insights-v3/boards/BoardFormDialog";
import { DeleteBoardDialog } from "@/components/insights-v3/boards/DeleteBoardDialog";
import {
  EmptyState,
  GridSkeleton,
  InsightsPageLayout,
  SortControl,
  fmtInt,
  useListSort,
} from "@/components/insights-v3/shared";

type BoardSort = "recent" | "items" | "az";
const BOARD_SORT_LABEL: Record<BoardSort, string> = {
  recent: "Recently updated",
  items: "Most items",
  az: "A to Z",
};
const BOARD_SORTS = Object.keys(BOARD_SORT_LABEL) as BoardSort[];

function sortBoards(boards: Board[], sort: BoardSort): Board[] {
  const out = boards.slice();
  if (sort === "az") out.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  else if (sort === "items") out.sort((a, b) => b.items.length - a.items.length || a.name.localeCompare(b.name));
  else out.sort((a, b) => (b.updatedAt < a.updatedAt ? -1 : b.updatedAt > a.updatedAt ? 1 : 0));
  return out;
}

const GRID = "grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 pt-2";

export default function BoardsPage() {
  const [searchParams] = useSearchParams();
  const forced = searchParams.get(QP.state);
  const stored = useBoards();
  const boards = useMemo(() => (forced === "empty" ? [] : stored), [forced, stored]);

  const [sort, setSort] = useListSort<BoardSort>(BOARD_SORTS, "recent");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<Board | null>(null);
  const [deleting, setDeleting] = useState<Board | null>(null);

  const q = query.trim().toLowerCase();
  const visible = useMemo(() => {
    const filtered = q
      ? boards.filter((b) => b.name.toLowerCase().includes(q) || (b.description ?? "").toLowerCase().includes(q))
      : boards;
    return sortBoards(filtered, sort);
  }, [boards, q, sort]);

  const pinned = visible.filter((b) => b.pinned);
  const others = visible.filter((b) => !b.pinned);
  const pinnedTotal = boards.filter((b) => b.pinned).length;

  const onCreate = (v: BoardFormValues) => {
    const b = createBoard(v.name, { description: v.description || undefined });
    setCreating(false);
    toast.success(`Created “${b.name}”`);
  };
  const onRename = (v: BoardFormValues) => {
    if (!renaming) return;
    renameBoard(renaming.id, v.name, v.description);
    setRenaming(null);
    toast.success("Board updated");
  };
  const onDelete = () => {
    if (!deleting) return;
    const gone = deleting;
    deleteBoard(gone.id);
    setDeleting(null);
    toast.success(`Deleted “${gone.name}”`);
  };

  const toolbar = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="relative min-w-[200px] max-w-sm flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search boards"
          aria-label="Search boards"
          className="h-8 pl-8 pr-8 text-xs"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
      <SortControl value={sort} options={BOARD_SORT_LABEL} onChange={setSort} />
      <span className="ml-auto text-xs text-muted-foreground">
        <span className="font-mono font-medium tabular-nums text-foreground">{pinnedTotal}</span> / {MAX_PINNED_BOARDS} pinned
      </span>
    </div>
  );

  let list;
  if (forced === "loading") {
    list = <GridSkeleton count={6} />;
  } else if (boards.length === 0) {
    list = (
      <EmptyState
        icon={<LayoutGrid className="h-5 w-5" aria-hidden="true" />}
        title="No boards yet"
        body="A board collects what you want to come back to: ads, hooks, frameworks, angles, concepts, domains, pages, landing pages and offers. Create one here, or tap Save on anything in Discover."
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create your first board
            </button>
            <Link
              to={INSIGHTS_ROUTES.discover}
              className="inline-flex h-9 items-center rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Browse Discover
            </Link>
          </div>
        }
      />
    );
  } else if (visible.length === 0) {
    list = (
      <EmptyState
        icon={<SearchX className="h-5 w-5" aria-hidden="true" />}
        title={`No boards match “${query.trim()}”`}
        body="Search looks at board names and descriptions."
        action={
          <button
            type="button"
            onClick={() => setQuery("")}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Clear search
          </button>
        }
      />
    );
  } else {
    list = (
      <div className="space-y-5">
        {pinned.length > 0 && (
          <section aria-label="Pinned boards">
            <h2 className="flex items-baseline gap-2 text-sm font-semibold text-foreground">
              Pinned
              <span className="rounded-full bg-primary/15 px-2 font-mono text-[11px] leading-5 tabular-nums text-primary-text">
                {fmtInt(pinned.length)}
              </span>
            </h2>
            <div className={GRID}>
              {pinned.map((b) => (
                <BoardCard key={b.id} board={b} onRename={setRenaming} onDelete={setDeleting} />
              ))}
            </div>
          </section>
        )}
        {others.length > 0 && (
          <section aria-label={pinned.length > 0 ? "Other boards" : "All boards"}>
            <h2 className="flex items-baseline gap-2 text-sm font-semibold text-foreground">
              {pinned.length > 0 ? "Other boards" : "All boards"}
              <span className="rounded-full bg-primary/15 px-2 font-mono text-[11px] leading-5 tabular-nums text-primary-text">
                {fmtInt(others.length)}
              </span>
            </h2>
            <div className={GRID}>
              {others.map((b) => (
                <BoardCard key={b.id} board={b} onRename={setRenaming} onDelete={setDeleting} />
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <>
      <InsightsPageLayout
        title="Boards"
        count={forced === "loading" ? null : boards.length}
        countNoun={boards.length === 1 ? "board" : "boards"}
        headerActions={
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New board
          </button>
        }
        scopeBar={toolbar}
        list={list}
      />

      <BoardFormDialog open={creating} mode="create" onSubmit={onCreate} onClose={() => setCreating(false)} />
      <BoardFormDialog
        open={!!renaming}
        mode="rename"
        initial={{ name: renaming?.name, description: renaming?.description }}
        onSubmit={onRename}
        onClose={() => setRenaming(null)}
      />
      <DeleteBoardDialog board={deleting} onConfirm={onDelete} onClose={() => setDeleting(null)} />
      <InsightsOverlayHost />
    </>
  );
}
