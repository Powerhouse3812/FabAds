import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useInsightBoards } from "@/hooks/use-insight-boards";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  board: { id: string; name: string; description?: string | null; tags?: string[] } | null;
}

export function EditBoardModal({ open, onClose, board }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const { updateBoard } = useInsightBoards();

  useEffect(() => {
    if (board) {
      setName(board.name);
      setDescription(board.description ?? "");
      setTags(board.tags?.join(", ") ?? "");
    }
  }, [board]);

  const handleSave = () => {
    if (!board) return;
    updateBoard.mutate(
      { id: board.id, name, description: description || undefined, tags: tags ? tags.split(",").map((t) => t.trim()) : [] },
      { onSuccess: () => { toast.success("Board updated"); onClose(); }, onError: () => toast.error("Failed to update") },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Edit Board</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
          <div><Label>Tags</Label><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Comma-separated" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim() || updateBoard.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
