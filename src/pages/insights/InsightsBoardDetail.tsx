import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useInsightBoardItems, useInsightBoards } from "@/hooks/use-insight-boards";
import { useInsightQueue } from "@/hooks/use-insight-queue";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { EditBoardModal } from "@/components/insights/EditBoardModal";
import { MoveToInsightBoardModal } from "@/components/insights/MoveToInsightBoardModal";
import { InsightAdGridSkeleton } from "@/components/insights/InsightAdGridSkeleton";
import { ArrowLeft, Trash2, ListPlus, Pencil, FolderInput, CheckSquare, XSquare, StickyNote, Bookmark, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";

export default function InsightsBoardDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const wsId = useWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, isLoading, removeItem, bulkRemove, bulkAddToQueue, updateItemNote } = useInsightBoardItems(id);
  const { boards } = useInsightBoards();
  const { addToQueue } = useInsightQueue();

  // A-12.179: URL-backed interactive state.
  //   ?selected=id1,id2,...           bulk-select Set (omit when empty)
  //   ?modal=edit-board               edit modal open (board = :id route param)
  //   ?modal=move-to-board            move modal open — inherits ?selected=
  //   ?note=<itemId>                  inline note editor open for this item
  // `noteText` (typed content) stays local — only the open-state goes in URL.
  const selected = useMemo<Set<string>>(() => {
    const raw = searchParams.get("selected");
    if (!raw) return new Set();
    return new Set(raw.split(",").filter(Boolean));
  }, [searchParams]);

  const modal = searchParams.get("modal");
  const editOpen = modal === "edit-board";
  const moveOpen = modal === "move-to-board";
  const editingNote = searchParams.get("note");

  const [noteText, setNoteText] = useState("");

  // Seed `noteText` when the note editor opens for an item that already
  // has a saved note — otherwise the textarea would start empty even when
  // the user clicked the existing note to edit it.
  useEffect(() => {
    if (!editingNote) {
      setNoteText("");
      return;
    }
    const item = items.find((i: any) => i.id === editingNote);
    setNoteText(item?.note ?? "");
  }, [editingNote, items]);

  const writeSelected = useCallback(
    (next: Set<string>) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (next.size === 0) sp.delete("selected");
          else sp.set("selected", Array.from(next).join(","));
          return sp;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const openModal = useCallback(
    (which: "edit-board" | "move-to-board") => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          sp.set("modal", which);
          return sp;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  const closeModal = useCallback(() => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.delete("modal");
        return sp;
      },
      { replace: false },
    );
  }, [setSearchParams]);

  const openNote = useCallback(
    (itemId: string) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          sp.set("note", itemId);
          return sp;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  const closeNote = useCallback(() => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.delete("note");
        return sp;
      },
      { replace: false },
    );
  }, [setSearchParams]);

  const board = boards.find((b: any) => b.id === id) as any;

  // Queue status for items
  const queueQuery = useQuery({
    queryKey: ["insight-queue-ids", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase.from("insight_queue_items").select("source_ad_id").eq("workspace_id", wsId!);
      return new Set(data?.map((d) => d.source_ad_id) ?? []);
    },
  });
  const queuedIds = queueQuery.data ?? new Set<string>();

  const toggleSelect = (itemId: string) => {
    const next = new Set(selected);
    if (next.has(itemId)) next.delete(itemId);
    else next.add(itemId);
    writeSelected(next);
  };

  const selectAll = () => writeSelected(new Set(items.map((i: any) => i.id)));
  const deselectAll = () => writeSelected(new Set());

  const handleBulkRemove = () => {
    bulkRemove.mutate([...selected], { onSuccess: () => { toast.success(`Removed ${selected.size} item(s)`); deselectAll(); } });
  };

  const handleBulkQueue = () => {
    const adIds = items.filter((i: any) => selected.has(i.id)).map((i: any) => i.source_ad_id);
    bulkAddToQueue.mutate(adIds, { onSuccess: () => { toast.success(`Added ${adIds.length} to queue`); deselectAll(); } });
  };

  const handleSaveNote = (itemId: string) => {
    updateItemNote.mutate({ itemId, note: noteText }, { onSuccess: () => { closeNote(); setNoteText(""); } });
  };

  return (
    <div className="v3-page-mesh space-y-4 p-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/insights-v2/feed")}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold truncate">{board?.name ?? "Board Detail"}</h1>
          {board?.description && <p className="text-xs text-muted-foreground truncate">{board.description}</p>}
        </div>
        <div className="flex items-center gap-1">
          {board?.tags?.map((t: string) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
          <Button variant="outline" size="sm" onClick={() => openModal("edit-board")}><Pencil className="h-3.5 w-3.5 mr-1" /> Edit</Button>
        </div>
      </div>

      {/* Bulk toolbar — Phase C P1-I5: each mutation now disables its
          button while pending and renders an inline spinner so the user
          knows the click registered. Was: clicks during pending looked
          unresponsive, users would re-click and accidentally queue twice. */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button variant="outline" size="sm" onClick={selectAll}><CheckSquare className="h-3.5 w-3.5 mr-1" /> All</Button>
          <Button variant="outline" size="sm" onClick={deselectAll}><XSquare className="h-3.5 w-3.5 mr-1" /> None</Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkQueue}
            disabled={bulkAddToQueue.isPending}
          >
            {bulkAddToQueue.isPending
              ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              : <ListPlus className="h-3.5 w-3.5 mr-1" />}
            Queue
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openModal("move-to-board")}
            disabled={bulkRemove.isPending || bulkAddToQueue.isPending}
          >
            <FolderInput className="h-3.5 w-3.5 mr-1" />
            Move
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkRemove}
            disabled={bulkRemove.isPending}
          >
            {bulkRemove.isPending
              ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              : <Trash2 className="h-3.5 w-3.5 mr-1" />}
            Remove
          </Button>
        </div>
      )}

      {isLoading ? (
        /* Phase C P1-I1 (carried into BoardDetail): real skeleton instead
           of the bare "Loading..." text. Matches the actual grid layout. */
        <InsightAdGridSkeleton count={8} />
      ) : items.length === 0 ? (
        /* Phase C P1-I2: zero-data state was just a centered text line.
           Now: icon + supportive copy + actionable CTA back to Discover so
           the user has a clear next step. */
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Bookmark className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-1 max-w-sm">
            <p className="font-medium">No items in this board yet</p>
            <p className="text-sm text-muted-foreground">
              Save ads from Discover or your Feed and they'll show up here.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/insights/discover")}>
            Browse Discover
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
          {items.map((item: any) => (
            <Card key={item.id} className={selected.has(item.id) ? "ring-2 ring-primary" : ""}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox checked={selected.has(item.id)} onCheckedChange={() => toggleSelect(item.id)} />
                  <div className="flex-1" />
                  {queuedIds.has(item.source_ad_id) && <Badge variant="secondary" className="text-[9px]">In Queue</Badge>}
                </div>
                <div className="aspect-video bg-muted rounded-md overflow-hidden">
                  <img src={item.thumb_url || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {item.brand && <span className="font-medium">{item.brand}</span>}
                  {item.platform && <Badge variant="outline" className="text-[10px]">{item.platform}</Badge>}
                  {item.status && <Badge variant={item.status === "active" ? "default" : "secondary"} className="text-[10px]">{item.status}</Badge>}
                </div>
                {item.domain && <p className="text-[10px] text-muted-foreground">{item.domain}</p>}

                {/* Note */}
                {editingNote === item.id ? (
                  <div className="space-y-1">
                    <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={2} placeholder="Why did you save this?" className="text-xs" />
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={closeNote}>Cancel</Button>
                      <Button size="sm" onClick={() => handleSaveNote(item.id)}>Save</Button>
                    </div>
                  </div>
                ) : item.note ? (
                  <p className="text-[10px] text-muted-foreground italic cursor-pointer inline-flex items-center gap-1" onClick={() => openNote(item.id)}>
                    <StickyNote className="h-3 w-3" strokeWidth={2} aria-hidden /> {item.note}
                  </p>
                ) : null}

                <div className="flex gap-1">
                  {!item.note && editingNote !== item.id && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openNote(item.id)} title="Add note">
                      <StickyNote className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => addToQueue.mutate({ source_ad_id: item.source_ad_id }, { onSuccess: () => toast.success("Added to queue") })}>
                    <ListPlus className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={() => removeItem.mutate(item.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <EditBoardModal open={editOpen} onClose={closeModal} board={board ?? null} />
      {id && <MoveToInsightBoardModal open={moveOpen} onClose={() => { closeModal(); deselectAll(); }} currentBoardId={id} selectedItemIds={[...selected]} />}
    </div>
  );
}
