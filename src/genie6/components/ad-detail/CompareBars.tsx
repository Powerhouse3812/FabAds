import { cn } from "@/lib/utils";

export interface CompareBar {
  /** Row label e.g. "This ad" / "Top in angle" / "Your last 10 avg" / "Category avg". */
  label: string;
  /** 0–100. */
  value: number;
  /** Lime fill when true; muted neutral otherwise. */
  isCurrent?: boolean;
}

interface CompareBarsProps {
  /** Typically 4 bars: This ad / Top in angle / Last 10 avg / Category avg. */
  bars: CompareBar[];
  className?: string;
}

/**
 * CompareBars — horizontal peer-comparison chart.
 *
 * 4 stacked rows: label on left (text-foreground/75), bar in middle
 * (h-2 rounded-full), tabular-nums numeric on right. Current bar gets the
 * lime fill, others a muted neutral.
 */
export function CompareBars({ bars, className }: CompareBarsProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {bars.map((bar, i) => (
        <div key={`${bar.label}-${i}`} className="grid grid-cols-[88px_1fr_32px] items-center gap-3">
          <p
            className={cn(
              "text-[11.5px] leading-tight truncate",
              bar.isCurrent ? "font-semibold text-foreground" : "text-foreground/75",
            )}
          >
            {bar.label}
          </p>
          <div className="relative h-1.5 rounded-full bg-muted/40 overflow-hidden">
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-[width] duration-500",
                bar.isCurrent ? "bg-primary" : "bg-foreground/15",
              )}
              style={{ width: `${Math.max(0, Math.min(100, bar.value))}%` }}
            />
          </div>
          <p className="font-mono tabular-nums text-[11.5px] text-right text-foreground">
            {bar.value}
          </p>
        </div>
      ))}
    </div>
  );
}
