/**
 * Step 4 — Distribution — Option A (two-pane layout).
 *
 *  LEFT pane (controls, scrollable):
 *    ① Page split preset pills with inline consequence math
 *    ② Structure steppers (campaigns × ad sets × ads per set)
 *    ③ Creative mapping pills (spread mode)
 *
 *  RIGHT pane (always-on live preview):
 *    • Live ad tree (Account→Campaign→Adset→Ads ×N badges)
 *    • Per-page cap bars (existing + new vs 250 cap)
 *    • Cap fix buttons inline when over limit
 */
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { UseFlowV2 } from "../../state/useFlowV2";
import type { SpreadMode } from "../../types";
import AdTreeVisualization from "./distribution/AdTreeVisualization";
import CapMeterWithFixes from "./distribution/CapMeterWithFixes";
import StructureEditor from "./distribution/StructureEditor";
import PageSplitPicker from "./distribution/PageSplitPicker";
import { formatMoney } from "@/launch2/utils/time";

/* ── ① Page split upgrade: add "One page" pill to PageSplitPicker ── */
/* We render the pills inline here to show "One page" as the first option */

type PageSplitId = "one_page" | "fill_first" | "equal" | "duplicate";
const PAGE_SPLIT_OPTIONS: { id: PageSplitId; label: string; blurb: string }[] = [
  { id: "one_page",   label: "One page",  blurb: "All ads go to a single page" },
  { id: "fill_first", label: "Fill first", blurb: "Fill to 250, spill to next page" },
  { id: "equal",      label: "Equal",      blurb: "Spread evenly across all pages" },
  { id: "duplicate",  label: "Duplicate",  blurb: "Every page gets the full set (×spend)" },
];

/* ── ③ Creative mapping labels ── */
const MAPPING_OPTIONS: { id: SpreadMode; label: string; blurb: string }[] = [
  { id: "round_robin",  label: "Round-robin", blurb: "Distribute evenly across ad sets" },
  { id: "one_per_adset", label: "One per ad set", blurb: "1 creative per ad set (1:1)" },
  { id: "stacked",      label: "Stacked",      blurb: "All creatives stacked in each ad set" },
  { id: "multiply",     label: "Multiply",     blurb: "One ad set per creative × structure" },
];

export default function Step4Distribution({ flow }: { flow: UseFlowV2 }) {
  const { plan, patch } = flow;
  const currency = plan.targets[0]?.currency ?? "INR";
  const duplicateMultiplier = Math.max(plan.targets.length, 1);

  return (
    <div
      data-screen="lv2-step4-distribution"
      className="grid h-full min-h-0 gap-4"
      style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}
    >
      {/* LEFT — 3 control clusters */}
      <div className="overflow-y-auto space-y-5 pr-1">

        {/* ① Page split */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground font-semibold">① Page split</Label>
          <div className="grid grid-cols-2 gap-2">
            {PAGE_SPLIT_OPTIONS.map((opt) => {
              const on = plan.pageDistribution === opt.id;
              const isDupe = opt.id === "duplicate";
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => patch({ pageDistribution: opt.id })}
                  aria-pressed={on}
                  className={cn(
                    "flex flex-col gap-0.5 rounded-2xl border p-3 text-left transition-colors",
                    on
                      ? isDupe ? "border-amber-400 bg-amber-50/40 dark:bg-amber-950/20"
                               : "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-foreground/30",
                  )}
                >
                  <span className="text-sm font-medium text-foreground">{opt.label}</span>
                  <span className="text-[11px] text-muted-foreground">{opt.blurb}</span>
                  {isDupe && on && (
                    <span className="mt-0.5 font-mono text-[11px] text-amber-700 dark:text-amber-300">
                      {formatMoney(plan.budgetAmount, currency)} → {formatMoney(plan.budgetAmount * duplicateMultiplier, currency)} ×{duplicateMultiplier}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* ② Structure */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground font-semibold">② Structure</Label>
          <StructureEditor flow={flow} />
        </div>

        <Separator />

        {/* ③ Creative mapping */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground font-semibold">③ Creative mapping</Label>
          <div className="grid grid-cols-2 gap-2">
            {MAPPING_OPTIONS.map((opt) => {
              const on = plan.spread === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => patch({ spread: opt.id })}
                  aria-pressed={on}
                  className={cn(
                    "flex flex-col gap-0.5 rounded-2xl border p-3 text-left transition-colors",
                    on ? "border-primary bg-primary/5" : "border-border bg-card hover:border-foreground/30",
                  )}
                >
                  <span className="text-sm font-medium text-foreground">{opt.label}</span>
                  <span className="text-[11px] text-muted-foreground">{opt.blurb}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT — always-on live tree + cap meters */}
      <div className="overflow-y-auto space-y-4 pl-1 border-l border-border">
        <AdTreeVisualization flow={flow} />
        <CapMeterWithFixes flow={flow} />
      </div>
    </div>
  );
}
