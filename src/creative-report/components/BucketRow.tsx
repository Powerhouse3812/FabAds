/**
 * BucketRow — the 5 auto-categorisation bucket cards (Winners / Scaling /
 * Fatiguing / New / Losers). One flat card per bucket; the bucket's rule is
 * discoverable on hover (handoff §5.1 "Bucket rules visible on hover").
 */
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BucketChip } from "@/creative-report/components/BucketChip";
import { BUCKETS, type BucketKey } from "@/creative-report/lib/paramSchema";
import { BUCKET_RULES } from "@/creative-report/lib/selectors";

export function BucketRow({
  buckets,
  activeBucket,
  onSelect,
}: {
  buckets: Record<BucketKey, number>;
  activeBucket: BucketKey | null;
  onSelect: (b: BucketKey) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {BUCKETS.map((key) => {
        const count = buckets[key];
        const active = activeBucket === key;
        return (
          <Tooltip key={key}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onSelect(key)}
                aria-pressed={active}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left transition-colors",
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
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-56 text-xs">
              {BUCKET_RULES[key]}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
