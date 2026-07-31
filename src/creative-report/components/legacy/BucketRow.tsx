/**
 * BucketRow — the 5 auto-categorisation bucket cards (Winners / Scaling /
 * Fatiguing / New / Losers). One flat card per bucket; the rule is visible
 * INLINE (not just on hover — iter-2 W2 "make the formula visible") and
 * regenerates live if the buyer edits thresholds via ThresholdSettings.
 */
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BucketChip } from "@/creative-report/components/BucketChip";
import { ThresholdSettings } from "@/creative-report/components/ThresholdSettings";
import { WhyDot } from "@/creative-report/components/WhyDot";
import { BUCKETS, type BucketKey } from "@/creative-report/lib/paramSchema";
import { bucketRuleText } from "@/creative-report/lib/selectors";
import { useBucketThresholds } from "@/creative-report/lib/thresholds";

export function BucketRow({
  buckets,
  activeBucket,
  onSelect,
}: {
  buckets: Record<BucketKey, number>;
  activeBucket: BucketKey | null;
  onSelect: (b: BucketKey) => void;
}) {
  const thresholds = useBucketThresholds();

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Auto-categorised
        </span>
        <ThresholdSettings />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {BUCKETS.map((key) => {
          const count = buckets[key];
          const active = activeBucket === key;
          const rule = bucketRuleText(key, thresholds);
          return (
            <div key={key} className="relative">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onSelect(key)}
                    aria-pressed={active}
                    className={cn(
                      // h-full/w-full: the relative wrapper (added for the WhyDot
                      // overlay) is the grid item now, so the button must stretch
                      // to the cell itself — buttons shrink-to-fit by default.
                      "flex h-full w-full flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left transition-colors",
                      "hover:bg-accent/5 hover:border-border",
                      active && "ring-1 ring-primary border-primary/50",
                    )}
                  >
                    <span
                      className={cn(
                        "text-2xl font-semibold tabular-nums text-foreground",
                        count === 0 && "text-muted-foreground",
                      )}
                    >
                      {count}
                    </span>
                    <BucketChip bucket={key} />
                    <span className="line-clamp-2 font-mono text-[10.5px] leading-tight text-muted-foreground">
                      {rule}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-56 text-xs">
                  {rule}
                </TooltipContent>
              </Tooltip>
              <WhyDot id="overview.bucket" className="absolute right-2 top-2" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
