import { useMemo, useState } from "react";
import { Bookmark, Download, FolderPlus, MoreHorizontal, Rocket } from "lucide-react";
import { OutputCardHybrid } from "../OutputCardHybrid";
import { SectionHeader } from "../SectionHeader";
import { RunItemTile } from "@/genie6/progress";
import { sampleOutputs } from "@/genie6/mocks/sample-outputs";
import type { EllipsisAction, OutputData } from "../../../types/output";
import {
  batchStatus,
  type RetryScope,
  type RunBatch,
  type RunItem,
} from "@/genie6/lib/genieRunTypes";
import { groupItemsByConcept } from "./batchDisplay";
import { cn } from "@/lib/utils";

interface ResultsConceptsProps {
  batch: RunBatch;
  /** Tell the dock which ad the user is "editing" — clicking a finished card forks it. */
  onEdit: (output: OutputData) => void;
  /** §21.3 per-item retry — "retry this ad only" plus, via RunItemTile's own
   *  scope choice, the item can also ask for a batch-wide scope. */
  onRetryItem?: (itemId: string, scope: RetryScope) => void;
  /**
   * Controlled selection (V3 uses this so the parent can render BulkToolbar
   * on 2+ selected). When omitted, the component falls back to internal
   * state — keeps V1 / V2 working without a refactor. Only DONE items (the
   * ones rendered as OutputCardHybrid) are selectable — RunItemTile has no
   * selection affordance, there's nothing to bulk-act on yet.
   */
  selected?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

/**
 * ResultsConcepts — concept-grouped rows of a batch's `RunItem`s.
 *
 * §12 — multi-select concepts produce ONE batch, grouped under one Batch ID;
 * this groups `batch.items` back into concept rows via `groupItemsByConcept`
 * (concept label is encoded per-item in `RunItem.tags[0]` at seed time — see
 * Step5ResultsQueue — since RunItem has no dedicated conceptId field).
 *
 * §18/§2 — a failed or still-running item renders in the SAME grid cell it
 * would have occupied (via `RunItemTile` from the Progress agent), never
 * removed from the list and never a toast. Only `done` items with a
 * resolvable `outputId` render the rich `OutputCardHybrid` ad card.
 */
export function ResultsConcepts({
  batch,
  onEdit,
  onRetryItem,
  selected: controlledSelected,
  onToggleSelect: controlledToggle,
}: ResultsConceptsProps) {
  // Controlled vs uncontrolled. V3 supplies both props (parent owns the
  // selection set so it can render BulkToolbar); V1/V2 omit them and we
  // manage state locally.
  const [internalSelected, setInternalSelected] = useState<Set<string>>(new Set());
  const selected = controlledSelected ?? internalSelected;

  const status = batchStatus(batch);
  const conceptGroups = useMemo(() => groupItemsByConcept(batch.items), [batch.items]);

  if (batch.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          No outputs yet
        </p>
        <p className="text-[13px] text-foreground">
          {status === "running"
            ? "This batch is still generating. Results will appear here as each output finishes."
            : status === "cancelled"
              ? "This batch was cancelled before anything finished."
              : "This batch returned no outputs."}
        </p>
      </div>
    );
  }

  const toggleSelect = (id: string) => {
    if (controlledToggle) {
      controlledToggle(id);
      return;
    }
    setInternalSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const outputFor = (item: RunItem): OutputData | undefined =>
    item.status === "done" && item.outputId
      ? sampleOutputs.find((o) => o.id === item.outputId)
      : undefined;

  return (
    <div className="flex flex-col gap-6">
      {conceptGroups.map((row, rowIdx) => (
        <section key={row.label} className="space-y-3">
          <SectionHeader
            title={row.label}
            count={row.items.length}
            hint={row.items.length === 1 ? "output" : "outputs"}
            trailing={
              <div className="flex items-center gap-1">
                {conceptGroups.length > 1 && (
                  <span className="mr-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">
                    Concept {rowIdx + 1}
                  </span>
                )}
                <RowActionBtn Icon={Rocket} label="Launch all in concept" />
                <RowActionBtn Icon={FolderPlus} label="Save concept to folder" />
                <RowActionBtn Icon={Bookmark} label="Bookmark concept" />
                <RowActionBtn Icon={Download} label="Download concept" />
                <RowActionBtn Icon={MoreHorizontal} label="More" />
              </div>
            }
          />
          <ul
            className="
              -mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2
              [&::-webkit-scrollbar]:hidden [scrollbar-width:none]
            "
          >
            {row.items.map((item) => {
              const output = outputFor(item);
              return (
                <li key={item.id} className="snap-start shrink-0 w-[220px]">
                  {output ? (
                    <OutputCardHybrid
                      output={output}
                      selected={selected.has(item.id)}
                      onToggleSelect={() => toggleSelect(item.id)}
                      onClick={() => onEdit(output)}
                      onSave={() => console.log("[queue] save", item.id)}
                      onLaunch={() => console.log("[queue] launch", item.id)}
                      onDownload={() => console.log("[queue] download", item.id)}
                      onAction={(a: EllipsisAction) =>
                        console.log("[queue] action", a, item.id)
                      }
                    />
                  ) : (
                    <RunItemTile
                      item={item}
                      stages={batch.stages}
                      onRetry={(scope) => onRetryItem?.(item.id, scope)}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function RowActionBtn({
  Icon,
  label,
  text,
  onClick,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  text?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick ?? (() => console.log(`[queue] row action: ${label}`))}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-md px-1.5",
        "text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground",
        text && "border border-border/60 px-2",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {text && <span className="font-sans text-[11px]">{text}</span>}
    </button>
  );
}
