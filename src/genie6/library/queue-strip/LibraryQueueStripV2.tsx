import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveCompleted, type QueueBatch } from "@/genie6/studio-v4/types/queue";

interface LibraryQueueStripV2Props {
  batches: QueueBatch[];
}

/**
 * LibraryQueueStripV2 — "Pills" variant. Inline horizontal pills, one
 * per active batch, all visible at once, single line, ~28px tall.
 *
 * Maalik A-12.187 brief: ultra-minimal — no progress bar, just the
 * numeric "N/M" and a tiny status dot. Overflow scrolls horizontally
 * with a hairline scrollbar so the strip never wraps to multiple rows.
 *
 *   ┌────────────────────────────────────────────────────────────────────┐
 *   │ IN QUEUE   • Festive 5/8  • Republic Day 18/50  • Winter 0/10  →  │
 *   └────────────────────────────────────────────────────────────────────┘
 *
 * Best for 1-5 active batches (all visible without scroll). Beyond
 * that the horizontal scroll handles it gracefully. Each pill click
 * deep-links into V3 with that batch selected.
 *
 * No rotation, no auto-cycle — every batch is glanceable simultaneously.
 * Use V1 (Marquee) when the queue is bigger and you want focus.
 */
export function LibraryQueueStripV2({ batches }: LibraryQueueStripV2Props) {
  const navigate = useNavigate();

  return (
    <div
      data-fabads-queue-pills
      className={cn(
        "flex h-8 shrink-0 items-center gap-2 overflow-x-auto rounded-full border border-border bg-card pl-3 pr-2",
        // Custom thin scrollbar so overflow doesn't add visual weight.
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
      )}
    >
      {/* Eyebrow — fixed-left, mono caps */}
      <span className="shrink-0 font-mono text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        In queue
      </span>
      <span aria-hidden className="h-3 w-px shrink-0 bg-border" />

      {batches.map((batch) => {
        const completed = resolveCompleted(batch);
        const total = batch.generationCount;
        const isGenerating = batch.status === "generating";
        const isQueued = batch.status === "queued";
        const isFailed = batch.status === "failed";

        return (
          <button
            key={batch.id}
            type="button"
            onClick={() =>
              navigate(
                `/iq/genie6/studio-alpha/configure?queue=v3&batch=${batch.id}`,
              )
            }
            aria-label={`Open ${batch.title} (${completed}/${total})`}
            title={`${batch.title} · ${completed}/${total}`}
            className={cn(
              "group flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2 text-[11px]",
              "border border-transparent text-foreground/85 transition-colors",
              "hover:border-primary/30 hover:bg-primary/[0.06] hover:text-foreground",
              isFailed && "text-destructive",
              isQueued && "text-muted-foreground",
            )}
          >
            {/* Status dot — color-coded, animated for generating */}
            <span aria-hidden className="relative inline-flex h-1.5 w-1.5 shrink-0">
              {isGenerating && (
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
              )}
              <span
                className={cn(
                  "relative inline-block h-1.5 w-1.5 rounded-full",
                  isGenerating && "bg-primary",
                  isQueued && "bg-muted-foreground/60",
                  isFailed && "bg-destructive",
                  !isGenerating && !isQueued && !isFailed && "bg-primary/60",
                )}
              />
            </span>

            <span className="max-w-[140px] truncate font-sans font-medium">
              {batch.title}
            </span>

            <span className="shrink-0 font-mono tabular-nums">
              {completed}/{total}
            </span>

            {isGenerating && (
              <Loader2
                className="h-2.5 w-2.5 shrink-0 animate-spin text-primary"
                aria-hidden
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
