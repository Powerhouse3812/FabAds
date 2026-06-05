import { cn } from "@/lib/utils";

/**
 * 250-ad-per-Page cap meter. Color shifts as the Page fills:
 * green < 80%, amber < 100%, red at/over the cap.
 */
export function CapMeter({
  current,
  added = 0,
  limit = 250,
  className,
  showNumbers = true,
}: {
  current: number;
  added?: number;
  limit?: number;
  className?: string;
  showNumbers?: boolean;
}) {
  const projected = current + added;
  const pct = Math.min(100, (current / limit) * 100);
  const addedPct = Math.min(100 - pct, (added / limit) * 100);
  const breach = projected > limit;
  const near = projected > limit * 0.8;

  const fill = breach ? "bg-[#ff4d4f]" : near ? "bg-[#faad14]" : "bg-[#52c41a]";

  return (
    <div className={cn("w-full", className)}>
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full", fill)} style={{ width: `${pct}%` }} />
        {added > 0 && (
          <div
            className={cn("h-full opacity-60", breach ? "bg-[#ff4d4f]" : "bg-foreground/40")}
            style={{ width: `${addedPct}%` }}
          />
        )}
      </div>
      {showNumbers && (
        <div className="mt-1 flex items-center justify-between font-g6-mono text-[10px] text-muted-foreground">
          <span className={cn(breach && "text-[hsl(var(--error-text))]")}>
            {projected}/{limit}
          </span>
          <span>{breach ? `over by ${projected - limit}` : `${limit - projected} left`}</span>
        </div>
      )}
    </div>
  );
}
