import { cn } from "@/lib/utils";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Clock } from "lucide-react";
import type { LaunchStrategy, StrategyValidation, CurrencyBudget } from "@/lib/launch-distribution";

interface StrategyCardProps {
  strategy: LaunchStrategy;
  selected: boolean;
  onSelect: (strategy: LaunchStrategy) => void;
  /** Capacity/page validation from the core lib. */
  validation: StrategyValidation;
  /** Per-currency budget; only consumed for the Duplicate strategy. */
  budget: CurrencyBudget[];
  /** Step 1 runs before final ad selection — true => validate pages/capacity only. */
  pending: boolean;
}

const STRATEGY_COPY: Record<LaunchStrategy, { name: string; description: string; example: string }> = {
  fill_first: {
    name: "Fill First",
    description: "Load one Page to its limit before moving to the next.",
    example: "Fill the first Page, then overflow",
  },
  equal: {
    name: "Equal Distribution",
    description: "Spread the selected ads evenly across every Page.",
    example: "Split evenly",
  },
  duplicate: {
    name: "Duplicate to Each",
    description: "Place a full copy of every ad on every Page.",
    example: "Copy every ad to every Page",
  },
};

function formatAmount(currency: string, value: number): string {
  // Compact, currency-prefixed amount. Avoids locale surprises while staying readable.
  const rounded = Math.round(value * 100) / 100;
  const num = rounded.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${currency} ${num}`;
}

export function StrategyCard({ strategy, selected, onSelect, validation, budget, pending }: StrategyCardProps) {
  const copy = STRATEGY_COPY[strategy];
  // When pending, never hard-disable on an unknown ad count — only page/capacity
  // shortfalls that are knowable now (e.g. "Select at least one Page") gate it.
  const unavailable = !validation.available;
  const showDuplicateBudget = strategy === "duplicate" && budget.length > 0;

  return (
    <label
      htmlFor={`strategy-${strategy}`}
      className={cn(
        "relative flex flex-col gap-3 rounded-xl border bg-card p-4 transition-colors cursor-pointer",
        selected ? "border-primary/60 ring-1 ring-primary/30" : "border-border hover:border-foreground/20",
        unavailable && "opacity-70",
      )}
    >
      <div className="flex items-start gap-3">
        <RadioGroupItem
          value={strategy}
          id={`strategy-${strategy}`}
          className="mt-0.5"
          onClick={() => onSelect(strategy)}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Label htmlFor={`strategy-${strategy}`} className="text-sm font-medium text-foreground cursor-pointer">
              {copy.name}
            </Label>
            {unavailable ? (
              <Badge variant="destructive" className="text-[10px]">Unavailable</Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">Available</Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground leading-snug">{copy.description}</p>
          <p className="mt-1.5 text-[11px] font-medium text-muted-foreground/80">
            e.g. {copy.example}
          </p>
        </div>
      </div>

      {/* Budget-impact line — Duplicate only (per currency base -> final). */}
      {showDuplicateBudget && (
        <div className="rounded-lg border border-dashed border-border bg-secondary/30 px-3 py-2 space-y-1">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Budget impact</p>
          {budget.map((b) => (
            <div key={b.currency} className="flex items-center justify-between text-xs text-foreground">
              <span className="text-muted-foreground">{b.currency}</span>
              <span>
                {formatAmount(b.currency, b.base)}
                <span className="mx-1 text-muted-foreground">&rarr;</span>
                <span className="font-medium">{formatAmount(b.currency, b.final)}</span>
                <span className="ml-1 text-muted-foreground">(&times;{b.multiplier})</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Disabled reason (capacity/page shortfall). */}
      {unavailable && validation.reason && (
        <div className="flex items-start gap-1.5 text-[11px] text-destructive leading-snug">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          <span>{validation.reason}</span>
        </div>
      )}

      {/* Provisional note — final ad selection happens in a later step. */}
      {pending && (
        <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground leading-snug">
          <Clock className="mt-0.5 h-3 w-3 shrink-0" />
          <span>Pending final ad selection — pages and capacity checked now; ad-count fit confirmed at Preview.</span>
        </div>
      )}
    </label>
  );
}
