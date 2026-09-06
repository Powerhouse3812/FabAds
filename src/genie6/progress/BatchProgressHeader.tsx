import { RefreshCw, Wand2, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  batchDoneCount,
  batchStatus,
  type BatchStatus,
  type RetryScope,
  type RunBatch,
} from "../lib/genieRunTypes";
import { StageProgress } from "./StageProgress";
import { retryButtonCopy } from "./FailureNotice";
import { creditsForRetry } from "../lib/genieRunStore";

/**
 * BatchProgressHeader — the one batch-level header for Studio, Other Flows
 * and Other Apps (§18). Shows Batch ID = Job ID above the batch (§10, Mono
 * uppercase), the derived status + "19/20" count, stage-wise progress while
 * running, and — because a 30-40 minute render is an IA problem, not a
 * spinner problem (§21.2) — a one-line "you'll be notified, go to the
 * Library" affordance instead of asking the user to just watch the bar.
 */

const STATUS_META: Record<BatchStatus, { label: string; pillClass: string }> = {
  running: { label: "Rendering", pillClass: "border-primary/30 bg-primary/10 text-primary" },
  done: { label: "Done", pillClass: "border-primary/30 bg-primary/10 text-primary" },
  partial: {
    label: "Partial",
    pillClass: "border-warning-text/30 bg-warning-text/10 text-warning-text",
  },
  failed: { label: "Failed", pillClass: "border-destructive/30 bg-destructive/10 text-destructive" },
  cancelled: { label: "Cancelled", pillClass: "border-border bg-muted text-muted-foreground" },
};

/**
 * A batch has no single stageIndex/progress of its own — RunItem does.
 * This aggregates: the earliest stage among items still in flight (the
 * bottleneck — the batch isn't further along than its slowest member), an
 * overall completion percentage, and the longest remaining ETA among running
 * items (the batch lands when its slowest item does).
 */
function aggregateBatchProgress(batch: RunBatch) {
  const inFlight = batch.items.filter(
    (i) => i.status === "running" || i.status === "pending" || i.status === "cancelling",
  );
  if (inFlight.length === 0) {
    return { stageIndex: Math.max(batch.stages.length - 1, 0), progress: 100, etaSeconds: undefined as number | undefined };
  }
  const stageIndex = Math.min(...inFlight.map((i) => i.stageIndex));
  const totalItems = batch.items.length || 1;
  const doneWeight = batch.items.reduce((sum, i) => {
    if (i.status === "running") return sum + i.progress;
    if (i.status === "pending" || i.status === "cancelling") return sum;
    return sum + 100; // done / failed / cancelled are terminal for this item
  }, 0);
  const progress = doneWeight / totalItems;
  const etas = inFlight.map((i) => i.etaSeconds).filter((n): n is number => n != null);
  const etaSeconds = etas.length ? Math.max(...etas) : undefined;
  return { stageIndex, progress, etaSeconds };
}

export function BatchProgressHeader({
  batch,
  onRetry,
  onCancel,
}: {
  batch: RunBatch;
  onRetry?: (s: RetryScope) => void;
  onCancel?: () => void;
}) {
  const status = batchStatus(batch);
  const meta = STATUS_META[status];
  const doneCount = batchDoneCount(batch);
  const agg = aggregateBatchProgress(batch);
  const anyCancelling = batch.items.some((i) => i.status === "cancelling");
  // Heuristic for "long-running": unknown duration, or more than ~90s left.
  // Short batches (a handful of images) finish before this line is worth
  // showing; multi-minute video renders are exactly what it's for (§21.2).
  // §21.2's Library-first return path is only useful somewhere that ISN'T the
  // Library. Rendered there it read "head to the Library" to a user already
  // standing in it. Detect it from the path rather than adding a prop, so
  // every existing call site keeps working and none has to remember to opt out.
  const onLibrary = useLocation().pathname.startsWith("/iq/genie6/library");
  const isLongRunning =
    status === "running" &&
    !onLibrary &&
    (agg.etaSeconds == null || agg.etaSeconds > 90);

  const failed = batch.items.filter((i) => i.status === "failed");
  const showRetryRow = !!onRetry && (status === "failed" || status === "partial" || status === "cancelled");
  // Retry prices come from the store's per-item RATE, never from what the
  // items carry: a failed item was never charged (0), so summing item.credits
  // quoted "Retry all 1 failed (0 credits)" for a retry that then charged 2.
  const allFailedCredits = creditsForRetry(batch.batchId, "all-failed");
  const wholeBatchCredits = creditsForRetry(batch.batchId, "whole-batch");

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      {/* Batch ID = Job ID, displayed ABOVE the batch (§10) */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {batch.batchId}
          </span>
          <span className="truncate text-sm font-semibold text-foreground" title={batch.label}>
            {batch.label}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em]",
              meta.pillClass,
            )}
          >
            {meta.label}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">{doneCount}</span>
        </div>
      </div>

      {status === "running" ? (
        <StageProgress
          stages={batch.stages}
          stageIndex={agg.stageIndex}
          progress={agg.progress}
          etaSeconds={agg.etaSeconds}
        />
      ) : (
        <p className="text-[12px] text-muted-foreground">
          {status === "done" && `All ${batch.items.length} outputs are ready.`}
          {status === "partial" && `${doneCount} outputs are ready — the rest failed.`}
          {status === "failed" && "This batch didn't produce any outputs."}
          {status === "cancelled" && "Cancelled before it finished."}
        </p>
      )}

      {isLongRunning && (
        <p className="flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
          <Wand2 className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          This can take a while — we&rsquo;ll notify you the moment it lands. You can{" "}
          {/* react-router Link, NOT <a href>. A plain href is a full document
              load, which tears down the module-level genieRunStore and
              destroys every in-flight batch — so the one control offered to a
              user waiting on a 30-40 minute render would have cancelled it.
              §21.2 wants a Library-first RETURN path; a hard navigation is a
              one-way door. */}
          <Link
            to="/iq/genie6/library"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            head to the Library
          </Link>{" "}
          and come back to it.
        </p>
      )}

      {(onCancel || showRetryRow) && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {status === "running" &&
            onCancel &&
            (anyCancelling ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground" aria-hidden />
                Cancelling…
              </span>
            ) : (
              <Button type="button" size="sm" variant="outline" onClick={onCancel} className="rounded-full">
                <X className="h-3.5 w-3.5" aria-hidden />
                Cancel
              </Button>
            ))}

          {showRetryRow && failed.length > 0 && (
            <Button
              type="button"
              size="sm"
              variant="default"
              onClick={() => onRetry!("all-failed")}
              className="rounded-full"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              {retryButtonCopy("all-failed", { credits: allFailedCredits, failedCount: failed.length })}
            </Button>
          )}

          {showRetryRow && (
            <Button
              type="button"
              size="sm"
              variant={failed.length > 0 ? "outline" : "default"}
              onClick={() => onRetry!("whole-batch")}
              className="rounded-full"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              {retryButtonCopy("whole-batch", { credits: wholeBatchCredits })}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
