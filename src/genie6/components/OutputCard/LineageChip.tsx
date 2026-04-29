import { GitBranch } from "lucide-react";
import { sampleOutputs } from "../../mocks/sample-outputs";

/**
 * LineageChip — shows "Variant of {parent}" on cards / preview where the
 * variant carries a `parentWinnerId`. Per Track 4.6: every variant tracks
 * lineage to its parent winner.
 *
 * Click → in future, opens lineage tree (parent → all siblings → grandparent).
 */
type Props = {
  parentWinnerId: string;
  className?: string;
  variant?: "compact" | "full";
};

export function LineageChip({ parentWinnerId, className, variant = "compact" }: Props) {
  const parent = sampleOutputs.find((o) => o.id === parentWinnerId);
  if (!parent) {
    return (
      <span
        className={
          "inline-flex items-center gap-1 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-base px-1.5 py-0.5 font-g6-mono text-g6-xs text-g6-text-tertiary " +
          (className ?? "")
        }
      >
        <GitBranch className="h-3 w-3" />
        variant
      </span>
    );
  }

  const parentLabel = parent.headline ?? parent.brand?.name ?? parent.id;
  const truncated = parentLabel.length > 28 ? parentLabel.slice(0, 26) + "…" : parentLabel;

  if (variant === "full") {
    return (
      <div
        className={
          "flex items-center gap-2 rounded-g6-base border border-g6-border-secondary bg-g6-bg-container px-3 py-2 " +
          (className ?? "")
        }
      >
        <GitBranch className="h-3.5 w-3.5 text-g6-primary" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
            Variant of
          </p>
          <p className="truncate text-g6-sm font-medium text-g6-text">{parentLabel}</p>
          {parent.qualityScore !== undefined && (
            <p className="font-g6-mono text-g6-xs text-g6-text-tertiary">
              Parent quality: {parent.qualityScore}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <span
      title={`Variant of: ${parentLabel}`}
      className={
        "inline-flex items-center gap-1 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-base px-1.5 py-0.5 font-g6-mono text-g6-xs text-g6-text-tertiary " +
        (className ?? "")
      }
    >
      <GitBranch className="h-3 w-3" />
      variant of {truncated}
    </span>
  );
}
