import { useMemo } from "react";
import { useBatches } from "../lib/genieRunStore";
import type { RunBatch } from "../lib/genieRunTypes";

/**
 * useOutputBatchIndex — Map<outputId, RunBatch> built from the run store.
 *
 * `RunItem.outputId` is the join key back into `sampleOutputs` (see
 * genieRunTypes.ts). Every view that needs "which batch is this output
 * part of" (batch header attribution, the module/Created-By filters, the
 * Ad Detail drawer's real sibling grid) goes through this one index instead
 * of re-deriving it — a single seam, not five.
 */
export function useOutputBatchIndex(): Map<string, RunBatch> {
  const batches = useBatches();
  return useMemo(() => {
    const map = new Map<string, RunBatch>();
    for (const batch of batches) {
      for (const item of batch.items) {
        if (item.outputId) map.set(item.outputId, batch);
      }
    }
    return map;
  }, [batches]);
}

/** Every outputId covered by at least one batch — the complement is the
 *  "earlier generations" bucket the default batch view still has to show. */
export function useAttributedOutputIds(): Set<string> {
  const batches = useBatches();
  return useMemo(() => {
    const ids = new Set<string>();
    for (const batch of batches) {
      for (const item of batch.items) {
        if (item.outputId) ids.add(item.outputId);
      }
    }
    return ids;
  }, [batches]);
}
