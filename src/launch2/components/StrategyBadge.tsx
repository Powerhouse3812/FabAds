import { cn } from "@/lib/utils";
import type { StrategyKey } from "../types";
import { STRATEGY_PRESETS } from "../lib/strategyPresets";

/** Small chip naming a strategy playbook. */
export function StrategyBadge({
  strategy,
  className,
  showVerified = false,
}: {
  strategy: StrategyKey;
  className?: string;
  showVerified?: boolean;
}) {
  const preset = STRATEGY_PRESETS[strategy];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 text-xs font-medium text-foreground",
        className
      )}
    >
      {preset.label}
      {showVerified && !preset.verified && (
        <span className="font-g6-mono text-[9px] uppercase text-muted-foreground" title="Inferred default — confirm">
          [i]
        </span>
      )}
    </span>
  );
}
