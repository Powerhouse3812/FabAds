/**
 * TopMovers — "Top movers (7d) — vs previous period" (handoff §5.1).
 *
 * Flat clickable rows; the sparkline is the single allowed sub-element
 * (no card-in-card). Lime for improving ROAS, destructive for declining —
 * both semantic, never decorative.
 */
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreativeThumb } from "@/creative-report/components/CreativeThumb";
import { Sparkline } from "@/creative-report/components/Sparkline";
import { fmtMultiple, fmtDelta, truncate } from "@/creative-report/lib/format";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

const NAME_MAX_MOVERS = 40;

export function TopMovers({
  items,
  onView,
}: {
  items: CreativeRollup[];
  onView: (id: string) => void;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Top movers</h3>
        <span className="text-xs text-muted-foreground">vs previous period</span>
      </div>

      {items.length === 0 ? (
        <p className="mt-2.5 text-xs text-muted-foreground">No comparable movement yet.</p>
      ) : (
        <div className="mt-1">
          {items.map((r) => {
            const { text, truncated } = truncate(r.creative.name, NAME_MAX_MOVERS);
            const delta = fmtDelta(r.roasDeltaPct);
            const isUp = delta.tone !== "down";
            const DeltaIcon = isUp ? TrendingUp : TrendingDown;

            return (
              <div
                key={r.creative.id}
                role="button"
                tabIndex={0}
                onClick={() => onView(r.creative.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onView(r.creative.id);
                  }
                }}
                className="flex cursor-pointer items-center gap-3 rounded border-b border-border py-2 last:border-0 hover:bg-accent/5"
              >
                <CreativeThumb creative={r.creative} size={36} />

                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm text-foreground"
                    title={truncated ? r.creative.name : undefined}
                  >
                    {text}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {fmtMultiple(r.metrics.roas)} ROAS
                  </span>
                </div>

                <div className="w-16 shrink-0">
                  <Sparkline
                    data={r.series.map((p) => p.revenue)}
                    tone={isUp ? "up" : "down"}
                    width={64}
                    height={28}
                  />
                </div>

                <div
                  className={cn(
                    "flex shrink-0 items-center gap-1 text-xs font-medium tabular-nums",
                    isUp ? "text-primary-text" : "text-destructive",
                  )}
                >
                  <DeltaIcon className="h-4 w-4" />
                  <span className="text-muted-foreground">ROAS</span>
                  <span>{delta.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
