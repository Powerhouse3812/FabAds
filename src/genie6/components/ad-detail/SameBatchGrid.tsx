import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { BatchOutputCard } from "./BatchOutputCard";
import type { OutputData } from "../../types/output";

interface SameBatchGridProps {
  /** Current output — used to find its siblings. */
  output: OutputData;
  /** All output data — to look up sibling IDs. */
  allOutputs: OutputData[];
  /** Called when a sibling card is clicked. */
  onSelectSibling?: (id: string) => void;
  className?: string;
}

/**
 * SameBatchGrid — renders sibling outputs (output.siblings) as
 * BatchOutputCard tiles in a responsive 3-col grid. Sits at the bottom
 * of the canonical Ad Detail drawer's RIGHT column.
 *
 * Fallback: if the current output has no explicit siblings array, we
 * surface up to 6 same-brand peers (excluding self) so the section
 * isn't dead weight on older mock data.
 */
export function SameBatchGrid({
  output,
  allOutputs,
  onSelectSibling,
  className,
}: SameBatchGridProps) {
  const siblings = useMemo(() => {
    const ids = output.siblings ?? [];
    if (ids.length === 0) {
      // Fallback: same brand siblings (excluding self), up to 6
      return allOutputs
        .filter(
          (o) => o.id !== output.id && o.brand?.name === output.brand?.name,
        )
        .slice(0, 6);
    }
    const idSet = new Set(ids);
    return allOutputs.filter((o) => idSet.has(o.id));
  }, [output.id, output.siblings, output.brand?.name, allOutputs]);

  if (siblings.length === 0) {
    return null;
  }

  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <h3 className="text-[15px] font-semibold text-foreground">
        Generated in same batch
      </h3>
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
