/**
 * PerAccountStructureEditor — Decision 14.
 * Per-account structure override: campaigns × adSetsPerCampaign × adsPerAdSet.
 * Default = 1:1:N (where N = ads allocated to this account from Stage 1).
 * Under/over counts show contextual info chips.
 * "Same for all accounts" shortcut applies first account to all.
 */
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { PlanV2, StructureCounts } from "../../../types";

interface Props {
  plan: PlanV2;
  onChangeStructure: (byAccount: Record<string, StructureCounts>) => void;
}

const MAX_AD_SETS = 200;

function getAccountName(plan: PlanV2, accountId: string): string {
  return plan.targets.find((t) => t.accountId === accountId)?.accountName ?? accountId;
}

function getAllocatedForAccount(plan: PlanV2, accountId: string): number {
  const totalAds =
    plan.structure.campaigns *
    plan.structure.adSetsPerCampaign *
    plan.structure.adsPerAdSet;

  const uniqueAcctIds = Array.from(new Set(plan.targets.map((t) => t.accountId)));
  const n = Math.max(uniqueAcctIds.length, 1);

  if (plan.accountDistribution === "duplicate") return totalAds;
  if (plan.accountDistribution === "custom") return plan.accountWeights[accountId] ?? Math.floor(totalAds / n);

  // equal
  const idx = uniqueAcctIds.indexOf(accountId);
  const base = Math.floor(totalAds / n);
  const rem = totalAds - base * n;
  return base + (idx === n - 1 ? rem : 0);
}

function StructureRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
        className="h-7 w-14 rounded-lg border border-border bg-background px-2 text-center font-mono text-[12px] tabular-nums outline-none focus:ring-2 focus:ring-primary/40"
      />
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

export default function PerAccountStructureEditor({ plan, onChangeStructure }: Props) {
  const uniqueAcctIds = Array.from(new Set(plan.targets.map((t) => t.accountId)));
  const [expanded, setExpanded] = useState<Set<string>>(new Set(uniqueAcctIds.slice(0, 1)));

  const getStructure = (accountId: string): StructureCounts => {
    return (
      plan.structureByAccount[accountId] ?? {
        campaigns: 1,
        adSetsPerCampaign: 1,
        adsPerAdSet: getAllocatedForAccount(plan, accountId),
      }
    );
  };

  const setAccountStructure = (accountId: string, s: StructureCounts) => {
    onChangeStructure({ ...plan.structureByAccount, [accountId]: s });
  };

  const applyToAll = (source: string) => {
    const s = getStructure(source);
    const updated: Record<string, StructureCounts> = {};
    uniqueAcctIds.forEach((id) => {
      updated[id] = { ...s };
    });
    onChangeStructure(updated);
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {uniqueAcctIds.map((accountId, idx) => {
        const s = getStructure(accountId);
        const allocated = getAllocatedForAccount(plan, accountId);
        const product = s.campaigns * s.adSetsPerCampaign * s.adsPerAdSet;
        const diff = product - allocated;
        const isOpen = expanded.has(accountId);

        return (
          <div
            key={accountId}
            className="overflow-hidden rounded-2xl border border-border bg-card"
          >
            {/* Header row */}
            <button
              type="button"
              onClick={() => toggleExpand(accountId)}
              className="flex h-10 w-full items-center gap-3 px-3 text-left"
            >
              <span className="flex-1 truncate text-[13px] font-medium text-foreground">
                {getAccountName(plan, accountId)}
              </span>
              <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                {s.campaigns}:{s.adSetsPerCampaign}:{s.adsPerAdSet}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground/60">{isOpen ? "▲" : "▼"}</span>
            </button>

            {/* Expanded editor */}
            {isOpen && (
              <div className="space-y-3 border-t border-border px-3 pb-3 pt-2">
                {/* Inputs row */}
                <div className="flex flex-wrap items-center gap-2">
                  <StructureRow
                    label="campaigns"
                    value={s.campaigns}
                    onChange={(v) => setAccountStructure(accountId, { ...s, campaigns: v })}
                  />
                  <span className="font-mono text-[11px] text-muted-foreground/50">×</span>
                  <StructureRow
                    label="ad sets"
                    value={s.adSetsPerCampaign}
                    onChange={(v) => setAccountStructure(accountId, { ...s, adSetsPerCampaign: v })}
                  />
                  <span className="font-mono text-[11px] text-muted-foreground/50">×</span>
                  <StructureRow
                    label="ads/set"
                    value={s.adsPerAdSet}
                    onChange={(v) => setAccountStructure(accountId, { ...s, adsPerAdSet: v })}
                  />
                </div>

                {/* Under-count: fewer ads than creatives */}
                {product < plan.creatives.length && plan.creatives.length > 0 && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2">
                    <p className="font-mono text-[11px] text-amber-600 dark:text-amber-400">
                      Fewer ads ({product}) than creatives ({plan.creatives.length}) — some won't run.
                    </p>
                  </div>
                )}

                {/* Over ad-set limit */}
                {s.campaigns * s.adSetsPerCampaign > MAX_AD_SETS && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2">
                    <p className="font-mono text-[11px] text-amber-600 dark:text-amber-400">
                      Over the {MAX_AD_SETS} ad set limit — this account has{" "}
                      {s.campaigns * s.adSetsPerCampaign} ad sets.
                    </p>
                  </div>
                )}

                {/* Product vs allocated feedback */}
                {diff < 0 && (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2">
                    <p className="font-mono text-[11px] text-amber-700 dark:text-amber-300">
                      {Math.abs(diff)} ad{Math.abs(diff) !== 1 ? "s" : ""} will be removed to fit this structure (product = {product}, allocated = {allocated}).
                    </p>
                  </div>
                )}
                {diff > 0 && (
                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2">
                    <p className="font-mono text-[11px] text-[color:var(--color-info,#1677ff)]">
                      Ad sets/campaigns will repeat in sequential order to fill {allocated} slots (product = {product}).
                    </p>
                  </div>
                )}
                {diff === 0 && (
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {product} ads — matches allocation exactly.
                  </p>
                )}

                {/* Same for all accounts shortcut */}
                {uniqueAcctIds.length > 1 && idx === 0 && (
                  <button
                    type="button"
                    onClick={() => applyToAll(accountId)}
                    className="rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors"
                  >
                    Same for all accounts
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
