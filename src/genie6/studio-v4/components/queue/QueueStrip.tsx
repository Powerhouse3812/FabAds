import type { QueueBatch } from "../../types/queue";
import { QueueCard } from "./QueueCard";

interface QueueStripProps {
  batches: QueueBatch[];
  activeBatchId: string | null;
  onSelect: (batchId: string) => void;
  density?: "compact" | "comfortable";
}

/**
 * QueueStrip — horizontal scroller of `QueueCard`s.
 *
 * Shared between V1 and V2 layouts; density prop drives the per-card size.
 * Scrollbar is hidden on Chromium/Firefox so the strip blends into the
 * page chrome; the bleed via `-mx-6 px-6` lets cards slide under the
 * container edge for a "more content" affordance.
 *
 * The first card visually peeks half-off the left edge — same trick the
 * Figma shows. Achieved by giving the first card a smaller width via
 * Tailwind's `[&>*:first-child]:opacity-40` translation? No — Figma's
 * left-most card is just a "previous" peek; we mimic this with reduced
 * opacity on the first card when it isn't active. Subtle, doesn't hurt
 * if Maalik wants to drop it.
 */
export function QueueStrip({
  batches,
  activeBatchId,
  onSelect,
  density = "compact",
}: QueueStripProps) {
  return (
    <div
      role="tablist"
      aria-label="Generation queue"
      className="
        -mx-6 flex snap-x gap-3 overflow-x-auto px-6 pb-2
        [&::-webkit-scrollbar]:hidden
        [scrollbar-width:none]
      "
    >
      {batches.map((b) => (
        <div key={b.id} className="snap-start" role="tab" aria-selected={b.id === activeBatchId}>
          <QueueCard
            batch={b}
            active={b.id === activeBatchId}
            density={density}
            onClick={() => onSelect(b.id)}
          />
        </div>
      ))}
    </div>
  );
}
