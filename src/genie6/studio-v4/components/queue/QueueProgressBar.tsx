import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveCompleted, type QueueBatch, type QueueStatus } from "../../types/queue";

interface QueueProgressBarProps {
  batch: QueueBatch;
  /**
   * Visual density. `inline` is a 24px-tall row with count chip + 4px bar
   * (Library V2 list, V3 list rows, Studio queue cards). `stacked` is a
   * 2-line variant with the count above a 6px bar (Library V1 tiles,
   * BatchDetailsAccordion). Both share the same color logic.
   */
  size?: "inline" | "stacked";
  /** When true, hides the count chip — bar-only minimalism. Rarely useful. */
  hideCount?: boolean;
  /** Suppress the loading spinner on generating state. */
  hideSpinner?: boolean;
  className?: string;
}

/**
 * QueueProgressBar — single source of truth for "N/M variations" + the
 * thin progress fill across every queue surface in the app.
 *
 * Status → visual mapping:
 *   - queued     → empty bar, muted count, no spinner
 *   - generating → lime fill at completed/total, animated shimmer overlay,
 *                  inline Loader2 spinner next to the count
 *   - ready      → solid lime fill at 100%, no spinner, count in lime
 *   - failed     → red fill at whatever count was reached, no spinner,
 *                  count in destructive color
 *
 * The component reads `batch.completedCount` (with a `resolveCompleted`
 * fallback for legacy batches missing the field), so callers just pass
 * the whole batch — no math at the call site.
 */
export function QueueProgressBar({
  batch,
  size = "inline",
  hideCount = false,
  hideSpinner = false,
  className,
}: QueueProgressBarProps) {
  const completed = resolveCompleted(batch);
  const total = batch.generationCount;
  const pct = total > 0 ? Math.min(100, (completed / total) * 100) : 0;

  const status = batch.status;
  const isGenerating = status === "generating";
  const isFailed = status === "failed";
  const isReady = status === "ready";
  const isQueued = status === "queued";

  // Count chip color follows status. Lime for ready/generating, muted
  // for queued, destructive for failed.
  const countColor = cn(
    "font-mono tabular-nums tracking-tight",
    size === "inline" ? "text-[10.5px]" : "text-[11px] font-semibold",
    isReady && "text-primary",
    isGenerating && "text-foreground",
    isQueued && "text-muted-foreground",
    isFailed && "text-destructive",
  );

  // Fill color
  const fillColor = cn(
    "h-full rounded-full transition-[width] duration-500 ease-out",
    isFailed
      ? "bg-destructive"
      : isQueued
        ? "bg-muted-foreground/40"
        : "bg-primary",
  );

  // Track color — lighter for queued so the empty state still reads.
  const trackColor = cn(
    "relative w-full overflow-hidden rounded-full",
    size === "inline" ? "h-1" : "h-1.5",
    "bg-foreground/[0.08]",
  );

  if (size === "stacked") {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        {!hideCount && (
          <div className="flex items-center justify-between gap-2">
            <span className={countColor}>
              {completed}/{total}
            </span>
            <StatusLabel status={status} hideSpinner={hideSpinner} />
          </div>
        )}
        <div className={trackColor}>
          <div
            className={fillColor}
            style={{ width: `${pct}%` }}
            aria-hidden
          />
          {isGenerating && <ShimmerOverlay />}
        </div>
      </div>
    );
  }

  // inline
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {!hideCount && (
        <span className={cn(countColor, "shrink-0")}>
          {completed}/{total}
        </span>
      )}
      <div className={trackColor}>
        <div className={fillColor} style={{ width: `${pct}%` }} aria-hidden />
        {isGenerating && <ShimmerOverlay />}
      </div>
      {isGenerating && !hideSpinner && (
        <Loader2
          className="h-3 w-3 shrink-0 animate-spin text-primary"
          aria-hidden
        />
      )}
    </div>
  );
}

/**
 * Animated shimmer over the lime fill while generating — same grammar as
 * shadcn Skeleton, but constrained to the filled portion only.
 */
function ShimmerOverlay() {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0",
        // Reuse the existing v3-shimmer keyframe from tailwind.config.ts
        // (already used across Studio v3 / Genie 6 surfaces) so we don't
        // introduce a one-off keyframe just for the progress bar.
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
  status: QueueStatus;
  hideSpinner: boolean;
}) {
  if (status === "generating") {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-wider text-primary">
        {!hideSpinner && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
        Generating
      </span>
    );
  }
  if (status === "queued") {
    return (
      <span className="font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground">
        Queued
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
  // ready
  return (
    <span className="font-mono text-[9.5px] uppercase tracking-wider text-primary">
      Done
    </span>
  );
}
