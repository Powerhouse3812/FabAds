import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { batchStatus, batchDoneCount, type RunBatch } from "@/genie6/lib/genieRunTypes";

interface QueueProgressBarProps {
  batch: RunBatch;
  /**
   * Visual density. `inline` is a 24px-tall row with count chip + 4px bar
   * (Library V2 list, V3 list rows, Studio queue cards). `stacked` is a
   * 2-line variant with the count above a 6px bar (Library V1 tiles,
   * BatchDetailsAccordion). Both share the same color logic.
   */
  size?: "inline" | "stacked";
  /** When true, hides the count chip — bar-only minimalism. Rarely useful. */
  hideCount?: boolean;
  /** Suppress the loading spinner on the running state. */
  hideSpinner?: boolean;
  className?: string;
}

/**
 * QueueProgressBar — compact "N/M done" glance bar for list rows and card
 * tiles (QueueCard, QueueListV3, BatchDetailsAccordion's closed header).
 *
 * NOTE on §18 scope: this is deliberately a plain completion-fraction bar —
 * no stage names, no ETA claim, no failure copy — so it does not compete
 * with the real stage-wise progress + failure pattern. That pattern (with
 * an updating ETA and inline Retry) lives in the Progress agent's
 * `StageProgress` / `BatchProgressHeader` / `RunItemTile` / `FailureNotice`,
 * used for the ACTIVE batch's actual detail view. This bar is the "how far
 * along is this OTHER row in the list" glance widget, the same role
 * Library's queue-strip mini-bars play — not a second progress system.
 */
export function QueueProgressBar({
  batch,
  size = "inline",
  hideCount = false,
  hideSpinner = false,
  className,
}: QueueProgressBarProps) {
  const total = batch.items.length;
  const completed = batch.items.filter((i) => i.status === "done").length;
  const pct = total > 0 ? Math.min(100, (completed / total) * 100) : 0;

  const status = batchStatus(batch);
  const isRunning = status === "running";
  const isFailed = status === "failed";
  const isPartial = status === "partial";
  const isDone = status === "done";
  const isCancelled = status === "cancelled";

  const countColor = cn(
    "font-mono tabular-nums tracking-tight",
    size === "inline" ? "text-[10.5px]" : "text-[11px] font-semibold",
    isDone && "text-primary",
    isRunning && "text-foreground",
    isPartial && "text-warning-text",
    isCancelled && "text-muted-foreground",
    isFailed && "text-destructive",
  );

  const fillColor = cn(
    "h-full rounded-full transition-[width] duration-500 ease-out",
    isFailed
      ? "bg-destructive"
      : isPartial
        ? "bg-warning-text"
        : isCancelled
          ? "bg-muted-foreground/40"
          : "bg-primary",
  );

  const trackColor = cn(
    "relative w-full overflow-hidden rounded-full",
    size === "inline" ? "h-1" : "h-1.5",
    "bg-foreground/[0.08]",
  );

  const count = batchDoneCount(batch);

  if (size === "stacked") {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        {!hideCount && (
          <div className="flex items-center justify-between gap-2">
            <span className={countColor}>{count}</span>
            <StatusLabel status={status} hideSpinner={hideSpinner} />
          </div>
        )}
        <div className={trackColor}>
          <div className={fillColor} style={{ width: `${pct}%` }} aria-hidden />
          {isRunning && <ShimmerOverlay />}
        </div>
      </div>
    );
  }

  // inline
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {!hideCount && <span className={cn(countColor, "shrink-0")}>{count}</span>}
      <div className={trackColor}>
        <div className={fillColor} style={{ width: `${pct}%` }} aria-hidden />
        {isRunning && <ShimmerOverlay />}
      </div>
      {isRunning && !hideSpinner && (
        <Loader2 className="h-3 w-3 shrink-0 animate-spin text-primary" aria-hidden />
      )}
    </div>
  );
}

/**
 * Animated shimmer over the lime fill while running — same grammar as
 * shadcn Skeleton, but constrained to the filled portion only.
 */
function ShimmerOverlay() {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0",
        "bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.40)_50%,transparent_100%)]",
        "bg-[length:200%_100%] animate-v3-shimmer",
      )}
    />
  );
}

function StatusLabel({
  status,
  hideSpinner,
}: {
  status: ReturnType<typeof batchStatus>;
  hideSpinner: boolean;
}) {
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-wider text-primary">
        {!hideSpinner && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
        Generating
      </span>
    );
  }
  if (status === "partial") {
    return (
      <span className="font-mono text-[9.5px] uppercase tracking-wider text-warning-text">
        Partial
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="font-mono text-[9.5px] uppercase tracking-wider text-destructive">
        Failed
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span className="font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground">
        Cancelled
      </span>
    );
  }
  return (
    <span className="font-mono text-[9.5px] uppercase tracking-wider text-primary">Done</span>
  );
}
