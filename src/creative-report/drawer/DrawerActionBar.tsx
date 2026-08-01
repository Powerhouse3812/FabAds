/**
 * DrawerActionBar — the creative loop's action buttons (handoff §5.2).
 * The full loop in one place: Generate variation → Genie · Relaunch · Save ·
 * Mark winner · Compare · Duplicate · Edit targeting · Pause. Reflects
 * optimistic state on the buttons.
 *
 * 1100px-overlay redesign: split into two `slot`s instead of one long pinned
 * row (§ ref-A puts its primary actions in the header, not a footer bar).
 * - `slot="primary"` — the core loop (Generate variation · Relaunch · Save ·
 *   Mark winner) — rendered inline in the overlay's header, next to the name.
 * - `slot="secondary"` — the less-frequent utility actions (Compare ·
 *   Duplicate · Edit targeting · Pause) — stay pinned at the bottom in a
 *   slimmer bar so the primary loop is never duplicated in two places.
 * No action was dropped — every button from the old single bar still exists,
 * just split by frequency of use instead of stacked in one row.
 */
import { Bookmark, Copy, GitCompareArrows, Pause, Rocket, Target, Trophy, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCreativeActions } from "@/creative-report/actions/useCreativeActions";
import { useCreativeAction } from "@/creative-report/actions/actionStore";
import { WhyDot } from "@/creative-report/components/WhyDot";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

export function DrawerActionBar({
  rollup,
  slot,
}: {
  rollup: CreativeRollup;
  slot: "primary" | "secondary";
}) {
  const a = useCreativeActions();
  const st = useCreativeAction(rollup.creative.id);

  if (slot === "primary") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button className="gap-1.5" onClick={() => a.generateVariation(rollup)}>
          <Wand2 className="h-4 w-4" /> Generate variation
        </Button>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => a.launch(rollup)}
            disabled={st.queuedInLaunch}
          >
            <Rocket className="h-4 w-4" /> {st.queuedInLaunch ? "Queued in Launch" : "Relaunch"}
          </Button>
          <WhyDot id="action.relaunch" />
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            className={cn("gap-1.5", st.savedToLibrary && "text-primary-text")}
            onClick={() => a.saveToLibrary(rollup)}
          >
            <Bookmark className="h-4 w-4" /> {st.savedToLibrary ? "Saved" : "Save"}
          </Button>
          <WhyDot id="action.save" />
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            className={cn("gap-1.5", st.markedWinner && "text-primary-text")}
            onClick={() => a.markWinner(rollup)}
          >
            <Trophy className="h-4 w-4" /> {st.markedWinner ? "Winner" : "Mark winner"}
          </Button>
          <WhyDot id="action.markWinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => a.compare([rollup.creative.id])}>
          <GitCompareArrows className="h-4 w-4" /> Compare
        </Button>
        <WhyDot id="action.compare" />
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-1.5", st.duplicated && "text-primary-text")}
          onClick={() => a.duplicate(rollup)}
        >
          <Copy className="h-4 w-4" /> {st.duplicated ? "Duplicated" : "Duplicate"}
        </Button>
        <WhyDot id="action.duplicate" />
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => a.editTargeting(rollup)}>
          <Target className="h-4 w-4" /> Edit targeting
        </Button>
        <WhyDot id="action.editTargeting" />
      </div>
      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-destructive hover:text-destructive"
          onClick={() => a.pause(rollup)}
          disabled={st.paused}
        >
          <Pause className="h-4 w-4" /> {st.paused ? "Paused" : "Pause"}
        </Button>
        <WhyDot id="action.pause" />
      </div>
    </div>
  );
}
