import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { BatchOutputCard } from "./BatchOutputCard";
import type { OutputData } from "../../types/output";
import type { RunBatch } from "../../lib/genieRunTypes";

interface SameBatchGridProps {
  /** Current output — used to find its siblings. */
  output: OutputData;
  /** The real batch this output belongs to (§10), when known. */
  batch?: RunBatch;
  /** All output data — to look up sibling IDs. */
  allOutputs: OutputData[];
  /** Called when a sibling card is clicked. */
  onSelectSibling?: (id: string) => void;
  className?: string;
}

/**
 * SameBatchGrid — renders sibling outputs as BatchOutputCard tiles in a
 * responsive 3-col grid. Sits at the bottom of the canonical Ad Detail
 * drawer's RIGHT column.
 *
 * Genie 2.0 §10 — this used to RECONSTRUCT a batch from same-brand peers
 * because no batch id existed on OutputData. A real batch now exists
 * (RunBatch, joined via RunItem.outputId — see AdDetailDrawer), so that's
 * used whenever it's available; the same-brand guess survives only as a
 * fallback for outputs generated before batch tracking existed, and is
 * labelled honestly as a guess rather than passed off as a real batch.
 */
export function SameBatchGrid({
  output,
  batch,
  allOutputs,
  onSelectSibling,
  className,
}: SameBatchGridProps) {
  const siblings = useMemo(() => {
    if (batch) {
      const ids = new Set(batch.items.map((i) => i.outputId).filter(Boolean) as string[]);
      ids.delete(output.id);
      return allOutputs.filter((o) => ids.has(o.id));
    }
    const explicitIds = output.siblings ?? [];
    if (explicitIds.length > 0) {
      const idSet = new Set(explicitIds);
      return allOutputs.filter((o) => idSet.has(o.id));
    }
    // Fallback: same brand siblings (excluding self), up to 6 — a GUESS,
    // used only when there's no real batch and no explicit siblings list.
    return allOutputs
      .filter((o) => o.id !== output.id && o.brand?.name === output.brand?.name)
      .slice(0, 6);
  }, [batch, output.id, output.siblings, output.brand?.name, allOutputs]);

  if (siblings.length === 0) {
    return null;
  }

  const isRealBatch = Boolean(batch);

  return (
    <section className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-baseline gap-2">
        <h3 className="text-[15px] font-semibold text-foreground">
          {isRealBatch ? "Generated in same batch" : "Related generations"}
        </h3>
        {batch && (
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            {batch.batchId}
          </span>
        )}
      </div>
      {!isRealBatch && (
        <p className="text-[11px] text-muted-foreground italic mb-2">
          No batch on record for this output — showing same-brand generations instead.
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {siblings.map((sibling) => (
          <BatchOutputCard
            key={sibling.id}
            output={sibling}
            onClick={() => onSelectSibling?.(sibling.id)}
          />
        ))}
      </div>
    </section>
  );
}
