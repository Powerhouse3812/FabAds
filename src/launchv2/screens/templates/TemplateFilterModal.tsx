/**
 * TemplateFilterModal — filter drawer for the Audience Templates panel view.
 *
 * Filter fields:
 *   - Placement mode (Advantage+ / Manual)
 *   - Optimization goal (multi-select pills)
 *   - Gender (multi-select pills)
 *   - Advantage+ Audience toggle
 *
 * Pattern mirrors StrategyFilterModal exactly — local draft, Apply commits, Escape closes.
 * Design: FabFunnel v1.2 — lime #8FB821, Geist Mono labels, rounded-2xl modal.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface TemplateFilters {
  placementModes: string[];
  optimizationGoals: string[];
  genders: string[];
  hasAdvantageAudience: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  filters: TemplateFilters;
  onChange: (filters: TemplateFilters) => void;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const PLACEMENT_OPTIONS: { value: string; label: string }[] = [
  { value: 'advantage', label: 'Advantage+' },
  { value: 'manual', label: 'Manual' },
];

const GOAL_OPTIONS: { value: string; label: string }[] = [
  { value: 'OFFSITE_CONVERSIONS', label: 'Conversions' },
  { value: 'LINK_CLICKS', label: 'Link Clicks' },
  { value: 'REACH', label: 'Reach' },
  { value: 'VALUE', label: 'Value' },
  { value: 'IMPRESSIONS', label: 'Impressions' },
  { value: 'LANDING_PAGE_VIEWS', label: 'Landing Page' },
  { value: 'VIDEO_VIEWS', label: 'Video Views' },
  { value: 'LEAD_GENERATION', label: 'Lead Gen' },
];

const GENDER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
];

const EMPTY_FILTERS: TemplateFilters = {
  placementModes: [],
  optimizationGoals: [],
  genders: [],
  hasAdvantageAudience: false,
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
        'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold transition-colors duration-150 select-none',
        mono && 'font-mono tracking-wide uppercase',
        active
          ? 'bg-[#8FB821] text-[#121212] border border-[#8FB821]'
          : 'border border-[#e7e5dc] dark:border-[#2a2a2a] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)] hover:border-[#8FB821] hover:text-[#5B7611] dark:hover:text-[#C3E165]',
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
/*  TemplateFilterModal                                                 */
/* ------------------------------------------------------------------ */

export function TemplateFilterModal({ open, onClose, filters, onChange }: Props) {
  const [draft, setDraft] = useState<TemplateFilters>(filters);

  // Sync draft when modal opens
  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const backdropRef = useRef<HTMLDivElement>(null);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === backdropRef.current) onClose();
    },
    [onClose],
  );

  /* ---- toggle helpers ---- */

  function togglePlacement(val: string) {
    setDraft((d) => ({
      ...d,
      placementModes: d.placementModes.includes(val)
        ? d.placementModes.filter((v) => v !== val)
        : [...d.placementModes, val],
    }));
  }

  function toggleGoal(val: string) {
    setDraft((d) => ({
      ...d,
      optimizationGoals: d.optimizationGoals.includes(val)
        ? d.optimizationGoals.filter((v) => v !== val)
        : [...d.optimizationGoals, val],
    }));
  }

  function toggleGender(val: string) {
    setDraft((d) => ({
      ...d,
      genders: d.genders.includes(val)
        ? d.genders.filter((v) => v !== val)
        : [...d.genders, val],
    }));
  }

  function handleApply() {
    onChange(draft);
    onClose();
  }

  function handleClear() {
    setDraft(EMPTY_FILTERS);
  }

  const activeCount =
    draft.placementModes.length +
    draft.optimizationGoals.length +
    draft.genders.length +
    (draft.hasAdvantageAudience ? 1 : 0);

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-[4px]"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl bg-white dark:bg-[#1E1E23] border border-[#e7e5dc] dark:border-[#2a2a2a] shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Filter templates"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#e7e5dc] dark:border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] tracking-[-0.01em]">
              Filter templates
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

          {/* Placement mode */}
          <section className="flex flex-col gap-2.5">
            <SectionLabel>Placement Mode</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {PLACEMENT_OPTIONS.map((opt) => (
                <Pill
                  key={opt.value}
                  active={draft.placementModes.includes(opt.value)}
                  onClick={() => togglePlacement(opt.value)}
                  mono
                >
                  {opt.label}
                </Pill>
              ))}
            </div>
          </section>

          {/* Optimization goal */}
          <section className="flex flex-col gap-2.5">
            <SectionLabel>Optimization Goal</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.map((opt) => (
                <Pill
                  key={opt.value}
                  active={draft.optimizationGoals.includes(opt.value)}
                  onClick={() => toggleGoal(opt.value)}
                >
                  {opt.label}
                </Pill>
              ))}
            </div>
          </section>

          {/* Gender */}
          <section className="flex flex-col gap-2.5">
            <SectionLabel>Gender</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {GENDER_OPTIONS.map((opt) => (
                <Pill
                  key={opt.value}
                  active={draft.genders.includes(opt.value)}
                  onClick={() => toggleGender(opt.value)}
                >
                  {opt.label}
                </Pill>
              ))}
            </div>
          </section>

          {/* Advantage+ Audience toggle */}
          <section className="flex flex-col gap-2.5">
            <SectionLabel>Audience Type</SectionLabel>
            <div className="flex items-center justify-between py-2 px-3 rounded-xl border border-[#e7e5dc] dark:border-[#2a2a2a] bg-[#FAFAF7] dark:bg-[#18181B]">
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-medium text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]">
                  Advantage+ Audience only
                </span>
                <span className="font-mono text-[11px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
                  Show templates with Adv+ Audience enabled
                </span>
              </div>
              <Switch
                checked={draft.hasAdvantageAudience}
                onCheckedChange={(checked) =>
                  setDraft((d) => ({ ...d, hasAdvantageAudience: checked }))
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
            Apply{activeCount > 0 ? ` · ${activeCount}` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TemplateFilterModal;
