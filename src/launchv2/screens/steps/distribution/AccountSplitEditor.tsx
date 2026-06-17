/**
 * AccountSplitEditor — Decision 13.
 * Three modes for how N total ads split across selected ad accounts:
 *  • equal    — auto-calculated even split, read-only chip per account
 *  • duplicate — each account runs the full creative set (budget multiplies)
 *  • custom   — numeric input per account; validates sum = total allocated
 */
import { cn } from "@/lib/utils";
import type { AccountDistribution, PlanV2 } from "../../../types";

interface Props {
  plan: PlanV2;
  onChange: (dist: AccountDistribution, weights?: Record<string, number>) => void;
}

const MODES: { id: AccountDistribution; label: string; blurb: string }[] = [
  { id: "equal",     label: "Equal",     blurb: "Divide ads evenly across accounts" },
  { id: "duplicate", label: "Duplicate", blurb: "Each account runs the full creative set" },
  { id: "custom",    label: "Custom",    blurb: "Set exact ad count per account" },
];

export default function AccountSplitEditor({ plan, onChange }: Props) {
  const totalAds =
    plan.structure.campaigns *
    plan.structure.adSetsPerCampaign *
    plan.structure.adsPerAdSet;

  const acctIds = plan.targets.map((t) => t.accountId);
  const uniqueAcctIds = Array.from(new Set(acctIds));
  const n = Math.max(uniqueAcctIds.length, 1);

  const perAcct = Math.floor(totalAds / n);
  const rem = totalAds - perAcct * n;

  const weights = plan.accountWeights;

  const currentSum = uniqueAcctIds.reduce((s, id) => s + (weights[id] ?? 0), 0);
  const customValid = plan.accountDistribution !== "custom" || currentSum === totalAds;

  const getAccountName = (accountId: string) =>
    plan.targets.find((t) => t.accountId === accountId)?.accountName ?? accountId;

  const handleWeightChange = (accountId: string, raw: string) => {
    const val = Math.max(0, parseInt(raw, 10) || 0);
    onChange("custom", { ...weights, [accountId]: val });
  };

  const handleModeChange = (mode: AccountDistribution) => {
    if (mode === "custom") {
      // seed with equal split
      const seeded: Record<string, number> = {};
      uniqueAcctIds.forEach((id, i) => {
        seeded[id] = perAcct + (i === n - 1 ? rem : 0);
      });
      onChange(mode, seeded);
    } else {
      onChange(mode, {});
    }
  };

  return (
    <div className="space-y-3">
      {/* Mode selector */}
      <div className="flex gap-2">
        {MODES.map((m) => {
          const on = plan.accountDistribution === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => handleModeChange(m.id)}
              aria-pressed={on}
              className={cn(
                "fab-focus flex-1 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors",
                on
                  ? "border-foreground/60 bg-foreground/[0.05] text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
              )}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Per-mode content */}
      {plan.accountDistribution === "equal" && (
        <div className="space-y-1.5">
          {uniqueAcctIds.map((id, i) => {
            const adsForThis = perAcct + (i === n - 1 ? rem : 0);
            return (
              <div key={id} className="flex h-10 items-center gap-3 rounded-xl border border-border bg-card px-3">
                <span className="flex-1 truncate text-[13px] font-medium text-foreground">
                  {getAccountName(id)}
                </span>
                <span className="shrink-0 rounded-full bg-foreground/[0.06] px-2 py-0.5 font-mono text-[11px] tabular-nums text-foreground">
                  {adsForThis} ads
                </span>
              </div>
            );
          })}
        </div>
      )}

      {plan.accountDistribution === "duplicate" && (
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-sm">
          <p className="font-mono text-[12px] text-[color:var(--color-info,#1677ff)]">
            Each account runs all {totalAds} ads. Total ads ={" "}
            {totalAds} × {n} accounts = {totalAds * n}. Budget multiplies.
          </p>
        </div>
      )}

      {plan.accountDistribution === "custom" && (
        <div className="space-y-2">
          {uniqueAcctIds.map((id) => {
            const val = weights[id] ?? 0;
            return (
              <div key={id} className="flex h-10 items-center gap-3 rounded-xl border border-border bg-card px-3">
                <span className="flex-1 truncate text-[13px] font-medium text-foreground">
                  {getAccountName(id)}
                </span>
                <input
                  type="number"
                  min={0}
                  value={val}
                  onChange={(e) => handleWeightChange(id, e.target.value)}
                  className={cn(
                    "h-7 w-16 rounded-lg border bg-background px-2 text-right font-mono text-[12px] tabular-nums outline-none focus:ring-2 focus:ring-primary/40",
                    !customValid && "border-red-400",
                  )}
                />
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">ads</span>
              </div>
            );
          })}

          {/* Running total + validation */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-1.5">
            <span className="font-mono text-[11px] text-muted-foreground">Total</span>
            <span
              className={cn(
                "font-mono text-[12px] tabular-nums font-medium",
                customValid ? "text-foreground" : "text-red-500",
              )}
            >
              {currentSum} / {totalAds}
            </span>
          </div>
          {!customValid && (
            <p className="font-mono text-[11px] text-red-500">
              Must sum to {totalAds} total ads — currently {currentSum > totalAds ? "over" : "under"} by{" "}
              {Math.abs(totalAds - currentSum)}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
