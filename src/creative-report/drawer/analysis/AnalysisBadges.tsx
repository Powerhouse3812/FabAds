/**
 * AnalysisBadges — the honesty-layer contrast between a real folded metric
 * and an AI-predicted estimate. Never let a predicted number wear the same
 * visual treatment as a measured one (product-plan §7 extended to this tab).
 *
 * Colour choice is deliberate and additive to the existing palette, not a
 * collision with it: lime stays "good/winner" only, amber stays
 * "caution/possible", destructive stays "bad". Sky (already the WhyDot
 * provenance colour for "meta-direct"/"derived-from-meta") extends naturally
 * to a user-facing "Measured" tag. Violet is new here and reserved
 * exclusively for "Predicted" — it isn't used for anything else in this
 * module, so it can't be confused with an existing meaning.
 */
import { CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function MeasuredBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium leading-none",
        "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
        className,
      )}
    >
      <CheckCircle2 className="h-3 w-3" />
      Measured
    </span>
  );
}

export function PredictedBadge({ className, label = "Predicted" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium leading-none",
        "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
        className,
      )}
    >
      <Sparkles className="h-3 w-3" />
      {label}
    </span>
  );
}
