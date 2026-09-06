import { useMemo, useState } from "react";
import { OutputCard } from "../components/OutputCard";
import type { OutputData } from "../types/output";
import { useBatches } from "../lib/genieRunStore";
import { batchStatus } from "../lib/genieRunTypes";
import type { RunBatch, RunItem } from "../lib/genieRunTypes";
import { BatchProgressHeader, RunItemTile } from "../progress";
import { BatchGroupHeader } from "./BatchGroupHeader";
import { ConfirmActionDialog } from "./ConfirmActionDialog";
import { originKey } from "./originLabels";
import { useAttributedOutputIds } from "./useOutputBatchIndex";
import type { GetOutputCardActions } from "./useOutputCardActions";
import type { SortKey } from "./LibraryToolbar";
import { retry, cancelBatch } from "../lib/genieRunStore";

interface BatchGroupedViewProps {
  /** Already content-filtered (brand/category/angle/search) + sorted list —
   *  same list Masonry/GroupByAngle render, including session-local saves
   *  from libraryActionsStore. */
  outputs: OutputData[];
  moduleFilter: string;
  createdByFilter: string;
  sort: SortKey;
  selected: Set<string>;
  onSelect: (id: string) => void;
  onCardClick: (output: OutputData) => void;
  getActions?: GetOutputCardActions;
}

/**
 * BatchGroupedView — §10 default Library view: "latest batch first, grouped."
 *
 * Each batch renders ONE header (live progress via the progress agent's
 * `BatchProgressHeader` while running, `BatchGroupHeader` once it's a
 * terminal done/partial/failed/cancelled state — §18: one pattern, not two)
 * followed by its outputs. A "done" item WITH an `outputId` joins into
 * `sampleOutputs` and renders the full `OutputCard` (rich creative record +
 * every wired action); every other item (running / pending / failed /
 * cancelling / cancelled, or a done Other-App run with no ad copy to show)
 * renders the progress agent's `RunItemTile` INLINE, in the grid position it
 * would have occupied — never a toast, per §18.
 *
 * In-flight and failed items are never hidden by the brand/category/angle/
 * search content filters (a failure or a running job must stay visible
 * regardless) — only DONE items with a joined OutputData get content-
 * filtered, via `outputs` already having been filtered upstream.
 *
 * Outputs that were never part of any batch (legacy library rows seeded
 * before batch tracking existed) get one trailing "Earlier generations"
 * section so the default view never silently drops content. That section is
 * hidden while a module/Created-By filter is active — those outputs carry no
 * origin/author to match against, so showing them under an explicit
 * "Video Sage only" filter would be misleading.
 */
