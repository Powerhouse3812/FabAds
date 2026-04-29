import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useInsightBoards, useInsightBoardItems } from "@/hooks/use-insight-boards";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  currentBoardId: string;
  selectedItemIds: string[];
}

export function MoveToInsightBoardModal({ open, onClose, currentBoardId, selectedItemIds }: Props) {
  const { boards } = useInsightBoards();
  const { moveItems } = useInsightBoardItems(currentBoardId);
  const [target, setTarget] = useState("");

  const otherBoards = boards.filter((b: any) => b.id !== currentBoardId);

  const handleMove = () => {
    if (!target || selectedItemIds.length === 0) return;
    moveItems.mutate(
      { itemIds: selectedItemIds, targetBoardId: target },
      {
        onSuccess: () => { toast.success(`Moved ${selectedItemIds.length} item(s)`); onClose(); },
        onError: () => toast.error("Failed to move items"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Move to Board</DialogTitle></DialogHeader>
        {otherBoards.length === 0 ? (
          <p className="text-sm text-muted-foreground">No other boards available.</p>
        ) : (
          <RadioGroup value={target} onValueChange={setTarget} className="space-y-2">
            {otherBoards.map((b: any) => (
              <div key={b.id} className="flex items-center gap-2">
                <RadioGroupItem value={b.id} id={`move-${b.id}`} />
                <Label htmlFor={`move-${b.id}`}>{b.name}</Label>
              </div>
            ))}
          </RadioGroup>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleMove} disabled={!target || moveItems.isPending}>
            Move {selectedItemIds.length} item(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
