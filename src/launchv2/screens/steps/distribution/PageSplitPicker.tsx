/**
 * PageSplitPicker — 4-mode card picker for pageDistribution.
 * Lives inside the Distribution surface (Step 4).
 *
 * Modes: fill_first | equal | duplicate | custom
 * Custom mode: per-page weight inputs with auto-balance to totalAds.
 */
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/launch2/utils/time";
import type { UseFlowV2 } from "../../../state/useFlowV2";
import type { PageDistribution } from "../../../types";
import { adSetCount, budgetPerDay } from "../../../deriveV2";

const OPTIONS: { id: PageDistribution; label: string; blurb: string }[] = [
  { id: "fill_first", label: "Fill first", blurb: "Load each page to 250 cap, then spill to next" },
  { id: "equal", label: "Equal split", blurb: "Spread ads evenly across all pages" },
  { id: "duplicate", label: "Duplicate to all", blurb: "Every page gets the full ad set (multiplies spend)" },
  { id: "custom", label: "Custom", blurb: "Set exact ad count per page — auto-balanced to total" },
];

function pageSplitPreview(id: PageDistribution, totalAds: number, pageCount: number): string {
  const pages = pageCount;
  const perPage = Math.floor(totalAds / pages);
  const rem = totalAds - perPage * pages;
  switch (id) {
    case "fill_first": {
      if (pages === 1) return `All ${totalAds} ads → 1 page`;
      const p1 = Math.min(totalAds, 250);
      const p2 = Math.max(0, totalAds - p1);
      return p2 > 0
        ? `Page 1: ${p1} ads, Page 2: ${p2} ads (fill first)`
        : `All ${totalAds} ads → Page 1 (under 250 cap)`;
    }
    case "equal": return `${perPage}–${perPage + (rem > 0 ? 1 : 0)} ads per page (${totalAds} ÷ ${pages})`;
    case "one_page": return `All ${totalAds} ads → 1 page`;
    case "duplicate": return `${totalAds} × ${pages} pages = ${totalAds * pages} total ads`;
    case "custom": return "Set weights below ↑";
    default: return "";
  }
}

