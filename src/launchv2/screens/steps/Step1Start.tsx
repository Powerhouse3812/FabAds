/**
 * Step 1 — Start (V1 corrected). Two sections:
 *   1. Objective (required) — 6-card grid with per-objective Lucide icons.
 *   2. Launch strategy (optional) — horizontal scrolling card row with search
 *      + filter chips above. Selecting a strategy calls flow.patch() to prefill
 *      the whole launch. "Custom launch" card is always first and auto-selected.
 */
import { useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  MousePointer2,
  MessageSquare,
  Rocket,
  ShoppingCart,
  Smartphone,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UseFlowV2 } from "../../state/useFlowV2";
import type { Objective } from "../../types";
import { OBJECTIVES } from "../../data";
import { strategiesService } from "../../services/strategiesService";
import type { LaunchStrategy } from "../../services/strategiesService";

/** Map each Meta ODAX objective to a Lucide icon. */
const OBJECTIVE_ICONS: Record<Objective, React.ReactNode> = {
  OUTCOME_AWARENESS: <Eye className="h-4 w-4 shrink-0" />,
  OUTCOME_TRAFFIC: <MousePointer2 className="h-4 w-4 shrink-0" />,
  OUTCOME_ENGAGEMENT: <MessageSquare className="h-4 w-4 shrink-0" />,
  OUTCOME_LEADS: <Rocket className="h-4 w-4 shrink-0" />,
  OUTCOME_APP_PROMOTION: <Smartphone className="h-4 w-4 shrink-0" />,
  OUTCOME_SALES: <ShoppingCart className="h-4 w-4 shrink-0" />,
};

/* ---- chip helpers ---- */

function prettifyObjective(o?: string | null): string {
  if (!o) return "";
  return o.replace(/^OUTCOME_/, "").charAt(0).toUpperCase() + o.replace(/^OUTCOME_/, "").slice(1).toLowerCase();
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
  const { budgetAmount, targets, budgetMode } = plan;
  if (!budgetAmount) return "";
  const currency = targets?.[0]?.currency;
  const SYMBOLS: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };
  const sym = currency ? (SYMBOLS[currency] ?? `${currency} `) : "";
  const formatted = `${sym}${Math.round(budgetAmount).toLocaleString("en-IN")}/day`;
  return formatted;
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
    chips.push({ label: `${acctCount} acct${acctCount !== 1 ? "s" : ""}` });
  } else {
    chips.push({ label: "No accounts" });
  }

  const hasPixel = plan.targets?.some((t) => t.pixelId);
  if (hasPixel) chips.push({ label: "Pixel set" });

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

/* ---- Filter dropdown ---- */
function FilterDropdown({
  label,
  value,
  options,
  renderLabel,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  renderLabel: (v: string) => string;
  onChange: (v: string) => void;
}) {
  const isActive = value !== options[0];
  return (
    <div className="relative shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-7 cursor-pointer appearance-none rounded-md border pr-5 pl-2 text-[11px] font-medium transition-colors outline-none",
          isActive
            ? "border-primary/40 bg-primary/10 text-foreground"
            : "border-border/60 bg-transparent text-muted-foreground hover:border-foreground/30 hover:text-foreground",
        )}
        aria-label={label}
      >
        {options.map((o) => (
          <option key={o} value={o}>{renderLabel(o)}</option>
        ))}
      </select>
      {/* chevron icon */}
      <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground">
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M1.5 2.5L4 5.5L6.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    </div>
  );
}

/* ---- Props ---- */
interface Step1StartProps {
  flow: UseFlowV2;
  saveAsStrategy: boolean;
  onSaveAsStrategyChange: (v: boolean) => void;
}

