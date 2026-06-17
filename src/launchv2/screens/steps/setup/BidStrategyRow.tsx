/**
 * BidStrategyRow — inline bid strategy radio group for §2 Budget.
 * Decision 11: surfaces bid strategy inline (out of Advanced collapse).
 * Radio buttons → value input appears inline to the RIGHT of the last radio.
 */
import { cn } from "@/lib/utils";
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
    COST_CAP: { label: "Cost cap", placeholder: "0.00", prefix: "$" },
    LOWEST_COST_WITH_BID_CAP: { label: "Bid cap", placeholder: "0.00", prefix: "$" },
    LOWEST_COST_WITH_MIN_ROAS: { label: "ROAS goal", placeholder: "0.0", suffix: "×", step: 0.01 },
  };

  const meta = valueInputMeta[bidStrategy];
  const needsValue = bidStrategy === "COST_CAP" || bidStrategy === "LOWEST_COST_WITH_BID_CAP" || bidStrategy === "LOWEST_COST_WITH_MIN_ROAS";
  const isRoas = bidStrategy === "LOWEST_COST_WITH_MIN_ROAS";

  return (
    <div className="space-y-0.5">
      <p className="text-[11px] font-mono font-semibold uppercase tracking-widest text-muted-foreground mb-2">
        Bid strategy
      </p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {allowed.map((strategy) => (
          <label key={strategy} className="flex items-center gap-2 cursor-pointer group">
            {/* Radio circle */}
            <button
              type="button"
              role="radio"
              aria-checked={bidStrategy === strategy}
              onClick={() => {
                onChangeBidStrategy(strategy);
                // Clear bid value when switching to a strategy without a value input
                if (!valueInputMeta[strategy]) {
                  onChangeBidValue(null);
                }
              }}
              className={cn(
                "h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                bidStrategy === strategy
                  ? "border-[#8FB821] bg-[#8FB821]"
                  : "border-border bg-background group-hover:border-[#8FB821]/60"
              )}
            >
              {bidStrategy === strategy && (
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </button>
            {/* Label */}
            <span className={cn(
              "text-[13px] transition-colors select-none",
              bidStrategy === strategy ? "font-medium text-foreground" : "text-muted-foreground group-hover:text-foreground"
            )}>
              {BID_LABELS[strategy]}
            </span>
          </label>
        ))}

        {/* Inline value input — same flex row, appears after the last radio */}
        {needsValue && meta && (
          <div className="flex items-center gap-1.5 ml-1">
            <span className="text-[11px] font-mono text-muted-foreground">{meta.label}</span>
            <div className="flex items-center gap-1">
              {!isRoas && <span className="text-[12px] font-mono text-muted-foreground">$</span>}
              <input
                type="number"
                min={0}
                step={isRoas ? 0.01 : 1}
                value={bidValue ?? ""}
                onChange={(e) =>
                  onChangeBidValue(e.target.value === "" ? null : Number(e.target.value))
                }
                placeholder={meta.placeholder}
                className="w-20 rounded-full border border-border bg-background px-3 py-1.5 text-[12px] font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-[#8FB821]/40"
              />
              {isRoas && <span className="text-[11px] font-mono text-muted-foreground">×</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
