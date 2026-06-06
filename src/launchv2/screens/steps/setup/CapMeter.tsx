/**
 * CapMeter — the live 250-active-ads-per-Page meter shown on each selected
 * page chip. Lime fill-only; turns to warn/destructive tints as it nears/hits
 * the cap. Numerics are font-mono.
 */
import { cn } from "@/lib/utils";
import { MAX_ADS_PER_PAGE } from "../../../types";

export function CapMeter({ current, className }: { current: number; className?: string }) {
  const pct = Math.min(100, Math.round((current / MAX_ADS_PER_PAGE) * 100));
  const full = current >= MAX_ADS_PER_PAGE;
  const near = !full && current >= 200;
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            full ? "bg-destructive" : near ? "bg-amber-500" : "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={cn(
          "font-mono text-[11px] tabular-nums",
          full ? "text-destructive" : near ? "text-amber-600" : "text-muted-foreground",
        )}
      >
        {current}/{MAX_ADS_PER_PAGE}
      </span>
    </div>
  );
}
