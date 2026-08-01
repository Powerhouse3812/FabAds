/**
 * ConfidenceChip — every heuristic signal states its confidence + method
 * (handoff §7 / D3). High = account correlation n≥30 · Medium = thin n ·
 * Low = generic heuristic only. Use "na" for image ads with no video signal.
 * The chip is ALWAYS visible; the tooltip explains how it was computed.
 */
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Confidence } from "@/creative-report-v2/lib/selectors";

export type ChipConfidence = Confidence | "na";

const META: Record<ChipConfidence, { label: string; className: string; method: string }> = {
  high: {
    label: "High",
    // Lime = the only "good/active" accent (WCAG-locked).
    className: "bg-primary/15 text-primary-text border-primary/30",
    method: "Account-level correlation with a sufficient sample (n ≥ 30).",
  },
  medium: {
    label: "Medium",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    method: "Account-level correlation, but the sample is still thin (n = 10–29).",
  },
  low: {
    label: "Low",
    className: "bg-muted text-muted-foreground border-border",
    method: "Generic heuristic only — not enough account data to correlate yet.",
  },
  na: {
    label: "—",
    className: "bg-muted text-muted-foreground border-border",
    method: "No video on this creative, so this signal doesn't apply.",
  },
};

export function ConfidenceChip({
  confidence,
  className,
}: {
  confidence: ChipConfidence;
  className?: string;
}) {
  const m = META[confidence];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] font-medium leading-none",
            m.className,
            className,
          )}
        >
          {m.label}
          <Info className="h-2.5 w-2.5 opacity-70" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-56 text-xs">
        <p className="font-medium">{m.label} confidence</p>
        <p className="mt-0.5 text-muted-foreground">{m.method}</p>
      </TooltipContent>
    </Tooltip>
  );
}
