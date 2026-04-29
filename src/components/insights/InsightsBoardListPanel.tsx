import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus, Search, LayoutGrid } from "lucide-react";
import { useInsightBoards } from "@/hooks/use-insight-boards";
import { CreateBoardModal } from "@/components/insights/CreateBoardModal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function InsightsBoardListPanel() {
  const { boards, isLoading } = useInsightBoards();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = boards.filter((b: any) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeBoardId = pathname.match(/^\/insights\/boards\/(.+)/)?.[1];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Boards</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setCreateOpen(true)}
          title="Create board"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Search */}
      <div className="px-2 pb-1.5">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search boards..."
            className="pl-7 h-7 text-xs"
          />
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-0.5 px-2 pb-2">
          {isLoading ? (
            <p className="text-xs text-muted-foreground px-2 py-3">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground px-2 py-3">
              {search ? "No matches" : "No boards yet"}
            </p>
          ) : (
            filtered.map((board: any) => {
              const count = board.insight_board_items?.[0]?.count ?? 0;
              const isActive = activeBoardId === board.id;
              return (
                <button
                  key={board.id}
                  onClick={() => navigate(`/insights/boards/${board.id}`)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors text-left",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <LayoutGrid className="h-3 w-3 shrink-0 opacity-60" />
                  <span className="truncate flex-1">{board.name}</span>
                  {count > 0 && (
                    <Badge variant="secondary" className="text-[9px] h-4 px-1.5 shrink-0">
                      {count}
                    </Badge>
                  )}
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>

      <CreateBoardModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
