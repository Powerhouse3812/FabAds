import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QueueBatch } from "@/genie6/studio-v4/types/queue";
import { QueueProgressBar } from "@/genie6/studio-v4/components/queue/QueueProgressBar";

interface LibraryQueueStripV2Props {
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
 * LibraryQueueStripV2 — vertical compact list, one row per active batch.
 *
 * Lives at the top of the Library / Generations page. Each row is a
 * single line (32px tall) with all signals inline:
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ Festive bundle   Awareness · Image Ad   ▓▓▓░░ 5/8 ⟳   2:35pm│
 *   └──────────────────────────────────────────────────────────────┘
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ Winter skincare  Performance · UGC     ░░░░░ 0/10    2:38pm│
 *   └──────────────────────────────────────────────────────────────┘
 *
 * Why a separate variant: V1's tile shape works when you have 3-6 batches
 * and a wide screen. V2's row shape scales to 20+ active batches without
 * horizontal scroll AND reads as more "ops dashboard" than "marketing
 * banner." Both ship; toggle lets the user pick.
 *
 * Clicking a row deep-links into V3 with the batch selected.
 */
export function LibraryQueueStripV2({ batches }: LibraryQueueStripV2Props) {
  const navigate = useNavigate();

  return (
    <div
      className="flex shrink-0 flex-col gap-1"
      role="list"
      aria-label="Generation queue (vertical rows)"
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
            "group relative flex items-center gap-4 rounded-lg border border-border bg-card",
            "px-3 py-2 text-left transition-all",
            "hover:border-primary/40 hover:bg-card/80",
          )}
        >
          {/* Name — flex 0, min-width caps so progress bar always has room */}
          <h3 className="min-w-[120px] max-w-[200px] shrink-0 truncate font-sans text-[12.5px] font-semibold leading-tight text-foreground">
            {batch.title}
          </h3>

          {/* Tag chips — second column, also fixed-width-ish */}
          {batch.tags.length > 0 && (
            <p className="hidden min-w-[140px] shrink-0 truncate font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground sm:block">
              {batch.tags.slice(0, 2).join(" · ")}
            </p>
          )}

          {/* Progress bar — flex-1, takes remaining horizontal space */}
          <div className="min-w-0 flex-1">
            <QueueProgressBar batch={batch} size="inline" />
          </div>

          {/* Time + open hint */}
          <time
            dateTime={batch.submittedAt.toISOString()}
            className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground"
          >
            {formatTime(batch.submittedAt)}
          </time>
          <ArrowUpRight
            className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden
          />
        </button>
      ))}
    </div>
  );
}
