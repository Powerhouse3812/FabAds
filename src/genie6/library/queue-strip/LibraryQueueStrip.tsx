import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Play, Rows3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { queueBatches } from "@/genie6/studio-v4/mocks/queue-batches";
import type { QueueBatch } from "@/genie6/studio-v4/types/queue";
import { LibraryQueueStripV1 } from "./LibraryQueueStripV1";
import { LibraryQueueStripV2 } from "./LibraryQueueStripV2";

type LibraryQueueVariant = "v1" | "v2";

/**
 * LibraryQueueStrip — wrapper that mounts at the top of the Library /
 * Generations page. Shows only ACTIVE batches (generating + queued +
 * failed); ready batches are already in the grid below so they don't
 * need a duplicate progress row.
 *
 * Two ultra-minimal layouts (Maalik A-12.187 — "minimal space, no
 * progress bar, just the number"), switchable via URL `?qstrip=v1|v2`:
 *   - V1 (Marquee) — single batch visible, auto-cycles every 4s,
 *                    hover pauses, ~28px tall pill row.
 *   - V2 (Pills)   — all batches as numeric pills inline, single-row,
 *                    horizontal scroll on overflow, ~28px tall.
 *
 * Both pull rotation / count math from the same QueueBatch type. The
 * toggle pill is inline-right of the strip so the entire surface fits
 * in one 32px row — no separate header eating vertical space.
 *
 * Hidden entirely when zero active batches — never eats space for nothing.
 */
export function LibraryQueueStrip() {
  const [searchParams, setSearchParams] = useSearchParams();
  const variant: LibraryQueueVariant =
    searchParams.get("qstrip") === "v2" ? "v2" : "v1";

  const setVariant = useCallback(
    (next: LibraryQueueVariant) => {
      // A-12.189: switched from replace:true to push (default) — the
      // previous replace was making the variant change invisible in the
      // address bar AND skipping a re-render in some Vercel SPA setups.
      // Push: URL changes visibly, back-button restores the previous
      // variant (acceptable since the toggle is meaningful UI state).
      setSearchParams((prev) => {
        const sp = new URLSearchParams(prev);
        if (next === "v1") sp.delete("qstrip");
        else sp.set("qstrip", next);
        return sp;
      });
    },
    [setSearchParams],
  );

  // Only show batches that are NOT fully done. Ready batches live in the
  // grid below — adding them here would duplicate the same surface.
  const active: QueueBatch[] = useMemo(
    () =>
      queueBatches.filter(
        (b) =>
          b.status === "generating" ||
          b.status === "queued" ||
          b.status === "failed",
      ),
    [],
  );

  // Empty: hide the entire strip (header included). No "empty queue"
  // placeholder — the Library grid below is the substantive content.
  if (active.length === 0) return null;

  return (
    <section
      data-fabads-library-queue-strip={variant}
      className="flex shrink-0 items-center gap-2"
      aria-label="Generation queue"
    >
      {/* Variant component owns the visible chrome (eyebrow, count
          chip, etc.) — wrapper just lays the toggle pill next to it
          so the entire surface is one ~32px row. No separate header
          eating vertical space. */}
      <div className="min-w-0 flex-1">
        {variant === "v1" ? (
          <LibraryQueueStripV1 batches={active} />
        ) : (
          <LibraryQueueStripV2 batches={active} />
        )}
      </div>
      <StripVariantToggle active={variant} onSwitch={setVariant} />
    </section>
  );
}

/**
 * Local toggle pill — minimal icon-only since the strip header is
 * already tight. Hover reveals labels via title attribute. URL-backed
 * via the parent's setVariant.
 */
function StripVariantToggle({
  active,
  onSwitch,
}: {
  active: LibraryQueueVariant;
  onSwitch: (next: LibraryQueueVariant) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Queue strip layout"
      className="inline-flex items-center gap-0.5 rounded-full border border-border bg-muted/40 p-0.5"
    >
      <StripTab
        target="v1"
        active={active}
        Icon={Play}
        label="Marquee"
        onSwitch={onSwitch}
      />
      <StripTab
        target="v2"
        active={active}
        Icon={Rows3}
        label="Pills"
        onSwitch={onSwitch}
      />
    </div>
  );
}

function StripTab({
  target,
  active,
  Icon,
  label,
  onSwitch,
}: {
  target: LibraryQueueVariant;
  active: LibraryQueueVariant;
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  onSwitch: (next: LibraryQueueVariant) => void;
}) {
  const isActive = active === target;
  return (
    <button
      type="button"
      // A-12.189: always fire onSwitch on click — the previous
      // `if (!isActive) onSwitch(target)` guard was harmless logically
      // but defensive enough that if `active` was ever stale (e.g. from
      // a parent memo / context that hadn't re-derived), the click
      // silently became a no-op. The parent's setVariant already
      // short-circuits the URL write when target === current, so this
      // is safe to call unconditionally.
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSwitch(target);
      }}
      aria-pressed={isActive}
      title={`Queue strip · ${label}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 font-mono text-[9.5px] uppercase tracking-wider transition-colors",
        "cursor-pointer", // explicit pointer for the tablist
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{label}</span>
    </button>
  );
}
