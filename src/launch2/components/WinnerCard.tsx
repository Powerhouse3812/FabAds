import { RotateCcw, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WinnerAd } from "../types";
import { relativeTime } from "../lib/format";
import { StrategyBadge } from "./StrategyBadge";
import { Thumb } from "./Thumb";

/**
 * Winners shelf card. Ops signal ONLY — proven badge + last-launched +
 * relaunch count. NO performance metrics (no ROAS/CTR) by product decision.
 */
export function WinnerCard({
  winner,
  onRelaunch,
  className,
}: {
  winner: WinnerAd;
  onRelaunch?: (winner: WinnerAd) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative w-44 shrink-0 overflow-hidden rounded-lg border border-border bg-card",
        className
      )}
    >
      <div className="relative">
        <Thumb src={winner.thumbUrl} seed={winner.id} alt={winner.name} className="aspect-[4/5] w-full" />
        {winner.proven && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/85 px-1.5 py-0.5 text-[10px] font-medium text-foreground backdrop-blur">
            <BadgeCheck className="h-3 w-3 text-[hsl(var(--success-text))]" />
            Proven
          </span>
        )}
      </div>
      <div className="space-y-1.5 p-2.5">
        <p className="truncate text-xs font-semibold text-foreground" title={winner.name}>
          {winner.name}
        </p>
        <div className="flex items-center justify-between">
          <StrategyBadge strategy={winner.strategy} />
          <span className="font-g6-mono text-[10px] text-muted-foreground">×{winner.relaunchCount}</span>
        </div>
        <p className="text-[10px] text-muted-foreground">Last launched {relativeTime(winner.lastLaunchedAt)}</p>
      </div>

      {onRelaunch && (
        <button
          type="button"
          onClick={() => onRelaunch(winner)}
          className="absolute inset-x-2 bottom-2 flex translate-y-2 items-center justify-center gap-1.5 rounded-md bg-primary py-1.5 text-xs font-semibold text-primary-foreground opacity-0 shadow-sm transition-all group-hover:translate-y-0 group-hover:opacity-100"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Quick relaunch
        </button>
      )}
    </div>
  );
}
