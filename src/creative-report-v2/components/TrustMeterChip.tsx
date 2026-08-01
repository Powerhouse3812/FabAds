/**
 * TrustMeterChip — "predicted vs actual" for the fatigue signal (iter-2 W2
 * whitespace). A real backtest (src/creative-report-v2/lib/trustMeter.ts), not a
 * decorative number: re-evaluates the fatigue rule 14 days before each
 * creative's latest data, then checks whether CTR kept declining afterward.
 * Honest about sample size — a thin flagged-count says so, never hides it.
 */
import { useMemo } from "react";
import { ShieldCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { WhyDot } from "@/creative-report-v2/components/WhyDot";
import { getDataset } from "@/data/generator";
import { computeTrustMeter } from "@/creative-report-v2/lib/trustMeter";
import { useBucketThresholds } from "@/creative-report-v2/lib/thresholds";

const THIN_SAMPLE_CEILING = 5;

export function TrustMeterChip() {
  const thresholds = useBucketThresholds();
  const result = useMemo(() => computeTrustMeter(getDataset(), thresholds), [thresholds]);

  if (result.flagged === 0) {
    return (
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              <ShieldCheck className="h-3 w-3" />
              Fatigue signal: no backtest data yet
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-64 text-xs">
            Nothing in range had 28+ days of history to re-check the fatigue rule against. Comes back
            as your book ages.
          </TooltipContent>
        </Tooltip>
        <WhyDot id="overview.trustMeter" />
      </div>
    );
  }

  const thin = result.flagged < THIN_SAMPLE_CEILING;

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary-text">
            <ShieldCheck className="h-3 w-3" />
            Fatigue signal: {result.hits}/{result.flagged} correct
            {thin && <span className="text-muted-foreground">(thin sample)</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-72 text-xs">
          <p className="font-medium">How this is measured</p>
          <p className="mt-1 text-muted-foreground">
            For every creative with 28+ days of history, we re-run your CURRENT fatigue rule (edit it
            via "Edit formulas") as of 14 days before its latest data — using only data available
            then — and check whether CTR kept declining in the 14 days after. {result.evaluated}{" "}
            creatives had enough history; {result.flagged} were flagged; {result.hits} kept declining.
            {thin && " With this few flagged, treat the percentage as directional, not definitive."}
          </p>
        </TooltipContent>
      </Tooltip>
      <WhyDot id="overview.trustMeter" />
    </div>
  );
}
