import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useInsightBoards, useInsightBoardItems, useAdBoardMemberships } from "@/hooks/use-insight-boards";
import type { InsightAd } from "@/lib/insights-dummy-data";
import { toast } from "sonner";

interface Props { open: boolean; onClose: () => void; ad: InsightAd | null }

export function SaveToBoardModal({ open, onClose, ad }: Props) {
  const { boards, createBoard } = useInsightBoards();
  const { memberships } = useAdBoardMemberships(open && ad ? ad.id : undefined);
  const { addItem } = useInsightBoardItems(undefined);
  const [checkedBoards, setCheckedBoards] = useState<Set<string>>(new Set());
  const [newBoardName, setNewBoardName] = useState("");
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNewBoard, setShowNewBoard] = useState(false);

  const alreadySavedBoardIds = new Set(memberships?.map((m: any) => m.board_id) ?? []);

  useEffect(() => {
    if (open) {
      setCheckedBoards(new Set());
      setNewBoardName("");
      setShowNewBoard(false);
    }
  }, [open]);

  const toggleBoard = (boardId: string) => {
    setCheckedBoards((prev) => {
      const next = new Set(prev);
      if (next.has(boardId)) next.delete(boardId);
      else next.add(boardId);
      return next;
    });
  };

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;
    setCreating(true);
    try {
      await createBoard.mutateAsync({ name: newBoardName.trim() });
      toast.success("Board created");
      setNewBoardName("");
      setShowNewBoard(false);
    } catch {
      toast.error("Failed to create board");
    }
    setCreating(false);
  };

  const handleSave = async () => {
    if (!ad) return;
    const newBoards = [...checkedBoards].filter((id) => !alreadySavedBoardIds.has(id));
    if (newBoards.length === 0) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      await Promise.all(
        newBoards.map((boardId) =>
          addItem.mutateAsync({
            board_id: boardId,
            source_ad_id: ad.id,
            thumb_url: ad.thumbUrl,
            platform: ad.platform,
            domain: ad.domain,
            brand: ad.brand,
            status: ad.status,
          })
        )
      );
      toast.success(`Saved to ${newBoards.length} board(s)`);
      onClose();
    } catch (err: any) {
      if (err?.message?.includes("duplicate") || err?.code === "23505") {
        toast.error("Already saved to one of the selected boards");
      } else {
        toast.error("Failed to save");
      }
    }
    setSaving(false);
  };

  const newCount = [...checkedBoards].filter((id) => !alreadySavedBoardIds.has(id)).length;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Save to Board</DialogTitle></DialogHeader>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {boards.map((b: any) => {
            const alreadySaved = alreadySavedBoardIds.has(b.id);
            const checked = alreadySaved || checkedBoards.has(b.id);
            return (
              <div key={b.id} className="flex items-center gap-2">
                <Checkbox
                  id={b.id}
                  checked={checked}
                  disabled={alreadySaved}
                  onCheckedChange={() => !alreadySaved && toggleBoard(b.id)}
                />
                <Label htmlFor={b.id} className="flex items-center gap-1.5">
                  {b.name}
                  {alreadySaved && <span className="text-xs text-muted-foreground">(saved)</span>}
                </Label>
              </div>
            );
          })}
        </div>
        {showNewBoard ? (
          <div className="flex gap-2">
            <Input value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)} placeholder="Board name" className="flex-1" />
            <Button size="sm" onClick={handleCreateBoard} disabled={creating || !newBoardName.trim()}>
              {creating ? "..." : "Add"}
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" className="w-fit text-xs" onClick={() => setShowNewBoard(true)}>
            + Create new board
          </Button>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || newCount === 0}>
            {saving ? "Saving..." : `Save${newCount > 0 ? ` (${newCount})` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
