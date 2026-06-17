/**
 * BidStrategyRow — inline bid strategy segmented control for §2 Budget.
 * Decision 11: surfaces bid strategy inline (out of Advanced collapse).
 * Segmented pill row → shows conditional value input based on selected strategy.
 */
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BidStrategy, Objective, OptimizationGoal } from "../../../types";
import { allowedBidStrategies } from "../../../reducer";
import { BID_LABELS } from "../../../data";

export default function BidStrategyRow({
  objective,
  optimizationGoal,
  bidStrategy,
  bidValue,
  onChangeBidStrategy,
  onChangeBidValue,
}: {
  objective: Objective | null;
  optimizationGoal: OptimizationGoal | null;
  bidStrategy: BidStrategy;
  bidValue: number | null;
  onChangeBidStrategy: (v: BidStrategy) => void;
  onChangeBidValue: (v: number | null) => void;
}) {
  const allowed: BidStrategy[] = objective
    ? allowedBidStrategies(objective, optimizationGoal)
    : ["LOWEST_COST_WITHOUT_CAP"];

  // Value input metadata per strategy
  const valueInputMeta: Partial<Record<BidStrategy, { label: string; placeholder: string; prefix?: string; step?: number }>> = {
    COST_CAP: { label: "Cost per result goal", placeholder: "e.g. 5.00", prefix: "$" },
    LOWEST_COST_WITH_BID_CAP: { label: "Bid cap", placeholder: "e.g. 10.00", prefix: "$" },
    LOWEST_COST_WITH_MIN_ROAS: { label: "ROAS goal", placeholder: "e.g. 2.5", step: 0.1 },
  };

  const meta = valueInputMeta[bidStrategy];

  return (
    <div className="space-y-2">
      <Label className="text-[13px] font-medium text-foreground">Bid strategy</Label>

      {/* Segmented pill row */}
      <div className="flex flex-wrap gap-1.5">
        {allowed.map((strategy) => (
          <button
            key={strategy}
            type="button"
            onClick={() => {
              onChangeBidStrategy(strategy);
              // Clear bid value when switching to a strategy without a value input
              if (!valueInputMeta[strategy]) {
                onChangeBidValue(null);
              }
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              bidStrategy === strategy
                ? "border-foreground border-2 bg-foreground/[0.03] text-foreground"
                : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            {BID_LABELS[strategy]}
          </button>
        ))}
      </div>

      {/* Conditional value input */}
      {meta && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{meta.label}</Label>
          <div className="flex items-center gap-1.5">
            {meta.prefix && (
              <span className="font-mono text-sm text-muted-foreground">{meta.prefix}</span>
            )}
            <Input
              type="number"
              min={0}
              step={meta.step ?? 1}
              placeholder={meta.placeholder}
              value={bidValue ?? ""}
              onChange={(e) =>
                onChangeBidValue(e.target.value === "" ? null : Number(e.target.value))
              }
              className="h-9 w-36 font-mono tabular-nums"
            />
          </div>
        </div>
      )}
    </div>
  );
}
