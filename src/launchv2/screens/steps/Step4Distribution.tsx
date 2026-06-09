/**
 * Step 4 — Distribution — V1 (corrected layout, same two-pane structure).
 *
 * V1 changes vs original:
 *  - Removed circled-number section labels (① ② ③) → clear section headings
 *    with `text-[13px] font-semibold text-foreground` matching SectionCard style
 *  - Removed <Separator /> between sections → `space-y-6` + heading weight carries the break
 *  - Increased card padding from p-3 → p-4 in both 2×2 grids
 *  - Increased label font from text-sm → text-[13px] font-semibold
 *  - Increased blurb font from text-[11px] → text-xs
 *  - Added "Live preview" muted header label above AdTreeVisualization
 *  - Ensured template bar spacing is mb-4
 *
 * Density/readability pass (2nd round):
 *  - Outer container: p-4 added to avoid flush edges
 *  - Two-column grid: gap-4 → gap-6
 *  - Left column: pr-1 → pr-3
 *  - Section containers: space-y-3 → space-y-4; card grids: gap-2 → gap-3
 *  - Page Split: ring-1 ring-border on idle for Fill first / Equal (90% cases)
 *    + RECOMMENDED badge on Fill first when unselected
 *  - Creative Mapping: COMMON badge on Round-robin and One per ad set when unselected
 *  - Structure section: dynamic formula note below StructureEditor
 *  - Right pane: pt-2 top padding; italic hint below tree
 */
import { cn } from "@/lib/utils";
import type { UseFlowV2 } from "../../state/useFlowV2";
import type { SpreadMode } from "../../types";
import AdTreeVisualization from "./distribution/AdTreeVisualization";
import CapMeterWithFixes from "./distribution/CapMeterWithFixes";
import StructureEditor from "./distribution/StructureEditor";
import DistributionTemplateBar, {
  DistributionSectionChip,
} from "./distribution/DistributionTemplateBar";
import { formatMoney } from "@/launch2/utils/time";
import { adSetCount, adsPerDestination } from "../../deriveV2";

type PageSplitId = "one_page" | "fill_first" | "equal" | "duplicate";
const PAGE_SPLIT_OPTIONS: { id: PageSplitId; label: string; blurb: string; popular?: boolean }[] = [
  { id: "fill_first", label: "Fill first", blurb: "Fill to 250, spill to next page", popular: true },
  { id: "equal",      label: "Equal",      blurb: "Spread evenly across all pages",  popular: true },
  { id: "one_page",   label: "One page",   blurb: "All ads go to a single page" },
  { id: "duplicate",  label: "Duplicate",  blurb: "Every page gets the full set (×spend)" },
];

const MAPPING_OPTIONS: { id: SpreadMode; label: string; blurb: string; popular?: boolean }[] = [
  { id: "round_robin",   label: "Round-robin",    blurb: "Distribute evenly across ad sets", popular: true },
  { id: "one_per_adset", label: "One per ad set", blurb: "1 creative per ad set (1:1)",      popular: true },
  { id: "stacked",       label: "Stacked",        blurb: "All creatives stacked in each ad set" },
  { id: "multiply",      label: "Multiply",       blurb: "One ad set per creative × structure" },
];

export default function Step4Distribution({ flow }: { flow: UseFlowV2 }) {
  const { plan, patch } = flow;
  const currency = plan.targets[0]?.currency ?? "INR";
  const duplicateMultiplier = Math.max(plan.targets.length, 1);

  // Dynamic formula for the structure note
  const campaigns = plan.structure.campaigns;
  const totalAdSets = adSetCount(plan);
  const totalAds = adsPerDestination(plan);

  return (
    <div
      data-screen="lv2-step4-distribution"
      className="flex h-full min-h-0 flex-col p-4"
    >
      {/* Template bar — mb-4 matches Setup step */}
      <div className="mb-4">
        <DistributionTemplateBar flow={flow} />
      </div>

      <div
        className="grid min-h-0 flex-1 gap-6"
        style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}
      >
        {/* LEFT — 3 control sections, space-y-6 replaces Separators */}
        <div className="overflow-y-auto space-y-6 pr-3">

          {/* Page Split */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-foreground tracking-[-0.01em]">
                Page Split
              </span>
              <DistributionSectionChip flow={flow} section="pageDistribution" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {PAGE_SPLIT_OPTIONS.map((opt) => {
                const on = plan.pageDistribution === opt.id;
                const isDupe = opt.id === "duplicate";
                const showRecommended = opt.id === "fill_first" && !on;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => patch({ pageDistribution: opt.id })}
                    aria-pressed={on}
                    className={cn(
                      "flex flex-col gap-1 rounded-2xl border p-4 text-left transition-colors",
                      on
                        ? isDupe
                          ? "border-amber-400 bg-amber-50/40 dark:bg-amber-950/20"
                          : "border-primary bg-primary/5"
                        : opt.popular
                          ? "border-border bg-card ring-1 ring-border hover:border-foreground/30"
                          : "border-border bg-card hover:border-foreground/30",
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[13px] font-semibold text-foreground">{opt.label}</span>
                      {showRecommended && (
                        <span className="font-mono text-[10px] uppercase tracking-wide text-primary">
                          RECOMMENDED
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{opt.blurb}</span>
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

          {/* Campaign Structure */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-foreground tracking-[-0.01em]">
                Campaign Structure
              </span>
              <DistributionSectionChip flow={flow} section="structure" />
            </div>
            <StructureEditor flow={flow} />
            <p className="text-[11px] text-muted-foreground">
              e.g. {campaigns} campaign{campaigns !== 1 ? "s" : ""} · {totalAdSets} ad set{totalAdSets !== 1 ? "s" : ""} · {totalAds} total ads
            </p>
          </div>

          {/* Creative Mapping */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-foreground tracking-[-0.01em]">
                Creative Mapping
              </span>
              <DistributionSectionChip flow={flow} section="spread" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {MAPPING_OPTIONS.map((opt) => {
                const on = plan.spread === opt.id;
                const showCommon = opt.popular && !on;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => patch({ spread: opt.id })}
                    aria-pressed={on}
                    className={cn(
                      "flex flex-col gap-1 rounded-2xl border p-4 text-left transition-colors",
                      on
                        ? "border-primary bg-primary/5"
                        : opt.popular
                          ? "border-border bg-card ring-1 ring-border hover:border-foreground/30"
                          : "border-border bg-card hover:border-foreground/30",
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[13px] font-semibold text-foreground">{opt.label}</span>
                      {showCommon && (
                        <span className="font-mono text-[10px] uppercase tracking-wide text-primary">
                          COMMON
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{opt.blurb}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT — live preview with explicit label */}
        <div className="overflow-y-auto space-y-4 pl-1 pt-2 border-l border-border">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.05em] font-semibold text-muted-foreground">
              Live preview
            </span>
          </div>
          <AdTreeVisualization flow={flow} />
          <p className="text-[11px] text-muted-foreground italic">
            Updates as you change settings on the left
          </p>
          <CapMeterWithFixes flow={flow} />
        </div>
      </div>
    </div>
  );
}
