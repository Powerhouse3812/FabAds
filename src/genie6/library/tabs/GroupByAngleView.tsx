import { useMemo } from "react";
import { angles } from "@/mocks/shared/angles";
import { AngleRow } from "../../components/AngleRow";
import type { OutputData } from "../../types/output";
import type { GetOutputCardActions } from "../useOutputCardActions";

interface GroupByAngleViewProps {
  outputs: OutputData[];
  selected: Set<string>;
  onSelect: (id: string) => void;
  onCardClick: (output: OutputData) => void;
  /** See MasonryView — threaded down to each row's cards. Optional. */
  getActions?: GetOutputCardActions;
}

/**
 * GroupByAngleView — vertical stack of horizontal AngleRow components.
 *
 * Each row corresponds to one angle (from `mocks/shared/angles.ts`). The
 * row shows up to 10 cards visible in a horizontal scroll; if more exist,
 * a "View more →" CTA in the row's right edge opens AngleViewMoreDrawer
 * (which lists ALL ads with that angleId in masonry + infinite scroll).
 *
 * Angles with zero matching outputs are skipped — no empty rows.
 */
export function GroupByAngleView({
  outputs,
  selected,
  onSelect,
  onCardClick,
  getActions,
}: GroupByAngleViewProps) {
  const byAngle = useMemo(() => {
    const map = new Map<string, OutputData[]>();
    for (const o of outputs) {
      const key = o.angleId ?? "__unattributed__";
      const bucket = map.get(key);
      if (bucket) bucket.push(o);
      else map.set(key, [o]);
    }
    return map;
  }, [outputs]);

  // Preserve the canonical angle order from the shared mock, but only
  // render rows that have at least one matching output.
  const rows = useMemo(() => {
    const ordered = angles
      .map((a) => ({
        angleId: a.id,
        angleLabel: a.label,
        angleDescription: a.description,
        items: byAngle.get(a.id) ?? [],
      }))
      .filter((r) => r.items.length > 0);

    // Bucket unattributed outputs at the bottom (if any).
    const orphans = byAngle.get("__unattributed__") ?? [];
    if (orphans.length > 0) {
      ordered.push({
        angleId: "__unattributed__",
        angleLabel: "Unattributed",
        angleDescription: "Generations without an angle tag",
        items: orphans,
      });
    }
    return ordered;
  }, [byAngle]);

  return (
    <div className="flex flex-col gap-6">
      {rows.map((row) => (
        <AngleRow
          key={row.angleId}
          angleId={row.angleId}
          angleLabel={row.angleLabel}
          angleDescription={row.angleDescription}
          outputs={row.items}
          selected={selected}
          onSelect={onSelect}
          onCardClick={onCardClick}
          getActions={getActions}
        />
      ))}
    </div>
  );
}
