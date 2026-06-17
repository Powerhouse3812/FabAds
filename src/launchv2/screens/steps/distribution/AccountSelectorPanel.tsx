/**
 * AccountSelectorPanel — compact left column for the V2 3-panel Step 3 layout.
 *
 * Renders as a narrow (~240px) scrollable list of ad accounts.
 * Each row: Checkbox + account name + budget chip + AccountStatusChip.
 * Selected rows get a lime-tinted surface (bg-primary-bg / #F5FBE2 light · #1D2A09 dark).
 * Header is sticky with a "Select all / Deselect all" toggle.
 *
 * Tokens used: primary-bg, primary-text, border/60, muted/20, muted/30, muted-foreground.
 * Font: Geist Mono for labels/numbers, Geist Sans for account names.
 */
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import type { PlanV2 } from "../../../types";
import type { UseFlowV2 } from "../../../state/useFlowV2";

// ── AccountStatusChip (local copy — mirrors Step3V2Panel logic) ───────────────
function AccountStatusChip({
  accountId,
  plan,
}: {
  accountId: string;
  plan: PlanV2;
}) {
  const structOverride = plan.structureByAccount[accountId];
  const s = structOverride ?? plan.structure;
  const adCount = s.campaigns * s.adSetsPerCampaign * s.adsPerAdSet;
  const isCustom = accountId in plan.structureByAccount;

  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="rounded-full bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
        {adCount} ads
      </span>
      {isCustom && (
        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-[#5B7611] dark:text-[#C3E165]">
          Custom
        </span>
      )}
    </div>
  );
}

// ── Budget chip helper ─────────────────────────────────────────────────────────
function formatBudget(plan: PlanV2): string {
  const amount = plan.budgetAmount;
  const currency = "₹";
  // Format with Indian number formatting (commas for X,XXX)
  const formatted = amount.toLocaleString("en-IN");
  if (plan.budgetPeriod === "lifetime") {
    return `${currency}${formatted} lifetime`;
  }
  return `${currency}${formatted}/day`;
}

// ── Props ──────────────────────────────────────────────────────────────────────
export interface AccountSelectorPanelProps {
  flow: UseFlowV2;
  selectedIds: Set<string>;
  onSelect: (ids: Set<string>) => void;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function AccountSelectorPanel({
  flow,
  selectedIds,
  onSelect,
}: AccountSelectorPanelProps) {
  const { plan } = flow;

  // Derive unique account ids in insertion order
  const uniqueAcctIds = Array.from(
    new Set(plan.targets.map((t) => t.accountId)),
  );

  const allSelected = uniqueAcctIds.every((id) => selectedIds.has(id));

  // ── Toggle handlers ──────────────────────────────────────────────────────────
  function handleSelectAll() {
    if (allSelected) {
      // Deselect all — allow empty selection
      onSelect(new Set());
    } else {
      onSelect(new Set(uniqueAcctIds));
    }
  }

  function handleRowClick(id: string) {
    // Toggle this account in/out of the selection
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelect(next);
  }

  function handleCheckboxChange(id: string, checked: boolean) {
    const next = new Set(selectedIds);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    onSelect(next);
  }

  // ── Zero-state guard ─────────────────────────────────────────────────────────
  if (uniqueAcctIds.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 border-r border-border/60 bg-muted/20 px-3">
        <span className="font-mono text-[11px] text-muted-foreground">
          No accounts
        </span>
        <span className="font-mono text-[10px] text-muted-foreground/70">
          Add ad accounts in Step 2
        </span>
      </div>
    );
  }

  const budgetLabel = formatBudget(plan);

  return (
    <div className="flex h-full min-h-0 w-[240px] flex-shrink-0 flex-col border-r border-border/60 bg-muted/20">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-muted/20 px-3 py-2.5 backdrop-blur-[2px]">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Accounts
        </span>
        <button
          type="button"
          onClick={handleSelectAll}
          className="rounded-full px-2 py-0.5 font-mono text-[11px] text-[#5B7611] transition-colors hover:bg-primary/10 dark:text-[#C3E165]"
          aria-label={allSelected ? "Deselect all accounts" : "Select all accounts"}
        >
          {allSelected ? "Deselect all" : "Select all"}
        </button>
      </div>

      {/* ── Account rows ── */}
      <div className="flex-1 overflow-y-auto py-1">
        {uniqueAcctIds.map((id) => {
          const target = plan.targets.find((t) => t.accountId === id);
          const name = target?.accountName ?? id;
          const isActive = selectedIds.has(id);

          return (
            <div
              key={id}
              role="option"
              aria-selected={isActive}
              tabIndex={0}
              onClick={() => handleRowClick(id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleRowClick(id);
                }
              }}
              className={cn(
                "group flex min-h-[40px] cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors",
                isActive
                  ? "bg-[#F5FBE2] dark:bg-[#1D2A09]"
                  : "bg-transparent hover:bg-muted/30",
              )}
            >
              {/* Checkbox — stops propagation so it toggles multi-select */}
              <Checkbox
                checked={isActive}
                onCheckedChange={(checked) => {
                  handleCheckboxChange(id, checked === true);
                }}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Select ${name}`}
                className={cn(
                  "h-3.5 w-3.5 shrink-0 rounded-sm border-border transition-colors",
                  isActive
                    ? "border-[#749818] data-[state=checked]:bg-[#8FB821] data-[state=checked]:text-[#121212] dark:border-[#C3E165] dark:data-[state=checked]:bg-[#90BA24]"
                    : "border-border",
                )}
              />

              {/* Name + budget */}
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "truncate text-[13px] font-medium leading-[1.3]",
                    isActive ? "text-foreground" : "text-foreground/70",
                  )}
                >
                  {name}
                </p>
                <p className="mt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                  {budgetLabel}
                </p>
              </div>

              {/* Status chip — right side */}
              <AccountStatusChip accountId={id} plan={plan} />
            </div>
          );
        })}
      </div>

      {/* ── Footer count ── */}
      <div className="border-t border-border/60 px-3 py-2">
        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
          {selectedIds.size} of {uniqueAcctIds.length} selected
        </span>
      </div>
    </div>
  );
}
