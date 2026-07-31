/**
 * BulkActionBar — appears when creatives are selected in the grid. Bulk
 * Pause (friction: a quick confirm) or Launch (optimistic queue). Floats above
 * the grid so it's reachable without scrolling.
 */
import { Pause, Rocket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { pauseMany, queueManyInLaunch } from "@/creative-report/actions/actionStore";
import { pluralize } from "@/creative-report/lib/format";

export function BulkActionBar({
  selectedIds,
  onClear,
}: {
  selectedIds: string[];
  onClear: () => void;
}) {
  if (selectedIds.length === 0) return null;

  const doPause = () => {
    pauseMany(selectedIds);
    toast({ title: `Paused ${pluralize(selectedIds.length, "creative")}`, description: "Simulated bulk pause." });
    onClear();
  };
  const doLaunch = () => {
    queueManyInLaunch(selectedIds);
    toast({
      title: `Queued ${pluralize(selectedIds.length, "creative")} in Launch`,
      description: "Sent to Launch 2.0 (simulated).",
    });
    onClear();
  };

  return (
    <div className="sticky bottom-4 z-20 mx-auto flex w-fit items-center gap-3 rounded-full border border-border bg-card px-3 py-2 shadow-lg">
      <span className="pl-1 text-sm font-medium text-foreground">
        {pluralize(selectedIds.length, "creative")} selected
      </span>
      <div className="h-4 w-px bg-border" />
      <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={doPause}>
        <Pause className="h-4 w-4" /> Pause
      </Button>
      <Button size="sm" className="h-8 gap-1.5" onClick={doLaunch}>
        <Rocket className="h-4 w-4" /> Launch
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClear} aria-label="Clear selection">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
