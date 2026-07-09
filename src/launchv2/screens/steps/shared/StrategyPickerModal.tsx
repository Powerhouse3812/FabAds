/**
 * StrategyPickerModal — browse saved strategies and apply one to prefill the launch.
 *
 * Replaces the old always-visible inline strategy grid on Step 1. Triggered from
 * the "Auto fill from previous launches" CTA. Filters: name search (AND) +
 * objective chip (AND) + tag chip. Dismissible (Escape / outside click) — this is
 * a low-stakes picker before any launch data has been entered, unlike the
 * Step 2/3 import modals which lock to protect in-progress work.
 */

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Objective } from "../../../types";
import { OBJECTIVES } from "../../../data";
import { strategiesService } from "../../../services/strategiesService";
import type { LaunchStrategy } from "../../../services/strategiesService";

export interface StrategyPickerModalProps {
  open: boolean;
  onClose: () => void;
  onPick: (strategy: LaunchStrategy) => void;
}

/* ─── Helpers ───────────────────────────────────────────────────────────────── */

const OBJ_LABELS: Record<Objective, string> = {
  OUTCOME_SALES: "Sales",
  OUTCOME_TRAFFIC: "Traffic",
  OUTCOME_AWARENESS: "Awareness",
  OUTCOME_LEADS: "Leads",
  OUTCOME_ENGAGEMENT: "Engagement",
  OUTCOME_APP_PROMOTION: "App",
};

const FORMAT_LABELS: Record<string, string> = {
  single_image: "Image",
  single_video: "Video",
  carousel: "Carousel",
  collection: "Collection",
  flexible: "Flexible",
  dpa: "Catalogue",
};

const CURRENCY_SYM: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };

