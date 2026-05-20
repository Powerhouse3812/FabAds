import {
  Bookmark,
  Download,
  Edit3,
  FolderPlus,
  MoreHorizontal,
  RefreshCw,
  Rocket,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { QueueBatch } from "../../types/queue";

interface BatchActionsBarProps {
  batch: QueueBatch;
  onEdit?: (batch: QueueBatch) => void;
  onRegenerateAll?: (batch: QueueBatch) => void;
  onSaveAll?: (batch: QueueBatch) => void;
  onLaunchAll?: (batch: QueueBatch) => void;
  onSaveToBoard?: (batch: QueueBatch) => void;
  onSaveToFolder?: (batch: QueueBatch) => void;
}

/**
 * BatchActionsBar — top action row in the V3 right pane. Always visible,
 * scope = whole batch. Lives ABOVE BatchDetailsAccordion so the actions
 * are reachable without expanding the accordion.
 *
 * Six primary actions per Maalik's V3 spec:
 *   Edit · Regenerate All · Save All · Launch All · Save to Board · Save to Folder
 *
 * The first four are visible inline; the last two collapse into the
 * ellipsis menu on narrower viewports along with secondary actions
 * (Download all · Export CSV · Add feedback). At 1024px+ all six can fit
 * inline, but the ellipsis still carries the extras.
 *
 * Disabled when batch.status !== "ready" — there's nothing actionable
 * on a `queued` or `generating` batch. `failed` keeps "Regenerate All"
 * enabled (retry path) but disables the rest.
 *
 * Defaults: every handler falls back to a `toast` stub so the bar is
 * visually demoable before the real wiring lands.
 */
export function BatchActionsBar({
  batch,
  onEdit,
  onRegenerateAll,
  onSaveAll,
  onLaunchAll,
  onSaveToBoard,
  onSaveToFolder,
}: BatchActionsBarProps) {
  const isReady = batch.status === "ready";
  const isFailed = batch.status === "failed";
  // "Regenerate" makes sense when the batch is ready OR failed (retry).
  const canRegenerate = isReady || isFailed;
  // Save / Launch / Save-to-* only make sense on ready batches.
  const canActOnOutputs = isReady;

  const handle = <T extends QueueBatch>(
    fn: ((b: T) => void) | undefined,
    fallbackLabel: string,
  ) => () => {
    if (fn) fn(batch as T);
    else toast(`${fallbackLabel} — ${batch.title}`);
  };

  return (
    <div className="flex shrink-0 items-center gap-1.5 border-b border-border/60 bg-background px-5 py-2">
      <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        Batch
      </span>

      <Button
        size="sm"
        variant="outline"
        className="h-7 gap-1.5 text-[12px]"
        onClick={handle(onEdit, "Edit batch")}
        disabled={!isReady}
      >
        <Edit3 className="h-3 w-3" />
        Edit
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="h-7 gap-1.5 text-[12px]"
        onClick={handle(onRegenerateAll, "Regenerate all")}
        disabled={!canRegenerate}
      >
        <RefreshCw className="h-3 w-3" />
        Regenerate all
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="h-7 gap-1.5 text-[12px]"
        onClick={handle(onSaveAll, "Save all")}
        disabled={!canActOnOutputs}
      >
        <Bookmark className="h-3 w-3" />
        Save all
      </Button>

      <Button
        size="sm"
        className="h-7 gap-1.5 text-[12px]"
        onClick={handle(onLaunchAll, "Launch all")}
        disabled={!canActOnOutputs}
      >
        <Rocket className="h-3 w-3" />
        Launch all
      </Button>

      {/* Save-to-* lives in the ellipsis on narrower viewports.
          At lg+ both are inline. */}
      <Button
        size="sm"
        variant="ghost"
        className="hidden h-7 gap-1.5 text-[12px] lg:inline-flex"
        onClick={handle(onSaveToBoard, "Save to board")}
        disabled={!canActOnOutputs}
      >
        <Bookmark className="h-3 w-3" />
        Save to board
      </Button>

      <Button
        size="sm"
        variant="ghost"
        className="hidden h-7 gap-1.5 text-[12px] lg:inline-flex"
        onClick={handle(onSaveToFolder, "Save to folder")}
        disabled={!canActOnOutputs}
      >
        <FolderPlus className="h-3 w-3" />
        Save to folder
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto h-7 w-7 p-0"
            aria-label="More batch actions"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[180px]">
          {/* On narrow viewports, surface Save-to-board + Save-to-folder
              here so the bar collapses cleanly. Hidden on lg+ where the
              inline buttons own them. */}
          <DropdownMenuItem
            onClick={handle(onSaveToBoard, "Save to board")}
            disabled={!canActOnOutputs}
            className="lg:hidden"
          >
            <Bookmark className="mr-2 h-3.5 w-3.5" />
            Save to board
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handle(onSaveToFolder, "Save to folder")}
            disabled={!canActOnOutputs}
            className="lg:hidden"
          >
            <FolderPlus className="mr-2 h-3.5 w-3.5" />
            Save to folder
          </DropdownMenuItem>
          <DropdownMenuSeparator className="lg:hidden" />

          <DropdownMenuItem
            onClick={() => toast(`Download all — ${batch.title}`)}
            disabled={!canActOnOutputs}
          >
            <Download className="mr-2 h-3.5 w-3.5" />
            Download all
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => toast(`Add feedback — ${batch.title}`)}
            disabled={!canActOnOutputs}
          >
            <Edit3 className="mr-2 h-3.5 w-3.5" />
            Add batch feedback
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