export default function PageSplitPicker({ flow }: { flow: UseFlowV2 }) {
  const { plan, patch } = flow;

  const [showExamples, setShowExamples] = useState<boolean>(() => {
    try { return localStorage.getItem("fabads:dist:hideExamples") !== "1"; }
    catch { return true; }
  });
  const dismissExamples = () => {
    try { localStorage.setItem("fabads:dist:hideExamples", "1"); } catch {}
    setShowExamples(false);
  };

  const duplicateMultiplier = Math.max(plan.targets.length, 1);
  const baseBudget = plan.budgetAmount;
  const duplicateBudget = baseBudget * duplicateMultiplier;
  const currency = plan.targets[0]?.currency ?? "USD";
  const pageWord = plan.targets.length === 1 ? "page" : "pages";

  // Derive flat page list from TargetPair[]. Each TargetPair IS one (account, page) pair.
  // Use pageId as the weight key; pageName as display label.
  const allPages = plan.targets.map((t) => ({
    id: t.pageId,
    name: t.pageName || t.pageId,
  }));

  // Total ads = structure product
  const totalAds =
    plan.structure.campaigns *
    plan.structure.adSetsPerCampaign *
    plan.structure.adsPerAdSet;

  // Derive stable arrays for the custom mode panel
  const pageIds = allPages.map((p) => p.id);
  const pageNames = allPages.map((p) => p.name);

  // Auto-balance: when the user changes one page weight, redistribute the
  // remainder evenly across all other pages (last page absorbs leftover).
  const handleWeightChange = useCallback(
    (changedId: string, rawVal: string) => {
      const newVal = Math.max(0, Math.min(totalAds, parseInt(rawVal, 10) || 0));
      const others = pageIds.filter((id) => id !== changedId);

      if (others.length === 0) {
        patch({ pageWeights: { ...plan.pageWeights, [changedId]: newVal } });
        return;
      }

      const remaining = totalAds - newVal;
      const perOther = Math.floor(remaining / others.length);
      const leftover = remaining - perOther * others.length;

      const newWeights: Record<string, number> = {
        ...plan.pageWeights,
        [changedId]: newVal,
      };
      others.forEach((id, i) => {
        newWeights[id] = Math.max(
          0,
          perOther + (i === others.length - 1 ? leftover : 0),
        );
      });

      patch({ pageWeights: newWeights });
    },
    [pageIds, plan.pageWeights, totalAds, patch],
  );

  // Build initial equal-split weights (called when switching to "custom")
  function buildEqualWeights(): Record<string, number> {
    const count = Math.max(pageIds.length, 1);
    const base = Math.floor(totalAds / count);
    const remainder = totalAds - base * count;
    const weights: Record<string, number> = {};
    pageIds.forEach((id, i) => {
      weights[id] = base + (i === pageIds.length - 1 ? remainder : 0);
    });
    return weights;
  }

  const currentSum = pageIds.reduce(
    (s, id) => s + (plan.pageWeights[id] ?? 0),
    0,
  );
  const balanced = currentSum === totalAds;

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Page split (how ads distribute across pages)</Label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {OPTIONS.map((opt) => {
          const on = plan.pageDistribution === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                if (opt.id === "custom" && plan.pageDistribution !== "custom") {
                  patch({
                    pageDistribution: "custom",
                    pageWeights: buildEqualWeights(),
                  });
                } else {
                  patch({ pageDistribution: opt.id });
                }
              }}
              aria-pressed={on}
              className={cn(
                "flex flex-col gap-0.5 rounded-2xl border p-3 text-left transition-colors",
                on
                  ? opt.id === "duplicate"
                    ? "border-amber-400 bg-amber-50/40 dark:bg-amber-950/20"
                    : "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-foreground/30",
              )}
            >
              <span className="text-sm font-medium text-foreground">{opt.label}</span>
              {on && (
                <span className="font-mono text-[11px] text-primary/80 font-medium">
                  {"→"} {pageSplitPreview(opt.id, totalAds, Math.max(allPages.length, 1))}
                </span>
              )}
              {!on && showExamples && (
                <span className="font-mono text-[11px] text-muted-foreground/70">{opt.blurb}</span>
              )}
              {!on && !showExamples && (
                <span className="text-[11px] text-muted-foreground">{opt.blurb}</span>
              )}
              {opt.id === "duplicate" && on && (
                <span className="mt-0.5 font-mono text-[11px] text-amber-700 dark:text-amber-300">
                  Daily {formatMoney(baseBudget, currency)} → {formatMoney(duplicateBudget, currency)} (×{duplicateMultiplier} {pageWord})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Dismiss examples — shown only when examples visible and nothing selected yet */}
      {showExamples && !plan.pageDistribution && (
        <button
          type="button"
          onClick={dismissExamples}
          className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          Don&apos;t show examples next time
        </button>
      )}

      {/* Custom mode expanded panel */}
      {plan.pageDistribution === "custom" && pageIds.length > 0 && (
        <div className="mt-3 space-y-3 rounded-2xl border border-border bg-card p-3">
          {/* Header with running total */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Weight per page</span>
            <span
              className={cn(
                "font-mono text-[11px]",
                balanced ? "text-primary" : "text-amber-500",
              )}
            >
              {currentSum} / {totalAds} ads
            </span>
          </div>

          {/* Per-page rows */}
          <div className="space-y-2">
            {pageIds.map((id, i) => {
              const val = plan.pageWeights[id] ?? 0;
              const pct = totalAds > 0 ? Math.round((val / totalAds) * 100) : 0;
              return (
                <div key={id} className="flex items-center gap-3">
                  {/* Page name */}
                  <span className="min-w-0 flex-1 truncate text-xs text-foreground">
                    {pageNames[i]}
                  </span>
                  {/* Percentage display */}
                  <span className="w-10 text-right font-mono text-[11px] text-muted-foreground">
                    {pct}%
                  </span>
                  {/* Number input */}
                  <input
                    type="number"
                    min={0}
                    max={totalAds}
                    value={val}
                    onChange={(e) => handleWeightChange(id, e.target.value)}
                    className="h-7 w-16 rounded-lg border border-border bg-background px-2 text-right font-mono text-xs outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              );
            })}
          </div>

          {/* Proportional progress bar */}
          {pageIds.length > 1 && totalAds > 0 && (
            <div className="flex h-1.5 w-full overflow-hidden rounded-full">
              {pageIds.map((id, i) => {
                const val = plan.pageWeights[id] ?? 0;
                const width = totalAds > 0 ? (val / totalAds) * 100 : 0;
                const hue = (i * 137.5) % 360; // golden-angle spread for distinct colours
                return (
                  <div
                    key={id}
                    style={{
                      width: `${width}%`,
                      backgroundColor:
                        i === 0 ? "#c3eb42" : `hsl(${hue}, 50%, 55%)`,
                    }}
                    className="transition-all duration-200"
                  />
                );
              })}
            </div>
          )}

          {/* Imbalance nudge */}
          {!balanced && (
            <p className="text-[11px] text-amber-500">
              Total is {currentSum > totalAds ? "over" : "under"} by{" "}
              {Math.abs(totalAds - currentSum)} — adjust any page to rebalance.
            </p>
          )}
        </div>
      )}

      {/* Fallback when custom is selected but no pages are in plan */}
      {plan.pageDistribution === "custom" && pageIds.length === 0 && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Add pages in Step 2 to configure per-page weights.
        </p>
      )}

      {/* Budget summary — shown when targets + budget are set */}
      {plan.targets.length > 0 && plan.budgetAmount > 0 && (
        <div className="rounded-xl border border-border bg-muted/30 px-3 py-2 space-y-1">
          {plan.targets.map((t, i) => {
            const adsForPage = (() => {
              if (plan.pageDistribution === "equal") return Math.round(totalAds / Math.max(plan.targets.length, 1));
              if (plan.pageDistribution === "one_page") return i === 0 ? totalAds : 0;
              if (plan.pageDistribution === "duplicate") return totalAds;
              return i === 0 ? Math.min(totalAds, 250) : Math.max(0, totalAds - 250);
            })();
            return (
              <div key={t.pageId} className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground truncate max-w-[140px]">Page {i + 1}</span>
                <span className="font-mono text-foreground">{adsForPage} ads</span>
              </div>
            );
          })}
          <div className="border-t border-border/50 pt-1 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Total budget/day</span>
            <span className="font-mono font-medium text-foreground">
              {currency} {Math.round(budgetPerDay(plan)).toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
