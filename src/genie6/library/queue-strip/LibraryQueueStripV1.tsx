import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveCompleted, type QueueBatch } from "@/genie6/studio-v4/types/queue";

interface LibraryQueueStripV1Props {
  batches: QueueBatch[];
}

const ROTATE_MS = 4000;

/**
 * LibraryQueueStripV1 — "Marquee" variant. Single-line, ultra-compact.
 *
 * Maalik A-12.187 brief: previous tile layout (240×64 cards in a horizontal
 * scroll) was eating too much vertical space on the Library page for
 * something most users glance at, not act on. New shape:
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ IN QUEUE · 3 ACTIVE   ›   Festive bundle  5/8 ⟳   ↗   2/3    │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * One row, ~28px tall. Eyebrow + currently-spotlit batch + position
 * counter. Cycles through active batches every 4s. Hover anywhere on
 * the strip pauses rotation. Clicking the spotlit chip deep-links into
 * V3 with that batch active.
 *
 * No progress bar — just the numeric "5/8" + a tiny lime dot for
 * generating (animated via Loader2). The bar lives on the V3 surface
 * itself; here we only need the headline number.
 */
export function LibraryQueueStripV1({ batches }: LibraryQueueStripV1Props) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Reset index when batches array shrinks (e.g. one finished and got
  // filtered out). Keeps the spotlight from pointing past the end.
  useEffect(() => {
    if (index >= batches.length) setIndex(0);
  }, [batches.length, index]);

  // Rotate every ROTATE_MS unless paused or only one batch.
  useEffect(() => {
    if (paused) return;
    if (batches.length <= 1) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % batches.length);
    }, ROTATE_MS);
    return () => window.clearInterval(t);
  }, [paused, batches.length]);

  const current = useMemo(
    () => batches[Math.min(index, batches.length - 1)],
    [batches, index],
  );

  if (!current) return null;

  const completed = resolveCompleted(current);
  const total = current.generationCount;
  const isGenerating = current.status === "generating";
  const isQueued = current.status === "queued";
  const isFailed = current.status === "failed";

  return (
    <div
      data-fabads-queue-marquee
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={cn(
        "flex h-8 shrink-0 items-center gap-3 rounded-full border border-border bg-card px-3",
        "text-[12px]",
      )}
    >
      {/* Eyebrow — fixed-left, mono caps, never changes */}
      <span className="font-mono text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        In queue
      </span>
      <span aria-hidden className="h-3 w-px shrink-0 bg-border" />

      {/* Spotlit chip — animates in on rotation. Whole element clickable. */}
      <button
        type="button"
        onClick={() =>
          navigate(
            `/iq/genie6/studio-alpha/configure?queue=v3&batch=${current.id}`,
          )
        }
        aria-label={`Open ${current.title} in queue`}
        className={cn(
          "group flex min-w-0 flex-1 items-center gap-2 text-left transition-opacity",
          "hover:opacity-100",
        )}
        // Animation key ties the chip identity to the batch id; React
        // remounts when the spotlight changes which lets us fade-in.
        key={current.id}
      >
        {/* Status dot — color-coded, animated for generating */}
        <span aria-hidden className="relative inline-flex h-2 w-2 shrink-0">
          {isGenerating && (
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
          )}
          <span
            className={cn(
              "relative inline-block h-2 w-2 rounded-full",
              isGenerating && "bg-primary",
              isQueued && "bg-muted-foreground/60",
              isFailed && "bg-destructive",
              !isGenerating && !isQueued && !isFailed && "bg-primary/60",
            )}
          />
        </span>

        <span className="min-w-0 truncate font-sans font-medium text-foreground">
          {current.title}
        </span>

        <span
          className={cn(
            "shrink-0 font-mono tabular-nums",
            isFailed
              ? "text-destructive"
              : isQueued
                ? "text-muted-foreground"
                : "text-foreground/85",
          )}
        >
          {completed}/{total}
        </span>

        {isGenerating && (
          <Loader2
            className="h-3 w-3 shrink-0 animate-spin text-primary"
            aria-hidden
          />
        )}

        <ArrowUpRight
          className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden
        />
      </button>

      {/* Position counter — shows where we are in the rotation. Doubles
          as a manual nav: click increments. */}
      {batches.length > 1 && (
        <button
          type="button"
          onClick={() => setIndex((i) => (i + 1) % batches.length)}
          aria-label="Next batch in queue marquee"
          className={cn(
            "shrink-0 rounded px-1.5 py-0.5 font-mono text-[9.5px] tabular-nums text-muted-foreground",
            "transition-colors hover:bg-muted/60 hover:text-foreground",
          )}
        >
          {(index % batches.length) + 1}/{batches.length}
        </button>
      )}
    </div>
  );
}
