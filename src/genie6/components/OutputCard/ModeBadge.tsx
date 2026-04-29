import { MODE_LABELS, type ModeId } from "../../types/output";

export function ModeBadge({ mode }: { mode: ModeId }) {
  return (
    <span className="font-g6-mono text-g6-xs uppercase tracking-wide text-g6-text-tertiary">
      {MODE_LABELS[mode]}
    </span>
  );
}
