/**
 * PerAccountPageSplit — Decision 15.
 * Per-account page-split override — wraps PageSplitPicker logic per account.
 * Uses a fake UseFlowV2-like adapter to reuse page split display logic
 * without importing the full flow hook.
 */
import { cn } from "@/lib/utils";
import type { PageDistribution, PlanV2 } from "../../../types";

interface Props {
  plan: PlanV2;
  onChangePageDist: (byAccount: Record<string, PageDistribution>) => void;
}

const PAGE_OPTIONS: { id: PageDistribution; label: string; blurb: string }[] = [
  { id: "one_page",   label: "One page",    blurb: "All ads run on a single page" },
  { id: "fill_first", label: "Fill first",  blurb: "Pack each page to cap, then spill to next" },
  { id: "equal",      label: "Equal",       blurb: "Same ads on each page for this account" },
  { id: "duplicate",  label: "Duplicate",   blurb: "This account's full set runs on every page" },
];

function getAccountName(plan: PlanV2, accountId: string): string {
  return plan.targets.find((t) => t.accountId === accountId)?.accountName ?? accountId;
}

function getAccountPageCount(plan: PlanV2, accountId: string): number {
  return plan.targets.filter((t) => t.accountId === accountId).length;
}

export default function PerAccountPageSplit({ plan, onChangePageDist }: Props) {
  const uniqueAcctIds = Array.from(new Set(plan.targets.map((t) => t.accountId)));

  const getDist = (accountId: string): PageDistribution =>
    plan.pageDistributionByAccount[accountId] ?? plan.pageDistribution;

  const setDist = (accountId: string, dist: PageDistribution) => {
    onChangePageDist({ ...plan.pageDistributionByAccount, [accountId]: dist });
  };

  const applyToAll = (sourceId: string) => {
    const dist = getDist(sourceId);
    const updated: Record<string, PageDistribution> = {};
    uniqueAcctIds.forEach((id) => { updated[id] = dist; });
    onChangePageDist(updated);
  };

  return (
    <div className="space-y-3">
      {uniqueAcctIds.map((accountId, idx) => {
        const current = getDist(accountId);
        const pageCount = getAccountPageCount(plan, accountId);
        const isDuplicate = current === "duplicate";

        return (
          <div key={accountId} className="overflow-hidden rounded-2xl border border-border bg-card">
            {/* Account header */}
            <div className="flex h-10 items-center gap-3 border-b border-border px-3">
              <span className="flex-1 truncate text-[13px] font-medium text-foreground">
                {getAccountName(plan, accountId)}
              </span>
              <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                {pageCount} page{pageCount !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Page split options */}
            <div className="flex gap-2 p-3">
              {PAGE_OPTIONS.map((opt) => {
                const on = current === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDist(accountId, opt.id)}
                    aria-pressed={on}
                    className={cn(
                      "fab-focus flex-1 rounded-xl border p-2 text-left text-[11px] transition-colors",
                      on
                        ? opt.id === "duplicate"
                          ? "border-amber-400 bg-amber-50/40 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300"
                          : "border-foreground/50 bg-foreground/[0.04] text-foreground font-medium"
                        : "border-border bg-card text-muted-foreground hover:border-foreground/30",
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Duplicate warning */}
            {isDuplicate && (
              <div className="mx-3 mb-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2">
                <p className="font-mono text-[11px] text-amber-600 dark:text-amber-400">
                  Duplicate mode: each page gets the full ad set. Budget × pages.
                </p>
              </div>
            )}

            {/* Same for all shortcut */}
            {idx === 0 && uniqueAcctIds.length > 1 && (
              <div className="px-3 pb-3">
                <button
                  type="button"
                  onClick={() => applyToAll(accountId)}
                  className="rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors"
                >
                  Same for all accounts
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
