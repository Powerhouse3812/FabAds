import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useInsightBoards } from "@/hooks/use-insight-boards";
import { toast } from "sonner";

interface Props { open: boolean; onClose: () => void }

export function CreateBoardModal({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const { createBoard, boards } = useInsightBoards();

  const handleCreate = () => {
    createBoard.mutate(
      { name, description: description || undefined, tags: tags ? tags.split(",").map((t) => t.trim()) : [] },
      { onSuccess: () => { toast.success("Board created"); setName(""); setDescription(""); setTags(""); onClose(); }, onError: () => toast.error("Failed to create board") },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Create Board</DialogTitle></DialogHeader>
        {boards.length >= 5 && (
          <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
            You have {boards.length} boards. Consider consolidating.
          </p>
        )}
        <div className="space-y-3">
          <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Board name" /></div>
          <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" rows={2} /></div>
          <div><Label>Tags</Label><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Comma-separated" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!name.trim() || createBoard.isPending}>
            {createBoard.isPending ? "Creating..." : "Create Board"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
