import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { LayoutGrid, List } from "lucide-react";
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
 * Two layouts, switchable via URL `?qstrip=v1|v2`:
 *   - V1 (Tiles)  — horizontal compact tiles, 240×64. Best at 3-6 batches.
 *   - V2 (Rows)   — vertical compact rows, single-line each. Scales to 20+.
 *
 * Toggle pill matches the Studio Step 5 VariantToggle pattern. The whole
 * strip is hidden entirely when there are zero active batches — never
 * eats space when not useful.
 */
export function LibraryQueueStrip() {
  const [searchParams, setSearchParams] = useSearchParams();
  const variant: LibraryQueueVariant =
    searchParams.get("qstrip") === "v2" ? "v2" : "v1";

  const setVariant = useCallback(
    (next: LibraryQueueVariant) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (next === "v1") sp.delete("qstrip");
          else sp.set("qstrip", next);
          return sp;
        },
        { replace: true },
      );
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
      className="flex flex-col gap-2"
      aria-label="Generation queue"
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h2 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            In the queue
          </h2>
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground/70">
            {active.length} active
          </span>
        </div>
        <StripVariantToggle active={variant} onSwitch={setVariant} />
      </header>

      {variant === "v1" ? (
        <LibraryQueueStripV1 batches={active} />
      ) : (
        <LibraryQueueStripV2 batches={active} />
      )}
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
        Icon={LayoutGrid}
        label="Tiles"
        onSwitch={onSwitch}
      />
      <StripTab
        target="v2"
        active={active}
        Icon={List}
        label="Rows"
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
      onClick={() => {
        if (!isActive) onSwitch(target);
      }}
      aria-pressed={isActive}
      title={`Queue strip · ${label}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 font-mono text-[9.5px] uppercase tracking-wider transition-colors",
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
