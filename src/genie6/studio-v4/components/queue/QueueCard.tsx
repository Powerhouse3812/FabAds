import { cn } from "@/lib/utils";
import { batchStatus, type RunBatch } from "@/genie6/lib/genieRunTypes";
import { QueueStatusPill } from "./QueueStatusPill";
import { QueueProgressBar } from "./QueueProgressBar";
import { batchConfigChips } from "./batchDisplay";

interface QueueCardProps {
  batch: RunBatch;
  active?: boolean;
  /** Visual density variant. `compact` for V1 dense strip; `comfortable` for V2 wider cards. */
  density?: "compact" | "comfortable";
  onClick?: () => void;
}

function formatTime(ms: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(new Date(ms))
    .toLowerCase()
    .replace(/\s/g, "");
}

/**
 * QueueCard — one batch tile in the horizontal queue strip.
 *
 * Composition (per Figma):
 *   - Top row: title (left) + timestamp (right)
 *   - Bottom row: chips (derived from `batch.config` — RunBatch carries no
 *     arbitrary tags) + "N generations" + status pill
 *
 * Active treatment uses the design-system "featured" lime border + tinted
 * surface — same visual language as the Library's featured cards. Density
 * picks between the V1 dense strip (compact: short height + 2 tags max) and
 * the V2 comfortable layout (taller + tag wrap allowed).
 */
export function QueueCard({ batch, active, density = "compact", onClick }: QueueCardProps) {
  const isCompact = density === "compact";
  const chips = batchConfigChips(batch);
  const visibleTags = isCompact ? chips.slice(0, 2) : chips;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "group relative flex shrink-0 flex-col gap-1.5 overflow-hidden rounded-xl border text-left transition-all",
        // Width per density
        isCompact ? "w-[260px] px-3 py-2" : "w-[300px] px-4 py-3",
        // Active vs inactive treatment
        active
          ? "border-primary bg-[#FEFFF0] shadow-sm"
          : "border-border bg-card hover:border-border/80 hover:bg-card/80",
        // Affordance
        "hover:-translate-y-0.5 hover:shadow-md",
      )}
    >
      {/* Top row — title + time */}
      <header className="flex items-baseline justify-between gap-2">
        <h3
          className={cn(
            "truncate font-sans font-semibold leading-tight text-foreground",
            isCompact ? "text-[13px]" : "text-[14px]",
          )}
        >
          {batch.label}
        </h3>
        <time
          dateTime={new Date(batch.createdAt).toISOString()}
          className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground"
        >
          {formatTime(batch.createdAt)}
        </time>
      </header>

      {/* Chips row — config-derived chips + status pill (count moved into progress bar) */}
      <div className="flex flex-wrap items-center gap-1">
        {visibleTags.map((t) => (
          <span
            key={t}
            className="inline-flex h-[18px] items-center rounded-full bg-muted/60 px-2 font-sans text-[10px] font-medium text-muted-foreground"
          >
            {t}
          </span>
        ))}
        <span className="ml-auto">
          <QueueStatusPill status={batchStatus(batch)} />
        </span>
      </div>

      {/* Progress bar — "N/M" count + lime fill. Inline density for the
          strip card so it doesn't add height. */}
      <QueueProgressBar batch={batch} size="inline" hideSpinner />
    </button>
  );
}
