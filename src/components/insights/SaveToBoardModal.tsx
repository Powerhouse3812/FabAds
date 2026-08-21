import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useInsightBoards, useInsightBoardItems, useAdBoardMemberships } from "@/hooks/use-insight-boards";
import type { InsightAd } from "@/lib/insights-dummy-data";
import { Folder } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props { open: boolean; onClose: () => void; ad: InsightAd | null }

export function SaveToBoardModal({ open, onClose, ad }: Props) {
  const navigate = useNavigate();
  const { boards, isLoading: boardsLoading, createBoard } = useInsightBoards();
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

  // Desktop-only entry point (see the hidden md:block wrapper below) — mobile
  // has no way to reach this handler.
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

  // Mobile spec 2.4 item 2: Save-to-board is existing-boards-only on mobile —
  // no inline creation here. That makes a zero-board workspace a dead end on
  // mobile unless we point somewhere. `/insights/boards` already supports
  // full board creation on mobile (its own ?modal=create-board deep link —
  // see InsightsBoards.tsx), so hand off there instead of faking a create
  // flow in this modal. The in-flight "save this ad" intent is lost, which
  // is an honest tradeoff, not a silent dead end.
  const goCreateBoardOnMobile = () => {
    onClose();
    navigate("/insights/boards?modal=create-board");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Save to Board</DialogTitle></DialogHeader>

        {boardsLoading ? (
          <div className="space-y-2 py-1">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : boards.length === 0 ? (
          <div className="space-y-3 py-1">
            <p className="text-sm text-muted-foreground md:hidden">
              No boards yet. Create one from Insights → Boards, then come back to save this ad.
            </p>
            {/* Desktop keeps its own zero-state: the "+ Create new board" toggle
                below (unconditional, unchanged) already covers it — this note
                just labels the empty list instead of leaving it silent. */}
            <p className="hidden text-sm text-muted-foreground md:block">
              No boards yet. Create your first one below.
            </p>
            <Button variant="outline" size="sm" className="h-11 w-full md:hidden" onClick={goCreateBoardOnMobile}>
              <Folder className="h-4 w-4 mr-1.5" /> Go to Boards to create one
            </Button>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {boards.map((b: any) => {
              const alreadySaved = alreadySavedBoardIds.has(b.id);
              const checked = alreadySaved || checkedBoards.has(b.id);
              return (
                // Mobile spec B 1.3: the board-row checkbox never got a 44px
                // treatment. The Checkbox itself stays the shared ui/
                // primitive's default 16px glyph untouched (checkbox.tsx is
                // not ours to restyle) — instead TWO <label htmlFor> siblings
                // wrap the row: one gives the checkbox a 44px-tall,
                // vertically-centred hit area without widening it (no
                // horizontal shift of the text that follows); the other
                // stretches the board-name column to flex-1 + 44px tall so
                // the rest of the row is tappable too, not just the glyph.
                // Two labels pointing at the same control is safe — native
                // label-forwarding only ever fires once per click, even when
                // the click lands on the control itself — so this can't
                // double-toggle.
                <div key={b.id} className="flex min-h-11 items-center gap-2 md:min-h-0">
                  <Label
                    htmlFor={b.id}
                    className={cn(
                      "flex h-11 shrink-0 items-center md:h-auto",
                      alreadySaved ? "cursor-not-allowed" : "cursor-pointer",
                    )}
                  >
                    <Checkbox
                      id={b.id}
                      checked={checked}
                      disabled={alreadySaved}
                      onCheckedChange={() => !alreadySaved && toggleBoard(b.id)}
                    />
                  </Label>
                  {/* min-w-0 + break-words: a 60+ char, unbroken board name
                      would otherwise force the row (and dialog) wider instead
                      of wrapping — this only changes anything for that edge
                      case, normal names render exactly as before.
                      opacity-70/cursor-not-allowed here replicate what
                      Label's own peer-disabled classes gave for free when
                      Checkbox was this label's sibling — nesting it under the
                      hit-area label above broke that CSS relationship, so
                      it's reproduced explicitly off the same `alreadySaved`
                      the checkbox already uses. */}
                  <Label
                    htmlFor={b.id}
                    className={cn(
                      "flex min-h-11 min-w-0 flex-1 items-center gap-1.5 md:min-h-0",
                      alreadySaved ? "cursor-not-allowed opacity-70" : "cursor-pointer",
                    )}
                  >
                    <span className="min-w-0 break-words">{b.name}</span>
                    {alreadySaved && <span className="shrink-0 text-xs text-muted-foreground">(saved)</span>}
                  </Label>
                </div>
              );
            })}
          </div>
        )}

        {/* New-board creation stays desktop-only (mobile spec 2.4 item 2).
            Hidden below md; unchanged at md+. */}
        <div className="hidden md:block">
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
        </div>

        <DialogFooter>
          {/* h-11 md:h-10: 44px touch floor on mobile (INV-10) — this Cancel
              is the modal's explicit close control. md:h-10 reproduces the
              Button default exactly, so desktop is pixel-identical. */}
          <Button variant="outline" onClick={onClose} className="h-11 md:h-10">Cancel</Button>
          <Button onClick={handleSave} disabled={saving || newCount === 0} className="h-11 md:h-10">
            {saving ? "Saving..." : `Save${newCount > 0 ? ` (${newCount})` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
