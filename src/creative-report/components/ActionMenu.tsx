/**
 * ActionMenu — the shared kebab of creative actions (overflow beyond the
 * card's inline row). Same handlers as the inline buttons via the actions hub.
 */
import { useMemo } from "react";
import {
  Copy,
  Eye,
  FolderPlus,
  GitCompareArrows,
  MoreHorizontal,
  Pause,
  Rocket,
  Bookmark,
  Target,
  Trophy,
  Wand2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { WhyDot } from "@/creative-report/components/WhyDot";
import { useCreativeActions } from "@/creative-report/actions/useCreativeActions";
import { useCompareTray } from "@/creative-report/lib/compareTrayStore";
import { addCreativeToBoard, useBoardsStore } from "@/creative-report/automations/boards";
import { useToast } from "@/hooks/use-toast";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

export function ActionMenu({
  rollup,
  showView = true,
}: {
  rollup: CreativeRollup;
  showView?: boolean;
}) {
  const a = useCreativeActions();
  const { boards } = useBoardsStore();
  const { toast } = useToast();
  const { ids: compareIds } = useCompareTray();
  const inCompare = useMemo(
    () => compareIds.includes(rollup.creative.id),
    [compareIds, rollup.creative.id],
  );

  const handleAddToBoard = (boardId: string, boardName: string) => {
    addCreativeToBoard(boardId, rollup.creative.id);
    toast({ title: "Added to board", description: `Filed into "${boardName}".` });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="More actions">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {showView && (
          <DropdownMenuItem onClick={() => a.view(rollup.creative.id)}>
            <Eye className="mr-2 h-4 w-4" /> View details
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => a.generateVariation(rollup)}>
          <Wand2 className="mr-2 h-4 w-4" /> Generate variation
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => a.addToCompare(rollup)}>
          <GitCompareArrows className="mr-2 h-4 w-4" /> {inCompare ? "In compare" : "Compare"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => a.saveToLibrary(rollup)}>
          <Bookmark className="mr-2 h-4 w-4" /> Save to Library
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => a.markWinner(rollup)}>
          <Trophy className="mr-2 h-4 w-4" /> Mark as Winner
        </DropdownMenuItem>
        {boards.length > 0 ? (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FolderPlus className="mr-2 h-4 w-4" /> Add to board
              <WhyDot id="grid.action.addToBoard" className="ml-auto" />
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48">
              {boards.map((b) => (
                <DropdownMenuItem key={b.id} onClick={() => handleAddToBoard(b.id, b.name)}>
                  {b.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => a.duplicate(rollup)}>
          <Copy className="mr-2 h-4 w-4" /> Duplicate
          <WhyDot id="grid.action.duplicate" className="ml-auto" />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => a.editTargeting(rollup)}>
          <Target className="mr-2 h-4 w-4" /> Edit targeting
          <WhyDot id="grid.action.editTargeting" className="ml-auto" />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => a.launch(rollup)}>
          <Rocket className="mr-2 h-4 w-4" /> Relaunch
          <WhyDot id="grid.action.relaunch" className="ml-auto" />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => a.pause(rollup)} className="text-destructive focus:text-destructive">
          <Pause className="mr-2 h-4 w-4" /> Pause
          <WhyDot id="grid.action.pause" className="ml-auto" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
