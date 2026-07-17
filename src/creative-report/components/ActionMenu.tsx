/**
 * ActionMenu — the shared kebab of creative actions (overflow beyond the
 * card's inline row). Same handlers as the inline buttons via the actions hub.
 */
import {
  Eye,
  GitCompareArrows,
  MoreHorizontal,
  Pause,
  Rocket,
  Bookmark,
  Trophy,
  Wand2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useCreativeActions } from "@/creative-report/actions/useCreativeActions";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

export function ActionMenu({
  rollup,
  showView = true,
}: {
  rollup: CreativeRollup;
  showView?: boolean;
}) {
  const a = useCreativeActions();
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
        <DropdownMenuItem onClick={() => a.compare([rollup.creative.id])}>
          <GitCompareArrows className="mr-2 h-4 w-4" /> Compare
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => a.saveToLibrary(rollup)}>
          <Bookmark className="mr-2 h-4 w-4" /> Save to Library
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => a.markWinner(rollup)}>
          <Trophy className="mr-2 h-4 w-4" /> Mark as Winner
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => a.launch(rollup)}>
          <Rocket className="mr-2 h-4 w-4" /> Relaunch
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => a.pause(rollup)} className="text-destructive focus:text-destructive">
          <Pause className="mr-2 h-4 w-4" /> Pause
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