export function BatchGroupedView({
  outputs,
  moduleFilter,
  createdByFilter,
  sort,
  selected,
  onSelect,
  onCardClick,
  getActions,
}: BatchGroupedViewProps) {
  const allBatches = useBatches();
  const attributedIds = useAttributedOutputIds();

  const outputById = useMemo(() => new Map(outputs.map((o) => [o.id, o] as const)), [outputs]);

  const batches = useMemo(() => {
    let list = allBatches.filter((b) => {
      if (moduleFilter !== "all" && originKey(b.origin) !== moduleFilter) return false;
      if (createdByFilter !== "all" && b.createdBy !== createdByFilter) return false;
      return true;
    });
    if (sort === "oldest") list = [...list].reverse();
    return list;
  }, [allBatches, moduleFilter, createdByFilter, sort]);

  const unattributed = useMemo(() => {
    if (moduleFilter !== "all" || createdByFilter !== "all") return [];
    return outputs.filter((o) => !attributedIds.has(o.id));
  }, [outputs, attributedIds, moduleFilter, createdByFilter]);

  return (
    <div className="flex flex-col gap-6">
      {batches.map((batch) => (
        <BatchSection
          key={batch.batchId}
          batch={batch}
          outputById={outputById}
          selected={selected}
          onSelect={onSelect}
          onCardClick={onCardClick}
          getActions={getActions}
        />
      ))}

      {unattributed.length > 0 && (
        <section className="flex flex-col gap-2">
          <header className="flex items-center gap-2 py-1">
            <span className="font-g6-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-g6-text-tertiary">
              Earlier generations
            </span>
            <span className="font-g6-mono text-[10px] text-g6-text-tertiary">
              generated before batch tracking · {unattributed.length}{" "}
              {unattributed.length === 1 ? "output" : "outputs"}
            </span>
          </header>
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4 [&>*]:mb-4 [&>*]:break-inside-avoid">
            {unattributed.map((o) => (
              <OutputCard
                key={o.id}
                {...o}
                {...getActions?.(o)}
                selected={selected.has(o.id)}
                onSelect={() => onSelect(o.id)}
                onClick={() => onCardClick(o)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function BatchSection({
  batch,
  outputById,
  selected,
  onSelect,
  onCardClick,
  getActions,
}: {
  batch: RunBatch;
  outputById: Map<string, OutputData>;
  selected: Set<string>;
  onSelect: (id: string) => void;
  onCardClick: (output: OutputData) => void;
  getActions?: GetOutputCardActions;
}) {
  const status = batchStatus(batch);
  /**
   * Cancel used to call cancelBatch() straight from the header — no confirm.
   * Cancelling a running batch throws away work already in flight AND the
   * credits already spent on the items that finished, and it cannot be undone
   * (the store moves items to a terminal `cancelled`). The house policy is
   * that destructive actions confirm and edits treat Save as the confirm, so
   * this one needs the step. Kept per-batch rather than lifted, because the
   * batch being cancelled IS the state.
   */
  const [confirmCancel, setConfirmCancel] = useState(false);

  const visibleItems = useMemo(
    () =>
      batch.items.filter((item) => {
        if (item.status !== "done") return true; // in-flight/failed/cancelled always visible (§18)
        if (!item.outputId) return true; // done, no ad copy (Other-App run)
        return outputById.has(item.outputId); // done + joined — only if it survived content filters
      }),
    [batch.items, outputById],
  );

  if (visibleItems.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      {status === "running" ? (
        <BatchProgressHeader
          batch={batch}
          onRetry={(scope) => retry(batch.batchId, scope)}
          onCancel={() => setConfirmCancel(true)}
        />
      ) : (
        <BatchGroupHeader batch={batch} />
      )}

      <ConfirmActionDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel this batch?"
        description={`${batch.label} — ${batch.items.filter((i) => i.status === "done").length} of ${batch.items.length} outputs are already finished. Cancelling stops the rest; the credits already spent aren't returned, and this can't be undone.`}
        confirmLabel="Cancel batch"
        destructive
        onConfirm={() => cancelBatch(batch.batchId)}
      />

      <div className="flex flex-wrap gap-4">
        {visibleItems.map((item) => (
          <BatchItemTile
            key={item.id}
            item={item}
            batch={batch}
            output={item.outputId ? outputById.get(item.outputId) : undefined}
            selected={selected}
            onSelect={onSelect}
            onCardClick={onCardClick}
            getActions={getActions}
          />
        ))}
      </div>
    </section>
  );
}

function BatchItemTile({
  item,
  batch,
  output,
  selected,
  onSelect,
  onCardClick,
  getActions,
}: {
  item: RunItem;
  batch: RunBatch;
  output?: OutputData;
  selected: Set<string>;
  onSelect: (id: string) => void;
  onCardClick: (output: OutputData) => void;
  getActions?: GetOutputCardActions;
}) {
  if (item.status === "done" && output) {
    return (
      <div className="w-[272px]">
        <OutputCard
          {...output}
          {...getActions?.(output)}
          selected={selected.has(output.id)}
          onSelect={() => onSelect(output.id)}
          onClick={() => onCardClick(output)}
        />
      </div>
    );
  }

  return (
    <div className="w-[272px]">
      <RunItemTile
        item={item}
        stages={batch.stages}
        // Keeps the in-flight placeholder the same shape as the OutputCard
        // that replaces it, so a video batch doesn't jump on completion.
        format={batch.config?.format}
        // Without itemId the store's "this-item" scope falls back to retrying
        // EVERY failed item in the batch — the wrong charge and the wrong promise.
        onRetry={(scope) => retry(batch.batchId, scope, { itemId: item.id })}
      />
    </div>
  );
}
