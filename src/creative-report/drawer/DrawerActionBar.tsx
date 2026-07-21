/**
 * DrawerActionBar — the sticky action bar at the bottom of the creative drawer.
 * The full loop in one place: Generate variation → Genie · Relaunch · Save ·
 * Mark Winner · Compare · Pause. Reflects optimistic state on the buttons.
 */
import { Bookmark, Copy, GitCompareArrows, Pause, Rocket, Target, Trophy, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCreativeActions } from "@/creative-report/actions/useCreativeActions";
import { useCreativeAction } from "@/creative-report/actions/actionStore";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

export function DrawerActionBar({ rollup }: { rollup: CreativeRollup }) {
  const a = useCreativeActions();
  const st = useCreativeAction(rollup.creative.id);

  return (
    <div className="sticky bottom-0 border-t border-border bg-card/95 px-4 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        <Button className="gap-1.5" onClick={() => a.generateVariation(rollup)}>
          <Wand2 className="h-4 w-4" /> Generate variation
        </Button>
        <Button
          variant="outline"
          className="gap-1.5"
          onClick={() => a.launch(rollup)}
          disabled={st.queuedInLaunch}
        >
          <Rocket className="h-4 w-4" /> {st.queuedInLaunch ? "Queued in Launch" : "Relaunch"}
        </Button>
        <Button
          variant="outline"
          className={cn("gap-1.5", st.savedToLibrary && "text-primary-text")}
          onClick={() => a.saveToLibrary(rollup)}
        >
          <Bookmark className="h-4 w-4" /> {st.savedToLibrary ? "Saved" : "Save"}
        </Button>
        <Button
          variant="outline"
          className={cn("gap-1.5", st.markedWinner && "text-primary-text")}
          onClick={() => a.markWinner(rollup)}
        >
          <Trophy className="h-4 w-4" /> {st.markedWinner ? "Winner" : "Mark Winner"}
        </Button>
        <Button variant="outline" className="gap-1.5" onClick={() => a.compare([rollup.creative.id])}>
          <GitCompareArrows className="h-4 w-4" /> Compare
        </Button>
        <Button
          variant="outline"
          className={cn("gap-1.5", st.duplicated && "text-primary-text")}
          onClick={() => a.duplicate(rollup)}
        >
          <Copy className="h-4 w-4" /> {st.duplicated ? "Duplicated" : "Duplicate"}
        </Button>
        <Button variant="outline" className="gap-1.5" onClick={() => a.editTargeting(rollup)}>
          <Target className="h-4 w-4" /> Edit targeting
        </Button>
        <Button
          variant="ghost"
          className="ml-auto gap-1.5 text-destructive hover:text-destructive"
          onClick={() => a.pause(rollup)}
          disabled={st.paused}
        >
          <Pause className="h-4 w-4" /> {st.paused ? "Paused" : "Pause"}
        </Button>
      </div>
    </div>
  );
}
