import { useState } from "react";
import {
  Bookmark,
  Download,
  FolderPlus,
  MoreHorizontal,
  RefreshCw,
  Rocket,
} from "lucide-react";
import { OutputCardHybrid } from "../OutputCardHybrid";
import { SectionHeader } from "../SectionHeader";
import type { EllipsisAction, OutputData } from "../../../types/output";
import type { QueueBatch } from "../../types/queue";
import { cn } from "@/lib/utils";

interface ResultsConceptsProps {
  batch: QueueBatch;
  /** Tell the dock which ad the user is "editing" — clicking a card forks it. */
  onEdit: (output: OutputData) => void;
  /** Re-run this batch's whole concept row (stub). */
  onRegenerateConcept?: (conceptId: string) => void;
}

/**
 * ResultsConcepts — concept-grouped rows of generated outputs for the active
 * queue batch. Reuses the established Studio v4 patterns:
 *
 *   - `SectionHeader` — lime stripe + mono caps title + count badge + hint
 *   - `OutputCardHybrid` — the Step 5 ad card (Genie 5 Meta-ad chrome +
 *     Genie 6 actions)
 *
 * Each row gets a right-aligned action cluster per Figma:
 *   Regenerate · Launch · FolderAdd · Bookmark · Download · More
 *
 * Selecting an output via click forks its config into the PromptDock's
 * "Editing" chip — the screen's primary fork affordance.
 */
export function ResultsConcepts({
  batch,
  onEdit,
  onRegenerateConcept,
}: ResultsConceptsProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (!batch.outputs || !batch.concepts || batch.outputs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          No outputs yet
        </p>
        <p className="text-[13px] text-foreground">
          {batch.status === "generating"
            ? "This batch is still generating. Results will appear here when ready."
            : batch.status === "queued"
              ? "This batch is queued — waiting for a generation slot to open."
              : "This batch returned no outputs."}
        </p>
      </div>
    );
  }

  const conceptChunks = batch.concepts.map((c, idx) => {
    const start = idx * c.variationCount;
    return {
      ...c,
      outputs: batch.outputs!.slice(start, start + c.variationCount),
    };
  });

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex flex-col gap-6">
      {conceptChunks.map((row, rowIdx) => (
        <section key={row.id} className="space-y-3">
          <SectionHeader
            title={row.label}
            count={row.outputs.length}
            hint={row.outputs.length === 1 ? "variation" : "variations"}
            trailing={
              <div className="flex items-center gap-1">
                <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70 mr-1">
                  Concept {rowIdx + 1}
                </span>
                <RowActionBtn
                  Icon={RefreshCw}
                  label="Regenerate concept"
                  text="Regenerate"
                  onClick={() => onRegenerateConcept?.(row.id)}
                />
                <span className="mx-0.5 h-3.5 w-px bg-border/60" />
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
            {row.outputs.map((output) => (
              <li key={output.id} className="snap-start shrink-0 w-[220px]">
                <OutputCardHybrid
                  output={output}
                  selected={selected.has(output.id)}
                  onToggleSelect={() => toggleSelect(output.id)}
                  onClick={() => onEdit(output)}
                  onSave={() => console.log("[queue] save", output.id)}
                  onLaunch={() => console.log("[queue] launch", output.id)}
                  onDownload={() => console.log("[queue] download", output.id)}
                  onAction={(a: EllipsisAction) =>
                    console.log("[queue] action", a, output.id)
                  }
                />
              </li>
            ))}
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
      onClick={onClick}
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
