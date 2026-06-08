/**
 * CapMeter — the live 250-active-ads-per-Page meter shown on each selected
 * page chip. Shows `current + planned` against the 250 cap so users see the
 * post-launch projection, not just the current live count. Lime fill-only;
 * turns to warn/destructive tints as it nears/hits the cap. Numerics are
 * font-mono.
 *
 * `current` = live active ads on the FB page (from pageActiveAds()).
 * `demand`  = ads this plan will add to the same page (perPageDemand from
 *             deriveV2). Defaults to 0 for unselected/preview chips.
 */
import { cn } from "@/lib/utils";
import { MAX_ADS_PER_PAGE } from "../../../types";

export function CapMeter({
  current,
  demand = 0,
  className,
}: {
  current: number;
  demand?: number;
  className?: string;
}) {
  const projected = current + demand;
  const pct = Math.min(100, Math.round((projected / MAX_ADS_PER_PAGE) * 100));
  const full = projected >= MAX_ADS_PER_PAGE;
  const near = !full && projected >= 200;
  // Split the bar visually: a solid "current" segment + a hatched "planned"
  // segment so the user can see what their plan is *adding* on top.
  const currentPct = Math.min(100, Math.round((current / MAX_ADS_PER_PAGE) * 100));
  const demandPct = Math.max(0, Math.min(100 - currentPct, Math.round((demand / MAX_ADS_PER_PAGE) * 100)));
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="relative h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        {/* current (solid) */}
        <div
          className={cn(
            "absolute left-0 top-0 h-full rounded-full transition-all",
            full ? "bg-destructive" : near ? "bg-amber-500" : "bg-primary",
          )}
          style={{ width: `${currentPct}%` }}
        />
        {/* planned (lighter tint, butts up against current) */}
        {demandPct > 0 && (
          <div
            className={cn(
              "absolute top-0 h-full transition-all",
              full ? "bg-destructive/40" : near ? "bg-amber-500/40" : "bg-primary/40",
            )}
            style={{ left: `${currentPct}%`, width: `${demandPct}%` }}
          />
        )}
        {/* draw the total-pct cap line via background extension when over */}
        <div
          className={cn(
            "absolute top-0 h-full rounded-full transition-all",
            full ? "bg-destructive" : "bg-transparent",
          )}
          style={{ width: `${pct}%`, opacity: full ? 0.0 : 0 }}
        />
      </div>
      <span
        className={cn(
          "font-mono text-[11px] tabular-nums",
          full ? "text-destructive" : near ? "text-amber-600" : "text-muted-foreground",
        )}
      >
        {projected}/{MAX_ADS_PER_PAGE}
        {demand > 0 && (
          <span className="ml-0.5 text-muted-foreground/70">
            {" "}
            ({current}+{demand})
          </span>
        )}
      </span>
    </div>
  );
}
