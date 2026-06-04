import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatItem {
  /** Mono caps label above the number. */
  label: string;
  /** The headline value — pre-formatted (e.g. "192", "15 / 20", "24,851"). */
  value: string;
  /** Optional up-trend delta chip. unit "%" → "+4.5%", "" → "+2". */
  delta?: { value: number; unit?: "%" | "" };
}

interface DashboardStatStripProps {
  stats: StatItem[];
  className?: string;
}

/**
 * DashboardStatStrip — inline metric row, NO per-metric cards.
 *
 * Maalik A-12.196: the dashboard's KPI cards had grown into 4 heavy
 * 134px bordered tiles per section. This collapses them into a single
 * strip of numbers separated by hairline dividers — the Vercel /
 * Linear / Stripe "stat bar" pattern. Lowest possible hierarchy: the
 * numbers float on the parent card, only thin dividers between them.
 *
 * Divider technique: `gap-px` on a `bg-border` container with `bg-card`
 * cells. The 1px gaps reveal the container's border color as internal
 * hairlines; cells match the parent card bg so there's no "card" look,
 * just lines. Reliable across the 2-col (mobile) and 4-col (lg) layouts
 * — unlike `divide-x/y` which keys off DOM order, not grid position.
 *
 * Reused by GenieSection + IndustryInsightsSection so the two surfaces
 * read as siblings.
 */
export function DashboardStatStrip({ stats, className }: DashboardStatStripProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border/60 lg:grid-cols-4",
        className,
      )}
    >
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col gap-1.5 bg-card px-4 py-3">
          <span className="font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {s.label}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[19px] font-semibold leading-none text-foreground tabular-nums">
              {s.value}
            </span>
            {s.delta && (
              <DeltaChip value={s.delta.value} unit={s.delta.unit ?? "%"} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Up-trend delta chip — lime success token, mini TrendingUp icon. */
function DeltaChip({ value, unit }: { value: number; unit: "%" | "" }) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-md bg-primary/15 px-1 py-0.5 font-mono text-[9.5px] font-semibold text-primary tabular-nums">
      <TrendingUp className="h-2.5 w-2.5" strokeWidth={2.4} />+{value}
      {unit}
    </span>
  );
}
