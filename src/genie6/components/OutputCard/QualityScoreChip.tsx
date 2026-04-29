import { cn } from "@/lib/utils";
import { qualityTier } from "../../types/output";

/**
 * Quality Confidence Score chip — 0-100. Color tier derived from score.
 * Renders nothing if score is undefined.
 */
export function QualityScoreChip({ score, className }: { score?: number; className?: string }) {
  const tier = qualityTier(score);
  if (tier === null || score === undefined) return null;

  const tierStyles: Record<string, string> = {
    success: "bg-g6-bg-elevated/95 text-g6-success border-g6-success/30",
    warning: "bg-g6-bg-elevated/95 text-g6-warning border-g6-warning/30",
    error: "bg-g6-bg-elevated/95 text-g6-error border-g6-error/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-g6-pill border px-2 py-0.5 font-g6-mono text-g6-xs font-semibold backdrop-blur-sm",
        tierStyles[tier],
        className
      )}
    >
      <span className="text-g6-text-tertiary">Q</span>
      {score}
    </span>
  );
}
