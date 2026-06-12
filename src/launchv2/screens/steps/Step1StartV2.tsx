/**
 * Step 1 — Start V2 (complete redesign, Genie-studio mode-selector feel).
 *
 * Design philosophy:
 *   - Objective = the entry point. Large, icon-led cards dominate the canvas.
 *     2-col grid for visual weight. Linear-style "mode selector" feel.
 *   - Launch strategy section: custom Popover picker with inline property chips,
 *     filtered by selected objective, prefill on select + save-as checkbox.
 *   - Progressive disclosure: strategy picker unlocked after objective is picked.
 */
import { useState } from "react";
import {
  Check,
  ChevronDown,
  Eye,
  MessageSquare,
  MousePointer2,
  Rocket,
  ShoppingCart,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { UseFlowV2 } from "../../state/useFlowV2";
import type { Objective } from "../../types";
import { OBJECTIVES } from "../../data";
import { strategiesService } from "../../services/strategiesService";
import type { LaunchStrategy } from "../../services/strategiesService";

/* ------------------------------------------------------------------ */
/*  Objective metadata                                                  */
/* ------------------------------------------------------------------ */

type ObjIcon = React.ComponentType<{ className?: string }>;

const OBJECTIVE_META: Record<
  Objective,
  { Icon: ObjIcon; desc: string }
> = {
  OUTCOME_SALES: {
    Icon: ShoppingCart,
    desc: "Drive purchases on your website or app",
  },
  OUTCOME_AWARENESS: {
    Icon: Eye,
    desc: "Reach people most likely to recall your brand",
  },
  OUTCOME_TRAFFIC: {
    Icon: MousePointer2,
    desc: "Send people to your website or landing page",
  },
  OUTCOME_ENGAGEMENT: {
    Icon: MessageSquare,
    desc: "Get more reactions, comments, and shares",
  },
  OUTCOME_APP_PROMOTION: {
    Icon: Smartphone,
    desc: "Increase installs and in-app actions",
  },
  OUTCOME_LEADS: {
    Icon: Rocket,
    desc: "Collect leads for your business",
  },
};

/* ------------------------------------------------------------------ */
/*  Chip helpers                                                        */
/* ------------------------------------------------------------------ */

function prettifyObjective(o?: string | null): string {
  if (!o) return "";
  const raw = o.replace(/^OUTCOME_/, "");
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function prettifyFormat(f?: string | null): string {
  if (!f) return "";
  const MAP: Record<string, string> = {
    single_image: "Image",
    single_video: "Video",
    carousel: "Carousel",
    collection: "Collection",
    flexible: "Flexible",
    dpa: "DPA",
  };
  return MAP[f] ?? f;
}

function formatBudget(plan: LaunchStrategy["plan"]): string {
  const { budgetAmount, targets, budgetMode: _bm } = plan;
  if (!budgetAmount) return "";
  const currency = targets?.[0]?.currency;
  const SYMBOLS: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };
  const sym = currency ? (SYMBOLS[currency] ?? `${currency} `) : "";
  return `${sym}${Math.round(budgetAmount).toLocaleString("en-IN")}/day`;
}

/* ---- Filter chip ---- */
function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-6 rounded-full border px-2 text-[11px] font-medium transition-colors",
        active
          ? "border-primary/30 bg-primary/10 text-foreground"
          : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/* ---- Strategy chips row ---- */
function StrategyChips({ strategy }: { strategy: LaunchStrategy }) {
  const { plan } = strategy;
  const chips: { label: string; accent?: boolean }[] = [];

  const obj = prettifyObjective(plan.objective);
  if (obj) chips.push({ label: obj });

  const budgetMode = plan.budgetMode;
  if (budgetMode) chips.push({ label: budgetMode, accent: budgetMode === "CBO" });

  const budget = formatBudget(plan);
  if (budget) chips.push({ label: budget });

  const fmt = prettifyFormat(plan.format);
  if (fmt) chips.push({ label: fmt });

  const acctCount = plan.targets?.length ?? 0;
  if (acctCount > 0) {
    chips.push({ label: `✓ ${acctCount} account${acctCount !== 1 ? "s" : ""}` });
  } else {
    chips.push({ label: "No accounts" });
  }

  const hasPixel = plan.targets?.some((t) => t.pixelId);
  if (hasPixel) chips.push({ label: "Pixel ✓" });

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {chips.slice(0, 6).map((chip, i) => (
        <span
          key={i}
          className={cn(
            "rounded-full border px-2 py-0.5 font-mono text-[10px]",
            chip.accent
              ? "border-primary/20 bg-primary/10 text-primary"
              : "border-border bg-muted/50 text-muted-foreground",
          )}
        >
          {chip.label}
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main screen                                                         */
/* ------------------------------------------------------------------ */

export default function Step1StartV2({
  flow,
  saveAsStrategy,
  onSaveAsStrategyChange,
}: {
  flow: UseFlowV2;
  saveAsStrategy: boolean;
  onSaveAsStrategyChange: (v: boolean) => void;
}) {
  const { plan } = flow;
  const { objective } = plan;

  // Launch strategy picker — real data from strategiesService
  const [savedStrategies] = useState(() => strategiesService.list());
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [prefillNotice, setPrefillNotice] = useState(false);

  // Additional filter state
  const [budgetModeFilter, setBudgetModeFilter] = useState<"all" | "CBO" | "ABO">("all");
  const [budgetRangeFilter, setBudgetRangeFilter] = useState<"all" | "lt2k" | "2k10k" | "gt10k">("all");
  const [formatFilter, setFormatFilter] = useState<"all" | "single_image" | "single_video" | "carousel">("all");

  const chooseObjective = (o: Objective) => flow.chooseObjectiveFormat(o, null);

  const strategyUnlocked = objective !== null;

  // Filter strategies: objective + budget mode + budget range + format
  const filteredStrategies = savedStrategies.filter((s) => {
    if (s.plan.objective && objective && s.plan.objective !== objective) return false;
    if (budgetModeFilter !== "all" && s.plan.budgetMode !== budgetModeFilter) return false;
    if (budgetRangeFilter === "lt2k" && !((s.plan.budgetAmount ?? 0) < 2000)) return false;
    if (budgetRangeFilter === "2k10k" && !((s.plan.budgetAmount ?? 0) >= 2000 && (s.plan.budgetAmount ?? 0) <= 10000)) return false;
    if (budgetRangeFilter === "gt10k" && !((s.plan.budgetAmount ?? 0) > 10000)) return false;
    if (formatFilter !== "all" && s.plan.format !== formatFilter) return false;
    return true;
  });

  const selectedStrategy = selectedStrategyId
    ? savedStrategies.find((s) => s.id === selectedStrategyId)
    : undefined;

  const handleStrategySelect = (id: string) => {
    setSelectedStrategyId(id);
    setPopoverOpen(false);
    const strategy = savedStrategies.find((s) => s.id === id);
    if (strategy?.plan) {
      flow.patch(strategy.plan);
      setPrefillNotice(true);
    }
  };

  return (
    <div data-screen="lv2-step1-start-v2" className="space-y-8">
      {/* ── Objective heading ─────────────────────────────────────── */}
      <div>
        <h2 className="text-[16px] font-semibold text-foreground">
          What's your campaign goal?
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Choose the objective that matches what you want to achieve
        </p>
      </div>

      {/* ── Objective cards (hero) ────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {OBJECTIVES.map((o) => {
          const { Icon, desc } = OBJECTIVE_META[o.id];
          const selected = objective === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => chooseObjective(o.id)}
              aria-pressed={selected}
              className={cn(
                "relative flex flex-col gap-3 rounded-2xl border p-5 text-left transition-all duration-200",
                selected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-foreground/20 hover:bg-muted/30",
              )}
            >
              {/* Icon container */}
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                  selected ? "bg-primary/15" : "bg-muted",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    selected ? "text-primary" : "text-muted-foreground",
                  )}
                />
              </div>

              {/* Label + description */}
              <div>
                <p className="text-[14px] font-semibold text-foreground">{o.label}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">{desc}</p>
              </div>

              {/* Selected check — absolute top-right */}
              {selected && (
                <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Launch strategy — optional, unlocks after objective ───── */}
      <div
        className={cn(
          "space-y-3 transition-opacity duration-300",
          strategyUnlocked ? "opacity-100" : "pointer-events-none opacity-40",
        )}
        aria-disabled={!strategyUnlocked}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">Launch strategy</span>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Optional
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Start from a saved strategy to pre-fill setup, distribution, and audience settings.
          You can still edit any field after applying.
        </p>

        {/* Custom strategy picker — Popover */}
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={!strategyUnlocked}
              className={cn(
                "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors",
                "hover:border-foreground/30 focus:outline-none focus:ring-1 focus:ring-ring",
                !selectedStrategy && "text-muted-foreground",
              )}
            >
              <span className="truncate">
                {selectedStrategy ? selectedStrategy.name : "Choose a saved strategy…"}
              </span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0"
            align="start"
            sideOffset={4}
          >
            {/* Filter rows */}
            <div className="border-b border-border px-3 pb-2 pt-2.5 space-y-2">
              {/* Budget mode row */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 shrink-0 w-16">Mode</span>
                {(["all", "CBO", "ABO"] as const).map((mode) => (
                  <FilterChip
                    key={mode}
                    active={budgetModeFilter === mode}
                    onClick={() => setBudgetModeFilter(mode === budgetModeFilter ? "all" : mode)}
                  >
                    {mode === "all" ? "All" : mode}
                  </FilterChip>
                ))}
              </div>
              {/* Budget range row */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 shrink-0 w-16">Budget</span>
                {(["all", "lt2k", "2k10k", "gt10k"] as const).map((range) => (
                  <FilterChip
                    key={range}
                    active={budgetRangeFilter === range}
                    onClick={() => setBudgetRangeFilter(range === budgetRangeFilter ? "all" : range)}
                  >
                    {range === "all" ? "All" : range === "lt2k" ? "< ₹2K" : range === "2k10k" ? "₹2K–10K" : "₹10K+"}
                  </FilterChip>
                ))}
              </div>
              {/* Format row */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 shrink-0 w-16">Format</span>
                {(["all", "single_image", "single_video", "carousel"] as const).map((fmt) => (
                  <FilterChip
                    key={fmt}
                    active={formatFilter === fmt}
                    onClick={() => setFormatFilter(fmt === formatFilter ? "all" : fmt)}
                  >
                    {fmt === "all" ? "All" : fmt === "single_image" ? "Image" : fmt === "single_video" ? "Video" : "Carousel"}
                  </FilterChip>
                ))}
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {savedStrategies.length === 0 ? (
                <div className="px-3 py-4 text-center text-[11px] font-mono text-muted-foreground">
                  No saved strategies yet
                </div>
              ) : filteredStrategies.length === 0 ? (
                <div className="px-3 py-4 text-center text-[11px] font-mono text-muted-foreground">
                  No strategies match the selected filters
                </div>
              ) : (
                filteredStrategies.map((s) => {
                  const isSelected = selectedStrategyId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleStrategySelect(s.id)}
                      className={cn(
                        "w-full px-3 py-2.5 text-left transition-colors hover:bg-muted/50",
                        isSelected && "bg-primary/5",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{s.name}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                      </div>
                      <StrategyChips strategy={s} />
                    </button>
                  );
                })
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Prefill confirmation notice */}
        {prefillNotice && (
          <div
            className="flex items-start gap-2 rounded-xl border border-border/60 bg-muted/50 px-3 py-2"
            role="status"
            aria-live="polite"
          >
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <p className="text-[11px] font-mono text-muted-foreground leading-relaxed">
              Strategy applied — all fields pre-filled. You can still edit any step.
            </p>
            <button
              type="button"
              onClick={() => setPrefillNotice(false)}
              className="ml-auto shrink-0 text-[11px] text-muted-foreground/60 hover:text-muted-foreground"
              aria-label="Dismiss notice"
            >
              ✕
            </button>
          </div>
        )}

        {/* Save as strategy checkbox */}
        <label className="flex cursor-pointer items-center gap-2 select-none">
          <input
            type="checkbox"
            checked={saveAsStrategy}
            onChange={(e) => onSaveAsStrategyChange(e.target.checked)}
            className="h-3.5 w-3.5 rounded accent-primary"
          />
          <span className="text-[11px] text-muted-foreground">
            Save this launch as a reusable strategy when it completes
          </span>
        </label>
      </div>
    </div>
  );
}