export default function Step1Start({ flow, saveAsStrategy, onSaveAsStrategyChange }: Step1StartProps) {
  const { plan } = flow;
  const { objective } = plan;

  // Launch strategy picker — real data from strategiesService
  const [savedStrategies] = useState(() => strategiesService.list());
  // null = "Custom launch" selected (default)
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  const [prefillNotice, setPrefillNotice] = useState(false);
  // Simulated loading state for strategies (will be real when wired to async fetch)
  const [strategiesLoading, setStrategiesLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setStrategiesLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  // Auto-dismiss the prefill notice after 4s
  useEffect(() => {
    if (!prefillNotice) return;
    const t = setTimeout(() => setPrefillNotice(false), 4000);
    return () => clearTimeout(t);
  }, [prefillNotice]);

  // Filter state
  const [budgetModeFilter, setBudgetModeFilter] = useState<"all" | "CBO" | "ABO">("all");
  const [budgetRangeFilter, setBudgetRangeFilter] = useState<"all" | "lt2k" | "2k10k" | "gt10k">("all");
  const [formatFilter, setFormatFilter] = useState<"all" | "single_image" | "single_video" | "carousel">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // View more state
  const VISIBLE_COUNT = 3;
  const [showAll, setShowAll] = useState(false);

  const chooseObjective = (o: Objective) => flow.chooseObjectiveFormat(o, null);

  // Filter strategies: objective + budget mode + budget range + format + search
  const filteredStrategies = savedStrategies.filter((s) => {
    if (s.plan.objective && objective && s.plan.objective !== objective) return false;
    if (budgetModeFilter !== "all" && s.plan.budgetMode !== budgetModeFilter) return false;
    if (budgetRangeFilter === "lt2k" && !((s.plan.budgetAmount ?? 0) < 2000)) return false;
    if (budgetRangeFilter === "2k10k" && !((s.plan.budgetAmount ?? 0) >= 2000 && (s.plan.budgetAmount ?? 0) <= 10000)) return false;
    if (budgetRangeFilter === "gt10k" && !((s.plan.budgetAmount ?? 0) > 10000)) return false;
    if (formatFilter !== "all" && s.plan.format !== formatFilter) return false;
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const visibleStrategies = showAll ? filteredStrategies : filteredStrategies.slice(0, VISIBLE_COUNT);
  const hiddenCount = filteredStrategies.length - VISIBLE_COUNT;

  const handleStrategySelect = (id: string) => {
    setSelectedStrategyId(id);
    const strategy = savedStrategies.find((s) => s.id === id);
    if (strategy?.plan) {
      flow.patch(strategy.plan);
      setPrefillNotice(true);
    }
  };

  const handleClearStrategy = () => {
    setSelectedStrategyId(null);
    // Don't call flow.patch here — "custom" just means no prefill
  };

  return (
    <div data-screen="lv2-step1-start" className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Start a launch</h1>
        <p className="text-sm text-muted-foreground">
          Pick an objective. Saved strategies pre-fill the rest.
        </p>
      </header>

      {/* ── 1. Objective ─────────────────────────────────────────── */}
      <Section
        index={1}
        title="Objective"
        badgeSlot={
          <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
            Required
          </span>
        }
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {OBJECTIVES.map((o) => {
            const selected = objective === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => chooseObjective(o.id)}
                aria-pressed={selected}
                className={cn(
                  "fab-focus flex flex-col gap-0.5 rounded-2xl border bg-card p-3 text-left transition-colors",
                  selected ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    {OBJECTIVE_ICONS[o.id]}
                    {o.label}
                  </span>
                  {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </div>
                <span className="mt-0.5 text-xs text-muted-foreground">{o.desc}</span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* ── 2. Launch strategy — optional ──────────────────────────── */}
      <Section
        index={2}
        title="Launch strategy"
        badgeSlot={
          <span className="text-[10px] text-muted-foreground/60">
            Optional — prefills all setup fields
          </span>
        }
      >
        {/* Search bar + inline filter dropdowns — single row */}
        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search strategies…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground/60 outline-none"
          />
          {/* divider */}
          <span className="h-4 w-px shrink-0 bg-border/60" />
          <FilterDropdown
            label="Mode filter"
            value={budgetModeFilter}
            options={["all", "CBO", "ABO"]}
            renderLabel={(v) => v === "all" ? "Mode" : v}
            onChange={(v) => setBudgetModeFilter(v as typeof budgetModeFilter)}
          />
          <FilterDropdown
            label="Budget filter"
            value={budgetRangeFilter}
            options={["all", "lt2k", "2k10k", "gt10k"]}
            renderLabel={(v) => v === "all" ? "Budget" : v === "lt2k" ? "< ₹2K" : v === "2k10k" ? "₹2K–10K" : "₹10K+"}
            onChange={(v) => setBudgetRangeFilter(v as typeof budgetRangeFilter)}
          />
          <FilterDropdown
            label="Format filter"
            value={formatFilter}
            options={["all", "single_image", "single_video", "carousel"]}
            renderLabel={(v) => v === "all" ? "Format" : v === "single_image" ? "Image" : v === "single_video" ? "Video" : "Carousel"}
            onChange={(v) => setFormatFilter(v as typeof formatFilter)}
          />
        </div>

        {/* Strategy card row */}
        <div className="space-y-2">
          {strategiesLoading ? (
            <div className="flex flex-wrap gap-2" aria-busy="true" aria-label="Loading strategies">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-muted/30 min-w-[180px] h-[120px] animate-pulse"
                />
              ))}
            </div>
          ) : (
          <div className="flex flex-wrap gap-2">
            {/* Custom launch card — always first, auto-selected by default */}
            <button
              type="button"
              onClick={handleClearStrategy}
              className={cn(
                "fab-focus flex flex-col gap-1.5 rounded-2xl border p-4 text-left min-w-[180px] max-w-[220px] transition-colors",
                selectedStrategyId === null
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-foreground/30",
              )}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-foreground">Custom launch</span>
                {selectedStrategyId === null && <Check className="h-3.5 w-3.5 text-primary" />}
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">Configure all fields manually — no preset applied</span>
            </button>

            {/* Saved strategy cards */}
            {savedStrategies.length === 0 ? null : filteredStrategies.length === 0 ? null : (
              visibleStrategies.map((s) => {
                const isSelected = selectedStrategyId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleStrategySelect(s.id)}
                    className={cn(
                      "fab-focus flex flex-col gap-1.5 rounded-2xl border p-4 text-left min-w-[180px] max-w-[220px] transition-colors flex-shrink-0",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-foreground/30",
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-semibold text-foreground truncate">{s.name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                    </div>
                    <StrategyChips strategy={s} />
                  </button>
                );
              })
            )}
          </div>
          )}

          {/* Zero-data messages */}
          {!strategiesLoading && savedStrategies.length === 0 && (
            <p className="text-[11px] font-mono text-muted-foreground">
              No saved strategies. Launches you save here will appear in this picker.
            </p>
          )}
          {!strategiesLoading && savedStrategies.length > 0 && filteredStrategies.length === 0 && (
            <p className="text-[11px] font-mono text-muted-foreground">
              No strategies match the selected filters.
            </p>
          )}

          {/* View more / Show less — Lucide chevrons instead of glyph arrows (7.1). */}
          {!showAll && hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="fab-focus inline-flex items-center gap-1 rounded text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View {hiddenCount} more <ChevronDown className="h-3 w-3" />
            </button>
          )}
          {showAll && filteredStrategies.length > VISIBLE_COUNT && (
            <button
              type="button"
              onClick={() => setShowAll(false)}
              className="fab-focus inline-flex items-center gap-1 rounded text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Show less <ChevronUp className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Prefill confirmation notice */}
        {prefillNotice && (
          <div
            className="flex items-start gap-2 rounded-xl border border-border/60 bg-muted/50 px-3 py-2"
            role="status"
            aria-live="polite"
          >
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <p className="text-[11px] font-mono text-muted-foreground leading-relaxed">
              Applied. All fields prefilled — edit any step to override.
            </p>
            <button
              type="button"
              onClick={() => setPrefillNotice(false)}
              className="ml-auto shrink-0 text-muted-foreground/60 hover:text-muted-foreground"
              aria-label="Dismiss notice"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Save as strategy row */}
        <label className="flex cursor-pointer items-center gap-2 select-none">
          <input
            type="checkbox"
            checked={saveAsStrategy}
            onChange={(e) => onSaveAsStrategyChange(e.target.checked)}
            className="h-3.5 w-3.5 rounded accent-primary"
          />
          <span className="text-[11px] text-muted-foreground">Save this launch as a reusable strategy when it completes</span>
        </label>
      </Section>
    </div>
  );
}

/* ---- section shell ---- */
function Section({
  index,
  title,
  badgeSlot,
  children,
}: {
  index: number;
  title: string;
  /** Optional slot for the Required/Optional badge — rendered next to title. */
  badgeSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted font-mono text-[11px] font-semibold tabular-nums text-muted-foreground">
          {index}
        </span>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {badgeSlot}
      </div>
      {children}
    </section>
  );
}