function fmtBudget(s: LaunchStrategy): string {
  const { budgetAmount, targets, budgetMode } = s.plan;
  if (!budgetAmount) return "—";
  const ccy = targets?.[0]?.currency;
  const sym = ccy ? (CURRENCY_SYM[ccy] ?? `${ccy} `) : "";
  return `${sym}${Math.round(budgetAmount).toLocaleString("en-IN")}/d · ${budgetMode ?? "—"}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
}

type ObjFilter = "All" | Objective;
const OBJ_CHIPS: ObjFilter[] = ["All", ...OBJECTIVES.map((o) => o.id)];

/* ─── Sub-components ────────────────────────────────────────────────────────── */

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-7 rounded-full px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] transition-colors",
        active
          ? "bg-[#8FB821] text-[#121212]"
          : "bg-[#F0F0EC] text-[rgba(15,15,12,0.62)] hover:bg-[#E8E8E4] dark:bg-[#1B1B1F] dark:text-[rgba(255,255,255,0.62)] dark:hover:bg-[#222226]",
      )}
    >
      {label}
    </button>
  );
}

function StrategyRow({ strategy, onUse }: { strategy: LaunchStrategy; onUse: () => void }) {
  const objective = strategy.plan.objective ? OBJ_LABELS[strategy.plan.objective] : "—";
  const format = strategy.plan.format ? FORMAT_LABELS[strategy.plan.format] ?? strategy.plan.format : "—";
  const partial = !(strategy.plan.targets?.length);

  return (
    <div
      className="group flex items-center gap-3 rounded-2xl border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] px-4 py-3 transition-all duration-[220ms] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] cursor-pointer"
      onClick={onUse}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[13px] font-semibold text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]">
            {strategy.name}
          </span>
          <span className="shrink-0 font-mono text-[11px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
            {fmtDate(strategy.updatedAt)}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-[#F0F0EC] dark:bg-[#1B1B1F] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]">
            {objective}
          </span>
          <span className="rounded-full bg-[#F5FBE2] dark:bg-[#1D2A09] px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[#5B7611] dark:text-[#C3E165]">
            {fmtBudget(strategy)}
          </span>
          <span className="rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] px-2 py-0.5 font-mono text-[10px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
            {format}
          </span>
          {partial && (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] text-amber-700 dark:text-amber-400">
              Partial
            </span>
          )}
          {(strategy.tags ?? []).slice(0, 2).map((t) => (
            <span key={t} className="rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] px-2 py-0.5 font-mono text-[10px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
              #{t}
            </span>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onUse(); }}
        className="shrink-0 rounded-full bg-[#8FB821] px-4 py-1.5 font-mono text-[11px] font-semibold text-[#121212] transition-colors hover:bg-[#AACF32] active:scale-[0.97]"
      >
        Use this
      </button>
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────────────────── */

export default function StrategyPickerModal({ open, onClose, onPick }: StrategyPickerModalProps) {
  const [q, setQ] = useState("");
  const [objFilter, setObjFilter] = useState<ObjFilter>("All");

  const strategies = useMemo(() => strategiesService.list(), [open]);

  const filtered = strategies.filter((s) => {
    const matchesQ = s.name.toLowerCase().includes(q.toLowerCase());
    const matchesObj = objFilter === "All" || s.plan.objective === objFilter;
    return matchesQ && matchesObj;
  });

  function resetFilters() {
    setQ("");
    setObjFilter("All");
  }

  function handleUse(s: LaunchStrategy) {
    onPick(s);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="flex max-h-[88vh] max-w-[600px] flex-col gap-0 overflow-hidden rounded-2xl p-0 bg-white dark:bg-[#1E1E23]">
        {/* Header */}
        <div className="flex flex-row items-center justify-between border-b border-[#e7e5dc] dark:border-[#2a2a2a] px-6 py-4">
          <div className="flex flex-col">
            <span className="text-[17px] font-bold tracking-[-0.01em] text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]">
              Saved strategies
            </span>
            <span className="font-mono text-[11px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] mt-0.5">
              Pick one to pre-fill this launch
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] flex items-center justify-center text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] transition-colors hover:bg-[#F0F0EC] dark:hover:bg-[#1B1B1F]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-[#FAFAF7] dark:bg-[#18181B] border-b border-[#e7e5dc] dark:border-[#2a2a2a] px-5 py-4 space-y-3">
          <div className="relative flex h-9 items-center">
            <Search className="absolute left-3.5 h-3.5 w-3.5 text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search saved strategies..."
              className="rounded-[28px] h-9 border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] pl-9 pr-4 text-[13px] text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] outline-none focus:border-[#8FB821]/50 focus:shadow-[0_0_0_3px_rgba(143,184,33,0.15)] w-full placeholder:font-mono placeholder:text-[rgba(15,15,12,0.4)] dark:placeholder:text-[rgba(255,255,255,0.4)] transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
              Objective
            </p>
            <div className="flex flex-wrap gap-1.5">
              {OBJ_CHIPS.map((o) => (
                <FilterChip
                  key={o}
                  label={o === "All" ? "All" : OBJ_LABELS[o]}
                  active={objFilter === o}
                  onClick={() => setObjFilter(o)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="px-5 py-2 border-b border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23]">
          <span className="font-mono text-[11px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
            {filtered.length} strateg{filtered.length !== 1 ? "ies" : "y"}
          </span>
        </div>

        {/* List */}
        <div className="bg-[#FAFAF7] dark:bg-[#18181B] flex-1 overflow-y-auto px-5 py-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="h-10 w-10 rounded-xl bg-[#F0F0EC] dark:bg-[#1B1B1F] flex items-center justify-center">
                <Search className="h-4 w-4 text-[rgba(15,15,12,0.35)] dark:text-[rgba(255,255,255,0.35)]" />
              </div>
              <p className="text-[13px] font-medium text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]">
                No strategies match
              </p>
              <p className="font-mono text-[11px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
                Try a different filter or clear the search
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] px-4 py-1.5 text-[12px] font-medium text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)] hover:border-[#8FB821]/40 transition-colors"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((s) => (
                <StrategyRow key={s.id} strategy={s} onUse={() => handleUse(s)} />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
