import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface StrategyFilters {
  objectives: string[];
  budgetModes: string[];
  tags: string[];
  hasAllSteps: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  filters: StrategyFilters;
  onChange: (filters: StrategyFilters) => void;
  availableTags: string[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const OBJECTIVE_OPTIONS: { value: string; label: string }[] = [
  { value: "OUTCOME_SALES", label: "Sales" },
  { value: "OUTCOME_LEADS", label: "Leads" },
  { value: "OUTCOME_TRAFFIC", label: "Traffic" },
  { value: "OUTCOME_AWARENESS", label: "Awareness" },
  { value: "OUTCOME_ENGAGEMENT", label: "Engagement" },
  { value: "OUTCOME_APP_PROMOTION", label: "App" },
];

const BUDGET_MODE_OPTIONS: { value: string; label: string }[] = [
  { value: "CBO", label: "CBO" },
  { value: "ABO", label: "ABO" },
];

const EMPTY_FILTERS: StrategyFilters = {
  objectives: [],
  budgetModes: [],
  tags: [],
  hasAllSteps: false,
};

/* ------------------------------------------------------------------ */
/*  Pill button                                                         */
/* ------------------------------------------------------------------ */

interface PillProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  mono?: boolean;
}

function Pill({ active, onClick, children, mono = false }: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold transition-colors duration-150 select-none",
        mono && "font-mono tracking-wide uppercase",
        active
          ? "bg-[#8FB821] text-[#121212] border border-[#8FB821]"
          : "border border-[#e7e5dc] dark:border-[#2a2a2a] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)] hover:border-[#8FB821] hover:text-[#5B7611] dark:hover:text-[#C3E165]",
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Section label                                                       */
/* ------------------------------------------------------------------ */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  StrategyFilterModal                                                 */
/* ------------------------------------------------------------------ */

export function StrategyFilterModal({
  open,
  onClose,
  filters,
  onChange,
  availableTags,
}: Props) {
  // Local draft — only committed on Apply
  const [draft, setDraft] = useState<StrategyFilters>(filters);

  // Sync draft when modal opens
  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  /* ---- toggle helpers ---- */

  function toggleObjective(val: string) {
    setDraft((d) => ({
      ...d,
      objectives: d.objectives.includes(val)
        ? d.objectives.filter((v) => v !== val)
        : [...d.objectives, val],
    }));
  }

  function toggleBudgetMode(val: string) {
    setDraft((d) => ({
      ...d,
      budgetModes: d.budgetModes.includes(val)
        ? d.budgetModes.filter((v) => v !== val)
        : [...d.budgetModes, val],
    }));
  }

  function toggleTag(tag: string) {
    setDraft((d) => ({
      ...d,
      tags: d.tags.includes(tag)
        ? d.tags.filter((t) => t !== tag)
        : [...d.tags, tag],
    }));
  }

  function handleApply() {
    onChange(draft);
    onClose();
  }

  function handleClear() {
    setDraft(EMPTY_FILTERS);
  }

  const visibleTags = availableTags.slice(0, 12);

  const activeCount =
    draft.objectives.length +
    draft.budgetModes.length +
    draft.tags.length +
    (draft.hasAllSteps ? 1 : 0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-[4px]">
      <div
        className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl bg-white dark:bg-[#1E1E23] border border-[#e7e5dc] dark:border-[#2a2a2a] shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Filter strategies"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#e7e5dc] dark:border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] tracking-[-0.01em]">
              Filter strategies
            </span>
            {activeCount > 0 && (
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] rounded-full px-2 py-0.5 bg-[#8FB821] text-[#121212]">
                {activeCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] hover:bg-[#F0F0EC] dark:hover:bg-[#2a2a2a] transition-colors"
            aria-label="Close filter modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-5 max-h-[60vh] overflow-y-auto">

          {/* Objective */}
          <section className="flex flex-col gap-2.5">
            <SectionLabel>Objective</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {OBJECTIVE_OPTIONS.map((opt) => (
                <Pill
                  key={opt.value}
                  active={draft.objectives.includes(opt.value)}
                  onClick={() => toggleObjective(opt.value)}
                >
                  {opt.label}
                </Pill>
              ))}
            </div>
          </section>

          {/* Budget mode */}
          <section className="flex flex-col gap-2.5">
            <SectionLabel>Budget Mode</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {BUDGET_MODE_OPTIONS.map((opt) => (
                <Pill
                  key={opt.value}
                  active={draft.budgetModes.includes(opt.value)}
                  onClick={() => toggleBudgetMode(opt.value)}
                  mono
                >
                  {opt.label}
                </Pill>
              ))}
            </div>
          </section>

          {/* Tags — only rendered when tags exist */}
          {visibleTags.length > 0 && (
            <section className="flex flex-col gap-2.5">
              <SectionLabel>Tags</SectionLabel>
              <div className="flex flex-wrap gap-2 max-h-[96px] overflow-y-auto">
                {visibleTags.map((tag) => (
                  <Pill
                    key={tag}
                    active={draft.tags.includes(tag)}
                    onClick={() => toggleTag(tag)}
                    mono
                  >
                    {tag}
                  </Pill>
                ))}
              </div>
            </section>
          )}

          {/* Launch readiness toggle */}
          <section className="flex flex-col gap-2.5">
            <SectionLabel>Launch Readiness</SectionLabel>
            <div className="flex items-center justify-between py-2 px-3 rounded-xl border border-[#e7e5dc] dark:border-[#2a2a2a] bg-[#FAFAF7] dark:bg-[#18181B]">
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-medium text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]">
                  Complete strategies only
                </span>
                <span className="font-mono text-[11px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
                  All 4 steps filled in
                </span>
              </div>
              <Switch
                checked={draft.hasAllSteps}
                onCheckedChange={(checked) =>
                  setDraft((d) => ({ ...d, hasAllSteps: checked }))
                }
                className="data-[state=checked]:bg-[#8FB821]"
              />
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 bg-[#fbfbf9] dark:bg-[#18181B] border-t border-[#e7e5dc] dark:border-[#2a2a2a]">
          <button
            type="button"
            onClick={handleClear}
            disabled={activeCount === 0}
            className="rounded-full px-4 py-2 text-[13px] font-medium text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)] hover:text-[rgba(15,15,12,0.92)] dark:hover:text-[rgba(255,255,255,0.92)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="rounded-full bg-[#8FB821] text-[#121212] px-5 py-2 text-[13px] font-semibold hover:bg-[#AACF32] active:bg-[#5B7611] transition-colors"
          >
            Apply{activeCount > 0 ? ` · ${activeCount}` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

export default StrategyFilterModal;
