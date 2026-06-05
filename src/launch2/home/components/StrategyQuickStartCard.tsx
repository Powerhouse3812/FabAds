import { cn } from "@/lib/utils";
import type { StrategyPreset } from "@/launch2/types";

/**
 * Strategy quick-start card. Shows the playbook label, tagline, a mono
 * structure summary (adsets × creatives × budget) and a verified/inferred
 * tag. Picking a strategy opens the entry overlay in "preset" mode.
 */
export function StrategyQuickStartCard({
  preset,
  onClick,
  className,
}: {
  preset: StrategyPreset;
  onClick?: () => void;
  className?: string;
}) {
  // e.g. "50 × 1 × $1"  (CBO presets note the campaign budget instead).
  const structure =
    preset.budgetLevel === "campaign"
      ? `${preset.adsetCount} × ${preset.creativesPerAdset} · $${preset.perUnitBudget} CBO`
      : `${preset.adsetCount} × ${preset.creativesPerAdset} × $${preset.perUnitBudget}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-56 shrink-0 flex-col gap-2 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-foreground/20 hover:bg-muted/40",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-g6-sans text-sm font-semibold text-foreground">{preset.label}</p>
        <span
          className={cn(
            "shrink-0 font-g6-mono text-[9px] font-semibold uppercase",
            preset.verified
              ? "text-[hsl(var(--success-text))]"
              : "text-muted-foreground",
          )}
          title={preset.verified ? "Verified from workspace" : "Inferred default — confirm"}
        >
          {preset.verified ? "[V]" : "[I]"}
        </span>
      </div>
      <p className="line-clamp-2 min-h-[2rem] text-xs text-muted-foreground">{preset.tagline}</p>
      <span className="font-g6-mono text-xs font-semibold tabular-nums text-foreground">
        {structure}
      </span>
    </button>
  );
}
