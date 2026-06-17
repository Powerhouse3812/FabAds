/**
 * BidStrategyRow — inline bid strategy segmented control for §2 Budget.
 * Decision 11: surfaces bid strategy inline (out of Advanced collapse).
 * Segmented pill row → value input appears inline to the RIGHT of the pills.
 */
import { cn } from "@/lib/utils";
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
  const valueInputMeta: Partial<Record<BidStrategy, { label: string; placeholder: string; prefix?: string; suffix?: string; step?: number }>> = {
    COST_CAP: { label: "Cost per result goal", placeholder: "0.00", prefix: "$" },
    LOWEST_COST_WITH_BID_CAP: { label: "Bid cap", placeholder: "0.00", prefix: "$" },
    LOWEST_COST_WITH_MIN_ROAS: { label: "ROAS goal", placeholder: "0.0", suffix: "×", step: 0.1 },
  };

  const meta = valueInputMeta[bidStrategy];

  return (
    <div className="space-y-2">
      <Label className="text-[13px] font-medium text-foreground">Bid strategy</Label>

      {/* Pills + inline value input on the same row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Segmented pill row */}
        <div className="flex items-center gap-1.5 flex-wrap">
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

        {/* Inline value input — only when the selected strategy needs one */}
        {meta && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-mono text-muted-foreground">{meta.label}</span>
            <div className="flex items-center gap-1">
              {meta.prefix && (
                <span className="text-[12px] font-mono text-muted-foreground">{meta.prefix}</span>
              )}
              <input
                type="number"
                min={0}
                step={meta.step ?? 1}
                value={bidValue ?? ""}
                onChange={(e) =>
                  onChangeBidValue(e.target.value === "" ? null : Number(e.target.value))
                }
                placeholder={meta.placeholder}
                className="w-20 rounded-full border border-border bg-background px-3 py-1.5 text-[12px] font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-[#8FB821]/40"
              />
              {meta.suffix && (
                <span className="text-[12px] font-mono text-muted-foreground">{meta.suffix}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
