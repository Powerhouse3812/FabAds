import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  PerPairAllocation,
  CurrencyBudget,
  LaunchStrategy,
} from "@/lib/launch-distribution";

interface DistributionAllocationProps {
  strategy: LaunchStrategy;
  /** Per-(account → page) allocation from `distribute()` for the selected strategy. */
  allocation: PerPairAllocation[];
  /** Per-currency budget (base → final, with multiplier) for the selected strategy. */
  budgets: CurrencyBudget[];
  /** Total ads created under this strategy (selected for Fill/Equal, ×pairs for Duplicate). */
  outputCount: number;
  /** Number of (account → page) destinations. */
  pairCount: number;
  /** True in Step 1: figures are a live estimate, finalised at Preview. */
  pending: boolean;
}

const STRATEGY_LABEL: Record<LaunchStrategy, string> = {
  fill_first: "Fill First",
  equal: "Equal Distribution",
  duplicate: "Duplicate to Each",
};

function formatAmount(currency: string, value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const num = rounded.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${currency} ${num}`;
}

/**
 * DistributionAllocation — the live "kis page pe kitni ads" preview.
 *
 * Renders, for the currently selected strategy, exactly how many ads land on each
 * (account → page) destination, plus how the budget changes (base → final, with
 * the duplicate multiplier). Everything is derived from live Step-1 state
 * (structure × pages × strategy), so it updates in real time. Figures are an
 * estimate in Step 1 (badge) and are finalised against real ads at Preview.
 */
export function DistributionAllocation({
  strategy,
  allocation,
  budgets,
  outputCount,
  pairCount,
  pending,
}: DistributionAllocationProps) {
  if (pairCount === 0) {
    return (
      <Card className="border border-dashed border-border bg-card">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">
            Select at least one Page above to preview how ads will be distributed.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group the per-pair allocation by ad account for a readable account → pages tree.
  const byAccount = new Map<string, PerPairAllocation[]>();
  for (const a of allocation) {
    const key = a.pair.account_name;
    const bucket = byAccount.get(key);
    if (bucket) bucket.push(a);
    else byAccount.set(key, [a]);
  }

  const hasBudget = budgets.length > 0;

  return (
    <Card className="border border-border bg-card">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">
            Ads per destination · {STRATEGY_LABEL[strategy]}
          </p>
          {pending && (
            <Badge variant="secondary" className="text-[10px]">Estimated</Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          {strategy === "duplicate" ? (
            <>
              Creates{" "}
              <span className="font-medium text-foreground">{outputCount}</span> ads —
              every ad copied to each of {pairCount} destination
              {pairCount === 1 ? "" : "s"}.
            </>
          ) : (
            <>
              Distributes{" "}
              <span className="font-medium text-foreground">{outputCount}</span> ads
              across {pairCount} destination{pairCount === 1 ? "" : "s"}.
            </>
          )}
        </p>

        {/* Per account → page allocation */}
        <div className="space-y-2">
          {[...byAccount.entries()].map(([account, pairs]) => (
            <div key={account} className="rounded-md border border-border p-2.5">
              <p className="mb-1.5 text-xs font-medium text-foreground truncate">{account}</p>
              <div className="space-y-1">
                {pairs.map((p) => (
                  <div
                    key={p.pair.page_id}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="min-w-0 truncate text-muted-foreground">{p.pair.page_name}</span>
                    <span className="shrink-0 tabular-nums text-foreground">
                      <span className="font-medium">{p.activeToLaunch}</span> ad
                      {p.activeToLaunch === 1 ? "" : "s"}
                      {p.pausedToAdd > 0 && (
                        <span className="text-muted-foreground"> · {p.pausedToAdd} paused</span>
                      )}
                      {p.status === "full" && (
                        <Badge variant="destructive" className="ml-1.5 text-[10px]">Full</Badge>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Budget impact */}
        <div className="border-t border-border pt-2.5">
          {hasBudget ? (
            <div className="space-y-0.5">
              {budgets.map((b) => (
                <div key={b.currency} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">Budget ({b.currency})</span>
                  <span className="text-foreground">
                    {formatAmount(b.currency, b.base)}
                    {b.multiplier !== 1 && (
                      <>
                        <span className="mx-1 text-muted-foreground">&rarr;</span>
                        <span className="font-medium">{formatAmount(b.currency, b.final)}</span>
                        <span className="ml-1 text-muted-foreground">(&times;{b.multiplier})</span>
                      </>
                    )}
                  </span>
                </div>
              ))}
              {budgets.some((b) => b.unavailableAdsets > 0) && (
                <p className="text-[11px] text-muted-foreground">
                  Budget unavailable for{" "}
                  {budgets.reduce((sum, b) => sum + b.unavailableAdsets, 0)} ad set
                  {budgets.reduce((sum, b) => sum + b.unavailableAdsets, 0) === 1 ? "" : "s"}.
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {strategy === "duplicate" ? (
                <>
                  Budget multiplies{" "}
                  <span className="font-medium text-foreground">&times;{pairCount}</span> — exact
                  amounts are set per ad set in Targeting (Step 2).
                </>
              ) : (
                <>Budget is set per ad set in Targeting (Step 2).</>
              )}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
