import { useState, useMemo } from "react";
import { useInsightBoards } from "@/hooks/use-insight-boards";
import { CreateBoardModal } from "@/components/insights/CreateBoardModal";
import { EditBoardModal } from "@/components/insights/EditBoardModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Folder, MoreVertical, Pencil, Trash2, Search, Image } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";

type SortKey = "recent" | "items" | "az";

export default function InsightsBoards() {
  const { boards, isLoading, deleteBoard } = useInsightBoards();
  const [createOpen, setCreateOpen] = useState(false);
  const [editBoard, setEditBoard] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    let list = boards as any[];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((b) => b.name.toLowerCase().includes(q) || b.tags?.some((t: string) => t.toLowerCase().includes(q)));
    }
    if (sort === "az") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "items") list = [...list].sort((a, b) => (b.insight_board_items?.[0]?.count ?? 0) - (a.insight_board_items?.[0]?.count ?? 0));
    return list;
  }, [boards, search, sort]);

  const handleDelete = () => {
    if (!deleteConfirm) return;
    deleteBoard.mutate(deleteConfirm, { onSuccess: () => { toast.success("Board deleted"); setDeleteConfirm(null); } });
  };

  return (
    <TooltipProvider>
      <div className="v3-page-mesh space-y-4 p-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Boards</h1>
          <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-1" /> Create Board</Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search boards..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Last updated</SelectItem>
              <SelectItem value="items">Most items</SelectItem>
              <SelectItem value="az">A–Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="p-3 space-y-3">
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map((j) => (
                      <Skeleton key={j} className="aspect-square rounded-md" />
                    ))}
                  </div>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground space-y-3">
            <Folder className="h-12 w-12 mx-auto opacity-30" />
            <p>{search ? "No boards match your search." : "No boards yet."}</p>
            {!search && (
              <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Create your first board
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((board: any) => {
              const thumbs: string[] = board._thumbStrip ?? [];
              const itemCount = board.insight_board_items?.[0]?.count ?? 0;
              const createdAt = board.created_at ? new Date(board.created_at) : null;

              return (
                <Card
                  key={board.id}
                  className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden group"
                  onClick={() => navigate(`/insights/boards/${board.id}`)}
                >
                  <div className="p-3 space-y-2.5">
                    {/* Thumbnail strip */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {thumbs.length > 0 ? (
                        <>
                          {thumbs.map((url, i) => (
                            <div key={i} className="aspect-square rounded-md overflow-hidden bg-muted">
                              <img src={url} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                          {Array.from({ length: Math.max(0, 4 - thumbs.length) }).map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square rounded-md bg-muted" />
                          ))}
                        </>
                      ) : (
                        <div className="col-span-4 aspect-[4/1] rounded-md bg-muted flex items-center justify-center">
                          <Image className="h-6 w-6 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>

                    {/* Name + kebab */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold truncate flex-1">{board.name}</h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          {/* Phase D P1-I4: kebab was opacity-0 unless hovered —
                              touch users + keyboard users couldn't discover the
                              menu. Now opacity-60 by default, raises to 100 on
                              hover/focus/group-hover. aria-label so screen
                              readers announce the icon-only button. */}
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Board actions"
                            className="h-7 w-7 shrink-0 opacity-60 group-hover:opacity-100 hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={() => setEditBoard(board)}>
                            <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteConfirm(board.id)}>
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Description */}
                    {board.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{board.description}</p>
                    )}

                    {/* Stats + tags */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">{itemCount} {itemCount === 1 ? "ad" : "ads"}</span>
                      {createdAt && (
                        <>
                          <span className="text-xs text-muted-foreground/50">·</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs text-muted-foreground cursor-default">
                                {formatDistanceToNow(createdAt, { addSuffix: true })}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {format(createdAt, "MMM d, yyyy")}
                            </TooltipContent>
                          </Tooltip>
                        </>
                      )}
                      {board.tags?.map((t: string) => (
                        <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0">{t}</Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <CreateBoardModal open={createOpen} onClose={() => setCreateOpen(false)} />
        <EditBoardModal open={!!editBoard} onClose={() => setEditBoard(null)} board={editBoard} />

        <AlertDialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete board?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently delete this board and all its saved items.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
