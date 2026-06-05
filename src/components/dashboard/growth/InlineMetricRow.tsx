import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InlineMetric {
  label: string;
  value: string;
  delta?: { value: number; unit?: "%" | "" };
}

interface InlineMetricRowProps {
  metrics: InlineMetric[];
  className?: string;
}

/**
 * InlineMetricRow — the shared compact metric strip used inside both the
 * GenieCard and IndustryInsightsCard headers (A-12.198).
 *
 * A single row of metrics, hairline dividers between them on lg, gap grid
 * on mobile. Each metric: mono caps label / number + optional lime delta
 * chip on the lead metric. No sparklines, no per-metric cards — the
 * minimal density Maalik locked. Lives INSIDE a parent card, so it has no
 * border of its own; the card provides the surface.
 */
export function InlineMetricRow({ metrics, className }: InlineMetricRowProps) {
  const cols =
    metrics.length >= 5
      ? "lg:grid-cols-5"
      : metrics.length === 4
        ? "lg:grid-cols-4"
        : "lg:grid-cols-3";
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3",
        cols,
        "lg:gap-0 lg:divide-x lg:divide-border/60",
        className,
      )}
    >
      {metrics.map((m) => (
        <div key={m.label} className="flex flex-col gap-1 lg:px-3.5 lg:first:pl-0">
          <span className="truncate font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {m.label}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[17px] font-semibold leading-none text-foreground tabular-nums">
              {m.value}
            </span>
            {m.delta && (
              <span className="inline-flex items-center gap-0.5 rounded bg-primary/15 px-1 py-0.5 font-mono text-[9px] font-semibold text-primary tabular-nums">
                <TrendingUp className="h-2.5 w-2.5" strokeWidth={2.4} />+
                {m.delta.value}
                {m.delta.unit ?? "%"}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
