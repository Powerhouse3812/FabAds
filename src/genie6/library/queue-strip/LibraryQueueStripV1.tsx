import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QueueBatch } from "@/genie6/studio-v4/types/queue";
import { QueueProgressBar } from "@/genie6/studio-v4/components/queue/QueueProgressBar";

interface LibraryQueueStripV1Props {
  batches: QueueBatch[];
}

function formatTime(d: Date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(d)
    .toLowerCase()
    .replace(/\s/g, "");
}

/**
 * LibraryQueueStripV1 — horizontal compact tiles, one per active batch.
 *
 * Lives at the top of the Library / Generations page, above the result
 * grid. Each tile is ~240px wide and 64px tall:
 *
 *   ┌────────────────────────────────────┐
 *   │ Festive bundle           ↗  2:35pm │  ← name + open-icon + time
 *   │ Awareness · Image Ad               │  ← 2 tag chips
 *   │ ▓▓▓▓▓▓▓▓░░░░░░░░ 5/8     ⟳         │  ← progress + count + spinner
 *   └────────────────────────────────────┘
 *
 * Clicking a tile navigates to /iq/genie6/studio-alpha?queue=v3&batch=<id>
 * so the user lands on the V3 results pane with that batch selected.
 *
 * Sleek + elegant per Maalik's spec — no shadows, hairline border, lime
 * accent only on the progress fill. Tiles scroll horizontally on
 * overflow with custom thin scrollbar; on smaller screens the strip
 * wraps to multi-row.
 */
export function LibraryQueueStripV1({ batches }: LibraryQueueStripV1Props) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        // Horizontal scroll with custom-styled thin scrollbar.
        "-mx-1 flex shrink-0 gap-2 overflow-x-auto px-1 py-1",
        "[scrollbar-width:thin]",
        "[&::-webkit-scrollbar]:h-1.5",
        "[&::-webkit-scrollbar-track]:rounded-full",
        "[&::-webkit-scrollbar-track]:bg-muted/40",
        "[&::-webkit-scrollbar-thumb]:rounded-full",
        "[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30",
      )}
      role="list"
      aria-label="Generation queue (horizontal tiles)"
    >
      {batches.map((batch) => (
        <button
          key={batch.id}
          type="button"
          onClick={() =>
            navigate(
              `/iq/genie6/studio-alpha/configure?queue=v3&batch=${batch.id}`,
            )
          }
          role="listitem"
          className={cn(
            "group relative flex w-[240px] shrink-0 flex-col gap-1.5 overflow-hidden rounded-xl",
            "border border-border bg-card px-3 py-2.5 text-left transition-all",
            "hover:-translate-y-px hover:border-primary/40 hover:shadow-sm",
          )}
        >
          {/* Top row — name + open icon + time */}
          <div className="flex items-center gap-2">
            <h3 className="min-w-0 flex-1 truncate font-sans text-[13px] font-semibold leading-tight text-foreground">
              {batch.title}
            </h3>
            <ArrowUpRight
              className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
              aria-hidden
            />
            <time
              dateTime={batch.submittedAt.toISOString()}
              className="shrink-0 font-mono text-[9.5px] tabular-nums text-muted-foreground"
            >
              {formatTime(batch.submittedAt)}
            </time>
          </div>

          {/* Tag chips — max 2, no count chip (count lives in the bar) */}
          {batch.tags.length > 0 && (
            <p className="truncate font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground">
              {batch.tags.slice(0, 2).join(" · ")}
            </p>
          )}

          {/* Progress — the hero of this tile */}
          <QueueProgressBar batch={batch} size="inline" />
        </button>
      ))}
    </div>
  );
}
