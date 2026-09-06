import {
  Bell,
  Bookmark,
  Download,
  Edit3,
  FolderPlus,
  MoreHorizontal,
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
import { batchStatus, type RetryScope, type RunBatch } from "@/genie6/lib/genieRunTypes";
import { RetryModelPicker } from "./RetryModelPicker";

interface BatchActionsBarProps {
  batch: RunBatch;
  onEdit?: (batch: RunBatch) => void;
  onSaveAll?: (batch: RunBatch) => void;
  onLaunchAll?: (batch: RunBatch) => void;
  onSaveToBoard?: (batch: RunBatch) => void;
  onSaveToFolder?: (batch: RunBatch) => void;
  /**
   * §21.3's "retry with a different model" — the ONE retry scope this bar
   * still owns. "Retry all failed" / "Retry whole batch" and Cancel already
   * live on the Progress agent's `BatchProgressHeader` (credit-priced via
   * its own `retryButtonCopy()`), and "retry this ad only" lives inline per
   * item on `RunItemTile`/`FailureNotice` — duplicating either here would be
   * the "two systems" §18 warns against. What's genuinely missing from both:
   * neither offers a MODEL CHOICE before firing "different-model" (they call
   * onRetry("different-model") blind, with no opts.modelId) — Task 3 asks
   * for a picker, so that's what this bar adds.
   */
  onRetry?: (scope: RetryScope, opts?: { modelId?: string }) => void;
  /** From creditsForRetry(batchId, "different-model") — §15/§21.3 credit-consequence copy. */
  retryCredits?: number;
  /** §21.2 — "notification when the batch lands, a Library-first return
   *  path" for long renders. Does NOT cancel the run. BatchProgressHeader
   *  shows an equivalent link, but only once a batch is judged "long
   *  running" (>90s remaining) and via a plain `<a href>` that would hard-
   *  navigate and reset this prototype's in-memory run store — this button
   *  is the always-available, SPA-safe version. */
  onNotifyAndLeave?: () => void;
}

/**
 * BatchActionsBar — top action row in the V3 right pane (and the V1/V2 body,
 * above BatchDetailsAccordion). Always visible; scope = whole batch.
 *
 * The button set is conditioned on `batchStatus(batch)`:
 *   - running            → "We'll notify you — go to Library"
 *   - partial / failed / cancelled → "Retry — different model" (opens a
 *                           model picker; the credit-priced all-failed /
 *                           whole-batch buttons live on BatchProgressHeader)
 *   - done / partial     → Edit · Save all · Launch all · Save/download extras
 *
 * Every handler falls back to a `toast` stub when the caller doesn't wire
 * one, so the bar stays demoable before full wiring lands upstream.
 */
export function BatchActionsBar({
  batch,
  onEdit,
  onSaveAll,
  onLaunchAll,
  onSaveToBoard,
  onSaveToFolder,
  onRetry,
  retryCredits,
  onNotifyAndLeave,
}: BatchActionsBarProps) {
  const status = batchStatus(batch);
  const isRunning = status === "running";
  const isDone = status === "done";
  const isPartial = status === "partial";
  const isFailed = status === "failed";
  const isCancelled = status === "cancelled";
  const canOfferDifferentModel = isPartial || isFailed || isCancelled;
  // Save / Launch act on whatever finished outputs exist — available once
  // there's at least one done item, even mid-partial-batch.
  const canActOnOutputs = isDone || isPartial;

  const handle = (fn: ((b: RunBatch) => void) | undefined, fallbackLabel: string) => () => {
    if (fn) fn(batch);
    else toast(`${fallbackLabel} — ${batch.label}`);
  };

  const retryDifferentModel = (modelId: string) => {
    if (onRetry) onRetry("different-model", { modelId });
    else toast(`different-model — ${batch.label}`);
  };

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border/60 bg-background px-5 py-2">
      <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        Batch
      </span>

      {/* Running — notify-and-leave. §21.2 long-render IA fix: no
          spinner-watching, an explicit exit that keeps the run alive. */}
      {isRunning && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 text-[12px]"
          onClick={() => {
            if (onNotifyAndLeave) onNotifyAndLeave();
            else toast(`We'll notify you when ${batch.batchId} is done.`);
          }}
        >
          <Bell className="h-3 w-3" />
          We'll notify you — go to Library
        </Button>
      )}

      {/* §21.3 — the one retry scope that needs a picker before it can fire. */}
      {canOfferDifferentModel && (
        <RetryModelPicker
          excludeModelId={batch.config?.model}
          credits={retryCredits}
          onPick={retryDifferentModel}
        />
      )}

      {/* Done / partial — act on whatever finished. */}
      <Button
        size="sm"
        variant="outline"
        className="h-7 gap-1.5 text-[12px]"
        onClick={handle(onEdit, "Edit batch")}
        disabled={!canActOnOutputs && !isDone}
      >
        <Edit3 className="h-3 w-3" />
        Edit
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
            onClick={() => toast(`Download all — ${batch.label}`)}
            disabled={!canActOnOutputs}
          >
            <Download className="mr-2 h-3.5 w-3.5" />
            Download all
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => toast(`Add feedback — ${batch.label}`)}
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
