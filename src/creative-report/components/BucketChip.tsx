/**
 * BucketChip — the auto-categorisation label (Winners / Scaling / Fatiguing /
 * New / Losers). Colour-coded but restrained: lime reserved for Winners
 * (the only "good/active" accent), the rest use semantic status tints.
 */
import { cn } from "@/lib/utils";
import { BUCKET_LABELS, type BucketKey } from "@/creative-report/lib/paramSchema";

const STYLES: Record<BucketKey, string> = {
  winners: "bg-primary/15 text-primary-text border-primary/30",
  scaling: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30",
  fatiguing: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  new: "bg-muted text-muted-foreground border-border",
  losers: "bg-destructive/10 text-destructive border-destructive/30",
};

export function BucketChip({
  bucket,
  className,
  size = "sm",
}: {
  bucket: BucketKey;
  className?: string;
  size?: "sm" | "xs";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium leading-none",
        size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
        STYLES[bucket],
        className,
      )}
    >
      {BUCKET_LABELS[bucket]}
    </span>
  );
}
