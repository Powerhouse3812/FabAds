/**
 * AccountDistributionPanel — Decisions 16 + 17.
 * Composes AccountSplitEditor (stage 1) + PerAccountStructureEditor (stage 2)
 * + PerAccountPageSplit (stage 3) + per-account budget chips.
 * Also provides a checkbox-based bulk-select bar (Decision 17).
 */
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { AccountDistribution, PageDistribution, PlanV2, StructureCounts } from "../../../types";
import AccountSplitEditor from "./AccountSplitEditor";
import PerAccountStructureEditor from "./PerAccountStructureEditor";
import PerAccountPageSplit from "./PerAccountPageSplit";
import { formatMoney } from "@/launch2/utils/time";

interface Props {
  plan: PlanV2;
  onPatch: (p: Partial<PlanV2>) => void;
}

function SectionHeader({ title, stage }: { title: string; stage: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground/[0.07] font-mono text-[10px] font-semibold text-foreground">
        {stage}
      </span>
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</span>
    </div>
  );
}

export default function AccountDistributionPanel({ plan, onPatch }: Props) {
  const uniqueAcctIds = Array.from(new Set(plan.targets.map((t) => t.accountId)));
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const allChecked = checkedIds.size === uniqueAcctIds.length && uniqueAcctIds.length > 0;

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allChecked) setCheckedIds(new Set());
    else setCheckedIds(new Set(uniqueAcctIds));
  };

  // Budget per account (from total budget / account count for equal/custom split)
  const totalAds =
    plan.structure.campaigns *
    plan.structure.adSetsPerCampaign *
    plan.structure.adsPerAdSet;
  const n = Math.max(uniqueAcctIds.length, 1);
  const currency = plan.targets[0]?.currency ?? "INR";

  const budgetForAccount = (accountId: string): number => {
    if (plan.accountDistribution === "duplicate") return plan.budgetAmount;
    if (plan.accountDistribution === "custom") {
      const w = plan.accountWeights[accountId] ?? 0;
      const totalW = uniqueAcctIds.reduce((s, id) => s + (plan.accountWeights[id] ?? 0), 0);
      if (totalW === 0) return plan.budgetAmount / n;
      return (w / totalW) * plan.budgetAmount;
    }
    return plan.budgetAmount / n;
  };

  const handleDistributionChange = (
    dist: AccountDistribution,
    weights?: Record<string, number>,
  ) => {
    onPatch({
      accountDistribution: dist,
      accountWeights: weights ?? {},
    });
  };

  const handleStructureChange = (byAccount: Record<string, StructureCounts>) => {
    onPatch({ structureByAccount: byAccount });
  };

  const handlePageDistChange = (byAccount: Record<string, PageDistribution>) => {
    onPatch({ pageDistributionByAccount: byAccount });
  };

  const stage1Done = plan.accountDistribution !== undefined;
  const stage2Show = stage1Done;
  const stage3Show = Object.keys(plan.structureByAccount).length > 0 || stage2Show;

  // Bulk structure inputs (Decision 17 — apply to checked accounts)
  const [bulkStructure, setBulkStructure] = useState<StructureCounts>({ campaigns: 1, adSetsPerCampaign: 1, adsPerAdSet: 1 });

  const applyBulkStructure = () => {
    const updated = { ...plan.structureByAccount };
    checkedIds.forEach((id) => {
      updated[id] = { ...bulkStructure };
    });
    onPatch({ structureByAccount: updated });
  };

  return (
    <div className="space-y-5 pb-20"> {/* pb-20 leaves room for bulk bar */}

      {/* ── Stage 1: Account split ── */}
      <div className="space-y-2">
        <SectionHeader title="Account split" stage={1} />
        <AccountSplitEditor
          plan={plan}
          onChange={handleDistributionChange}
        />
      </div>

      {/* ── Stage 2: Per-account structure ── */}
      {stage2Show && (
        <div className="space-y-2">
          <SectionHeader title="Structure per account" stage={2} />
          {/* Checkbox header row + select all */}
          <div className="flex h-8 items-center gap-2">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={toggleAll}
              className="h-3.5 w-3.5 rounded border border-border accent-primary"
              aria-label="Select all accounts"
            />
            <span className="text-[11px] text-muted-foreground">Select all</span>
          </div>
          <div className="space-y-2">
            {uniqueAcctIds.map((id) => {
              const name = plan.targets.find((t) => t.accountId === id)?.accountName ?? id;
              return (
                <div key={id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checkedIds.has(id)}
                    onChange={() => toggleCheck(id)}
                    className="h-3.5 w-3.5 rounded border border-border accent-primary"
                    aria-label={`Select ${name}`}
                  />
                  <div className="min-w-0 flex-1">
                    {/* account name shown in PerAccountStructureEditor below */}
                  </div>
                </div>
              );
            })}
          </div>
          <PerAccountStructureEditor
            plan={plan}
            onChangeStructure={handleStructureChange}
          />
        </div>
      )}

      {/* ── Stage 3: Per-account page split ── */}
      {stage3Show && (
        <div className="space-y-2">
          <SectionHeader title="Page split per account" stage={3} />
          <PerAccountPageSplit
            plan={plan}
            onChangePageDist={handlePageDistChange}
          />
        </div>
      )}

      {/* ── Per-account budget chips ── */}
      {plan.targets.length > 0 && plan.budgetAmount > 0 && (
        <div className="space-y-2">
          <SectionHeader title="Budget allocation" stage={4} />
          <div className="space-y-1.5">
            {uniqueAcctIds.map((id) => {
              const name = plan.targets.find((t) => t.accountId === id)?.accountName ?? id;
              const bud = budgetForAccount(id);
              return (
                <div
                  key={id}
                  className="flex h-10 items-center gap-3 rounded-xl border border-border bg-card px-3"
                >
                  <span className="flex-1 truncate text-[13px] text-foreground">{name}</span>
                  <span className="shrink-0 font-mono text-[12px] tabular-nums text-foreground font-medium">
                    {formatMoney(Math.round(bud), currency)}/{plan.budgetPeriod === "lifetime" ? "lifetime" : "day"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Bulk edit bar (Decision 17) ── */}
      {checkedIds.size >= 2 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-border bg-card px-6 py-3 shadow-lg">
          <div className="flex items-center gap-4">
            <span className="text-[13px] font-medium text-foreground">
              Editing {checkedIds.size} accounts in bulk
            </span>
            {/* Compact bulk structure inputs */}
            <div className="flex items-center gap-2">
              {(["campaigns", "adSetsPerCampaign", "adsPerAdSet"] as const).map((key, i) => (
                <div key={key} className="flex items-center gap-1.5">
                  {i > 0 && <span className="font-mono text-[11px] text-muted-foreground/50">×</span>}
                  <input
                    type="number"
                    min={1}
                    value={bulkStructure[key]}
                    onChange={(e) =>
                      setBulkStructure((prev) => ({
                        ...prev,
                        [key]: Math.max(1, parseInt(e.target.value, 10) || 1),
                      }))
                    }
                    className="h-7 w-14 rounded-lg border border-border bg-background px-2 text-center font-mono text-[12px] tabular-nums outline-none focus:ring-2 focus:ring-primary/40"
                    title={key.replace(/([A-Z])/g, " $1").toLowerCase()}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCheckedIds(new Set())}
              className="rounded-full border border-border px-4 py-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={applyBulkStructure}
              className="rounded-full bg-foreground px-4 py-1.5 text-[12px] font-medium text-background transition-colors hover:bg-foreground/90"
            >
              Apply to {checkedIds.size} accounts
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
