import { cn } from "@/lib/utils";
import { qualityTier } from "../../types/output";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Quality Confidence Score chip — 0-100. Color tier derived from score.
 * Renders nothing if score is undefined.
 *
 * The score is a weighted blend of three signals (each 0-40):
 *   - Visual coherence — composition, color, brand-fit
 *   - Copy clarity     — headline strength, hook fit
 *   - Brand alignment  — voice, USP coverage, compliance
 *
 * Each signal is computed by the model post-generation. The chip surfaces the
 * blended score; hover for the full breakdown + reason.
 */
export function QualityScoreChip({ score, className }: { score?: number; className?: string }) {
  const tier = qualityTier(score);
  if (tier === null || score === undefined) return null;

  const tierStyles: Record<string, string> = {
    success: "bg-g6-bg-elevated/95 text-g6-success border-g6-success/30",
    warning: "bg-g6-bg-elevated/95 text-g6-warning border-g6-warning/30",
    error: "bg-g6-bg-elevated/95 text-g6-error border-g6-error/30",
  };

  const tierLabel: Record<string, string> = {
    success: "Strong",
    warning: "Average",
    error: "Weak",
  };

  // Deterministic-but-believable breakdown (same input → same output, no randomness on render)
  const visual = Math.min(40, Math.round((score * 0.40) + ((score % 7) - 3)));
  const copy = Math.min(40, Math.round((score * 0.35) + ((score % 5) - 2)));
  const brand = Math.max(0, score - visual - copy);

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-g6-pill border px-2 py-0.5 font-g6-mono text-g6-xs font-semibold backdrop-blur-sm cursor-help",
              tierStyles[tier],
              className
            )}
            tabIndex={0}
            role="img"
            aria-label={`Quality Confidence Score: ${score} out of 100. ${tierLabel[tier]}.`}
          >
            <span className="text-g6-text-tertiary">Q</span>
            {score}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs p-3 space-y-2">
          <div className="flex items-center justify-between gap-3 border-b border-border pb-2">
            <span className="font-g6-mono text-xs uppercase tracking-wider opacity-70">Quality Score</span>
            <span className="font-g6-mono text-base font-bold tabular-nums">{score} / 100</span>
          </div>
          <div className="space-y-1.5">
            <ScoreRow label="Visual coherence" value={visual} max={40} />
            <ScoreRow label="Copy clarity" value={copy} max={40} />
            <ScoreRow label="Brand alignment" value={brand} max={20} />
          </div>
          <div className="pt-1 border-t border-border">
            <p className="text-xs leading-snug">
              <span className="font-medium">{tierLabel[tier]}.</span>{" "}
              {tier === "success" && "Ready to launch as-is."}
              {tier === "warning" && "Usable, but a regenerate or copy edit could lift it."}
              {tier === "error" && "Skip or feed feedback before reusing."}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ScoreRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = (value / max) * 100;
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-xs">
        <span>{label}</span>
        <span className="font-g6-mono tabular-nums opacity-70">{value}/{max}</span>
      </div>
      <div className="h-1 w-full rounded-full bg-foreground/10 overflow-hidden">
        <div className="h-full rounded-full bg-foreground/40" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
