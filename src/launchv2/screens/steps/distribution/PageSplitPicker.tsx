/**
 * PageSplitPicker — 3-mode card picker for pageDistribution.
 * Lives inside the Distribution surface (Step 4).
 */
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/launch2/utils/time";
import type { UseFlowV2 } from "../../../state/useFlowV2";
import type { PageDistribution } from "../../../types";

const OPTIONS: { id: PageDistribution; label: string; blurb: string }[] = [
  { id: "fill_first", label: "Fill first", blurb: "Load each page to 250 cap, then spill to next" },
  { id: "equal", label: "Equal split", blurb: "Spread ads evenly across all pages" },
  { id: "duplicate", label: "Duplicate to all", blurb: "Every page gets the full ad set (multiplies spend)" },
];

export default function PageSplitPicker({ flow }: { flow: UseFlowV2 }) {
  const { plan, patch } = flow;

  const duplicateMultiplier = Math.max(plan.targets.length, 1);
  const baseBudget = plan.budgetAmount;
  const duplicateBudget = baseBudget * duplicateMultiplier;
  const currency = plan.targets[0]?.currency ?? "USD";
  const pageWord = plan.targets.length === 1 ? "page" : "pages";

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Page split (how ads distribute across pages)</Label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {OPTIONS.map((opt) => {
          const on = plan.pageDistribution === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => patch({ pageDistribution: opt.id })}
              aria-pressed={on}
              className={cn(
                "flex flex-col gap-0.5 rounded-2xl border p-3 text-left transition-colors",
                on
                  ? opt.id === "duplicate"
                    ? "border-amber-400 bg-amber-50/40 dark:bg-amber-950/20"
                    : "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-foreground/30",
              )}
            >
              <span className="text-sm font-medium text-foreground">{opt.label}</span>
              <span className="text-[11px] text-muted-foreground">{opt.blurb}</span>
              {opt.id === "duplicate" && (
                <span className="mt-1 font-mono text-[11px] text-amber-700 dark:text-amber-300">
                  Daily {formatMoney(baseBudget, currency)} → {formatMoney(duplicateBudget, currency)} (×{duplicateMultiplier} {pageWord})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
